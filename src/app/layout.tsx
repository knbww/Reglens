import type { Metadata } from "next";
import { Literata } from "next/font/google";
import "./globals.css";

/*
 * Literata, and nothing else, across the entire product.
 *
 * A screen-native reading serif with an optical-size axis that thickens it at
 * small sizes — and the closest freely-licensed relative to Century, the family
 * the US Supreme Court requires for booklet-format briefs under Rule 33.1(b).
 * A product whose whole job is to be believed is set in the type its own
 * jurisdiction insists on.
 *
 * No second family and no monospace: switching to Courier to print a date is a
 * UI convention, not a document one. Tabular figures and letter-spaced caps do
 * that work here.
 */
const literata = Literata({
  variable: "--font-serif-face",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RegLens AI — Regulatory intelligence for growing organisations",
    template: "%s · RegLens AI",
  },
  description:
    "RegLens AI helps small and medium-sized organisations across North America find policies, understand what they mean for their business, and turn them into checklists, deadlines and monitored changes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${literata.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
