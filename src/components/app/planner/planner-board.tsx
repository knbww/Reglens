"use client";

import type { TaskPriority, TaskStatus } from "@prisma/client";
import { ListChecks, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { TaskCard, type PlannerTask } from "@/components/app/planner/task-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { createTask, deleteActionPlan } from "@/lib/actions/tasks";
import { daysUntil } from "@/lib/format";
import { TASK_CATEGORIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { useAction } from "@/lib/use-action";

export type PlannerPlan = {
  id: string;
  title: string;
  description: string;
  category: string;
  source: string;
  policyId: string | null;
  policyTitle: string | null;
  jurisdictionCode: string | null;
  taskIds: string[];
};

type Filter = "all" | "open" | "overdue" | "upcoming" | "completed" | "blocked";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "overdue", label: "Overdue" },
  { key: "upcoming", label: "Next 30 days" },
  { key: "blocked", label: "Blocked" },
  { key: "completed", label: "Completed" },
];

const SORTS = [
  { key: "due", label: "Due date" },
  { key: "priority", label: "Priority" },
  { key: "status", label: "Status" },
  { key: "title", label: "Title" },
];

const PRIORITY_ORDER: Record<TaskPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const STATUS_ORDER: Record<TaskStatus, number> = {
  BLOCKED: 0,
  IN_PROGRESS: 1,
  NOT_STARTED: 2,
  COMPLETED: 3,
};

export function PlannerBoard({
  tasks,
  plans,
  policies,
  openTaskId,
  openPlanId,
  startCreating,
}: {
  tasks: PlannerTask[];
  plans: PlannerPlan[];
  policies: { id: string; title: string }[];
  openTaskId: string | null;
  openPlanId: string | null;
  startCreating: boolean;
}) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState("due");
  const [groupByPlan, setGroupByPlan] = useState(true);
  const [creating, setCreating] = useState(startCreating);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "MEDIUM" as TaskPriority,
    dueDate: "",
    policyId: "",
    checklist: "",
  });

  const filtered = useMemo(() => {
    const list = tasks.filter((task) => {
      const days = daysUntil(task.dueDate);
      switch (filter) {
        case "open":
          return task.status !== "COMPLETED";
        case "overdue":
          return task.status !== "COMPLETED" && days !== null && days < 0;
        case "upcoming":
          return task.status !== "COMPLETED" && days !== null && days >= 0 && days <= 30;
        case "blocked":
          return task.status === "BLOCKED";
        case "completed":
          return task.status === "COMPLETED";
        default:
          return true;
      }
    });

    return [...list].sort((a, b) => {
      if (sort === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sort === "status") return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (sort === "title") return a.title.localeCompare(b.title);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [tasks, filter, sort]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      open: tasks.filter((t) => t.status !== "COMPLETED").length,
      overdue: tasks.filter((t) => {
        const d = daysUntil(t.dueDate);
        return t.status !== "COMPLETED" && d !== null && d < 0;
      }).length,
      upcoming: tasks.filter((t) => {
        const d = daysUntil(t.dueDate);
        return t.status !== "COMPLETED" && d !== null && d >= 0 && d <= 30;
      }).length,
      blocked: tasks.filter((t) => t.status === "BLOCKED").length,
      completed: tasks.filter((t) => t.status === "COMPLETED").length,
    }),
    [tasks],
  );

  function submitNewTask() {
    if (draft.title.trim().length < 3) {
      setError("Give the task a short title.");
      return;
    }
    setError(null);
    run(async () => {
      const result = await createTask({
        title: draft.title,
        description: draft.description,
        category: draft.category,
        priority: draft.priority,
        dueDate: draft.dueDate || null,
        policyId: draft.policyId || null,
        checklist: draft.checklist
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft({
        title: "",
        description: "",
        category: "general",
        priority: "MEDIUM",
        dueDate: "",
        policyId: "",
        checklist: "",
      });
      setCreating(false);
      router.refresh();
    });
  }

  const ungrouped = filtered.filter((t) => !t.planId);
  const visibleIds = new Set(filtered.map((t) => t.id));

  return (
    <div className="space-y-4">
      {/* -------------------------------------------------- Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface p-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                filter === f.key
                  ? "border-brand bg-brand-soft font-medium text-brand"
                  : "border-line text-ink-soft hover:border-brand-ring",
              )}
            >
              {f.label}
              <span className="ml-1.5 tabular opacity-70">{counts[f.key]}</span>
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span aria-hidden>Sort</span>
            <Select
              aria-label="Sort tasks by"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-8 w-36 text-xs"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setGroupByPlan((v) => !v)}
          >
            {groupByPlan ? "Show flat list" : "Group by plan"}
          </Button>
          <Button type="button" size="sm" onClick={() => setCreating((v) => !v)}>
            <Plus className="size-3.5" />
            New task
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------- New task form */}
      {creating ? (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">New task</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setCreating(false)}
                className="rounded p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <Field label="Title">
              <Input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Register for a seller's permit in California"
                autoFocus
              />
            </Field>

            <Field label="Description" hint="Optional.">
              <Textarea
                value={draft.description}
                rows={2}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Category">
                <Select
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                >
                  {TASK_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/^\w/, (ch) => ch.toUpperCase())}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Priority">
                <Select
                  value={draft.priority}
                  onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as TaskPriority }))}
                >
                  {(["LOW", "MEDIUM", "HIGH", "URGENT"] as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {p.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Due date">
                <Input
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
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

            <Field label="Checklist" hint="One step per line.">
              <Textarea
                value={draft.checklist}
                rows={3}
                onChange={(e) => setDraft((d) => ({ ...d, checklist: e.target.value }))}
                placeholder={"Gather sales data\nSubmit registration\nFile the first return"}
              />
            </Field>

            {error ? <p className="text-xs text-danger">{error}</p> : null}

            <div className="flex items-center gap-2">
              <Button type="button" onClick={submitNewTask} disabled={pending}>
                {pending ? "Creating…" : "Create task"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)} disabled={pending}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* -------------------------------------------------- Task list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-6" />}
          title={tasks.length === 0 ? "No tasks yet" : "No tasks match this filter"}
          description={
            tasks.length === 0
              ? "Create an action plan from a policy or an AI Analyst answer, or add a task directly."
              : "Try a different filter to see the rest of your work."
          }
          action={
            <Button type="button" size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-3.5" />
              Add a task
            </Button>
          }
        />
      ) : groupByPlan ? (
        <div className="space-y-5">
          {plans
            .filter((plan) => plan.taskIds.some((id) => visibleIds.has(id)))
            .map((plan) => {
              const planTasks = filtered.filter((t) => t.planId === plan.id);
              const completed = planTasks.filter((t) => t.status === "COMPLETED").length;
              return (
                <section key={plan.id} id={`plan-${plan.id}`} className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-ink">{plan.title}</h2>
                      <p className="mt-0.5 text-xs leading-5 text-ink-muted">{plan.description}</p>
                      <p className="mt-1 text-xs text-ink-muted tabular">
                        {completed}/{planTasks.length} complete · source:{" "}
                        {plan.source.toLowerCase().replace(/_/g, " ")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        if (!window.confirm(`Delete the plan "${plan.title}" and its tasks?`)) return;
                        run(async () => {
                          await deleteActionPlan(plan.id);
                          router.refresh();
                        });
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      Delete plan
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {planTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        defaultOpen={task.id === openTaskId || plan.id === openPlanId}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

          {ungrouped.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-ink">Standalone tasks</h2>
              <div className="space-y-2">
                {ungrouped.map((task) => (
                  <TaskCard key={task.id} task={task} defaultOpen={task.id === openTaskId} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} defaultOpen={task.id === openTaskId} />
          ))}
        </div>
      )}
    </div>
  );
}
