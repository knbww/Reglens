import Link from "next/link";

import type { RiskAssessment } from "@/lib/risk";
import { cn } from "@/lib/utils";

/**
 * The risk score, set rather than drawn.
 *
 * A dial spends a lot of ink telling you that 79 is more than 50, which the
 * numeral already says. What the numeral cannot say is what to do about it, so
 * the space goes to the drivers instead — each one a sentence with its weight,
 * ordered heaviest first. Only the overdue row takes colour.
 */
export function RiskCard({ risk }: { risk: RiskAssessment }) {
  const increases = risk.factors.filter((f) => f.direction === "increase");
  const decreases = risk.factors.filter((f) => f.direction === "decrease");
  const pressing = risk.level === "High" || risk.level === "Critical";

  return (
    <section className="rise grid gap-x-12 gap-y-6 border-b border-line pb-10 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div>
        <h2 className="text-xs font-medium tracking-wide text-ink-muted">Policy Risk Score</h2>
        <p
          className={cn(
            "mt-3 text-figure font-semibold",
            pressing ? "text-alert" : "text-ink",
          )}
        >
          {risk.score}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {risk.level} exposure, out of 100
        </p>
        <p className="mt-4 max-w-xs text-[13px] leading-6 text-ink-soft">{risk.summary}</p>
        <Link
          href="/planner"
          className="mt-4 inline-block text-[13px] font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
        >
          Work the list that moves this
        </Link>
      </div>

      <div className="min-w-0">
        <h3 className="text-xs font-medium tracking-wide text-ink-muted">What is driving this</h3>

        {risk.factors.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">
            Not enough tracked activity yet. Add tasks and monitoring to make this meaningful.
          </p>
        ) : (
          <dl className="mt-3">
            {[...increases, ...decreases].map((factor) => (
              <div
                key={factor.label}
                className="flex items-baseline gap-4 border-b border-line py-2.5 last:border-b-0"
              >
                <dt className="min-w-0 flex-1">
                  <span className="block text-[13px] text-ink">{factor.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-ink-muted">
                    {factor.detail}
                  </span>
                </dt>
                <dd
                  className={cn(
                    "tabular shrink-0 text-lg font-semibold",
                    factor.direction === "increase" && factor.points >= 15
                      ? "text-alert"
                      : "text-ink-soft",
                  )}
                >
                  {factor.direction === "increase" ? "+" : "−"}
                  {factor.points}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <p className="mt-3 text-xs text-ink-muted">
          A transparent, rules-based indicator — not a legal judgement.
        </p>
      </div>
    </section>
  );
}
