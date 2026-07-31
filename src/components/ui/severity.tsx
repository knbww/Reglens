import * as React from "react";

import {
  SEVERITY_BAR,
  SEVERITY_LABEL,
  SEVERITY_SOFT,
  severityFromRelevance,
  type Severity,
} from "@/lib/severity";
import { cn } from "@/lib/utils";

/**
 * A severity spine on a card's leading edge.
 *
 * Replaces the "importance" pill. Importance is a magnitude, and magnitudes
 * want geometry — a coloured edge is readable at ten feet, where a third pill
 * competing with the headline is not.
 */
export function Spine({
  severity,
  className,
  children,
  label,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  severity: Severity;
  /** Announced text, since the colour alone carries no meaning to a reader. */
  label?: string;
}) {
  return (
    <div className={cn("relative", className)} {...props}>
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-2 left-0 w-[3px] rounded-full",
          SEVERITY_BAR[severity],
        )}
      />
      <span className="sr-only">{label ?? SEVERITY_LABEL[severity]}</span>
      {children}
    </div>
  );
}

/**
 * Five-segment relevance meter. Replaces "Highly relevant · 99", which spent a
 * full pill saying something a glance can carry — while keeping the integer.
 */
export function Meter({
  value,
  max = 100,
  severity,
  showValue = true,
  label,
  className,
}: {
  value: number;
  max?: number;
  severity?: Severity;
  showValue?: boolean;
  label?: string;
  className?: string;
}) {
  const segments = 5;
  const filled = Math.max(0, Math.min(segments, Math.round((value / max) * segments)));
  const rung = severity ?? severityFromRelevance((value / max) * 100);

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={label ?? `Relevance ${value} of ${max}`}
    >
      <span aria-hidden className="inline-flex gap-[2px]">
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-3 w-1 rounded-[1px] transition-colors",
              i < filled ? SEVERITY_BAR[rung] : "bg-line-strong",
            )}
          />
        ))}
      </span>
      {showValue ? (
        <span className="tabular text-[11px] leading-none text-ink-muted">{value}</span>
      ) : null}
      <span className="sr-only">{label ?? `Relevance ${value} of ${max}`}</span>
    </span>
  );
}

/** A small filled dot — severity where there is no room for anything else. */
export function SeverityDot({
  severity,
  className,
  label,
}: {
  severity: Severity;
  className?: string;
  label?: string;
}) {
  return (
    <>
      <span
        aria-hidden
        className={cn("inline-block size-2 shrink-0 rounded-full", SEVERITY_BAR[severity], className)}
      />
      <span className="sr-only">{label ?? SEVERITY_LABEL[severity]}</span>
    </>
  );
}

/** Compact severity-tinted chip, for the one categorical label that remains. */
export function SeverityChip({
  severity,
  children,
  className,
}: {
  severity: Severity;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium leading-5",
        SEVERITY_SOFT[severity],
        className,
      )}
    >
      {children}
    </span>
  );
}
