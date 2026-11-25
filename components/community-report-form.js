"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Send, ShieldAlert, Lock } from "lucide-react";
export function CommunityReportForm() {
    const searchParams = useSearchParams();
    const initialUrl = searchParams.get("url") || "";
    const initialOrg = searchParams.get("org") || "";
    const [url, setUrl] = useState(initialUrl);
    const [orgName, setOrgName] = useState(initialOrg);
    const [scamType, setScamType] = useState("APPLICATION_FEE");
    const [description, setDescription] = useState("");
    const [evidenceNotes, setEvidenceNotes] = useState("");
    const [reporterEmail, setReporterEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        if (!url.trim()) {
            setErrorMessage("Please enter the suspicious scholarship URL.");
            return;
        }
        if (!description.trim() || description.trim().length < 10) {
            setErrorMessage("Please provide a description of at least 10 characters explaining why this is suspicious.");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch("/api/report-scam", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: url.trim(),
                    orgName: orgName.trim() || undefined,
                    scamType,
                    description: description.trim(),
                    evidenceNotes: evidenceNotes.trim() || undefined,
                    reporterEmail: reporterEmail.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to submit report");
            }
            setIsSuccess(true);
            setUrl("");
            setOrgName("");
            setDescription("");
            setEvidenceNotes("");
            setReporterEmail("");
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to submit report.";
            setErrorMessage(msg);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
      {isSuccess ? (<div className="py-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8"/>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground">Scam Report Submitted</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Thank you for protecting fellow students. Your report has been submitted with status <span className="font-semibold text-amber-500">PENDING_REVIEW</span>. An authorized administrator will verify the evidence before adding the domain to the confirmed blacklist.
            </p>
          </div>
          <button type="button" onClick={() => setIsSuccess(false)} className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
            Submit Another Report
          </button>
        </div>) : (<form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500"/>
              File a Suspicious Scholarship Alert
            </h2>
            <p className="text-xs text-muted-foreground">
              Submitted reports enter PENDING_REVIEW and are verified by administrators before being confirmed to the active blacklist.
            </p>
          </div>

          {errorMessage && (<div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0"/>
              <span>{errorMessage}</span>
            </div>)}

          {/* URL Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Suspicious Scholarship URL <span className="text-rose-500">*</span>
            </label>
            <input type="text" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://scam-scholarship-portal.xyz/apply" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Claimed Organization */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Claimed Organization</label>
              <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g., Global Youth Grant Foundation" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"/>
            </div>

            {/* Scam Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Observed Scam Type <span className="text-rose-500">*</span>
              </label>
              <select value={scamType} onChange={(e) => setScamType(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                <option value="APPLICATION_FEE">Upfront Fee / Processing Charge Demand</option>
                <option value="IDENTITY_THEFT">Identity Theft (Passport / SSN / Bank PIN)</option>
                <option value="IMPERSONATION">Brand Impersonation (Fulbright, Chevening, etc.)</option>
                <option value="FAKE_ORG">Fictitious Organization / Bogus Authority</option>
                <option value="OTHER">Other Suspicious Activity</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              What Happened? <span className="text-rose-500">*</span>
            </label>
            <textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain the red flags you noticed (e.g. asked for $100 via Western Union, redirected to WhatsApp, offered 100% guarantee)..." className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y"/>
          </div>

          {/* Evidence Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Evidence Notes (Optional)
            </label>
            <input type="text" value={evidenceNotes} onChange={(e) => setEvidenceNotes(e.target.value)} placeholder="e.g. WhatsApp number +234..., sender email scamdesk@gmail.com, crypto address" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"/>
          </div>

          {/* Optional Reporter Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Your Email (Optional, kept strictly confidential)</span>
              <span className="text-[10px] text-muted-foreground font-normal flex items-center gap-1">
                <Lock className="w-3 h-3"/> Anonymous submission permitted
              </span>
            </label>
            <input type="email" value={reporterEmail} onChange={(e) => setReporterEmail(e.target.value)} placeholder="student@university.edu" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"/>
          </div>

          <button type="submit" disabled={isLoading} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50">
            {isLoading ? (<>
                <Loader2 className="w-4 h-4 animate-spin"/>
                Submitting Scam Alert...
              </>) : (<>
                <Send className="w-4 h-4"/>
                Submit Scam Alert to Blacklist
              </>)}
          </button>
        </form>)}
    </div>);
}
