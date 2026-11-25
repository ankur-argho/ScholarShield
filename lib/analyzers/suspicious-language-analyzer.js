/** Maximum points this analyzer can contribute to the final risk score. */
const MAX_CONTRIBUTION = 35;

/**
 * Checks if a matched keyword is preceded within 25 characters by a negative/exonerating word.
 */
function isNegated(content, matchIndex) {
    const prefix = content.slice(Math.max(0, matchIndex - 25), matchIndex).toLowerCase();
    return /\b(no|never|without|zero|free\s+of|not|neither|never\s+asks?\s+for)\b/.test(prefix);
}

const LANGUAGE_PATTERNS = [
    // 1. Banking Credentials / PIN / OTP Demands (CRITICAL, +35 pts)
    {
        id: "SENSITIVE_FINANCIAL_CREDENTIALS",
        ruleId: "SENSITIVE_FINANCIAL_CREDENTIALS",
        regex: /(?:share|send|provide|enter|verify).{0,35}(?:otp|atm\s*pin|bank\s*pin|cvv|netbanking\s*password|security\s*code)|\b(?:debit\s*card\s*pin|atm\s*pin|card\s*security\s*code|cvv|one[\s-]?time[\s-]?password|otp|banking\s*login|account\s*password)\b/i,
        title: "Financial Credentials or Security PIN Demanded",
        severity: "CRITICAL",
        status: "SUSPICIOUS",
        description: "Detected requests for banking credentials, PINs, OTPs, or card security codes. Legitimate educational portals never solicit financial credentials.",
        penalty: 35,
        limitations: "Solicitation of banking PINs, OTPs, or passwords is an immediate critical fraud indicator.",
    },
    // 2. Pre-admission Government ID / Bank Account Harvesting (HIGH, +20 pts)
    {
        id: "SENSITIVE_GOVERNMENT_ID",
        ruleId: "SENSITIVE_GOVERNMENT_ID",
        regex: /(?:send|share|attach|upload).{0,35}(?:aadhaar|aadhar|ssn|passport\s*copy|bank\s*passbook|account\s*number)|\b(?:social\s*security\s*number|ssn|aadhaar\s*(?:card|number)?|passport\s*(?:scan|copy|number)|national\s*id\s*(?:scan|number))\b/i,
        title: "High-Risk Identity Document Solicitation",
        severity: "HIGH",
        status: "SUSPICIOUS",
        description: "Requests for government identity numbers or bank passbook copies before formal admission may indicate identity theft risk.",
        penalty: 20,
        limitations: "Some verified official portals require identity documents, but early solicitation on unverified pages is a risk factor.",
    },
    // 3. Artificial Urgency & Lottery Hooks (HIGH, +15 pts)
    {
        id: "ARTIFICIAL_URGENCY",
        ruleId: "ARTIFICIAL_URGENCY",
        regex: /(?:within\s+\d+\s+(?:hour|minute)s?|before\s+midnight|only\s+\d+\s+seats?\s+left|randomly\s+selected|lucky\s+winner|no\s+prior\s+application\s+required)|\b(?:apply\s*within\s*\d+\s*hours?|act\s*(?:now|fast)|immediate\s*(?:action|response)\s*required)\b/i,
        title: "Artificial Urgency & Unsolicited Selection Hook",
        severity: "HIGH",
        status: "SUSPICIOUS",
        description: "High-pressure countdowns and claims of winning without applying are classic social engineering tactics.",
        penalty: 15,
        limitations: "Some authentic programs have short application windows.",
    },
    // 4. Unrealistic Guarantees (HIGH, +10 pts)
    {
        id: "UNREALISTIC_GUARANTEE",
        ruleId: "UNREALISTIC_GUARANTEE",
        regex: /\b(100%\s*guaranteed|guaranteed\s*(?:scholarship|approval|admission|visa|selection)|everyone\s*(?:wins|gets\s*selected|qualifies)|no\s*(?:one|student)\s*turned\s*down)\b/i,
        title: "Unrealistic 100% Approval Guarantee",
        severity: "HIGH",
        status: "SUSPICIOUS",
        description: "Claims of guaranteed approval are uncommon in legitimate competitive scholarship programs.",
        penalty: 10,
        limitations: "Legitimate scholarships assess academic or need-based criteria.",
    },
    // 4.5. No Academic Criteria Lure (MEDIUM, +4 pts)
    {
        id: "NO_ACADEMIC_CRITERIA",
        ruleId: "NO_ACADEMIC_CRITERIA",
        regex: /\b(no\s*gpa\s*(?:requirement|needed|cutoff)|no\s*essay\s*(?:required|needed)|no\s*references\s*needed|no\s*academic\s*requirements?)\b/i,
        title: "'No Criteria Required' Lure",
        severity: "MEDIUM",
        status: "SUSPICIOUS",
        description: "Claims that no academic records or criteria are required may be used to attract a wide applicant pool.",
        penalty: 4,
        limitations: "Some legitimate access programs have minimal academic requirements.",
    },
    // 5. Unclaimed Funds Trope (HIGH, +10 pts)
    {
        id: "UNCLAIMED_FUNDS_TROPE",
        ruleId: "UNCLAIMED_FUNDS_TROPE",
        regex: /\b(unclaimed\s*(?:scholarships?|funds?|benefits?|money)|billions\s*in\s*unclaimed|pre[\s-]?selected\s*for\s*(?:a\s*)?grant)\b/i,
        title: "'Unclaimed Funds / Pre-Selected' Trope",
        severity: "HIGH",
        status: "SUSPICIOUS",
        description: "Claims of 'unclaimed funds' or 'pre-selection' are patterns frequently observed in grant fraud.",
        penalty: 10,
        limitations: "Keyword matching for grant fraud tropes.",
    },
];

/**
 * Analyzes text for manipulative urgency, bogus guarantees, sensitive credential theft,
 * and aggressive styling patterns.
 */
export function analyzeSuspiciousLanguage(text) {
    const flags = [];
    const evidence = [];
    let score = 0;
    const content = text || "";

    // 1. Check linguistic patterns with negation guard
    for (const pattern of LANGUAGE_PATTERNS) {
        const match = content.match(pattern.regex);
        if (match) {
            const matchIndex = match.index ?? 0;
            if (isNegated(content, matchIndex)) {
                continue;
            }

            const matched = match[0];
            flags.push({
                id: pattern.id,
                ruleId: pattern.ruleId,
                category: "LANGUAGE",
                severity: pattern.severity,
                status: pattern.status,
                title: pattern.title,
                description: pattern.description,
                evidence: `Detected language: "${matched}"`,
                scoreContribution: pattern.penalty,
                limitations: pattern.limitations,
            });
            evidence.push(`Found suspicious language marker: "${matched}"`);
            score += pattern.penalty;
        }
    }

    // 2. Excessive Exclamation Marks
    const exclamationMatches = content.match(/!{2,}/g) || [];
    const totalExclamations = (content.match(/!/g) || []).length;
    if (exclamationMatches.length >= 2 || totalExclamations >= 5) {
        flags.push({
            id: "EXCESSIVE_EXCLAMATIONS",
            ruleId: "EXCESSIVE_EXCLAMATIONS",
            category: "LANGUAGE",
            severity: "LOW",
            status: "INCONCLUSIVE",
            title: "Sensational Punctuation (Excessive Exclamations)",
            description: "Uses frequent exclamation marks ('!!!') to manufacture excitement, uncommon in official academic correspondence.",
            evidence: `Found ${totalExclamations} exclamation marks.`,
            scoreContribution: 2,
            limitations: "Punctuation style varies across cultures and communication styles.",
        });
        score += 2;
    }

    // 3. Excessive Capitalization / Shouty Text
    const words = content.split(/\s+/).filter((w) => w.length >= 4);
    const upperWords = words.filter((w) => /^[A-Z]{4,}$/.test(w) && !/^(MEXT|DAAD|EMJMD|SINGA|FCDO|VLIR|EPOS|TAFE|OSHC|AICTE|UGC)$/.test(w));
    const shoutyRatio = words.length > 0 ? upperWords.length / words.length : 0;
    if (upperWords.length >= 4 && shoutyRatio > 0.08) {
        flags.push({
            id: "SHOUTY_CAPS_TEXT",
            ruleId: "SHOUTY_CAPS_TEXT",
            category: "LANGUAGE",
            severity: "LOW",
            status: "INCONCLUSIVE",
            title: "Aggressive All-Caps Text Formatting",
            description: `Contains prominent uppercase shout words (${upperWords.slice(0, 4).join(", ")}) used in clickbait advertising.`,
            evidence: `Uppercase words: ${upperWords.slice(0, 5).join(", ")}`,
            scoreContribution: 2,
            limitations: "Capitalization patterns vary and do not independently indicate fraud.",
        });
        score += 2;
    }

    const finalScore = Math.min(MAX_CONTRIBUTION, Math.max(0, score));
    return {
        analyzerName: "Suspicious Language Analyzer",
        score: finalScore,
        maxContribution: MAX_CONTRIBUTION,
        scoreContribution: finalScore,
        flags,
        evidence,
        details: {
            flagsFound: flags.length,
            shoutyWordCount: upperWords.length,
            totalExclamations,
        },
    };
}
