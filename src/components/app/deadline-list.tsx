import Link from "next/link";

import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type DeadlineEntry = {
  id: string;
  title: string;
  date: Date;
  /** Where it came from — a plan, a policy, a reminder kind. */
  context?: string;
  href?: string;
};

type Bucket = {
  key: string;
  label: string;
  /** Upper bound in days, inclusive. `null` means everything remaining. */
  upTo: number | null;
};

/**
 * The buckets do the job a time axis was doing — showing where the work piles
 * up — in a form you can read rather than estimate. "Next 7 days · 3" is the
 * same fact as three dots clustered near the left edge, minus the squinting.
 */
const BUCKETS: Bucket[] = [
  { key: "overdue", label: "Overdue", upTo: -1 },
  { key: "week", label: "Next 7 days", upTo: 7 },
  { key: "month", label: "Next 30 days", upTo: 30 },
  { key: "later", label: "Later", upTo: null },
];

function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

function dueLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d late`;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `${days}d`;
}

/**
 * Dated obligations, grouped by how soon they are.
 *
 * Deliberately not a chart. With a handful of items a time axis encodes only
 * density, needs a hover to identify anything, and then repeats itself in the
 * list underneath. A grouped list says the same thing in less space and can be
 * read rather than decoded. Only the overdue group is allowed colour.
 */
export function DeadlineList({
  entries,
  limit = 8,
  moreHref = "/reminders",
  now = new Date(),
}: {
  entries: DeadlineEntry[];
  limit?: number;
  moreHref?: string;
  now?: Date;
}) {
  const dated = entries
    .map((entry) => ({ ...entry, days: daysBetween(now, entry.date) }))
    .sort((a, b) => a.days - b.days);

  const groups = BUCKETS.map((bucket, index) => {
    const lower = index === 0 ? -Infinity : (BUCKETS[index - 1].upTo ?? Infinity) + 1;
    const upper = bucket.upTo ?? Infinity;
    return { bucket, items: dated.filter((d) => d.days >= lower && d.days <= upper) };
  }).filter((group) => group.items.length > 0);

  // The cap is spent on the most urgent groups first, so the overflow is
  // always the least pressing work rather than an arbitrary tail.
  const shown: { bucket: Bucket; items: typeof dated; visible: typeof dated; hidden: number }[] = [];
  let budget = limit;
  for (const group of groups) {
    const take = Math.max(0, Math.min(group.items.length, budget));
    budget -= take;
    shown.push({ ...group, visible: group.items.slice(0, take), hidden: group.items.length - take });
  }
  const hiddenTotal = shown.reduce((sum, group) => sum + group.hidden, 0);

  return (
    <div>
      {shown
        .filter((group) => group.visible.length > 0)
        .map((group) => (
          <section key={group.bucket.key} className="pt-5 first:pt-0">
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-1.5">
              <h3
                className={cn(
                  "text-xs font-medium",
                  group.bucket.key === "overdue" ? "text-alert" : "text-ink-muted",
                )}
              >
                {group.bucket.label}
              </h3>
              <span className="tabular text-xs text-ink-muted">{group.items.length}</span>
            </div>

            <ul>
              {group.visible.map((item) => {
                const row = (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-ink">{item.title}</span>
                      {item.context ? (
                        <span className="block truncate text-xs text-ink-muted">{item.context}</span>
                      ) : null}
                    </span>
                    <span className="tabular shrink-0 text-xs text-ink-muted">
                      {formatDate(item.date)}
                    </span>
                    <span
                      className={cn(
                        "tabular w-16 shrink-0 text-right text-xs",
                        item.days < 0 ? "font-medium text-alert" : "text-ink-muted",
                      )}
                    >
                      {dueLabel(item.days)}
                    </span>
                  </>
                );

                return (
                  <li key={item.id} className="border-b border-line last:border-b-0">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="lift -mx-3 flex items-center gap-3 rounded-md px-3 py-2.5"
                      >
                        {row}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 py-2.5">{row}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      {hiddenTotal > 0 ? (
        <Link
          href={moreHref}
          className="mt-4 inline-block text-[13px] text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink"
        >
          {hiddenTotal} more dated {hiddenTotal === 1 ? "obligation" : "obligations"}
        </Link>
      ) : null}
    </div>
  );
}
