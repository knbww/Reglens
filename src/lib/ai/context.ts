import type { Policy } from "@prisma/client";

import { jurisdictionName } from "@/data/jurisdictions";
import { formatDate, formatPolicyDeadlineDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { rankByRelevance, type BusinessWithContext } from "@/lib/relevance";
import { countryName, topicLabel } from "@/lib/taxonomy";
import type { PolicyDeadline, PolicyRequirement } from "@/data/policies";

export type RetrievedPolicy = Policy & { relevanceScore: number };

/**
 * Retrieval for the AI Analyst.
 *
 * Deliberately simple and local: rank the seeded corpus by the same relevance
 * model the UI uses, always include the policy the user is looking at, and cap
 * the result so the prompt stays focused.
 */
export async function retrievePolicies({
  business,
  question,
  policyId,
  limit = 5,
}: {
  business: BusinessWithContext;
  question: string;
  policyId?: string | null;
  limit?: number;
}): Promise<RetrievedPolicy[]> {
  const jurisdictionCodes = business.jurisdictions.map((j) => j.jurisdictionCode);
  const countries = Array.from(
    new Set([business.country, ...jurisdictionCodes.map((c) => c.split("-")[0])]),
  );

  const candidates = await prisma.policy.findMany({
    where: {
      OR: [
        { jurisdictionCode: { in: jurisdictionCodes } },
        { country: { in: countries } },
        { industryTags: { has: business.profile?.industryKey ?? "general_small_business" } },
      ],
    },
    take: 120,
  });

  const terms = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);

  const ranked = rankByRelevance(candidates, business).map((p) => {
    // Nudge policies whose text matches the question wording.
    const haystack = `${p.title} ${p.plainSummary} ${p.topicTags.join(" ")} ${p.agency}`.toLowerCase();
    const keywordHits = terms.filter((t) => haystack.includes(t)).length;
    return { ...p, relevanceScore: p.relevance.score + Math.min(20, keywordHits * 6) };
  });

  ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const selected: RetrievedPolicy[] = [];

  if (policyId) {
    const focused = await prisma.policy.findUnique({ where: { id: policyId } });
    if (focused) selected.push({ ...focused, relevanceScore: 100 });
  }

  for (const p of ranked) {
    if (selected.length >= limit) break;
    if (selected.some((s) => s.id === p.id)) continue;
    const { relevance: _relevance, ...policy } = p;
    void _relevance;
    selected.push(policy as RetrievedPolicy);
  }

  return selected;
}

export function describeBusiness(business: BusinessWithContext): string {
  const p = business.profile;
  const operating = business.jurisdictions
    .filter((j) => j.role === "OPERATING")
    .map((j) => jurisdictionName(j.jurisdictionCode));
  const targets = business.jurisdictions
    .filter((j) => j.role === "TARGET_EXPANSION")
    .map((j) => jurisdictionName(j.jurisdictionCode));

  const lines: string[] = [
    `Company: ${business.name}`,
    `What they do: ${business.description || "Not described"}`,
    `Head office: ${[business.city, jurisdictionName(business.region), countryName(business.country)]
      .filter(Boolean)
      .join(", ")}`,
    `Organisation type: ${business.orgType}`,
    `Size: ${business.sizeBand} (${business.employeeCount} employees)`,
    `Industry: ${p?.industryLabel ?? "Not set"}${p?.subIndustries.length ? ` — ${p.subIndustries.join(", ")}` : ""}`,
    `Operating jurisdictions: ${operating.length ? operating.join("; ") : "None recorded"}`,
    `Expansion targets: ${targets.length ? targets.join("; ") : "None recorded"}`,
  ];

  if (p) {
    if (p.productsSold.length) lines.push(`Products sold: ${p.productsSold.join(", ")}`);
    if (p.servicesProvided.length) lines.push(`Services provided: ${p.servicesProvided.join(", ")}`);

    const activities: string[] = [];
    if (p.importsProducts)
      activities.push(`imports products${p.importCountries.length ? ` from ${p.importCountries.join(", ")}` : ""}`);
    if (p.employsStaff) activities.push("employs staff");
    if (p.handlesCustomerData) activities.push("handles customer data");
    if (p.physicalLocations) activities.push("operates physical locations");
    if (p.sellsCrossBorder) activities.push("sells across state or national borders");
    if (p.requiresLicenses) activities.push("requires licences or certifications");
    if (p.regulatedIndustry) activities.push("operates in a regulated industry");
    lines.push(`Activities: ${activities.length ? activities.join("; ") : "none flagged"}`);

    if (p.plansExpansion) {
      lines.push(
        `Expansion plan: ${p.expansionActivity ?? "not described"} in ${
          [p.targetCity, p.targetRegion ? jurisdictionName(p.targetRegion) : null, p.targetCountry ? countryName(p.targetCountry) : null]
            .filter(Boolean)
            .join(", ") || "an unspecified location"
        }${p.expansionDate ? `, expected ${formatDate(p.expansionDate)}` : ""}`,
      );
    }

    if (p.compliancePriorities.length) {
      lines.push(`Stated compliance priorities: ${p.compliancePriorities.map(topicLabel).join(", ")}`);
    }
    lines.push(
      `Current compliance workflow: ${p.trackingMethod.replace(/_/g, " ")}; ${
        p.hasComplianceStaff ? "has compliance staff" : "no dedicated compliance staff"
      }; reviews regulatory changes ${p.reviewFrequency}`,
    );
    if (p.topConcern) lines.push(`Their stated biggest concern: "${p.topConcern}"`);
  }

  return lines.join("\n");
}

/**
 * Renders a policy for the prompt.
 *
 * `brief` drops the long-form summary and requirement detail — enough for the
 * model to know a record exists and what it covers, without spending the token
 * budget (and the provider's rate limit) on supporting material. The policy the
 * user is actually asking about is always rendered in full.
 */
export function describePolicy(policy: Policy, index: number, detail: "full" | "brief" = "full"): string {
  const requirements = (policy.requirements as unknown as PolicyRequirement[]) ?? [];
  const deadlines = (policy.deadlines as unknown as PolicyDeadline[]) ?? [];

  if (detail === "brief") {
    return [
      `[${index + 1}] POLICY_ID: ${policy.id}`,
      `Title: ${policy.title}`,
      `Jurisdiction: ${jurisdictionName(policy.jurisdictionCode)}, ${countryName(policy.country)} | Agency: ${policy.agency}`,
      `Status: ${policy.status} | Importance: ${policy.importance} | Effective: ${formatDate(policy.effectiveAt)}`,
      `Topics: ${policy.topicTags.join(", ")}`,
      `Plain summary: ${policy.plainSummary}`,
      requirements.length ? `Requirements: ${requirements.map((r) => r.title).join("; ")}` : "",
      policy.consequences.length ? `Consequences: ${policy.consequences.slice(0, 3).join("; ")}` : "",
      deadlines.length
        ? `Deadlines: ${deadlines.map((d) => `${d.label} (${formatPolicyDeadlineDate(d.date)})`).join("; ")}`
        : "",
      `Source: ${policy.sourceName} — ${policy.sourceUrl}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `[${index + 1}] POLICY_ID: ${policy.id}`,
    `Title: ${policy.title}`,
    `Jurisdiction: ${jurisdictionName(policy.jurisdictionCode)} (${policy.level.toLowerCase()}), ${countryName(policy.country)}`,
    `Agency: ${policy.agency}`,
    `Status: ${policy.status} | Importance: ${policy.importance}`,
    `Effective: ${formatDate(policy.effectiveAt)} | Last updated: ${formatDate(policy.lastUpdatedAt)}`,
    `Topics: ${policy.topicTags.join(", ")}`,
    `Plain summary: ${policy.plainSummary}`,
    policy.fullSummary ? `Detail: ${policy.fullSummary}` : "",
    `Who is affected: ${policy.affectedOrgs.join("; ")}`,
    requirements.length
      ? `Requirements:\n${requirements.map((r) => `  - ${r.title}: ${r.detail}`).join("\n")}`
      : "",
    policy.consequences.length ? `Consequences: ${policy.consequences.join("; ")}` : "",
    deadlines.length
      ? `Deadlines:\n${deadlines
          .map((d) => `  - ${d.label} (${formatPolicyDeadlineDate(d.date)}, ${d.recurrence}): ${d.description}`)
          .join("\n")}`
      : "",
    `Source: ${policy.sourceName} — ${policy.sourceUrl}`,
    `Data provenance: illustrative sample record summarising a real framework.`,
  ]
    .filter(Boolean)
    .join("\n");
}
