import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

import { DEMO_BUSINESSES } from "../src/data/demo-businesses";
import { JURISDICTIONS } from "../src/data/jurisdictions";
import { POLICIES } from "../src/data/policies";
import { POLICY_UPDATES, POLICY_VERSIONS } from "../src/data/updates";
import { loadEnv } from "../src/lib/load-env";
import { supabaseSecretKey } from "../src/lib/supabase/env";
import { PLAN_CATALOG } from "../src/lib/plans";

loadEnv();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@reglens.ai";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "reglens-demo-2025";
/** Stable fallback id so seeding still works when Supabase Auth is unreachable. */
const FALLBACK_DEMO_USER_ID = "00000000-0000-4000-8000-00000000d3m0";

const now = new Date();

function daysFromNow(days: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}

/**
 * Creates (or finds) the demo user in Supabase Auth so the demo sign-in button
 * works against a real session. Falls back to a deterministic id when Supabase
 * Auth is not reachable — the app data still seeds, only demo sign-in is
 * unavailable until Supabase is running.
 */
async function ensureDemoAuthUser(): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = supabaseSecretKey();

  if (!url || !serviceKey) {
    console.warn(
      "! NEXT_PUBLIC_SUPABASE_URL or a Supabase secret key (SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY)" +
        " is missing — seeding app data with a placeholder demo user id.",
    );
    return FALLBACK_DEMO_USER_ID;
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const created = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "RegLens Demo" },
    });
    if (created.data.user) {
      console.log(`  demo auth user created: ${DEMO_EMAIL}`);
      return created.data.user.id;
    }

    // Already exists — find it and reset the password so the demo button works.
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = data?.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL.toLowerCase());
    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
      console.log(`  demo auth user reused: ${DEMO_EMAIL}`);
      return existing.id;
    }
    throw created.error ?? new Error("Could not create or find the demo user");
  } catch (error) {
    console.warn(
      `! Supabase Auth unavailable (${(error as Error).message}). Seeding with a placeholder demo user id.`,
    );
    return FALLBACK_DEMO_USER_ID;
  }
}

async function seedPlans() {
  for (const [index, plan] of PLAN_CATALOG.entries()) {
    await prisma.subscriptionPlan.upsert({
      where: { tier: plan.tier },
      create: {
        tier: plan.tier,
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        tagline: plan.tagline,
        features: plan.features,
        limits: plan.limits,
        highlighted: plan.highlighted,
        displayOrder: index,
      },
      update: {
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        tagline: plan.tagline,
        features: plan.features,
        limits: plan.limits,
        highlighted: plan.highlighted,
        displayOrder: index,
      },
    });
  }
  console.log(`  ${PLAN_CATALOG.length} subscription plans`);
}

async function seedJurisdictions() {
  // Parents first so the self-relation resolves.
  const roots = JURISDICTIONS.filter((j) => !j.parentCode);
  const children = JURISDICTIONS.filter((j) => j.parentCode);

  for (const group of [roots, children]) {
    for (const j of group) {
      await prisma.jurisdiction.upsert({
        where: { code: j.code },
        create: j,
        update: { name: j.name, country: j.country, level: j.level, parentCode: j.parentCode },
      });
    }
  }
  console.log(`  ${JURISDICTIONS.length} jurisdictions`);
}

async function seedPolicies() {
  for (const p of POLICIES) {
    const data = {
      title: p.title,
      country: p.country,
      jurisdictionCode: p.jurisdictionCode,
      level: p.level,
      agency: p.agency,
      industryTags: p.industryTags,
      topicTags: p.topicTags,
      status: p.status,
      importance: p.importance,
      publishedAt: new Date(p.publishedAt),
      effectiveAt: new Date(p.effectiveAt),
      lastUpdatedAt: new Date(p.lastUpdatedAt),
      plainSummary: p.plainSummary,
      fullSummary: p.fullSummary,
      affectedOrgs: p.affectedOrgs,
      requirements: p.requirements,
      consequences: p.consequences,
      deadlines: p.deadlines,
      sourceName: p.sourceName,
      sourceUrl: p.sourceUrl,
      relatedIds: p.relatedIds,
      isSampleData: true,
    };
    await prisma.policy.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
  }
  console.log(`  ${POLICIES.length} policies`);

  for (const v of POLICY_VERSIONS) {
    await prisma.policyVersion.upsert({
      where: { policyId_version: { policyId: v.policyId, version: v.version } },
      create: {
        policyId: v.policyId,
        version: v.version,
        effectiveAt: new Date(v.effectiveAt),
        summary: v.summary,
        changeNote: v.changeNote,
      },
      update: {
        effectiveAt: new Date(v.effectiveAt),
        summary: v.summary,
        changeNote: v.changeNote,
      },
    });
  }
  console.log(`  ${POLICY_VERSIONS.length} policy versions`);

  await prisma.policyUpdate.deleteMany({});
  for (const u of POLICY_UPDATES) {
    const version =
      u.version === undefined
        ? null
        : await prisma.policyVersion.findUnique({
            where: { policyId_version: { policyId: u.policyId, version: u.version } },
          });
    await prisma.policyUpdate.create({
      data: {
        policyId: u.policyId,
        versionId: version?.id ?? null,
        type: u.type,
        title: u.title,
        description: u.description,
        importance: u.importance,
        detectedAt: daysFromNow(-u.detectedDaysAgo),
      },
    });
  }
  console.log(`  ${POLICY_UPDATES.length} policy updates`);
}

async function seedDemoBusinesses(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email: DEMO_EMAIL, fullName: "RegLens Demo", isDemo: true, plan: "PRO" },
    update: { email: DEMO_EMAIL, isDemo: true },
  });

  for (const demo of DEMO_BUSINESSES) {
    // Rebuild each demo business from scratch so re-seeding is idempotent.
    await prisma.business.deleteMany({ where: { ownerId: userId, slug: demo.slug } });

    const business = await prisma.business.create({
      data: {
        ownerId: userId,
        name: demo.name,
        slug: demo.slug,
        description: demo.description,
        website: demo.website,
        isDemo: true,
        country: demo.country,
        region: demo.region,
        city: demo.city,
        sizeBand: demo.sizeBand,
        employeeCount: demo.employeeCount,
        orgType: demo.orgType,
        onboardingCompleted: true,
        onboardingStep: 6,
        disclaimerAcceptedAt: daysFromNow(-30),
        profile: {
          create: {
            industryKey: demo.profile.industryKey,
            industryLabel: demo.profile.industryLabel,
            subIndustries: demo.profile.subIndustries,
            productsSold: demo.profile.productsSold,
            servicesProvided: demo.profile.servicesProvided,
            importsProducts: demo.profile.importsProducts,
            importCountries: demo.profile.importCountries,
            employsStaff: demo.profile.employsStaff,
            handlesCustomerData: demo.profile.handlesCustomerData,
            physicalLocations: demo.profile.physicalLocations,
            sellsCrossBorder: demo.profile.sellsCrossBorder,
            requiresLicenses: demo.profile.requiresLicenses,
            regulatedIndustry: demo.profile.regulatedIndustry,
            plansExpansion: demo.profile.plansExpansion,
            targetCountry: demo.profile.targetCountry,
            targetRegion: demo.profile.targetRegion,
            targetCity: demo.profile.targetCity,
            expansionActivity: demo.profile.expansionActivity,
            expansionDate:
              demo.profile.expansionInDays === undefined ? null : daysFromNow(demo.profile.expansionInDays),
            compliancePriorities: demo.profile.compliancePriorities,
            trackingMethod: demo.profile.trackingMethod,
            hasComplianceStaff: demo.profile.hasComplianceStaff,
            usesSpreadsheets: demo.profile.usesSpreadsheets,
            usesExternalTool: demo.profile.usesExternalTool,
            reviewFrequency: demo.profile.reviewFrequency,
            topConcern: demo.profile.topConcern,
          },
        },
        jurisdictions: {
          create: demo.jurisdictions.map((j) => ({ jurisdictionCode: j.code, role: j.role })),
        },
        monitored: {
          create: [
            ...demo.monitoredPolicyIds.map((policyId) => ({
              targetType: "POLICY" as const,
              policyId,
              label: POLICIES.find((p) => p.id === policyId)?.title ?? policyId,
              lastChecked: daysFromNow(-1),
            })),
            ...demo.monitoredTopics.map((topic) => ({
              targetType: "TOPIC" as const,
              targetKey: topic,
              label: topic,
              lastChecked: daysFromNow(-1),
            })),
          ],
        },
        saved: {
          create: demo.savedPolicyIds.map((policyId) => ({ policyId })),
        },
      },
    });

    for (const planSeed of demo.plans) {
      const plan = await prisma.actionPlan.create({
        data: {
          businessId: business.id,
          title: planSeed.title,
          description: planSeed.description,
          category: planSeed.category,
          source: "POLICY",
          policyId: planSeed.policyId ?? null,
          jurisdictionCode: planSeed.jurisdictionCode ?? null,
        },
      });

      for (const t of planSeed.tasks) {
        await prisma.task.create({
          data: {
            businessId: business.id,
            planId: plan.id,
            policyId: t.policyId ?? null,
            title: t.title,
            description: t.description,
            category: t.category,
            jurisdictionCode: t.jurisdictionCode ?? null,
            priority: t.priority,
            status: t.status,
            dueDate: t.dueInDays === undefined ? null : daysFromNow(t.dueInDays),
            notes: t.notes ?? "",
            completedAt: t.status === "COMPLETED" ? daysFromNow(-3) : null,
            checklist: {
              create: t.checklist.map((c, i) => ({ label: c.label, done: c.done, position: i })),
            },
          },
        });
      }
    }

    for (const r of demo.reminders) {
      const reminder = await prisma.reminder.create({
        data: {
          businessId: business.id,
          policyId: r.policyId ?? null,
          kind: r.kind,
          title: r.title,
          notes: r.notes,
          dueDate: daysFromNow(r.dueInDays),
          advanceDays: r.advanceDays,
        },
      });

      // Raise the in-app notification when the reminder is inside its window.
      if (r.dueInDays <= r.advanceDays) {
        await prisma.notification.create({
          data: {
            userId,
            businessId: business.id,
            reminderId: reminder.id,
            kind: "REMINDER",
            title: r.title,
            body:
              r.dueInDays < 0
                ? `Overdue by ${Math.abs(r.dueInDays)} day${Math.abs(r.dueInDays) === 1 ? "" : "s"}.`
                : `Due in ${r.dueInDays} day${r.dueInDays === 1 ? "" : "s"}.`,
            href: "/reminders",
          },
        });
      }
    }

    // Notify about recent changes to policies this business monitors.
    const relevantUpdates = await prisma.policyUpdate.findMany({
      where: { policyId: { in: demo.monitoredPolicyIds }, importance: { in: ["HIGH", "CRITICAL"] } },
      orderBy: { detectedAt: "desc" },
      take: 3,
    });
    for (const update of relevantUpdates) {
      await prisma.notification.create({
        data: {
          userId,
          businessId: business.id,
          kind: "POLICY_UPDATE",
          title: update.title,
          body: update.description.slice(0, 180),
          href: `/monitoring?update=${update.id}`,
        },
      });
    }

    console.log(`  business: ${demo.name}`);
  }
}

async function main() {
  console.log("Seeding RegLens…");

  const userId = await ensureDemoAuthUser();

  await seedPlans();
  await seedJurisdictions();
  await seedPolicies();
  await seedDemoBusinesses(userId);

  console.log("\nDone.");
  console.log(`Demo sign-in: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
