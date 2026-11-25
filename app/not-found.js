import Link from "next/link";
import { ShieldAlert, Home, Search } from "lucide-react";
export default function NotFound() {
    return (<div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
        <ShieldAlert className="w-9 h-9"/>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
        Report Not Found
      </h1>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        The requested scholarship verification report ID does not exist or may have expired. You can run a new scan or browse recent reports in the dashboard.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
          <Search className="w-4 h-4"/>
          Run New Scan
        </Link>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors">
          <Home className="w-4 h-4"/>
          View Dashboard
        </Link>
      </div>
    </div>);
}
