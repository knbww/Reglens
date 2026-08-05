"use client";

import { CornerDownLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AnswerCard } from "@/components/app/analyst/answer-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/misc";
import { askAnalyst } from "@/lib/actions/ai";
import type { AnalystAnswer } from "@/lib/ai/schema";
import { ANALYST_SUGGESTIONS } from "@/lib/ai/suggestions";
import { useAction } from "@/lib/use-action";

export type AnalystTurn = {
  id: string;
  question: string;
  answer: AnalystAnswer | null;
  answerId: string | null;
  provider: string;
  saved: boolean;
  degradedReason?: string;
};

export function AnalystWorkspace({
  conversationId,
  policyId,
  policyTitle,
  initialTurns,
}: {
  conversationId: string | null;
  policyId: string | null;
  policyTitle: string | null;
  initialTurns: AnalystTurn[];
}) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [turns, setTurns] = useState<AnalystTurn[]>(initialTurns);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState(conversationId);
  const [syncedConversation, setSyncedConversation] = useState(conversationId);
  const endRef = useRef<HTMLDivElement>(null);
  const pendingCounter = useRef(0);

  // Navigating to a different conversation replaces the transcript. Resetting
  // during render (rather than in an effect) avoids a cascading re-render.
  if (syncedConversation !== conversationId) {
    setSyncedConversation(conversationId);
    setActiveConversation(conversationId);
    setTurns(initialTurns);
  }

  useEffect(() => {
    if (turns.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, pending]);

  function ask(question: string) {
    const trimmed = question.trim();
    if (trimmed.length < 2) {
      setError("Type a message first.");
      return;
    }
    setError(null);
    setDraft("");

    pendingCounter.current += 1;
    const optimisticId = `pending-${pendingCounter.current}`;
    setTurns((prev) => [
      ...prev,
      { id: optimisticId, question: trimmed, answer: null, answerId: null, provider: "", saved: false },
    ]);

    run(async () => {
      const result = await askAnalyst({
        question: trimmed,
        conversationId: activeConversation,
        policyId,
      });

      if (!result.ok) {
        setError(result.error);
        setTurns((prev) => prev.filter((t) => t.id !== optimisticId));
        return;
      }

      setActiveConversation(result.conversationId);
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === optimisticId
            ? {
                id: result.messageId,
                question: trimmed,
                answer: result.answer,
                answerId: result.messageId,
                provider: result.provider,
                saved: false,
                degradedReason: result.degradedReason,
              }
            : turn,
        ),
      );

      // Keep the conversation list and URL in step with what just happened.
      if (!conversationId) router.replace(`/analyst/${result.conversationId}`);
      router.refresh();
    });
  }

  return (
    <div>
      {turns.length === 0 && !pending ? (
        <div className="rise border-t border-line pt-6">
          {policyTitle ? (
            <p className="max-w-2xl pb-4 text-[15px] leading-7 text-ink-soft">
              This conversation is focused on “{policyTitle}”.
            </p>
          ) : null}

          {/* Openers, as things you can say rather than as chips. */}
          <p className="text-xs font-medium text-ink-muted">Start from one of these</p>
          <ul className="mt-1">
            {ANALYST_SUGGESTIONS.map((suggestion) => (
              <li key={suggestion} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => ask(suggestion)}
                  disabled={pending}
                  className="lift -mx-3 block w-[calc(100%+1.5rem)] rounded-md px-3 py-2.5 text-left text-[15px] leading-6 text-ink-soft transition-colors hover:text-ink disabled:opacity-60"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        {turns.map((turn, index) => (
          <div key={turn.id} className="border-t border-line pt-6 first:border-t-0 first:pt-0">
            {/* The question is quoted back as a heading, not as a coloured
                speech bubble — this is a written exchange, not a messenger. */}
            <p className="text-xs text-ink-muted">You asked</p>
            <p className="mt-1 max-w-2xl text-[15px] font-medium leading-7 text-ink">{turn.question}</p>

            <div className="mt-5">
              {turn.answer && turn.answerId ? (
                <AnswerCard
                  answer={turn.answer}
                  messageId={turn.answerId}
                  provider={turn.provider}
                  saved={turn.saved}
                  degradedReason={turn.degradedReason}
                  // Starter prompts help once; repeating them under every reply is noise.
                  onAsk={index === 0 ? ask : undefined}
                />
              ) : (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-[13px] text-ink-muted">
                    <Loader2 className="size-4 animate-spin" />
                    Retrieving policy records and building your analysis…
                  </p>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 mt-8 border-t border-line bg-canvas pb-4 pt-4">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              ask(draft);
            }
          }}
          rows={3}
          placeholder={
            turns.length === 0
              ? "Ask a question — for example, what do I need before I start shipping to Canada?"
              : "Ask a follow-up…"
          }
          disabled={pending}
          aria-label="Your question"
        />
        {error ? <p className="mt-2 text-[13px] text-alert">{error}</p> : null}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink-muted">
            <CornerDownLeft className="mr-1 inline size-3" />
            Press ⌘/Ctrl + Enter to send
          </p>
          <Button type="button" onClick={() => ask(draft)} disabled={pending || draft.trim().length < 2}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {pending ? "Analysing…" : "Ask the Analyst"}
          </Button>
        </div>
      </div>
    </div>
  );
}
