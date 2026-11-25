"use client";
import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) {
        return (<button aria-label="Toggle theme" className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
        <div className="w-5 h-5"/>
      </button>);
    }
    const isDark = resolvedTheme === "dark";
    return (<button onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} title={isDark ? "Switch to light mode" : "Switch to dark mode"} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
      {isDark ? <Sun className="w-5 h-5 text-amber-400"/> : <Moon className="w-5 h-5 text-slate-700"/>}
    </button>);
}
