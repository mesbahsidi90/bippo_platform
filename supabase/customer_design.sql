alter table public.shop_settings
  add column customer_theme text not null default 'classic'
    check (customer_theme in ('classic', 'lagoon', 'sand', 'plum')),
  add column banner_text text not null default ''
    check (length(banner_text) <= 160),
  add column banner_image text not null default ''
    check (banner_image = '' or (
      length(banner_image) <= 180000
      and banner_image ~ '^data:image/webp;base64,[A-Za-z0-9+/]+={0,2}$'
    ));

create schema customer_design_private;
revoke all on schema customer_design_private from public;
grant usage on schema customer_design_private to anon, authenticated;

-- Guest design is a narrow read authorized by the same unguessable ticket
-- and lifetime as track_order. No general settings table access is granted.
create function customer_design_private.lookup(ticket uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'customer_theme', s.customer_theme,
    'banner_text', s.banner_text,
    'banner_image', s.banner_image
  )
  from public.orders o
  join public.shop_settings s on s.shop_id = o.shop_id
  where o.token = ticket and o.created_at > now() - interval '24 hours';
$$;
revoke all on function customer_design_private.lookup(uuid) from public;
grant execute on function customer_design_private.lookup(uuid) to anon, authenticated;

create function public.ticket_design(ticket uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select customer_design_private.lookup(ticket);
$$;
revoke all on function public.ticket_design(uuid) from public;
grant execute on function public.ticket_design(uuid) to anon, authenticated;
