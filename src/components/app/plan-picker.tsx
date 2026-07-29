"use client";

import type { PlanTier } from "@prisma/client";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { selectPlan } from "@/lib/actions/business";
import { formatPrice, PLAN_CATALOG } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useAction } from "@/lib/use-action";

export function PlanPicker({
  currentTier,
  signedIn,
}: {
  currentTier: PlanTier | null;
  signedIn: boolean;
}) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [busy, setBusy] = useState<PlanTier | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function choose(tier: PlanTier) {
    if (!signedIn) {
      router.push("/sign-up");
      return;
    }
    setBusy(tier);
    setMessage(null);
    run(async () => {
      await selectPlan(tier);
      setBusy(null);
      setMessage(
        `You are now on the ${PLAN_CATALOG.find((p) => p.tier === tier)?.name} plan. No payment is taken — the MVP records the selection only.`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_CATALOG.map((plan) => {
          const isCurrent = currentTier === plan.tier;
          return (
            <div
              key={plan.tier}
              className={cn(
                "flex flex-col rounded-card border bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
                plan.highlighted ? "border-brand ring-1 ring-brand-ring" : "border-line",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{plan.name}</h3>
                {plan.highlighted ? <Badge tone="brand">Most popular</Badge> : null}
                {isCurrent ? <Badge tone="success">Current plan</Badge> : null}
              </div>

              <p className="mt-3">
                <span className="text-3xl font-semibold tracking-tight text-ink tabular">
                  {formatPrice(plan.priceMonthly)}
                </span>
                <span className="ml-1 text-sm text-ink-muted">
                  {plan.priceMonthly === 0 ? "forever" : "per month"}
                </span>
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{plan.tagline}</p>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-ink-soft">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                className="mt-5 w-full"
                size="lg"
                variant={plan.highlighted ? "primary" : "secondary"}
                disabled={pending || isCurrent}
                onClick={() => choose(plan.tier)}
              >
                {isCurrent
                  ? "Your current plan"
                  : busy === plan.tier
                    ? "Selecting…"
                    : signedIn
                      ? `Switch to ${plan.name}`
                      : `Start with ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      {message ? (
        <p className="rounded-lg border border-success/25 bg-success-soft px-3 py-2 text-sm text-success">
          {message}
        </p>
      ) : null}

      <p className="text-xs leading-5 text-ink-muted">
        Pricing shown is the current MVP hypothesis. RegLens does not process payments: selecting a plan records
        your choice on your account so the team can validate demand, and every feature stays available while the
        product is in this stage.
      </p>
    </div>
  );
}
