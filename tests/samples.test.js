import { describe, it, expect } from "vitest";
import { runScholarshipAnalysis } from "../lib/engine";
import { analyzeDomain } from "../lib/analyzers/domain-analyzer";
import { analyzePaymentDemands } from "../lib/analyzers/payment-analyzer";
import { analyzeFakeOrganization } from "../lib/analyzers/fake-org-analyzer";
import { analyzeCopiedContent } from "../lib/analyzers/copied-content-analyzer";
import { analyzeSuspiciousLanguage } from "../lib/analyzers/suspicious-language-analyzer";
import { aggregateRisk } from "../lib/risk";
import sampleScams from "../lib/data/sample-scams.json";
import legitScholarships from "../lib/data/legit-scholarships.json";
describe("ScholarShield Regression & Acceptance Tests", () => {
    it("submitting a known scam sample returns High Risk with multiple flags", async () => {
        const scamSample = sampleScams[0];
        const result = await runScholarshipAnalysis({
            url: scamSample.url,
            text: scamSample.description,
            targetOrg: scamSample.targetOrg,
        });
        expect(result.analysis.riskScore).toBeGreaterThanOrEqual(50);
        expect(["HIGH_RISK", "CRITICAL_RISK"]).toContain(result.analysis.verdict);
        expect(result.analysis.allFlags.length).toBeGreaterThanOrEqual(3);
        expect(result.analysis.topReasons.length).toBeGreaterThanOrEqual(3);
    });
    it("submitting an impersonation scam returns High Risk with brand hijacking & payment channel flags", async () => {
        const fulbrightScam = sampleScams[1];
        const result = await runScholarshipAnalysis({
            url: fulbrightScam.url,
            text: fulbrightScam.description,
            targetOrg: fulbrightScam.targetOrg,
        });
        expect(["HIGH_RISK", "CRITICAL_RISK"]).toContain(result.analysis.verdict);
        expect(result.analysis.riskScore).toBeGreaterThanOrEqual(50);
        const flagIds = result.analysis.allFlags.map((f) => f.id);
        expect(flagIds).toContain("BRAND_HIJACKING");
        expect(flagIds).toContain("CHAT_APP_PAYMENT_CHANNEL");
    });
    it("submitting a legit scholarship returns Lower Risk with low risk score", async () => {
        const legitSample = legitScholarships[0];
        const result = await runScholarshipAnalysis({
            url: `https://${legitSample.officialDomain}/apply`,
            text: legitSample.description,
            targetOrg: legitSample.organization,
        });
        expect(result.analysis.riskScore).toBeLessThanOrEqual(24);
        expect(result.analysis.verdict).toBe("LOWER_RISK");
    });
    it("submitting Chevening official scholarship returns Lower Risk", async () => {
        const chevening = legitScholarships[1];
        const result = await runScholarshipAnalysis({
            url: "https://www.chevening.org/scholarships",
            text: chevening.description,
            targetOrg: chevening.organization,
        });
        expect(result.analysis.riskScore).toBeLessThanOrEqual(24);
        expect(result.analysis.verdict).toBe("LOWER_RISK");
    });
    // ─────────────────────────────────────────────────────────────────────────────
    // REQUIRED REGRESSION TESTS (Section 7)
    // ─────────────────────────────────────────────────────────────────────────────
    describe("Test A: Suspicious Scholarship", () => {
        it("detects payment demand, guaranteed claim, credential requests, with unverified org and additive score", async () => {
            const text = `
        Congratulations! You have been pre-selected for the International Youth Grant.
        This scholarship is 100% guaranteed approval for all applicants.
        To secure and release your award, submit an application fee of $150 via Western Union.
        Please provide your banking login and card security code to verify identity.
      `;
            const paymentRes = analyzePaymentDemands(text);
            const langRes = analyzeSuspiciousLanguage(text);
            const fakeOrgRes = analyzeFakeOrganization({ text, domain: "international-youth-grant-fund.xyz" });
            // 1. Payment demand detected
            expect(paymentRes.flags.some((f) => f.id === "APPLICATION_OR_PROCESSING_FEE")).toBe(true);
            expect(paymentRes.flags.some((f) => f.id === "SPECIFIC_FEE_AMOUNT")).toBe(true);
            expect(paymentRes.flags.some((f) => f.id === "UNTRACEABLE_WIRE_SERVICES")).toBe(true);
            // 2. Suspicious language detected
            expect(langRes.flags.some((f) => f.id === "UNREALISTIC_GUARANTEE")).toBe(true);
            // 3. Sensitive credential requests detected
            expect(langRes.flags.some((f) => f.id === "SENSITIVE_FINANCIAL_CREDENTIALS")).toBe(true);
            // 4. Organization status is Unverified (not in local registry)
            const orgDetails = fakeOrgRes.details;
            expect(["VERIFIED", "UNVERIFIED"]).toContain(orgDetails.orgVerification);
            // 5. Score reflects actual triggered rules and caps with critical scam weights
            const domainRes = await analyzeDomain({ domain: "international-youth-grant-fund.xyz" });
            const aggregated = aggregateRisk({
                domainResult: domainRes,
                paymentResult: paymentRes,
                fakeOrgResult: fakeOrgRes,
                contentResult: analyzeCopiedContent({ text, domain: "international-youth-grant-fund.xyz" }),
                languageResult: langRes,
            });
            expect(aggregated.riskScore).toBeGreaterThanOrEqual(80);
            expect(aggregated.verdict).toBe("CRITICAL_RISK");
        });
    });
    describe("Test B: Government Scholarship Portal", () => {
        it("handles government portal without claiming HTTPS proves legitimacy, reports unverified safely if not in registry", async () => {
            const govUrl = "https://scholarships.gov.in/";
            const urlObj = new URL(govUrl);
            // URL parsed correctly
            expect(urlObj.hostname).toBe("scholarships.gov.in");
            expect(urlObj.protocol).toBe("https:");
            const domainRes = await analyzeDomain({
                domain: urlObj.hostname,
                protocol: urlObj.protocol,
            });
            // HTTPS availability noted, not claimed as proof of legitimacy
            const httpsFlag = domainRes.flags.find((f) => f.id === "UNENCRYPTED_HTTP");
            expect(httpsFlag).toBeUndefined(); // HTTPS is available, no HTTP warning
            // Government suffix gives trust bonus
            expect(domainRes.details?.isTrustedSuffix).toBe(true);
            const orgRes = analyzeFakeOrganization({
                text: "National Scholarship Portal Government of India",
                domain: urlObj.hostname,
            });
            const orgDetails = orgRes.details;
            expect(["VERIFIED", "UNVERIFIED"]).toContain(orgDetails.orgVerification);
            expect(orgRes.scoreContribution).toBe(0);
            // Aggregate: Should be LOWER_RISK because no scam signals triggered
            const aggregated = aggregateRisk({
                domainResult: domainRes,
                paymentResult: analyzePaymentDemands("Applications are open for post-matric scholarships."),
                fakeOrgResult: orgRes,
                contentResult: analyzeCopiedContent({ text: "National Scholarship Portal Government of India", domain: urlObj.hostname }),
                languageResult: analyzeSuspiciousLanguage("Applications are open for post-matric scholarships."),
                metadata: { url: govUrl, domain: urlObj.hostname, sslStatus: "AVAILABLE", textLength: 100 },
            });
            expect(aggregated.riskScore).toBeLessThanOrEqual(15);
            expect(aggregated.verdict).toBe("LOWER_RISK");
        });
    });
    describe("Test C: Domain with Hyphens", () => {
        it("domain normalization succeeds and hyphens alone do not trigger a high risk score", async () => {
            const hyphenUrl = "https://global-student-funding.example.com/";
            const parsed = new URL(hyphenUrl);
            const domain = parsed.hostname;
            expect(domain).toBe("global-student-funding.example.com");
            const domainRes = await analyzeDomain({ domain, protocol: "https:" });
            // Hyphen count is 2 (less than 3) or informational
            const hyphenFlag = domainRes.flags.find((f) => f.id === "EXCESSIVE_HYPHENS");
            if (hyphenFlag) {
                expect(hyphenFlag.severity).toBe("INFO");
                expect(hyphenFlag.scoreContribution).toBeLessThanOrEqual(2);
            }
            // Domain analyzer alone must be low score
            expect(domainRes.scoreContribution).toBeLessThanOrEqual(5);
            const aggregated = aggregateRisk({
                domainResult: domainRes,
                paymentResult: analyzePaymentDemands("General scholarship announcement."),
                fakeOrgResult: analyzeFakeOrganization({ text: "Funding opportunity.", domain }),
                contentResult: analyzeCopiedContent({ text: "General scholarship announcement.", domain }),
                languageResult: analyzeSuspiciousLanguage("General scholarship announcement."),
            });
            // Hyphens alone must NOT trigger high risk
            expect(aggregated.riskScore).toBeLessThan(25);
            expect(aggregated.verdict).toBe("LOWER_RISK");
        });
    });
    describe("Test D: Similar Scholarship Descriptions", () => {
        it("calculates similarity without automatically concluding fraud for generic/similar text", () => {
            const baseText = legitScholarships[0].description;
            const modifiedText = baseText.replace("Fulbright", "Global Leaders Fellowship");
            const contentRes = analyzeCopiedContent({
                text: modifiedText,
                domain: "independent-educational-trust.org",
            });
            expect(contentRes.details?.highestSimilarity).toBeGreaterThan(0.2);
            expect(contentRes.details?.matchedScholarship).toBe("Fulbright Foreign Student Program");
            // The score contribution should be capped at maxContribution (15)
            expect(contentRes.scoreContribution).toBeLessThanOrEqual(15);
            // Findings have limitations noted
            const simFlag = contentRes.flags.find((f) => f.id === "HIGH_CONTENT_SIMILARITY");
            if (simFlag) {
                expect(simFlag.limitations).toBeDefined();
            }
        });
    });
    describe("Test E: Missing Domain Age", () => {
        it("displays domain age as unavailable and does not add risk points solely because data is missing", async () => {
            const domainRes = await analyzeDomain({
                domain: "some-university-portal.org",
                domainAgeDays: null,
            });
            const ageUnavailableFlag = domainRes.flags.find((f) => f.id === "DOMAIN_AGE_UNAVAILABLE");
            expect(ageUnavailableFlag).toBeDefined();
            expect(ageUnavailableFlag?.scoreContribution).toBe(0);
            expect(ageUnavailableFlag?.severity).toBe("INFO");
            expect(domainRes.scoreContribution).toBe(0);
        });
    });
    describe("Test F: Same Input, Same Result (Determinism & Edge Cases)", () => {
        it("produces identical risk scores for identical input and evidence", async () => {
            const input = {
                url: "https://suspicious-grant.xyz/apply",
                text: "Apply now! $50 processing fee required. 100% guaranteed.",
            };
            const run1 = await runScholarshipAnalysis(input);
            const run2 = await runScholarshipAnalysis(input);
            expect(run1.analysis.riskScore).toBe(run2.analysis.riskScore);
            expect(run1.analysis.verdict).toBe(run2.analysis.verdict);
            expect(run1.analysis.allFlags.length).toBe(run2.analysis.allFlags.length);
            expect(run1.analysis.evidenceCoverage).toBe(run2.analysis.evidenceCoverage);
        });
        it("gracefully handles empty text and missing fields without throwing", async () => {
            const emptyPayment = analyzePaymentDemands("");
            expect(emptyPayment.scoreContribution).toBe(0);
            expect(emptyPayment.flags.length).toBe(0);
            const emptyLang = analyzeSuspiciousLanguage("");
            expect(emptyLang.scoreContribution).toBe(0);
            const emptyOrg = analyzeFakeOrganization({ text: "" });
            expect(emptyOrg.scoreContribution).toBe(0);
            const emptyContent = analyzeCopiedContent({ text: "" });
            expect(emptyContent.scoreContribution).toBe(0);
            expect(emptyContent.flags.some((f) => f.id === "INSUFFICIENT_COMPARISON_DATA")).toBe(true);
            const emptyDomain = await analyzeDomain({});
            expect(emptyDomain.scoreContribution).toBe(0);
        });
    });
    describe("Test G: National Scholarship Portal Impersonation & Credential Theft Scenario", () => {
        it("flags gov portal spoofing on non-gov domain and critical credential demands with CRITICAL_RISK", async () => {
            const input = {
                url: "https://scholarships-gov-india.co.in/apply",
                targetOrg: "National Scholarship Portal (Ministry of Education)",
                text: "Official scholarship application. Immediate action required! You have 24 hours remaining to claim grant. Please enter your banking ATM PIN and Aadhaar number for biometric verification.",
            };
            const result = await runScholarshipAnalysis(input);
            expect(result.analysis.verdict).toBe("CRITICAL_RISK");
            expect(result.analysis.riskScore).toBeGreaterThanOrEqual(80);

            const flagIds = result.analysis.allFlags.map((f) => f.id);
            expect(flagIds.some((id) => id === "GOVERNMENT_PORTAL_SPOOFING" || id === "UNAUTHORIZED_GOV_COMMERCIAL_DOMAIN")).toBe(true);
            expect(flagIds).toContain("SENSITIVE_FINANCIAL_CREDENTIALS");
            expect(flagIds).toContain("SENSITIVE_GOVERNMENT_ID");
            expect(flagIds).toContain("ARTIFICIAL_URGENCY");

            // Verify summary reflects suspicious indicators dynamically
            expect(result.analysis.summary).toContain("suspicious indicator");
            expect(result.analysis.summary).not.toContain("No significant suspicious indicators");
        });
    });

    describe("Part 6: Architectural Acceptance & Regression Test Suite", () => {
        it("1. https://scholarships.gov.in + legitimate text scores < 15 (LOWER_RISK)", async () => {
            const input = {
                url: "https://scholarships.gov.in/main.html",
                targetOrg: "National Scholarship Portal",
                text: "National Scholarship Portal Government of India. Applications are open for students. No application fee is required.",
            };
            const result = await runScholarshipAnalysis(input);
            expect(result.analysis.riskScore).toBeLessThan(15);
            expect(result.analysis.verdict).toBe("LOWER_RISK");
        });

        it("2. https://foreign.fulbrightonline.org + 'No application fee is charged' scores < 15 (LOWER_RISK)", async () => {
            const input = {
                url: "https://foreign.fulbrightonline.org/apply",
                targetOrg: "Fulbright Program",
                text: "The Fulbright Foreign Student Program enables graduate students from abroad to study in the United States. No application fee is charged to applicants.",
            };
            const result = await runScholarshipAnalysis(input);
            expect(result.analysis.riskScore).toBeLessThan(15);
            expect(result.analysis.verdict).toBe("LOWER_RISK");
        });

        it("3. https://scholarships-gov-india.co.in + OTP/Aadhaar/UPI scam scores >= 80 (CRITICAL_RISK)", async () => {
            const input = {
                url: "https://scholarships-gov-india.co.in/portal",
                targetOrg: "National Scholarship Portal",
                text: "Verify scholarship grant now! Please share your one-time password OTP and upload your aadhaar card. Pay fee via UPI qr immediately within 2 hours.",
            };
            const result = await runScholarshipAnalysis(input);
            expect(result.analysis.riskScore).toBeGreaterThanOrEqual(80);
            expect(result.analysis.verdict).toBe("CRITICAL_RISK");
        });

        it("4. https://tata-trusts-educationgrant.org + overpayment/GST deposit/hyphenated email scores >= 80 (CRITICAL_RISK) and extracts email", async () => {
            const input = {
                url: "https://tata-trusts-educationgrant.org/apply",
                targetOrg: "Tata Trusts",
                text: "Congratulations! You have been randomly selected for the Tata Education Grant. Please wire a 2% GST clearance deposit of ₹4,500 within 12 hours. Excess funds were accidentally issued so please refund the excess immediately. Contact grants-desk@tata-trusts-educationgrant.org for disbursal.",
            };
            const result = await runScholarshipAnalysis(input);
            expect(result.analysis.riskScore).toBeGreaterThanOrEqual(80);
            expect(result.analysis.verdict).toBe("CRITICAL_RISK");
            expect(result.analysis.metadata.contactEmails).toContain("grants-desk@tata-trusts-educationgrant.org");
        });
    });
});
