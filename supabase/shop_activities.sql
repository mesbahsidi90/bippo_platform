alter table public.shops
  drop constraint shops_kind_check,
  add constraint shops_kind_check check (kind in ('cafe','restaurant','other','food_court','laundry','car_wash','tailor'));

create or replace function public.create_my_shop(shop_name text,shop_kind text,shop_city text default '') returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result uuid; starter uuid;
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,741));
 select shop_id into result from public.memberships where user_id=actor;
 if result is not null then return result; end if;
 if length(trim(shop_name)) not between 1 and 100 or shop_kind not in ('cafe','restaurant','other','food_court','laundry','car_wash','tailor') or length(shop_city)>100 or shop_name is null or shop_kind is null or shop_city is null then raise exception 'Invalid shop details' using errcode='22023'; end if;
 select id into starter from public.plans where active and monthly_price=0 order by created_at,id limit 1;
 if starter is null then raise exception 'التسجيل متوقف مؤقتًا، تواصل مع إدارة bippo.'; end if;
 result:=gen_random_uuid();
 insert into private.shop_signup_scope(tx,actor,shop) values(txid_current(),actor,result);
 insert into public.shops(id,name,kind,city,status) values(result,trim(shop_name),shop_kind,trim(shop_city),'active');
 insert into public.memberships(user_id,shop_id) values(actor,result);
 insert into public.subscriptions(shop_id,plan_id,status) values(result,starter,'active');
 insert into public.shop_settings(shop_id,name,city,tracking_mode)
 values(result,trim(shop_name),trim(shop_city),case when shop_kind in ('cafe','restaurant','food_court') then 'order' else 'counter' end);
 delete from private.shop_signup_scope where tx=txid_current();
 return result;
end; $$;

create or replace function counter_qr_private.lookup(branch uuid, code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when code is null then jsonb_build_object('name', coalesce(s.name, h.name))
    else (
      select jsonb_build_object('token', o.token)
      from public.orders o
      where o.shop_id = h.id
        and o.tracking_code = code
        and o.created_at > now() - interval '24 hours'
    )
  end
  from public.shops h
  left join public.shop_settings s on s.shop_id = h.id
  where h.id = branch
    and coalesce(s.tracking_mode, case when h.kind in ('cafe','restaurant','food_court') then 'order' else 'counter' end) = 'counter'
    and h.status = 'active'
    and (code is null or code ~ '^[0-9A-F]{12}$');
$$;
