import type { PolicyImportance, TaskPriority, TaskStatus } from "@prisma/client";

/**
 * The four rungs of the severity ramp, ordered by urgency.
 *
 * A single vocabulary shared by every surface: a colour in RegLens answers
 * "how urgent is this", never "which enum is this". Anything that needs to
 * express pressure maps into this type rather than inventing its own scale.
 */
export type Severity = "clear" | "watch" | "act" | "over";

export const SEVERITY_ORDER: Severity[] = ["clear", "watch", "act", "over"];

/** The more urgent of two rungs. */
export function worstSeverity(a: Severity, b: Severity): Severity {
  return SEVERITY_ORDER.indexOf(a) >= SEVERITY_ORDER.indexOf(b) ? a : b;
}

/** Days remaining → rung. Mirrors the thresholds the ramp is documented with. */
export function severityFromDays(days: number | null): Severity {
  if (days === null) return "clear";
  if (days < 0) return "over";
  if (days <= 14) return "act";
  if (days <= 45) return "watch";
  return "clear";
}

export function severityFromImportance(importance: PolicyImportance): Severity {
  return { LOW: "clear", MODERATE: "watch", HIGH: "act", CRITICAL: "over" }[importance] as Severity;
}

export function severityFromPriority(priority: TaskPriority): Severity {
  return { LOW: "clear", MEDIUM: "watch", HIGH: "act", URGENT: "over" }[priority] as Severity;
}

export function severityFromTaskStatus(status: TaskStatus): Severity {
  return { NOT_STARTED: "watch", IN_PROGRESS: "watch", COMPLETED: "clear", BLOCKED: "over" }[
    status
  ] as Severity;
}

/** Relevance score 0–100 → rung, for the five-segment meter. */
export function severityFromRelevance(score: number): Severity {
  if (score >= 80) return "over";
  if (score >= 60) return "act";
  if (score >= 35) return "watch";
  return "clear";
}

/* Class maps. Kept as complete literals so Tailwind can see every class. */

export const SEVERITY_BAR: Record<Severity, string> = {
  clear: "bg-sev-clear",
  watch: "bg-sev-watch",
  act: "bg-sev-act",
  over: "bg-sev-over",
};

export const SEVERITY_TEXT: Record<Severity, string> = {
  clear: "text-sev-clear",
  watch: "text-sev-watch",
  act: "text-sev-act",
  over: "text-sev-over",
};

export const SEVERITY_SOFT: Record<Severity, string> = {
  clear: "bg-sev-clear-soft text-sev-clear",
  watch: "bg-sev-watch-soft text-sev-watch",
  act: "bg-sev-act-soft text-sev-act",
  over: "bg-sev-over-soft text-sev-over",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  clear: "On track",
  watch: "Worth watching",
  act: "Needs action",
  over: "Overdue",
};
