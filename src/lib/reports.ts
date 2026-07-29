import { jurisdictionName } from "@/data/jurisdictions";
import { getBusinessSnapshot, getRecommendedPolicies } from "@/lib/queries";
import type { BusinessWithContext } from "@/lib/relevance";
import type { RiskFactor, RiskLevel } from "@/lib/risk";
import { countryName, DISCLAIMER, topicLabel } from "@/lib/taxonomy";

export type ComplianceReport = {
  generatedAt: string;
  business: {
    name: string;
    description: string;
    website: string | null;
    location: string;
    orgType: string;
    sizeBand: string;
    employeeCount: number;
    industry: string;
    priorities: string[];
    hasComplianceStaff: boolean;
    expansion: string | null;
  };
  jurisdictions: { operating: string[]; targets: string[] };
  risk: { score: number; level: RiskLevel; summary: string; factors: RiskFactor[] };
  profileCompletion: { percent: number; missing: string[] };
  relevantPolicies: {
    id: string;
    title: string;
    jurisdiction: string;
    agency: string;
    status: string;
    relevance: number;
    summary: string;
    sourceName: string;
    sourceUrl: string;
  }[];
  recentChanges: {
    title: string;
    policyTitle: string;
    type: string;
    importance: string;
    detectedAt: string;
    reviewState: string;
  }[];
  openTasks: {
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    progress: string;
    jurisdiction: string | null;
  }[];
  completedTasks: { title: string; completedAt: string | null }[];
  upcomingDeadlines: { title: string; dueDate: string; kind: string; daysRemaining: number }[];
  nextSteps: string[];
  disclaimer: string;
};

export async function buildComplianceReport(business: BusinessWithContext): Promise<ComplianceReport> {
  const snapshot = await getBusinessSnapshot(business);
  const recommended = await getRecommendedPolicies(business, 10);
  const profile = business.profile;

  const openTasks = snapshot.tasks.filter((t) => t.status !== "COMPLETED");
  const completed = snapshot.tasks.filter((t) => t.status === "COMPLETED");

  const nextSteps: string[] = [];
  const overdue = openTasks.filter((t) => t.dueDate && t.dueDate.getTime() < Date.now());
  if (overdue.length > 0) {
    nextSteps.push(`Clear ${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}, starting with "${overdue[0].title}".`);
  }
  const unreviewed = snapshot.updates.filter((u) => u.reviewState === "UNREVIEWED");
  if (unreviewed.length > 0) {
    nextSteps.push(`Review ${unreviewed.length} regulatory change${unreviewed.length === 1 ? "" : "s"} detected against policies you monitor.`);
  }
  if (snapshot.completion.percent < 90) {
    nextSteps.push(`Complete your business profile — missing: ${snapshot.completion.missing.slice(0, 3).join(", ")}.`);
  }
  if (profile?.plansExpansion && profile.targetRegion) {
    nextSteps.push(`Run a jurisdiction comparison before expanding into ${jurisdictionName(profile.targetRegion)}.`);
  }
  const topRecommendation = recommended.find((p) => p.relevance.band === "high");
  if (topRecommendation) {
    nextSteps.push(`Confirm your position on "${topRecommendation.title}" (${topRecommendation.agency}).`);
  }
  if (nextSteps.length === 0) {
    nextSteps.push("Keep monitoring in place and re-run this report after your next filing cycle.");
  }

  return {
    generatedAt: new Date().toISOString(),
    business: {
      name: business.name,
      description: business.description,
      website: business.website,
      location: [business.city, jurisdictionName(business.region), countryName(business.country)]
        .filter(Boolean)
        .join(", "),
      orgType: business.orgType,
      sizeBand: business.sizeBand,
      employeeCount: business.employeeCount,
      industry: profile?.industryLabel ?? "Not set",
      priorities: (profile?.compliancePriorities ?? []).map(topicLabel),
      hasComplianceStaff: profile?.hasComplianceStaff ?? false,
      expansion:
        profile?.plansExpansion && (profile.targetRegion || profile.targetCountry)
          ? `${profile.expansionActivity ?? "Expansion"} — ${[profile.targetCity, profile.targetRegion ? jurisdictionName(profile.targetRegion) : null, profile.targetCountry ? countryName(profile.targetCountry) : null].filter(Boolean).join(", ")}`
          : null,
    },
    jurisdictions: {
      operating: business.jurisdictions.filter((j) => j.role === "OPERATING").map((j) => jurisdictionName(j.jurisdictionCode)),
      targets: business.jurisdictions.filter((j) => j.role === "TARGET_EXPANSION").map((j) => jurisdictionName(j.jurisdictionCode)),
    },
    risk: {
      score: snapshot.risk.score,
      level: snapshot.risk.level,
      summary: snapshot.risk.summary,
      factors: snapshot.risk.factors,
    },
    profileCompletion: snapshot.completion,
    relevantPolicies: recommended.map((p) => ({
      id: p.id,
      title: p.title,
      jurisdiction: jurisdictionName(p.jurisdictionCode),
      agency: p.agency,
      status: p.status,
      relevance: p.relevance.score,
      summary: p.plainSummary,
      sourceName: p.sourceName,
      sourceUrl: p.sourceUrl,
    })),
    recentChanges: snapshot.updates.slice(0, 8).map((u) => ({
      title: u.title,
      policyTitle: u.policy.title,
      type: u.type,
      importance: u.importance,
      detectedAt: u.detectedAt.toISOString(),
      reviewState: u.reviewState,
    })),
    openTasks: openTasks.slice(0, 25).map((t) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      progress: `${t.checklist.filter((c) => c.done).length}/${t.checklist.length}`,
      jurisdiction: t.jurisdictionCode ? jurisdictionName(t.jurisdictionCode) : null,
    })),
    completedTasks: completed.slice(0, 15).map((t) => ({
      title: t.title,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    })),
    upcomingDeadlines: snapshot.reminders
      .filter((r) => !r.dismissed)
      .slice(0, 12)
      .map((r) => ({
        title: r.title,
        dueDate: r.dueDate.toISOString(),
        kind: r.kind,
        daysRemaining: Math.ceil((r.dueDate.getTime() - Date.now()) / 86_400_000),
      })),
    nextSteps,
    disclaimer: DISCLAIMER,
  };
}
