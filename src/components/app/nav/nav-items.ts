import {
  CalendarClock,
  FileText,
  ListChecks,
  Radar,
  Search,
  Sparkles,
  SplitSquareHorizontal,
  Sun,
} from "lucide-react";

import type { NavCounts } from "@/lib/queries";

export type NavQueue = keyof NavCounts;

export type NavChild = { href: string; label: string; icon: typeof Search };

export type NavItem = {
  href: string;
  label: string;
  icon: typeof Search;
  /** Short label for the mobile tab bar, where width is scarce. */
  short: string;
  /**
   * Only queues carry counts. Research and Reports are destinations you visit
   * on purpose — badging them would drown the signal from what accumulates.
   */
  queue?: NavQueue;
  /** Extra routes that belong to this section, revealed when it is active. */
  children?: NavChild[];
};

/**
 * Six primary destinations, no group headers. The old four headers labelled
 * groups of 1/3/4/4 and cost roughly a quarter of the sidebar's height to say
 * things the grouping already said.
 *
 * The Analyst is one of the six rather than a child of Research. It was the
 * single most-used surface in the product and filing it under a section that
 * opens on Policy search meant it simply disappeared: nothing anywhere on
 * screen said the product could be *asked* anything.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Today", short: "Today", icon: Sun, queue: "today" },
  {
    href: "/planner",
    label: "Obligations",
    short: "Work",
    icon: ListChecks,
    queue: "obligations",
    children: [
      { href: "/planner", label: "Action planner", icon: ListChecks },
      { href: "/reminders", label: "Deadlines & reminders", icon: CalendarClock },
    ],
  },
  { href: "/monitoring", label: "Watch", short: "Watch", icon: Radar, queue: "watch" },
  {
    href: "/policies",
    label: "Research",
    short: "Search",
    icon: Search,
    children: [
      { href: "/policies", label: "Policy search", icon: Search },
      { href: "/compare", label: "Compare jurisdictions", icon: SplitSquareHorizontal },
    ],
  },
  { href: "/analyst", label: "AI Analyst", short: "Ask AI", icon: Sparkles },
  { href: "/reports", label: "Reports", short: "Reports", icon: FileText },
];

/** Every route that belongs to a section, so detail pages keep it highlighted. */
function sectionRoutes(item: NavItem): string[] {
  return item.children ? item.children.map((c) => c.href) : [item.href];
}

export function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isSectionActive(pathname: string, item: NavItem): boolean {
  return sectionRoutes(item).some((href) => isRouteActive(pathname, href));
}

/**
 * Which single count, if any, is allowed to carry the alert colour.
 *
 * Colour in the navigation used to be a four-rung ramp, which meant three
 * tinted pills could be lit at once and none of them meant anything. Only
 * genuinely late work earns the one colour in the interface, and only the
 * first such queue in navigation order takes it — every other count is a
 * plain numeral that the reader can still see.
 */
export function alertingQueue(counts: NavCounts): NavQueue | null {
  for (const item of NAV_ITEMS) {
    if (!item.queue) continue;
    const count = counts[item.queue];
    if (count.count > 0 && count.tone === "over") return item.queue;
  }
  return null;
}

/** The count shown beside a destination, or 0 when it has nothing waiting. */
export function navCount(counts: NavCounts, item: NavItem): number {
  return item.queue ? counts[item.queue].count : 0;
}

export function countLabel(queue: NavQueue, count: number): string {
  const noun = {
    today: count === 1 ? "item needs a decision" : "items need a decision",
    obligations: count === 1 ? "obligation due or overdue" : "obligations due or overdue",
    watch: count === 1 ? "unreviewed change" : "unreviewed changes",
  }[queue];
  return `${count} ${noun}`;
}
