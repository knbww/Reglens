import type { Metadata } from "next";

import {
  MonitoringView,
  type MonitorRow,
  type UpdateRow,
} from "@/components/app/monitoring/monitoring-view";
import { InlineNote, PageHeader, Stat } from "@/components/ui/misc";
import { jurisdictionName } from "@/data/jurisdictions";
import { prisma } from "@/lib/prisma";
import { getRelevantUpdates } from "@/lib/queries";
import { scoreRelevance } from "@/lib/relevance";
import { requireActiveBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Regulatory monitoring" };

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
  const critical = updateRows.filter(
    (u) => u.importance === "CRITICAL" || u.importance === "HIGH",
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Regulatory monitoring"
        description={`Policies, jurisdictions, industries and topics ${business.name} is following, and the changes detected against them.`}
      />

      <InlineNote tone="warning">
        Monitoring in this version runs against seeded, versioned change records so the full flow — detection,
        relevance, review and action — works end to end. It is not a live real-time feed from government
        sources.
      </InlineNote>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Items monitored" value={monitorRows.length} hint="Policies, topics and jurisdictions" />
        <Stat
          label="Changes needing review"
          value={unreviewed}
          tone={unreviewed > 0 ? "warning" : "success"}
          hint={unreviewed > 0 ? "Review to keep your risk score accurate" : "All caught up"}
        />
        <Stat label="High or critical changes" value={critical} hint="Across the detected feed" />
        <Stat label="Changes detected" value={updateRows.length} hint="Matching what you monitor" />
      </div>

      <MonitoringView
        monitors={monitorRows}
        updates={updateRows}
        highlightUpdateId={params.update ?? null}
      />
    </div>
  );
}
