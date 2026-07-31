"use client";

import * as React from "react";

import { SEVERITY_BAR, SEVERITY_TEXT, type Severity } from "@/lib/severity";
import { cn } from "@/lib/utils";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Honours the OS setting, so JS-driven motion opts out alongside the CSS.
 * The server snapshot reports "reduced" so nothing animates before hydration.
 */
function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
}

/**
 * A number that counts up to its value on first paint.
 *
 * Figures are the point of most of these screens; letting them arrive rather
 * than blink into place is the difference between a page that renders and one
 * that reports.
 */
export function AnimatedNumber({
  value,
  duration = 700,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [counted, setCounted] = React.useState(0);

  React.useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const start = performance.now();
    function step(now: number) {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic — fast to begin, settles rather than stops.
      const eased = 1 - Math.pow(1 - t, 3);
      setCounted(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  return <span className={cn("tabular", className)}>{reduced ? value : counted}</span>;
}

/**
 * Semicircular gauge on the severity ramp.
 *
 * The arc reads as "deep in the red" before the digits are processed, which is
 * the whole job — the number was already on screen and wasn't doing it.
 */
export function Gauge({
  value,
  max = 100,
  severity,
  className,
}: {
  value: number;
  max?: number;
  severity: Severity;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const pct = Math.max(0, Math.min(1, value / max));
  const radius = 82;
  const length = Math.PI * radius;
  const [swept, setSwept] = React.useState(0);

  React.useEffect(() => {
    if (reduced) return;
    // One frame at zero, then the transition carries it to the value.
    const id = requestAnimationFrame(() => setSwept(pct));
    return () => cancelAnimationFrame(id);
  }, [pct, reduced]);

  const drawn = reduced ? pct : swept;
  const angle = Math.PI * (1 - drawn);
  const knobX = 100 + radius * Math.cos(angle);
  const knobY = 104 - radius * Math.sin(angle);

  return (
    <svg
      viewBox="0 0 200 118"
      className={cn("w-full", className)}
      role="img"
      aria-label={`${value} out of ${max}`}
    >
      <defs>
        <linearGradient id="reglens-gauge-ramp" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-sev-clear)" />
          <stop offset="34%" stopColor="var(--color-sev-watch)" />
          <stop offset="67%" stopColor="var(--color-sev-act)" />
          <stop offset="100%" stopColor="var(--color-sev-over)" />
        </linearGradient>
      </defs>
      <path
        d="M18 104 A82 82 0 0 1 182 104"
        fill="none"
        stroke="var(--color-line)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M18 104 A82 82 0 0 1 182 104"
        fill="none"
        stroke="url(#reglens-gauge-ramp)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - drawn)}
        style={{ transition: reduced ? undefined : "stroke-dashoffset 900ms var(--ease-out)" }}
      />
      <circle
        cx={knobX}
        cy={knobY}
        r="6.5"
        fill="var(--color-surface)"
        strokeWidth="3.5"
        className={SEVERITY_TEXT[severity]}
        stroke="currentColor"
        style={{ transition: reduced ? undefined : "all 900ms var(--ease-out)" }}
      />
    </svg>
  );
}

export type BarSegment = {
  key: string;
  value: number;
  label: string;
  severity: Severity;
};

/**
 * Horizontal stacked bar where each segment's width is its contribution.
 * Makes the biggest lever literally the widest thing on the row.
 */
export function StackedBar({
  segments,
  className,
  height = "h-6",
}: {
  segments: BarSegment[];
  className?: string;
  height?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  return (
    <div
      className={cn("flex gap-[2px] overflow-hidden rounded-md", height, className)}
      role="img"
      aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
    >
      {segments.map((segment, index) => (
        <span
          key={segment.key}
          title={`${segment.label} · ${segment.value}`}
          style={{ flex: segment.value, ["--rise-i" as string]: index }}
          className={cn("grow-x block", SEVERITY_BAR[segment.severity])}
        />
      ))}
    </div>
  );
}

export type StrataLayer = { name: string; count: number; severity: Severity; planned?: boolean };
export type StrataColumn = { country: string; total: number; layers: StrataLayer[] };

/**
 * Regulatory strata — federal over state over local, per country.
 *
 * Draws what the comparison page already promises in words: "the federal rules
 * that sit above each state or province". Replaces the numeral 4, which said
 * neither which, nor at what level, nor where you have not gone yet.
 */
export function Strata({ columns, className }: { columns: StrataColumn[]; className?: string }) {
  return (
    <div className={cn("grid gap-3", className)} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
      {columns.map((column) => (
        <div key={column.country} className="grid content-start gap-1">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="truncate text-xs font-semibold text-ink">{column.country}</span>
            <span className="tabular text-[11px] text-ink-muted">{column.total}</span>
          </div>
          {column.layers.map((layer, index) => (
            <div
              key={layer.name}
              style={{ ["--rise-i" as string]: index }}
              className={cn(
                "rise relative flex min-h-8 items-center justify-between gap-2 overflow-hidden rounded px-2",
                layer.planned && "outline-1 outline-dashed outline-offset-[-1px] outline-brand-ring",
              )}
            >
              {!layer.planned ? (
                <span
                  aria-hidden
                  className={cn("absolute inset-0", SEVERITY_BAR[layer.severity])}
                  style={{ opacity: layer.count === 0 ? 0.05 : 0.1 + Math.min(0.16, layer.count * 0.03) }}
                />
              ) : null}
              <span
                className={cn(
                  "relative truncate text-[11.5px]",
                  layer.planned ? "text-brand" : layer.count === 0 ? "text-ink-muted/60" : "text-ink-soft",
                )}
              >
                {layer.name}
              </span>
              <span
                className={cn(
                  "tabular relative text-[11px]",
                  layer.planned ? "text-brand" : layer.count === 0 ? "text-ink-muted/60" : "text-ink",
                )}
              >
                {layer.count === 0 ? "—" : layer.count}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
