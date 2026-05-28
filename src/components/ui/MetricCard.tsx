import type { ReactNode } from "react";
import { cx } from "../../lib/utils/format";

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  tone?: "light" | "dark";
}

export function MetricCard({ label, value, helper, icon, tone = "light" }: MetricCardProps) {
  return (
    <div
      className={cx(
        "rounded-lg border p-5",
        tone === "dark"
          ? "border-white/10 bg-white/10 text-white"
          : "border-slate-200 bg-white text-slate-950 shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cx("text-sm font-medium", tone === "dark" ? "text-slate-300" : "text-slate-500")}>{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        {icon ? (
          <div className={cx("rounded-md p-2", tone === "dark" ? "bg-white/10" : "bg-slate-100 text-slate-600")}>
            {icon}
          </div>
        ) : null}
      </div>
      {helper ? <p className={cx("mt-3 text-sm", tone === "dark" ? "text-slate-300" : "text-slate-500")}>{helper}</p> : null}
    </div>
  );
}
