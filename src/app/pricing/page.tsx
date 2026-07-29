import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app/app-shell";
import { Logo } from "@/components/app/logo";
import { PlanPicker } from "@/components/app/plan-picker";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Plans & pricing" };

const FAQ: [string, string][] = [
  [
    "Is anything charged today?",
    "No. RegLens does not process payments in the MVP. Selecting a plan records your choice on your account so the team can see which tier fits real usage.",
  ],
  [
    "What counts as a business profile?",
    "One organisation with its own jurisdictions, tasks, deadlines and monitored policies. Consulting firms and groups with several entities are the reason the Business plan exists.",
  ],
  [
    "Does the AI Analyst work without my own API key?",
    "Yes. With an Anthropic or OpenAI key configured, answers come from that provider. Without one, RegLens produces a deterministic analysis from your profile and the policy records, clearly labelled as demo output.",
  ],
];

async function PricingContent({ signedIn, tier }: { signedIn: boolean; tier: "FREE" | "PRO" | "BUSINESS" | null }) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Plans & pricing"
        description="Start free, move up when RegLens is carrying real compliance work for you."
      />

      <PlanPicker currentTier={tier} signedIn={signedIn} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-ink">Questions</h2>
        <div className="grid gap-3 lg:grid-cols-3">
          {FAQ.map(([question, answer]) => (
            <div key={question} className="rounded-card border border-line bg-surface p-4">
              <p className="text-sm font-medium text-ink">{question}</p>
              <p className="mt-1.5 text-sm leading-6 text-ink-soft">{answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default async function PricingPage() {
  const user = await getCurrentUser();

  if (user) {
    return (
      <AppShell>
        <PricingContent signedIn tier={user.plan} />
      </AppShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="ml-auto flex items-center gap-1.5">
            <Link href="/sign-in" className={buttonVariants({ variant: "secondary", size: "md" })}>
              Sign in
            </Link>
            <Link href="/sign-up" className={buttonVariants({ size: "md" })}>
              Get started
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <PricingContent signedIn={false} tier={null} />
      </main>
      <footer className="border-t border-line px-4 py-6 text-center text-xs text-ink-muted">
        <Link href="/legal" className="hover:text-ink">
          Legal &amp; disclaimer
        </Link>
      </footer>
    </div>
  );
}
