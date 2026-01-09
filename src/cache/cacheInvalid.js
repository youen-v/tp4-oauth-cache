import { cache } from "../../cache.js";

export function invalidateOnWrite() {
  return (req, res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      res.on("finish", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.clear();
        }
      });
    }
    next();
  };
}
