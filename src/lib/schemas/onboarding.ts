import { z } from "zod";

/** Shape submitted by the onboarding survey and by the profile editor. */
export const onboardingSchema = z.object({
  // Step 1 — company
  name: z.string().min(2, "Enter your company name"),
  description: z.string().min(10, "Describe what the business does in a sentence or two"),
  website: z.string().url("Enter a full URL including https://").or(z.literal("")).optional(),
  sizeBand: z.string().min(1),
  employeeCount: z.coerce.number().int().min(0).max(1_000_000),
  orgType: z.string().min(1),
  country: z.enum(["US", "CA", "MX"]),
  region: z.string().min(1, "Select your state, province or region"),
  city: z.string().min(1, "Enter your city"),
  operatingJurisdictions: z.array(z.string()).min(1, "Select at least one operating jurisdiction"),

  // Step 2 — industry
  industryKey: z.string().min(1),
  industryLabel: z.string().min(1),
  subIndustries: z.array(z.string()).default([]),

  // Step 3 — activities
  productsSold: z.array(z.string()).default([]),
  servicesProvided: z.array(z.string()).default([]),
  importsProducts: z.boolean().default(false),
  importCountries: z.array(z.string()).default([]),
  employsStaff: z.boolean().default(false),
  handlesCustomerData: z.boolean().default(false),
  physicalLocations: z.boolean().default(false),
  sellsCrossBorder: z.boolean().default(false),
  requiresLicenses: z.boolean().default(false),
  regulatedIndustry: z.boolean().default(false),

  // Step 4 — expansion
  plansExpansion: z.boolean().default(false),
  targetCountry: z.string().optional().nullable(),
  targetRegion: z.string().optional().nullable(),
  targetCity: z.string().optional().nullable(),
  expansionActivity: z.string().optional().nullable(),
  expansionDate: z.string().optional().nullable(),

  // Step 5 — priorities
  compliancePriorities: z.array(z.string()).default([]),

  // Step 6 — current workflow
  trackingMethod: z.string().min(1),
  hasComplianceStaff: z.boolean().default(false),
  usesSpreadsheets: z.boolean().default(false),
  usesExternalTool: z.boolean().default(false),
  reviewFrequency: z.string().min(1),
  topConcern: z.string().default(""),

  disclaimerAccepted: z.boolean(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const EMPTY_ONBOARDING: OnboardingInput = {
  name: "",
  description: "",
  website: "",
  sizeBand: "2-10",
  employeeCount: 1,
  orgType: "LLC",
  country: "US",
  region: "",
  city: "",
  operatingJurisdictions: [],
  industryKey: "general_small_business",
  industryLabel: "General small business",
  subIndustries: [],
  productsSold: [],
  servicesProvided: [],
  importsProducts: false,
  importCountries: [],
  employsStaff: false,
  handlesCustomerData: false,
  physicalLocations: false,
  sellsCrossBorder: false,
  requiresLicenses: false,
  regulatedIndustry: false,
  plansExpansion: false,
  targetCountry: null,
  targetRegion: null,
  targetCity: null,
  expansionActivity: null,
  expansionDate: null,
  compliancePriorities: [],
  trackingMethod: "nothing_formal",
  hasComplianceStaff: false,
  usesSpreadsheets: false,
  usesExternalTool: false,
  reviewFrequency: "rarely",
  topConcern: "",
  disclaimerAccepted: false,
};
