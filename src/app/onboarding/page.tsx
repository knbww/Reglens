import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/app/logo";
import { OnboardingWizard } from "@/components/app/onboarding-wizard";
import { prisma } from "@/lib/prisma";
import type { OnboardingInput } from "@/lib/schemas/onboarding";
import { getActiveBusiness, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Set up your business" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string; new?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  const isNew = params.new === "1";
  const isEdit = params.edit === "1";

  let business = null;
  if (!isNew) {
    business = params.business
      ? await prisma.business.findFirst({
          where: { id: params.business, ownerId: user.id },
          include: { profile: true, jurisdictions: true },
        })
      : await getActiveBusiness(user.id);

    // Only resume onboarding automatically; a finished business needs ?edit=1.
    if (business && business.onboardingCompleted && !isEdit && !params.business) business = null;
  }

  const initial: Partial<OnboardingInput> | undefined = business
    ? {
        name: business.name,
        description: business.description,
        website: business.website ?? "",
        sizeBand: business.sizeBand,
        employeeCount: business.employeeCount,
        orgType: business.orgType,
        country: business.country as OnboardingInput["country"],
        region: business.region,
        city: business.city,
        operatingJurisdictions: business.jurisdictions
          .filter((j) => j.role === "OPERATING")
          .map((j) => j.jurisdictionCode),
        industryKey: business.profile?.industryKey,
        industryLabel: business.profile?.industryLabel,
        subIndustries: business.profile?.subIndustries ?? [],
        productsSold: business.profile?.productsSold ?? [],
        servicesProvided: business.profile?.servicesProvided ?? [],
        importsProducts: business.profile?.importsProducts ?? false,
        importCountries: business.profile?.importCountries ?? [],
        employsStaff: business.profile?.employsStaff ?? false,
        handlesCustomerData: business.profile?.handlesCustomerData ?? false,
        physicalLocations: business.profile?.physicalLocations ?? false,
        sellsCrossBorder: business.profile?.sellsCrossBorder ?? false,
        requiresLicenses: business.profile?.requiresLicenses ?? false,
        regulatedIndustry: business.profile?.regulatedIndustry ?? false,
        plansExpansion: business.profile?.plansExpansion ?? false,
        targetCountry: business.profile?.targetCountry ?? null,
        targetRegion: business.profile?.targetRegion ?? null,
        targetCity: business.profile?.targetCity ?? null,
        expansionActivity: business.profile?.expansionActivity ?? null,
        expansionDate: business.profile?.expansionDate
          ? business.profile.expansionDate.toISOString().slice(0, 10)
          : null,
        compliancePriorities: business.profile?.compliancePriorities ?? [],
        trackingMethod: business.profile?.trackingMethod,
        hasComplianceStaff: business.profile?.hasComplianceStaff ?? false,
        usesSpreadsheets: business.profile?.usesSpreadsheets ?? false,
        usesExternalTool: business.profile?.usesExternalTool ?? false,
        reviewFrequency: business.profile?.reviewFrequency,
        topConcern: business.profile?.topConcern ?? "",
        disclaimerAccepted: Boolean(business.disclaimerAcceptedAt),
      }
    : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <Link href="/dashboard" className="text-sm text-ink-muted hover:text-ink">
            Skip for now
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {business && (isEdit || business.onboardingCompleted)
              ? `Edit ${business.name}`
              : "Tell RegLens about your business"}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-soft">
            Everything RegLens shows you — which policies rank first, what the AI Analyst says, your risk score
            and your reminders — comes from these answers. It takes about three minutes.
          </p>
        </div>

        <OnboardingWizard
          initial={initial}
          businessId={business?.id}
          isEdit={Boolean(business && business.onboardingCompleted)}
        />
      </main>
    </div>
  );
}
