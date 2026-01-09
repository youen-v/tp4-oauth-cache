import { LRUCache } from "lru-cache";

export const cache = new LRUCache({
  max: 1000,
  ttl: 60_000,
});
