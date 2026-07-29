import type { Metadata } from "next";

import { PlannerBoard, type PlannerPlan } from "@/components/app/planner/planner-board";
import type { PlannerTask } from "@/components/app/planner/task-card";
import { PageHeader, Stat } from "@/components/ui/misc";
import { daysUntil } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getRecommendedPolicies } from "@/lib/queries";
import { requireActiveBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Action planner" };

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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Action planner"
        description="Everything RegLens has turned into work — from policies, AI analyses, regulatory updates and comparisons."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open tasks" value={open.length} hint={`${plannerPlans.length} action plans`} />
        <Stat
          label="Overdue"
          value={overdue.length}
          tone={overdue.length > 0 ? "danger" : "success"}
          hint={overdue.length > 0 ? "Start here" : "Nothing past its date"}
        />
        <Stat
          label="Completed"
          value={completed.length}
          tone="success"
          hint={`${plannerTasks.length} tasks in total`}
        />
        <Stat
          label="Checklist progress"
          value={checklistItems.length === 0 ? "—" : `${checklistDone}/${checklistItems.length}`}
          hint="Steps ticked off across all tasks"
        />
      </div>

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
