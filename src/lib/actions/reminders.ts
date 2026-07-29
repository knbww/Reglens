"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireActiveBusiness } from "@/lib/session";

const reminderSchema = z.object({
  title: z.string().min(3, "Give the reminder a title"),
  notes: z.string().default(""),
  kind: z
    .enum([
      "COMPLIANCE_DEADLINE",
      "PERMIT_RENEWAL",
      "CERTIFICATION_RENEWAL",
      "FILING_DEADLINE",
      "POLICY_REVIEW",
      "CUSTOM",
    ])
    .default("CUSTOM"),
  dueDate: z.string().min(1, "Pick a date"),
  advanceDays: z.coerce.number().int().min(0).max(365).default(7),
  policyId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
});

export type ReminderInput = z.input<typeof reminderSchema>;
export type ReminderResult = { ok: true; reminderId: string } | { ok: false; error: string };

function revalidateReminderViews() {
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
}

export async function createReminder(input: ReminderInput): Promise<ReminderResult> {
  const { user, business } = await requireActiveBusiness();
  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid reminder" };
  const d = parsed.data;

  const dueDate = new Date(d.dueDate);
  if (Number.isNaN(dueDate.getTime())) return { ok: false, error: "That date could not be read" };

  const reminder = await prisma.reminder.create({
    data: {
      businessId: business.id,
      policyId: d.policyId || null,
      taskId: d.taskId || null,
      kind: d.kind,
      title: d.title,
      notes: d.notes,
      dueDate,
      advanceDays: d.advanceDays,
    },
  });

  // Raise the in-app notification immediately when it is already in window.
  const daysOut = Math.ceil((dueDate.getTime() - Date.now()) / 86_400_000);
  if (daysOut <= d.advanceDays) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        businessId: business.id,
        reminderId: reminder.id,
        kind: "REMINDER",
        title: d.title,
        body: daysOut < 0 ? `Overdue by ${Math.abs(daysOut)} days.` : `Due in ${daysOut} days.`,
        href: "/reminders",
      },
    });
  }

  revalidateReminderViews();
  return { ok: true, reminderId: reminder.id };
}

export async function snoozeReminder(reminderId: string, days: number): Promise<{ ok: boolean }> {
  const { business } = await requireActiveBusiness();
  const until = new Date();
  until.setDate(until.getDate() + days);
  await prisma.reminder.updateMany({
    where: { id: reminderId, businessId: business.id },
    data: { snoozedUntil: until },
  });
  await prisma.notification.updateMany({ where: { reminderId }, data: { read: true } });
  revalidateReminderViews();
  return { ok: true };
}

export async function dismissReminder(reminderId: string): Promise<{ ok: boolean }> {
  const { business } = await requireActiveBusiness();
  await prisma.reminder.updateMany({
    where: { id: reminderId, businessId: business.id },
    data: { dismissed: true },
  });
  await prisma.notification.updateMany({ where: { reminderId }, data: { read: true } });
  revalidateReminderViews();
  return { ok: true };
}

export async function restoreReminder(reminderId: string): Promise<{ ok: boolean }> {
  const { business } = await requireActiveBusiness();
  await prisma.reminder.updateMany({
    where: { id: reminderId, businessId: business.id },
    data: { dismissed: false, snoozedUntil: null },
  });
  revalidateReminderViews();
  return { ok: true };
}

export async function deleteReminder(reminderId: string): Promise<{ ok: boolean }> {
  const { business } = await requireActiveBusiness();
  await prisma.reminder.deleteMany({ where: { id: reminderId, businessId: business.id } });
  revalidateReminderViews();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function markNotificationRead(id: string, read = true): Promise<{ ok: boolean }> {
  const { user } = await requireActiveBusiness();
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read } });
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const { user, business } = await requireActiveBusiness();
  await prisma.notification.updateMany({
    where: { userId: user.id, businessId: business.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteNotification(id: string): Promise<{ ok: boolean }> {
  const { user } = await requireActiveBusiness();
  await prisma.notification.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true };
}
