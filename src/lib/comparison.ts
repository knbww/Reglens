import type { Policy } from "@prisma/client";

import { jurisdictionName, JURISDICTION_BY_CODE } from "@/data/jurisdictions";
import type { PolicyDeadline, PolicyRequirement } from "@/data/policies";
import { formatPolicyDeadlineDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { BusinessWithContext } from "@/lib/relevance";
import { topicLabel } from "@/lib/taxonomy";

export type ComparisonCell = {
  jurisdictionCode: string;
  jurisdictionName: string;
  policies: {
    id: string;
    title: string;
    agency: string;
    status: string;
    requirements: PolicyRequirement[];
    deadlines: { label: string; date: string; description: string }[];
    sourceName: string;
    sourceUrl: string;
  }[];
  agencies: string[];
  requirementCount: number;
  differences: string[];
  businessImpact: string;
  preparation: string[];
};

export type ComparisonResult = {
  topic: string;
  topicLabel: string;
  activity: string;
  cells: ComparisonCell[];
  generatedAt: string;
  /** Codes with no seeded coverage for this topic, surfaced honestly. */
  noCoverage: string[];
};

/** Jurisdiction plus the levels above it — a state also inherits federal rules. */
function ancestryCodes(code: string): string[] {
  const chain: string[] = [];
  let current: string | undefined = code;
  while (current) {
    chain.push(current);
    current = JURISDICTION_BY_CODE.get(current)?.parentCode ?? undefined;
  }
  return chain;
}

function summariseImpact(cell: Omit<ComparisonCell, "businessImpact" | "preparation" | "differences">, business: BusinessWithContext | null): string {
  if (cell.policies.length === 0) {
    return "No record in the RegLens dataset for this topic and jurisdiction. Treat it as unverified rather than as an absence of rules.";
  }

  const operates = business?.jurisdictions.some(
    (j) => j.role === "OPERATING" && ancestryCodes(j.jurisdictionCode).includes(cell.jurisdictionCode),
  );
  const targets = business?.jurisdictions.some(
    (j) => j.role === "TARGET_EXPANSION" && ancestryCodes(j.jurisdictionCode).includes(cell.jurisdictionCode),
  );

  const load = `${cell.requirementCount} recorded requirement${cell.requirementCount === 1 ? "" : "s"} across ${cell.agencies.length} ${cell.agencies.length === 1 ? "agency" : "agencies"}`;

  if (targets) return `Expansion target. ${load} to satisfy before you begin operating here.`;
  if (operates) return `You already operate here. ${load} that should already be in place.`;
  return `Not currently in your profile. ${load} would apply if you started operating here.`;
}

/**
 * Builds a side-by-side comparison of one regulatory topic across several
 * jurisdictions using the seeded corpus.
 */
export async function buildComparison({
  topic,
  jurisdictionCodes,
  activity,
  business,
}: {
  topic: string;
  jurisdictionCodes: string[];
  activity: string;
  business: BusinessWithContext | null;
}): Promise<ComparisonResult> {
  const codes = Array.from(new Set(jurisdictionCodes.filter(Boolean)));

  const allCodes = Array.from(new Set(codes.flatMap(ancestryCodes)));
  const policies = await prisma.policy.findMany({
    where: { topicTags: { has: topic }, jurisdictionCode: { in: allCodes } },
    orderBy: [{ importance: "desc" }, { title: "asc" }],
  });

  const partial: Omit<ComparisonCell, "differences" | "businessImpact" | "preparation">[] = codes.map((code) => {
    const chain = ancestryCodes(code);
    const matched = policies.filter((p: Policy) => chain.includes(p.jurisdictionCode));
    const requirements = matched.flatMap(
      (p) => (p.requirements as unknown as PolicyRequirement[]) ?? [],
    );

    return {
      jurisdictionCode: code,
      jurisdictionName: jurisdictionName(code),
      policies: matched.map((p) => ({
        id: p.id,
        title: p.title,
        agency: p.agency,
        status: p.status,
        requirements: (p.requirements as unknown as PolicyRequirement[]) ?? [],
        deadlines: (((p.deadlines as unknown as PolicyDeadline[]) ?? []) as PolicyDeadline[]).map((d) => ({
          label: d.label,
          date: formatPolicyDeadlineDate(d.date),
          description: d.description,
        })),
        sourceName: p.sourceName,
        sourceUrl: p.sourceUrl,
      })),
      agencies: Array.from(new Set(matched.map((p) => p.agency))),
      requirementCount: requirements.length,
    };
  });

  // Differences are computed against the other columns so each cell explains
  // what is distinctive about it rather than repeating the same list.
  const cells: ComparisonCell[] = partial.map((cell) => {
    const ownTitles = new Set(cell.policies.map((p) => p.title.toLowerCase()));
    const otherTitles = new Set(
      partial.filter((c) => c.jurisdictionCode !== cell.jurisdictionCode).flatMap((c) => c.policies.map((p) => p.title.toLowerCase())),
    );

    const differences: string[] = [];

    const unique = cell.policies.filter((p) => !otherTitles.has(p.title.toLowerCase()));
    for (const p of unique.slice(0, 3)) {
      differences.push(`Only here: ${p.title} (${p.agency})`);
    }

    for (const other of partial) {
      if (other.jurisdictionCode === cell.jurisdictionCode) continue;
      const missing = other.policies.filter((p) => !ownTitles.has(p.title.toLowerCase()));
      if (missing.length > 0 && cell.policies.length > 0) {
        differences.push(
          `No equivalent record here for ${missing[0].title}, which applies in ${other.jurisdictionName}`,
        );
      }
    }

    const counts = partial.map((c) => c.requirementCount);
    const max = Math.max(...counts, 0);
    if (cell.requirementCount === max && max > 0 && counts.filter((c) => c === max).length === 1) {
      differences.push(`Heaviest recorded requirement load in this comparison (${max} requirements)`);
    }

    if (differences.length === 0) {
      differences.push(
        cell.policies.length > 0
          ? "Broadly aligned with the other jurisdictions in this comparison"
          : "No seeded coverage to compare",
      );
    }

    const preparation: string[] = [];
    if (cell.policies.length > 0) {
      preparation.push(`Identify who owns ${topicLabel(topic).toLowerCase()} for ${cell.jurisdictionName}`);
      const firstDeadline = cell.policies.flatMap((p) => p.deadlines)[0];
      if (firstDeadline) preparation.push(`Diarise: ${firstDeadline.label} (${firstDeadline.date})`);
      const firstReq = cell.policies.flatMap((p) => p.requirements)[0];
      if (firstReq) preparation.push(`Start with: ${firstReq.title}`);
      preparation.push(`Confirm details with ${cell.agencies[0]}`);
    } else {
      preparation.push(`Contact the responsible authority in ${cell.jurisdictionName} to confirm requirements`);
    }

    return {
      ...cell,
      differences: Array.from(new Set(differences)).slice(0, 4),
      businessImpact: summariseImpact(cell, business),
      preparation: preparation.slice(0, 4),
    };
  });

  return {
    topic,
    topicLabel: topicLabel(topic),
    activity,
    cells,
    generatedAt: new Date().toISOString(),
    noCoverage: cells.filter((c) => c.policies.length === 0).map((c) => c.jurisdictionCode),
  };
}
