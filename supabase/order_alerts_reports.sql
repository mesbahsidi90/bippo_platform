-- Apply after admin.sql. Existing timestamps remain unknown; do not fabricate history.
alter table public.orders add column ready_at timestamptz, add column collected_at timestamptz;
alter table public.orders add constraint order_ready_time_valid check(ready_at is null or ready_at>=created_at),
 add constraint order_collected_time_valid check(collected_at is null or (collected_at>=created_at and (ready_at is null or collected_at>=ready_at)));
create or replace function public.enforce_order_transition() returns trigger language plpgsql set search_path='' as $$
begin
 if not ((old.status='preparing' and new.status='ready') or (old.status='ready' and new.status='collected')) then raise exception 'Invalid order transition'; end if;
 if new.status='ready' then new.ready_at=clock_timestamp(); new.collected_at=null; end if;
 if new.status='collected' then new.collected_at=clock_timestamp(); end if;
 return new;
end; $$;
revoke all on function public.enforce_order_transition() from public,anon,authenticated;
create function public.order_report(from_date timestamptz,to_date timestamptz,timezone_name text default 'Africa/Algiers') returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare shop uuid; result jsonb;
begin
 shop=public.current_shop_id();
 if auth.uid() is null or shop is null then raise exception 'Shop access required' using errcode='42501'; end if;
 if from_date is null or to_date is null or to_date<=from_date or to_date-from_date>interval '366 days' then raise exception 'Invalid report period'; end if;
 if timezone_name not in ('Africa/Algiers','Europe/Istanbul','UTC') then raise exception 'Invalid timezone'; end if;
 with cohort as (select * from public.orders where shop_id=shop and created_at>=from_date and created_at<to_date),
 totals as(select count(*) as total,count(*) filter(where status='collected') as collected,count(*) filter(where status='preparing') as preparing,count(*) filter(where status='ready') as ready,
 count(ready_at) as prep_samples,count(collected_at) filter(where ready_at is not null) as wait_samples,
 avg(extract(epoch from(ready_at-created_at))) as avg_prep_seconds,
 avg(extract(epoch from(collected_at-ready_at))) as avg_wait_seconds from cohort),
 hours as(select extract(hour from created_at at time zone timezone_name)::int as hour,count(*) as count from cohort group by 1),
 days as(select to_char(created_at at time zone timezone_name,'YYYY-MM-DD') as day,count(*) as count from cohort group by 1)
 select jsonb_build_object('totals',(select to_jsonb(totals) from totals),'hours',coalesce((select jsonb_agg(to_jsonb(hours) order by hour) from hours),'[]'::jsonb),'days',coalesce((select jsonb_agg(to_jsonb(days) order by day) from days),'[]'::jsonb)) into result;
 return result;
end; $$;
revoke all on function public.order_report(timestamptz,timestamptz,text) from public,anon;
grant execute on function public.order_report(timestamptz,timestamptz,text) to authenticated;

-- Background Web Push. Subscription endpoints and signing secrets are never client-readable.
create schema if not exists private;
create table private.bippo_push_config(id boolean primary key default true check(id),public_key text not null,private_key text not null,webhook_secret text not null,subject text not null);
revoke all on private.bippo_push_config from public,anon,authenticated;
create table public.push_subscriptions(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id) on delete cascade,endpoint text not null,p256dh text not null,auth_key text not null,created_at timestamptz not null default now(),sent_at timestamptz,unique(order_id,endpoint));
create index push_subscriptions_order on public.push_subscriptions(order_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from public,anon,authenticated;
grant select,insert,update,delete on public.push_subscriptions to service_role;
create function public.bippo_push_config(config jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Server access only' using errcode='42501'; end if;
 if config is not null then
 insert into private.bippo_push_config(id,public_key,private_key,webhook_secret,subject) values(true,config->>'public_key',config->>'private_key',config->>'webhook_secret',config->>'subject') on conflict(id) do nothing;
 end if;
 select to_jsonb(c)-'id' into result from private.bippo_push_config c where id=true;
 return result;
end; $$;
revoke all on function public.bippo_push_config(jsonb) from public,anon,authenticated;
grant execute on function public.bippo_push_config(jsonb) to service_role;
create extension if not exists pg_net with schema extensions;
create function private.queue_order_ready_push() returns trigger language plpgsql security definer set search_path='' as $$
declare secret text;
begin
 if new.status='ready' and old.status='preparing' and exists(select 1 from public.push_subscriptions where order_id=new.id) then
 select webhook_secret into secret from private.bippo_push_config where id=true;
 if secret is not null then
 perform net.http_post(url:='https://kdvtqlqiervznhzbpjcx.supabase.co/functions/v1/order-alerts/notify',headers:=jsonb_build_object('Content-Type','application/json','x-bippo-webhook',secret),body:=jsonb_build_object('order_id',new.id),timeout_milliseconds:=10000);
 end if;
 end if;
 return new;
end; $$;
revoke all on function private.queue_order_ready_push() from public,anon,authenticated;
create trigger order_ready_push after update of status on public.orders for each row execute function private.queue_order_ready_push();

