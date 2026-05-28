import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({ listingId: z.string().uuid() });
const AnalysisSchema = z.object({
  fitScore: z.number().min(0).max(100),
  fitLabel: z.enum(["Excellent fit", "Good fit", "Possible fit", "Poor fit"]),
  recommendedMaxBid: z.number().nonnegative(),
  expectedMargin: z.number(),
  riskRating: z.enum(["Low", "Medium", "High", "Critical"]),
  analysisJson: z.record(z.unknown()),
});

function label(score: number): z.infer<typeof AnalysisSchema>["fitLabel"] {
  if (score >= 82) return "Excellent fit";
  if (score >= 68) return "Good fit";
  if (score >= 50) return "Possible fit";
  return "Poor fit";
}

function risk(score: number, hpiStatus: string): z.infer<typeof AnalysisSchema>["riskRating"] {
  if (hpiStatus.includes("Write-off")) return "Critical";
  if (score < 45) return "High";
  if (score < 65) return "Medium";
  return "Low";
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = BodySchema.parse(await request.json());
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase environment variables are missing");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: request.headers.get("Authorization") ?? "" } },
    });

    const { data: buyerOrganisationId, error: orgError } = await supabase.rpc("current_organisation_id");
    if (orgError || !buyerOrganisationId) throw orgError ?? new Error("Organisation not resolved");

    const { data: listing, error: listingError } = await supabase
      .from("marketplace_listings")
      .select("*")
      .eq("id", body.listingId)
      .single();
    if (listingError || !listing) throw listingError ?? new Error("Listing not found");

    const [{ data: vehicle }, { data: market }, { data: buyerProfile }, { data: rules }] = await Promise.all([
      supabase.from("vehicles").select("*").eq("id", listing.vehicle_id).single(),
      supabase.from("market_inputs").select("*").eq("vehicle_id", listing.vehicle_id).single(),
      supabase.from("dealer_profiles").select("*").eq("organisation_id", buyerOrganisationId).single(),
      supabase.from("organisation_rules").select("*").eq("organisation_id", buyerOrganisationId).single(),
    ]);
    if (!vehicle || !market || !buyerProfile || !rules) throw new Error("Listing, market or buyer profile data is incomplete");

    const age = new Date().getFullYear() - new Date(vehicle.registration_date).getFullYear();
    const priceAnchor = Number(listing.current_highest_bid ?? listing.asking_price ?? listing.minimum_offer);
    const targetBand =
      (rules.value_bands as Array<{ minValue: number; maxValue?: number; targetMargin: number }>).find(
        (band) => priceAnchor >= band.minValue && (band.maxValue === undefined || priceAnchor < band.maxValue),
      ) ?? { targetMargin: 1200 };
    const expectedPrep = Number(market.expected_prep_budget);
    const expectedMargin = Math.round(Number(market.retail_market_estimate) - priceAnchor - expectedPrep - Number(market.buyer_fees));
    const preferredMakes = buyerProfile.preferred_makes as string[];
    const excludedMakes = buyerProfile.excluded_makes as string[];
    const bodyTypes = buyerProfile.preferred_body_types as string[];
    const fuelTypes = buyerProfile.preferred_fuel_types as string[];
    let score = 55;
    const reasons: string[] = [];
    const risksToCheck: string[] = [];

    if (preferredMakes.includes(vehicle.make)) {
      score += 12;
      reasons.push(`Matches your preferred ${vehicle.make} profile`);
    } else {
      score -= 8;
      risksToCheck.push(`${vehicle.make} is not a preferred make`);
    }
    if (excludedMakes.includes(vehicle.make)) {
      score -= 25;
      risksToCheck.push("Excluded make for your profile");
    }
    if (bodyTypes.includes(vehicle.body_type)) {
      score += 10;
      reasons.push(`Matches preferred ${vehicle.body_type.toLowerCase()} stock`);
    }
    if (fuelTypes.includes(vehicle.fuel_type)) {
      score += 8;
      reasons.push(`${vehicle.fuel_type} matches your preferred fuel mix`);
    }
    if (vehicle.mileage <= buyerProfile.max_mileage && age <= buyerProfile.max_vehicle_age) score += 10;
    else risksToCheck.push("Age or mileage is outside your configured buying range");
    if (expectedMargin >= targetBand.targetMargin) {
      score += 14;
      reasons.push("Strong expected retail margin against your target");
    } else {
      score -= 9;
      risksToCheck.push("Expected margin is below your configured target");
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    const analysis = AnalysisSchema.parse({
      fitScore: score,
      fitLabel: label(score),
      recommendedMaxBid: Math.max(0, Math.round((Number(market.retail_market_estimate) - expectedPrep - targetBand.targetMargin - Number(market.buyer_fees)) / 50) * 50),
      expectedMargin,
      riskRating: risk(score, vehicle.hpi_status),
      analysisJson: {
        reasons: reasons.slice(0, 5),
        risksToCheck: risksToCheck.slice(0, 5),
        expectedMarginRange: [expectedMargin - 450, expectedMargin + 650],
        buyerFitSummary: score >= 68 ? "Worth active bidding if disclosure checks out." : "Needs caution against your configured stock profile.",
      },
    });

    const { data: saved, error: saveError } = await supabase
      .from("marketplace_analysis")
      .upsert(
        {
          listing_id: body.listingId,
          buyer_organisation_id: buyerOrganisationId,
          fit_score: analysis.fitScore,
          fit_label: analysis.fitLabel,
          recommended_max_bid: analysis.recommendedMaxBid,
          expected_margin: analysis.expectedMargin,
          risk_rating: analysis.riskRating,
          analysis_json: analysis.analysisJson,
        },
        { onConflict: "listing_id,buyer_organisation_id" },
      )
      .select("id")
      .single();
    if (saveError) throw saveError;

    await supabase.from("marketplace_events").insert({
      listing_id: body.listingId,
      organisation_id: buyerOrganisationId,
      event_type: "buyer_analysis_generated",
      event_json: { fitScore: analysis.fitScore, recommendedMaxBid: analysis.recommendedMaxBid },
    });

    return new Response(JSON.stringify({ analysis: { id: saved?.id, listingId: body.listingId, buyerOrganisationId, ...analysis } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
