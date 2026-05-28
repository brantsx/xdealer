import { z } from "zod";

export const RiskLevelSchema = z.enum(["Low", "Medium", "High", "Critical"]);

export const RecommendedActionSchema = z.enum([
  "Buy",
  "Buy with caution",
  "Reject",
  "Retail",
  "Auction",
  "Trade out",
  "List to dealer marketplace",
  "Do not list",
  "List only to selected dealers",
  "Request more information",
  "Senior review required",
]);

export const ChannelSchema = z.enum([
  "Retail",
  "Auction",
  "Trade out",
  "Dealer marketplace",
  "Direct buyer network",
  "Lease/fleet remarketing",
  "Scrap/breaker",
  "Wholesale",
  "Hold",
]);

export const MarketplaceListingTypeSchema = z.enum([
  "Fixed price",
  "Best offer",
  "Timed auction",
  "Buy it now",
  "Trade-only enquiry",
]);

export const RiskFlagSchema = z.object({
  level: RiskLevelSchema,
  title: z.string().min(2),
  detail: z.string().min(2),
  commercialImpact: z.number(),
});

export const DraftMessagesSchema = z.object({
  customerVendor: z.string().min(2),
  internal: z.string().min(2),
  seniorReview: z.string().min(2),
});

export const AuditTrailItemSchema = z.object({
  label: z.string().min(2),
  detail: z.string().min(2),
  evidence: z.string().min(2),
});

export const MarketplaceRecommendationSchema = z.object({
  shouldList: z.boolean(),
  recommendation: z.enum(["List to dealer marketplace", "Do not list", "List only to selected dealers"]),
  listingType: MarketplaceListingTypeSchema,
  suggestedAskingPrice: z.number().nonnegative(),
  suggestedReserve: z.number().nonnegative(),
  minimumAcceptableOffer: z.number().nonnegative(),
  likelyBuyerType: z.string().min(2),
  rationale: z.string().min(2),
});

export const GeneratedDecisionPackSchema = z.object({
  overallRecommendation: RecommendedActionSchema,
  recommendedOfferMin: z.number().nonnegative(),
  recommendedOfferMax: z.number().nonnegative(),
  maximumOffer: z.number().nonnegative(),
  recommendedReserve: z.number().nonnegative(),
  suggestedRetailPrice: z.number().nonnegative(),
  suggestedTradePrice: z.number().nonnegative(),
  preferredChannel: ChannelSchema,
  alternativeChannel: ChannelSchema,
  confidenceScore: z.number().min(0).max(100),
  dataCompletenessScore: z.number().min(0).max(100),
  appraisalQualityScore: z.number().min(0).max(100),
  expectedMargin: z.number(),
  expectedPrepCost: z.number().nonnegative(),
  expectedDaysToSale: z.number().int().positive(),
  keyRisks: z.array(RiskFlagSchema),
  missingInformation: z.array(z.string()),
  damageCommercialisationSummary: z.string().min(2),
  prepRecommendation: z.string().min(2),
  channelRecommendation: z.string().min(2),
  suggestedNextActions: z.array(z.string()).min(1),
  draftMessages: DraftMessagesSchema,
  auditTrail: z.array(AuditTrailItemSchema).min(1),
  marketplaceRecommendation: MarketplaceRecommendationSchema.optional(),
});

export type GeneratedDecisionPack = z.infer<typeof GeneratedDecisionPackSchema>;

export function validateGeneratedDecisionPack(value: unknown): GeneratedDecisionPack {
  return GeneratedDecisionPackSchema.parse(value);
}
