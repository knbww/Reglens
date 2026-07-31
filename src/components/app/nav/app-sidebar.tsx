"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { Logo } from "@/components/app/logo";
import { AccountMenu } from "@/components/app/nav/account-menu";
import { SidebarNav } from "@/components/app/nav/sidebar-nav";
import { BusinessSwitcher, type BusinessOption } from "@/components/app/business-switcher";
import { navPreferenceCookie } from "@/lib/nav-preference";
import type { NavCounts } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function AppSidebar({
  businesses,
  activeBusinessId,
  counts,
  email,
  fullName,
  plan,
  initialCollapsed,
}: {
  businesses: BusinessOption[];
  activeBusinessId: string | null;
  counts: NavCounts;
  email: string;
  fullName: string | null;
  plan: string;
  initialCollapsed: boolean;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  // Hovering or tabbing into the rail floats it open over the page, so the
  // content column never reflows just because you looked at the nav.
  const [peek, setPeek] = useState(false);
  const expanded = !collapsed || peek;

  const toggle = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous;
      // A layout preference, not application state — a cookie so the server
      // renders the right width on first paint and the rail never flashes.
      document.cookie = navPreferenceCookie(next);
      return next;
    });
    setPeek(false);
  }, []);

  const handleBlur = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPeek(false);
  }, []);

  return (
    <aside
      className={cn(
        "print-hidden nav-motion hidden shrink-0 transition-[width] lg:block",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div
        onMouseEnter={() => collapsed && setPeek(true)}
        onMouseLeave={() => setPeek(false)}
        onFocusCapture={() => collapsed && setPeek(true)}
        onBlurCapture={handleBlur}
        className={cn(
          "nav-motion fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-surface transition-[width,box-shadow]",
          expanded ? "w-60" : "w-14",
          collapsed && peek && "shadow-2xl",
        )}
      >
        <div className={cn("flex h-14 shrink-0 items-center", expanded ? "gap-1 px-3" : "justify-center px-0")}>
          <Link
            href="/dashboard"
            aria-label="RegLens home"
            className="flex min-w-0 items-center rounded-md py-1"
          >
            <Logo showWordmark={false} />
            <span
              className={cn(
                "nav-motion ml-2 overflow-hidden whitespace-nowrap text-[15px] font-semibold tracking-tight text-ink transition-[opacity,max-width]",
                expanded ? "max-w-[10rem] opacity-100" : "max-w-0 opacity-0",
              )}
            >
              RegLens<span className="text-brand"> AI</span>
            </span>
          </Link>

          {expanded ? (
            <button
              type="button"
              onClick={toggle}
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          ) : null}
        </div>

        {/* A switcher that can only ever select what is already selected is
            chrome, not a control — so it renders only when there is a choice.
            Collapsed, it stays reachable as an icon rather than disappearing. */}
        {businesses.length > 1 ? (
          <div className={cn("shrink-0 pb-2", expanded ? "px-2" : "flex justify-center px-0")}>
            <BusinessSwitcher
              businesses={businesses}
              activeId={activeBusinessId}
              compact={!expanded}
            />
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2">
          <SidebarNav counts={counts} expanded={expanded} />
        </div>

        <div className="shrink-0 border-t border-line p-2">
          <AccountMenu
            email={email}
            fullName={fullName}
            plan={plan}
            placement="up"
            expanded={expanded}
          />
        </div>
      </div>
    </aside>
  );
}
