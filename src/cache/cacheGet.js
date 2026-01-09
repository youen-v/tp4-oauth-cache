import crypto from "crypto";
import { cache } from "../../cache.js";

function hash(str) {
  return crypto.createHash("sha1").update(str).digest("hex");
}

export function cacheAllGet({
  defaultTtlMs = 30_000,
  privateTtlMs = 10_000,
  // routes à exclure (auth, oauth callback, etc.)
  exclude = [/^\/auth\b/, /^\/oauth\b/, /^\/clerk\b/],
  // option: désactiver cache si query contient nocache=1
  allowNoCacheQuery = true,
} = {}) {
  return (req, res, next) => {
    // On cache uniquement les GET
    if (req.method !== "GET") return next();

    // Bypass manuel
    if (allowNoCacheQuery && req.query?.nocache === "1") return next();
    if (req.headers["x-no-cache"] === "1") return next();

    // Exclusions par path
    if (exclude.some((re) => re.test(req.path))) return next();

    // Déterminer si c'est une route "privée" (auth header présent)
    const authHeader = req.headers.authorization || "";
    const isPrivate = authHeader.startsWith("Bearer ");

    // Clé de cache :
    // - public: URL complète
    // - private: URL + hash du token (évite fuite inter-users)
    const baseKey = req.originalUrl; // inclut querystring
    const key = isPrivate
      ? `priv:${baseKey}:t=${hash(authHeader)}`
      : `pub:${baseKey}`;

    // Cache HIT
    const hit = cache.get(key);
    if (hit) {
      res.setHeader("X-Cache", "HIT");
      return res.status(hit.status).json(hit.body);
    }

    // Intercepter la réponse JSON
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const status = res.statusCode || 200;

      // On ne cache que les réponses 200
      // (évite de figer une 401/500 dans le cache)
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
