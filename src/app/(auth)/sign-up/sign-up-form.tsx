"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { signUp, type AuthState } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Creating your account…" : "Create account"}
    </Button>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(signUp, {});

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
