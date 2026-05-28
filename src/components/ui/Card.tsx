import type { ReactNode } from "react";
import { cx } from "../../lib/utils/format";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <section className={cx("rounded-lg border border-slate-200 bg-white shadow-sm", className)}>{children}</section>;
}

export function CardHeader({
  title,
  eyebrow,
  action,
  className,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-5", className)}>
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wide text-signal-600">{eyebrow}</p> : null}
        <h2 className="mt-1 text-base font-semibold text-slate-950">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cx("p-5", className)}>{children}</div>;
}
