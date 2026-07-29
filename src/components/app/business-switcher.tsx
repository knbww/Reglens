"use client";

import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { switchBusinessAndGo } from "@/lib/actions/business";
import { cn } from "@/lib/utils";
import { useAction } from "@/lib/use-action";

export type BusinessOption = {
  id: string;
  name: string;
  slug: string;
  isDemo: boolean;
  city: string;
  region: string;
  onboardingCompleted: boolean;
};

export function BusinessSwitcher({
  businesses,
  activeId,
}: {
  businesses: BusinessOption[];
  activeId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { busy: pending, run } = useAction();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = businesses.find((b) => b.id === activeId) ?? businesses[0];
  const demos = businesses.filter((b) => b.isDemo);
  const own = businesses.filter((b) => !b.isDemo);

  function select(id: string) {
    // Close first: `switchBusinessAndGo` redirects, so anything after the await
    // may never run and the menu would stay open over the new page.
    setOpen(false);
    if (id === activeId) return;
    run(() => switchBusinessAndGo(id));
  }

  function renderGroup(label: string, items: BusinessOption[]) {
    if (items.length === 0) return null;
    return (
      <div className="py-1">
        <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        {items.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => select(b.id)}
            className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
          >
            <Check className={cn("mt-0.5 size-4 shrink-0", b.id === active?.id ? "text-brand" : "invisible")} />
            <span className="min-w-0">
              <span className="block truncate font-medium text-ink">{b.name}</span>
              <span className="block truncate text-xs text-ink-muted">
                {[b.city, b.region.replace(/^[A-Z]{2}-/, "")].filter(Boolean).join(", ") || "Location not set"}
                {b.onboardingCompleted ? "" : " · onboarding incomplete"}
              </span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2 text-left transition-colors hover:border-brand-ring disabled:opacity-60"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
          <Building2 className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">
            {active?.name ?? "No business yet"}
          </span>
          <span className="block truncate text-[11px] text-ink-muted">
            {active ? [active.city, active.region.replace(/^[A-Z]{2}-/, "")].filter(Boolean).join(", ") : "Create one to start"}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-ink-muted" />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-96 overflow-auto rounded-lg border border-line bg-surface py-1 shadow-lg"
        >
          {renderGroup("Your businesses", own)}
          {renderGroup("Demo businesses", demos)}
          <div className="border-t border-line pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/onboarding?new=1");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand hover:bg-surface-muted"
            >
              <Plus className="size-4" />
              Add a business
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
