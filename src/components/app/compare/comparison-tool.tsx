"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
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
import { cn } from "@/lib/utils";

export type SavedComparisonRow = {
  id: string;
  title: string;
  topic: string;
  activity: string;
  jurisdictionCodes: string[];
  createdAt: string;
  result: ComparisonResult;
};

type Placement = { detail: string; policyTitle: string; policyId: string };

type MatrixRow = {
  key: string;
  title: string;
  /** Jurisdiction code → the record that imposes this requirement there. */
  byCode: Map<string, Placement>;
};

function normaliseTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Turns the per-jurisdiction result into a requirement-by-jurisdiction matrix.
 *
 * The old screen printed each jurisdiction's list next to the others and left
 * the reader to diff them by eye. Requirements that appear everywhere — which
 * in practice means the federal rules a state inherits — carry no decision, so
 * they collapse into one line, and what is left in the table is precisely the
 * set of things that change when you cross the border.
 */
function buildMatrix(result: ComparisonResult): { shared: MatrixRow[]; differing: MatrixRow[] } {
  const rows = new Map<string, MatrixRow>();

  for (const cell of result.cells) {
    for (const policy of cell.policies) {
      for (const requirement of policy.requirements) {
        const key = normaliseTitle(requirement.title);
        if (!key) continue;
        let row = rows.get(key);
        if (!row) {
          row = { key, title: requirement.title, byCode: new Map() };
          rows.set(key, row);
        }
        if (!row.byCode.has(cell.jurisdictionCode)) {
          row.byCode.set(cell.jurisdictionCode, {
            detail: requirement.detail,
            policyTitle: policy.title,
            policyId: policy.id,
          });
        }
      }
    }
  }

  const covered = result.cells.filter((cell) => cell.policies.length > 0);
  const shared: MatrixRow[] = [];
  const differing: MatrixRow[] = [];

  for (const row of rows.values()) {
    const everywhere =
      covered.length > 1 && covered.every((cell) => row.byCode.has(cell.jurisdictionCode));
    (everywhere ? shared : differing).push(row);
  }

  return { shared, differing };
}

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

  const matrix = result ? buildMatrix(result) : null;
  const gapNames = result
    ? result.cells
        .filter((cell) => result.noCoverage.includes(cell.jurisdictionCode))
        .map((cell) => cell.jurisdictionName)
    : [];

  return (
    <div>
      {/* ----------------------------------------------------------- Setup */}
      <div className="print-hidden">
        <div className="grid gap-4 sm:grid-cols-2">
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

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {codes.map((code, index) => (
            <div key={index}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-ink-soft">Jurisdiction {index + 1}</span>
                {codes.length > 2 ? (
                  <button
                    type="button"
                    aria-label={`Remove jurisdiction ${index + 1}`}
                    onClick={() => setCodes((prev) => prev.filter((_, i) => i !== index))}
                    className="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink"
                  >
                    <X aria-hidden className="size-3" />
                    Remove
                  </button>
                ) : null}
              </div>
              <Select
                className="mt-1.5"
                aria-label={`Jurisdiction ${index + 1}`}
                value={code}
                onChange={(e) => setCode(index, e.target.value)}
              >
                {JURISDICTIONS.map((j) => (
                  <option key={j.code} value={j.code}>
                    {j.name}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>

        {error ? <p className="mt-3 text-[13px] text-alert">{error}</p> : null}

        <div className="mt-5 flex flex-wrap items-center gap-1">
          <Button type="button" onClick={run} disabled={pending}>
            {pending ? "Comparing…" : "Compare"}
          </Button>
          {codes.length < 4 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCodes((prev) => [...prev, "MX"])}
            >
              Add another jurisdiction
            </Button>
          ) : null}
        </div>
      </div>

      {/* ---------------------------------------------------------- Result */}
      {result && matrix ? (
        <section className="rise mt-10 border-t border-line pt-7">
          <p className="text-xs text-ink-muted">
            {result.activity ? `${result.activity} · ` : ""}Compared {formatDate(result.generatedAt)}
          </p>
          <h2 className="mt-2 text-title font-semibold text-balance text-ink">
            {matrix.differing.length === 0
              ? `${result.topicLabel} is recorded the same way in every jurisdiction here`
              : `${matrix.differing.length} ${
                  matrix.differing.length === 1 ? "requirement differs" : "requirements differ"
                } between these jurisdictions`}
          </h2>

          {gapNames.length > 0 ? (
            <p className="mt-4 rounded-md bg-surface-muted px-3.5 py-3 text-[13px] leading-6 text-ink-soft">
              RegLens holds no record of {result.topicLabel.toLowerCase()} for{" "}
              {gapNames.join(" or ")}. Those columns are shaded below. It is a gap in this dataset,
              not evidence that nothing applies there — check with the responsible authority before
              you rely on it.
            </p>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line-strong">
                  <th scope="col" className="w-52 py-3 pr-5 align-bottom">
                    <span className="sr-only">What is being compared</span>
                  </th>
                  {result.cells.map((cell) => (
                    <th
                      key={cell.jurisdictionCode}
                      scope="col"
                      className="py-3 pr-5 align-bottom last:pr-0"
                    >
                      <span className="block text-[15px] font-semibold text-ink">
                        {cell.jurisdictionName}
                      </span>
                      <span className="tabular mt-0.5 block text-xs font-normal text-ink-muted">
                        {cell.policies.length === 0
                          ? "No records"
                          : `${cell.requirementCount} recorded`}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr className="print-break border-b border-line align-top">
                  <th scope="row" className="py-4 pr-5 text-[13px] font-normal text-ink-muted">
                    Records
                  </th>
                  {result.cells.map((cell) => (
                    <td
                      key={cell.jurisdictionCode}
                      className={cn(
                        "py-4 pr-5 align-top last:pr-0",
                        cell.policies.length === 0 && "bg-surface-muted",
                      )}
                    >
                      {cell.policies.length === 0 ? (
                        <span className="text-[13px] text-ink-muted">No record held</span>
                      ) : (
                        <ul>
                          {cell.policies.map((policy) => (
                            <li key={policy.id} className="text-[13px] leading-6">
                              <Link
                                href={`/policies/${policy.id}`}
                                className="text-ink underline decoration-line-strong underline-offset-4"
                              >
                                {policy.title}
                              </Link>
                              <span className="block text-ink-muted">{policy.agency}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  ))}
                </tr>

                <tr className="print-break border-b border-line align-top">
                  <th scope="row" className="py-4 pr-5 text-[13px] font-normal text-ink-muted">
                    Dates to keep
                  </th>
                  {result.cells.map((cell) => {
                    const deadlines = cell.policies.flatMap((p) => p.deadlines);
                    return (
                      <td
                        key={cell.jurisdictionCode}
                        className={cn(
                          "py-4 pr-5 align-top last:pr-0",
                          cell.policies.length === 0 && "bg-surface-muted",
                        )}
                      >
                        {deadlines.length === 0 ? (
                          <span className="text-[13px] text-ink-muted">
                            {cell.policies.length === 0 ? "No record held" : "None recorded"}
                          </span>
                        ) : (
                          <ul>
                            {deadlines.slice(0, 3).map((deadline) => (
                              <li
                                key={`${deadline.label}-${deadline.date}`}
                                className="text-[13px] leading-6 text-ink-soft"
                              >
                                {deadline.label}
                                <span className="tabular block text-ink-muted">{deadline.date}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {matrix.differing.length > 0 ? (
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={result.cells.length + 1}
                      className="pt-8 pb-2 text-xs font-medium text-ink-muted"
                    >
                      Where they differ
                    </th>
                  </tr>
                ) : null}

                {matrix.differing.map((row) => (
                  <tr key={row.key} className="print-break border-b border-line align-top">
                    <th
                      scope="row"
                      className="py-4 pr-5 text-[15px] font-medium leading-6 text-ink"
                    >
                      {row.title}
                    </th>
                    {result.cells.map((cell) => {
                      const placement = row.byCode.get(cell.jurisdictionCode);
                      const noCoverage = cell.policies.length === 0;
                      return (
                        <td
                          key={cell.jurisdictionCode}
                          className={cn(
                            "py-4 pr-5 align-top last:pr-0",
                            noCoverage && "bg-surface-muted",
                          )}
                        >
                          {placement ? (
                            <>
                              <span className="block text-[15px] leading-6 text-ink">Required</span>
                              <Link
                                href={`/policies/${placement.policyId}`}
                                className="mt-0.5 block text-[13px] leading-6 text-ink-muted underline decoration-line underline-offset-4 hover:text-ink"
                              >
                                {placement.policyTitle}
                              </Link>
                            </>
                          ) : (
                            <span className="text-[13px] text-ink-muted">
                              {noCoverage ? "No record held" : "Not in its records"}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {matrix.shared.length > 0 ? (
            <details className="mt-6">
              <summary className="cursor-pointer text-[13px] text-ink-soft marker:text-ink-muted hover:text-ink">
                {matrix.shared.length}{" "}
                {matrix.shared.length === 1 ? "requirement is" : "requirements are"} the same
                everywhere on record
              </summary>
              <ul className="mt-3">
                {matrix.shared.map((row) => {
                  const first = row.byCode.values().next().value;
                  return (
                    <li key={row.key} className="border-b border-line py-3 last:border-b-0">
                      <p className="text-[15px] leading-6 text-ink">{row.title}</p>
                      {first ? (
                        <p className="mt-0.5 text-[13px] text-ink-muted">{first.policyTitle}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </details>
          ) : null}

          {/* --------------------------------------- What to do about it */}
          <div className="mt-10 border-t border-line pt-6">
            <h3 className="text-xs font-medium text-ink-muted">What this means for you</h3>
            <div className="mt-4 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {result.cells.map((cell) => (
                <div key={cell.jurisdictionCode} className="print-break min-w-0">
                  <p className="text-[15px] font-semibold text-ink">{cell.jurisdictionName}</p>
                  <p className="mt-1.5 text-[15px] leading-7 text-ink-soft">{cell.businessImpact}</p>
                  {cell.preparation.length > 0 ? (
                    <ul className="mt-2">
                      {cell.preparation.map((step) => (
                        <li key={step} className="text-[13px] leading-6 text-ink-muted">
                          {step}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="print-hidden -ml-3 mt-2"
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
                    Create action plan
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="print-hidden mt-8 flex flex-wrap items-center gap-1 border-t border-line pt-4">
            <Button
              type="button"
              variant="ghost"
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
              Save comparison
            </Button>
            <Button type="button" variant="ghost" onClick={() => window.print()}>
              Print or export
            </Button>
            <Link
              href={`/analyst?policy=${result.cells.flatMap((c) => c.policies)[0]?.id ?? ""}`}
              className="ml-2 text-[13px] text-ink underline decoration-line-strong underline-offset-4"
            >
              Ask the analyst to explain the differences
            </Link>
            {message ? <span className="ml-2 text-[13px] text-ink-soft">{message}</span> : null}
          </div>
        </section>
      ) : (
        <p className="print-hidden mt-8 max-w-2xl border-t border-line pt-6 text-[15px] leading-7 text-ink-soft">
          Pick a topic and two or more jurisdictions. RegLens lines the requirements up against each
          other — including the national rules a state or province inherits — collapses the ones that
          are identical, and leaves you with what actually changes when you cross the border.
        </p>
      )}

      {/* ----------------------------------------------------------- Saved */}
      {savedComparisons.length > 0 ? (
        <section className="print-hidden mt-12 border-t border-line pt-6">
          <h2 className="text-xs font-medium text-ink-muted">Saved comparisons</h2>
          <ul className="mt-2">
            {savedComparisons.map((saved) => (
              <li
                key={saved.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-[15px] leading-6 text-ink">{saved.title}</p>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    Saved {formatDate(saved.createdAt)}
                    {saved.activity ? ` · ${saved.activity}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
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
                    aria-label={`Delete ${saved.title}`}
                    disabled={pending}
                    onClick={() =>
                      execute(async () => {
                        await deleteComparison(saved.id);
                        router.refresh();
                      })
                    }
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
