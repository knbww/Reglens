/*
 * The question this page answers:
 * "How is RegLens set up for me, and what can I change?"
 * One primary action: save the account details.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { AccountForm, DeleteBusinessButton } from "@/components/app/settings/settings-forms";
import { jurisdictionName } from "@/data/jurisdictions";
import { DEFAULT_GROQ_MODEL, groqModel, isAiConfigured } from "@/lib/ai/provider";
import { formatDate } from "@/lib/format";
import { planByTier } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { getActiveBusiness, requireUser } from "@/lib/session";
import { DISCLAIMER } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Settings" };

const linkClass =
  "text-[13px] text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink";

/** A settings group: what it is, why it exists, then the controls. */
function Group({
  title,
  purpose,
  children,
}: {
  title: string;
  purpose: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 border-t border-line pt-6">
      <h2 className="text-title font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-ink-muted">{purpose}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Rows({ items }: { items: { term: string; value: React.ReactNode }[] }) {
  return (
    <dl className="max-w-2xl">
      {items.map((item) => (
        <div key={item.term} className="flex gap-4 border-b border-line py-2.5">
          <dt className="w-52 shrink-0 text-[13px] text-ink-muted">{item.term}</dt>
          <dd className="min-w-0 flex-1 text-[14px] text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const [businesses, active] = await Promise.all([
    prisma.business.findMany({
      where: { ownerId: user.id },
      orderBy: [{ isDemo: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { tasks: true, reminders: true, monitored: true } } },
    }),
    getActiveBusiness(user.id),
  ]);

  const plan = planByTier(user.plan);
  const aiConfigured = isAiConfigured();

  return (
    <div className="pb-10">
      <header className="rise">
        <p className="text-xs text-ink-muted">{user.email}</p>
        <h1 className="mt-3 text-display font-semibold text-balance text-ink">
          Your account and businesses
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-soft">
          Plan, AI provider and how RegLens handles data are further down the page.
        </p>
      </header>

      <Group
        title="Account"
        purpose="Your name is how RegLens addresses you in the app. Email is fixed by the sign-in provider."
      >
        <AccountForm fullName={user.fullName} email={user.email} />
      </Group>

      <Group
        title="Plan"
        purpose="What the current plan allows. No payment is taken in this version and no feature is withheld."
      >
        <Rows
          items={[
            { term: "Current plan", value: `${plan.name} — ${plan.tagline}` },
            {
              term: "Business profiles",
              value: plan.limits.businesses === null ? "Unlimited" : `${plan.limits.businesses}`,
            },
            {
              term: "Policy searches",
              value:
                plan.limits.policySearches === null
                  ? "Unlimited"
                  : `${plan.limits.policySearches} per month`,
            },
            {
              term: "AI Analyst questions",
              value:
                plan.limits.aiQuestions === null ? "Unlimited" : `${plan.limits.aiQuestions} per month`,
            },
            {
              term: "Monitored items",
              value: plan.limits.monitoredItems === null ? "Unlimited" : `${plan.limits.monitoredItems}`,
            },
          ]}
        />
        <p className="mt-4">
          <Link href="/pricing" className={linkClass}>
            Compare the plans
          </Link>
        </p>
      </Group>

      <Group
        title="Businesses"
        purpose="Each business carries its own jurisdictions, tasks, deadlines, monitoring and reports. Deleting one removes all of it."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th className="py-2 pr-3 font-medium">Business</th>
                <th className="py-2 pr-3 font-medium">Location</th>
                <th className="py-2 pr-3 font-medium">Tasks</th>
                <th className="py-2 pr-3 font-medium">Reminders</th>
                <th className="py-2 pr-3 font-medium">Monitored</th>
                <th className="py-2 pr-3 font-medium">Created</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {businesses.map((business) => (
                <tr key={business.id} className="border-b border-line">
                  <td className="py-3 pr-3">
                    <span className="font-medium text-ink">{business.name}</span>
                    {business.id === active?.id ? (
                      <span className="ml-2 text-[13px] text-ink-muted">Active</span>
                    ) : null}
                    {business.isDemo ? (
                      <span className="ml-2 text-[13px] text-ink-muted">Demo</span>
                    ) : null}
                    {!business.onboardingCompleted ? (
                      <Link
                        href={`/onboarding?business=${business.id}`}
                        className="ml-2 text-[13px] text-ink-muted underline decoration-line-strong underline-offset-4 hover:text-ink"
                      >
                        Set-up unfinished
                      </Link>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 text-ink-soft">
                    {[business.city, jurisdictionName(business.region)].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="tabular py-3 pr-3 text-ink-soft">{business._count.tasks}</td>
                  <td className="tabular py-3 pr-3 text-ink-soft">{business._count.reminders}</td>
                  <td className="tabular py-3 pr-3 text-ink-soft">{business._count.monitored}</td>
                  <td className="tabular py-3 pr-3 text-ink-soft">{formatDate(business.createdAt)}</td>
                  <td className="py-3 text-right">
                    <DeleteBusinessButton businessId={business.id} name={business.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          <Link href="/onboarding?new=1" className={linkClass}>
            Add a business
          </Link>
        </p>
      </Group>

      <Group
        title="AI provider"
        purpose="Which model answers AI Analyst questions, and what happens when no key is configured."
      >
        {aiConfigured ? (
          <p className="max-w-2xl text-[15px] leading-7 text-ink-soft">
            RegLens is calling <span className="font-medium text-ink">Groq</span> with{" "}
            <code className="font-mono text-[13px] text-ink">{groqModel()}</code> for AI Analyst answers.
            Responses are validated against a fixed schema before anything is shown, and citations are
            restricted to the policy records RegLens supplied.
          </p>
        ) : (
          <p className="max-w-2xl text-[15px] leading-7 text-ink-soft">
            No provider key is configured, so the AI Analyst produces a deterministic analysis assembled from
            your business profile and the retrieved policy records. Every screen and downstream action still
            works — answers are labelled as demo output.
          </p>
        )}
        <p className="mt-4 max-w-2xl text-[13px] leading-6 text-ink-muted">
          To use a live model, add <code className="font-mono">GROQ_API_KEY</code> to{" "}
          <code className="font-mono">.env.local</code> — or to your Vercel project environment variables —
          and restart. Keys come from <span className="font-mono">console.groq.com/keys</span>. Set{" "}
          <code className="font-mono">GROQ_MODEL</code> to override the default,{" "}
          <code className="font-mono">{DEFAULT_GROQ_MODEL}</code>.
        </p>
      </Group>

      <Group
        title="Data and disclaimer"
        purpose="What RegLens is, what it is not, and where the policy records in this version come from."
      >
        <p className="max-w-2xl text-[15px] leading-7 text-ink-soft">{DISCLAIMER}</p>
        <p className="mt-3 max-w-2xl text-[13px] leading-6 text-ink-muted">
          Policy records in this MVP are illustrative sample data summarising real regulatory frameworks, each
          linked to the responsible agency. Monitoring runs against seeded, versioned change records rather
          than a live crawler.
        </p>
        <p className="mt-4">
          <Link href="/legal" className={linkClass}>
            Read the full disclaimer
          </Link>
        </p>
      </Group>
    </div>
  );
}
