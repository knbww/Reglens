import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/app/logo";
import { Card, CardContent } from "@/components/ui/card";
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

export default function LegalPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto w-full max-w-4xl px-4 py-3.5 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Legal &amp; disclaimer</h1>
        <p className="mt-2 text-sm text-ink-muted">
          How to read what RegLens tells you, and what it does not do.
        </p>

        <div className="mt-6 space-y-4">
          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardContent>
                <h2 className="text-sm font-semibold text-ink">{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="mt-2 text-sm leading-6 text-ink-soft">
                    {paragraph}
                  </p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <footer className="border-t border-line px-4 py-6 text-center text-xs text-ink-muted">
        <Link href="/" className="hover:text-ink">
          Back to RegLens
        </Link>
      </footer>
    </div>
  );
}
