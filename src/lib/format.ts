import { differenceInCalendarDays, format, formatDistanceToNowStrict, isValid } from "date-fns";

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (!isValid(date)) return "—";
  return format(date, "d MMM yyyy");
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (!isValid(date)) return "—";
  return format(date, "d MMM yyyy, HH:mm");
}

export function relativeTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (!isValid(date)) return "—";
  return `${formatDistanceToNowStrict(date)} ago`;
}

/** Whole days from today until `value`. Negative when in the past. */
export function daysUntil(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (!isValid(date)) return null;
  return differenceInCalendarDays(date, new Date());
}

/**
 * Whether a date is still in the future. Lives here rather than inline so
 * components stay free of direct clock reads during render.
 */
export function isFuture(value: Date | string | null | undefined): boolean {
  if (!value) return false;
  const date = typeof value === "string" ? new Date(value) : value;
  if (!isValid(date)) return false;
  return date.getTime() > new Date().getTime();
}

export function dueLabel(value: Date | string | null | undefined): string {
  const days = daysUntil(value);
  if (days === null) return "No due date";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days} days remaining`;
}

/**
 * Policy deadlines can be event-relative rather than a calendar date
 * (for example "10 working days from release"). Those are stored as
 * `REL:+n` and rendered as text.
 */
export function formatPolicyDeadlineDate(raw: string): string {
  if (raw.startsWith("REL:")) {
    const days = Number(raw.replace("REL:", ""));
    if (Number.isNaN(days)) return "Event-driven";
    if (days === 0) return "At the triggering event";
    return `${days} day${days === 1 ? "" : "s"} after the triggering event`;
  }
  return formatDate(raw);
}

export function isEventRelativeDeadline(raw: string): boolean {
  return raw.startsWith("REL:");
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bAi\b/g, "AI");
}

export function enumLabel(value: string): string {
  return titleCase(value.toLowerCase());
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}
