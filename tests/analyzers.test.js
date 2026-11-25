import { describe, it, expect } from "vitest";
import { analyzeDomain, calculateLevenshtein } from "../lib/analyzers/domain-analyzer";
import { analyzePaymentDemands } from "../lib/analyzers/payment-analyzer";
import { analyzeFakeOrganization } from "../lib/analyzers/fake-org-analyzer";
import { analyzeCopiedContent } from "../lib/analyzers/copied-content-analyzer";
import { analyzeSuspiciousLanguage } from "../lib/analyzers/suspicious-language-analyzer";
import { aggregateRisk } from "../lib/risk";
import { isPrivateOrReservedIp, validateSafeUrl } from "../lib/scraper";
describe("Domain Analyzer", () => {
    it("calculates Levenshtein distance accurately", () => {
        expect(calculateLevenshtein("kitten", "sitting")).toBe(3);
        expect(calculateLevenshtein("chevening.org", "chevening.org")).toBe(0);
        expect(calculateLevenshtein("chevening.com", "chevening.org")).toBe(3);
    });
    it("verifies official legitimate domains as 0 risk", async () => {
        const result = await analyzeDomain({ domain: "fulbrightprogram.org" });
        expect(result.scoreContribution).toBe(0);
        expect(result.flags.some((f) => f.id === "VERIFIED_OFFICIAL_DOMAIN")).toBe(true);
    });
    it("flags brand hijacking on unofficial domains with proper contribution", async () => {
        const result = await analyzeDomain({ domain: "fulbright-grants.xyz" });
        expect(result.scoreContribution).toBeGreaterThanOrEqual(15);
        expect(result.flags.some((f) => f.id === "BRAND_HIJACKING")).toBe(true);
        expect(result.flags.some((f) => f.id === "SUSPICIOUS_TLD")).toBe(true);
    });
    it("flags typosquatting look-alikes", async () => {
        // 1-char difference from daad.de -> daab.de
        const result = await analyzeDomain({ domain: "daab.de" });
        expect(result.flags.some((f) => f.id === "TYPOSQUATTING_LOOKALIKE")).toBe(true);
    });
    it("flags community blacklisted domains with strong score", async () => {
        const result = await analyzeDomain({
            domain: "scam-grants.click",
            knownBadDomains: ["scam-grants.click"],
        });
        expect(result.scoreContribution).toBeGreaterThanOrEqual(20);
        expect(result.flags.some((f) => f.id === "KNOWN_MALICIOUS_DOMAIN")).toBe(true);
    });
});
describe("Payment Demand Analyzer", () => {
    it("detects processing and application fee demands", () => {
        const text = "To receive your scholarship, an application fee of $75 must be submitted.";
        const result = analyzePaymentDemands(text);
        expect(result.scoreContribution).toBeGreaterThanOrEqual(10);
        expect(result.flags.some((f) => f.id === "APPLICATION_OR_PROCESSING_FEE")).toBe(true);
    });
    it("detects 'refundable deposit' scam patterns", () => {
        const text = "Awardees must deposit a refundable security guarantee of €350 before visa issuance.";
        const result = analyzePaymentDemands(text);
        expect(result.flags.some((f) => f.id === "REFUNDABLE_DEPOSIT")).toBe(true);
    });
    it("detects cryptocurrency wallet demands", () => {
        const text = "Send 100 USDT or Bitcoin to our wallet address 0x71C8363837492837492384729384729384729384.";
        const result = analyzePaymentDemands(text);
        expect(result.flags.some((f) => f.id === "CRYPTO_PAYMENT")).toBe(true);
    });
    it("detects gift card payment requests", () => {
        const text = "Purchase a $50 Amazon gift card or Apple gift card and send the code.";
        const result = analyzePaymentDemands(text);
        expect(result.flags.some((f) => f.id === "GIFT_CARD_PAYMENT")).toBe(true);
    });
    it("detects untraceable money transfers (Western Union)", () => {
        const text = "Send your application dossier fee via Western Union or MoneyGram.";
        const result = analyzePaymentDemands(text);
        expect(result.flags.some((f) => f.id === "UNTRACEABLE_WIRE_SERVICES")).toBe(true);
    });
    it("detects WhatsApp/Telegram payment routing", () => {
        const text = "Contact our director on WhatsApp to pay the priority screening charge.";
        const result = analyzePaymentDemands(text);
        expect(result.flags.some((f) => f.id === "CHAT_APP_PAYMENT_CHANNEL")).toBe(true);
    });
    it("recognizes legitimate zero-fee text", () => {
        const text = "The application process is completely free of charge with no application fee.";
        const result = analyzePaymentDemands(text);
        expect(result.scoreContribution).toBe(0);
        expect(result.flags.length).toBe(0);
    });
});
describe("Fake Organization Analyzer", () => {
    it("flags commercial free emails (gmail, yahoo) as official contact", () => {
        const result = analyzeFakeOrganization({
            text: "For scholarship queries email un.scholarship.help@gmail.com",
            contactEmails: ["un.scholarship.help@gmail.com"],
        });
        expect(result.scoreContribution).toBeGreaterThanOrEqual(5);
        expect(result.flags.some((f) => f.id === "FREE_EMAIL_CONTACT")).toBe(true);
    });
    it("detects fabricated bureau titles", () => {
        const result = analyzeFakeOrganization({
            text: "Issued by the International Scholarship Disbursal Commission.",
        });
        expect(result.flags.some((f) => f.id === "FABRICATED_AUTHORITY_NAME")).toBe(true);
    });
    it("flags claimed organization mismatch when host domain differs", () => {
        const result = analyzeFakeOrganization({
            text: "The prestigious Chevening scholarship.",
            claimedOrg: "Chevening Scholarships",
            domain: "chevening-grants-claim.xyz",
        });
        expect(result.flags.some((f) => f.id === "ORG_DOMAIN_MISMATCH" || f.id === "ORGANIZATION_IMPERSONATION")).toBe(true);
    });
});
describe("Copied Content Analyzer", () => {
    const fulbrightText = "The Fulbright Foreign Student Program enables graduate students, young professionals and artists from abroad to study and conduct research in the United States. Operating in more than 160 countries worldwide, approximately 4,000 foreign students receive Fulbright scholarships each year.";
    it("flags stolen legitimate text on an unauthorized domain as similarity finding", () => {
        const result = analyzeCopiedContent({
            text: fulbrightText,
            domain: "fast-scholarship-grants.xyz",
        });
        expect(result.scoreContribution).toBeGreaterThanOrEqual(10);
        expect(result.flags.some((f) => f.id === "HIGH_CONTENT_SIMILARITY" || f.id === "PLAGIARIZED_LEGITIMATE_TEXT")).toBe(true);
    });
    it("confirms authenticity when matching text is on official domain", () => {
        const result = analyzeCopiedContent({
            text: fulbrightText,
            domain: "fulbrightprogram.org",
        });
        expect(result.scoreContribution).toBe(0);
        expect(result.flags.some((f) => f.id === "AUTHENTIC_TEXT_VERIFIED")).toBe(true);
    });
});
describe("Suspicious Language Analyzer", () => {
    it("flags high pressure artificial urgency", () => {
        const result = analyzeSuspiciousLanguage("Act now! Only 2 spots left and deadline expires tonight!");
        expect(result.flags.some((f) => f.id === "ARTIFICIAL_URGENCY")).toBe(true);
    });
    it("flags unrealistic 100% guarantees", () => {
        const result = analyzeSuspiciousLanguage("100% guaranteed approval for everyone who applies, no GPA requirement!");
        expect(result.flags.some((f) => f.id === "UNREALISTIC_GUARANTEE")).toBe(true);
        expect(result.flags.some((f) => f.id === "NO_ACADEMIC_CRITERIA")).toBe(true);
    });
    it("flags requests for sensitive financial credentials & government IDs", () => {
        const result = analyzeSuspiciousLanguage("Provide your social security number, bank login, and ATM PIN to release funds.");
        expect(result.flags.some((f) => f.id === "SENSITIVE_FINANCIAL_CREDENTIALS")).toBe(true);
        expect(result.flags.some((f) => f.id === "SENSITIVE_GOVERNMENT_ID")).toBe(true);
    });
});
describe("Risk Aggregator", () => {
    it("aggregates scam flags into HIGH_RISK or CRITICAL_RISK verdict with top reasons", async () => {
        const domainRes = await analyzeDomain({
            domain: "academic-grant-portal.xyz",
            knownBadDomains: ["academic-grant-portal.xyz"],
        });
        const paymentRes = analyzePaymentDemands("Pay $75 application fee via Western Union!");
        const fakeOrgRes = analyzeFakeOrganization({ text: "Contact scholarship desk", contactEmails: ["desk@gmail.com"] });
        const contentRes = analyzeCopiedContent({ text: "Win grant money today", domain: "academic-grant-portal.xyz" });
        const langRes = analyzeSuspiciousLanguage("100% guaranteed scholarship! Apply within 24 hours!");
        const aggregated = aggregateRisk({
            domainResult: domainRes,
            paymentResult: paymentRes,
            fakeOrgResult: fakeOrgRes,
            contentResult: contentRes,
            languageResult: langRes,
        });
        expect(aggregated.riskScore).toBeGreaterThanOrEqual(50);
        expect(["HIGH_RISK", "CRITICAL_RISK"]).toContain(aggregated.verdict);
        expect(aggregated.topReasons.length).toBeGreaterThanOrEqual(3);
        expect(aggregated.allFlags.length).toBeGreaterThanOrEqual(3);
    });
    it("yields LOWER_RISK verdict for legitimate scholarship", async () => {
        const domainRes = await analyzeDomain({ domain: "chevening.org" });
        const paymentRes = analyzePaymentDemands("Applications are completely free of charge.");
        const fakeOrgRes = analyzeFakeOrganization({
            text: "Chevening is the UK Government scholarship. Contact us at 10 Spring Gardens, London SW1A 2BN.",
            claimedOrg: "Chevening",
            domain: "chevening.org",
            contactEmails: ["info@chevening.org"],
        });
        const contentRes = analyzeCopiedContent({
            text: "Chevening is the UK Government's global scholarship programme, funded by the Foreign, Commonwealth and Development Office.",
            domain: "chevening.org",
        });
        const langRes = analyzeSuspiciousLanguage("Competitive selection based on academic leadership potential.");
        const aggregated = aggregateRisk({
            domainResult: domainRes,
            paymentResult: paymentRes,
            fakeOrgResult: fakeOrgRes,
            contentResult: contentRes,
            languageResult: langRes,
            metadata: {
                textLength: 500,
                hasUrl: true,
                sslStatus: "AVAILABLE",
                domainAgeDays: 3650,
                contactEmails: ["info@chevening.org"],
            },
        });
        expect(aggregated.riskScore).toBeLessThanOrEqual(24);
        expect(aggregated.verdict).toBe("LOWER_RISK");
        expect(aggregated.confidence).toBe("SUBSTANTIAL");
    });
});
describe("Scraper SSRF Protection", () => {
    it("detects private and loopback IPv4/IPv6 addresses", () => {
        expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
        expect(isPrivateOrReservedIp("localhost")).toBe(true);
        expect(isPrivateOrReservedIp("10.0.0.1")).toBe(true);
        expect(isPrivateOrReservedIp("172.16.0.1")).toBe(true);
        expect(isPrivateOrReservedIp("192.168.1.10")).toBe(true);
        expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true);
        expect(isPrivateOrReservedIp("::1")).toBe(true);
        expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
    });
    it("blocks dangerous URLs", async () => {
        const loopback = await validateSafeUrl("http://localhost:3000/admin");
        expect(loopback.safe).toBe(false);
        const privateIp = await validateSafeUrl("http://192.168.1.1/router");
        expect(privateIp.safe).toBe(false);
        const ftpScheme = await validateSafeUrl("ftp://scholarship.com/file.pdf");
        expect(ftpScheme.safe).toBe(false);
        const publicUrl = await validateSafeUrl("https://foreign.fulbrightonline.org");
        expect(publicUrl.safe).toBe(true);
    });
});
