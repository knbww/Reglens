"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { JURISDICTIONS } from "@/data/jurisdictions";
import { COMPLIANCE_TOPICS, COUNTRIES, INDUSTRIES } from "@/lib/taxonomy";

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

const SORTS = [
  { value: "relevance", label: "Relevance to my business" },
  { value: "newest", label: "Most recently updated" },
  { value: "effective", label: "Effective date" },
  { value: "importance", label: "Importance" },
];

const STATUSES = [
  { value: "IN_FORCE", label: "In force" },
  { value: "PENDING_EFFECTIVE", label: "Pending effective date" },
  { value: "PROPOSED", label: "Proposed" },
  { value: "AMENDED", label: "Amended" },
  { value: "REPEALED", label: "Repealed" },
];

export function PolicyFilters({ initial, resultCount }: { initial: PolicyFilterValues; resultCount: number }) {
  const router = useRouter();
  const params = useSearchParams();
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

  const jurisdictions = JURISDICTIONS.filter(
    (j) => values.country === "all" || !values.country || j.country === values.country,
  );

  const hasFilters =
    Boolean(values.q) ||
    [values.country, values.jurisdiction, values.industry, values.topic, values.status, values.relevance].some(
      (v) => v && v !== "all",
    ) ||
    Boolean(values.effectiveFrom);

  return (
    <div className="space-y-3 rounded-card border border-line bg-surface p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          apply({ q: values.q });
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={values.q}
            onChange={(e) => setValues((v) => ({ ...v, q: e.target.value }))}
            placeholder="Search titles, agencies, summaries and topics…"
            className="h-10 pl-9"
            aria-label="Search policies"
          />
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Country">
          <Select
            value={values.country || "all"}
            onChange={(e) => apply({ country: e.target.value, jurisdiction: "all" })}
          >
            <option value="all">All countries</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Jurisdiction">
          <Select value={values.jurisdiction || "all"} onChange={(e) => apply({ jurisdiction: e.target.value })}>
            <option value="all">All jurisdictions</option>
            {jurisdictions.map((j) => (
              <option key={j.code} value={j.code}>
                {j.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Industry">
          <Select value={values.industry || "all"} onChange={(e) => apply({ industry: e.target.value })}>
            <option value="all">All industries</option>
            {INDUSTRIES.map((i) => (
              <option key={i.key} value={i.key}>
                {i.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Regulatory topic">
          <Select value={values.topic || "all"} onChange={(e) => apply({ topic: e.target.value })}>
            <option value="all">All topics</option>
            {COMPLIANCE_TOPICS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status">
          <Select value={values.status || "all"} onChange={(e) => apply({ status: e.target.value })}>
            <option value="all">Any status</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Effective on or after">
          <Input
            type="date"
            value={values.effectiveFrom}
            onChange={(e) => apply({ effectiveFrom: e.target.value })}
          />
        </Field>

        <Field label="Relevance to my business">
          <Select value={values.relevance || "all"} onChange={(e) => apply({ relevance: e.target.value })}>
            <option value="all">Any relevance</option>
            <option value="high">Highly relevant only</option>
            <option value="medium">Possibly relevant and above</option>
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

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-xs text-ink-muted tabular">
          {resultCount} {resultCount === 1 ? "policy" : "policies"} matched
          {params.size > 0 ? " with the current filters" : ""}
        </p>
        {hasFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-3.5" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
