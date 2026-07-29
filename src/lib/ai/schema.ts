import { z } from "zod";

/**
 * The contract every AI Analyst answer must satisfy, whatever produced it.
 * Model output is validated against this before anything is rendered.
 */
export const analystAnswerSchema = z.object({
  title: z.string().min(2).max(160),
  plainExplanation: z.string().min(2),
  whyItMatters: z.string().default(""),
  keyImpacts: z.array(z.string().min(3)).max(8).default([]),
  risks: z
    .array(
      z.object({
        label: z.string().min(3),
        detail: z.string().min(3),
        severity: z.enum(["low", "moderate", "high"]).default("moderate"),
      }),
    )
    .max(8)
    .default([]),
  recommendedActions: z
    .array(
      z.object({
        title: z.string().min(3),
        detail: z.string().default(""),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
        dueInDays: z.number().int().min(0).max(730).nullable().default(30),
        checklist: z.array(z.string()).max(8).default([]),
      }),
    )
    .max(10)
    .default([]),
  deadlines: z
    .array(
      z.object({
        label: z.string().min(2),
        date: z.string().default(""),
        description: z.string().default(""),
      }),
    )
    .max(10)
    .default([]),
  jurisdictions: z.array(z.string()).max(12).default([]),
  sources: z
    .array(
      z.object({
        policyId: z.string(),
        title: z.string(),
        sourceName: z.string().default(""),
        sourceUrl: z.string().default(""),
      }),
    )
    .max(12)
    .default([]),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
});

export type AnalystAnswer = z.infer<typeof analystAnswerSchema>;

export type AnalystResult = {
  answer: AnalystAnswer;
  provider: "groq" | "demo";
  /** Present when a configured provider failed and the demo path was used. */
  degradedReason?: string;
};

/** JSON Schema handed to the model so it returns the right shape first time. */
export const ANALYST_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "plainExplanation",
    "whyItMatters",
    "keyImpacts",
    "risks",
    "recommendedActions",
    "deadlines",
    "jurisdictions",
    "sources",
    "confidence",
  ],
  properties: {
    title: { type: "string", description: "Short headline answering the question." },
    plainExplanation: {
      type: "string",
      description:
        "Your actual reply, in plain language. This is the only field that is always required — for a greeting or a simple question it may be the whole answer.",
    },
    whyItMatters: {
      type: "string",
      description:
        "Ties the answer to this specific business profile and its activities. Empty string when the message did not call for it.",
    },
    keyImpacts: {
      type: "array",
      items: { type: "string" },
      description: "Main operational effects. Empty when a list would not help.",
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "detail", "severity"],
        properties: {
          label: { type: "string" },
          detail: { type: "string" },
          severity: { type: "string", enum: ["low", "moderate", "high"] },
        },
      },
    },
    recommendedActions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail", "priority", "dueInDays", "checklist"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
          dueInDays: { type: ["integer", "null"] },
          checklist: { type: "array", items: { type: "string" } },
        },
      },
    },
    deadlines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "date", "description"],
        properties: {
          label: { type: "string" },
          date: { type: "string" },
          description: { type: "string" },
        },
      },
    },
    jurisdictions: { type: "array", items: { type: "string" } },
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["policyId", "title", "sourceName", "sourceUrl"],
        properties: {
          policyId: { type: "string" },
          title: { type: "string" },
          sourceName: { type: "string" },
          sourceUrl: { type: "string" },
        },
      },
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
} as const;
