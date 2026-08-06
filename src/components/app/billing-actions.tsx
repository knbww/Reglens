"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { openBillingPortal, startCheckout } from "@/lib/actions/billing";
import { useAction } from "@/lib/use-action";

/**
 * Subscribing, and everything after it. The card, the invoices and cancelling
 * are Stripe's screens — this is the door to them, not a copy of them.
 */
export function BillingActions({
  subscribed,
  configured,
}: {
  subscribed: boolean;
  configured: boolean;
}) {
  const { busy: pending, run } = useAction();
  const [error, setError] = useState<string | null>(null);

  if (!configured) {
    return (
      <p className="max-w-2xl text-[13px] leading-6 text-ink-muted">
        Card payments are not switched on for this deployment, so nothing is charged and the trial
        does not close the product.
      </p>
    );
  }

  function go(work: () => Promise<{ ok: true; url: string } | { ok: false; error: string }>) {
    setError(null);
    run(async () => {
      const result = await work();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.assign(result.url);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {subscribed ? (
          <Button type="button" variant="secondary" onClick={() => go(openBillingPortal)} disabled={pending}>
            {pending ? "Opening Stripe…" : "Manage subscription"}
          </Button>
        ) : (
          <>
            <Button type="button" onClick={() => go(startCheckout)} disabled={pending}>
              {pending ? "Opening Stripe…" : "Subscribe"}
            </Button>
            <Link href="/pricing" className={buttonVariants({ variant: "ghost" })}>
              What it includes
            </Link>
          </>
        )}
      </div>

      {error ? (
        <p role="alert" className="mt-3 max-w-2xl text-[13px] leading-6 text-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
