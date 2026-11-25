// ─── Scam Flag Categories ────────────────────────────────────────────────────
// ─── Utility Functions ───────────────────────────────────────────────────────
/**
 * Centralized risk classification function.
 * Must be used consistently across backend and frontend.
 * 0-24: Lower Risk, 25-49: Moderate Risk, 50-74: High Risk, 75-100: Critical Risk
 */
export function classifyRiskLevel(score) {
    const clamped = Math.min(100, Math.max(0, score));
    if (clamped >= 75)
        return "CRITICAL_RISK";
    if (clamped >= 50)
        return "HIGH_RISK";
    if (clamped >= 25)
        return "MODERATE_RISK";
    return "LOWER_RISK";
}
/**
 * Human-readable label for risk levels.
 */
export function riskLevelLabel(level) {
    switch (level) {
        case "CRITICAL_RISK": return "Critical Risk";
        case "HIGH_RISK": return "High Risk";
        case "MODERATE_RISK": return "Moderate Risk";
        case "LOWER_RISK": return "Lower Risk";
    }
}
/** Standard disclaimer shown on every report. */
export const REPORT_DISCLAIMER = "ScholarShield provides an automated preliminary risk assessment based on available information. " +
    "A high-risk result does not prove fraud, and a low-risk result does not guarantee legitimacy. " +
    "Verify scholarship details through independently confirmed official sources before making payments " +
    "or sharing sensitive information.";
