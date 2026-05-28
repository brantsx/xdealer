import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { demoIntegrations, demoOrganisation, demoProfiles, demoRules, demoVehicles } from "../data/mockData";
import { demoMarketplaceBundle, marketplaceVehicles as demoMarketplaceVehicles } from "../data/marketplaceData";
import { createAiAnalysisProvider } from "../lib/ai/provider";
import { validateGeneratedDecisionPack, type GeneratedDecisionPack } from "../lib/ai/structuredSchemas";
import { analyseMarketplaceFit } from "../lib/marketplace/matching";
import { supabase } from "../lib/supabase/client";
import {
  fetchTenantData,
  insertDecisionAction,
  insertVehicleRecord,
  updateDecisionPackFeedback,
  updateOrganisationRules,
  updateVehicleStatus,
  upsertOutcome,
} from "../lib/supabase/repository";
import { formatCurrency } from "../lib/utils/format";
import type {
  Channel,
  DashboardMetrics,
  DecisionAction,
  DecisionPack,
  IntegrationConfig,
  MarketplaceAnalysis,
  MarketplaceBid,
  MarketplaceBundle,
  MarketplaceListing,
  MarketplaceListingPhoto,
  MarketplaceOffer,
  DealerProfile,
  Organisation,
  OrganisationRules,
  Outcome,
  Profile,
  RecommendedAction,
  RiskLevel,
  Vehicle,
} from "../types";

interface DataContextValue {
  organisation: Organisation;
  profiles: Profile[];
  vehicles: Vehicle[];
  marketplaceVehicles: Vehicle[];
  rules: OrganisationRules;
  integrations: IntegrationConfig[];
  marketplace: MarketplaceBundle;
  metrics: DashboardMetrics;
  isLoading: boolean;
  dataError: string;
  isAnalysing: boolean;
  analyseVehicle: (vehicleId: string) => Promise<DecisionPack>;
  addVehicle: (vehicle: Vehicle) => Promise<void>;
  recordDecisionAction: (
    vehicleId: string,
    action: DecisionAction["action"],
    overrideReason?: string,
  ) => void;
  bulkApproveLowRisk: () => number;
  bulkSendHighRiskToReview: () => number;
  updateRules: (rules: OrganisationRules) => void;
  saveOutcome: (outcome: Outcome) => void;
  createMarketplaceListing: (listing: MarketplaceListing, listingPhotos: MarketplaceListingPhoto[]) => MarketplaceListing;
  publishMarketplaceListing: (listingId: string) => void;
  withdrawMarketplaceListing: (listingId: string) => void;
  watchListing: (listingId: string) => void;
  placeMarketplaceBid: (listingId: string, amount: number, message: string) => MarketplaceBid;
  makeMarketplaceOffer: (listingId: string, amount: number, message: string) => MarketplaceOffer;
  respondToMarketplaceOffer: (
    offerId: string,
    response: "accept" | "reject" | "counter",
    counterAmount?: number,
    counterMessage?: string,
  ) => void;
  analyseMarketplaceListing: (listingId: string) => MarketplaceAnalysis;
  updateDealerProfile: (dealerProfile: DealerProfile) => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

function riskRank(level: RiskLevel): number {
  const map: Record<RiskLevel, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
    Critical: 4,
  };
  return map[level];
}

function materialisePack(vehicle: Vehicle, generated: GeneratedDecisionPack, id?: string): DecisionPack {
  const timestamp = new Date().toISOString();
  return {
    id: id ?? `pack-${vehicle.id}`,
    organisationId: vehicle.organisationId,
    vehicleId: vehicle.id,
    ...generated,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function statusFromRecommendation(recommendation: RecommendedAction): Vehicle["status"] {
  if (recommendation === "Senior review required") return "Senior review";
  if (recommendation === "Request more information") return "Needs appraisal";
  return "Analysed";
}

function computeMetrics(vehicles: Vehicle[], marketplace: MarketplaceBundle): DashboardMetrics {
  const analysed = vehicles.filter((vehicle) => vehicle.decisionPack);
  const confidenceTotal = analysed.reduce((sum, vehicle) => sum + (vehicle.decisionPack?.confidenceScore ?? 0), 0);
  const completenessTotal = analysed.reduce(
    (sum, vehicle) => sum + (vehicle.decisionPack?.dataCompletenessScore ?? 0),
    0,
  );
  const highRiskVehiclesFlagged = analysed.filter((vehicle) =>
    vehicle.decisionPack?.keyRisks.some((risk) => riskRank(risk.level) >= 3),
  ).length;
  const overrideCount = analysed.filter((vehicle) => vehicle.decisionPack?.overrideReason).length;
  const channels: Channel[] = [
    "Retail",
    "Auction",
    "Trade out",
    "Dealer marketplace",
    "Direct buyer network",
    "Lease/fleet remarketing",
    "Scrap/breaker",
    "Wholesale",
    "Hold",
  ];
  const vehiclesByChannel = channels
    .map((channel) => ({
      channel,
      count: analysed.filter((vehicle) => vehicle.decisionPack?.preferredChannel === channel).length,
      margin: analysed
        .filter((vehicle) => vehicle.decisionPack?.preferredChannel === channel)
        .reduce((sum, vehicle) => sum + Math.max(0, vehicle.decisionPack?.expectedMargin ?? 0), 0),
    }))
    .filter((item) => item.count > 0);
  const riskMap = new Map<string, { count: number; impact: number }>();
  analysed.forEach((vehicle) => {
    vehicle.decisionPack?.keyRisks.forEach((risk) => {
      const current = riskMap.get(risk.title) ?? { count: 0, impact: 0 };
      riskMap.set(risk.title, {
        count: current.count + 1,
        impact: current.impact + risk.commercialImpact,
      });
    });
  });

  const liveListings = marketplace.listings.filter((listing) => listing.status === "Live");
  const soldReserved = marketplace.listings.filter((listing) => listing.status === "Sold" || listing.status === "Reserved");
  const activeOffers = marketplace.offers.filter((offer) => offer.status !== "Draft" && offer.status !== "Expired");
  const activeBids = marketplace.bids.filter((bid) => bid.status !== "Draft" && bid.status !== "Expired");
  const watchedEndingSoon = marketplace.watchlist.filter((watch) => {
    const listing = marketplace.listings.find((candidate) => candidate.id === watch.listingId);
    if (!listing?.endsAt || listing.status !== "Live") return false;
    return new Date(listing.endsAt).getTime() - Date.now() < 72 * 60 * 60 * 1000;
  }).length;

  return {
    vehiclesAnalysedThisMonth: analysed.length,
    averageRecommendationConfidence: analysed.length ? Math.round(confidenceTotal / analysed.length) : 0,
    estimatedMarginProtected: analysed.reduce((sum, vehicle) => {
      const margin = vehicle.outcome?.actualMargin ?? vehicle.decisionPack?.expectedMargin ?? 0;
      return sum + Math.max(0, margin);
    }, 0),
    highRiskVehiclesFlagged,
    appraisalCompletenessScore: analysed.length ? Math.round(completenessTotal / analysed.length) : 0,
    humanOverrideRate: analysed.length ? Math.round((overrideCount / analysed.length) * 100) : 0,
    vehiclesByChannel,
    topRiskThemes: [...riskMap.entries()]
      .map(([theme, value]) => ({ theme, ...value }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 6),
    liveMarketplaceListings: liveListings.length,
    marketplaceSoldReserved: soldReserved.length,
    bidsOffersThisMonth: activeOffers.length + activeBids.length,
    averageTimeToFirstOfferHours: 18,
    estimatedMarketplaceMarginRecovered: marketplace.analyses.reduce((sum, analysis) => sum + Math.max(0, analysis.expectedMargin), 0),
    topBuyerDemandCategories: [
      { category: "Clean petrol SUVs", count: 9 },
      { category: "Diesel estates", count: 7 },
      { category: "Retail-ready hatchbacks", count: 6 },
      { category: "Commercial vans", count: 4 },
    ],
    watchedVehiclesEndingSoon: watchedEndingSoon,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { organisation: authOrganisation, profile, demoMode } = useAuth();
  const [organisation, setOrganisation] = useState<Organisation>(demoOrganisation);
  const [profiles, setProfiles] = useState<Profile[]>(demoProfiles);
  const [vehicles, setVehicles] = useState<Vehicle[]>(demoVehicles);
  const [marketplaceVehicles, setMarketplaceVehicles] = useState<Vehicle[]>(demoMarketplaceVehicles);
  const [rules, setRules] = useState<OrganisationRules>(demoRules);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(demoIntegrations);
  const [marketplace, setMarketplace] = useState<MarketplaceBundle>(demoMarketplaceBundle);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [dataError, setDataError] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (supabase && authOrganisation) {
      setIsLoading(true);
      setDataError("");
      fetchTenantData(authOrganisation)
        .then((tenantData) => {
          if (!mounted) return;
          setOrganisation(tenantData.organisation);
          setProfiles(tenantData.profiles);
          setVehicles(tenantData.vehicles);
          setMarketplaceVehicles(demoMarketplaceVehicles);
          setRules(tenantData.rules);
          setIntegrations(tenantData.integrations);
          setMarketplace(demoMarketplaceBundle);
        })
        .catch((caught: unknown) => {
          if (!mounted) return;
          setDataError(caught instanceof Error ? caught.message : "Unable to load tenant data.");
        })
        .finally(() => {
          if (mounted) setIsLoading(false);
        });
      return () => {
        mounted = false;
      };
    }

    if (supabase && !authOrganisation) {
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    const provider = createAiAnalysisProvider({ forceMock: true });
    Promise.all(
      demoVehicles.map(async (vehicle) => {
        const generated = await provider.analyseVehicle({
          vehicle,
          organisationRules: demoRules,
          generatedAt: new Date().toISOString(),
          marketContext: {
            providerMode: "mock",
            valuationSource: "CAP/HPI mock",
            retailMarketSource: "Auto Trader style mock",
            motSource: "Manual",
          },
        });
        return {
          ...vehicle,
          decisionPack: materialisePack(vehicle, generated),
          status: statusFromRecommendation(generated.overallRecommendation),
        };
      }),
    ).then((seededVehicles) => {
      if (mounted) setVehicles(seededVehicles);
    });
    return () => {
      mounted = false;
    };
  }, [authOrganisation, demoMode]);

  const analyseVehicle = useCallback(
    async (vehicleId: string): Promise<DecisionPack> => {
      const vehicle = vehicles.find((candidate) => candidate.id === vehicleId);
      if (!vehicle) throw new Error("Vehicle not found");
      setIsAnalysing(true);
      try {
        let generated: GeneratedDecisionPack;
        let savedDecisionPackId: string | undefined;
        if (supabase) {
          const { data, error } = await supabase.functions.invoke("analyse-vehicle", {
            body: { vehicleId },
          });
          if (error) throw error;
          const response = data as { analysis?: unknown; decisionPackId?: string };
          generated = validateGeneratedDecisionPack(response.analysis);
          savedDecisionPackId = response.decisionPackId;
        } else {
          const provider = createAiAnalysisProvider({ forceMock: true });
          generated = await provider.analyseVehicle({
            vehicle,
            organisationRules: rules,
            generatedAt: new Date().toISOString(),
            marketContext: {
              providerMode: "mock",
              valuationSource: "CAP/HPI mock",
              retailMarketSource: "Auto Trader style mock",
              motSource: "Manual",
            },
          });
        }
        const pack = materialisePack(vehicle, generated, savedDecisionPackId);
        setVehicles((current) =>
          current.map((candidate) =>
            candidate.id === vehicleId
              ? { ...candidate, decisionPack: pack, status: statusFromRecommendation(pack.overallRecommendation) }
              : candidate,
          ),
        );
        return pack;
      } finally {
        setIsAnalysing(false);
      }
    },
    [rules, vehicles],
  );

  const addVehicle = useCallback(async (vehicle: Vehicle) => {
    if (supabase) {
      await insertVehicleRecord(vehicle);
    }
    setVehicles((current) => [vehicle, ...current]);
  }, []);

  const recordDecisionAction = useCallback(
    (vehicleId: string, action: DecisionAction["action"], overrideReason?: string) => {
      setVehicles((current) =>
        current.map((vehicle) => {
          if (vehicle.id !== vehicleId || !vehicle.decisionPack) return vehicle;
          const statusMap: Record<DecisionAction["action"], Vehicle["status"]> = {
            Accepted: "Accepted",
            Overridden: "Overridden",
            "Senior review": "Senior review",
            "More information requested": "Needs appraisal",
            Bought: "Bought",
            "Not bought": "Not bought",
          };
          const updatedVehicle = {
            ...vehicle,
            status: statusMap[action],
            decisionPack: {
              ...vehicle.decisionPack,
              acceptedAt: action === "Accepted" ? new Date().toISOString() : vehicle.decisionPack.acceptedAt,
              overrideReason: action === "Overridden" ? overrideReason : vehicle.decisionPack.overrideReason,
              updatedAt: new Date().toISOString(),
            },
          };
          if (supabase && profile) {
            const decisionAction: DecisionAction = {
              id: crypto.randomUUID(),
              organisationId: vehicle.organisationId,
              decisionPackId: vehicle.decisionPack.id,
              vehicleId: vehicle.id,
              action,
              overrideReason,
              actorId: profile.id,
              createdAt: new Date().toISOString(),
            };
            void updateVehicleStatus(vehicle.id, statusMap[action]);
            void updateDecisionPackFeedback(updatedVehicle.decisionPack);
            void insertDecisionAction(decisionAction);
          }
          return updatedVehicle;
        }),
      );
    },
    [profile],
  );

  const bulkApproveLowRisk = useCallback(() => {
    let approved = 0;
    setVehicles((current) =>
      current.map((vehicle) => {
        const pack = vehicle.decisionPack;
        if (
          pack &&
          pack.confidenceScore >= rules.minimumConfidenceForAutoApproval &&
          !pack.keyRisks.some((risk) => riskRank(risk.level) >= 3) &&
          ["Analysed", "Ready to analyse"].includes(vehicle.status)
        ) {
          approved += 1;
          const updatedPack = { ...pack, acceptedAt: new Date().toISOString() };
          if (supabase) {
            void updateVehicleStatus(vehicle.id, "Accepted");
            void updateDecisionPackFeedback(updatedPack);
          }
          return { ...vehicle, status: "Accepted", decisionPack: updatedPack };
        }
        return vehicle;
      }),
    );
    return approved;
  }, [rules.minimumConfidenceForAutoApproval]);

  const bulkSendHighRiskToReview = useCallback(() => {
    let sent = 0;
    setVehicles((current) =>
      current.map((vehicle) => {
        const pack = vehicle.decisionPack;
        if (pack?.keyRisks.some((risk) => riskRank(risk.level) >= 3) && vehicle.status !== "Senior review") {
          sent += 1;
          if (supabase) void updateVehicleStatus(vehicle.id, "Senior review");
          return { ...vehicle, status: "Senior review" };
        }
        return vehicle;
      }),
    );
    return sent;
  }, []);

  const updateRules = useCallback((nextRules: OrganisationRules) => {
    const updated = { ...nextRules, updatedAt: new Date().toISOString() };
    setRules(updated);
    if (supabase) void updateOrganisationRules(updated);
  }, []);

  const saveOutcome = useCallback((outcome: Outcome) => {
    if (supabase) void upsertOutcome(outcome);
    setVehicles((current) =>
      current.map((vehicle) =>
        vehicle.id === outcome.vehicleId
          ? {
              ...vehicle,
              outcome,
            }
          : vehicle,
      ),
    );
  }, []);

  const createMarketplaceListing = useCallback(
    (listing: MarketplaceListing, listingPhotos: MarketplaceListingPhoto[]) => {
      setMarketplace((current) => ({
        ...current,
        listings: [listing, ...current.listings],
        listingPhotos: [...listingPhotos, ...current.listingPhotos],
        events: [
          {
            id: crypto.randomUUID(),
            listingId: listing.id,
            organisationId: listing.organisationId,
            userId: profile?.id ?? "",
            eventType: "draft_created",
            eventJson: { source: "listing-wizard" },
            createdAt: new Date().toISOString(),
          },
          ...current.events,
        ],
      }));
      return listing;
    },
    [profile?.id],
  );

  const publishMarketplaceListing = useCallback(
    (listingId: string) => {
      setMarketplace((current) => ({
        ...current,
        listings: current.listings.map((listing) =>
          listing.id === listingId
            ? {
                ...listing,
                status: "Live",
                sellerDeclarationAccepted: true,
                publishedAt: listing.publishedAt ?? new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : listing,
        ),
        events: [
          {
            id: crypto.randomUUID(),
            listingId,
            organisationId: organisation.id,
            userId: profile?.id ?? "",
            eventType: "published",
            eventJson: { declarationAccepted: true },
            createdAt: new Date().toISOString(),
          },
          ...current.events,
        ],
      }));
    },
    [organisation.id, profile?.id],
  );

  const withdrawMarketplaceListing = useCallback(
    (listingId: string) => {
      setMarketplace((current) => ({
        ...current,
        listings: current.listings.map((listing) =>
          listing.id === listingId
            ? {
                ...listing,
                status: "Withdrawn",
                withdrawnAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : listing,
        ),
        events: [
          {
            id: crypto.randomUUID(),
            listingId,
            organisationId: organisation.id,
            userId: profile?.id ?? "",
            eventType: "withdrawn",
            eventJson: {},
            createdAt: new Date().toISOString(),
          },
          ...current.events,
        ],
      }));
    },
    [organisation.id, profile?.id],
  );

  const watchListing = useCallback(
    (listingId: string) => {
      setMarketplace((current) => {
        const existing = current.watchlist.find(
          (watch) => watch.listingId === listingId && watch.organisationId === organisation.id && watch.userId === profile?.id,
        );
        if (existing) {
          return {
            ...current,
            watchlist: current.watchlist.filter((watch) => watch.id !== existing.id),
            listings: current.listings.map((listing) =>
              listing.id === listingId ? { ...listing, watchers: Math.max(0, listing.watchers - 1) } : listing,
            ),
          };
        }
        return {
          ...current,
          watchlist: [
            {
              id: crypto.randomUUID(),
              listingId,
              organisationId: organisation.id,
              userId: profile?.id ?? "",
              createdAt: new Date().toISOString(),
            },
            ...current.watchlist,
          ],
          listings: current.listings.map((listing) =>
            listing.id === listingId ? { ...listing, watchers: listing.watchers + 1 } : listing,
          ),
        };
      });
    },
    [organisation.id, profile?.id],
  );

  const placeMarketplaceBid = useCallback(
    (listingId: string, amount: number, message: string) => {
      const bid: MarketplaceBid = {
        id: crypto.randomUUID(),
        listingId,
        bidderOrganisationId: organisation.id,
        bidderUserId: profile?.id ?? "",
        amount,
        status: "Leading",
        message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMarketplace((current) => ({
        ...current,
        bids: [
          bid,
          ...current.bids.map((candidate) =>
            candidate.listingId === listingId && candidate.status === "Leading" ? { ...candidate, status: "Outbid" as const } : candidate,
          ),
        ],
        listings: current.listings.map((listing) =>
          listing.id === listingId
            ? { ...listing, currentHighestBid: amount, currentHighestBidId: bid.id, updatedAt: new Date().toISOString() }
            : listing,
        ),
        events: [
          {
            id: crypto.randomUUID(),
            listingId,
            organisationId: organisation.id,
            userId: profile?.id ?? "",
            eventType: "bid_placed",
            eventJson: { amount },
            createdAt: new Date().toISOString(),
          },
          ...current.events,
        ],
      }));
      return bid;
    },
    [organisation.id, profile?.id],
  );

  const makeMarketplaceOffer = useCallback(
    (listingId: string, amount: number, message: string) => {
      const listing = marketplace.listings.find((candidate) => candidate.id === listingId);
      if (!listing) throw new Error("Listing not found");
      const offer: MarketplaceOffer = {
        id: crypto.randomUUID(),
        listingId,
        buyerOrganisationId: organisation.id,
        buyerUserId: profile?.id ?? "",
        sellerOrganisationId: listing.organisationId,
        amount,
        status: "Submitted",
        message,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        nextSteps: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMarketplace((current) => ({
        ...current,
        offers: [offer, ...current.offers],
        events: [
          {
            id: crypto.randomUUID(),
            listingId,
            organisationId: organisation.id,
            userId: profile?.id ?? "",
            eventType: "offer_submitted",
            eventJson: { amount, notification: "mocked" },
            createdAt: new Date().toISOString(),
          },
          ...current.events,
        ],
      }));
      return offer;
    },
    [marketplace.listings, organisation.id, profile?.id],
  );

  const respondToMarketplaceOffer = useCallback(
    (offerId: string, response: "accept" | "reject" | "counter", counterAmount?: number, counterMessage?: string) => {
      setMarketplace((current) => {
        const offer = current.offers.find((candidate) => candidate.id === offerId);
        if (!offer) return current;
        const statusMap = {
          accept: "Accepted",
          reject: "Rejected",
          counter: "Countered",
        } as const;
        const nextSteps =
          response === "accept"
            ? ["Exchange details", "Arrange invoice", "Arrange collection/transport", "Confirm payment outside platform", "Mark complete"]
            : offer.nextSteps;
        return {
          ...current,
          offers: current.offers.map((candidate) =>
            candidate.id === offerId
              ? {
                  ...candidate,
                  status: statusMap[response],
                  counterAmount: response === "counter" ? counterAmount : candidate.counterAmount,
                  counterMessage: response === "counter" ? counterMessage : candidate.counterMessage,
                  nextSteps,
                  updatedAt: new Date().toISOString(),
                }
              : candidate,
          ),
          listings: current.listings.map((listing) =>
            listing.id === offer.listingId && response === "accept"
              ? { ...listing, status: "Reserved", updatedAt: new Date().toISOString() }
              : listing,
          ),
          events: [
            {
              id: crypto.randomUUID(),
              listingId: offer.listingId,
              organisationId: organisation.id,
              userId: profile?.id ?? "",
              eventType: `offer_${response}`,
              eventJson: { offerId, counterAmount },
              createdAt: new Date().toISOString(),
            },
            ...current.events,
          ],
        };
      });
    },
    [organisation.id, profile?.id],
  );

  const analyseMarketplaceListing = useCallback(
    (listingId: string) => {
      const listing = marketplace.listings.find((candidate) => candidate.id === listingId);
      if (!listing) throw new Error("Listing not found");
      const vehicle = [...vehicles, ...marketplaceVehicles].find((candidate) => candidate.id === listing.vehicleId);
      const buyerProfile = marketplace.dealerProfiles.find((candidate) => candidate.organisationId === organisation.id);
      if (!vehicle || !buyerProfile) throw new Error("Marketplace analysis could not be generated.");
      const analysis = analyseMarketplaceFit({
        listing,
        vehicle,
        buyerProfile,
        buyerRules: rules,
        buyerOrganisationId: organisation.id,
      });
      setMarketplace((current) => ({
        ...current,
        analyses: [analysis, ...current.analyses.filter((candidate) => candidate.id !== analysis.id)],
        events: [
          {
            id: crypto.randomUUID(),
            listingId,
            organisationId: organisation.id,
            userId: profile?.id ?? "",
            eventType: "buyer_analysis_generated",
            eventJson: { fitScore: analysis.fitScore, recommendedMaxBid: analysis.recommendedMaxBid },
            createdAt: new Date().toISOString(),
          },
          ...current.events,
        ],
      }));
      return analysis;
    },
    [marketplace.dealerProfiles, marketplace.listings, marketplaceVehicles, organisation.id, profile?.id, rules, vehicles],
  );

  const updateDealerProfile = useCallback((dealerProfile: DealerProfile) => {
    setMarketplace((current) => ({
      ...current,
      dealerProfiles: current.dealerProfiles.map((candidate) =>
        candidate.id === dealerProfile.id ? { ...dealerProfile, updatedAt: new Date().toISOString() } : candidate,
      ),
    }));
  }, []);

  const metrics = useMemo(() => computeMetrics(vehicles, marketplace), [vehicles, marketplace]);

  const value = useMemo(
    () => ({
      organisation,
      profiles,
      vehicles,
      marketplaceVehicles,
      rules,
      integrations,
      marketplace,
      metrics,
      isLoading,
      dataError,
      isAnalysing,
      analyseVehicle,
      addVehicle,
      recordDecisionAction,
      bulkApproveLowRisk,
      bulkSendHighRiskToReview,
      updateRules,
      saveOutcome,
      createMarketplaceListing,
      publishMarketplaceListing,
      withdrawMarketplaceListing,
      watchListing,
      placeMarketplaceBid,
      makeMarketplaceOffer,
      respondToMarketplaceOffer,
      analyseMarketplaceListing,
      updateDealerProfile,
    }),
    [
      addVehicle,
      analyseVehicle,
      analyseMarketplaceListing,
      bulkApproveLowRisk,
      bulkSendHighRiskToReview,
      createMarketplaceListing,
      integrations,
      dataError,
      isAnalysing,
      isLoading,
      makeMarketplaceOffer,
      marketplace,
      marketplaceVehicles,
      metrics,
      organisation,
      placeMarketplaceBid,
      profiles,
      publishMarketplaceListing,
      recordDecisionAction,
      respondToMarketplaceOffer,
      rules,
      saveOutcome,
      updateRules,
      updateDealerProfile,
      vehicles,
      watchListing,
      withdrawMarketplaceListing,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used inside DataProvider");
  return context;
}

export function describeMargin(vehicle: Vehicle): string {
  if (!vehicle.decisionPack) return "Not analysed";
  return `${formatCurrency(vehicle.decisionPack.expectedMargin)} expected`;
}
