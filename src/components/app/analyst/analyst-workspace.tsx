"use client";

import { CornerDownLeft, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AnswerCard } from "@/components/app/analyst/answer-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  businessName,
  conversationId,
  policyId,
  policyTitle,
  initialTurns,
}: {
  businessName: string;
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
    <div className="space-y-4">
      {turns.length === 0 && !pending ? (
        <Card>
          <CardContent className="space-y-4 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Sparkles className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Ask about anything regulatory for {businessName}
                </h2>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  The Analyst reads your business profile, your operating and target jurisdictions, your
                  compliance priorities and the policy records it retrieves before it answers. Every answer
                  lists the records it used.
                  {policyTitle ? ` This conversation is focused on “${policyTitle}”.` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ANALYST_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  disabled={pending}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-brand-ring hover:text-brand disabled:opacity-60"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {turns.map((turn, index) => (
          <div key={turn.id} className="space-y-3">
            <div className="flex justify-end">
              <p className="max-w-2xl rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-sm leading-6 text-white">
                {turn.question}
              </p>
            </div>

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
              <Card>
                <CardContent className="space-y-3 sm:px-6">
                  <p className="flex items-center gap-2 text-sm text-ink-muted">
                    <Loader2 className="size-4 animate-spin" />
                    Retrieving policy records and building your analysis…
                  </p>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <Card className="sticky bottom-4">
        <CardContent className="space-y-2 sm:px-4">
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
          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-muted">
              <CornerDownLeft className="mr-1 inline size-3" />
              Press ⌘/Ctrl + Enter to send
            </p>
            <Button type="button" onClick={() => ask(draft)} disabled={pending || draft.trim().length < 2}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {pending ? "Analysing…" : "Ask the Analyst"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
