import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { hashPassword } from "../lib/auth";
const prisma = new PrismaClient();
async function main() {
    console.log("🌱 Starting ScholarShield database seed...");
    // 1. Seed Legitimate Scholarships
    const legitPath = path.join(process.cwd(), "lib", "data", "legit-scholarships.json");
    const legitDataRaw = fs.readFileSync(legitPath, "utf-8");
    const legitData = JSON.parse(legitDataRaw);
    console.log(`Clearing existing records...`);
    await prisma.scanReport.deleteMany({});
    await prisma.communityReport.deleteMany({});
    await prisma.knownBadDomain.deleteMany({});
    await prisma.legitScholarship.deleteMany({});
    console.log(`Seeding ${legitData.length} verified legitimate scholarships...`);
    for (const item of legitData) {
        await prisma.legitScholarship.create({
            data: {
                id: item.id,
                name: item.name,
                slug: item.slug,
                officialDomain: item.officialDomain.toLowerCase(),
                organization: item.organization,
                country: item.country,
                coverage: item.coverage,
                officialUrl: item.officialUrl,
                description: item.description,
                verified: true,
            },
        });
    }
    // 2. Seed Known Bad Domains
    const badDomains = [
        { domain: "fulbright-grants.xyz", reason: "Impersonating Fulbright Program; demands WhatsApp payment", source: "SEED" },
        { domain: "un-studentmobility.top", reason: "Bogus UN fund demanding Bitcoin/crypto refundable deposit", source: "SEED" },
        { domain: "academic-grant-portal.xyz", reason: "Application fee demand via Western Union", source: "SEED" },
        { domain: "chevening-scholarship-direct.com", reason: "Impersonating Chevening; demands MoneyGram / Apple Gift Cards", source: "SEED" },
        { domain: "student-relief-trust.click", reason: "Phishing for SSN, bank login, and CashApp transfer", source: "SEED" },
        { domain: "erasmus-mundus-eu.org.co", reason: "Fake EU portal asking for Telegram medical insurance fees", source: "SEED" },
        { domain: "commonwealth-fellows.biz", reason: "Demands Western Union / Google Play gift cards", source: "SEED" },
        { domain: "mext-japan-portal.icu", reason: "Direct bank transfer scam targeting Japanese scholarship seekers", source: "SEED" },
        { domain: "worldbank-studentaid.loan", reason: "Crypto clearance fee scam impersonating World Bank", source: "SEED" },
        { domain: "gatescambridge-portal.club", reason: "Phishing passport scans and debit card details", source: "SEED" },
        { domain: "daad-germany-grants.info", reason: "WhatsApp payment scam impersonating DAAD Germany", source: "SEED" },
        { domain: "rotary-goodwill-awards.xyz", reason: "Steam / Amazon gift card fee demand", source: "SEED" },
        { domain: "swiss-scholarships-gov.site", reason: "Telegram payment scam impersonating Swiss Excellence", source: "SEED" },
        { domain: "australia-awards-online.cc", reason: "Free Gmail contact demanding UPI wire fee", source: "SEED" },
        { domain: "techpioneer-grants.click", reason: "CashApp handling charge with 100% guarantee lure", source: "SEED" },
    ];
    console.log(`Seeding ${badDomains.length} known malicious domains...`);
    for (const bad of badDomains) {
        await prisma.knownBadDomain.create({
            data: {
                domain: bad.domain.toLowerCase(),
                reason: bad.reason,
                source: bad.source,
                reportedCount: 3,
            },
        });
    }
    // 3. Seed Sample Community Reports
    console.log("Seeding sample community reports...");
    const communitySamples = [
        {
            url: "https://fulbright-grants.xyz/visa-fast-track",
            domain: "fulbright-grants.xyz",
            orgName: "Fulbright Impersonator",
            scamType: "IMPERSONATION",
            description: "Received an email claiming I won a Fulbright grant with immediate visa clearance if I paid $150 via WhatsApp.",
            evidenceNotes: "WhatsApp number +234-802-991-8822 was provided in the email signature.",
            reporterEmail: "concerned.student@university.edu",
            status: "VERIFIED",
        },
        {
            url: "https://academic-grant-portal.xyz/apply-now",
            domain: "academic-grant-portal.xyz",
            orgName: "Global Academic Excellence Grant",
            scamType: "APPLICATION_FEE",
            description: "Demanded $75 fee via Western Union before review.",
            evidenceNotes: "Sent receipt requesting money transfer to an individual named Mark in Cameroon.",
            reporterEmail: "grad_applicant@gmail.com",
            status: "VERIFIED",
        },
        {
            url: "https://student-relief-trust.click/claim",
            domain: "student-relief-trust.click",
            orgName: "National Student Relief Trust",
            scamType: "IDENTITY_THEFT",
            description: "Website asked for SSN, banking passwords, and CashApp transfer to release grant.",
            evidenceNotes: "Form directly asks for internet banking credentials.",
            reporterEmail: "anon_report@proton.me",
            status: "VERIFIED",
        },
    ];
    for (const cr of communitySamples) {
        await prisma.communityReport.create({
            data: cr,
        });
    }
    // 4. Seed Representative Scan Reports for initial dashboard analytics
    console.log("Seeding representative scan reports for dashboard...");
    const pastScans = [
        {
            url: "https://foreign.fulbrightonline.org",
            domain: "fulbrightonline.org",
            title: "Fulbright Foreign Student Program",
            targetOrg: "U.S. Department of State",
            rawText: "The Fulbright Foreign Student Program enables graduate students, young professionals and artists from abroad to study and conduct research in the United States. Applications are managed through binational Fulbright Commissions/Foundations or U.S. Embassies. Official applications never require any processing fee or payment.",
            riskScore: 6,
            verdict: "SAFE",
            confidence: "HIGH",
            summary: "This scholarship listing matches the verified registry with zero payment or credential red flags.",
            topReasons: JSON.stringify([
                "Domain matches officially verified academic exchange registry.",
                "Zero payment, fee, or financial transfer demands detected.",
                "Transparent application process managed through accredited embassies."
            ]),
            analyzerResults: JSON.stringify({
                domain: { score: 0, weight: 0.25, flags: [] },
                payment: { score: 0, weight: 0.25, flags: [] },
                fakeOrg: { score: 0, weight: 0.15, flags: [] },
                content: { score: 0, weight: 0.15, flags: [] },
                language: { score: 10, weight: 0.20, flags: [] },
            }),
            flags: JSON.stringify([]),
            metadata: JSON.stringify({ https: true, domainAgeYears: 24, emailsFound: ["fulbright@state.gov"] }),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        },
        {
            url: "https://academic-grant-portal.xyz/apply-now",
            domain: "academic-grant-portal.xyz",
            title: "Global Academic Excellence Grant - Guaranteed $15,000",
            targetOrg: "International Youth Funding Board",
            rawText: "Congratulations! You have been pre-selected for the 2025 Global Academic Excellence Grant worth $15,000. 100% guaranteed approval for all international applicants! A one-time non-refundable document processing fee of $75 must be submitted via Western Union. Only 5 spots remaining! Deadline expires tonight!",
            riskScore: 92,
            verdict: "HIGH_RISK",
            confidence: "HIGH",
            summary: "Severe scam detected: advance-fee fraud, artificial urgency, untraceable Western Union payment demand, and high-risk .xyz TLD.",
            topReasons: JSON.stringify([
                "Demands an advance application/processing fee of $75.",
                "Requires untraceable money transfer via Western Union.",
                "Fabricates false urgency and unrealistic 100% approval guarantees."
            ]),
            analyzerResults: JSON.stringify({
                domain: { score: 85, weight: 0.25, flags: [{ id: "SUSPICIOUS_TLD", severity: "HIGH", title: "Suspicious TLD (.xyz)", description: "Top-level domain frequently associated with throwaway scam sites." }] },
                payment: { score: 98, weight: 0.25, flags: [{ id: "FEE_DEMAND", severity: "CRITICAL", title: "Processing Fee Demand", description: "Legitimate scholarships never charge application or handling fees." }, { id: "WESTERN_UNION", severity: "CRITICAL", title: "Untraceable Wire Demand", description: "Demands Western Union payment, a common advance-fee fraud mechanism." }] },
                fakeOrg: { score: 75, weight: 0.15, flags: [{ id: "UNVERIFIED_ORG", severity: "HIGH", title: "Unverified Organization", description: "The claimed issuing board does not exist in the accredited registry." }] },
                content: { score: 20, weight: 0.15, flags: [] },
                language: { score: 95, weight: 0.20, flags: [{ id: "FALSE_URGENCY", severity: "HIGH", title: "Artificial Deadline Pressure", description: "Uses manipulative countdown urgency ('expires tonight', '5 spots left')." }] },
            }),
            flags: JSON.stringify([
                { id: "FEE_DEMAND", severity: "CRITICAL", title: "Processing Fee Demand", description: "Demands $75 processing fee." },
                { id: "WESTERN_UNION", severity: "CRITICAL", title: "Western Union Wire Demand", description: "Requests untraceable Western Union wire." },
                { id: "SUSPICIOUS_TLD", severity: "HIGH", title: "High-Risk Domain Extension", description: ".xyz domain registered recently." },
                { id: "FALSE_URGENCY", severity: "HIGH", title: "Manufactured Urgency", description: "'Only 5 spots left' pressure tactics." }
            ]),
            metadata: JSON.stringify({ https: true, domainAgeYears: 0.1, emailsFound: [] }),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
        {
            url: "https://fulbright-grants.xyz/visa-fast-track",
            domain: "fulbright-grants.xyz",
            title: "Fulbright Fast-Track Visa & Fellowship Portal",
            targetOrg: "Fulbright Foreign Student Program",
            rawText: "The Fulbright Foreign Student Program enables graduate students, young professionals and artists from abroad to study and conduct research in the United States. Special expedited fast-track entry is now open. Contact our regional processing officer directly on WhatsApp at +234-802-991-8822 to pay the $150 priority clearance charge.",
            riskScore: 96,
            verdict: "HIGH_RISK",
            confidence: "HIGH",
            summary: "Critical brand impersonation scam: steals official Fulbright text and lures students into WhatsApp fee extortion.",
            topReasons: JSON.stringify([
                "Typosquatting/brand hijacking of official Fulbright program name.",
                "Demands off-platform payment via personal WhatsApp phone number.",
                "Plagiarized descriptive text on an unauthorized, untrusted domain."
            ]),
            analyzerResults: JSON.stringify({
                domain: { score: 95, weight: 0.25, flags: [{ id: "BRAND_HIJACKING", severity: "CRITICAL", title: "Brand Impersonation", description: "Embeds brand 'fulbright' in unauthorized .xyz domain." }] },
                payment: { score: 95, weight: 0.25, flags: [{ id: "WHATSAPP_PAYMENT", severity: "CRITICAL", title: "WhatsApp Direct Payment", description: "Directs applicant to private WhatsApp number for fees." }] },
                fakeOrg: { score: 80, weight: 0.15, flags: [{ id: "NO_OFFICIAL_ADDRESS", severity: "MEDIUM", title: "No Institutional Credentials", description: "Lacks physical consular or university address." }] },
                content: { score: 95, weight: 0.15, flags: [{ id: "COPIED_CONTENT", severity: "CRITICAL", title: "Stolen Legitimate Text", description: "95% similarity to official Fulbright description on unauthorized domain." }] },
                language: { score: 70, weight: 0.20, flags: [{ id: "FAST_TRACK_LURE", severity: "HIGH", title: "Unrealistic Fast-Track Scheme", description: "Claims guaranteed visa and admission bypassing official vetting." }] },
            }),
            flags: JSON.stringify([
                { id: "BRAND_HIJACKING", severity: "CRITICAL", title: "Brand Impersonation", description: "Impersonates Fulbright" },
                { id: "WHATSAPP_PAYMENT", severity: "CRITICAL", title: "WhatsApp Fee Extortion", description: "WhatsApp contact for payment" },
                { id: "COPIED_CONTENT", severity: "CRITICAL", title: "Plagiarized Legit Content", description: "Stolen official text" }
            ]),
            metadata: JSON.stringify({ https: true, domainAgeYears: 0.05, emailsFound: [] }),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
        },
        {
            url: "https://www.chevening.org",
            domain: "chevening.org",
            title: "Chevening Scholarships | Official Portal",
            targetOrg: "UK Foreign, Commonwealth and Development Office",
            rawText: "Chevening is the UK Government's global scholarship programme, funded by the Foreign, Commonwealth and Development Office and partner organisations. It offers fully-funded master's degrees for individuals with demonstrable leadership potential. The application process is free and exclusively submitted online via chevening.org.",
            riskScore: 4,
            verdict: "SAFE",
            confidence: "HIGH",
            summary: "Authentic official UK Government Chevening Scholarship portal. Fully verified.",
            topReasons: JSON.stringify([
                "Verified official .org domain for UK FCDO Chevening program.",
                "Explicitly states that applications are completely free.",
                "Established institutional domain with long-standing public history."
            ]),
            analyzerResults: JSON.stringify({
                domain: { score: 0, weight: 0.25, flags: [] },
                payment: { score: 0, weight: 0.25, flags: [] },
                fakeOrg: { score: 0, weight: 0.15, flags: [] },
                content: { score: 0, weight: 0.15, flags: [] },
                language: { score: 5, weight: 0.20, flags: [] },
            }),
            flags: JSON.stringify([]),
            metadata: JSON.stringify({ https: true, domainAgeYears: 22, emailsFound: ["info@chevening.org"] }),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        },
        {
            url: "https://community-youth-grant.net/apply",
            domain: "community-youth-grant.net",
            title: "Regional Youth Leadership Study Bursary",
            targetOrg: "Community Development Trust",
            rawText: "The Regional Youth Leadership Study Bursary supports undergraduate students with a $2,500 contribution to books and living supplies. Applicants must submit an academic recommendation and high school transcript. Incomplete submissions cannot be processed.",
            riskScore: 38,
            verdict: "SUSPICIOUS",
            confidence: "MEDIUM",
            summary: "Minor flags detected: unverified private domain and lack of verifiable institutional accreditation.",
            topReasons: JSON.stringify([
                "Organization is not in the verified international registry.",
                "No official institutional physical address or accreditation provided.",
                "Contact email is unverified."
            ]),
            analyzerResults: JSON.stringify({
                domain: { score: 40, weight: 0.25, flags: [{ id: "UNVERIFIED_DOMAIN", severity: "MEDIUM", title: "Unverified Domain", description: "Not associated with recognized academic registry." }] },
                payment: { score: 0, weight: 0.25, flags: [] },
                fakeOrg: { score: 55, weight: 0.15, flags: [{ id: "UNKNOWN_ENTITY", severity: "MEDIUM", title: "Unregistered Entity", description: "No official public registration found." }] },
                content: { score: 10, weight: 0.15, flags: [] },
                language: { score: 25, weight: 0.20, flags: [] },
            }),
            flags: JSON.stringify([
                { id: "UNVERIFIED_DOMAIN", severity: "MEDIUM", title: "Unverified Domain", description: "Unregistered private domain" }
            ]),
            metadata: JSON.stringify({ https: true, domainAgeYears: 1.2, emailsFound: ["contact@community-youth-grant.net"] }),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        }
    ];
    for (const scan of pastScans) {
        await prisma.scanReport.create({
            data: scan,
        });
    }
    // 5. Seed Initial Platform Users
    console.log("Seeding platform users...");
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    const adminPasswordHash = await hashPassword("ScholarShield2026!");
    const auditorPasswordHash = await hashPassword("Auditor2026!");
    const studentPasswordHash = await hashPassword("Student2026!");
    await prisma.user.create({
        data: {
            email: "admin@scholarshield.org",
            name: "Security Lead",
            passwordHash: adminPasswordHash,
            role: "ADMIN",
        },
    });
    await prisma.user.create({
        data: {
            email: "auditor@scholarshield.org",
            name: "Senior QA Auditor",
            passwordHash: auditorPasswordHash,
            role: "AUDITOR",
        },
    });
    await prisma.user.create({
        data: {
            email: "student@scholarshield.org",
            name: "Academic Applicant",
            passwordHash: studentPasswordHash,
            role: "USER",
        },
    });
    console.log("✅ Seeding completed successfully!");
}
main()
    .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
