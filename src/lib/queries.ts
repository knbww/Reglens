import { prisma } from "@/lib/prisma";
import { rankByRelevance, type BusinessWithContext } from "@/lib/relevance";
import { assessRisk, profileCompletion, type RiskAssessment } from "@/lib/risk";

/** Policy updates that touch anything the business monitors, newest first. */
export async function getRelevantUpdates(business: BusinessWithContext, take = 20) {
  const monitors = await prisma.monitoredPolicy.findMany({
    where: { businessId: business.id, active: true },
  });

  const policyIds = monitors.filter((m) => m.policyId).map((m) => m.policyId!);
  const topics = monitors.filter((m) => m.targetType === "TOPIC").map((m) => m.targetKey!);
  const industries = monitors.filter((m) => m.targetType === "INDUSTRY").map((m) => m.targetKey!);
  const jurisdictions = monitors.filter((m) => m.targetType === "JURISDICTION").map((m) => m.targetKey!);

  const updates = await prisma.policyUpdate.findMany({
    where: {
      OR: [
        { policyId: { in: policyIds.length ? policyIds : ["__none__"] } },
        { policy: { topicTags: { hasSome: topics.length ? topics : ["__none__"] } } },
        { policy: { industryTags: { hasSome: industries.length ? industries : ["__none__"] } } },
        { policy: { jurisdictionCode: { in: jurisdictions.length ? jurisdictions : ["__none__"] } } },
      ],
    },
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
