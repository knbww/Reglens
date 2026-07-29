"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { deleteBusiness, updateAccount } from "@/lib/actions/business";
import { useAction } from "@/lib/use-action";

export function AccountForm({ fullName, email }: { fullName: string | null; email: string }) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-3"
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
          defaultValue={fullName ?? ""}
          placeholder="Alex Moreno"
          onChange={() => setSaved(false)}
        />
      </Field>
      <Field label="Email" htmlFor="email" hint="Managed by Supabase Auth and cannot be changed here.">
        <Input id="email" value={email} disabled readOnly />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {saved ? <span className="text-xs text-success">Saved.</span> : null}
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
      <Trash2 className="size-3.5" />
      Delete
    </Button>
  );
}
