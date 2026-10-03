const buckets = new Map<string, { count: number; since: number }>();

/**
 * In production, configure the reverse proxy to overwrite x-real-ip. This
 * lightweight guard is deliberately a first line of defence; use edge/WAF
 * rate limiting for distributed protection.
 */
export function clientIp(request: Request) {
  return (request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
}

/** Small in-memory limiter against form spam (per server instance). */
export function rateLimited(request: Request, scope: string, limit = 8, windowMs = 10 * 60 * 1000) {
  const key = `${scope}:${clientIp(request)}`;
  const now = Date.now();
  if (buckets.size > 5000) for (const [key, value] of buckets) if (now - value.since > windowMs) buckets.delete(key);
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.since > windowMs) {
    buckets.set(key, { count: 1, since: now });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}
