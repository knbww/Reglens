"use client";

import { ExternalLink, ListPlus, Printer, Save, Sparkles, SplitSquareHorizontal, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { JURISDICTIONS } from "@/data/jurisdictions";
import {
  createPlanFromComparison,
  deleteComparison,
  runComparison,
  saveComparison,
} from "@/lib/actions/comparison";
import type { ComparisonResult } from "@/lib/comparison";
import { formatDate } from "@/lib/format";
import { COMPLIANCE_TOPICS } from "@/lib/taxonomy";
import { useAction } from "@/lib/use-action";

export type SavedComparisonRow = {
  id: string;
  title: string;
  topic: string;
  activity: string;
  jurisdictionCodes: string[];
  createdAt: string;
  result: ComparisonResult;
};

export function ComparisonTool({
  defaultTopic,
  defaultJurisdictions,
  activityDefault,
  savedComparisons,
}: {
  defaultTopic: string;
  defaultJurisdictions: string[];
  activityDefault: string;
  savedComparisons: SavedComparisonRow[];
}) {
  const router = useRouter();
  const { busy: pending, run: execute } = useAction();
  const [topic, setTopic] = useState(defaultTopic);
  const [activity, setActivity] = useState(activityDefault);
  const [codes, setCodes] = useState<string[]>(
    defaultJurisdictions.length >= 2 ? defaultJurisdictions.slice(0, 4) : ["US", "CA"],
  );
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function setCode(index: number, value: string) {
    setCodes((prev) => prev.map((c, i) => (i === index ? value : c)));
  }

  function run() {
    setError(null);
    setMessage(null);
    execute(async () => {
      const response = await runComparison({ topic, jurisdictionCodes: codes, activity });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setResult(response.result);
    });
  }

  return (
    <div className="space-y-5">
      {/* --------------------------------------------------- Controls */}
      <Card className="print-hidden">
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <Field label="Regulatory topic">
              <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
                {COMPLIANCE_TOPICS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Business or activity" hint="What you would be doing there. Shown on the comparison.">
              <Input
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="Selling imported goods online to consumers"
              />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-ink-soft">Jurisdictions to compare</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {codes.map((code, index) => (
                <div key={index} className="relative">
                  <Select value={code} onChange={(e) => setCode(index, e.target.value)}>
                    {JURISDICTIONS.map((j) => (
                      <option key={j.code} value={j.code}>
                        {j.name}
                      </option>
                    ))}
                  </Select>
                  {codes.length > 2 ? (
                    <button
                      type="button"
                      aria-label="Remove jurisdiction"
                      onClick={() => setCodes((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute -right-1 -top-1 rounded-full border border-line bg-surface p-0.5 text-ink-muted hover:text-danger"
                    >
                      <X className="size-3" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {codes.length < 4 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setCodes((prev) => [...prev, "MX"])}
              >
                Add another jurisdiction
              </Button>
            ) : null}
          </div>

          {error ? <p className="text-xs text-danger">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <Button type="button" onClick={run} disabled={pending}>
              <SplitSquareHorizontal className="size-4" />
              {pending ? "Comparing…" : "Compare"}
            </Button>
            {result ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    execute(async () => {
                      const saved = await saveComparison({
                        title: `${result.topicLabel}: ${result.cells.map((c) => c.jurisdictionName).join(" vs ")}`,
                        topic: result.topic,
                        activity: result.activity,
                        jurisdictionCodes: result.cells.map((c) => c.jurisdictionCode),
                        result,
                      });
                      setMessage(saved.ok ? "Comparison saved." : saved.error);
                      router.refresh();
                    })
                  }
                >
                  <Save className="size-4" />
                  Save comparison
                </Button>
                <Button type="button" variant="secondary" onClick={() => window.print()}>
                  <Printer className="size-4" />
                  Print or export
                </Button>
                <Link
                  href={`/analyst?policy=${result.cells.flatMap((c) => c.policies)[0]?.id ?? ""}`}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3.5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
                >
                  <Sparkles className="size-4" />
                  Ask AI to explain the differences
                </Link>
              </>
            ) : null}
            {message ? <span className="text-xs text-ink-muted">{message}</span> : null}
          </div>
        </CardContent>
      </Card>

      {/* --------------------------------------------------- Result */}
      {result ? (
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              {result.topicLabel} — {result.cells.map((c) => c.jurisdictionName).join(" vs ")}
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              {result.activity ? `${result.activity} · ` : ""}Generated {formatDate(result.generatedAt)} from
              the RegLens sample dataset.
            </p>
          </div>

          {result.noCoverage.length > 0 ? (
            <p className="rounded-lg border border-warning/25 bg-warning-soft px-3 py-2 text-xs leading-5 text-warning">
              The dataset has no record for this topic in{" "}
              {result.cells
                .filter((c) => result.noCoverage.includes(c.jurisdictionCode))
                .map((c) => c.jurisdictionName)
                .join(", ")}
              . That is a gap in the MVP dataset, not evidence that no rules apply there.
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-muted text-left text-xs text-ink-muted">
                  <th className="px-4 py-2.5 font-medium">Jurisdiction</th>
                  <th className="px-4 py-2.5 font-medium">Relevant policy</th>
                  <th className="px-4 py-2.5 font-medium">Responsible agency</th>
                  <th className="px-4 py-2.5 font-medium">Requirements</th>
                  <th className="px-4 py-2.5 font-medium">Deadlines</th>
                  <th className="px-4 py-2.5 font-medium">Main differences</th>
                  <th className="px-4 py-2.5 font-medium">Possible impact</th>
                  <th className="px-4 py-2.5 font-medium">Recommended preparation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line align-top">
                {result.cells.map((cell) => (
                  <tr key={cell.jurisdictionCode} className="print-break">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{cell.jurisdictionName}</p>
                      <p className="mt-0.5 text-xs text-ink-muted tabular">
                        {cell.policies.length} {cell.policies.length === 1 ? "record" : "records"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {cell.policies.length === 0 ? (
                        <span className="text-xs text-ink-muted">No record</span>
                      ) : (
                        <ul className="space-y-1.5">
                          {cell.policies.map((policy) => (
                            <li key={policy.id}>
                              <Link
                                href={`/policies/${policy.id}`}
                                className="text-xs font-medium text-brand hover:underline"
                              >
                                {policy.title}
                              </Link>
                              {policy.sourceUrl ? (
                                <a
                                  href={policy.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-1 inline-flex text-ink-muted hover:text-ink"
                                  aria-label={`Open ${policy.sourceName}`}
                                >
                                  <ExternalLink className="size-3" />
                                </a>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-soft">
                      {cell.agencies.length === 0 ? "—" : cell.agencies.join("; ")}
                    </td>
                    <td className="px-4 py-3">
                      {cell.requirementCount === 0 ? (
                        <span className="text-xs text-ink-muted">—</span>
                      ) : (
                        <ul className="space-y-1">
                          {cell.policies
                            .flatMap((p) => p.requirements)
                            .slice(0, 4)
                            .map((requirement) => (
                              <li key={requirement.title} className="text-xs text-ink-soft">
                                • {requirement.title}
                              </li>
                            ))}
                          {cell.requirementCount > 4 ? (
                            <li className="text-xs text-ink-muted tabular">
                              + {cell.requirementCount - 4} more
                            </li>
                          ) : null}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {cell.policies.flatMap((p) => p.deadlines).length === 0 ? (
                        <span className="text-xs text-ink-muted">—</span>
                      ) : (
                        <ul className="space-y-1">
                          {cell.policies
                            .flatMap((p) => p.deadlines)
                            .slice(0, 3)
                            .map((deadline) => (
                              <li key={`${deadline.label}-${deadline.date}`} className="text-xs text-ink-soft">
                                {deadline.label}
                                <span className="block text-ink-muted tabular">{deadline.date}</span>
                              </li>
                            ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {cell.differences.map((difference) => (
                          <li key={difference} className="text-xs text-ink-soft">
                            • {difference}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-soft">{cell.businessImpact}</td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {cell.preparation.map((step) => (
                          <li key={step} className="text-xs text-ink-soft">
                            • {step}
                          </li>
                        ))}
                      </ul>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="print-hidden mt-2"
                        disabled={pending}
                        onClick={() =>
                          execute(async () => {
                            const plan = await createPlanFromComparison({
                              title: `Prepare for ${cell.jurisdictionName}: ${result.topicLabel}`,
                              result,
                              jurisdictionCode: cell.jurisdictionCode,
                            });
                            if (!plan.ok) {
                              setMessage(plan.error);
                              return;
                            }
                            router.push(`/planner?plan=${plan.planId}`);
                          })
                        }
                      >
                        <ListPlus className="size-3.5" />
                        Create action plan
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<SplitSquareHorizontal className="size-6" />}
          title="Choose a topic and two or more jurisdictions"
          description="RegLens will lay out the requirements, agencies, deadlines and what differs — including the national rules that sit above each state or province."
          className="print-hidden"
        />
      )}

      {/* --------------------------------------------------- Saved */}
      {savedComparisons.length > 0 ? (
        <section className="print-hidden space-y-3">
          <h2 className="text-sm font-semibold text-ink">Saved comparisons</h2>
          <ul className="space-y-2">
            {savedComparisons.map((saved) => (
              <li key={saved.id}>
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{saved.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        Saved {formatDate(saved.createdAt)}
                        {saved.activity ? ` · ${saved.activity}` : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {saved.jurisdictionCodes.map((code) => (
                          <Badge key={code} tone="neutral">
                            {JURISDICTIONS.find((j) => j.code === code)?.name ?? code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setResult(saved.result);
                          setTopic(saved.topic);
                          setActivity(saved.activity);
                          setCodes(saved.jurisdictionCodes);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Open
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          execute(async () => {
                            await deleteComparison(saved.id);
                            router.refresh();
                          })
                        }
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
