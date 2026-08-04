import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/app/logo";
import { DISCLAIMER } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Legal & disclaimer" };

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "What RegLens is",
    body: [
      "RegLens is a regulatory information and organisational tool. It helps you find requirements, understand them in plain language, and track the work that follows from them.",
      DISCLAIMER,
    ],
  },
  {
    title: "About the policy records",
    body: [
      "The MVP ships with a curated dataset of sample policy records that summarise real regulatory frameworks in plain language. Each record names the responsible agency and links to an official source.",
      "These records are marked as sample data throughout the product. They are not a synced copy of legal text, they may lag behind amendments, and they do not cover every rule that may apply to you.",
    ],
  },
  {
    title: "About the AI Policy Analyst",
    body: [
      "The AI Analyst answers using your business profile and the policy records RegLens retrieved for the question. It lists the records it relied on so you can check them.",
      "When no AI provider key is configured, RegLens produces a deterministic analysis assembled from the same records and clearly labels it as demo output. In both cases the answer is information, not advice.",
    ],
  },
  {
    title: "About monitoring",
    body: [
      "Regulatory monitoring in the MVP runs against seeded, versioned change records. It demonstrates the full data flow — detection, relevance, review and action — but it is not a live real-time feed from government sources.",
    ],
  },
  {
    title: "Your responsibility",
    body: [
      "Regulations change, and how they apply depends on facts RegLens may not hold. Verify important requirements with the responsible authority or a qualified professional before you rely on them.",
    ],
  },
];

/*
 * The question: how much weight can I put on what RegLens tells me?
 * Prose, in one column, in the order the doubt arrives. No cards — five
 * bordered boxes made a plain answer look like a form to be processed.
 */
export default function LegalPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5">
      <header className="py-5">
        <Link href="/" aria-label="RegLens home" className="inline-flex">
          <Logo />
        </Link>
      </header>

      <main className="flex-1 pb-16 pt-8 sm:pt-12">
        <p className="text-xs text-ink-muted">RegLens AI</p>
        <h1 className="mt-3 text-display font-semibold text-balance text-ink">
          Legal &amp; disclaimer
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-ink-soft">
          How to read what RegLens tells you, and what it does not do.
        </p>

        <div className="mt-10">
          {SECTIONS.map((section) => (
            <section key={section.title} className="border-t border-line py-8 last:pb-0">
              <h2 className="text-title font-semibold text-ink">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="mt-3 text-[15px] leading-7 text-ink-soft"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-line py-6 text-xs text-ink-muted">
        <Link href="/" className="transition-colors hover:text-ink">
          Back to RegLens
        </Link>
      </footer>
    </div>
  );
}
