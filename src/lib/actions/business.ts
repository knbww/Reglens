"use server";

import type { PlanTier } from "@prisma/client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { onboardingSchema, type OnboardingInput } from "@/lib/schemas/onboarding";
import { ACTIVE_BUSINESS_COOKIE, requireUser } from "@/lib/session";

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "business"
  );
}

export async function setActiveBusiness(businessId: string): Promise<void> {
  const user = await requireUser();
  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: user.id },
    select: { id: true, onboardingCompleted: true },
  });
  if (!business) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, business.id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}

/** Switches business and lands on the right page for its onboarding state. */
export async function switchBusinessAndGo(businessId: string): Promise<void> {
  await setActiveBusiness(businessId);
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { onboardingCompleted: true },
  });
  redirect(business?.onboardingCompleted ? "/dashboard" : "/onboarding");
}

export type SaveOnboardingResult = { ok: true; businessId: string } | { ok: false; error: string };

/**
 * Creates or updates a business from the onboarding survey.
 * The same action backs the profile editor, so relevance, recommendations and
 * AI context all refresh from a single write path.
 */
export async function saveOnboarding(
  input: OnboardingInput,
  businessId?: string,
): Promise<SaveOnboardingResult> {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Some answers need attention" };
  }
  const data = parsed.data;
  if (!data.disclaimerAccepted) {
    return { ok: false, error: "Please acknowledge how RegLens information should be used." };
  }

  const targetJurisdiction =
    data.plansExpansion && data.targetRegion ? data.targetRegion : data.plansExpansion ? data.targetCountry : null;

  const operating = Array.from(new Set(data.operatingJurisdictions.filter(Boolean)));
  const targets = Array.from(new Set([targetJurisdiction, data.plansExpansion ? data.targetCountry : null].filter(Boolean) as string[]));

  const businessFields = {
    name: data.name,
    description: data.description,
    website: data.website ? data.website : null,
    country: data.country,
    region: data.region,
    city: data.city,
    sizeBand: data.sizeBand,
    employeeCount: data.employeeCount,
    orgType: data.orgType,
    onboardingCompleted: true,
    onboardingStep: 6,
    disclaimerAcceptedAt: new Date(),
  };

  const profileFields = {
    industryKey: data.industryKey,
    industryLabel: data.industryLabel,
    subIndustries: data.subIndustries,
    productsSold: data.productsSold,
    servicesProvided: data.servicesProvided,
    importsProducts: data.importsProducts,
    importCountries: data.importCountries,
    employsStaff: data.employsStaff,
    handlesCustomerData: data.handlesCustomerData,
    physicalLocations: data.physicalLocations,
    sellsCrossBorder: data.sellsCrossBorder,
    requiresLicenses: data.requiresLicenses,
    regulatedIndustry: data.regulatedIndustry,
    plansExpansion: data.plansExpansion,
    targetCountry: data.plansExpansion ? (data.targetCountry ?? null) : null,
    targetRegion: data.plansExpansion ? (data.targetRegion ?? null) : null,
    targetCity: data.plansExpansion ? (data.targetCity ?? null) : null,
    expansionActivity: data.plansExpansion ? (data.expansionActivity ?? null) : null,
    expansionDate: data.plansExpansion && data.expansionDate ? new Date(data.expansionDate) : null,
    compliancePriorities: data.compliancePriorities,
    trackingMethod: data.trackingMethod,
    hasComplianceStaff: data.hasComplianceStaff,
    usesSpreadsheets: data.usesSpreadsheets,
    usesExternalTool: data.usesExternalTool,
    reviewFrequency: data.reviewFrequency,
    topConcern: data.topConcern,
  };

  let id = businessId;

  if (id) {
    const owned = await prisma.business.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
    if (!owned) return { ok: false, error: "That business could not be found." };
    await prisma.business.update({ where: { id }, data: businessFields });
    await prisma.businessProfile.upsert({
      where: { businessId: id },
      create: { businessId: id, ...profileFields },
      update: profileFields,
    });
    await prisma.businessJurisdiction.deleteMany({ where: { businessId: id } });
  } else {
    const base = slugify(data.name);
    const existing = await prisma.business.findMany({
      where: { ownerId: user.id, slug: { startsWith: base } },
      select: { slug: true },
    });
    const slug = existing.some((b) => b.slug === base) ? `${base}-${existing.length + 1}` : base;

    const created = await prisma.business.create({
      data: {
        ownerId: user.id,
        slug,
        ...businessFields,
        profile: { create: profileFields },
      },
    });
    id = created.id;
  }

  await prisma.businessJurisdiction.createMany({
    data: [
      ...operating.map((code) => ({ businessId: id!, jurisdictionCode: code, role: "OPERATING" as const })),
      ...targets
        .filter((code) => !operating.includes(code))
        .map((code) => ({ businessId: id!, jurisdictionCode: code, role: "TARGET_EXPANSION" as const })),
    ],
    skipDuplicates: true,
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, id!, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  return { ok: true, businessId: id! };
}

export async function deleteBusiness(businessId: string): Promise<void> {
  const user = await requireUser();
  await prisma.business.deleteMany({ where: { id: businessId, ownerId: user.id } });
  const cookieStore = await cookies();
  if (cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value === businessId) {
    cookieStore.delete(ACTIVE_BUSINESS_COOKIE);
  }
  revalidatePath("/", "layout");
}

export async function selectPlan(tier: PlanTier): Promise<{ ok: boolean }> {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { plan: tier } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateAccount(formData: FormData): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const fullName = (formData.get("fullName") as string | null)?.trim();
  await prisma.user.update({
    where: { id: user.id },
    data: { fullName: fullName && fullName.length > 0 ? fullName : null },
  });
  revalidatePath("/settings");
  return { ok: true };
}
