"use client";

import type { MonitorTargetType, PolicyImportance, UpdateType } from "@prisma/client";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { UPDATE_TYPE_LABEL } from "@/components/ui/status";
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

const FILTERS: [FeedFilter, string][] = [
  ["unreviewed", "Needs review"],
  ["all", "All changes"],
  ["reviewed", "Reviewed"],
  ["dismissed", "Dismissed"],
];

/**
 * The change feed, and beneath it what is being watched.
 *
 * The two used to be columns speaking the same language — the same spines, the
 * same relevance meters, the same change titles — which made the page read as
 * one list printed twice. The feed is the work, so it keeps the row grammar and
 * the actions; the watch list becomes a plain register of names, last and
 * quieter, saying only what the feed cannot.
 */
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
  const [disposed, setDisposed] = useState<Set<string>>(new Set());
  const [leaving, setLeaving] = useState<string | null>(null);
  const [newTarget, setNewTarget] = useState<{ type: Exclude<MonitorTargetType, "POLICY">; key: string }>({
    type: "TOPIC",
    key: COMPLIANCE_TOPICS[0].key,
  });

  // Fresh server data supersedes anything the feed was hiding locally. Adjusted
  // during render rather than in an effect, so the list never paints one frame
  // of stale hiding before correcting itself.
  const [seenUpdates, setSeenUpdates] = useState(updates);
  if (seenUpdates !== updates) {
    setSeenUpdates(updates);
    setDisposed(new Set());
    setLeaving(null);
  }

  function mutate(fn: () => Promise<unknown>) {
    run(async () => {
      await fn();
      router.refresh();
    });
  }

  /**
   * Acting on a change removes it from the filter it was read under. In "All
   * changes" nothing leaves, so the row simply updates in place instead.
   */
  function act(id: string, work: () => Promise<unknown>) {
    if (filter === "all") {
      mutate(work);
      return;
    }
    setLeaving(id);
    run(async () => {
      await work();
      await new Promise((resolve) => setTimeout(resolve, 170));
      setDisposed((previous) => new Set(previous).add(id));
      setLeaving(null);
      router.refresh();
    });
  }

  const present = updates.filter((u) => !disposed.has(u.id));

  const counts = {
    unreviewed: present.filter((u) => u.reviewState === "UNREVIEWED").length,
    reviewed: present.filter((u) => u.reviewState === "REVIEWED").length,
    dismissed: present.filter((u) => u.reviewState === "DISMISSED").length,
    all: present.length,
  };

  const visible = present.filter((u) => {
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
    <div className="rise">
      {/* ------------------------------------------------- Change feed */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-line pb-3">
        <div className="-ml-2.5 flex flex-wrap items-center">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[13px] transition-colors",
                filter === key
                  ? "bg-surface-muted font-medium text-ink"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {label} <span className="tabular text-ink-muted">{counts[key]}</span>
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
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
          Run a check now
        </Button>
      </div>

      {message ? (
        <p role="status" className="pt-3 text-[13px] text-ink-soft">
          {message}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="py-14">
          <p className="text-title font-semibold text-ink">
            {updates.length === 0
              ? "Nothing has changed yet"
              : filter === "unreviewed"
                ? "You’re clear."
                : "Nothing in this view"}
          </p>
          <p className="mt-3 max-w-md text-[15px] leading-7 text-ink-soft">
            {updates.length === 0
              ? "Add a policy, topic, industry or jurisdiction to monitoring and detected changes will appear here."
              : filter === "unreviewed"
                ? "Every detected change has been read. New ones will arrive at the top of this list."
                : "Try another filter to see the rest of the feed."}
          </p>
        </div>
      ) : (
        <ul>
          {visible.map((update) => {
            const critical = update.importance === "CRITICAL" && update.reviewState === "UNREVIEWED";
            const eyebrow = [
              UPDATE_TYPE_LABEL[update.type],
              update.jurisdiction,
              relativeTime(update.detectedAt),
              update.reviewState === "REVIEWED"
                ? "reviewed"
                : update.reviewState === "DISMISSED"
                  ? "dismissed"
                  : null,
            ].filter(Boolean);

            return (
              <li
                key={update.id}
                id={`update-${update.id}`}
                className={cn(
                  "border-b border-line last:border-b-0",
                  leaving === update.id && "dispose",
                )}
              >
                <div
                  className={cn(
                    "py-6",
                    update.id === highlightUpdateId && "-mx-3 rounded-md bg-surface-muted px-3",
                  )}
                >
                  <p className="text-xs text-ink-muted">
                    {critical ? (
                      <>
                        <span className="font-medium text-alert">Critical</span>
                        {" · "}
                      </>
                    ) : null}
                    {eyebrow.join(" · ")}
                  </p>

                  <h3 className="mt-2 text-title font-semibold text-balance text-ink">
                    {update.title}
                  </h3>

                  <p className="mt-2 max-w-2xl text-[15px] leading-7 text-ink-soft">
                    {update.description}
                  </p>

                  <p className="mt-2 text-[13px] text-ink-muted">
                    <Link
                      href={`/policies/${update.policyId}`}
                      className="text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink"
                    >
                      {update.policyTitle}
                    </Link>
                    {` · ${update.policyAgency}`}
                    {update.relevanceBand === "high" ? " · closely matches your profile" : ""}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2">
                    {update.reviewState !== "REVIEWED" ? (
                      <Button
                        type="button"
                        disabled={pending}
                        onClick={() => act(update.id, () => setUpdateReviewState(update.id, "REVIEWED"))}
                      >
                        Mark reviewed
                      </Button>
                    ) : null}

                    <Button
                      type="button"
                      variant="ghost"
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
                      Turn into a task
                    </Button>

                    <Link
                      href={`/analyst?policy=${update.policyId}`}
                      className={buttonVariants({ variant: "ghost" })}
                    >
                      Ask the Analyst
                    </Link>

                    {update.reviewState === "DISMISSED" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          act(update.id, () => setUpdateReviewState(update.id, "UNREVIEWED"))
                        }
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          act(update.id, () => setUpdateReviewState(update.id, "DISMISSED"))
                        }
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ------------------------------------------------- What is watched */}
      <section className="mt-14 border-t border-line pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xs font-medium text-ink-muted">What you are monitoring</h2>
          {adding ? null : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
              Add something to watch
            </Button>
          )}
        </div>

        {adding ? (
          <div className="mt-3 max-w-md space-y-4">
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
            <div className="flex items-center gap-1">
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
          <p className="mt-3 max-w-md text-[13px] leading-6 text-ink-muted">
            Nothing is being watched yet. Open a policy and choose “Add to monitoring”, or add a
            topic, industry or jurisdiction here.
          </p>
        ) : (
          <ul className="mt-2">
            {monitors.map((monitor) => (
              <li key={monitor.id} className="flex items-baseline gap-3 py-2">
                <span className="min-w-0 flex-1 text-[13px] text-ink-soft">
                  {monitor.policyId ? (
                    <Link
                      href={`/policies/${monitor.policyId}`}
                      className="underline decoration-line-strong underline-offset-4 hover:text-ink"
                    >
                      {monitor.label}
                    </Link>
                  ) : (
                    monitor.label
                  )}
                </span>
                <span className="tabular shrink-0 text-xs text-ink-muted">
                  {TARGET_LABEL[monitor.targetType]} · checked {formatDate(monitor.lastChecked)}
                </span>
                <button
                  type="button"
                  aria-label={`Stop monitoring ${monitor.label}`}
                  disabled={pending}
                  onClick={() => mutate(() => removeMonitor(monitor.id))}
                  className="shrink-0 rounded p-1 text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
