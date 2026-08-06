import type { User } from "@prisma/client";

import { TRIAL_HOURS } from "./plans";

export type AccessState = "trial" | "subscribed" | "expired";

export type Access = {
  state: AccessState;
  /** False only when the trial has run out and nothing is paying for it. */
  allowed: boolean;
  /** When the free day ends. Always a date, even for accounts predating it. */
  trialEndsAt: Date;
  /** Whole hours left in the trial, floored at 0. */
  hoursLeft: number;
};

/** Stripe words that mean "this subscription is paying for the product". */
const PAYING = new Set(["active", "trialing", "past_due"]);

/** The trial ends a day after the account was made, unless it was set. */
export function trialEnd(user: Pick<User, "createdAt" | "trialEndsAt">): Date {
  return user.trialEndsAt ?? new Date(user.createdAt.getTime() + TRIAL_HOURS * 60 * 60 * 1000);
}

/**
 * What this account may do right now.
 *
 * `past_due` still counts as paying: a card that failed this morning is a
 * conversation with the bank, not grounds for taking someone's compliance
 * calendar away mid-deadline. Stripe retries, and if it truly lapses the
 * subscription becomes `canceled` and this returns expired.
 */
export function accessFor(user: User, now: Date = new Date()): Access {
  const endsAt = trialEnd(user);
  const hoursLeft = Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / (60 * 60 * 1000)));

  // The demo account is the product's shop window and is never on the clock.
  if (user.isDemo) {
    return { state: "subscribed", allowed: true, trialEndsAt: endsAt, hoursLeft };
  }

  if (user.subscriptionStatus && PAYING.has(user.subscriptionStatus)) {
    return { state: "subscribed", allowed: true, trialEndsAt: endsAt, hoursLeft };
  }

  if (now < endsAt) {
    return { state: "trial", allowed: true, trialEndsAt: endsAt, hoursLeft };
  }

  return { state: "expired", allowed: false, trialEndsAt: endsAt, hoursLeft: 0 };
}

/** "19 hours left" / "48 minutes left" — the clock, in words. */
export function trialRemaining(endsAt: Date, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.round((endsAt.getTime() - now.getTime()) / 60000));
  if (minutes <= 0) return "no time left";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} left`;
  const hours = Math.floor(minutes / 60);
  return `${hours} ${hours === 1 ? "hour" : "hours"} left`;
}
