import type { AuctionListingRequest, AuctionListingResult, IntegrationAdapter } from "./types";

export class MockAuctionPlatformAdapter implements IntegrationAdapter<AuctionListingRequest, AuctionListingResult> {
  readonly name = "Auction platform";
  readonly mode = "mock" as const;

  async fetch(request: AuctionListingRequest): Promise<AuctionListingResult> {
    return {
      listingReference: `XDA-${request.vehicle.vrm.replace(/\s/g, "")}-${Date.now().toString().slice(-5)}`,
      acceptedReserve: request.reserve,
      provider: "Auction mock",
    };
  }
}
