import type {
  Channel,
  DealerProfile,
  FitLabel,
  MarketplaceAnalysis,
  MarketplaceListing,
  OrganisationRules,
  RiskLevel,
  Vehicle,
} from "../../types";
import { clamp } from "../utils/format";

interface MarketplaceFitInput {
  listing: MarketplaceListing;
  vehicle: Vehicle;
  buyerProfile: DealerProfile;
  buyerRules: OrganisationRules;
  buyerOrganisationId: string;
}

function vehicleAgeYears(vehicle: Vehicle): number {
  return Math.max(0, new Date().getFullYear() - new Date(vehicle.registrationDate).getFullYear());
}

export function fitLabel(score: number): FitLabel {
  if (score >= 82) return "Excellent fit";
  if (score >= 68) return "Good fit";
  if (score >= 50) return "Possible fit";
  return "Poor fit";
}

function riskFromScore(score: number, vehicle: Vehicle, listing: MarketplaceListing): RiskLevel {
  if (vehicle.hpiStatus.includes("Write-off") || vehicle.appraisal.warningLights.trim()) return "Critical";
  if (score < 45 || listing.knownIssues.toLowerCase().includes("mechanical")) return "High";
  if (score < 65 || vehicle.damageEntries.length > 1) return "Medium";
  return "Low";
}

function preferredChannelForBuyer(score: number, risk: RiskLevel): Channel {
  if (risk === "Critical") return "Trade out";
  if (score >= 70 && risk !== "High") return "Retail";
  if (score >= 50) return "Dealer marketplace";
  return "Auction";
}

function valueBandTarget(rules: OrganisationRules, price: number): number {
  const band =
    rules.valueBands.find((candidate) => price >= candidate.minValue && (candidate.maxValue === undefined || price < candidate.maxValue)) ??
    rules.valueBands[rules.valueBands.length - 1];
  return band?.targetMargin ?? 1200;
}

function makeReasons(scoreDeltas: Array<[boolean, number, string, string]>): {
  score: number;
  reasons: string[];
  risksToCheck: string[];
} {
  return scoreDeltas.reduce(
    (accumulator, [condition, delta, positive, negative]) => {
      accumulator.score += condition ? delta : -Math.abs(delta) * 0.65;
      if (condition) accumulator.reasons.push(positive);
      else accumulator.risksToCheck.push(negative);
      return accumulator;
    },
    { score: 55, reasons: [] as string[], risksToCheck: [] as string[] },
  );
}

export function analyseMarketplaceFit(input: MarketplaceFitInput): MarketplaceAnalysis {
  const { listing, vehicle, buyerProfile, buyerRules, buyerOrganisationId } = input;
  const age = vehicleAgeYears(vehicle);
  const priceAnchor = listing.currentHighestBid ?? listing.askingPrice ?? listing.minimumOffer;
  const expectedPrep = vehicle.decisionPack?.expectedPrepCost ?? vehicle.marketInput.expectedPrepBudget;
  const targetMargin = valueBandTarget(buyerRules, priceAnchor);
  const expectedMargin = Math.round(vehicle.marketInput.retailMarketEstimate - priceAnchor - expectedPrep - vehicle.marketInput.buyerFees);
  const scoreParts = makeReasons([
    [
      buyerProfile.preferredMakes.length === 0 || buyerProfile.preferredMakes.includes(vehicle.make),
      12,
      `Matches your preferred ${vehicle.make} stock profile`,
      `${vehicle.make} is not a preferred make for this dealership`,
    ],
    [
      !buyerProfile.excludedMakes.includes(vehicle.make),
      20,
      "Not excluded by your trade profile",
      "Excluded make for your profile",
    ],
    [
      buyerProfile.preferredBodyTypes.includes(vehicle.bodyType),
      10,
      `Matches your preferred ${vehicle.bodyType.toLowerCase()} profile`,
      `${vehicle.bodyType} body style is outside your normal forecourt profile`,
    ],
    [
      buyerProfile.preferredFuelTypes.includes(vehicle.fuelType),
      8,
      `${vehicle.fuelType} matches your preferred fuel mix`,
      `${vehicle.fuelType} does not match your usual stock mix`,
    ],
    [
      age >= buyerProfile.minVehicleAge && age <= buyerProfile.maxVehicleAge,
      9,
      "Vehicle age is within your configured buying range",
      "Vehicle age is outside your configured buying range",
    ],
    [
      vehicle.mileage >= buyerProfile.minMileage && vehicle.mileage <= buyerProfile.maxMileage,
      9,
      "Mileage is inside your normal buying threshold",
      "Mileage is above your usual threshold",
    ],
    [
      priceAnchor >= buyerProfile.minPrice && priceAnchor <= buyerProfile.maxPrice,
      8,
      "Trade price sits inside your configured budget range",
      "Trade price is outside your configured budget range",
    ],
    [
      expectedMargin >= targetMargin,
      14,
      "Strong expected retail margin against your configured target",
      "Expected margin is below your configured target",
    ],
    [
      expectedPrep <= targetMargin * (buyerRules.riskAppetite === "Aggressive" ? 0.85 : buyerRules.riskAppetite === "Balanced" ? 0.65 : 0.5),
      8,
      "Prep exposure is inside your tolerance",
      "Prep risk exceeds your configured tolerance",
    ],
  ]);

  const fitScore = Math.round(clamp(scoreParts.score));
  const riskRating = riskFromScore(fitScore, vehicle, listing);
  const recommendedMaxBid = Math.max(
    0,
    Math.round((vehicle.marketInput.retailMarketEstimate - expectedPrep - targetMargin - vehicle.marketInput.buyerFees) / 50) * 50,
  );
  const tradeDesirabilityScore = Math.round(
    clamp(fitScore + (vehicle.serviceHistory === "Full" || vehicle.serviceHistory === "Main dealer" ? 6 : -4) - vehicle.damageEntries.length * 4),
  );
  const retailFitScore = Math.round(clamp(fitScore + (expectedMargin > targetMargin ? 8 : -10) - (riskRating === "High" ? 10 : 0)));

  return {
    id: `analysis-${listing.id}-${buyerOrganisationId}`,
    listingId: listing.id,
    buyerOrganisationId,
    fitScore,
    fitLabel: fitLabel(fitScore),
    recommendedMaxBid,
    expectedMargin,
    expectedMarginMin: expectedMargin - 450,
    expectedMarginMax: expectedMargin + 650,
    riskRating,
    tradeDesirabilityScore,
    retailFitScore,
    suggestedChannel: preferredChannelForBuyer(fitScore, riskRating),
    reasons: scoreParts.reasons.slice(0, 5),
    risksToCheck: scoreParts.risksToCheck.slice(0, 5),
    analysisJson: {
      priceAnchor,
      targetMargin,
      expectedPrep,
      vehicleAge: age,
      buyerFitSummary:
        fitScore >= 68
          ? "This vehicle should be worth active bidding if the condition disclosure checks out."
          : "This vehicle needs caution against your profile before committing trade money.",
    },
    createdAt: new Date().toISOString(),
  };
}
