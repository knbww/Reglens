import type { Metadata } from "next";

import { ReminderManager, type ReminderRow } from "@/components/app/reminders/reminder-manager";
import { InlineNote, PageHeader } from "@/components/ui/misc";
import { prisma } from "@/lib/prisma";
import { getRecommendedPolicies } from "@/lib/queries";
import { requireActiveBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Deadlines & reminders" };

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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Deadlines & reminders"
        description="Filing dates, permit and certification renewals, scheduled reviews and your own dates — with advance notice inside RegLens."
      />

      <InlineNote tone="info">
        Reminders raise in-app notifications only. RegLens does not send email, SMS or push notifications in this
        version, so nothing leaves the product.
      </InlineNote>

      <ReminderManager
        reminders={rows}
        policies={recommended.map((p) => ({ id: p.id, title: p.title }))}
      />
    </div>
  );
}
