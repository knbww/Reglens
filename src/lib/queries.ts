import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { rankByRelevance, type BusinessWithContext } from "@/lib/relevance";
import { assessRisk, profileCompletion, type RiskAssessment } from "@/lib/risk";

/**
 * The `where` that matches every update touching something this business
 * monitors. Shared so the full feed and the nav counts can never drift apart
 * on what "relevant" means.
 */
async function monitoredUpdateFilter(business: BusinessWithContext): Promise<Prisma.PolicyUpdateWhereInput> {
  const monitors = await prisma.monitoredPolicy.findMany({
    where: { businessId: business.id, active: true },
    select: { policyId: true, targetType: true, targetKey: true },
  });

  const policyIds = monitors.filter((m) => m.policyId).map((m) => m.policyId!);
  const topics = monitors.filter((m) => m.targetType === "TOPIC").map((m) => m.targetKey!);
  const industries = monitors.filter((m) => m.targetType === "INDUSTRY").map((m) => m.targetKey!);
  const jurisdictions = monitors.filter((m) => m.targetType === "JURISDICTION").map((m) => m.targetKey!);

  return {
    OR: [
      { policyId: { in: policyIds.length ? policyIds : ["__none__"] } },
      { policy: { topicTags: { hasSome: topics.length ? topics : ["__none__"] } } },
      { policy: { industryTags: { hasSome: industries.length ? industries : ["__none__"] } } },
      { policy: { jurisdictionCode: { in: jurisdictions.length ? jurisdictions : ["__none__"] } } },
    ],
  };
}

/** Policy updates that touch anything the business monitors, newest first. */
export async function getRelevantUpdates(business: BusinessWithContext, take = 20) {
  const updates = await prisma.policyUpdate.findMany({
    where: await monitoredUpdateFilter(business),
    include: { policy: true, reviews: { where: { businessId: business.id } } },
    orderBy: { detectedAt: "desc" },
    take,
  });

  return updates.map((u) => ({
    ...u,
    reviewState: u.reviews[0]?.state ?? ("UNREVIEWED" as const),
  }));
}

export async function getBusinessSnapshot(business: BusinessWithContext) {
  const [tasks, reminders, monitors, savedPolicies, updates, conversations] = await Promise.all([
    prisma.task.findMany({
      where: { businessId: business.id },
      include: { checklist: { orderBy: { position: "asc" } }, policy: { select: { id: true, title: true } } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.reminder.findMany({
      where: { businessId: business.id },
      include: { policy: { select: { id: true, title: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.monitoredPolicy.findMany({
      where: { businessId: business.id, active: true },
      include: { policy: { select: { id: true, title: true, lastUpdatedAt: true, importance: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savedPolicy.findMany({
      where: { businessId: business.id },
      include: { policy: true },
      orderBy: { createdAt: "desc" },
    }),
    getRelevantUpdates(business, 25),
    prisma.aIConversation.findMany({
      where: { businessId: business.id },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { _count: { select: { messages: true } } },
    }),
  ]);

  const completion = profileCompletion(business);
  const risk: RiskAssessment = assessRisk({
    business,
    tasks,
    reminders,
    unreviewedUpdates: updates.filter((u) => u.reviewState === "UNREVIEWED"),
    monitoredCount: monitors.length,
    profileCompletion: completion.percent,
  });

  return { tasks, reminders, monitors, savedPolicies, updates, conversations, risk, completion };
}

/** The policies RegLens would put in front of this business first. */
export async function getRecommendedPolicies(business: BusinessWithContext, take = 8) {
  const jurisdictionCodes = business.jurisdictions.map((j) => j.jurisdictionCode);
  const countries = Array.from(new Set(jurisdictionCodes.map((c) => c.split("-")[0]).concat(business.country)));

  const candidates = await prisma.policy.findMany({
    where: {
      status: { not: "REPEALED" },
      OR: [
        { jurisdictionCode: { in: jurisdictionCodes } },
        { country: { in: countries } },
        { industryTags: { has: business.profile?.industryKey ?? "general_small_business" } },
      ],
    },
    take: 150,
  });

  return rankByRelevance(candidates, business).slice(0, take);
}

export async function getUnreadNotificationCount(userId: string, businessId: string) {
  return prisma.notification.count({ where: { userId, businessId, read: false } });
}

/** Severity rung a navigation count is reported at. Mirrors the CSS ramp. */
export type NavTone = "over" | "act" | "watch" | "neutral";
export type NavCount = { count: number; tone: NavTone };
export type NavCounts = { today: NavCount; obligations: NavCount; watch: NavCount };

export const EMPTY_NAV_COUNTS: NavCounts = {
  today: { count: 0, tone: "neutral" },
  obligations: { count: 0, tone: "neutral" },
  watch: { count: 0, tone: "neutral" },
};

/** Anything inside this many days counts as near-term pressure. */
const SOON_DAYS = 14;

/**
 * Counts for the three navigation queues. Deliberately excludes Research and
 * Reports: those are destinations you visit on purpose, and badging them would
 * drown the signal from the queues that actually accumulate work.
 *
 * Kept lean — the sidebar renders on every request, so this must not pull the
 * full business snapshot.
 */
export async function getNavCounts(business: BusinessWithContext): Promise<NavCounts> {
  const now = new Date();
  const soon = new Date(now.getTime() + SOON_DAYS * 24 * 60 * 60 * 1000);
  const openTask = { businessId: business.id, status: { not: "COMPLETED" as const } };
  const visibleReminder = {
    businessId: business.id,
    dismissed: false,
    OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
  };

  const [overdueTasks, dueSoonTasks, overdueReminders, dueSoonReminders, updates] = await Promise.all([
    prisma.task.count({ where: { ...openTask, dueDate: { lt: now } } }),
    prisma.task.count({ where: { ...openTask, dueDate: { gte: now, lte: soon } } }),
    prisma.reminder.count({ where: { ...visibleReminder, dueDate: { lt: now } } }),
    prisma.reminder.count({ where: { ...visibleReminder, dueDate: { gte: now, lte: soon } } }),
    prisma.policyUpdate.findMany({
      where: await monitoredUpdateFilter(business),
      select: { importance: true, reviews: { where: { businessId: business.id }, select: { state: true } } },
      take: 200,
    }),
  ]);

  const unreviewed = updates.filter((u) => (u.reviews[0]?.state ?? "UNREVIEWED") === "UNREVIEWED");
  const pressingChange = unreviewed.some((u) => u.importance === "CRITICAL" || u.importance === "HIGH");

  const overdue = overdueTasks + overdueReminders;
  const dueSoon = dueSoonTasks + dueSoonReminders;

  const obligations = overdue + dueSoon;
  const watch = unreviewed.length;

  return {
    // Everything awaiting a decision, which is what the briefing surfaces.
    today: {
      count: overdue + dueSoon + watch,
      tone: overdue > 0 ? "over" : dueSoon > 0 || watch > 0 ? "act" : "neutral",
    },
    obligations: {
      count: obligations,
      tone: overdue > 0 ? "over" : dueSoon > 0 ? "act" : "neutral",
    },
    watch: {
      count: watch,
      tone: watch === 0 ? "neutral" : pressingChange ? "act" : "watch",
    },
  };
}
