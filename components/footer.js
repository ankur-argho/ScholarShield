"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
export function Footer() {
    const openCookiePreferences = () => {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("scholarshield_open_cookie_preferences"));
        }
    };

    return (<footer className="w-full border-t border-border bg-card mt-auto text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#142B4F] dark:bg-primary flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4"/>
              </div>
              <span className="font-bold text-base text-foreground">ScholarShield Portal</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              ScholarShield is an academic scholarship verification and fraud detection platform analyzing domain provenance, advance-fee demands, organization credentials, content plagiarism, and social engineering patterns.
            </p>
            <div className="text-xs text-muted-foreground bg-muted/70 px-3.5 py-2.5 rounded-lg border border-border max-w-lg">
              <strong className="text-foreground">Disclaimer:</strong> Results are automated preliminary risk assessments intended for educational guidance. Always verify international scholarships with university financial aid advisors.
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-3.5">
              Platform Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Scholarship Checker
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Risk Analytics Dashboard
                </Link>
              </li>
              <li>
                <Link href="/report-scam" className="hover:text-foreground transition-colors">
                  Community Scam Reporting
                </Link>
              </li>
              <li>
                <Link href="/learn" className="hover:text-foreground transition-colors">
                  Scam Prevention Guide &amp; FAQ
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="hover:text-foreground transition-colors text-left cursor-pointer"
                >
                  Cookie Policy &amp; Settings
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-3.5">
              Verification Architecture
            </h4>
            <ul className="space-y-2 text-sm">
              <li>RDAP &amp; Typosquatting Analysis</li>
              <li>Advance-Fee &amp; Payment Guard</li>
              <li>Accredited Sponsor Registry</li>
              <li>3-Gram Content Plagiarism Engine</li>
              <li>SSRF-Protected Live Inspection</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <p>© {new Date().getFullYear()} ScholarShield. Academic Security &amp; Verification Platform.</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCookiePreferences}
              className="hover:text-foreground transition-colors underline underline-offset-4 cursor-pointer"
            >
              Cookie Preferences
            </button>
            <span className="text-border">•</span>
            <p>Evidence-Based Automated Risk Assessment</p>
          </div>
        </div>
      </div>
    </footer>);
}
