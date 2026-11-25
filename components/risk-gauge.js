"use client";
import { classifyRiskLevel, riskLevelLabel } from "@/lib/types";
/** Color config for each risk level */
function getColors(level) {
    switch (level) {
        case "CRITICAL_RISK":
            return { stroke: "#dc2626", bg: "rgba(220, 38, 38, 0.1)", text: "text-red-600 dark:text-red-400" };
        case "HIGH_RISK":
            return { stroke: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", text: "text-rose-600 dark:text-rose-400" };
        case "MODERATE_RISK":
            return { stroke: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", text: "text-amber-600 dark:text-amber-400" };
        case "LOWER_RISK":
            return { stroke: "#10b981", bg: "rgba(16, 185, 129, 0.1)", text: "text-emerald-600 dark:text-emerald-400" };
    }
}
export function RiskGauge({ score, size = 180 }) {
    // Constrain score between 0 and 100
    const clampedScore = Math.min(100, Math.max(0, score));
    // Use the centralized classification function
    const level = classifyRiskLevel(clampedScore);
    const label = riskLevelLabel(level);
    const colors = getColors(level);
    // Circular math: half donut arch
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = Math.PI * radius; // for 180-degree semicircle
    const strokeDashoffset = circumference - (clampedScore / 100) * circumference;
    return (<div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size / 1.7} viewBox={`0 0 ${size} ${size / 1.7}`} className="overflow-visible">
        {/* Background semicircle track */}
        <path d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`} fill="none" stroke="currentColor" className="text-muted/60" strokeWidth={strokeWidth} strokeLinecap="round"/>

        {/* Dynamic risk score fill arc */}
        <path d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`} fill="none" stroke={colors.stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out"/>
      </svg>

      {/* Numerical score & verdict in center */}
      <div className="mt-1 flex flex-col items-center text-center">
        <span className="text-4xl font-extrabold tracking-tight text-foreground">
          {clampedScore}
          <span className="text-sm font-normal text-muted-foreground">/100</span>
        </span>
        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mt-1 ${colors.text}`} style={{ backgroundColor: colors.bg }}>
          {label}
        </span>
      </div>
    </div>);
}
