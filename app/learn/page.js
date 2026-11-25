import { LearnFaqAndDirectory } from "@/components/learn-faq";
import { ShieldAlert, HelpCircle, AlertTriangle, CreditCard, Lock, Mail, Zap, BookOpen, } from "lucide-react";
export const metadata = {
    title: "Scholarship Scam Prevention Guide & FAQ — ScholarShield",
    description: "Comprehensive guide for students on how to identify advance-fee fraud, look-alike scholarship domains, and protect personal credentials.",
};
export default function LearnPage() {
    const redFlags = [
        {
            num: "01",
            title: "Application, Processing, or 'Registration' Fees",
            desc: "Legitimate scholarships are awarded to give students funding, never to collect money from applicants. If any listing asks for $30, $75, or €100 for 'application processing' or 'file opening', it is advance-fee fraud.",
            icon: CreditCard,
        },
        {
            num: "02",
            title: "100% Guaranteed Approval (No Grades or Essay)",
            desc: "Real academic awards are competitive. Claims like 'everyone qualifies', 'guaranteed selection', or 'no GPA cutoff required' are casting broad nets to find vulnerable victims.",
            icon: Zap,
        },
        {
            num: "03",
            title: "Pre-Selected for 'Unclaimed Funds'",
            desc: "You cannot be selected for an award you never applied for. The 'billions in unclaimed scholarship money' lure is a classic tactic used to convince victims they have free money waiting.",
            icon: AlertTriangle,
        },
        {
            num: "04",
            title: "Requests for Bank Logins, Passwords, or PINs",
            desc: "While legitimate scholarships disburse funds via direct bank transfer after formal award ceremonies, they NEVER ask for your internet banking password, debit card PIN, or OTP verification code.",
            icon: Lock,
        },
        {
            num: "05",
            title: "Commercial Free Email Addresses (@gmail.com, @yahoo.com)",
            desc: "Official government and university scholarship officers never correspond via free webmail providers. Official communication comes from registered institutional domains like @state.gov, @chevening.org, or university .edu addresses.",
            icon: Mail,
        },
        {
            num: "06",
            title: "Payments via Gift Cards, Crypto, or Western Union",
            desc: "Scammers request untraceable payment channels (Steam cards, Apple vouchers, Bitcoin, USDT, or Western Union cash pickups) that cannot be traced or refunded by consumer banks.",
            icon: CreditCard,
        },
        {
            num: "07",
            title: "Look-Alike Domains & Typosquatting (.xyz, .top)",
            desc: "Fraudulent campaigns register domains mimicking renowned schemes (e.g., fulbright-grants.xyz instead of fulbrightprogram.org) to deceive visitors who glance quickly at the address bar.",
            icon: ShieldAlert,
        },
    ];
    const verificationSteps = [
        {
            step: "1",
            title: "Inspect the Address Bar",
            desc: "Check the exact domain and TLD. Look out for hyphens, typos, and extensions like .xyz, .top, or .click instead of .org, .edu, or official government ccTLDs.",
        },
        {
            step: "2",
            title: "Search the Scholarship on Google with Quotes",
            desc: "Search the exact program name in quotation marks (e.g. \"Global Youth Grant\") plus the word \"scam\" or \"review\" to see if consumer forums or university advisories have flagged it.",
        },
        {
            step: "3",
            title: "Verify the Organization's Physical Headquarters",
            desc: "A legitimate foundation or trust has a verifiable physical office address and listed phone numbers. Search their physical address on Google Maps to confirm its existence.",
        },
        {
            step: "4",
            title: "Cross-Check with University Financial Aid",
            desc: "Before submitting any personal data, email the link to your campus international student office or financial aid advisor for second-opinion confirmation.",
        },
        {
            step: "5",
            title: "Remember the Golden Rule",
            desc: "If at any point they demand money, a refundable deposit, or gift cards to release your scholarship, immediately close the tab and report the site.",
        },
    ];
    return (<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent text-accent-foreground text-xs font-semibold">
          <BookOpen className="w-4 h-4 text-primary"/>
          Educational Resource Portal
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          How to Spot Scholarship Scams
        </h1>
        <p className="text-base sm:text-[17px] text-muted-foreground leading-relaxed">
          Fraudulent grant programs target hopeful undergraduate and international students.
          Learn the seven primary warning signs and how to verify any opportunity in five simple steps.
        </p>
      </div>

      {/* The Golden Rule Banner */}
      <div className="p-8 sm:p-10 rounded-xl bg-[#142B4F] text-white shadow-sm space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 text-blue-200 text-xs font-semibold">
          <HelpCircle className="w-4 h-4"/>
          The Fundamental Law of Scholarships
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          &ldquo;Scholarships give you money; they never ask you for money.&rdquo;
        </h2>
        <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-3xl">
          Legitimate granting foundations, universities, and foreign ministries fund students because they believe in educational access.
          They do not charge application processing fees, interview scheduling charges, or refundable insurance deposits.
        </p>
      </div>

      {/* 7 Classic Red Flags Grid */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            7 Classic Scholarship Scam Red Flags
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            If you encounter any of these patterns, exercise extreme caution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {redFlags.map((flag) => {
            const Icon = flag.icon;
            return (<div key={flag.num} className="p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-primary">{flag.num}</span>
                    <Icon className="w-5 h-5 text-red-500"/>
                  </div>
                  <h3 className="font-bold text-foreground text-[17px] leading-snug">{flag.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{flag.desc}</p>
                </div>
              </div>);
        })}
        </div>
      </section>

      {/* 5-Step Verification Checklist */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            5-Step Student Verification Checklist
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Follow this protocol whenever evaluating an unfamiliar scholarship announcement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {verificationSteps.map((v) => (<div key={v.step} className="p-5 rounded-xl bg-card border border-border shadow-sm flex flex-col space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#142B4F] dark:bg-primary text-white font-bold text-sm flex items-center justify-center">
                {v.step}
              </div>
              <h3 className="font-bold text-foreground text-base leading-snug">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>))}
        </div>
      </section>

      {/* Verified Directory & FAQs */}
      <LearnFaqAndDirectory />
    </div>);
}
