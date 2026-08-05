"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
    <div>
      <Link
        href="/analyst"
        className="text-[13px] text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
      >
        New analysis
      </Link>

      {conversations.length === 0 ? (
        <p className="mt-3 text-[13px] leading-6 text-ink-muted">
          What you ask is kept here, so an answer can be picked up later.
        </p>
      ) : (
        <ul className="mt-2">
          {conversations.map((conversation) => {
            const active = pathname === `/analyst/${conversation.id}`;
            return (
              <li key={conversation.id} className="group relative border-b border-line last:border-b-0">
                <Link
                  href={`/analyst/${conversation.id}`}
                  aria-current={active ? "page" : undefined}
                  className="lift -mx-2 block rounded-md py-2 pl-2 pr-7"
                >
                  <span
                    className={cn(
                      "line-clamp-2 block text-[13px] leading-5",
                      active ? "font-medium text-ink" : "text-ink-soft",
                    )}
                  >
                    {conversation.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {conversation.messageCount} messages · {relativeTime(conversation.updatedAt)}
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
                  className="absolute right-0 top-2 rounded p-1 text-ink-muted opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
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
