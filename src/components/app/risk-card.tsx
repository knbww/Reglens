import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/misc";
import { RiskBadge } from "@/components/ui/status";
import type { RiskAssessment } from "@/lib/risk";

export function RiskCard({ risk }: { risk: RiskAssessment }) {
  const tone =
    risk.level === "Low" ? "success" : risk.level === "Moderate" ? "warning" : "danger";

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Policy Risk Score</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            A transparent indicator of exposure across your tracked obligations — not a legal judgement.
          </p>
        </div>
        <RiskBadge level={risk.level} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <p className="text-4xl font-semibold tracking-tight text-ink tabular">{risk.score}</p>
          <p className="pb-1.5 text-sm text-ink-muted">/ 100 exposure</p>
        </div>
        <ProgressBar value={risk.score} tone={tone} label="Policy risk score" />
        <p className="text-sm leading-6 text-ink-soft">{risk.summary}</p>

        <div>
          <p className="mb-2 text-xs font-medium text-ink-muted">What is driving this</p>
          <ul className="space-y-2">
            {risk.factors.slice(0, 6).map((factor) => {
              const Icon =
                factor.direction === "increase" ? TrendingUp : factor.points === 0 ? Minus : TrendingDown;
              return (
                <li key={factor.label} className="flex gap-2.5">
                  <Icon
                    className={`mt-0.5 size-4 shrink-0 ${
                      factor.direction === "increase" ? "text-danger" : "text-success"
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{factor.label}</span>
                    <span className="block text-xs leading-5 text-ink-muted">{factor.detail}</span>
                  </span>
                  <span
                    className={`ml-auto shrink-0 text-xs font-medium tabular ${
                      factor.direction === "increase" ? "text-danger" : "text-success"
                    }`}
                  >
                    {factor.direction === "increase" ? "+" : "−"}
                    {factor.points}
                  </span>
                </li>
              );
            })}
          </ul>
          {risk.factors.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Not enough tracked activity yet. Add tasks and monitoring to make this meaningful.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
