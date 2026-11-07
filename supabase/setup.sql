-- Run once in a NEW Supabase project. No existing projects are modified by this deliverable.
create table public.shops (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 display_token uuid not null unique default gen_random_uuid()
);
create table public.memberships (
 user_id uuid primary key references auth.users(id) on delete cascade,
 shop_id uuid not null references public.shops(id) on delete cascade
);
create function public.current_shop_id() returns uuid language sql stable security invoker set search_path='' as '
 select shop_id from public.memberships where user_id=(select auth.uid());
';
revoke all on function public.current_shop_id() from public;
grant execute on function public.current_shop_id() to authenticated;
create table public.orders (
 id uuid primary key default gen_random_uuid(),
 shop_id uuid not null default public.current_shop_id() references public.shops(id),
 number text not null check (number ~ '^[1-9][0-9]{0,3}$'),
 status text not null default 'preparing' check (status in ('preparing','ready','collected')),
 token uuid not null unique default gen_random_uuid(),
 created_at timestamptz not null default now()
);
create unique index orders_active_number on public.orders(shop_id,number) where status <> 'collected';
create index orders_shop_date on public.orders(shop_id,created_at desc);
alter table public.shops enable row level security;
alter table public.memberships enable row level security;
alter table public.orders enable row level security;
revoke all on public.shops,public.memberships,public.orders from anon,authenticated;
grant select on public.memberships,public.shops,public.orders to authenticated;
grant insert(number),update(status) on public.orders to authenticated;
create policy own_membership on public.memberships for select to authenticated using(user_id=(select auth.uid()));
create policy own_shop on public.shops for select to authenticated using(id=(select shop_id from public.memberships where user_id=(select auth.uid())));
create policy own_orders on public.orders for select to authenticated using(shop_id=(select shop_id from public.memberships where user_id=(select auth.uid())));
create policy create_orders on public.orders for insert to authenticated with check(shop_id=(select shop_id from public.memberships where user_id=(select auth.uid())) and status='preparing');
create policy update_orders on public.orders for update to authenticated using(shop_id=(select shop_id from public.memberships where user_id=(select auth.uid()))) with check(shop_id=(select shop_id from public.memberships where user_id=(select auth.uid())));
create function public.enforce_order_transition() returns trigger language plpgsql set search_path='' as $$
begin
 if not ((old.status='preparing' and new.status='ready') or (old.status='ready' and new.status='collected')) then
 raise exception 'Invalid order transition'; end if;
 return new;
end; $$;
create trigger order_transition before update of status on public.orders for each row execute function public.enforce_order_transition();
-- Deliberate bearer-capability endpoints: reveal only a single ticket's public fields
-- or a display's active numbers. UUID tokens cannot enumerate other shops/orders.
-- Definer is required because anonymous visitors have NO table SELECT permission.
-- No dynamic SQL, fixed search_path, explicit grants, bounded lifetime and result count.
create function public.track_order(ticket uuid)
returns table(number text,status text,created_at timestamptz)
language sql stable security definer set search_path='' as $$
 select o.number,o.status,o.created_at from public.orders o
 where o.token=ticket and o.created_at>now()-interval '24 hours' limit 1;
$$;
create function public.display_orders(ticket uuid)
returns table(number text,status text)
language sql stable security definer set search_path='' as $$
 select o.number,o.status from public.orders o join public.shops s on s.id=o.shop_id
 where s.display_token=ticket and o.status<>'collected' and o.created_at>now()-interval '24 hours'
 order by o.created_at limit 100;
$$;
revoke all on function public.track_order(uuid),public.display_orders(uuid),public.enforce_order_transition() from public;
grant execute on function public.track_order(uuid),public.display_orders(uuid) to anon,authenticated;
alter publication supabase_realtime add table public.orders;
-- Create users from Supabase Authentication dashboard, then provision shop/memberships:
-- insert into public.shops(name) values ('اسم المحل') returning id;
-- insert into public.memberships(user_id,shop_id) values ('AUTH_USER_UUID','SHOP_UUID');
-- Add every authorized staff user to memberships with the same shop_id.
-- Rotate a leaked display link: update public.shops set display_token=gen_random_uuid() where id='SHOP_UUID';

