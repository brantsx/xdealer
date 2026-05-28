import type { HpiStatus, Vehicle, VehicleSource } from "../../types";

export interface ValuationRequest {
  vrm: string;
  mileage: number;
  registrationDate?: string;
}

export interface ValuationResult {
  capClean: number;
  capAverage: number;
  capBelow: number;
  tradeValueEstimate: number;
  provider: "CAP/HPI mock" | "CAP/HPI connected";
}

export interface ProvenanceResult {
  hpiStatus: HpiStatus;
  financeAgreementReference?: string;
  writeOffCategory?: string;
  provider: "HPI mock" | "HPI connected";
}

export interface RetailMarketRequest {
  make: string;
  model: string;
  derivative: string;
  mileage: number;
  postcodeArea?: string;
}

export interface RetailMarketResult {
  retailMarketEstimate: number;
  comparableCount: number;
  averageDaysAdvertised: number;
  provider: "Auto Trader style mock" | "Auto Trader connected";
}

export interface MotHistoryRequest {
  vrm: string;
}

export interface MotHistoryResult {
  motExpiry?: string;
  advisories: string[];
  disabledReason?: string;
  provider: "DVSA planned";
}

export interface AuctionListingRequest {
  vehicle: Vehicle;
  reserve: number;
  source: VehicleSource;
}

export interface AuctionListingResult {
  listingReference: string;
  acceptedReserve: number;
  provider: "Auction mock" | "Auction connected";
}

export interface IntegrationAdapter<TRequest, TResult> {
  readonly name: string;
  readonly mode: "mock" | "disabled" | "connected";
  fetch(request: TRequest): Promise<TResult>;
}
