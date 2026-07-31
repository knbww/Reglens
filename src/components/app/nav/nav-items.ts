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

import type { NavCounts, NavTone } from "@/lib/queries";

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
 * Five primary destinations, no group headers. The old four headers labelled
 * groups of 1/3/4/4 and cost roughly a quarter of the sidebar's height to say
 * things the grouping already said.
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
    short: "Research",
    icon: Search,
    children: [
      { href: "/policies", label: "Policy search", icon: Search },
      { href: "/analyst", label: "AI Policy Analyst", icon: Sparkles },
      { href: "/compare", label: "Compare jurisdictions", icon: SplitSquareHorizontal },
    ],
  },
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

/** Ramp colours for a count. `neutral` renders no badge at all. */
export const NAV_TONE_CLASS: Record<Exclude<NavTone, "neutral">, string> = {
  over: "bg-sev-over-soft text-sev-over",
  act: "bg-sev-act-soft text-sev-act",
  watch: "bg-sev-watch-soft text-sev-watch",
};

export function countLabel(queue: NavQueue, count: number): string {
  const noun = {
    today: count === 1 ? "item needs a decision" : "items need a decision",
    obligations: count === 1 ? "obligation due or overdue" : "obligations due or overdue",
    watch: count === 1 ? "unreviewed change" : "unreviewed changes",
  }[queue];
  return `${count} ${noun}`;
}
