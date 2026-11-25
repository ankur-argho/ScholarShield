import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReportView } from "@/components/report-view";
export async function generateMetadata({ params }) {
    const { id } = await params;
    const report = await prisma.scanReport.findUnique({
        where: { id },
        select: { title: true, verdict: true, domain: true },
    });
    if (!report) {
        return { title: "Report Not Found — ScholarShield" };
    }
    return {
        title: `${report.title || "Scholarship Scan"} (${report.verdict}) — ScholarShield Report`,
        description: `ScholarShield verification result for ${report.domain || "scholarship"}: ${report.verdict}.`,
    };
}
/** Default analyzer result when JSON parsing fails */
function defaultAnalyzerResult(name, maxContribution) {
    return {
        analyzerName: name,
        score: 0,
        maxContribution,
        scoreContribution: 0,
        flags: [],
        evidence: [],
    };
}
export default async function ReportPage({ params }) {
    const { id } = await params;
    const report = await prisma.scanReport.findUnique({
        where: { id },
    });
    if (!report) {
        notFound();
    }
    // Parse JSON fields stored in SQLite
    let topReasons = [];
    let analyzerResults = {
        domain: defaultAnalyzerResult("Domain Analyzer", 25),
        payment: defaultAnalyzerResult("Payment Demand Analyzer", 25),
        fakeOrg: defaultAnalyzerResult("Organization Verification", 15),
        content: defaultAnalyzerResult("Copied Content Analyzer", 15),
        language: defaultAnalyzerResult("Suspicious Language Analyzer", 10),
    };
    let flags = [];
    let metadata = {};
    try {
        topReasons = JSON.parse(report.topReasons);
    }
    catch {
        topReasons = [];
    }
    try {
        analyzerResults = JSON.parse(report.analyzerResults);
    }
    catch {
        // fallback default
    }
    try {
        flags = JSON.parse(report.flags);
    }
    catch {
        flags = [];
    }
    try {
        metadata = report.metadata ? JSON.parse(report.metadata) : {};
    }
    catch {
        metadata = {};
    }
    const formattedReport = {
        ...report,
        verdict: report.verdict,
        confidence: report.confidence,
        topReasons,
        analyzerResults,
        flags,
        metadata,
        createdAt: report.createdAt.toISOString(),
    };
    return (<div className="w-full px-4 sm:px-6 lg:px-8 py-10">
      <ReportView report={formattedReport}/>
    </div>);
}
