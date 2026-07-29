import type { JurisdictionRole, ReminderKind, TaskPriority, TaskStatus } from "@prisma/client";

export type DemoTaskSeed = {
  title: string;
  description: string;
  category: string;
  policyId?: string;
  jurisdictionCode?: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** Days from "today"; negative means overdue. */
  dueInDays?: number;
  checklist: { label: string; done: boolean }[];
  notes?: string;
};

export type DemoPlanSeed = {
  title: string;
  description: string;
  category: string;
  policyId?: string;
  jurisdictionCode?: string;
  tasks: DemoTaskSeed[];
};

export type DemoReminderSeed = {
  title: string;
  notes: string;
  kind: ReminderKind;
  policyId?: string;
  dueInDays: number;
  advanceDays: number;
};

export type DemoBusinessSeed = {
  slug: string;
  name: string;
  description: string;
  website: string;
  country: string;
  region: string;
  city: string;
  sizeBand: string;
  employeeCount: number;
  orgType: string;
  profile: {
    industryKey: string;
    industryLabel: string;
    subIndustries: string[];
    productsSold: string[];
    servicesProvided: string[];
    importsProducts: boolean;
    importCountries: string[];
    employsStaff: boolean;
    handlesCustomerData: boolean;
    physicalLocations: boolean;
    sellsCrossBorder: boolean;
    requiresLicenses: boolean;
    regulatedIndustry: boolean;
    plansExpansion: boolean;
    targetCountry?: string;
    targetRegion?: string;
    targetCity?: string;
    expansionActivity?: string;
    expansionInDays?: number;
    compliancePriorities: string[];
    trackingMethod: string;
    hasComplianceStaff: boolean;
    usesSpreadsheets: boolean;
    usesExternalTool: boolean;
    reviewFrequency: string;
    topConcern: string;
  };
  jurisdictions: { code: string; role: JurisdictionRole }[];
  monitoredPolicyIds: string[];
  monitoredTopics: string[];
  savedPolicyIds: string[];
  plans: DemoPlanSeed[];
  reminders: DemoReminderSeed[];
};

/**
 * Five demo businesses. Each one produces a materially different dashboard,
 * relevance ranking, risk score, task list and AI Analyst context.
 */
export const DEMO_BUSINESSES: DemoBusinessSeed[] = [
  // -------------------------------------------------------------------------
  {
    slug: "frostonic",
    name: "Frostonic",
    description:
      "Direct-to-consumer brand selling imported cold plunge and ice bath tubs across the United States, with a planned launch in Canada.",
    website: "https://frostonic.example.com",
    country: "US",
    region: "US-CA",
    city: "Los Angeles",
    sizeBand: "2-10",
    employeeCount: 6,
    orgType: "LLC",
    profile: {
      industryKey: "cross_border_ecommerce",
      industryLabel: "Cross-border e-commerce",
      subIndustries: ["Recovery and wellness equipment", "Direct-to-consumer retail"],
      productsSold: ["Ice bath tubs", "Chiller units", "Insulated covers", "Water treatment accessories"],
      servicesProvided: ["Delivery and installation coordination", "Extended warranty support"],
      importsProducts: true,
      importCountries: ["CN", "VN"],
      employsStaff: true,
      handlesCustomerData: true,
      physicalLocations: true,
      sellsCrossBorder: true,
      requiresLicenses: false,
      regulatedIndustry: false,
      plansExpansion: true,
      targetCountry: "CA",
      targetRegion: "CA-ON",
      targetCity: "Toronto",
      expansionActivity: "Selling online to Canadian consumers with a third-party fulfilment partner in Ontario",
      expansionInDays: 118,
      compliancePriorities: [
        "imports_customs",
        "product_safety",
        "product_standards",
        "taxation",
        "business_registration",
      ],
      trackingMethod: "spreadsheets",
      hasComplianceStaff: false,
      usesSpreadsheets: true,
      usesExternalTool: false,
      reviewFrequency: "rarely",
      topConcern:
        "We do not know what we are supposed to file when our containers arrive, and we are about to start shipping to Canada.",
    },
    jurisdictions: [
      { code: "US", role: "OPERATING" },
      { code: "US-CA", role: "OPERATING" },
      { code: "US-NY", role: "OPERATING" },
      { code: "US-TX", role: "OPERATING" },
      { code: "CA", role: "TARGET_EXPANSION" },
      { code: "CA-ON", role: "TARGET_EXPANSION" },
    ],
    monitoredPolicyIds: [
      "us-cbp-importer-of-record",
      "us-cpsc-general-certificate",
      "us-ca-prop-65",
      "ca-cbsa-carm-import",
    ],
    monitoredTopics: ["imports_customs", "product_safety"],
    savedPolicyIds: ["us-fda-general-wellness-device", "ca-packaging-labelling-bilingual"],
    plans: [
      {
        title: "Get import compliance under control",
        description:
          "Everything needed so containers clear customs without holds and products can be legally sold in the United States.",
        category: "imports",
        policyId: "us-cbp-importer-of-record",
        jurisdictionCode: "US",
        tasks: [
          {
            title: "Confirm HTS classification for tub and chiller SKUs",
            description:
              "Classification drives duty rate. Get a written opinion from the customs broker covering both the tub and the separately shipped chiller unit.",
            category: "imports",
            policyId: "us-cbp-importer-of-record",
            jurisdictionCode: "US",
            priority: "HIGH",
            status: "IN_PROGRESS",
            dueInDays: 9,
            checklist: [
              { label: "Send product specs and photos to broker", done: true },
              { label: "Get written classification opinion for tub", done: true },
              { label: "Get written classification opinion for chiller", done: false },
              { label: "Update the product master with HTS codes", done: false },
            ],
            notes: "Broker flagged that the chiller may classify separately from the tub.",
          },
          {
            title: "Increase continuous customs bond amount",
            description:
              "Projected duty volume for the next 12 months exceeds the current bond. Insufficient bond amounts cause release delays.",
            category: "imports",
            policyId: "us-cbp-importer-of-record",
            priority: "MEDIUM",
            status: "NOT_STARTED",
            dueInDays: 24,
            checklist: [
              { label: "Pull 12-month duty projection", done: false },
              { label: "Request bond increase quote from surety", done: false },
              { label: "File the rider with CBP", done: false },
            ],
          },
          {
            title: "Issue General Certificates of Conformity for the tub line",
            description:
              "Products subject to a CPSC rule need a written certificate based on a reasonable testing programme before import or distribution.",
            category: "product",
            policyId: "us-cpsc-general-certificate",
            priority: "URGENT",
            status: "NOT_STARTED",
            dueInDays: -4,
            checklist: [
              { label: "Identify every CPSC rule that applies", done: false },
              { label: "Confirm supplier test reports cover those rules", done: false },
              { label: "Draft the GCC template", done: false },
              { label: "Share the certificate with the broker for entry", done: false },
            ],
            notes: "Overdue — the last shipment was released without a certificate on file.",
          },
        ],
      },
      {
        title: "Prepare for the Canadian launch",
        description:
          "Steps that must be complete before the first shipment reaches the Ontario fulfilment partner.",
        category: "imports",
        policyId: "ca-cbsa-carm-import",
        jurisdictionCode: "CA",
        tasks: [
          {
            title: "Register in the CARM Client Portal",
            description:
              "Commercial importers into Canada need their own portal account, delegated broker access and their own financial security.",
            category: "imports",
            policyId: "ca-cbsa-carm-import",
            jurisdictionCode: "CA",
            priority: "HIGH",
            status: "NOT_STARTED",
            dueInDays: 31,
            checklist: [
              { label: "Obtain a Canadian Business Number with an RM account", done: false },
              { label: "Create the CARM portal business account", done: false },
              { label: "Post financial security", done: false },
              { label: "Delegate authority to the customs broker", done: false },
            ],
          },
          {
            title: "Produce bilingual packaging artwork",
            description:
              "Product identity and net quantity must appear in both English and French with metric units before goods ship to Canada.",
            category: "labeling",
            policyId: "ca-packaging-labelling-bilingual",
            jurisdictionCode: "CA",
            priority: "MEDIUM",
            status: "NOT_STARTED",
            dueInDays: 45,
            checklist: [
              { label: "Translate product identity and quantity statements", done: false },
              { label: "Check minimum type height for net quantity", done: false },
              { label: "Send revised artwork to the factory", done: false },
            ],
          },
        ],
      },
      {
        title: "Sales tax registration clean-up",
        description: "Register where economic nexus has been triggered and close the gaps in collection.",
        category: "tax",
        policyId: "us-ca-sales-tax-nexus",
        tasks: [
          {
            title: "Review sales-by-state data against nexus thresholds",
            description:
              "Direct website sales are not covered by marketplace collection. Determine which states have been triggered.",
            category: "tax",
            policyId: "us-ca-sales-tax-nexus",
            priority: "HIGH",
            status: "IN_PROGRESS",
            dueInDays: 16,
            checklist: [
              { label: "Export 24 months of sales by ship-to state", done: true },
              { label: "Split marketplace versus direct revenue", done: true },
              { label: "Compare against each state threshold", done: false },
              { label: "List states requiring registration", done: false },
            ],
          },
        ],
      },
    ],
    reminders: [
      {
        title: "California Q3 sales tax return",
        notes: "Quarterly return and payment. File even if the period had no taxable sales.",
        kind: "FILING_DEADLINE",
        policyId: "us-ca-sales-tax-nexus",
        dueInDays: 95,
        advanceDays: 21,
      },
      {
        title: "Product marketing claim audit",
        notes: "Review website copy for treatment or recovery claims that could make the tub a regulated device.",
        kind: "POLICY_REVIEW",
        policyId: "us-fda-general-wellness-device",
        dueInDays: 24,
        advanceDays: 7,
      },
      {
        title: "Prop 65 short-form label update",
        notes: "Short-form warnings now have to name a listed chemical. Existing artwork needs revision.",
        kind: "COMPLIANCE_DEADLINE",
        policyId: "us-ca-prop-65",
        dueInDays: 11,
        advanceDays: 14,
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "ricos-boutique",
    name: "Ricos Boutique",
    description:
      "Boutique importer and retailer of ski and snowboarding apparel, selling online and through a single storefront, with wholesale accounts in the north-east.",
    website: "https://ricosboutique.example.com",
    country: "US",
    region: "US-NY",
    city: "Buffalo",
    sizeBand: "2-10",
    employeeCount: 9,
    orgType: "LLC",
    profile: {
      industryKey: "textile_apparel_import",
      industryLabel: "Textile & apparel import",
      subIndustries: ["Winter sportswear", "Technical outerwear"],
      productsSold: ["Ski jackets", "Snowboard pants", "Fleece base layers", "Gloves and accessories"],
      servicesProvided: ["In-store fitting", "Seasonal wholesale to regional shops"],
      importsProducts: true,
      importCountries: ["IT", "CN", "TR"],
      employsStaff: true,
      handlesCustomerData: true,
      physicalLocations: true,
      sellsCrossBorder: true,
      requiresLicenses: false,
      regulatedIndustry: false,
      plansExpansion: true,
      targetCountry: "CA",
      targetRegion: "CA-QC",
      targetCity: "Montreal",
      expansionActivity: "Wholesale accounts with Quebec ski shops and direct online sales",
      expansionInDays: 156,
      compliancePriorities: [
        "textile_labeling",
        "product_safety",
        "imports_customs",
        "certification_renewals",
        "taxation",
      ],
      trackingMethod: "spreadsheets",
      hasComplianceStaff: false,
      usesSpreadsheets: true,
      usesExternalTool: false,
      reviewFrequency: "annually",
      topConcern:
        "Our fleece styles keep getting flagged by a wholesale buyer for flammability documentation we do not have.",
    },
    jurisdictions: [
      { code: "US", role: "OPERATING" },
      { code: "US-NY", role: "OPERATING" },
      { code: "US-VT", role: "OPERATING" },
      { code: "US-CO", role: "OPERATING" },
      { code: "CA", role: "TARGET_EXPANSION" },
      { code: "CA-QC", role: "TARGET_EXPANSION" },
    ],
    monitoredPolicyIds: [
      "us-ftc-textile-labeling",
      "us-cpsc-flammability-1610",
      "us-ftc-care-labeling",
      "us-cbp-textile-declaration",
    ],
    monitoredTopics: ["textile_labeling", "certification_renewals"],
    savedPolicyIds: ["ca-textile-labelling-act", "us-ny-sales-tax-nexus"],
    plans: [
      {
        title: "Fix labelling across the winter line",
        description:
          "Bring fibre content, care and origin disclosures into compliance on garments and on the website before the season starts.",
        category: "labeling",
        policyId: "us-ftc-textile-labeling",
        jurisdictionCode: "US",
        tasks: [
          {
            title: "Add fibre content and origin to all online listings",
            description:
              "Updated FTC guidance confirms e-commerce descriptions must carry the same disclosures as the sewn-in label.",
            category: "labeling",
            policyId: "us-ftc-textile-labeling",
            priority: "URGENT",
            status: "IN_PROGRESS",
            dueInDays: 5,
            checklist: [
              { label: "Export the full product catalogue", done: true },
              { label: "Map fibre content per SKU from supplier packs", done: true },
              { label: "Update website product descriptions", done: false },
              { label: "Update marketplace listings", done: false },
            ],
            notes: "62 of 148 SKUs updated so far.",
          },
          {
            title: "Verify RN number is current",
            description:
              "The label must show either the full company name or a registered identification number issued by the FTC.",
            category: "labeling",
            policyId: "us-ftc-textile-labeling",
            priority: "LOW",
            status: "COMPLETED",
            dueInDays: -12,
            checklist: [
              { label: "Look up the RN record", done: true },
              { label: "Confirm the business address on file", done: true },
            ],
          },
          {
            title: "Substantiate care instructions for new styles",
            description:
              "A reasonable basis is needed for every care label before the garment is sold. Collect test data or documented supplier evidence.",
            category: "labeling",
            policyId: "us-ftc-care-labeling",
            priority: "MEDIUM",
            status: "NOT_STARTED",
            dueInDays: 38,
            checklist: [
              { label: "List new styles for the season", done: false },
              { label: "Request wash test data from each supplier", done: false },
              { label: "File evidence in the substantiation folder", done: false },
            ],
          },
        ],
      },
      {
        title: "Flammability testing for raised-surface fabrics",
        description:
          "Fleece and brushed fabrics usually cannot rely on the standard exemptions. Testing must be complete before the season's first shipment.",
        category: "safety",
        policyId: "us-cpsc-flammability-1610",
        jurisdictionCode: "US",
        tasks: [
          {
            title: "Identify every raised-surface fabric in the line",
            description:
              "Napped, brushed and fleece constructions need review against the 16 CFR 1610 exemption criteria.",
            category: "safety",
            policyId: "us-cpsc-flammability-1610",
            priority: "URGENT",
            status: "IN_PROGRESS",
            dueInDays: 2,
            checklist: [
              { label: "Pull fabric construction data per style", done: true },
              { label: "Flag napped and brushed constructions", done: true },
              { label: "Confirm weight and fibre content exemptions", done: false },
            ],
          },
          {
            title: "Book laboratory flammability testing",
            description:
              "Non-exempt fabrics need a test report establishing the flammability class before certification.",
            category: "safety",
            policyId: "us-cpsc-flammability-1610",
            priority: "HIGH",
            status: "NOT_STARTED",
            dueInDays: 21,
            checklist: [
              { label: "Request quotes from two accredited labs", done: false },
              { label: "Ship fabric samples", done: false },
              { label: "Receive and file test reports", done: false },
            ],
          },
          {
            title: "Issue General Certificates of Conformity for the season",
            description:
              "Certificates must list 16 CFR 1610 and every other applicable rule, and be available to CBP at entry.",
            category: "product",
            policyId: "us-cpsc-general-certificate",
            priority: "HIGH",
            status: "NOT_STARTED",
            dueInDays: 55,
            checklist: [
              { label: "Collect test reports for all styles", done: false },
              { label: "Generate certificates per shipment", done: false },
              { label: "Send certificates to the broker", done: false },
            ],
          },
        ],
      },
    ],
    reminders: [
      {
        title: "Flammability records requirement takes effect",
        notes:
          "From 30 September, exemption claims for napped fabrics need construction evidence rather than only a supplier guaranty.",
        kind: "COMPLIANCE_DEADLINE",
        policyId: "us-cpsc-flammability-1610",
        dueInDays: 64,
        advanceDays: 30,
      },
      {
        title: "Fabric test report renewal",
        notes: "Re-test where the fabric supplier, construction or finish has changed since last season.",
        kind: "CERTIFICATION_RENEWAL",
        policyId: "us-cpsc-flammability-1610",
        dueInDays: 21,
        advanceDays: 14,
      },
      {
        title: "New York sales tax quarter ends",
        notes: "Quarter ends 31 August; return due around 21 September. Check clothing exemption configuration by locality.",
        kind: "FILING_DEADLINE",
        policyId: "us-ny-sales-tax-nexus",
        dueInDays: 34,
        advanceDays: 14,
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "kumon-learning-center",
    name: "Kumon Learning Center — Westside",
    description:
      "Independently operated after-school learning centre offering maths and reading programmes to students from kindergarten through high school.",
    website: "https://westside-learning.example.com",
    country: "US",
    region: "US-CA",
    city: "Los Angeles",
    sizeBand: "2-10",
    employeeCount: 8,
    orgType: "Sole proprietorship",
    profile: {
      industryKey: "education_tutoring",
      industryLabel: "Education & tutoring",
      subIndustries: ["Supplemental education", "After-school programmes"],
      productsSold: ["Workbooks and learning materials"],
      servicesProvided: ["Maths instruction", "Reading instruction", "Progress assessments"],
      importsProducts: false,
      importCountries: [],
      employsStaff: true,
      handlesCustomerData: true,
      physicalLocations: true,
      sellsCrossBorder: false,
      requiresLicenses: true,
      regulatedIndustry: true,
      plansExpansion: true,
      targetCountry: "US",
      targetRegion: "US-NY",
      targetCity: "Brooklyn",
      expansionActivity: "Opening a second learning centre location",
      expansionInDays: 224,
      compliancePriorities: [
        "education_licensing",
        "permits_licenses",
        "business_registration",
        "employment",
        "taxation",
      ],
      trackingMethod: "nothing_formal",
      hasComplianceStaff: false,
      usesSpreadsheets: false,
      usesExternalTool: false,
      reviewFrequency: "rarely",
      topConcern:
        "I am not sure which licences I actually need, and I keep hearing different answers about whether tutoring requires state approval.",
    },
    jurisdictions: [
      { code: "US", role: "OPERATING" },
      { code: "US-CA", role: "OPERATING" },
      { code: "US-CA-LAC", role: "OPERATING" },
      { code: "US-NY", role: "TARGET_EXPANSION" },
    ],
    monitoredPolicyIds: [
      "us-ca-bppe-tutoring-exemption",
      "us-ca-la-business-tax-certificate",
      "us-ca-child-safety-screening",
    ],
    monitoredTopics: ["education_licensing", "permits_licenses"],
    savedPolicyIds: ["us-local-occupancy-fire-permit"],
    plans: [
      {
        title: "Confirm the licensing position",
        description:
          "Establish, in writing, which approvals the centre needs and which exemptions it relies on.",
        category: "licensing",
        policyId: "us-ca-bppe-tutoring-exemption",
        jurisdictionCode: "US-CA",
        tasks: [
          {
            title: "Document the BPPE exemption analysis",
            description:
              "Record which statutory exemption applies and the programme facts that support it, so the position can be defended and revisited.",
            category: "licensing",
            policyId: "us-ca-bppe-tutoring-exemption",
            jurisdictionCode: "US-CA",
            priority: "HIGH",
            status: "IN_PROGRESS",
            dueInDays: 13,
            checklist: [
              { label: "List every programme offered and its target age group", done: true },
              { label: "Confirm no diplomas or occupational credentials are awarded", done: true },
              { label: "Write the exemption memo", done: false },
              { label: "Diarise an annual review", done: false },
            ],
          },
          {
            title: "Renew the Los Angeles Business Tax Registration Certificate",
            description:
              "The renewal must be filed by 28 February. A late filing forfeits the small business exemption for the year.",
            category: "registration",
            policyId: "us-ca-la-business-tax-certificate",
            jurisdictionCode: "US-CA-LAC",
            priority: "MEDIUM",
            status: "NOT_STARTED",
            dueInDays: 215,
            checklist: [
              { label: "Compile prior-year gross receipts", done: false },
              { label: "Confirm the correct tax classification", done: false },
              { label: "File the renewal online", done: false },
            ],
          },
        ],
      },
      {
        title: "Staff screening and safety compliance",
        description: "Everything required before an instructor has contact with students.",
        category: "employment",
        policyId: "us-ca-child-safety-screening",
        jurisdictionCode: "US-CA",
        tasks: [
          {
            title: "Audit Live Scan clearances for all instructors",
            description:
              "Every instructor with unsupervised student contact needs a fingerprint clearance on file, with subsequent arrest notification enrolled.",
            category: "employment",
            policyId: "us-ca-child-safety-screening",
            priority: "URGENT",
            status: "NOT_STARTED",
            dueInDays: -2,
            checklist: [
              { label: "List current instructors and start dates", done: false },
              { label: "Match each to a clearance record", done: false },
              { label: "Schedule Live Scan for anyone missing", done: false },
              { label: "Confirm subsequent arrest notification is active", done: false },
            ],
            notes: "Two instructors hired in June have no clearance on file.",
          },
          {
            title: "Complete mandated reporter training",
            description: "Designated staff must be trained, with signed acknowledgements retained.",
            category: "employment",
            policyId: "us-ca-child-safety-screening",
            priority: "MEDIUM",
            status: "NOT_STARTED",
            dueInDays: 41,
            checklist: [
              { label: "Book the training session", done: false },
              { label: "Collect signed acknowledgements", done: false },
            ],
          },
        ],
      },
      {
        title: "Facility permits",
        description: "Keep the space legally usable for instruction.",
        category: "licensing",
        policyId: "us-local-occupancy-fire-permit",
        jurisdictionCode: "US-CA-LAC",
        tasks: [
          {
            title: "Schedule the annual fire inspection",
            description:
              "Instructional occupancies are inspected annually for exits, extinguishers, emergency lighting and posted occupant load.",
            category: "licensing",
            policyId: "us-local-occupancy-fire-permit",
            priority: "MEDIUM",
            status: "NOT_STARTED",
            dueInDays: 84,
            checklist: [
              { label: "Contact the fire prevention bureau", done: false },
              { label: "Check extinguisher service tags", done: false },
              { label: "Confirm occupant load sign is posted", done: false },
            ],
          },
        ],
      },
    ],
    reminders: [
      {
        title: "Instructor clearance audit",
        notes: "Verify every current instructor has an active Live Scan clearance on file.",
        kind: "COMPLIANCE_DEADLINE",
        policyId: "us-ca-child-safety-screening",
        dueInDays: 15,
        advanceDays: 7,
      },
      {
        title: "Annual fire inspection",
        notes: "Schedule ahead of the busy autumn term.",
        kind: "PERMIT_RENEWAL",
        policyId: "us-local-occupancy-fire-permit",
        dueInDays: 84,
        advanceDays: 30,
      },
      {
        title: "LA business tax renewal",
        notes: "Due 28 February. Filing on time preserves the small business exemption.",
        kind: "FILING_DEADLINE",
        policyId: "us-ca-la-business-tax-certificate",
        dueInDays: 215,
        advanceDays: 45,
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "sparc-technologies",
    name: "Sparc Technologies",
    description:
      "Supplier of automated kitchen robots for quick-service restaurants, handling manufacturing oversight, certification and installation support across the United States.",
    website: "https://sparctech.example.com",
    country: "US",
    region: "US-TX",
    city: "Houston",
    sizeBand: "11-50",
    employeeCount: 34,
    orgType: "Corporation",
    profile: {
      industryKey: "kitchen_robotics_machinery",
      industryLabel: "Kitchen robotics & commercial machinery",
      subIndustries: ["Commercial food equipment", "Industrial automation"],
      productsSold: ["Automated fry stations", "Robotic beverage dispensers", "Cleaning-in-place modules"],
      servicesProvided: ["Installation", "Preventive maintenance contracts", "Operator training"],
      importsProducts: true,
      importCountries: ["DE", "JP"],
      employsStaff: true,
      handlesCustomerData: true,
      physicalLocations: true,
      sellsCrossBorder: true,
      requiresLicenses: true,
      regulatedIndustry: true,
      plansExpansion: true,
      targetCountry: "CA",
      targetRegion: "CA-BC",
      targetCity: "Vancouver",
      expansionActivity: "Selling and installing equipment for a restaurant group in British Columbia",
      expansionInDays: 94,
      compliancePriorities: [
        "food_sanitation",
        "machinery_safety",
        "product_standards",
        "certification_renewals",
        "reporting",
      ],
      trackingMethod: "spreadsheets",
      hasComplianceStaff: false,
      usesSpreadsheets: true,
      usesExternalTool: true,
      reviewFrequency: "quarterly",
      topConcern:
        "Every new customer's health department asks slightly different questions about our equipment, and our certifications are coming up for audit.",
    },
    jurisdictions: [
      { code: "US", role: "OPERATING" },
      { code: "US-TX", role: "OPERATING" },
      { code: "US-TX-HAR", role: "OPERATING" },
      { code: "US-CA", role: "OPERATING" },
      { code: "US-IL", role: "OPERATING" },
      { code: "CA", role: "TARGET_EXPANSION" },
      { code: "CA-BC", role: "TARGET_EXPANSION" },
    ],
    monitoredPolicyIds: [
      "us-fda-food-code-equipment",
      "us-nsf-equipment-certification",
      "us-osha-machine-guarding",
      "ca-cfia-food-contact-machinery",
    ],
    monitoredTopics: ["food_sanitation", "machinery_safety", "certification_renewals"],
    savedPolicyIds: ["us-local-health-plan-review", "us-tx-equipment-property-tax"],
    plans: [
      {
        title: "Maintain equipment certifications",
        description:
          "Keep the NSF and NRTL listings active so equipment continues to pass plan review and installation inspections.",
        category: "product",
        policyId: "us-nsf-equipment-certification",
        jurisdictionCode: "US",
        tasks: [
          {
            title: "Prepare for the semi-annual factory audit",
            description:
              "Unannounced inspections verify that production still matches the certified construction. Records and retained samples must be ready.",
            category: "product",
            policyId: "us-nsf-equipment-certification",
            priority: "URGENT",
            status: "IN_PROGRESS",
            dueInDays: 27,
            checklist: [
              { label: "Assemble the bill of materials for each listed model", done: true },
              { label: "Confirm no uncommunicated component substitutions", done: false },
              { label: "Pull retained samples for each production run", done: false },
              { label: "Review the previous audit's corrective actions", done: false },
            ],
            notes: "A component substitution on the dispensing valve has not been reported to the certifier.",
          },
          {
            title: "Report the dispensing valve component change",
            description:
              "Material and component changes must be notified to the certification body and may require re-evaluation.",
            category: "product",
            policyId: "us-nsf-equipment-certification",
            priority: "HIGH",
            status: "NOT_STARTED",
            dueInDays: 6,
            checklist: [
              { label: "Document the old and new valve specifications", done: false },
              { label: "Submit a change notification to the certifier", done: false },
              { label: "Confirm whether re-testing is required", done: false },
            ],
          },
          {
            title: "Document cleaning access for enclosed mechanisms",
            description:
              "New Food Code guidance for automated equipment expects documented cleaning access and validated cleaning frequency.",
            category: "safety",
            policyId: "us-fda-food-code-equipment",
            priority: "HIGH",
            status: "NOT_STARTED",
            dueInDays: 33,
            checklist: [
              { label: "Map every enclosed drive and dispensing mechanism", done: false },
              { label: "Document the disassembly and cleaning procedure", done: false },
              { label: "Validate the cleaning frequency", done: false },
              { label: "Add the documentation to the plan review pack", done: false },
            ],
          },
        ],
      },
      {
        title: "Machine safety documentation",
        description: "Everything an installer or inspector will ask for at a customer site.",
        category: "safety",
        policyId: "us-osha-machine-guarding",
        tasks: [
          {
            title: "Refresh the machine safety risk assessment",
            description:
              "Assess the installed configuration including guarding, interlocks, emergency stop and any collaborative operation.",
            category: "safety",
            policyId: "us-osha-machine-guarding",
            priority: "MEDIUM",
            status: "NOT_STARTED",
            dueInDays: 76,
            checklist: [
              { label: "Review the current guarding design", done: false },
              { label: "Verify interlock function on each guard", done: false },
              { label: "Update the risk assessment document", done: false },
            ],
          },
          {
            title: "Update lockout/tagout procedures shipped with equipment",
            description:
              "Customers need energy-isolation procedures to meet their own obligations during servicing.",
            category: "safety",
            policyId: "us-osha-machine-guarding",
            priority: "MEDIUM",
            status: "BLOCKED",
            dueInDays: 48,
            checklist: [
              { label: "List all energy sources per model", done: true },
              { label: "Draft isolation procedures", done: false },
              { label: "Review with the safety consultant", done: false },
            ],
            notes: "Blocked — waiting on the electrical schematic revision from engineering.",
          },
        ],
      },
      {
        title: "British Columbia market entry",
        description: "Certification and safety steps required before the first Canadian installation.",
        category: "product",
        policyId: "ca-cfia-food-contact-machinery",
        jurisdictionCode: "CA-BC",
        tasks: [
          {
            title: "Obtain a Canadian electrical certification mark",
            description:
              "A US-only UL mark is generally not accepted. Certification through an SCC-accredited body is normally required.",
            category: "product",
            policyId: "ca-cfia-food-contact-machinery",
            jurisdictionCode: "CA",
            priority: "HIGH",
            status: "NOT_STARTED",
            dueInDays: 58,
            checklist: [
              { label: "Confirm which models will ship to Canada", done: false },
              { label: "Request a cUL or CSA quotation", done: false },
              { label: "Decide between certification and field evaluation", done: false },
            ],
          },
        ],
      },
    ],
    reminders: [
      {
        title: "NSF factory audit window opens",
        notes: "Unannounced inspections resume. Production records and retained samples must be ready.",
        kind: "CERTIFICATION_RENEWAL",
        policyId: "us-nsf-equipment-certification",
        dueInDays: 27,
        advanceDays: 21,
      },
      {
        title: "UL listing annual review and fee",
        notes: "Maintain the listing so the mark remains valid on shipped equipment.",
        kind: "CERTIFICATION_RENEWAL",
        policyId: "us-nsf-equipment-certification",
        dueInDays: 140,
        advanceDays: 30,
      },
      {
        title: "Texas business personal property rendition",
        notes: "Due 15 April. Reconcile the fixed asset register including demo and loaner units.",
        kind: "FILING_DEADLINE",
        policyId: "us-tx-equipment-property-tax",
        dueInDays: 261,
        advanceDays: 45,
      },
      {
        title: "Plan review submissions for Q4 installations",
        notes: "Submit health department plan reviews ahead of scheduled installations.",
        kind: "COMPLIANCE_DEADLINE",
        policyId: "us-local-health-plan-review",
        dueInDays: 56,
        advanceDays: 21,
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "lotusflare-canada",
    name: "LotusFlare Canada Inc",
    description:
      "Digital telecommunications provider operating a cloud-native subscriber platform for Canadian carriers, with an internal compliance function and a US market entry underway.",
    website: "https://lotusflare.example.com",
    country: "CA",
    region: "CA-ON",
    city: "Toronto",
    sizeBand: "201-1000",
    employeeCount: 420,
    orgType: "Corporation",
    profile: {
      industryKey: "telecommunications",
      industryLabel: "Telecommunications",
      subIndustries: ["Digital telco platform", "MVNO enablement"],
      productsSold: ["Subscriber management platform", "Digital BSS modules"],
      servicesProvided: ["Managed digital telco operations", "Customer data platform", "Billing operations"],
      importsProducts: false,
      importCountries: [],
      employsStaff: true,
      handlesCustomerData: true,
      physicalLocations: true,
      sellsCrossBorder: true,
      requiresLicenses: true,
      regulatedIndustry: true,
      plansExpansion: true,
      targetCountry: "US",
      targetRegion: "US-CA",
      targetCity: "San Francisco",
      expansionActivity: "Serving US carrier customers with subscriber data processed in US regions",
      expansionInDays: 62,
      compliancePriorities: [
        "telecom_regulation",
        "privacy",
        "reporting",
        "certification_renewals",
        "employment",
      ],
      trackingMethod: "internal_team",
      hasComplianceStaff: true,
      usesSpreadsheets: true,
      usesExternalTool: true,
      reviewFrequency: "monthly",
      topConcern:
        "We need a single view of privacy and telecom obligations across Canada, Quebec and the US as we take on American carrier customers.",
    },
    jurisdictions: [
      { code: "CA", role: "OPERATING" },
      { code: "CA-ON", role: "OPERATING" },
      { code: "CA-QC", role: "OPERATING" },
      { code: "CA-BC", role: "OPERATING" },
      { code: "US", role: "TARGET_EXPANSION" },
      { code: "US-CA", role: "TARGET_EXPANSION" },
    ],
    monitoredPolicyIds: [
      "ca-crtc-tsp-registration",
      "ca-pipeda-privacy",
      "ca-quebec-law-25",
      "us-ca-cpra-privacy",
      "us-fcc-cpni",
    ],
    monitoredTopics: ["privacy", "telecom_regulation", "reporting"],
    savedPolicyIds: ["us-fcc-form-499", "ca-casl-anti-spam"],
    plans: [
      {
        title: "Privacy programme alignment across jurisdictions",
        description:
          "Reconcile PIPEDA, Quebec Law 25 and California requirements into one operating model ahead of the US launch.",
        category: "privacy",
        policyId: "ca-pipeda-privacy",
        jurisdictionCode: "CA",
        tasks: [
          {
            title: "Complete privacy impact assessment for US data transfers",
            description:
              "Quebec requires a documented assessment before personal information is transferred outside the province, covering sensitivity, purposes, safeguards and the destination's legal regime.",
            category: "privacy",
            policyId: "ca-quebec-law-25",
            jurisdictionCode: "CA-QC",
            priority: "URGENT",
            status: "IN_PROGRESS",
            dueInDays: 31,
            checklist: [
              { label: "Map data elements moving to US regions", done: true },
              { label: "Classify sensitivity per element", done: true },
              { label: "Document safeguards and contractual terms", done: false },
              { label: "Assess the destination legal regime", done: false },
              { label: "Obtain privacy officer sign-off", done: false },
            ],
          },
          {
            title: "Map CPRA obligations to the platform",
            description:
              "Determine which CCPA thresholds are met for the US entity and what rights handling the platform must support.",
            category: "privacy",
            policyId: "us-ca-cpra-privacy",
            jurisdictionCode: "US-CA",
            priority: "HIGH",
            status: "NOT_STARTED",
            dueInDays: 44,
            checklist: [
              { label: "Assess revenue and volume thresholds", done: false },
              { label: "Identify sale or sharing activities", done: false },
              { label: "Design rights request handling with a 45-day SLA", done: false },
              { label: "Add required terms to vendor contracts", done: false },
            ],
          },
          {
            title: "Refresh the breach response runbook",
            description:
              "PIPEDA requires notification as soon as feasible where a breach creates a real risk of significant harm, plus a 24-month breach log.",
            category: "privacy",
            policyId: "ca-pipeda-privacy",
            priority: "MEDIUM",
            status: "COMPLETED",
            dueInDays: -18,
            checklist: [
              { label: "Update severity assessment criteria", done: true },
              { label: "Confirm the breach log retention period", done: true },
              { label: "Run a tabletop exercise", done: true },
            ],
          },
        ],
      },
      {
        title: "Telecom regulatory filings",
        description: "Keep CRTC obligations current and prepare for US filing obligations.",
        category: "reporting",
        policyId: "ca-crtc-tsp-registration",
        jurisdictionCode: "CA",
        tasks: [
          {
            title: "Remap revenue categories for the CRTC data collection",
            description:
              "The annual filing's revenue categories were restructured. Internal classifications need to be remapped well before the filing date.",
            category: "reporting",
            policyId: "ca-crtc-tsp-registration",
            priority: "HIGH",
            status: "IN_PROGRESS",
            dueInDays: 63,
            checklist: [
              { label: "Obtain the revised category definitions", done: true },
              { label: "Map internal revenue lines to new categories", done: false },
              { label: "Validate with finance", done: false },
            ],
          },
          {
            title: "Assess US Form 499 registration requirement",
            description:
              "Determine whether the US entity's services constitute interstate telecommunications requiring FCC registration and USF contribution.",
            category: "reporting",
            policyId: "us-fcc-form-499",
            jurisdictionCode: "US",
            priority: "HIGH",
            status: "NOT_STARTED",
            dueInDays: 40,
            checklist: [
              { label: "Classify each service line", done: false },
              { label: "Assess de minimis exemption", done: false },
              { label: "Obtain an FCC Registration Number if required", done: false },
            ],
          },
        ],
      },
      {
        title: "Marketing consent compliance",
        description: "Keep CASL consent evidence defensible as the customer base grows.",
        category: "privacy",
        policyId: "ca-casl-anti-spam",
        tasks: [
          {
            title: "Audit the consent register",
            description:
              "Review evidence of express consent and identify implied consents that are about to expire.",
            category: "privacy",
            policyId: "ca-casl-anti-spam",
            priority: "LOW",
            status: "NOT_STARTED",
            dueInDays: 60,
            checklist: [
              { label: "Export consent records with source and date", done: false },
              { label: "Flag implied consents nearing expiry", done: false },
              { label: "Verify unsubscribe processing within 10 business days", done: false },
            ],
          },
        ],
      },
    ],
    reminders: [
      {
        title: "Quebec privacy impact assessment for US transfer",
        notes: "Must be complete before subscriber data is processed in US regions.",
        kind: "COMPLIANCE_DEADLINE",
        policyId: "ca-quebec-law-25",
        dueInDays: 31,
        advanceDays: 14,
      },
      {
        title: "CRTC annual data collection filing",
        notes: "Annual telecommunications revenue return. Categories were restructured this year.",
        kind: "FILING_DEADLINE",
        policyId: "ca-crtc-tsp-registration",
        dueInDays: 246,
        advanceDays: 60,
      },
      {
        title: "CPNI annual officer certification",
        notes: "Due 1 March covering the prior calendar year, signed by a corporate officer.",
        kind: "FILING_DEADLINE",
        policyId: "us-fcc-cpni",
        dueInDays: 216,
        advanceDays: 60,
      },
      {
        title: "Annual privacy programme review",
        notes: "Review consent flows, retention schedules and the breach log.",
        kind: "POLICY_REVIEW",
        policyId: "ca-pipeda-privacy",
        dueInDays: 69,
        advanceDays: 21,
      },
    ],
  },
];
