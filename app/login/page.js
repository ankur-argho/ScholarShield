"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle2, Globe2, Search, KeyRound, } from "lucide-react";
import { useAuth } from "@/components/auth-context";
export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    useEffect(() => {
        if (isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, router]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        if (!email.trim() || !password) {
            setErrorMessage("Please enter both your email and password.");
            return;
        }
        setIsLoading(true);
        try {
            const result = await login(email.trim(), password);
            if (result.success) {
                router.push("/dashboard");
            }
            else {
                setErrorMessage(result.error || "Invalid email or password.");
            }
        }
        catch {
            setErrorMessage("An unexpected error occurred. Please try again.");
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleFillDemo = (demoEmail, demoPass) => {
        setEmail(demoEmail);
        setPassword(demoPass);
        setErrorMessage(null);
    };
    return (<div className="min-h-[calc(100vh-4.25rem)] flex items-center justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-5xl rounded-xl border border-border bg-card shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Deep Navy Corporate Branding Section */}
        <div className="lg:col-span-5 bg-[#142B4F] p-8 sm:p-10 text-white flex flex-col justify-between">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5"/>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                ScholarShield
              </span>
            </Link>

            <div className="space-y-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 text-blue-200 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5"/>
                Authorized Security Portal
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                Defending Academic Aid with Verified Intelligence
              </h2>
              <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed">
                ScholarShield equips academic evaluators, security teams, and university advisors with multi-layered scholarship fraud detection.
              </p>
            </div>
          </div>

          {/* Core Feature Highlights */}
          <div className="space-y-4 py-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                <Globe2 className="w-4 h-4"/>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Domain Provenance Verification</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Real-time RDAP age checks and anti-spoofing heuristics.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4"/>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Advance-Fee Scam Defense</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Flags upfront processing fees, wire requests, and crypto demands.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                <Search className="w-4 h-4"/>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Accredited Registry Matching</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cross-checks against 25+ certified international scholarship bodies.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/15 text-xs text-slate-300 flex items-center justify-between">
            <span>HttpOnly Session Auth</span>
            <span>Scrypt Password Hashing</span>
          </div>
        </div>

        {/* Right Column: Clean Corporate Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-card">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Sign In to ScholarShield
              </h1>
              <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                Access your verification reports, analytics dashboard, and threat moderation tools.
              </p>
            </div>

            {errorMessage && (<div className="p-4 rounded-lg bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5"/>
                <div className="space-y-0.5">
                  <span className="font-semibold">Authentication Failed</span>
                  <p>{errorMessage}</p>
                </div>
              </div>)}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary"/>
                  Email Address
                </label>
                <input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@university.edu or admin@scholarshield.org" className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" required/>
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary"/>
                  Password
                </label>
                <div className="relative">
                  <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full h-11 px-4 pr-11 rounded-lg border border-border bg-background text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" required/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full h-12 px-4 rounded-lg bg-primary text-white text-base font-semibold shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none">
                {isLoading ? (<>
                    <Loader2 className="w-4 h-4 animate-spin"/>
                    <span>Verifying Credentials...</span>
                  </>) : (<>
                    <span>Sign In to ScholarShield</span>
                    <ArrowRight className="w-4 h-4"/>
                  </>)}
              </button>
            </form>

            {/* Quick Evaluator Credentials */}
            <div className="pt-4 border-t border-border space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5 text-primary"/>
                Evaluator / Testing Accounts
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button type="button" onClick={() => handleFillDemo("admin@scholarshield.org", "ScholarShield2026!")} className="p-3 rounded-lg border border-border bg-muted/40 hover:bg-muted text-left transition-colors space-y-1">
                  <div className="text-sm font-semibold text-foreground flex items-center justify-between">
                    <span>Security Lead</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-semibold">
                      ADMIN
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    admin@scholarshield.org
                  </div>
                </button>

                <button type="button" onClick={() => handleFillDemo("auditor@scholarshield.org", "Auditor2026!")} className="p-3 rounded-lg border border-border bg-muted/40 hover:bg-muted text-left transition-colors space-y-1">
                  <div className="text-sm font-semibold text-foreground flex items-center justify-between">
                    <span>QA Auditor</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold">
                      AUDITOR
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    auditor@scholarshield.org
                  </div>
                </button>
              </div>
            </div>

            <div className="text-center pt-1">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                <span>Back to Public Scholarship Scanner</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
