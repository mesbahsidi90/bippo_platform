-- A private transaction-scoped capability permits only the three signup inserts.
create table private.shop_signup_scope(tx bigint primary key, actor uuid not null, shop uuid not null);
alter table private.shop_signup_scope enable row level security;
revoke all on private.shop_signup_scope from public,anon,authenticated;
create or replace function private.audit_platform_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if not public.is_platform_admin() and not (
  tg_op='INSERT' and exists(select 1 from private.shop_signup_scope scope where scope.tx=txid_current() and scope.actor=auth.uid() and (
   (tg_table_name='shops' and to_jsonb(new)->>'id'=scope.shop::text) or
   (tg_table_name='memberships' and to_jsonb(new)->>'shop_id'=scope.shop::text and to_jsonb(new)->>'user_id'=scope.actor::text) or
   (tg_table_name='subscriptions' and to_jsonb(new)->>'shop_id'=scope.shop::text)
  ))
 ) then raise exception 'Admin access required' using errcode='42501'; end if;
 insert into public.admin_audit(actor_id,entity,entity_id,action) values(auth.uid(),tg_table_name,coalesce(to_jsonb(new)->>'id',to_jsonb(new)->>'shop_id',to_jsonb(new)->>'user_id',to_jsonb(old)->>'user_id'),tg_op);
 return coalesce(new,old);
end; $$;
create function public.create_my_shop(shop_name text,shop_kind text,shop_city text default '') returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result uuid; starter uuid;
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,741));
 select shop_id into result from public.memberships where user_id=actor;
 if result is not null then return result; end if;
 if length(trim(shop_name)) not between 1 and 100 or shop_kind not in ('cafe','restaurant','other') or length(shop_city)>100 or shop_name is null or shop_kind is null or shop_city is null then raise exception 'Invalid shop details' using errcode='22023'; end if;
 select id into starter from public.plans where active and monthly_price=0 order by created_at,id limit 1;
 if starter is null then raise exception 'التسجيل متوقف مؤقتًا، تواصل مع إدارة bippo.'; end if;
 result:=gen_random_uuid();
 insert into private.shop_signup_scope(tx,actor,shop) values(txid_current(),actor,result);
 insert into public.shops(id,name,kind,city,status) values(result,trim(shop_name),shop_kind,trim(shop_city),'active');
 insert into public.memberships(user_id,shop_id) values(actor,result);
 insert into public.subscriptions(shop_id,plan_id,status) values(result,starter,'active');
 insert into public.shop_settings(shop_id,name,city) values(result,trim(shop_name),trim(shop_city));
 delete from private.shop_signup_scope where tx=txid_current();
 return result;
end; $$;
revoke all on function public.create_my_shop(text,text,text) from public,anon;
grant execute on function public.create_my_shop(text,text,text) to authenticated;
