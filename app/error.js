"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
export default function Error({ error, reset, }) {
    useEffect(() => {
        console.error("ScholarShield runtime error:", error);
    }, [error]);
    return (<div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8"/>
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        An unexpected error occurred during processing. Please try resetting the operation or returning to the home portal.
      </p>
      <div className="flex items-center gap-3">
        <button onClick={() => reset()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
          <RefreshCw className="w-4 h-4"/>
          Try Again
        </button>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
          <Home className="w-4 h-4"/>
          Return Home
        </Link>
      </div>
    </div>);
}
