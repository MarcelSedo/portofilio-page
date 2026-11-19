// app/api/contact/rateLimit.ts
// In-memory limiter: fine for a single self-hosted Node process. On serverless or several
// instances use a shared store (e.g. Upstash Redis) instead.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_ALL = 10; // attempts per IP per window
const MAX_REQUESTS_SUCCESS = 3; // sent messages per IP per window

type Entry = { all: number[]; success: number[] };
const store = globalThis as typeof globalThis & {
  contactRateLimitMap?: Map<string, Entry>;
  contactRateLimitInterval?: NodeJS.Timeout;
};
store.contactRateLimitMap ??= new Map();
const map = store.contactRateLimitMap;

if (!store.contactRateLimitInterval) {
  store.contactRateLimitInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, e] of map) {
      const all = e.all.filter((t) => now - t < WINDOW_MS);
      const success = e.success.filter((t) => now - t < WINDOW_MS);
      if (!all.length && !success.length) map.delete(ip);
      else map.set(ip, { all, success });
    }
  }, WINDOW_MS);
  store.contactRateLimitInterval.unref?.();
}

export const normalizeIp = (value: string | null | undefined) => {
  if (typeof value !== "string") return "unknown-ip";
  return value.trim().slice(0, 64) || "unknown-ip";
};

export const checkRateLimit = (ip: string) => {
  if (ip === "unknown-ip") return { exceeded: false as const };
  const now = Date.now();
  const e = map.get(ip) ?? { all: [], success: [] };
  const all = e.all.filter((t) => now - t < WINDOW_MS);
  const success = e.success.filter((t) => now - t < WINDOW_MS);

  if (all.length >= MAX_REQUESTS_ALL || success.length >= MAX_REQUESTS_SUCCESS) {
    return { exceeded: true as const, retryAfter: String(Math.ceil(WINDOW_MS / 1000)) };
  }
  all.push(now);
  map.set(ip, { all, success });
  return { exceeded: false as const };
};

export const recordSuccess = (ip: string) => {
  if (ip === "unknown-ip") return;
  map.get(ip)?.success.push(Date.now());
};
