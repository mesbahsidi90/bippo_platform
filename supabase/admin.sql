-- Platform administration. Apply once after setup.sql.
create table public.platform_admins(user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon,authenticated;
grant select on public.platform_admins to authenticated;
create policy read_own_admin_role on public.platform_admins for select to authenticated using(user_id=(select auth.uid()));
create function public.is_platform_admin() returns boolean language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.platform_admins where user_id=(select auth.uid()));
$$;
revoke all on function public.is_platform_admin() from public,anon;
grant execute on function public.is_platform_admin() to authenticated;
alter table public.shops add column kind text not null default 'cafe' check(kind in ('cafe','restaurant','other')),
 add column city text not null default '' check(length(city)<=100),
 add column status text not null default 'active' check(status in ('active','suspended')),
 add column created_at timestamptz not null default now(),
 add constraint shop_name_length check(length(trim(name)) between 1 and 120);
create table public.plans(id uuid primary key default gen_random_uuid(),name text not null check(length(trim(name)) between 1 and 80),monthly_price numeric(12,2) check(monthly_price>=0),currency text not null default 'DZD' check(currency in ('DZD','EUR','USD')),active boolean not null default true,created_at timestamptz not null default now());
create table public.subscriptions(shop_id uuid primary key references public.shops(id) on delete cascade,plan_id uuid not null references public.plans(id),status text not null default 'active' check(status in ('trial','active','past_due','cancelled')),period_end timestamptz,updated_at timestamptz not null default now());
create table public.shop_notes(shop_id uuid primary key references public.shops(id) on delete cascade,notes text not null default '' check(length(notes)<=2000));
alter table public.shop_notes enable row level security;
revoke all on public.shop_notes from anon,authenticated;
grant select,insert,update on public.shop_notes to authenticated;
create policy admin_notes on public.shop_notes for all to authenticated using((select public.is_platform_admin())) with check((select public.is_platform_admin()));
create index subscriptions_plan on public.subscriptions(plan_id);
create index memberships_shop on public.memberships(shop_id);
create table public.admin_audit(id bigint generated always as identity primary key,actor_id uuid references auth.users(id) on delete set null,entity text not null,entity_id text not null,action text not null,created_at timestamptz not null default now());
create index admin_audit_created on public.admin_audit(created_at desc);
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.admin_audit enable row level security;
revoke all on public.plans,public.subscriptions,public.admin_audit from anon,authenticated;
grant select,insert,update on public.plans,public.subscriptions to authenticated;
grant select on public.admin_audit to authenticated;
grant insert(name,kind,city,status),update(name,kind,city,status) on public.shops to authenticated;
grant insert(user_id,shop_id),update(shop_id),delete on public.memberships to authenticated;
create policy admin_shops_read on public.shops for select to authenticated using((select public.is_platform_admin()));
create policy admin_shops_insert on public.shops for insert to authenticated with check((select public.is_platform_admin()));
create policy admin_shops_update on public.shops for update to authenticated using((select public.is_platform_admin())) with check((select public.is_platform_admin()));
create policy admin_plans on public.plans for all to authenticated using((select public.is_platform_admin())) with check((select public.is_platform_admin()));
create policy own_subscription on public.subscriptions for select to authenticated using(shop_id=(select public.current_shop_id()));
create policy admin_subscriptions on public.subscriptions for all to authenticated using((select public.is_platform_admin())) with check((select public.is_platform_admin()));
create policy admin_audit_read on public.admin_audit for select to authenticated using((select public.is_platform_admin()));
create policy admin_memberships on public.memberships for all to authenticated using((select public.is_platform_admin())) with check((select public.is_platform_admin()));
create policy admin_orders_read on public.orders for select to authenticated using((select public.is_platform_admin()));
-- Empty free starter plan; prices for paid plans are set by the platform owner.
with starter as (insert into public.plans(name,monthly_price) values ('البداية',0) returning id)
insert into public.subscriptions(shop_id,plan_id) select shops.id,starter.id from public.shops shops cross join starter;
create function public.shop_can_operate(target uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.shops s join public.subscriptions sub on sub.shop_id=s.id where s.id=target and s.status='active' and sub.status in ('active','trial') and (sub.period_end is null or sub.period_end>now()));
$$;
revoke all on function public.shop_can_operate(uuid) from public,anon;
grant execute on function public.shop_can_operate(uuid) to authenticated;
drop policy create_orders on public.orders;
create policy create_orders on public.orders for insert to authenticated with check(shop_id=(select public.current_shop_id()) and status='preparing' and public.shop_can_operate(shop_id));
-- Atomic shop + subscription save, obeying all table RLS policies.
create function public.admin_save_shop(shop uuid,shop_name text,shop_kind text,shop_city text,shop_status text,plan uuid,subscription_status text,ends_at timestamptz,internal_notes text) returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid;
begin
 if not public.is_platform_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if shop is null then
 insert into public.shops(name,kind,city,status) values(trim(shop_name),shop_kind,trim(shop_city),shop_status) returning id into result;
 else
 update public.shops set name=trim(shop_name),kind=shop_kind,city=trim(shop_city),status=shop_status where id=shop returning id into result;
 if result is null then raise exception 'Shop not found'; end if;
 end if;
 insert into public.subscriptions(shop_id,plan_id,status,period_end) values(result,plan,subscription_status,ends_at)
 on conflict(shop_id) do update set plan_id=excluded.plan_id,status=excluded.status,period_end=excluded.period_end,updated_at=now();
 insert into public.shop_notes(shop_id,notes) values(result,internal_notes) on conflict(shop_id) do update set notes=excluded.notes;
 return result;
end; $$;
revoke all on function public.admin_save_shop(uuid,text,text,text,text,uuid,text,timestamptz,text) from public,anon;
grant execute on function public.admin_save_shop(uuid,text,text,text,text,uuid,text,timestamptz,text) to authenticated;
-- Append-only audit: trigger function is private; clients cannot write audit rows.
create schema if not exists private;
create function private.audit_platform_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_platform_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 insert into public.admin_audit(actor_id,entity,entity_id,action) values(auth.uid(),tg_table_name,coalesce(to_jsonb(new)->>'id',to_jsonb(new)->>'shop_id',to_jsonb(new)->>'user_id',to_jsonb(old)->>'user_id'),tg_op);
 return coalesce(new,old);
end; $$;
revoke all on function private.audit_platform_change() from public,anon,authenticated;
create trigger audit_shops after insert or update on public.shops for each row execute function private.audit_platform_change();
create trigger audit_plans after insert or update on public.plans for each row execute function private.audit_platform_change();
create trigger audit_subscriptions after insert or update on public.subscriptions for each row execute function private.audit_platform_change();
create trigger audit_memberships after insert or update or delete on public.memberships for each row execute function private.audit_platform_change();

create trigger audit_shop_notes after insert or update on public.shop_notes for each row execute function private.audit_platform_change();

