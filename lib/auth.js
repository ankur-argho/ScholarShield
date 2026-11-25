import crypto from "crypto";
import { prisma } from "./prisma";
const SESSION_COOKIE_NAME = "scholarshield_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
/**
 * Hashes a plaintext password using Node crypto scrypt with a cryptographically secure random salt.
 */
export async function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString("hex");
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err)
                reject(err);
            resolve(`${salt}:${derivedKey.toString("hex")}`);
        });
    });
}
/**
 * Verifies a password against a stored salt:hash string using constant-time comparison.
 */
export async function verifyPassword(password, storedHash) {
    return new Promise((resolve) => {
        const parts = storedHash.split(":");
        if (parts.length !== 2) {
            resolve(false);
            return;
        }
        const [salt, key] = parts;
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) {
                resolve(false);
                return;
            }
            try {
                const keyBuffer = Buffer.from(key, "hex");
                const match = crypto.timingSafeEqual(keyBuffer, derivedKey);
                resolve(match);
            }
            catch {
                resolve(false);
            }
        });
    });
}
/**
 * Creates a new active session token in the database for the given user.
 */
export async function createSession(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await prisma.session.create({
        data: {
            token,
            userId,
            expiresAt,
        },
    });
    return { token, expiresAt };
}
/**
 * Validates a session token. Returns the authenticated user if valid, or null.
 */
export async function validateSession(token) {
    if (!token)
        return null;
    const session = await prisma.session.findUnique({
        where: { token },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    createdAt: true,
                },
            },
        },
    });
    if (!session)
        return null;
    // Check if session has expired
    if (session.expiresAt.getTime() < Date.now()) {
        // Delete expired session
        await prisma.session.delete({ where: { token } }).catch(() => { });
        return null;
    }
    return session.user;
}
/**
 * Deletes a session token from the database.
 */
export async function deleteSession(token) {
    if (!token)
        return;
    await prisma.session.delete({ where: { token } }).catch(() => { });
}
export { SESSION_COOKIE_NAME, SESSION_DURATION_MS };
