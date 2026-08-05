"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createPlanFromAnswer, createTaskFromRecommendation, toggleSavedAnswer } from "@/lib/actions/ai";
import type { AnalystAnswer } from "@/lib/ai/schema";
import { ANALYST_SUGGESTIONS } from "@/lib/ai/suggestions";
import { DISCLAIMER } from "@/lib/taxonomy";
import { useAction } from "@/lib/use-action";

/**
 * The answer, set as a document.
 *
 * It used to be a card of cards: every section boxed, every severity and
 * priority a filled pill, the sources in outlined tiles. Nothing about an
 * analysis needs a box — a rule and a heading separate sections perfectly
 * well, and the severities read as words because that is what they are.
 */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-medium text-ink-muted">{children}</h3>;
}

export function AnswerCard({
  answer,
  messageId,
  provider,
  saved: initialSaved,
  degradedReason,
  onAsk,
}: {
  answer: AnalystAnswer;
  messageId: string;
  provider: string;
  saved: boolean;
  degradedReason?: string;
  onAsk?: (question: string) => void;
}) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [saved, setSaved] = useState(initialSaved);
  const [created, setCreated] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // The model decides how much structure an answer needs. When it returns none,
  // this is a plain reply — render it as one rather than as an empty report.
  const hasAnalysis =
    answer.keyImpacts.length > 0 ||
    answer.risks.length > 0 ||
    answer.recommendedActions.length > 0 ||
    answer.deadlines.length > 0 ||
    answer.sources.length > 0;

  if (!hasAnalysis) {
    return (
      <div className="space-y-3">
        <p className="max-w-2xl text-[15px] leading-7 text-ink">{answer.plainExplanation}</p>
        {answer.whyItMatters ? (
          <p className="max-w-2xl text-[15px] leading-7 text-ink-soft">{answer.whyItMatters}</p>
        ) : null}
        {degradedReason ? (
          <p className="max-w-2xl text-[13px] leading-6 text-ink-muted">
            The AI provider could not be reached, so this reply came from RegLens itself.{" "}
            ({degradedReason})
          </p>
        ) : null}

        {onAsk ? (
          <ul className="pt-2">
            {ANALYST_SUGGESTIONS.slice(0, 4).map((suggestion) => (
              <li key={suggestion} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => onAsk(suggestion)}
                  className="lift -mx-3 block w-[calc(100%+1.5rem)] rounded-md px-3 py-2.5 text-left text-[14px] leading-6 text-ink-soft hover:text-ink"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <article className="print-break">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="min-w-0 max-w-2xl flex-1 text-title font-semibold text-balance text-ink">
          {answer.title}
        </h2>
        <p className="shrink-0 text-xs text-ink-muted">
          {answer.confidence} confidence ·{" "}
          {provider === "demo" ? "assembled by RegLens" : provider}
        </p>
      </div>

      {degradedReason ? (
        <p className="mt-3 max-w-2xl text-[13px] leading-6 text-ink-muted">
          The configured AI provider could not be reached, so RegLens produced this answer from your
          profile and the policy records instead. ({degradedReason})
        </p>
      ) : null}

      <section className="mt-5">
        <SectionHeading>Plain-language explanation</SectionHeading>
        <p className="mt-2 max-w-2xl text-[15px] leading-7 text-ink">{answer.plainExplanation}</p>
      </section>

      {answer.whyItMatters ? (
        <section className="mt-6">
          <SectionHeading>Why it may matter to you</SectionHeading>
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-ink-soft">{answer.whyItMatters}</p>
        </section>
      ) : null}

      {answer.keyImpacts.length > 0 ? (
        <section className="mt-6">
          <SectionHeading>Key impacts</SectionHeading>
          <ul className="mt-2 max-w-2xl">
            {answer.keyImpacts.map((impact) => (
              <li key={impact} className="border-b border-line py-2.5 text-[15px] leading-7 text-ink-soft last:border-b-0">
                {impact}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {answer.risks.length > 0 ? (
        <section className="mt-6">
          <SectionHeading>Risks</SectionHeading>
          <ul className="mt-2 max-w-2xl">
            {answer.risks.map((risk) => (
              <li key={risk.label} className="border-b border-line py-3 last:border-b-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-[15px] font-medium text-ink">{risk.label}</p>
                  <p className="shrink-0 text-[13px] text-ink-muted">{risk.severity} severity</p>
                </div>
                <p className="mt-1 text-[14px] leading-6 text-ink-soft">{risk.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {answer.recommendedActions.length > 0 ? (
        <section className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <SectionHeading>Recommended actions</SectionHeading>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const result = await createPlanFromAnswer(messageId);
                  if (!result.ok) {
                    setMessage(result.error);
                    return;
                  }
                  router.push(`/planner?plan=${result.planId}`);
                })
              }
            >
              Turn all into an action plan
            </Button>
          </div>

          <ul className="mt-2 max-w-2xl">
            {answer.recommendedActions.map((action, index) => (
              <li key={`${action.title}-${index}`} className="border-b border-line py-4 last:border-b-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="min-w-0 flex-1 text-[15px] font-medium leading-6 text-ink">
                    {action.title}
                  </p>
                  <p className="shrink-0 text-[13px] text-ink-muted">
                    {action.priority.toLowerCase()} priority
                    {action.dueInDays !== null ? ` · suggested in ${action.dueInDays} days` : ""}
                  </p>
                </div>

                {action.detail ? (
                  <p className="mt-1 text-[14px] leading-6 text-ink-soft">{action.detail}</p>
                ) : null}

                {action.checklist.length > 0 ? (
                  <ul className="mt-2">
                    {action.checklist.map((item) => (
                      <li key={item} className="text-[13px] leading-6 text-ink-muted">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-2.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={pending || created.includes(index)}
                    onClick={() =>
                      run(async () => {
                        const result = await createTaskFromRecommendation(messageId, index);
                        if (!result.ok) {
                          setMessage(result.error);
                          return;
                        }
                        setCreated((prev) => [...prev, index]);
                        setMessage("Task created in your action planner.");
                        router.refresh();
                      })
                    }
                  >
                    {created.includes(index) ? "Task created" : "Create task"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {answer.deadlines.length > 0 ? (
        <section className="mt-6">
          <SectionHeading>Deadlines</SectionHeading>
          <ul className="mt-2 max-w-2xl">
            {answer.deadlines.map((deadline) => (
              <li key={`${deadline.label}-${deadline.date}`} className="border-b border-line py-3 last:border-b-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-[15px] font-medium text-ink">{deadline.label}</p>
                  <p className="tabular shrink-0 text-[13px] text-ink-muted">
                    {deadline.date || "Date not recorded"}
                  </p>
                </div>
                {deadline.description ? (
                  <p className="mt-1 text-[14px] leading-6 text-ink-soft">{deadline.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {answer.jurisdictions.length > 0 ? (
        <section className="mt-6">
          <SectionHeading>Relevant jurisdictions</SectionHeading>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink-soft">
            {answer.jurisdictions.join(" · ")}
          </p>
        </section>
      ) : null}

      <section className="mt-6">
        <SectionHeading>Sources</SectionHeading>
        {answer.sources.length === 0 ? (
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink-muted">
            No policy records were cited for this answer. Treat it as unverified.
          </p>
        ) : (
          <ul className="mt-2 max-w-2xl">
            {answer.sources.map((source) => (
              <li key={source.policyId} className="border-b border-line py-2.5 last:border-b-0">
                <Link href={`/policies/${source.policyId}`} className="counsel-link text-[14px] leading-6">
                  {source.title}
                </Link>
                {source.sourceUrl ? (
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink"
                  >
                    {source.sourceName || source.sourceUrl}
                    <ExternalLink aria-hidden className="size-3" />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const result = await toggleSavedAnswer(messageId);
              setSaved(result.saved);
              setMessage(result.saved ? "Answer saved." : "Answer unsaved.");
            })
          }
        >
          {saved ? "Saved" : "Save answer"}
        </Button>
        {message ? <span className="text-[13px] text-ink-muted">{message}</span> : null}
      </div>

      <p className="mt-4 max-w-2xl text-xs leading-5 text-ink-muted">{DISCLAIMER}</p>
    </article>
  );
}
