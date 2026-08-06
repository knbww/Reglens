import type Stripe from "stripe";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isBillingConfigured, stripe } from "@/lib/stripe";

/**
 * What Stripe says happened.
 *
 * The app never marks itself paid from a redirect — a success URL is just a
 * browser being told where to go next and can be visited by anyone. Every
 * change to a subscription enters here, signed, or not at all.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isBillingConfigured() || !secret) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Unsigned." }, { status: 400 });

  let event: Stripe.Event;
  try {
    // The raw body, byte for byte — parsing it first would break the signature.
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (cause) {
    return NextResponse.json({ error: (cause as Error).message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!userId || !subscriptionId) break;

      const subscription = await stripe().subscriptions.retrieve(subscriptionId);
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: "PRO",
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null),
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: periodEnd(subscription),
        },
      });
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customer =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

      // Either identifier finds the account: the id travels in metadata from
      // checkout, and the customer is on file from the first session.
      const userId = subscription.metadata?.userId;
      const where = userId ? { id: userId } : { stripeCustomerId: customer };
      const ended = event.type === "customer.subscription.deleted";

      await prisma.user.updateMany({
        where,
        data: {
          plan: ended ? "FREE" : "PRO",
          stripeCustomerId: customer,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: ended ? "canceled" : subscription.status,
          currentPeriodEnd: periodEnd(subscription),
        },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

/**
 * When the paid-for period runs out.
 *
 * Stripe moved this from the subscription to its items; read the item and
 * fall back to the legacy field so an older API version still reports it.
 */
function periodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items?.data?.[0] as { current_period_end?: number } | undefined;
  const seconds =
    item?.current_period_end ?? (subscription as unknown as { current_period_end?: number }).current_period_end;
  return seconds ? new Date(seconds * 1000) : null;
}
