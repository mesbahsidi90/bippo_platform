# Shop settings

The dashboard now contains Orders, Reports and Settings. Settings save a shop-specific public profile (name, city, address, pickup message and a resized WebP logo). PNG/JPEG/WebP uploads are decoded and re-encoded, limited to 2 MB input and 150 KB output. No SVG or remote logo URLs are accepted.

Apply supabase/shop_settings.sql once on a fresh installation. It has been applied to the linked production project. Membership-scoped RLS restricts all reads and writes; subscription, membership and platform permissions cannot be changed here. Current memberships have no owner/staff roles, so every existing shop member can edit its public profile.

The guest branding RPC exposes only public profile fields to a valid order UUID for 24 hours, matching the order tracking window. Private settings rows are not accessible anonymously. The security advisor flags this intentional bearer-ticket function as SECURITY DEFINER, alongside the existing track/display endpoints.

Profile names override the original provisioning name for customer pages; admin provisioning fields remain separate. No order history was changed. Logout and the password-change link are in Settings. Platform admin, Home and Display links were removed from the shop dashboard; their existing routes still work independently.

Validation: production build and all 23 tests passed. Scoped save and guest invalid-token queries passed in a rolled-back database transaction; local browser save, logo preview and reload persistence checked.
