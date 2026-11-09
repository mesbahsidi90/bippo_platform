alter table public.shops add column parent_shop_id uuid references public.shops(id);
create index shops_parent_idx on public.shops(parent_shop_id);

create schema merchant_workspace_private;
revoke all on schema merchant_workspace_private from public;
grant usage on schema merchant_workspace_private to authenticated, service_role;

create table merchant_workspace_private.owners (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade
);
create table merchant_workspace_private.invites (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  label text not null check (length(label) between 1 and 80),
  token_hash bytea not null unique,
  expires_at timestamptz not null default now() + interval '48 hours',
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz
);
create index merchant_invites_shop_idx on merchant_workspace_private.invites(shop_id);
create unique index merchant_invites_active_user on merchant_workspace_private.invites(accepted_by)
  where accepted_by is not null and revoked_at is null;
alter table merchant_workspace_private.owners enable row level security;
alter table merchant_workspace_private.invites enable row level security;
revoke all on all tables in schema merchant_workspace_private from public, anon, authenticated;

-- Legacy shops with a single member have an unambiguous manager.
insert into merchant_workspace_private.owners(shop_id, user_id)
select shop_id, min(user_id::text)::uuid from public.memberships group by shop_id having count(*) = 1;

create function merchant_workspace_private.register_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from private.shop_signup_scope
    where tx = txid_current() and actor = new.user_id and shop = new.shop_id
  ) then
    insert into merchant_workspace_private.owners values(new.shop_id, new.user_id)
    on conflict (shop_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function merchant_workspace_private.register_owner() from public;
create trigger merchant_register_owner after insert on public.memberships
for each row execute function merchant_workspace_private.register_owner();

create function merchant_workspace_private.access_for(actor uuid, target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select actor is not null and target is not null and (
    exists(select 1 from public.memberships where user_id = actor and shop_id = target)
    or exists (
      select 1 from public.shops s
      join merchant_workspace_private.owners o on o.shop_id = s.parent_shop_id
      join public.memberships m on m.shop_id = o.shop_id and m.user_id = o.user_id
      where s.id = target and o.user_id = actor
    )
    or exists (
      select 1 from merchant_workspace_private.invites i
      where i.shop_id = target and i.accepted_by = actor and i.revoked_at is null
    )
  );
$$;
revoke all on function merchant_workspace_private.access_for(uuid, uuid) from public;
grant execute on function merchant_workspace_private.access_for(uuid, uuid) to service_role;

create function public.merchant_order_access(actor uuid, target uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select merchant_workspace_private.access_for(actor, target);
$$;
revoke all on function public.merchant_order_access(uuid, uuid) from public, anon, authenticated;
grant execute on function public.merchant_order_access(uuid, uuid) to service_role;

create function merchant_workspace_private.active_shop()
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  preferred text := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb->>'x-client-info';
  target uuid;
begin
  if actor is null then return null; end if;
  if preferred ~ '^bippo-branch/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' then
    target := substring(preferred from 14)::uuid;
    if merchant_workspace_private.access_for(actor, target) then return target; end if;
    return null;
  end if;
  return coalesce(
    (select shop_id from public.memberships where user_id = actor),
    (select shop_id from merchant_workspace_private.invites where accepted_by = actor and revoked_at is null)
  );
end;
$$;
revoke all on function merchant_workspace_private.active_shop() from public;
grant execute on function merchant_workspace_private.active_shop() to authenticated;

create or replace function public.current_shop_id()
returns uuid language sql stable security invoker set search_path = '' as $$
  select merchant_workspace_private.active_shop();
$$;

alter policy own_shop on public.shops using(id = (select public.current_shop_id()));
alter policy own_orders on public.orders using(shop_id = (select public.current_shop_id()));
alter policy update_orders on public.orders
  using(shop_id = (select public.current_shop_id()))
  with check(shop_id = (select public.current_shop_id()));

create function public.merchant_billing_shop()
returns uuid language sql stable security invoker set search_path = '' as $$
  select shop_id from public.memberships where user_id = (select auth.uid());
$$;
revoke all on function public.merchant_billing_shop() from public;
grant execute on function public.merchant_billing_shop() to authenticated;
alter policy own_subscription on public.subscriptions using(shop_id = (select public.merchant_billing_shop()));
alter policy merchant_read_assigned_plan on public.plans using (
  exists(select 1 from public.subscriptions s where s.plan_id = plans.id and s.shop_id = (select public.merchant_billing_shop()))
);
create function merchant_workspace_private.can_edit_settings(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.shops s
    join public.memberships m on m.user_id = auth.uid()
    left join merchant_workspace_private.owners o on o.shop_id = s.parent_shop_id and o.user_id = m.user_id
    where s.id = target and (m.shop_id = s.id or (m.shop_id = s.parent_shop_id and o.user_id is not null))
  );
$$;
revoke all on function merchant_workspace_private.can_edit_settings(uuid) from public;
grant execute on function merchant_workspace_private.can_edit_settings(uuid) to authenticated;
alter policy shop_settings_insert on public.shop_settings
  with check(shop_id = (select public.current_shop_id()) and merchant_workspace_private.can_edit_settings(shop_id));
alter policy shop_settings_update on public.shop_settings
  using(shop_id = (select public.current_shop_id()) and merchant_workspace_private.can_edit_settings(shop_id))
  with check(shop_id = (select public.current_shop_id()) and merchant_workspace_private.can_edit_settings(shop_id));

create function merchant_workspace_private.can_operate(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and target = merchant_workspace_private.active_shop()
    and exists (
      select 1 from public.shops s
      join public.shops root on root.id = coalesce(s.parent_shop_id, s.id)
      join public.subscriptions sub on sub.shop_id = root.id
      where s.id = target and s.status = 'active' and root.status = 'active'
        and sub.status in ('active','trial') and (sub.period_end is null or sub.period_end > now())
    );
$$;
revoke all on function merchant_workspace_private.can_operate(uuid) from public;
grant execute on function merchant_workspace_private.can_operate(uuid) to authenticated;
create or replace function public.shop_can_operate(target uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select merchant_workspace_private.can_operate(target);
$$;

create function merchant_workspace_private.manage(
  operation text, target uuid, name text, invite uuid
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  home uuid;
  manager boolean;
  active uuid;
  secret uuid;
  new_id uuid;
begin
  if actor is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select shop_id into home from public.memberships where user_id = actor;
  manager := exists(select 1 from merchant_workspace_private.owners where shop_id = home and user_id = actor);

  if operation = 'accept' then
    perform pg_advisory_xact_lock(hashtextextended(actor::text, 741));
    if invite is null or exists(select 1 from public.memberships where user_id = actor)
      then raise exception 'Invitation unavailable' using errcode = '42501'; end if;
    select shop_id into new_id from merchant_workspace_private.invites
      where token_hash = sha256(uuid_send(invite)) and accepted_by = actor and revoked_at is null;
    if new_id is not null then return jsonb_build_object('shop_id', new_id); end if;
    update merchant_workspace_private.invites i
      set accepted_by = actor, accepted_at = now()
      from public.shops s, public.shops root
      where i.token_hash = sha256(uuid_send(invite)) and i.accepted_at is null
        and i.revoked_at is null and i.expires_at > now()
        and s.id = i.shop_id and root.id = coalesce(s.parent_shop_id, s.id)
        and s.status = 'active' and root.status = 'active'
      returning i.shop_id into new_id;
    if new_id is null then raise exception 'Invitation unavailable' using errcode = '42501'; end if;
    return jsonb_build_object('shop_id', new_id);
  end if;

  if operation = 'list' then
    active := merchant_workspace_private.active_shop();
    return jsonb_build_object(
      'manager', manager, 'staff', active is not null and not merchant_workspace_private.can_edit_settings(active),
      'home', home, 'active', active,
      'branches', coalesce((
        select jsonb_agg(jsonb_build_object('id', s.id, 'name', coalesce(ss.name, s.name),
          'city', coalesce(ss.city, s.city), 'status', s.status) order by s.parent_shop_id nulls first, s.created_at, s.id)
        from public.shops s left join public.shop_settings ss on ss.shop_id = s.id
        where s.id = coalesce(home, active) or (manager and s.parent_shop_id = home)
      ), '[]'::jsonb),
      'team', coalesce((
        select jsonb_agg(jsonb_build_object('id', i.id, 'shop_id', i.shop_id, 'label', i.label,
          'accepted', i.accepted_at is not null, 'expires_at', i.expires_at) order by i.expires_at desc)
        from merchant_workspace_private.invites i join public.shops s on s.id = i.shop_id
        where manager and i.revoked_at is null and coalesce(s.parent_shop_id, s.id) = home
      ), '[]'::jsonb)
    );
  end if;

  if not manager then raise exception 'Manager access required' using errcode = '42501'; end if;
  if operation = 'create_branch' then
    if name is null or length(trim(name)) not between 1 and 100 then raise exception 'Invalid branch name'; end if;
    perform pg_advisory_xact_lock(hashtextextended(home::text, 829));
    new_id := gen_random_uuid();
    insert into private.shop_signup_scope(tx, actor, shop) values(txid_current(), actor, new_id);
    insert into public.shops(id, name, kind, city, parent_shop_id)
      select new_id, trim(manage.name), s.kind, s.city, s.id from public.shops s where s.id = home;
    insert into public.shop_settings(shop_id, name, city, tracking_mode)
      select new_id, trim(manage.name), s.city, case when s.kind in ('cafe','restaurant','food_court') then 'order' else 'counter' end
      from public.shops s where s.id = home;
    delete from private.shop_signup_scope where tx = txid_current();
    return jsonb_build_object('shop_id', new_id);
  end if;
  if operation = 'invite' then
    if name is null or length(trim(name)) not between 1 and 80 then raise exception 'Invalid staff label'; end if;
    if not exists(select 1 from public.shops s where s.id = target and coalesce(s.parent_shop_id, s.id) = home and s.status = 'active')
      then raise exception 'Branch unavailable' using errcode = '42501'; end if;
    secret := gen_random_uuid();
    insert into merchant_workspace_private.invites(shop_id, label, token_hash)
      values(target, trim(name), sha256(uuid_send(secret)));
    return jsonb_build_object('token', secret);
  end if;
  if operation = 'revoke' then
    update merchant_workspace_private.invites i set revoked_at = now()
      from public.shops s where i.id = target and i.revoked_at is null and s.id = i.shop_id
        and coalesce(s.parent_shop_id, s.id) = home;
    return '{}'::jsonb;
  end if;
  raise exception 'Unknown operation' using errcode = '22023';
end;
$$;
revoke all on function merchant_workspace_private.manage(text, uuid, text, uuid) from public;
grant execute on function merchant_workspace_private.manage(text, uuid, text, uuid) to authenticated;

create function public.merchant_workspace(operation text, target uuid default null, name text default null, invite uuid default null)
returns jsonb language sql security invoker set search_path = '' as $$
  select merchant_workspace_private.manage(operation, target, name, invite);
$$;
revoke all on function public.merchant_workspace(text, uuid, text, uuid) from public, anon;
grant execute on function public.merchant_workspace(text, uuid, text, uuid) to authenticated;
