import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../lib/prisma";
import { POST, PATCH } from "../app/api/report-scam/route";
import { NextRequest } from "next/server";
describe("Community Blacklist Workflow & Status Transitions", () => {
    const testDomain1 = "audit-test-pending-domain.xyz";
    const testDomain2 = "audit-test-reject-domain.xyz";
    beforeEach(async () => {
        // Clean up test domains before each run
        await prisma.communityReport.deleteMany({
            where: { domain: { in: [testDomain1, testDomain2] } },
        });
        await prisma.knownBadDomain.deleteMany({
            where: { domain: { in: [testDomain1, testDomain2] } },
        });
    });
    it("assigns initial status PENDING_REVIEW and DOES NOT auto-blacklist domain", async () => {
        const req = new NextRequest("http://localhost:3000/api/report-scam", {
            method: "POST",
            body: JSON.stringify({
                url: `https://${testDomain1}/application`,
                scamType: "APPLICATION_FEE",
                description: "Requires $200 processing fee before interview scheduling.",
            }),
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.status).toBe("PENDING_REVIEW");
        // Verify database record has PENDING_REVIEW
        const savedReport = await prisma.communityReport.findUnique({
            where: { id: data.id },
        });
        expect(savedReport).not.toBeNull();
        expect(savedReport?.status).toBe("PENDING_REVIEW");
        // CRITICAL: Ensure domain was NOT added to KnownBadDomain
        const badDomain = await prisma.knownBadDomain.findUnique({
            where: { domain: testDomain1 },
        });
        expect(badDomain).toBeNull();
    });
    it("prevents duplicate pending reports from inflating independent report counts", async () => {
        // First submission
        const req1 = new NextRequest("http://localhost:3000/api/report-scam", {
            method: "POST",
            body: JSON.stringify({
                url: `https://${testDomain1}/application`,
                scamType: "APPLICATION_FEE",
                description: "Initial user report regarding upfront fees.",
            }),
        });
        const res1 = await POST(req1);
        const data1 = await res1.json();
        expect(data1.status).toBe("PENDING_REVIEW");
        // Duplicate submission for the same domain
        const req2 = new NextRequest("http://localhost:3000/api/report-scam", {
            method: "POST",
            body: JSON.stringify({
                url: `https://${testDomain1}/another-link`,
                scamType: "APPLICATION_FEE",
                description: "Second report attempting to inflate count.",
            }),
        });
        const res2 = await POST(req2);
        const data2 = await res2.json();
        expect(data2.success).toBe(true);
        expect(data2.duplicate).toBe(true);
        expect(data2.id).toBe(data1.id);
        // Verify only ONE report exists in DB for this domain
        const reports = await prisma.communityReport.findMany({
            where: { domain: testDomain1 },
        });
        expect(reports.length).toBe(1);
    });
    it("blocks unauthorized administrative status transitions", async () => {
        // Create pending report
        const report = await prisma.communityReport.create({
            data: {
                url: `https://${testDomain1}/scam`,
                domain: testDomain1,
                scamType: "IDENTITY_THEFT",
                description: "Asks for passport and bank card info.",
                status: "PENDING_REVIEW",
            },
        });
        // Attempt PATCH with invalid admin key
        const patchReq = new NextRequest("http://localhost:3000/api/report-scam", {
            method: "PATCH",
            headers: { "x-admin-key": "wrong-secret-key" },
            body: JSON.stringify({
                reportId: report.id,
                action: "VERIFY",
            }),
        });
        const res = await PATCH(patchReq);
        expect(res.status).toBe(401);
    });
    it("transitions PENDING_REVIEW -> VERIFIED and creates KnownBadDomain entry upon authorized verification", async () => {
        // Create pending report
        const report = await prisma.communityReport.create({
            data: {
                url: `https://${testDomain1}/scam`,
                domain: testDomain1,
                scamType: "APPLICATION_FEE",
                description: "Requires Western Union fee.",
                status: "PENDING_REVIEW",
            },
        });
        // Authorized Admin PATCH
        const patchReq = new NextRequest("http://localhost:3000/api/report-scam", {
            method: "PATCH",
            headers: { "x-admin-key": "scholarshield-admin-2026" },
            body: JSON.stringify({
                reportId: report.id,
                action: "VERIFY",
                notes: "Confirmed extortionate fee pattern via independent registrar review.",
            }),
        });
        const res = await PATCH(patchReq);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("VERIFIED");
        expect(data.domainBlacklisted).toBe(testDomain1);
        // Verify report status in DB
        const updatedReport = await prisma.communityReport.findUnique({
            where: { id: report.id },
        });
        expect(updatedReport?.status).toBe("VERIFIED");
        // Verify domain is now present in KnownBadDomain
        const badDomain = await prisma.knownBadDomain.findUnique({
            where: { domain: testDomain1 },
        });
        expect(badDomain).not.toBeNull();
        expect(badDomain?.domain).toBe(testDomain1);
        expect(badDomain?.source).toBe("COMMUNITY_REPORT");
    });
    it("transitions PENDING_REVIEW -> REJECTED and DOES NOT add domain to blacklist", async () => {
        // Create pending report
        const report = await prisma.communityReport.create({
            data: {
                url: `https://${testDomain2}/legit-opportunity`,
                domain: testDomain2,
                scamType: "OTHER",
                description: "Frivolous report on legitimate local community grant.",
                status: "PENDING_REVIEW",
            },
        });
        // Authorized Admin PATCH with REJECT
        const patchReq = new NextRequest("http://localhost:3000/api/report-scam", {
            method: "PATCH",
            headers: { "x-admin-key": "scholarshield-admin-2026" },
            body: JSON.stringify({
                reportId: report.id,
                action: "REJECT",
                notes: "Verified legitimate educational foundation with accredited 501(c)(3) status.",
            }),
        });
        const res = await PATCH(patchReq);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("REJECTED");
        // Verify status in DB
        const updatedReport = await prisma.communityReport.findUnique({
            where: { id: report.id },
        });
        expect(updatedReport?.status).toBe("REJECTED");
        // Ensure domain was NOT added to KnownBadDomain
        const badDomain = await prisma.knownBadDomain.findUnique({
            where: { domain: testDomain2 },
        });
        expect(badDomain).toBeNull();
    });
});
