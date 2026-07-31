"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  countLabel,
  isRouteActive,
  isSectionActive,
  NAV_ITEMS,
  NAV_TONE_CLASS,
  type NavItem,
} from "@/components/app/nav/nav-items";
import type { NavCounts } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** `useLayoutEffect` warns during SSR; the nav only measures in the browser. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Marker = { top: number; height: number; visible: boolean };

export function SidebarNav({ counts, expanded }: { counts: NavCounts; expanded: boolean }) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const [marker, setMarker] = useState<Marker>({ top: 0, height: 0, visible: false });
  // Suppresses the indicator sliding in from y=0 on first paint.
  const [animating, setAnimating] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    function measure() {
      const active = list?.querySelector<HTMLElement>("[data-nav-active='true']");
      if (!active) {
        setMarker((m) => ({ ...m, visible: false }));
        return;
      }
      // A short bar centred on the row, not the row's full height: it reads as
      // a deliberate marker and never fights the row's rounded corner.
      const height = Math.min(16, active.offsetHeight);
      setMarker({
        top: active.offsetTop + (active.offsetHeight - height) / 2,
        height,
        visible: true,
      });
    }

    measure();
    // Sub-items opening and the rail widening both move the active row.
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    for (const child of Array.from(list.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [pathname, expanded]);

  useEffect(() => {
    if (marker.visible && !animating) {
      const id = requestAnimationFrame(() => setAnimating(true));
      return () => cancelAnimationFrame(id);
    }
  }, [marker.visible, animating]);

  return (
    <nav aria-label="Main">
      {/* `pl-1.5` reserves the gutter the active indicator lives in, so the
          bar sits beside the rows rather than on top of their left edge. */}
      <ul ref={listRef} className="relative flex flex-col gap-0.5 pl-1.5">
        {/* One indicator for the whole list, sliding between sections. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 w-0.5 rounded-r-full bg-brand",
            animating && "nav-motion transition-[transform,height,opacity]",
          )}
          style={{
            transform: `translateY(${marker.top}px)`,
            height: `${marker.height}px`,
            opacity: marker.visible ? 1 : 0,
          }}
        />

        {NAV_ITEMS.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            pathname={pathname}
            counts={counts}
            expanded={expanded}
          />
        ))}
      </ul>
    </nav>
  );
}

function NavRow({
  item,
  pathname,
  counts,
  expanded,
}: {
  item: NavItem;
  pathname: string;
  counts: NavCounts;
  expanded: boolean;
}) {
  const Icon = item.icon;
  const active = isSectionActive(pathname, item);
  const badge = item.queue ? counts[item.queue] : undefined;
  const showBadge = Boolean(badge && badge.count > 0 && badge.tone !== "neutral");
  const toneClass = showBadge ? NAV_TONE_CLASS[badge!.tone as keyof typeof NAV_TONE_CLASS] : "";
  const description = showBadge && item.queue ? countLabel(item.queue, badge!.count) : undefined;
  const openChildren = Boolean(item.children && active && expanded);

  return (
    <li>
      <Link
        href={item.href}
        prefetch={false}
        // On the row, not the <li> — the <li> also contains the sub-list, and
        // the indicator would stretch the height of an open section.
        data-nav-active={active ? "true" : "false"}
        aria-current={active ? "page" : undefined}
        // Named explicitly rather than from the subtree: collapsed, the label
        // is hidden and the name would otherwise degrade to just the count.
        aria-label={description ? `${item.label} — ${description}` : item.label}
        title={expanded ? undefined : description ? `${item.label} — ${description}` : item.label}
        className={cn(
          "nav-motion group relative flex items-center rounded-lg transition-colors",
          "h-9 gap-2.5 px-2.5",
          active ? "bg-canvas font-medium text-ink" : "text-ink-soft hover:bg-surface-muted hover:text-ink",
        )}
      >
        <span aria-hidden className="relative flex size-4 shrink-0 items-center justify-center">
          <Icon className="size-4" />
          {/* Collapsed, the count degrades to a dot — presence survives, precision waits. */}
          {showBadge && !expanded ? (
            <span
              className={cn(
                "absolute -right-1.5 -top-1 size-2 rounded-full ring-2 ring-surface",
                badge!.tone === "over" ? "bg-sev-over" : badge!.tone === "act" ? "bg-sev-act" : "bg-sev-watch",
              )}
            />
          ) : null}
        </span>

        <span
          aria-hidden
          className={cn(
            "nav-motion flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap transition-[opacity,transform]",
            expanded ? "opacity-100" : "-translate-x-1 opacity-0",
          )}
        >
          <span className="truncate text-sm">{item.label}</span>
          {showBadge ? (
            <span
              key={badge!.count}
              className={cn(
                "nav-count ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-4 tabular",
                toneClass,
              )}
            >
              {badge!.count > 99 ? "99+" : badge!.count}
            </span>
          ) : null}
        </span>

      </Link>

      {/* `visibility` is in the transition on purpose: it flips instantly on
          open and only at the end of the close, so the collapse still animates
          while the links leave the a11y tree and hit-testing. */}
      {item.children ? (
        <div
          aria-hidden={!openChildren}
          className={cn(
            "nav-motion grid transition-[grid-template-rows,opacity,visibility]",
            openChildren ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <ul className="mt-0.5 flex flex-col gap-0.5 pb-1 pl-[1.6rem]">
              {item.children.map((child) => {
                const childActive = isRouteActive(pathname, child.href);
                return (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      prefetch={false}
                      tabIndex={openChildren ? undefined : -1}
                      aria-current={childActive ? "page" : undefined}
                      className={cn(
                        "flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] transition-colors",
                        childActive
                          ? "font-medium text-ink"
                          : "text-ink-muted hover:bg-surface-muted hover:text-ink-soft",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1 shrink-0 rounded-full transition-colors",
                          childActive ? "bg-brand" : "bg-line-strong",
                        )}
                      />
                      <span className="truncate">{child.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </li>
  );
}
