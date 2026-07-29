import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AccountForm, DeleteBusinessButton } from "@/components/app/settings/settings-forms";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DefinitionList, InlineNote, PageHeader } from "@/components/ui/misc";
import { jurisdictionName } from "@/data/jurisdictions";
import { DEFAULT_GROQ_MODEL, groqModel, isAiConfigured } from "@/lib/ai/provider";
import { formatDate } from "@/lib/format";
import { planByTier } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { getActiveBusiness, requireUser } from "@/lib/session";
import { DISCLAIMER } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Settings" };

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
    <div className="space-y-5">
      <PageHeader title="Settings" description="Your account, businesses and how RegLens is configured." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountForm fullName={user.fullName} email={user.email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <Badge tone="brand">{plan.name}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-ink-soft">{plan.tagline}</p>
            <DefinitionList
              items={[
                {
                  term: "Business profiles",
                  value: plan.limits.businesses === null ? "Unlimited" : `${plan.limits.businesses}`,
                },
                {
                  term: "Policy searches",
                  value: plan.limits.policySearches === null ? "Unlimited" : `${plan.limits.policySearches} per month`,
                },
                {
                  term: "AI Analyst questions",
                  value: plan.limits.aiQuestions === null ? "Unlimited" : `${plan.limits.aiQuestions} per month`,
                },
                {
                  term: "Monitored items",
                  value: plan.limits.monitoredItems === null ? "Unlimited" : `${plan.limits.monitoredItems}`,
                },
              ]}
            />
            <InlineNote>
              No payment is taken. Plan selection is recorded on your account so the team can validate pricing,
              and every feature stays available in this MVP.
            </InlineNote>
            <Link href="/pricing" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Change plan
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Businesses</CardTitle>
            <Link href="/onboarding?new=1" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <Plus className="size-3.5" />
              Add a business
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-ink-muted">
                    <th className="px-5 py-2 font-medium">Business</th>
                    <th className="px-3 py-2 font-medium">Location</th>
                    <th className="px-3 py-2 font-medium">Tasks</th>
                    <th className="px-3 py-2 font-medium">Reminders</th>
                    <th className="px-3 py-2 font-medium">Monitored</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-5 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {businesses.map((business) => (
                    <tr key={business.id}>
                      <td className="px-5 py-2.5">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-ink">{business.name}</span>
                          {business.isDemo ? <Badge tone="neutral">Demo</Badge> : null}
                          {business.id === active?.id ? <Badge tone="brand">Active</Badge> : null}
                          {!business.onboardingCompleted ? (
                            <Badge tone="warning">Onboarding incomplete</Badge>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-ink-soft">
                        {[business.city, jurisdictionName(business.region)].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-ink-soft tabular">{business._count.tasks}</td>
                      <td className="px-3 py-2.5 text-ink-soft tabular">{business._count.reminders}</td>
                      <td className="px-3 py-2.5 text-ink-soft tabular">{business._count.monitored}</td>
                      <td className="px-3 py-2.5 text-ink-soft tabular">{formatDate(business.createdAt)}</td>
                      <td className="px-5 py-2.5 text-right">
                        <DeleteBusinessButton businessId={business.id} name={business.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI provider</CardTitle>
            <Badge tone={aiConfigured ? "success" : "neutral"}>
              {aiConfigured ? "Groq" : "demo analyst"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiConfigured ? (
              <p className="text-sm leading-6 text-ink-soft">
                RegLens is calling <strong>Groq</strong> with <code className="font-mono">{groqModel()}</code>{" "}
                for AI Analyst answers. Responses are validated against a fixed schema before anything is
                shown, and citations are restricted to the policy records RegLens supplied.
              </p>
            ) : (
              <p className="text-sm leading-6 text-ink-soft">
                No provider key is configured, so the AI Analyst produces a deterministic analysis assembled
                from your business profile and the retrieved policy records. Every screen and downstream action
                still works — answers are labelled as demo output.
              </p>
            )}
            <div className="rounded-lg border border-line bg-surface-muted p-3">
              <p className="text-xs font-medium text-ink-soft">To use a live model</p>
              <p className="mt-1 text-xs leading-5 text-ink-muted">
                Add <code className="font-mono">GROQ_API_KEY</code> to{" "}
                <code className="font-mono">.env.local</code> (or to your Vercel project environment
                variables) and restart. Get a key at{" "}
                <span className="font-mono">console.groq.com/keys</span>. Optionally set{" "}
                <code className="font-mono">GROQ_MODEL</code> to override the default (
                <code className="font-mono">{DEFAULT_GROQ_MODEL}</code>).
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data &amp; disclaimer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-6 text-ink-soft">{DISCLAIMER}</p>
            <p className="text-sm leading-6 text-ink-muted">
              Policy records in this MVP are illustrative sample data summarising real regulatory frameworks,
              each linked to the responsible agency. Monitoring runs against seeded, versioned change records
              rather than a live crawler.
            </p>
            <Link href="/legal" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Read the full disclaimer
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
