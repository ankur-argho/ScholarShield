/**
 * Intent-based Payment & Fee Demand Analyzer.
 * Identifies advance-fee schemes, overpayment traps, tax deposits, cryptocurrency,
 * and wire services while excluding legitimate exonerations ("no application fee").
 */
const PAYMENT_PATTERNS = [
    // 1. Overpayment / Refund Trap (CRITICAL, +40 pts)
    {
        id: "OVERPAYMENT_REFUND_TRAP",
        regex: /(?:accidentally\s+issued|excess\s+funds|refund\s+the\s+excess|wire\s+back|transfer\s+the\s+difference)/i,
        title: "Overpayment / Refund Scam Trap",
        severity: "CRITICAL",
        status: "SUSPICIOUS",
        description: "Detected language associated with overpayment scams (claiming funds were accidentally disbursed and demanding a wire return).",
        scoreContribution: 25,
        rawPoints: 40,
        limitations: "Legitimate scholarships never ask recipients to return 'excess' funds via wire or transfer.",
    },
    // 2. Advance-Fee & Tax/Clearance Traps (CRITICAL, +35 pts)
    {
        id: "ADVANCE_FEE_OR_TAX_DEMAND",
        regex: /(?:pay|wire|transfer|send|deposit|remit).{0,40}(?:fee|deposit|gst|tax|clearance|charge|excess|difference|auditor|voucher|wallet|crypto|usdt|gift\s*card|upi\s*qr)/i,
        title: "Advance-Fee, Tax or Clearance Deposit Demand",
        severity: "CRITICAL",
        status: "SUSPICIOUS",
        description: "Demanding monetary transfers, tax clearance deposits, or upfront fee deposits is a classic advance-fee fraud vector.",
        scoreContribution: 25,
        rawPoints: 35,
        limitations: "Authentic scholarship sponsors disburse funds without requiring applicants to pay advance taxes or clearance fees.",
    },
    // 3. Application / Processing Fees (HIGH, +10 pts)
    {
        id: "APPLICATION_OR_PROCESSING_FEE",
        regex: /\b(application\s*fee|processing\s*(?:fee|charge|cost)|registration\s*(?:fee|charge)|dossier\s*fee|evaluation\s*fee|handling\s*(?:fee|charge)|clearance\s*charge)\b/i,
        title: "Suspicious Upfront Payment Demand",
        severity: "HIGH",
        status: "SUSPICIOUS",
        description: "The submitted scholarship information mentions a fee required to secure or evaluate an application.",
        scoreContribution: 10,
        rawPoints: 10,
        limitations: "Some competitive exam bodies charge nominal fees, but general scholarship grants should be free.",
    },
    // 4. Specific Monetary Amount Demand (HIGH, +12 pts)
    {
        id: "SPECIFIC_FEE_AMOUNT",
        regex: /\b(?:pay|send|wire|deposit|submit|transfer)\s*(?:an?\s*(?:application\s*|processing\s*|small\s*)?fee\s*of\s*)?[$€£₹]\s*\d+(?:\.\d{2})?\b/i,
        title: "Explicit Monetary Payment Demand",
        severity: "HIGH",
        status: "SUSPICIOUS",
        description: "Detected an explicit monetary amount tied to a payment or wire instruction.",
        scoreContribution: 12,
        rawPoints: 12,
        limitations: "Explicit fees requested in scholarship text warrant careful independent verification.",
    },
    // 5. Refundable Deposit Trope (HIGH, +12 pts)
    {
        id: "REFUNDABLE_DEPOSIT",
        regex: /\b(refundable\s*(?:deposit|security|bond|guarantee)|security\s*deposit|refundable\s*caution)\b/i,
        title: "'Refundable Deposit' Scam Pattern",
        severity: "HIGH",
        status: "SUSPICIOUS",
        description: "Demanding a 'refundable deposit' before disbursal is a frequent loan/scholarship scam pattern.",
        scoreContribution: 12,
        rawPoints: 12,
        limitations: "Legitimate scholarships do not collect caution or security deposits.",
    },
    // 6. Cryptocurrency Demands (CRITICAL, +25 pts)
    {
        id: "CRYPTO_PAYMENT",
        regex: /\b(bitcoin|btc|usdt|tether|ethereum|crypto(?:currency)?|wallet\s*address|0x[a-fA-F0-9]{30,}|trc20|erc20)\b/i,
        title: "Cryptocurrency / Blockchain Payment",
        severity: "CRITICAL",
        status: "SUSPICIOUS",
        description: "Cryptocurrency payment requests are strongly associated with irreversible fraud.",
        scoreContribution: 15,
        rawPoints: 25,
        limitations: "No legitimate educational institution accepts scholarship application fees in crypto.",
    },
    // 6.5. Gift Card Demands (CRITICAL, +25 pts)
    {
        id: "GIFT_CARD_PAYMENT",
        regex: /\b(gift\s*card|amazon\s*(?:card|code)|apple\s*(?:gift|card)|itunes\s*card|google\s*play\s*card|steam\s*(?:card|wallet)|razer\s*gold)\b/i,
        title: "Gift Card Payment Request",
        severity: "CRITICAL",
        status: "SUSPICIOUS",
        description: "Gift card payment requests are a well-documented consumer fraud pattern.",
        scoreContribution: 15,
        rawPoints: 25,
        limitations: "Gift card payment demands have zero legitimate recovery mechanism.",
    },
    // 7. Untraceable Cash Wire Services (HIGH, +15 pts)
    {
        id: "UNTRACEABLE_WIRE_SERVICES",
        regex: /\b(western\s*union|moneygram|ria\s*money|money\s*transfer\s*service)\b/i,
        title: "Untraceable Cash Transfer Demand (Western Union / MoneyGram)",
        severity: "HIGH",
        status: "SUSPICIOUS",
        description: "Demanding cash transfers through Western Union or MoneyGram provides no transaction traceability.",
        scoreContribution: 12,
        rawPoints: 15,
        limitations: "Cash wire services are commonly used in impersonation scams.",
    },
    // 8. Chat-Based Financial Instructions (MEDIUM, +8 pts)
    {
        id: "CHAT_APP_PAYMENT_CHANNEL",
        regex: /\b(?:contact|send|message|reach|pay|wire|text)\b[^\n\r.!?]{0,50}\b(?:whatsapp|telegram|wechat)\b|\b(?:whatsapp|telegram)\s*(?:payment|fee|charge|channel|group|coordinator|support|agent|director|admin)\b/i,
        title: "Off-Platform Communication (WhatsApp / Telegram)",
        severity: "MEDIUM",
        status: "SUSPICIOUS",
        description: "Directing applicants to chat apps for payment instructions bypasses institutional record-keeping.",
        scoreContribution: 8,
        rawPoints: 8,
        limitations: "Some regional programs communicate via messaging apps, but financial demands over chat are high risk.",
    },
];

/**
 * Checks if a matched keyword is preceded within 25 characters by a negative/exonerating word.
 */
function isNegated(content, matchIndex) {
    const prefix = content.slice(Math.max(0, matchIndex - 25), matchIndex).toLowerCase();
    return /\b(no|never|without|zero|free\s+of|not|neither)\b/.test(prefix);
}

/**
 * Analyzes text for advance-fee requests, tax clearance traps, and payment channels.
 */
export function analyzePaymentDemands(text) {
    const flags = [];
    const evidence = [];
    let rawScore = 0;
    const content = text || "";

    for (const pattern of PAYMENT_PATTERNS) {
        const match = content.match(pattern.regex);
        if (match) {
            const matchIndex = match.index ?? 0;
            // Exclude legitimate negative statements (e.g., "no application fee", "never asks for fees")
            if (isNegated(content, matchIndex)) {
                continue;
            }

            const matchedSnippet = match[0];
            const start = Math.max(0, matchIndex - 30);
            const end = Math.min(content.length, matchIndex + matchedSnippet.length + 30);
            const snippetContext = "..." + content.slice(start, end).trim() + "...";

            flags.push({
                id: pattern.id,
                ruleId: pattern.id,
                category: "PAYMENT",
                severity: pattern.severity,
                status: pattern.status,
                title: pattern.title,
                description: pattern.description,
                evidence: `Matched: "${matchedSnippet}" in "${snippetContext}"`,
                scoreContribution: pattern.scoreContribution,
                limitations: pattern.limitations,
            });
            evidence.push(`Found payment indicator: "${matchedSnippet}"`);
            rawScore += pattern.rawPoints;
        }
    }

    // Explicit positive signal check: "no application fee", "completely free", "zero processing fee"
    const freeSignals = /\b(no\s*(?:application|processing|registration)?\s*fees?|zero\s*processing\s*fees?|completely\s*free|free\s*of\s*charge|never\s*asks?\s*for\s*(?:money|payment|fees?))\b/i;
    if (freeSignals.test(content) && rawScore === 0) {
        evidence.push("Text explicitly confirms that applications are free with zero fees.");
    }

    return {
        analyzerName: "Payment Demand Analyzer",
        score: Math.min(100, rawScore),
        maxContribution: 25,
        scoreContribution: Math.min(25, rawScore),
        flags,
        evidence,
        feeDetected: flags.some((f) => f.status === "SUSPICIOUS"),
        details: {
            flagsTriggered: flags.length,
            hasCriticalPaymentFlag: flags.some((f) => f.severity === "CRITICAL"),
        },
    };
}
