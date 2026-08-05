"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { JURISDICTIONS } from "@/data/jurisdictions";
import { formatDate } from "@/lib/format";
import { COMPLIANCE_TOPICS, COUNTRIES, INDUSTRIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export type PolicyFilterValues = {
  q: string;
  country: string;
  jurisdiction: string;
  industry: string;
  topic: string;
  status: string;
  effectiveFrom: string;
  relevance: string;
  sort: string;
};

type FilterKey = keyof PolicyFilterValues;

const SORTS = [
  { value: "relevance", label: "Relevance to my business" },
  { value: "newest", label: "Most recently updated" },
  { value: "effective", label: "Effective date" },
  { value: "importance", label: "Importance" },
];

const STATUS_LABEL: Record<string, string> = {
  IN_FORCE: "In force",
  PENDING_EFFECTIVE: "Pending effective date",
  PROPOSED: "Proposed",
  AMENDED: "Amended",
  REPEALED: "Repealed",
};

const RELEVANCE_LABEL: Record<string, string> = {
  high: "Only what applies to me",
  medium: "Possibly relevant and above",
};

/** Empty string and the sentinel "all" both mean "not filtering on this". */
function isSet(value: string): boolean {
  return Boolean(value) && value !== "all";
}

/**
 * The applied search, in words.
 *
 * Eight permanently visible selects made the page look like a database
 * console and still failed to say what you were actually looking at. The
 * controls now cover the three axes people reach for; everything else — a
 * country, an industry, a status, a date, a link followed in from another
 * screen — arrives through the URL and shows up here as a chip you can drop.
 */
function appliedFilters(values: PolicyFilterValues): { key: FilterKey; label: string }[] {
  const chips: { key: FilterKey; label: string }[] = [];

  if (values.q) chips.push({ key: "q", label: `“${values.q}”` });
  if (isSet(values.country)) {
    chips.push({
      key: "country",
      label: COUNTRIES.find((c) => c.code === values.country)?.name ?? values.country,
    });
  }
  if (isSet(values.jurisdiction)) {
    chips.push({
      key: "jurisdiction",
      label: JURISDICTIONS.find((j) => j.code === values.jurisdiction)?.name ?? values.jurisdiction,
    });
  }
  if (isSet(values.industry)) {
    chips.push({
      key: "industry",
      label: INDUSTRIES.find((i) => i.key === values.industry)?.label ?? values.industry,
    });
  }
  if (isSet(values.topic)) {
    chips.push({
      key: "topic",
      label: COMPLIANCE_TOPICS.find((t) => t.key === values.topic)?.label ?? values.topic,
    });
  }
  if (isSet(values.status)) {
    chips.push({ key: "status", label: STATUS_LABEL[values.status] ?? values.status });
  }
  if (values.effectiveFrom) {
    chips.push({ key: "effectiveFrom", label: `Effective from ${formatDate(values.effectiveFrom)}` });
  }
  if (isSet(values.relevance)) {
    chips.push({ key: "relevance", label: RELEVANCE_LABEL[values.relevance] ?? values.relevance });
  }

  return chips;
}

export function PolicyFilters({ initial }: { initial: PolicyFilterValues }) {
  const router = useRouter();
  const [values, setValues] = useState<PolicyFilterValues>(initial);

  // The URL is the source of truth. When it changes (back button, a link from
  // elsewhere in the app) re-sync during render rather than in an effect.
  const signature = JSON.stringify(initial);
  const [syncedSignature, setSyncedSignature] = useState(signature);
  if (syncedSignature !== signature) {
    setSyncedSignature(signature);
    setValues(initial);
  }

  function apply(next: Partial<PolicyFilterValues>) {
    const merged = { ...values, ...next };
    setValues(merged);

    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== "all") search.set(key, value);
    }
    // `sort` always has a value, so the query is never empty — the router does
    // not navigate when only the search string is removed from a matching path.
    router.push(`/policies?${search}`);
  }

  /**
   * Clearing removes every search param, and the App Router does not navigate
   * when the target only drops params from the path it is already on. A hard
   * navigation is the reliable way back to an unfiltered search.
   */
  function clearFilters() {
    window.location.assign("/policies");
  }

  const countryGroups = COUNTRIES.map((country) => ({
    code: country.code,
    name: country.name,
    items: JURISDICTIONS.filter((j) => j.country === country.code),
  })).filter(
    (group) =>
      group.items.length > 0 &&
      (!isSet(values.country) || group.code === values.country),
  );

  const chips = appliedFilters(values);
  const onlyMine = values.relevance === "high";

  /*
   * The search sits in the margin, stacked, so the records themselves get the
   * width. Eight controls across the top of a narrow column was the shape that
   * made this page read as a database console.
   */
  return (
    <div className="rise space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          apply({ q: values.q });
        }}
      >
        <Field label="Search policies" hint="Titles, agencies, summaries and topics.">
          <Input
            value={values.q}
            onChange={(e) => setValues((v) => ({ ...v, q: e.target.value }))}
            placeholder="Textile labelling, sales tax…"
            className="h-10"
          />
        </Field>
      </form>

      <div className="grid gap-3">
        <Field label="Jurisdiction">
          <Select
            value={values.jurisdiction || "all"}
            onChange={(e) => apply({ jurisdiction: e.target.value })}
          >
            <option value="all">Anywhere</option>
            {countryGroups.map((group) => (
              <optgroup key={group.code} label={group.name}>
                {group.items.map((j) => (
                  <option key={j.code} value={j.code}>
                    {j.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>

        <Field label="Regulatory topic">
          <Select value={values.topic || "all"} onChange={(e) => apply({ topic: e.target.value })}>
            <option value="all">Every topic</option>
            {COMPLIANCE_TOPICS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Sort by">
          <Select value={values.sort || "relevance"} onChange={(e) => apply({ sort: e.target.value })}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-line pt-3">
        {/* Colour never fills an area here: a live filter is stated in ink,
            underlined, and everything off it is quiet. */}
        <button
          type="button"
          aria-pressed={onlyMine}
          onClick={() => apply({ relevance: onlyMine ? "all" : "high" })}
          className={cn(
            "rounded-md px-2 py-1 text-[13px] transition-colors",
            onlyMine
              ? "font-medium text-ink underline decoration-ink decoration-1 underline-offset-4"
              : "text-ink-soft hover:bg-surface-muted hover:text-ink",
          )}
        >
          Only what applies to me
        </button>

        {chips
          .filter((chip) => chip.key !== "relevance" || !onlyMine)
          .map((chip) => (
            <button
              key={chip.key}
              type="button"
              aria-label={`Remove filter ${chip.label}`}
              onClick={() =>
                apply({ [chip.key]: chip.key === "q" || chip.key === "effectiveFrom" ? "" : "all" })
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-2 py-1 text-[13px] text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
            >
              {chip.label}
              <X aria-hidden className="size-3.5 text-ink-muted" />
            </button>
          ))}

        {chips.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
