import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { verifyPassword, createSession, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "../../../../lib/auth";
import { checkRateLimit } from "../../../../lib/rate-limit";
const loginSchema = z.object({
    email: z.string().trim().email({ message: "Please provide a valid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
export async function POST(req) {
    try {
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        // Strict authentication rate limiting: 5 attempts per 60 seconds
        const { allowed } = checkRateLimit(`auth-login-${clientIp}`, 5, 60 * 1000);
        if (!allowed) {
            return NextResponse.json({ error: "Too many login attempts. Please wait 1 minute before trying again." }, { status: 429 });
        }
        const body = await req.json();
        const parseResult = loginSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({ error: parseResult.error.errors[0]?.message || "Invalid input parameters." }, { status: 400 });
        }
        const { email, password } = parseResult.data;
        const normalizedEmail = email.toLowerCase();
        // Look up user
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            // Use uniform message to avoid account enumeration
            return NextResponse.json({ error: "Invalid email or password. Please check your credentials." }, { status: 401 });
        }
        // Verify password hash
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid email or password. Please check your credentials." }, { status: 401 });
        }
        // Create session in DB
        const { token, expiresAt } = await createSession(user.id);
        // Prepare response with secure HttpOnly cookie
        const response = NextResponse.json({
            success: true,
            message: "Authentication successful.",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
        const isHttps = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
        response.cookies.set(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            secure: isHttps,
            sameSite: "lax",
            expires: expiresAt,
            path: "/",
            maxAge: Math.floor(SESSION_DURATION_MS / 1000),
        });
        return response;
    }
    catch (err) {
        console.error("API /api/auth/login error:", err);
        return NextResponse.json({ error: "An unexpected authentication error occurred." }, { status: 500 });
    }
}
