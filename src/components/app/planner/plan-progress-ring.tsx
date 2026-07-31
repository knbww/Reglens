import { cn } from "@/lib/utils";

/**
 * Plan completion as a ring rather than a fraction.
 *
 * The fraction stays beneath the heading for anyone who wants the exact count;
 * the ring is there so a column of plans can be triaged without reading any of
 * them. Complete plans go green and stop asking for attention.
 */
export function PlanProgressRing({
  done,
  total,
  className,
}: {
  done: number;
  total: number;
  className?: string;
}) {
  const pct = total === 0 ? 0 : done / total;
  const complete = total > 0 && done === total;
  const radius = 15;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      className={cn("relative inline-flex size-9 items-center justify-center", className)}
      title={`${done} of ${total} complete`}
    >
      <svg viewBox="0 0 36 36" className="size-9 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={radius} fill="none" stroke="var(--color-line)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          stroke={complete ? "var(--color-sev-clear)" : "var(--color-brand)"}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{ transition: "stroke-dashoffset var(--dur-slow) var(--ease-out)" }}
        />
      </svg>
      <span
        className={cn(
          "tabular absolute text-[10px] font-semibold",
          complete ? "text-sev-clear" : "text-ink-soft",
        )}
      >
        {Math.round(pct * 100)}
      </span>
      <span className="sr-only">{`${done} of ${total} tasks complete`}</span>
    </span>
  );
}
