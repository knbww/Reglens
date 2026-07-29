import type { Metadata } from "next";
import Link from "next/link";

import { DemoSignInButton } from "@/components/app/demo-sign-in-button";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Create your RegLens account</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Next you will describe your business, which takes about three minutes.
      </p>

      <div className="mt-6">
        <SignUpForm />
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-ink-muted">or look around first</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <DemoSignInButton />

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
