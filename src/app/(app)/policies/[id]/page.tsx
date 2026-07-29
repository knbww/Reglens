import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PolicyActions } from "@/components/app/policy-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DefinitionList, InlineNote } from "@/components/ui/misc";
import {
  ImportanceBadge,
  PolicyStatusBadge,
  RelevanceBadge,
  SampleDataBadge,
  UpdateTypeBadge,
} from "@/components/ui/status";
import { jurisdictionName } from "@/data/jurisdictions";
import type { PolicyDeadline, PolicyRequirement } from "@/data/policies";
import { formatDate, formatPolicyDeadlineDate, relativeTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { scoreRelevance } from "@/lib/relevance";
import { requireActiveBusiness } from "@/lib/session";
import { countryName, DISCLAIMER, topicLabel } from "@/lib/taxonomy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const policy = await prisma.policy.findUnique({ where: { id }, select: { title: true } });
  return { title: policy?.title ?? "Policy" };
}

export default async function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await requireActiveBusiness();

  const policy = await prisma.policy.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { version: "desc" } },
      updates: { orderBy: { detectedAt: "desc" }, take: 5 },
    },
  });
  if (!policy) notFound();

  const [related, saved, monitored, linkedTasks] = await Promise.all([
    policy.relatedIds.length > 0
      ? prisma.policy.findMany({ where: { id: { in: policy.relatedIds } } })
      : Promise.resolve([]),
    prisma.savedPolicy.findFirst({ where: { businessId: business.id, policyId: policy.id } }),
    prisma.monitoredPolicy.findFirst({
      where: { businessId: business.id, targetType: "POLICY", policyId: policy.id },
    }),
    prisma.task.findMany({
      where: { businessId: business.id, policyId: policy.id },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
  ]);

  const relevance = scoreRelevance(policy, business);
  const requirements = (policy.requirements as unknown as PolicyRequirement[]) ?? [];
  const deadlines = (policy.deadlines as unknown as PolicyDeadline[]) ?? [];

  return (
    <div className="space-y-5">
      <Link href="/policies" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" />
        Back to policy search
      </Link>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <PolicyStatusBadge status={policy.status} />
          <ImportanceBadge importance={policy.importance} />
          <RelevanceBadge band={relevance.band} score={relevance.score} />
          {policy.isSampleData ? <SampleDataBadge /> : null}
        </div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-ink">{policy.title}</h1>
        <p className="text-sm text-ink-muted">
          {jurisdictionName(policy.jurisdictionCode)} · {policy.agency} · {countryName(policy.country)}
        </p>
      </div>

      <PolicyActions
        policyId={policy.id}
        topic={policy.topicTags[0] ?? null}
        initialSaved={Boolean(saved)}
        initialMonitored={Boolean(monitored)}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>What this means in plain language</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-6 text-ink-soft">{policy.plainSummary}</p>
              {policy.fullSummary ? (
                <p className="text-sm leading-6 text-ink-muted">{policy.fullSummary}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Who may be affected</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {policy.affectedOrgs.map((org) => (
                  <li key={org} className="flex gap-2 text-sm text-ink-soft">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                    {org}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Main requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requirements.length === 0 ? (
                <p className="text-sm text-ink-muted">No itemised requirements are recorded for this policy.</p>
              ) : (
                requirements.map((requirement, index) => (
                  <div key={requirement.title} className="rounded-lg border border-line p-3">
                    <p className="text-sm font-medium text-ink">
                      <span className="mr-2 text-ink-muted tabular">{index + 1}.</span>
                      {requirement.title}
                    </p>
                    <p className="mt-1 pl-6 text-sm leading-6 text-ink-soft">{requirement.detail}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Possible consequences</CardTitle>
            </CardHeader>
            <CardContent>
              {policy.consequences.length === 0 ? (
                <p className="text-sm text-ink-muted">No consequences are recorded for this policy.</p>
              ) : (
                <ul className="space-y-1.5">
                  {policy.consequences.map((consequence) => (
                    <li key={consequence} className="flex gap-2 text-sm text-ink-soft">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-danger" />
                      {consequence}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relevant deadlines</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {deadlines.length === 0 ? (
                <p className="px-5 py-4 text-sm text-ink-muted">No deadlines are recorded for this policy.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-xs text-ink-muted">
                        <th className="px-5 py-2 font-medium">Deadline</th>
                        <th className="px-3 py-2 font-medium">When</th>
                        <th className="px-3 py-2 font-medium">Recurrence</th>
                        <th className="px-5 py-2 font-medium">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {deadlines.map((deadline) => (
                        <tr key={deadline.label} className="align-top">
                          <td className="px-5 py-2.5 font-medium text-ink">{deadline.label}</td>
                          <td className="px-3 py-2.5 text-ink-soft tabular">
                            {formatPolicyDeadlineDate(deadline.date)}
                          </td>
                          <td className="px-3 py-2.5 text-ink-soft">
                            {deadline.recurrence.replace(/_/g, " ")}
                          </td>
                          <td className="px-5 py-2.5 text-ink-muted">{deadline.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {policy.updates.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Change history</CardTitle>
                <Link href="/monitoring" className="text-xs font-medium text-brand hover:underline">
                  Open monitoring
                </Link>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {policy.updates.map((update) => (
                  <div key={update.id} className="rounded-lg border border-line p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <UpdateTypeBadge type={update.type} />
                      <span className="ml-auto text-xs text-ink-muted">{relativeTime(update.detectedAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-ink">{update.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-ink-muted">{update.description}</p>
                  </div>
                ))}
                {policy.versions.length > 0 ? (
                  <div className="border-t border-line pt-2.5">
                    <p className="text-xs font-medium text-ink-muted">Versions on record</p>
                    <ul className="mt-1.5 space-y-1">
                      {policy.versions.map((version) => (
                        <li key={version.id} className="text-xs text-ink-soft">
                          <span className="font-medium text-ink tabular">v{version.version}</span> · effective{" "}
                          {formatDate(version.effectiveAt)} — {version.summary}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Record details</CardTitle>
            </CardHeader>
            <CardContent>
              <DefinitionList
                items={[
                  { term: "Jurisdiction", value: jurisdictionName(policy.jurisdictionCode) },
                  { term: "Level", value: policy.level.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) },
                  { term: "Responsible agency", value: policy.agency },
                  { term: "Country", value: countryName(policy.country) },
                  { term: "Published", value: formatDate(policy.publishedAt) },
                  { term: "Effective", value: formatDate(policy.effectiveAt) },
                  { term: "Last updated", value: formatDate(policy.lastUpdatedAt) },
                  {
                    term: "Source",
                    value: (
                      <a
                        href={policy.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand hover:underline"
                      >
                        {policy.sourceName}
                        <ExternalLink className="size-3" />
                      </a>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relevance to {business.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <RelevanceBadge band={relevance.band} score={relevance.score} />
              <ul className="space-y-1.5">
                {relevance.reasons.map((reason) => (
                  <li key={reason} className="flex gap-2 text-sm text-ink-soft">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                    {reason}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Topics</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {policy.topicTags.map((tag) => (
                <Link key={tag} href={`/policies?topic=${tag}`}>
                  <Badge tone="neutral">{topicLabel(tag)}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          {linkedTasks.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Your tasks for this policy</CardTitle>
                <Link href="/planner" className="text-xs font-medium text-brand hover:underline">
                  Planner
                </Link>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {linkedTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/planner?task=${task.id}`}
                    className="block rounded-lg border border-line px-3 py-2 text-sm text-ink-soft transition-colors hover:border-brand-ring hover:text-ink"
                  >
                    {task.title}
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {task.status.toLowerCase().replace(/_/g, " ")}
                      {task.dueDate ? ` · due ${formatDate(task.dueDate)}` : ""}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {related.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Related policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/policies/${item.id}`}
                    className="block rounded-lg border border-line px-3 py-2 text-sm text-ink-soft transition-colors hover:border-brand-ring hover:text-ink"
                  >
                    {item.title}
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {jurisdictionName(item.jurisdictionCode)} · {item.agency}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <InlineNote>{DISCLAIMER}</InlineNote>

          <Link href={`/policies?jurisdiction=${policy.jurisdictionCode}`} className={`${buttonVariants({ variant: "secondary", size: "sm" })} w-full`}>
            More from {jurisdictionName(policy.jurisdictionCode)}
          </Link>
        </div>
      </div>
    </div>
  );
}
