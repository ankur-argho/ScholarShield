import Link from "next/link";
import { ShieldCheck, Globe2, CreditCard, Building2, FileCheck2, AlertTriangle, ArrowRight, HelpCircle, Lock, CheckCircle2, Search, } from "lucide-react";
import { ScholarshipChecker } from "@/components/scholarship-checker";
const ANALYZERS = [
    {
        name: "Domain Provenance",
        icon: Globe2,
        description: "Checks typosquatting (Levenshtein distance), high-risk TLDs, brand spoofing, and RDAP registration age.",
        weight: "Max: 25 pts",
    },
    {
        name: "Payment Demands",
        icon: CreditCard,
        description: "Identifies upfront application fees, refundable deposits, wire transfers, crypto wallets, and gift cards.",
        weight: "Max: 25 pts",
    },
    {
        name: "Organization Verification",
        icon: Building2,
        description: "Flags unverified free webmail contacts and cross-references 25+ accredited global scholarship bodies.",
        weight: "Max: 15 pts",
    },
    {
        name: "Content Plagiarism",
        icon: FileCheck2,
        description: "Uses 3-gram shingling and Jaccard similarity to spot legitimate scholarship copy cloned onto deceptive domains.",
        weight: "Max: 15 pts",
    },
    {
        name: "Suspicious Language",
        icon: AlertTriangle,
        description: "Uncovers artificial countdown urgency, guaranteed-award claims, and sensitive credential phishing.",
        weight: "Max: 10 pts",
    },
];
export default function HomePage() {
    return (<div className="flex flex-col">
      {/* Two-Column Corporate Hero Section */}
      <section className="w-full bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Headline, Description, CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-semibold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-primary"/>
                <span>Academic Cybersecurity &amp; Aid Verification</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-bold tracking-tight text-foreground leading-[1.12]">
                Verify Scholarships. Detect Scams.{" "}
                <span className="text-primary">Protect Your Future.</span>
              </h1>

              <p className="text-base sm:text-[17px] text-muted-foreground max-w-2xl leading-relaxed">
                ScholarShield helps students identify suspicious scholarship opportunities through intelligent domain analysis, payment detection, organization verification, and content inspection.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <a href="#scanner" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-primary text-white text-base font-semibold hover:bg-primary/90 shadow-sm transition-colors">
                  <Search className="w-4 h-4"/>
                  <span>Verify Scholarship</span>
                </a>
                <Link href="/learn" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg border border-border bg-background text-foreground text-base font-semibold hover:bg-muted transition-colors">
                  <span>Learn About Scholarship Scams</span>
                  <ArrowRight className="w-4 h-4"/>
                </Link>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/>
                  Evidence-Based Scoring
                </span>
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary"/>
                  SSRF-Protected Inspection
                </span>
                <span className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-primary"/>
                  25+ Accredited Registries
                </span>
              </div>
            </div>

            {/* Right Column: Clean Corporate Security Verification Preview */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-border bg-background shadow-md overflow-hidden">
                <div className="bg-[#142B4F] px-5 py-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-blue-300"/>
                    <span className="font-semibold text-sm">Verification Pipeline Overview</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-white/15 text-blue-100 font-medium">
                    5-Stage Engine
                  </span>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="space-y-3">
                    {[
            {
                label: "Domain & RDAP Provenance",
                detail: "Typosquatting, domain age, blacklist status",
                status: "Active",
            },
            {
                label: "Upfront Payment Detection",
                detail: "Processing fees, wire, gift cards & crypto",
                status: "Active",
            },
            {
                label: "Accredited Sponsor Matching",
                detail: "Official registry & contact verification",
                status: "Active",
            },
            {
                label: "Content & Language Audit",
                detail: "3-gram plagiarism & urgency heuristics",
                status: "Active",
            },
        ].map((item) => (<div key={item.label} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded bg-accent text-accent-foreground">
                          {item.status}
                        </span>
                      </div>))}
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>Preliminary Risk Assessment</span>
                    <span className="font-semibold text-foreground">0–100 Composite Score</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Scholarship Checker Section */}
      <section id="scanner" className="w-full py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScholarshipChecker />
        </div>
      </section>

      {/* 5 Modular Analyzers Section */}
      <section className="w-full bg-card border-y border-border py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Modular Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-foreground tracking-tight">
              Multi-Layered Detection Engine
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Every submission is evaluated across five independent analytical modules combining domain intelligence, financial red-flag matching, and text similarity scoring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {ANALYZERS.map((analyzer) => {
            const Icon = analyzer.icon;
            return (<div key={analyzer.name} className="p-6 rounded-xl bg-background border border-border flex flex-col justify-between hover:border-primary/40 transition-colors">
                  <div className="space-y-3.5">
                    <div className="w-10 h-10 rounded-lg bg-accent text-[#142B4F] dark:text-blue-300 flex items-center justify-center">
                      <Icon className="w-5 h-5"/>
                    </div>
                    <h3 className="font-bold text-foreground text-[17px] leading-snug">
                      {analyzer.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analyzer.description}
                    </p>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-border text-xs font-semibold text-[#142B4F] dark:text-blue-300 flex items-center justify-between">
                    <span>Contribution Cap</span>
                    <span>{analyzer.weight}</span>
                  </div>
                </div>);
        })}
          </div>
        </div>
      </section>

      {/* Fundamental Rule Callout Banner */}
      <section className="w-full py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl p-8 sm:p-10 bg-[#142B4F] text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 text-blue-200 text-xs font-semibold">
                <HelpCircle className="w-4 h-4"/>
                <span>The Fundamental Rule of Scholarships</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                &ldquo;Scholarships give you money; they never ask you for money.&rdquo;
              </h3>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                Legitimate sponsors award aid based on merit, need, or civic contribution. Any demand for an application clearance charge, processing fee, or wire deposit warrants independent verification.
              </p>
            </div>
            <Link href="/learn" className="shrink-0 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-primary text-white font-semibold text-base hover:bg-primary/90 transition-colors">
              <span>Read Scam Spotting Guide</span>
              <ArrowRight className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </section>
    </div>);
}
