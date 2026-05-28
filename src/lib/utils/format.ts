import type { Channel, RecommendedAction, RiskLevel, VehicleStatus } from "../../types";

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function riskClasses(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    Low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Medium: "bg-amber-50 text-amber-700 ring-amber-200",
    High: "bg-orange-50 text-orange-700 ring-orange-200",
    Critical: "bg-red-50 text-red-700 ring-red-200",
  };
  return map[level];
}

export function actionClasses(action: RecommendedAction): string {
  if (action === "Buy" || action === "Retail" || action === "List to dealer marketplace") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (
    action === "Buy with caution" ||
    action === "Auction" ||
    action === "Trade out" ||
    action === "List only to selected dealers"
  ) {
    return "bg-sky-50 text-sky-700 ring-sky-200";
  }
  if (action === "Senior review required" || action === "Request more information") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  return "bg-red-50 text-red-700 ring-red-200";
}

export function statusClasses(status: VehicleStatus): string {
  const reviewStatuses: VehicleStatus[] = ["Senior review", "Overridden"];
  if (reviewStatuses.includes(status)) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  if (status === "Bought" || status === "Accepted" || status === "Analysed") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (status === "Not bought") {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  return "bg-slate-50 text-slate-600 ring-slate-200";
}

export function channelClasses(channel: Channel): string {
  const map: Record<Channel, string> = {
    Retail: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Auction: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    "Trade out": "bg-sky-50 text-sky-700 ring-sky-200",
    "Dealer marketplace": "bg-teal-50 text-teal-700 ring-teal-200",
    "Direct buyer network": "bg-cyan-50 text-cyan-700 ring-cyan-200",
    "Lease/fleet remarketing": "bg-violet-50 text-violet-700 ring-violet-200",
    "Scrap/breaker": "bg-red-50 text-red-700 ring-red-200",
    Wholesale: "bg-slate-50 text-slate-700 ring-slate-200",
    Hold: "bg-amber-50 text-amber-700 ring-amber-200",
  };
  return map[channel];
}

export function hoursUntil(value?: string): number {
  if (!value) return 0;
  const diff = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}

export function formatDistanceMiles(value: number): string {
  return `${formatNumber(value)} miles`;
}

export function getVehicleTitle(vehicle: {
  registrationDate: string;
  make: string;
  model: string;
  derivative: string;
}): string {
  const year = new Date(vehicle.registrationDate).getFullYear();
  return `${year} ${vehicle.make} ${vehicle.model} ${vehicle.derivative}`;
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function toCsv(rows: Array<Record<string, string | number | undefined>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | undefined): string => {
    const text = value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join(
    "\n",
  );
}
