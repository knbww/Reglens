import type { Metadata } from "next";
import Link from "next/link";

import { DemoSignInButton } from "@/components/app/demo-sign-in-button";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

/*
 * The question: how do I get back in?
 * One primary action — sign in. The demo sits below a rule as the other way
 * through, for people who have not got an account yet.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; demo?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="rise pb-6">
      <h1 className="text-display font-semibold text-balance text-ink">Sign in</h1>
      <p className="mt-3 text-[15px] leading-7 text-ink-soft">
        Pick up your dashboard, deadlines and monitored policies.
      </p>

      <div className="mt-8">
        <SignInForm next={params.next ?? "/dashboard"} />
      </div>

      <p className="mt-5 text-[13px] text-ink-muted">
        Do not have an account?{" "}
        <Link
          href="/sign-up"
          className="text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
        >
          Create one
        </Link>
      </p>

      <div className="mt-10 border-t border-line pt-8">
        <p className="text-[13px] leading-6 text-ink-soft">
          Or look around first. The demo account loads five example businesses with their own
          deadlines, monitored policies and history.
        </p>
        <div className="mt-4">
          <DemoSignInButton autoStart={params.demo === "1"} />
        </div>
      </div>
    </div>
  );
}
