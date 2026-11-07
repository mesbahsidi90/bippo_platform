-- Disposable public demos are separate from restaurant orders and reporting.
create table public.demo_tickets(
 token uuid primary key default gen_random_uuid(),control_hash text not null,source_hash text not null,
 number text not null,created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '15 minutes',
 status text not null default 'preparing' check(status in ('preparing','ready')),
 scheduled_at timestamptz,ready_at timestamptz,opened_at timestamptz,sound_at timestamptz,armed_at timestamptz,acknowledged_at timestamptz
);
create index demo_tickets_source_created on public.demo_tickets(source_hash,created_at);
create index demo_tickets_due on public.demo_tickets(scheduled_at) where status='preparing' and scheduled_at is not null;
create table public.demo_push_subscriptions(
 id uuid primary key default gen_random_uuid(),ticket uuid not null references public.demo_tickets(token) on delete cascade,
 endpoint text not null,p256dh text not null,auth_key text not null,created_at timestamptz not null default now(),sent_at timestamptz,
 unique(ticket,endpoint)
);
alter table public.demo_tickets enable row level security;
alter table public.demo_push_subscriptions enable row level security;
revoke all on public.demo_tickets,public.demo_push_subscriptions from public,anon,authenticated;
grant select,insert,update,delete on public.demo_tickets,public.demo_push_subscriptions to service_role;
create function public.issue_bippo_demo(secret_hash text,client_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Server only' using errcode='42501'; end if;
 if length(secret_hash)<>64 or length(client_hash)<>64 then raise exception 'Invalid input'; end if;
 perform pg_advisory_xact_lock(7611042);
 if (select count(*) from public.demo_tickets where source_hash=client_hash and created_at>now()-interval '10 minutes')>=10 or
 (select count(*) from public.demo_tickets where created_at>now()-interval '10 minutes')>=300 then raise exception 'Demo rate limit' using errcode='P0001'; end if;
 insert into public.demo_tickets(control_hash,source_hash,number) values(secret_hash,client_hash,(floor(random()*90)+10)::int::text)
 returning jsonb_build_object('token',token,'number',number,'expires_at',expires_at) into result;
 return result;
end;$$;
revoke all on function public.issue_bippo_demo(text,text) from public,anon,authenticated;
grant execute on function public.issue_bippo_demo(text,text) to service_role;
create function public.ring_bippo_demo(ticket_id uuid,secret_hash text,delay_seconds int default 0) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Server only' using errcode='42501'; end if;
 if delay_seconds not in (0,10) then raise exception 'Invalid delay'; end if;
 update public.demo_tickets set scheduled_at=case when delay_seconds=10 then now()+interval '10 seconds' else null end,
 status=case when delay_seconds=0 then 'ready' else status end,ready_at=case when delay_seconds=0 then now() else ready_at end
 where token=ticket_id and control_hash=secret_hash and expires_at>now() and status='preparing' and scheduled_at is null;
 return found;
end;$$;
revoke all on function public.ring_bippo_demo(uuid,text,int) from public,anon,authenticated;
grant execute on function public.ring_bippo_demo(uuid,text,int) to service_role;
create function public.subscribe_bippo_demo(ticket_id uuid,address text,key_p256dh text,key_auth text) returns void language plpgsql security invoker set search_path='' as $$
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Server only' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(ticket_id::text,7611042));
 if not exists(select 1 from public.demo_tickets where token=ticket_id and expires_at>now()) then raise exception 'Demo expired'; end if;
 if exists(select 1 from public.demo_push_subscriptions where ticket=ticket_id and endpoint=address) then return;end if;
 if (select count(*) from public.demo_push_subscriptions where ticket=ticket_id)>=3 then raise exception 'Device limit reached';end if;
 insert into public.demo_push_subscriptions(ticket,endpoint,p256dh,auth_key) values(ticket_id,address,key_p256dh,key_auth);
end;$$;
revoke all on function public.subscribe_bippo_demo(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.subscribe_bippo_demo(uuid,text,text,text) to service_role;
create function private.queue_demo_push() returns trigger language plpgsql security definer set search_path='' as $$
declare secret text;
begin
 if old.status='preparing' and new.status='ready' and exists(select 1 from public.demo_push_subscriptions where ticket=new.token) then
 select webhook_secret into secret from private.bippo_push_config where id=true;
 if secret is not null then perform net.http_post(
 url:='https://kdvtqlqiervznhzbpjcx.supabase.co/functions/v1/order-alerts/demo-notify',
 headers:=jsonb_build_object('Content-Type','application/json','x-bippo-webhook',secret),body:=jsonb_build_object('ticket',new.token),timeout_milliseconds:=10000);end if;
 end if;return new;
end;$$;
revoke all on function private.queue_demo_push() from public,anon,authenticated;
create trigger demo_ready_push after update of status on public.demo_tickets for each row execute function private.queue_demo_push();
create function private.run_bippo_demo_queue() returns void language plpgsql security definer set search_path='' as $$
begin
 update public.demo_tickets set status='ready',ready_at=clock_timestamp(),scheduled_at=null where status='preparing' and scheduled_at<=now() and expires_at>now();
 -- Only expired disposable demos; restaurant orders are never affected.
 delete from public.demo_tickets where expires_at<now()-interval '1 day';
end;$$;
revoke all on function private.run_bippo_demo_queue() from public,anon,authenticated;
create extension if not exists pg_cron;
select cron.schedule('bippo-demo-queue','10 seconds','select private.run_bippo_demo_queue()');
select cron.schedule('bippo-demo-job-log-cleanup','17 3 * * *', $job$delete from cron.job_run_details where jobid in (select jobid from cron.job where jobname in ('bippo-demo-queue','bippo-demo-job-log-cleanup')) and end_time<now()-interval '7 days'$job$);
