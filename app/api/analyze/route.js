import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { runScholarshipAnalysis } from "@/lib/engine";
const analyzeSchema = z
    .object({
    url: z.string().trim().optional(),
    text: z.string().trim().optional(),
    targetOrg: z.string().trim().optional(),
})
    .refine((data) => (data.url && data.url.length > 0) || (data.text && data.text.length > 0), {
    message: "Please provide either a scholarship URL or a text description to analyze.",
    path: ["url"],
});
export async function POST(req) {
    try {
        // 1. Rate limiting check
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        const { allowed, remaining } = checkRateLimit(`analyze-${clientIp}`, 25, 60 * 1000);
        if (!allowed) {
            return NextResponse.json({ error: "Rate limit exceeded. Please wait a minute before submitting another scan." }, { status: 429, headers: { "Retry-After": "60" } });
        }
        // 2. Validate request body
        const body = await req.json();
        const parseResult = analyzeSchema.safeParse(body);
        if (!parseResult.success) {
            const errorMsg = parseResult.error.errors[0]?.message || "Invalid input parameters.";
            return NextResponse.json({ error: errorMsg }, { status: 400 });
        }
        const { url, text, targetOrg } = parseResult.data;
        // Optional URL format check if URL is provided
        if (url && url.length > 0) {
            try {
                const parsedUrl = new URL(url);
                if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
                    return NextResponse.json({ error: "Scholarship URL must start with http:// or https://" }, { status: 400 });
                }
            }
            catch {
                return NextResponse.json({ error: "Invalid scholarship URL format. Please include http:// or https://" }, { status: 400 });
            }
        }
        // 3. Execute analysis engine
        const execution = await runScholarshipAnalysis({
            url,
            text,
            targetOrg,
        });
        return NextResponse.json({
            success: true,
            reportId: execution.reportId,
            analysis: execution.analysis,
            remainingQuota: remaining,
        });
    }
    catch (err) {
        console.error("API /api/analyze error:", err);
        const message = err instanceof Error ? err.message : "Internal analysis error occurred";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
