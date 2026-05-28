import type { IntegrationAdapter, RetailMarketRequest, RetailMarketResult } from "./types";

export class MockRetailMarketAdapter implements IntegrationAdapter<RetailMarketRequest, RetailMarketResult> {
  readonly name = "Auto Trader style retail market data";
  readonly mode = "mock" as const;

  async fetch(request: RetailMarketRequest): Promise<RetailMarketResult> {
    const premiumMultiplier = ["BMW", "Mercedes-Benz", "Audi", "Tesla"].includes(request.make) ? 1.18 : 1;
    const mileageDrag = Math.max(0, request.mileage - 35000) * 0.04;
    const estimate = Math.round((16800 * premiumMultiplier - mileageDrag) / 100) * 100;
    return {
      retailMarketEstimate: estimate,
      comparableCount: 42,
      averageDaysAdvertised: premiumMultiplier > 1 ? 34 : 28,
      provider: "Auto Trader style mock",
    };
  }
}
