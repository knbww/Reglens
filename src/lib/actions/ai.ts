"use server";

import { revalidatePath } from "next/cache";

import { retrievePolicies } from "@/lib/ai/context";
import { isSmallTalk } from "@/lib/ai/demo";
import { runAnalyst } from "@/lib/ai/provider";
import type { AnalystAnswer } from "@/lib/ai/schema";
import { prisma } from "@/lib/prisma";
import { requireActiveBusiness } from "@/lib/session";

export type AskAnalystResult =
  | { ok: true; conversationId: string; messageId: string; answer: AnalystAnswer; provider: string; degradedReason?: string }
  | { ok: false; error: string };

/**
 * The single entry point for the AI Analyst: retrieves context, calls the
 * provider (or the demo analyst), validates, persists and returns.
 */
export async function askAnalyst({
  question,
  conversationId,
  policyId,
}: {
  question: string;
  conversationId?: string | null;
  policyId?: string | null;
}): Promise<AskAnalystResult> {
  const { user, business } = await requireActiveBusiness();

  const trimmed = question.trim();
  if (trimmed.length < 2) return { ok: false, error: "Type a message first." };
  if (trimmed.length > 2000) return { ok: false, error: "That question is too long. Try to keep it under 2000 characters." };

  let conversation = conversationId
    ? await prisma.aIConversation.findFirst({
        where: { id: conversationId, businessId: business.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  if (!conversation) {
    const created = await prisma.aIConversation.create({
      data: {
        businessId: business.id,
        userId: user.id,
        policyId: policyId ?? null,
        title: trimmed.slice(0, 80),
      },
    });
    conversation = { ...created, messages: [] };
  }

  const focusPolicy = (policyId ?? conversation.policyId)
    ? await prisma.policy.findUnique({ where: { id: (policyId ?? conversation.policyId)! } })
    : null;

  // A greeting needs no policy context; skip the retrieval entirely.
  const policies = isSmallTalk(trimmed)
    ? []
    : await retrievePolicies({ business, question: trimmed, policyId: focusPolicy?.id ?? null });

  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: "USER", content: trimmed },
  });

  const result = await runAnalyst({
    business,
    policies,
    question: trimmed,
    focusPolicy,
    history: conversation.messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const assistantMessage = await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: result.answer.plainExplanation,
      structured: result.answer as unknown as object,
      provider: result.provider,
    },
  });

  await prisma.aIConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/analyst");
  revalidatePath(`/analyst/${conversation.id}`);

  return {
    ok: true,
    conversationId: conversation.id,
    messageId: assistantMessage.id,
    answer: result.answer,
    provider: result.provider,
    degradedReason: result.degradedReason,
  };
}

export async function toggleSavedAnswer(messageId: string): Promise<{ saved: boolean }> {
  const { business } = await requireActiveBusiness();
  const message = await prisma.aIMessage.findFirst({
    where: { id: messageId, conversation: { businessId: business.id } },
  });
  if (!message) return { saved: false };

  const updated = await prisma.aIMessage.update({
    where: { id: messageId },
    data: { saved: !message.saved },
  });
  revalidatePath("/analyst");
  revalidatePath(`/analyst/${message.conversationId}`);
  return { saved: updated.saved };
}

export async function renameConversation(conversationId: string, title: string): Promise<{ ok: boolean }> {
  const { business } = await requireActiveBusiness();
  const trimmed = title.trim().slice(0, 120);
  if (!trimmed) return { ok: false };
  await prisma.aIConversation.updateMany({
    where: { id: conversationId, businessId: business.id },
    data: { title: trimmed },
  });
  revalidatePath("/analyst");
  return { ok: true };
}

export async function deleteConversation(conversationId: string): Promise<{ ok: boolean }> {
  const { business } = await requireActiveBusiness();
  await prisma.aIConversation.deleteMany({ where: { id: conversationId, businessId: business.id } });
  revalidatePath("/analyst");
  return { ok: true };
}

/** Turns an analyst answer into a persisted action plan with tasks. */
export async function createPlanFromAnswer(
  messageId: string,
): Promise<{ ok: true; planId: string } | { ok: false; error: string }> {
  const { business } = await requireActiveBusiness();
  const message = await prisma.aIMessage.findFirst({
    where: { id: messageId, conversation: { businessId: business.id } },
    include: { conversation: true },
  });
  if (!message?.structured) return { ok: false, error: "That answer is no longer available." };

  const answer = message.structured as unknown as AnalystAnswer;
  const policyId = answer.sources[0]?.policyId ?? message.conversation.policyId ?? null;

  const plan = await prisma.actionPlan.create({
    data: {
      businessId: business.id,
      title: answer.title.slice(0, 120),
      description: answer.whyItMatters,
      source: "AI_ANALYSIS",
      conversationId: message.conversationId,
      policyId,
      category: "general",
    },
  });

  for (const action of answer.recommendedActions) {
    const dueDate = action.dueInDays === null ? null : new Date();
    if (dueDate && action.dueInDays !== null) dueDate.setDate(dueDate.getDate() + action.dueInDays);

    await prisma.task.create({
      data: {
        businessId: business.id,
        planId: plan.id,
        policyId,
        title: action.title.slice(0, 200),
        description: action.detail,
        priority: action.priority,
        dueDate,
        checklist: {
          create: action.checklist.filter(Boolean).map((label, i) => ({ label, position: i })),
        },
      },
    });
  }

  revalidatePath("/planner");
  revalidatePath("/dashboard");
  return { ok: true, planId: plan.id };
}

/** Creates a single task from one recommended action. */
export async function createTaskFromRecommendation(
  messageId: string,
  index: number,
): Promise<{ ok: true; taskId: string } | { ok: false; error: string }> {
  const { business } = await requireActiveBusiness();
  const message = await prisma.aIMessage.findFirst({
    where: { id: messageId, conversation: { businessId: business.id } },
    include: { conversation: true },
  });
  if (!message?.structured) return { ok: false, error: "That answer is no longer available." };

  const answer = message.structured as unknown as AnalystAnswer;
  const action = answer.recommendedActions[index];
  if (!action) return { ok: false, error: "That recommendation could not be found." };

  const dueDate = action.dueInDays === null ? null : new Date();
  if (dueDate && action.dueInDays !== null) dueDate.setDate(dueDate.getDate() + action.dueInDays);

  const task = await prisma.task.create({
    data: {
      businessId: business.id,
      policyId: answer.sources[0]?.policyId ?? message.conversation.policyId ?? null,
      title: action.title.slice(0, 200),
      description: action.detail,
      priority: action.priority,
      dueDate,
      checklist: {
        create: action.checklist.filter(Boolean).map((label, i) => ({ label, position: i })),
      },
    },
  });

  revalidatePath("/planner");
  revalidatePath("/dashboard");
  return { ok: true, taskId: task.id };
}
