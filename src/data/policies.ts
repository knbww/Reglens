import type { JurisdictionLevel, PolicyImportance, PolicyStatus } from "@prisma/client";

export type PolicyRequirement = { title: string; detail: string };
export type PolicyDeadline = {
  label: string;
  /** ISO date (YYYY-MM-DD) or a relative marker resolved at seed time. */
  date: string;
  recurrence: "one_time" | "annual" | "quarterly" | "biennial" | "per_shipment" | "ongoing";
  description: string;
};

export type PolicySeed = {
  id: string;
  title: string;
  country: string;
  jurisdictionCode: string;
  level: JurisdictionLevel;
  agency: string;
  industryTags: string[];
  topicTags: string[];
  status: PolicyStatus;
  importance: PolicyImportance;
  publishedAt: string;
  effectiveAt: string;
  lastUpdatedAt: string;
  plainSummary: string;
  fullSummary: string;
  affectedOrgs: string[];
  requirements: PolicyRequirement[];
  consequences: string[];
  deadlines: PolicyDeadline[];
  sourceName: string;
  sourceUrl: string;
  relatedIds: string[];
};

/**
 * MVP regulatory corpus.
 *
 * Every record is illustrative SAMPLE DATA summarising a real regulatory
 * framework in plain language. It is not a synced copy of the legal text and
 * is surfaced in the UI as sample data with a link to the responsible agency.
 */
export const POLICIES: PolicySeed[] = [
  // =========================================================================
  // Cross-border e-commerce / imported consumer products
  // =========================================================================
  {
    id: "us-cbp-importer-of-record",
    title: "Importer of Record obligations and formal entry filing",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "U.S. Customs and Border Protection (CBP)",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "textile_apparel_import", "kitchen_robotics_machinery"],
    topicTags: ["imports_customs", "reporting"],
    status: "IN_FORCE",
    importance: "CRITICAL",
    publishedAt: "1993-12-08",
    effectiveAt: "1994-01-01",
    lastUpdatedAt: "2026-03-11",
    plainSummary:
      "If your company brings goods into the United States, someone has to be legally responsible for that shipment. That party is the Importer of Record. You must declare what the goods are, where they were made, what they are worth, and pay any duty owed. Shipments valued above the de minimis threshold need a formal entry filed within a set window after arrival.",
    fullSummary:
      "The Importer of Record (IOR) is legally liable for the accuracy of the entry, the classification under the Harmonized Tariff Schedule, the declared customs value, and payment of duties, taxes and fees. Most small importers appoint a licensed customs broker to file on their behalf, but appointing a broker does not transfer legal liability. CBP applies 'reasonable care' as the standard: the importer is expected to take active steps to get classification and valuation right, not merely to rely on a supplier's paperwork.",
    affectedOrgs: [
      "Any business that imports goods into the United States for resale",
      "E-commerce sellers using overseas manufacturers",
      "Businesses importing equipment for their own commercial use",
    ],
    requirements: [
      { title: "Obtain an importer number", detail: "Use your EIN, or file CBP Form 5106 to establish an importer identity if you do not have one." },
      { title: "Classify goods under the HTS", detail: "Assign the correct 10-digit Harmonized Tariff Schedule code. Classification drives the duty rate and any special programs that apply." },
      { title: "Declare correct customs value", detail: "Normally transaction value — the price actually paid or payable, plus certain additions such as assists and packing." },
      { title: "File entry within the deadline", detail: "Entry summary and duty payment are generally due within 10 working days of release for standard entries." },
      { title: "Post a customs bond", detail: "A continuous bond (or single-transaction bond) is required for commercial formal entries." },
      { title: "Keep records for five years", detail: "Invoices, packing lists, entry documents and classification support must be retained and produced on request." },
    ],
    consequences: [
      "Monetary penalties for negligence, gross negligence or fraud under 19 U.S.C. 1592",
      "Liquidated damages against the customs bond",
      "Shipment holds, exams and detention at the port",
      "Loss of expedited release privileges",
    ],
    deadlines: [
      { label: "Entry summary and duty payment", date: "REL:+18", recurrence: "per_shipment", description: "Generally 10 working days from release of the merchandise." },
      { label: "Annual customs bond review", date: "2026-11-15", recurrence: "annual", description: "Confirm the continuous bond amount still covers projected duty volume." },
    ],
    sourceName: "CBP — Importing into the United States",
    sourceUrl: "https://www.cbp.gov/trade/basic-import-export",
    relatedIds: ["us-cpsc-general-certificate", "us-country-of-origin-marking"],
  },
  {
    id: "us-cpsc-general-certificate",
    title: "General Certificate of Conformity for regulated consumer products",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "U.S. Consumer Product Safety Commission (CPSC)",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "kitchen_robotics_machinery"],
    topicTags: ["product_safety", "product_standards", "imports_customs"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2008-08-14",
    effectiveAt: "2008-11-12",
    lastUpdatedAt: "2026-01-22",
    plainSummary:
      "If you import or manufacture a consumer product that is covered by a CPSC safety rule, you must issue a written certificate saying the product complies. The certificate has to be based on a test or a reasonable testing program, must accompany the shipment, and must be available to CBP and CPSC on request.",
    fullSummary:
      "A General Certificate of Conformity (GCC) applies to general-use consumer products subject to a CPSC rule, ban, standard or regulation. Children's products require the stricter Children's Product Certificate based on third-party testing at a CPSC-accepted laboratory. The certificate must identify the product, each rule it complies with, the importer or manufacturer, contact details for records custody, the date and place of manufacture, and the date and place of the testing relied upon.",
    affectedOrgs: [
      "Importers of consumer products subject to any CPSC rule",
      "Domestic manufacturers of regulated consumer products",
      "Private-label sellers who are treated as the manufacturer",
    ],
    requirements: [
      { title: "Identify applicable CPSC rules", detail: "Determine every standard, ban or regulation that applies to the product as sold." },
      { title: "Base certification on testing", detail: "Use a reasonable testing program for general-use products; use third-party accredited testing for children's products." },
      { title: "Issue the certificate in English", detail: "The GCC must list each rule, the importer/manufacturer, records custodian contact, and manufacture and test dates and locations." },
      { title: "Furnish the certificate", detail: "Provide it to distributors and retailers, and make it available electronically to CBP and CPSC." },
    ],
    consequences: [
      "Refusal of admission of the shipment at the port",
      "Civil penalties for failure to certify or for false certification",
      "Stop-sale and recall exposure",
      "Retailer chargebacks and delisting",
    ],
    deadlines: [
      { label: "Certificate must exist before entry", date: "REL:+0", recurrence: "per_shipment", description: "The GCC must be in place at the time the product is imported or distributed." },
      { label: "Annual re-testing review", date: "2026-09-30", recurrence: "annual", description: "Review whether product or material changes require re-testing." },
    ],
    sourceName: "CPSC — Certificates of Compliance",
    sourceUrl: "https://www.cpsc.gov/Business--Manufacturing/Testing-Certification",
    relatedIds: ["us-cbp-importer-of-record", "us-cpsc-flammability-1610"],
  },
  {
    id: "us-country-of-origin-marking",
    title: "Country of origin marking on imported articles",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "U.S. Customs and Border Protection (CBP)",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "textile_apparel_import"],
    topicTags: ["imports_customs", "product_standards", "textile_labeling"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "1930-06-17",
    effectiveAt: "1930-06-17",
    lastUpdatedAt: "2025-10-02",
    plainSummary:
      "Nearly every imported article must be permanently and legibly marked with the English name of the country where it was made, in a place the end purchaser will see it. If the article itself cannot be marked, the container usually must be.",
    fullSummary:
      "Section 304 of the Tariff Act of 1930 requires marking that is conspicuous, legible, indelible and permanent enough to reach the ultimate purchaser. Separate rules govern when a 'Made in USA' claim can be made — the FTC requires that such products be 'all or virtually all' made in the United States. Textile and apparel goods have additional origin rules based on where the fabric was formed and assembled.",
    affectedOrgs: [
      "Importers of finished consumer goods",
      "Businesses selling imported goods under their own brand",
      "Anyone making origin claims in marketing",
    ],
    requirements: [
      { title: "Mark the article itself", detail: "Use the English name of the country of origin in a conspicuous location that survives normal handling." },
      { title: "Mark the retail container", detail: "Where the article cannot reasonably be marked, mark the container that reaches the purchaser." },
      { title: "Substantiate any 'Made in USA' claim", detail: "The FTC standard is 'all or virtually all' domestic content, including for qualified claims." },
    ],
    consequences: [
      "Additional 10 percent marking duty on unmarked goods",
      "Detention until marked, exported or destroyed",
      "FTC enforcement for deceptive origin claims",
    ],
    deadlines: [
      { label: "Marking must be correct at entry", date: "REL:+0", recurrence: "per_shipment", description: "Marking is checked at the time of importation." },
    ],
    sourceName: "CBP — Marking of Country of Origin",
    sourceUrl: "https://www.cbp.gov/trade/rulings/marking-country-origin",
    relatedIds: ["us-cbp-importer-of-record", "us-ftc-textile-labeling"],
  },
  {
    id: "us-fda-general-wellness-device",
    title: "General wellness products versus regulated medical devices",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "U.S. Food and Drug Administration (FDA)",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "kitchen_robotics_machinery"],
    topicTags: ["product_safety", "product_standards"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2016-07-29",
    effectiveAt: "2016-07-29",
    lastUpdatedAt: "2026-02-18",
    plainSummary:
      "How you describe your product can change whether the FDA regulates it. A recovery or wellness product that only makes general wellness claims usually sits outside device regulation. The moment marketing claims treatment, cure, mitigation or diagnosis of a specific condition, the same physical product may become a regulated medical device.",
    fullSummary:
      "FDA guidance on low-risk general wellness products describes two conditions: the product is intended only for general wellness use, and it presents a low risk to safety. Claims about relieving a named medical condition, treating inflammation as a disease process, or aiding recovery from a diagnosed injury push a product toward device classification, which brings registration, listing, labelling and possibly premarket submission obligations.",
    affectedOrgs: [
      "Sellers of recovery, therapy-adjacent or wellness equipment",
      "E-commerce brands writing product marketing copy",
      "Importers of health-adjacent consumer hardware",
    ],
    requirements: [
      { title: "Review all marketing claims", detail: "Audit website copy, ad creative, influencer briefs and packaging for disease or treatment claims." },
      { title: "Document the wellness intent", detail: "Keep a written rationale for why the product qualifies as a general wellness product." },
      { title: "Register and list if a device", detail: "If claims make the product a device, establishment registration and device listing obligations apply." },
    ],
    consequences: [
      "FDA warning letter and required corrective advertising",
      "Import alert and detention without physical examination",
      "Marketing an unapproved or unlisted device",
    ],
    deadlines: [
      { label: "Marketing claim audit", date: "2026-08-21", recurrence: "annual", description: "Recommended annual review of product claims across all channels." },
    ],
    sourceName: "FDA — General Wellness: Policy for Low Risk Devices",
    sourceUrl: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices",
    relatedIds: ["us-cpsc-general-certificate"],
  },
  {
    id: "us-ca-prop-65",
    title: "Proposition 65 chemical exposure warnings",
    country: "US",
    jurisdictionCode: "US-CA",
    level: "STATE",
    agency: "California Office of Environmental Health Hazard Assessment (OEHHA)",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "textile_apparel_import", "kitchen_robotics_machinery"],
    topicTags: ["product_safety", "product_standards"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "1986-11-04",
    effectiveAt: "1988-02-27",
    lastUpdatedAt: "2026-01-08",
    plainSummary:
      "If a product sold into California can expose someone to a chemical on California's listed-chemicals list, the business must give a clear warning before the exposure happens. For online sales the warning must also appear before purchase, not only on the box that arrives later.",
    fullSummary:
      "Proposition 65 requires a 'clear and reasonable warning' for exposures to listed carcinogens or reproductive toxicants above safe-harbour levels. Safe-harbour warning content and methods are specified by regulation, including a warning symbol, the word WARNING, at least one named chemical and the OEHHA website. Internet purchases require the warning to be displayed on the product page or during the checkout process. Enforcement is largely driven by private plaintiffs sending 60-day notices.",
    affectedOrgs: [
      "Any business with 10 or more employees selling products into California",
      "Online sellers shipping to California addresses",
      "Importers of plastics, coatings, vinyl, metal fittings and electronics",
    ],
    requirements: [
      { title: "Assess exposure", detail: "Identify whether listed chemicals are present and whether exposure exceeds safe-harbour levels." },
      { title: "Provide a compliant warning", detail: "Use the safe-harbour format including the symbol, WARNING, a named chemical and www.P65Warnings.ca.gov." },
      { title: "Warn before purchase online", detail: "Display the warning on the product detail page or during checkout for California shipments." },
      { title: "Pass warnings down the chain", detail: "Suppliers must notify downstream businesses so retailers can display warnings." },
    ],
    consequences: [
      "Civil penalties of up to 2,500 US dollars per violation per day",
      "Private-plaintiff 60-day notices and settlement costs",
      "Marketplace listing suspension pending compliance",
    ],
    deadlines: [
      { label: "Respond to a 60-day notice", date: "REL:+60", recurrence: "one_time", description: "Where a notice of violation is received, response windows are short." },
      { label: "Annual chemical list review", date: "2026-10-01", recurrence: "annual", description: "OEHHA updates the listed-chemicals list throughout the year." },
    ],
    sourceName: "California OEHHA — Proposition 65",
    sourceUrl: "https://oehha.ca.gov/proposition-65",
    relatedIds: ["us-cpsc-general-certificate", "us-ca-sales-tax-nexus"],
  },
  {
    id: "us-ca-sales-tax-nexus",
    title: "California economic nexus and sales tax registration for remote sellers",
    country: "US",
    jurisdictionCode: "US-CA",
    level: "STATE",
    agency: "California Department of Tax and Fee Administration (CDTFA)",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "general_small_business", "education_tutoring"],
    topicTags: ["taxation", "business_registration", "reporting"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2019-04-25",
    effectiveAt: "2019-04-01",
    lastUpdatedAt: "2026-04-30",
    plainSummary:
      "A business outside California still has to collect California sales tax once its sales into the state pass 500,000 US dollars in the current or previous calendar year. After registering you must file returns on the schedule CDTFA assigns, even for periods with no sales.",
    fullSummary:
      "Following South Dakota v. Wayfair, California established an economic nexus threshold of 500,000 US dollars in total combined sales of tangible personal property delivered into the state. District taxes add local rates on top of the statewide rate, and a seller meeting the state threshold is also engaged in business in every district. Marketplace facilitators collect on behalf of their sellers, but a seller's own direct-to-consumer channel remains its own responsibility.",
    affectedOrgs: [
      "Remote sellers shipping tangible goods into California",
      "Direct-to-consumer e-commerce brands",
      "Businesses selling through both a marketplace and their own website",
    ],
    requirements: [
      { title: "Monitor the 500,000 dollar threshold", detail: "Track combined sales into California for the current and prior calendar year." },
      { title: "Register for a seller's permit", detail: "Register with CDTFA before the first taxable sale after crossing the threshold." },
      { title: "Collect district taxes", detail: "Apply the correct combined state, county and district rate for the ship-to address." },
      { title: "File returns on schedule", detail: "File quarterly or as assigned, including zero returns." },
    ],
    consequences: [
      "Assessment of uncollected tax plus interest",
      "Late-filing and late-payment penalties",
      "Personal liability for responsible persons in some cases",
    ],
    deadlines: [
      { label: "Q3 2026 sales tax return", date: "2026-10-31", recurrence: "quarterly", description: "Quarterly return and payment due at the end of the month following quarter end." },
      { label: "Nexus threshold review", date: "2026-09-15", recurrence: "annual", description: "Review sales-by-state data to catch newly triggered nexus." },
    ],
    sourceName: "CDTFA — Use Tax Collection Requirements",
    sourceUrl: "https://www.cdtfa.ca.gov/industry/wayfair.htm",
    relatedIds: ["us-ny-sales-tax-nexus", "us-wa-sales-tax-nexus"],
  },
  {
    id: "us-ny-sales-tax-nexus",
    title: "New York economic nexus and sales tax registration for remote sellers",
    country: "US",
    jurisdictionCode: "US-NY",
    level: "STATE",
    agency: "New York State Department of Taxation and Finance",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "textile_apparel_import", "general_small_business"],
    topicTags: ["taxation", "business_registration", "reporting"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "2019-01-15",
    effectiveAt: "2019-06-21",
    lastUpdatedAt: "2026-03-05",
    plainSummary:
      "New York applies a two-part test: a remote seller must register once it exceeds 500,000 US dollars of sales of tangible personal property delivered into New York and more than 100 separate transactions, both measured over the last four sales tax quarters. Clothing and footwear under 110 US dollars per item are exempt from the state portion of the tax.",
    fullSummary:
      "Both prongs of the New York threshold must be met before registration is required, which distinguishes it from single-threshold states. The clothing exemption applies to the 4 percent state rate and to the MCTD rate within the district, while local county rates vary — some localities also exempt clothing and others do not. This makes apparel rate configuration a recurring source of error for small importers.",
    affectedOrgs: [
      "Remote sellers shipping into New York",
      "Apparel and footwear sellers",
      "Sellers using both marketplaces and direct channels",
    ],
    requirements: [
      { title: "Apply the two-part threshold", detail: "Track both dollar volume and transaction count over the trailing four quarters." },
      { title: "Register as a sales tax vendor", detail: "Register with the Department before making taxable sales." },
      { title: "Configure the clothing exemption", detail: "Apply the under-110-dollar clothing exemption correctly by locality." },
      { title: "File quarterly returns", detail: "Quarterly filing periods end February, May, August and November." },
    ],
    consequences: [
      "Assessment of uncollected tax, penalties and interest",
      "Revocation of the certificate of authority",
    ],
    deadlines: [
      { label: "Sales tax quarter ends", date: "2026-08-31", recurrence: "quarterly", description: "Return generally due 20 days after the quarter ends." },
      { label: "Q2 return filing date", date: "2026-09-21", recurrence: "quarterly", description: "Filing and payment for the quarter ending 31 August." },
    ],
    sourceName: "NY Department of Taxation and Finance — Registration requirement for businesses with no physical presence",
    sourceUrl: "https://www.tax.ny.gov/bus/st/registration_requirement_for_businesses_with_no_physical_presence_in_nys.htm",
    relatedIds: ["us-ca-sales-tax-nexus", "us-ftc-textile-labeling"],
  },
  {
    id: "us-wa-sales-tax-nexus",
    title: "Washington economic nexus, B&O tax and marketplace rules",
    country: "US",
    jurisdictionCode: "US-WA",
    level: "STATE",
    agency: "Washington State Department of Revenue",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "general_small_business"],
    topicTags: ["taxation", "business_registration", "reporting"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "2019-03-14",
    effectiveAt: "2020-01-01",
    lastUpdatedAt: "2026-02-10",
    plainSummary:
      "Washington requires registration once cumulative gross receipts sourced to the state exceed 100,000 US dollars in the current or prior calendar year. Washington also levies a Business and Occupation tax on gross receipts, which applies separately from sales tax and has no deduction for costs.",
    fullSummary:
      "The B&O tax is a gross-receipts tax with different rates per classification — retailing, wholesaling and service categories all differ. Remote sellers frequently register for sales tax and overlook the B&O obligation, which accrues on the same receipts. Destination-based sourcing means local rates follow the delivery address.",
    affectedOrgs: [
      "Remote sellers with more than 100,000 dollars of Washington receipts",
      "Wholesalers shipping into Washington",
    ],
    requirements: [
      { title: "Register a business licence", detail: "Register through the Washington Business Licensing Service." },
      { title: "Collect destination-based sales tax", detail: "Apply the combined state and local rate for the delivery address." },
      { title: "File and pay B&O tax", detail: "Report gross receipts under the correct classification alongside sales tax." },
    ],
    consequences: [
      "Back tax assessments across both sales tax and B&O tax",
      "Penalties that escalate with the length of delinquency",
    ],
    deadlines: [
      { label: "Combined excise tax return", date: "2026-10-25", recurrence: "quarterly", description: "Quarterly combined return covering sales tax and B&O tax." },
    ],
    sourceName: "Washington DOR — Marketplace Fairness",
    sourceUrl: "https://dor.wa.gov/taxes-rates/retail-sales-tax/marketplace-fairness",
    relatedIds: ["us-ca-sales-tax-nexus", "us-ny-sales-tax-nexus"],
  },
  {
    id: "ca-cbsa-carm-import",
    title: "CARM importer registration and commercial accounting declarations",
    country: "CA",
    jurisdictionCode: "CA",
    level: "FEDERAL",
    agency: "Canada Border Services Agency (CBSA)",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "textile_apparel_import", "kitchen_robotics_machinery"],
    topicTags: ["imports_customs", "taxation", "reporting"],
    status: "IN_FORCE",
    importance: "CRITICAL",
    publishedAt: "2024-05-13",
    effectiveAt: "2024-10-21",
    lastUpdatedAt: "2026-05-19",
    plainSummary:
      "Commercial importers into Canada must have their own CARM Client Portal account, delegate authority to their customs broker, and post their own financial security. Accounting for goods and payment of duties and GST now runs through the importer's portal account rather than sitting entirely with the broker.",
    fullSummary:
      "The CBSA Assessment and Revenue Management system replaced the previous accounting model. Importers register with a Business Number and RM import/export program account, then either post a financial security instrument or pay upfront. Commercial Accounting Declarations replace the older B3 and B2 forms, with correction and adjustment periods defined by statement cycles.",
    affectedOrgs: [
      "Any business importing commercial goods into Canada",
      "Non-resident importers selling into Canada",
      "Businesses that previously relied entirely on a broker's bond",
    ],
    requirements: [
      { title: "Register in the CARM Client Portal", detail: "Create a business account tied to your Business Number and RM program account." },
      { title: "Post financial security", detail: "Obtain a customs bond or make cash security available to gain release-prior-to-payment privileges." },
      { title: "Delegate broker authority", detail: "Grant your customs broker the appropriate access level in the portal." },
      { title: "Reconcile statements of account", detail: "Review monthly statements and submit corrections within the allowed window." },
    ],
    consequences: [
      "Loss of release-prior-to-payment privileges and shipment delays",
      "Administrative monetary penalties under the AMPS regime",
      "Interest on late duty and GST payments",
    ],
    deadlines: [
      { label: "Monthly statement payment due", date: "2026-08-25", recurrence: "annual", description: "Payment is generally due on the statement due date each month." },
      { label: "Financial security renewal", date: "2026-12-01", recurrence: "annual", description: "Bond amounts should be reviewed against import volume annually." },
    ],
    sourceName: "CBSA — CARM",
    sourceUrl: "https://www.cbsa-asfc.gc.ca/services/carm-gcra/menu-eng.html",
    relatedIds: ["ca-consumer-product-safety-act", "ca-packaging-labelling-bilingual"],
  },
  {
    id: "ca-consumer-product-safety-act",
    title: "Canada Consumer Product Safety Act — supplier duties and incident reporting",
    country: "CA",
    jurisdictionCode: "CA",
    level: "FEDERAL",
    agency: "Health Canada",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "textile_apparel_import", "kitchen_robotics_machinery"],
    topicTags: ["product_safety", "product_standards", "reporting"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2010-12-15",
    effectiveAt: "2011-06-20",
    lastUpdatedAt: "2026-04-14",
    plainSummary:
      "Anyone who manufactures, imports, advertises or sells consumer products in Canada must not supply a product that is a danger to human health or safety. If you learn of an incident involving your product, you must report it to Health Canada within two days and follow with a fuller report within ten days.",
    fullSummary:
      "The CCPSA imposes a general prohibition on danger, mandatory incident reporting, document retention duties, and powers for the Minister to order recalls. 'Incident' is defined broadly and includes occurrences that resulted or could reasonably have been expected to result in death or serious adverse health effects, as well as recalls ordered by a foreign regulator.",
    affectedOrgs: [
      "Importers and retailers of consumer products in Canada",
      "Manufacturers supplying the Canadian market",
      "E-commerce sellers shipping to Canadian consumers",
    ],
    requirements: [
      { title: "Maintain traceability documents", detail: "Retailers keep supplier name and address plus location and period of sale; others keep customer records — for six years." },
      { title: "Report incidents within 2 days", detail: "Provide initial notice to Health Canada within two days of becoming aware of an incident." },
      { title: "File the detailed report within 10 days", detail: "Include product identification, incident details, and proposed corrective action." },
      { title: "Meet applicable product-specific regulations", detail: "Many categories have their own regulations layered on top of the general prohibition." },
    ],
    consequences: [
      "Ministerial recall orders and mandatory corrective measures",
      "Fines and, for serious contraventions, prosecution",
      "Public posting on the Health Canada recalls database",
    ],
    deadlines: [
      { label: "Incident initial report", date: "REL:+2", recurrence: "one_time", description: "Two days from becoming aware of a reportable incident." },
      { label: "Incident detailed report", date: "REL:+10", recurrence: "one_time", description: "Ten days from becoming aware of a reportable incident." },
    ],
    sourceName: "Health Canada — Canada Consumer Product Safety Act",
    sourceUrl: "https://www.canada.ca/en/health-canada/services/consumer-product-safety/legislation-guidelines/acts-regulations.html",
    relatedIds: ["ca-cbsa-carm-import", "ca-textile-labelling-act"],
  },
  {
    id: "ca-packaging-labelling-bilingual",
    title: "Bilingual labelling under the Consumer Packaging and Labelling Act",
    country: "CA",
    jurisdictionCode: "CA",
    level: "FEDERAL",
    agency: "Competition Bureau Canada",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "textile_apparel_import"],
    topicTags: ["product_standards", "textile_labeling"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "1985-01-01",
    effectiveAt: "1985-01-01",
    lastUpdatedAt: "2025-12-03",
    plainSummary:
      "Prepackaged consumer products sold in Canada must show the product identity and net quantity in both English and French, with metric units. The dealer's name and place of business must also appear. Quebec adds further French-language requirements.",
    fullSummary:
      "The CPLA requires three core label elements: product identity (bilingual), net quantity declaration (bilingual, metric, in a prescribed type height based on the principal display surface area), and the dealer name and principal place of business (may be in either official language). Quebec's Charter of the French Language imposes additional obligations on packaging, documentation and commerce conducted in the province.",
    affectedOrgs: [
      "Importers of prepackaged consumer products into Canada",
      "US brands expanding into the Canadian market",
      "Any seller listing physical goods to Canadian consumers",
    ],
    requirements: [
      { title: "Bilingual product identity", detail: "State what the product is in both English and French." },
      { title: "Bilingual metric net quantity", detail: "Declare net quantity in metric units using the prescribed minimum type height." },
      { title: "Dealer identity", detail: "Show the name and principal place of business of the responsible dealer." },
      { title: "Check Quebec-specific rules", detail: "French-language obligations in Quebec extend beyond the federal baseline." },
    ],
    consequences: [
      "Products refused by Canadian retailers and distributors",
      "Competition Bureau enforcement and required relabelling",
      "Costly rework or repackaging of inventory already shipped",
    ],
    deadlines: [
      { label: "Label artwork review before first Canadian shipment", date: "2026-09-01", recurrence: "one_time", description: "Complete bilingual artwork before goods are shipped into Canada." },
    ],
    sourceName: "Competition Bureau — Consumer Packaging and Labelling Act",
    sourceUrl: "https://ised-isde.canada.ca/site/competition-bureau-canada/en/consumer-packaging-and-labelling-act",
    relatedIds: ["ca-consumer-product-safety-act", "ca-textile-labelling-act"],
  },
  {
    id: "mx-nom-050-labelling",
    title: "NOM-050-SCFI-2004 — commercial information labelling for products",
    country: "MX",
    jurisdictionCode: "MX",
    level: "FEDERAL",
    agency: "Secretaría de Economía / PROFECO",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "textile_apparel_import", "kitchen_robotics_machinery"],
    topicTags: ["product_standards", "imports_customs"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2004-06-01",
    effectiveAt: "2004-08-30",
    lastUpdatedAt: "2025-11-20",
    plainSummary:
      "Products sold in Mexico must carry commercial information in Spanish: what the product is, who imports it, where it was made, and the quantity in metric units. Labels generally have to be applied before the goods clear customs unless you use an authorised bonded warehouse to label them.",
    fullSummary:
      "NOM-050 sets the general commercial information requirements for products not covered by a product-specific NOM. Required elements include product name, brand, importer name and RFC tax ID, address, country of origin, net contents in the International System of Units, and warnings or usage instructions where relevant. Verification is carried out by PROFECO in the market and by customs at the point of entry.",
    affectedOrgs: [
      "Importers selling consumer products in Mexico",
      "US and Canadian brands expanding into Mexico",
      "Distributors placing goods on Mexican shelves",
    ],
    requirements: [
      { title: "Spanish-language label", detail: "All required commercial information must appear in Spanish." },
      { title: "Importer identification", detail: "Show the importer name, RFC and address on the label." },
      { title: "Country of origin and net content", detail: "Declare origin and metric net contents." },
      { title: "Label before or at customs clearance", detail: "Use a bonded warehouse if labelling is done after arrival." },
    ],
    consequences: [
      "Goods held at customs until labelled correctly",
      "PROFECO fines and product immobilisation in the market",
      "Retailer rejection of shipments",
    ],
    deadlines: [
      { label: "Label compliance check before shipment", date: "2026-10-15", recurrence: "per_shipment", description: "Verify NOM-050 elements before each shipment leaves the origin country." },
    ],
    sourceName: "Secretaría de Economía — Normas Oficiales Mexicanas",
    sourceUrl: "https://www.gob.mx/se/acciones-y-programas/normalizacion-normalizacion-nacional",
    relatedIds: ["mx-padron-importadores"],
  },
  {
    id: "mx-padron-importadores",
    title: "Padrón de Importadores registration",
    country: "MX",
    jurisdictionCode: "MX",
    level: "FEDERAL",
    agency: "Servicio de Administración Tributaria (SAT)",
    industryTags: ["cross_border_ecommerce", "imported_consumer_products", "textile_apparel_import", "kitchen_robotics_machinery"],
    topicTags: ["imports_customs", "business_registration", "taxation"],
    status: "IN_FORCE",
    importance: "CRITICAL",
    publishedAt: "1996-01-01",
    effectiveAt: "1996-01-01",
    lastUpdatedAt: "2026-01-30",
    plainSummary:
      "To import commercially into Mexico a company must be listed on the importers registry held by the tax authority. Some product categories, including textiles and footwear, require an additional sector-specific registration. Registration can be suspended if tax obligations are not current.",
    fullSummary:
      "Registration in the Padrón de Importadores requires an active RFC, a valid advanced electronic signature (e.firma), a registered tax domicile and being current on tax obligations. Sectoral registries (Padrones Sectoriales) apply to sensitive categories such as textiles, footwear, steel and alcohol. Suspension is common and is typically triggered by tax-compliance discrepancies rather than customs issues.",
    affectedOrgs: [
      "Companies importing commercially into Mexico",
      "Foreign brands establishing a Mexican entity",
      "Textile and footwear importers requiring the sectoral registry",
    ],
    requirements: [
      { title: "Hold an active RFC and e.firma", detail: "The importing entity must have a valid tax ID and electronic signature." },
      { title: "Register in the general importers registry", detail: "Submit the application through the SAT portal." },
      { title: "Add sectoral registries where required", detail: "Textiles, footwear and other sensitive sectors need extra enrolment." },
      { title: "Stay current on tax obligations", detail: "Outstanding filings or debts are the leading cause of suspension." },
    ],
    consequences: [
      "Inability to clear commercial shipments",
      "Suspension from the registry with a formal reinstatement process",
      "Demurrage and storage costs on stranded shipments",
    ],
    deadlines: [
      { label: "Registry status verification", date: "2026-09-10", recurrence: "quarterly", description: "Confirm the registry entry is active before booking freight." },
    ],
    sourceName: "SAT — Padrón de Importadores",
    sourceUrl: "https://www.sat.gob.mx/tramites/operacion-aduanera",
    relatedIds: ["mx-nom-050-labelling"],
  },

  // =========================================================================
  // Textile & apparel
  // =========================================================================
  {
    id: "us-ftc-textile-labeling",
    title: "Textile Fiber Products Identification Act labelling",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "U.S. Federal Trade Commission (FTC)",
    industryTags: ["textile_apparel_import", "imported_consumer_products", "cross_border_ecommerce"],
    topicTags: ["textile_labeling", "product_standards"],
    status: "IN_FORCE",
    importance: "CRITICAL",
    publishedAt: "1958-09-02",
    effectiveAt: "1960-03-03",
    lastUpdatedAt: "2026-02-25",
    plainSummary:
      "Clothing and most textile products need a label showing the fibre content by percentage, the country where the product was processed or manufactured, and the identity of the company responsible. The label must be attached so it stays on until the consumer buys the item.",
    fullSummary:
      "The Textile Act and its Rules require generic fibre names in order of predominance by weight, with percentages, plus the country of origin and either a company name or a registered identification number (RN). Fibres present at less than five percent must be listed as 'other fibre' unless they have a functional significance. Online listings must disclose the fibre content and country of origin in the product description.",
    affectedOrgs: [
      "Apparel importers and brands",
      "Outdoor and technical clothing sellers",
      "Anyone private-labelling textile goods",
    ],
    requirements: [
      { title: "Disclose fibre content", detail: "List generic fibre names with percentages in order of predominance by weight." },
      { title: "Disclose country of origin", detail: "State where the product was processed or manufactured." },
      { title: "Identify the responsible company", detail: "Use the full company name or an FTC-issued RN number." },
      { title: "Attach labels durably", detail: "Labels must remain attached and legible until delivered to the consumer." },
      { title: "Mirror disclosures online", detail: "Fibre content and origin must appear in e-commerce product descriptions." },
    ],
    consequences: [
      "FTC civil penalties per violation",
      "Mandatory relabelling of inventory",
      "Marketplace listing takedowns",
    ],
    deadlines: [
      { label: "RN number renewal check", date: "2026-08-14", recurrence: "biennial", description: "Confirm registered identification number details are current." },
      { label: "Seasonal line label review", date: "2026-09-05", recurrence: "annual", description: "Review labelling for each new product line before production." },
    ],
    sourceName: "FTC — Threading Your Way Through the Labeling Requirements",
    sourceUrl: "https://www.ftc.gov/business-guidance/resources/threading-your-way-through-labeling-requirements-under-textile-wool-acts",
    relatedIds: ["us-ftc-care-labeling", "us-cpsc-flammability-1610", "us-country-of-origin-marking"],
  },
  {
    id: "us-ftc-care-labeling",
    title: "Care Labeling Rule for textile wearing apparel",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "U.S. Federal Trade Commission (FTC)",
    industryTags: ["textile_apparel_import", "imported_consumer_products"],
    topicTags: ["textile_labeling", "product_standards"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "1971-12-03",
    effectiveAt: "1972-07-03",
    lastUpdatedAt: "2025-09-16",
    plainSummary:
      "Clothing must carry a permanent care label giving at least one safe cleaning method. You need a reasonable basis — usually testing or reliable evidence — for the instructions before the garment goes on sale, and you must warn about any procedure that would damage the garment.",
    fullSummary:
      "The Rule requires a permanently attached care label with regular care instructions, including washing or dry-cleaning method, water temperature, drying, ironing and bleaching guidance where relevant. A reasonable basis must exist at the time the garment is sold — typically test data on the garment, a component, or reliable industry experience. Warnings are required where a normally expected procedure would harm the product.",
    affectedOrgs: [
      "Apparel importers and manufacturers",
      "Technical and performance outerwear brands",
    ],
    requirements: [
      { title: "Provide a permanent care label", detail: "Attach a label that remains legible for the useful life of the garment." },
      { title: "Give one complete care method", detail: "Include washing or dry-cleaning instructions with temperature and drying guidance." },
      { title: "Hold a reasonable basis", detail: "Retain test results or documented evidence supporting the instructions." },
      { title: "Include warnings", detail: "Warn where an ordinary care procedure would damage the item." },
    ],
    consequences: [
      "FTC enforcement and civil penalties",
      "Consumer complaints and returns driven by garment damage",
    ],
    deadlines: [
      { label: "Care instruction substantiation file review", date: "2026-10-09", recurrence: "annual", description: "Confirm test evidence exists for each active style." },
    ],
    sourceName: "FTC — Clothes Captioning: Complying with the Care Labeling Rule",
    sourceUrl: "https://www.ftc.gov/business-guidance/resources/clothes-captioning-complying-care-labeling-rule",
    relatedIds: ["us-ftc-textile-labeling"],
  },
  {
    id: "us-cpsc-flammability-1610",
    title: "Standard for the Flammability of Clothing Textiles (16 CFR 1610)",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "U.S. Consumer Product Safety Commission (CPSC)",
    industryTags: ["textile_apparel_import", "imported_consumer_products"],
    topicTags: ["product_safety", "textile_labeling", "certification_renewals"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "1953-06-30",
    effectiveAt: "1954-07-01",
    lastUpdatedAt: "2026-03-27",
    plainSummary:
      "Fabric used in clothing sold in the United States has to meet a flammability standard. Most ordinary fabrics are exempt from testing by weight or fibre type, but napped, brushed or lightweight fabrics usually need laboratory testing and supporting records before the garment can be certified.",
    fullSummary:
      "16 CFR 1610 classifies fabrics into Class 1 (normal flammability, acceptable for apparel), Class 2 and Class 3 (rapid and intense burning, not acceptable). Plain-surface fabrics weighing 2.6 ounces per square yard or more, and fabrics made entirely of acrylic, modacrylic, nylon, olefin, polyester or wool, qualify for exemption from testing. Raised-surface fabrics such as fleece frequently require testing, which is directly relevant to winter sportswear lines.",
    affectedOrgs: [
      "Importers of apparel including outerwear and base layers",
      "Sellers of fleece, brushed and napped fabrics",
    ],
    requirements: [
      { title: "Determine exemption status", detail: "Confirm whether each fabric qualifies for the weight or fibre-content exemption." },
      { title: "Test non-exempt fabrics", detail: "Use a testing laboratory to establish the flammability class for napped and lightweight fabrics." },
      { title: "Maintain a guaranty or test records", detail: "Keep test reports or a continuing guaranty from the supplier." },
      { title: "Include the rule in the GCC", detail: "List 16 CFR 1610 among the rules certified in the General Certificate of Conformity." },
    ],
    consequences: [
      "Refusal of admission at import",
      "Recall of non-conforming garments",
      "Civil penalties for distributing banned hazardous products",
    ],
    deadlines: [
      { label: "Fabric test report renewal", date: "2026-08-18", recurrence: "annual", description: "Re-test where fabric supplier, construction or finish changes." },
      { label: "Winter line certification cut-off", date: "2026-09-25", recurrence: "annual", description: "Certificates should be in hand before the season's first shipment." },
    ],
    sourceName: "CPSC — Clothing Textiles Flammability Standard",
    sourceUrl: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Clothing-Textiles",
    relatedIds: ["us-cpsc-general-certificate", "us-ftc-textile-labeling"],
  },
  {
    id: "ca-textile-labelling-act",
    title: "Textile Labelling Act and CA identification numbers",
    country: "CA",
    jurisdictionCode: "CA",
    level: "FEDERAL",
    agency: "Competition Bureau Canada",
    industryTags: ["textile_apparel_import", "imported_consumer_products"],
    topicTags: ["textile_labeling", "product_standards"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "1985-01-01",
    effectiveAt: "1985-01-01",
    lastUpdatedAt: "2026-01-16",
    plainSummary:
      "Textile products sold in Canada need a label showing fibre content in both English and French, plus the dealer's name and address or a CA identification number issued by the Competition Bureau. The rules overlap with US labelling but are not identical, so a single label often has to satisfy both.",
    fullSummary:
      "The Textile Labelling Act and Textile Labelling and Advertising Regulations require bilingual generic fibre names with percentages, and dealer identification either as full name and postal address or a CA number. Combined US/Canada labels are common but must satisfy both fibre-naming conventions and the French-language requirement. Quebec imposes additional French-language obligations.",
    affectedOrgs: [
      "Apparel importers selling into Canada",
      "US brands expanding into Canadian retail or e-commerce",
    ],
    requirements: [
      { title: "Bilingual fibre content", detail: "Show generic fibre names and percentages in English and French." },
      { title: "Dealer identification", detail: "Use full name and postal address, or apply for a CA identification number." },
      { title: "Align with US label content", detail: "Design a combined label that satisfies both FTC and Competition Bureau rules." },
    ],
    consequences: [
      "Retailer rejection and relabelling costs",
      "Competition Bureau enforcement action",
    ],
    deadlines: [
      { label: "CA identification number application", date: "2026-09-12", recurrence: "one_time", description: "Apply before the first Canadian shipment if using a CA number." },
    ],
    sourceName: "Competition Bureau — Textile Labelling Act",
    sourceUrl: "https://ised-isde.canada.ca/site/competition-bureau-canada/en/textile-labelling-act",
    relatedIds: ["ca-packaging-labelling-bilingual", "us-ftc-textile-labeling"],
  },
  {
    id: "us-cbp-textile-declaration",
    title: "Textile and apparel entry declarations and preferential origin claims",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "U.S. Customs and Border Protection (CBP)",
    industryTags: ["textile_apparel_import"],
    topicTags: ["imports_customs", "textile_labeling", "reporting"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "1996-07-01",
    effectiveAt: "1996-07-01",
    lastUpdatedAt: "2026-04-08",
    plainSummary:
      "Apparel imports face high duty rates and detailed origin rules. Where you claim duty-free or reduced-duty treatment under a trade agreement, you must be able to produce the supporting documentation, including the identity of the manufacturer and where the fabric was formed.",
    fullSummary:
      "Textile origin is determined largely by where the fabric was formed and where the garment was assembled, rather than by the country of final shipment. USMCA preference claims for apparel typically require yarn-forward origin. CBP requires the Manufacturer Identification Code on entry and may issue requests for information seeking production records, cutting tickets and fabric mill certificates.",
    affectedOrgs: [
      "Apparel and accessory importers",
      "Brands sourcing from multiple countries within one style",
    ],
    requirements: [
      { title: "Determine textile origin correctly", detail: "Apply the tariff-shift rules based on fabric formation and assembly." },
      { title: "Provide the Manufacturer Identification Code", detail: "Report the MID for the actual producer on each entry." },
      { title: "Retain preference documentation", detail: "Keep certifications of origin and mill records supporting any USMCA claim." },
      { title: "Respond to CBP requests for information", detail: "Produce production records within the requested timeframe." },
    ],
    consequences: [
      "Denial of preferential duty treatment and retroactive duty bills",
      "Penalties for false origin claims",
      "Increased exam rates on future shipments",
    ],
    deadlines: [
      { label: "Preference documentation audit", date: "2026-08-31", recurrence: "annual", description: "Review supplier certifications supporting duty-free claims." },
    ],
    sourceName: "CBP — Textiles and Wearing Apparel",
    sourceUrl: "https://www.cbp.gov/trade/priority-issues/textiles",
    relatedIds: ["us-cbp-importer-of-record", "us-ftc-textile-labeling"],
  },

  // =========================================================================
  // Education & tutoring
  // =========================================================================
  {
    id: "us-ca-bppe-tutoring-exemption",
    title: "Private postsecondary approval and tutoring exemptions",
    country: "US",
    jurisdictionCode: "US-CA",
    level: "STATE",
    agency: "California Bureau for Private Postsecondary Education (BPPE)",
    industryTags: ["education_tutoring"],
    topicTags: ["education_licensing", "permits_licenses", "business_registration"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2009-10-11",
    effectiveAt: "2010-01-01",
    lastUpdatedAt: "2026-02-06",
    plainSummary:
      "California regulates institutions offering postsecondary education. A K-12 tutoring centre that does not award degrees or diplomas and does not prepare students for occupations usually falls outside BPPE approval, but the exemption is not automatic — you should document why it applies and revisit it if your programmes change.",
    fullSummary:
      "The California Private Postsecondary Education Act requires approval to operate for institutions offering postsecondary education, with statutory exemptions including institutions offering solely avocational or recreational education and certain test-preparation and tutoring services. Because the exemption is fact-specific, providers commonly maintain a written analysis. Adding adult career or certification programmes typically removes the exemption.",
    affectedOrgs: [
      "Tutoring and supplemental education centres",
      "Test preparation providers",
      "Learning franchises operating in California",
    ],
    requirements: [
      { title: "Document exemption analysis", detail: "Record which statutory exemption applies and the programme facts supporting it." },
      { title: "Re-assess when programmes change", detail: "Adding adult occupational or certificate programmes may trigger approval requirements." },
      { title: "Apply for approval if in scope", detail: "Where no exemption applies, file an application for approval to operate before enrolling students." },
    ],
    consequences: [
      "Orders to cease enrolment",
      "Civil penalties for operating without approval",
      "Student tuition recovery obligations",
    ],
    deadlines: [
      { label: "Annual exemption review", date: "2026-09-18", recurrence: "annual", description: "Confirm the exemption still fits the programmes offered." },
    ],
    sourceName: "California BPPE",
    sourceUrl: "https://www.bppe.ca.gov/",
    relatedIds: ["us-ca-la-business-tax-certificate", "us-ca-child-safety-screening"],
  },
  {
    id: "us-ca-la-business-tax-certificate",
    title: "Los Angeles Business Tax Registration Certificate",
    country: "US",
    jurisdictionCode: "US-CA-LAC",
    level: "COUNTY",
    agency: "City of Los Angeles Office of Finance",
    industryTags: ["education_tutoring", "general_small_business", "food_service_technology"],
    topicTags: ["business_registration", "permits_licenses", "taxation"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "2000-01-01",
    effectiveAt: "2000-01-01",
    lastUpdatedAt: "2026-01-05",
    plainSummary:
      "Businesses operating in the City of Los Angeles need a Business Tax Registration Certificate and must renew it every year, with the renewal filed by the end of February. Small businesses under a gross-receipts threshold may qualify for an exemption but still have to file the renewal to claim it.",
    fullSummary:
      "The BTRC is required before conducting business in the city. Tax is calculated on gross receipts under a classification schedule. The Small Business Exemption applies below a gross-receipts threshold, and the Creative Artist Exemption applies to certain categories, but both require a timely renewal filing — a late filing forfeits the exemption for the year.",
    affectedOrgs: [
      "Any business with a physical location in Los Angeles",
      "Service businesses operating in the city",
      "Tutoring centres and instructional facilities",
    ],
    requirements: [
      { title: "Register before operating", detail: "Obtain the BTRC prior to starting business activity in the city." },
      { title: "File the annual renewal", detail: "Renewal is due by 28 February each year based on the prior year's gross receipts." },
      { title: "Claim exemptions on time", detail: "The Small Business Exemption must be claimed through a timely filed renewal." },
    ],
    consequences: [
      "Loss of the small business exemption for the year",
      "Penalties and interest on unpaid business tax",
      "Inability to obtain other city permits",
    ],
    deadlines: [
      { label: "BTRC annual renewal", date: "2027-02-28", recurrence: "annual", description: "Annual renewal filing deadline for the City of Los Angeles." },
      { label: "Gross receipts records prepared", date: "2027-01-31", recurrence: "annual", description: "Prepare prior-year gross receipts by classification." },
    ],
    sourceName: "City of Los Angeles — Office of Finance",
    sourceUrl: "https://finance.lacity.gov/",
    relatedIds: ["us-ca-bppe-tutoring-exemption", "us-local-occupancy-fire-permit"],
  },
  {
    id: "us-ca-child-safety-screening",
    title: "Background screening for staff working with minors",
    country: "US",
    jurisdictionCode: "US-CA",
    level: "STATE",
    agency: "California Department of Justice",
    industryTags: ["education_tutoring"],
    topicTags: ["employment", "education_licensing", "permits_licenses"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2012-09-30",
    effectiveAt: "2013-01-01",
    lastUpdatedAt: "2026-03-19",
    plainSummary:
      "Staff and volunteers who have supervisory or disciplinary contact with children generally need fingerprint-based background checks, and organisations must designate mandated reporters and train them. Records of clearances need to be kept current as staff turn over.",
    fullSummary:
      "California requires Live Scan fingerprint submission for many roles involving regular contact with minors, with subsequent arrest notification enrolment so the organisation is informed of later arrests. The Child Abuse and Neglect Reporting Act designates categories of mandated reporters, including many education-adjacent roles, and requires training and a signed acknowledgement.",
    affectedOrgs: [
      "Tutoring centres employing instructors",
      "After-school and enrichment programmes",
      "Organisations using volunteers with student contact",
    ],
    requirements: [
      { title: "Live Scan before student contact", detail: "Complete fingerprint-based screening prior to unsupervised contact with minors." },
      { title: "Enrol in subsequent arrest notification", detail: "Maintain ongoing notification so later arrests are reported to the organisation." },
      { title: "Mandated reporter training", detail: "Train designated staff and retain signed acknowledgements." },
      { title: "Maintain clearance records", detail: "Track clearance status per employee and re-screen on rehire." },
    ],
    consequences: [
      "Liability exposure and insurance coverage issues",
      "Loss of local permits or facility agreements",
      "Criminal exposure for failure to report",
    ],
    deadlines: [
      { label: "Staff clearance audit", date: "2026-08-12", recurrence: "annual", description: "Verify every current instructor has an active clearance on file." },
      { label: "Mandated reporter training refresh", date: "2026-11-30", recurrence: "annual", description: "Annual refresher training and re-acknowledgement." },
    ],
    sourceName: "California DOJ — Applicant Background Checks",
    sourceUrl: "https://oag.ca.gov/fingerprints",
    relatedIds: ["us-ca-bppe-tutoring-exemption"],
  },
  {
    id: "us-local-occupancy-fire-permit",
    title: "Certificate of occupancy and fire inspection for instructional space",
    country: "US",
    jurisdictionCode: "US-CA-LAC",
    level: "COUNTY",
    agency: "Local building and fire departments",
    industryTags: ["education_tutoring", "general_small_business", "food_service_technology"],
    topicTags: ["permits_licenses", "certification_renewals"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "2006-01-01",
    effectiveAt: "2006-01-01",
    lastUpdatedAt: "2025-08-21",
    plainSummary:
      "Using a space for classes usually requires an occupancy classification that permits assembly or educational use. Changing a retail unit into a classroom often needs a change-of-use approval, a fire inspection and posted occupant load before students can be on site.",
    fullSummary:
      "Building codes assign occupancy groups, and instructional use of previously retail or office space may constitute a change of occupancy requiring plan review, accessibility upgrades and fire-protection measures. Annual fire inspections are common for assembly and educational occupancies, covering exits, extinguishers, emergency lighting and posted occupant load.",
    affectedOrgs: [
      "Learning centres leasing commercial space",
      "Any business converting space to a new use",
    ],
    requirements: [
      { title: "Confirm occupancy classification", detail: "Verify the certificate of occupancy allows educational or assembly use." },
      { title: "Obtain change-of-use approval", detail: "File plans if converting retail or office space to instructional use." },
      { title: "Pass fire inspection", detail: "Maintain exits, extinguishers, emergency lighting and posted occupant load." },
    ],
    consequences: [
      "Order to vacate or stop using the space",
      "Fines and re-inspection fees",
      "Insurance claim denial after an incident",
    ],
    deadlines: [
      { label: "Annual fire inspection", date: "2026-10-20", recurrence: "annual", description: "Schedule and pass the annual fire safety inspection." },
    ],
    sourceName: "City of Los Angeles — Building and Safety",
    sourceUrl: "https://www.ladbs.org/",
    relatedIds: ["us-ca-la-business-tax-certificate"],
  },
  {
    id: "ca-on-private-career-colleges",
    title: "Ontario Career Colleges Act registration and programme approval",
    country: "CA",
    jurisdictionCode: "CA-ON",
    level: "PROVINCE",
    agency: "Ontario Ministry of Colleges and Universities",
    industryTags: ["education_tutoring"],
    topicTags: ["education_licensing", "permits_licenses", "certification_renewals"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2005-12-15",
    effectiveAt: "2006-09-18",
    lastUpdatedAt: "2026-05-04",
    plainSummary:
      "In Ontario, an organisation that charges fees for vocational training must register as a career college and get each programme approved. Tutoring aimed at school subjects for children is generally outside this regime, but adult skills or certification programmes typically fall inside it.",
    fullSummary:
      "The Ontario Career Colleges Act requires registration of the institution and separate approval of every vocational programme, together with financial security, a student contract in a prescribed form, refund policies and participation in the training completion assurance fund. Non-vocational tutoring is excluded, which makes the boundary between supplemental education and vocational training the key analysis for expanding tutoring businesses.",
    affectedOrgs: [
      "Education providers expanding into Ontario",
      "Tutoring businesses adding adult or certificate programmes",
    ],
    requirements: [
      { title: "Determine whether programmes are vocational", detail: "Assess whether programmes prepare students for employment in a specific occupation." },
      { title: "Register the institution", detail: "Apply for registration before advertising or enrolling students in vocational programmes." },
      { title: "Obtain per-programme approval", detail: "Each vocational programme requires separate approval." },
      { title: "Use the prescribed student contract", detail: "Adopt compliant contracts, fee schedules and refund policies." },
    ],
    consequences: [
      "Orders to stop offering the programme",
      "Refunds to students and fines",
      "Public listing as an unregistered provider",
    ],
    deadlines: [
      { label: "Registration renewal", date: "2026-12-31", recurrence: "annual", description: "Career college registrations require periodic renewal." },
      { label: "Programme scope review before Ontario launch", date: "2026-09-30", recurrence: "one_time", description: "Confirm classification before advertising in Ontario." },
    ],
    sourceName: "Ontario — Career colleges",
    sourceUrl: "https://www.ontario.ca/page/career-colleges",
    relatedIds: ["us-ca-bppe-tutoring-exemption"],
  },
  {
    id: "us-federal-ein-annual-filings",
    title: "Federal employer identification and annual business filings",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "Internal Revenue Service (IRS)",
    industryTags: ["general_small_business", "education_tutoring", "cross_border_ecommerce", "food_service_technology"],
    topicTags: ["business_registration", "taxation", "reporting"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "1986-10-22",
    effectiveAt: "1987-01-01",
    lastUpdatedAt: "2026-01-12",
    plainSummary:
      "Most businesses need a federal Employer Identification Number, then file an annual income tax return on a schedule that depends on the entity type. Employers also file quarterly payroll returns and annual wage statements.",
    fullSummary:
      "Entity type drives the filing calendar: partnerships and S corporations file by 15 March, C corporations and sole proprietors by 15 April, all with extension options. Employers file Form 941 quarterly and issue Forms W-2 by 31 January. Businesses paying contractors 600 dollars or more issue Form 1099-NEC by the same date.",
    affectedOrgs: ["Effectively all US businesses", "Employers of any size", "Businesses paying independent contractors"],
    requirements: [
      { title: "Obtain an EIN", detail: "Apply for a federal Employer Identification Number for the entity." },
      { title: "File the annual return", detail: "File on the schedule matching the entity type, or file an extension." },
      { title: "File quarterly payroll returns", detail: "Form 941 is due one month after each calendar quarter ends." },
      { title: "Issue W-2 and 1099 forms", detail: "Provide wage and contractor statements by 31 January." },
    ],
    consequences: [
      "Failure-to-file and failure-to-pay penalties",
      "Interest accruing on unpaid balances",
      "Trust fund recovery penalties for unpaid payroll taxes",
    ],
    deadlines: [
      { label: "Form 941 for Q3 2026", date: "2026-11-02", recurrence: "quarterly", description: "Quarterly payroll tax return." },
      { label: "W-2 and 1099-NEC issuance", date: "2027-02-01", recurrence: "annual", description: "Statements due to recipients and to the agency." },
    ],
    sourceName: "IRS — Businesses",
    sourceUrl: "https://www.irs.gov/businesses",
    relatedIds: ["us-employment-i9-posters"],
  },
  {
    id: "us-employment-i9-posters",
    title: "Employment eligibility verification and workplace notice postings",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "U.S. Department of Homeland Security / Department of Labor",
    industryTags: ["general_small_business", "education_tutoring", "food_service_technology", "kitchen_robotics_machinery", "telecommunications"],
    topicTags: ["employment", "reporting"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "1986-11-06",
    effectiveAt: "1987-06-01",
    lastUpdatedAt: "2026-04-02",
    plainSummary:
      "Every US employer must complete Form I-9 for each new hire within three business days of the start date, keep it for a defined retention period, and display required federal and state workplace posters where employees can see them.",
    fullSummary:
      "Section 1 of Form I-9 is completed by the employee no later than the first day of work; Section 2 by the employer within three business days. Forms are retained for three years after hire or one year after termination, whichever is later. Federal posting requirements cover FLSA, OSHA, FMLA where applicable, EEO and USERRA, with additional state-specific postings.",
    affectedOrgs: ["Any US employer", "Businesses hiring their first employee", "Employers with remote staff across multiple states"],
    requirements: [
      { title: "Complete I-9 on time", detail: "Employee section by day one; employer section within three business days." },
      { title: "Retain and purge on schedule", detail: "Keep for three years after hire or one year after termination, whichever is later." },
      { title: "Display required posters", detail: "Post federal and state notices in a location accessible to all employees." },
      { title: "Apply state-specific rules", detail: "Add state postings and any state-mandated notices at hire." },
    ],
    consequences: [
      "Civil fines per I-9 paperwork violation",
      "Higher penalties for knowingly employing unauthorised workers",
      "Department of Labor citations for missing postings",
    ],
    deadlines: [
      { label: "I-9 audit", date: "2026-09-08", recurrence: "annual", description: "Internal audit of I-9 completeness and retention purging." },
      { label: "Poster set refresh", date: "2027-01-15", recurrence: "annual", description: "Replace posters when agencies update required notices." },
    ],
    sourceName: "USCIS — I-9 Central",
    sourceUrl: "https://www.uscis.gov/i-9-central",
    relatedIds: ["us-federal-ein-annual-filings"],
  },

  // =========================================================================
  // Food service technology, kitchen robotics & machinery
  // =========================================================================
  {
    id: "us-fda-food-code-equipment",
    title: "FDA Food Code requirements for food equipment and food-contact surfaces",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "U.S. Food and Drug Administration (FDA)",
    industryTags: ["kitchen_robotics_machinery", "food_service_technology"],
    topicTags: ["food_sanitation", "product_standards", "certification_renewals"],
    status: "IN_FORCE",
    importance: "CRITICAL",
    publishedAt: "2022-12-28",
    effectiveAt: "2023-01-01",
    lastUpdatedAt: "2026-06-11",
    plainSummary:
      "Equipment used in commercial food operations must be built so it can be cleaned properly. In practice this means food-contact surfaces have to be smooth, non-absorbent and corrosion-resistant, and equipment is expected to be certified to a recognised sanitation standard such as NSF/ANSI 2 or 4 before health inspectors will accept it.",
    fullSummary:
      "The FDA Food Code is a model adopted, with variation, by state and local health jurisdictions. Chapter 4 addresses equipment design, construction, cleanability, and the requirement that equipment be certified or classified for sanitation by an ANSI-accredited certification programme. Automated and robotic kitchen equipment is evaluated on the same basis: accessibility for cleaning, absence of harbourage points and validated cleaning procedures.",
    affectedOrgs: [
      "Manufacturers and suppliers of commercial kitchen equipment",
      "Kitchen robotics and automation vendors",
      "Operators installing equipment in permitted food establishments",
    ],
    requirements: [
      { title: "Design for cleanability", detail: "Food-contact surfaces must be smooth, non-absorbent, corrosion-resistant and accessible for cleaning." },
      { title: "Obtain sanitation certification", detail: "Certify equipment to NSF/ANSI 2 (food equipment) or NSF/ANSI 4 (cooking and hot food storage) as applicable." },
      { title: "Provide cleaning procedures", detail: "Supply validated cleaning and sanitising instructions with the equipment." },
      { title: "Support plan review", detail: "Provide specification sheets and certification marks for local plan review submissions." },
    ],
    consequences: [
      "Equipment rejected at health department plan review",
      "Customer installations shut down until equipment is replaced",
      "Loss of distribution agreements with operators",
    ],
    deadlines: [
      { label: "NSF certification renewal", date: "2026-09-14", recurrence: "annual", description: "Annual audit and listing renewal for certified equipment." },
      { label: "Food Code adoption review", date: "2026-11-06", recurrence: "annual", description: "Track which Food Code edition each target state has adopted." },
    ],
    sourceName: "FDA — Food Code",
    sourceUrl: "https://www.fda.gov/food/retail-food-protection/fda-food-code",
    relatedIds: ["us-nsf-equipment-certification", "us-osha-machine-guarding", "us-local-health-plan-review"],
  },
  {
    id: "us-nsf-equipment-certification",
    title: "NSF/ANSI and NRTL certification for commercial food equipment",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "ANSI-accredited certification bodies / OSHA-recognised NRTLs",
    industryTags: ["kitchen_robotics_machinery", "food_service_technology"],
    topicTags: ["product_standards", "certification_renewals", "machinery_safety", "food_sanitation"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2019-03-01",
    effectiveAt: "2019-03-01",
    lastUpdatedAt: "2026-05-27",
    plainSummary:
      "Commercial kitchen equipment normally carries two separate marks: a sanitation certification such as NSF, and an electrical safety certification from a Nationally Recognized Testing Laboratory such as UL or Intertek. Both involve initial testing and recurring factory audits — the mark lapses if the audits are missed.",
    fullSummary:
      "Sanitation certification is evaluated against NSF/ANSI standards for materials, design and construction. Electrical safety certification against UL 197 (commercial electric cooking appliances) or UL 763 (motor-operated commercial food preparing machines) is performed by an NRTL. Both schemes require unannounced factory inspections, typically quarterly or semi-annually, and any design change requires notification and possible re-evaluation.",
    affectedOrgs: [
      "Equipment manufacturers and OEM suppliers",
      "Importers placing branded equipment on the US market",
      "Robotics vendors integrating heating or motor-driven elements",
    ],
    requirements: [
      { title: "Certify to the sanitation standard", detail: "Test and list the product under the applicable NSF/ANSI standard." },
      { title: "Obtain NRTL electrical listing", detail: "Certify to UL 197, UL 763 or the relevant standard through an OSHA-recognised NRTL." },
      { title: "Maintain factory audits", detail: "Host recurring unannounced inspections to keep the listing active." },
      { title: "Notify on design changes", detail: "Report material, component or construction changes to the certification body." },
    ],
    consequences: [
      "Listing suspension and loss of the right to use the mark",
      "Products refused by inspectors and distributors",
      "Recertification cost and lead time on relaunch",
    ],
    deadlines: [
      { label: "Semi-annual factory audit window", date: "2026-08-24", recurrence: "biennial", description: "Prepare production records and samples for the audit." },
      { label: "UL listing annual fee and review", date: "2026-12-15", recurrence: "annual", description: "Maintain the listing to keep the mark valid." },
    ],
    sourceName: "OSHA — Nationally Recognized Testing Laboratory Program",
    sourceUrl: "https://www.osha.gov/nationally-recognized-testing-laboratory-program",
    relatedIds: ["us-fda-food-code-equipment", "us-osha-machine-guarding"],
  },
  {
    id: "us-osha-machine-guarding",
    title: "Machine guarding requirements (29 CFR 1910.212)",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "Occupational Safety and Health Administration (OSHA)",
    industryTags: ["kitchen_robotics_machinery", "food_service_technology"],
    topicTags: ["machinery_safety", "employment", "product_standards"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "1971-05-29",
    effectiveAt: "1971-08-27",
    lastUpdatedAt: "2026-02-13",
    plainSummary:
      "Machines with moving parts that can injure an operator must have guards. For automated equipment this usually means interlocked guarding, an emergency stop, and a documented lockout/tagout procedure for maintenance. Suppliers are expected to ship equipment that lets the buyer meet these duties.",
    fullSummary:
      "29 CFR 1910.212 requires one or more methods of machine guarding to protect operators from hazards such as nip points, rotating parts and flying chips. Related standards cover point-of-operation guarding, anchoring of fixed machinery and the control of hazardous energy (29 CFR 1910.147). Robotic cells are commonly assessed against ANSI/RIA R15.06 for risk assessment and safeguarding, and increasingly ISO 10218 for collaborative operation.",
    affectedOrgs: [
      "Manufacturers and suppliers of powered commercial machinery",
      "Employers operating automated equipment",
      "Integrators installing robotic cells",
    ],
    requirements: [
      { title: "Provide effective guarding", detail: "Guard nip points, rotating elements and points of operation." },
      { title: "Fit emergency stop and interlocks", detail: "Ensure guards are interlocked and an accessible emergency stop is provided." },
      { title: "Document lockout/tagout", detail: "Supply energy-isolation procedures for servicing and maintenance." },
      { title: "Perform a risk assessment", detail: "Assess the installed configuration, including collaborative operation where applicable." },
    ],
    consequences: [
      "OSHA citations, including willful and repeat classifications",
      "Injury liability and workers' compensation exposure",
      "Customer refusal to accept installation",
    ],
    deadlines: [
      { label: "Machine safety risk assessment refresh", date: "2026-10-12", recurrence: "annual", description: "Update the assessment after any equipment or layout change." },
      { label: "Lockout/tagout procedure review", date: "2026-12-05", recurrence: "annual", description: "Annual inspection of energy control procedures is required." },
    ],
    sourceName: "OSHA — Machine Guarding",
    sourceUrl: "https://www.osha.gov/machine-guarding",
    relatedIds: ["us-nsf-equipment-certification", "us-fda-food-code-equipment"],
  },
  {
    id: "us-local-health-plan-review",
    title: "Health department plan review and equipment approval for food establishments",
    country: "US",
    jurisdictionCode: "US-TX-HAR",
    level: "COUNTY",
    agency: "Local environmental health departments",
    industryTags: ["kitchen_robotics_machinery", "food_service_technology"],
    topicTags: ["food_sanitation", "permits_licenses", "reporting"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2015-01-01",
    effectiveAt: "2015-01-01",
    lastUpdatedAt: "2026-04-22",
    plainSummary:
      "Before new food equipment is installed in a permitted kitchen, the local health department usually reviews the plans. They check that equipment is certified for sanitation, that there is enough clearance to clean around and under it, and that plumbing and ventilation are correct. Approval is needed before the equipment can be used.",
    fullSummary:
      "Plan review is a local process that varies by jurisdiction but consistently examines equipment certification marks, finish schedules, clearance and mounting details, indirect drainage, backflow prevention and ventilation. Automated equipment adds questions about cleaning access to enclosed mechanisms and how cleaning frequency is verified. Post-installation inspection precedes operational approval.",
    affectedOrgs: [
      "Equipment suppliers selling into permitted food establishments",
      "Operators remodelling or adding equipment",
      "Robotics vendors deploying into commercial kitchens",
    ],
    requirements: [
      { title: "Submit equipment specifications", detail: "Provide cut sheets showing sanitation certification marks and materials." },
      { title: "Show clearances and mounting", detail: "Demonstrate cleanable clearance or sealed installation on plans." },
      { title: "Address plumbing and ventilation", detail: "Detail indirect drains, backflow prevention and hood requirements." },
      { title: "Pass pre-operational inspection", detail: "Obtain sign-off before equipment enters service." },
    ],
    consequences: [
      "Installation rejected and equipment removed at supplier cost",
      "Delayed opening for the operator",
      "Reputational damage with channel partners",
    ],
    deadlines: [
      { label: "Plan review submission for Q4 installs", date: "2026-09-22", recurrence: "quarterly", description: "Submit ahead of scheduled installations to avoid slippage." },
      { label: "Annual equipment inspection report", date: "2026-11-18", recurrence: "annual", description: "Provide inspection and maintenance records where required." },
    ],
    sourceName: "Harris County Public Health — Food Establishment Plan Review",
    sourceUrl: "https://publichealth.harriscountytx.gov/Services-Programs/Services/Food-Safety",
    relatedIds: ["us-fda-food-code-equipment", "us-nsf-equipment-certification"],
  },
  {
    id: "us-tx-equipment-property-tax",
    title: "Texas business personal property tax rendition",
    country: "US",
    jurisdictionCode: "US-TX",
    level: "STATE",
    agency: "County appraisal districts / Texas Comptroller",
    industryTags: ["kitchen_robotics_machinery", "food_service_technology", "general_small_business"],
    topicTags: ["taxation", "reporting"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "2003-09-01",
    effectiveAt: "2004-01-01",
    lastUpdatedAt: "2026-01-24",
    plainSummary:
      "Texas taxes business equipment and inventory. Businesses must file a rendition listing what they own as of 1 January with the county appraisal district by 15 April each year. Missing the deadline adds a penalty on top of the tax.",
    fullSummary:
      "The rendition reports business personal property — equipment, furniture, fixtures, inventory and vehicles — with a good-faith estimate of market value or original cost by year of acquisition. An extension to 15 May is available on written request. A 10 percent penalty applies for failure to render, and 50 percent for fraudulent renditions.",
    affectedOrgs: [
      "Businesses holding equipment or inventory in Texas",
      "Equipment suppliers with demo or loaner units in the state",
    ],
    requirements: [
      { title: "Inventory property as of 1 January", detail: "Capture equipment, fixtures and inventory held on the assessment date." },
      { title: "File the rendition by 15 April", detail: "Submit to each county appraisal district where property is located." },
      { title: "Request an extension if needed", detail: "Written request extends the deadline to 15 May." },
    ],
    consequences: [
      "10 percent penalty for failure to render",
      "Appraisal district estimates value without your input",
      "Interest on late tax payments",
    ],
    deadlines: [
      { label: "Business personal property rendition", date: "2027-04-15", recurrence: "annual", description: "Annual rendition deadline for Texas county appraisal districts." },
      { label: "Fixed asset register update", date: "2027-01-10", recurrence: "annual", description: "Reconcile the asset register before rendition preparation." },
    ],
    sourceName: "Texas Comptroller — Business Personal Property",
    sourceUrl: "https://comptroller.texas.gov/taxes/property-tax/",
    relatedIds: ["us-local-health-plan-review"],
  },
  {
    id: "ca-cfia-food-contact-machinery",
    title: "Canadian machinery safety and food-contact equipment expectations",
    country: "CA",
    jurisdictionCode: "CA",
    level: "FEDERAL",
    agency: "Canadian Food Inspection Agency / provincial OHS regulators",
    industryTags: ["kitchen_robotics_machinery", "food_service_technology"],
    topicTags: ["food_sanitation", "machinery_safety", "product_standards", "certification_renewals"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2018-06-13",
    effectiveAt: "2019-01-15",
    lastUpdatedAt: "2026-03-31",
    plainSummary:
      "Canada expects food equipment to be constructed of acceptable food-contact materials and to be cleanable, and expects electrical equipment to carry a certification mark from a body accredited by the Standards Council of Canada. A US UL mark alone is generally not accepted — a Canadian mark such as cUL or CSA is normally required.",
    fullSummary:
      "The Safe Food for Canadians Regulations require preventive controls covering equipment design, maintenance and sanitation for licence holders. Provincial electrical safety authorities require equipment to bear a certification mark from an SCC-accredited body, with field evaluation available as an alternative for one-off installations. Machinery safety is regulated provincially under occupational health and safety legislation, commonly referencing CSA Z432.",
    affectedOrgs: [
      "Equipment suppliers entering the Canadian market",
      "US manufacturers exporting kitchen machinery to Canada",
    ],
    requirements: [
      { title: "Obtain a Canadian certification mark", detail: "Certify to cUL, CSA or equivalent through an SCC-accredited body." },
      { title: "Document food-contact materials", detail: "Provide evidence that materials are acceptable for food contact." },
      { title: "Meet provincial machine guarding rules", detail: "Assess against CSA Z432 and provincial OHS requirements." },
      { title: "Plan for field evaluation", detail: "Use field evaluation where certified product is not available for a specific installation." },
    ],
    consequences: [
      "Electrical inspector red-tagging the installation",
      "Equipment refused by Canadian operators",
      "Delays and cost of field evaluation per unit",
    ],
    deadlines: [
      { label: "Canadian certification for export models", date: "2026-10-30", recurrence: "one_time", description: "Complete certification before the first Canadian shipment." },
    ],
    sourceName: "CFIA — Safe Food for Canadians Regulations",
    sourceUrl: "https://inspection.canada.ca/en/food-safety-industry/safe-food-canadians-regulations",
    relatedIds: ["us-nsf-equipment-certification", "ca-consumer-product-safety-act"],
  },
  {
    id: "mx-nom-251-food-hygiene",
    title: "NOM-251-SSA1-2009 — hygiene practices for food, beverages and supplements",
    country: "MX",
    jurisdictionCode: "MX",
    level: "FEDERAL",
    agency: "COFEPRIS",
    industryTags: ["kitchen_robotics_machinery", "food_service_technology"],
    topicTags: ["food_sanitation", "product_standards"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "2009-12-01",
    effectiveAt: "2010-11-27",
    lastUpdatedAt: "2025-10-14",
    plainSummary:
      "Mexico's food hygiene standard sets rules for equipment and surfaces used in food processing and service: smooth, washable materials, no corrosion, a documented cleaning schedule, and records showing the schedule is followed.",
    fullSummary:
      "NOM-251 covers hygiene practices across the food chain, including facility layout, equipment construction and maintenance, cleaning and sanitising programmes, pest control, personnel hygiene and documentation. Equipment suppliers are affected indirectly because operators need equipment that can demonstrably meet the standard, and COFEPRIS verification examines cleaning records tied to specific equipment.",
    affectedOrgs: [
      "Food service operators in Mexico",
      "Equipment suppliers selling into Mexican kitchens",
    ],
    requirements: [
      { title: "Use acceptable equipment materials", detail: "Surfaces in contact with food must be smooth, washable and free of corrosion." },
      { title: "Provide a cleaning programme", detail: "Supply cleaning and sanitising procedures with defined frequencies." },
      { title: "Maintain records", detail: "Keep documented evidence that cleaning and maintenance were performed." },
    ],
    consequences: [
      "COFEPRIS suspension of operations",
      "Fines and product seizure",
    ],
    deadlines: [
      { label: "Cleaning programme documentation review", date: "2026-11-11", recurrence: "annual", description: "Update procedures supplied with equipment for the Mexican market." },
    ],
    sourceName: "COFEPRIS — Normatividad",
    sourceUrl: "https://www.gob.mx/cofepris",
    relatedIds: ["mx-nom-050-labelling", "us-fda-food-code-equipment"],
  },

  // =========================================================================
  // Telecommunications, privacy & data
  // =========================================================================
  {
    id: "ca-crtc-tsp-registration",
    title: "CRTC telecommunications service provider registration and reporting",
    country: "CA",
    jurisdictionCode: "CA",
    level: "FEDERAL",
    agency: "Canadian Radio-television and Telecommunications Commission (CRTC)",
    industryTags: ["telecommunications"],
    topicTags: ["telecom_regulation", "reporting", "business_registration"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2021-03-25",
    effectiveAt: "2021-09-01",
    lastUpdatedAt: "2026-06-02",
    plainSummary:
      "Companies that provide telecommunications services in Canada must register with the CRTC, file an annual data collection return, and contribute to the national contribution fund once revenues pass the threshold. Registration applies to resellers and software-based providers, not only to facilities-based carriers.",
    fullSummary:
      "Registration requires basic corporate information and a description of services offered. The annual Data Collection System filing reports Canadian telecommunications service revenues by category. Contribution-eligible revenue above the threshold triggers monthly contribution payments administered by the central fund administrator. Additional obligations attach for providers offering voice services, including 9-1-1 obligations and outage reporting.",
    affectedOrgs: [
      "Telecom carriers, resellers and MVNOs operating in Canada",
      "Software providers delivering telecommunications services",
      "Foreign providers serving Canadian subscribers",
    ],
    requirements: [
      { title: "Register as a TSP", detail: "Submit CRTC registration before or shortly after beginning to offer service." },
      { title: "File the annual data collection return", detail: "Report Canadian telecommunications revenues by service category." },
      { title: "Assess contribution obligations", detail: "Determine contribution-eligible revenue and remit where the threshold is exceeded." },
      { title: "Meet service-specific duties", detail: "Voice providers face 9-1-1, accessibility and outage reporting obligations." },
    ],
    consequences: [
      "Administrative monetary penalties",
      "Mandatory orders to file and pay arrears",
      "Public compliance proceedings",
    ],
    deadlines: [
      { label: "Annual data collection filing", date: "2027-03-31", recurrence: "annual", description: "Annual telecommunications revenue return to the CRTC." },
      { label: "Contribution eligibility assessment", date: "2026-09-30", recurrence: "annual", description: "Reassess contribution-eligible revenue for the year." },
    ],
    sourceName: "CRTC — Telecommunications",
    sourceUrl: "https://crtc.gc.ca/eng/telecom.htm",
    relatedIds: ["ca-pipeda-privacy", "ca-casl-anti-spam"],
  },
  {
    id: "ca-pipeda-privacy",
    title: "PIPEDA — personal information handling and breach reporting",
    country: "CA",
    jurisdictionCode: "CA",
    level: "FEDERAL",
    agency: "Office of the Privacy Commissioner of Canada",
    industryTags: ["telecommunications", "cross_border_ecommerce", "education_tutoring", "general_small_business"],
    topicTags: ["privacy", "reporting"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2000-04-13",
    effectiveAt: "2004-01-01",
    lastUpdatedAt: "2026-05-08",
    plainSummary:
      "If your organisation collects personal information in the course of commercial activity in Canada, you need meaningful consent, a stated purpose, safeguards appropriate to the sensitivity of the data, and a way for people to access their information. Breaches that create a real risk of significant harm must be reported to the Privacy Commissioner and to affected individuals.",
    fullSummary:
      "PIPEDA is built on ten fair information principles covering accountability, identifying purposes, consent, limiting collection, limiting use and retention, accuracy, safeguards, openness, individual access and challenging compliance. Since 2018, mandatory breach reporting requires notification as soon as feasible where a breach creates a real risk of significant harm, plus a breach record retained for 24 months regardless of whether it was reportable.",
    affectedOrgs: [
      "Organisations handling personal information in Canada",
      "Telecom providers holding subscriber and usage data",
      "E-commerce and education businesses with Canadian customers",
    ],
    requirements: [
      { title: "Designate a privacy officer", detail: "Name an individual accountable for compliance." },
      { title: "Obtain meaningful consent", detail: "Explain purposes in plain language before or at collection." },
      { title: "Apply proportionate safeguards", detail: "Protect information with measures matched to its sensitivity." },
      { title: "Report qualifying breaches", detail: "Notify the OPC and affected individuals as soon as feasible where there is a real risk of significant harm." },
      { title: "Keep a breach log", detail: "Record every breach of security safeguards and retain records for 24 months." },
    ],
    consequences: [
      "Commissioner investigation and public findings",
      "Federal Court orders and damages",
      "Reputational harm from published breach findings",
    ],
    deadlines: [
      { label: "Breach notification", date: "REL:+3", recurrence: "one_time", description: "As soon as feasible after determining a reportable breach occurred." },
      { label: "Annual privacy programme review", date: "2026-10-05", recurrence: "annual", description: "Review consent flows, retention schedules and the breach log." },
    ],
    sourceName: "OPC — PIPEDA",
    sourceUrl: "https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/",
    relatedIds: ["ca-quebec-law-25", "us-ca-cpra-privacy", "ca-crtc-tsp-registration"],
  },
  {
    id: "ca-quebec-law-25",
    title: "Quebec Law 25 — privacy modernisation obligations",
    country: "CA",
    jurisdictionCode: "CA-QC",
    level: "PROVINCE",
    agency: "Commission d'accès à l'information du Québec",
    industryTags: ["telecommunications", "cross_border_ecommerce", "general_small_business"],
    topicTags: ["privacy", "reporting"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2021-09-22",
    effectiveAt: "2023-09-22",
    lastUpdatedAt: "2026-04-17",
    plainSummary:
      "Quebec has stricter privacy rules than the rest of Canada. Organisations must appoint a privacy officer and publish their contact details, run privacy impact assessments before new systems or cross-border transfers, get express consent for sensitive information, and since 2024 support data portability.",
    fullSummary:
      "Law 25 amended Quebec's private-sector privacy statute in phases. Key obligations include appointing and publishing a person in charge of protection of personal information, confidentiality-by-default settings for products with privacy settings, privacy impact assessments for information system projects and for disclosures outside Quebec, transparency about automated decision-making, and a right to data portability. Penalties are substantially higher than PIPEDA, reaching a percentage of worldwide turnover for serious offences.",
    affectedOrgs: [
      "Any organisation handling personal information of people in Quebec",
      "Telecom and digital service providers with Quebec subscribers",
      "Businesses transferring Quebec data outside the province",
    ],
    requirements: [
      { title: "Appoint and publish a privacy officer", detail: "Name the person in charge and publish their title and contact details on the website." },
      { title: "Conduct privacy impact assessments", detail: "Assess new information system projects and any transfer of data outside Quebec." },
      { title: "Default to maximum confidentiality", detail: "Products with privacy settings must default to the highest confidentiality level." },
      { title: "Support data portability", detail: "Provide computerised personal information in a structured, commonly used technological format on request." },
      { title: "Disclose automated decisions", detail: "Inform individuals when a decision is based exclusively on automated processing." },
    ],
    consequences: [
      "Administrative monetary penalties up to a percentage of worldwide turnover",
      "Penal fines for serious offences",
      "Private right of action with punitive damages",
    ],
    deadlines: [
      { label: "Privacy impact assessment for new cross-border transfer", date: "2026-08-28", recurrence: "ongoing", description: "Required before transferring personal information outside Quebec." },
      { label: "Annual policy and register refresh", date: "2026-12-10", recurrence: "annual", description: "Update the privacy governance register and published policies." },
    ],
    sourceName: "Commission d'accès à l'information du Québec",
    sourceUrl: "https://www.cai.gouv.qc.ca/",
    relatedIds: ["ca-pipeda-privacy", "us-ca-cpra-privacy"],
  },
  {
    id: "us-ca-cpra-privacy",
    title: "California Consumer Privacy Act as amended by the CPRA",
    country: "US",
    jurisdictionCode: "US-CA",
    level: "STATE",
    agency: "California Privacy Protection Agency (CPPA)",
    industryTags: ["telecommunications", "cross_border_ecommerce", "education_tutoring", "general_small_business"],
    topicTags: ["privacy", "reporting"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2020-11-03",
    effectiveAt: "2023-01-01",
    lastUpdatedAt: "2026-06-19",
    plainSummary:
      "Businesses over certain size thresholds that handle Californians' personal information must publish a privacy notice, honour requests to know, delete and correct data, offer opt-outs from sale or sharing, honour the Global Privacy Control browser signal, and put required terms into contracts with service providers.",
    fullSummary:
      "The CCPA applies to for-profit businesses meeting one of three thresholds: annual gross revenue above 25 million dollars, buying or selling the personal information of 100,000 or more consumers or households, or deriving 50 percent or more of revenue from selling or sharing personal information. The CPRA added the category of sensitive personal information with a right to limit its use, data minimisation and retention disclosure duties, and risk assessment and cybersecurity audit obligations for higher-risk processing.",
    affectedOrgs: [
      "Businesses meeting the CCPA revenue or volume thresholds",
      "Telecom and digital service providers with California users",
      "Companies using advertising technology that constitutes 'sharing'",
    ],
    requirements: [
      { title: "Publish a compliant privacy policy", detail: "Include categories collected, purposes, retention periods and consumer rights, updated at least every 12 months." },
      { title: "Provide two request methods", detail: "Offer at least two designated methods for submitting rights requests." },
      { title: "Honour opt-out signals", detail: "Process the Global Privacy Control as a valid opt-out of sale and sharing." },
      { title: "Contract with service providers", detail: "Include the required processing terms in vendor contracts." },
      { title: "Respond within 45 days", detail: "Fulfil verified consumer requests within 45 days, extendable once by another 45." },
    ],
    consequences: [
      "Administrative fines per violation, higher for violations involving minors",
      "Private right of action with statutory damages after a qualifying breach",
      "CPPA enforcement audits",
    ],
    deadlines: [
      { label: "Consumer request response window", date: "REL:+45", recurrence: "ongoing", description: "45 days from receipt of a verifiable consumer request." },
      { label: "Annual privacy policy update", date: "2026-12-31", recurrence: "annual", description: "The policy must be reviewed and updated at least every 12 months." },
    ],
    sourceName: "California Privacy Protection Agency",
    sourceUrl: "https://cppa.ca.gov/",
    relatedIds: ["ca-pipeda-privacy", "ca-quebec-law-25", "us-fcc-cpni"],
  },
  {
    id: "us-fcc-cpni",
    title: "FCC Customer Proprietary Network Information rules",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "Federal Communications Commission (FCC)",
    industryTags: ["telecommunications"],
    topicTags: ["telecom_regulation", "privacy", "reporting", "certification_renewals"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "2007-04-02",
    effectiveAt: "2007-12-08",
    lastUpdatedAt: "2026-02-28",
    plainSummary:
      "Telecom carriers must protect information about who customers call and what services they buy. Every year, an officer of the company has to file a signed certification with the FCC confirming the company has procedures in place, and describing any complaints received about unauthorised disclosure.",
    fullSummary:
      "CPNI rules restrict use and disclosure of call detail and service information, require customer authentication before disclosing call detail records, mandate notification to customers when account passwords or addresses change, and require notice to law enforcement and customers after a CPNI breach. The annual officer certification, with an accompanying statement of compliance procedures, is due by 1 March covering the prior calendar year.",
    affectedOrgs: [
      "Telecommunications carriers and interconnected VoIP providers in the US",
      "Resellers of telecom services",
    ],
    requirements: [
      { title: "Maintain CPNI procedures", detail: "Document how CPNI is used, disclosed and protected across systems and vendors." },
      { title: "Authenticate before disclosure", detail: "Verify customer identity before releasing call detail information." },
      { title: "File the annual officer certification", detail: "An officer must sign and file the certification with a compliance statement by 1 March." },
      { title: "Report breaches", detail: "Notify law enforcement through the central reporting facility and then customers, per the rules." },
    ],
    consequences: [
      "Forfeiture orders and monetary penalties",
      "Consent decrees with compliance plans",
      "Enforcement advisories naming non-filers",
    ],
    deadlines: [
      { label: "Annual CPNI officer certification", date: "2027-03-01", recurrence: "annual", description: "Covers the prior calendar year; signed by a corporate officer." },
      { label: "CPNI training refresh", date: "2026-11-20", recurrence: "annual", description: "Retrain staff with access to customer records." },
    ],
    sourceName: "FCC — Customer Privacy",
    sourceUrl: "https://www.fcc.gov/general/customer-privacy",
    relatedIds: ["us-fcc-form-499", "us-ca-cpra-privacy"],
  },
  {
    id: "us-fcc-form-499",
    title: "FCC Form 499 filings and Universal Service Fund contributions",
    country: "US",
    jurisdictionCode: "US",
    level: "FEDERAL",
    agency: "Federal Communications Commission (FCC) / USAC",
    industryTags: ["telecommunications"],
    topicTags: ["telecom_regulation", "reporting", "taxation"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "1997-05-08",
    effectiveAt: "1998-01-01",
    lastUpdatedAt: "2026-05-15",
    plainSummary:
      "Providers of interstate telecommunications must register with the FCC and report their revenues each year on Form 499-A, with quarterly Form 499-Q filings if they contribute to the Universal Service Fund. The annual filing is due 1 April and drives contribution obligations for the year.",
    fullSummary:
      "Form 499-A reports prior-year revenues by category and is the basis for contributions to the Universal Service Fund, Telecommunications Relay Service fund, local number portability and North American Numbering Plan cost recovery. Form 499-Q projects revenues quarterly. A de minimis exemption applies where annual contribution would be below a threshold, but the 499-A filing obligation itself generally remains.",
    affectedOrgs: [
      "Interstate telecommunications carriers",
      "Interconnected VoIP providers",
      "Resellers with US interstate revenue",
    ],
    requirements: [
      { title: "Register with the FCC", detail: "Obtain an FCC Registration Number and file the initial Form 499-A." },
      { title: "File Form 499-A annually", detail: "Report prior-calendar-year revenue by category by 1 April." },
      { title: "File Form 499-Q quarterly", detail: "Contributors submit quarterly revenue projections." },
      { title: "Remit contributions", detail: "Pay USF and related fund invoices from USAC on schedule." },
    ],
    consequences: [
      "Late-filing fees and interest on unpaid contributions",
      "Red Light status blocking other FCC applications",
      "Enforcement action for non-filing",
    ],
    deadlines: [
      { label: "Form 499-A annual filing", date: "2027-04-01", recurrence: "annual", description: "Annual revenue report covering the prior calendar year." },
      { label: "Form 499-Q quarterly filing", date: "2026-11-01", recurrence: "quarterly", description: "Quarterly projected revenue filing for contributors." },
    ],
    sourceName: "USAC — Form 499",
    sourceUrl: "https://www.usac.org/service-providers/making-payments/forms/",
    relatedIds: ["us-fcc-cpni"],
  },
  {
    id: "ca-casl-anti-spam",
    title: "Canada's Anti-Spam Legislation (CASL)",
    country: "CA",
    jurisdictionCode: "CA",
    level: "FEDERAL",
    agency: "CRTC / Competition Bureau / Office of the Privacy Commissioner",
    industryTags: ["telecommunications", "cross_border_ecommerce", "education_tutoring", "general_small_business"],
    topicTags: ["privacy", "telecom_regulation", "reporting"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "2010-12-15",
    effectiveAt: "2014-07-01",
    lastUpdatedAt: "2025-11-27",
    plainSummary:
      "Commercial electronic messages sent to Canadian recipients need consent, clear sender identification and a working unsubscribe mechanism that stays valid for at least 60 days and is honoured within 10 business days. You must be able to prove consent, which means keeping records of how and when it was obtained.",
    fullSummary:
      "CASL covers email, SMS and other commercial electronic messages. Express consent must be obtained through a clear opt-in that is not pre-checked; implied consent arises in limited circumstances such as an existing business relationship, and expires after defined periods. The statute also regulates installation of computer programs on another person's device. Penalties reach 10 million Canadian dollars per violation for organisations.",
    affectedOrgs: [
      "Any business emailing or texting Canadian recipients",
      "E-commerce brands running marketing campaigns",
      "Telecom and software providers pushing product notifications",
    ],
    requirements: [
      { title: "Obtain and record consent", detail: "Use unbundled opt-in and retain evidence of when and how consent was given." },
      { title: "Identify the sender", detail: "Include the sender's name, mailing address and a contact method valid for 60 days." },
      { title: "Provide unsubscribe", detail: "Include a mechanism honoured within 10 business days and functional for at least 60 days." },
      { title: "Track implied consent expiry", detail: "Monitor when implied consent based on a business relationship lapses." },
    ],
    consequences: [
      "Administrative monetary penalties up to 10 million dollars for organisations",
      "Director and officer liability",
      "Undertakings with published compliance terms",
    ],
    deadlines: [
      { label: "Unsubscribe processing", date: "REL:+10", recurrence: "ongoing", description: "10 business days from the unsubscribe request." },
      { label: "Consent register audit", date: "2026-09-26", recurrence: "annual", description: "Review consent evidence and expiring implied consents." },
    ],
    sourceName: "Government of Canada — CASL",
    sourceUrl: "https://ised-isde.canada.ca/site/canada-anti-spam-legislation/en",
    relatedIds: ["ca-pipeda-privacy", "ca-crtc-tsp-registration"],
  },
  {
    id: "mx-ift-telecom-registry",
    title: "IFT telecommunications provider registration in Mexico",
    country: "MX",
    jurisdictionCode: "MX",
    level: "FEDERAL",
    agency: "Instituto Federal de Telecomunicaciones (IFT)",
    industryTags: ["telecommunications"],
    topicTags: ["telecom_regulation", "business_registration", "reporting"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "2014-07-14",
    effectiveAt: "2014-08-13",
    lastUpdatedAt: "2026-03-06",
    plainSummary:
      "Providing telecommunications services in Mexico normally requires either a single concession from the regulator or, for some resale models, an authorisation. Providers are entered in the public telecommunications registry and must file periodic information about their services and coverage.",
    fullSummary:
      "The Federal Telecommunications and Broadcasting Law established a converged single concession model. Providers register in the Registro Público de Concesiones, and must comply with user rights rules, quality-of-service metrics and information filings. Resellers may operate under authorisation rather than a full concession depending on the service model.",
    affectedOrgs: [
      "Telecom operators and resellers serving Mexican customers",
      "Foreign providers expanding into Mexico",
    ],
    requirements: [
      { title: "Determine concession or authorisation route", detail: "Assess which instrument matches the service model." },
      { title: "Register in the public registry", detail: "Ensure the concession or authorisation is recorded with IFT." },
      { title: "Meet user rights and quality rules", detail: "Comply with the collaboration, transparency and quality obligations." },
    ],
    consequences: [
      "Sanctions and fines from IFT",
      "Order to suspend service provision",
    ],
    deadlines: [
      { label: "Annual information filing", date: "2027-03-31", recurrence: "annual", description: "Periodic information filings to the regulator." },
    ],
    sourceName: "IFT — Trámites y servicios",
    sourceUrl: "https://www.ift.org.mx/",
    relatedIds: ["ca-crtc-tsp-registration", "us-fcc-form-499"],
  },

  // =========================================================================
  // Cross-cutting / general small business
  // =========================================================================
  {
    id: "us-state-llc-annual-report",
    title: "State entity registration, registered agent and annual report",
    country: "US",
    jurisdictionCode: "US-CA",
    level: "STATE",
    agency: "California Secretary of State / Franchise Tax Board",
    industryTags: ["general_small_business", "cross_border_ecommerce", "education_tutoring", "food_service_technology", "kitchen_robotics_machinery"],
    topicTags: ["business_registration", "reporting", "taxation"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "1994-01-01",
    effectiveAt: "1994-09-30",
    lastUpdatedAt: "2026-01-19",
    plainSummary:
      "An LLC or corporation must keep its registration current in every state where it does business. In California this means filing a Statement of Information and paying the annual franchise tax. Doing business in another state usually requires registering there as a foreign entity as well.",
    fullSummary:
      "California LLCs file an initial Statement of Information within 90 days of registration and then biennially; corporations file annually. The 800 dollar minimum franchise tax applies to LLCs and corporations doing business in the state, with an additional LLC fee tiered on California-source income. Operating in another state without foreign qualification can bar the entity from bringing suit there and expose it to back fees and penalties.",
    affectedOrgs: [
      "LLCs and corporations registered in California",
      "Out-of-state entities doing business in California",
      "Businesses expanding operations into new states",
    ],
    requirements: [
      { title: "Maintain a registered agent", detail: "Keep a current agent for service of process on file." },
      { title: "File the Statement of Information", detail: "File on the required cycle for the entity type." },
      { title: "Pay the annual franchise tax", detail: "The minimum franchise tax is due regardless of profitability." },
      { title: "Foreign-qualify where required", detail: "Register in each additional state where the entity is doing business." },
    ],
    consequences: [
      "Suspension or forfeiture of entity status",
      "Loss of the right to sue or defend in state courts",
      "Penalties for late Statement of Information filings",
    ],
    deadlines: [
      { label: "Statement of Information filing", date: "2026-09-30", recurrence: "annual", description: "Due in the filing period based on the registration anniversary month." },
      { label: "Annual franchise tax payment", date: "2027-04-15", recurrence: "annual", description: "Minimum franchise tax due for the taxable year." },
    ],
    sourceName: "California Secretary of State — Business Programs",
    sourceUrl: "https://www.sos.ca.gov/business-programs",
    relatedIds: ["us-ca-sales-tax-nexus", "us-federal-ein-annual-filings"],
  },
  {
    id: "ca-gst-hst-registration",
    title: "GST/HST registration and remittance",
    country: "CA",
    jurisdictionCode: "CA",
    level: "FEDERAL",
    agency: "Canada Revenue Agency (CRA)",
    industryTags: ["general_small_business", "cross_border_ecommerce", "textile_apparel_import", "telecommunications", "education_tutoring"],
    topicTags: ["taxation", "business_registration", "reporting"],
    status: "IN_FORCE",
    importance: "HIGH",
    publishedAt: "1990-12-17",
    effectiveAt: "1991-01-01",
    lastUpdatedAt: "2026-04-25",
    plainSummary:
      "A business must register for GST/HST once worldwide taxable revenues exceed 30,000 Canadian dollars in a single quarter or over four consecutive quarters. Non-resident businesses selling digital products or goods to Canadian consumers may also have to register under the simplified regime.",
    fullSummary:
      "Registration is mandatory above the small supplier threshold, and voluntary below it, which many importers choose in order to recover input tax credits on GST paid at the border. Filing frequency is set by annual taxable supplies: annual, quarterly or monthly. Non-resident vendors and distribution platform operators are covered by the simplified GST/HST regime for cross-border digital products and services, and by separate rules for goods fulfilled from Canadian warehouses.",
    affectedOrgs: [
      "Businesses selling goods or services in Canada",
      "Non-resident e-commerce sellers shipping into Canada",
      "Importers seeking to recover GST paid at the border",
    ],
    requirements: [
      { title: "Monitor the 30,000 dollar threshold", detail: "Test both a single-quarter and a rolling four-quarter basis." },
      { title: "Register for a GST/HST account", detail: "Obtain a Business Number with an RT program account." },
      { title: "Charge the correct rate", detail: "Apply GST or the applicable HST rate based on the place of supply." },
      { title: "File and remit on schedule", detail: "File returns and remit net tax by the assigned filing frequency." },
    ],
    consequences: [
      "Assessment of tax that should have been collected",
      "Failure-to-file penalties plus interest",
      "Loss of input tax credits for unregistered periods",
    ],
    deadlines: [
      { label: "Quarterly GST/HST return", date: "2026-10-31", recurrence: "quarterly", description: "Return and payment due one month after the reporting period ends." },
      { label: "Registration threshold review", date: "2026-09-05", recurrence: "quarterly", description: "Confirm whether the small supplier threshold has been exceeded." },
    ],
    sourceName: "CRA — GST/HST for businesses",
    sourceUrl: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html",
    relatedIds: ["ca-cbsa-carm-import", "us-ca-sales-tax-nexus"],
  },
  {
    id: "ca-bc-business-licence",
    title: "British Columbia municipal business licence and provincial registration",
    country: "CA",
    jurisdictionCode: "CA-BC",
    level: "PROVINCE",
    agency: "BC Registries and municipal licensing offices",
    industryTags: ["general_small_business", "education_tutoring", "food_service_technology"],
    topicTags: ["business_registration", "permits_licenses", "taxation"],
    status: "IN_FORCE",
    importance: "MODERATE",
    publishedAt: "2004-03-29",
    effectiveAt: "2004-03-29",
    lastUpdatedAt: "2025-12-18",
    plainSummary:
      "Operating in British Columbia usually needs both a provincial registration and a municipal business licence from each city where you have a location. Municipal licences renew annually, and some cities require an inter-municipal licence if you work across boundaries.",
    fullSummary:
      "Extraprovincial companies register with BC Registries within a set period of beginning to carry on business in the province. Municipal licences are issued per location and often depend on zoning approval and, for instructional or food premises, health or fire sign-off. The Inter-municipal Business Licence programme lets mobile businesses operate across participating municipalities under one licence.",
    affectedOrgs: [
      "Businesses opening a location in British Columbia",
      "Out-of-province companies expanding into BC",
    ],
    requirements: [
      { title: "Register extraprovincially", detail: "File with BC Registries when beginning to carry on business in the province." },
      { title: "Obtain a municipal licence", detail: "Apply in each municipality where the business has premises." },
      { title: "Confirm zoning", detail: "Check that the intended use is permitted at the address before signing a lease." },
      { title: "Renew annually", detail: "Municipal licences generally renew on a calendar-year cycle." },
    ],
    consequences: [
      "Fines and orders to cease operating",
      "Inability to obtain building or health permits",
    ],
    deadlines: [
      { label: "Municipal business licence renewal", date: "2027-01-31", recurrence: "annual", description: "Most BC municipalities renew licences early in the calendar year." },
    ],
    sourceName: "BC Registries and Online Services",
    sourceUrl: "https://www2.gov.bc.ca/gov/content/employment-business/business",
    relatedIds: ["ca-gst-hst-registration"],
  },
];

export const POLICY_BY_ID = new Map(POLICIES.map((p) => [p.id, p]));
