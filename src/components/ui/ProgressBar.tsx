import { cx } from "../../lib/utils/format";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const colour =
    value >= 80 ? "bg-emerald-500" : value >= 65 ? "bg-sky-500" : value >= 45 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className={cx("h-2 overflow-hidden rounded-full bg-slate-100", className)}>
      <div className={cx("h-full rounded-full", colour)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
