export type UUID = string;

export type Role =
  | "Owner"
  | "Admin"
  | "Buyer"
  | "Appraiser"
  | "Remarketing Manager"
  | "Read-only";

export type VehicleSource =
  | "Part-exchange"
  | "Consumer acquisition"
  | "Auction entry"
  | "Lease return"
  | "Fleet disposal"
  | "Dealer stock review"
  | "Trade purchase";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type RecommendedAction =
  | "Buy"
  | "Buy with caution"
  | "Reject"
  | "Retail"
  | "Auction"
  | "Trade out"
  | "Request more information"
  | "Senior review required";

export type Channel = "Retail" | "Auction" | "Trade out" | "Wholesale" | "Hold";

export type VehicleStatus =
  | "Intake"
  | "Needs appraisal"
  | "Ready to analyse"
  | "Analysed"
  | "Senior review"
  | "Accepted"
  | "Overridden"
  | "Bought"
  | "Not bought";

export type FuelType =
  | "Petrol"
  | "Diesel"
  | "Hybrid"
  | "Plug-in hybrid"
  | "Electric";

export type Transmission = "Manual" | "Automatic";

export type BodyType =
  | "Hatchback"
  | "Saloon"
  | "Estate"
  | "SUV"
  | "Coupe"
  | "Convertible"
  | "MPV"
  | "Van";

export type V5CStatus = "Present" | "Not present" | "Awaiting" | "Unknown";

export type ServiceHistory =
  | "Full"
  | "Partial"
  | "Missing"
  | "Main dealer"
  | "Digital"
  | "Unknown";

export type HpiStatus =
  | "Clear"
  | "Finance marker"
  | "Write-off category N"
  | "Write-off category S"
  | "Mileage discrepancy"
  | "Not checked";

export type AppraisalCondition = "Good" | "Minor wear" | "Needs prep" | "Poor" | "Unknown";

export type DamageSeverity = "Light" | "Medium" | "Heavy" | "Structural concern";

export type RepairCategory =
  | "Smart repair"
  | "Alloy refurb"
  | "Paint"
  | "Panel repair"
  | "Mechanical"
  | "Glass"
  | "Interior trim"
  | "Replace";

export type RiskAppetite = "Conservative" | "Balanced" | "Aggressive";

export type IntegrationStatus = "Mocked" | "Planned" | "Connected";

export interface Organisation {
  id: UUID;
  name: string;
  tradingName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: UUID;
  organisationId: UUID;
  fullName: string;
  email: string;
  role: Role;
  siteTeam: string;
  createdAt: string;
  updatedAt: string;
}

export interface DamageEntry {
  id: UUID;
  organisationId: UUID;
  vehicleId: UUID;
  panelLocation: string;
  damageType: string;
  severity: DamageSeverity;
  estimatedRepairCategory: RepairCategory;
  estimatedCost: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appraisal {
  id: UUID;
  organisationId: UUID;
  vehicleId: UUID;
  tyres: AppraisalCondition;
  alloys: AppraisalCondition;
  glass: AppraisalCondition;
  interior: AppraisalCondition;
  paintwork: AppraisalCondition;
  mechanicalNotes: string;
  warningLights: string;
  appraiserId: UUID;
  qualityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehiclePhoto {
  id: UUID;
  organisationId: UUID;
  vehicleId: UUID;
  fileName: string;
  storagePath: string;
  publicUrl: string;
  caption: string;
  createdAt: string;
}

export interface MarketInput {
  id: UUID;
  organisationId: UUID;
  vehicleId: UUID;
  capClean: number;
  capAverage: number;
  capBelow: number;
  retailMarketEstimate: number;
  tradeValueEstimate: number;
  expectedPrepBudget: number;
  buyerFees: number;
  vendorFees: number;
  lastUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: UUID;
  organisationId: UUID;
  vrm: string;
  vin?: string;
  make: string;
  model: string;
  derivative: string;
  registrationDate: string;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  bodyType: BodyType;
  colour: string;
  numberOfKeys: number;
  v5cStatus: V5CStatus;
  serviceHistory: ServiceHistory;
  motExpiry: string;
  motAdvisories: string[];
  hpiStatus: HpiStatus;
  source: VehicleSource;
  siteTeam: string;
  status: VehicleStatus;
  proposedOffer: number;
  assignedUserId: UUID;
  createdAt: string;
  updatedAt: string;
  appraisal: Appraisal;
  damageEntries: DamageEntry[];
  photos: VehiclePhoto[];
  marketInput: MarketInput;
  decisionPack?: DecisionPack;
  outcome?: Outcome;
}

export interface RiskFlag {
  level: RiskLevel;
  title: string;
  detail: string;
  commercialImpact: number;
}

export interface AuditTrailItem {
  label: string;
  detail: string;
  evidence: string;
}

export interface DraftMessages {
  customerVendor: string;
  internal: string;
  seniorReview: string;
}

export interface DecisionPack {
  id: UUID;
  organisationId: UUID;
  vehicleId: UUID;
  overallRecommendation: RecommendedAction;
  recommendedOfferMin: number;
  recommendedOfferMax: number;
  maximumOffer: number;
  recommendedReserve: number;
  suggestedRetailPrice: number;
  suggestedTradePrice: number;
  preferredChannel: Channel;
  alternativeChannel: Channel;
  confidenceScore: number;
  dataCompletenessScore: number;
  appraisalQualityScore: number;
  expectedMargin: number;
  expectedPrepCost: number;
  expectedDaysToSale: number;
  keyRisks: RiskFlag[];
  missingInformation: string[];
  damageCommercialisationSummary: string;
  prepRecommendation: string;
  channelRecommendation: string;
  suggestedNextActions: string[];
  draftMessages: DraftMessages;
  auditTrail: AuditTrailItem[];
  acceptedAt?: string;
  overrideReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionAction {
  id: UUID;
  organisationId: UUID;
  decisionPackId: UUID;
  vehicleId: UUID;
  action:
    | "Accepted"
    | "Overridden"
    | "Senior review"
    | "More information requested"
    | "Bought"
    | "Not bought";
  overrideReason?: string;
  actorId: UUID;
  createdAt: string;
}

export interface ValueBandRule {
  label: string;
  minValue: number;
  maxValue?: number;
  targetMargin: number;
  maxPrepSpend: number;
}

export interface ChannelRule {
  label: string;
  condition: string;
  preferredChannel: Channel;
}

export interface SitePrepAssumption {
  siteTeam: string;
  smartRepair: number;
  alloyRefurb: number;
  paintPerPanel: number;
  mechanicalInspection: number;
}

export interface OrganisationRules {
  id: UUID;
  organisationId: UUID;
  riskAppetite: RiskAppetite;
  minimumConfidenceForAutoApproval: number;
  seniorApprovalThreshold: number;
  retailVsAuctionMarginThreshold: number;
  stockAgeReviewDays: number;
  excludedMakesModels: string[];
  valueBands: ValueBandRule[];
  channelRules: ChannelRule[];
  sitePrepAssumptions: SitePrepAssumption[];
  createdAt: string;
  updatedAt: string;
}

export interface Outcome {
  id: UUID;
  organisationId: UUID;
  vehicleId: UUID;
  decisionPackId: UUID;
  actualPurchasePrice: number;
  actualPrepCost: number;
  actualChannel: Channel;
  actualReserve?: number;
  actualHammerPrice?: number;
  actualRetailSalePrice?: number;
  actualDaysToSale: number;
  actualMargin: number;
  priceReductions: number;
  buyerVendorDisputes: number;
  reappraisalAdjustments: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConfig {
  id: UUID;
  organisationId: UUID;
  name: string;
  status: IntegrationStatus;
  description: string;
  requiredCredentials: string[];
  lastSync?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: UUID;
  organisationId: UUID;
  actorId: UUID;
  entityType: string;
  entityId: UUID;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardMetrics {
  vehiclesAnalysedThisMonth: number;
  averageRecommendationConfidence: number;
  estimatedMarginProtected: number;
  highRiskVehiclesFlagged: number;
  appraisalCompletenessScore: number;
  humanOverrideRate: number;
  vehiclesByChannel: Array<{ channel: Channel; count: number; margin: number }>;
  topRiskThemes: Array<{ theme: string; count: number; impact: number }>;
}
