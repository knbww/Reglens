import type { Metadata } from "next";

import { ComparisonTool, type SavedComparisonRow } from "@/components/app/compare/comparison-tool";
import type { ComparisonResult } from "@/lib/comparison";
import { prisma } from "@/lib/prisma";
import { requireActiveBusiness } from "@/lib/session";
import { COMPLIANCE_TOPICS } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Compare jurisdictions" };

/* This page answers: what changes if I do this somewhere else? */

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; target?: string }>;
}) {
  const params = await searchParams;
  const { business } = await requireActiveBusiness();

  const saved = await prisma.savedComparison.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const operating = business.jurisdictions.filter((j) => j.role === "OPERATING").map((j) => j.jurisdictionCode);
  const targets = business.jurisdictions
    .filter((j) => j.role === "TARGET_EXPANSION")
    .map((j) => j.jurisdictionCode);

  // Default to "where I am now" versus "where I am going", which is the
  // comparison an expanding business almost always wants first.
  const defaults = Array.from(
    new Set(
      [
        params.target ?? targets.find((t) => t.includes("-")) ?? targets[0],
        business.region || operating[0],
        ...operating,
      ].filter(Boolean) as string[],
    ),
  ).slice(0, 3);

  const topicFromProfile = business.profile?.compliancePriorities[0];
  const defaultTopic =
    params.topic && COMPLIANCE_TOPICS.some((t) => t.key === params.topic)
      ? params.topic
      : (topicFromProfile ?? COMPLIANCE_TOPICS[0].key);

  const savedRows: SavedComparisonRow[] = saved.map((row) => ({
    id: row.id,
    title: row.title,
    topic: row.topic,
    activity: row.activity,
    jurisdictionCodes: row.jurisdictionCodes,
    createdAt: row.createdAt.toISOString(),
    result: row.result as unknown as ComparisonResult,
  }));

  return (
    <div className="pb-10">
      <header className="rise pb-7">
        <p className="text-xs text-ink-muted">Compare jurisdictions · {business.name}</p>
        <h1 className="mt-3 text-display font-semibold text-balance text-ink">
          What differs between jurisdictions
        </h1>
        <p className="mt-3 max-w-2xl text-[13px] leading-6 text-ink-soft">
          One topic, two or more places, including the national rules a state or province inherits.
          Where RegLens holds no record the comparison says so, rather than letting silence read as
          &ldquo;nothing applies&rdquo;.
        </p>
      </header>

      <ComparisonTool
        defaultTopic={defaultTopic}
        defaultJurisdictions={defaults.length >= 2 ? defaults : ["US", "CA"]}
        activityDefault={business.profile?.expansionActivity ?? business.description.slice(0, 120)}
        savedComparisons={savedRows}
      />
    </div>
  );
}
