import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

/*
 * Plex, both cuts. The sans is institutional rather than neutral — flat
 * terminals, a squared bowl, real character at reading sizes — which suits a
 * product about official records better than another geometric grotesque.
 *
 * The mono is not decoration. Every value that is a *record* is set in it:
 * citations, statute numbers, jurisdiction codes, dates, scores. That is what
 * gives the interface texture, and it is true — those things are identifiers,
 * not prose.
 */
const sans = IBM_Plex_Sans({
  variable: "--font-sans-face",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["400", "500"],
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
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
