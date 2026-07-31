"use client";

import { Building2, CreditCard, LogOut, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/lib/actions/auth";
import { useAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/profile", label: "Business profile", icon: Building2 },
  { href: "/pricing", label: "Plans & pricing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

/**
 * Everything that used to occupy four of the sidebar's twelve rows. Rendered
 * at the foot of the sidebar on desktop and in the header on mobile, so there
 * is exactly one account entry point per viewport.
 */
export function AccountMenu({
  email,
  fullName,
  plan,
  placement = "up",
  expanded = true,
}: {
  email: string;
  fullName: string | null;
  plan: string;
  placement?: "up" | "down";
  expanded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { busy: pending, run } = useAction();
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Escape must land you back where you were, not at the top of the page.
      triggerRef.current?.focus();
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials =
    (fullName ?? email)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || null;

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Account menu"
        title={expanded ? undefined : (fullName ?? email)}
        className={cn(
          "nav-motion flex items-center rounded-lg transition-colors hover:bg-surface-muted",
          expanded ? "w-full gap-2.5 px-2 py-1.5" : "justify-center p-1",
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">
          {initials ?? <UserIcon className="size-3.5" />}
        </span>
        <span
          className={cn(
            "nav-motion min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left transition-[opacity,transform]",
            expanded ? "opacity-100" : "hidden -translate-x-1 opacity-0",
          )}
        >
          <span className="block truncate text-[13px] font-medium text-ink">{fullName ?? "RegLens user"}</span>
          <span className="block truncate text-[11px] text-ink-muted">{email}</span>
        </span>
      </button>

      {/*
        A disclosure, not an ARIA menu. `role="menu"` would oblige full
        roving-focus keyboard handling; plain links and buttons in a popover
        are natively navigable and correct as-is.
      */}
      {open ? (
        <div
          className={cn(
            "nav-rail-out absolute z-50 w-60 rounded-lg border border-line bg-surface py-1 shadow-lg",
            placement === "up" ? "bottom-full left-0 mb-1" : "right-0 top-full mt-1",
          )}
        >
          <div className="border-b border-line px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-medium text-ink">{fullName ?? "RegLens user"}</p>
            <p className="truncate text-xs text-ink-muted">{email}</p>
            <p className="mt-1 text-xs font-medium text-brand">{plan} plan</p>
          </div>

          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}

          <form
            className="border-t border-line pt-1"
            action={() => {
              run(async () => {
                await signOut();
              });
            }}
          >
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-60"
            >
              <LogOut className="size-4" />
              {pending ? "Signing out…" : "Sign out"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
