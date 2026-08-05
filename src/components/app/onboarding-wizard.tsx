"use client";

import { Check, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { JurisdictionPicker } from "@/components/app/jurisdiction-picker";
import { TagInput } from "@/components/app/tag-input";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { ProgressBar } from "@/components/ui/misc";
import { jurisdictionName, regionsForCountry } from "@/data/jurisdictions";
import { saveOnboarding } from "@/lib/actions/business";
import { EMPTY_ONBOARDING, type OnboardingInput } from "@/lib/schemas/onboarding";
import {
  COMPLIANCE_TOPICS,
  COUNTRIES,
  DISCLAIMER,
  INDUSTRIES,
  ORG_TYPES,
  REVIEW_FREQUENCIES,
  SIZE_BANDS,
  TRACKING_METHODS,
  countryName,
  topicLabel,
} from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { useAction } from "@/lib/use-action";

/**
 * One question per step, asked in the order a person would ask them. `title`
 * is the word used in the progress trail; `question` is what the step actually
 * wants to know and stands as the page's heading while that step is open.
 *
 * Only the first step is required. Everything after it sharpens the ranking,
 * and none of it is worth holding the product hostage for: an interview that
 * has to be completed before anything can be seen is how a new account ends up
 * staring at a percentage instead of at its own regulations.
 */
const STEPS = [
  {
    key: "company",
    title: "Company",
    question: "Tell us about the business",
    blurb:
      "Who you are, and where you answer to a regulator. This is the only step RegLens needs — everything after it is optional and sharpens the ranking.",
  },
  {
    key: "industry",
    title: "Industry",
    question: "What kind of business is it?",
    blurb: "Pick the closest description. It decides which body of rules RegLens reads first.",
  },
  {
    key: "activities",
    title: "Activities",
    question: "What does the business actually do?",
    blurb: "Plain facts about the work. Each one switches on a different set of obligations.",
  },
  {
    key: "expansion",
    title: "Expansion",
    question: "Are you heading anywhere new?",
    blurb: "Requirements in a place you are entering are the ones people are caught by.",
  },
  {
    key: "priorities",
    title: "Priorities",
    question: "What worries you most?",
    blurb: "RegLens ranks matching requirements higher and starts watching them for you.",
  },
  {
    key: "workflow",
    title: "Today",
    question: "How do you keep track today?",
    blurb: "So RegLens fits around what you already do rather than replacing it on day one.",
  },
] as const;

const PRODUCT_SUGGESTIONS = ["Physical goods", "Apparel", "Equipment", "Digital products", "Consumables"];
const SERVICE_SUGGESTIONS = ["Consulting", "Installation", "Support", "Training", "Subscriptions"];
const IMPORT_COUNTRY_SUGGESTIONS = ["CN", "VN", "MX", "CA", "IT", "DE", "JP", "TR", "IN"];

/** A group of fields inside a step, with the reason the group is being asked. */
function Group({
  title,
  purpose,
  children,
}: {
  title: string;
  purpose?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="text-[15px] font-medium text-ink">{title}</h2>
      {purpose ? <p className="mt-1 max-w-xl text-[13px] leading-6 text-ink-muted">{purpose}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/**
 * A yes/no answer. A list of these is a list — hairlines and hover ground —
 * rather than a grid of bordered tiles that all shout at the same volume.
 */
function OptionRow({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description?: string;
}) {
  return (
    <li className="border-b border-line last:border-b-0">
      <label className="lift flex cursor-pointer items-start gap-3 rounded-md px-2 py-3">
        <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5" />
        <span className="min-w-0">
          <span className={cn("block text-[15px] text-ink", checked && "font-medium")}>{title}</span>
          {description ? (
            <span className="mt-0.5 block text-[13px] leading-6 text-ink-muted">{description}</span>
          ) : null}
        </span>
      </label>
    </li>
  );
}

export function OnboardingWizard({
  initial,
  businessId,
  isEdit = false,
}: {
  initial?: Partial<OnboardingInput>;
  businessId?: string;
  isEdit?: boolean;
}) {
  const router = useRouter();
  const { busy: pending, run } = useAction();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingInput>({ ...EMPTY_ONBOARDING, ...initial });
  const [industryQuery, setIndustryQuery] = useState("");

  function set<K extends keyof OnboardingInput>(key: K, value: OnboardingInput[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  const regions = useMemo(() => regionsForCountry(data.country), [data.country]);
  const targetRegions = useMemo(
    () => (data.targetCountry ? regionsForCountry(data.targetCountry) : []),
    [data.targetCountry],
  );

  const filteredIndustries = useMemo(() => {
    const q = industryQuery.trim().toLowerCase();
    if (!q) return INDUSTRIES;
    return INDUSTRIES.filter(
      (i) => i.label.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
    );
  }, [industryQuery]);

  /*
   * The closing readout. Every line is something the answers actually imply —
   * no line appears unless the person put it there, so the last step reads as
   * a result rather than as a summary of a form.
   */
  const findings = useMemo(() => {
    const items: { trigger: string; effect: string }[] = [];
    if (data.importsProducts) {
      items.push({
        trigger: "You import products",
        effect: `Entry filings, duties and product-standard rules${
          data.importCountries.length > 0 ? ` for goods arriving from ${data.importCountries.join(", ")}` : ""
        }.`,
      });
    }
    if (data.employsStaff) {
      items.push({
        trigger: "You employ staff",
        effect: "Hiring, payroll, workplace posting and worker-protection duties in each place you operate.",
      });
    }
    if (data.handlesCustomerData) {
      items.push({
        trigger: "You hold customer data",
        effect: "Consent, retention and breach-notification duties, which differ by state and province.",
      });
    }
    if (data.physicalLocations) {
      items.push({
        trigger: "You run physical locations",
        effect: "Local permits, occupancy rules and inspection regimes at county and city level.",
      });
    }
    if (data.sellsCrossBorder) {
      items.push({
        trigger: "You sell across borders",
        effect: "Registration thresholds that oblige you to collect tax in places you have never visited.",
      });
    }
    if (data.requiresLicenses) {
      items.push({
        trigger: "You hold licences or certificates",
        effect: "Renewal dates, which RegLens turns into dated reminders before they lapse.",
      });
    }
    if (data.regulatedIndustry) {
      items.push({
        trigger: "A sector regulator oversees you",
        effect: "Regulator-specific obligations ranked above general business requirements.",
      });
    }
    if (data.plansExpansion && (data.targetRegion || data.targetCountry)) {
      const where = data.targetRegion
        ? jurisdictionName(data.targetRegion)
        : countryName(data.targetCountry ?? "");
      items.push({
        trigger: `You are expanding into ${where}`,
        effect: "What has to be in place before you arrive, kept separate from what you owe today.",
      });
    }
    return items;
  }, [data]);

  function validateStep(index: number): string | null {
    if (index === 0) {
      if (data.name.trim().length < 2) return "Enter your company name.";
      if (data.description.trim().length < 10) return "Add a sentence describing what the business does.";
      if (!data.region) return "Select your state, province or region.";
      if (!data.city.trim()) return "Enter your city.";
      if (data.operatingJurisdictions.length === 0)
        return "Select at least one jurisdiction where you operate.";
      if (data.website && data.website.trim() !== "" && !/^https?:\/\//i.test(data.website))
        return "The website must start with http:// or https://";
      if (!data.disclaimerAccepted) return "Please acknowledge how RegLens information should be used.";
    }
    if (index === 3 && data.plansExpansion) {
      if (!data.targetCountry) return "Choose the country you plan to expand into.";
    }
    return null;
  }

  function next() {
    const problem = validateStep(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  /**
   * Saves whatever has been answered and leaves. Reachable from every step
   * once the first one is filled in — the remaining questions refine the
   * ranking and can be answered later from the profile, so nothing is gained
   * by making someone finish them before they see a single requirement.
   */
  function submit() {
    for (const index of [0, 3]) {
      const problem = validateStep(index);
      if (problem) {
        setStep(index);
        setError(problem);
        return;
      }
    }

    run(async () => {
      const result = await saveOnboarding(data, businessId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(isEdit ? "/profile" : "/dashboard");
      router.refresh();
    });
  }

  const progress = Math.round(((step + 1) / STEPS.length) * 100);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  // Everything RegLens needs to rank anything at all has been answered.
  const essentialsDone = validateStep(0) === null;

  return (
    <div className="mx-auto w-full max-w-2xl pb-12">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-xs text-ink-muted">
          Step {step + 1} of {STEPS.length} · {current.title}
        </p>
        <p className="tabular text-xs text-ink-muted">{progress}%</p>
      </div>
      <ProgressBar value={progress} className="mt-2 h-0.5" label="Onboarding progress" />

      <ol className="mt-3 hidden flex-wrap items-baseline gap-x-4 gap-y-1 text-xs sm:flex">
        {STEPS.map((s, index) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => {
                if (index <= step) setStep(index);
              }}
              disabled={index > step}
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "transition-colors",
                index === step
                  ? "font-medium text-ink"
                  : index < step
                    ? "text-ink-muted underline decoration-line-strong underline-offset-4 hover:text-ink"
                    : "text-line-strong",
              )}
            >
              {s.title}
            </button>
          </li>
        ))}
      </ol>

      <div key={current.key} className="rise">
        <h1 className="mt-8 text-display font-semibold text-balance text-ink">{current.question}</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-ink-soft">{current.blurb}</p>

        {/* ---------------------------------------------------- Step 1 */}
        {step === 0 ? (
          <div className="mt-8 space-y-8">
            <div className="space-y-4">
              <Field label="Company name" htmlFor="name">
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Frostonic"
                />
              </Field>

              <Field
                label="What does the business do?"
                htmlFor="description"
                hint="A sentence or two. This is the single biggest driver of how well RegLens ranks requirements for you."
              >
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="We import cold plunge tubs and sell them online to customers across the US."
                />
              </Field>

              <Field label="Website" htmlFor="website" hint="Optional.">
                <Input
                  id="website"
                  value={data.website ?? ""}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://example.com"
                />
              </Field>
            </div>

            <Group
              title="Where you are based"
              purpose="Your home jurisdiction decides which registrations and filings are yours by default."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Primary country" htmlFor="country">
                  <Select
                    id="country"
                    value={data.country}
                    onChange={(e) => {
                      const country = e.target.value as OnboardingInput["country"];
                      setData((prev) => ({
                        ...prev,
                        country,
                        region: "",
                        operatingJurisdictions: Array.from(
                          new Set([...prev.operatingJurisdictions, country]),
                        ),
                      }));
                    }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="State, province or region" htmlFor="region">
                  <Select
                    id="region"
                    value={data.region}
                    onChange={(e) => {
                      const region = e.target.value;
                      setData((prev) => ({
                        ...prev,
                        region,
                        operatingJurisdictions: region
                          ? Array.from(new Set([...prev.operatingJurisdictions, prev.country, region]))
                          : prev.operatingJurisdictions,
                      }));
                    }}
                  >
                    <option value="">Select…</option>
                    {regions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="City" htmlFor="city" className="sm:max-w-xs">
                <Input
                  id="city"
                  value={data.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Los Angeles"
                />
              </Field>
            </Group>

            <Group
              title="How the business is set up"
              purpose="Entity type and headcount move several thresholds — employment duties in particular."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Organisation type" htmlFor="orgType">
                  <Select id="orgType" value={data.orgType} onChange={(e) => set("orgType", e.target.value)}>
                    {ORG_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Company size" htmlFor="sizeBand">
                  <Select
                    id="sizeBand"
                    value={data.sizeBand}
                    onChange={(e) => set("sizeBand", e.target.value)}
                  >
                    {SIZE_BANDS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Number of employees" htmlFor="employeeCount" className="sm:max-w-[12rem]">
                <Input
                  id="employeeCount"
                  type="number"
                  min={0}
                  value={data.employeeCount}
                  onChange={(e) => set("employeeCount", Number(e.target.value))}
                />
              </Field>
            </Group>

            <Group
              title="Everywhere you answer to a regulator"
              purpose="Add every state, province or city you operate in — not only where you are registered."
            >
              <JurisdictionPicker
                selected={data.operatingJurisdictions}
                onChange={(next) => set("operatingJurisdictions", next)}
              />
            </Group>

            {/* The acknowledgement sits on the step you cannot skip, because
                you can now leave for the product from any step after it. */}
            <label className="flex cursor-pointer items-start gap-3 border-t border-line pt-6">
              <Checkbox
                checked={data.disclaimerAccepted}
                onChange={(e) => set("disclaimerAccepted", e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-[13px] leading-6 text-ink-muted">{DISCLAIMER}</span>
            </label>
          </div>
        ) : null}

        {/* ---------------------------------------------------- Step 2 */}
        {step === 1 ? (
          <div className="mt-8 space-y-8">
            <div className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                <Input
                  value={industryQuery}
                  onChange={(e) => setIndustryQuery(e.target.value)}
                  placeholder="Search industries…"
                  className="pl-9"
                  aria-label="Search industries"
                />
              </div>

              {filteredIndustries.length === 0 ? (
                <p className="py-6 text-[15px] leading-7 text-ink-soft">
                  No preset matches that search. Pick the closest one and add your own wording below — RegLens
                  reads both.
                </p>
              ) : (
                <ul className="border-y border-line">
                  {filteredIndustries.map((industry) => {
                    const active = data.industryKey === industry.key;
                    return (
                      <li key={industry.key} className="border-b border-line last:border-b-0">
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setData((prev) => ({
                              ...prev,
                              industryKey: industry.key,
                              industryLabel: industry.label,
                            }));
                            setError(null);
                          }}
                          className="lift flex w-full items-start gap-3 rounded-md px-2 py-3 text-left"
                        >
                          <Check
                            className={cn("mt-0.5 size-4 shrink-0", active ? "text-ink" : "invisible")}
                          />
                          <span className="min-w-0">
                            <span className={cn("block text-[15px] text-ink", active && "font-medium")}>
                              {industry.label}
                            </span>
                            <span className="mt-0.5 block text-[13px] leading-6 text-ink-muted">
                              {industry.description}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <Group
              title="Anything more specific?"
              purpose="Optional. Sub-sectors, niches or specialisms RegLens should keep in mind when it ranks."
            >
              <TagInput
                values={data.subIndustries}
                onChange={(next) => set("subIndustries", next)}
                placeholder="e.g. Winter sportswear"
              />
            </Group>
          </div>
        ) : null}

        {/* ---------------------------------------------------- Step 3 */}
        {step === 2 ? (
          <div className="mt-8 space-y-8">
            <ul className="border-y border-line">
              <OptionRow
                checked={data.importsProducts}
                onChange={(v) => set("importsProducts", v)}
                title="We import products"
                description="Goods cross a national border to reach us."
              />
              <OptionRow
                checked={data.employsStaff}
                onChange={(v) => set("employsStaff", v)}
                title="We employ staff"
                description="Payroll, hiring and workplace requirements apply."
              />
              <OptionRow
                checked={data.handlesCustomerData}
                onChange={(v) => set("handlesCustomerData", v)}
                title="We handle customer data"
                description="Names, contact details, payment or usage data."
              />
              <OptionRow
                checked={data.physicalLocations}
                onChange={(v) => set("physicalLocations", v)}
                title="We operate physical locations"
                description="Offices, stores, classrooms, warehouses or kitchens."
              />
              <OptionRow
                checked={data.sellsCrossBorder}
                onChange={(v) => set("sellsCrossBorder", v)}
                title="We sell across state or national borders"
                description="Triggers tax registration thresholds in other places."
              />
              <OptionRow
                checked={data.requiresLicenses}
                onChange={(v) => set("requiresLicenses", v)}
                title="We need licences or certifications"
                description="Permits, professional licences or product certificates."
              />
              <OptionRow
                checked={data.regulatedIndustry}
                onChange={(v) => set("regulatedIndustry", v)}
                title="We work in a regulated industry"
                description="A sector regulator oversees how we operate."
              />
            </ul>

            {data.importsProducts ? (
              <Group
                title="Where the goods come from"
                purpose="Origin decides duty treatment and which product-standard regimes follow the shipment."
              >
                <Field label="Countries you import from" hint="Two-letter codes or names both work.">
                  <TagInput
                    values={data.importCountries}
                    onChange={(next) => set("importCountries", next)}
                    suggestions={IMPORT_COUNTRY_SUGGESTIONS}
                    placeholder="Add a country"
                  />
                </Field>
              </Group>
            ) : null}

            <Group
              title="What you sell"
              purpose="Optional, but product and service names sharpen which standards RegLens surfaces."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Products you sell" hint="Optional.">
                  <TagInput
                    values={data.productsSold}
                    onChange={(next) => set("productsSold", next)}
                    suggestions={PRODUCT_SUGGESTIONS}
                    placeholder="Add a product"
                  />
                </Field>
                <Field label="Services you provide" hint="Optional.">
                  <TagInput
                    values={data.servicesProvided}
                    onChange={(next) => set("servicesProvided", next)}
                    suggestions={SERVICE_SUGGESTIONS}
                    placeholder="Add a service"
                  />
                </Field>
              </div>
            </Group>
          </div>
        ) : null}

        {/* ---------------------------------------------------- Step 4 */}
        {step === 3 ? (
          <div className="mt-8 space-y-8">
            <ul className="border-y border-line">
              <OptionRow
                checked={data.plansExpansion}
                onChange={(v) => set("plansExpansion", v)}
                title="We plan to expand into a new jurisdiction"
                description="RegLens will surface what you need before you get there."
              />
            </ul>

            {data.plansExpansion ? (
              <Group
                title="Where you are going"
                purpose="RegLens keeps these obligations separate from the ones you already owe."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Target country" htmlFor="targetCountry">
                    <Select
                      id="targetCountry"
                      value={data.targetCountry ?? ""}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          targetCountry: e.target.value || null,
                          targetRegion: null,
                        }))
                      }
                    >
                      <option value="">Select…</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Target state, province or region" htmlFor="targetRegion">
                    <Select
                      id="targetRegion"
                      value={data.targetRegion ?? ""}
                      onChange={(e) => set("targetRegion", e.target.value || null)}
                      disabled={!data.targetCountry}
                    >
                      <option value="">Select…</option>
                      {targetRegions.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Target city" htmlFor="targetCity" hint="Optional.">
                    <Input
                      id="targetCity"
                      value={data.targetCity ?? ""}
                      onChange={(e) => set("targetCity", e.target.value || null)}
                      placeholder="Toronto"
                    />
                  </Field>
                  <Field label="Expected date" htmlFor="expansionDate" hint="Approximate is fine.">
                    <Input
                      id="expansionDate"
                      type="date"
                      value={data.expansionDate ?? ""}
                      onChange={(e) => set("expansionDate", e.target.value || null)}
                    />
                  </Field>
                </div>

                <Field label="What will you do there?" htmlFor="expansionActivity">
                  <Textarea
                    id="expansionActivity"
                    value={data.expansionActivity ?? ""}
                    onChange={(e) => set("expansionActivity", e.target.value || null)}
                    placeholder="Sell online to consumers using a local fulfilment partner."
                  />
                </Field>
              </Group>
            ) : (
              <p className="max-w-xl text-[15px] leading-7 text-ink-soft">
                No expansion planned right now — that is a perfectly good answer. You can add one later from
                your business profile and RegLens will refresh what it recommends.
              </p>
            )}
          </div>
        ) : null}

        {/* ---------------------------------------------------- Step 5 */}
        {step === 4 ? (
          <div className="mt-8">
            <p className="tabular text-xs text-ink-muted">
              {data.compliancePriorities.length} selected · optional
            </p>
            <ul className="mt-2 border-y border-line">
              {COMPLIANCE_TOPICS.map((topic) => (
                <OptionRow
                  key={topic.key}
                  checked={data.compliancePriorities.includes(topic.key)}
                  onChange={(checked) =>
                    set(
                      "compliancePriorities",
                      checked
                        ? [...data.compliancePriorities, topic.key]
                        : data.compliancePriorities.filter((k) => k !== topic.key),
                    )
                  }
                  title={topic.label}
                  description={topic.blurb}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {/* ---------------------------------------------------- Step 6 */}
        {step === 5 ? (
          <div className="mt-8 space-y-8">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="How is compliance tracked today?" htmlFor="trackingMethod">
                  <Select
                    id="trackingMethod"
                    value={data.trackingMethod}
                    onChange={(e) => set("trackingMethod", e.target.value)}
                  >
                    {TRACKING_METHODS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="How often do you review regulatory changes?" htmlFor="reviewFrequency">
                  <Select
                    id="reviewFrequency"
                    value={data.reviewFrequency}
                    onChange={(e) => set("reviewFrequency", e.target.value)}
                  >
                    {REVIEW_FREQUENCIES.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <ul className="border-y border-line">
                <OptionRow
                  checked={data.hasComplianceStaff}
                  onChange={(v) => set("hasComplianceStaff", v)}
                  title="We have a compliance employee"
                />
                <OptionRow
                  checked={data.usesSpreadsheets}
                  onChange={(v) => set("usesSpreadsheets", v)}
                  title="We use spreadsheets"
                />
                <OptionRow
                  checked={data.usesExternalTool}
                  onChange={(v) => set("usesExternalTool", v)}
                  title="We use external software"
                />
              </ul>

              <Field
                label="What is your most important compliance concern right now?"
                htmlFor="topConcern"
                hint="The AI Analyst reads this before it answers anything."
              >
                <Textarea
                  id="topConcern"
                  value={data.topConcern}
                  onChange={(e) => set("topConcern", e.target.value)}
                  placeholder="We are about to start shipping to Canada and do not know what we need in place."
                />
              </Field>
            </div>

            {/* The payoff: what these answers already mean, before you leave. */}
            <section className="border-t border-line pt-6">
              <h2 className="text-title font-semibold text-ink">What RegLens has so far</h2>
              <p className="mt-2 max-w-xl text-[15px] leading-7 text-ink-soft">
                {isEdit
                  ? "Saving re-ranks your dashboard, your recommended policies and what the AI Analyst reads."
                  : "Finishing saves this and opens your dashboard, already ranked against these answers."}
              </p>

              <dl className="mt-5">
                <div className="flex gap-4 border-b border-line py-3">
                  <dt className="w-36 shrink-0 text-[13px] text-ink-muted">Jurisdictions</dt>
                  <dd className="min-w-0 flex-1 text-[14px] leading-6 text-ink">
                    {data.operatingJurisdictions.length === 0
                      ? "None yet — add at least one on the first step."
                      : `${data.operatingJurisdictions.length} watched — ${data.operatingJurisdictions
                          .slice(0, 6)
                          .map((code) => jurisdictionName(code))
                          .join(", ")}${
                          data.operatingJurisdictions.length > 6
                            ? ` and ${data.operatingJurisdictions.length - 6} more`
                            : ""
                        }`}
                  </dd>
                </div>
                <div className="flex gap-4 border-b border-line py-3">
                  <dt className="w-36 shrink-0 text-[13px] text-ink-muted">Rules read first</dt>
                  <dd className="min-w-0 flex-1 text-[14px] leading-6 text-ink">
                    {data.industryLabel}
                    {data.subIndustries.length > 0 ? ` — ${data.subIndustries.join(", ")}` : ""}
                  </dd>
                </div>
                <div className="flex gap-4 border-b border-line py-3">
                  <dt className="w-36 shrink-0 text-[13px] text-ink-muted">Ranked higher</dt>
                  <dd className="min-w-0 flex-1 text-[14px] leading-6 text-ink">
                    {data.compliancePriorities.length === 0
                      ? "Nothing flagged, so RegLens ranks on your jurisdictions and industry alone."
                      : data.compliancePriorities.map((key) => topicLabel(key)).join(", ")}
                  </dd>
                </div>
              </dl>

              {findings.length > 0 ? (
                <ul className="mt-6">
                  {findings.map((finding) => (
                    <li key={finding.trigger} className="border-b border-line py-3 last:border-b-0">
                      <p className="text-[14px] font-medium text-ink">{finding.trigger}</p>
                      <p className="mt-0.5 text-[13px] leading-6 text-ink-soft">{finding.effect}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 max-w-xl text-[14px] leading-6 text-ink-muted">
                  You did not flag any activities that pull in extra regimes, so RegLens will start from your
                  location and industry. Add activities later and the ranking updates.
                </p>
              )}
            </section>

          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-6 text-[14px] font-medium text-alert">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || pending}
          >
            Back
          </Button>

          <div className="flex flex-wrap items-center gap-1">
            {/* The way out, on every step. */}
            {!isLast && essentialsDone ? (
              <Button type="button" variant="ghost" onClick={submit} disabled={pending}>
                {pending ? "Saving…" : isEdit ? "Save and close" : "Save and open RegLens"}
              </Button>
            ) : null}

            {isLast ? (
              <Button type="button" onClick={submit} disabled={pending}>
                {pending ? "Saving…" : isEdit ? "Save profile" : "Finish and open my dashboard"}
              </Button>
            ) : (
              <Button type="button" onClick={next} disabled={pending}>
                Continue
              </Button>
            )}
          </div>
        </div>

        {!isLast && !isEdit ? (
          <p className="mt-4 text-[13px] leading-6 text-ink-muted">
            {essentialsDone
              ? "That is everything RegLens needs. The remaining steps sharpen the ranking and can be answered later from your profile."
              : "Only this first step is required. The rest can be answered later from your profile."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
