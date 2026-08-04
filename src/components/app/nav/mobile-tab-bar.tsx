"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  alertingQueue,
  countLabel,
  isSectionActive,
  navCount,
  NAV_ITEMS,
} from "@/components/app/nav/nav-items";
import type { NavCounts } from "@/lib/queries";
import { cn } from "@/lib/utils";

/**
 * Five destinations fit across a phone, so the hamburger drawer goes: one tap
 * instead of two, and the queue counts stay visible instead of hiding behind
 * a menu.
 *
 * The bar keeps its hairline — it is a fixed surface with the page scrolling
 * underneath it, which is the one place a border is doing real work.
 */
export function MobileTabBar({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();
  const alerting = alertingQueue(counts);

  return (
    <nav
      aria-label="Main"
      className="print-hidden fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isSectionActive(pathname, item);
          const count = navCount(counts, item);
          const alert = Boolean(item.queue) && item.queue === alerting;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                // The visible tab label is abbreviated for width; the
                // accessible name keeps the destination's real name.
                aria-label={
                  count > 0 && item.queue
                    ? `${item.label} — ${countLabel(item.queue, count)}`
                    : item.label
                }
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1.5 transition-colors",
                  active ? "font-medium text-ink" : "text-ink-muted",
                )}
              >
                <span aria-hidden className="relative flex size-5 items-center justify-center">
                  <Icon className="size-5" />
                  {count > 0 ? (
                    <span
                      className={cn(
                        "absolute -right-1.5 -top-1 size-1.5 rounded-full ring-2 ring-surface",
                        alert ? "bg-alert" : "bg-ink-muted",
                      )}
                    />
                  ) : null}
                </span>
                <span aria-hidden className="text-[11px] leading-none">
                  {item.short}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
