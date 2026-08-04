"use client";

import type { TaskPriority, TaskStatus } from "@prisma/client";
import { ChevronDown, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
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

const STATUS_LABEL: Record<TaskStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

/**
 * One task, as a row rather than a card.
 *
 * The hierarchy is carried by indentation and weight: the plan heading sits
 * above, the row is indented beneath it, and the detail opens inside the same
 * row rather than in a second box below it. Completed work recedes — it loses
 * its deadline figure, drops to muted ink and sorts to the bottom of its plan.
 */
export function TaskRow({
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

  const done = task.status === "COMPLETED";
  const dueDays = daysUntil(task.dueDate);
  const ticked = task.checklist.filter((c) => c.done).length;
  const late = !done && dueDays !== null && dueDays < 0;

  function mutate(fn: () => Promise<unknown>) {
    run(async () => {
      await fn();
      router.refresh();
    });
  }

  // One line of plain metadata instead of a stack of pills.
  const meta = [
    showPlan && task.planTitle ? task.planTitle : null,
    task.jurisdictionCode ? jurisdictionName(task.jurisdictionCode) : null,
    task.dueDate ? `due ${formatDate(task.dueDate)}` : null,
    task.checklist.length > 0 ? `${ticked} of ${task.checklist.length} steps` : null,
    !done && task.status !== "NOT_STARTED" ? STATUS_LABEL[task.status].toLowerCase() : null,
    !task.dueDate && !done ? `${PRIORITY_LABEL[task.priority].toLowerCase()} priority` : null,
  ].filter(Boolean);

  const dueFigure =
    done || dueDays === null
      ? null
      : dueDays < 0
        ? `${Math.abs(dueDays)} ${Math.abs(dueDays) === 1 ? "day" : "days"} late`
        : dueDays === 0
          ? "due today"
          : `${dueDays} ${dueDays === 1 ? "day" : "days"} left`;

  return (
    <li id={`task-${task.id}`} className="border-b border-line last:border-b-0">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={done}
          aria-label={`Mark ${task.title} complete`}
          className={cn("shrink-0", done ? "mt-3" : "mt-4")}
          disabled={pending}
          onChange={(e) =>
            mutate(() => updateTask(task.id, { status: e.target.checked ? "COMPLETED" : "IN_PROGRESS" }))
          }
        />

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={cn(
              "lift -mx-3 block w-full rounded-md px-3 text-left",
              done ? "py-2.5" : "py-3.5",
            )}
          >
            <span className="flex items-baseline gap-3">
              <span
                className={cn(
                  "min-w-0 flex-1 text-[15px]",
                  done ? "text-ink-muted line-through decoration-line-strong" : "text-ink",
                )}
              >
                {task.title}
              </span>
              {dueFigure ? (
                <span
                  className={cn(
                    "tabular shrink-0 text-[13px]",
                    late ? "font-medium text-alert" : "text-ink-muted",
                  )}
                >
                  {dueFigure}
                </span>
              ) : null}
              <ChevronDown
                aria-hidden
                className={cn(
                  "size-4 shrink-0 self-center text-ink-muted transition-transform",
                  open && "rotate-180",
                )}
              />
            </span>

            {meta.length > 0 && !done ? (
              <span className="mt-1 block text-[13px] text-ink-muted">{meta.join(" · ")}</span>
            ) : null}
          </button>

          {/* The detail is part of the row: no border, no second card, just the
              same text column continuing downwards. */}
          {open ? (
            <div className="space-y-5 pb-6 pt-1">
              {task.description ? (
                <p className="max-w-2xl text-[15px] leading-7 text-ink-soft">{task.description}</p>
              ) : null}

              {task.policyId ? (
                <p>
                  <Link
                    href={`/policies/${task.policyId}`}
                    className="text-[13px] text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink"
                  >
                    {task.policyTitle ?? "Linked policy"}
                  </Link>
                </p>
              ) : null}

              <div>
                <p className="text-xs text-ink-muted">Checklist</p>
                <ul className="mt-2">
                  {task.checklist.map((item) => (
                    <li key={item.id} className="group flex items-center gap-2.5 py-1">
                      <Checkbox
                        checked={item.done}
                        disabled={pending}
                        aria-label={item.label}
                        onChange={() => mutate(() => toggleChecklistItem(item.id))}
                      />
                      <span
                        className={cn(
                          "min-w-0 flex-1 text-[13px]",
                          item.done
                            ? "text-ink-muted line-through decoration-line-strong"
                            : "text-ink-soft",
                        )}
                      >
                        {item.label}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${item.label}`}
                        disabled={pending}
                        onClick={() => mutate(() => deleteChecklistItem(item.id))}
                        className="rounded p-1 text-ink-muted opacity-0 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                  {task.checklist.length === 0 ? (
                    <li className="py-1 text-[13px] text-ink-muted">No steps yet.</li>
                  ) : null}
                </ul>

                <form
                  className="mt-2.5 flex max-w-md gap-2"
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
                    aria-label={`Add a step to ${task.title}`}
                    placeholder="Add a step"
                    className="h-9 text-[13px]"
                  />
                  <Button type="submit" variant="ghost" size="sm" disabled={pending || !newItem.trim()}>
                    Add
                  </Button>
                </form>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Status">
                  <Select
                    value={task.status}
                    disabled={pending}
                    onChange={(e) =>
                      mutate(() => updateTask(task.id, { status: e.target.value as TaskStatus }))
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Priority">
                  <Select
                    value={task.priority}
                    disabled={pending}
                    onChange={(e) =>
                      mutate(() => updateTask(task.id, { priority: e.target.value as TaskPriority }))
                    }
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {PRIORITY_LABEL[priority]}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Due date">
                  <Input
                    type="date"
                    value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
                    disabled={pending}
                    onChange={(e) => mutate(() => updateTask(task.id, { dueDate: e.target.value || null }))}
                  />
                </Field>
              </div>

              <Field label="Notes" hint={notesSaved ? "Notes saved." : undefined}>
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
              </Field>

              <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
                <Button
                  type="button"
                  variant="ghost"
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
                  Delete task
                </Button>

                {reminderMessage ? (
                  <span className="text-[13px] text-ink-muted">{reminderMessage}</span>
                ) : null}
                {!task.dueDate && !reminderMessage ? (
                  <span className="text-[13px] text-ink-muted">
                    Set a due date to create a reminder.
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
