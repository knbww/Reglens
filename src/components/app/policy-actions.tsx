"use client";

import { Bookmark, BookmarkCheck, ListPlus, Radar, Sparkles, SplitSquareHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { createPlanFromPolicy, toggleMonitorPolicy, toggleSavedPolicy } from "@/lib/actions/policies";
import { useAction } from "@/lib/use-action";

export function PolicyActions({
  policyId,
  topic,
  initialSaved,
  initialMonitored,
}: {
  policyId: string;
  topic: string | null;
  initialSaved: boolean;
  initialMonitored: boolean;
}) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [saved, setSaved] = useState(initialSaved);
  const [monitored, setMonitored] = useState(initialMonitored);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Link href={`/analyst?policy=${policyId}`} className={buttonVariants()}>
          <Sparkles className="size-4" />
          Ask AI about this policy
        </Link>

        <Button
          type="button"
          variant="secondary"
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
          <Radar className="size-4" />
          {monitored ? "Stop monitoring" : "Add to monitoring"}
        </Button>

        <Button
          type="button"
          variant="secondary"
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
          <ListPlus className="size-4" />
          Create action plan
        </Button>

        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const result = await toggleSavedPolicy(policyId);
              setSaved(result.saved);
              setMessage(result.saved ? "Saved to your policy library." : "Removed from saved policies.");
            })
          }
        >
          {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          {saved ? "Saved" : "Save policy"}
        </Button>

        <Link
          href={topic ? `/compare?topic=${topic}` : "/compare"}
          className={buttonVariants({ variant: "secondary" })}
        >
          <SplitSquareHorizontal className="size-4" />
          Compare with another jurisdiction
        </Link>
      </div>

      {message ? (
        <p className="rounded-lg border border-line bg-surface-muted px-3 py-2 text-xs text-ink-soft">
          {message}
        </p>
      ) : null}
    </div>
  );
}
