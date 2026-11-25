import { classifyRiskLevel, REPORT_DISCLAIMER } from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Severity ordering for sorting flags (highest first). */
const SEVERITY_ORDER = {
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    INFO: 1,
};

/**
 * Maximum score contribution per analyzer.
 * These define the strict upper bound each analyzer can add to the final 0-100 score.
 *
 * domain:   25 points — domain reputation, age, SSL, brand impersonation
 * payment:  25 points — fee demands, payment method red flags, overpayment
 * fakeOrg:  15 points — canonical org verification, official domain cross-check
 * content:  15 points — plagiarism, template matching
 * language: 35 points — urgency, pressure tactics, credential harvesting
 */
export const MAX_CONTRIBUTIONS = {
    domain: 25,
    payment: 25,
    fakeOrg: 15,
    content: 15,
    language: 35,
};

// ─── Evidence Coverage ───────────────────────────────────────────────────────

/**
 * Determines how much evidence was available for the analysis by checking
 * a set of data-availability signals.
 */
function computeEvidenceCoverage(options) {
    const { domainResult, paymentResult, fakeOrgResult, contentResult, languageResult, metadata } = options;
    const checks = [
        domainResult.evidence.length > 0 || domainResult.flags.length > 0,
        paymentResult.evidence.length > 0 || paymentResult.flags.length > 0,
        fakeOrgResult.evidence.length > 0 || fakeOrgResult.flags.length > 0,
        contentResult.evidence.length > 0 || contentResult.flags.length > 0,
        languageResult.evidence.length > 0 || languageResult.flags.length > 0,
        metadata?.sslStatus !== undefined && metadata.sslStatus !== "NOT_CHECKED",
        metadata?.domainAgeDays !== undefined && metadata.domainAgeDays !== null,
        (metadata?.contactEmails ?? []).length > 0,
    ];
    const totalChecks = checks.length;
    const completedChecks = checks.filter(Boolean).length;
    const ratio = completedChecks / totalChecks;
    if (ratio >= 0.75) return "SUBSTANTIAL";
    if (ratio >= 0.40) return "PARTIAL";
    return "LIMITED";
}

// ─── Summary Generation ──────────────────────────────────────────────────────

/**
 * Generates an evidence-based executive summary.
 * Language dynamically reflects the count of suspicious indicators.
 */
function generateSummary(riskLevel, suspiciousCount) {
    if (suspiciousCount > 0) {
        return (
            `This scholarship listing shows ${suspiciousCount} suspicious indicator${suspiciousCount !== 1 ? "s" : ""} based on the inspected evidence. ` +
            "Review the diagnostic findings below and independently verify with official educational institutions before proceeding."
        );
    }
    return (
        "No significant suspicious indicators were detected based on the available evidence. " +
        "Standard verification is still recommended."
    );
}

// ─── Top Reasons ─────────────────────────────────────────────────────────────

/**
 * Selects the top 3 most important reasons for the risk score,
 * sorted by severity descending.
 */
function selectTopReasons(allFlags) {
    const sortedFlags = [...allFlags]
        .filter((f) => f.severity !== "INFO")
        .sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
    if (sortedFlags.length > 0) {
        return sortedFlags.slice(0, 3).map((f) => `${f.title}: ${f.description}`);
    }
    return [
        "No deceptive domain patterns or lookalike attributes detected.",
        "Zero upfront fees, processing charges, or monetary transfer requests detected.",
        "No high-pressure deadlines or invasive identity theft solicitations found.",
    ];
}

// ─── Main Aggregation ────────────────────────────────────────────────────────

/**
 * Combines modular analyzer results into a unified RiskAnalysisResult.
 * Applies deterministic floor and ceiling rules.
 */
export function aggregateRisk(options) {
    const { domainResult, paymentResult, fakeOrgResult, contentResult, languageResult, metadata } = options;

    // ── 1. Collect & categorize all flags first ────────────────────────────────
    const allFlags = [
        ...domainResult.flags,
        ...paymentResult.flags,
        ...fakeOrgResult.flags,
        ...contentResult.flags,
        ...languageResult.flags,
    ];
    const findings = allFlags.filter((f) => f.status === "SUSPICIOUS");
    const trustIndicators = allFlags.filter((f) => f.status === "TRUST");
    const inconclusiveChecks = allFlags.filter((f) => f.status === "INCONCLUSIVE");

    // ── 2. Clamp each subscore strictly to category max cap ───────────────────
    const domainScore = Math.min(MAX_CONTRIBUTIONS.domain, Math.max(0, domainResult.scoreContribution));
    const paymentScore = Math.min(MAX_CONTRIBUTIONS.payment, Math.max(0, paymentResult.scoreContribution));
    const fakeOrgScore = Math.min(MAX_CONTRIBUTIONS.fakeOrg, Math.max(0, fakeOrgResult.scoreContribution));
    const contentScore = Math.min(MAX_CONTRIBUTIONS.content, Math.max(0, contentResult.scoreContribution));
    const languageScore = Math.min(MAX_CONTRIBUTIONS.language, Math.max(0, languageResult.scoreContribution));

    // Update analyzer results with clamped values to avoid UI display anomalies (e.g. 35/10)
    domainResult.scoreContribution = domainScore;
    paymentResult.scoreContribution = paymentScore;
    fakeOrgResult.scoreContribution = fakeOrgScore;
    contentResult.scoreContribution = contentScore;
    languageResult.scoreContribution = languageScore;

    // ── 3. Base raw score calculation ─────────────────────────────────────────
    let rawScore = domainScore + paymentScore + fakeOrgScore + contentScore + languageScore;

    // ── 4. Deterministic Overrides & Floor/Ceiling Rules ──────────────────────
    const isOfficialDomainVerified = allFlags.some(
        (f) => (f.id === "OFFICIAL_DOMAIN_VERIFIED" || f.id === "VERIFIED_OFFICIAL_DOMAIN") && f.status === "TRUST"
    ) || (domainResult.details?.isVerifiedOfficial && findings.length === 0);

    // Rule A: If official accredited domain verified AND zero suspicious indicators -> force score = 0 (LOWER_RISK)
    if (isOfficialDomainVerified && findings.length === 0) {
        rawScore = 0;
    } else {
        // Rule B: If ANY CRITICAL indicator is triggered (Brand/Gov Spoofing, Advance-Fee/Overpayment, or PIN/OTP Harvesting)
        // -> enforce a minimum score floor of 80 (CRITICAL_RISK)
        const hasCriticalIndicator = findings.some((f) => f.severity === "CRITICAL");
        if (hasCriticalIndicator) {
            rawScore = Math.max(rawScore, 80);
        } else {
            // Rule C: If 2 or more HIGH indicators are triggered -> enforce a minimum score floor of 65 (HIGH_RISK)
            const highCount = findings.filter((f) => f.severity === "HIGH").length;
            if (highCount >= 2) {
                rawScore = Math.max(rawScore, 65);
            }
        }
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));
    const riskLevel = classifyRiskLevel(finalScore);

    // ── 5. Determine evidence coverage & analysis mode ────────────────────────
    const evidenceCoverage = computeEvidenceCoverage(options);
    const hasUrl = metadata?.hasUrl ?? !!metadata?.url;
    const hasText = (metadata?.textLength ?? 0) > 0;
    let analysisMode;
    if (metadata?.analysisMode) {
        analysisMode = metadata.analysisMode;
    } else if (hasUrl && hasText) {
        analysisMode = "URL_AND_TEXT";
    } else if (hasUrl) {
        analysisMode = "URL_ONLY";
    } else {
        analysisMode = "TEXT_ONLY";
    }

    // ── 6. Generate summary & top reasons ─────────────────────────────────────
    const summary = generateSummary(riskLevel, findings.length);
    const topReasons = selectTopReasons(allFlags);

    // ── 7. Resolve SSL status ─────────────────────────────────────────────────
    let sslStatus = metadata?.sslStatus;
    if (sslStatus === undefined && metadata?.sslValid !== undefined) {
        sslStatus = metadata.sslValid ? "AVAILABLE" : "UNAVAILABLE";
    }

    // ── 8. Build final result ─────────────────────────────────────────────────
    return {
        riskScore: finalScore,
        riskLevel,
        evidenceCoverage,
        analysisMode,
        summary,
        disclaimer: REPORT_DISCLAIMER,
        topReasons,
        analyzerResults: {
            domain: domainResult,
            payment: paymentResult,
            fakeOrg: fakeOrgResult,
            content: contentResult,
            language: languageResult,
        },
        findings,
        trustIndicators,
        inconclusiveChecks,
        allFlags,
        metadata: {
            domain: metadata?.domain,
            url: metadata?.url,
            title: metadata?.title,
            sslStatus,
            domainAgeDays: metadata?.domainAgeDays ?? null,
            domainAgeSource: metadata?.domainAgeSource,
            contactEmails: metadata?.contactEmails ?? [],
            orgVerification: metadata?.orgVerification,
            orgVerificationSource: metadata?.orgVerificationSource,
            analyzedAt: new Date().toISOString(),
            textLength: metadata?.textLength ?? 0,
            hasUrl,
        },
        verdict: riskLevel,
        confidence: evidenceCoverage,
    };
}
