"use client";

import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  ListPlus,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createPlanFromAnswer, createTaskFromRecommendation, toggleSavedAnswer } from "@/lib/actions/ai";
import type { AnalystAnswer } from "@/lib/ai/schema";
import { ANALYST_SUGGESTIONS } from "@/lib/ai/suggestions";
import { DISCLAIMER } from "@/lib/taxonomy";
import { useAction } from "@/lib/use-action";

const SEVERITY_TONE = { low: "neutral", moderate: "warning", high: "danger" } as const;
const PRIORITY_TONE = { LOW: "neutral", MEDIUM: "info", HIGH: "warning", URGENT: "critical" } as const;

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {icon}
      {children}
    </h3>
  );
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
      <Card>
        <CardContent className="space-y-3 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0 space-y-2">
              <p className="text-sm leading-6 text-ink-soft">{answer.plainExplanation}</p>
              {answer.whyItMatters ? (
                <p className="text-sm leading-6 text-ink-soft">{answer.whyItMatters}</p>
              ) : null}
              {degradedReason ? (
                <p className="text-xs leading-5 text-warning">
                  The AI provider could not be reached, so this reply came from RegLens itself. ({degradedReason})
                </p>
              ) : null}
            </div>
          </div>

          {onAsk ? (
            <div className="flex flex-wrap gap-1.5 pl-11">
              {ANALYST_SUGGESTIONS.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onAsk(suggestion)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-brand-ring hover:text-brand"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="print-break">
      <CardContent className="space-y-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="min-w-0 flex-1 text-base font-semibold leading-6 text-ink">{answer.title}</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={answer.confidence === "high" ? "success" : answer.confidence === "medium" ? "info" : "warning"}>
              {answer.confidence} confidence
            </Badge>
            {provider === "demo" ? (
              <Badge tone="neutral" title="No AI provider key is configured, so this analysis was assembled deterministically from your profile and the policy records.">
                Demo analysis
              </Badge>
            ) : (
              <Badge tone="brand">{provider}</Badge>
            )}
          </div>
        </div>

        {degradedReason ? (
          <p className="rounded-lg border border-warning/25 bg-warning-soft px-3 py-2 text-xs text-warning">
            The configured AI provider could not be reached, so RegLens produced this answer from your profile
            and the policy records instead. ({degradedReason})
          </p>
        ) : null}

        <section className="space-y-2">
          <SectionHeading icon={<CheckCircle2 className="size-3.5" />}>Plain-language explanation</SectionHeading>
          <p className="text-sm leading-6 text-ink-soft">{answer.plainExplanation}</p>
        </section>

        {answer.whyItMatters ? (
          <section className="space-y-2">
            <SectionHeading icon={<CheckCircle2 className="size-3.5" />}>Why it may matter to you</SectionHeading>
            <p className="text-sm leading-6 text-ink-soft">{answer.whyItMatters}</p>
          </section>
        ) : null}

        {answer.keyImpacts.length > 0 ? (
          <section className="space-y-2">
            <SectionHeading icon={<CheckCircle2 className="size-3.5" />}>Key impacts</SectionHeading>
            <ul className="space-y-1.5">
              {answer.keyImpacts.map((impact) => (
                <li key={impact} className="flex gap-2 text-sm leading-6 text-ink-soft">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  {impact}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {answer.risks.length > 0 ? (
          <section className="space-y-2">
            <SectionHeading icon={<AlertTriangle className="size-3.5" />}>Risks</SectionHeading>
            <ul className="space-y-2">
              {answer.risks.map((risk) => (
                <li key={risk.label} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{risk.label}</p>
                    <Badge tone={SEVERITY_TONE[risk.severity]}>{risk.severity}</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">{risk.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {answer.recommendedActions.length > 0 ? (
          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionHeading icon={<ListPlus className="size-3.5" />}>Recommended actions</SectionHeading>
              <Button
                type="button"
                variant="subtle"
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
                <ListPlus className="size-3.5" />
                Turn all into an action plan
              </Button>
            </div>
            <ul className="space-y-2">
              {answer.recommendedActions.map((action, index) => (
                <li key={`${action.title}-${index}`} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 text-sm font-medium text-ink">{action.title}</p>
                    <Badge tone={PRIORITY_TONE[action.priority]}>{action.priority.toLowerCase()}</Badge>
                  </div>
                  {action.detail ? (
                    <p className="mt-1 text-xs leading-5 text-ink-muted">{action.detail}</p>
                  ) : null}
                  {action.checklist.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {action.checklist.map((item) => (
                        <li key={item} className="flex gap-2 text-xs text-ink-muted">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-line-strong" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-2.5 flex items-center gap-3">
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
                      <Plus className="size-3.5" />
                      {created.includes(index) ? "Task created" : "Create task"}
                    </Button>
                    {action.dueInDays !== null ? (
                      <span className="text-xs text-ink-muted">Suggested in {action.dueInDays} days</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {answer.deadlines.length > 0 ? (
          <section className="space-y-2">
            <SectionHeading icon={<CalendarClock className="size-3.5" />}>Deadlines</SectionHeading>
            <ul className="space-y-1.5">
              {answer.deadlines.map((deadline) => (
                <li key={`${deadline.label}-${deadline.date}`} className="rounded-lg border border-line px-3 py-2">
                  <p className="text-sm font-medium text-ink">{deadline.label}</p>
                  <p className="text-xs text-ink-muted">
                    <span className="tabular">{deadline.date || "Date not recorded"}</span>
                    {deadline.description ? ` — ${deadline.description}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {answer.jurisdictions.length > 0 ? (
          <section className="space-y-2">
            <SectionHeading icon={<MapPin className="size-3.5" />}>Relevant jurisdictions</SectionHeading>
            <div className="flex flex-wrap gap-1.5">
              {answer.jurisdictions.map((jurisdiction) => (
                <Badge key={jurisdiction} tone="neutral">
                  {jurisdiction}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-2">
          <SectionHeading icon={<ExternalLink className="size-3.5" />}>Sources</SectionHeading>
          {answer.sources.length === 0 ? (
            <p className="text-xs text-ink-muted">
              No policy records were cited for this answer. Treat it as unverified.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {answer.sources.map((source) => (
                <li key={source.policyId} className="rounded-lg border border-line px-3 py-2">
                  <Link href={`/policies/${source.policyId}`} className="text-sm font-medium text-brand hover:underline">
                    {source.title}
                  </Link>
                  {source.sourceUrl ? (
                    <a
                      href={source.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
                    >
                      {source.sourceName || source.sourceUrl}
                      <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button
            type="button"
            variant="secondary"
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
            {saved ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
            {saved ? "Saved" : "Save answer"}
          </Button>
          {message ? <span className="text-xs text-ink-muted">{message}</span> : null}
        </div>

        <p className="border-t border-line pt-3 text-xs leading-5 text-ink-muted">{DISCLAIMER}</p>
      </CardContent>
    </Card>
  );
}
