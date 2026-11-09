alter table public.shop_settings
  add column alert_tone text not null default 'pager'
    check (alert_tone in ('pager', 'marimba', 'crystal', 'classic')),
  add column alert_copy jsonb not null default '{}'::jsonb
    check (jsonb_typeof(alert_copy) = 'object' and length(alert_copy::text) <= 2000);

alter table public.push_subscriptions add column language text
  check (language in ('ar', 'fr'));

create or replace function customer_design_private.lookup(ticket uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'customer_theme', s.customer_theme,
    'banner_text', s.banner_text,
    'banner_image', s.banner_image,
    'customer_options', s.customer_options,
    'customer_background_image', s.customer_background_image,
    'alert_tone', s.alert_tone
  )
  from public.orders o
  join public.shop_settings s on s.shop_id = o.shop_id
  where o.token = ticket and o.created_at > now() - interval '24 hours';
$$;
