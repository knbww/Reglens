import Stripe from "stripe";

import { PRO_PRICE_LOOKUP_KEY, PRO_PRICE_MONTHLY } from "./plans";

/**
 * Stripe, or nothing at all.
 *
 * Every caller checks `isBillingConfigured()` first, and the app runs whole
 * without a key: the trial simply never ends, because locking someone out of
 * a product that has no way to take their money is the one outcome worse than
 * giving it away.
 */
export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  client ??= new Stripe(key);
  return client;
}

/**
 * The one price, found by lookup key and created on first use.
 *
 * Nothing here refers to a `price_…` id copied out of a dashboard: a fresh
 * Stripe account — test mode, live mode, or a replacement after this one — is
 * ready the first time somebody clicks Subscribe.
 */
export async function proPriceId(): Promise<string> {
  const api = stripe();

  const found = await api.prices.list({
    lookup_keys: [PRO_PRICE_LOOKUP_KEY],
    active: true,
    limit: 1,
  });
  if (found.data[0]) return found.data[0].id;

  const product = await api.products.create({
    name: "RegLens",
    description: "Regulatory intelligence for growing organisations.",
  });

  const price = await api.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: PRO_PRICE_MONTHLY,
    recurring: { interval: "month" },
    lookup_key: PRO_PRICE_LOOKUP_KEY,
  });

  return price.id;
}
