import type {
  AuditTrailItem,
  Channel,
  OrganisationRules,
  RecommendedAction,
  RiskFlag,
  RiskLevel,
  Vehicle,
} from "../../types";
import { clamp, formatCurrency, getVehicleTitle } from "../utils/format";
import type { AiAnalysisProvider, VehicleAnalysisInput } from "./types";
import type { GeneratedDecisionPack } from "./structuredSchemas";
import { validateGeneratedDecisionPack } from "./structuredSchemas";

const premiumMakes = ["BMW", "Mercedes-Benz", "Audi", "Land Rover", "Range Rover", "Tesla"];

function yearAge(registrationDate: string, generatedAt: string): number {
  return Math.max(0, new Date(generatedAt).getFullYear() - new Date(registrationDate).getFullYear());
}

function roundToNearest(value: number, step = 50): number {
  return Math.round(value / step) * step;
}

function conditionScore(condition: string): number {
  const map: Record<string, number> = {
    Good: 100,
    "Minor wear": 82,
    "Needs prep": 58,
    Poor: 32,
    Unknown: 42,
  };
  return map[condition] ?? 50;
}

function severityWeight(level: RiskLevel): number {
  const map: Record<RiskLevel, number> = {
    Low: 4,
    Medium: 9,
    High: 17,
    Critical: 28,
  };
  return map[level];
}

function completenessScore(vehicle: Vehicle): { score: number; missing: string[] } {
  const checks: Array<[boolean, string]> = [
    [vehicle.vrm.trim().length > 0, "VRM"],
    [vehicle.make.trim().length > 0, "Make"],
    [vehicle.model.trim().length > 0, "Model"],
    [vehicle.registrationDate.trim().length > 0, "Registration date"],
    [vehicle.mileage > 0, "Mileage"],
    [vehicle.motExpiry.trim().length > 0, "MOT expiry"],
    [vehicle.v5cStatus !== "Unknown", "V5C status"],
    [vehicle.hpiStatus !== "Not checked", "HPI check"],
    [vehicle.serviceHistory !== "Unknown", "Service history"],
    [vehicle.marketInput.capClean > 0, "CAP Clean"],
    [vehicle.marketInput.retailMarketEstimate > 0, "Retail market estimate"],
    [vehicle.appraisal.qualityScore > 0, "Appraisal quality score"],
    [vehicle.photos.length > 0, "Vehicle photos"],
  ];
  const missing = checks.filter(([passed]) => !passed).map(([, label]) => label);
  const score = Math.round(((checks.length - missing.length) / checks.length) * 100);
  return { score, missing };
}

function appraisalQualityScore(vehicle: Vehicle): number {
  const values = [
    vehicle.appraisal.tyres,
    vehicle.appraisal.alloys,
    vehicle.appraisal.glass,
    vehicle.appraisal.interior,
    vehicle.appraisal.paintwork,
  ].map(conditionScore);
  const base = values.reduce((sum, value) => sum + value, 0) / values.length;
  const notesPenalty = vehicle.appraisal.mechanicalNotes.length < 12 ? 8 : 0;
  const photoBonus = Math.min(8, vehicle.photos.length * 2);
  return Math.round(clamp(base - notesPenalty + photoBonus));
}

function targetRule(rules: OrganisationRules, tradeValue: number) {
  return (
    rules.valueBands.find(
      (band) => tradeValue >= band.minValue && (band.maxValue === undefined || tradeValue < band.maxValue),
    ) ?? rules.valueBands[rules.valueBands.length - 1]
  );
}

function hasAdvisory(vehicle: Vehicle, words: string[]): boolean {
  return vehicle.motAdvisories.some((advisory) =>
    words.some((word) => advisory.toLowerCase().includes(word.toLowerCase())),
  );
}

function determineBaseChannel(vehicle: Vehicle, age: number, expectedMargin: number, prepCost: number): Channel {
  const market = vehicle.marketInput;
  const cleanAppraisal =
    ["Good", "Minor wear"].includes(vehicle.appraisal.paintwork) &&
    ["Good", "Minor wear"].includes(vehicle.appraisal.interior) &&
    vehicle.appraisal.warningLights.trim().length === 0;

  if (vehicle.hpiStatus.includes("Write-off") || vehicle.hpiStatus === "Mileage discrepancy") return "Trade out";
  if (age > 8 || vehicle.mileage > 95000) return expectedMargin > 900 ? "Auction" : "Trade out";
  if (prepCost > market.capClean * 0.12) return "Auction";
  if (cleanAppraisal && expectedMargin > 1200) return "Retail";
  if (vehicle.source === "Auction entry" || vehicle.source === "Fleet disposal") return "Auction";
  return "Retail";
}

function makeRisk(level: RiskLevel, title: string, detail: string, impact: number): RiskFlag {
  return { level, title, detail, commercialImpact: Math.round(impact) };
}

export class MockAiAnalysisProvider implements AiAnalysisProvider {
  async analyseVehicle(input: VehicleAnalysisInput): Promise<GeneratedDecisionPack> {
    const { vehicle, organisationRules, generatedAt } = input;
    const market = vehicle.marketInput;
    const vehicleAge = yearAge(vehicle.registrationDate, generatedAt);
    const premium = premiumMakes.includes(vehicle.make);
    const valueRule = targetRule(organisationRules, market.tradeValueEstimate);
    const damagePrep = vehicle.damageEntries.reduce((sum, entry) => sum + entry.estimatedCost, 0);
    const motPrep =
      (hasAdvisory(vehicle, ["tyre", "tread"]) ? 240 : 0) +
      (hasAdvisory(vehicle, ["brake"]) ? 320 : 0) +
      (hasAdvisory(vehicle, ["suspension", "bush"]) ? 420 : 0);
    const expectedPrepCost = roundToNearest(Math.max(market.expectedPrepBudget, damagePrep + motPrep), 25);
    const retailMargin =
      market.retailMarketEstimate - vehicle.proposedOffer - expectedPrepCost - market.buyerFees - market.vendorFees;
    const tradeMargin = market.tradeValueEstimate - vehicle.proposedOffer - expectedPrepCost - market.buyerFees;
    const expectedMargin = Math.round(Math.max(retailMargin, tradeMargin));
    const data = completenessScore(vehicle);
    const appraisalScore = appraisalQualityScore(vehicle);
    const risks: RiskFlag[] = [];

    if (vehicle.proposedOffer > market.capClean && appraisalScore < 70) {
      risks.push(
        makeRisk(
          "High",
          "Offer above CAP Clean with weak appraisal",
          "The proposed money is ahead of CAP Clean while cosmetic or mechanical evidence is not strong enough.",
          vehicle.proposedOffer - market.capClean + 350,
        ),
      );
    }
    if (hasAdvisory(vehicle, ["tyre", "brake", "suspension"])) {
      risks.push(
        makeRisk(
          "Medium",
          "MOT advisories need commercialising",
          "Tyre, brake or suspension advisories are likely to create prep spend or buyer objections.",
          motPrep,
        ),
      );
    }
    if (premium && ["Missing", "Partial", "Unknown"].includes(vehicle.serviceHistory)) {
      risks.push(
        makeRisk(
          "High",
          "Premium vehicle service history gap",
          "Missing or partial history on a premium model will reduce confidence and may affect retail desirability.",
          850,
        ),
      );
    }
    if (expectedPrepCost > valueRule.maxPrepSpend) {
      risks.push(
        makeRisk(
          "High",
          "Prep spend exceeds rule threshold",
          `Expected prep of ${formatCurrency(expectedPrepCost)} exceeds the ${valueRule.label} threshold.`,
          expectedPrepCost - valueRule.maxPrepSpend,
        ),
      );
    }
    if (vehicle.hpiStatus !== "Clear") {
      risks.push(
        makeRisk(
          vehicle.hpiStatus.includes("Write-off") || vehicle.hpiStatus === "Finance marker" ? "Critical" : "High",
          "HPI marker requires control",
          `${vehicle.hpiStatus} must be resolved or priced into the route to market.`,
          1500,
        ),
      );
    }
    if (vehicleAge > 8 && vehicle.mileage > 90000) {
      risks.push(
        makeRisk(
          "Medium",
          "Age and mileage exposure",
          "Older, higher mileage stock has a higher post-sale dispute and prep escalation risk.",
          600,
        ),
      );
    }
    if (vehicle.appraisal.warningLights.trim().length > 0) {
      risks.push(
        makeRisk(
          "Critical",
          "Warning light reported",
          "A dashboard warning light should block auto-approval until diagnosis is complete.",
          1200,
        ),
      );
    }
    if (data.score < 60) {
      risks.push(
        makeRisk(
          "High",
          "Incomplete appraisal pack",
          "The decision pack does not have enough evidence for an automated commercial decision.",
          500,
        ),
      );
    }

    const confidencePenalty = risks.reduce((sum, risk) => sum + severityWeight(risk.level), 0);
    const confidenceScore = Math.round(
      clamp(data.score * 0.42 + appraisalScore * 0.36 + 24 - confidencePenalty),
    );
    const baseChannel = determineBaseChannel(vehicle, vehicleAge, expectedMargin, expectedPrepCost);
    let preferredChannel = baseChannel;
    let alternativeChannel: Channel = baseChannel === "Retail" ? "Auction" : "Trade out";
    let recommendation: RecommendedAction =
      baseChannel === "Retail" ? "Retail" : baseChannel === "Auction" ? "Auction" : "Trade out";

    if (data.score < 60) {
      recommendation = "Request more information";
      preferredChannel = "Hold";
      alternativeChannel = "Auction";
    } else if (confidenceScore < organisationRules.minimumConfidenceForAutoApproval) {
      recommendation = "Senior review required";
      preferredChannel = baseChannel;
      alternativeChannel = baseChannel === "Retail" ? "Auction" : "Trade out";
    } else if (vehicle.hpiStatus.includes("Write-off") || vehicle.appraisal.warningLights.trim().length > 0) {
      recommendation = "Trade out";
      preferredChannel = "Trade out";
      alternativeChannel = "Auction";
    } else if (expectedMargin < valueRule.targetMargin * 0.55) {
      recommendation = "Reject";
      preferredChannel = "Hold";
      alternativeChannel = "Trade out";
    } else if (expectedPrepCost > valueRule.maxPrepSpend || expectedMargin < valueRule.targetMargin) {
      recommendation = "Auction";
      preferredChannel = "Auction";
      alternativeChannel = "Trade out";
    } else if (risks.some((risk) => risk.level === "High")) {
      recommendation = "Buy with caution";
      preferredChannel = baseChannel;
      alternativeChannel = baseChannel === "Retail" ? "Auction" : "Trade out";
    } else if (preferredChannel === "Retail") {
      recommendation = "Retail";
      alternativeChannel = "Auction";
    }

    const maximumOffer = roundToNearest(
      Math.max(
        0,
        Math.min(
          market.capClean + (organisationRules.riskAppetite === "Aggressive" ? 250 : 0),
          market.retailMarketEstimate - valueRule.targetMargin - expectedPrepCost - market.buyerFees,
        ),
      ),
    );
    const recommendedOfferMin = roundToNearest(Math.max(0, maximumOffer - 650));
    const recommendedOfferMax = roundToNearest(Math.max(recommendedOfferMin, maximumOffer - 150));
    const recommendedReserve = roundToNearest(
      preferredChannel === "Auction" ? market.capAverage - expectedPrepCost * 0.35 : market.tradeValueEstimate,
    );
    const suggestedRetailPrice = roundToNearest(market.retailMarketEstimate + (premium ? 250 : 0), 100);
    const suggestedTradePrice = roundToNearest(market.tradeValueEstimate - expectedPrepCost * 0.2);
    const expectedDaysToSale =
      preferredChannel === "Retail"
        ? vehicleAge > 6
          ? 42
          : 29
        : preferredChannel === "Auction"
          ? 12
          : 7;

    const title = getVehicleTitle(vehicle);
    const damageSummary =
      vehicle.damageEntries.length === 0
        ? "No damage entries logged. Validate with a full image set before committing stock money."
        : vehicle.damageEntries
            .map((entry) => `${entry.panelLocation}: ${entry.damageType.toLowerCase()} (${entry.estimatedRepairCategory})`)
            .join("; ");
    const prepRecommendation =
      expectedPrepCost > valueRule.maxPrepSpend
        ? "Cap prep to safety-critical and saleability work only; route away from retail unless the buy price moves."
        : preferredChannel === "Retail"
          ? "Complete retail-critical prep, prioritising tyres, wheels, paint visibility and any MOT advisory items."
          : "Avoid full retail prep. Prepare to an auction or trade standard and protect speed of disposal.";
    const channelRecommendation =
      preferredChannel === "Retail"
        ? "Retail is commercially viable if the vehicle is bought inside the recommended range and prep is controlled."
        : preferredChannel === "Auction"
          ? "Auction is the preferred route because prep exposure or margin pressure makes retail less attractive."
          : preferredChannel === "Hold"
            ? "Hold the decision until the missing information is supplied."
            : "Trade disposal is preferred to avoid retail warranty and post-sale dispute exposure.";
    const auditTrail: AuditTrailItem[] = [
      {
        label: "Market anchor",
        detail: `CAP Clean ${formatCurrency(market.capClean)}, Average ${formatCurrency(
          market.capAverage,
        )}, Below ${formatCurrency(market.capBelow)} used as valuation guardrails.`,
        evidence: "Mock CAP/HPI valuation adapter",
      },
      {
        label: "Prep exposure",
        detail: `${formatCurrency(expectedPrepCost)} expected prep includes appraisal damage and MOT advisory assumptions.`,
        evidence: `${vehicle.damageEntries.length} damage entries, ${vehicle.motAdvisories.length} MOT advisories`,
      },
      {
        label: "Rules applied",
        detail: `${valueRule.label} band requires ${formatCurrency(valueRule.targetMargin)} target margin and ${formatCurrency(
          valueRule.maxPrepSpend,
        )} max prep.`,
        evidence: `Risk appetite: ${organisationRules.riskAppetite}`,
      },
    ];

    const pack: GeneratedDecisionPack = {
      overallRecommendation: recommendation,
      recommendedOfferMin,
      recommendedOfferMax,
      maximumOffer,
      recommendedReserve: Math.max(0, recommendedReserve),
      suggestedRetailPrice,
      suggestedTradePrice,
      preferredChannel,
      alternativeChannel,
      confidenceScore,
      dataCompletenessScore: data.score,
      appraisalQualityScore: appraisalScore,
      expectedMargin,
      expectedPrepCost,
      expectedDaysToSale,
      keyRisks: risks,
      missingInformation: data.missing,
      damageCommercialisationSummary: damageSummary,
      prepRecommendation,
      channelRecommendation,
      suggestedNextActions: [
        recommendation === "Request more information"
          ? "Complete missing appraisal fields and upload a full image set"
          : "Share the decision pack with the relevant buyer or remarketing manager",
        recommendation === "Senior review required"
          ? "Send to senior review before making or changing an offer"
          : `Keep the offer at or below ${formatCurrency(maximumOffer)}`,
        preferredChannel === "Retail"
          ? "Book retail-critical prep only after buy price is agreed"
          : "Confirm auction or trade route before committing further prep spend",
      ],
      draftMessages: {
        customerVendor: `We have reviewed ${vehicle.vrm} and can proceed subject to appraisal evidence and a maximum commercial position of ${formatCurrency(
          maximumOffer,
        )}.`,
        internal: `${title}: ${recommendation}. Preferred route ${preferredChannel}; expected margin ${formatCurrency(
          expectedMargin,
        )}; confidence ${confidenceScore}%.`,
        seniorReview: `${vehicle.vrm} requires senior review because confidence is ${confidenceScore}% and key exposure is ${risks
          .map((risk) => risk.title)
          .join(", ") || "commercial margin control"}.`,
      },
      auditTrail,
    };

    return validateGeneratedDecisionPack(pack);
  }
}
