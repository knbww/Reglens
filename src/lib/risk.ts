import type { PolicyUpdate, Reminder, Task } from "@prisma/client";

import { daysUntil } from "./format";
import type { BusinessWithContext } from "./relevance";

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type RiskFactor = {
  label: string;
  detail: string;
  /** Positive numbers increase risk. */
  points: number;
  direction: "increase" | "decrease";
};

export type RiskAssessment = {
  score: number; // 0–100, higher means more exposure
  level: RiskLevel;
  factors: RiskFactor[];
  summary: string;
};

export type RiskInput = {
  business: BusinessWithContext;
  tasks: Pick<Task, "status" | "dueDate" | "priority">[];
  reminders: Pick<Reminder, "dueDate" | "dismissed">[];
  unreviewedUpdates: Pick<PolicyUpdate, "importance">[];
  monitoredCount: number;
  profileCompletion: number; // 0–100
};

/**
 * A transparent, rules-based exposure indicator — not a legal judgement.
 * Every contribution is surfaced to the user so the number can be argued with.
 */
export function assessRisk(input: RiskInput): RiskAssessment {
  const { business, tasks, reminders, unreviewedUpdates, monitoredCount, profileCompletion } = input;
  const profile = business.profile;
  const factors: RiskFactor[] = [];
  let score = 12; // baseline: some exposure always exists

  // --- Overdue work --------------------------------------------------------
  const openTasks = tasks.filter((t) => t.status !== "COMPLETED");
  const overdue = openTasks.filter((t) => {
    const d = daysUntil(t.dueDate);
    return d !== null && d < 0;
  });
  if (overdue.length > 0) {
    const points = Math.min(26, 9 + overdue.length * 6);
    score += points;
    factors.push({
      label: `${overdue.length} overdue compliance task${overdue.length === 1 ? "" : "s"}`,
      detail: "Work that has passed its planned date is the strongest signal of exposure.",
      points,
      direction: "increase",
    });
  }

  const urgentOpen = openTasks.filter((t) => t.priority === "URGENT" || t.priority === "HIGH");
  if (urgentOpen.length > 2) {
    const points = Math.min(12, urgentOpen.length * 2);
    score += points;
    factors.push({
      label: `${urgentOpen.length} high-priority tasks still open`,
      detail: "A backlog of high-priority items suggests obligations are outpacing capacity.",
      points,
      direction: "increase",
    });
  }

  // --- Near-term deadlines -------------------------------------------------
  const soon = reminders.filter((r) => {
    if (r.dismissed) return false;
    const d = daysUntil(r.dueDate);
    return d !== null && d >= 0 && d <= 30;
  });
  if (soon.length > 0) {
    const points = Math.min(14, soon.length * 5);
    score += points;
    factors.push({
      label: `${soon.length} deadline${soon.length === 1 ? "" : "s"} inside 30 days`,
      detail: "Near-term filing and renewal dates leave little room to recover from a miss.",
      points,
      direction: "increase",
    });
  }

  // --- Unreviewed regulatory change ---------------------------------------
  const seriousUpdates = unreviewedUpdates.filter(
    (u) => u.importance === "HIGH" || u.importance === "CRITICAL",
  );
  if (seriousUpdates.length > 0) {
    const points = Math.min(18, seriousUpdates.length * 5);
    score += points;
    factors.push({
      label: `${seriousUpdates.length} significant change${seriousUpdates.length === 1 ? "" : "s"} not yet reviewed`,
      detail: "Changes to policies you monitor have not been marked as reviewed.",
      points,
      direction: "increase",
    });
  }

  // --- Structural factors from the business profile ------------------------
  if (profile && !profile.hasComplianceStaff) {
    score += 6;
    factors.push({
      label: "No dedicated compliance staff",
      detail: "Obligations are handled alongside other responsibilities, which raises the chance of a miss.",
      points: 6,
      direction: "increase",
    });
  }

  if (profile && (profile.reviewFrequency === "rarely" || profile.trackingMethod === "nothing_formal")) {
    score += 8;
    factors.push({
      label: "Regulatory changes are reviewed infrequently",
      detail: "You told us reviews happen rarely or that nothing formal tracks them today.",
      points: 8,
      direction: "increase",
    });
  }

  if (profile?.plansExpansion) {
    const days = daysUntil(profile.expansionDate);
    if (days !== null && days <= 180) {
      const points = days <= 90 ? 12 : 7;
      score += points;
      factors.push({
        label: `Expansion planned in ${days <= 0 ? "the coming weeks" : `${days} days`}`,
        detail: `Entering ${profile.targetRegion ?? profile.targetCountry ?? "a new jurisdiction"} adds obligations before revenue starts.`,
        points,
        direction: "increase",
      });
    }
  }

  const jurisdictionCount = new Set(business.jurisdictions.map((j) => j.jurisdictionCode)).size;
  if (jurisdictionCount >= 5) {
    const points = Math.min(10, jurisdictionCount);
    score += points;
    factors.push({
      label: `${jurisdictionCount} jurisdictions in scope`,
      detail: "Each additional jurisdiction adds its own filings, thresholds and renewal dates.",
      points,
      direction: "increase",
    });
  }

  // --- Mitigating factors --------------------------------------------------
  if (monitoredCount >= 3) {
    const points = Math.min(10, 4 + monitoredCount);
    score -= points;
    factors.push({
      label: `${monitoredCount} items actively monitored`,
      detail: "Monitoring means changes reach you before they become surprises.",
      points,
      direction: "decrease",
    });
  }

  const completedShare =
    tasks.length === 0 ? 0 : tasks.filter((t) => t.status === "COMPLETED").length / tasks.length;
  if (completedShare >= 0.4) {
    const points = Math.round(completedShare * 12);
    score -= points;
    factors.push({
      label: `${Math.round(completedShare * 100)}% of planned actions complete`,
      detail: "A healthy completion rate lowers the practical exposure carried at any moment.",
      points,
      direction: "decrease",
    });
  }

  if (profileCompletion >= 90) {
    score -= 5;
    factors.push({
      label: "Business profile is complete",
      detail: "A complete profile lets RegLens rank obligations against how you actually operate.",
      points: 5,
      direction: "decrease",
    });
  } else if (profileCompletion < 60) {
    score += 8;
    factors.push({
      label: "Business profile is incomplete",
      detail: "Missing profile details mean relevant requirements may not have surfaced yet.",
      points: 8,
      direction: "increase",
    });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const level: RiskLevel =
    finalScore >= 70 ? "Critical" : finalScore >= 50 ? "High" : finalScore >= 28 ? "Moderate" : "Low";

  const summary =
    level === "Critical"
      ? "Several obligations are overdue or unreviewed. Clearing the overdue items should come first."
      : level === "High"
        ? "There is meaningful exposure. Focus on overdue work and the deadlines inside 30 days."
        : level === "Moderate"
          ? "Nothing is on fire, but a few items need attention before they become urgent."
          : "Your tracked obligations are in reasonable shape. Keep monitoring in place.";

  return {
    score: finalScore,
    level,
    // Largest contributions first — that is what a user wants to act on.
    factors: factors.sort((a, b) => b.points - a.points),
    summary,
  };
}

export const RISK_LEVEL_TONE: Record<RiskLevel, "success" | "warning" | "danger" | "critical"> = {
  Low: "success",
  Moderate: "warning",
  High: "danger",
  Critical: "critical",
};

/**
 * Profile completion drives both the dashboard prompt and a risk factor, so it
 * lives next to the risk model.
 */
export function profileCompletion(business: BusinessWithContext): { percent: number; missing: string[] } {
  const p = business.profile;
  const checks: { ok: boolean; label: string }[] = [
    { ok: business.name.trim().length > 0, label: "Company name" },
    { ok: business.description.trim().length > 20, label: "Business description" },
    { ok: business.city.trim().length > 0, label: "City" },
    { ok: business.region.trim().length > 0, label: "State, province or region" },
    { ok: business.employeeCount > 0, label: "Number of employees" },
    { ok: Boolean(business.website), label: "Website" },
    { ok: Boolean(p && p.industryKey !== "general_small_business"), label: "Specific industry" },
    { ok: Boolean(p && (p.productsSold.length > 0 || p.servicesProvided.length > 0)), label: "Products or services" },
    { ok: Boolean(p && p.compliancePriorities.length >= 2), label: "Compliance priorities" },
    { ok: business.jurisdictions.some((j) => j.role === "OPERATING"), label: "Operating jurisdictions" },
    { ok: Boolean(p && p.topConcern.trim().length > 10), label: "Your main compliance concern" },
    { ok: Boolean(p && p.trackingMethod !== "nothing_formal"), label: "How compliance is tracked today" },
  ];

  const done = checks.filter((c) => c.ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}
