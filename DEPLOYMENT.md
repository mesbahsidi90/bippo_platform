# Deployment record

- Cloudflare Workers application: `bippo-platform`.
- Public URL: https://bippo-platform.mesbahzin89.workers.dev
- Latest deployed version: `9c0b1ef0`, confirmed Ready at 100% in Cloudflare dashboard.
- Supabase project: `kdvtqlqiervznhzbpjcx` (`bippo platform`).
- Initial schema applied as migration `bippo_initial_schema`.
- Owner account invited and assigned to the initial shop. The account owner must open their invitation and choose their password; no password is stored in this repository.
- All three public application tables have RLS enabled.
- Verified authenticated order insertion with default shop resolution, preparation-to-ready transition, and anonymous token lookup of the matching ready order inside a rolled-back transaction.
- Verified anonymous table listing is denied and staff cannot update an order's shop_id.
- Security advisors flag the two intentionally anonymous token-based SECURITY DEFINER RPCs; their restricted output and purpose are documented in README.
- Production build and unit tests pass.
- Public URL navigation and HTTP verification timed out from the execution network even though Cloudflare confirms deployment readiness. End-to-end browser login on the public URL remains unverified.
- Deployment is currently a dashboard upload, not automatic deployment from GitHub pushes. `wrangler.jsonc` is included for future authenticated deployments.
