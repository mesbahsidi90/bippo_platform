alter table public.shop_settings
  add column customer_options jsonb not null default '{}'::jsonb
    check (jsonb_typeof(customer_options) = 'object' and length(customer_options::text) <= 16000),
  add column customer_background_image text not null default ''
    check (customer_background_image = '' or (
      length(customer_background_image) <= 180000
      and customer_background_image ~ '^data:image/webp;base64,[A-Za-z0-9+/]+={0,2}$'
    ));

create or replace function customer_design_private.lookup(ticket uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'customer_theme', s.customer_theme,
    'banner_text', s.banner_text,
    'banner_image', s.banner_image,
    'customer_options', s.customer_options,
    'customer_background_image', s.customer_background_image
  )
  from public.orders o
  join public.shop_settings s on s.shop_id = o.shop_id
  where o.token = ticket and o.created_at > now() - interval '24 hours';
$$;
