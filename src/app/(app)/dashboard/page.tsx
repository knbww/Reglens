import type { Metadata } from "next";
import Link from "next/link";

import { TodayQueue, type QueueItem } from "@/components/app/today/today-queue";
import { jurisdictionName } from "@/data/jurisdictions";
import { daysUntil, formatDate, isFuture } from "@/lib/format";
import { getBusinessSnapshot } from "@/lib/queries";
import { requireActiveBusiness } from "@/lib/session";
import { countryName } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function lateBy(date: Date | null): number {
  return Math.abs(daysUntil(date) ?? 0);
}

export default async function DashboardPage() {
  const { business } = await requireActiveBusiness();
  const snapshot = await getBusinessSnapshot(business);

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

  if (queue.length === 0 && snapshot.completion.percent < 100) {
    queue.push({
      id: "profile",
      kind: "profile",
      eyebrow: `Profile ${snapshot.completion.percent}% complete`,
      title: "Finish your business profile",
      body: `RegLens ranks requirements from these answers. Still missing: ${snapshot.completion.missing
        .slice(0, 3)
        .join(", ")}.`,
      href: "/profile",
      late: false,
    });
  }

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

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <header className="rise pb-8">
        <p className="text-xs text-ink-muted">
          {business.name} ·{" "}
          {[business.city, jurisdictionName(business.region), countryName(business.country)]
            .filter(Boolean)
            .join(", ")}
        </p>

        <h1 className="mt-3 text-display font-semibold text-balance text-ink">{headline}</h1>

        {/* The score is a consequence of the queue, not a monument beside it. */}
        <p className="mt-3 text-[13px] text-ink-soft">
          <Link href="/reports" className="hover:text-ink">
            Policy Risk Score{" "}
            <span className={cn("tabular font-medium", snapshot.risk.score >= 60 && "text-alert")}>
              {snapshot.risk.score}
            </span>
            <span className="text-ink-muted"> · {snapshot.risk.level} exposure, out of 100</span>
          </Link>
          {count > 0 ? (
            <span className="text-ink-muted"> — clearing these is what moves it.</span>
          ) : null}
        </p>
      </header>

      <TodayQueue items={queue} nextClearDate={nextDated ? formatDate(nextDated) : null} />

      {upcoming.length > 0 ? (
        <section className="rise mt-14 border-t border-line pt-6">
          <h2 className="text-xs font-medium text-ink-muted">Further out</h2>
          <ul className="mt-2">
            {upcoming.map((item) => (
              <li key={item.id}>
                <Link
                  href="/reminders"
                  className="lift -mx-3 flex items-baseline gap-4 rounded-md px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-[14px] text-ink-soft">
                    {item.title}
                  </span>
                  <span className="tabular shrink-0 text-[13px] text-ink-muted">
                    {formatDate(item.date)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
