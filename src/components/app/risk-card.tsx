import Link from "next/link";

import { AnimatedNumber, Gauge, StackedBar, type BarSegment } from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import { SEVERITY_BAR, SEVERITY_TEXT, type Severity } from "@/lib/severity";
import type { RiskAssessment } from "@/lib/risk";
import { cn } from "@/lib/utils";

function severityForLevel(level: RiskAssessment["level"]): Severity {
  return { Low: "clear", Moderate: "watch", High: "act", Critical: "over" }[level] as Severity;
}

/** Bigger contributions get the more urgent rung — width and colour agree. */
function severityForPoints(points: number, max: number): Severity {
  const share = max === 0 ? 0 : points / max;
  if (share >= 0.85) return "over";
  if (share >= 0.6) return "act";
  return "watch";
}

/**
 * The risk score as the thesis of the dashboard rather than one stat among
 * four. The arc reads as "far into the red" pre-verbally, and each driver's
 * bar width is its point contribution — so the biggest lever is literally the
 * widest thing on screen. Every label, value and caveat from the old card
 * survives, in the key beneath.
 */
export function RiskCard({ risk }: { risk: RiskAssessment }) {
  const severity = severityForLevel(risk.level);
  const increases = risk.factors.filter((f) => f.direction === "increase");
  const decreases = risk.factors.filter((f) => f.direction === "decrease");
  const maxPoints = Math.max(1, ...increases.map((f) => f.points));

  const segments: BarSegment[] = increases.map((factor) => ({
    key: factor.label,
    value: factor.points,
    label: factor.label,
    severity: severityForPoints(factor.points, maxPoints),
  }));

  return (
    <Card className="rise overflow-hidden">
      <CardContent className="grid gap-6 p-5 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)] sm:items-center">
        <div className="flex flex-col items-center">
          {/* The hero has to say what its own number is. */}
          <h2 className="text-[15px] font-semibold tracking-[-0.006em] text-ink">Policy Risk Score</h2>
          <Gauge value={risk.score} severity={severity} className="mt-2 max-w-[190px]" />
          <p className={cn("-mt-9 text-[42px] font-semibold leading-none", SEVERITY_TEXT[severity])}>
            <AnimatedNumber value={risk.score} />
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">
            {risk.level.toLowerCase()} exposure, out of 100
          </p>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="text-[15px] font-semibold tracking-[-0.006em] text-ink">
              What is driving this
            </h3>
            <p className="text-xs text-ink-muted">A transparent indicator, not a legal judgement.</p>
          </div>

          <p className="text-sm leading-6 text-ink-soft">{risk.summary}</p>

          {segments.length > 0 ? <StackedBar segments={segments} /> : null}

          {risk.factors.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Not enough tracked activity yet. Add tasks and monitoring to make this meaningful.
            </p>
          ) : (
            <ul className="grid gap-1.5">
              {/* Not sliced: capping the list at six silently hid the factors
                  that reduce the score, which are the reassuring half. */}
              {[...increases, ...decreases].map((factor, index) => {
                const rung =
                  factor.direction === "increase"
                    ? severityForPoints(factor.points, maxPoints)
                    : ("clear" as Severity);
                return (
                  <li
                    key={factor.label}
                    style={{ ["--rise-i" as string]: index }}
                    className="slide-in flex items-center gap-2.5 text-[13px]"
                  >
                    <span
                      aria-hidden
                      className={cn("size-2 shrink-0 rounded-[2px]", SEVERITY_BAR[rung])}
                    />
                    <span className="min-w-0 flex-1 truncate text-ink-soft" title={factor.detail}>
                      {factor.label}
                    </span>
                    <span className={cn("tabular shrink-0 text-xs font-medium", SEVERITY_TEXT[rung])}>
                      {factor.direction === "increase" ? "+" : "−"}
                      {factor.points}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <Link href="/planner" className="inline-block text-xs font-medium text-brand hover:underline">
            Work the list that moves this →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
