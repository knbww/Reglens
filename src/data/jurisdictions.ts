import type { JurisdictionLevel } from "@prisma/client";

export type JurisdictionSeed = {
  code: string;
  name: string;
  country: string;
  level: JurisdictionLevel;
  parentCode: string | null;
};

/**
 * North American jurisdiction tree used across onboarding, search filters and
 * the comparison tool. Federal + full state/province/territory coverage, with
 * a handful of local jurisdictions where the MVP dataset needs them.
 */
export const JURISDICTIONS: JurisdictionSeed[] = [
  // --- Countries (federal level) -------------------------------------------
  { code: "US", name: "United States (Federal)", country: "US", level: "FEDERAL", parentCode: null },
  { code: "CA", name: "Canada (Federal)", country: "CA", level: "FEDERAL", parentCode: null },
  { code: "MX", name: "Mexico (Federal)", country: "MX", level: "FEDERAL", parentCode: null },

  // --- US states & territories ---------------------------------------------
  ...(
    [
      ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
      ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
      ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
      ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
      ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
      ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
      ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
      ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
      ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
      ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
      ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
      ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
      ["WI", "Wisconsin"], ["WY", "Wyoming"], ["DC", "District of Columbia"],
    ] as const
  ).map(([code, name]): JurisdictionSeed => ({
    code: `US-${code}`,
    name,
    country: "US",
    level: "STATE",
    parentCode: "US",
  })),
  ...(
    [
      ["PR", "Puerto Rico"], ["GU", "Guam"], ["VI", "U.S. Virgin Islands"],
    ] as const
  ).map(([code, name]): JurisdictionSeed => ({
    code: `US-${code}`,
    name,
    country: "US",
    level: "TERRITORY",
    parentCode: "US",
  })),

  // --- Canadian provinces & territories ------------------------------------
  ...(
    [
      ["AB", "Alberta"], ["BC", "British Columbia"], ["MB", "Manitoba"],
      ["NB", "New Brunswick"], ["NL", "Newfoundland and Labrador"], ["NS", "Nova Scotia"],
      ["ON", "Ontario"], ["PE", "Prince Edward Island"], ["QC", "Quebec"], ["SK", "Saskatchewan"],
    ] as const
  ).map(([code, name]): JurisdictionSeed => ({
    code: `CA-${code}`,
    name,
    country: "CA",
    level: "PROVINCE",
    parentCode: "CA",
  })),
  ...(
    [
      ["NT", "Northwest Territories"], ["NU", "Nunavut"], ["YT", "Yukon"],
    ] as const
  ).map(([code, name]): JurisdictionSeed => ({
    code: `CA-${code}`,
    name,
    country: "CA",
    level: "TERRITORY",
    parentCode: "CA",
  })),

  // --- Mexican states -------------------------------------------------------
  ...(
    [
      ["AGU", "Aguascalientes"], ["BCN", "Baja California"], ["BCS", "Baja California Sur"],
      ["CAM", "Campeche"], ["CHP", "Chiapas"], ["CHH", "Chihuahua"], ["CMX", "Ciudad de México"],
      ["COA", "Coahuila"], ["COL", "Colima"], ["DUR", "Durango"], ["GUA", "Guanajuato"],
      ["GRO", "Guerrero"], ["HID", "Hidalgo"], ["JAL", "Jalisco"], ["MEX", "Estado de México"],
      ["MIC", "Michoacán"], ["MOR", "Morelos"], ["NAY", "Nayarit"], ["NLE", "Nuevo León"],
      ["OAX", "Oaxaca"], ["PUE", "Puebla"], ["QUE", "Querétaro"], ["ROO", "Quintana Roo"],
      ["SLP", "San Luis Potosí"], ["SIN", "Sinaloa"], ["SON", "Sonora"], ["TAB", "Tabasco"],
      ["TAM", "Tamaulipas"], ["TLA", "Tlaxcala"], ["VER", "Veracruz"], ["YUC", "Yucatán"],
      ["ZAC", "Zacatecas"],
    ] as const
  ).map(([code, name]): JurisdictionSeed => ({
    code: `MX-${code}`,
    name,
    country: "MX",
    level: "STATE",
    parentCode: "MX",
  })),

  // --- Selected local jurisdictions used by the MVP dataset ----------------
  { code: "US-CA-LAC", name: "Los Angeles County, CA", country: "US", level: "COUNTY", parentCode: "US-CA" },
  { code: "US-NY-NYC", name: "New York City, NY", country: "US", level: "MUNICIPAL", parentCode: "US-NY" },
  { code: "US-TX-HAR", name: "Harris County, TX", country: "US", level: "COUNTY", parentCode: "US-TX" },
  { code: "CA-ON-TOR", name: "City of Toronto, ON", country: "CA", level: "MUNICIPAL", parentCode: "CA-ON" },
  { code: "CA-BC-VAN", name: "City of Vancouver, BC", country: "CA", level: "MUNICIPAL", parentCode: "CA-BC" },
];

export const JURISDICTION_BY_CODE = new Map(JURISDICTIONS.map((j) => [j.code, j]));

export function jurisdictionName(code: string | null | undefined): string {
  if (!code) return "—";
  return JURISDICTION_BY_CODE.get(code)?.name ?? code;
}

/** Short display form: "California" -> "CA · California" style labels. */
export function jurisdictionShort(code: string | null | undefined): string {
  if (!code) return "—";
  const j = JURISDICTION_BY_CODE.get(code);
  if (!j) return code;
  if (j.level === "FEDERAL") return j.country === "US" ? "US Federal" : j.country === "CA" ? "Canada Federal" : "Mexico Federal";
  return j.name;
}

export function regionsForCountry(country: string): JurisdictionSeed[] {
  return JURISDICTIONS.filter(
    (j) => j.country === country && (j.level === "STATE" || j.level === "PROVINCE" || j.level === "TERRITORY"),
  );
}
