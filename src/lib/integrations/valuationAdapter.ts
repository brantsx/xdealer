import type { IntegrationAdapter, ProvenanceResult, ValuationRequest, ValuationResult } from "./types";

export class MockCapHpiValuationAdapter implements IntegrationAdapter<ValuationRequest, ValuationResult> {
  readonly name = "CAP/HPI valuation data";
  readonly mode = "mock" as const;

  async fetch(request: ValuationRequest): Promise<ValuationResult> {
    const mileageAdjustment = Math.max(0, request.mileage - 30000) * 0.035;
    const base = 14500 - mileageAdjustment;
    return {
      capClean: Math.round(base),
      capAverage: Math.round(base - 850),
      capBelow: Math.round(base - 1650),
      tradeValueEstimate: Math.round(base - 500),
      provider: "CAP/HPI mock",
    };
  }
}

export class MockHpiProvenanceAdapter implements IntegrationAdapter<ValuationRequest, ProvenanceResult> {
  readonly name = "HPI provenance data";
  readonly mode = "mock" as const;

  async fetch(request: ValuationRequest): Promise<ProvenanceResult> {
    const hasRiskMarker = request.vrm.endsWith("X") || request.vrm.endsWith("Z");
    return {
      hpiStatus: hasRiskMarker ? "Finance marker" : "Clear",
      provider: "HPI mock",
    };
  }
}
