"use client";

import type { TaskPriority, TaskStatus } from "@prisma/client";
import { CalendarPlus, ChevronDown, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/field";
import { ProgressBar } from "@/components/ui/misc";
import { Spine } from "@/components/ui/severity";
import { TaskStatusBadge } from "@/components/ui/status";
import { SEVERITY_TEXT, severityFromDays, severityFromPriority } from "@/lib/severity";
import { jurisdictionName } from "@/data/jurisdictions";
import {
  addChecklistItem,
  deleteChecklistItem,
  deleteTask,
  toggleChecklistItem,
  updateTask,
} from "@/lib/actions/tasks";
import { createReminder } from "@/lib/actions/reminders";
import { daysUntil, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAction } from "@/lib/use-action";

export type PlannerTask = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  notes: string;
  planId: string | null;
  planTitle: string | null;
  policyId: string | null;
  policyTitle: string | null;
  jurisdictionCode: string | null;
  checklist: { id: string; label: string; done: boolean }[];
};

const STATUSES: TaskStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"];
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function TaskCard({
  task,
  defaultOpen = false,
  showPlan = false,
}: {
  task: PlannerTask;
  defaultOpen?: boolean;
  /** Only true in the flat list, where the plan heading is not above the row. */
  showPlan?: boolean;
}) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [open, setOpen] = useState(defaultOpen);
  const [newItem, setNewItem] = useState("");
  const [notes, setNotes] = useState(task.notes);
  const [notesSaved, setNotesSaved] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  const dueDays = daysUntil(task.dueDate);
  const done = task.checklist.filter((c) => c.done).length;
  const progress = task.checklist.length === 0 ? (task.status === "COMPLETED" ? 100 : 0) : Math.round((done / task.checklist.length) * 100);

  function mutate(fn: () => Promise<unknown>) {
    run(async () => {
      await fn();
      router.refresh();
    });
  }

  // Severity comes from the deadline first — a task with a date is judged by
  // that date; priority only speaks when there is no date to speak for it.
  const severity =
    task.status === "COMPLETED"
      ? "clear"
      : task.status === "BLOCKED"
        ? "over"
        : task.dueDate
          ? severityFromDays(daysUntil(task.dueDate))
          : severityFromPriority(task.priority);

  return (
    <div
      id={`task-${task.id}`}
      className={cn(
        "lift rounded-card border bg-surface",
        task.status === "COMPLETED" ? "border-line opacity-70" : "border-line",
      )}
    >
      <Spine
        severity={severity}
        label={`${task.priority.toLowerCase()} priority`}
        className="flex items-start gap-3 p-4 pl-5"
      >
        <Checkbox
          checked={task.status === "COMPLETED"}
          aria-label={`Mark ${task.title} complete`}
          className="mt-1"
          disabled={pending}
          onChange={(e) =>
            mutate(() => updateTask(task.id, { status: e.target.checked ? "COMPLETED" : "IN_PROGRESS" }))
          }
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="min-w-0 flex-1 text-left"
              aria-expanded={open}
            >
              <p
                className={cn(
                  "text-sm font-medium text-ink",
                  task.status === "COMPLETED" && "line-through decoration-ink-muted",
                )}
              >
                {task.title}
              </p>
            </button>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {/* Only the states worth interrupting for keep a pill. Priority
                  is the spine now, and the deadline is a coloured figure. */}
              {task.status === "BLOCKED" || task.status === "IN_PROGRESS" ? (
                <TaskStatusBadge status={task.status} />
              ) : null}
              {dueDays !== null && task.status !== "COMPLETED" ? (
                <span className={cn("tabular text-xs font-medium", SEVERITY_TEXT[severity])}>
                  {dueDays < 0
                    ? `${Math.abs(dueDays)}d overdue`
                    : dueDays === 0
                      ? "due today"
                      : `${dueDays}d left`}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Collapse task" : "Expand task"}
                className="rounded p-1 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
              </button>
            </div>
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
            {/* The plan name is the heading this row already sits under — it is
                only repeated when the list is flat and that context is gone. */}
            {showPlan && task.planTitle ? <span>{task.planTitle}</span> : null}
            {task.jurisdictionCode ? <span>{jurisdictionName(task.jurisdictionCode)}</span> : null}
            {task.dueDate ? <span>due {formatDate(task.dueDate)}</span> : null}
            {task.checklist.length > 0 ? (
              <span className="tabular">
                {done}/{task.checklist.length} steps
              </span>
            ) : null}
          </p>

          {task.checklist.length > 0 ? (
            <ProgressBar
              value={progress}
              tone={progress === 100 ? "success" : "brand"}
              className="mt-2 max-w-xs"
              label={`${task.title} progress`}
            />
          ) : null}
        </div>
      </Spine>

      {open ? (
        <div className="space-y-4 border-t border-line px-4 py-4">
          {task.description ? (
            <p className="text-sm leading-6 text-ink-soft">{task.description}</p>
          ) : null}

          {task.policyId ? (
            <Link href={`/policies/${task.policyId}`} className="inline-block text-xs font-medium text-brand hover:underline">
              Linked policy: {task.policyTitle ?? task.policyId}
            </Link>
          ) : null}

          {/* ------------------------------------------------ Checklist */}
          <div>
            <p className="mb-2 text-xs font-medium text-ink-muted">Checklist</p>
            <ul className="space-y-1">
              {task.checklist.map((item) => (
                <li key={item.id} className="group flex items-center gap-2">
                  <Checkbox
                    checked={item.done}
                    disabled={pending}
                    aria-label={item.label}
                    onChange={() => mutate(() => toggleChecklistItem(item.id))}
                  />
                  <span className={cn("flex-1 text-sm", item.done ? "text-ink-muted line-through" : "text-ink-soft")}>
                    {item.label}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.label}`}
                    disabled={pending}
                    onClick={() => mutate(() => deleteChecklistItem(item.id))}
                    className="rounded p-1 text-ink-muted opacity-0 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
              {task.checklist.length === 0 ? (
                <li className="text-sm text-ink-muted">No checklist items yet.</li>
              ) : null}
            </ul>

            <form
              className="mt-2 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!newItem.trim()) return;
                const label = newItem;
                setNewItem("");
                mutate(() => addChecklistItem(task.id, label));
              }}
            >
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add a checklist step"
                className="h-8 text-xs"
              />
              <Button type="submit" variant="secondary" size="sm" disabled={pending || !newItem.trim()}>
                <Plus className="size-3.5" />
                Add
              </Button>
            </form>
          </div>

          {/* ------------------------------------------------ Controls */}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5">
              <span className="block text-xs font-medium text-ink-soft">Status</span>
              <Select
                value={task.status}
                disabled={pending}
                onChange={(e) => mutate(() => updateTask(task.id, { status: e.target.value as TaskStatus }))}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1.5">
              <span className="block text-xs font-medium text-ink-soft">Priority</span>
              <Select
                value={task.priority}
                disabled={pending}
                onChange={(e) => mutate(() => updateTask(task.id, { priority: e.target.value as TaskPriority }))}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1.5">
              <span className="block text-xs font-medium text-ink-soft">Due date</span>
              <Input
                type="date"
                value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
                disabled={pending}
                onChange={(e) => mutate(() => updateTask(task.id, { dueDate: e.target.value || null }))}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="block text-xs font-medium text-ink-soft">Notes</span>
            <Textarea
              value={notes}
              rows={2}
              disabled={pending}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesSaved(false);
              }}
              onBlur={() => {
                if (notes === task.notes) return;
                mutate(async () => {
                  await updateTask(task.id, { notes });
                  setNotesSaved(true);
                });
              }}
              placeholder="Context, blockers, who is doing this…"
            />
            {notesSaved ? <span className="text-xs text-success">Notes saved.</span> : null}
          </label>

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending || !task.dueDate}
              onClick={() =>
                mutate(async () => {
                  const result = await createReminder({
                    title: task.title,
                    notes: task.description || "Created from the action planner.",
                    kind: "COMPLIANCE_DEADLINE",
                    dueDate: task.dueDate!,
                    advanceDays: 7,
                    taskId: task.id,
                    policyId: task.policyId,
                  });
                  setReminderMessage(
                    result.ok ? "Reminder created with 7 days advance notice." : result.error,
                  );
                })
              }
            >
              <CalendarPlus className="size-3.5" />
              Create reminder
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
                mutate(() => deleteTask(task.id));
              }}
            >
              <Trash2 className="size-3.5" />
              Delete task
            </Button>

            {reminderMessage ? <span className="text-xs text-ink-muted">{reminderMessage}</span> : null}
            {!task.dueDate ? (
              <span className="text-xs text-ink-muted">Set a due date to create a reminder.</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
