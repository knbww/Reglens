"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isSectionActive, NAV_ITEMS } from "@/components/app/nav/nav-items";
import type { NavCounts } from "@/lib/queries";
import { cn } from "@/lib/utils";

/**
 * Horizontal navigation, in the masthead.
 *
 * The sidebar went because it was permanent chrome on a product people open
 * weekly: 240px reserved on every screen for five links, squeezing every page
 * into a column and making the whole thing read as generic application
 * furniture. Up here it costs one line, and the page gets the full width back.
 *
 * No icons. Five words are faster to read than five glyphs you have to learn,
 * and icons on a text nav are decoration pretending to be affordance.
 */
export function TopNav({ counts, className }: { counts: NavCounts; className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className={cn("flex items-center gap-1", className)}>
      {NAV_ITEMS.map((item) => {
        const active = isSectionActive(pathname, item);
        const queue = item.queue ? counts[item.queue] : undefined;
        // Only genuinely late work is allowed to speak in colour. Everything
        // else that is waiting is a plain figure beside the word.
        const late = queue?.tone === "over" && queue.count > 0;
        const waiting = queue && queue.count > 0 ? queue.count : null;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative whitespace-nowrap px-3 py-2 text-[14px] transition-colors",
              active ? "font-medium text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {item.label}
            {waiting !== null ? (
              <span
                className={cn(
                  "tabular ml-1.5 text-[12px]",
                  late ? "font-medium text-alert" : "text-ink-muted",
                )}
              >
                {waiting}
              </span>
            ) : null}
            {/* The active mark sits on the masthead rule, so the current
                section is anchored to the page rather than floating in a pill. */}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-2 -bottom-px h-px transition-colors",
                active ? "bg-ink" : "bg-transparent",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
