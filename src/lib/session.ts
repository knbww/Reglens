import type { User } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "./prisma";
import type { BusinessWithContext } from "./relevance";
import { createSupabaseServerClient } from "./supabase/server";

export const ACTIVE_BUSINESS_COOKIE = "reglens.business";

/**
 * Returns the signed-in application user, creating the mirror row on first
 * sign-in. `null` when there is no session.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  return prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email,
      fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    },
    update: { email: user.email },
  });
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export const listBusinesses = cache(async (userId: string) => {
  return prisma.business.findMany({
    where: { ownerId: userId },
    orderBy: [{ isDemo: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, slug: true, isDemo: true, city: true, region: true, onboardingCompleted: true },
  });
});

/**
 * Resolves the active business from the selection cookie, falling back to the
 * user's first business. Returns `null` when the user has none yet.
 */
export const getActiveBusiness = cache(async (userId: string): Promise<BusinessWithContext | null> => {
  const cookieStore = await cookies();
  const selected = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;

  if (selected) {
    const business = await prisma.business.findFirst({
      where: { id: selected, ownerId: userId },
      include: { profile: true, jurisdictions: true },
    });
    if (business) return business;
  }

  return prisma.business.findFirst({
    where: { ownerId: userId },
    orderBy: [{ isDemo: "asc" }, { createdAt: "asc" }],
    include: { profile: true, jurisdictions: true },
  });
});

/**
 * For pages that cannot render without a business.
 *
 * It only sends you away when there is genuinely nothing to render against —
 * no business at all. An *unfinished* business used to bounce every page back
 * to the wizard, which meant a new account could answer six screens of
 * questions, land on the dashboard, and be told to go back and finish. A
 * half-answered profile ranks slightly less well; it does not stop the product
 * working, and the places it would help are marked in the margin instead.
 */
export async function requireActiveBusiness(): Promise<{ user: User; business: BusinessWithContext }> {
  const user = await requireUser();
  const business = await getActiveBusiness(user.id);
  if (!business) redirect("/onboarding");
  return { user, business };
}
