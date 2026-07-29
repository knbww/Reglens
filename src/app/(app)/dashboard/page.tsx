import {
  ArrowRight,
  CalendarClock,
  ListChecks,
  MapPin,
  Plus,
  Radar,
  Search,
  Sparkles,
  SplitSquareHorizontal,
  UserCog,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { GenerateReportButton } from "@/components/app/generate-report-button";
import { RiskCard } from "@/components/app/risk-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader, ProgressBar, Stat } from "@/components/ui/misc";
import {
  DueBadge,
  ImportanceBadge,
  RelevanceBadge,
  UpdateTypeBadge,
} from "@/components/ui/status";
import { jurisdictionName } from "@/data/jurisdictions";
import { daysUntil, formatDate, isFuture, relativeTime } from "@/lib/format";
import { getBusinessSnapshot, getRecommendedPolicies } from "@/lib/queries";
import { requireActiveBusiness } from "@/lib/session";
import { countryName, topicLabel } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Dashboard" };

const QUICK_ACTIONS = [
  { href: "/policies", label: "Search policies", icon: Search },
  { href: "/analyst", label: "Ask AI Analyst", icon: Sparkles },
  { href: "/planner?new=1", label: "Add a task", icon: Plus },
  { href: "/compare", label: "Compare jurisdictions", icon: SplitSquareHorizontal },
  { href: "/profile", label: "Update business profile", icon: UserCog },
];

export default async function DashboardPage() {
  const { business } = await requireActiveBusiness();
  const snapshot = await getBusinessSnapshot(business);
  const recommended = await getRecommendedPolicies(business, 6);

  const openTasks = snapshot.tasks.filter((t) => t.status !== "COMPLETED");
  const overdueTasks = openTasks.filter((t) => {
    const d = daysUntil(t.dueDate);
    return d !== null && d < 0;
  });
  const activeReminders = snapshot.reminders.filter((r) => !r.dismissed && !isFuture(r.snoozedUntil));
  const upcoming = activeReminders
    .filter((r) => {
      const d = daysUntil(r.dueDate);
      return d !== null && d >= -30;
    })
    .slice(0, 6);
  const unreviewed = snapshot.updates.filter((u) => u.reviewState === "UNREVIEWED");
  const operatingCount = business.jurisdictions.filter((j) => j.role === "OPERATING").length;

  // Recommended actions blend overdue work, unreviewed change and profile gaps.
  const recommendations: {
    title: string;
    body: string;
    href: string;
    cta: string;
    tone: "danger" | "warning" | "brand";
  }[] = [];

  if (overdueTasks[0]) {
    recommendations.push({
      title: `Clear an overdue task: ${overdueTasks[0].title}`,
      body: overdueTasks[0].description || "This task passed its planned date.",
      href: `/planner?task=${overdueTasks[0].id}`,
      cta: "Open the task",
      tone: "danger",
    });
  }
  if (unreviewed[0]) {
    recommendations.push({
      title: `Review a change: ${unreviewed[0].title}`,
      body: unreviewed[0].description,
      href: `/monitoring?update=${unreviewed[0].id}`,
      cta: "Review the change",
      tone: "warning",
    });
  }
  const nextDeadline = upcoming.find((r) => (daysUntil(r.dueDate) ?? 999) >= 0);
  if (nextDeadline) {
    recommendations.push({
      title: `Prepare for ${nextDeadline.title}`,
      body: nextDeadline.notes || "An approaching date on your compliance calendar.",
      href: "/reminders",
      cta: "Open reminders",
      tone: "warning",
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
      tone: "brand",
    });
  }
  if (business.profile?.plansExpansion && business.profile.targetRegion) {
    recommendations.push({
      title: `Compare requirements before entering ${jurisdictionName(business.profile.targetRegion)}`,
      body: business.profile.expansionActivity ?? "Check how requirements differ before you start operating.",
      href: `/compare?target=${business.profile.targetRegion}`,
      cta: "Open comparison",
      tone: "brand",
    });
  }
  if (snapshot.completion.percent < 100) {
    recommendations.push({
      title: "Complete your business profile",
      body: `Still missing: ${snapshot.completion.missing.slice(0, 3).join(", ")}. RegLens ranks requirements from these answers.`,
      href: "/profile",
      cta: "Update profile",
      tone: "brand",
    });
  }

  return (
    <div className="space-y-6">
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

      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {[business.city, jurisdictionName(business.region), countryName(business.country)]
            .filter(Boolean)
            .join(", ")}
        </span>
        <span aria-hidden>·</span>
        <Badge tone="brand">{business.profile?.industryLabel ?? "Industry not set"}</Badge>
        {business.isDemo ? <Badge tone="neutral">Demo business</Badge> : null}
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Policy Risk Score"
          value={snapshot.risk.score}
          hint={`${snapshot.risk.level} exposure`}
          tone={
            snapshot.risk.level === "Low"
              ? "success"
              : snapshot.risk.level === "Moderate"
                ? "warning"
                : "danger"
          }
        />
        <Stat
          label="Jurisdictions monitored"
          value={operatingCount}
          hint={`${snapshot.monitors.length} items in monitoring`}
          href="/monitoring"
        />
        <Stat
          label="Active compliance tasks"
          value={openTasks.length}
          hint={overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : "Nothing overdue"}
          tone={overdueTasks.length > 0 ? "danger" : "neutral"}
          href="/planner"
        />
        <Stat
          label="Upcoming deadlines"
          value={activeReminders.filter((r) => (daysUntil(r.dueDate) ?? 999) >= 0).length}
          hint="Across the next 12 months"
          href="/reminders"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* ------------------------------------------- Recommended actions */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended actions</CardTitle>
              <Link href="/planner" className="text-xs font-medium text-brand hover:underline">
                Open action planner
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {recommendations.length === 0 ? (
                <EmptyState
                  title="Nothing needs your attention right now"
                  description="Add monitoring or a task and RegLens will start suggesting next steps."
                />
              ) : (
                recommendations.slice(0, 5).map((rec) => (
                  <Link
                    key={rec.title}
                    href={rec.href}
                    className="flex items-start gap-3 rounded-lg border border-line p-3 transition-colors hover:border-brand-ring hover:bg-surface-muted"
                  >
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${
                        rec.tone === "danger" ? "bg-danger" : rec.tone === "warning" ? "bg-warning" : "bg-brand"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{rec.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-ink-muted">
                        {rec.body}
                      </span>
                    </span>
                    <span className="ml-2 hidden shrink-0 items-center gap-1 text-xs font-medium text-brand sm:flex">
                      {rec.cta}
                      <ArrowRight className="size-3.5" />
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* ------------------------------------------- Upcoming deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming deadlines</CardTitle>
              <Link href="/reminders" className="text-xs font-medium text-brand hover:underline">
                All reminders
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {upcoming.length === 0 ? (
                <div className="p-5">
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
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-xs text-ink-muted">
                        <th className="px-5 py-2 font-medium">Deadline</th>
                        <th className="px-3 py-2 font-medium">Jurisdiction</th>
                        <th className="px-3 py-2 font-medium">Category</th>
                        <th className="px-3 py-2 font-medium">Due date</th>
                        <th className="px-5 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {upcoming.map((reminder) => (
                        <tr key={reminder.id} className="align-top">
                          <td className="px-5 py-2.5">
                            <span className="block font-medium text-ink">{reminder.title}</span>
                            {reminder.policy ? (
                              <Link
                                href={`/policies/${reminder.policy.id}`}
                                className="mt-0.5 block text-xs text-brand hover:underline"
                              >
                                {reminder.policy.title}
                              </Link>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5 text-ink-soft">
                            {jurisdictionName(business.region)}
                          </td>
                          <td className="px-3 py-2.5 text-ink-soft">
                            {reminder.kind
                              .toLowerCase()
                              .replace(/_/g, " ")
                              .replace(/^\w/, (c) => c.toUpperCase())}
                          </td>
                          <td className="px-3 py-2.5 text-ink-soft tabular">{formatDate(reminder.dueDate)}</td>
                          <td className="px-5 py-2.5">
                            <DueBadge days={daysUntil(reminder.dueDate)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ------------------------------------------- Recent updates */}
          <Card>
            <CardHeader>
              <CardTitle>Recently detected policy changes</CardTitle>
              <Link href="/monitoring" className="text-xs font-medium text-brand hover:underline">
                Open monitoring
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
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
                snapshot.updates.slice(0, 5).map((update) => (
                  <div key={update.id} className="rounded-lg border border-line p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <UpdateTypeBadge type={update.type} />
                      <ImportanceBadge importance={update.importance} />
                      {update.reviewState === "UNREVIEWED" ? (
                        <Badge tone="danger">Not reviewed</Badge>
                      ) : update.reviewState === "REVIEWED" ? (
                        <Badge tone="success">Reviewed</Badge>
                      ) : (
                        <Badge tone="neutral">Dismissed</Badge>
                      )}
                      <span className="ml-auto text-xs text-ink-muted">{relativeTime(update.detectedAt)}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-ink">{update.title}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">{update.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <Link href={`/policies/${update.policyId}`} className="font-medium text-brand hover:underline">
                        {update.policy.title}
                      </Link>
                      <span className="text-ink-muted">
                        {jurisdictionName(update.policy.jurisdictionCode)} · {update.policy.agency}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <RiskCard risk={snapshot.risk} />

          {/* ------------------------------------------- Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm text-ink-soft transition-colors hover:border-brand-ring hover:text-ink"
                  >
                    <Icon className="size-4 text-ink-muted" />
                    {action.label}
                  </Link>
                );
              })}
              <div className="pt-1">
                <GenerateReportButton className="w-full" />
              </div>
            </CardContent>
          </Card>

          {/* ------------------------------------------- Recommended policies */}
          <Card>
            <CardHeader>
              <CardTitle>Policies to review</CardTitle>
              <Link href="/policies" className="text-xs font-medium text-brand hover:underline">
                See all
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {recommended.slice(0, 5).map((policy) => (
                <Link
                  key={policy.id}
                  href={`/policies/${policy.id}`}
                  className="block rounded-lg border border-line p-3 transition-colors hover:border-brand-ring hover:bg-surface-muted"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-5 text-ink">{policy.title}</p>
                    <RelevanceBadge band={policy.relevance.band} />
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {jurisdictionName(policy.jurisdictionCode)} · {policy.agency}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">{policy.relevance.reasons[0]}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* ------------------------------------------- Profile gaps */}
          {snapshot.completion.missing.length > 0 ? (
            <Card>
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
                      <span className="size-1.5 rounded-full bg-warning" />
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

          {business.profile?.compliancePriorities.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Your compliance priorities</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {business.profile.compliancePriorities.map((topic) => (
                  <Link key={topic} href={`/policies?topic=${topic}`}>
                    <Badge tone="brand">{topicLabel(topic)}</Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Open tasks by status</CardTitle>
              <Link href="/planner" className="text-xs font-medium text-brand hover:underline">
                <ListChecks className="mr-1 inline size-3.5" />
                Planner
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {(["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED"] as const).map((status) => {
                const count = snapshot.tasks.filter((t) => t.status === status).length;
                const label = status
                  .toLowerCase()
                  .replace(/_/g, " ")
                  .replace(/^\w/, (c) => c.toUpperCase());
                return (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="text-ink-soft">{label}</span>
                    <span className="font-medium text-ink tabular">{count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
