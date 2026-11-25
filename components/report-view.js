"use client";
import { useState } from "react";
import Link from "next/link";
import { Printer, AlertTriangle, Globe, CreditCard, Building2, FileCheck2, Flame, CheckCircle, XCircle, Info, Calendar, ExternalLink, ChevronDown, ChevronUp, Share2, Flag, ArrowLeft, ShieldQuestion, Eye, } from "lucide-react";
import { RiskGauge } from "./risk-gauge";
import { classifyRiskLevel, riskLevelLabel, REPORT_DISCLAIMER } from "@/lib/types";
/** Determine analysis mode label */
function analysisModeLabelFn(meta) {
    const hasUrl = !!meta?.url;
    const hasText = meta?.textLength > 0;
    if (hasUrl && hasText)
        return "URL and Text Analysis";
    if (hasUrl)
        return "URL Only Analysis";
    return "Text Only Analysis";
}
/** Evidence coverage display label */
function evidenceCoverageLabelFn(confidence) {
    switch (confidence) {
        case "SUBSTANTIAL": return "Substantial Evidence";
        case "PARTIAL": return "Partial Evidence";
        case "LIMITED": return "Limited Evidence";
        default: return confidence;
    }
}
/** SSL status display */
function sslStatusDisplay(meta) {
    const sslStatus = meta?.sslStatus;
    if (sslStatus === "AVAILABLE")
        return { label: "HTTPS Available", icon: "check" };
    if (sslStatus === "UNAVAILABLE")
        return { label: "HTTPS Unavailable", icon: "x" };
    // Fallback for old data with sslValid boolean
    const sslValid = meta?.sslValid;
    if (sslValid === true)
        return { label: "HTTPS Available", icon: "check" };
    if (sslValid === false)
        return { label: "HTTPS Unavailable", icon: "x" };
    return { label: "HTTPS status could not be checked", icon: "info" };
}
/** Domain age display */
function domainAgeDisplay(meta) {
    const days = meta?.domainAgeDays;
    if (days !== undefined && days !== null && typeof days === "number") {
        return `${days} days`;
    }
    return "Not Available — Registration information could not be verified";
}
/** Org verification display */
function orgVerificationDisplay(meta) {
    const status = meta?.orgVerification;
    if (status === "VERIFIED")
        return { label: "Verified", color: "text-emerald-600 dark:text-emerald-400" };
    if (status === "MISMATCH_DETECTED")
        return { label: "Mismatch Detected", color: "text-rose-600 dark:text-rose-400" };
    return { label: "Unverified", color: "text-amber-600 dark:text-amber-400" };
}
export function ReportView({ report }) {
    const [expandedAnalyzer, setExpandedAnalyzer] = useState(null);
    const [showRawText, setShowRawText] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [activeTab, setActiveTab] = useState("suspicious");
    const handlePrint = () => { window.print(); };
    const handleShare = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        }
    };
    const toggleAnalyzer = (name) => {
        setExpandedAnalyzer((prev) => (prev === name ? null : name));
    };
    // Classify using centralized function
    const riskLevel = classifyRiskLevel(report.riskScore);
    const isCritical = riskLevel === "CRITICAL_RISK";
    const isHigh = riskLevel === "HIGH_RISK";
    const isModerate = riskLevel === "MODERATE_RISK";
    const isLowerRisk = riskLevel === "LOWER_RISK";
    const isHighOrCritical = isHigh || isCritical;
    // Categorize flags by status
    const suspiciousFlags = report.flags.filter((f) => f.status === "SUSPICIOUS");
    const trustFlags = report.flags.filter((f) => f.status === "TRUST");
    const inconclusiveFlags = report.flags.filter((f) => f.status === "INCONCLUSIVE");
    // Refined verdict border & surface styling
    const verdictStyle = isCritical
        ? "border-red-500/40 bg-card shadow-lg shadow-red-950/5 ring-1 ring-red-500/20"
        : isHigh
            ? "border-rose-500/30 bg-card shadow-lg shadow-rose-950/5"
            : isModerate
                ? "border-amber-500/30 bg-card shadow-lg shadow-amber-950/5"
                : "border-emerald-500/30 bg-card shadow-lg shadow-emerald-950/5";
    // Actionable checklist based on risk level
    const whatToDoChecklist = isHighOrCritical
        ? [
            { title: "Exercise caution with payments", desc: "Verify any fee requirements through the scholarship provider's independently confirmed official channels before sending money.", danger: true },
            { title: "Protect your personal documents", desc: "Do not share identity documents, banking credentials, or PINs through unofficial channels.", danger: true },
            { title: "Verify with the official institution", desc: "If this program claims association with a known organization, contact their official website directly.", danger: false },
            { title: "Report suspicious listings", desc: "File a community alert to help other students evaluate this listing.", danger: false },
        ]
        : riskLevel === "MODERATE_RISK"
            ? [
                { title: "Seek secondary verification", desc: "Ask your guidance counselor or university financial aid office to review this listing.", danger: false },
                { title: "Check official accreditation", desc: "Verify if the awarding body has a registered educational charity number or tax ID.", danger: false },
                { title: "Watch for fee requests", desc: "If they introduce processing or visa charges in subsequent correspondence, verify independently.", danger: true },
            ]
            : [
                { title: "Standard verification recommended", desc: "No significant suspicious indicators were detected. Standard verification through official sources is still recommended.", danger: false },
                { title: "Review application requirements", desc: "Prepare your documents and submit through the official portal.", danger: false },
                { title: "Confirm deadline dates", desc: "Double check deadlines on the official awarding website to ensure timely submission.", danger: false },
            ];
    const analyzers = [
        { id: "domain", title: "Domain & Host Analysis", icon: Globe, maxPts: "25", result: report.analyzerResults?.domain },
        { id: "payment", title: "Payment Demand Analysis", icon: CreditCard, maxPts: "25", result: report.analyzerResults?.payment },
        { id: "fakeOrg", title: "Organization Verification", icon: Building2, maxPts: "15", result: report.analyzerResults?.fakeOrg },
        { id: "content", title: "Content Similarity", icon: FileCheck2, maxPts: "15", result: report.analyzerResults?.content },
        { id: "language", title: "Language & Credential Risk", icon: Flame, maxPts: "35", result: report.analyzerResults?.language },
    ];
    const ssl = sslStatusDisplay(report.metadata);
    const orgVerif = orgVerificationDisplay(report.metadata);
    return (<div className="max-w-7xl mx-auto space-y-8 pb-16 print-page">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 no-print">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4"/>
          Back to Scholarship Checker
        </Link>
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={handleShare} className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
            <Share2 className="w-4 h-4"/>
            {copiedLink ? "Link Copied!" : "Share Report"}
          </button>
          <button onClick={handlePrint} className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
            <Printer className="w-4 h-4"/>
            Print / Export PDF
          </button>
          {isHighOrCritical && (<Link href={`/report-scam?url=${encodeURIComponent(report.url || "")}&org=${encodeURIComponent(report.targetOrg || "")}`} className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm">
              <Flag className="w-4 h-4"/>
              Report to Community
            </Link>)}
        </div>
      </div>

      {/* Summary Card */}
      <div className={`rounded-xl border p-6 sm:p-8 shadow-sm transition-all ${verdictStyle}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Radial Gauge */}
          <div className="flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-border/80">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Composite Risk Score
            </span>
            <RiskGauge score={report.riskScore} verdict={report.verdict}/>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="w-3.5 h-3.5"/>
              <span>Evidence Coverage:</span>
              <span className="font-semibold text-foreground px-2 py-0.5 rounded bg-muted">
                {evidenceCoverageLabelFn(report.confidence)}
              </span>
            </div>
          </div>

          {/* Verdict Summary */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isCritical
            ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
            : isHigh
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                : isLowerRisk
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"}`}>
                  {riskLevelLabel(riskLevel)}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5"/>
                  {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                  {analysisModeLabelFn(report.metadata)}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {report.title || "Scholarship Verification Report"}
              </h1>

              {report.domain && (<div className="flex items-center gap-1.5 text-xs text-primary font-medium pt-1">
                  <Globe className="w-3.5 h-3.5"/>
                  <span>{report.domain}</span>
                  {report.url && (<a href={report.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 ml-1">
                      <ExternalLink className="w-3 h-3"/>
                    </a>)}
                </div>)}
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed font-medium bg-card/60 p-4 rounded-xl border border-border/80">
              {report.summary}
            </p>

            {/* Top Diagnostic Findings */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Key Diagnostic Findings:
              </span>
              <ul className="space-y-1.5 text-xs">
                {report.topReasons.map((reason, idx) => {
                  const isPositiveTrust =
                    reason.startsWith("No ") ||
                    reason.startsWith("Zero ") ||
                    reason.includes("Verified Official") ||
                    reason.includes("Authentic Text Verified");

                  return (
                    <li key={idx} className="flex items-start gap-2">
                      {isPositiveTrust ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <span className="text-foreground leading-normal">{reason}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Information Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground">HTTPS Status</span>
          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
            {ssl.icon === "check" && <CheckCircle className="w-4 h-4 text-emerald-500"/>}
            {ssl.icon === "x" && <XCircle className="w-4 h-4 text-rose-500"/>}
            {ssl.icon === "info" && <Info className="w-4 h-4 text-muted-foreground"/>}
            {ssl.label}
          </p>
          <p className="text-[10px] text-muted-foreground">Informational only</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground">Domain Age</span>
          <p className="text-sm font-bold text-foreground">
            {domainAgeDisplay(report.metadata)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground">Organization</span>
          <p className={`text-sm font-bold ${orgVerif.color}`}>
            {orgVerif.label}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground">Contact Emails</span>
          <p className="text-sm font-bold text-foreground truncate">
            {report.metadata?.contactEmails?.length
            ? report.metadata.contactEmails[0]
            : "None detected"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground">Content Inspected</span>
          <p className="text-sm font-bold text-foreground">
            {report.metadata?.textLength || report.rawText.length} chars
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground">Indicators</span>
          <p className="text-sm font-bold text-foreground">
            <span className="text-rose-500">{suspiciousFlags.length}</span>
            {" / "}
            <span className="text-emerald-500">{trustFlags.length}</span>
            {" / "}
            <span className="text-muted-foreground">{inconclusiveFlags.length}</span>
          </p>
          <p className="text-[10px] text-muted-foreground">Suspicious / Trust / Inconclusive</p>
        </div>
      </div>

      {/* Categorized Findings Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-lg font-bold text-foreground">Diagnostic Findings</h2>
          <span className="text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/60">
            Scoring Note: Individual flag points roll into Category Subscore Caps to determine the final score
          </span>
        </div>
        <div className="flex items-center gap-2 border-b border-border pb-2">
          {([
            { key: "suspicious", label: "Suspicious Indicators", count: suspiciousFlags.length, color: "text-rose-600" },
            { key: "trust", label: "Trust Indicators", count: trustFlags.length, color: "text-emerald-600" },
            { key: "inconclusive", label: "Inconclusive Checks", count: inconclusiveFlags.length, color: "text-muted-foreground" },
        ]).map((tab) => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors ${activeTab === tab.key
                ? "bg-primary text-white shadow-sm font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"}`}>
              {tab.label} ({tab.count})
            </button>))}
        </div>

        <div className="space-y-2">
          {(activeTab === "suspicious" ? suspiciousFlags : activeTab === "trust" ? trustFlags : inconclusiveFlags).map((flag, idx) => (<div key={idx} className="p-4 rounded-xl bg-card border border-border/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">{flag.title}</span>
                <div className="flex items-center gap-2">
                  {flag.scoreContribution > 0 && (<span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded">
                      +{flag.scoreContribution} pts
                    </span>)}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${flag.severity === "CRITICAL"
                ? "bg-rose-600 text-white"
                : flag.severity === "HIGH"
                    ? "bg-rose-500/10 text-rose-600"
                    : flag.severity === "MEDIUM"
                        ? "bg-amber-500/10 text-amber-600"
                        : flag.severity === "LOW"
                            ? "bg-slate-500/10 text-slate-600"
                            : "bg-blue-500/10 text-blue-600"}`}>
                    {flag.severity}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">{flag.description}</p>
              {flag.evidence && (<p className="text-[11px] font-mono bg-muted p-1.5 rounded text-foreground/80">
                  {flag.evidence}
                </p>)}
              {flag.limitations && (<p className="text-[11px] text-muted-foreground italic flex items-start gap-1">
                  <ShieldQuestion className="w-3 h-3 shrink-0 mt-0.5"/>
                  <span>Limitation: {flag.limitations}</span>
                </p>)}
            </div>))}
          {(activeTab === "suspicious" ? suspiciousFlags : activeTab === "trust" ? trustFlags : inconclusiveFlags).length === 0 && (<p className="text-xs text-muted-foreground flex items-center gap-1.5 py-4">
              <CheckCircle className="w-4 h-4 text-emerald-500"/>
              No {activeTab === "suspicious" ? "suspicious indicators" : activeTab === "trust" ? "trust indicators" : "inconclusive checks"} in this category.
            </p>)}
        </div>
      </div>

      {/* Modular Analyzers Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Analyzer Breakdown</h2>
          <span className="text-xs text-muted-foreground">Click any analyzer to inspect details</span>
        </div>

        <div className="space-y-3">
          {analyzers.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedAnalyzer === item.id;
            const result = item.result;
            const maxVal = parseInt(item.maxPts, 10);
            const contribution = Math.min(maxVal, Math.max(0, result?.scoreContribution ?? 0));
            const flags = result?.flags ?? [];
            const evidence = result?.evidence ?? [];
            let badgeColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
            if (contribution >= 15)
                badgeColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400";
            else if (contribution >= 5)
                badgeColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400";
            return (<div key={item.id} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all">
                <button type="button" onClick={() => toggleAnalyzer(item.id)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5"/>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        {item.title}
                        <span className="text-[11px] font-normal text-muted-foreground">(Max: {item.maxPts} pts)</span>
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {flags.filter(f => f.status === "SUSPICIOUS").length > 0
                    ? `${flags.filter(f => f.status === "SUSPICIOUS").length} suspicious indicator${flags.filter(f => f.status === "SUSPICIOUS").length > 1 ? "s" : ""}`
                    : "No suspicious indicators detected"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
                      +{contribution}/{item.maxPts}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground"/> : <ChevronDown className="w-4 h-4 text-muted-foreground"/>}
                  </div>
                </button>

                {isExpanded && (<div className="px-5 pb-5 pt-3 border-t border-border/80 space-y-4 bg-muted/20">
                    <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground bg-card/80 p-2.5 rounded-lg border border-border/70">
                      <span>Category Final Contribution: <strong className="text-foreground">+{contribution} pts</strong></span>
                      <span>Category Maximum Cap: <strong className="text-foreground">{item.maxPts} pts</strong></span>
                      <span>Uncapped Raw Flags Sum: <strong className="text-foreground">{result?.score ?? 0} pts</strong></span>
                    </div>
                    {flags.length > 0 ? (<div className="space-y-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Findings:</span>
                        <div className="space-y-2">
                          {flags.map((flag, idx) => (<div key={idx} className="p-3 rounded-xl bg-card border border-border/80 space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-foreground">{flag.title}</span>
                                <div className="flex items-center gap-1.5">
                                  {flag.scoreContribution > 0 && (<span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">+{flag.scoreContribution}</span>)}
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${flag.severity === "CRITICAL" ? "bg-rose-600 text-white"
                                : flag.severity === "HIGH" ? "bg-rose-500/10 text-rose-600"
                                    : flag.severity === "MEDIUM" ? "bg-amber-500/10 text-amber-600"
                                        : "bg-slate-500/10 text-slate-600"}`}>
                                    {flag.severity}
                                  </span>
                                </div>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">{flag.description}</p>
                              {flag.evidence && (<p className="text-[11px] font-mono bg-muted p-1.5 rounded text-foreground/80 mt-1">{flag.evidence}</p>)}
                              {flag.limitations && (<p className="text-[10px] text-muted-foreground italic mt-1">⚠ {flag.limitations}</p>)}
                            </div>))}
                        </div>
                      </div>) : (<p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500"/>
                        No findings from this analyzer.
                      </p>)}

                    {evidence.length > 0 && (<div className="space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evidence Summary:</span>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                          {evidence.map((ev, i) => (<li key={i}>{ev}</li>))}
                        </ul>
                      </div>)}
                  </div>)}
              </div>);
        })}
        </div>
      </div>

      {/* Actionable Student Advice */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Info className="w-5 h-5 text-primary"/>
          Recommended Next Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {whatToDoChecklist.map((item, i) => (<div key={i} className={`p-4 rounded-2xl border text-xs space-y-1 ${item.danger ? "border-rose-500/30 bg-rose-500/[0.03]" : "border-border bg-muted/20"}`}>
              <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                {item.danger ? <XCircle className="w-4 h-4 text-rose-500"/> : <CheckCircle className="w-4 h-4 text-primary"/>}
                {item.title}
              </h4>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-2">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5"/>
          Important Disclaimer
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {REPORT_DISCLAIMER}
        </p>
      </div>

      {/* Raw Text Inspector */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Scanned Content Snippet</h3>
          <button type="button" onClick={() => setShowRawText(!showRawText)} className="text-xs font-semibold text-primary hover:underline">
            {showRawText ? "Collapse text" : "Expand text"}
          </button>
        </div>
        <div className={`font-mono text-xs text-muted-foreground bg-muted p-4 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed ${showRawText ? "max-h-96" : "max-h-24 overflow-hidden"}`}>
          {report.rawText}
        </div>
      </div>
    </div>);
}
