"use client";

import type { ReminderKind } from "@prisma/client";
import { AlarmClock, BellOff, CalendarClock, Plus, RotateCcw, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { Spine } from "@/components/ui/severity";
import { SEVERITY_TEXT, severityFromDays } from "@/lib/severity";
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
  const [draft, setDraft] = useState({
    title: "",
    notes: "",
    kind: "COMPLIANCE_DEADLINE" as ReminderKind,
    dueDate: "",
    advanceDays: "14",
    policyId: "",
  });

  const groups = useMemo(() => {
    const isSnoozed = (r: ReminderRow) => isFuture(r.snoozedUntil);
    return {
      active: reminders.filter((r) => !r.dismissed && !isSnoozed(r) && (daysUntil(r.dueDate) ?? 0) >= 0),
      overdue: reminders.filter((r) => !r.dismissed && !isSnoozed(r) && (daysUntil(r.dueDate) ?? 0) < 0),
      snoozed: reminders.filter((r) => !r.dismissed && isSnoozed(r)),
      dismissed: reminders.filter((r) => r.dismissed),
    };
  }, [reminders]);

  function mutate(fn: () => Promise<unknown>) {
    run(async () => {
      await fn();
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
      router.refresh();
    });
  }

  const visible = groups[view];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface p-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["active", "Upcoming"],
              ["overdue", "Overdue"],
              ["snoozed", "Snoozed"],
              ["dismissed", "Dismissed"],
            ] as [View, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                view === key
                  ? "border-brand bg-brand-soft font-medium text-brand"
                  : "border-line text-ink-soft hover:border-brand-ring",
              )}
            >
              {label}
              <span className="ml-1.5 tabular opacity-70">{groups[key].length}</span>
            </button>
          ))}
        </div>
        <Button type="button" size="sm" className="ml-auto" onClick={() => setCreating((v) => !v)}>
          <Plus className="size-3.5" />
          New reminder
        </Button>
      </div>

      {creating ? (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">New reminder</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setCreating(false)}
                className="rounded p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <Field label="What is the reminder for?">
              <Input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Annual customs bond review"
                autoFocus
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-4">
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

            {error ? <p className="text-xs text-danger">{error}</p> : null}

            <div className="flex items-center gap-2">
              <Button type="button" onClick={submit} disabled={pending}>
                {pending ? "Creating…" : "Create reminder"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)} disabled={pending}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="size-6" />}
          title={
            view === "active"
              ? "No upcoming reminders"
              : view === "overdue"
                ? "Nothing is overdue"
                : view === "snoozed"
                  ? "Nothing snoozed"
                  : "Nothing dismissed"
          }
          description={
            view === "active"
              ? "Add your next filing, renewal or review date and RegLens will raise it in advance."
              : undefined
          }
          action={
            view === "active" ? (
              <Button type="button" size="sm" onClick={() => setCreating(true)}>
                <Plus className="size-3.5" />
                Add a reminder
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((reminder, index) => {
            const days = daysUntil(reminder.dueDate);
            const inWindow = days !== null && days <= reminder.advanceDays;
            const severity = reminder.dismissed ? "clear" : severityFromDays(days);
            return (
              <li key={reminder.id} style={{ ["--rise-i" as string]: index }} className="slide-in">
                <Card className={cn("lift", reminder.dismissed && "opacity-70")}>
                  <Spine severity={severity} className="space-y-2.5 px-5 py-4 pl-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{reminder.title}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {KINDS.find((k) => k.value === reminder.kind)?.label ?? reminder.kind} ·{" "}
                          <span className="tabular">{formatDate(reminder.dueDate)}</span> · notifies{" "}
                          {reminder.advanceDays} days ahead
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <span className={cn("tabular text-xs font-medium", SEVERITY_TEXT[severity])}>
                          {days === null
                            ? "No due date"
                            : days < 0
                              ? `${Math.abs(days)}d overdue`
                              : days === 0
                                ? "Due today"
                                : `${days}d left`}
                        </span>
                        {inWindow && !reminder.dismissed ? <Badge tone="info">Notified</Badge> : null}
                        {isFuture(reminder.snoozedUntil) ? (
                          <Badge tone="neutral">Snoozed to {formatDate(reminder.snoozedUntil)}</Badge>
                        ) : null}
                      </div>
                    </div>

                    {reminder.notes ? (
                      <p className="text-sm leading-6 text-ink-soft">{reminder.notes}</p>
                    ) : null}

                    {reminder.policyId ? (
                      <Link
                        href={`/policies/${reminder.policyId}`}
                        className="inline-block text-xs font-medium text-brand hover:underline"
                      >
                        {reminder.policyTitle ?? "Linked policy"}
                      </Link>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
                      {reminder.dismissed ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={pending}
                          onClick={() => mutate(() => restoreReminder(reminder.id))}
                        >
                          <RotateCcw className="size-3.5" />
                          Restore
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={pending}
                            onClick={() => mutate(() => snoozeReminder(reminder.id, 7))}
                          >
                            <AlarmClock className="size-3.5" />
                            Snooze 7 days
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={pending}
                            onClick={() => mutate(() => dismissReminder(reminder.id))}
                          >
                            <BellOff className="size-3.5" />
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
                          mutate(() => deleteReminder(reminder.id));
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </Spine>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
