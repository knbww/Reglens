"use client";

import { AlertCircle, ArrowLeft, ArrowRight, Check, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { JurisdictionPicker } from "@/components/app/jurisdiction-picker";
import { TagInput } from "@/components/app/tag-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea, ToggleCard } from "@/components/ui/field";
import { ProgressBar } from "@/components/ui/misc";
import { regionsForCountry } from "@/data/jurisdictions";
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
} from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { useAction } from "@/lib/use-action";

const STEPS = [
  { key: "company", title: "Company", blurb: "Who you are and where you operate." },
  { key: "industry", title: "Industry", blurb: "What kind of organisation this is." },
  { key: "activities", title: "Activities", blurb: "What you actually do day to day." },
  { key: "expansion", title: "Expansion", blurb: "Where you are heading next." },
  { key: "priorities", title: "Priorities", blurb: "What you want RegLens to watch." },
  { key: "workflow", title: "Today", blurb: "How compliance is handled now." },
] as const;

const PRODUCT_SUGGESTIONS = ["Physical goods", "Apparel", "Equipment", "Digital products", "Consumables"];
const SERVICE_SUGGESTIONS = ["Consulting", "Installation", "Support", "Training", "Subscriptions"];
const IMPORT_COUNTRY_SUGGESTIONS = ["CN", "VN", "MX", "CA", "IT", "DE", "JP", "TR", "IN"];

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
    }
    if (index === 3 && data.plansExpansion) {
      if (!data.targetCountry) return "Choose the country you plan to expand into.";
    }
    if (index === 5 && !data.disclaimerAccepted) {
      return "Please acknowledge how RegLens information should be used.";
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

  function submit() {
    for (let i = 0; i < STEPS.length; i += 1) {
      const problem = validateStep(i);
      if (problem) {
        setStep(i);
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

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium text-ink-muted">
            Step {step + 1} of {STEPS.length} · {STEPS[step].title}
          </p>
          <p className="text-xs text-ink-muted tabular">{progress}%</p>
        </div>
        <ProgressBar value={progress} className="mt-2" label="Onboarding progress" />
        <ol className="mt-3 hidden flex-wrap gap-1.5 md:flex">
          {STEPS.map((s, index) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => {
                  if (index <= step) setStep(index);
                }}
                disabled={index > step}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  index === step
                    ? "border-brand bg-brand-soft font-medium text-brand"
                    : index < step
                      ? "border-line text-ink-soft hover:border-brand-ring"
                      : "border-line text-ink-muted opacity-60",
                )}
              >
                {index < step ? <Check className="mr-1 inline size-3" /> : null}
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <Card>
        <CardContent className="space-y-5 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink">{STEPS[step].title}</h2>
            <p className="mt-0.5 text-sm text-ink-muted">{STEPS[step].blurb}</p>
          </div>

          {/* ---------------------------------------------------- Step 1 */}
          {step === 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name" htmlFor="name">
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Frostonic"
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

              <div className="grid gap-4 sm:grid-cols-3">
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
                  <Select id="sizeBand" value={data.sizeBand} onChange={(e) => set("sizeBand", e.target.value)}>
                    {SIZE_BANDS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Number of employees" htmlFor="employeeCount">
                  <Input
                    id="employeeCount"
                    type="number"
                    min={0}
                    value={data.employeeCount}
                    onChange={(e) => set("employeeCount", Number(e.target.value))}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
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
                <Field label="City" htmlFor="city">
                  <Input id="city" value={data.city} onChange={(e) => set("city", e.target.value)} placeholder="Los Angeles" />
                </Field>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-ink-soft">Operating jurisdictions</p>
                <JurisdictionPicker
                  selected={data.operatingJurisdictions}
                  onChange={(next) => set("operatingJurisdictions", next)}
                />
              </div>
            </div>
          ) : null}

          {/* ---------------------------------------------------- Step 2 */}
          {step === 1 ? (
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

              <div className="grid gap-2 sm:grid-cols-2">
                {filteredIndustries.map((industry) => {
                  const active = data.industryKey === industry.key;
                  return (
                    <button
                      key={industry.key}
                      type="button"
                      onClick={() => {
                        setData((prev) => ({
                          ...prev,
                          industryKey: industry.key,
                          industryLabel: industry.label,
                        }));
                      }}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
                        active ? "border-brand bg-brand-soft" : "border-line hover:border-brand-ring",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Check className={cn("size-4 shrink-0", active ? "text-brand" : "invisible")} />
                        <span className="text-sm font-medium text-ink">{industry.label}</span>
                      </span>
                      <span className="mt-1 block pl-6 text-xs leading-5 text-ink-muted">
                        {industry.description}
                      </span>
                    </button>
                  );
                })}
                {filteredIndustries.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-ink-muted sm:col-span-2">
                    No preset matches. Pick the closest one and add your own description below — RegLens uses
                    both.
                  </p>
                ) : null}
              </div>

              <Field
                label="Anything more specific?"
                hint="Optional. Sub-sectors, niches or specialisms RegLens should keep in mind."
              >
                <TagInput
                  values={data.subIndustries}
                  onChange={(next) => set("subIndustries", next)}
                  placeholder="e.g. Winter sportswear"
                />
              </Field>
            </div>
          ) : null}

          {/* ---------------------------------------------------- Step 3 */}
          {step === 2 ? (
            <div className="space-y-4">
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

              <div className="grid gap-2 sm:grid-cols-2">
                <ToggleCard
                  checked={data.importsProducts}
                  onChange={(v) => set("importsProducts", v)}
                  title="We import products"
                  description="Goods cross a national border to reach us."
                />
                <ToggleCard
                  checked={data.employsStaff}
                  onChange={(v) => set("employsStaff", v)}
                  title="We employ staff"
                  description="Payroll, hiring and workplace requirements apply."
                />
                <ToggleCard
                  checked={data.handlesCustomerData}
                  onChange={(v) => set("handlesCustomerData", v)}
                  title="We handle customer data"
                  description="Names, contact details, payment or usage data."
                />
                <ToggleCard
                  checked={data.physicalLocations}
                  onChange={(v) => set("physicalLocations", v)}
                  title="We operate physical locations"
                  description="Offices, stores, classrooms, warehouses or kitchens."
                />
                <ToggleCard
                  checked={data.sellsCrossBorder}
                  onChange={(v) => set("sellsCrossBorder", v)}
                  title="We sell across state or national borders"
                  description="Triggers tax registration thresholds in other places."
                />
                <ToggleCard
                  checked={data.requiresLicenses}
                  onChange={(v) => set("requiresLicenses", v)}
                  title="We need licences or certifications"
                  description="Permits, professional licences or product certificates."
                />
                <ToggleCard
                  checked={data.regulatedIndustry}
                  onChange={(v) => set("regulatedIndustry", v)}
                  title="We work in a regulated industry"
                  description="A sector regulator oversees how we operate."
                />
              </div>

              {data.importsProducts ? (
                <Field label="Countries you import from" hint="Two-letter codes or names both work.">
                  <TagInput
                    values={data.importCountries}
                    onChange={(next) => set("importCountries", next)}
                    suggestions={IMPORT_COUNTRY_SUGGESTIONS}
                    placeholder="Add a country"
                  />
                </Field>
              ) : null}
            </div>
          ) : null}

          {/* ---------------------------------------------------- Step 4 */}
          {step === 3 ? (
            <div className="space-y-4">
              <ToggleCard
                checked={data.plansExpansion}
                onChange={(v) => set("plansExpansion", v)}
                title="We plan to expand into a new jurisdiction"
                description="RegLens will surface what you need before you get there."
              />

              {data.plansExpansion ? (
                <div className="space-y-4 rounded-lg border border-line bg-surface-muted p-4">
                  <div className="grid gap-4 sm:grid-cols-3">
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
                    <Field label="Target city" htmlFor="targetCity" hint="Optional.">
                      <Input
                        id="targetCity"
                        value={data.targetCity ?? ""}
                        onChange={(e) => set("targetCity", e.target.value || null)}
                        placeholder="Toronto"
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

                  <Field label="Expected date" htmlFor="expansionDate" hint="Approximate is fine.">
                    <Input
                      id="expansionDate"
                      type="date"
                      value={data.expansionDate ?? ""}
                      onChange={(e) => set("expansionDate", e.target.value || null)}
                    />
                  </Field>
                </div>
              ) : (
                <p className="rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-sm text-ink-muted">
                  No expansion planned right now. You can add one later from your business profile, and RegLens
                  will refresh what it recommends.
                </p>
              )}
            </div>
          ) : null}

          {/* ---------------------------------------------------- Step 5 */}
          {step === 4 ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-soft">
                Pick the areas that worry you most. RegLens ranks matching requirements higher and starts
                monitoring them for you.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {COMPLIANCE_TOPICS.map((topic) => {
                  const active = data.compliancePriorities.includes(topic.key);
                  return (
                    <ToggleCard
                      key={topic.key}
                      checked={active}
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
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* ---------------------------------------------------- Step 6 */}
          {step === 5 ? (
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

              <div className="grid gap-2 sm:grid-cols-3">
                <ToggleCard
                  checked={data.hasComplianceStaff}
                  onChange={(v) => set("hasComplianceStaff", v)}
                  title="We have a compliance employee"
                />
                <ToggleCard
                  checked={data.usesSpreadsheets}
                  onChange={(v) => set("usesSpreadsheets", v)}
                  title="We use spreadsheets"
                />
                <ToggleCard
                  checked={data.usesExternalTool}
                  onChange={(v) => set("usesExternalTool", v)}
                  title="We use external software"
                />
              </div>

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

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-muted p-3">
                <Checkbox
                  checked={data.disclaimerAccepted}
                  onChange={(e) => set("disclaimerAccepted", e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-xs leading-5 text-ink-soft">{DISCLAIMER}</span>
              </label>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || pending}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next} disabled={pending}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={pending}>
                {pending ? "Saving…" : isEdit ? "Save profile" : "Finish and open my dashboard"}
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
