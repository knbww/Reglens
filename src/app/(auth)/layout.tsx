import Link from "next/link";

import { Logo } from "@/components/app/logo";
import { SHORT_DISCLAIMER } from "@/lib/taxonomy";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-3.5 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="border-t border-line px-4 py-5 text-center text-xs text-ink-muted sm:px-6">
        <p className="mx-auto max-w-2xl leading-5">{SHORT_DISCLAIMER}</p>
      </footer>
    </div>
  );
}
