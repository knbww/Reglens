import Link from "next/link";

import { ConversationList } from "@/components/app/analyst/conversation-list";
import { MarginNote, Sheet } from "@/components/app/sheet";
import { groqModel, isAiConfigured } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma";
import { requireActiveBusiness } from "@/lib/session";

/*
 * The Analyst reads as part of the product again: one masthead, one heading,
 * hairlines, and the earlier analyses in the margin. It had been left behind
 * on the old card-and-badge language, which is a large part of why it looked
 * like a different application bolted on the side.
 */
export default async function AnalystLayout({ children }: { children: React.ReactNode }) {
  const { business } = await requireActiveBusiness();

  const conversations = await prisma.aIConversation.findMany({
    where: { businessId: business.id },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: { _count: { select: { messages: true } } },
  });

  const configured = isAiConfigured();

  return (
    <Sheet
      columnClassName="max-w-3xl"
      margin={
        <div className="space-y-5">
          <MarginNote title="Earlier analyses">
            <ConversationList
              conversations={conversations.map((c) => ({
                id: c.id,
                title: c.title,
                updatedAt: c.updatedAt.toISOString(),
                messageCount: c._count.messages,
              }))}
            />
          </MarginNote>

          <MarginNote title="Model">
            {configured ? (
              <p className="text-[13px] leading-6 text-ink-soft">Groq · {groqModel()}</p>
            ) : (
              <p className="text-[13px] leading-6 text-ink-soft">
                No provider key is set, so answers are assembled from your profile and the retrieved
                records rather than from a model. Everything below still works —{" "}
                <Link href="/settings" className="counsel-link">
                  see settings
                </Link>
                .
              </p>
            )}
          </MarginNote>
        </div>
      }
    >
      <header className="rise pb-7">
        <p className="text-xs text-ink-muted">AI Analyst · {business.name}</p>
        <h1 className="mt-3 text-display font-semibold text-balance text-ink">
          Ask about anything regulatory
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-soft">
          Grounded in {business.name}&rsquo;s profile, its jurisdictions and the RegLens policy
          records. Every answer lists what it read, and turns into tasks in one click.
        </p>
      </header>

      {children}
    </Sheet>
  );
}
