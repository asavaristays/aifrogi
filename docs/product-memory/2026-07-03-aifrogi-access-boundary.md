# AiFrogi Access Boundary Memory

Date: 2026-07-03

## Product Rule

AiFrogi must keep platform administration and customer workspace operations separate.

- `info@aifrogi.com` is the Super Admin identity and lands in the AiFrogi command center.
- `support@hotelradar.in` is the HotelRadar client/workspace identity and lands in the client dashboard.
- HotelRadar is AiFrogi's first client, not the platform owner.
- The Super Admin dashboard and client dashboard must not be combined.

## Routing Rule

- Super Admin users should enter `/admin/customers` or the `/admin` command-center area.
- Client users should enter `/dashboard`, `/inbox`-style operations, setup, support, campaigns, contacts, workflows, analytics, and settings for their workspace.
- Super Admin users should not be offered the client `Operations` shortcut from the admin header.
- Client users must be redirected away from `/admin`.
- Super Admin users must be redirected away from client workspace routes.

## Implementation Note

The login route must assign roles from the authenticated email. It must never default every successful login to `admin`.

Current role mapping:

- `info@aifrogi.com` -> `admin`
- `admin@aifrogi.com` -> `admin`
- `support@hotelradar.in` -> `hotel_owner`
- `admin@hotelradar.in` -> `hotel_owner`

The first production access model permits the two approved identities to verify against the existing hashed app credential. Their submitted email, not the credential label, determines the role and destination. This shared-hash bridge is temporary until team management introduces separate per-user credentials and password reset flows.

Passwords, mailbox credentials, and temporary access secrets must never be written into product memory.
