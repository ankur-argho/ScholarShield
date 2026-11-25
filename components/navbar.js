"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, LayoutDashboard, AlertTriangle, BookOpen, Search, LogIn, LogOut, ChevronDown, Menu, X, ShieldAlert, } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "./auth-context";
export function Navbar() {
    const pathname = usePathname();
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    // Close menus on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
    }, [pathname]);
    const navLinks = [
        { href: "/", label: "Checker", icon: Search },
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/report-scam", label: "Report Scam", icon: AlertTriangle },
        { href: "/learn", label: "Learn & FAQ", icon: BookOpen },
    ];
    const handleLogout = async () => {
        setIsUserMenuOpen(false);
        await logout();
    };
    return (<header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#142B4F] dark:bg-primary flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5"/>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-foreground flex items-center gap-2 leading-none">
              ScholarShield
              <span className="text-[11px] uppercase font-semibold px-1.5 py-0.5 rounded bg-accent text-accent-foreground border border-primary/20">
                Verify
              </span>
            </span>
            <span className="text-xs text-muted-foreground hidden xl:inline mt-0.5 leading-none">
              Academic Fraud Defense Portal
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (<Link key={item.href} href={item.href} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${isActive
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <Icon className="w-4 h-4"/>
                <span>{item.label}</span>
              </Link>);
        })}
        </nav>

        {/* Right Actions: Theme Toggle & Authentication */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {/* User Authentication Status */}
          {isLoading ? (<div className="w-24 h-9 rounded-lg bg-muted animate-pulse hidden sm:block"/>) : isAuthenticated && user ? (
        /* Authenticated User Menu */
        <div className="relative" ref={userMenuRef}>
              <button type="button" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2.5 h-9 px-3 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors text-sm font-medium" aria-expanded={isUserMenuOpen}>
                <div className="w-6 h-6 rounded-md bg-[#142B4F] dark:bg-primary text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user.name ? user.name[0] : user.email[0]}
                </div>
                <div className="hidden sm:flex items-center gap-2 text-left">
                  <span className="text-sm font-semibold leading-none truncate max-w-[120px]">
                    {user.name || user.email.split("@")[0]}
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-semibold uppercase leading-none">
                    {user.role}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground"/>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (<div className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-card p-2 shadow-lg space-y-1 z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{user.name || "Authenticated User"}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{user.email}</p>
                    <span className="mt-1.5 inline-block text-[11px] uppercase font-semibold px-2 py-0.5 rounded bg-accent text-accent-foreground">
                      Role: {user.role}
                    </span>
                  </div>

                  <Link href="/dashboard" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors">
                    <LayoutDashboard className="w-4 h-4 text-muted-foreground"/>
                    <span>Analytics Dashboard</span>
                  </Link>

                  <Link href="/report-scam" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors">
                    <ShieldAlert className="w-4 h-4 text-muted-foreground"/>
                    <span>Report Scam</span>
                  </Link>

                  <div className="pt-1 border-t border-border">
                    <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <LogOut className="w-4 h-4"/>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>)}
            </div>) : (
        /* Unauthenticated: Sign In Button */
        <Link href="/login" className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm transition-colors">
              <LogIn className="w-4 h-4"/>
              <span>Sign In</span>
            </Link>)}

          {/* Mobile Menu Toggle Button */}
          <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Toggle mobile menu">
            {isMobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (<div className="lg:hidden border-b border-border bg-card px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <nav className="space-y-1">
            {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (<Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                  <Icon className="w-4 h-4"/>
                  <span>{item.label}</span>
                </Link>);
            })}
          </nav>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {isAuthenticated && user ? (<div className="p-3 rounded-xl bg-muted/50 border border-border space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user.name ? user.name[0] : user.email[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">{user.name || "Authenticated"}</span>
                    <span className="text-[11px] text-muted-foreground font-mono truncate">{user.email}</span>
                  </div>
                </div>
                <button type="button" onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors">
                  <LogOut className="w-3.5 h-3.5"/>
                  <span>Sign Out</span>
                </button>
              </div>) : (<Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
                <LogIn className="w-4 h-4"/>
                <span>Sign In to ScholarShield</span>
              </Link>)}
          </div>
        </div>)}
    </header>);
}
