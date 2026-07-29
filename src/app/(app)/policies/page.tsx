import type { Prisma } from "@prisma/client";
import { AlertCircle, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PolicyFilters, type PolicyFilterValues } from "@/components/app/policy-filters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import {
  ImportanceBadge,
  PolicyStatusBadge,
  RelevanceBadge,
  SampleDataBadge,
} from "@/components/ui/status";
import { jurisdictionName } from "@/data/jurisdictions";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { rankByRelevance } from "@/lib/relevance";
import { requireActiveBusiness } from "@/lib/session";
import { topicLabel } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Policy search" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function PoliciesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { business } = await requireActiveBusiness();

  const filters: PolicyFilterValues = {
    q: readParam(params, "q"),
    country: readParam(params, "country") || "all",
    jurisdiction: readParam(params, "jurisdiction") || "all",
    industry: readParam(params, "industry") || "all",
    topic: readParam(params, "topic") || "all",
    status: readParam(params, "status") || "all",
    effectiveFrom: readParam(params, "effectiveFrom"),
    relevance: readParam(params, "relevance") || "all",
    sort: readParam(params, "sort") || "relevance",
  };

  const where: Prisma.PolicyWhereInput = {};
  const and: Prisma.PolicyWhereInput[] = [];

  if (filters.q) {
    and.push({
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { plainSummary: { contains: filters.q, mode: "insensitive" } },
        { fullSummary: { contains: filters.q, mode: "insensitive" } },
        { agency: { contains: filters.q, mode: "insensitive" } },
        { topicTags: { has: filters.q.toLowerCase().replace(/\s+/g, "_") } },
      ],
    });
  }
  if (filters.country !== "all") and.push({ country: filters.country });
  if (filters.jurisdiction !== "all") and.push({ jurisdictionCode: filters.jurisdiction });
  if (filters.industry !== "all") and.push({ industryTags: { has: filters.industry } });
  if (filters.topic !== "all") and.push({ topicTags: { has: filters.topic } });
  if (filters.status !== "all")
    and.push({ status: filters.status as Prisma.EnumPolicyStatusFilter["equals"] });
  if (filters.effectiveFrom) {
    const date = new Date(filters.effectiveFrom);
    if (!Number.isNaN(date.getTime())) and.push({ effectiveAt: { gte: date } });
  }
  if (and.length > 0) where.AND = and;

  let error: string | null = null;
  let policies: Awaited<ReturnType<typeof prisma.policy.findMany>> = [];
  try {
    policies = await prisma.policy.findMany({ where, take: 200 });
  } catch (cause) {
    error = (cause as Error).message;
  }

  const [saved, monitored] = await Promise.all([
    prisma.savedPolicy.findMany({ where: { businessId: business.id }, select: { policyId: true } }),
    prisma.monitoredPolicy.findMany({
      where: { businessId: business.id, targetType: "POLICY" },
      select: { policyId: true },
    }),
  ]);
  const savedIds = new Set(saved.map((s) => s.policyId));
  const monitoredIds = new Set(monitored.map((m) => m.policyId));

  let ranked = rankByRelevance(policies, business);

  if (filters.relevance === "high") ranked = ranked.filter((p) => p.relevance.band === "high");
  else if (filters.relevance === "medium") ranked = ranked.filter((p) => p.relevance.band !== "low");

  if (filters.sort === "newest") {
    ranked.sort((a, b) => b.lastUpdatedAt.getTime() - a.lastUpdatedAt.getTime());
  } else if (filters.sort === "effective") {
    ranked.sort((a, b) => b.effectiveAt.getTime() - a.effectiveAt.getTime());
  } else if (filters.sort === "importance") {
    const order = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
    ranked.sort((a, b) => order[a.importance] - order[b.importance] || b.relevance.score - a.relevance.score);
  }

  const isInitial =
    !filters.q &&
    filters.country === "all" &&
    filters.jurisdiction === "all" &&
    filters.industry === "all" &&
    filters.topic === "all" &&
    filters.status === "all" &&
    filters.relevance === "all" &&
    !filters.effectiveFrom;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Policy search"
        description={`Federal, state, provincial and local requirements across North America, ranked against ${business.name}.`}
      />

      <PolicyFilters initial={filters} resultCount={ranked.length} />

      {error ? (
        <Card>
          <CardContent className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-medium text-ink">Search could not run</p>
              <p className="mt-1 text-sm text-ink-muted">{error}</p>
              <Link href="/policies" className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-3`}>
                Reset the search
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : ranked.length === 0 ? (
        <EmptyState
          icon={<Search className="size-6" />}
          title="No policies matched"
          description="Try removing a filter, searching a broader term, or widening the jurisdiction. The MVP dataset covers a representative set of North American requirements rather than every rule in force."
          action={
            <Link href="/policies" className={buttonVariants({ size: "sm" })}>
              Clear filters
            </Link>
          }
        />
      ) : (
        <>
          {isInitial ? (
            <p className="text-sm text-ink-muted">
              Showing every policy in the dataset, most relevant to {business.name} first. Use the filters above
              to narrow by jurisdiction, topic or status.
            </p>
          ) : null}

          <ul className="space-y-3">
            {ranked.map((policy) => (
              <li key={policy.id}>
                <Card className="transition-colors hover:border-brand-ring">
                  <CardContent>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link href={`/policies/${policy.id}`} className="group">
                          <h2 className="text-sm font-semibold leading-5 text-ink group-hover:text-brand">
                            {policy.title}
                          </h2>
                        </Link>
                        <p className="mt-1 text-xs text-ink-muted">
                          {jurisdictionName(policy.jurisdictionCode)} · {policy.agency}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <RelevanceBadge band={policy.relevance.band} score={policy.relevance.score} />
                        <PolicyStatusBadge status={policy.status} />
                        <ImportanceBadge importance={policy.importance} />
                      </div>
                    </div>

                    <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-ink-soft">{policy.plainSummary}</p>

                    <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <dt className="text-ink-muted">Published</dt>
                        <dd className="text-ink-soft tabular">{formatDate(policy.publishedAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-muted">Effective</dt>
                        <dd className="text-ink-soft tabular">{formatDate(policy.effectiveAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-muted">Last updated</dt>
                        <dd className="text-ink-soft tabular">{formatDate(policy.lastUpdatedAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-muted">Who may be affected</dt>
                        <dd className="text-ink-soft">{policy.affectedOrgs[0] ?? "—"}</dd>
                      </div>
                    </dl>

                    {policy.consequences.length > 0 ? (
                      <p className="mt-2.5 text-xs text-ink-muted">
                        <span className="font-medium text-ink-soft">If missed: </span>
                        {policy.consequences.slice(0, 2).join("; ")}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {policy.topicTags.slice(0, 4).map((tag) => (
                        <Badge key={tag} tone="neutral">
                          {topicLabel(tag)}
                        </Badge>
                      ))}
                      {savedIds.has(policy.id) ? <Badge tone="brand">Saved</Badge> : null}
                      {monitoredIds.has(policy.id) ? <Badge tone="info">Monitored</Badge> : null}
                      <SampleDataBadge />
                      <Link
                        href={`/policies/${policy.id}`}
                        className={`${buttonVariants({ variant: "secondary", size: "sm" })} ml-auto`}
                      >
                        Open policy
                      </Link>
                    </div>

                    <p className="mt-2 text-xs text-ink-muted">{policy.relevance.reasons.join(" · ")}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
