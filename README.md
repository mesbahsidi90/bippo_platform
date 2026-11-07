# bippo platform

Arabic RTL restaurant order calling MVP built with React, Vite, Tailwind and Supabase.

Production: https://bippo-platform.mesbahzin89.workers.dev

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

Cloudflare Workers static assets serves `dist/`. Current deployment was uploaded from the dashboard. GitHub pushes do not automatically deploy yet. Future authenticated CLI deployment: build, then use Wrangler with `wrangler.jsonc`, or upload `dist/` through the Cloudflare dashboard.

Supabase project: `kdvtqlqiervznhzbpjcx`. Initial schema `supabase/setup.sql` has already been applied to production. Do not rerun it on the live database. Staff accounts must be added to `memberships` by an administrator; public signup does not grant access. Each staff account belongs to one shop.

Invitation emails redirect to `/?setup=1` to let the account owner set their own password. Never commit passwords or private keys.

## Data protection

All application tables use RLS. Staff can insert only order numbers and update only order status. Anonymous visitors cannot list orders. Limited token-based RPCs expose only one ticket's public status, or active order numbers for a display. These two explicitly public bearer-token functions intentionally use SECURITY DEFINER and are flagged by the database advisor; they use fixed queries, empty search_path, limited output and 24-hour ticket validity.

Customer and display pages refresh every two seconds; the staff dashboard also uses Supabase Realtime. QR links use non-enumerable UUIDs. Lock-screen push notifications, payments and POS integrations are outside this MVP.

## Design

bippo uses a teal, mint and apricot palette with Algerian Arabic copy. The how-it-works section pins a single phone visual while text steps scroll and change its state. Reduced-motion preferences are respected.
