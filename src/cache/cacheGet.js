import crypto from "crypto";
import { cache } from "../../cache.js";

function hash(str) {
  return crypto.createHash("sha1").update(str).digest("hex");
}

export function cacheAllGet({
  defaultTtlMs = 30_000,
  privateTtlMs = 10_000,
  exclude = [/^\/auth\/(login|register|refresh)\b/, /^\/oauth\b/],

  allowNoCacheQuery = true,
} = {}) {
  return (req, res, next) => {
    if (req.method !== "GET") return next();

    if (allowNoCacheQuery && req.query?.nocache === "1") return next();
    if (req.headers["x-no-cache"] === "1") return next();

    if (exclude.some((re) => re.test(req.path))) return next();

    const authHeader = req.headers.authorization || "";
    const isPrivate = authHeader.startsWith("Bearer ");

    const baseKey = req.originalUrl;
    const key = isPrivate
      ? `priv:${baseKey}:t=${hash(authHeader)}`
      : `pub:${baseKey}`;

    const hit = cache.get(key);
    if (hit) {
      res.setHeader("X-Cache", "HIT");
      return res.status(hit.status).json(hit.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const status = res.statusCode || 200;

      if (status === 200) {
        const ttl = isPrivate ? privateTtlMs : defaultTtlMs;

        cache.set(key, { status, body }, { ttl });
        res.setHeader("X-Cache", "MISS");
      } else {
        res.setHeader("X-Cache", "BYPASS");
      }

      return originalJson(body);
    };

    next();
  };
}
