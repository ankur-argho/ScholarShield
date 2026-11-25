import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search")?.trim() || "";
        const verdict = searchParams.get("verdict")?.trim() || "";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
        const skip = (page - 1) * limit;
        // Filter building
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where = {};
        const validVerdicts = ["SAFE", "SUSPICIOUS", "HIGH_RISK", "LOWER_RISK", "MODERATE_RISK", "CRITICAL_RISK"];
        if (verdict && validVerdicts.includes(verdict.toUpperCase())) {
            const v = verdict.toUpperCase();
            // Handle mapping if older records used SAFE / SUSPICIOUS
            if (v === "LOWER_RISK") {
                where.OR = [{ verdict: "LOWER_RISK" }, { verdict: "SAFE" }];
            }
            else if (v === "MODERATE_RISK") {
                where.OR = [{ verdict: "MODERATE_RISK" }, { verdict: "SUSPICIOUS" }];
            }
            else {
                where.verdict = v;
            }
        }
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { domain: { contains: search } },
                { targetOrg: { contains: search } },
                { summary: { contains: search } },
            ];
        }
        const [total, reports] = await Promise.all([
            prisma.scanReport.count({ where }),
            prisma.scanReport.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    url: true,
                    domain: true,
                    title: true,
                    targetOrg: true,
                    riskScore: true,
                    verdict: true,
                    confidence: true,
                    summary: true,
                    topReasons: true,
                    createdAt: true,
                },
            }),
        ]);
        const formattedReports = reports.map((r) => {
            let reasons = [];
            try {
                reasons = JSON.parse(r.topReasons);
            }
            catch {
                reasons = [];
            }
            return {
                ...r,
                topReasons: reasons,
            };
        });
        return NextResponse.json({
            reports: formattedReports,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        console.error("API /api/reports error:", err);
        return NextResponse.json({ error: "Failed to retrieve scan reports" }, { status: 500 });
    }
}
