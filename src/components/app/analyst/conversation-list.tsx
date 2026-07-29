"use client";

import { MessageSquare, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { deleteConversation } from "@/lib/actions/ai";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAction } from "@/lib/use-action";

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
};

export function ConversationList({ conversations }: { conversations: ConversationSummary[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { busy: pending, run } = useAction();

  return (
    <div className="space-y-2">
      <Link href="/analyst" className={`${buttonVariants({ variant: "secondary", size: "sm" })} w-full`}>
        <Plus className="size-3.5" />
        New analysis
      </Link>

      {conversations.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong px-3 py-4 text-xs text-ink-muted">
          Your saved analyses will appear here.
        </p>
      ) : (
        <ul className="space-y-1">
          {conversations.map((conversation) => {
            const active = pathname === `/analyst/${conversation.id}`;
            return (
              <li key={conversation.id} className="group relative">
                <Link
                  href={`/analyst/${conversation.id}`}
                  className={cn(
                    "block rounded-lg border px-3 py-2 pr-9 transition-colors",
                    active ? "border-brand bg-brand-soft" : "border-line hover:border-brand-ring",
                  )}
                >
                  <span className="flex items-start gap-2">
                    <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-ink-muted" />
                    <span className="min-w-0">
                      <span className={cn("line-clamp-2 block text-xs font-medium", active ? "text-brand" : "text-ink")}>
                        {conversation.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-ink-muted">
                        {conversation.messageCount} messages · {relativeTime(conversation.updatedAt)}
                      </span>
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label={`Delete ${conversation.title}`}
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      await deleteConversation(conversation.id);
                      if (active) router.push("/analyst");
                      else router.refresh();
                    })
                  }
                  className="absolute right-2 top-2 rounded p-1 text-ink-muted opacity-0 transition-opacity hover:bg-surface-muted hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
