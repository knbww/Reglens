import type { PlanTier } from "@prisma/client";

export type PlanDefinition = {
  tier: PlanTier;
  name: string;
  priceMonthly: number; // cents
  tagline: string;
  features: string[];
  highlighted: boolean;
};

/** How long a new account has the whole product for nothing. */
export const TRIAL_HOURS = 24;

/** What continuing costs, in cents. One price, one product. */
export const PRO_PRICE_MONTHLY = 2900;

/** The Stripe price is found by this key, so no dashboard id is hard-coded. */
export const PRO_PRICE_LOOKUP_KEY = "reglens_pro_monthly";

/**
 * Two states, not a ladder of tiers.
 *
 * The three-tier catalogue asked people to predict which of ten limits they
 * would hit before they had read a single requirement — and the top tier
 * priced a promise ("positioned for future ERP integrations") rather than
 * anything that exists. A day of the real thing answers the question the
 * pricing table was asking on the reader's behalf.
 */
export const PLAN_CATALOG: PlanDefinition[] = [
  {
    tier: "FREE",
    name: `Free for ${TRIAL_HOURS} hours`,
    priceMonthly: 0,
    tagline: "The whole product, from the moment you sign up. No card.",
    features: [
      "Every requirement RegLens holds for your jurisdictions",
      "The AI Analyst, grounded in your own profile",
      "Action planner, deadlines and reminders",
      "Policy monitoring and the change feed",
      "Jurisdiction comparison and compliance reports",
    ],
    highlighted: false,
  },
  {
    tier: "PRO",
    name: "RegLens",
    priceMonthly: PRO_PRICE_MONTHLY,
    tagline: "Everything in the trial, kept — and kept watching while you work.",
    features: [
      "Everything above, without the clock",
      "Up to 3 business profiles",
      "Monitoring that keeps running between visits",
      "Deadline reminders and notifications",
      "Cancel whenever — the month you are in stays yours",
    ],
    highlighted: true,
  },
];

export function planByTier(tier: PlanTier): PlanDefinition {
  return PLAN_CATALOG.find((p) => p.tier === tier) ?? PLAN_CATALOG[0];
}

export function formatPrice(cents: number): string {
  if (cents === 0) return "$0";
  return `$${(cents / 100).toFixed(0)}`;
}
