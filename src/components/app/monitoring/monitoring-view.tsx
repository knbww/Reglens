"use client";

import type { MonitorTargetType, PolicyImportance, UpdateType } from "@prisma/client";
import { Check, ListPlus, MoreHorizontal, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { Meter, Spine } from "@/components/ui/severity";
import { UpdateTypeBadge } from "@/components/ui/status";
import { severityFromImportance } from "@/lib/severity";
import { JURISDICTIONS } from "@/data/jurisdictions";
import {
  addMonitorTarget,
  createTaskFromUpdate,
  removeMonitor,
  runMonitoringCheck,
  setUpdateReviewState,
} from "@/lib/actions/policies";
import { formatDate, relativeTime } from "@/lib/format";
import type { RelevanceBand } from "@/lib/relevance";
import { COMPLIANCE_TOPICS, INDUSTRIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { useAction } from "@/lib/use-action";

export type MonitorRow = {
  id: string;
  targetType: MonitorTargetType;
  label: string;
  policyId: string | null;
  targetKey: string | null;
  lastChecked: string;
  latestChangeTitle: string | null;
  latestChangeAt: string | null;
  importance: PolicyImportance | null;
  relevanceBand: RelevanceBand | null;
  relevanceScore: number | null;
};

export type UpdateRow = {
  id: string;
  type: UpdateType;
  title: string;
  description: string;
  importance: PolicyImportance;
  detectedAt: string;
  reviewState: "UNREVIEWED" | "REVIEWED" | "DISMISSED";
  policyId: string;
  policyTitle: string;
  policyAgency: string;
  jurisdiction: string;
  relevanceBand: RelevanceBand;
  relevanceScore: number;
};

const TARGET_LABEL: Record<MonitorTargetType, string> = {
  POLICY: "Policy",
  JURISDICTION: "Jurisdiction",
  INDUSTRY: "Industry",
  TOPIC: "Topic",
};

type FeedFilter = "unreviewed" | "all" | "reviewed" | "dismissed";

export function MonitoringView({
  monitors,
  updates,
  highlightUpdateId,
}: {
  monitors: MonitorRow[];
  updates: UpdateRow[];
  highlightUpdateId: string | null;
}) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [filter, setFilter] = useState<FeedFilter>("unreviewed");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newTarget, setNewTarget] = useState<{ type: Exclude<MonitorTargetType, "POLICY">; key: string }>({
    type: "TOPIC",
    key: COMPLIANCE_TOPICS[0].key,
  });
  /** Which row's overflow menu is open — only ever one at a time. */
  const [menuFor, setMenuFor] = useState<string | null>(null);

  useEffect(() => {
    if (!menuFor) return;
    const close = () => setMenuFor(null);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuFor(null);
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuFor]);

  function mutate(fn: () => Promise<unknown>) {
    run(async () => {
      await fn();
      router.refresh();
    });
  }

  const counts = {
    unreviewed: updates.filter((u) => u.reviewState === "UNREVIEWED").length,
    reviewed: updates.filter((u) => u.reviewState === "REVIEWED").length,
    dismissed: updates.filter((u) => u.reviewState === "DISMISSED").length,
    all: updates.length,
  };

  const visible = updates.filter((u) => {
    if (filter === "all") return true;
    if (filter === "unreviewed") return u.reviewState === "UNREVIEWED";
    if (filter === "reviewed") return u.reviewState === "REVIEWED";
    return u.reviewState === "DISMISSED";
  });

  const targetOptions =
    newTarget.type === "TOPIC"
      ? COMPLIANCE_TOPICS.map((t) => ({ value: t.key, label: t.label }))
      : newTarget.type === "INDUSTRY"
        ? INDUSTRIES.map((i) => ({ value: i.key, label: i.label }))
        : JURISDICTIONS.map((j) => ({ value: j.code, label: j.name }));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ------------------------------------------------- Change feed */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface p-3">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["unreviewed", "Needs review"],
                ["all", "All changes"],
                ["reviewed", "Reviewed"],
                ["dismissed", "Dismissed"],
              ] as [FeedFilter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  filter === key
                    ? "border-brand bg-brand-soft font-medium text-brand"
                    : "border-line text-ink-soft hover:border-brand-ring",
                )}
              >
                {label}
                <span className="ml-1.5 tabular opacity-70">{counts[key]}</span>
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="ml-auto"
            disabled={pending}
            onClick={() =>
              mutate(async () => {
                const result = await runMonitoringCheck();
                setMessage(
                  `Checked ${result.checked} monitored item${result.checked === 1 ? "" : "s"} against the seeded change records.`,
                );
              })
            }
          >
            <RefreshCw className={cn("size-3.5", pending && "animate-spin")} />
            Run a check now
          </Button>
        </div>

        {message ? (
          <p className="rounded-lg border border-line bg-surface-muted px-3 py-2 text-xs text-ink-soft">
            {message}
          </p>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState
            title={
              updates.length === 0
                ? "No changes detected yet"
                : filter === "unreviewed"
                  ? "Everything has been reviewed"
                  : "Nothing in this view"
            }
            description={
              updates.length === 0
                ? "Add something to monitoring and detected changes will appear here."
                : undefined
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {visible.map((update, index) => (
              <li key={update.id} style={{ ["--rise-i" as string]: index }} className="slide-in">
                <Card
                  id={`update-${update.id}`}
                  className={cn(
                    "lift",
                    update.id === highlightUpdateId && "border-brand ring-1 ring-brand-ring",
                  )}
                >
                  {/*
                    Row grammar: severity is the spine, relevance is the meter,
                    and the single remaining chip says what kind of change it is.
                    Three competing pills become one word and two silent signals.
                  */}
                  <Spine
                    severity={severityFromImportance(update.importance)}
                    label={`${update.importance.toLowerCase()} importance`}
                    className="space-y-3 p-5 pl-6"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <UpdateTypeBadge type={update.type} />
                      <Meter
                        value={update.relevanceScore}
                        label={`Relevance to this business: ${update.relevanceScore} of 100`}
                      />
                      {update.reviewState === "REVIEWED" ? <Badge tone="success">Reviewed</Badge> : null}
                      {update.reviewState === "DISMISSED" ? <Badge tone="neutral">Dismissed</Badge> : null}
                      <span className="ml-auto text-xs text-ink-muted">
                        {relativeTime(update.detectedAt)}
                      </span>
                    </div>

                    <div>
                      <p className="text-[15px] font-semibold tracking-[-0.006em] text-ink">
                        {update.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-ink-soft">{update.description}</p>
                    </div>

                    <p className="text-xs text-ink-muted">
                      <Link
                        href={`/policies/${update.policyId}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {update.policyTitle}
                      </Link>{" "}
                      · {update.jurisdiction} · {update.policyAgency}
                    </p>

                    {/* One primary — the action that moves the risk score. */}
                    <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                      {update.reviewState !== "REVIEWED" ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={pending}
                          onClick={() => mutate(() => setUpdateReviewState(update.id, "REVIEWED"))}
                        >
                          <Check className="size-3.5" />
                          Mark reviewed
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          run(async () => {
                            const result = await createTaskFromUpdate(update.id);
                            if (!result.ok) {
                              setMessage(result.error);
                              return;
                            }
                            router.push(`/planner?task=${result.taskId}`);
                          })
                        }
                      >
                        <ListPlus className="size-3.5" />
                        Create task
                      </Button>
                      <Link
                        href={`/analyst?policy=${update.policyId}`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        <Sparkles className="size-3.5" />
                        Ask the Analyst
                      </Link>

                      {/* Contained so the document-level close handler does not
                          swallow the very click that opens the menu. */}
                      <div className="relative ml-auto" onClick={(event) => event.stopPropagation()}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-haspopup="true"
                          aria-expanded={menuFor === update.id}
                          aria-label="More actions"
                          onClick={() => setMenuFor((id) => (id === update.id ? null : update.id))}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                        {menuFor === update.id ? (
                          <div className="nav-rail-out absolute right-0 top-full z-30 mt-1 w-52 rounded-lg border border-line bg-surface py-1 shadow-lg">
                            <Link
                              href={`/policies/${update.policyId}`}
                              onClick={() => setMenuFor(null)}
                              className="block px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
                            >
                              Open the update
                            </Link>
                            {update.reviewState !== "DISMISSED" ? (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => {
                                  setMenuFor(null);
                                  mutate(() => setUpdateReviewState(update.id, "DISMISSED"));
                                }}
                                className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-60"
                              >
                                Dismiss
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => {
                                  setMenuFor(null);
                                  mutate(() => setUpdateReviewState(update.id, "UNREVIEWED"));
                                }}
                                className="block w-full px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-60"
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Spine>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ------------------------------------------------- Monitored items */}
      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>What you are monitoring</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding((v) => !v)}>
              <Plus className="size-3.5" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {adding ? (
              <div className="space-y-2.5 rounded-lg border border-line bg-surface-muted p-3">
                <Field label="Watch a">
                  <Select
                    value={newTarget.type}
                    onChange={(e) => {
                      const type = e.target.value as Exclude<MonitorTargetType, "POLICY">;
                      setNewTarget({
                        type,
                        key:
                          type === "TOPIC"
                            ? COMPLIANCE_TOPICS[0].key
                            : type === "INDUSTRY"
                              ? INDUSTRIES[0].key
                              : JURISDICTIONS[0].code,
                      });
                    }}
                  >
                    <option value="TOPIC">Regulatory topic</option>
                    <option value="INDUSTRY">Industry</option>
                    <option value="JURISDICTION">Jurisdiction</option>
                  </Select>
                </Field>
                <Field label="Which one">
                  <Select
                    value={newTarget.key}
                    onChange={(e) => setNewTarget((t) => ({ ...t, key: e.target.value }))}
                  >
                    {targetOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      mutate(async () => {
                        const label =
                          targetOptions.find((o) => o.value === newTarget.key)?.label ?? newTarget.key;
                        await addMonitorTarget(newTarget.type, newTarget.key, label);
                        setAdding(false);
                        setMessage(`Now monitoring ${label}.`);
                      })
                    }
                  >
                    Start monitoring
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            {monitors.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Nothing monitored yet. Open a policy and choose “Add to monitoring”, or add a topic,
                industry or jurisdiction here.
              </p>
            ) : (
              <ul className="space-y-2">
                {monitors.map((monitor, index) => (
                  <li
                    key={monitor.id}
                    style={{ ["--rise-i" as string]: index }}
                    className="slide-in group rounded-lg border border-line"
                  >
                    {/* Same grammar as the feed: severity on the edge, relevance
                        as a meter, and the label grid that repeated three rows
                        per item collapsed to one line of dated text. */}
                    <Spine
                      severity={monitor.importance ? severityFromImportance(monitor.importance) : "clear"}
                      label={
                        monitor.importance ? `${monitor.importance.toLowerCase()} importance` : "monitored"
                      }
                      className="p-3 pl-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Badge tone="neutral">{TARGET_LABEL[monitor.targetType]}</Badge>
                          {monitor.policyId ? (
                            <Link
                              href={`/policies/${monitor.policyId}`}
                              className="mt-1.5 block text-xs font-medium text-brand hover:underline"
                            >
                              {monitor.label}
                            </Link>
                          ) : (
                            <p className="mt-1.5 text-xs font-medium text-ink">{monitor.label}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={`Stop monitoring ${monitor.label}`}
                          disabled={pending}
                          onClick={() => mutate(() => removeMonitor(monitor.id))}
                          className="rounded p-1 text-ink-muted opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <p className="tabular mt-1.5 text-[11px] text-ink-muted">
                        checked {formatDate(monitor.lastChecked)}
                        {monitor.latestChangeAt
                          ? ` · changed ${formatDate(monitor.latestChangeAt)}`
                          : " · no change detected"}
                      </p>

                      {monitor.latestChangeTitle ? (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-ink-soft">
                          {monitor.latestChangeTitle}
                        </p>
                      ) : null}

                      {monitor.relevanceScore !== null ? (
                        <Meter
                          value={monitor.relevanceScore}
                          label={`Relevance ${monitor.relevanceScore} of 100`}
                          className="mt-1.5"
                        />
                      ) : null}
                    </Spine>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
