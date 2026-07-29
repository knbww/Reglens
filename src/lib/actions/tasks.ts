"use server";

import type { PlanSource, TaskPriority, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireActiveBusiness } from "@/lib/session";

function revalidateTaskViews(policyId?: string | null) {
  revalidatePath("/planner");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  if (policyId) revalidatePath(`/policies/${policyId}`);
}

const taskSchema = z.object({
  title: z.string().min(3, "Give the task a short title"),
  description: z.string().default(""),
  category: z.string().default("general"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"]).default("NOT_STARTED"),
  dueDate: z.string().optional().nullable(),
  policyId: z.string().optional().nullable(),
  planId: z.string().optional().nullable(),
  jurisdictionCode: z.string().optional().nullable(),
  notes: z.string().default(""),
  checklist: z.array(z.string()).default([]),
});

export type TaskInput = z.input<typeof taskSchema>;
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createTask(input: TaskInput): Promise<ActionResult & { taskId?: string }> {
  const { business } = await requireActiveBusiness();
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid task" };
  const d = parsed.data;

  const task = await prisma.task.create({
    data: {
      businessId: business.id,
      planId: d.planId || null,
      policyId: d.policyId || null,
      title: d.title,
      description: d.description,
      category: d.category,
      jurisdictionCode: d.jurisdictionCode || null,
      priority: d.priority,
      status: d.status,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      notes: d.notes,
      completedAt: d.status === "COMPLETED" ? new Date() : null,
      checklist: {
        create: d.checklist
          .filter((label) => label.trim().length > 0)
          .map((label, i) => ({ label: label.trim(), position: i })),
      },
    },
  });

  revalidateTaskViews(d.policyId);
  return { ok: true, taskId: task.id };
}

export async function updateTask(
  taskId: string,
  input: Partial<TaskInput> & { notes?: string },
): Promise<ActionResult> {
  const { business } = await requireActiveBusiness();
  const existing = await prisma.task.findFirst({ where: { id: taskId, businessId: business.id } });
  if (!existing) return { ok: false, error: "Task not found" };

  const status = (input.status as TaskStatus | undefined) ?? existing.status;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      category: input.category ?? existing.category,
      priority: (input.priority as TaskPriority | undefined) ?? existing.priority,
      status,
      notes: input.notes ?? existing.notes,
      dueDate:
        input.dueDate === undefined
          ? existing.dueDate
          : input.dueDate
            ? new Date(input.dueDate)
            : null,
      completedAt: status === "COMPLETED" ? (existing.completedAt ?? new Date()) : null,
    },
  });

  revalidateTaskViews(existing.policyId);
  return { ok: true };
}

export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<ActionResult> {
  return updateTask(taskId, { status });
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const { business } = await requireActiveBusiness();
  const existing = await prisma.task.findFirst({ where: { id: taskId, businessId: business.id } });
  if (!existing) return { ok: false, error: "Task not found" };
  await prisma.task.delete({ where: { id: taskId } });
  revalidateTaskViews(existing.policyId);
  return { ok: true };
}

export async function toggleChecklistItem(itemId: string): Promise<ActionResult> {
  const { business } = await requireActiveBusiness();
  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, task: { businessId: business.id } },
    include: { task: { select: { id: true, policyId: true } } },
  });
  if (!item) return { ok: false, error: "Checklist item not found" };

  await prisma.checklistItem.update({ where: { id: itemId }, data: { done: !item.done } });

  // Auto-advance the parent task so progress reflects reality without extra clicks.
  const siblings = await prisma.checklistItem.findMany({ where: { taskId: item.taskId } });
  const doneCount = siblings.filter((s) => (s.id === itemId ? !item.done : s.done)).length;
  const task = await prisma.task.findUnique({ where: { id: item.taskId } });
  if (task && task.status !== "BLOCKED") {
    let next: TaskStatus = task.status;
    if (doneCount === siblings.length && siblings.length > 0) next = "COMPLETED";
    else if (doneCount > 0 && task.status === "NOT_STARTED") next = "IN_PROGRESS";
    else if (doneCount < siblings.length && task.status === "COMPLETED") next = "IN_PROGRESS";

    if (next !== task.status) {
      await prisma.task.update({
        where: { id: task.id },
        data: { status: next, completedAt: next === "COMPLETED" ? new Date() : null },
      });
    }
  }

  revalidateTaskViews(item.task.policyId);
  return { ok: true };
}

export async function addChecklistItem(taskId: string, label: string): Promise<ActionResult> {
  const { business } = await requireActiveBusiness();
  const task = await prisma.task.findFirst({ where: { id: taskId, businessId: business.id } });
  if (!task) return { ok: false, error: "Task not found" };
  if (!label.trim()) return { ok: false, error: "Enter a checklist item" };

  const count = await prisma.checklistItem.count({ where: { taskId } });
  await prisma.checklistItem.create({ data: { taskId, label: label.trim(), position: count } });
  revalidateTaskViews(task.policyId);
  return { ok: true };
}

export async function deleteChecklistItem(itemId: string): Promise<ActionResult> {
  const { business } = await requireActiveBusiness();
  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, task: { businessId: business.id } },
  });
  if (!item) return { ok: false, error: "Checklist item not found" };
  await prisma.checklistItem.delete({ where: { id: itemId } });
  revalidateTaskViews();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Action plans
// ---------------------------------------------------------------------------

const planSchema = z.object({
  title: z.string().min(3, "Give the plan a title"),
  description: z.string().default(""),
  category: z.string().default("general"),
  source: z.enum(["POLICY", "AI_ANALYSIS", "REGULATORY_UPDATE", "COMPARISON", "MANUAL"]).default("MANUAL"),
  policyId: z.string().optional().nullable(),
  conversationId: z.string().optional().nullable(),
  jurisdictionCode: z.string().optional().nullable(),
  tasks: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().default(""),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
        dueInDays: z.number().optional().nullable(),
        checklist: z.array(z.string()).default([]),
      }),
    )
    .default([]),
});

export type PlanInput = z.input<typeof planSchema>;

export async function createActionPlan(
  input: PlanInput,
): Promise<{ ok: true; planId: string } | { ok: false; error: string }> {
  const { business } = await requireActiveBusiness();
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid plan" };
  const d = parsed.data;

  const plan = await prisma.actionPlan.create({
    data: {
      businessId: business.id,
      title: d.title,
      description: d.description,
      category: d.category,
      source: d.source as PlanSource,
      policyId: d.policyId || null,
      conversationId: d.conversationId || null,
      jurisdictionCode: d.jurisdictionCode || null,
    },
  });

  for (const t of d.tasks) {
    const due = t.dueInDays === undefined || t.dueInDays === null ? null : new Date();
    if (due && t.dueInDays != null) due.setDate(due.getDate() + t.dueInDays);

    await prisma.task.create({
      data: {
        businessId: business.id,
        planId: plan.id,
        policyId: d.policyId || null,
        title: t.title,
        description: t.description,
        category: d.category,
        jurisdictionCode: d.jurisdictionCode || null,
        priority: t.priority,
        dueDate: due,
        checklist: {
          create: t.checklist.filter(Boolean).map((label, i) => ({ label, position: i })),
        },
      },
    });
  }

  revalidateTaskViews(d.policyId);
  return { ok: true, planId: plan.id };
}

export async function deleteActionPlan(planId: string): Promise<ActionResult> {
  const { business } = await requireActiveBusiness();
  await prisma.actionPlan.deleteMany({ where: { id: planId, businessId: business.id } });
  revalidateTaskViews();
  return { ok: true };
}
