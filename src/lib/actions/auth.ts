"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@supabase/supabase-js";

import { ACTIVE_BUSINESS_COOKIE, syncAppUser } from "@/lib/session";
import { supabaseSecretKey, supabaseUrl } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";

/**
 * `pending` carries the address a confirmation link was just sent to. It is a
 * success, not a failure, and the form says so — "check your inbox" printed in
 * the red the validation errors use was the product telling people the thing
 * had gone wrong when it had gone right.
 */
export type AuthState = { error?: string; pending?: string; notice?: string };

const credentials = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpSchema = credentials.extend({
  fullName: z.string().min(1, "Enter your name"),
});

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details you entered" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  const next = (formData.get("next") as string | null) ?? "/dashboard";
  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

/**
 * The origin this request came in on, so a confirmation link points back at
 * the deployment that sent it — production, a preview URL or localhost — with
 * nothing to keep in sync by hand.
 */
async function siteOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Supabase phrasing, turned into something the person can act on. */
function signUpError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("rate limit") || text.includes("email send")) {
    return "The mail service turned this away: too many messages have gone out from this project in the last hour. Wait a few minutes and try again — and if this keeps happening, the project still needs its own SMTP credentials rather than Supabase's shared sender.";
  }
  if (text.includes("already registered") || text.includes("already been registered") || text.includes("already exists")) {
    return "That email already has an account. Sign in instead.";
  }
  return message;
}

/**
 * Addresses are verified: signing up sends a link, and the account is only
 * usable once it has been followed.
 *
 * `AUTH_AUTOCONFIRM=1` is the deliberate exception. Supabase's built-in mail
 * service allows a couple of messages an hour, so until the project has its
 * own SMTP credentials and a verified sending domain, a confirmation
 * round-trip means everyone after the first few sees "email rate limit
 * exceeded" and cannot get in at all. With the flag set — and only then — the
 * account is created through the admin API already confirmed. Remove the flag
 * the moment real mail is wired up; nothing else has to change.
 */
export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details you entered" };
  }

  const { email, password, fullName } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const secret = supabaseSecretKey();

  if (secret && process.env.AUTH_AUTOCONFIRM === "1") {
    const admin = createClient(supabaseUrl(), secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) return { error: signUpError(error.message) };

    if (data.user) {
      await syncAppUser(data.user.id, email, fullName);
    }

    const { error: sessionError } = await supabase.auth.signInWithPassword({ email, password });
    if (sessionError) return { error: signUpError(sessionError.message) };

    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error) return { error: signUpError(error.message) };

  // No session means Supabase is confirming the address. The mirror row waits
  // until the link is followed — `getCurrentUser` creates it on first sign-in.
  if (!data.session) return { pending: email };

  if (data.user) {
    await syncAppUser(data.user.id, email, fullName);
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

/** Sends the confirmation link again, for the inbox that never got it. */
export async function resendConfirmation(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter the address you signed up with." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error) return { pending: email, error: signUpError(error.message) };

  return { pending: email, notice: "Sent again. It can take a minute to arrive." };
}

/** One-click sign-in for the seeded demo account. */
export async function signInAsDemo(): Promise<AuthState> {
  const email = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@reglens.ai";
  const password = process.env.DEMO_PASSWORD ?? "reglens-demo-2025";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error: `Demo sign-in failed: ${error.message}. Run "npm run db:seed" to create the demo account.`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_BUSINESS_COOKIE);
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
