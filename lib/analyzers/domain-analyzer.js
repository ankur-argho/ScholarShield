import dns from "dns";
import legitScholarships from "../data/legit-scholarships.json";
import { ACCREDITED_ORGS, normalizeToken, matchesOrgDomain } from "../data/accredited-orgs";

// High-risk TLDs commonly abused by malicious actors for disposable scam sites
const SUSPICIOUS_TLDS = new Set([
    "xyz", "top", "click", "loan", "work", "fit", "gq", "tk", "ml", "cf",
    "icu", "buzz", "rest", "cam", "vip", "cc", "monster", "cfd", "sbs"
]);

// Trustworthy TLD suffixes typically reserved for educational and governmental bodies
const TRUSTED_TLDS = [
    ".edu", ".gov", ".ac.uk", ".gov.uk", ".gov.in", ".nic.in", ".go.jp", ".govt.nz", ".gov.au", ".europa.eu", ".admin.ch", ".edu.sg", ".edu.in"
];

// Well-known brands to monitor for domain hijacking
const PROTECTED_BRANDS = [
    { brand: "fulbright", officialDomains: ["fulbrightprogram.org", "fulbrightonline.org", "state.gov"] },
    { brand: "chevening", officialDomains: ["chevening.org", "gov.uk", "fcdo.gov.uk"] },
    { brand: "daad", officialDomains: ["daad.de"] },
    { brand: "mext", officialDomains: ["mext.go.jp"] },
    { brand: "erasmus", officialDomains: ["europa.eu"] },
    { brand: "rhodes", officialDomains: ["rhodeshouse.ox.ac.uk", "ox.ac.uk"] },
    { brand: "gatescambridge", officialDomains: ["gatescambridge.org", "cam.ac.uk"] },
    { brand: "schwarzman", officialDomains: ["schwarzmanscholars.org", "tsinghua.edu.cn"] },
    { brand: "stipendium", officialDomains: ["stipendiumhungaricum.hu"] },
    { brand: "turkiyeburslari", officialDomains: ["turkiyeburslari.gov.tr"] },
    { brand: "scholarships-gov", officialDomains: ["scholarships.gov.in", "gov.in", "nic.in"] },
    { brand: "nsp-gov", officialDomains: ["scholarships.gov.in", "gov.in", "nic.in"] },
    { brand: "national scholarship portal", officialDomains: ["scholarships.gov.in", "gov.in", "nic.in"] },
    { brand: "tata trusts", officialDomains: ["tatatrusts.org"] },
    { brand: "tatatrusts", officialDomains: ["tatatrusts.org"] }
];

/**
 * Standard Levenshtein Distance implementation.
 */
export function calculateLevenshtein(a, b) {
    const matrix = [];
    const aLen = a.length;
    const bLen = b.length;
    for (let i = 0; i <= bLen; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= aLen; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= bLen; i++) {
        for (let j = 1; j <= aLen; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }
    return matrix[bLen][aLen];
}

/**
 * Fetches domain age via free public RDAP (Registration Data Access Protocol).
 * Returns registration age in days, or -1 if unregistered / 404, or null if offline.
 */
export async function fetchDomainAgeDays(domain) {
    const parts = domain.split(".");
    if (parts.length < 2) return null;
    const rootDomain = parts.slice(-2).join(".");
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(rootDomain)}`, {
            signal: controller.signal,
            headers: { Accept: "application/json" }
        });
        clearTimeout(timeout);
        if (res.status === 404) {
            return -1; // Indicator for NXDOMAIN / Unregistered domain
        }
        if (!res.ok) return null;
        const data = await res.json();
        const regEvent = data.events?.find((e) => e.eventAction === "registration");
        if (regEvent?.eventDate) {
            const regTime = new Date(regEvent.eventDate).getTime();
            const ageMs = Date.now() - regTime;
            return Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
        }
    } catch {
        // Fail gracefully if RDAP endpoint is unreachable
    }
    return null;
}

/**
 * Analyzes domain structure, TLD reputation, typosquatting, brand spoofing,
 * IDN/Unicode homoglyphs, and domain age.
 */
export async function analyzeDomain(options) {
    const flags = [];
    const evidence = [];
    let rawScore = 0;
    const rawDomain = (options.domain || "").toLowerCase().trim();

    // If no domain provided, return neutral score
    if (!rawDomain) {
        return {
            analyzerName: "Domain Analyzer",
            score: 10,
            maxContribution: 25,
            scoreContribution: 0,
            flags: [],
            evidence: ["No URL/domain was provided; domain safety analysis skipped."],
            details: { domainProvided: false }
        };
    }

    // Strip port if present
    const domain = rawDomain.split(":")[0];
    const normDomain = normalizeToken(domain);

    // 1. Check known bad / community blacklisted domains
    const knownBadList = options.knownBadDomains || [];
    const isBlacklisted = knownBadList.some((bad) => domain === bad || domain.endsWith("." + bad));
    if (isBlacklisted) {
        flags.push({
            id: "KNOWN_MALICIOUS_DOMAIN",
            ruleId: "KNOWN_MALICIOUS_DOMAIN",
            category: "DOMAIN",
            severity: "CRITICAL",
            status: "SUSPICIOUS",
            title: "Known Malicious Domain (Blacklisted)",
            description: `The domain "${domain}" has been flagged in verified scam registries or by multiple community reports.`,
            evidence: `Matches blacklist entry: ${domain}`,
            scoreContribution: 25,
        });
        evidence.push(`Domain "${domain}" is registered on the known scam blacklist.`);
        rawScore += 50;
    }

    // 2. Suffix check: institutional / government (.edu, .gov, .ac.uk, .gov.in, etc.)
    const isTrustedSuffix = TRUSTED_TLDS.some((suffix) => domain.endsWith(suffix)) ||
        /\.(?:gov|edu|ac)\.[a-z]{2,3}$|\.(?:gov|edu)$/i.test(domain);

    // Check Whitelist (Canonical ACCREDITED_ORGS and legitScholarships)
    const matchedAccreditedOrg = ACCREDITED_ORGS.find((org) => matchesOrgDomain(domain, org.domains));
    const matchedLegit = legitScholarships.find((legit) => domain === legit.officialDomain.toLowerCase() || domain.endsWith("." + legit.officialDomain.toLowerCase()));
    const isWhitelisted = !!matchedAccreditedOrg || !!matchedLegit;

    const verificationTimestamp = new Date().toISOString();

    if (isWhitelisted) {
        const orgName = matchedAccreditedOrg ? matchedAccreditedOrg.name : matchedLegit.name;
        evidence.push(`Domain "${domain}" is an exact match for an authoritative source record: ${orgName}.`);
        return {
            analyzerName: "Domain Analyzer",
            score: 0,
            maxContribution: 25,
            scoreContribution: 0,
            flags: [
                {
                    id: "OFFICIAL_DOMAIN_VERIFIED",
                    ruleId: "OFFICIAL_DOMAIN_VERIFIED",
                    category: "DOMAIN",
                    severity: "INFO",
                    status: "TRUST",
                    title: "Official Accredited Domain Verified",
                    description: `The domain "${domain}" matches an authoritative source record in the accredited scholarship registry (${orgName}).`,
                    evidence: `Source: Official Registry Record | Host: ${domain} | Verified At: ${verificationTimestamp}`,
                    scoreContribution: 0,
                    limitations: "Authoritative registry contains verified international and governmental scholarship sponsors.",
                },
                {
                    id: "VERIFIED_OFFICIAL_DOMAIN",
                    ruleId: "VERIFIED_OFFICIAL_DOMAIN",
                    category: "DOMAIN",
                    severity: "INFO",
                    status: "TRUST",
                    title: "Verified Official Domain",
                    description: `The domain "${domain}" matches an authoritative source record (${orgName}).`,
                    evidence: `Source: Official Registry Record | Host: ${domain} | Verified At: ${verificationTimestamp}`,
                    scoreContribution: 0,
                    limitations: "Authoritative registry record match.",
                },
            ],
            evidence,
            details: {
                isVerifiedOfficial: true,
                domain,
                isTrustedSuffix,
                source: "Official Accredited Scholarship Registry",
                verificationTimestamp,
            },
        };
    }

    // 3. Trusted Institutional Suffixes
    if (isTrustedSuffix) {
        flags.push({
            id: "GOVERNMENT_INSTITUTIONAL_TLD",
            ruleId: "GOVERNMENT_INSTITUTIONAL_TLD",
            category: "DOMAIN",
            severity: "INFO",
            status: "TRUST",
            title: "Government / Institutional Domain Infrastructure",
            description: `The domain "${domain}" is registered under an authenticated government or accredited university top-level domain.`,
            evidence: `Institutional TLD verified: "${domain}". Source: Restricted Public Registry (.gov / .edu). Verified At: ${verificationTimestamp}`,
            scoreContribution: 0,
            limitations: "Government TLD recognition validates restricted domain registry ownership.",
        });
        evidence.push(`Domain has a verified government or accredited university suffix (${domain}). Verified At: ${verificationTimestamp}.`);
    }

    // 4. Canonical Brand Spoofing Check (Rule A)
    for (const org of ACCREDITED_ORGS) {
        const hasBrandToken = org.brandTokens.some((t) => normDomain.includes(normalizeToken(t)));
        if (hasBrandToken) {
            const isMatch = matchesOrgDomain(domain, org.domains);
            if (!isMatch) {
                flags.push({
                    id: "BRAND_DOMAIN_IMPERSONATION",
                    ruleId: "BRAND_DOMAIN_IMPERSONATION",
                    category: "DOMAIN",
                    severity: "CRITICAL",
                    status: "SUSPICIOUS",
                    title: `Brand & Domain Impersonation (${org.name})`,
                    description: `The domain "${domain}" contains brand tokens associated with "${org.name}", but is not an authorized official domain (${org.domains.join(", ")}).`,
                    evidence: `Domain "${domain}" targets brand "${org.name}" on unauthorized domain. Rule: Brand Spoofing Check (+50 pts)`,
                    scoreContribution: 25,
                    limitations: "Authentic scholarship sponsors strictly operate on authorized root domains.",
                });
                flags.push({
                    id: "BRAND_HIJACKING",
                    ruleId: "BRAND_HIJACKING",
                    category: "DOMAIN",
                    severity: "HIGH",
                    status: "SUSPICIOUS",
                    title: `Brand Impersonation (${org.name})`,
                    description: `The domain "${domain}" contains brand tokens associated with "${org.name}", but is not an authorized official domain.`,
                    evidence: `Domain "${domain}" matches brand "${org.name}" on unofficial domain.`,
                    scoreContribution: 15,
                    limitations: "Comparison against accredited sponsor records.",
                });
                evidence.push(`CRITICAL: Brand impersonation targeting "${org.name}" on domain "${domain}".`);
                rawScore += 50;
                break;
            }
        }
    }

    // 5. Government Portal Spoofing Check (Rule B)
    const isGovSpoof =
        (/(?:scholarships?-gov|nsp-gov|gov-india|scholarship-gov)/i.test(domain) ||
        (domain.includes("gov") && (domain.includes("scholarship") || domain.includes("india")))) &&
        !domain.endsWith(".gov.in") &&
        !domain.endsWith(".nic.in") &&
        !domain.endsWith(".gov") &&
        !domain.endsWith(".ac.in") &&
        !domain.endsWith(".edu");

    if (isGovSpoof) {
        flags.push({
            id: "UNAUTHORIZED_GOV_COMMERCIAL_DOMAIN",
            ruleId: "UNAUTHORIZED_GOV_COMMERCIAL_DOMAIN",
            category: "DOMAIN",
            severity: "CRITICAL",
            status: "SUSPICIOUS",
            title: "Unauthorized Commercial Domain Mimicking Government Portal",
            description: `The domain "${domain}" mimics official government scholarship portal conventions (using "gov", "scholarships", or ministry keywords) but is hosted on a commercial or non-governmental domain.`,
            evidence: `Domain "${domain}" imitates government infrastructure on non-governmental domain. Rule: Government TLD Enforcement (+50 pts)`,
            scoreContribution: 25,
            limitations: "Official government scholarship schemes strictly require authorized .gov.in or .nic.in domain ownership.",
        });
        flags.push({
            id: "GOVERNMENT_PORTAL_SPOOFING",
            ruleId: "GOVERNMENT_PORTAL_SPOOFING",
            category: "DOMAIN",
            severity: "CRITICAL",
            status: "SUSPICIOUS",
            title: "Government Portal Domain Impersonation",
            description: `The domain "${domain}" mimics official government scholarship portal conventions on an unauthorized commercial domain.`,
            evidence: `Domain "${domain}" mimics government infrastructure on commercial TLD.`,
            scoreContribution: 25,
            limitations: "Government scholarship portals require restricted .gov.in or .nic.in infrastructure.",
        });
        evidence.push(`CRITICAL: Government portal spoofing detected on non-governmental domain "${domain}".`);
        rawScore += 50;
    }

    // 6. Brand Hijacking against PROTECTED_BRANDS list
    for (const { brand, officialDomains } of PROTECTED_BRANDS) {
        const normalizedBrand = normalizeToken(brand);
        if (domain.includes(brand) || normDomain.includes(normalizedBrand)) {
            const isOfficial = officialDomains.some((od) => domain === od || domain.endsWith("." + od));
            if (!isOfficial && !flags.some((f) => f.id === "BRAND_DOMAIN_IMPERSONATION")) {
                flags.push({
                    id: "BRAND_HIJACKING",
                    ruleId: "BRAND_HIJACKING",
                    category: "DOMAIN",
                    severity: "HIGH",
                    status: "SUSPICIOUS",
                    title: `Brand Impersonation (${brand.toUpperCase()})`,
                    description: `The domain "${domain}" contains the name of the registered scholarship brand "${brand}" but does not match known official domains (${officialDomains.join(", ")}).`,
                    evidence: `Domain "${domain}" matches brand "${brand}" but is not an official domain (${officialDomains.join(", ")}).`,
                    scoreContribution: 15,
                    limitations: "Comparison against local registry of known brands.",
                });
                evidence.push(`Brand "${brand}" found on unofficial domain "${domain}".`);
                rawScore += 15;
                break;
            }
        }
    }

    // 7. Typosquatting / Levenshtein Distance against official domains
    for (const legit of legitScholarships) {
        const official = legit.officialDomain.toLowerCase();
        const dist = calculateLevenshtein(domain, official);
        if (dist > 0 && dist <= 2 && domain !== official) {
            flags.push({
                id: "TYPOSQUATTING_LOOKALIKE",
                ruleId: "TYPOSQUATTING_LOOKALIKE",
                category: "DOMAIN",
                severity: "HIGH",
                status: "SUSPICIOUS",
                title: "Typosquatting Look-alike Detected",
                description: `The domain "${domain}" is nearly identical to official domain "${official}" (edit distance: ${dist}), a classic indicator of phishing.`,
                evidence: `Close match to legitimate domain "${official}" (distance: ${dist}).`,
                scoreContribution: 12,
                limitations: "Low edit distance does not conclusively prove malicious intent.",
            });
            evidence.push(`Look-alike domain mimicking "${official}".`);
            rawScore += 12;
            break;
        }
    }

    // 8. Suspicious TLD Check (.xyz, .top, .click, etc.)
    const domainParts = domain.split(".");
    const tld = domainParts[domainParts.length - 1];
    if (SUSPICIOUS_TLDS.has(tld)) {
        flags.push({
            id: "SUSPICIOUS_TLD",
            ruleId: "SUSPICIOUS_TLD",
            category: "DOMAIN",
            severity: "MEDIUM",
            status: "SUSPICIOUS",
            title: `High-Risk TLD (.${tld})`,
            description: `The domain extension ".${tld}" is frequently associated with low-cost disposable domains.`,
            evidence: `Domain extension: .${tld}`,
            scoreContribution: 8,
        });
        evidence.push(`Flagged high-risk TLD: .${tld}`);
        rawScore += 8;
    }

    // 9. Structural Heuristics: excessive hyphens and subdomains
    const hyphenCount = (domain.match(/-/g) || []).length;
    if (hyphenCount >= 3) {
        flags.push({
            id: "EXCESSIVE_HYPHENS",
            ruleId: "EXCESSIVE_HYPHENS",
            category: "DOMAIN",
            severity: "INFO",
            status: "INCONCLUSIVE",
            title: "Excessive Domain Hyphenation",
            description: `Domain contains ${hyphenCount} hyphens.`,
            evidence: `${hyphenCount} hyphens found in "${domain}".`,
            scoreContribution: 2,
            limitations: "Hyphens in domains are common and do not independently indicate fraud.",
        });
        rawScore += 2;
    }
    if (domainParts.length >= 4) {
        flags.push({
            id: "DEEP_SUBDOMAINS",
            ruleId: "DEEP_SUBDOMAINS",
            category: "DOMAIN",
            severity: "LOW",
            status: "INCONCLUSIVE",
            title: "Multiple Subdomain Layers",
            description: `Domain contains ${domainParts.length} levels, often used to bypass reputation filters.`,
            evidence: `Subdomain count: ${domainParts.length}`,
            scoreContribution: 3,
        });
        rawScore += 3;
    }

    // 10. IDN / Unicode Homoglyph Check
    if (/[^\x00-\x7F]/.test(domain)) {
        flags.push({
            id: "IDN_UNICODE_DOMAIN",
            ruleId: "IDN_UNICODE_DOMAIN",
            category: "DOMAIN",
            severity: "MEDIUM",
            status: "SUSPICIOUS",
            title: "Internationalized Domain Name (IDN)",
            description: `Domain contains internationalized characters that may be used for visual spoofing.`,
            evidence: `Non-ASCII characters detected in "${domain}".`,
            scoreContribution: 5,
        });
        rawScore += 5;
    }

    // 11. Protocol Check
    const sslStatus = options.protocol === "http:" ? "UNAVAILABLE" : (options.protocol === "https:" ? "AVAILABLE" : "NOT_CHECKED");
    if (options.protocol === "http:") {
        flags.push({
            id: "UNENCRYPTED_HTTP",
            ruleId: "UNENCRYPTED_HTTP",
            category: "DOMAIN",
            severity: "INFO",
            status: "INCONCLUSIVE",
            title: "Insecure Connection (HTTP)",
            description: "HTTPS is unavailable for this URL. HTTPS status does not determine scholarship legitimacy.",
            evidence: "Protocol: http://",
            scoreContribution: 0,
            limitations: "ScholarShield does not inspect TLS certificates. HTTPS availability is informational only.",
        });
        evidence.push("Website does not enforce HTTPS encryption.");
    }

    // 12. DNS Resolution & Domain Age via RDAP
    let domainAge = options.domainAgeDays !== undefined ? options.domainAgeDays : await fetchDomainAgeDays(domain);

    const isReservedDocDomain = domain.endsWith(".example.com") || domain.endsWith(".example") || domain.endsWith(".test") || domain.endsWith(".invalid");

    let isDnsDead = false;
    if (options.domainAgeDays === undefined && !isReservedDocDomain && !isWhitelisted && !isTrustedSuffix) {
        try {
            await dns.promises.lookup(domain);
        } catch (dnsErr) {
            if (dnsErr && (dnsErr.code === "ENOTFOUND" || dnsErr.code === "NXDOMAIN")) {
                isDnsDead = true;
            }
        }
    }

    if (domainAge !== null && domainAge >= 0) {
        if (domainAge < 90) {
            flags.push({
                id: "NEWLY_REGISTERED_DOMAIN",
                ruleId: "NEWLY_REGISTERED_DOMAIN",
                category: "DOMAIN",
                severity: "HIGH",
                status: "SUSPICIOUS",
                title: "Recently Registered Domain (< 90 Days)",
                description: `This domain was registered only ${domainAge} days ago. Scholarship scam sites are routinely created days before an application drive and abandoned.`,
                evidence: `Domain age: ${domainAge} days.`,
                scoreContribution: 10,
            });
            evidence.push(`Domain is freshly created (${domainAge} days old).`);
            rawScore += 10;
        } else if (domainAge < 180) {
            flags.push({
                id: "YOUNG_DOMAIN",
                ruleId: "YOUNG_DOMAIN",
                category: "DOMAIN",
                severity: "MEDIUM",
                status: "SUSPICIOUS",
                title: "Relatively Young Domain (< 6 Months)",
                description: `Domain was created ${domainAge} days ago. Established international scholarships typically operate on domains registered for years.`,
                evidence: `Domain age: ${domainAge} days.`,
                scoreContribution: 5,
            });
            rawScore += 5;
        }
    } else if ((domainAge === -1 || isDnsDead) && !isWhitelisted && !isTrustedSuffix) {
        flags.push({
            id: "UNREGISTERED_ANOMALOUS_DOMAIN",
            ruleId: "UNREGISTERED_ANOMALOUS_DOMAIN",
            category: "DOMAIN",
            severity: "HIGH",
            status: "SUSPICIOUS",
            title: "Unregistered / Non-Existent Domain",
            description: `The domain "${domain}" could not be resolved via DNS or returned an unregistered status in public registries. Phishing campaigns frequently circulate links with disposable, typo, or non-existent domain names.`,
            evidence: `Domain "${domain}" failed DNS resolution or returned NXDOMAIN / unregistered in registry check.`,
            scoreContribution: 25,
            limitations: "Non-resolvable or unregistered domains represent high anomalous risk.",
        });
        evidence.push(`Domain "${domain}" is unresolvable or unregistered.`);
        rawScore += 25;
    } else if (!isWhitelisted) {
        flags.push({
            id: "DOMAIN_AGE_UNAVAILABLE",
            ruleId: "DOMAIN_AGE_UNAVAILABLE",
            category: "DOMAIN",
            severity: "INFO",
            status: "INCONCLUSIVE",
            title: "Domain Age Unavailable",
            description: `Domain age information could not be verified. Registration data was not available from RDAP.`,
            evidence: `RDAP lookup returned no registration date for "${domain}".`,
            scoreContribution: 0,
            limitations: "Domain age is retrieved via public RDAP. Unavailability does not indicate fraud.",
        });
    }

    return {
        analyzerName: "Domain Analyzer",
        score: Math.min(100, rawScore),
        maxContribution: 25,
        scoreContribution: Math.min(25, rawScore),
        flags,
        evidence,
        details: {
            domain,
            tld,
            hyphenCount,
            isBlacklisted,
            isTrustedSuffix,
            domainAgeDays: domainAge,
            sslStatus,
        }
    };
}
