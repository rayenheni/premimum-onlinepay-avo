const buckets = new Map<string, { count: number; since: number }>();

export function clientIp(request: Request) {
  return (request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
}

/** Small in-memory limiter against form spam (per server instance). */
export function rateLimited(request: Request, scope: string, limit = 8, windowMs = 10 * 60 * 1000) {
  const key = `${scope}:${clientIp(request)}`;
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, v] of buckets) if (now - v.since > windowMs) buckets.delete(k);
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.since > windowMs) { buckets.set(key, { count: 1, since: now }); return false; }
  bucket.count += 1;
  return bucket.count > limit;
}

/** Public origin, honouring the proxy headers when SITE_URL is not configured. */
export function publicOrigin(request: Request) {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.replace(":", "");
  return host ? `${proto.split(",")[0]}://${host.split(",")[0]}` : new URL(request.url).origin;
}
