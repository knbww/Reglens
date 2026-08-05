import type { Metadata } from "next";

import {
  MonitoringView,
  type MonitorRow,
  type UpdateRow,
} from "@/components/app/monitoring/monitoring-view";
import { jurisdictionName } from "@/data/jurisdictions";
import { prisma } from "@/lib/prisma";
import { getRelevantUpdates } from "@/lib/queries";
import { scoreRelevance } from "@/lib/relevance";
import { requireActiveBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Regulatory monitoring" };

/*
 * The question this page answers: what has changed that affects me? The feed
 * of detected changes is the page. What is being watched is reference material
 * and sits underneath it, quieter, without repeating the feed's grammar.
 */
export default async function MonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ update?: string }>;
}) {
  const params = await searchParams;
  const { business } = await requireActiveBusiness();

  const [monitors, updates] = await Promise.all([
    prisma.monitoredPolicy.findMany({
      where: { businessId: business.id, active: true },
      include: {
        policy: {
          include: { updates: { orderBy: { detectedAt: "desc" }, take: 1 } },
        },
      },
      orderBy: [{ targetType: "asc" }, { createdAt: "desc" }],
    }),
    getRelevantUpdates(business, 40),
  ]);

  const monitorRows: MonitorRow[] = monitors.map((monitor) => {
    const latest = monitor.policy?.updates[0] ?? null;
    const relevance = monitor.policy ? scoreRelevance(monitor.policy, business) : null;
    return {
      id: monitor.id,
      targetType: monitor.targetType,
      label: monitor.label,
      policyId: monitor.policyId,
      targetKey: monitor.targetKey,
      lastChecked: monitor.lastChecked.toISOString(),
      latestChangeTitle: latest?.title ?? null,
      latestChangeAt: latest?.detectedAt.toISOString() ?? null,
      importance: monitor.policy?.importance ?? null,
      relevanceBand: relevance?.band ?? null,
      relevanceScore: relevance?.score ?? null,
    };
  });

  const updateRows: UpdateRow[] = updates.map((update) => {
    const relevance = scoreRelevance(update.policy, business);
    return {
      id: update.id,
      type: update.type,
      title: update.title,
      description: update.description,
      importance: update.importance,
      detectedAt: update.detectedAt.toISOString(),
      reviewState: update.reviewState,
      policyId: update.policyId,
      policyTitle: update.policy.title,
      policyAgency: update.policy.agency,
      jurisdiction: jurisdictionName(update.policy.jurisdictionCode),
      relevanceBand: relevance.band,
      relevanceScore: relevance.score,
    };
  });

  const unreviewed = updateRows.filter((u) => u.reviewState === "UNREVIEWED").length;

  const headline =
    unreviewed === 0
      ? updateRows.length === 0
        ? "Nothing has changed yet"
        : "Every change has been read"
      : unreviewed === 1
        ? "One change needs reading"
        : `${unreviewed} changes need reading`;

  return (
    <div className="pb-10">
      <header className="rise pb-6">
        <p className="text-xs text-ink-muted">Regulatory monitoring · {business.name}</p>

        <h1 className="mt-3 text-display font-semibold text-balance text-ink">{headline}</h1>

        <p className="mt-3 max-w-2xl text-[13px] text-ink-soft">
          <span className="tabular">{updateRows.length}</span>{" "}
          {updateRows.length === 1 ? "change has" : "changes have"} been detected against the{" "}
          <span className="tabular">{monitorRows.length}</span> policies, topics and jurisdictions
          you follow.
        </p>
      </header>

      <MonitoringView
        monitors={monitorRows}
        updates={updateRows}
        highlightUpdateId={params.update ?? null}
      />

      <p className="mt-14 max-w-2xl border-t border-line pt-6 text-xs leading-5 text-ink-muted">
        Monitoring in this version runs against seeded, versioned change records so the full flow —
        detection, relevance, review and action — works end to end. It is not a live real-time feed
        from government sources.
      </p>
    </div>
  );
}
