"use client";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Search, ExternalLink, ShieldCheck, Globe } from "lucide-react";
import legitScholarships from "@/lib/data/legit-scholarships.json";
const FAQS = [
    {
        question: "Do legitimate scholarships ever ask for an application or processing fee?",
        answer: "No. Almost all legitimate government, university, and philanthropic scholarships are completely free to apply for. If a portal demands an 'evaluation fee', 'registration fee', 'document stamping fee', or 'handling charge', it is virtually guaranteed to be an advance-fee fraud scam.",
    },
    {
        question: "Why do scammers ask for payments via Western Union, Crypto, or Gift Cards?",
        answer: "These payment methods are irreversible and pseudonymous. Once money is transferred via Western Union or sent to a Bitcoin/USDT wallet, the funds cannot be refunded or charged back. Academic institutions exclusively process disbursements and fees through recognized bank accounts with published Swift codes and institutional merchant portals.",
    },
    {
        question: "How can I verify if an official-sounding scholarship email is genuine?",
        answer: "1) Check the sender email domain: legitimate programs will never email you from @gmail.com, @yahoo.com, or @hotmail.com. 2) Inspect the domain extension: national and university programs use .edu, .gov, .org, or official national ccTLDs (e.g. .ac.uk, .go.jp). 3) Search for the exact wording in quotation marks to check if it has been flagged on fraud alert forums.",
    },
    {
        question: "What is 'typosquatting' in scholarship scams?",
        answer: "Typosquatting occurs when scammers register a domain name very similar to a prestigious scholarship (e.g. 'fulbright-grants.xyz' or 'chevening-direct.com' instead of official 'fulbrightprogram.org' or 'chevening.org'). ScholarShield uses Levenshtein distance algorithms to measure and flag these deceptive look-alikes.",
    },
    {
        question: "Can I receive a scholarship if I never submitted an application?",
        answer: "No. You cannot win a scholarship or grant that you never applied for. Emails claiming you have been 'pre-selected' or that 'unclaimed funds are waiting in your name' are classic social engineering lures designed to extract fees or banking credentials.",
    },
    {
        question: "What should I do if I already paid a scammer or sent my passport details?",
        answer: "1) If you paid by bank card, immediately call your bank fraud department to freeze the card. 2) If you provided passwords, change all passwords immediately and enable 2-Factor Authentication (2FA). 3) If you sent passport or government ID scans, file an identity theft report with your national police or consumer protection agency (such as identitytheft.gov in the US or Action Fraud in the UK).",
    },
];
export function LearnFaqAndDirectory() {
    const [openFaqIndex, setOpenFaqIndex] = useState(0);
    const [searchDir, setSearchDir] = useState("");
    const toggleFaq = (index) => {
        setOpenFaqIndex((prev) => (prev === index ? null : index));
    };
    // Filter legitimate scholarship directory
    const filteredDirectory = useMemo(() => {
        if (!searchDir.trim())
            return legitScholarships;
        const q = searchDir.toLowerCase();
        return legitScholarships.filter((s) => s.name.toLowerCase().includes(q) ||
            s.organization.toLowerCase().includes(q) ||
            s.country.toLowerCase().includes(q) ||
            s.officialDomain.toLowerCase().includes(q));
    }, [searchDir]);
    return (<div className="space-y-16">
      {/* 1. Verified Scholarship Directory */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500"/>
              Verified Legitimate Scholarships Directory
            </h2>
            <p className="text-xs text-muted-foreground">
              Official reference directory of 25+ world-renowned scholarships and their authentic domains.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input type="text" value={searchDir} onChange={(e) => setSearchDir(e.target.value)} placeholder="Filter by country, name, or domain..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"/>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDirectory.map((sch) => (<div key={sch.id} className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-all space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {sch.country}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3 text-primary"/>
                    {sch.officialDomain}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-sm line-clamp-1">{sch.name}</h3>
                <p className="text-xs text-muted-foreground">{sch.organization}</p>
                <p className="text-[11px] text-muted-foreground/90 line-clamp-2 pt-1">
                  {sch.description}
                </p>
              </div>

              <div className="pt-2 border-t border-border/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[170px]">
                  {sch.coverage}
                </span>
                <a href={sch.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-[11px]">
                  Visit Portal
                  <ExternalLink className="w-3 h-3"/>
                </a>
              </div>
            </div>))}
        </div>
      </section>

      {/* 2. Interactive FAQ Accordion */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-muted-foreground">
            Common questions answered by education and fraud prevention specialists.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (<div key={index} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all">
                <button type="button" onClick={() => toggleFaq(index)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/40 transition-colors">
                  <span className="text-sm font-bold text-foreground pr-4">
                    {faq.question}
                  </span>
                  {isOpen ? (<ChevronUp className="w-4 h-4 text-primary shrink-0"/>) : (<ChevronDown className="w-4 h-4 text-muted-foreground shrink-0"/>)}
                </button>
                {isOpen && (<div className="px-5 pb-5 pt-1 border-t border-border/60 text-xs text-muted-foreground leading-relaxed bg-muted/20">
                    {faq.answer}
                  </div>)}
              </div>);
        })}
        </div>
      </section>
    </div>);
}
