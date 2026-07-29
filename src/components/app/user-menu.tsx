"use client";

import { LogOut, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/lib/actions/auth";
import { useAction } from "@/lib/use-action";

export function UserMenu({ email, fullName, plan }: { email: string; fullName: string | null; plan: string }) {
  const [open, setOpen] = useState(false);
  const { busy: pending, run } = useAction();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const initials = (fullName ?? email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand transition-colors hover:bg-brand-ring/40"
      >
        {initials || <UserIcon className="size-4" />}
      </button>

      {open ? (
        <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-60 rounded-lg border border-line bg-surface py-1 shadow-lg">
          <div className="border-b border-line px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-medium text-ink">{fullName ?? "RegLens user"}</p>
            <p className="truncate text-xs text-ink-muted">{email}</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-brand">{plan} plan</p>
          </div>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink-soft hover:bg-surface-muted hover:text-ink"
          >
            <Settings className="size-4" />
            Settings
          </Link>
          <form
            action={() => {
              run(async () => {
                await signOut();
              });
            }}
          >
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-soft hover:bg-surface-muted hover:text-ink disabled:opacity-60"
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
