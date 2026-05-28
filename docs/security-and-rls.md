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
