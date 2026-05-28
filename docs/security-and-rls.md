# Security And RLS

## Principles

- Every tenant-owned row includes `organisation_id`.
- Row-level security is enabled on all tenant-owned tables.
- Storage object paths include organisation ID.
- Authenticated users resolve their tenant through `profiles.auth_user_id`.
- Service role access is reserved for migrations, seed scripts and controlled backend jobs.

## Policies

The migration creates select, insert, update and delete policies for:

- `vehicles`
- `appraisals`
- `damage_entries`
- `vehicle_photos`
- `market_inputs`
- `decision_packs`
- `decision_actions`
- `organisation_rules`
- `outcomes`
- `integrations`
- `audit_events`

Marketplace policies cover:

- Sellers can create and manage their own `marketplace_listings`.
- Approved authenticated organisations can read live listings according to visibility rules.
- Buyers can see their own bids/offers; sellers can see activity on their own listings.
- Watchlist rows are private to the current organisation/user.
- Buyer marketplace analysis is private to the buyer organisation.
- Questions are public to approved dealers or private depending on the `visibility` field.

The organisation and profile tables have dedicated policies for onboarding and tenant visibility.

## Roles

The MVP models the roles:

- Owner
- Admin
- Buyer
- Appraiser
- Remarketing Manager
- Read-only

The initial migration includes `current_user_role()` and blocks tenant writes for `Read-only` users. Organisation and profile administration is limited to `Owner` and `Admin`.

The next hardening step is to split table-specific mutation permissions further, for example limiting appraisal writes to appraisers and limiting commercial rule changes to owners, admins and remarketing managers.

Marketplace hardening steps include invite-only visibility enforcement tables, dealer verification/KYC status checks, payment/escrow permissions, transport booking permissions and immutable condition-disclosure audit snapshots.
