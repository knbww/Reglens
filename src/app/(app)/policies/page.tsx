import type { Prisma, PolicyStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";

import { PolicyFilters, type PolicyFilterValues } from "@/components/app/policy-filters";
import { jurisdictionName } from "@/data/jurisdictions";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { rankByRelevance, relevanceLabel } from "@/lib/relevance";
import { requireActiveBusiness } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Policy search" };

/* This page answers: which recorded requirements might apply to my business? */

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUS_TEXT: Record<PolicyStatus, string> = {
  IN_FORCE: "In force",
  PROPOSED: "Proposed",
  PENDING_EFFECTIVE: "Not yet in force",
  AMENDED: "Amended",
  REPEALED: "Repealed",
};

function readParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

/**
 * The scorer emits reasons as fragments. Two of them, joined, make the one
 * sentence that justifies the result being in front of you — which is the
 * only thing on the row that a general web search could not have told you.
 */
function whyItSurfaced(reasons: string[]): string {
  const trim = (text: string) => text.trim().replace(/\.$/, "");
  const [first, second] = reasons;
  if (!first) return "No direct match with your business profile.";
  if (!second) return `${trim(first)}.`;
  const tail = trim(second);
  return `${trim(first)}, and ${tail.charAt(0).toLowerCase()}${tail.slice(1)}.`;
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

  const narrowed =
    Boolean(filters.q) ||
    Boolean(filters.effectiveFrom) ||
    [
      filters.country,
      filters.jurisdiction,
      filters.industry,
      filters.topic,
      filters.status,
      filters.relevance,
    ].some((value) => value && value !== "all");

  const count = ranked.length;
  const plural = count === 1 ? "policy" : "policies";
  const headline = error
    ? "The search could not run"
    : count === 0
      ? "Nothing matched"
      : filters.q
        ? `${count} ${count === 1 ? "result" : "results"} for “${filters.q}”`
        : narrowed
          ? `${count} ${plural} match`
          : `${count} ${plural}, most relevant to you first`;

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <header className="rise pb-7">
        <p className="text-xs text-ink-muted">Policy search · {business.name}</p>
        <h1 className="mt-3 text-display font-semibold text-balance text-ink">{headline}</h1>
        <p className="mt-3 max-w-2xl text-[13px] leading-6 text-ink-soft">
          Federal, state, provincial and local requirements across North America, each ranked against
          what {business.name} does and where it does it.
        </p>
      </header>

      <PolicyFilters initial={filters} />

      {error ? (
        <section className="mt-8">
          <p className="text-[15px] leading-7 text-ink-soft">
            <span className="font-medium text-alert">Search failed.</span> {error}
          </p>
          <Link
            href="/policies"
            className="mt-3 inline-block text-[15px] text-ink underline decoration-line-strong underline-offset-4"
          >
            Reset the search
          </Link>
        </section>
      ) : count === 0 ? (
        <section className="mt-8">
          <p className="max-w-2xl text-[15px] leading-7 text-ink-soft">
            Nothing in the dataset answers that. Try a broader term, a wider jurisdiction, or drop a
            filter — the records cover a representative set of North American requirements rather than
            every rule in force.
          </p>
          <Link
            href="/policies"
            className="mt-3 inline-block text-[15px] text-ink underline decoration-line-strong underline-offset-4"
          >
            Clear filters
          </Link>
        </section>
      ) : (
        <>
          <ul className="mt-6">
            {ranked.map((policy, index) => (
              <li
                key={policy.id}
                className={cn(
                  "border-b border-line py-6 first:pt-0",
                  index === ranked.length - 1 && "border-b-0",
                )}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="min-w-0 text-xs text-ink-muted">
                    {jurisdictionName(policy.jurisdictionCode)} · {policy.agency}
                  </p>
                  <p className="shrink-0 text-[13px] text-ink-muted">
                    {relevanceLabel(policy.relevance.band)}
                  </p>
                </div>

                <h2 className="mt-1.5 text-[15px] font-semibold leading-6 text-balance text-ink">
                  <Link
                    href={`/policies/${policy.id}`}
                    className="hover:underline hover:decoration-line-strong hover:underline-offset-4"
                  >
                    {policy.title}
                  </Link>
                </h2>

                {/* The reason this record is in front of you. Everything else on
                    the row is provenance; this line is the product. */}
                <p className="mt-2 max-w-2xl text-[15px] leading-7 text-ink-soft">
                  {whyItSurfaced(policy.relevance.reasons)}
                </p>

                <p className="mt-2 text-[13px] text-ink-muted">
                  {STATUS_TEXT[policy.status]} · Effective{" "}
                  <span className="tabular">{formatDate(policy.effectiveAt)}</span> · Updated{" "}
                  <span className="tabular">{formatDate(policy.lastUpdatedAt)}</span>
                  {savedIds.has(policy.id) ? " · Saved" : ""}
                  {monitoredIds.has(policy.id) ? " · Monitored" : ""}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-10 border-t border-line pt-6 text-xs leading-5 text-ink-muted">
            Each record is an illustrative summary of a real framework, not a live feed from the
            agency. Open a policy to see its source and the requirements it sets out.
          </p>
        </>
      )}
    </div>
  );
}
