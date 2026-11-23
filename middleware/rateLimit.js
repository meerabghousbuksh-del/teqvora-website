// Minimal in-memory rate limiter keyed by client IP. It is per server
// process, which is fine for a single instance; use a shared store
// (for example Redis) if the site is ever scaled across several instances.
function createRateLimiter({ windowMs, max, message, now = Date.now }) {
    const hits = new Map();

    // The cleanup timer starts on the first request, not at import time:
    // Cloudflare Workers do not allow timers in global scope.
    let sweepTimer = null;
    function startSweeper() {
        if (sweepTimer) return;
        sweepTimer = setInterval(() => {
            const current = now();
            for (const [key, entry] of hits) {
                if (entry.resetAt <= current) hits.delete(key);
            }
        }, windowMs);
        if (typeof sweepTimer.unref === 'function') sweepTimer.unref();
    }

    return function rateLimit(req, res, next) {
        startSweeper();
        const key = req.ip || 'unknown';
        const current = now();
        let entry = hits.get(key);

        if (!entry || entry.resetAt <= current) {
            entry = { count: 0, resetAt: current + windowMs };
            hits.set(key, entry);
        }

        entry.count += 1;
        if (entry.count > max) {
            res.set('Retry-After', String(Math.ceil((entry.resetAt - current) / 1000)));
            return res.status(429).json({ success: false, message });
        }
        return next();
    };
}

module.exports = { createRateLimiter };
