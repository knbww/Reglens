import type { Metadata } from "next";
import Link from "next/link";

import { DemoSignInButton } from "@/components/app/demo-sign-in-button";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create an account" };

/*
 * The question: what does it take to start?
 * Three fields and a survey, said plainly. One primary action — create the
 * account. The demo is the alternative, below the rule.
 */
export default function SignUpPage() {
  return (
    <div className="rise pb-6">
      <h1 className="text-display font-semibold text-balance text-ink">Create your account</h1>
      <p className="mt-3 text-[15px] leading-7 text-ink-soft">
        Then you describe the business once — industry, jurisdictions, what you actually do. It
        takes about three minutes and everything RegLens ranks for you comes from it.
      </p>

      <div className="mt-8">
        <SignUpForm />
      </div>

      <p className="mt-5 text-[13px] text-ink-muted">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
        >
          Sign in
        </Link>
      </p>

      <div className="mt-10 border-t border-line pt-8">
        <p className="text-[13px] leading-6 text-ink-soft">
          Not ready to describe your business? The demo account loads five example businesses you
          can work through instead.
        </p>
        <div className="mt-4">
          <DemoSignInButton />
        </div>
      </div>
    </div>
  );
}
