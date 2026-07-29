import {
  ArrowRight,
  CalendarClock,
  ListChecks,
  Radar,
  Search,
  Sparkles,
  SplitSquareHorizontal,
} from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/app/logo";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";
import { DISCLAIMER } from "@/lib/taxonomy";

const CAPABILITIES = [
  {
    icon: Search,
    title: "Find what applies to you",
    body: "Search federal, state, provincial and local requirements across the United States, Canada and Mexico — filtered to your industry and jurisdictions.",
  },
  {
    icon: Sparkles,
    title: "Understand it in plain language",
    body: "The AI Policy Analyst reads your business profile before it answers, so you get what a rule means for your operation, not a general summary.",
  },
  {
    icon: ListChecks,
    title: "Turn answers into a plan",
    body: "Every analysis converts into an action plan with checklists and dates you can actually work through.",
  },
  {
    icon: CalendarClock,
    title: "Never miss a renewal",
    body: "Filing dates, permit renewals and certification audits become reminders with advance notice inside the app.",
  },
  {
    icon: Radar,
    title: "See changes before they bite",
    body: "Monitor the policies, jurisdictions and topics that matter and get a change feed explaining what moved and why.",
  },
  {
    icon: SplitSquareHorizontal,
    title: "Compare before you expand",
    body: "Put two or more jurisdictions side by side — requirements, agencies, deadlines and what you would need to prepare.",
  },
];

const AUDIENCE = [
  "Small and medium-sized businesses",
  "Startups entering new markets",
  "Organisations expanding across state, provincial or national borders",
  "Nonprofits",
  "Consulting firms and researchers",
  "Operations managers without a compliance specialist",
];

const STEPS: [string, string][] = [
  ["Describe your business once", "A short survey captures your industry, activities, jurisdictions and expansion plans."],
  ["Get a personalised dashboard", "A risk indicator, your deadlines, recent changes and recommended actions — ranked for your profile."],
  ["Ask the AI Policy Analyst", "Every answer is grounded in the policy records RegLens retrieved, with sources listed."],
  ["Work the plan", "Recommendations become tasks with checklists, dates and reminders you can track to done."],
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3.5 sm:px-6">
          <Logo />
          <nav className="ml-auto flex items-center gap-1.5">
            <Link href="/pricing" className={buttonVariants({ variant: "ghost", size: "md" })}>
              Pricing
            </Link>
            {user ? (
              <Link href="/dashboard" className={buttonVariants({ size: "md" })}>
                Open RegLens
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className={buttonVariants({ variant: "secondary", size: "md" })}>
                  Sign in
                </Link>
                <Link href="/sign-up" className={buttonVariants({ size: "md" })}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <Badge tone="brand">Regulatory intelligence · North America</Badge>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Know which rules apply to your business — and what to do about them.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-soft">
              RegLens turns regulation into something a small team can manage. Tell it how your organisation
              operates once, and it finds the requirements that apply, explains them in plain language, and
              keeps track of the deadlines.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
                Create an account
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/sign-in?demo=1" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                Explore the demo
              </Link>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              The demo loads five example businesses — a cross-border e-commerce brand, an apparel importer, a
              tutoring centre, a kitchen robotics supplier and a telecom operator.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-lg font-semibold tracking-tight text-ink">What RegLens does</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardContent>
                    <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                      <Icon className="size-4" />
                    </span>
                    <h3 className="mt-3 text-sm font-semibold text-ink">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-ink-soft">{item.body}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">How it works</h2>
              <ol className="mt-4 space-y-4">
                {STEPS.map(([title, body], index) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white tabular">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-ink">{title}</span>
                      <span className="mt-0.5 block text-sm leading-6 text-ink-soft">{body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">Who it is for</h2>
              <ul className="mt-4 grid gap-2">
                {AUDIENCE.map((item) => (
                  <li key={item} className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink-soft">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Card>
            <CardContent className="sm:px-6">
              <h2 className="text-sm font-semibold text-ink">How to read RegLens output</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">{DISCLAIMER}</p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-muted">
                The MVP ships with a curated set of sample policy records that summarise real regulatory
                frameworks in plain language. Every record links to the responsible agency and is labelled as
                sample data — RegLens does not present invented records as confirmed live law.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-ink-muted sm:px-6">
          <Logo />
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/pricing" className="hover:text-ink">
              Pricing
            </Link>
            <Link href="/legal" className="hover:text-ink">
              Legal &amp; disclaimer
            </Link>
            <span>© {new Date().getFullYear()} RegLens AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
