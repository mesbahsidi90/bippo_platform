-- Additive upgrade. The only guest write is a bounded event on a valid 24h bearer ticket.
alter table public.shop_settings add column google_review_url text not null default ''
 check (google_review_url='' or (length(google_review_url)<=2048 and google_review_url ~ '^https://(www\.google\.com|google\.com|maps\.google\.com|search\.google\.com|g\.page|maps\.app\.goo\.gl)/[^[:space:]\\]*$'));
create table public.order_guest_signals (
 order_id uuid primary key references public.orders(id) on delete cascade,
 shop_id uuid not null references public.shops(id) on delete cascade,
 opened_at timestamptz not null default now(),
 sound_enabled_at timestamptz, push_enabled_at timestamptz,
 ready_seen_at timestamptz, coming_at timestamptz,
 last_seen_at timestamptz not null default now()
);
create index order_guest_signals_shop on public.order_guest_signals(shop_id);
alter table public.order_guest_signals enable row level security;
revoke all on public.order_guest_signals from public,anon,authenticated;
grant select on public.order_guest_signals to authenticated;
create policy guest_signals_shop_read on public.order_guest_signals for select to authenticated
 using(shop_id=(select public.current_shop_id()));

-- Deliberate bearer-capability API, like track_order: guest has no table grants.
-- No arbitrary field, ID, timestamp or status supplied by callers. No order transition.
create function public.guest_order_signal(ticket uuid,event_name text) returns boolean
 language plpgsql security definer set search_path='' as $$
declare o record; t timestamptz:=clock_timestamp();
begin
 if ticket is null or event_name not in ('opened','heartbeat','sound_enabled','push_enabled','ready_seen','coming') then return false; end if;
 select id,shop_id,status into o from public.orders where token=ticket and created_at>now()-interval '24 hours';
 if not found or o.status='collected' then return false; end if;
 if event_name in ('ready_seen','coming') and o.status<>'ready' then return false; end if;
 if event_name='push_enabled' and not exists(select 1 from public.push_subscriptions where order_id=o.id) then return false; end if;
 insert into public.order_guest_signals as s(order_id,shop_id,opened_at,last_seen_at,sound_enabled_at,push_enabled_at,ready_seen_at,coming_at)
 values(o.id,o.shop_id,t,t,case when event_name='sound_enabled' then t end,case when event_name='push_enabled' then t end,case when event_name='ready_seen' then t end,case when event_name='coming' then t end)
 on conflict(order_id) do update set
 last_seen_at=case when s.last_seen_at<t-interval '30 seconds' then t else s.last_seen_at end,
 sound_enabled_at=coalesce(s.sound_enabled_at,excluded.sound_enabled_at),
 push_enabled_at=coalesce(s.push_enabled_at,excluded.push_enabled_at),
 ready_seen_at=coalesce(s.ready_seen_at,excluded.ready_seen_at),
 coming_at=coalesce(s.coming_at,excluded.coming_at)
 where s.last_seen_at<t-interval '30 seconds'
 or (s.sound_enabled_at is null and excluded.sound_enabled_at is not null)
 or (s.push_enabled_at is null and excluded.push_enabled_at is not null)
 or (s.ready_seen_at is null and excluded.ready_seen_at is not null)
 or (s.coming_at is null and excluded.coming_at is not null);
 return true;
end; $$;
revoke all on function public.guest_order_signal(uuid,text) from public,anon,authenticated;
grant execute on function public.guest_order_signal(uuid,text) to anon,authenticated;

-- Google link is exposed only after collection; no account/contact/subscription data.
create function public.guest_order_extras(ticket uuid) returns jsonb
 language sql stable security definer set search_path='' as $$
 select jsonb_build_object('coming_at',g.coming_at,'google_review_url',case when o.status='collected' then coalesce(s.google_review_url,'') else '' end)
 from public.orders o left join public.order_guest_signals g on g.order_id=o.id
 left join public.shop_settings s on s.shop_id=o.shop_id
 where o.token=ticket and o.created_at>now()-interval '24 hours' limit 1;
$$;
revoke all on function public.guest_order_extras(uuid) from public,anon,authenticated;
grant execute on function public.guest_order_extras(uuid) to anon,authenticated;
