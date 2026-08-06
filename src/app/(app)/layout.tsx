import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { accessFor } from "@/lib/billing";
import { requireUser } from "@/lib/session";
import { isBillingConfigured } from "@/lib/stripe";

/**
 * The gate.
 *
 * It only closes when there is somewhere to pay: a deployment with no Stripe
 * key leaves the trial running rather than locking people out of a product
 * that cannot take their money. Pricing, the legal pages and sign-out sit
 * outside this group and stay reachable, and nothing is deleted when the day
 * runs out — the account is waiting on the other side of a subscription.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  if (isBillingConfigured() && !accessFor(user).allowed) {
    redirect("/pricing?trial=over");
  }

  return <AppShell>{children}</AppShell>;
}
