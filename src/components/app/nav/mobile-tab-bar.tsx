"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { countLabel, isSectionActive, NAV_ITEMS } from "@/components/app/nav/nav-items";
import type { NavCounts } from "@/lib/queries";
import { cn } from "@/lib/utils";

/**
 * Five destinations fit across a phone, so the hamburger drawer goes: one tap
 * instead of two, and the queue counts stay visible instead of hiding behind
 * a menu.
 */
export function MobileTabBar({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="print-hidden fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isSectionActive(pathname, item);
          const badge = item.queue ? counts[item.queue] : undefined;
          const showBadge = Boolean(badge && badge.count > 0 && badge.tone !== "neutral");

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                // The visible tab label is abbreviated for width; the
                // accessible name keeps the destination's real name.
                aria-label={
                  showBadge && item.queue
                    ? `${item.label} — ${countLabel(item.queue, badge!.count)}`
                    : item.label
                }
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-brand" : "text-ink-muted",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "nav-motion absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-brand transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <span aria-hidden className="relative flex size-5 items-center justify-center">
                  <Icon className={cn("nav-motion size-5 transition-transform", active && "-translate-y-px")} />
                  {showBadge ? (
                    <span
                      className={cn(
                        "absolute -right-1.5 -top-1 size-2 rounded-full ring-2 ring-surface",
                        badge!.tone === "over"
                          ? "bg-sev-over"
                          : badge!.tone === "act"
                            ? "bg-sev-act"
                            : "bg-sev-watch",
                      )}
                    />
                  ) : null}
                </span>
                <span aria-hidden className="text-[11px] font-medium leading-none">
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
