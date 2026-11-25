import { prisma } from "./prisma";
import { scrapeScholarshipPage } from "./scraper";
import { analyzeDomain } from "./analyzers/domain-analyzer";
import { analyzePaymentDemands } from "./analyzers/payment-analyzer";
import { analyzeFakeOrganization } from "./analyzers/fake-org-analyzer";
import { analyzeCopiedContent } from "./analyzers/copied-content-analyzer";
import { analyzeSuspiciousLanguage } from "./analyzers/suspicious-language-analyzer";
import { aggregateRisk } from "./risk";
/**
 * Coordinates end-to-end scholarship verification:
 * 1. Safe web scraping (with SSRF guard)
 * 2. Database bad domain check
 * 3. Execution of all 5 specialized analyzers
 * 4. Multi-factor risk aggregation
 * 5. Database persistence of the final report
 */
export async function runScholarshipAnalysis(input) {
    const rawUrl = input.url?.trim() || "";
    const rawText = input.text?.trim() || "";
    const targetOrg = input.targetOrg?.trim() || "";
    let scrapedData;
    let combinedText = rawText;
    let domain = "";
    let protocol = "https:";
    let pageTitle = "";
    let contactEmails = [];
    // Determine analysis mode
    let analysisMode = "TEXT_ONLY";
    if (rawUrl && rawText) {
        analysisMode = "URL_AND_TEXT";
    }
    else if (rawUrl) {
        analysisMode = "URL_ONLY";
    }
    // 1. If URL is provided, fetch and extract page data safely
    if (rawUrl) {
        scrapedData = await scrapeScholarshipPage(rawUrl);
        domain = scrapedData.domain || "";
        protocol = scrapedData.protocol || "https:";
        pageTitle = scrapedData.title || "";
        contactEmails = scrapedData.contactEmails || [];
        // Combine extracted text with pasted text (if any)
        if (scrapedData.visibleText) {
            combinedText = combinedText
                ? `${rawText}\n\n[Scraped Page Content]:\n${scrapedData.visibleText}`
                : scrapedData.visibleText;
        }
    }
    // Extract contact emails from combined text as well (ensuring pasted text emails are captured)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const textEmails = (combinedText.match(emailRegex) || []).map((e) => e.toLowerCase());
    contactEmails = Array.from(new Set([...contactEmails, ...textEmails]));

    // 2. Fetch known bad domains from the database
    let knownBadDomains = [];
    try {
        const badDomainRecords = await prisma.knownBadDomain.findMany({
            select: { domain: true },
        });
        knownBadDomains = badDomainRecords.map((r) => r.domain.toLowerCase());
    }
    catch {
        // If DB is temporarily unavailable, proceed with in-memory defaults
    }
    // 3. Run all 5 modular analyzers
    const [domainResult, paymentResult, fakeOrgResult, contentResult, languageResult] = await Promise.all([
        analyzeDomain({
            domain,
            protocol,
            knownBadDomains,
            domainAgeDays: scrapedData?.domainAgeDays,
        }),
        Promise.resolve(analyzePaymentDemands(combinedText)),
        Promise.resolve(analyzeFakeOrganization({
            text: combinedText,
            contactEmails,
            claimedOrg: targetOrg || pageTitle,
            domain,
            outboundLinks: scrapedData?.outboundLinks,
        })),
        Promise.resolve(analyzeCopiedContent({
            text: combinedText,
            domain,
        })),
        Promise.resolve(analyzeSuspiciousLanguage(combinedText)),
    ]);
    // 4. Extract org verification info from fake-org analyzer
    const orgDetails = fakeOrgResult.details;
    // 5. Resolve SSL status
    const sslStatus = domain
        ? (protocol === "https:" ? "AVAILABLE" : "UNAVAILABLE")
        : "NOT_CHECKED";
    // 6. Aggregate findings into unified risk score and classification
    const analysis = aggregateRisk({
        domainResult,
        paymentResult,
        fakeOrgResult,
        contentResult,
        languageResult,
        metadata: {
            domain: domain || undefined,
            url: rawUrl || undefined,
            title: pageTitle || undefined,
            sslStatus,
            domainAgeDays: scrapedData?.domainAgeDays ?? null,
            contactEmails,
            orgVerification: orgDetails?.orgVerification,
            orgVerificationSource: orgDetails?.orgVerificationSource,
            textLength: combinedText.length,
            hasUrl: !!rawUrl,
            analysisMode,
        },
    });
    // 7. Persist scan report to SQLite database
    const createdReport = await prisma.scanReport.create({
        data: {
            url: rawUrl || null,
            domain: domain || null,
            title: pageTitle || (input.targetOrg ? `${input.targetOrg} Listing` : "Scholarship Verification Scan"),
            targetOrg: targetOrg || null,
            rawText: combinedText.slice(0, 5000), // persist up to 5,000 characters
            riskScore: analysis.riskScore,
            verdict: analysis.riskLevel, // stored as string in DB
            confidence: analysis.evidenceCoverage, // stored as string in DB
            summary: analysis.summary,
            topReasons: JSON.stringify(analysis.topReasons),
            analyzerResults: JSON.stringify(analysis.analyzerResults),
            flags: JSON.stringify(analysis.allFlags),
            metadata: JSON.stringify(analysis.metadata),
        },
    });
    return {
        reportId: createdReport.id,
        analysis,
        scrapedData,
    };
}
