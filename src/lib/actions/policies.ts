"use server";

import type { MonitorTargetType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireActiveBusiness } from "@/lib/session";

export async function toggleSavedPolicy(policyId: string): Promise<{ saved: boolean }> {
  const { business } = await requireActiveBusiness();
  const existing = await prisma.savedPolicy.findUnique({
    where: { businessId_policyId: { businessId: business.id, policyId } },
  });

  if (existing) {
    await prisma.savedPolicy.delete({ where: { id: existing.id } });
    revalidatePath("/policies");
    revalidatePath(`/policies/${policyId}`);
    return { saved: false };
  }

  await prisma.savedPolicy.create({ data: { businessId: business.id, policyId } });
  revalidatePath("/policies");
  revalidatePath(`/policies/${policyId}`);
  return { saved: true };
}

export async function toggleMonitorPolicy(policyId: string): Promise<{ monitoring: boolean }> {
  const { business } = await requireActiveBusiness();
  const existing = await prisma.monitoredPolicy.findFirst({
    where: { businessId: business.id, targetType: "POLICY", policyId },
  });

  if (existing) {
    await prisma.monitoredPolicy.delete({ where: { id: existing.id } });
    revalidatePath("/monitoring");
    revalidatePath(`/policies/${policyId}`);
    return { monitoring: false };
  }

  const policy = await prisma.policy.findUnique({ where: { id: policyId }, select: { title: true } });
  await prisma.monitoredPolicy.create({
    data: {
      businessId: business.id,
      targetType: "POLICY",
      policyId,
      label: policy?.title ?? policyId,
    },
  });
  revalidatePath("/monitoring");
  revalidatePath(`/policies/${policyId}`);
  return { monitoring: true };
}

/** Adds a jurisdiction, industry or topic watch. */
export async function addMonitorTarget(
  targetType: Exclude<MonitorTargetType, "POLICY">,
  targetKey: string,
  label: string,
): Promise<{ ok: boolean }> {
  const { business } = await requireActiveBusiness();
  const existing = await prisma.monitoredPolicy.findFirst({
    where: { businessId: business.id, targetType, targetKey },
  });
  if (existing) return { ok: true };

  await prisma.monitoredPolicy.create({
    data: { businessId: business.id, targetType, targetKey, label },
  });
  revalidatePath("/monitoring");
  return { ok: true };
}

export async function removeMonitor(monitorId: string): Promise<{ ok: boolean }> {
  const { business } = await requireActiveBusiness();
  await prisma.monitoredPolicy.deleteMany({ where: { id: monitorId, businessId: business.id } });
  revalidatePath("/monitoring");
  return { ok: true };
}

/**
 * Simulates the scheduled monitoring run. The MVP has no crawler: this stamps
 * the last-checked time against the seeded change records.
 */
export async function runMonitoringCheck(): Promise<{ checked: number }> {
  const { business } = await requireActiveBusiness();
  const result = await prisma.monitoredPolicy.updateMany({
    where: { businessId: business.id, active: true },
    data: { lastChecked: new Date() },
  });
  revalidatePath("/monitoring");
  return { checked: result.count };
}

/** Builds an action plan straight from a policy's recorded requirements. */
export async function createPlanFromPolicy(
  policyId: string,
): Promise<{ ok: true; planId: string } | { ok: false; error: string }> {
  const { business } = await requireActiveBusiness();
  const policy = await prisma.policy.findUnique({ where: { id: policyId } });
  if (!policy) return { ok: false, error: "That policy could not be found." };

  const requirements = (policy.requirements as unknown as { title: string; detail: string }[]) ?? [];
  const deadlines =
    (policy.deadlines as unknown as { label: string; date: string; description: string }[]) ?? [];

  const plan = await prisma.actionPlan.create({
    data: {
      businessId: business.id,
      title: `Comply with ${policy.title}`,
      description: policy.plainSummary,
      source: "POLICY",
      policyId: policy.id,
      jurisdictionCode: policy.jurisdictionCode,
      category: policy.topicTags[0] ?? "general",
    },
  });

  const priority =
    policy.importance === "CRITICAL"
      ? "URGENT"
      : policy.importance === "HIGH"
        ? "HIGH"
        : policy.importance === "MODERATE"
          ? "MEDIUM"
          : "LOW";

  const steps =
    requirements.length > 0
      ? requirements
      : [{ title: `Review ${policy.title}`, detail: policy.plainSummary }];

  for (const [index, requirement] of steps.entries()) {
    // Prefer a real calendar deadline from the policy where one exists.
    const matching = deadlines.find((d) => !d.date.startsWith("REL:"));
    let dueDate: Date | null = null;
    if (index === 0 && matching) {
      const parsed = new Date(matching.date);
      if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) dueDate = parsed;
    }
    if (!dueDate) {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14 + index * 14);
    }

    await prisma.task.create({
      data: {
        businessId: business.id,
        planId: plan.id,
        policyId: policy.id,
        title: requirement.title.slice(0, 200),
        description: requirement.detail,
        category: policy.topicTags[0] ?? "general",
        jurisdictionCode: policy.jurisdictionCode,
        priority,
        dueDate,
        checklist: {
          create: [
            { label: "Confirm who owns this internally", position: 0 },
            { label: "Gather the supporting documents", position: 1 },
            { label: `Verify the detail with ${policy.agency}`, position: 2 },
          ],
        },
      },
    });
  }

  revalidatePath("/planner");
  revalidatePath("/dashboard");
  revalidatePath(`/policies/${policyId}`);
  return { ok: true, planId: plan.id };
}

/** Creates a task for acting on a specific detected change. */
export async function createTaskFromUpdate(
  updateId: string,
): Promise<{ ok: true; taskId: string } | { ok: false; error: string }> {
  const { business } = await requireActiveBusiness();
  const update = await prisma.policyUpdate.findUnique({
    where: { id: updateId },
    include: { policy: true },
  });
  if (!update) return { ok: false, error: "That update could not be found." };

  const due = new Date();
  due.setDate(due.getDate() + (update.importance === "CRITICAL" ? 7 : update.importance === "HIGH" ? 14 : 30));

  const task = await prisma.task.create({
    data: {
      businessId: business.id,
      policyId: update.policyId,
      title: `Act on: ${update.title}`.slice(0, 200),
      description: update.description,
      category: update.policy.topicTags[0] ?? "general",
      jurisdictionCode: update.policy.jurisdictionCode,
      priority:
        update.importance === "CRITICAL" ? "URGENT" : update.importance === "HIGH" ? "HIGH" : "MEDIUM",
      dueDate: due,
      checklist: {
        create: [
          { label: "Read the change and the underlying policy", position: 0 },
          { label: "Decide whether it changes what we do", position: 1 },
          { label: `Confirm with ${update.policy.agency} if unclear`, position: 2 },
        ],
      },
    },
  });

  await prisma.policyUpdateReview.upsert({
    where: { businessId_updateId: { businessId: business.id, updateId } },
    create: { businessId: business.id, updateId, state: "REVIEWED" },
    update: { state: "REVIEWED" },
  });

  revalidatePath("/planner");
  revalidatePath("/monitoring");
  revalidatePath("/dashboard");
  return { ok: true, taskId: task.id };
}

export async function setUpdateReviewState(
  updateId: string,
  state: "UNREVIEWED" | "REVIEWED" | "DISMISSED",
): Promise<{ ok: boolean }> {
  const { business } = await requireActiveBusiness();
  await prisma.policyUpdateReview.upsert({
    where: { businessId_updateId: { businessId: business.id, updateId } },
    create: { businessId: business.id, updateId, state },
    update: { state },
  });
  revalidatePath("/monitoring");
  revalidatePath("/dashboard");
  return { ok: true };
}
