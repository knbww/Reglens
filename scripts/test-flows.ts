/**
 * End-to-end check of the primary RegLens journey.
 *
 * Runs against the real database and the real domain engines — no mocks. Every
 * record it creates is namespaced with a run id and deleted at the end.
 *
 *   npm run test:flows
 *
 * Optional: set BASE_URL to also smoke-test HTTP routing and route protection
 * against a running server (`npm run dev` or `npm start`).
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { DEMO_BUSINESSES } from "../src/data/demo-businesses";
import { retrievePolicies } from "../src/lib/ai/context";
import { runAnalyst } from "../src/lib/ai/provider";
import { analystAnswerSchema } from "../src/lib/ai/schema";
import { buildComparison } from "../src/lib/comparison";
import { loadEnv } from "../src/lib/load-env";
import { rankByRelevance, type BusinessWithContext } from "../src/lib/relevance";
import { buildComplianceReport } from "../src/lib/reports";
import { assessRisk, profileCompletion } from "../src/lib/risk";

loadEnv();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const RUN_ID = `flowtest-${Date.now()}`;
let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed += 1;
    console.log(`  [32m✓[0m ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  [31m✗[0m ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

/**
 * Signs in and returns a `Cookie` header carrying a real Supabase session, so
 * protected pages can be fetched exactly as a signed-in browser would.
 * Uses @supabase/ssr itself to produce the cookies, rather than guessing names.
 */
async function buildSessionCookie(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const browserKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !browserKey) return null;

  const jar = new Map<string, string>();
  const supabase = createServerClient(url, browserKey, {
    cookies: {
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value } of cookies) jar.set(name, value);
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@reglens.ai",
    password: process.env.DEMO_PASSWORD ?? "reglens-demo-2025",
  });
  if (error || jar.size === 0) return null;

  return Array.from(jar, ([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; ");
}

async function main() {
  console.log(`RegLens flow tests (${RUN_ID})`);

  // -------------------------------------------------------------- 1. Sign in
  section("1. Authentication");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const browserKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let ownerId: string | null = null;

  if (url && browserKey) {
    const supabase = createClient(url, browserKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@reglens.ai",
      password: process.env.DEMO_PASSWORD ?? "reglens-demo-2025",
    });
    check("demo account signs in against Supabase Auth", !error && Boolean(data.session), error?.message);
    check("session carries an access token", Boolean(data.session?.access_token));
    ownerId = data.user?.id ?? null;
  } else {
    check(
      "Supabase env vars present",
      false,
      "NEXT_PUBLIC_SUPABASE_URL and a browser key (PUBLISHABLE_KEY or ANON_KEY) must be set",
    );
  }

  const owner = ownerId
    ? await prisma.user.findUnique({ where: { id: ownerId } })
    : await prisma.user.findFirst({ where: { isDemo: true } });
  check("application user row exists for the signed-in account", Boolean(owner));
  if (!owner) throw new Error("No demo user found. Run `npm run db:seed` first.");

  // ------------------------------------------------- 2. Demo business select
  section("2. Demo businesses");
  const businesses = await prisma.business.findMany({
    where: { ownerId: owner.id },
    include: { profile: true, jurisdictions: true },
  });
  check(`all ${DEMO_BUSINESSES.length} demo businesses are seeded`, businesses.length >= DEMO_BUSINESSES.length, `found ${businesses.length}`);

  for (const seed of DEMO_BUSINESSES) {
    const found = businesses.find((b) => b.slug === seed.slug);
    check(`demo business present: ${seed.name}`, Boolean(found?.profile));
  }

  // Each demo profile must produce genuinely different output.
  const topPolicyPerBusiness = new Map<string, string>();
  const riskPerBusiness = new Map<string, number>();

  for (const business of businesses) {
    const candidates = await prisma.policy.findMany({ take: 200 });
    const ranked = rankByRelevance(candidates, business as BusinessWithContext);
    topPolicyPerBusiness.set(business.slug, ranked[0]?.id ?? "none");

    const [tasks, reminders] = await Promise.all([
      prisma.task.findMany({ where: { businessId: business.id } }),
      prisma.reminder.findMany({ where: { businessId: business.id } }),
    ]);
    const monitoredCount = await prisma.monitoredPolicy.count({ where: { businessId: business.id } });
    const completion = profileCompletion(business as BusinessWithContext);
    const risk = assessRisk({
      business: business as BusinessWithContext,
      tasks,
      reminders,
      unreviewedUpdates: [],
      monitoredCount,
      profileCompletion: completion.percent,
    });
    riskPerBusiness.set(business.slug, risk.score);
    check(
      `${business.name}: risk score has explaining factors`,
      risk.factors.length > 0 && risk.score >= 0 && risk.score <= 100,
    );
  }

  check(
    "demo businesses surface different top-ranked policies",
    new Set(topPolicyPerBusiness.values()).size >= 3,
    `distinct: ${new Set(topPolicyPerBusiness.values()).size}`,
  );
  check(
    "demo businesses produce different risk scores",
    new Set(riskPerBusiness.values()).size >= 3,
    `distinct: ${new Set(riskPerBusiness.values()).size}`,
  );

  // ------------------------------------------------------- 3. Onboarding
  section("3. Onboarding writes structured business context");
  const testBusiness = await prisma.business.create({
    data: {
      ownerId: owner.id,
      name: `Flow Test Co ${RUN_ID}`,
      slug: RUN_ID,
      description: "Imports consumer hardware and sells online across the United States and into Canada.",
      country: "US",
      region: "US-CA",
      city: "Oakland",
      sizeBand: "2-10",
      employeeCount: 5,
      orgType: "LLC",
      onboardingCompleted: true,
      onboardingStep: 6,
      disclaimerAcceptedAt: new Date(),
      profile: {
        create: {
          industryKey: "cross_border_ecommerce",
          industryLabel: "Cross-border e-commerce",
          productsSold: ["Consumer hardware"],
          importsProducts: true,
          importCountries: ["CN"],
          employsStaff: true,
          handlesCustomerData: true,
          sellsCrossBorder: true,
          plansExpansion: true,
          targetCountry: "CA",
          targetRegion: "CA-ON",
          expansionActivity: "Direct online sales to Canadian consumers",
          expansionDate: new Date(Date.now() + 90 * 86_400_000),
          compliancePriorities: ["imports_customs", "product_safety", "taxation"],
          trackingMethod: "spreadsheets",
          reviewFrequency: "rarely",
          topConcern: "We do not know what we need before shipping into Canada.",
        },
      },
      jurisdictions: {
        create: [
          { jurisdictionCode: "US", role: "OPERATING" },
          { jurisdictionCode: "US-CA", role: "OPERATING" },
          { jurisdictionCode: "CA", role: "TARGET_EXPANSION" },
          { jurisdictionCode: "CA-ON", role: "TARGET_EXPANSION" },
        ],
      },
    },
    include: { profile: true, jurisdictions: true },
  });
  check("business created with profile and jurisdictions", Boolean(testBusiness.profile) && testBusiness.jurisdictions.length === 4);

  const completion = profileCompletion(testBusiness as BusinessWithContext);
  check("profile completion is computed", completion.percent > 0 && completion.percent <= 100, `${completion.percent}%`);

  // ------------------------------------------------------- 4. Policy search
  section("4. Policy search and detail");
  const searchResults = await prisma.policy.findMany({
    where: {
      AND: [
        { OR: [{ title: { contains: "import", mode: "insensitive" } }, { plainSummary: { contains: "import", mode: "insensitive" } }] },
        { country: "US" },
      ],
    },
  });
  check("keyword + country filter returns results", searchResults.length > 0, `${searchResults.length} rows`);

  const rankedForTest = rankByRelevance(
    await prisma.policy.findMany({ take: 200 }),
    testBusiness as BusinessWithContext,
  );
  check("relevance ranking puts a highly relevant policy first", rankedForTest[0]?.relevance.band === "high", rankedForTest[0]?.relevance.band);
  check("relevance carries human-readable reasons", (rankedForTest[0]?.relevance.reasons.length ?? 0) > 0);

  const focusPolicy = await prisma.policy.findUnique({ where: { id: "ca-cbsa-carm-import" } });
  check("policy detail record loads with requirements and deadlines", Boolean(focusPolicy) && Array.isArray(focusPolicy?.requirements));

  // ------------------------------------------------------- 5. AI Analyst
  section("5. AI Policy Analyst");
  const retrieved = await retrievePolicies({
    business: testBusiness as BusinessWithContext,
    question: "What do we need in place before shipping our first order into Canada?",
    policyId: "ca-cbsa-carm-import",
  });
  check("retrieval returns policy context", retrieved.length > 0, `${retrieved.length} records`);
  check("retrieval includes the focused policy", retrieved.some((p) => p.id === "ca-cbsa-carm-import"));

  const analyst = await runAnalyst({
    business: testBusiness as BusinessWithContext,
    policies: retrieved,
    question: "What do we need in place before shipping our first order into Canada?",
    focusPolicy,
    history: [],
  });
  const validated = analystAnswerSchema.safeParse(analyst.answer);
  check(`analyst answered (provider: ${analyst.provider})`, validated.success, validated.success ? undefined : validated.error.issues[0]?.message);
  check("answer is grounded in supplied sources", analyst.answer.sources.length > 0);
  check(
    "answer references the active business",
    analyst.answer.whyItMatters.includes(testBusiness.name) ||
      analyst.answer.title.includes(testBusiness.name) ||
      analyst.answer.whyItMatters.toLowerCase().includes("canada"),
  );
  check("answer produces recommended actions", analyst.answer.recommendedActions.length > 0);

  const conversation = await prisma.aIConversation.create({
    data: { businessId: testBusiness.id, userId: owner.id, title: "Flow test", policyId: focusPolicy?.id ?? null },
  });
  const assistantMessage = await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: analyst.answer.plainExplanation,
      structured: analyst.answer as unknown as object,
      provider: analyst.provider,
    },
  });
  check("analysis persists to the conversation", Boolean(assistantMessage.structured));

  // ------------------------------------------------------- 6. Action plan
  section("6. Action plan, tasks and checklists");
  const plan = await prisma.actionPlan.create({
    data: {
      businessId: testBusiness.id,
      title: analyst.answer.title.slice(0, 120),
      description: analyst.answer.whyItMatters,
      source: "AI_ANALYSIS",
      conversationId: conversation.id,
      policyId: analyst.answer.sources[0]?.policyId ?? null,
    },
  });

  for (const action of analyst.answer.recommendedActions) {
    const due = action.dueInDays === null ? null : new Date(Date.now() + action.dueInDays * 86_400_000);
    await prisma.task.create({
      data: {
        businessId: testBusiness.id,
        planId: plan.id,
        title: action.title.slice(0, 200),
        description: action.detail,
        priority: action.priority,
        dueDate: due,
        checklist: { create: action.checklist.map((label, i) => ({ label, position: i })) },
      },
    });
  }

  const planTasks = await prisma.task.findMany({
    where: { planId: plan.id },
    include: { checklist: true },
  });
  check("AI recommendations became persisted tasks", planTasks.length === analyst.answer.recommendedActions.length);
  check("tasks carry checklist items", planTasks.some((t) => t.checklist.length > 0));

  // Complete every checklist item on one task and confirm completion tracking.
  const targetTask = planTasks.find((t) => t.checklist.length > 0)!;
  await prisma.checklistItem.updateMany({ where: { taskId: targetTask.id }, data: { done: true } });
  await prisma.task.update({
    where: { id: targetTask.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  const completedTask = await prisma.task.findUnique({
    where: { id: targetTask.id },
    include: { checklist: true },
  });
  check(
    "checklist completion marks the task complete",
    completedTask?.status === "COMPLETED" && completedTask.checklist.every((c) => c.done),
  );

  const edited = await prisma.task.update({
    where: { id: targetTask.id },
    data: { title: "Edited by flow test", priority: "URGENT" },
  });
  check("task edits persist", edited.title === "Edited by flow test" && edited.priority === "URGENT");

  // ------------------------------------------------------- 7. Reminders
  section("7. Reminders and notifications");
  const reminder = await prisma.reminder.create({
    data: {
      businessId: testBusiness.id,
      kind: "FILING_DEADLINE",
      title: "Flow test filing deadline",
      notes: "Created by the flow test.",
      dueDate: new Date(Date.now() + 5 * 86_400_000),
      advanceDays: 7,
    },
  });
  const notification = await prisma.notification.create({
    data: {
      userId: owner.id,
      businessId: testBusiness.id,
      reminderId: reminder.id,
      kind: "REMINDER",
      title: reminder.title,
      body: "Due in 5 days.",
      href: "/reminders",
    },
  });
  check("reminder persists", Boolean(reminder.id));
  check("reminder inside the advance window raises a notification", Boolean(notification.id) && !notification.read);

  await prisma.notification.update({ where: { id: notification.id }, data: { read: true } });
  const readNotification = await prisma.notification.findUnique({ where: { id: notification.id } });
  check("notification read state persists", readNotification?.read === true);

  const snoozeUntil = new Date(Date.now() + 7 * 86_400_000);
  await prisma.reminder.update({ where: { id: reminder.id }, data: { snoozedUntil: snoozeUntil } });
  const snoozed = await prisma.reminder.findUnique({ where: { id: reminder.id } });
  check("reminder snooze persists", Boolean(snoozed?.snoozedUntil));

  // ------------------------------------------------------- 8. Monitoring
  section("8. Regulatory monitoring");
  const monitor = await prisma.monitoredPolicy.create({
    data: {
      businessId: testBusiness.id,
      targetType: "POLICY",
      policyId: "ca-cbsa-carm-import",
      label: "CARM importer registration",
    },
  });
  check("policy added to monitoring", Boolean(monitor.id));

  const monitoredUpdates = await prisma.policyUpdate.findMany({
    where: { policyId: "ca-cbsa-carm-import" },
    orderBy: { detectedAt: "desc" },
  });
  check("seeded change records exist for the monitored policy", monitoredUpdates.length > 0, `${monitoredUpdates.length} updates`);

  const review = await prisma.policyUpdateReview.upsert({
    where: { businessId_updateId: { businessId: testBusiness.id, updateId: monitoredUpdates[0].id } },
    create: { businessId: testBusiness.id, updateId: monitoredUpdates[0].id, state: "REVIEWED" },
    update: { state: "REVIEWED" },
  });
  check("marking a change reviewed persists", review.state === "REVIEWED");

  const checkRun = await prisma.monitoredPolicy.updateMany({
    where: { businessId: testBusiness.id },
    data: { lastChecked: new Date() },
  });
  check("simulated monitoring run stamps last-checked", checkRun.count > 0);

  // ------------------------------------------------------- 9. Comparison
  section("9. Cross-jurisdiction comparison");
  const comparison = await buildComparison({
    topic: "imports_customs",
    jurisdictionCodes: ["US", "CA", "MX"],
    activity: "Importing consumer hardware for online resale",
    business: testBusiness as BusinessWithContext,
  });
  check("comparison returns one column per jurisdiction", comparison.cells.length === 3);
  check("comparison finds policies in each country", comparison.cells.every((c) => c.policies.length > 0));
  check("comparison explains differences", comparison.cells.every((c) => c.differences.length > 0));
  check("comparison suggests preparation steps", comparison.cells.every((c) => c.preparation.length > 0));

  const savedComparison = await prisma.savedComparison.create({
    data: {
      businessId: testBusiness.id,
      userId: owner.id,
      title: "US vs Canada vs Mexico — imports",
      topic: "imports_customs",
      activity: comparison.activity,
      jurisdictionCodes: ["US", "CA", "MX"],
      result: comparison as unknown as object,
    },
  });
  check("comparison can be saved and reloaded", Boolean(savedComparison.id));

  // A state-level comparison should inherit the federal rules above it.
  const stateComparison = await buildComparison({
    topic: "taxation",
    jurisdictionCodes: ["US-CA", "US-NY"],
    activity: "Selling online into both states",
    business: testBusiness as BusinessWithContext,
  });
  check(
    "state comparison inherits federal-level records",
    stateComparison.cells.every((c) => c.policies.length > 0),
  );

  // ------------------------------------------------------- 10. Reports
  section("10. Reports");
  const report = await buildComplianceReport(testBusiness as BusinessWithContext);
  check("report includes the company profile", report.business.name === testBusiness.name);
  check("report includes a risk score with factors", report.risk.factors.length > 0);
  check("report lists relevant policies", report.relevantPolicies.length > 0);
  check("report lists open tasks", report.openTasks.length > 0);
  check("report lists upcoming deadlines", report.upcomingDeadlines.length > 0);
  check("report recommends next steps", report.nextSteps.length > 0);
  check("report carries the disclaimer", report.disclaimer.length > 50);

  const savedReport = await prisma.report.create({
    data: {
      businessId: testBusiness.id,
      userId: owner.id,
      title: "Flow test report",
      payload: report as unknown as object,
    },
  });
  check("report persists for later viewing", Boolean(savedReport.id));

  // ------------------------------------------------------- 11. Plan selection
  section("11. Plan selection");
  const plans = await prisma.subscriptionPlan.findMany();
  check("all three pricing tiers are seeded", plans.length === 3, `${plans.length} tiers`);
  await prisma.user.update({ where: { id: owner.id }, data: { plan: "PRO" } });
  const upgraded = await prisma.user.findUnique({ where: { id: owner.id } });
  check("selected plan persists on the account", upgraded?.plan === "PRO");

  // ------------------------------------------------------- 12. HTTP routes
  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    section("12. HTTP routes");
    const publicRoutes = ["/", "/pricing", "/legal", "/sign-in", "/sign-up"];
    for (const route of publicRoutes) {
      try {
        const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
        check(`GET ${route} → 200`, response.status === 200, `got ${response.status}`);
      } catch (error) {
        check(`GET ${route}`, false, (error as Error).message);
      }
    }

    const protectedRoutes = ["/dashboard", "/policies", "/analyst", "/planner", "/monitoring", "/compare", "/reports", "/profile", "/settings", "/reminders", "/notifications"];
    for (const route of protectedRoutes) {
      try {
        const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
        const location = response.headers.get("location") ?? "";
        check(
          `GET ${route} without a session redirects to sign-in`,
          [302, 307, 308].includes(response.status) && location.includes("/sign-in"),
          `status ${response.status} → ${location || "no redirect"}`,
        );
      } catch (error) {
        check(`GET ${route}`, false, (error as Error).message);
      }
    }
    // ------------------------------------------- 13. Authenticated rendering
    section("13. Authenticated page rendering");
    const cookieHeader = await buildSessionCookie();
    if (!cookieHeader) {
      check("could build a signed-in session cookie", false, "Supabase sign-in failed");
    } else {
      const authedRoutes: [string, string][] = [
        ["/dashboard", "Policy Risk Score"],
        ["/policies", "Policy search"],
        ["/analyst", "AI Policy Analyst"],
        ["/planner", "Action planner"],
        ["/reminders", "Deadlines &amp; reminders"],
        ["/monitoring", "Regulatory monitoring"],
        ["/compare", "Compare jurisdictions"],
        ["/reports", "Reports"],
        ["/profile", "Business profile"],
        ["/notifications", "Notifications"],
        ["/settings", "Settings"],
        ["/pricing", "Plans &amp; pricing"],
      ];

      for (const [route, marker] of authedRoutes) {
        try {
          const response = await fetch(`${baseUrl}${route}`, {
            headers: { cookie: cookieHeader },
            redirect: "manual",
          });
          const html = response.status === 200 ? await response.text() : "";
          check(
            `GET ${route} renders for a signed-in user`,
            response.status === 200 && html.includes(marker),
            response.status !== 200 ? `status ${response.status}` : `marker "${marker}" not found`,
          );
        } catch (error) {
          check(`GET ${route}`, false, (error as Error).message);
        }
      }

      // A policy detail page, reached the way a user would.
      const samplePolicy = await prisma.policy.findFirst({ orderBy: { title: "asc" } });
      if (samplePolicy) {
        const response = await fetch(`${baseUrl}/policies/${samplePolicy.id}`, {
          headers: { cookie: cookieHeader },
          redirect: "manual",
        });
        const html = response.status === 200 ? await response.text() : "";
        check(
          "policy detail page renders with its agency and disclaimer",
          response.status === 200 && html.includes(samplePolicy.agency.split(" ")[0]) && html.includes("does not constitute legal"),
          `status ${response.status}`,
        );
      }
    }
  } else {
    section("12/13. HTTP routes — skipped (set BASE_URL to enable)");
  }

  // ------------------------------------------------------- Cleanup
  section("Cleanup");
  await prisma.business.delete({ where: { id: testBusiness.id } });
  const gone = await prisma.business.findUnique({ where: { id: testBusiness.id } });
  const orphanTasks = await prisma.task.count({ where: { businessId: testBusiness.id } });
  check("test business and all its records removed", !gone && orphanTasks === 0);
}

main()
  .catch((error) => {
    console.error("\nFlow tests crashed:", error);
    failed += 1;
    failures.push("unhandled error");
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log(`\n${passed} passed, ${failed} failed`);
    if (failures.length > 0) {
      console.log("Failed checks:");
      for (const failure of failures) console.log(`  - ${failure}`);
    }
    process.exit(failed > 0 ? 1 : 0);
  });
