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

/**
 * Picks the places a business answers to.
 *
 * A long list, so it is a list: hairline rows, hover ground, a check where the
 * eye already is. What you have chosen sits above the search as plain text,
 * because that is the part you re-read.
 */
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
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((code) => {
            const j = JURISDICTIONS.find((x) => x.code === code);
            return (
              <li
                key={code}
                className="inline-flex items-center gap-1 rounded-md bg-surface-muted py-1 pl-2.5 pr-1 text-[13px] text-ink"
              >
                {j?.name ?? code}
                <button
                  type="button"
                  aria-label={`Remove ${j?.name ?? code}`}
                  onClick={() => toggle(code)}
                  className="rounded p-0.5 text-ink-muted transition-colors hover:text-ink"
                >
                  <X className="size-3" />
                </button>
              </li>
            );
          })}
        </ul>
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
        <p className="flex flex-wrap items-baseline gap-x-4 text-[13px]">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCountry(c.code)}
              aria-pressed={country === c.code}
              className={cn(
                "underline-offset-4 transition-colors",
                country === c.code
                  ? "font-medium text-ink underline decoration-ink"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {c.name}
            </button>
          ))}
        </p>
      ) : null}

      <div className="max-h-64 overflow-y-auto border-y border-line">
        <ul>
          {results.map((j) => {
            const isSelected = selected.includes(j.code);
            return (
              <li key={j.code} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggle(j.code)}
                  aria-pressed={isSelected}
                  className="lift flex w-full items-center gap-2.5 px-2 py-2 text-left text-[14px]"
                >
                  <Check className={cn("size-4 shrink-0", isSelected ? "text-ink" : "invisible")} />
                  <span className={cn("min-w-0 flex-1 truncate", isSelected ? "text-ink" : "text-ink-soft")}>
                    {j.name}
                  </span>
                  <span className="shrink-0 text-xs text-ink-muted">{LEVEL_LABEL[j.level]}</span>
                </button>
              </li>
            );
          })}
          {results.length === 0 ? (
            <li className="px-2 py-6 text-[14px] text-ink-muted">No jurisdiction matches that search.</li>
          ) : null}
        </ul>
      </div>

      <p className="text-[13px] leading-6 text-ink-muted">
        <span className="tabular">
          {selected.length} of {max}
        </span>{" "}
        selected. Include the federal level for each country you operate in — many requirements sit there
        rather than at state or provincial level.
      </p>
    </div>
  );
}
