import type { PolicyStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PolicyActions } from "@/components/app/policy-actions";
import { MarginNote, Sheet } from "@/components/app/sheet";
import { UPDATE_TYPE_LABEL } from "@/components/ui/status";
import { jurisdictionName } from "@/data/jurisdictions";
import type { PolicyDeadline, PolicyRequirement } from "@/data/policies";
import { enumLabel, formatDate, formatPolicyDeadlineDate, relativeTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { relevanceLabel, scoreRelevance } from "@/lib/relevance";
import { requireActiveBusiness } from "@/lib/session";
import { countryName, DISCLAIMER, topicLabel } from "@/lib/taxonomy";

/* This page answers: what does this rule actually ask of me? */

const STATUS_TEXT: Record<PolicyStatus, string> = {
  IN_FORCE: "In force",
  PROPOSED: "Proposed",
  PENDING_EFFECTIVE: "Not yet in force",
  AMENDED: "Amended",
  REPEALED: "Repealed",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const policy = await prisma.policy.findUnique({ where: { id }, select: { title: true } });
  return { title: policy?.title ?? "Policy" };
}

/** A section of the document: a rule, a heading, then room to read. */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 border-t border-line pt-7">
      <h2 className="text-title font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
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
    <Sheet
      columnClassName="max-w-2xl"
      margin={
        <div className="space-y-5">
          {/* The headnote a law report prints before the prose: what this is,
              who issued it, and the dates. In the margin it stays available
              while you read instead of pushing the summary down the page. */}
          <MarginNote title="Record">
            <dl className="space-y-2 text-[13px] leading-6">
              <div>
                <dt className="text-ink-muted">Agency</dt>
                <dd className="text-ink">{policy.agency}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Jurisdiction</dt>
                <dd className="text-ink">
                  {jurisdictionName(policy.jurisdictionCode)} · {countryName(policy.country)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Status</dt>
                <dd className="text-ink">{STATUS_TEXT[policy.status]}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Effective</dt>
                <dd className="tabular text-ink">{formatDate(policy.effectiveAt)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Last updated</dt>
                <dd className="tabular text-ink">{formatDate(policy.lastUpdatedAt)}</dd>
              </div>
            </dl>
          </MarginNote>

          <MarginNote title={`Ranked for ${business.name}`}>
            <p className="text-[13px] leading-6 text-ink-soft">
              {relevanceLabel(relevance.band)} — scored{" "}
              <span className="tabular font-medium text-ink">{relevance.score}</span> out of 100.
            </p>
          </MarginNote>
        </div>
      }
    >
      <Link
        href="/policies"
        className="text-[13px] text-ink-muted transition-colors hover:text-ink"
      >
        ← Back to policy search
      </Link>

      <header className="rise mt-6">
        <p className="text-xs text-ink-muted">
          {jurisdictionName(policy.jurisdictionCode)} · {policy.agency} · {countryName(policy.country)}
        </p>

        <h1 className="mt-3 max-w-3xl text-display font-semibold text-balance text-ink">
          {policy.title}
        </h1>

        <p className="mt-3 text-[13px] text-ink-muted">
          {STATUS_TEXT[policy.status]} · Effective{" "}
          <span className="tabular">{formatDate(policy.effectiveAt)}</span> · Last updated{" "}
          <span className="tabular">{formatDate(policy.lastUpdatedAt)}</span> ·{" "}
          {relevanceLabel(relevance.band).toLowerCase()} to {business.name}
        </p>
      </header>

      {/* The plain-language summary is the reason this page exists, so it gets
          the lead position and reading-length measure rather than a card. */}
      <div className="rise mt-7 max-w-2xl">
        <p className="text-[15px] leading-7 text-ink">{policy.plainSummary}</p>
        {policy.fullSummary ? (
          <p className="mt-4 text-[15px] leading-7 text-ink-soft">{policy.fullSummary}</p>
        ) : null}
      </div>

      <PolicyActions
        className="mt-7"
        policyId={policy.id}
        topic={policy.topicTags[0] ?? null}
        initialSaved={Boolean(saved)}
        initialMonitored={Boolean(monitored)}
      />

      <Section title="What it asks you to do">
        {requirements.length === 0 ? (
          <p className="text-[15px] leading-7 text-ink-soft">
            No itemised requirements are recorded for this policy. The summary above is the whole of
            what RegLens holds — check the source before relying on it.
          </p>
        ) : (
          <ol>
            {requirements.map((requirement, index) => (
              <li
                key={requirement.title}
                className="border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="flex gap-3">
                  <span className="tabular mt-0.5 shrink-0 text-[13px] text-ink-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium leading-6 text-ink">{requirement.title}</p>
                    <p className="mt-1.5 text-[15px] leading-7 text-ink-soft">{requirement.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="Dates that matter">
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
          <div>
            <dt className="text-[13px] text-ink-muted">Published</dt>
            <dd className="tabular mt-0.5 text-[15px] text-ink">{formatDate(policy.publishedAt)}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-ink-muted">Effective</dt>
            <dd className="tabular mt-0.5 text-[15px] text-ink">{formatDate(policy.effectiveAt)}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-ink-muted">Last updated</dt>
            <dd className="tabular mt-0.5 text-[15px] text-ink">{formatDate(policy.lastUpdatedAt)}</dd>
          </div>
        </dl>

        {deadlines.length === 0 ? (
          <p className="mt-5 text-[15px] leading-7 text-ink-soft">
            No recurring deadline is recorded for this policy.
          </p>
        ) : (
          <ul className="mt-6 border-t border-line">
            {deadlines.map((deadline) => (
              <li key={deadline.label} className="border-b border-line py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-[15px] font-medium text-ink">{deadline.label}</p>
                  <p className="tabular text-[13px] text-ink-soft">
                    {formatPolicyDeadlineDate(deadline.date)}
                    {deadline.recurrence === "one_time"
                      ? ""
                      : `, ${deadline.recurrence.replace(/_/g, " ")}`}
                  </p>
                </div>
                <p className="mt-1 text-[15px] leading-7 text-ink-soft">{deadline.description}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Why this is ranked for ${business.name}`}>
        <p className="text-[15px] leading-7 text-ink-soft">
          {relevanceLabel(relevance.band)} — scored{" "}
          <span className="tabular font-medium text-ink">{relevance.score}</span> out of 100 against
          your profile, jurisdictions and stated priorities.
        </p>
        <ul className="mt-3">
          {relevance.reasons.map((reason) => (
            <li key={reason} className="text-[15px] leading-7 text-ink-soft">
              {reason}
            </li>
          ))}
        </ul>
      </Section>

      {policy.affectedOrgs.length > 0 ? (
        <Section title="Who it applies to">
          <ul>
            {policy.affectedOrgs.map((org) => (
              <li key={org} className="text-[15px] leading-7 text-ink-soft">
                {org}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {policy.consequences.length > 0 ? (
        <Section title="If it is missed">
          <ul>
            {policy.consequences.map((consequence) => (
              <li key={consequence} className="text-[15px] leading-7 text-ink-soft">
                {consequence}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {policy.updates.length > 0 ? (
        <Section title="Recent changes">
          <ul>
            {policy.updates.map((update) => (
              <li
                key={update.id}
                className="border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0"
              >
                <p className="text-xs text-ink-muted">
                  {UPDATE_TYPE_LABEL[update.type]} · {relativeTime(update.detectedAt)}
                </p>
                <p className="mt-1 text-[15px] font-medium leading-6 text-ink">{update.title}</p>
                <p className="mt-1 text-[15px] leading-7 text-ink-soft">{update.description}</p>
              </li>
            ))}
          </ul>

          {policy.versions.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-xs font-medium text-ink-muted">Versions on record</h3>
              <ul className="mt-2">
                {policy.versions.map((version) => (
                  <li key={version.id} className="text-[13px] leading-6 text-ink-soft">
                    <span className="tabular font-medium text-ink">v{version.version}</span> ·
                    effective {formatDate(version.effectiveAt)} — {version.summary}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Link
            href="/monitoring"
            className="mt-4 inline-block text-[13px] text-ink underline decoration-line-strong underline-offset-4"
          >
            Open monitoring
          </Link>
        </Section>
      ) : null}

      {linkedTasks.length > 0 ? (
        <Section title="Your tasks for this policy">
          <ul>
            {linkedTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/planner?task=${task.id}`}
                  className="lift -mx-3 flex items-baseline justify-between gap-4 rounded-md px-3 py-2.5"
                >
                  <span className="min-w-0 text-[15px] text-ink-soft">{task.title}</span>
                  <span className="shrink-0 text-[13px] text-ink-muted">
                    {enumLabel(task.status)}
                    {task.dueDate ? ` · due ${formatDate(task.dueDate)}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {related.length > 0 ? (
        <Section title="Related policies">
          <ul>
            {related.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/policies/${item.id}`}
                  className="lift -mx-3 block rounded-md px-3 py-2.5"
                >
                  <span className="block text-[15px] text-ink">{item.title}</span>
                  <span className="mt-0.5 block text-[13px] text-ink-muted">
                    {jurisdictionName(item.jurisdictionCode)} · {item.agency}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Reference material: quieter, and last. */}
      <section className="mt-12 border-t border-line pt-6">
        <h2 className="text-xs font-medium text-ink-muted">The record</h2>
        <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-[13px] text-ink-muted">Jurisdiction</dt>
            <dd className="mt-0.5 text-[13px] text-ink-soft">
              {jurisdictionName(policy.jurisdictionCode)} · {enumLabel(policy.level)} level
            </dd>
          </div>
          <div>
            <dt className="text-[13px] text-ink-muted">Responsible agency</dt>
            <dd className="mt-0.5 text-[13px] text-ink-soft">{policy.agency}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-ink-muted">Source</dt>
            <dd className="mt-0.5 text-[13px]">
              <a
                href={policy.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-line-strong underline-offset-4"
              >
                {policy.sourceName}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-[13px] text-ink-muted">Topics</dt>
            <dd className="mt-0.5 text-[13px] text-ink-soft">
              {policy.topicTags.map((tag, index) => (
                <span key={tag}>
                  {index > 0 ? ", " : ""}
                  <Link
                    href={`/policies?topic=${tag}`}
                    className="underline decoration-line-strong underline-offset-4 hover:text-ink"
                  >
                    {topicLabel(tag)}
                  </Link>
                </span>
              ))}
            </dd>
          </div>
        </dl>

        <p className="mt-5 text-xs leading-5 text-ink-muted">
          {policy.isSampleData
            ? "This is an illustrative record summarising a real framework, not a live feed from the agency. "
            : ""}
          {DISCLAIMER}
        </p>

        <Link
          href={`/policies?jurisdiction=${policy.jurisdictionCode}`}
          className="mt-4 inline-block text-[13px] text-ink underline decoration-line-strong underline-offset-4"
        >
          More from {jurisdictionName(policy.jurisdictionCode)}
        </Link>
      </section>
    </Sheet>
  );
}
