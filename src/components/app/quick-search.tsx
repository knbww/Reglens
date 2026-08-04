"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function QuickSearch({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl-K focuses search from anywhere in the app.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      className={className}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const q = value.trim();
        router.push(q ? `/policies?q=${encodeURIComponent(q)}` : "/policies");
      }}
    >
      {/* No border. The field is a quiet ground the icon sits on, so the header
          carries one shape instead of an outlined box inside an outlined bar. */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search policies, agencies, topics…"
          aria-label="Search policies"
          className="h-9 w-full rounded-md bg-surface-muted pl-8.5 pr-10 text-[13px] text-ink placeholder:text-ink-muted"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-[11px] text-ink-muted md:block">
          ⌘K
        </kbd>
      </div>
    </form>
  );
}
