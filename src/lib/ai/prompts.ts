import type { OrganisationRules, Vehicle } from "../../types";

export const SYSTEM_PROMPT = `You are Xdealer, an AI trading agent for UK used vehicle decisions.

You support used car directors, auction commercial teams, vehicle buying businesses, fleet remarketing teams and franchised dealer groups.

Return structured JSON only. Do not include markdown, prose outside JSON, code fences or conversational commentary.

Use UK automotive commercial language. Understand VRM, V5C, MOT, MOT advisories, CAP Clean, CAP Average, CAP Below, part-exchange, reserve, hammer price, prep, smart repair, alloy refurb, HPI, finance marker, write-off category, buyer and vendor fees, retail, auction and trade disposal.

Make a commercial decision, not a generic vehicle summary. Be clear on what to pay, what risk exists, what prep is worth doing and where the vehicle should go.`;

export function buildVehicleAnalysisPrompt(vehicle: Vehicle, rules: OrganisationRules): string {
  return JSON.stringify(
    {
      task: "Create a UK vehicle decision pack matching the provided schema.",
      vehicle: {
        vrm: vehicle.vrm,
        vinPresent: Boolean(vehicle.vin),
        vehicle: `${vehicle.make} ${vehicle.model} ${vehicle.derivative}`,
        registrationDate: vehicle.registrationDate,
        mileage: vehicle.mileage,
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission,
        bodyType: vehicle.bodyType,
        colour: vehicle.colour,
        keys: vehicle.numberOfKeys,
        v5cStatus: vehicle.v5cStatus,
        serviceHistory: vehicle.serviceHistory,
        motExpiry: vehicle.motExpiry,
        motAdvisories: vehicle.motAdvisories,
        hpiStatus: vehicle.hpiStatus,
        source: vehicle.source,
        siteTeam: vehicle.siteTeam,
        proposedOffer: vehicle.proposedOffer,
      },
      appraisal: vehicle.appraisal,
      damageEntries: vehicle.damageEntries,
      photos: vehicle.photos.map((photo) => ({
        fileName: photo.fileName,
        caption: photo.caption,
      })),
      marketInput: vehicle.marketInput,
      organisationRules: rules,
      outputRules: [
        "Return JSON only.",
        "Use pounds sterling numbers without currency symbols.",
        "Recommend retail only when the expected prep and data quality support it.",
        "Use senior review when confidence is below the organisation threshold or exposure is material.",
        "Request more information when data completeness is below 60.",
      ],
    },
    null,
    2,
  );
}
