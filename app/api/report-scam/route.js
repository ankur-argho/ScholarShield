import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { checkRateLimit } from "../../../lib/rate-limit";
const reportScamSchema = z.object({
    url: z.string().trim().url({ message: "Please provide a valid URL (starting with http:// or https://)" }),
    orgName: z.string().trim().optional(),
    scamType: z.enum([
        "APPLICATION_FEE",
        "IDENTITY_THEFT",
        "FAKE_ORG",
        "IMPERSONATION",
        "OTHER",
    ]),
    description: z.string().trim().min(10, { message: "Please provide a description of at least 10 characters." }),
    evidenceNotes: z.string().trim().optional(),
    reporterEmail: z.string().trim().email().optional().or(z.literal("")),
});
const adminReviewSchema = z.object({
    reportId: z.string().min(1, { message: "reportId is required" }),
    action: z.enum(["VERIFY", "REJECT"]),
    notes: z.string().optional(),
});
const ADMIN_SECRET = process.env.ADMIN_SECRET || "scholarshield-admin-2026";
export async function POST(req) {
    try {
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        const { allowed } = checkRateLimit(`report-scam-${clientIp}`, 10, 60 * 1000);
        if (!allowed) {
            return NextResponse.json({ error: "Too many community reports submitted. Please wait before submitting again." }, { status: 429 });
        }
        const body = await req.json();
        const result = reportScamSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.errors[0]?.message || "Validation failed" }, { status: 400 });
        }
        const { url, orgName, scamType, description, evidenceNotes, reporterEmail } = result.data;
        const parsed = new URL(url);
        const domain = parsed.hostname.toLowerCase();
        // Prevent duplicate pending reports from inflating independent report counts
        const existingPending = await prisma.communityReport.findFirst({
            where: {
                domain,
                status: "PENDING_REVIEW",
            },
        });
        if (existingPending) {
            return NextResponse.json({
                success: true,
                id: existingPending.id,
                status: "PENDING_REVIEW",
                message: "A report for this domain is already recorded and pending administrative review.",
                duplicate: true,
            });
        }
        // Save report in PENDING_REVIEW status (NOT auto-blacklisted)
        const report = await prisma.communityReport.create({
            data: {
                url,
                domain,
                orgName: orgName || null,
                scamType,
                description,
                evidenceNotes: evidenceNotes || null,
                reporterEmail: reporterEmail || null,
                status: "PENDING_REVIEW",
            },
        });
        return NextResponse.json({
            success: true,
            id: report.id,
            status: "PENDING_REVIEW",
            message: "Report submitted successfully. Placed in PENDING_REVIEW awaiting authorized administrative verification.",
            domainPendingReview: domain,
        });
    }
    catch (err) {
        console.error("API /api/report-scam POST error:", err);
        return NextResponse.json({ error: "Failed to submit scam report" }, { status: 500 });
    }
}
export async function PATCH(req) {
    try {
        // Authorized administrative verification check
        const authHeader = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("adminKey");
        if (authHeader !== ADMIN_SECRET) {
            return NextResponse.json({ error: "Unauthorized. Valid administrator key required for verification actions." }, { status: 401 });
        }
        const body = await req.json();
        const result = adminReviewSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.errors[0]?.message || "Validation failed" }, { status: 400 });
        }
        const { reportId, action, notes } = result.data;
        const report = await prisma.communityReport.findUnique({
            where: { id: reportId },
        });
        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }
        if (action === "VERIFY") {
            // Transition status to VERIFIED
            const updated = await prisma.communityReport.update({
                where: { id: reportId },
                data: {
                    status: "VERIFIED",
                    evidenceNotes: notes
                        ? `${report.evidenceNotes ? report.evidenceNotes + " | " : ""}Admin Verified: ${notes}`
                        : report.evidenceNotes,
                },
            });
            // ONLY on authorized admin verification is the domain added to the confirmed KnownBadDomain blacklist
            await prisma.knownBadDomain.upsert({
                where: { domain: report.domain },
                update: {
                    reportedCount: { increment: 1 },
                    updatedAt: new Date(),
                },
                create: {
                    domain: report.domain,
                    reason: `Admin verified community report for ${report.scamType}: ${report.description.slice(0, 100)}`,
                    source: "COMMUNITY_REPORT",
                    reportedCount: 1,
                },
            });
            return NextResponse.json({
                success: true,
                id: updated.id,
                status: "VERIFIED",
                domainBlacklisted: report.domain,
                message: `Report verified and domain ${report.domain} added to confirmed blacklist.`,
            });
        }
        if (action === "REJECT") {
            // Transition status to REJECTED (does NOT blacklist)
            const updated = await prisma.communityReport.update({
                where: { id: reportId },
                data: {
                    status: "REJECTED",
                    evidenceNotes: notes
                        ? `${report.evidenceNotes ? report.evidenceNotes + " | " : ""}Admin Rejected: ${notes}`
                        : report.evidenceNotes,
                },
            });
            return NextResponse.json({
                success: true,
                id: updated.id,
                status: "REJECTED",
                message: `Report marked as REJECTED. Domain ${report.domain} was not added to blacklist.`,
            });
        }
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    catch (err) {
        console.error("API /api/report-scam PATCH error:", err);
        return NextResponse.json({ error: "Failed to process review action" }, { status: 500 });
    }
}
export async function GET(req) {
    try {
        const status = req.nextUrl.searchParams.get("status");
        const whereClause = status ? { status } : {};
        const reports = await prisma.communityReport.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        return NextResponse.json({ reports });
    }
    catch (err) {
        console.error("API /api/report-scam GET error:", err);
        return NextResponse.json({ error: "Failed to fetch community reports" }, { status: 500 });
    }
}
