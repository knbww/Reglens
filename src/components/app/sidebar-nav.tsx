"use client";

import {
  Bell,
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  LayoutDashboard,
  ListChecks,
  Radar,
  Search,
  Settings,
  Sparkles,
  SplitSquareHorizontal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; badge?: number };

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Research",
    items: [
      { href: "/policies", label: "Policy search", icon: Search },
      { href: "/analyst", label: "AI Policy Analyst", icon: Sparkles },
      { href: "/compare", label: "Compare jurisdictions", icon: SplitSquareHorizontal },
    ],
  },
  {
    label: "Act",
    items: [
      { href: "/planner", label: "Action planner", icon: ListChecks },
      { href: "/reminders", label: "Deadlines & reminders", icon: CalendarClock },
      { href: "/monitoring", label: "Regulatory monitoring", icon: Radar },
      { href: "/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/profile", label: "Business profile", icon: Building2 },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/pricing", label: "Plans & pricing", icon: CreditCard },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function SidebarNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5" aria-label="Main">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const badge = item.href === "/notifications" ? unreadCount : undefined;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    // Every nav item is always on screen; prefetching all of
                    // them again on each mutation floods the router.
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-brand-soft font-medium text-brand"
                        : "text-ink-soft hover:bg-surface-muted hover:text-ink",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {badge ? (
                      <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-semibold text-white tabular">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
