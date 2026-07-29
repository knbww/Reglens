/**
 * Shared vocabulary for the onboarding survey, filters, relevance scoring and
 * the AI Analyst prompt. Keys are stable; labels are what users see.
 */

export const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export const INDUSTRIES = [
  {
    key: "cross_border_ecommerce",
    label: "Cross-border e-commerce",
    description: "Online retail that ships or sources across national borders.",
  },
  {
    key: "imported_consumer_products",
    label: "Imported consumer products",
    description: "Physical goods brought in for resale to consumers.",
  },
  {
    key: "textile_apparel_import",
    label: "Textile & apparel import",
    description: "Clothing, fabric and wearable goods importers.",
  },
  {
    key: "education_tutoring",
    label: "Education & tutoring",
    description: "Learning centres, tutoring services and training providers.",
  },
  {
    key: "food_service_technology",
    label: "Food service technology",
    description: "Technology sold into restaurants and commercial kitchens.",
  },
  {
    key: "kitchen_robotics_machinery",
    label: "Kitchen robotics & commercial machinery",
    description: "Automated equipment and commercial machinery suppliers.",
  },
  {
    key: "telecommunications",
    label: "Telecommunications",
    description: "Network operators, MVNOs and telecom software providers.",
  },
  {
    key: "general_small_business",
    label: "General small business",
    description: "Everything else — services, retail, trades and local business.",
  },
] as const;

export type IndustryKey = (typeof INDUSTRIES)[number]["key"];

export const COMPLIANCE_TOPICS = [
  { key: "business_registration", label: "Business registration", blurb: "Entity formation, registered agents, annual filings." },
  { key: "permits_licenses", label: "Permits & licenses", blurb: "Operating permits and occupational licences." },
  { key: "product_standards", label: "Product standards", blurb: "Safety, performance and labelling standards for goods." },
  { key: "imports_customs", label: "Imports & customs", blurb: "Entry filings, duties, tariffs and broker requirements." },
  { key: "product_safety", label: "FDA / product safety", blurb: "Consumer product and health-adjacent product oversight." },
  { key: "textile_labeling", label: "Textile labeling & testing", blurb: "Fibre content, care labels and flammability testing." },
  { key: "education_licensing", label: "Education licensing", blurb: "Tutoring, childcare-adjacent and training licences." },
  { key: "food_sanitation", label: "Food sanitation", blurb: "Food-contact surfaces, sanitation and equipment hygiene." },
  { key: "machinery_safety", label: "Machinery safety", blurb: "Guarding, electrical safety and equipment certification." },
  { key: "telecom_regulation", label: "Telecom regulation", blurb: "Spectrum, network, and communications service rules." },
  { key: "employment", label: "Employment", blurb: "Hiring, payroll, workplace posters and worker protections." },
  { key: "privacy", label: "Privacy & data", blurb: "Personal information handling, consent and breach duties." },
  { key: "taxation", label: "Taxation", blurb: "Sales tax, GST/HST, use tax and remittance." },
  { key: "reporting", label: "Reporting", blurb: "Periodic filings and disclosures to authorities." },
  { key: "certification_renewals", label: "Certification renewals", blurb: "Keeping certificates and registrations current." },
] as const;

export type TopicKey = (typeof COMPLIANCE_TOPICS)[number]["key"];

export const ORG_TYPES = [
  "Sole proprietorship",
  "LLC",
  "Corporation",
  "S-Corporation",
  "Partnership",
  "Nonprofit",
  "Cooperative",
  "Branch of foreign company",
] as const;

export const SIZE_BANDS = [
  { key: "1", label: "Just me" },
  { key: "2-10", label: "2–10 people" },
  { key: "11-50", label: "11–50 people" },
  { key: "51-200", label: "51–200 people" },
  { key: "201-1000", label: "201–1,000 people" },
  { key: "1000+", label: "More than 1,000 people" },
] as const;

export const TRACKING_METHODS = [
  { key: "nothing_formal", label: "Nothing formal yet" },
  { key: "spreadsheets", label: "Spreadsheets" },
  { key: "email_calendar", label: "Email and calendar reminders" },
  { key: "external_software", label: "External compliance software" },
  { key: "external_advisor", label: "An external advisor or firm" },
  { key: "internal_team", label: "An internal compliance team" },
] as const;

export const REVIEW_FREQUENCIES = [
  { key: "rarely", label: "Rarely or never" },
  { key: "annually", label: "About once a year" },
  { key: "quarterly", label: "Quarterly" },
  { key: "monthly", label: "Monthly" },
  { key: "weekly", label: "Weekly or more" },
] as const;

export const TASK_CATEGORIES = [
  "registration",
  "licensing",
  "product",
  "imports",
  "safety",
  "labeling",
  "tax",
  "privacy",
  "employment",
  "reporting",
  "general",
] as const;

export const DISCLAIMER =
  "RegLens provides regulatory information and organizational tools. It does not constitute legal, tax, accounting, or professional advice. Regulations may change, and users should verify important requirements with the responsible authority or a qualified professional.";

export const SHORT_DISCLAIMER =
  "Regulatory information, not legal advice. Verify important requirements with the responsible authority.";

export function industryLabel(key: string): string {
  return INDUSTRIES.find((i) => i.key === key)?.label ?? key;
}

export function topicLabel(key: string): string {
  return COMPLIANCE_TOPICS.find((t) => t.key === key)?.label ?? key;
}

export function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
