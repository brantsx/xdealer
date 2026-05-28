import type {
  Appraisal,
  AuditTrailItem,
  Channel,
  DamageEntry,
  DecisionAction,
  DecisionPack,
  DraftMessages,
  IntegrationConfig,
  MarketInput,
  MarketplaceRecommendation,
  Organisation,
  OrganisationRules,
  Outcome,
  Profile,
  RecommendedAction,
  RiskAppetite,
  RiskFlag,
  Vehicle,
  VehiclePhoto,
} from "../../types";
import { supabase } from "./client";

type JsonRecord = Record<string, unknown>;

interface OrganisationRow {
  id: string;
  name: string;
  trading_name: string;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  auth_user_id: string | null;
  organisation_id: string;
  full_name: string;
  email: string;
  role: Profile["role"];
  site_team: string;
  created_at: string;
  updated_at: string;
}

interface VehicleRow {
  id: string;
  organisation_id: string;
  vrm: string;
  vin: string | null;
  make: string;
  model: string;
  derivative: string;
  registration_date: string;
  mileage: number;
  fuel_type: Vehicle["fuelType"];
  transmission: Vehicle["transmission"];
  body_type: Vehicle["bodyType"];
  colour: string;
  number_of_keys: number;
  v5c_status: Vehicle["v5cStatus"];
  service_history: Vehicle["serviceHistory"];
  mot_expiry: string;
  mot_advisories: string[];
  hpi_status: Vehicle["hpiStatus"];
  source: Vehicle["source"];
  site_team: string;
  status: Vehicle["status"];
  proposed_offer: number;
  assigned_user_id: string;
  created_at: string;
  updated_at: string;
}

interface AppraisalRow {
  id: string;
  organisation_id: string;
  vehicle_id: string;
  tyres: Appraisal["tyres"];
  alloys: Appraisal["alloys"];
  glass: Appraisal["glass"];
  interior: Appraisal["interior"];
  paintwork: Appraisal["paintwork"];
  mechanical_notes: string;
  warning_lights: string;
  appraiser_id: string;
  quality_score: number;
  created_at: string;
  updated_at: string;
}

interface DamageEntryRow {
  id: string;
  organisation_id: string;
  vehicle_id: string;
  panel_location: string;
  damage_type: string;
  severity: DamageEntry["severity"];
  estimated_repair_category: DamageEntry["estimatedRepairCategory"];
  estimated_cost: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface VehiclePhotoRow {
  id: string;
  organisation_id: string;
  vehicle_id: string;
  file_name: string;
  storage_path: string;
  public_url: string | null;
  caption: string;
  created_at: string;
}

interface MarketInputRow {
  id: string;
  organisation_id: string;
  vehicle_id: string;
  cap_clean: number;
  cap_average: number;
  cap_below: number;
  retail_market_estimate: number;
  trade_value_estimate: number;
  expected_prep_budget: number;
  buyer_fees: number;
  vendor_fees: number;
  last_updated_at: string;
  created_at: string;
  updated_at: string;
}

interface DecisionPackRow {
  id: string;
  organisation_id: string;
  vehicle_id: string;
  overall_recommendation: RecommendedAction;
  recommended_offer_min: number;
  recommended_offer_max: number;
  maximum_offer: number;
  recommended_reserve: number;
  suggested_retail_price: number;
  suggested_trade_price: number;
  preferred_channel: Channel;
  alternative_channel: Channel;
  confidence_score: number;
  data_completeness_score: number;
  appraisal_quality_score: number;
  expected_margin: number;
  expected_prep_cost: number;
  expected_days_to_sale: number;
  key_risks: RiskFlag[];
  missing_information: string[];
  damage_commercialisation_summary: string;
  prep_recommendation: string;
  channel_recommendation: string;
  suggested_next_actions: string[];
  draft_messages: DraftMessages;
  audit_trail: AuditTrailItem[];
  marketplace_recommendation: MarketplaceRecommendation | null;
  accepted_at: string | null;
  override_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface OrganisationRulesRow {
  id: string;
  organisation_id: string;
  risk_appetite: RiskAppetite;
  minimum_confidence_for_auto_approval: number;
  senior_approval_threshold: number;
  retail_vs_auction_margin_threshold: number;
  stock_age_review_days: number;
  excluded_makes_models: string[];
  value_bands: OrganisationRules["valueBands"];
  channel_rules: OrganisationRules["channelRules"];
  site_prep_assumptions: OrganisationRules["sitePrepAssumptions"];
  created_at: string;
  updated_at: string;
}

interface IntegrationRow {
  id: string;
  organisation_id: string;
  name: string;
  status: IntegrationConfig["status"];
  description: string;
  required_credentials: string[];
  last_sync: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

interface OutcomeRow {
  id: string;
  organisation_id: string;
  vehicle_id: string;
  decision_pack_id: string;
  actual_purchase_price: number;
  actual_prep_cost: number;
  actual_channel: Channel;
  actual_reserve: number | null;
  actual_hammer_price: number | null;
  actual_retail_sale_price: number | null;
  actual_days_to_sale: number;
  actual_margin: number;
  price_reductions: number;
  buyer_vendor_disputes: number;
  reappraisal_adjustments: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AuthWorkspace {
  profile: Profile;
  organisation: Organisation;
}

export interface TenantData {
  organisation: Organisation;
  profiles: Profile[];
  vehicles: Vehicle[];
  rules: OrganisationRules;
  integrations: IntegrationConfig[];
}

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function mapOrganisation(row: OrganisationRow): Organisation {
  return {
    id: row.id,
    name: row.name,
    tradingName: row.trading_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    siteTeam: row.site_team,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAppraisal(row: AppraisalRow): Appraisal {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    vehicleId: row.vehicle_id,
    tyres: row.tyres,
    alloys: row.alloys,
    glass: row.glass,
    interior: row.interior,
    paintwork: row.paintwork,
    mechanicalNotes: row.mechanical_notes,
    warningLights: row.warning_lights,
    appraiserId: row.appraiser_id,
    qualityScore: row.quality_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDamageEntry(row: DamageEntryRow): DamageEntry {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    vehicleId: row.vehicle_id,
    panelLocation: row.panel_location,
    damageType: row.damage_type,
    severity: row.severity,
    estimatedRepairCategory: row.estimated_repair_category,
    estimatedCost: row.estimated_cost,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVehiclePhoto(row: VehiclePhotoRow): VehiclePhoto {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    vehicleId: row.vehicle_id,
    fileName: row.file_name,
    storagePath: row.storage_path,
    publicUrl: row.public_url ?? "/assets/vehicle-placeholder.svg",
    caption: row.caption,
    createdAt: row.created_at,
  };
}

function mapMarketInput(row: MarketInputRow): MarketInput {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    vehicleId: row.vehicle_id,
    capClean: row.cap_clean,
    capAverage: row.cap_average,
    capBelow: row.cap_below,
    retailMarketEstimate: row.retail_market_estimate,
    tradeValueEstimate: row.trade_value_estimate,
    expectedPrepBudget: row.expected_prep_budget,
    buyerFees: row.buyer_fees,
    vendorFees: row.vendor_fees,
    lastUpdatedAt: row.last_updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDecisionPack(row: DecisionPackRow): DecisionPack {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    vehicleId: row.vehicle_id,
    overallRecommendation: row.overall_recommendation,
    recommendedOfferMin: row.recommended_offer_min,
    recommendedOfferMax: row.recommended_offer_max,
    maximumOffer: row.maximum_offer,
    recommendedReserve: row.recommended_reserve,
    suggestedRetailPrice: row.suggested_retail_price,
    suggestedTradePrice: row.suggested_trade_price,
    preferredChannel: row.preferred_channel,
    alternativeChannel: row.alternative_channel,
    confidenceScore: row.confidence_score,
    dataCompletenessScore: row.data_completeness_score,
    appraisalQualityScore: row.appraisal_quality_score,
    expectedMargin: row.expected_margin,
    expectedPrepCost: row.expected_prep_cost,
    expectedDaysToSale: row.expected_days_to_sale,
    keyRisks: row.key_risks,
    missingInformation: row.missing_information,
    damageCommercialisationSummary: row.damage_commercialisation_summary,
    prepRecommendation: row.prep_recommendation,
    channelRecommendation: row.channel_recommendation,
    suggestedNextActions: row.suggested_next_actions,
    draftMessages: row.draft_messages,
    auditTrail: row.audit_trail,
    marketplaceRecommendation: row.marketplace_recommendation ?? undefined,
    acceptedAt: row.accepted_at ?? undefined,
    overrideReason: row.override_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRules(row: OrganisationRulesRow): OrganisationRules {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    riskAppetite: row.risk_appetite,
    minimumConfidenceForAutoApproval: row.minimum_confidence_for_auto_approval,
    seniorApprovalThreshold: row.senior_approval_threshold,
    retailVsAuctionMarginThreshold: row.retail_vs_auction_margin_threshold,
    stockAgeReviewDays: row.stock_age_review_days,
    excludedMakesModels: row.excluded_makes_models,
    valueBands: row.value_bands,
    channelRules: row.channel_rules,
    sitePrepAssumptions: row.site_prep_assumptions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapIntegration(row: IntegrationRow): IntegrationConfig {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    name: row.name,
    status: row.status,
    description: row.description,
    requiredCredentials: row.required_credentials,
    lastSync: row.last_sync ?? undefined,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOutcome(row: OutcomeRow): Outcome {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    vehicleId: row.vehicle_id,
    decisionPackId: row.decision_pack_id,
    actualPurchasePrice: row.actual_purchase_price,
    actualPrepCost: row.actual_prep_cost,
    actualChannel: row.actual_channel,
    actualReserve: row.actual_reserve ?? undefined,
    actualHammerPrice: row.actual_hammer_price ?? undefined,
    actualRetailSalePrice: row.actual_retail_sale_price ?? undefined,
    actualDaysToSale: row.actual_days_to_sale,
    actualMargin: row.actual_margin,
    priceReductions: row.price_reductions,
    buyerVendorDisputes: row.buyer_vendor_disputes,
    reappraisalAdjustments: row.reappraisal_adjustments,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function vehicleRow(vehicle: Vehicle): JsonRecord {
  return {
    id: vehicle.id,
    organisation_id: vehicle.organisationId,
    vrm: vehicle.vrm,
    vin: vehicle.vin ?? null,
    make: vehicle.make,
    model: vehicle.model,
    derivative: vehicle.derivative,
    registration_date: vehicle.registrationDate,
    mileage: vehicle.mileage,
    fuel_type: vehicle.fuelType,
    transmission: vehicle.transmission,
    body_type: vehicle.bodyType,
    colour: vehicle.colour,
    number_of_keys: vehicle.numberOfKeys,
    v5c_status: vehicle.v5cStatus,
    service_history: vehicle.serviceHistory,
    mot_expiry: vehicle.motExpiry,
    mot_advisories: vehicle.motAdvisories,
    hpi_status: vehicle.hpiStatus,
    source: vehicle.source,
    site_team: vehicle.siteTeam,
    status: vehicle.status,
    proposed_offer: vehicle.proposedOffer,
    assigned_user_id: vehicle.assignedUserId,
  };
}

function appraisalRow(appraisal: Appraisal): JsonRecord {
  return {
    id: appraisal.id,
    organisation_id: appraisal.organisationId,
    vehicle_id: appraisal.vehicleId,
    tyres: appraisal.tyres,
    alloys: appraisal.alloys,
    glass: appraisal.glass,
    interior: appraisal.interior,
    paintwork: appraisal.paintwork,
    mechanical_notes: appraisal.mechanicalNotes,
    warning_lights: appraisal.warningLights,
    appraiser_id: appraisal.appraiserId,
    quality_score: appraisal.qualityScore,
  };
}

function damageEntryRow(entry: DamageEntry): JsonRecord {
  return {
    id: entry.id,
    organisation_id: entry.organisationId,
    vehicle_id: entry.vehicleId,
    panel_location: entry.panelLocation,
    damage_type: entry.damageType,
    severity: entry.severity,
    estimated_repair_category: entry.estimatedRepairCategory,
    estimated_cost: entry.estimatedCost,
    notes: entry.notes,
  };
}

function vehiclePhotoRow(photo: VehiclePhoto): JsonRecord {
  return {
    id: photo.id,
    organisation_id: photo.organisationId,
    vehicle_id: photo.vehicleId,
    file_name: photo.fileName,
    storage_path: photo.storagePath,
    public_url: photo.publicUrl,
    caption: photo.caption,
  };
}

function marketInputRow(input: MarketInput): JsonRecord {
  return {
    id: input.id,
    organisation_id: input.organisationId,
    vehicle_id: input.vehicleId,
    cap_clean: input.capClean,
    cap_average: input.capAverage,
    cap_below: input.capBelow,
    retail_market_estimate: input.retailMarketEstimate,
    trade_value_estimate: input.tradeValueEstimate,
    expected_prep_budget: input.expectedPrepBudget,
    buyer_fees: input.buyerFees,
    vendor_fees: input.vendorFees,
    last_updated_at: input.lastUpdatedAt,
  };
}

function rulesRow(rules: OrganisationRules): JsonRecord {
  return {
    id: rules.id,
    organisation_id: rules.organisationId,
    risk_appetite: rules.riskAppetite,
    minimum_confidence_for_auto_approval: rules.minimumConfidenceForAutoApproval,
    senior_approval_threshold: rules.seniorApprovalThreshold,
    retail_vs_auction_margin_threshold: rules.retailVsAuctionMarginThreshold,
    stock_age_review_days: rules.stockAgeReviewDays,
    excluded_makes_models: rules.excludedMakesModels,
    value_bands: rules.valueBands,
    channel_rules: rules.channelRules,
    site_prep_assumptions: rules.sitePrepAssumptions,
  };
}

function outcomeRow(outcome: Outcome): JsonRecord {
  return {
    id: outcome.id,
    organisation_id: outcome.organisationId,
    vehicle_id: outcome.vehicleId,
    decision_pack_id: outcome.decisionPackId,
    actual_purchase_price: outcome.actualPurchasePrice,
    actual_prep_cost: outcome.actualPrepCost,
    actual_channel: outcome.actualChannel,
    actual_reserve: outcome.actualReserve ?? null,
    actual_hammer_price: outcome.actualHammerPrice ?? null,
    actual_retail_sale_price: outcome.actualRetailSalePrice ?? null,
    actual_days_to_sale: outcome.actualDaysToSale,
    actual_margin: outcome.actualMargin,
    price_reductions: outcome.priceReductions,
    buyer_vendor_disputes: outcome.buyerVendorDisputes,
    reappraisal_adjustments: outcome.reappraisalAdjustments,
    notes: outcome.notes,
  };
}

export async function fetchAuthWorkspace(authUserId: string): Promise<AuthWorkspace | null> {
  const client = requireClient();
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .returns<ProfileRow>()
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return null;
  const profileRow = profile as unknown as ProfileRow;

  const { data: organisation, error: organisationError } = await client
    .from("organisations")
    .select("*")
    .eq("id", profileRow.organisation_id)
    .returns<OrganisationRow>()
    .single();
  if (organisationError) throw organisationError;
  return {
    profile: mapProfile(profileRow),
    organisation: mapOrganisation(organisation),
  };
}

export async function createOnboardingWorkspace({
  authUserId,
  email,
  fullName,
  organisationName,
}: {
  authUserId: string;
  email: string;
  fullName: string;
  organisationName: string;
}): Promise<AuthWorkspace> {
  const client = requireClient();
  const timestamp = new Date().toISOString();
  const organisationId = crypto.randomUUID();
  const profileId = crypto.randomUUID();
  const organisationRowValue: OrganisationRow = {
    id: organisationId,
    name: organisationName,
    trading_name: organisationName,
    created_at: timestamp,
    updated_at: timestamp,
  };
  const { error: organisationError } = await client.from("organisations").insert(organisationRowValue);
  if (organisationError) throw organisationError;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .insert({
      id: profileId,
      auth_user_id: authUserId,
      organisation_id: organisationId,
      full_name: fullName,
      email,
      role: "Owner",
      site_team: "Group Buying",
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select("*")
    .returns<ProfileRow>()
    .single();
  if (profileError) throw profileError;

  const { error: rulesError } = await client.from("organisation_rules").insert({
    id: crypto.randomUUID(),
    organisation_id: organisationId,
    risk_appetite: "Balanced",
    minimum_confidence_for_auto_approval: 74,
    senior_approval_threshold: 25000,
    retail_vs_auction_margin_threshold: 1200,
    stock_age_review_days: 55,
    excluded_makes_models: [],
    value_bands: [
      { label: "Under £10k", minValue: 0, maxValue: 10000, targetMargin: 950, maxPrepSpend: 850 },
      { label: "£10k to £20k", minValue: 10000, maxValue: 20000, targetMargin: 1450, maxPrepSpend: 1350 },
      { label: "£20k to £35k", minValue: 20000, maxValue: 35000, targetMargin: 2100, maxPrepSpend: 1900 },
      { label: "Over £35k", minValue: 35000, targetMargin: 3000, maxPrepSpend: 2600 },
    ],
    channel_rules: [
      {
        label: "Clean desirable retail stock",
        condition: "Under 6 years, under 60k miles, clear HPI, appraisal quality above 78",
        preferredChannel: "Retail",
      },
      {
        label: "Older or high mileage stock",
        condition: "Over 8 years or over 95k miles",
        preferredChannel: "Auction",
      },
      {
        label: "HPI or mechanical exposure",
        condition: "Write-off marker, finance marker, warning light or unresolved mechanical note",
        preferredChannel: "Trade out",
      },
    ],
    site_prep_assumptions: [
      { siteTeam: "Group Buying", smartRepair: 150, alloyRefurb: 90, paintPerPanel: 290, mechanicalInspection: 95 },
    ],
    created_at: timestamp,
    updated_at: timestamp,
  });
  if (rulesError) throw rulesError;

  const integrationRows = [
    ["CAP/HPI valuation data", "Mocked", "CAP-style clean, average and below valuations with HPI provenance markers.", ["CAP account ID", "HPI API key"], "Valuation"],
    ["DVSA MOT history", "Planned", "Future MOT expiry, mileage, pass/fail and advisory history via DVSA.", ["DVSA client ID", "DVSA client secret"], "Compliance"],
    ["Auto Trader style retail market data", "Mocked", "Retail market estimate, comparable supply and advertised days.", ["Retail market API key"], "Market"],
    ["Auction platform", "Mocked", "Auction entry, reserve management and hammer result capture.", ["Auction platform token"], "Disposal"],
    ["DMS", "Planned", "Stock records, purchase orders and sold vehicle outcomes.", ["DMS endpoint", "OAuth client"], "Operations"],
    ["CRM", "Planned", "Customer acquisition source, vendor comms and buyer notes.", ["CRM workspace ID", "OAuth client"], "Customer"],
    ["Refurbishment/bodyshop", "Planned", "Prep estimates, booking status and actual repair invoices.", ["Bodyshop endpoint", "API key"], "Prep"],
    ["Transport provider", "Planned", "Collection, delivery and inter-site movement updates.", ["Transport provider token"], "Logistics"],
    ["Webhooks", "Planned", "Outbound decision pack and outcome events for downstream systems.", ["Webhook signing secret"], "Platform"],
    ["CSV import/export", "Mocked", "Bulk vehicle intake, decision pack export and outcome upload.", ["No credentials required"], "Data"],
  ] as const;
  const { error: integrationsError } = await client.from("integrations").insert(
    integrationRows.map(([name, status, description, requiredCredentials, category]) => ({
      id: crypto.randomUUID(),
      organisation_id: organisationId,
      name,
      status,
      description,
      required_credentials: requiredCredentials,
      last_sync: status === "Mocked" ? timestamp : null,
      category,
      created_at: timestamp,
      updated_at: timestamp,
    })),
  );
  if (integrationsError) throw integrationsError;

  await client.from("dealer_profiles").insert({
    id: crypto.randomUUID(),
    organisation_id: organisationId,
    trading_name: organisationName,
    company_number: "Pending",
    address: "Trading address pending",
    postcode_area: "UK",
    contact_name: fullName,
    phone: "Pending",
    email,
    description: "New xDealer marketplace profile pending verification.",
    stock_wanted: "Configure preferred stock profile.",
    stock_not_wanted: "Configure excluded stock profile.",
    preferred_makes: [],
    excluded_makes: [],
    preferred_body_types: ["Hatchback", "SUV", "Estate"],
    preferred_fuel_types: ["Petrol", "Diesel", "Hybrid", "Electric"],
    min_vehicle_age: 0,
    max_vehicle_age: 10,
    min_mileage: 0,
    max_mileage: 100000,
    min_price: 0,
    max_price: 50000,
    transport_radius_miles: 100,
    verified_status: "Pending",
    rating: 0,
    trade_terms: "Trade terms pending.",
    created_at: timestamp,
    updated_at: timestamp,
  });

  return {
    profile: mapProfile(profile),
    organisation: mapOrganisation(organisationRowValue),
  };
}

export async function fetchTenantData(organisation: Organisation): Promise<TenantData> {
  const client = requireClient();
  const [
    profileResult,
    vehicleResult,
    appraisalResult,
    damageResult,
    photoResult,
    marketResult,
    packResult,
    rulesResult,
    outcomeResult,
    integrationResult,
  ] = await Promise.all([
    client.from("profiles").select("*").eq("organisation_id", organisation.id).returns<ProfileRow[]>(),
    client.from("vehicles").select("*").eq("organisation_id", organisation.id).order("created_at", { ascending: false }).returns<VehicleRow[]>(),
    client.from("appraisals").select("*").eq("organisation_id", organisation.id).returns<AppraisalRow[]>(),
    client.from("damage_entries").select("*").eq("organisation_id", organisation.id).returns<DamageEntryRow[]>(),
    client.from("vehicle_photos").select("*").eq("organisation_id", organisation.id).returns<VehiclePhotoRow[]>(),
    client.from("market_inputs").select("*").eq("organisation_id", organisation.id).returns<MarketInputRow[]>(),
    client
      .from("decision_packs")
      .select("*")
      .eq("organisation_id", organisation.id)
      .order("created_at", { ascending: false })
      .returns<DecisionPackRow[]>(),
    client.from("organisation_rules").select("*").eq("organisation_id", organisation.id).returns<OrganisationRulesRow>().single(),
    client.from("outcomes").select("*").eq("organisation_id", organisation.id).returns<OutcomeRow[]>(),
    client.from("integrations").select("*").eq("organisation_id", organisation.id).returns<IntegrationRow[]>(),
  ]);

  const results = [
    profileResult,
    vehicleResult,
    appraisalResult,
    damageResult,
    photoResult,
    marketResult,
    packResult,
    outcomeResult,
    integrationResult,
  ];
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
  if (rulesResult.error) throw rulesResult.error;

  const appraisalsByVehicle = new Map((appraisalResult.data ?? []).map((row) => [row.vehicle_id, mapAppraisal(row)]));
  const marketsByVehicle = new Map((marketResult.data ?? []).map((row) => [row.vehicle_id, mapMarketInput(row)]));
  const outcomesByVehicle = new Map((outcomeResult.data ?? []).map((row) => [row.vehicle_id, mapOutcome(row)]));
  const damageByVehicle = new Map<string, DamageEntry[]>();
  const photosByVehicle = new Map<string, VehiclePhoto[]>();
  const latestPackByVehicle = new Map<string, DecisionPack>();

  (damageResult.data ?? []).forEach((row) => {
    const current = damageByVehicle.get(row.vehicle_id) ?? [];
    damageByVehicle.set(row.vehicle_id, [...current, mapDamageEntry(row)]);
  });
  (photoResult.data ?? []).forEach((row) => {
    const current = photosByVehicle.get(row.vehicle_id) ?? [];
    photosByVehicle.set(row.vehicle_id, [...current, mapVehiclePhoto(row)]);
  });
  (packResult.data ?? []).forEach((row) => {
    if (!latestPackByVehicle.has(row.vehicle_id)) {
      latestPackByVehicle.set(row.vehicle_id, mapDecisionPack(row));
    }
  });

  const vehicles = (vehicleResult.data ?? [])
    .map((row) => {
      const appraisal = appraisalsByVehicle.get(row.id);
      const marketInput = marketsByVehicle.get(row.id);
      if (!appraisal || !marketInput) return null;
      const vehicle: Vehicle = {
        id: row.id,
        organisationId: row.organisation_id,
        vrm: row.vrm,
        vin: row.vin ?? undefined,
        make: row.make,
        model: row.model,
        derivative: row.derivative,
        registrationDate: row.registration_date,
        mileage: row.mileage,
        fuelType: row.fuel_type,
        transmission: row.transmission,
        bodyType: row.body_type,
        colour: row.colour,
        numberOfKeys: row.number_of_keys,
        v5cStatus: row.v5c_status,
        serviceHistory: row.service_history,
        motExpiry: row.mot_expiry,
        motAdvisories: row.mot_advisories,
        hpiStatus: row.hpi_status,
        source: row.source,
        siteTeam: row.site_team,
        status: row.status,
        proposedOffer: row.proposed_offer,
        assignedUserId: row.assigned_user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        appraisal,
        damageEntries: damageByVehicle.get(row.id) ?? [],
        photos: photosByVehicle.get(row.id) ?? [],
        marketInput,
        decisionPack: latestPackByVehicle.get(row.id),
        outcome: outcomesByVehicle.get(row.id),
      };
      return vehicle;
    })
    .filter((vehicle): vehicle is Vehicle => Boolean(vehicle));

  return {
    organisation,
    profiles: (profileResult.data ?? []).map(mapProfile),
    vehicles,
    rules: mapRules(rulesResult.data),
    integrations: (integrationResult.data ?? []).map(mapIntegration),
  };
}

export async function insertVehicleRecord(vehicle: Vehicle): Promise<void> {
  const client = requireClient();
  const { error: vehicleError } = await client.from("vehicles").insert(vehicleRow(vehicle));
  if (vehicleError) throw vehicleError;

  const { error: appraisalError } = await client.from("appraisals").insert(appraisalRow(vehicle.appraisal));
  if (appraisalError) throw appraisalError;

  const { error: marketError } = await client.from("market_inputs").insert(marketInputRow(vehicle.marketInput));
  if (marketError) throw marketError;

  if (vehicle.damageEntries.length > 0) {
    const { error } = await client.from("damage_entries").insert(vehicle.damageEntries.map(damageEntryRow));
    if (error) throw error;
  }

  if (vehicle.photos.length > 0) {
    const { error } = await client.from("vehicle_photos").insert(vehicle.photos.map(vehiclePhotoRow));
    if (error) throw error;
  }
}

export async function updateVehicleStatus(vehicleId: string, status: Vehicle["status"]): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("vehicles").update({ status }).eq("id", vehicleId);
  if (error) throw error;
}

export async function updateDecisionPackFeedback(pack: DecisionPack): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from("decision_packs")
    .update({
      accepted_at: pack.acceptedAt ?? null,
      override_reason: pack.overrideReason ?? null,
    })
    .eq("id", pack.id);
  if (error) throw error;
}

export async function insertDecisionAction(action: DecisionAction): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("decision_actions").insert({
    id: action.id,
    organisation_id: action.organisationId,
    decision_pack_id: action.decisionPackId,
    vehicle_id: action.vehicleId,
    action: action.action,
    override_reason: action.overrideReason ?? null,
    actor_id: action.actorId,
    created_at: action.createdAt,
  });
  if (error) throw error;
}

export async function updateOrganisationRules(rules: OrganisationRules): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("organisation_rules").upsert(rulesRow(rules), {
    onConflict: "organisation_id",
  });
  if (error) throw error;
}

export async function upsertOutcome(outcome: Outcome): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("outcomes").upsert(outcomeRow(outcome), {
    onConflict: "vehicle_id,decision_pack_id",
  });
  if (error) throw error;
}
