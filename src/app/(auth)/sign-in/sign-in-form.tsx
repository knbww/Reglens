"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { signIn, type AuthState } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function SignInForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(signIn, {});

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="At least 8 characters"
        />
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
