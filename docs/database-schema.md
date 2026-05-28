# Database Schema

The core schema is defined in `supabase/migrations/20260527120000_initial_xdealer_schema.sql`.

Marketplace additions live in `supabase/migrations/20260528120000_marketplace.sql`.

## Tenant Model

Every tenant-owned table includes `organisation_id` and row-level security policies that compare it with `public.current_organisation_id()`.

Core tables:

- `organisations`
- `profiles`
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

Marketplace tables:

- `dealer_profiles`
- `marketplace_listings`
- `marketplace_listing_photos`
- `marketplace_bids`
- `marketplace_offers`
- `marketplace_questions`
- `marketplace_watchlist`
- `marketplace_analysis`
- `marketplace_events`

## Storage

The migration creates a private `vehicle-photos` bucket. Object paths are expected to start with the tenant UUID:

```text
{organisation_id}/{vehicle_id}/{file_name}
```

Storage RLS policies restrict reads and writes to objects under the current organisation path.

## Seed Data

`supabase/seed/demo.sql` creates one demo organisation with users, rules, integrations and 10 UK-style vehicles with valuations, appraisals, MOT advisories and damage entries.

The marketplace seed adds three additional dealer organisations/profiles, 10 more UK vehicles, 12 live marketplace listings, 4 draft listings, sold/reserved examples, bids, offers, watchlist records, questions, buyer analyses and marketplace events.

For local Supabase development the seed also creates a confirmed auth user:

```text
demo@xdealer.local
demo-password
```
