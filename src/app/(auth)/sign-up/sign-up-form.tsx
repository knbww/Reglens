"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { resendConfirmation, signUp, type AuthState } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Creating your account…" : "Create account"}
    </Button>
  );
}

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      {pending ? "Sending…" : "Send it again"}
    </Button>
  );
}

/**
 * The address is confirmed before the account works, so signing up ends on a
 * sentence rather than in the product. That sentence is the whole screen — it
 * is the only instruction that matters at that moment, and it is a success,
 * which is why it is not printed in the red the validation errors use.
 */
function CheckYourInbox({ email }: { email: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(resendConfirmation, {});

  return (
    <div className="rise">
      <h2 className="text-title font-semibold text-balance text-ink">Confirm your address</h2>
      <p className="mt-3 text-[15px] leading-7 text-ink-soft">
        A link is on its way to <span className="font-medium text-ink">{email}</span>. Follow it and
        RegLens opens on your business set-up.
      </p>

      <form action={formAction} className="mt-5 flex flex-wrap items-center gap-3">
        <input type="hidden" name="email" value={email} />
        <ResendButton />
        {state.notice ? <span className="text-[13px] text-ink-muted">{state.notice}</span> : null}
        {state.error ? (
          <span role="alert" className="text-[13px] leading-6 text-alert">
            {state.error}
          </span>
        ) : null}
      </form>

      <p className="mt-6 text-[13px] text-ink-muted">
        Already confirmed?{" "}
        <Link
          href="/sign-in"
          className="text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(signUp, {});

  if (state.pending) return <CheckYourInbox email={state.pending} />;

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Your name" htmlFor="fullName">
        <Input id="fullName" name="fullName" autoComplete="name" required placeholder="Alex Moreno" />
      </Field>
      <Field label="Work email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      {/* Validation is a sentence, not a tinted box. The word carries it. */}
      {state.error ? (
        <p role="alert" className="text-[13px] leading-6 text-alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
