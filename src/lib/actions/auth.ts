"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/session";
import { supabaseSecretKey, supabaseUrl } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export type AuthState = { error?: string };

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

/** Supabase phrasing, turned into something the person can act on. */
function signUpError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("rate limit") || text.includes("email send")) {
    return "Too many confirmation emails have gone out from this project in the last hour. Supabase's built-in mail service allows only a handful — turn off “Confirm email” in Authentication → Sign In / Providers → Email, or connect your own SMTP, and try again.";
  }
  if (text.includes("already registered") || text.includes("already been registered") || text.includes("already exists")) {
    return "That email already has an account. Sign in instead.";
  }
  return message;
}

/**
 * Creates the account and signs straight in.
 *
 * When a server key is configured the account is created through the admin
 * API, already confirmed, and the password is used to open a session at once.
 * That is deliberate: Supabase's built-in mail service allows only a couple of
 * messages an hour, so a confirmation round-trip meant that signing up failed
 * with "email rate limit exceeded" for everyone after the first few — and a
 * product nobody can get into is worse than one that trusts an address.
 *
 * To go back to verified addresses, drop `SUPABASE_SECRET_KEY` /
 * `SUPABASE_SERVICE_ROLE_KEY` from the environment and configure real SMTP in
 * the Supabase dashboard: the branch below is the ordinary `signUp` flow.
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

  if (secret) {
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
      await prisma.user.upsert({
        where: { id: data.user.id },
        create: { id: data.user.id, email, fullName },
        update: { fullName },
      });
    }

    const { error: sessionError } = await supabase.auth.signInWithPassword({ email, password });
    if (sessionError) return { error: signUpError(sessionError.message) };

    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: signUpError(error.message) };

  if (!data.session) {
    return {
      error:
        "Account created. Check your inbox to confirm the address, then sign in. (Local Supabase shows the email at http://127.0.0.1:54324.)",
    };
  }

  if (data.user) {
    await prisma.user.upsert({
      where: { id: data.user.id },
      create: { id: data.user.id, email, fullName },
      update: { fullName },
    });
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
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
