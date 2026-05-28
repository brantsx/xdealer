import type { IntegrationAdapter, MotHistoryRequest, MotHistoryResult } from "./types";

export class DisabledDvsaMotHistoryAdapter implements IntegrationAdapter<MotHistoryRequest, MotHistoryResult> {
  readonly name = "DVSA MOT history";
  readonly mode = "disabled" as const;

  async fetch(): Promise<MotHistoryResult> {
    return {
      advisories: [],
      disabledReason: "DVSA MOT API integration is planned but intentionally disabled in the MVP.",
      provider: "DVSA planned",
    };
  }
}
