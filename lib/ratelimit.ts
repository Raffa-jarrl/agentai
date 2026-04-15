// Optional: rate limiting with Upstash Redis (Phase 2)
// For Phase 1, this is a no-op; install @upstash/ratelimit and @upstash/redis in production

let _rl: any = null;

export function getRatelimit(): any {
  if (!process.env.UPSTASH_REDIS_URL) return null; // Disabled in dev
  if (_rl) return _rl;

  // Lazy-load only if needed and env vars present
  try {
    const { Ratelimit } = require("@upstash/ratelimit");
    const { Redis } = require("@upstash/redis");
    _rl = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, "1 m"),
    });
    return _rl;
  } catch (e) {
    console.warn("@upstash packages not installed; rate limiting disabled");
    return null;
  }
}

export async function checkRateLimit(key: string): Promise<{ success: boolean; remaining: number; resetMs: number }> {
  const rl = getRatelimit();
  if (!rl) return { success: true, remaining: 100, resetMs: 0 }; // Allow in dev

  const result = await rl.limit(key);
  return { success: result.success, remaining: result.remaining, resetMs: result.resetMs };
}

/** Specific quotas per endpoint */
export const QUOTAS = {
  "POST /api/ai/generate-description": { limit: 100, window: "1 d" }, // 100/day
  "POST /api/ai/qualify-lead": { limit: 1000, window: "1 d" }, // per agent per day
  "POST /api/content/batch": { limit: 1, window: "1 d" }, // 1 batch/day
  "POST /api/content/generate": { limit: 50, window: "1 d" }, // 50 single posts/day
};
