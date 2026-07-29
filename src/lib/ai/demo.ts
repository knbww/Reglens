import type { Policy } from "@prisma/client";

import { jurisdictionName } from "@/data/jurisdictions";
import type { PolicyDeadline, PolicyRequirement } from "@/data/policies";
import { formatPolicyDeadlineDate, isEventRelativeDeadline } from "@/lib/format";
import type { BusinessWithContext } from "@/lib/relevance";
import { scoreRelevance } from "@/lib/relevance";
import { countryName, topicLabel } from "@/lib/taxonomy";

import type { AnalystAnswer } from "./schema";

const PRIORITY_BY_IMPORTANCE = {
  CRITICAL: "URGENT",
  HIGH: "HIGH",
  MODERATE: "MEDIUM",
  LOW: "LOW",
} as const;

function sentence(parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

const GREETINGS =
  /^(hi|hey+|hello+|yo|hiya|howdy|greetings|good\s+(morning|afternoon|evening|day)|sup|what'?s\s+up|thanks?|thank\s+you|ty|cheers|ok(ay)?|cool|nice|great|bye|goodbye|see\s+you|test(ing)?|ping)\b/i;

/**
 * True when the message is a greeting, pleasantry or otherwise carries no
 * regulatory question — the cases where composing a full analysis would be
 * noise rather than help.
 */
export function isSmallTalk(question: string): boolean {
  const text = question.trim().replace(/[!.?,]+$/g, "");
  if (text.length === 0) return true;

  const words = text.split(/\s+/);
  // A greeting on its own, or a greeting followed by very little else.
  if (GREETINGS.test(text) && words.length <= 4) return true;

  // No question and too short to carry one.
  if (words.length <= 2 && !text.includes("?")) return true;

  return false;
}

const REGULATORY_HINTS =
  /\b(regulat|complian|polic|law|legal|rule|requirement|require|oblig|permit|licen[cs]|certif|register|registration|file|filing|deadline|renew|tax|duty|duties|customs|import|export|tariff|label|safety|privacy|data|employ|inspect|audit|apply|applies|need|must|should|risk|fine|penalt|jurisdiction|state|province|federal|agency|expand|expansion)\b/i;

/**
 * Whether a message is asking about the business's regulatory position. Used to
 * stop a model from brushing off a short but genuine question — "does this
 * apply to me?" is vague, not small talk.
 */
export function looksRegulatory(question: string): boolean {
  return REGULATORY_HINTS.test(question);
}

/**
 * Reply used when no model is available — either no API key, or the provider
 * failed. Kept to a single short line: without a model this cannot be genuinely
 * conversational, so it should at least be brief and answer the shape of the
 * message rather than recite a pitch.
 */
function buildConversationalAnswer(business: BusinessWithContext, question: string): AnalystAnswer {
  const text = question.trim();
  const isThanks = /^(thanks?|thank\s+you|ty|cheers)\b/i.test(text);
  const isFarewell = /^(bye|goodbye|see\s+you)\b/i.test(text);
  const isGreeting = /^(hi|hey+|hello+|yo|hiya|howdy|greetings|good\s+(morning|afternoon|evening|day))\b/i.test(text);

  const reply = isThanks
    ? "Anytime."
    : isFarewell
      ? "Speak soon."
      : isGreeting
        ? `Hello. What would you like to know about the rules that apply to ${business.name}?`
        : "I'm not sure what you're asking — could you give me a bit more to go on?";

  return {
    title: isThanks ? "Anytime" : isGreeting ? "Hello" : "Say a bit more",
    plainExplanation: reply,
    whyItMatters: "",
    keyImpacts: [],
    risks: [],
    recommendedActions: [],
    deadlines: [],
    jurisdictions: [],
    sources: [],
    confidence: "high",
  };
}

/**
 * Deterministic analysis assembled from the business profile and the retrieved
 * policy records. Used when no AI provider key is configured, and as the
 * fallback when a configured provider fails.
 *
 * It is not a language model and does not pretend to be — it composes the same
 * structured answer from data the application already holds, so every screen,
 * action and downstream flow keeps working in demo mode.
 */
export function buildDemoAnswer({
  business,
  policies,
  question,
  focusPolicy,
}: {
  business: BusinessWithContext;
  policies: Policy[];
  question: string;
  focusPolicy?: Policy | null;
}): AnalystAnswer {
  if (isSmallTalk(question)) return buildConversationalAnswer(business, question);

  const profile = business.profile;
  const primary = focusPolicy ?? policies[0] ?? null;
  const supporting = policies.filter((p) => p.id !== primary?.id).slice(0, 4);

  const operating = business.jurisdictions
    .filter((j) => j.role === "OPERATING")
    .map((j) => jurisdictionName(j.jurisdictionCode));
  const targets = business.jurisdictions
    .filter((j) => j.role === "TARGET_EXPANSION")
    .map((j) => jurisdictionName(j.jurisdictionCode));

  const activityPhrases: string[] = [];
  if (profile?.importsProducts)
    activityPhrases.push(
      `you import products${profile.importCountries.length ? ` from ${profile.importCountries.join(" and ")}` : ""}`,
    );
  if (profile?.sellsCrossBorder) activityPhrases.push("you sell across state or national borders");
  if (profile?.employsStaff) activityPhrases.push("you employ staff");
  if (profile?.handlesCustomerData) activityPhrases.push("you handle customer data");
  if (profile?.physicalLocations) activityPhrases.push("you operate physical locations");
  if (profile?.requiresLicenses) activityPhrases.push("your work needs licences or certifications");

  if (!primary) {
    return {
      title: `No matching policy records for ${business.name}`,
      plainExplanation:
        "RegLens could not find a policy record in the current dataset that matches this question and your jurisdictions. The MVP dataset covers a representative set of North American requirements rather than every rule in force.",
      whyItMatters: sentence([
        `Your profile records ${operating.length} operating jurisdiction${operating.length === 1 ? "" : "s"}`,
        operating.length ? `(${operating.join(", ")})` : "",
        "so a gap here usually means the topic sits outside the seeded dataset rather than outside your obligations.",
      ]),
      keyImpacts: ["No requirement could be confirmed from the available records."],
      risks: [
        {
          label: "Unverified area",
          detail: "Treat this topic as unchecked until you confirm it with the responsible authority.",
          severity: "moderate",
        },
      ],
      recommendedActions: [
        {
          title: "Confirm this topic with the responsible authority",
          detail: "Contact the agency that regulates this area in your jurisdiction and record what they tell you.",
          priority: "MEDIUM",
          dueInDays: 21,
          checklist: ["Identify the responsible agency", "Record the answer in RegLens"],
        },
      ],
      deadlines: [],
      jurisdictions: operating,
      sources: [],
      confidence: "low",
    };
  }

  const requirements = (primary.requirements as unknown as PolicyRequirement[]) ?? [];
  const deadlines = (primary.deadlines as unknown as PolicyDeadline[]) ?? [];
  const relevance = scoreRelevance(primary, business);

  const topicWords = primary.topicTags.map(topicLabel).join(", ");

  const plainExplanation = sentence([
    `${primary.title} is administered by ${primary.agency} and applies in ${jurisdictionName(primary.jurisdictionCode)}.`,
    primary.plainSummary,
    supporting.length
      ? `Related records in the same area include ${supporting.map((p) => p.title).join("; ")}.`
      : null,
  ]);

  const whyItMatters = sentence([
    `${business.name} is a ${profile?.industryLabel.toLowerCase() ?? "business"} based in ${[business.city, jurisdictionName(business.region)].filter(Boolean).join(", ")}.`,
    activityPhrases.length ? `RegLens matched this record because ${activityPhrases.join(", ")}.` : null,
    relevance.reasons.length ? `Specifically: ${relevance.reasons.join("; ")}.` : null,
    targets.length
      ? `It also matters for your expansion into ${targets.join(", ")}, where equivalent requirements may differ.`
      : null,
  ]);

  const keyImpacts: string[] = [];
  for (const r of requirements.slice(0, 5)) keyImpacts.push(`${r.title} — ${r.detail}`);
  if (keyImpacts.length === 0) keyImpacts.push(primary.plainSummary);
  if (primary.affectedOrgs.length > 0) {
    keyImpacts.push(`Applies to: ${primary.affectedOrgs.slice(0, 2).join("; ")}`);
  }

  const risks = primary.consequences.slice(0, 4).map((c) => ({
    label: c,
    detail: `Consequence recorded against ${primary.title} (${primary.agency}).`,
    severity: (primary.importance === "CRITICAL"
      ? "high"
      : primary.importance === "HIGH"
        ? "high"
        : "moderate") as "low" | "moderate" | "high",
  }));

  if (profile && !profile.hasComplianceStaff) {
    risks.push({
      label: "No dedicated compliance owner",
      detail:
        "You told us there is no compliance specialist, so this requirement needs a named owner and a date or it will slip.",
      severity: "moderate",
    });
  }

  const recommendedActions = requirements.slice(0, 4).map((r, index) => ({
    title: r.title,
    detail: r.detail,
    priority: PRIORITY_BY_IMPORTANCE[primary.importance] as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    dueInDays: 14 + index * 14,
    checklist: [
      `Confirm who owns "${r.title}" internally`,
      "Gather the supporting documents",
      `Record the outcome against ${primary.agency}`,
    ],
  }));

  if (recommendedActions.length === 0) {
    recommendedActions.push({
      title: `Review ${primary.title} against your operations`,
      detail: primary.plainSummary,
      priority: "MEDIUM",
      dueInDays: 30,
      checklist: ["Read the source record", "Note what applies to you"],
    });
  }

  if (targets.length > 0) {
    recommendedActions.push({
      title: `Compare this requirement against ${targets[0]}`,
      detail:
        "Before you start operating there, check whether the equivalent requirement differs in scope, timing or paperwork.",
      priority: "MEDIUM",
      dueInDays: 45,
      checklist: [`Open the jurisdiction comparison for ${topicWords || "this topic"}`, "Note the differences"],
    });
  }

  const answerDeadlines = deadlines
    .filter((d) => !isEventRelativeDeadline(d.date))
    .slice(0, 5)
    .map((d) => ({
      label: d.label,
      date: formatPolicyDeadlineDate(d.date),
      description: d.description,
    }));

  for (const d of deadlines.filter((x) => isEventRelativeDeadline(x.date)).slice(0, 3)) {
    answerDeadlines.push({
      label: d.label,
      date: formatPolicyDeadlineDate(d.date),
      description: d.description,
    });
  }

  const sources = [primary, ...supporting].map((p) => ({
    policyId: p.id,
    title: p.title,
    sourceName: p.sourceName,
    sourceUrl: p.sourceUrl,
  }));

  const jurisdictions = Array.from(
    new Set([
      jurisdictionName(primary.jurisdictionCode),
      countryName(primary.country),
      ...operating.slice(0, 3),
    ]),
  );

  const title = question.trim().length > 0
    ? `${primary.title} — what it means for ${business.name}`
    : `${primary.title} — summary for ${business.name}`;

  return {
    title: title.slice(0, 160),
    plainExplanation,
    whyItMatters,
    keyImpacts: keyImpacts.slice(0, 8),
    risks: risks.slice(0, 8),
    recommendedActions: recommendedActions.slice(0, 10),
    deadlines: answerDeadlines,
    jurisdictions,
    sources,
    confidence: relevance.band === "high" ? "medium" : "low",
  };
}
