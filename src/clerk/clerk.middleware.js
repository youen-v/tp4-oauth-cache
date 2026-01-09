export function requireClerkAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing Clerk token" });

  try {
    const payloadPart = token.split(".")[1];
    const payloadJson = Buffer.from(payloadPart, "base64").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    req.clerk = { userId: payload.sub };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid Clerk token" });
  }
}
