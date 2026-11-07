create table public.shop_settings (
 shop_id uuid primary key references public.shops(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 100),
 city text not null default '' check(length(city)<=100),
 address text not null default '' check(length(address)<=200),
 pickup_message text not null default 'تقدر تجي تديه من الكونتوار.' check(length(trim(pickup_message)) between 1 and 180),
 logo text not null default '' check(logo='' or (length(logo)<=150000 and logo ~ '^data:image/webp;base64,[A-Za-z0-9+/=]+$'))
);
alter table public.shop_settings enable row level security;
revoke all on public.shop_settings from anon,authenticated;
grant select,insert,update on public.shop_settings to authenticated;
create policy shop_settings_read on public.shop_settings for select to authenticated using(shop_id=(select public.current_shop_id()));
create policy shop_settings_insert on public.shop_settings for insert to authenticated with check(shop_id=(select public.current_shop_id()));
create policy shop_settings_update on public.shop_settings for update to authenticated using(shop_id=(select public.current_shop_id())) with check(shop_id=(select public.current_shop_id()));
-- Narrow bearer-ticket read: branding only, never membership, account or display tokens.
create function public.ticket_branding(ticket uuid) returns table(name text,city text,address text,pickup_message text,logo text)
language sql stable security definer set search_path='' as $$
 select coalesce(s.name,h.name),coalesce(s.city,h.city,''),coalesce(s.address,''),coalesce(s.pickup_message,'تقدر تجي تديه من الكونتوار.'),coalesce(s.logo,'')
 from public.orders o join public.shops h on h.id=o.shop_id left join public.shop_settings s on s.shop_id=h.id
 where o.token=ticket and o.created_at>now()-interval '24 hours' limit 1;
$$;
revoke all on function public.ticket_branding(uuid) from public;
grant execute on function public.ticket_branding(uuid) to anon,authenticated;
