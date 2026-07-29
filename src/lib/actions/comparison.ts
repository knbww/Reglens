"use server";

import { revalidatePath } from "next/cache";

import { buildComparison, type ComparisonResult } from "@/lib/comparison";
import { prisma } from "@/lib/prisma";
import { requireActiveBusiness } from "@/lib/session";
import { topicLabel } from "@/lib/taxonomy";

export async function runComparison(input: {
  topic: string;
  jurisdictionCodes: string[];
  activity: string;
}): Promise<{ ok: true; result: ComparisonResult } | { ok: false; error: string }> {
  const { business } = await requireActiveBusiness();
  if (!input.topic) return { ok: false, error: "Choose a regulatory topic." };
  if (input.jurisdictionCodes.filter(Boolean).length < 2) {
    return { ok: false, error: "Choose at least two jurisdictions to compare." };
  }

  const result = await buildComparison({
    topic: input.topic,
    jurisdictionCodes: input.jurisdictionCodes,
    activity: input.activity,
    business,
  });
  return { ok: true, result };
}

export async function saveComparison(input: {
  title: string;
  topic: string;
  activity: string;
  jurisdictionCodes: string[];
  result: ComparisonResult;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { user, business } = await requireActiveBusiness();
  const title = input.title.trim() || `${topicLabel(input.topic)} comparison`;

  const saved = await prisma.savedComparison.create({
    data: {
      businessId: business.id,
      userId: user.id,
      title,
      topic: input.topic,
      activity: input.activity,
      jurisdictionCodes: input.jurisdictionCodes,
      result: input.result as unknown as object,
    },
  });

  revalidatePath("/compare");
  return { ok: true, id: saved.id };
}

export async function deleteComparison(id: string): Promise<{ ok: boolean }> {
  const { business } = await requireActiveBusiness();
  await prisma.savedComparison.deleteMany({ where: { id, businessId: business.id } });
  revalidatePath("/compare");
  return { ok: true };
}

/** Turns a comparison into an action plan focused on the expansion jurisdiction. */
export async function createPlanFromComparison(input: {
  title: string;
  result: ComparisonResult;
  jurisdictionCode: string;
}): Promise<{ ok: true; planId: string } | { ok: false; error: string }> {
  const { business } = await requireActiveBusiness();
  const cell = input.result.cells.find((c) => c.jurisdictionCode === input.jurisdictionCode);
  if (!cell) return { ok: false, error: "That jurisdiction is not part of the comparison." };

  const plan = await prisma.actionPlan.create({
    data: {
      businessId: business.id,
      title: input.title.trim() || `Prepare for ${cell.jurisdictionName}: ${input.result.topicLabel}`,
      description: cell.businessImpact,
      source: "COMPARISON",
      category: input.result.topic,
      jurisdictionCode: cell.jurisdictionCode,
    },
  });

  const steps = cell.preparation.length > 0 ? cell.preparation : ["Confirm requirements with the responsible authority"];
  for (const [index, step] of steps.entries()) {
    const due = new Date();
    due.setDate(due.getDate() + 14 + index * 14);
    await prisma.task.create({
      data: {
        businessId: business.id,
        planId: plan.id,
        policyId: cell.policies[index]?.id ?? cell.policies[0]?.id ?? null,
        title: step.slice(0, 200),
        description: `From the ${input.result.topicLabel} comparison for ${cell.jurisdictionName}.`,
        category: input.result.topic,
        jurisdictionCode: cell.jurisdictionCode,
        priority: index === 0 ? "HIGH" : "MEDIUM",
        dueDate: due,
      },
    });
  }

  revalidatePath("/planner");
  return { ok: true, planId: plan.id };
}
