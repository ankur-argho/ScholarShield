import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "@/components/dashboard-charts";
import { DashboardTable } from "@/components/dashboard-table";
import { ShieldCheck, ShieldAlert, AlertTriangle, Activity, BarChart3 } from "lucide-react";
import { classifyRiskLevel } from "@/lib/types";
export const metadata = {
    title: "Scam Detection Analytics Dashboard — ScholarShield",
    description: "Explore scholarship scam statistics, risk score distributions, and comprehensive historical scan logs.",
};
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
    // 1. Fetch aggregate statistics
    const [totalScans, allReports] = await Promise.all([
        prisma.scanReport.count(),
        prisma.scanReport.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
        }),
    ]);
    // Classify each report using the centralized function
    let lowerCount = 0, moderateCount = 0, highCount = 0, criticalCount = 0;
    for (const r of allReports) {
        const level = classifyRiskLevel(r.riskScore);
        if (level === "LOWER_RISK")
            lowerCount++;
        else if (level === "MODERATE_RISK")
            moderateCount++;
        else if (level === "HIGH_RISK")
            highCount++;
        else
            criticalCount++;
    }
    const flaggedCount = moderateCount + highCount + criticalCount;
    const flaggedPercentage = totalScans > 0 ? Math.round((flaggedCount / totalScans) * 100) : 0;
    const avgRiskScore = totalScans > 0 ? Math.round(allReports.reduce((acc, r) => acc + r.riskScore, 0) / totalScans) : 0;
    // 2. Format chart data
    const riskDistribution = [
        { name: "Lower Risk", value: lowerCount, color: "#10b981" },
        { name: "Moderate Risk", value: moderateCount, color: "#f59e0b" },
        { name: "High Risk", value: highCount, color: "#ef4444" },
        { name: "Critical Risk", value: criticalCount, color: "#dc2626" },
    ];
    const categoryCounts = {
        "Payment Demands": 0,
        "Domain Spoofing": 0,
        "Fake Org Signals": 0,
        "Plagiarism": 0,
        "Urgency & PII": 0,
    };
    for (const r of allReports) {
        try {
            const flags = JSON.parse(r.flags);
            for (const flag of flags) {
                if (flag.category === "PAYMENT")
                    categoryCounts["Payment Demands"]++;
                else if (flag.category === "DOMAIN")
                    categoryCounts["Domain Spoofing"]++;
                else if (flag.category === "FAKE_ORG")
                    categoryCounts["Fake Org Signals"]++;
                else if (flag.category === "CONTENT")
                    categoryCounts["Plagiarism"]++;
                else if (flag.category === "LANGUAGE")
                    categoryCounts["Urgency & PII"]++;
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
    // Timeline chart grouped by date
    const timelineMap = new Map();
    // Reverse chronological for chart
    const chronReports = [...allReports].reverse();
    for (const r of chronReports) {
        const dStr = new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const cur = timelineMap.get(dStr) || { date: dStr, safe: 0, flagged: 0, total: 0 };
        cur.total++;
        const isLow = classifyRiskLevel(r.riskScore) === "LOWER_RISK";
        if (isLow)
            cur.safe++;
        else
            cur.flagged++;
        timelineMap.set(dStr, cur);
    }
    const timelineChart = Array.from(timelineMap.values());
    // 3. Format reports for table
    const formattedReports = allReports.map((r) => {
        let topReasons = [];
        try {
            topReasons = JSON.parse(r.topReasons);
        }
        catch {
            topReasons = [];
        }
        return {
            id: r.id,
            url: r.url,
            domain: r.domain,
            title: r.title,
            targetOrg: r.targetOrg,
            riskScore: r.riskScore,
            verdict: r.verdict,
            confidence: r.confidence,
            summary: r.summary,
            topReasons,
            createdAt: r.createdAt.toISOString(),
        };
    });
    return (<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent text-accent-foreground text-xs font-semibold">
          <BarChart3 className="w-4 h-4 text-primary"/>
          Real-Time Intelligence Dashboard
        </div>
        <h1 className="text-3xl sm:text-[34px] font-bold text-foreground tracking-tight">
          Scholarship Risk Analytics
        </h1>
        <p className="text-[15px] text-muted-foreground">
          Aggregated scan metrics, risk distributions, and searchable verification logs.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Scans</span>
            <Activity className="w-4 h-4 text-primary"/>
          </div>
          <div className="text-3xl font-bold text-foreground">{totalScans}</div>
          <p className="text-xs text-muted-foreground">Verified scholarship evaluations</p>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Scam Flag Rate</span>
            <AlertTriangle className="w-4 h-4 text-red-500"/>
          </div>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {flaggedPercentage}%
          </div>
          <p className="text-xs text-muted-foreground">{flaggedCount} opportunities flagged</p>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Lower Risk</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500"/>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {lowerCount}
          </div>
          <p className="text-xs text-muted-foreground">Standard verification recommended</p>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Risk Score</span>
            <ShieldAlert className="w-4 h-4 text-amber-500"/>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {avgRiskScore}
            <span className="text-sm font-normal text-muted-foreground">/100</span>
          </div>
          <p className="text-xs text-muted-foreground">Across all analyzed samples</p>
        </div>
      </div>

      {/* Visual Charts */}
      <DashboardCharts charts={{
            riskDistribution,
            categoriesChart,
            timelineChart,
        }}/>

      {/* Searchable History Table */}
      <DashboardTable initialReports={formattedReports}/>
    </div>);
}
