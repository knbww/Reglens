import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { OnboardingWizard } from "@/components/app/onboarding-wizard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DefinitionList, InlineNote, PageHeader, ProgressBar } from "@/components/ui/misc";
import { jurisdictionName } from "@/data/jurisdictions";
import { formatDate } from "@/lib/format";
import type { OnboardingInput } from "@/lib/schemas/onboarding";
import { requireActiveBusiness } from "@/lib/session";
import { profileCompletion } from "@/lib/risk";
import {
  COUNTRIES,
  REVIEW_FREQUENCIES,
  SIZE_BANDS,
  TRACKING_METHODS,
  countryName,
  topicLabel,
} from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Business profile" };

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const { business } = await requireActiveBusiness();
  const profile = business.profile;
  const completion = profileCompletion(business);

  const operating = business.jurisdictions.filter((j) => j.role === "OPERATING");
  const targets = business.jurisdictions.filter((j) => j.role === "TARGET_EXPANSION");

  if (params.edit === "1") {
    const initial: Partial<OnboardingInput> = {
      name: business.name,
      description: business.description,
      website: business.website ?? "",
      sizeBand: business.sizeBand,
      employeeCount: business.employeeCount,
      orgType: business.orgType,
      country: business.country as OnboardingInput["country"],
      region: business.region,
      city: business.city,
      operatingJurisdictions: operating.map((j) => j.jurisdictionCode),
      industryKey: profile?.industryKey,
      industryLabel: profile?.industryLabel,
      subIndustries: profile?.subIndustries ?? [],
      productsSold: profile?.productsSold ?? [],
      servicesProvided: profile?.servicesProvided ?? [],
      importsProducts: profile?.importsProducts ?? false,
      importCountries: profile?.importCountries ?? [],
      employsStaff: profile?.employsStaff ?? false,
      handlesCustomerData: profile?.handlesCustomerData ?? false,
      physicalLocations: profile?.physicalLocations ?? false,
      sellsCrossBorder: profile?.sellsCrossBorder ?? false,
      requiresLicenses: profile?.requiresLicenses ?? false,
      regulatedIndustry: profile?.regulatedIndustry ?? false,
      plansExpansion: profile?.plansExpansion ?? false,
      targetCountry: profile?.targetCountry ?? null,
      targetRegion: profile?.targetRegion ?? null,
      targetCity: profile?.targetCity ?? null,
      expansionActivity: profile?.expansionActivity ?? null,
      expansionDate: profile?.expansionDate ? profile.expansionDate.toISOString().slice(0, 10) : null,
      compliancePriorities: profile?.compliancePriorities ?? [],
      trackingMethod: profile?.trackingMethod,
      hasComplianceStaff: profile?.hasComplianceStaff ?? false,
      usesSpreadsheets: profile?.usesSpreadsheets ?? false,
      usesExternalTool: profile?.usesExternalTool ?? false,
      reviewFrequency: profile?.reviewFrequency,
      topConcern: profile?.topConcern ?? "",
      disclaimerAccepted: Boolean(business.disclaimerAcceptedAt),
    };

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader
          title={`Edit ${business.name}`}
          description="Saving refreshes your dashboard relevance, recommended policies and the context the AI Analyst reads."
          actions={
            <Link href="/profile" className={buttonVariants({ variant: "secondary" })}>
              Cancel
            </Link>
          }
        />
        <OnboardingWizard initial={initial} businessId={business.id} isEdit />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Business profile"
        description="Everything RegLens uses to decide what applies to you and how urgent it is."
        actions={
          <Link href="/profile?edit=1" className={buttonVariants()}>
            <Pencil className="size-4" />
            Edit profile
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile completeness</CardTitle>
          <span className="text-sm font-medium text-ink tabular">{completion.percent}%</span>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProgressBar
            value={completion.percent}
            tone={completion.percent >= 90 ? "success" : "warning"}
            label="Profile completeness"
          />
          {completion.missing.length === 0 ? (
            <p className="text-sm text-success">Everything RegLens asks for is filled in.</p>
          ) : (
            <div>
              <p className="text-sm text-ink-soft">Still missing:</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {completion.missing.map((item) => (
                  <li key={item}>
                    <Badge tone="warning">{item}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
          </CardHeader>
          <CardContent>
            <DefinitionList
              items={[
                { term: "Name", value: business.name },
                { term: "Organisation type", value: business.orgType },
                {
                  term: "Size",
                  value: `${SIZE_BANDS.find((s) => s.key === business.sizeBand)?.label ?? business.sizeBand} · ${business.employeeCount} employees`,
                },
                { term: "Website", value: business.website ?? "Not set" },
                { term: "Primary country", value: countryName(business.country) },
                { term: "Region", value: jurisdictionName(business.region) },
                { term: "City", value: business.city || "Not set" },
                {
                  term: "Disclaimer acknowledged",
                  value: business.disclaimerAcceptedAt ? formatDate(business.disclaimerAcceptedAt) : "Not yet",
                },
              ]}
            />
            <p className="mt-4 text-sm leading-6 text-ink-soft">{business.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Industry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge tone="brand">{profile?.industryLabel ?? "Not set"}</Badge>
            {profile?.subIndustries.length ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.subIndustries.map((sub) => (
                  <Badge key={sub} tone="neutral">
                    {sub}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">No sub-sectors recorded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operating jurisdictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {operating.length === 0 ? (
                <p className="text-sm text-ink-muted">None recorded.</p>
              ) : (
                operating.map((j) => (
                  <Link key={j.id} href={`/policies?jurisdiction=${j.jurisdictionCode}`}>
                    <Badge tone="brand">{jurisdictionName(j.jurisdictionCode)}</Badge>
                  </Link>
                ))
              )}
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-ink-muted">Expansion targets</p>
              <div className="flex flex-wrap gap-1.5">
                {targets.length === 0 ? (
                  <p className="text-sm text-ink-muted">None recorded.</p>
                ) : (
                  targets.map((j) => (
                    <Link key={j.id} href={`/compare?target=${j.jurisdictionCode}`}>
                      <Badge tone="warning">{jurisdictionName(j.jurisdictionCode)}</Badge>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business activities</CardTitle>
          </CardHeader>
          <CardContent>
            <DefinitionList
              items={[
                {
                  term: "Products sold",
                  value: profile?.productsSold.length ? profile.productsSold.join(", ") : "None recorded",
                },
                {
                  term: "Services provided",
                  value: profile?.servicesProvided.length ? profile.servicesProvided.join(", ") : "None recorded",
                },
                { term: "Imports products", value: yesNo(profile?.importsProducts ?? false) },
                {
                  term: "Imports from",
                  value: profile?.importCountries.length
                    ? profile.importCountries
                        .map((c) => COUNTRIES.find((x) => x.code === c)?.name ?? c)
                        .join(", ")
                    : "—",
                },
                { term: "Employs staff", value: yesNo(profile?.employsStaff ?? false) },
                { term: "Handles customer data", value: yesNo(profile?.handlesCustomerData ?? false) },
                { term: "Physical locations", value: yesNo(profile?.physicalLocations ?? false) },
                { term: "Sells across borders", value: yesNo(profile?.sellsCrossBorder ?? false) },
                { term: "Needs licences", value: yesNo(profile?.requiresLicenses ?? false) },
                { term: "Regulated industry", value: yesNo(profile?.regulatedIndustry ?? false) },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expansion</CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.plansExpansion ? (
              <DefinitionList
                items={[
                  { term: "Target country", value: profile.targetCountry ? countryName(profile.targetCountry) : "—" },
                  { term: "Target region", value: profile.targetRegion ? jurisdictionName(profile.targetRegion) : "—" },
                  { term: "Target city", value: profile.targetCity ?? "—" },
                  { term: "Planned activity", value: profile.expansionActivity ?? "—" },
                  { term: "Expected date", value: profile.expansionDate ? formatDate(profile.expansionDate) : "—" },
                ]}
              />
            ) : (
              <p className="text-sm text-ink-muted">
                No expansion recorded. Add one and RegLens will start surfacing what you need before you get
                there.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance priorities</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {profile?.compliancePriorities.length ? (
              profile.compliancePriorities.map((topic) => (
                <Link key={topic} href={`/policies?topic=${topic}`}>
                  <Badge tone="brand">{topicLabel(topic)}</Badge>
                </Link>
              ))
            ) : (
              <p className="text-sm text-ink-muted">None selected.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>How compliance is handled today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DefinitionList
              items={[
                {
                  term: "Tracking method",
                  value:
                    TRACKING_METHODS.find((m) => m.key === profile?.trackingMethod)?.label ??
                    profile?.trackingMethod ??
                    "—",
                },
                { term: "Dedicated compliance employee", value: yesNo(profile?.hasComplianceStaff ?? false) },
                { term: "Uses spreadsheets", value: yesNo(profile?.usesSpreadsheets ?? false) },
                { term: "Uses external software", value: yesNo(profile?.usesExternalTool ?? false) },
                {
                  term: "Reviews regulatory changes",
                  value:
                    REVIEW_FREQUENCIES.find((f) => f.key === profile?.reviewFrequency)?.label ??
                    profile?.reviewFrequency ??
                    "—",
                },
              ]}
            />
            {profile?.topConcern ? (
              <div>
                <p className="text-xs font-medium text-ink-muted">Biggest current concern</p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">“{profile.topConcern}”</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <InlineNote tone="info">
        Changing any of these answers immediately recalculates your dashboard relevance ranking, refreshes
        recommended policies and updates the context the AI Analyst reads.
      </InlineNote>
    </div>
  );
}
