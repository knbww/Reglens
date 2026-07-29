import type { Metadata } from "next";
import Link from "next/link";

import { DemoSignInButton } from "@/components/app/demo-sign-in-button";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; demo?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Sign in to RegLens</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Pick up your dashboard, deadlines and monitored policies.
      </p>

      <div className="mt-6">
        <DemoSignInButton autoStart={params.demo === "1"} />
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-ink-muted">or use your account</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <SignInForm next={params.next ?? "/dashboard"} />

      <p className="mt-6 text-center text-sm text-ink-muted">
        Do not have an account?{" "}
        <Link href="/sign-up" className="font-medium text-brand hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
