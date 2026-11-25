import { describe, it, expect, beforeEach } from "vitest";
import { hashPassword, verifyPassword } from "../lib/auth";
import { POST as loginPOST } from "../app/api/auth/login/route";
import { GET as meGET } from "../app/api/auth/me/route";
import { POST as logoutPOST } from "../app/api/auth/logout/route";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";
describe("ScholarShield Authentication System", () => {
    const testEmail = "authtest@scholarshield.org";
    const testPassword = "SecurePassword2026!";
    beforeEach(async () => {
        await prisma.session.deleteMany({
            where: { user: { email: testEmail } },
        });
        await prisma.user.deleteMany({
            where: { email: testEmail },
        });
    });
    it("hashes passwords securely using scrypt with unique salt", async () => {
        const hash1 = await hashPassword(testPassword);
        const hash2 = await hashPassword(testPassword);
        expect(hash1).not.toBe(testPassword);
        // Unique salt produces distinct hashes
        expect(hash1).not.toBe(hash2);
        // Verify both match
        expect(await verifyPassword(testPassword, hash1)).toBe(true);
        expect(await verifyPassword(testPassword, hash2)).toBe(true);
        expect(await verifyPassword("WrongPassword!", hash1)).toBe(false);
    });
    it("handles valid login and rejects invalid login", async () => {
        const passwordHash = await hashPassword(testPassword);
        await prisma.user.create({
            data: {
                email: testEmail,
                name: "Auth Test User",
                passwordHash,
                role: "USER",
            },
        });
        // 1. Invalid credentials test
        const badReq = new NextRequest("http://localhost:3000/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email: testEmail, password: "WrongPassword123" }),
        });
        const badRes = await loginPOST(badReq);
        expect(badRes.status).toBe(401);
        // 2. Valid credentials test
        const goodReq = new NextRequest("http://localhost:3000/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email: testEmail, password: testPassword }),
        });
        const goodRes = await loginPOST(goodReq);
        expect(goodRes.status).toBe(200);
        const data = await goodRes.json();
        expect(data.success).toBe(true);
        expect(data.user.email).toBe(testEmail);
        // Check session cookie was set
        const setCookie = goodRes.headers.get("set-cookie");
        expect(setCookie).toContain("scholarshield_session");
    });
    it("validates session via /api/auth/me and handles /api/auth/logout", async () => {
        const passwordHash = await hashPassword(testPassword);
        const user = await prisma.user.create({
            data: {
                email: testEmail,
                name: "Session Test User",
                passwordHash,
                role: "ADMIN",
            },
        });
        // Create a login session
        const loginReq = new NextRequest("http://localhost:3000/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email: testEmail, password: testPassword }),
        });
        const loginRes = await loginPOST(loginReq);
        const cookieHeader = loginRes.headers.get("set-cookie") || "";
        const sessionToken = cookieHeader.split("scholarshield_session=")[1]?.split(";")[0];
        expect(sessionToken).toBeDefined();
        // Test /api/auth/me with session cookie
        const meReq = new NextRequest("http://localhost:3000/api/auth/me", {
            headers: { cookie: `scholarshield_session=${sessionToken}` },
        });
        const meRes = await meGET(meReq);
        expect(meRes.status).toBe(200);
        const meData = await meRes.json();
        expect(meData.authenticated).toBe(true);
        expect(meData.user.email).toBe(testEmail);
        // Test /api/auth/logout
        const logoutReq = new NextRequest("http://localhost:3000/api/auth/logout", {
            method: "POST",
            headers: { cookie: `scholarshield_session=${sessionToken}` },
        });
        const logoutRes = await logoutPOST(logoutReq);
        expect(logoutRes.status).toBe(200);
        // After logout, session is invalidated
        const meAfterLogout = await meGET(meReq);
        const afterData = await meAfterLogout.json();
        expect(afterData.authenticated).toBe(false);
    });
});
