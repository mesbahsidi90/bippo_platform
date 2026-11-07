# Merchant signup

Route: #signup. Landing navigation, final CTA and login now link to it. Email/password signup uses Supabase Auth; production Confirm email is disabled as requested, so signup returns a session without an email-confirmation step. Password recovery still uses email. Existing accounts and passwords are unchanged.

After signup, create_my_shop provisions one shop, membership, public profile and active subscription on the oldest active zero-price plan. No paid plan, administrator role or other user's identifier can be supplied. A per-user transaction lock and existing membership check make retries idempotent. If provisioning fails, the session is retained and the same form retries provisioning without another signup.

Database migration: supabase/merchant_signup.sql. The audit administrator gate remains. Only three INSERT events for the exact current transaction, current user and new shop can use a private scope row written by the constrained RPC; clients have no scope-table permissions, and the row is removed before commit. Existing shop/admin write RLS policies were not changed.

Validation: production build and 23 existing tests pass. A rollback-only database test provisions a fresh non-admin user, repeats provisioning, and verifies exactly one shop/membership/subscription/profile is visible, admin=false, can_operate=true. Anonymous provisioning and client scope access are denied. No real signup test account was retained. Browser form and provider configuration reviewed.

Auth setup for fresh projects: Authentication > Sign In / Providers > Allow new users to sign up ON; Confirm email OFF; Email provider ON. Apply setup/admin/shop_settings migrations before merchant_signup.sql. At least one active plan with monthly_price=0 is required; otherwise signup provisioning returns a clear unavailable message. Signed-in users without a shop can complete setup at #signup.
