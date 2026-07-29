"use client";

import { Check, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { JURISDICTIONS } from "@/data/jurisdictions";
import { Input } from "@/components/ui/field";
import { COUNTRIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

const LEVEL_LABEL: Record<string, string> = {
  FEDERAL: "Federal",
  STATE: "State",
  PROVINCE: "Province",
  TERRITORY: "Territory",
  COUNTY: "County",
  MUNICIPAL: "Local",
};

export function JurisdictionPicker({
  selected,
  onChange,
  max = 25,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string>("US");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return JURISDICTIONS.filter((j) => {
      if (q) return j.name.toLowerCase().includes(q) || j.code.toLowerCase().includes(q);
      return j.country === country;
    }).slice(0, q ? 40 : 200);
  }, [query, country]);

  function toggle(code: string) {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else if (selected.length < max) {
      onChange([...selected, code]);
    }
  }

  return (
    <div className="space-y-3">
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((code) => {
            const j = JURISDICTIONS.find((x) => x.code === code);
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-full border border-brand-ring bg-brand-soft py-0.5 pl-2.5 pr-1 text-xs text-brand"
              >
                {j?.name ?? code}
                <button
                  type="button"
                  aria-label={`Remove ${j?.name ?? code}`}
                  onClick={() => toggle(code)}
                  className="rounded-full p-0.5 hover:bg-brand-ring/40"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search states, provinces, territories or cities…"
          className="pl-9"
          aria-label="Search jurisdictions"
        />
      </div>

      {query.trim() === "" ? (
        <div className="flex gap-1.5">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCountry(c.code)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                country === c.code
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line text-ink-soft hover:border-brand-ring",
              )}
            >
              {c.flag} {c.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="max-h-64 overflow-y-auto rounded-lg border border-line">
        <ul className="divide-y divide-line">
          {results.map((j) => {
            const isSelected = selected.includes(j.code);
            return (
              <li key={j.code}>
                <button
                  type="button"
                  onClick={() => toggle(j.code)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
                >
                  <Check className={cn("size-4 shrink-0", isSelected ? "text-brand" : "invisible")} />
                  <span className="min-w-0 flex-1 truncate text-ink">{j.name}</span>
                  <span className="shrink-0 text-[11px] text-ink-muted">{LEVEL_LABEL[j.level]}</span>
                </button>
              </li>
            );
          })}
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-ink-muted">No jurisdiction matches that search.</li>
          ) : null}
        </ul>
      </div>
      <p className="text-xs text-ink-muted">
        {selected.length} of {max} selected. Include the federal level for each country you operate in — many
        requirements sit there rather than at state or provincial level.
      </p>
    </div>
  );
}
