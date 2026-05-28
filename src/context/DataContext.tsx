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
import { createAiAnalysisProvider } from "../lib/ai/provider";
import { validateGeneratedDecisionPack, type GeneratedDecisionPack } from "../lib/ai/structuredSchemas";
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
  rules: OrganisationRules;
  integrations: IntegrationConfig[];
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

function computeMetrics(vehicles: Vehicle[]): DashboardMetrics {
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
  const channels: Channel[] = ["Retail", "Auction", "Trade out", "Wholesale", "Hold"];
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
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { organisation: authOrganisation, profile, demoMode } = useAuth();
  const [organisation, setOrganisation] = useState<Organisation>(demoOrganisation);
  const [profiles, setProfiles] = useState<Profile[]>(demoProfiles);
  const [vehicles, setVehicles] = useState<Vehicle[]>(demoVehicles);
  const [rules, setRules] = useState<OrganisationRules>(demoRules);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(demoIntegrations);
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
          setRules(tenantData.rules);
          setIntegrations(tenantData.integrations);
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

  const metrics = useMemo(() => computeMetrics(vehicles), [vehicles]);

  const value = useMemo(
    () => ({
      organisation,
      profiles,
      vehicles,
      rules,
      integrations,
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
    }),
    [
      addVehicle,
      analyseVehicle,
      bulkApproveLowRisk,
      bulkSendHighRiskToReview,
      integrations,
      dataError,
      isAnalysing,
      isLoading,
      metrics,
      organisation,
      profiles,
      recordDecisionAction,
      rules,
      saveOutcome,
      updateRules,
      vehicles,
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
