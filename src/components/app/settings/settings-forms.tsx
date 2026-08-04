"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { deleteBusiness, updateAccount } from "@/lib/actions/business";
import { useAction } from "@/lib/use-action";

/**
 * The account name.
 *
 * Save state is never ambiguous: the button is dead until something actually
 * changed, says what it is doing while it does it, and the outcome is written
 * out in words next to it rather than implied by the form settling down.
 */
export function AccountForm({ fullName, email }: { fullName: string | null; email: string }) {
  const router = useRouter();
  const { busy: pending, error, run } = useAction();
  const [name, setName] = useState(fullName ?? "");
  const [saved, setSaved] = useState(false);

  const dirty = name.trim() !== (fullName ?? "").trim();

  return (
    <form
      className="max-w-md space-y-4"
      action={(formData) => {
        run(async () => {
          await updateAccount(formData);
          setSaved(true);
          router.refresh();
        });
      }}
    >
      <Field label="Your name" htmlFor="fullName">
        <Input
          id="fullName"
          name="fullName"
          value={name}
          placeholder="Alex Moreno"
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
        />
      </Field>

      <Field label="Email" htmlFor="email" hint="Managed by Supabase Auth and cannot be changed here.">
        <Input id="email" value={email} disabled readOnly />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <span className="text-[13px] text-ink-muted" aria-live="polite">
          {error ? (
            <span className="font-medium text-alert">{error}</span>
          ) : pending ? (
            "Saving your name…"
          ) : saved && !dirty ? (
            "Saved. Your name is up to date."
          ) : dirty ? (
            "Unsaved change."
          ) : (
            "No changes to save."
          )}
        </span>
      </div>
    </form>
  );
}

export function DeleteBusinessButton({ businessId, name }: { businessId: string; name: string }) {
  const router = useRouter();
  const { busy: pending, run } = useAction();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            `Delete "${name}" and everything attached to it — tasks, reminders, monitoring, analyses and reports? This cannot be undone.`,
          )
        )
          return;
        run(async () => {
          await deleteBusiness(businessId);
          router.push("/dashboard");
          router.refresh();
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
