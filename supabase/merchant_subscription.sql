-- Merchants can read the plan attached to their own subscription.
-- Existing administrator policies still control all plan writes.
create policy merchant_read_assigned_plan on public.plans
for select to authenticated
using (
  exists (
    select 1 from public.subscriptions s
    where s.plan_id = plans.id
      and s.shop_id = (select public.current_shop_id())
  )
);
