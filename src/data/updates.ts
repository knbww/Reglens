import type { PolicyImportance, UpdateType } from "@prisma/client";

export type PolicyVersionSeed = {
  policyId: string;
  version: number;
  effectiveAt: string;
  summary: string;
  changeNote: string;
};

export type PolicyUpdateSeed = {
  policyId: string;
  /** Version this update refers to, if any. */
  version?: number;
  type: UpdateType;
  title: string;
  description: string;
  importance: PolicyImportance;
  /** Days before "today" that this change was detected. */
  detectedDaysAgo: number;
};

/**
 * Versioned history behind the monitoring change feed. The MVP simulates
 * scheduled monitoring from these seeded records — it is not a live crawler.
 */
export const POLICY_VERSIONS: PolicyVersionSeed[] = [
  {
    policyId: "us-cpsc-general-certificate",
    version: 1,
    effectiveAt: "2008-11-12",
    summary: "Original certification requirement introduced by the CPSIA.",
    changeNote: "Initial record.",
  },
  {
    policyId: "us-cpsc-general-certificate",
    version: 2,
    effectiveAt: "2026-01-22",
    summary:
      "Electronic filing of certificate data at entry expanded to additional consumer product categories.",
    changeNote:
      "Importers in newly covered categories must transmit certificate data elements electronically at the time of entry rather than only holding the certificate on file.",
  },
  {
    policyId: "us-ftc-textile-labeling",
    version: 1,
    effectiveAt: "1960-03-03",
    summary: "Original fibre content and origin disclosure requirements.",
    changeNote: "Initial record.",
  },
  {
    policyId: "us-ftc-textile-labeling",
    version: 2,
    effectiveAt: "2026-02-25",
    summary:
      "Guidance clarified that fibre content and country of origin must appear in the online product description, not only on the physical label.",
    changeNote:
      "E-commerce listings must carry the same disclosures as the garment label. Marketplace listings are explicitly in scope.",
  },
  {
    policyId: "us-cpsc-flammability-1610",
    version: 1,
    effectiveAt: "1954-07-01",
    summary: "Original flammability classification for clothing textiles.",
    changeNote: "Initial record.",
  },
  {
    policyId: "us-cpsc-flammability-1610",
    version: 2,
    effectiveAt: "2026-09-30",
    summary:
      "Updated test method references and tightened record retention for raised-surface fabric exemption claims.",
    changeNote:
      "Suppliers claiming exemption for napped or brushed fabrics must retain fabric construction evidence, not only a supplier guaranty.",
  },
  {
    policyId: "ca-cbsa-carm-import",
    version: 1,
    effectiveAt: "2024-10-21",
    summary: "CARM becomes the system of record for commercial importing.",
    changeNote: "Initial record.",
  },
  {
    policyId: "ca-cbsa-carm-import",
    version: 2,
    effectiveAt: "2026-05-19",
    summary:
      "Transition relief for importers without their own financial security ended; release-prior-to-payment now requires the importer's own security.",
    changeNote:
      "Importers still relying on a broker's bond lose release privileges and must post their own security.",
  },
  {
    policyId: "us-fda-food-code-equipment",
    version: 1,
    effectiveAt: "2023-01-01",
    summary: "2022 Food Code edition published.",
    changeNote: "Initial record.",
  },
  {
    policyId: "us-fda-food-code-equipment",
    version: 2,
    effectiveAt: "2026-06-11",
    summary:
      "Guidance added for automated and robotic food preparation equipment, covering cleaning access to enclosed mechanisms.",
    changeNote:
      "Automated equipment must document cleaning access and validated cleaning frequency for enclosed drive and dispensing mechanisms.",
  },
  {
    policyId: "us-ca-cpra-privacy",
    version: 1,
    effectiveAt: "2023-01-01",
    summary: "CPRA amendments take effect.",
    changeNote: "Initial record.",
  },
  {
    policyId: "us-ca-cpra-privacy",
    version: 2,
    effectiveAt: "2026-06-19",
    summary:
      "Risk assessment and cybersecurity audit regulations finalised, with phased submission dates by processing volume.",
    changeNote:
      "Businesses conducting higher-risk processing must complete documented risk assessments and, above thresholds, annual cybersecurity audits.",
  },
  {
    policyId: "ca-quebec-law-25",
    version: 1,
    effectiveAt: "2023-09-22",
    summary: "Core Law 25 obligations take effect.",
    changeNote: "Initial record.",
  },
  {
    policyId: "ca-quebec-law-25",
    version: 2,
    effectiveAt: "2026-04-17",
    summary:
      "Regulator guidance on privacy impact assessments for transfers outside Quebec expanded, with a published assessment template.",
    changeNote:
      "Transfers outside Quebec require a documented assessment covering sensitivity, purposes, safeguards and the legal regime of the destination.",
  },
  {
    policyId: "ca-crtc-tsp-registration",
    version: 1,
    effectiveAt: "2021-09-01",
    summary: "Mandatory TSP registration introduced.",
    changeNote: "Initial record.",
  },
  {
    policyId: "ca-crtc-tsp-registration",
    version: 2,
    effectiveAt: "2026-06-02",
    summary:
      "Annual data collection categories restructured; providers must break out revenue by additional service categories.",
    changeNote:
      "Revenue reporting categories changed, requiring providers to remap internal revenue classifications before the next filing.",
  },
  {
    policyId: "us-ca-prop-65",
    version: 1,
    effectiveAt: "1988-02-27",
    summary: "Original warning requirement.",
    changeNote: "Initial record.",
  },
  {
    policyId: "us-ca-prop-65",
    version: 2,
    effectiveAt: "2026-01-08",
    summary:
      "Short-form warning content restricted; short-form warnings must now name at least one listed chemical.",
    changeNote:
      "Existing short-form labels without a named chemical must be updated. A sell-through period applies to products already labelled.",
  },
  {
    policyId: "us-ca-sales-tax-nexus",
    version: 1,
    effectiveAt: "2019-04-01",
    summary: "Economic nexus threshold established following Wayfair.",
    changeNote: "Initial record.",
  },
  {
    policyId: "mx-nom-050-labelling",
    version: 1,
    effectiveAt: "2004-08-30",
    summary: "General commercial information labelling requirements.",
    changeNote: "Initial record.",
  },
];

export const POLICY_UPDATES: PolicyUpdateSeed[] = [
  {
    policyId: "us-cpsc-general-certificate",
    version: 2,
    type: "REQUIREMENT_CHANGED",
    title: "Electronic certificate filing expanded to more product categories",
    description:
      "Importers in newly covered categories must transmit certificate data at entry instead of only retaining the certificate. Check whether your product's category is now in scope and confirm your broker can transmit the data elements.",
    importance: "HIGH",
    detectedDaysAgo: 6,
  },
  {
    policyId: "us-ftc-textile-labeling",
    version: 2,
    type: "UPDATED_POLICY",
    title: "Fibre content and origin must appear in online listings",
    description:
      "Updated FTC guidance confirms that e-commerce product descriptions must disclose fibre content and country of origin. Product pages and marketplace listings both need review.",
    importance: "HIGH",
    detectedDaysAgo: 3,
  },
  {
    policyId: "us-cpsc-flammability-1610",
    version: 2,
    type: "EFFECTIVE_DATE_CHANGED",
    title: "Tighter records for raised-surface fabric exemptions take effect 30 September",
    description:
      "Claims that a napped or brushed fabric is exempt from flammability testing will require fabric construction evidence on file. A supplier guaranty alone will no longer be sufficient.",
    importance: "CRITICAL",
    detectedDaysAgo: 9,
  },
  {
    policyId: "ca-cbsa-carm-import",
    version: 2,
    type: "REQUIREMENT_CHANGED",
    title: "Broker bond transition relief has ended",
    description:
      "Importers must now post their own financial security to keep release-prior-to-payment privileges. Importers still relying on a broker's bond will see shipments held pending payment.",
    importance: "CRITICAL",
    detectedDaysAgo: 12,
  },
  {
    policyId: "us-fda-food-code-equipment",
    version: 2,
    type: "UPDATED_POLICY",
    title: "New guidance for automated and robotic food preparation equipment",
    description:
      "Cleaning access to enclosed drive and dispensing mechanisms must be documented, along with a validated cleaning frequency. Health departments are expected to ask for this at plan review.",
    importance: "HIGH",
    detectedDaysAgo: 4,
  },
  {
    policyId: "us-ca-cpra-privacy",
    version: 2,
    type: "NEW_POLICY",
    title: "Risk assessment and cybersecurity audit rules finalised",
    description:
      "Businesses conducting higher-risk processing must complete documented risk assessments, with annual cybersecurity audits above defined thresholds. Submission dates are phased by processing volume.",
    importance: "HIGH",
    detectedDaysAgo: 8,
  },
  {
    policyId: "ca-quebec-law-25",
    version: 2,
    type: "UPDATED_POLICY",
    title: "Expanded guidance on privacy impact assessments for data leaving Quebec",
    description:
      "The regulator published an assessment template covering sensitivity, purposes, safeguards and the destination's legal regime. Existing transfer assessments should be re-checked against it.",
    importance: "MODERATE",
    detectedDaysAgo: 15,
  },
  {
    policyId: "ca-crtc-tsp-registration",
    version: 2,
    type: "REQUIREMENT_CHANGED",
    title: "Annual data collection revenue categories restructured",
    description:
      "Service revenue must be reported under a revised category structure. Internal revenue mapping should be updated well before the next annual filing.",
    importance: "MODERATE",
    detectedDaysAgo: 20,
  },
  {
    policyId: "us-ca-prop-65",
    version: 2,
    type: "REQUIREMENT_CHANGED",
    title: "Short-form warnings must now name a listed chemical",
    description:
      "Short-form Proposition 65 warnings without a named chemical are no longer compliant. Labels and online warnings both need updating, subject to a sell-through period for existing stock.",
    importance: "HIGH",
    detectedDaysAgo: 18,
  },
  {
    policyId: "us-ca-sales-tax-nexus",
    type: "DEADLINE_APPROACHING",
    title: "Q3 California sales tax return due 31 October",
    description:
      "The quarterly return and payment are due at the end of the month following quarter end. Zero returns are still required if you are registered.",
    importance: "MODERATE",
    detectedDaysAgo: 2,
  },
  {
    policyId: "us-nsf-equipment-certification",
    type: "DEADLINE_APPROACHING",
    title: "Factory audit window opens 24 August",
    description:
      "Unannounced factory inspections resume in the next audit window. Production records and retained samples should be ready.",
    importance: "HIGH",
    detectedDaysAgo: 5,
  },
  {
    policyId: "ca-gst-hst-registration",
    type: "DEADLINE_APPROACHING",
    title: "Quarterly GST/HST return due 31 October",
    description:
      "The return and net tax payment are due one month after the reporting period ends.",
    importance: "MODERATE",
    detectedDaysAgo: 1,
  },
  {
    policyId: "us-ca-bppe-tutoring-exemption",
    type: "UPDATED_POLICY",
    title: "Exemption guidance refreshed for supplemental education providers",
    description:
      "Updated guidance restates how the Bureau distinguishes non-vocational tutoring from programmes requiring approval. Providers adding adult programmes should re-run their analysis.",
    importance: "MODERATE",
    detectedDaysAgo: 11,
  },
  {
    policyId: "mx-padron-importadores",
    type: "UPDATED_POLICY",
    title: "Sectoral registry review cycle tightened",
    description:
      "Registry status checks tied to tax-compliance standing are being applied more frequently. Confirm registry status before booking freight.",
    importance: "MODERATE",
    detectedDaysAgo: 22,
  },
  {
    policyId: "us-fcc-cpni",
    type: "DEADLINE_APPROACHING",
    title: "Annual CPNI officer certification preparation",
    description:
      "The signed officer certification is due 1 March covering the prior calendar year. Compliance statements and complaint summaries take time to assemble.",
    importance: "MODERATE",
    detectedDaysAgo: 7,
  },
  {
    policyId: "us-ca-la-business-tax-certificate",
    type: "DEADLINE_APPROACHING",
    title: "Business tax renewal window approaching",
    description:
      "The renewal must be filed by 28 February to keep the small business exemption. Prior-year gross receipts by classification are needed.",
    importance: "MODERATE",
    detectedDaysAgo: 14,
  },
  {
    policyId: "us-country-of-origin-marking",
    type: "UPDATED_POLICY",
    title: "Marking enforcement focus on e-commerce fulfilment",
    description:
      "Enforcement attention has shifted toward goods entering through e-commerce fulfilment channels where marking is applied after import.",
    importance: "MODERATE",
    detectedDaysAgo: 26,
  },
  {
    policyId: "ca-packaging-labelling-bilingual",
    type: "UPDATED_POLICY",
    title: "Reminder issued on bilingual net quantity type height",
    description:
      "Guidance restated the minimum type height rules for net quantity declarations based on principal display surface area.",
    importance: "LOW",
    detectedDaysAgo: 30,
  },
];
