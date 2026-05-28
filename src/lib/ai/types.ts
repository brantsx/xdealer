import type { OrganisationRules, Vehicle } from "../../types";
import type { GeneratedDecisionPack } from "./structuredSchemas";

export interface VehicleAnalysisInput {
  vehicle: Vehicle;
  organisationRules: OrganisationRules;
  generatedAt: string;
  marketContext: {
    providerMode: "mock" | "connected";
    valuationSource: "CAP/HPI mock" | "CAP/HPI connected";
    retailMarketSource: "Auto Trader style mock" | "Auto Trader connected";
    motSource: "Manual" | "DVSA planned";
  };
}

export interface AiAnalysisProvider {
  analyseVehicle(input: VehicleAnalysisInput): Promise<GeneratedDecisionPack>;
}

export interface AiProviderConfig {
  apiKey?: string;
  model?: string;
  forceMock?: boolean;
}
