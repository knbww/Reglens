import Link from "next/link";

import { Logo } from "@/components/app/logo";
import { buttonVariants } from "@/components/ui/button";
import { JURISDICTIONS, jurisdictionName } from "@/data/jurisdictions";
import { POLICIES } from "@/data/policies";
import { formatDate, formatPolicyDeadlineDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { DISCLAIMER } from "@/lib/taxonomy";

/*
 * The question: is this thing worth my account?
 * The answer is not a list of features — it is one real requirement, shown
 * the way the product shows it, so the reader can judge the work for
 * themselves. One primary action: start.
 */

/** The one record on show. Real, from the shipped corpus, not a mock-up. */
const EXAMPLE = POLICIES.find((p) => p.id === "us-cbp-importer-of-record") ?? POLICIES[0];

const AGENCY_COUNT = new Set(POLICIES.map((p) => p.agency)).size;
const REGION_COUNT = JURISDICTIONS.filter(
  (j) => j.level === "STATE" || j.level === "PROVINCE" || j.level === "TERRITORY",
).length;

/** What the product does with a record like the one above it. */
const WORK: [string, string][] = [
  [
    "Narrows it to you",
    "You describe the business once — what it sells, where it operates, who it employs. Search and ranking run against that profile instead of against everyone's.",
  ],
  [
    "Says it in plain language",
    "The AI Policy Analyst answers with your profile and the retrieved records in front of it, and lists the records it used so you can check the reasoning.",
  ],
  [
    "Turns it into dated work",
    "Requirements become tasks with checklists; filing dates and renewals become reminders. The dashboard shows what is late, not what exists.",
  ],
  [
    "Tells you when it moves",
    "Monitor the policies and jurisdictions that matter and get a change feed that says what changed, in which jurisdiction, and whether it reaches you.",
  ],
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const dated = EXAMPLE.deadlines.slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-2xl px-5 py-5">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="ml-auto flex items-center gap-6 text-[13px] text-ink-soft">
            <Link href="/pricing" className="transition-colors hover:text-ink">
              Pricing
            </Link>
            {user ? (
              <Link href="/dashboard" className="transition-colors hover:text-ink">
                Open RegLens
              </Link>
            ) : (
              <Link href="/sign-in" className="transition-colors hover:text-ink">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5">
        <section className="rise pb-14 pt-10 sm:pt-16">
          <p className="text-xs text-ink-muted">
            Regulatory compliance · United States, Canada and Mexico
          </p>

          <h1 className="mt-3 text-display font-semibold text-balance text-ink">
            Know which rules apply to your business, and what to do about them.
          </h1>

          <p className="mt-4 text-[15px] leading-7 text-ink-soft">
            You sell, ship or hire across a border, and you are the person who has to keep it
            legal. Somewhere in three countries&rsquo; rulebooks is the short list that actually
            reaches your business. RegLens finds that list, explains it in plain language, and
            turns it into dated work you can finish.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {user ? (
              <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
                Open RegLens
              </Link>
            ) : (
              <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
                Create an account
              </Link>
            )}
            <Link
              href="/sign-in?demo=1"
              className="text-[13px] text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
            >
              Or look around the demo first
            </Link>
          </div>

          <p className="mt-3 text-[13px] leading-6 text-ink-muted">
            The demo loads five example businesses — a cross-border e-commerce brand, an apparel
            importer, a tutoring centre, a kitchen robotics supplier and a telecom operator.
          </p>
        </section>

        <section className="border-t border-line pt-10">
          <h2 className="text-title font-semibold text-ink">One requirement, in full</h2>
          <p className="mt-2 text-[13px] leading-6 text-ink-muted">
            A record from the shipped dataset, shown the way RegLens shows it. Nothing here is a
            mock-up.
          </p>

          <div className="mt-8">
            <p className="text-xs text-ink-muted">
              {EXAMPLE.agency} · {jurisdictionName(EXAMPLE.jurisdictionCode)}
            </p>

            <h3 className="mt-2 text-title font-semibold text-balance text-ink">{EXAMPLE.title}</h3>

            <p className="mt-3 text-[15px] leading-7 text-ink-soft">{EXAMPLE.plainSummary}</p>

            <h4 className="mt-8 text-xs font-medium text-ink-muted">What it asks of you</h4>
            <ul className="mt-1">
              {EXAMPLE.requirements.slice(0, 4).map((requirement) => (
                <li key={requirement.title} className="border-b border-line py-3.5 last:border-b-0">
                  <p className="text-[15px] text-ink">{requirement.title}</p>
                  <p className="mt-1 text-[13px] leading-6 text-ink-soft">{requirement.detail}</p>
                </li>
              ))}
            </ul>

            <h4 className="mt-8 text-xs font-medium text-ink-muted">
              What it puts on your calendar
            </h4>
            <ul className="mt-1">
              {dated.map((deadline) => (
                <li key={deadline.label} className="border-b border-line py-3.5 last:border-b-0">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <p className="text-[15px] text-ink">{deadline.label}</p>
                    <p className="tabular text-[13px] text-ink-muted">
                      {formatPolicyDeadlineDate(deadline.date)}
                    </p>
                  </div>
                  <p className="mt-1 text-[13px] leading-6 text-ink-soft">{deadline.description}</p>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-[13px] leading-6 text-ink-muted">
              Source:{" "}
              <a
                href={EXAMPLE.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
              >
                {EXAMPLE.sourceName}
              </a>{" "}
              · summary last reviewed {formatDate(EXAMPLE.lastUpdatedAt)}
            </p>
          </div>
        </section>

        <section className="mt-14 border-t border-line pt-10">
          <h2 className="text-title font-semibold text-ink">What RegLens does with it</h2>
          <ul className="mt-6">
            {WORK.map(([title, body]) => (
              <li key={title} className="border-b border-line py-4 last:border-b-0">
                <p className="text-[15px] font-medium text-ink">{title}</p>
                <p className="mt-1 text-[15px] leading-7 text-ink-soft">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Reference material, last and visibly quieter. */}
        <section className="mt-14 border-t border-line pb-16 pt-10">
          <h2 className="text-xs font-medium text-ink-muted">About the data</h2>
          <p className="mt-3 text-[13px] leading-6 text-ink-soft">
            Your profile and jurisdiction comparisons can name any of the {REGION_COUNT} states,
            provinces and territories across the United States, Canada and Mexico. The policy
            corpus itself is deliberately curated: {POLICIES.length} records drawn from{" "}
            {AGENCY_COUNT} agencies, at federal, state and provincial, county and city level.
          </p>
          <p className="mt-3 text-[13px] leading-6 text-ink-soft">
            Every record summarises a real regulatory framework in plain language, names the
            responsible agency, links to an official source and is labelled as sample data in the
            product. RegLens does not present invented records as confirmed live law.
          </p>
          <p className="mt-3 text-[13px] leading-6 text-ink-muted">{DISCLAIMER}</p>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-2xl px-5 pb-10">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-6 text-xs text-ink-muted">
          <Logo showWordmark={false} />
          <Link href="/pricing" className="transition-colors hover:text-ink">
            Pricing
          </Link>
          <Link href="/legal" className="transition-colors hover:text-ink">
            Legal &amp; disclaimer
          </Link>
          <span className="ml-auto">© {new Date().getFullYear()} RegLens AI</span>
        </div>
      </footer>
    </div>
  );
}
