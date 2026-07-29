import type { Business, BusinessJurisdiction, BusinessProfile, Policy } from "@prisma/client";

export type BusinessWithContext = Business & {
  profile: BusinessProfile | null;
  jurisdictions: BusinessJurisdiction[];
};

export type RelevanceBand = "high" | "medium" | "low";

export type Relevance = {
  score: number; // 0–100
  band: RelevanceBand;
  reasons: string[];
};

const BAND_LABEL: Record<RelevanceBand, string> = {
  high: "Highly relevant",
  medium: "Possibly relevant",
  low: "Background",
};

export function relevanceLabel(band: RelevanceBand): string {
  return BAND_LABEL[band];
}

/**
 * Maps an activity the business told us about to the regulatory topics that
 * activity tends to pull in. Used to explain *why* a policy surfaced.
 */
const ACTIVITY_TOPICS: { flag: keyof BusinessProfile; topics: string[]; reason: string }[] = [
  {
    flag: "importsProducts",
    topics: ["imports_customs", "product_standards", "product_safety", "textile_labeling"],
    reason: "you import products",
  },
  {
    flag: "employsStaff",
    topics: ["employment"],
    reason: "you employ staff",
  },
  {
    flag: "handlesCustomerData",
    topics: ["privacy"],
    reason: "you handle customer data",
  },
  {
    flag: "physicalLocations",
    topics: ["permits_licenses", "food_sanitation"],
    reason: "you operate physical locations",
  },
  {
    flag: "sellsCrossBorder",
    topics: ["taxation", "imports_customs"],
    reason: "you sell across state or national borders",
  },
  {
    flag: "requiresLicenses",
    topics: ["permits_licenses", "certification_renewals", "education_licensing"],
    reason: "your work requires licences or certifications",
  },
  {
    flag: "regulatedIndustry",
    topics: ["product_standards", "telecom_regulation", "machinery_safety", "food_sanitation"],
    reason: "you operate in a regulated industry",
  },
];

/**
 * Scores a policy against the active business.
 *
 * Deliberately explainable rather than clever: every point added carries a
 * human-readable reason, because the UI shows users why something surfaced.
 */
export function scoreRelevance(policy: Policy, business: BusinessWithContext | null): Relevance {
  if (!business) {
    return { score: 20, band: "low", reasons: ["No active business selected"] };
  }

  const profile = business.profile;
  const reasons: string[] = [];
  let score = 0;

  // --- Jurisdiction --------------------------------------------------------
  const operating = business.jurisdictions.filter((j) => j.role === "OPERATING").map((j) => j.jurisdictionCode);
  const targets = business.jurisdictions.filter((j) => j.role === "TARGET_EXPANSION").map((j) => j.jurisdictionCode);

  if (operating.includes(policy.jurisdictionCode)) {
    score += 38;
    reasons.push(`Applies in a jurisdiction you operate in`);
  } else if (targets.includes(policy.jurisdictionCode)) {
    score += 30;
    reasons.push(`Applies in a jurisdiction you plan to expand into`);
  } else if (operating.some((code) => code.startsWith(`${policy.jurisdictionCode}-`))) {
    // Federal policy covering a state/province the business operates in.
    score += 34;
    reasons.push(`National-level rule covering where you operate`);
  } else if (targets.some((code) => code.startsWith(`${policy.jurisdictionCode}-`))) {
    score += 26;
    reasons.push(`National-level rule covering your expansion target`);
  } else if (policy.jurisdictionCode.startsWith(`${business.country}`)) {
    score += 8;
    reasons.push(`Same country as your head office`);
  }

  // --- Industry ------------------------------------------------------------
  if (profile && policy.industryTags.includes(profile.industryKey)) {
    score += 24;
    reasons.push(`Tagged for ${profile.industryLabel.toLowerCase()}`);
  }

  // --- Stated compliance priorities ---------------------------------------
  const priorities = profile?.compliancePriorities ?? [];
  const priorityHits = policy.topicTags.filter((t) => priorities.includes(t));
  if (priorityHits.length > 0) {
    score += Math.min(20, priorityHits.length * 12);
    reasons.push(`Matches a compliance priority you selected`);
  }

  // --- Activity-driven topics ---------------------------------------------
  if (profile) {
    for (const rule of ACTIVITY_TOPICS) {
      if (profile[rule.flag] !== true) continue;
      if (!policy.topicTags.some((t) => rule.topics.includes(t))) continue;
      score += 6;
      reasons.push(`Relevant because ${rule.reason}`);
    }
  }

  // --- Importance & status -------------------------------------------------
  if (policy.importance === "CRITICAL") score += 8;
  else if (policy.importance === "HIGH") score += 5;
  if (policy.status === "REPEALED") score -= 25;
  if (policy.status === "PROPOSED") score -= 8;

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band: RelevanceBand = clamped >= 60 ? "high" : clamped >= 32 ? "medium" : "low";

  if (reasons.length === 0) reasons.push("No direct match with your business profile");

  // Keep the explanation short — the UI shows at most three reasons.
  return { score: clamped, band, reasons: Array.from(new Set(reasons)).slice(0, 4) };
}

/** Sorts policies by relevance to the business, most relevant first. */
export function rankByRelevance<T extends Policy>(
  policies: T[],
  business: BusinessWithContext | null,
): (T & { relevance: Relevance })[] {
  return policies
    .map((policy) => ({ ...policy, relevance: scoreRelevance(policy, business) }))
    .sort((a, b) => b.relevance.score - a.relevance.score);
}
