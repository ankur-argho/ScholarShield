import { NextResponse } from "next/server";
import { deleteSession, SESSION_COOKIE_NAME } from "../../../../lib/auth";
export async function POST(req) {
    try {
        const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (sessionToken) {
            await deleteSession(sessionToken);
        }
        const response = NextResponse.json({
            success: true,
            message: "Signed out successfully.",
        });
        const isHttps = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
        // Clear cookie
        response.cookies.set(SESSION_COOKIE_NAME, "", {
            httpOnly: true,
            secure: isHttps,
            sameSite: "lax",
            expires: new Date(0),
            path: "/",
            maxAge: 0,
        });
        return response;
    }
    catch (err) {
        console.error("API /api/auth/logout error:", err);
        return NextResponse.json({ error: "Failed to sign out." }, { status: 500 });
    }
}
