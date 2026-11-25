"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Globe, FileText, Building2, AlertCircle, ShieldCheck, RotateCcw, } from "lucide-react";
const SCAN_STEPS = [
    "Resolving domain reputation & TLS security...",
    "Querying verified blacklist & typosquatting detection...",
    "Scanning for advance-fee requests, crypto & wire transfers...",
    "Cross-referencing organization with accredited registry...",
    "Executing 3-gram text shingling for plagiarism detection...",
    "Evaluating urgency pressure & identity theft markers...",
    "Synthesizing modular findings into final verification report...",
];
export function ScholarshipChecker() {
    const router = useRouter();
    const [url, setUrl] = useState("");
    const [text, setText] = useState("");
    const [targetOrg, setTargetOrg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [errorMessage, setErrorMessage] = useState(null);
    const handleClear = () => {
        setUrl("");
        setText("");
        setTargetOrg("");
        setErrorMessage(null);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        const cleanUrl = url.trim();
        const cleanText = text.trim();
        if (!cleanUrl && !cleanText) {
            setErrorMessage("Please enter either a scholarship website URL or paste its description to begin analysis.");
            return;
        }
        setIsLoading(true);
        setCurrentStepIndex(0);
        const interval = setInterval(() => {
            setCurrentStepIndex((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
        }, 700);
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: cleanUrl || undefined,
                    text: cleanText || undefined,
                    targetOrg: targetOrg.trim() || undefined,
                }),
            });
            const data = await res.json();
            clearInterval(interval);
            if (!res.ok) {
                throw new Error(data.error || "Analysis failed to complete");
            }
            router.push(`/report/${data.reportId}`);
        }
        catch (err) {
            clearInterval(interval);
            setIsLoading(false);
            const msg = err instanceof Error ? err.message : "An unexpected error occurred during verification.";
            setErrorMessage(msg);
        }
    };
    const hasInputs = !!(url || text || targetOrg);
    return (<div className="w-full">
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        {isLoading ? (<div className="p-10 sm:p-16 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"/>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-6 h-6 text-primary"/>
              </div>
            </div>

            <div className="space-y-2 max-w-lg">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-accent text-accent-foreground text-xs font-semibold">
                <ShieldCheck className="w-4 h-4"/>
                Active Security Verification
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Evaluating Scholarship Authenticity
              </h3>
              <p className="text-base font-medium text-primary min-h-[1.5rem]">
                {SCAN_STEPS[currentStepIndex]}
              </p>
              <p className="text-sm text-muted-foreground">
                Executing 5 specialized analyzers with SSRF defense and RDAP domain checks.
              </p>
            </div>

            <div className="w-full max-w-md bg-muted rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full transition-all duration-500 rounded-full" style={{
                width: `${((currentStepIndex + 1) / SCAN_STEPS.length) * 100}%`,
            }}/>
            </div>
          </div>) : (<div>
            {/* Corporate Card Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
                  <Search className="w-5 h-5 text-primary"/>
                  Scholarship Security Scanner
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter a scholarship website URL, sponsoring organization, or application text to generate a full risk assessment.
                </p>
              </div>

              {hasInputs && (<button type="button" onClick={handleClear} className="self-start sm:self-center inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors">
                  <RotateCcw className="w-4 h-4"/>
                  <span>Reset</span>
                </button>)}
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {errorMessage && (<div className="p-4 rounded-lg bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5"/>
                  <div className="space-y-0.5">
                    <p className="font-semibold">Unable to Begin Analysis</p>
                    <p>{errorMessage}</p>
                  </div>
                </div>)}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Field 1: Website URL */}
                  <div className="space-y-2">
                    <label htmlFor="scholarship-url" className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary"/>
                      Scholarship Website URL
                    </label>
                    <input id="scholarship-url" type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://foreign.fulbrightonline.org" className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-[15px] font-mono placeholder:text-muted-foreground placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"/>
                    <p className="text-xs text-muted-foreground">
                      Inspects domain age (RDAP), typosquatting, blacklists, SSL status, and official sponsor matching.
                    </p>
                  </div>

                  {/* Field 2: Claimed Awarding Organization */}
                  <div className="space-y-2">
                    <label htmlFor="claimed-org" className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary"/>
                      Claimed Awarding Organization{" "}
                      <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                    </label>
                    <input id="claimed-org" type="text" value={targetOrg} onChange={(e) => setTargetOrg(e.target.value)} placeholder="e.g., Fulbright Commission, Rhodes Trust, Tata Trusts" className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"/>
                    <p className="text-xs text-muted-foreground">
                      Cross-checks against 25+ accredited global scholarship bodies to detect brand spoofing.
                    </p>
                  </div>
                </div>

                {/* Field 3: Scholarship Description / Text */}
                <div className="space-y-2">
                  <label htmlFor="scholarship-text" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary"/>
                    Scholarship Description / Application Text{" "}
                    <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                  </label>
                  <textarea id="scholarship-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste application terms, award notification email, eligibility requirements, or payment instructions here..." className="w-full p-4 rounded-lg border border-border bg-background text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y leading-relaxed"/>
                  <p className="text-xs text-muted-foreground">
                    Detects upfront processing fees, wire transfer requests, cryptocurrency demands, and social engineering urgency.
                  </p>
                </div>

                {/* Submit Row */}
                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground">
                    Provide at least a website URL or pasted application text to run verification.
                  </p>
                  <button type="submit" disabled={isLoading} className="w-full sm:w-auto h-12 px-8 rounded-lg bg-primary text-white text-base font-semibold shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:pointer-events-none shrink-0">
                    <Search className="w-4 h-4"/>
                    <span>Verify Scholarship</span>
                  </button>
                </div>
              </form>
            </div>
          </div>)}
      </div>
    </div>);
}
