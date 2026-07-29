import type {
  PolicyImportance,
  PolicyStatus,
  TaskPriority,
  TaskStatus,
  UpdateType,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { enumLabel } from "@/lib/format";
import type { RelevanceBand } from "@/lib/relevance";
import type { RiskLevel } from "@/lib/risk";

export function PolicyStatusBadge({ status }: { status: PolicyStatus }) {
  const tone = {
    IN_FORCE: "success",
    PROPOSED: "info",
    PENDING_EFFECTIVE: "warning",
    AMENDED: "warning",
    REPEALED: "neutral",
  }[status] as "success" | "info" | "warning" | "neutral";
  const label = {
    IN_FORCE: "In force",
    PROPOSED: "Proposed",
    PENDING_EFFECTIVE: "Pending effective date",
    AMENDED: "Amended",
    REPEALED: "Repealed",
  }[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function ImportanceBadge({ importance }: { importance: PolicyImportance }) {
  const tone = {
    LOW: "neutral",
    MODERATE: "info",
    HIGH: "warning",
    CRITICAL: "critical",
  }[importance] as "neutral" | "info" | "warning" | "critical";
  return <Badge tone={tone}>{enumLabel(importance)} importance</Badge>;
}

export function RelevanceBadge({ band, score }: { band: RelevanceBand; score?: number }) {
  const tone = { high: "success", medium: "warning", low: "neutral" }[band] as
    | "success"
    | "warning"
    | "neutral";
  const label = { high: "Highly relevant", medium: "Possibly relevant", low: "Background" }[band];
  return (
    <Badge tone={tone}>
      {label}
      {score === undefined ? null : <span className="tabular opacity-70">· {score}</span>}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const tone = {
    NOT_STARTED: "neutral",
    IN_PROGRESS: "info",
    COMPLETED: "success",
    BLOCKED: "danger",
  }[status] as "neutral" | "info" | "success" | "danger";
  const label = {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    BLOCKED: "Blocked",
  }[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const tone = {
    LOW: "neutral",
    MEDIUM: "info",
    HIGH: "warning",
    URGENT: "critical",
  }[priority] as "neutral" | "info" | "warning" | "critical";
  return <Badge tone={tone}>{enumLabel(priority)}</Badge>;
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const tone = {
    Low: "success",
    Moderate: "warning",
    High: "danger",
    Critical: "critical",
  }[level] as "success" | "warning" | "danger" | "critical";
  return <Badge tone={tone}>{level} risk</Badge>;
}

export const UPDATE_TYPE_LABEL: Record<UpdateType, string> = {
  NEW_POLICY: "New policy",
  UPDATED_POLICY: "Updated policy",
  EFFECTIVE_DATE_CHANGED: "Effective date changed",
  REQUIREMENT_CHANGED: "Requirement changed",
  DEADLINE_APPROACHING: "Deadline approaching",
  REPEALED_OR_REPLACED: "Repealed or replaced",
};

export function UpdateTypeBadge({ type }: { type: UpdateType }) {
  const tone = {
    NEW_POLICY: "info",
    UPDATED_POLICY: "info",
    EFFECTIVE_DATE_CHANGED: "warning",
    REQUIREMENT_CHANGED: "warning",
    DEADLINE_APPROACHING: "danger",
    REPEALED_OR_REPLACED: "neutral",
  }[type] as "info" | "warning" | "danger" | "neutral";
  return <Badge tone={tone}>{UPDATE_TYPE_LABEL[type]}</Badge>;
}

export function SampleDataBadge() {
  return (
    <Badge tone="neutral" title="Illustrative record summarising a real framework — not a live feed from the agency.">
      Sample data
    </Badge>
  );
}

export function DueBadge({ days }: { days: number | null }) {
  if (days === null) return <Badge tone="neutral">No due date</Badge>;
  if (days < 0)
    return <Badge tone="critical">{Math.abs(days)} day{Math.abs(days) === 1 ? "" : "s"} overdue</Badge>;
  if (days === 0) return <Badge tone="danger">Due today</Badge>;
  if (days <= 14) return <Badge tone="warning">{days} days left</Badge>;
  return <Badge tone="neutral">{days} days left</Badge>;
}
