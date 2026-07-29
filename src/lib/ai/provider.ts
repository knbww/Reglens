import type { Policy } from "@prisma/client";

import type { BusinessWithContext } from "@/lib/relevance";

import { buildDemoAnswer, isSmallTalk, looksRegulatory } from "./demo";
import { buildLightPrompt, buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import { analystAnswerSchema, ANALYST_JSON_SCHEMA, type AnalystResult } from "./schema";

export type ProviderName = "groq" | "demo";

export type AnalystRequest = {
  business: BusinessWithContext;
  policies: Policy[];
  question: string;
  focusPolicy?: Policy | null;
  history: { role: "USER" | "ASSISTANT"; content: string }[];
};

/** Default Groq model. Override with GROQ_MODEL. */
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

export function groqModel(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

/**
 * Resolves which provider to use.
 *
 * With `GROQ_API_KEY` set, analyses come from Groq. Without it, the
 * deterministic demo analyst is used — the product stays fully usable and the
 * UI labels the answer as demo output.
 */
export function resolveProvider(): ProviderName {
  return process.env.GROQ_API_KEY?.trim() ? "groq" : "demo";
}

export function isAiConfigured(): boolean {
  return resolveProvider() !== "demo";
}

/** Pulls the first JSON object out of a model response that may include prose. */
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("Model response contained no JSON object");
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

/**
 * True when the message carries no regulatory question, so the model can be
 * asked to reply without the policy corpus attached.
 */
function isChitChat(question: string): boolean {
  return isSmallTalk(question) && !looksRegulatory(question);
}

async function callGroq(request: AnalystRequest): Promise<unknown> {
  const { default: Groq } = await import("groq-sdk");
  const chitChat = isChitChat(request.question);

  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
    // A full analysis genuinely takes a while to generate, so give it room —
    // timing out early only buys a retry that costs more than waiting. A
    // conversational reply should be near-instant, so fail fast and fall back.
    timeout: chitChat ? 8_000 : Number(process.env.GROQ_TIMEOUT_MS ?? 35_000),
    maxRetries: chitChat ? 1 : 0,
  });

  const response = await client.chat.completions.create({
    model: groqModel(),
    // A little more freedom for conversation so replies do not read as canned;
    // tighter for analysis, where consistency matters more than variety.
    temperature: chitChat ? 0.8 : 0.2,
    // Reasoning models spend part of this budget thinking before they emit the
    // JSON, so leave headroom — running out mid-document wastes the whole call.
    max_tokens: chitChat ? 1_000 : 4_000,
    // JSON object mode is supported across Groq's chat models; the exact shape
    // is pinned by the schema in the prompt and enforced by Zod on the way out.
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\nReturn a single JSON object matching this JSON Schema exactly:\n${JSON.stringify(
          ANALYST_JSON_SCHEMA,
        )}`,
      },
      { role: "user", content: chitChat ? buildLightPrompt(request) : buildUserPrompt(request) },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("Groq returned an empty response");
  return extractJson(text);
}

/**
 * Runs the analysis. Any provider failure degrades to the demo analyst rather
 * than showing the user an error page — the answer is labelled accordingly.
 */
export async function runAnalyst(request: AnalystRequest): Promise<AnalystResult> {
  const provider = resolveProvider();

  if (provider === "demo") {
    return { answer: buildDemoAnswer(request), provider: "demo" };
  }

  try {
    const raw = await callGroq(request);
    const parsed = analystAnswerSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Response failed validation: ${parsed.error.issues[0]?.message ?? "unknown"}`);
    }

    // Guard against a genuine question being brushed off with a one-liner and
    // nothing to back it up. A short answer is fine; a short answer with no
    // impacts, actions or sources to a regulatory question is not.
    const answered = parsed.data;
    const isBareReply =
      answered.keyImpacts.length === 0 &&
      answered.recommendedActions.length === 0 &&
      answered.sources.length === 0 &&
      answered.plainExplanation.trim().length < 140;
    if (isBareReply && !isSmallTalk(request.question) && looksRegulatory(request.question)) {
      throw new Error("gave no substance for a regulatory question, so the analysis was composed locally");
    }

    // Keep source links honest: only policies we actually supplied may be cited.
    const allowed = new Map(request.policies.map((p) => [p.id, p]));
    if (request.focusPolicy) allowed.set(request.focusPolicy.id, request.focusPolicy);
    const answer = {
      ...parsed.data,
      sources: parsed.data.sources
        .filter((s) => allowed.has(s.policyId))
        .map((s) => {
          const policy = allowed.get(s.policyId)!;
          return {
            policyId: policy.id,
            title: policy.title,
            sourceName: policy.sourceName,
            sourceUrl: policy.sourceUrl,
          };
        }),
    };

    return { answer, provider };
  } catch (error) {
    return {
      answer: buildDemoAnswer(request),
      provider: "demo",
      degradedReason: `Groq request failed: ${(error as Error).message}`,
    };
  }
}
