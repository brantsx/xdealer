import { Link } from "react-router-dom";
import { cx } from "../../lib/utils/format";

interface LogoProps {
  to?: string;
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  tagline?: string;
  className?: string;
}

const sizeClasses = {
  sm: {
    mark: "h-8 w-8",
    text: "text-lg",
    tagline: "text-[11px]",
  },
  md: {
    mark: "h-10 w-10",
    text: "text-xl",
    tagline: "text-xs",
  },
  lg: {
    mark: "h-11 w-11",
    text: "text-2xl",
    tagline: "text-xs",
  },
};

function LogoContent({ tone = "dark", size = "md", tagline, className }: Omit<LogoProps, "to">) {
  const sizes = sizeClasses[size];
  const light = tone === "light";

  return (
    <span className={cx("inline-flex items-center gap-3", className)}>
      <span className="leading-none">
        <span
          className={cx(
            "block font-black tracking-normal",
            sizes.text,
            light ? "text-white" : "text-ink-950",
          )}
        >
          <span className="text-signal-500">x</span>Dealer
        </span>
        {tagline ? (
          <span className={cx("mt-1 block font-medium", sizes.tagline, light ? "text-slate-300" : "text-slate-500")}>
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function Logo({ to, ...props }: LogoProps) {
  if (to) {
    return (
      <Link to={to} className="inline-flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-500">
        <LogoContent {...props} />
      </Link>
    );
  }
  return <LogoContent {...props} />;
}
