import type { Metadata } from "next";
import Link from "next/link";

import { MarginNote, Sheet } from "@/components/app/sheet";
import { TodayQueue, type QueueItem } from "@/components/app/today/today-queue";
import { jurisdictionName } from "@/data/jurisdictions";
import { daysUntil, formatDate, isFuture } from "@/lib/format";
import { getBusinessSnapshot, getRecommendedPolicies } from "@/lib/queries";
import { relevanceLabel } from "@/lib/relevance";
import { requireActiveBusiness } from "@/lib/session";
import { countryName } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function lateBy(date: Date | null): number {
  return Math.abs(daysUntil(date) ?? 0);
}

export default async function DashboardPage() {
  const { business } = await requireActiveBusiness();
  const [snapshot, recommended] = await Promise.all([
    getBusinessSnapshot(business),
    getRecommendedPolicies(business, 6),
  ]);

  const openTasks = snapshot.tasks.filter((t) => t.status !== "COMPLETED");
  const overdue = openTasks
    .filter((t) => (daysUntil(t.dueDate) ?? 999) < 0)
    .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0));
  const unreviewed = snapshot.updates.filter((u) => u.reviewState === "UNREVIEWED");
  const activeReminders = snapshot.reminders.filter(
    (r) => !r.dismissed && !isFuture(r.snoozedUntil),
  );
  const imminent = activeReminders.filter((r) => {
    const d = daysUntil(r.dueDate);
    return d !== null && d >= 0 && d <= 14;
  });

  /*
   * The queue is ordered by what it costs to ignore, not by which feature
   * produced the item. Late work first, then unreviewed change ranked by
   * importance, then dates close enough to need preparing for.
   */
  const queue: QueueItem[] = [
    ...overdue.map((task) => ({
      id: task.id,
      kind: "task" as const,
      eyebrow: `${lateBy(task.dueDate)} days late`,
      title: task.title,
      body: task.description || "This task passed its planned date.",
      href: `/planner?task=${task.id}`,
      late: true,
    })),
    ...unreviewed
      .slice()
      .sort(
        (a, b) =>
          Number(b.importance === "CRITICAL") - Number(a.importance === "CRITICAL") ||
          b.detectedAt.getTime() - a.detectedAt.getTime(),
      )
      .map((update) => ({
        id: update.id,
        kind: "change" as const,
        eyebrow: `Change detected in ${jurisdictionName(update.policy.jurisdictionCode)}`,
        title: update.title,
        body: update.description,
        href: `/monitoring?update=${update.id}`,
        late: false,
      })),
    ...imminent.map((reminder) => ({
      id: reminder.id,
      kind: "deadline" as const,
      eyebrow: `Due ${formatDate(reminder.dueDate)} · in ${daysUntil(reminder.dueDate)} days`,
      title: reminder.title,
      body: reminder.notes || "An approaching date on your compliance calendar.",
      href: "/reminders",
      late: false,
    })),
  ];

  /*
   * An unfinished profile is *not* a queue item, and it is certainly not the
   * whole of a new account's first screen. It used to be: a fresh sign-up was
   * told its profile was 83% complete and shown nothing else, so the product
   * withheld the very thing it had just been asked for. The percentage is a
   * note in the margin now, and the reading column always carries records.
   */

  // Dates far enough out to be information rather than work.
  const upcoming = [
    ...openTasks
      .filter((t) => (daysUntil(t.dueDate) ?? -1) > 14)
      .map((t) => ({ id: t.id, title: t.title, date: t.dueDate! })),
    ...activeReminders
      .filter((r) => (daysUntil(r.dueDate) ?? -1) > 14)
      .map((r) => ({ id: r.id, title: r.title, date: r.dueDate })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  const nextDated = [...activeReminders, ...openTasks.filter((t) => t.dueDate)]
    .map((entry) => ("dueDate" in entry ? entry.dueDate : null))
    .filter((date): date is Date => Boolean(date) && (daysUntil(date) ?? -1) >= 0)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const count = queue.length;
  const headline =
    count === 0
      ? "Nothing needs you today"
      : count === 1
        ? "One thing needs you today"
        : `${count} things need you today`;

  // A short queue leaves room to read; a full one should not be buried under
  // reference material, so the corpus below shortens as the queue grows.
  const startHere = recommended.slice(0, count === 0 ? 5 : 3);

  return (
    <Sheet
      margin={
        <div className="space-y-5">
          <MarginNote title="Policy Risk Score">
            <p className="text-[15px] leading-6 text-ink">
              <Link href="/reports" className="hover:underline hover:underline-offset-4">
                <span
                  className={cn("tabular font-medium", snapshot.risk.score >= 60 && "text-alert")}
                >
                  {snapshot.risk.score}
                </span>
                <span className="text-ink-soft"> out of 100 · {snapshot.risk.level} exposure</span>
              </Link>
            </p>
            {count > 0 ? (
              <p className="mt-1 text-[13px] leading-6 text-ink-muted">
                Clearing what is above is what moves it.
              </p>
            ) : null}
          </MarginNote>

          {upcoming.length > 0 ? (
            <MarginNote title="Further out">
              <ul className="-mx-2">
                {upcoming.map((item) => (
                  <li key={item.id}>
                    <Link href="/reminders" className="lift block rounded-md px-2 py-2">
                      <span className="block truncate text-[14px] text-ink-soft">{item.title}</span>
                      <span className="tabular text-[13px] text-ink-muted">
                        {formatDate(item.date)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </MarginNote>
          ) : null}

          <MarginNote title="Ask instead of reading">
            <p className="text-[13px] leading-6 text-ink-soft">
              The{" "}
              <Link href="/analyst" className="counsel-link">
                AI Analyst
              </Link>{" "}
              answers in plain language from your profile and these records, and turns what it
              finds into tasks.
            </p>
          </MarginNote>

          {snapshot.completion.percent < 100 ? (
            <MarginNote title={`Profile ${snapshot.completion.percent}% complete`}>
              <p className="text-[13px] leading-6 text-ink-soft">
                Ranking already works. Adding {snapshot.completion.missing.slice(0, 2).join(" and ")}{" "}
                sharpens it —{" "}
                <Link href="/profile" className="counsel-link">
                  two minutes in your profile
                </Link>
                .
              </p>
            </MarginNote>
          ) : null}
        </div>
      }
    >
      <header className="rise pb-8">
        <p className="text-xs text-ink-muted">
          {business.name} ·{" "}
          {[business.city, jurisdictionName(business.region), countryName(business.country)]
            .filter(Boolean)
            .join(", ")}
        </p>

        <h1 className="mt-3 max-w-3xl text-display font-semibold text-balance text-ink">
          {headline}
        </h1>
      </header>

      <TodayQueue items={queue} nextClearDate={nextDated ? formatDate(nextDated) : null} />

      {/*
       * What RegLens already knows applies to this business — on screen from
       * the first visit, whether or not anything is queued and whether or not
       * the profile is finished.
       */}
      {startHere.length > 0 ? (
        <section className="rise mt-12 border-t border-line pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-xs font-medium text-ink-muted">
              {count === 0 ? "Worth reading now" : "Also applies to you"}
            </h2>
            <Link href="/policies" className="text-[13px] text-ink-muted hover:text-ink">
              All policies for {business.name}
            </Link>
          </div>

          <ul className="mt-3">
            {startHere.map((policy) => (
              <li key={policy.id} className="border-b border-line last:border-b-0">
                <Link href={`/policies/${policy.id}`} className="lift -mx-3 block rounded-md px-3 py-3.5">
                  <p className="text-xs text-ink-muted">
                    {jurisdictionName(policy.jurisdictionCode)} · {policy.agency} ·{" "}
                    {relevanceLabel(policy.relevance.band)}
                  </p>
                  <p className="mt-1 max-w-2xl text-[15px] font-medium leading-6 text-ink">
                    {policy.title}
                  </p>
                  <p className="mt-1 max-w-2xl text-[14px] leading-6 text-ink-soft">
                    {policy.plainSummary}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Sheet>
  );
}
