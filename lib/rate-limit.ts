type RateLimitRecord = { count: number; resetAt: number };

declare global {
  var __aifrogiRateLimits__: Map<string, RateLimitRecord> | undefined;
}

const store = globalThis.__aifrogiRateLimits__ ?? new Map<string, RateLimitRecord>();
globalThis.__aifrogiRateLimits__ = store;

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0, resetAt: current.resetAt };
  current.count += 1;
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}
