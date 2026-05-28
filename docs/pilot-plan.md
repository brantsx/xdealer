# Pilot Plan

## Pilot Objective

Validate that Xdealer improves offer discipline, appraisal consistency, prep decisions and disposal routing for UK used vehicle workflows.

## Suggested Pilot

1. Start with one organisation and 2-3 sites or teams.
2. Load 100 recent appraisal records through CSV or manual intake.
3. Generate decision packs in mock integration mode.
4. Compare recommendations against actual buy, prep and sale outcomes.
5. Capture buyer overrides and reasons.
6. Adjust value-band margin and prep rules.
7. Connect one valuation/provenance feed and one outcome feed.

## Success Metrics

- Reduction in over-allowance cases
- Higher appraisal completeness
- Faster senior review decisions
- Lower prep overspend
- More consistent route-to-market decisions
- Lower post-sale dispute exposure

## Next Build Steps

- Supabase auth onboarding flow that creates organisations and first owner profile.
- Role-enforced UI permissions and RLS helper functions.
- Real photo upload to Supabase Storage.
- CSV import parser and validation.
- Outcome variance analysis.
- Live CAP/HPI, DMS and auction pilots.
