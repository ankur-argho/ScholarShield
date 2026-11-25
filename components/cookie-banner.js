"use client";

import { useState, useEffect } from "react";
import { Cookie, Shield, Lock, Settings, X, Sliders, Info } from "lucide-react";

const COOKIE_NAME = "scholarshield_cookie_consent";
const MAX_AGE_SECONDS = 15552000; // 180 days

/**
 * Reads a cookie value by name.
 */
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Sets an HTTP cookie with SameSite=Lax and max-age.
 */
function setCookie(name, value, maxAge = MAX_AGE_SECONDS) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  try {
    localStorage.setItem(name, value);
  } catch {
    // Local storage unavailable (private browsing)
  }
}

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Granular settings
  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check existing consent
    const existingConsent = getCookie(COOKIE_NAME);
    let parsed = null;
    if (existingConsent) {
      try {
        parsed = JSON.parse(existingConsent);
      } catch {
        parsed = null;
      }
    }

    if (parsed) {
      setPreferences(!!parsed.preferences);
      setAnalytics(!!parsed.analytics);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }

    // Listener to re-open modal from footer or anywhere in the app
    const handleOpen = () => {
      setShowModal(true);
    };

    window.addEventListener("scholarshield_open_cookie_preferences", handleOpen);
    return () => {
      window.removeEventListener("scholarshield_open_cookie_preferences", handleOpen);
    };
  }, []);

  const handleAcceptAll = () => {
    const payload = JSON.stringify({
      essential: true,
      preferences: true,
      analytics: true,
      timestamp: new Date().toISOString(),
    });
    setCookie(COOKIE_NAME, payload);
    setPreferences(true);
    setAnalytics(true);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleEssentialOnly = () => {
    const payload = JSON.stringify({
      essential: true,
      preferences: false,
      analytics: false,
      timestamp: new Date().toISOString(),
    });
    setCookie(COOKIE_NAME, payload);
    setPreferences(false);
    setAnalytics(false);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleSavePreferences = () => {
    const payload = JSON.stringify({
      essential: true,
      preferences,
      analytics,
      timestamp: new Date().toISOString(),
    });
    setCookie(COOKIE_NAME, payload);
    setShowBanner(false);
    setShowModal(false);
  };

  if (!mounted) return null;

  return (
    <>
      {/* ─── Bottom Non-Intrusive Banner ─────────────────────────────────── */}
      {showBanner && !showModal && (
        <div
          role="region"
          aria-label="Cookie consent banner"
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 no-print pointer-events-none"
        >
          <div className="max-w-5xl mx-auto pointer-events-auto bg-card/95 dark:bg-card/90 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-5 sm:p-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Text & Icon */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Cookie className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1.5 max-w-2xl">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Privacy &amp; Cookie Notice
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Zero 3rd-Party Ads
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ScholarShield uses strictly necessary session cookies for administrative authentication and security, plus optional preference storage (e.g. dark/light theme). We never use third-party marketing or cross-site tracking cookies.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="w-full sm:w-auto h-9 px-3.5 rounded-lg border border-border bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                  Customize
                </button>
                <button
                  type="button"
                  onClick={handleEssentialOnly}
                  className="w-full sm:w-auto h-9 px-4 rounded-lg border border-border bg-card hover:bg-muted/80 text-xs font-semibold text-foreground transition-colors shadow-sm"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Granular Cookie Preferences Modal ────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-modal-title"
            className="w-full max-w-xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 id="cookie-modal-title" className="text-base font-bold text-foreground">
                    Cookie &amp; Privacy Preferences
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Control how ScholarShield uses storage on your device
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close preferences"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Categories */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs divide-y divide-border/60">
              {/* Category 1: Strictly Necessary */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-foreground text-sm">
                      Strictly Necessary Cookies
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                    Always Active
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-6">
                  Essential for basic platform security, maintaining admin sessions (<code className="font-mono text-foreground/80">scholarshield_session</code>), and preserving safety against Cross-Site Request Forgery (CSRF). These cannot be disabled.
                </p>
              </div>

              {/* Category 2: Functional & Preferences */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <label htmlFor="pref-toggle" className="font-bold text-foreground text-sm cursor-pointer">
                      Functional &amp; UI Preferences
                    </label>
                  </div>
                  <input
                    id="pref-toggle"
                    type="checkbox"
                    checked={preferences}
                    onChange={(e) => setPreferences(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                  />
                </div>
                <p className="text-muted-foreground leading-relaxed pl-6">
                  Remembers your interface settings such as light/dark mode theme selection, layout density, and verification options so you don&apos;t have to reset them each visit.
                </p>
              </div>

              {/* Category 3: Local Analytics & Diagnostics */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <label htmlFor="analytics-toggle" className="font-bold text-foreground text-sm cursor-pointer">
                      Anonymous Scan Diagnostics
                    </label>
                  </div>
                  <input
                    id="analytics-toggle"
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                  />
                </div>
                <p className="text-muted-foreground leading-relaxed pl-6">
                  Helps our academic research team monitor scanner accuracy and performance heuristics locally without sending personal identifiable information to third parties.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="w-full sm:w-auto h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
              >
                Reject Non-Essential
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="w-full sm:w-auto h-9 px-4 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                >
                  Save Choices
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
