/**
 * Canonical dictionary of accredited scholarship sponsors and official domains.
 * Used for domain whitelisting, brand spoofing prevention, and email validation.
 */
export const ACCREDITED_ORGS = [
    {
        name: "National Scholarship Portal",
        aliases: ["national scholarship portal", "ministry of education", "nsp", "national scholarship"],
        domains: ["scholarships.gov.in", "nsp.gov.in"],
        brandTokens: ["scholarshipsgov", "nspgov", "nationalscholarshipportal", "nationalscholarship"],
        isGovernment: true,
    },
    {
        name: "Fulbright",
        aliases: ["fulbright", "fulbright commission", "iie", "united states-india educational foundation", "usief"],
        domains: ["fulbrightonline.org", "fulbrightprogram.org", "iie.org", "usief.org.in", "state.gov"],
        brandTokens: ["fulbright", "usief", "fulbrightonline", "fulbrightprogram"],
        isGovernment: false,
    },
    {
        name: "Tata Trusts",
        aliases: ["tata trusts", "tata trust", "sir dorabji tata trust", "sir ratan tata trust", "tata education grant", "tata"],
        domains: ["tatatrusts.org"],
        brandTokens: ["tatatrusts", "tatatrust"],
        isGovernment: false,
    },
    {
        name: "Rhodes Trust",
        aliases: ["rhodes trust", "rhodes scholarship", "rhodes"],
        domains: ["rhodeshouse.ox.ac.uk", "ox.ac.uk"],
        brandTokens: ["rhodeshouse", "rhodestrust", "rhodesscholarship"],
        isGovernment: false,
    },
    {
        name: "Chevening",
        aliases: ["chevening", "chevening scholarship", "foreign commonwealth and development office", "fcdo"],
        domains: ["chevening.org", "gov.uk", "fcdo.gov.uk"],
        brandTokens: ["chevening"],
        isGovernment: false,
    },
    {
        name: "DAAD",
        aliases: ["daad", "german academic exchange service"],
        domains: ["daad.de"],
        brandTokens: ["daad"],
        isGovernment: false,
    },
    {
        name: "Commonwealth Scholarship",
        aliases: ["commonwealth scholarship", "cscuk", "commonwealth scholarship commission"],
        domains: ["cscuk.fcdo.gov.uk", "fcdo.gov.uk"],
        brandTokens: ["cscuk", "commonwealthscholarship"],
        isGovernment: false,
    },
    {
        name: "Reliance Foundation",
        aliases: ["reliance foundation", "reliance foundation scholarship", "reliance"],
        domains: ["reliancefoundation.org", "scholarships.reliancefoundation.org"],
        brandTokens: ["reliancefoundation"],
        isGovernment: false,
    },
    {
        name: "AICTE",
        aliases: ["aicte", "all india council for technical education"],
        domains: ["aicte-india.org"],
        brandTokens: ["aicteindia", "aicte"],
        isGovernment: true,
    },
    {
        name: "UGC",
        aliases: ["ugc", "university grants commission"],
        domains: ["ugc.gov.in", "ugc.ac.in"],
        brandTokens: ["ugcgov", "ugcac", "ugc"],
        isGovernment: true,
    },
];

/**
 * Normalizes strings by lowercasing and stripping hyphens, underscores, dots, and whitespace.
 */
export function normalizeToken(str) {
    if (!str) return "";
    return str.toLowerCase().replace(/[-_.\s]/g, "");
}

/**
 * Checks if a hostname matches an accredited org domain.
 */
export function matchesOrgDomain(hostname, orgDomains) {
    if (!hostname || !orgDomains) return false;
    const cleanHost = hostname.toLowerCase().trim();
    return orgDomains.some((d) => cleanHost === d || cleanHost.endsWith("." + d));
}

