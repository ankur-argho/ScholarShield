"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, ExternalLink, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert, AlertTriangle, } from "lucide-react";
import { classifyRiskLevel, riskLevelLabel } from "@/lib/types";
export function DashboardTable({ initialReports }) {
    const [search, setSearch] = useState("");
    const [selectedVerdict, setSelectedVerdict] = useState("ALL");
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;
    // Filter and sort reports
    const filteredReports = useMemo(() => {
        return initialReports
            .filter((r) => {
            // Verdict filter
            if (selectedVerdict !== "ALL" && r.verdict !== selectedVerdict) {
                return false;
            }
            // Search query filter
            if (search) {
                const q = search.toLowerCase();
                const titleMatch = r.title?.toLowerCase().includes(q) || false;
                const domainMatch = r.domain?.toLowerCase().includes(q) || false;
                const orgMatch = r.targetOrg?.toLowerCase().includes(q) || false;
                const summaryMatch = r.summary?.toLowerCase().includes(q) || false;
                return titleMatch || domainMatch || orgMatch || summaryMatch;
            }
            return true;
        })
            .sort((a, b) => {
            if (sortBy === "date") {
                const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                return sortOrder === "desc" ? diff : -diff;
            }
            else {
                const diff = b.riskScore - a.riskScore;
                return sortOrder === "desc" ? diff : -diff;
            }
        });
    }, [initialReports, search, selectedVerdict, sortBy, sortOrder]);
    const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
    const paginatedReports = filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
        }
        else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };
    return (<div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Controls Header */}
      <div className="p-6 border-b border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Scanned Opportunities History</h3>
            <p className="text-xs text-muted-foreground">
              Showing {filteredReports.length} recorded scholarship verification scans
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input type="text" value={search} onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
        }} placeholder="Search domain, title, or keyword..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"/>
          </div>
        </div>

        {/* Verdict Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            { id: "ALL", label: "All Scans" },
            { id: "LOWER_RISK", label: "Lower Risk" },
            { id: "MODERATE_RISK", label: "Moderate Risk" },
            { id: "HIGH_RISK", label: "High Risk" },
            { id: "CRITICAL_RISK", label: "Critical Risk" },
        ].map((tab) => (<button key={tab.id} onClick={() => {
                setSelectedVerdict(tab.id);
                setCurrentPage(1);
            }} className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors ${selectedVerdict === tab.id
                ? "bg-primary text-white shadow-sm font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"}`}>
              {tab.label}
            </button>))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-5">Scholarship / Domain</th>
              <th className="py-3 px-4 cursor-pointer hover:text-foreground" onClick={() => toggleSort("score")}>
                <div className="flex items-center gap-1">
                  Risk Score
                  <ArrowUpDown className="w-3.5 h-3.5"/>
                </div>
              </th>
              <th className="py-3 px-4">Verdict</th>
              <th className="py-3 px-4 hidden md:table-cell">Primary Finding</th>
              <th className="py-3 px-4 cursor-pointer hover:text-foreground" onClick={() => toggleSort("date")}>
                <div className="flex items-center gap-1">
                  Date
                  <ArrowUpDown className="w-3.5 h-3.5"/>
                </div>
              </th>
              <th className="py-3 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginatedReports.length > 0 ? (paginatedReports.map((report) => {
            const level = classifyRiskLevel(report.riskScore);
            const isLower = level === "LOWER_RISK";
            const isHighOrCritical = level === "HIGH_RISK" || level === "CRITICAL_RISK";
            return (<tr key={report.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        <p className="font-bold text-foreground text-xs line-clamp-1">
                          {report.title || "Scholarship Scan"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {report.domain || "Text-only Scan"}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-sm">
                      <span className={level === "CRITICAL_RISK"
                    ? "text-red-600 dark:text-red-400"
                    : level === "HIGH_RISK"
                        ? "text-rose-600 dark:text-rose-400"
                        : isLower
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"}>
                        {report.riskScore}
                        <span className="text-[10px] text-muted-foreground font-normal">/100</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${level === "CRITICAL_RISK"
                    ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25"
                    : level === "HIGH_RISK"
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        : isLower
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"}`}>
                        {isHighOrCritical && <ShieldAlert className="w-3 h-3"/>}
                        {isLower && <ShieldCheck className="w-3 h-3"/>}
                        {!isHighOrCritical && !isLower && <AlertTriangle className="w-3 h-3"/>}
                        {riskLevelLabel(level)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 hidden md:table-cell text-muted-foreground max-w-xs truncate">
                      {report.topReasons?.[0] || report.summary}
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                      {new Date(report.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                })}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <Link href={`/report/${report.id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-primary hover:bg-muted transition-colors">
                        View
                        <ExternalLink className="w-3 h-3"/>
                      </Link>
                    </td>
                  </tr>);
        })) : (<tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No scan records matching your filter.
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
            <ChevronLeft className="w-4 h-4"/>
          </button>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
            <ChevronRight className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>);
}
