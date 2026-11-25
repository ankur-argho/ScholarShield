import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyRiskLevel } from "@/lib/types";
export async function GET() {
    try {
        const [totalScans, reports] = await Promise.all([
            prisma.scanReport.count(),
            prisma.scanReport.findMany({
                select: {
                    riskScore: true,
                    verdict: true,
                    flags: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "asc" },
            }),
        ]);
        let lowerCount = 0;
        let moderateCount = 0;
        let highRiskCount = 0;
        let criticalCount = 0;
        for (const r of reports) {
            const level = classifyRiskLevel(r.riskScore);
            if (level === "LOWER_RISK")
                lowerCount++;
            else if (level === "MODERATE_RISK")
                moderateCount++;
            else if (level === "HIGH_RISK")
                highRiskCount++;
            else
                criticalCount++;
        }
        const flaggedCount = moderateCount + highRiskCount + criticalCount;
        const flaggedPercentage = totalScans > 0 ? Math.round((flaggedCount / totalScans) * 100) : 0;
        const totalScoreSum = reports.reduce((acc, curr) => acc + curr.riskScore, 0);
        const averageRiskScore = totalScans > 0 ? Math.round(totalScoreSum / totalScans) : 0;
        // 1. Risk Distribution Data for Pie / Donut Chart
        const riskDistribution = [
            { name: "Lower Risk", value: lowerCount, color: "#10b981" },
            { name: "Moderate Risk", value: moderateCount, color: "#f59e0b" },
            { name: "High Risk", value: highRiskCount, color: "#ef4444" },
            { name: "Critical Risk", value: criticalCount, color: "#dc2626" },
        ];
        // 2. Count flags by category for Bar Chart
        const categoryCounts = {
            "Payment Demands": 0,
            "Domain & Brand": 0,
            "Fake Org & Contacts": 0,
            "Plagiarized Text": 0,
            "High-Pressure Language": 0,
        };
        for (const report of reports) {
            try {
                const parsedFlags = JSON.parse(report.flags);
                for (const flag of parsedFlags) {
                    if (flag.category === "PAYMENT")
                        categoryCounts["Payment Demands"]++;
                    else if (flag.category === "DOMAIN")
                        categoryCounts["Domain & Brand"]++;
                    else if (flag.category === "FAKE_ORG")
                        categoryCounts["Fake Org & Contacts"]++;
                    else if (flag.category === "CONTENT")
                        categoryCounts["Plagiarized Text"]++;
                    else if (flag.category === "LANGUAGE")
                        categoryCounts["High-Pressure Language"]++;
                }
            }
            catch {
                // ignore parse errors
            }
        }
        const categoriesChart = Object.entries(categoryCounts).map(([category, count]) => ({
            category,
            count,
        }));
        // 3. Activity Timeline (grouped by day)
        const timelineMap = new Map();
        for (const r of reports) {
            const dateStr = new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const current = timelineMap.get(dateStr) || { date: dateStr, safe: 0, flagged: 0, total: 0 };
            current.total++;
            if (classifyRiskLevel(r.riskScore) === "LOWER_RISK")
                current.safe++;
            else
                current.flagged++;
            timelineMap.set(dateStr, current);
        }
        const timelineChart = Array.from(timelineMap.values());
        return NextResponse.json({
            summary: {
                totalScans,
                safeCount: lowerCount,
                suspiciousCount: moderateCount,
                highRiskCount: highRiskCount + criticalCount,
                flaggedPercentage,
                averageRiskScore,
            },
            charts: {
                riskDistribution,
                categoriesChart,
                timelineChart,
            },
        });
    }
    catch (err) {
        console.error("API /api/stats error:", err);
        return NextResponse.json({ error: "Failed to fetch dashboard statistics" }, { status: 500 });
    }
}
