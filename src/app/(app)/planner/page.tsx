import type { Metadata } from "next";

import { PlannerBoard, type PlannerPlan } from "@/components/app/planner/planner-board";
import type { PlannerTask } from "@/components/app/planner/task-row";
import { daysUntil } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getRecommendedPolicies } from "@/lib/queries";
import { requireActiveBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Action planner" };

/*
 * The question this page answers: what work is still outstanding, and how much
 * of it is already late? Everything else — plan counts, checklist progress,
 * completed totals — is one supporting sentence, not four boxes.
 */
export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string; plan?: string; new?: string }>;
}) {
  const params = await searchParams;
  const { business } = await requireActiveBusiness();

  const [tasks, plans, recommended] = await Promise.all([
    prisma.task.findMany({
      where: { businessId: business.id },
      include: {
        checklist: { orderBy: { position: "asc" } },
        policy: { select: { id: true, title: true } },
        plan: { select: { id: true, title: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.actionPlan.findMany({
      where: { businessId: business.id },
      include: { policy: { select: { id: true, title: true } }, tasks: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getRecommendedPolicies(business, 25),
  ]);

  const plannerTasks: PlannerTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    notes: task.notes,
    planId: task.planId,
    planTitle: task.plan?.title ?? null,
    policyId: task.policyId,
    policyTitle: task.policy?.title ?? null,
    jurisdictionCode: task.jurisdictionCode,
    checklist: task.checklist.map((c) => ({ id: c.id, label: c.label, done: c.done })),
  }));

  const plannerPlans: PlannerPlan[] = plans.map((plan) => ({
    id: plan.id,
    title: plan.title,
    description: plan.description,
    category: plan.category,
    source: plan.source,
    policyId: plan.policyId,
    policyTitle: plan.policy?.title ?? null,
    jurisdictionCode: plan.jurisdictionCode,
    taskIds: plan.tasks.map((t) => t.id),
  }));

  const open = plannerTasks.filter((t) => t.status !== "COMPLETED");
  const overdue = open.filter((t) => {
    const d = daysUntil(t.dueDate);
    return d !== null && d < 0;
  });
  const completed = plannerTasks.filter((t) => t.status === "COMPLETED");
  const checklistItems = tasks.flatMap((t) => t.checklist);
  const checklistDone = checklistItems.filter((c) => c.done).length;

  const headline =
    open.length === 0
      ? plannerTasks.length === 0
        ? "No work planned yet"
        : "Nothing is outstanding"
      : open.length === 1
        ? "One task is still open"
        : `${open.length} tasks are still open`;

  // The facts the four stat boxes used to carry, as a single line of type.
  const summary: string[] = [];
  if (plannerPlans.length > 0) {
    summary.push(`${plannerPlans.length} ${plannerPlans.length === 1 ? "plan" : "plans"}`);
  }
  if (checklistItems.length > 0) {
    summary.push(`${checklistDone} of ${checklistItems.length} steps ticked`);
  }
  if (completed.length > 0) summary.push(`${completed.length} done`);

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <header className="rise pb-6">
        <p className="text-xs text-ink-muted">Action planner · {business.name}</p>

        <h1 className="mt-3 text-display font-semibold text-balance text-ink">{headline}</h1>

        {overdue.length > 0 || summary.length > 0 ? (
          <p className="mt-3 text-[13px] text-ink-soft">
            {overdue.length > 0 ? (
              <span className="font-medium text-alert">
                {overdue.length === 1
                  ? "One is past its date"
                  : `${overdue.length} are past their date`}
                {summary.length > 0 ? " · " : ""}
              </span>
            ) : null}
            {summary.length > 0 ? (
              <span className="tabular text-ink-muted">{summary.join(" · ")}</span>
            ) : null}
          </p>
        ) : null}
      </header>

      <PlannerBoard
        tasks={plannerTasks}
        plans={plannerPlans}
        policies={recommended.map((p) => ({ id: p.id, title: p.title }))}
        openTaskId={params.task ?? null}
        openPlanId={params.plan ?? null}
        startCreating={params.new === "1"}
      />
    </div>
  );
}
