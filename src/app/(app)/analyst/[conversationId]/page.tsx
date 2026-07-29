import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AnalystWorkspace, type AnalystTurn } from "@/components/app/analyst/analyst-workspace";
import type { AnalystAnswer } from "@/lib/ai/schema";
import { prisma } from "@/lib/prisma";
import { requireActiveBusiness } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}): Promise<Metadata> {
  const { conversationId } = await params;
  const conversation = await prisma.aIConversation.findUnique({
    where: { id: conversationId },
    select: { title: true },
  });
  return { title: conversation?.title ?? "AI Policy Analyst" };
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const { business } = await requireActiveBusiness();

  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, businessId: business.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) notFound();

  const policy = conversation.policyId
    ? await prisma.policy.findUnique({ where: { id: conversation.policyId }, select: { id: true, title: true } })
    : null;

  // Messages persist as alternating user/assistant rows; rebuild them into turns.
  const turns: AnalystTurn[] = [];
  for (const message of conversation.messages) {
    if (message.role === "USER") {
      turns.push({
        id: message.id,
        question: message.content,
        answer: null,
        answerId: null,
        provider: "",
        saved: false,
      });
    } else {
      const current = turns[turns.length - 1];
      const answer = (message.structured as unknown as AnalystAnswer | null) ?? null;
      if (current && current.answer === null) {
        current.answer = answer;
        current.answerId = message.id;
        current.provider = message.provider;
        current.saved = message.saved;
      } else {
        turns.push({
          id: message.id,
          question: "(continued)",
          answer,
          answerId: message.id,
          provider: message.provider,
          saved: message.saved,
        });
      }
    }
  }

  return (
    <AnalystWorkspace
      businessName={business.name}
      conversationId={conversation.id}
      policyId={policy?.id ?? null}
      policyTitle={policy?.title ?? null}
      initialTurns={turns.filter((t) => t.answer !== null || t.question !== "(continued)")}
    />
  );
}
