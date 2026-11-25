"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, } from "recharts";
export function DashboardCharts({ charts }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) {
        return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-72 rounded-3xl bg-card border border-border animate-pulse"/>
        <div className="h-72 rounded-3xl bg-card border border-border animate-pulse"/>
        <div className="h-72 rounded-3xl bg-card border border-border animate-pulse"/>
      </div>);
    }
    const { riskDistribution, categoriesChart, timelineChart } = charts;
    return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Risk Distribution Donut Chart */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-1 mb-2">
          <h3 className="text-base font-bold text-foreground">Risk Verdict Distribution</h3>
          <p className="text-xs text-muted-foreground">Proportion of Safe vs Flagged scans</p>
        </div>

        <div className="h-52 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {riskDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
              </Pie>
              <Tooltip contentStyle={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            borderRadius: "0.75rem",
            fontSize: "12px",
        }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-around pt-3 border-t border-border/80 text-xs">
          {riskDistribution.map((item) => (<div key={item.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}/>
              <span className="text-muted-foreground">{item.name}:</span>
              <span className="font-bold text-foreground">{item.value}</span>
            </div>))}
        </div>
      </div>

      {/* 2. Top Scam Flag Categories Bar Chart */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-1 mb-2">
          <h3 className="text-base font-bold text-foreground">Scam Indicators by Category</h3>
          <p className="text-xs text-muted-foreground">Total flags triggered across scans</p>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoriesChart} layout="vertical" margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15}/>
              <XAxis type="number" fontSize={11} stroke="currentColor" opacity={0.6}/>
              <YAxis type="category" dataKey="category" fontSize={10} width={100} stroke="currentColor" opacity={0.8}/>
              <Tooltip contentStyle={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            borderRadius: "0.75rem",
            fontSize: "12px",
        }}/>
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-3 border-t border-border/80 text-[11px] text-muted-foreground text-center">
          Payment demands & domain spoofing are the most frequent fraud markers.
        </div>
      </div>

      {/* 3. Scan Activity Timeline Area Chart */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-1 mb-2">
          <h3 className="text-base font-bold text-foreground">Scan Activity Over Time</h3>
          <p className="text-xs text-muted-foreground">Safe vs Flagged submissions trend</p>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineChart} margin={{ left: -25, right: 10 }}>
              <defs>
                <linearGradient id="flaggedColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="safeColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15}/>
              <XAxis dataKey="date" fontSize={11} stroke="currentColor" opacity={0.6}/>
              <YAxis fontSize={11} stroke="currentColor" opacity={0.6}/>
              <Tooltip contentStyle={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            borderRadius: "0.75rem",
            fontSize: "12px",
        }}/>
              <Area type="monotone" dataKey="flagged" stroke="#ef4444" fillOpacity={1} fill="url(#flaggedColor)"/>
              <Area type="monotone" dataKey="safe" stroke="#10b981" fillOpacity={1} fill="url(#safeColor)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-4 pt-3 border-t border-border/80 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>
            <span className="text-muted-foreground">Safe Scans</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"/>
            <span className="text-muted-foreground">Flagged Scams</span>
          </div>
        </div>
      </div>
    </div>);
}
