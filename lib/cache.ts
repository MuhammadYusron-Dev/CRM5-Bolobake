// Simple in-memory cache for API Routes to prevent Google Sheets Rate Limiting
type CacheItem<T> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheItem<any>>();

// Cache duration in milliseconds (e.g., 30 seconds = 30000)
const DEFAULT_TTL = 30000;

/**
 * Get data from cache if it exists and is fresh.
 */
export function getFromCache<T>(key: string, ttl: number = DEFAULT_TTL): T | null {
  const item = cache.get(key);
  if (!item) return null;

  const isExpired = Date.now() - item.timestamp > ttl;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return item.data as T;
}

/**
 * Set data into cache.
 */
export function setCache<T>(key: string, data: T) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate/Delete specific cache key (useful after POST/PUT/DELETE operations).
 */
export function invalidateCache(key: string) {
  cache.delete(key);
}

/**
 * Clear the entire cache.
 */
export function clearAllCache() {
  cache.clear();
}
