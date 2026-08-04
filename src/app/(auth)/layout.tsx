import Link from "next/link";

import { Logo } from "@/components/app/logo";
import { SHORT_DISCLAIMER } from "@/lib/taxonomy";

/**
 * The frame around the two auth pages. No header rule, no footer rule and no
 * card: a single narrow column with the wordmark above it and the standing
 * disclaimer set quietly below.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5">
      <header className="py-5">
        <Link href="/" aria-label="RegLens home" className="inline-flex">
          <Logo />
        </Link>
      </header>

      <main className="flex-1 pt-8 sm:pt-14">{children}</main>

      <footer className="py-8 text-xs leading-5 text-ink-muted">{SHORT_DISCLAIMER}</footer>
    </div>
  );
}
