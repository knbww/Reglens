"use server";

import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isBillingConfigured, proPriceId, stripe } from "@/lib/stripe";

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

async function origin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** The Stripe customer for this account, made once and remembered. */
async function customerId(userId: string, email: string, name: string | null): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe().customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId },
  });
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

/**
 * Starts the subscription. Returns a URL rather than redirecting, so the
 * button that called it can report a failure in place instead of navigating
 * into one.
 */
export async function startCheckout(): Promise<CheckoutResult> {
  const user = await requireUser();

  if (!isBillingConfigured()) {
    return { ok: false, error: "Card payments are not switched on for this deployment yet." };
  }

  try {
    const site = await origin();
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      // No `payment_method_types`: leaving it off is what lets Stripe offer
      // each customer the methods their country and the dashboard allow.
      integration_identifier: "reglens-subscription-qwmtzkbr",
      line_items: [{ price: await proPriceId(), quantity: 1 }],
      customer: await customerId(user.id, user.email, user.fullName),
      client_reference_id: user.id,
      allow_promotion_codes: true,
      success_url: `${site}/settings?checkout=done`,
      cancel_url: `${site}/pricing?checkout=cancelled`,
      subscription_data: { metadata: { userId: user.id } },
    });

    if (!session.url) return { ok: false, error: "Stripe did not return a checkout page." };
    return { ok: true, url: session.url };
  } catch (cause) {
    return { ok: false, error: (cause as Error).message };
  }
}

/** Stripe's own screen for the card, the invoices and cancelling. */
export async function openBillingPortal(): Promise<CheckoutResult> {
  const user = await requireUser();

  if (!isBillingConfigured() || !user.stripeCustomerId) {
    return { ok: false, error: "There is no subscription on this account yet." };
  }

  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${await origin()}/settings`,
    });
    return { ok: true, url: session.url };
  } catch (cause) {
    return { ok: false, error: (cause as Error).message };
  }
}
