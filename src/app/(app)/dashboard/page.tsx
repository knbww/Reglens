import { ArrowRight, CalendarClock, MapPin, Radar, Search, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DeadlineList, type DeadlineEntry } from "@/components/app/deadline-list";
import { GenerateReportButton } from "@/components/app/generate-report-button";
import { RiskCard } from "@/components/app/risk-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Strata, type StrataColumn } from "@/components/ui/chart";
import { EmptyState, PageHeader, ProgressBar } from "@/components/ui/misc";
import { Meter, Spine } from "@/components/ui/severity";
import { UpdateTypeBadge } from "@/components/ui/status";
import { jurisdictionName } from "@/data/jurisdictions";
import { daysUntil, isFuture, relativeTime } from "@/lib/format";
import { getBusinessSnapshot, getRecommendedPolicies } from "@/lib/queries";
import { requireActiveBusiness } from "@/lib/session";
import {
  SEVERITY_BAR,
  SEVERITY_TEXT,
  severityFromDays,
  severityFromImportance,
  type Severity,
} from "@/lib/severity";
import { countryName, topicLabel } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

/** Federal rules sit above each state or province — so the picture is a stack. */
function buildStrata(
  business: Awaited<ReturnType<typeof requireActiveBusiness>>["business"],
  trackedByJurisdiction: Map<string, number>,
): StrataColumn[] {
  const byCountry = new Map<string, StrataColumn>();

  for (const link of business.jurisdictions) {
    const country = link.jurisdictionCode.split("-")[0];
    const column =
      byCountry.get(country) ??
      ({ country: countryName(country), total: 0, layers: [] } as StrataColumn);

    const isFederal = !link.jurisdictionCode.includes("-");
    const count = trackedByJurisdiction.get(link.jurisdictionCode) ?? 0;

    column.layers.push({
      name: isFederal ? "Federal" : jurisdictionName(link.jurisdictionCode),
      count,
      severity: count === 0 ? "clear" : count >= 5 ? "over" : count >= 3 ? "act" : "watch",
      planned: link.role === "TARGET_EXPANSION",
    });
    column.total += count;
    byCountry.set(country, column);
  }

  // Federal first, then the sub-national layers beneath it.
  for (const column of byCountry.values()) {
    column.layers.sort((a, b) => Number(b.name === "Federal") - Number(a.name === "Federal"));
  }
  return Array.from(byCountry.values()).slice(0, 3);
}

export default async function DashboardPage() {
  const { business } = await requireActiveBusiness();
  const snapshot = await getBusinessSnapshot(business);
  const recommended = await getRecommendedPolicies(business, 6);

  const openTasks = snapshot.tasks.filter((t) => t.status !== "COMPLETED");
  const overdueTasks = openTasks.filter((t) => (daysUntil(t.dueDate) ?? 999) < 0);
  const dueSoonTasks = openTasks.filter((t) => {
    const d = daysUntil(t.dueDate);
    return d !== null && d >= 0 && d <= 30;
  });
  const activeReminders = snapshot.reminders.filter(
    (r) => !r.dismissed && !isFuture(r.snoozedUntil),
  );
  const unreviewed = snapshot.updates.filter((u) => u.reviewState === "UNREVIEWED");

  // Tasks and reminders are the same pressure, so they share one dated list.
  const deadlines: DeadlineEntry[] = [
    ...openTasks
      .filter((t) => t.dueDate)
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.title,
        date: t.dueDate!,
        context: t.policy?.title ?? "Compliance task",
        href: `/planner?task=${t.id}`,
      })),
    ...activeReminders.map((r) => ({
      id: `reminder-${r.id}`,
      title: r.title,
      date: r.dueDate,
      context: r.policy?.title ?? "Reminder",
      href: "/reminders",
    })),
  ];

  // Everything RegLens is tracking, attributed to the level it comes from:
  // open work, detected change, and explicit jurisdiction monitors.
  const trackedByJurisdiction = new Map<string, number>();
  const track = (code: string | null | undefined) => {
    if (code) trackedByJurisdiction.set(code, (trackedByJurisdiction.get(code) ?? 0) + 1);
  };
  for (const task of openTasks) track(task.jurisdictionCode);
  for (const update of snapshot.updates) track(update.policy.jurisdictionCode);
  for (const monitor of snapshot.monitors) {
    if (monitor.targetType === "JURISDICTION") track(monitor.targetKey);
  }
  const strata = buildStrata(business, trackedByJurisdiction);

  // Recommended actions blend overdue work, unreviewed change and profile gaps.
  const recommendations: {
    title: string;
    body: string;
    href: string;
    cta: string;
    severity: Severity;
  }[] = [];

  if (overdueTasks[0]) {
    recommendations.push({
      title: `Clear an overdue task: ${overdueTasks[0].title}`,
      body: overdueTasks[0].description || "This task passed its planned date.",
      href: `/planner?task=${overdueTasks[0].id}`,
      cta: "Open the task",
      severity: "over",
    });
  }
  if (unreviewed[0]) {
    recommendations.push({
      title: `Review a change: ${unreviewed[0].title}`,
      body: unreviewed[0].description,
      href: `/monitoring?update=${unreviewed[0].id}`,
      cta: "Review the change",
      severity: severityFromImportance(unreviewed[0].importance),
    });
  }
  const nextDeadline = activeReminders.find((r) => (daysUntil(r.dueDate) ?? 999) >= 0);
  if (nextDeadline) {
    recommendations.push({
      title: `Prepare for ${nextDeadline.title}`,
      body: nextDeadline.notes || "An approaching date on your compliance calendar.",
      href: "/reminders",
      cta: "Open reminders",
      severity: severityFromDays(daysUntil(nextDeadline.dueDate)),
    });
  }
  const topPolicy = recommended.find(
    (p) => p.relevance.band === "high" && !snapshot.monitors.some((m) => m.policyId === p.id),
  );
  if (topPolicy) {
    recommendations.push({
      title: `Check where you stand on ${topPolicy.title}`,
      body: topPolicy.plainSummary,
      href: `/policies/${topPolicy.id}`,
      cta: "Open the policy",
      severity: "watch",
    });
  }
  if (business.profile?.plansExpansion && business.profile.targetRegion) {
    recommendations.push({
      title: `Compare requirements before entering ${jurisdictionName(business.profile.targetRegion)}`,
      body:
        business.profile.expansionActivity ??
        "Check how requirements differ before you start operating.",
      href: `/compare?target=${business.profile.targetRegion}`,
      cta: "Open comparison",
      severity: "watch",
    });
  }
  if (snapshot.completion.percent < 100) {
    recommendations.push({
      title: "Complete your business profile",
      body: `Still missing: ${snapshot.completion.missing.slice(0, 3).join(", ")}. RegLens ranks requirements from these answers.`,
      href: "/profile",
      cta: "Update profile",
      severity: "clear",
    });
  }

  const pulse: { label: string; value: number; severity: Severity; href: string }[] = [
    { label: "Overdue", value: overdueTasks.length, severity: "over", href: "/planner" },
    { label: "Due in 30 days", value: dueSoonTasks.length, severity: "act", href: "/reminders" },
    { label: "Awaiting review", value: unreviewed.length, severity: "watch", href: "/monitoring" },
    {
      label: "On track",
      value: Math.max(0, openTasks.length - overdueTasks.length - dueSoonTasks.length),
      severity: "clear",
      href: "/planner",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={business.name}
        description={business.description}
        actions={
          <>
            <Link href="/policies" className={buttonVariants({ variant: "secondary" })}>
              <Search className="size-4" />
              Search policies
            </Link>
            <Link href="/analyst" className={buttonVariants()}>
              <Sparkles className="size-4" />
              Ask AI Analyst
            </Link>
          </>
        }
      />

      <div
        style={{ ["--rise-i" as string]: 1 }}
        className="rise flex flex-wrap items-center gap-2 text-sm text-ink-muted"
      >
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {[business.city, jurisdictionName(business.region), countryName(business.country)]
            .filter(Boolean)
            .join(", ")}
        </span>
        <span aria-hidden>·</span>
        <Badge tone="brand">{business.profile?.industryLabel ?? "Industry not set"}</Badge>
        {business.isDemo ? <Badge tone="neutral">Demo business</Badge> : null}
        {business.profile?.compliancePriorities.slice(0, 3).map((topic) => (
          <Link key={topic} href={`/policies?topic=${topic}`}>
            <Badge tone="neutral">{topicLabel(topic)}</Badge>
          </Link>
        ))}
        <span className="ml-auto flex items-center gap-2">
          <span className="text-xs">Profile {snapshot.completion.percent}% complete</span>
          <ProgressBar
            value={snapshot.completion.percent}
            tone={snapshot.completion.percent >= 90 ? "success" : "warning"}
            className="w-28"
            label="Profile completion"
          />
        </span>
      </div>

      {/* ------------------------------------------------------- Risk hero */}
      <RiskCard risk={snapshot.risk} />

      {/* --------------------------------------------------- Pressure rail */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pulse.map((item, index) => (
          <Link
            key={item.label}
            href={item.href}
            style={{ ["--rise-i" as string]: index + 2 }}
            className="rise lift rounded-card border border-line bg-surface hover:border-brand-ring"
          >
            <Spine severity={item.severity} className="px-4 py-3 pl-5">
              <p className="text-xs font-medium text-ink-muted">{item.label}</p>
              <p
                className={cn(
                  "tabular mt-1 text-2xl font-semibold tracking-tight",
                  item.value === 0 ? "text-ink-muted" : SEVERITY_TEXT[item.severity],
                )}
              >
                {item.value}
              </p>
            </Spine>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          {/* --------------------------------------- Needs a decision */}
          <Card style={{ ["--rise-i" as string]: 3 }} className="rise">
            <CardHeader>
              <CardTitle>Needs a decision</CardTitle>
              <Link href="/planner" className="text-xs font-medium text-brand hover:underline">
                Open action planner
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {recommendations.length === 0 ? (
                <EmptyState
                  title="You are clear"
                  description="Nothing is overdue and nothing is waiting on a review."
                />
              ) : (
                recommendations.slice(0, 5).map((rec, index) => (
                  <Link
                    key={rec.title}
                    href={rec.href}
                    style={{ ["--rise-i" as string]: index }}
                    className="slide-in group block rounded-lg border border-line transition-colors hover:border-brand-ring hover:bg-surface-muted"
                  >
                    <Spine severity={rec.severity} className="flex items-start gap-3 p-3 pl-4">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{rec.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-ink-muted">
                          {rec.body}
                        </span>
                      </span>
                      <span className="ml-2 hidden shrink-0 items-center gap-1 text-xs font-medium text-brand sm:flex">
                        {rec.cta}
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Spine>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* --------------------------------------- Dated obligations */}
          <Card style={{ ["--rise-i" as string]: 4 }} className="rise">
            <CardHeader>
              <CardTitle>What is coming up</CardTitle>
              <Link href="/reminders" className="text-xs font-medium text-brand hover:underline">
                All reminders
              </Link>
            </CardHeader>
            <CardContent>
              {deadlines.length === 0 ? (
                <EmptyState
                  icon={<CalendarClock className="size-6" />}
                  title="No deadlines tracked yet"
                  description="Add a reminder for your next filing, renewal or review."
                  action={
                    <Link href="/reminders" className={buttonVariants({ size: "sm" })}>
                      Add a reminder
                    </Link>
                  }
                />
              ) : (
                <DeadlineList entries={deadlines} />
              )}
            </CardContent>
          </Card>

          {/* ------------------------------------------ Recent changes */}
          <Card style={{ ["--rise-i" as string]: 5 }} className="rise">
            <CardHeader>
              <CardTitle>Recently detected policy changes</CardTitle>
              <Link href="/monitoring" className="text-xs font-medium text-brand hover:underline">
                Open monitoring
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {snapshot.updates.length === 0 ? (
                <EmptyState
                  icon={<Radar className="size-6" />}
                  title="Nothing is being monitored yet"
                  description="Follow a policy, jurisdiction or topic and detected changes will appear here."
                  action={
                    <Link href="/monitoring" className={buttonVariants({ size: "sm" })}>
                      Set up monitoring
                    </Link>
                  }
                />
              ) : (
                snapshot.updates.slice(0, 5).map((update, index) => (
                  <div
                    key={update.id}
                    style={{ ["--rise-i" as string]: index }}
                    className="slide-in rounded-lg border border-line"
                  >
                    <Spine
                      severity={severityFromImportance(update.importance)}
                      className="p-3 pl-4"
                      label={`${update.importance.toLowerCase()} importance`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <UpdateTypeBadge type={update.type} />
                        {update.reviewState === "UNREVIEWED" ? (
                          <Badge tone="danger">Not reviewed</Badge>
                        ) : null}
                        <span className="ml-auto text-xs text-ink-muted">
                          {relativeTime(update.detectedAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-ink">{update.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-muted">
                        {update.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <Link
                          href={`/policies/${update.policyId}`}
                          className="font-medium text-brand hover:underline"
                        >
                          {update.policy.title}
                        </Link>
                        <span className="text-ink-muted">
                          {jurisdictionName(update.policy.jurisdictionCode)} · {update.policy.agency}
                        </span>
                      </div>
                    </Spine>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          {/* -------------------------------------- Where rules come from */}
          {strata.length > 0 ? (
            <Card style={{ ["--rise-i" as string]: 3 }} className="rise">
              <CardHeader>
                <CardTitle>Where the rules come from</CardTitle>
                <Link href="/compare" className="text-xs font-medium text-brand hover:underline">
                  Compare
                </Link>
              </CardHeader>
              <CardContent>
                <Strata columns={strata} />
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
                  <span>shade = tracked items</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-[2px] outline-1 outline-dashed outline-brand-ring" />
                    planned expansion
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ------------------------------------ Recommended policies */}
          <Card style={{ ["--rise-i" as string]: 4 }} className="rise">
            <CardHeader>
              <CardTitle>Policies to review</CardTitle>
              <Link href="/policies" className="text-xs font-medium text-brand hover:underline">
                See all
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {recommended.slice(0, 5).map((policy, index) => (
                <Link
                  key={policy.id}
                  href={`/policies/${policy.id}`}
                  style={{ ["--rise-i" as string]: index }}
                  className="slide-in block rounded-lg border border-line p-3 transition-colors hover:border-brand-ring hover:bg-surface-muted"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-5 text-ink">{policy.title}</p>
                    <Meter
                      value={policy.relevance.score}
                      label={`Relevance ${policy.relevance.score} of 100`}
                      className="mt-0.5 shrink-0"
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {jurisdictionName(policy.jurisdictionCode)} · {policy.agency}
                  </p>
                  {/* The sentence that justifies the whole product — promoted. */}
                  <p className="mt-1 text-xs text-ink-soft">{policy.relevance.reasons[0]}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* ------------------------------------------- Profile gaps */}
          {snapshot.completion.missing.length > 0 ? (
            <Card style={{ ["--rise-i" as string]: 5 }} className="rise">
              <CardHeader>
                <CardTitle>Incomplete profile information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-ink-soft">
                  RegLens ranks requirements from your profile. These answers are still missing:
                </p>
                <ul className="space-y-1">
                  {snapshot.completion.missing.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-ink-muted">
                      <span className={cn("size-1.5 rounded-full", SEVERITY_BAR.watch)} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/profile" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  Complete profile
                </Link>
              </CardContent>
            </Card>
          ) : null}

          <Card style={{ ["--rise-i" as string]: 6 }} className="rise">
            <CardHeader>
              <CardTitle>Produce a report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-ink-soft">
                A dated snapshot of your profile, risk score, obligations and deadlines.
              </p>
              <GenerateReportButton className="w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
