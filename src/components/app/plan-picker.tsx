"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { startCheckout } from "@/lib/actions/billing";
import type { Access } from "@/lib/billing";
import { formatPrice, PLAN_CATALOG, TRIAL_HOURS } from "@/lib/plans";
import { trialRemaining } from "@/lib/billing";
import { useAction } from "@/lib/use-action";

/**
 * Two columns, a rule between them, no cards and no "most popular" ribbon on a
 * choice of two. The left one states what is already running; the right one is
 * the only thing on the page you can buy.
 */
export function PlanPicker({ access, signedIn }: { access: Access | null; signedIn: boolean }) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [error, setError] = useState<string | null>(null);

  const [trial, pro] = PLAN_CATALOG;
  const subscribed = access?.state === "subscribed";

  function subscribe() {
    if (!signedIn) {
      router.push("/sign-up");
      return;
    }
    setError(null);
    run(async () => {
      const result = await startCheckout();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Stripe's own page, on Stripe's own domain — a full navigation.
      window.location.assign(result.url);
    });
  }

  return (
    <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
      <section>
        <h2 className="text-title font-semibold text-ink">{trial.name}</h2>
        <p className="tabular mt-2 text-[15px] text-ink-soft">
          {formatPrice(trial.priceMonthly)} — no card
        </p>
        <p className="mt-3 max-w-md text-[15px] leading-7 text-ink-soft">{trial.tagline}</p>

        <ul className="mt-5 max-w-md">
          {trial.features.map((feature) => (
            <li key={feature} className="border-b border-line py-2.5 text-[15px] leading-6 text-ink-soft last:border-b-0">
              {feature}
            </li>
          ))}
        </ul>

        <p className="mt-5 text-[13px] leading-6 text-ink-muted">
          {access
            ? access.state === "trial"
              ? `Running now — ${trialRemaining(access.trialEndsAt)}.`
              : access.state === "expired"
                ? "Used up."
                : "Superseded by your subscription."
            : `Starts the moment you sign up and runs for ${TRIAL_HOURS} hours.`}
        </p>

        {!signedIn ? (
          <p className="mt-4">
            <Button type="button" variant="secondary" onClick={() => router.push("/sign-up")}>
              Start free
            </Button>
          </p>
        ) : null}
      </section>

      <section className="border-t border-line pt-8 md:border-l md:border-t-0 md:pl-12 md:pt-0">
        <h2 className="text-title font-semibold text-ink">{pro.name}</h2>
        <p className="tabular mt-2 text-[15px] text-ink">
          <span className="font-medium">{formatPrice(pro.priceMonthly)}</span>
          <span className="text-ink-soft"> a month</span>
        </p>
        <p className="mt-3 max-w-md text-[15px] leading-7 text-ink-soft">{pro.tagline}</p>

        <ul className="mt-5 max-w-md">
          {pro.features.map((feature) => (
            <li key={feature} className="border-b border-line py-2.5 text-[15px] leading-6 text-ink-soft last:border-b-0">
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-5">
          {subscribed ? (
            <p className="text-[15px] leading-7 text-ink-soft">
              This is your plan. The card, the invoices and cancelling live in{" "}
              <a href="/settings" className="counsel-link">
                your settings
              </a>
              .
            </p>
          ) : (
            <Button type="button" onClick={subscribe} disabled={pending}>
              {pending ? "Opening Stripe…" : signedIn ? "Subscribe" : "Start free, then subscribe"}
            </Button>
          )}
        </div>

        {error ? (
          <p role="alert" className="mt-3 max-w-md text-[13px] leading-6 text-alert">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
