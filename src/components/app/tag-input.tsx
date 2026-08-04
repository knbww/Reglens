"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/field";

/**
 * A short list of free-text values.
 *
 * The values are the content, so they carry no border and no colour of their
 * own — a half-step of ground is enough to show where one ends and the next
 * begins. Suggestions read as text you can click, not as another row of pills.
 */
export function TagInput({
  values,
  onChange,
  placeholder,
  suggestions = [],
  id,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  id?: string;
}) {
  const [draft, setDraft] = useState("");

  function add(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, trimmed]);
    setDraft("");
  }

  const remaining = suggestions.filter(
    (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <li
              key={value}
              className="inline-flex items-center gap-1 rounded-md bg-surface-muted py-1 pl-2.5 pr-1 text-[13px] text-ink"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onChange(values.filter((v) => v !== value))}
                className="rounded p-0.5 text-ink-muted transition-colors hover:text-ink"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Input
        id={id}
        value={draft}
        placeholder={placeholder ?? "Type and press Enter"}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
      />

      {remaining.length > 0 ? (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] text-ink-muted">
          {remaining.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
            >
              {s}
            </button>
          ))}
        </p>
      ) : null}
    </div>
  );
}
