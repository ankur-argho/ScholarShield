const ipMap = new Map();
// Clean expired entries every 5 minutes to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of ipMap.entries()) {
        if (entry.resetAt <= now) {
            ipMap.delete(key);
        }
    }
}, 5 * 60 * 1000);
/**
 * In-memory sliding rate limiter.
 * @param key Identifier (e.g. client IP)
 * @param limit Max requests allowed in window
 * @param windowMs Time window in milliseconds (default 60 seconds)
 */
export function checkRateLimit(key, limit = 30, windowMs = 60 * 1000) {
    const now = Date.now();
    const entry = ipMap.get(key);
    if (!entry || entry.resetAt <= now) {
        ipMap.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1 };
    }
    if (entry.count >= limit) {
        return { allowed: false, remaining: 0 };
    }
    entry.count++;
    return { allowed: true, remaining: limit - entry.count };
}
