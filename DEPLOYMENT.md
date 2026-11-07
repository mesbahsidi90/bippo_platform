# Deployment record

- Cloudflare Pages project: `bippo-platform`.
- Public URL: https://bippo-platform.pages.dev
- Pages deployment confirmed successful in Cloudflare dashboard.
- Supabase project: `kdvtqlqiervznhzbpjcx` (`bippo platform`).
- Initial schema applied as migration `bippo_initial_schema`.
- Owner account invited and assigned to the initial shop. The account owner must open their invitation and choose their password; no password is stored in this repository.
- All three public application tables have RLS enabled.
- Verified authenticated order insertion with default shop resolution, preparation-to-ready transition, and anonymous token lookup of the matching ready order inside a rolled-back transaction.
- Verified anonymous table listing is denied and staff cannot update an order's shop_id.
- Security advisors flag the two intentionally anonymous token-based SECURITY DEFINER RPCs; their restricted output and purpose are documented in README.
- Production build and unit tests pass.
- Public homepage and cloud-mode login form successfully loaded in the browser at the Pages URL. Supabase Site URL updated to `https://bippo-platform.pages.dev/?setup=1`. Full signed-in browser workflow awaits owner activation.
- Deployment is currently a dashboard upload, not automatic deployment from GitHub pushes. `wrangler.jsonc` is included for future authenticated deployments.

- Requested `bippo.pages.dev` was not allocated (Cloudflare offered a suffixed hostname); the user selected `bippo-platform.pages.dev` instead. The previous Workers deployment is superseded.

## Administration release

- Published the protected console at `/#admin`.
- Applied `platform_administration` and `restrict_admin_function_access` migrations after explicit user approval.
- Assigned the designated owner admin role without exposing any credentials.
- Verified transactional shop/subscription/note creation; unauthorized read/write rejection; anonymous admin-RPC denial; blocked self-elevation; suspended/expired/cancelled subscription restrictions; continued updates for existing orders.
- Verified ordinary staff can still create orders and access only their own shop while admin notes and audit stay hidden.
- Five unit tests and the production build pass. All database verification writes were rolled back.
- Public admin login page successfully loaded on Cloudflare Pages. Owner password entry and signed-in browser walkthrough are left to the account owner; no password was accessed.
