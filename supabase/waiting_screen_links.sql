create table merchant_workspace_private.display_links (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  token uuid not null unique default gen_random_uuid()
);
alter table merchant_workspace_private.display_links enable row level security;
revoke all on merchant_workspace_private.display_links from public, anon, authenticated;

create function merchant_workspace_private.waiting_screen_link(rotate boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  branch uuid := merchant_workspace_private.active_shop();
  result uuid;
begin
  if auth.uid() is null or branch is null then
    raise exception 'Branch access required' using errcode = '42501';
  end if;
  if rotate then
    if not merchant_workspace_private.can_edit_settings(branch) then
      raise exception 'Manager access required' using errcode = '42501';
    end if;
    insert into merchant_workspace_private.display_links(shop_id) values(branch)
    on conflict (shop_id) do update set token = gen_random_uuid()
    returning token into result;
  else
    select coalesce(d.token,s.display_token) into result
    from public.shops s left join merchant_workspace_private.display_links d on d.shop_id=s.id
    where s.id=branch;
  end if;
  return result;
end;
$$;
revoke all on function merchant_workspace_private.waiting_screen_link(boolean) from public;
grant execute on function merchant_workspace_private.waiting_screen_link(boolean) to authenticated;

create function public.waiting_screen_link(rotate boolean default false)
returns uuid language sql security invoker set search_path = '' as $$
  select merchant_workspace_private.waiting_screen_link(rotate);
$$;
revoke all on function public.waiting_screen_link(boolean) from public, anon;
grant execute on function public.waiting_screen_link(boolean) to authenticated;

create or replace function public.display_orders(ticket uuid)
returns table(number text,status text)
language sql stable security definer set search_path = '' as $$
  with branch as (
    select d.shop_id as id from merchant_workspace_private.display_links d where d.token=ticket
    union
    select s.id from public.shops s where s.display_token=ticket
      and not exists(select 1 from merchant_workspace_private.display_links d where d.shop_id=s.id)
  )
  select o.number,o.status from branch b join public.orders o on o.shop_id=b.id
  where o.status<>'collected' and o.created_at>now()-interval '24 hours'
  order by o.created_at limit 100;
$$;
