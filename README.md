# bippo platform

Arabic RTL restaurant order calling MVP built with React, Vite, Tailwind and Supabase.

Production: https://bippo-platform.pages.dev

## Local development

Node.js 22.12+ or 24 is required.

```
npm ci
npm run dev
npm test
npm run build
```

The repository includes `.env.production` containing only the Supabase public URL and publishable key. Database RLS enforces access. No service-role key is used by the client. Local development runs the browser-only demo unless `.env.local` supplies Supabase settings. The local demo syncs tabs on the same browser origin, not separate devices.

## Production

Cloudflare Pages project `bippo-platform` serves `dist/`. Current deployment was uploaded from the dashboard. GitHub pushes do not automatically deploy yet. Future authenticated CLI deployment: run `npm run build` then `npx wrangler pages deploy dist --project-name bippo-platform`, or upload `dist/` through the Cloudflare Pages dashboard.

Supabase project: `kdvtqlqiervznhzbpjcx`. Initial schema `supabase/setup.sql` has already been applied to production. Do not rerun it on the live database. Staff accounts must be added to `memberships` by an administrator; public signup does not grant access. Each staff account belongs to one shop.

Invitation emails redirect to `/?setup=1` to let the account owner set their own password. Never commit passwords or private keys.

## Data protection

All application tables use RLS. Staff can insert only order numbers and update only order status. Anonymous visitors cannot list orders. Limited token-based RPCs expose only one ticket's public status, or active order numbers for a display. These two explicitly public bearer-token functions intentionally use SECURITY DEFINER and are flagged by the database advisor; they use fixed queries, empty search_path, limited output and 24-hour ticket validity.

Customer and display pages refresh every two seconds; the staff dashboard also uses Supabase Realtime. QR links use non-enumerable UUIDs. Lock-screen push notifications, payments and POS integrations are outside this MVP.

## Design

bippo uses a teal, mint and apricot palette with Algerian Arabic copy. The how-it-works section pins a single phone visual while text steps scroll and change its state. Reduced-motion preferences are respected.

## Platform administration

Live admin console: https://bippo-platform.pages.dev/#admin

The approved administration schema in `supabase/admin.sql` and explicit anonymous-function access restriction have been applied to production. The designated platform owner has been granted admin access. Sign in with the owner account; the staff dashboard shows an administration link only to authorized admins. Do not rerun the setup SQL on the live database.

The console manages shops, manual subscriptions, plans/prices, existing Auth-user memberships and append-only administrative audit. It does not collect payments or create Auth users. Internal shop notes have their own admin-only RLS table. Suspended shops and expired/cancelled/past-due subscriptions cannot create new orders; existing orders can still be completed. Browser users cannot grant themselves admin roles. See `ADMIN-REVIEW.md` for verification details.
