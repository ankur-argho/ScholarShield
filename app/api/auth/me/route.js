import { NextResponse } from "next/server";
import { validateSession, SESSION_COOKIE_NAME } from "../../../../lib/auth";
export async function GET(req) {
    try {
        const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (!sessionToken) {
            return NextResponse.json({ authenticated: false, user: null });
        }
        const user = await validateSession(sessionToken);
        if (!user) {
            return NextResponse.json({ authenticated: false, user: null });
        }
        return NextResponse.json({
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error("API /api/auth/me error:", err);
        return NextResponse.json({ authenticated: false, user: null });
    }
}
