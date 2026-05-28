# Integrations

No live paid third-party services are integrated in the MVP.

The app includes adapter contracts and mock implementations under `src/lib/integrations`.

## Integration Cards

- CAP/HPI valuation data
- DVSA MOT history
- Auto Trader-style retail market data
- Auction platform
- DMS
- CRM
- Refurbishment/bodyshop
- Transport provider
- Webhooks
- CSV import/export
- Marketplace events and dealer trade verification placeholders

## Current Modes

- CAP/HPI: mocked
- DVSA MOT history: planned and disabled
- Auto Trader-style market data: mocked
- Auction platform: mocked
- CSV import/export: mocked
- DMS, CRM, refurbishment, transport, webhooks: planned
- Dealer verification, payments, escrow and trade contracts: planned placeholders only

## Future Credential Handling

Credentials should be stored server-side only, ideally using Supabase secrets or a dedicated encrypted integration credential table. The browser should never receive paid-service API keys.

Marketplace future integrations should be split by risk: Companies House/VAT/FCA verification, payment or escrow provider, transport quote/booking, document signing and notification delivery. None of these are live in the MVP.
