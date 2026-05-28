import type { ReactNode } from "react";
import type {
  Channel,
  FitLabel,
  MarketplaceListingStatus,
  MarketplaceListingType,
  RecommendedAction,
  RiskLevel,
  VehicleStatus,
} from "../../types";
import { actionClasses, channelClasses, cx, riskClasses, statusClasses } from "../../lib/utils/format";

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Badge className={riskClasses(level)}>{level}</Badge>;
}

export function ActionBadge({ action }: { action: RecommendedAction }) {
  return <Badge className={actionClasses(action)}>{action}</Badge>;
}

export function StatusBadge({ status }: { status: VehicleStatus }) {
  return <Badge className={statusClasses(status)}>{status}</Badge>;
}

export function ChannelBadge({ channel }: { channel: Channel }) {
  return <Badge className={channelClasses(channel)}>{channel}</Badge>;
}

export function ConfidenceBadge({ score }: { score: number }) {
  const className =
    score >= 82
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : score >= 70
        ? "bg-sky-50 text-sky-700 ring-sky-200"
        : score >= 55
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : "bg-red-50 text-red-700 ring-red-200";
  return <Badge className={className}>{score}% confidence</Badge>;
}

export function ListingStatusBadge({ status }: { status: MarketplaceListingStatus }) {
  const map: Record<MarketplaceListingStatus, string> = {
    Draft: "bg-slate-50 text-slate-700 ring-slate-200",
    Live: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Under offer": "bg-sky-50 text-sky-700 ring-sky-200",
    Reserved: "bg-violet-50 text-violet-700 ring-violet-200",
    Sold: "bg-ink-900 text-white ring-ink-900",
    Expired: "bg-amber-50 text-amber-700 ring-amber-200",
    Withdrawn: "bg-red-50 text-red-700 ring-red-200",
  };
  return <Badge className={map[status]}>{status}</Badge>;
}

export function ListingTypeBadge({ type }: { type: MarketplaceListingType }) {
  const map: Record<MarketplaceListingType, string> = {
    "Fixed price": "bg-slate-50 text-slate-700 ring-slate-200",
    "Best offer": "bg-sky-50 text-sky-700 ring-sky-200",
    "Timed auction": "bg-indigo-50 text-indigo-700 ring-indigo-200",
    "Buy it now": "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Trade-only enquiry": "bg-amber-50 text-amber-700 ring-amber-200",
  };
  return <Badge className={map[type]}>{type}</Badge>;
}

export function FitScoreBadge({ score, label }: { score: number; label?: FitLabel }) {
  const className =
    score >= 82
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : score >= 68
        ? "bg-teal-50 text-teal-700 ring-teal-200"
        : score >= 50
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : "bg-red-50 text-red-700 ring-red-200";
  return <Badge className={className}>{label ? `${score}% · ${label}` : `${score}% fit`}</Badge>;
}
