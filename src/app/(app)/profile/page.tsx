/*
 * The question this page answers:
 * "What does RegLens believe about my business — and is any of it wrong?"
 * One primary action: correct it.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { OnboardingWizard } from "@/components/app/onboarding-wizard";
import { buttonVariants } from "@/components/ui/button";
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

/** A group of answers, with the reason RegLens asked for them. */
function Group({
  title,
  purpose,
  children,
}: {
  title: string;
  purpose: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 border-t border-line pt-6">
      <h2 className="text-title font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-ink-muted">{purpose}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Rows({ items }: { items: { term: string; value: React.ReactNode }[] }) {
  return (
    <dl>
      {items.map((item) => (
        <div key={item.term} className="flex flex-col gap-1 border-b border-line py-3 sm:flex-row sm:gap-4">
          <dt className="w-52 shrink-0 text-[13px] text-ink-muted">{item.term}</dt>
          <dd className="min-w-0 flex-1 text-[14px] leading-6 text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const linkClass = "underline decoration-line-strong underline-offset-4 hover:text-ink";

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
      <div className="mx-auto max-w-2xl">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-xs text-ink-muted">Editing {business.name}</p>
          <Link href="/profile" className="text-xs text-ink-muted hover:text-ink">
            Cancel
          </Link>
        </div>
        <OnboardingWizard initial={initial} businessId={business.id} isEdit />
      </div>
    );
  }

  // Activity answers read better as two short lists than as ten "Yes / No" rows.
  const activities: [string, boolean][] = [
    ["imports products", profile?.importsProducts ?? false],
    ["employs staff", profile?.employsStaff ?? false],
    ["handles customer data", profile?.handlesCustomerData ?? false],
    ["operates physical locations", profile?.physicalLocations ?? false],
    ["sells across borders", profile?.sellsCrossBorder ?? false],
    ["needs licences or certificates", profile?.requiresLicenses ?? false],
    ["works in a regulated industry", profile?.regulatedIndustry ?? false],
  ];
  const applies = activities.filter(([, on]) => on).map(([label]) => label);
  const doesNot = activities.filter(([, on]) => !on).map(([label]) => label);

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <header className="rise">
        <p className="text-xs text-ink-muted">Business profile</p>
        <h1 className="mt-3 text-display font-semibold text-balance text-ink">{business.name}</h1>
        {business.description ? (
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-soft">{business.description}</p>
        ) : null}

        <p className="mt-4 text-[13px] leading-6 text-ink-soft">
          <span className="tabular font-medium text-ink">{completion.percent}%</span> complete
          {completion.missing.length === 0 ? (
            <span className="text-ink-muted"> — everything RegLens asks for is filled in.</span>
          ) : (
            <span className="text-ink-muted">
              {" "}
              — still missing {completion.missing.join(", ")}. Ranking is coarser without it.
            </span>
          )}
        </p>

        <p className="mt-5">
          <Link href="/profile?edit=1" className={buttonVariants()}>
            Edit profile
          </Link>
        </p>
      </header>

      <Group
        title="Company"
        purpose="The registration facts. They decide which filings and registrations are yours by default."
      >
        <Rows
          items={[
            { term: "Organisation type", value: business.orgType },
            {
              term: "Size",
              value: `${SIZE_BANDS.find((s) => s.key === business.sizeBand)?.label ?? business.sizeBand} · ${
                business.employeeCount
              } employees`,
            },
            {
              term: "Website",
              value: business.website ? (
                <a href={business.website} className={linkClass} rel="noreferrer noopener" target="_blank">
                  {business.website}
                </a>
              ) : (
                <span className="text-ink-muted">Not set</span>
              ),
            },
            {
              term: "Based in",
              value: [business.city, jurisdictionName(business.region), countryName(business.country)]
                .filter(Boolean)
                .join(", "),
            },
            {
              term: "Disclaimer acknowledged",
              value: business.disclaimerAcceptedAt ? (
                formatDate(business.disclaimerAcceptedAt)
              ) : (
                <span className="text-ink-muted">Not yet</span>
              ),
            },
          ]}
        />
      </Group>

      <Group
        title="Where you operate"
        purpose="Every place on this list is searched for obligations; anywhere missing is invisible to RegLens."
      >
        <Rows
          items={[
            {
              term: "Operating jurisdictions",
              value:
                operating.length === 0 ? (
                  <span className="text-ink-muted">None recorded.</span>
                ) : (
                  <span className="text-ink-soft">
                    {operating.map((j, index) => (
                      <span key={j.id}>
                        {index > 0 ? ", " : ""}
                        <Link href={`/policies?jurisdiction=${j.jurisdictionCode}`} className={linkClass}>
                          {jurisdictionName(j.jurisdictionCode)}
                        </Link>
                      </span>
                    ))}
                  </span>
                ),
            },
            {
              term: "Expansion targets",
              value:
                targets.length === 0 ? (
                  <span className="text-ink-muted">None recorded.</span>
                ) : (
                  <span className="text-ink-soft">
                    {targets.map((j, index) => (
                      <span key={j.id}>
                        {index > 0 ? ", " : ""}
                        <Link href={`/compare?target=${j.jurisdictionCode}`} className={linkClass}>
                          {jurisdictionName(j.jurisdictionCode)}
                        </Link>
                      </span>
                    ))}
                  </span>
                ),
            },
          ]}
        />
      </Group>

      <Group
        title="What you do"
        purpose="The industry sets which body of rules is read first; each activity switches on a further set."
      >
        <Rows
          items={[
            { term: "Industry", value: profile?.industryLabel ?? "Not set" },
            {
              term: "Sub-sectors",
              value: profile?.subIndustries.length ? (
                profile.subIndustries.join(", ")
              ) : (
                <span className="text-ink-muted">None recorded</span>
              ),
            },
            {
              term: "Products sold",
              value: profile?.productsSold.length ? (
                profile.productsSold.join(", ")
              ) : (
                <span className="text-ink-muted">None recorded</span>
              ),
            },
            {
              term: "Services provided",
              value: profile?.servicesProvided.length ? (
                profile.servicesProvided.join(", ")
              ) : (
                <span className="text-ink-muted">None recorded</span>
              ),
            },
            {
              term: "Imports from",
              value: profile?.importCountries.length ? (
                profile.importCountries.map((c) => COUNTRIES.find((x) => x.code === c)?.name ?? c).join(", ")
              ) : (
                <span className="text-ink-muted">Nothing recorded</span>
              ),
            },
            {
              term: "Applies to you",
              value:
                applies.length === 0 ? (
                  <span className="text-ink-muted">Nothing flagged.</span>
                ) : (
                  <>This business {applies.join(", ")}.</>
                ),
            },
            {
              term: "Does not apply",
              value:
                doesNot.length === 0 ? (
                  <span className="text-ink-muted">Every activity is flagged.</span>
                ) : (
                  <span className="text-ink-soft">RegLens is not tracking: {doesNot.join(", ")}.</span>
                ),
            },
          ]}
        />
      </Group>

      <Group
        title="Expansion"
        purpose="Obligations in a place you are entering are held separately from the ones you already owe."
      >
        {profile?.plansExpansion ? (
          <Rows
            items={[
              {
                term: "Target",
                value: [
                  profile.targetCity,
                  profile.targetRegion ? jurisdictionName(profile.targetRegion) : null,
                  profile.targetCountry ? countryName(profile.targetCountry) : null,
                ]
                  .filter(Boolean)
                  .join(", "),
              },
              {
                term: "Planned activity",
                value: profile.expansionActivity ?? <span className="text-ink-muted">Not described</span>,
              },
              {
                term: "Expected date",
                value: profile.expansionDate ? (
                  formatDate(profile.expansionDate)
                ) : (
                  <span className="text-ink-muted">Not set</span>
                ),
              },
            ]}
          />
        ) : (
          <p className="max-w-2xl text-[14px] leading-6 text-ink-soft">
            No expansion recorded. Add one and RegLens will start surfacing what you need before you get
            there, rather than after.
          </p>
        )}
      </Group>

      <Group
        title="What you asked RegLens to watch"
        purpose="Flagged topics are ranked above everything else when RegLens decides what to show you."
      >
        {profile?.compliancePriorities.length ? (
          <p className="text-[14px] leading-7 text-ink-soft">
            {profile.compliancePriorities.map((topic, index) => (
              <span key={topic}>
                {index > 0 ? ", " : ""}
                <Link href={`/policies?topic=${topic}`} className={linkClass}>
                  {topicLabel(topic)}
                </Link>
              </span>
            ))}
          </p>
        ) : (
          <p className="max-w-2xl text-[14px] leading-6 text-ink-soft">
            Nothing flagged, so RegLens ranks on your jurisdictions and industry alone.
          </p>
        )}
      </Group>

      <Group
        title="How compliance is handled today"
        purpose="Context for the AI Analyst, and the reason some recommendations are pitched where they are."
      >
        <Rows
          items={[
            {
              term: "Tracking method",
              value:
                TRACKING_METHODS.find((m) => m.key === profile?.trackingMethod)?.label ??
                profile?.trackingMethod ??
                "—",
            },
            {
              term: "Reviews changes",
              value:
                REVIEW_FREQUENCIES.find((f) => f.key === profile?.reviewFrequency)?.label ??
                profile?.reviewFrequency ??
                "—",
            },
            {
              term: "In place",
              value: (() => {
                const tools = [
                  profile?.hasComplianceStaff ? "a dedicated compliance employee" : null,
                  profile?.usesSpreadsheets ? "spreadsheets" : null,
                  profile?.usesExternalTool ? "external software" : null,
                ].filter(Boolean) as string[];
                return tools.length > 0 ? (
                  tools.join(", ")
                ) : (
                  <span className="text-ink-muted">Nothing formal recorded</span>
                );
              })(),
            },
          ]}
        />
        {profile?.topConcern ? (
          <div className="mt-5">
            <p className="text-[13px] text-ink-muted">Biggest current concern</p>
            <p className="mt-1 max-w-2xl text-[15px] leading-7 text-ink">“{profile.topConcern}”</p>
          </div>
        ) : null}
      </Group>

      <p className="mt-12 max-w-2xl text-[13px] leading-6 text-ink-muted">
        Changing any answer immediately recalculates your dashboard ranking, your recommended policies and the
        context the AI Analyst reads.
      </p>
    </div>
  );
}
