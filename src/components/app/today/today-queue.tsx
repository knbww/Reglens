"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { snoozeReminder } from "@/lib/actions/reminders";
import { createTaskFromUpdate, setUpdateReviewState } from "@/lib/actions/policies";
import { setTaskStatus } from "@/lib/actions/tasks";
import { useAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

/**
 * One thing awaiting a decision. `kind` decides which disposals apply — the
 * server cannot hand functions across the boundary, so the behaviour lives
 * here and only the shape of the work travels.
 */
export type QueueItem = {
  id: string;
  kind: "task" | "change" | "deadline" | "profile";
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  late: boolean;
};

/**
 * The queue you empty.
 *
 * The old dashboard was a table of contents: every row a link somewhere else,
 * nothing doable in place. Here each item carries the action that disposes of
 * it, the item leaves when you act, and the count above falls — so a visit has
 * an end. Reference material lives on its own pages and is not competing here.
 */
export function TodayQueue({
  items,
  nextClearDate,
}: {
  items: QueueItem[];
  nextClearDate: string | null;
}) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [disposed, setDisposed] = useState<Set<string>>(new Set());
  const [leaving, setLeaving] = useState<string | null>(null);

  const remaining = items.filter((item) => !disposed.has(item.id));

  function dispose(item: QueueItem, work: () => Promise<unknown>) {
    setLeaving(item.id);
    run(async () => {
      await work();
      // Let the item finish leaving before it is removed from the list, so the
      // row does not vanish out from under the cursor.
      await new Promise((resolve) => setTimeout(resolve, 170));
      setDisposed((previous) => new Set(previous).add(item.id));
      setLeaving(null);
      router.refresh();
    });
  }

  if (remaining.length === 0) {
    return (
      <div className="rise py-16">
        <p className="text-display font-semibold text-ink">You&rsquo;re clear.</p>
        <p className="mt-3 max-w-md text-[15px] leading-7 text-ink-soft">
          Nothing is overdue and nothing is waiting on a review.
          {nextClearDate ? ` The next dated obligation is ${nextClearDate}.` : ""}
        </p>
      </div>
    );
  }

  return (
    <ul className="rise">
      {remaining.map((item, index) => (
        <li
          key={item.id}
          className={cn(
            "border-b border-line py-7 first:pt-2",
            index === remaining.length - 1 && "border-b-0",
            leaving === item.id && "dispose",
          )}
        >
          <p className="text-xs text-ink-muted">
            {item.late ? <span className="font-medium text-alert">{item.eyebrow}</span> : item.eyebrow}
          </p>

          <h3 className="mt-2 text-title font-semibold text-balance text-ink">
            <Link href={item.href} className="hover:underline hover:decoration-line-strong hover:underline-offset-4">
              {item.title}
            </Link>
          </h3>

          {item.body ? (
            <p className="mt-2 max-w-2xl text-[15px] leading-7 text-ink-soft">{item.body}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2">
            {item.kind === "task" ? (
              <>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => dispose(item, () => setTaskStatus(item.id, "COMPLETED"))}
                >
                  Mark done
                </Button>
                <Link href={item.href} className={buttonVariants({ variant: "ghost" })}>
                  Open the task
                </Link>
              </>
            ) : null}

            {item.kind === "change" ? (
              <>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => dispose(item, () => setUpdateReviewState(item.id, "REVIEWED"))}
                >
                  Mark reviewed
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      const result = await createTaskFromUpdate(item.id);
                      if (result.ok) router.push(`/planner?task=${result.taskId}`);
                    })
                  }
                >
                  Turn into a task
                </Button>
                <Link href={item.href} className={buttonVariants({ variant: "ghost" })}>
                  Read the change
                </Link>
              </>
            ) : null}

            {item.kind === "deadline" ? (
              <>
                <Link href={item.href} className={buttonVariants()}>
                  Open the deadline
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => dispose(item, () => snoozeReminder(item.id, 7))}
                >
                  Not this week
                </Button>
              </>
            ) : null}

            {item.kind === "profile" ? (
              <Link href={item.href} className={buttonVariants()}>
                Complete the profile
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
