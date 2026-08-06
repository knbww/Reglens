import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app/app-shell";
import { Logo } from "@/components/app/logo";
import { PlanPicker } from "@/components/app/plan-picker";
import { buttonVariants } from "@/components/ui/button";
import { accessFor, trialRemaining, type Access } from "@/lib/billing";
import { TRIAL_HOURS } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Pricing" };

const FAQ: [string, string][] = [
  [
    `What happens after the ${TRIAL_HOURS} hours?`,
    "The account stays exactly as you left it — profile, tasks, deadlines, monitored policies, saved analyses. RegLens stops opening until you subscribe, and everything is there when you do.",
  ],
  [
    "Is a card needed to start?",
    `No. Signing up gives you the whole product for ${TRIAL_HOURS} hours with nothing to enter and nothing to cancel.`,
  ],
  [
    "Can I cancel?",
    "Any time, from your settings. The month you have already paid for runs to its end, and monitoring keeps running with it.",
  ],
];

function Content({ signedIn, access }: { signedIn: boolean; access: Access | null }) {
  const headline =
    access?.state === "subscribed"
      ? "Your subscription is active"
      : access?.state === "expired"
        ? "Your free day has run out"
        : access
          ? `Your free day is running — ${trialRemaining(access.trialEndsAt)}`
          : `Everything, free for ${TRIAL_HOURS} hours`;

  return (
    <div className="pb-10">
      <header className="rise pb-8">
        <p className="text-xs text-ink-muted">Pricing</p>
        <h1 className="mt-3 max-w-3xl text-display font-semibold text-balance text-ink">{headline}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-soft">
          {access?.state === "expired"
            ? "Nothing has been deleted. Subscribing opens the same account, with the requirements, dates and analyses it already held."
            : "One price for the whole product. A day to decide whether the requirements RegLens puts in front of you are the ones that matter to your business."}
        </p>
      </header>

      <PlanPicker access={access} signedIn={signedIn} />

      <section className="mt-14 border-t border-line pt-6">
        <h2 className="text-xs font-medium text-ink-muted">Questions</h2>
        <dl className="mt-3 max-w-3xl">
          {FAQ.map(([question, answer]) => (
            <div key={question} className="border-b border-line py-4 last:border-b-0">
              <dt className="text-[15px] font-medium text-ink">{question}</dt>
              <dd className="mt-1.5 text-[15px] leading-7 text-ink-soft">{answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

export default async function PricingPage() {
  const user = await getCurrentUser();

  if (user) {
    return (
      <AppShell>
        <Content signedIn access={accessFor(user)} />
      </AppShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-[86rem] items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="ml-auto flex items-center gap-1.5">
            <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size: "md" })}>
              Sign in
            </Link>
            <Link href="/sign-up" className={buttonVariants({ size: "md" })}>
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[86rem] flex-1 px-4 pt-8 sm:px-6 lg:px-8">
        <Content signedIn={false} access={null} />
      </main>

      <footer className="px-4 py-6 text-xs text-ink-muted sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[86rem] border-t border-line pt-5">
          <Link href="/legal" className="hover:text-ink">
            Legal &amp; disclaimer
          </Link>
        </div>
      </footer>
    </div>
  );
}
