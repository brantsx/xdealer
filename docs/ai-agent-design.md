# AI Agent Design

## Goal

The xDealer analysis agent produces a structured commercial decision pack for a UK used vehicle appraisal.

It is not a chatbot. It is an appraisal decision system that returns JSON matching `GeneratedDecisionPackSchema`.

## Inputs

- Vehicle identity, VRM and optional VIN
- Mileage, registration date, fuel, transmission, body, colour
- V5C, service history, MOT expiry and MOT advisories
- HPI status and provenance markers
- Source and site/team
- Proposed offer or reserve
- CAP Clean, CAP Average, CAP Below
- Retail market estimate and trade estimate
- Expected prep budget, buyer fees and vendor fees
- Appraisal condition and notes
- Damage entries and photo metadata
- Organisation rules
- Seller dealer profile and stock profile
- Buyer dealer profile and stock profile for marketplace analysis
- Listing type, asking price, reserve, minimum offer and current highest bid

## Provider Abstraction

Frontend files:

- `src/lib/ai/types.ts`
- `src/lib/ai/prompts.ts`
- `src/lib/ai/provider.ts`
- `src/lib/ai/mockProvider.ts`
- `src/lib/ai/structuredSchemas.ts`

Backend:

- `supabase/functions/analyse-vehicle/index.ts`
- `supabase/functions/analyse-marketplace-listing/index.ts`

If no AI key is available, the deterministic mock provider is used. Live AI is guarded by provider abstraction and `ENABLE_LIVE_AI`.

## Mock Logic Examples

- Proposed offer above CAP Clean plus weak appraisal creates high risk.
- Tyre, brake or suspension MOT advisories increase prep risk.
- Missing service history on premium vehicles lowers confidence.
- Prep above the value-band rule can route the vehicle to auction or trade.
- A poor retail fit with good trade appetite can route the vehicle to Dealer marketplace.
- Buyer marketplace analysis scores fit against preferred makes, body type, fuel, age, mileage, prep tolerance, risk appetite and expected margin.
- Low data completeness requests more information.
- Confidence below the organisation threshold requires senior review.

## Output Contract

The agent must return structured JSON only. Free text outside the schema is rejected by validation before saving.

Decision packs can include `marketplaceRecommendation` with list/do-not-list guidance, listing type, asking guide, reserve, minimum acceptable offer, likely buyer type and rationale.

Marketplace analysis returns buyer-private JSON with fit score, fit label, recommended maximum bid, expected margin, risk rating, reasons and risks to check.
