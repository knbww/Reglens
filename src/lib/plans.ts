import type { PlanTier } from "@prisma/client";

export type PlanLimits = {
  businesses: number | null;
  policySearches: number | null;
  aiQuestions: number | null;
  monitoredItems: number | null;
};

export type PlanDefinition = {
  tier: PlanTier;
  name: string;
  priceMonthly: number; // cents
  tagline: string;
  features: string[];
  limits: PlanLimits;
  highlighted: boolean;
};

/**
 * MVP pricing hypothesis. Plan selection is persisted on the user record and
 * gates nothing destructive — there is no billing integration in the MVP.
 */
export const PLAN_CATALOG: PlanDefinition[] = [
  {
    tier: "FREE",
    name: "Free",
    priceMonthly: 0,
    tagline: "See how RegLens reads your business before committing.",
    features: [
      "Short onboarding — company basics only",
      "10 policy searches per month",
      "3 AI Analyst questions per month",
      "Dashboard preview with risk score",
      "1 business profile",
    ],
    limits: { businesses: 1, policySearches: 10, aiQuestions: 3, monitoredItems: 3 },
    highlighted: false,
  },
  {
    tier: "PRO",
    name: "Pro",
    priceMonthly: 2900,
    tagline: "For a small team carrying compliance without a specialist.",
    features: [
      "Full business profile and onboarding survey",
      "Unlimited policy search",
      "Personalised AI policy analysis",
      "Custom compliance checklists",
      "Action planner with tasks and deadlines",
      "Deadline reminders and notifications",
      "Policy monitoring and change feed",
      "Jurisdiction comparison",
      "Compliance reports",
    ],
    limits: { businesses: 3, policySearches: null, aiQuestions: null, monitoredItems: 50 },
    highlighted: true,
  },
  {
    tier: "BUSINESS",
    name: "Business",
    priceMonthly: 9900,
    tagline: "For organisations tracking several entities or jurisdictions.",
    features: [
      "Everything in Pro",
      "Multiple business profiles, team-ready",
      "Expanded monitoring across jurisdictions and topics",
      "Advanced reports with change history",
      "Priority AI analysis queue",
      "Positioned for future ERP and document integrations",
    ],
    limits: { businesses: 25, policySearches: null, aiQuestions: null, monitoredItems: null },
    highlighted: false,
  },
];

export function planByTier(tier: PlanTier): PlanDefinition {
  return PLAN_CATALOG.find((p) => p.tier === tier) ?? PLAN_CATALOG[0];
}

export function formatPrice(cents: number): string {
  if (cents === 0) return "$0";
  return `$${(cents / 100).toFixed(0)}`;
}
