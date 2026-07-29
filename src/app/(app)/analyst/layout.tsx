import Link from "next/link";

import { ConversationList } from "@/components/app/analyst/conversation-list";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/misc";
import { groqModel, isAiConfigured } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma";
import { requireActiveBusiness } from "@/lib/session";

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
    <div className="space-y-5">
      <PageHeader
        title="AI Policy Analyst"
        description={`Grounded in ${business.name}'s profile, jurisdictions and the RegLens policy dataset.`}
        actions={
          configured ? (
            <Badge tone="brand">Groq · {groqModel()}</Badge>
          ) : (
            <Badge tone="neutral" title="Set GROQ_API_KEY to use a live model.">
              Demo analyst — no API key configured
            </Badge>
          )
        }
      />

      {!configured ? (
        <p className="rounded-lg border border-info/20 bg-info-soft px-3 py-2 text-xs leading-5 text-info">
          No AI provider key is set, so answers are assembled deterministically from your business profile and
          the retrieved policy records. Every screen and action below still works. Add{" "}
          <code className="font-mono">GROQ_API_KEY</code> to <code className="font-mono">.env.local</code> and
          restart the server to switch to a live model — environment variables are read at startup.{" "}
          <Link href="/settings" className="underline underline-offset-2">
            See settings
          </Link>
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ConversationList
            conversations={conversations.map((c) => ({
              id: c.id,
              title: c.title,
              updatedAt: c.updatedAt.toISOString(),
              messageCount: c._count.messages,
            }))}
          />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
