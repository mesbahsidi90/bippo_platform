alter table public.shop_settings
  add column tracking_mode text not null default 'order'
  check (tracking_mode in ('order', 'counter'));

alter table public.orders
  add column tracking_code text not null
  default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  check (tracking_code ~ '^[0-9A-F]{12}$');

create unique index orders_shop_tracking_code
  on public.orders (shop_id, tracking_code);

create schema counter_qr_private;
revoke all on schema counter_qr_private from public;
grant usage on schema counter_qr_private to anon, authenticated;

-- This guest endpoint accepts a branch ID and requires the independent order
-- code before it can return a tracking token. It never enumerates orders.
create function counter_qr_private.lookup(branch uuid, code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when code is null then jsonb_build_object('name', s.name)
    else (
      select jsonb_build_object('token', o.token)
      from public.orders o
      where o.shop_id = s.shop_id
        and o.tracking_code = code
        and o.created_at > now() - interval '24 hours'
    )
  end
  from public.shop_settings s
  join public.shops h on h.id = s.shop_id
  where s.shop_id = branch
    and s.tracking_mode = 'counter'
    and h.status = 'active'
    and (code is null or code ~ '^[0-9A-F]{12}$');
$$;
revoke all on function counter_qr_private.lookup(uuid, text) from public;
grant execute on function counter_qr_private.lookup(uuid, text) to anon, authenticated;

create function public.counter_ticket(branch uuid, code text default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select counter_qr_private.lookup(branch, code);
$$;
revoke all on function public.counter_ticket(uuid, text) from public;
grant execute on function public.counter_ticket(uuid, text) to anon, authenticated;
