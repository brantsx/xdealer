import { MockAiAnalysisProvider } from "./mockProvider";
import type { AiAnalysisProvider, AiProviderConfig, VehicleAnalysisInput } from "./types";
import type { GeneratedDecisionPack } from "./structuredSchemas";

class PlaceholderConnectedAiProvider implements AiAnalysisProvider {
  constructor(private readonly fallback: AiAnalysisProvider) {}

  async analyseVehicle(input: VehicleAnalysisInput): Promise<GeneratedDecisionPack> {
    // Live model integration is intentionally deferred for the MVP. The edge function
    // can swap this class for a real provider once credentials and review controls exist.
    return this.fallback.analyseVehicle(input);
  }
}

export function createAiAnalysisProvider(config: AiProviderConfig = {}): AiAnalysisProvider {
  const mockProvider = new MockAiAnalysisProvider();
  if (config.forceMock || !config.apiKey) {
    return mockProvider;
  }
  return new PlaceholderConnectedAiProvider(mockProvider);
}
