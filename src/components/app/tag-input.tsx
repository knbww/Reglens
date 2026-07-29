"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/field";

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
      <div className="flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-full border border-brand-ring bg-brand-soft py-0.5 pl-2.5 pr-1 text-xs text-brand"
          >
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => onChange(values.filter((v) => v !== value))}
              className="rounded-full p-0.5 hover:bg-brand-ring/40"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
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
        <div className="flex flex-wrap gap-1.5">
          {remaining.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-soft transition-colors hover:border-brand-ring hover:text-brand"
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
