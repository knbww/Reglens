import type { Metadata } from "next";

import { ReminderManager, type ReminderRow } from "@/components/app/reminders/reminder-manager";
import { daysUntil, formatDate, isFuture } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getRecommendedPolicies } from "@/lib/queries";
import { requireActiveBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Deadlines & reminders" };

/*
 * The question this page answers: which dates are coming, and which have
 * already passed? It is a calendar of obligations — grouped by month, with
 * every row disposable where it stands.
 */
export default async function RemindersPage() {
  const { business } = await requireActiveBusiness();

  const [reminders, recommended] = await Promise.all([
    prisma.reminder.findMany({
      where: { businessId: business.id },
      include: { policy: { select: { id: true, title: true } } },
      orderBy: { dueDate: "asc" },
    }),
    getRecommendedPolicies(business, 25),
  ]);

  const rows: ReminderRow[] = reminders.map((reminder) => ({
    id: reminder.id,
    title: reminder.title,
    notes: reminder.notes,
    kind: reminder.kind,
    dueDate: reminder.dueDate.toISOString(),
    advanceDays: reminder.advanceDays,
    snoozedUntil: reminder.snoozedUntil ? reminder.snoozedUntil.toISOString() : null,
    dismissed: reminder.dismissed,
    policyId: reminder.policyId,
    policyTitle: reminder.policy?.title ?? null,
  }));

  const live = rows.filter((r) => !r.dismissed && !isFuture(r.snoozedUntil));
  const overdue = live.filter((r) => (daysUntil(r.dueDate) ?? 0) < 0);
  const soon = live.filter((r) => {
    const d = daysUntil(r.dueDate) ?? -1;
    return d >= 0 && d <= 30;
  });
  const nextUp = live.filter((r) => (daysUntil(r.dueDate) ?? -1) >= 0)[0] ?? null;

  const headline =
    overdue.length > 0
      ? overdue.length === 1
        ? "One deadline has passed"
        : `${overdue.length} deadlines have passed`
      : soon.length > 0
        ? soon.length === 1
          ? "One date in the next 30 days"
          : `${soon.length} dates in the next 30 days`
        : live.length > 0
          ? "Nothing is due this month"
          : "No dates on your calendar";

  return (
    <div className="pb-10">
      <header className="rise pb-6">
        <p className="text-xs text-ink-muted">Deadlines &amp; reminders · {business.name}</p>

        <h1 className="mt-3 text-display font-semibold text-balance text-ink">{headline}</h1>

        <p className="mt-3 max-w-2xl text-[13px] text-ink-soft">
          {nextUp ? (
            <>
              Next up: {nextUp.title} on{" "}
              <span className="tabular">{formatDate(nextUp.dueDate)}</span>.
            </>
          ) : (
            "Add a filing date, a permit or certification renewal, or a review you want raising in advance."
          )}
        </p>
      </header>

      <ReminderManager
        reminders={rows}
        policies={recommended.map((p) => ({ id: p.id, title: p.title }))}
      />

      <p className="mt-14 max-w-2xl border-t border-line pt-6 text-xs leading-5 text-ink-muted">
        Reminders raise in-app notifications only. RegLens does not send email, SMS or push
        notifications in this version, so nothing leaves the product.
      </p>
    </div>
  );
}
