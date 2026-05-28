# xDealer

xDealer is a production-grade MVP for a UK automotive SaaS product: the AI trading agent for used vehicle decisions.

It turns every UK vehicle appraisal into a clear commercial decision pack, showing what to offer, what the risks are, what prep is worth doing and where the vehicle should go.

## Stack

- React, TypeScript and Vite
- Tailwind CSS
- Supabase auth, PostgreSQL, RLS, Storage and Edge Functions
- Deterministic mock AI mode with a provider abstraction for future live model use
- Mock adapter interfaces for CAP/HPI, Auto Trader-style retail market data, auction and MOT history
- Dealer-to-dealer marketplace module with mock bids, offers, watchlist and buyer-specific analysis

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs on `http://localhost:5173`.

Without Supabase environment variables, xDealer runs in demo mode with realistic mock data.

## Supabase Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Apply the migration:

```bash
supabase db push
```

5. Seed demo data:

```bash
supabase db reset
```

The demo seed lives in `supabase/seed/demo.sql`.

Local Supabase demo login:

```text
demo@xdealer.local
demo-password
```

## Edge Function

Deploy the vehicle analysis function:

```bash
supabase functions deploy analyse-vehicle
supabase functions deploy analyse-marketplace-listing
supabase functions deploy publish-marketplace-listing
supabase functions deploy place-bid
supabase functions deploy make-offer
supabase functions deploy respond-offer
```

Set server-side secrets if live AI is enabled later:

```bash
supabase secrets set OPENAI_API_KEY=...
supabase secrets set OPENAI_MODEL=gpt-4.1-mini
supabase secrets set ENABLE_LIVE_AI=false
```

`ENABLE_LIVE_AI` defaults to mock behaviour unless explicitly set to `true`.

## Mock AI Mode

The MVP uses deterministic analysis when no AI key is present. The mock logic considers CAP-style values, proposed offer, appraisal quality, MOT advisories, HPI status, service history, damage entries, expected prep and organisation rules.

Marketplace mock AI also compares listings against a buyer organisation's trade profile and rules, returning fit score, recommended maximum bid, expected margin, risk rating and reasons to check before bidding.

Key files:

- `src/lib/ai/types.ts`
- `src/lib/ai/prompts.ts`
- `src/lib/ai/provider.ts`
- `src/lib/ai/mockProvider.ts`
- `src/lib/ai/structuredSchemas.ts`
- `supabase/functions/analyse-vehicle/index.ts`
- `supabase/functions/analyse-marketplace-listing/index.ts`

## Marketplace Module

Routes:

- `/app/marketplace`
- `/app/marketplace/:id`
- `/app/marketplace/listings/new/:vehicleId`
- `/app/my-listings`
- `/app/bids-offers`
- `/app/watchlist`
- `/app/trade-profile`

The marketplace has no real payments, escrow, legal contracts, transport booking or live verification. It uses workflow statuses and mocked events so pilots can validate the trade-to-trade stock exchange before regulated or paid services are added.

## Future Integration Notes

No paid third-party services are live in this MVP. Adapter interfaces exist for CAP/HPI, DVSA MOT history, Auto Trader-style retail market data, auction platforms, DMS, CRM, refurbishment/bodyshop, transport, webhooks and CSV workflows.

See `docs/integrations.md` for the planned integration contract.
