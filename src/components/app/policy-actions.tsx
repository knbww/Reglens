"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { createPlanFromPolicy, toggleMonitorPolicy, toggleSavedPolicy } from "@/lib/actions/policies";
import { useAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

/**
 * What you can do about this policy without leaving the page.
 *
 * Five equal outlined buttons made every option look equally likely. Turning a
 * rule into planned work is the one that disposes of the reason you opened the
 * record, so it is the only filled control; the rest recede to ghosts.
 */
export function PolicyActions({
  policyId,
  topic,
  initialSaved,
  initialMonitored,
  className,
}: {
  policyId: string;
  topic: string | null;
  initialSaved: boolean;
  initialMonitored: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [saved, setSaved] = useState(initialSaved);
  const [monitored, setMonitored] = useState(initialMonitored);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className={cn(className)}>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const result = await createPlanFromPolicy(policyId);
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              router.push(`/planner?plan=${result.planId}`);
            })
          }
        >
          Create action plan
        </Button>

        <Link href={`/analyst?policy=${policyId}`} className={buttonVariants({ variant: "ghost" })}>
          Ask the analyst
        </Link>

        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const result = await toggleMonitorPolicy(policyId);
              setMonitored(result.monitoring);
              setMessage(
                result.monitoring
                  ? "Added to monitoring. Detected changes will appear in your change feed."
                  : "Removed from monitoring.",
              );
            })
          }
        >
          {monitored ? "Stop monitoring" : "Add to monitoring"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const result = await toggleSavedPolicy(policyId);
              setSaved(result.saved);
              setMessage(result.saved ? "Saved to your policy library." : "Removed from saved policies.");
            })
          }
        >
          {saved ? "Saved" : "Save policy"}
        </Button>

        <Link
          href={topic ? `/compare?topic=${topic}` : "/compare"}
          className={buttonVariants({ variant: "ghost" })}
        >
          Compare jurisdictions
        </Link>
      </div>

      {message ? <p className="mt-3 text-[13px] leading-6 text-ink-soft">{message}</p> : null}
    </div>
  );
}
