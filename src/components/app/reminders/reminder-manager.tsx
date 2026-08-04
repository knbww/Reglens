"use client";

import type { ReminderKind } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  createReminder,
  deleteReminder,
  dismissReminder,
  restoreReminder,
  snoozeReminder,
} from "@/lib/actions/reminders";
import { daysUntil, formatDate, isFuture } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAction } from "@/lib/use-action";

export type ReminderRow = {
  id: string;
  title: string;
  notes: string;
  kind: ReminderKind;
  dueDate: string;
  advanceDays: number;
  snoozedUntil: string | null;
  dismissed: boolean;
  policyId: string | null;
  policyTitle: string | null;
};

const KINDS: { value: ReminderKind; label: string }[] = [
  { value: "COMPLIANCE_DEADLINE", label: "Compliance deadline" },
  { value: "PERMIT_RENEWAL", label: "Permit renewal" },
  { value: "CERTIFICATION_RENEWAL", label: "Certification renewal" },
  { value: "FILING_DEADLINE", label: "Filing deadline" },
  { value: "POLICY_REVIEW", label: "Scheduled policy review" },
  { value: "CUSTOM", label: "Custom date" },
];

type View = "active" | "overdue" | "snoozed" | "dismissed";

const VIEWS: [View, string][] = [
  ["active", "Upcoming"],
  ["overdue", "Overdue"],
  ["snoozed", "Snoozed"],
  ["dismissed", "Dismissed"],
];

const EMPTY: Record<View, { title: string; body: string }> = {
  active: {
    title: "Nothing is coming up",
    body: "Add your next filing, renewal or review date and RegLens will raise it in advance, inside the product.",
  },
  overdue: {
    title: "Nothing has been missed",
    body: "Every date on your calendar is still ahead of you.",
  },
  snoozed: {
    title: "Nothing snoozed",
    body: "Dates you push back for a week will wait here until they come round again.",
  },
  dismissed: {
    title: "Nothing dismissed",
    body: "Dates you close are kept here and can be restored.",
  },
};

function dueFigure(days: number | null): string {
  if (days === null) return "no date";
  if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} late`;
  if (days === 0) return "today";
  return `${days} ${days === 1 ? "day" : "days"} left`;
}

/**
 * The calendar of obligations.
 *
 * Rows are grouped by the month they fall in, so a year of filing dates reads
 * as a calendar rather than as a stack of cards, and each row carries the
 * actions that dispose of it — snooze, dismiss, restore — so nothing here
 * needs a trip to another screen.
 */
export function ReminderManager({
  reminders,
  policies,
}: {
  reminders: ReminderRow[];
  policies: { id: string; title: string }[];
}) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [view, setView] = useState<View>("active");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disposed, setDisposed] = useState<Set<string>>(new Set());
  const [leaving, setLeaving] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    title: "",
    notes: "",
    kind: "COMPLIANCE_DEADLINE" as ReminderKind,
    dueDate: "",
    advanceDays: "14",
    policyId: "",
  });

  // Fresh server data supersedes anything the queue was hiding locally. Adjusted
  // during render rather than in an effect, so the list never paints one frame
  // of stale hiding before correcting itself.
  const [seenReminders, setSeenReminders] = useState(reminders);
  if (seenReminders !== reminders) {
    setSeenReminders(reminders);
    setDisposed(new Set());
    setLeaving(null);
  }

  const groups = useMemo(() => {
    const rows = reminders.filter((r) => !disposed.has(r.id));
    const isSnoozed = (r: ReminderRow) => isFuture(r.snoozedUntil);
    return {
      active: rows.filter((r) => !r.dismissed && !isSnoozed(r) && (daysUntil(r.dueDate) ?? 0) >= 0),
      overdue: rows.filter((r) => !r.dismissed && !isSnoozed(r) && (daysUntil(r.dueDate) ?? 0) < 0),
      snoozed: rows.filter((r) => !r.dismissed && isSnoozed(r)),
      dismissed: rows.filter((r) => r.dismissed),
    };
  }, [reminders, disposed]);

  const visible = groups[view];

  /** Month headings turn a flat list of dates back into a calendar. */
  const months = useMemo(() => {
    const out: { key: string; label: string; items: ReminderRow[] }[] = [];
    for (const reminder of visible) {
      const date = new Date(reminder.dueDate);
      const key = format(date, "yyyy-MM");
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(reminder);
      else out.push({ key, label: format(date, "MMMM yyyy"), items: [reminder] });
    }
    return out;
  }, [visible]);

  /** Acting on a row removes it from the view it was in, in place. */
  function dispose(id: string, work: () => Promise<unknown>) {
    setLeaving(id);
    run(async () => {
      await work();
      await new Promise((resolve) => setTimeout(resolve, 170));
      setDisposed((previous) => new Set(previous).add(id));
      setLeaving(null);
      router.refresh();
    });
  }

  function submit() {
    if (draft.title.trim().length < 3) {
      setError("Give the reminder a title.");
      return;
    }
    if (!draft.dueDate) {
      setError("Pick a date.");
      return;
    }
    setError(null);
    run(async () => {
      const result = await createReminder({
        title: draft.title,
        notes: draft.notes,
        kind: draft.kind,
        dueDate: draft.dueDate,
        advanceDays: draft.advanceDays,
        policyId: draft.policyId || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft({
        title: "",
        notes: "",
        kind: "COMPLIANCE_DEADLINE",
        dueDate: "",
        advanceDays: "14",
        policyId: "",
      });
      setCreating(false);
      setView("active");
      router.refresh();
    });
  }

  return (
    <div className="rise">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-line pb-3">
        <div className="-ml-2.5 flex flex-wrap items-center">
          {VIEWS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[13px] transition-colors",
                view === key ? "bg-surface-muted font-medium text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {label} <span className="tabular text-ink-muted">{groups[key].length}</span>
            </button>
          ))}
        </div>

        {creating ? null : (
          <Button type="button" size="sm" className="ml-auto" onClick={() => setCreating(true)}>
            New reminder
          </Button>
        )}
      </div>

      {creating ? (
        <div className="border-b border-line py-6">
          <h2 className="text-title font-semibold text-ink">New reminder</h2>

          <div className="mt-4 max-w-2xl space-y-4">
            <Field label="What is the reminder for?">
              <Input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Annual customs bond review"
                autoFocus
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <Select
                  value={draft.kind}
                  onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as ReminderKind }))}
                >
                  {KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
                />
              </Field>
              <Field label="Advance notice" hint="Days before the date.">
                <Input
                  type="number"
                  min={0}
                  max={365}
                  value={draft.advanceDays}
                  onChange={(e) => setDraft((d) => ({ ...d, advanceDays: e.target.value }))}
                />
              </Field>
              <Field label="Link a policy" hint="Optional.">
                <Select
                  value={draft.policyId}
                  onChange={(e) => setDraft((d) => ({ ...d, policyId: e.target.value }))}
                >
                  <option value="">None</option>
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Notes" hint="Optional.">
              <Textarea
                rows={2}
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              />
            </Field>

            {error ? <p className="text-[13px] text-danger">{error}</p> : null}

            <div className="flex items-center gap-1">
              <Button type="button" onClick={submit} disabled={pending}>
                {pending ? "Creating…" : "Create reminder"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreating(false)}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="py-14">
          <p className="text-title font-semibold text-ink">{EMPTY[view].title}</p>
          <p className="mt-3 max-w-md text-[15px] leading-7 text-ink-soft">{EMPTY[view].body}</p>
        </div>
      ) : (
        months.map((month) => (
          <section key={month.key} className="pt-8 first:pt-6">
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
              <h2 className="text-[15px] font-medium text-ink">{month.label}</h2>
              <p className="tabular text-xs text-ink-muted">
                {month.items.length} {month.items.length === 1 ? "date" : "dates"}
              </p>
            </div>

            <ul>
              {month.items.map((reminder) => {
                const days = daysUntil(reminder.dueDate);
                const late = days !== null && days < 0 && !reminder.dismissed;
                const meta = [
                  KINDS.find((k) => k.value === reminder.kind)?.label ?? reminder.kind,
                  `notifies ${reminder.advanceDays} days ahead`,
                  isFuture(reminder.snoozedUntil)
                    ? `snoozed until ${formatDate(reminder.snoozedUntil)}`
                    : null,
                  reminder.dismissed ? "dismissed" : null,
                ].filter(Boolean);

                return (
                  <li
                    key={reminder.id}
                    className={cn(
                      "border-b border-line py-5 last:border-b-0",
                      leaving === reminder.id && "dispose",
                    )}
                  >
                    <div className="flex gap-4 sm:gap-6">
                      <p className="tabular w-12 shrink-0 text-[13px] text-ink-muted">
                        {format(new Date(reminder.dueDate), "EEE d")}
                      </p>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <h3
                            className={cn(
                              "min-w-0 text-[15px] font-medium",
                              reminder.dismissed ? "text-ink-muted" : "text-ink",
                            )}
                          >
                            {reminder.title}
                          </h3>
                          <span
                            className={cn(
                              "tabular shrink-0 text-[13px]",
                              late ? "font-medium text-alert" : "text-ink-muted",
                            )}
                          >
                            {dueFigure(days)}
                          </span>
                        </div>

                        <p className="mt-1 text-[13px] text-ink-muted">{meta.join(" · ")}</p>

                        {reminder.notes ? (
                          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-ink-soft">
                            {reminder.notes}
                          </p>
                        ) : null}

                        {reminder.policyId ? (
                          <p className="mt-2">
                            <Link
                              href={`/policies/${reminder.policyId}`}
                              className="text-[13px] text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink"
                            >
                              {reminder.policyTitle ?? "Linked policy"}
                            </Link>
                          </p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-2">
                          {reminder.dismissed ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={pending}
                              onClick={() => dispose(reminder.id, () => restoreReminder(reminder.id))}
                            >
                              Restore
                            </Button>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={pending}
                                onClick={() =>
                                  dispose(reminder.id, () => snoozeReminder(reminder.id, 7))
                                }
                              >
                                Snooze 7 days
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={pending}
                                onClick={() => dispose(reminder.id, () => dismissReminder(reminder.id))}
                              >
                                Dismiss
                              </Button>
                            </>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() => {
                              if (!window.confirm(`Delete the reminder "${reminder.title}"?`)) return;
                              dispose(reminder.id, () => deleteReminder(reminder.id));
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
