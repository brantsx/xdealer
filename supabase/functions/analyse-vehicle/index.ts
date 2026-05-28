import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GeneratedDecisionPackSchema = z.object({
  overallRecommendation: z.enum([
    "Buy",
    "Buy with caution",
    "Reject",
    "Retail",
    "Auction",
    "Trade out",
    "Request more information",
    "Senior review required",
  ]),
  recommendedOfferMin: z.number().nonnegative(),
  recommendedOfferMax: z.number().nonnegative(),
  maximumOffer: z.number().nonnegative(),
  recommendedReserve: z.number().nonnegative(),
  suggestedRetailPrice: z.number().nonnegative(),
  suggestedTradePrice: z.number().nonnegative(),
  preferredChannel: z.enum(["Retail", "Auction", "Trade out", "Wholesale", "Hold"]),
  alternativeChannel: z.enum(["Retail", "Auction", "Trade out", "Wholesale", "Hold"]),
  confidenceScore: z.number().min(0).max(100),
  dataCompletenessScore: z.number().min(0).max(100),
  appraisalQualityScore: z.number().min(0).max(100),
  expectedMargin: z.number(),
  expectedPrepCost: z.number().nonnegative(),
  expectedDaysToSale: z.number().int().positive(),
  keyRisks: z.array(z.object({
    level: z.enum(["Low", "Medium", "High", "Critical"]),
    title: z.string(),
    detail: z.string(),
    commercialImpact: z.number(),
  })),
  missingInformation: z.array(z.string()),
  damageCommercialisationSummary: z.string(),
  prepRecommendation: z.string(),
  channelRecommendation: z.string(),
  suggestedNextActions: z.array(z.string()).min(1),
  draftMessages: z.object({
    customerVendor: z.string(),
    internal: z.string(),
    seniorReview: z.string(),
  }),
  auditTrail: z.array(z.object({
    label: z.string(),
    detail: z.string(),
    evidence: z.string(),
  })).min(1),
});

type GeneratedDecisionPack = z.infer<typeof GeneratedDecisionPackSchema>;

interface VehicleRow {
  id: string;
  organisation_id: string;
  vrm: string;
  make: string;
  model: string;
  derivative: string;
  registration_date: string;
  mileage: number;
  fuel_type: string;
  transmission: string;
  body_type: string;
  colour: string;
  number_of_keys: number;
  v5c_status: string;
  service_history: string;
  mot_expiry: string;
  mot_advisories: string[];
  hpi_status: string;
  source: string;
  site_team: string;
  proposed_offer: number;
}

interface AppraisalRow {
  tyres: string;
  alloys: string;
  glass: string;
  interior: string;
  paintwork: string;
  mechanical_notes: string;
  warning_lights: string;
  quality_score: number;
}

interface MarketInputRow {
  cap_clean: number;
  cap_average: number;
  cap_below: number;
  retail_market_estimate: number;
  trade_value_estimate: number;
  expected_prep_budget: number;
  buyer_fees: number;
  vendor_fees: number;
}

interface DamageEntryRow {
  panel_location: string;
  damage_type: string;
  severity: string;
  estimated_repair_category: string;
  estimated_cost: number;
  notes: string;
}

interface RulesRow {
  risk_appetite: "Conservative" | "Balanced" | "Aggressive";
  minimum_confidence_for_auto_approval: number;
  senior_approval_threshold: number;
  retail_vs_auction_margin_threshold: number;
  stock_age_review_days: number;
  value_bands: Array<{ label: string; minValue: number; maxValue?: number; targetMargin: number; maxPrepSpend: number }>;
}

interface AnalysisInput {
  vehicle: VehicleRow;
  appraisal: AppraisalRow;
  marketInput: MarketInputRow;
  damageEntries: DamageEntryRow[];
  photoCount: number;
  rules: RulesRow;
}

interface AnalysisProvider {
  analyse(input: AnalysisInput): Promise<GeneratedDecisionPack>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

function round(value: number, step = 50): number {
  return Math.round(value / step) * step;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function conditionScore(value: string): number {
  const scores: Record<string, number> = { Good: 92, "Minor wear": 78, "Needs prep": 58, Poor: 34, Unknown: 42 };
  return scores[value] ?? 55;
}

function valueBand(rules: RulesRow, tradeValue: number) {
  return rules.value_bands.find((band) => tradeValue >= band.minValue && (band.maxValue === undefined || tradeValue < band.maxValue)) ?? rules.value_bands[0];
}

class DeterministicMockProvider implements AnalysisProvider {
  async analyse(input: AnalysisInput): Promise<GeneratedDecisionPack> {
    const { vehicle, appraisal, marketInput, damageEntries, rules } = input;
    const band = valueBand(rules, marketInput.trade_value_estimate);
    const damagePrep = damageEntries.reduce((sum, entry) => sum + Number(entry.estimated_cost), 0);
    const advisories = vehicle.mot_advisories.join(" ").toLowerCase();
    const motPrep = (advisories.includes("tyre") ? 240 : 0) + (advisories.includes("brake") ? 320 : 0) + (advisories.includes("suspension") || advisories.includes("bush") ? 420 : 0);
    const expectedPrepCost = round(Math.max(marketInput.expected_prep_budget, damagePrep + motPrep), 25);
    const retailMargin = marketInput.retail_market_estimate - vehicle.proposed_offer - expectedPrepCost - marketInput.buyer_fees - marketInput.vendor_fees;
    const tradeMargin = marketInput.trade_value_estimate - vehicle.proposed_offer - expectedPrepCost - marketInput.buyer_fees;
    const expectedMargin = Math.round(Math.max(retailMargin, tradeMargin));
    const missing = [
      vehicle.vrm ? "" : "VRM",
      vehicle.v5c_status === "Unknown" ? "V5C status" : "",
      vehicle.hpi_status === "Not checked" ? "HPI check" : "",
      input.photoCount ? "" : "Vehicle photos",
      appraisal.quality_score ? "" : "Appraisal quality score",
    ].filter(Boolean);
    const dataCompletenessScore = Math.round(((5 - missing.length) / 5) * 100);
    const appraisalQualityScore = Math.round(clamp(
      ([appraisal.tyres, appraisal.alloys, appraisal.glass, appraisal.interior, appraisal.paintwork]
        .map(conditionScore)
        .reduce((sum, score) => sum + score, 0) / 5) + Math.min(8, input.photoCount * 2),
    ));
    const keyRisks: GeneratedDecisionPack["keyRisks"] = [];

    if (vehicle.proposed_offer > marketInput.cap_clean && appraisalQualityScore < 70) {
      keyRisks.push({
        level: "High",
        title: "Offer above CAP Clean with weak appraisal",
        detail: "The proposed money is ahead of CAP Clean while appraisal evidence is not strong enough.",
        commercialImpact: Math.round(vehicle.proposed_offer - marketInput.cap_clean + 350),
      });
    }
    if (advisories.includes("tyre") || advisories.includes("brake") || advisories.includes("suspension")) {
      keyRisks.push({
        level: "Medium",
        title: "MOT advisories need commercialising",
        detail: "Tyre, brake or suspension advisories should be priced into prep or reserve.",
        commercialImpact: motPrep,
      });
    }
    if (["BMW", "Mercedes-Benz", "Audi", "Range Rover", "Tesla"].includes(vehicle.make) && ["Missing", "Partial", "Unknown"].includes(vehicle.service_history)) {
      keyRisks.push({
        level: "High",
        title: "Premium vehicle service history gap",
        detail: "Missing or partial history on a premium model reduces retail confidence.",
        commercialImpact: 850,
      });
    }
    if (expectedPrepCost > band.maxPrepSpend) {
      keyRisks.push({
        level: "High",
        title: "Prep spend exceeds rule threshold",
        detail: `Expected prep of ${formatCurrency(expectedPrepCost)} exceeds the ${band.label} threshold.`,
        commercialImpact: Math.round(expectedPrepCost - band.maxPrepSpend),
      });
    }
    if (vehicle.hpi_status !== "Clear") {
      keyRisks.push({
        level: vehicle.hpi_status.includes("Write-off") || vehicle.hpi_status === "Finance marker" ? "Critical" : "High",
        title: "HPI marker requires control",
        detail: `${vehicle.hpi_status} must be resolved or priced into disposal route.`,
        commercialImpact: 1500,
      });
    }
    if (appraisal.warning_lights.trim()) {
      keyRisks.push({
        level: "Critical",
        title: "Warning light reported",
        detail: "A dashboard warning light should block auto-approval until diagnosis is complete.",
        commercialImpact: 1200,
      });
    }

    const confidencePenalty = keyRisks.reduce((sum, risk) => sum + ({ Low: 4, Medium: 9, High: 17, Critical: 28 }[risk.level]), 0);
    const confidenceScore = Math.round(clamp(dataCompletenessScore * 0.42 + appraisalQualityScore * 0.36 + 24 - confidencePenalty));
    const age = new Date().getFullYear() - new Date(vehicle.registration_date).getFullYear();
    let preferredChannel: GeneratedDecisionPack["preferredChannel"] =
      age > 8 || vehicle.mileage > 95000 || expectedPrepCost > marketInput.cap_clean * 0.12
        ? "Auction"
        : "Retail";
    if (vehicle.hpi_status !== "Clear" || appraisal.warning_lights.trim()) preferredChannel = "Trade out";
    let overallRecommendation: GeneratedDecisionPack["overallRecommendation"] =
      preferredChannel === "Retail" ? "Retail" : preferredChannel;
    if (dataCompletenessScore < 60) {
      overallRecommendation = "Request more information";
      preferredChannel = "Hold";
    } else if (confidenceScore < rules.minimum_confidence_for_auto_approval) {
      overallRecommendation = "Senior review required";
    } else if (expectedMargin < band.targetMargin * 0.55) {
      overallRecommendation = "Reject";
      preferredChannel = "Hold";
    } else if (expectedPrepCost > band.maxPrepSpend || expectedMargin < band.targetMargin) {
      overallRecommendation = "Auction";
      preferredChannel = "Auction";
    } else if (keyRisks.some((risk) => risk.level === "High")) {
      overallRecommendation = "Buy with caution";
    }

    const maximumOffer = round(Math.max(0, Math.min(
      marketInput.cap_clean + (rules.risk_appetite === "Aggressive" ? 250 : 0),
      marketInput.retail_market_estimate - band.targetMargin - expectedPrepCost - marketInput.buyer_fees,
    )));
    const title = `${vehicle.make} ${vehicle.model} ${vehicle.derivative}`;
    const analysis: GeneratedDecisionPack = {
      overallRecommendation,
      recommendedOfferMin: Math.max(0, maximumOffer - 650),
      recommendedOfferMax: Math.max(0, maximumOffer - 150),
      maximumOffer,
      recommendedReserve: Math.max(0, round(preferredChannel === "Auction" ? marketInput.cap_average - expectedPrepCost * 0.35 : marketInput.trade_value_estimate)),
      suggestedRetailPrice: round(marketInput.retail_market_estimate, 100),
      suggestedTradePrice: round(marketInput.trade_value_estimate - expectedPrepCost * 0.2),
      preferredChannel,
      alternativeChannel: preferredChannel === "Retail" ? "Auction" : "Trade out",
      confidenceScore,
      dataCompletenessScore,
      appraisalQualityScore,
      expectedMargin,
      expectedPrepCost,
      expectedDaysToSale: preferredChannel === "Retail" ? 32 : preferredChannel === "Auction" ? 12 : 7,
      keyRisks,
      missingInformation: missing,
      damageCommercialisationSummary: damageEntries.length
        ? damageEntries.map((entry) => `${entry.panel_location}: ${entry.damage_type} (${entry.estimated_repair_category})`).join("; ")
        : "No damage entries logged. Validate with a full image set before committing stock money.",
      prepRecommendation: preferredChannel === "Retail"
        ? "Complete retail-critical prep only, prioritising visible damage and MOT advisory items."
        : "Avoid full retail prep. Prepare to auction or trade disposal standard.",
      channelRecommendation: preferredChannel === "Retail"
        ? "Retail is commercially viable if the vehicle is bought inside the recommended range and prep is controlled."
        : preferredChannel === "Auction"
          ? "Auction is preferred because prep exposure or margin pressure makes retail less attractive."
          : preferredChannel === "Hold"
            ? "Hold the decision until missing information is supplied."
            : "Trade disposal is preferred to avoid retail warranty and post-sale dispute exposure.",
      suggestedNextActions: [
        dataCompletenessScore < 60 ? "Complete missing appraisal evidence" : `Keep the offer at or below ${formatCurrency(maximumOffer)}`,
        overallRecommendation === "Senior review required" ? "Send to senior review before offer commitment" : "Share decision pack with the responsible buyer",
        preferredChannel === "Retail" ? "Book retail-critical prep after commercial approval" : "Confirm disposal route before further prep spend",
      ],
      draftMessages: {
        customerVendor: `We have reviewed ${vehicle.vrm} and can proceed subject to evidence at a maximum commercial position of ${formatCurrency(maximumOffer)}.`,
        internal: `${title}: ${overallRecommendation}. Preferred route ${preferredChannel}; expected margin ${formatCurrency(expectedMargin)}; confidence ${confidenceScore}%.`,
        seniorReview: `${vehicle.vrm} needs review because confidence is ${confidenceScore}% and risks are ${keyRisks.map((risk) => risk.title).join(", ") || "margin control"}.`,
      },
      auditTrail: [
        {
          label: "Market anchor",
          detail: `CAP Clean ${formatCurrency(marketInput.cap_clean)}, Average ${formatCurrency(marketInput.cap_average)}, Below ${formatCurrency(marketInput.cap_below)} used as guardrails.`,
          evidence: "CAP/HPI mock or connected adapter",
        },
        {
          label: "Rules applied",
          detail: `${band.label} requires ${formatCurrency(band.targetMargin)} target margin and ${formatCurrency(band.maxPrepSpend)} max prep.`,
          evidence: `Risk appetite: ${rules.risk_appetite}`,
        },
      ],
    };
    return GeneratedDecisionPackSchema.parse(analysis);
  }
}

class OpenAiJsonProvider implements AnalysisProvider {
  constructor(private readonly apiKey: string, private readonly fallback: AnalysisProvider) {}

  async analyse(input: AnalysisInput): Promise<GeneratedDecisionPack> {
    if (Deno.env.get("ENABLE_LIVE_AI") !== "true") {
      return this.fallback.analyse(input);
    }
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "You are Xdealer, a UK used vehicle trading decision agent. Return JSON only matching the requested schema.",
          },
          {
            role: "user",
            content: JSON.stringify({ task: "Analyse this UK used vehicle and return the decision pack schema.", input }),
          },
        ],
      }),
    });
    if (!response.ok) return this.fallback.analyse(input);
    const body = await response.json() as { output_text?: string };
    const text = body.output_text as string | undefined;
    if (!text) return this.fallback.analyse(input);
    return GeneratedDecisionPackSchema.parse(JSON.parse(text));
  }
}

function provider(): AnalysisProvider {
  const fallback = new DeterministicMockProvider();
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  return apiKey ? new OpenAiJsonProvider(apiKey, fallback) : fallback;
}

function statusForRecommendation(recommendation: GeneratedDecisionPack["overallRecommendation"]): string {
  if (recommendation === "Senior review required") return "Senior review";
  if (recommendation === "Request more information") return "Needs appraisal";
  return "Analysed";
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { vehicleId } = await request.json() as { vehicleId?: string };
    if (!vehicleId) throw new Error("vehicleId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase environment variables are missing");

    const authHeader = request.headers.get("Authorization") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicleId)
      .returns<VehicleRow>()
      .single();
    if (vehicleError || !vehicle) throw vehicleError ?? new Error("Vehicle not found");

    const [
      appraisalResult,
      marketResult,
      damageResult,
      photoResult,
      rulesResult,
    ] = await Promise.all([
      supabase.from("appraisals").select("*").eq("vehicle_id", vehicleId).returns<AppraisalRow>().single(),
      supabase.from("market_inputs").select("*").eq("vehicle_id", vehicleId).returns<MarketInputRow>().single(),
      supabase.from("damage_entries").select("*").eq("vehicle_id", vehicleId).returns<DamageEntryRow[]>(),
      supabase.from("vehicle_photos").select("id").eq("vehicle_id", vehicleId),
      supabase.from("organisation_rules").select("*").eq("organisation_id", vehicle.organisation_id).returns<RulesRow>().single(),
    ]);

    if (appraisalResult.error || !appraisalResult.data) throw appraisalResult.error ?? new Error("Appraisal missing");
    if (marketResult.error || !marketResult.data) throw marketResult.error ?? new Error("Market input missing");
    if (damageResult.error) throw damageResult.error;
    if (photoResult.error) throw photoResult.error;
    if (rulesResult.error || !rulesResult.data) throw rulesResult.error ?? new Error("Organisation rules missing");

    const analysis = await provider().analyse({
      vehicle,
      appraisal: appraisalResult.data,
      marketInput: marketResult.data,
      damageEntries: damageResult.data ?? [],
      photoCount: photoResult.data?.length ?? 0,
      rules: rulesResult.data,
    });

    const { data: decisionPack, error: insertError } = await supabase
      .from("decision_packs")
      .insert({
        organisation_id: vehicle.organisation_id,
        vehicle_id: vehicle.id,
        overall_recommendation: analysis.overallRecommendation,
        recommended_offer_min: analysis.recommendedOfferMin,
        recommended_offer_max: analysis.recommendedOfferMax,
        maximum_offer: analysis.maximumOffer,
        recommended_reserve: analysis.recommendedReserve,
        suggested_retail_price: analysis.suggestedRetailPrice,
        suggested_trade_price: analysis.suggestedTradePrice,
        preferred_channel: analysis.preferredChannel,
        alternative_channel: analysis.alternativeChannel,
        confidence_score: analysis.confidenceScore,
        data_completeness_score: analysis.dataCompletenessScore,
        appraisal_quality_score: analysis.appraisalQualityScore,
        expected_margin: analysis.expectedMargin,
        expected_prep_cost: analysis.expectedPrepCost,
        expected_days_to_sale: analysis.expectedDaysToSale,
        key_risks: analysis.keyRisks,
        missing_information: analysis.missingInformation,
        damage_commercialisation_summary: analysis.damageCommercialisationSummary,
        prep_recommendation: analysis.prepRecommendation,
        channel_recommendation: analysis.channelRecommendation,
        suggested_next_actions: analysis.suggestedNextActions,
        draft_messages: analysis.draftMessages,
        audit_trail: analysis.auditTrail,
      })
      .select("id")
      .returns<{ id: string }>()
      .single();
    if (insertError || !decisionPack) throw insertError ?? new Error("Unable to save decision pack");

    await supabase.from("vehicles").update({ status: statusForRecommendation(analysis.overallRecommendation) }).eq("id", vehicle.id);
    await supabase.from("audit_events").insert({
      organisation_id: vehicle.organisation_id,
      entity_type: "decision_pack",
      entity_id: decisionPack.id,
      action: "analyse_vehicle",
      metadata: { vehicleId: vehicle.id, recommendation: analysis.overallRecommendation },
    });

    return new Response(JSON.stringify({ analysis, decisionPackId: decisionPack.id }), {
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
