import { prisma } from "@/lib/prisma";
import { CommunityReportForm } from "@/components/community-report-form";
import { ShieldAlert, AlertTriangle, Globe, Calendar, CheckCircle2 } from "lucide-react";
export const metadata = {
    title: "Report a Scholarship Scam — ScholarShield Blacklist",
    description: "Protect international students by reporting fraudulent scholarship programs, fake university bursaries, and advance-fee grant scams.",
};
export const dynamic = "force-dynamic";
export default async function ReportScamPage() {
    const [reports, badDomainsCount] = await Promise.all([
        prisma.communityReport.findMany({
            orderBy: { createdAt: "desc" },
            take: 15,
        }),
        prisma.knownBadDomain.count(),
    ]);
    return (<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4"/>
          Community Fraud Defense Network
        </div>
        <h1 className="text-3xl sm:text-[34px] font-bold text-foreground tracking-tight">
          Report a Suspicious Scholarship
        </h1>
        <p className="text-[15px] text-muted-foreground">
          Encountered a fake grant, fee demand, or phishing link? Report it to help keep our automated detection blacklist updated.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Reporting Form */}
        <div className="lg:col-span-2">
          <CommunityReportForm />
        </div>

        {/* Right: Blacklist Stats & Live Feed */}
        <div className="space-y-6">
          {/* Blacklist Status Card */}
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Network Blacklist Status
            </span>
            <div className="text-3xl font-bold text-foreground flex items-baseline gap-2">
              {badDomainsCount}
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                Blocked Domains
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every domain reported is placed in PENDING_REVIEW until verified by administrators before being added to our active detection blacklist.
            </p>
          </div>

          {/* Recent Community Flagged Feed */}
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500"/>
              Recently Flagged Opportunities
            </h3>

            <div className="space-y-3">
              {reports.length > 0 ? (reports.map((report) => (<div key={report.id} className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-foreground truncate max-w-[170px]">
                        {report.orgName || report.domain}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-400 shrink-0">
                        {report.scamType.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono truncate">
                      <Globe className="w-3.5 h-3.5 text-primary shrink-0"/>
                      <span>{report.domain}</span>
                    </div>

                    <p className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">
                      &ldquo;{report.description}&rdquo;
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3"/>
                        {new Date(report.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            })}
                      </span>
                      {report.status === "VERIFIED" ? (<span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3"/> Blacklisted
                        </span>) : report.status === "REJECTED" ? (<span className="flex items-center gap-1 text-muted-foreground font-semibold">
                          Rejected
                        </span>) : (<span className="flex items-center gap-1 text-amber-500 font-semibold">
                          Pending Review
                        </span>)}
                    </div>
                  </div>))) : (<p className="text-xs text-muted-foreground">No community reports yet.</p>)}
            </div>
          </div>
        </div>
      </div>
    </div>);
}
