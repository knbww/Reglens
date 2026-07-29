"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/session";
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

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details you entered" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) return { error: error.message };

  if (!data.session) {
    return {
      error:
        "Account created. Check your inbox to confirm the address, then sign in. (Local Supabase shows the email at http://127.0.0.1:54324.)",
    };
  }

  if (data.user) {
    await prisma.user.upsert({
      where: { id: data.user.id },
      create: { id: data.user.id, email: parsed.data.email, fullName: parsed.data.fullName },
      update: { fullName: parsed.data.fullName },
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
