import NodeCache from 'node-cache';

// Create cache instance with default TTL of 5 minutes
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Better performance for large objects
});

// Cache statistics
let stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
};

// Cache helper functions
export const cacheHelper = {
  // Get value from cache
  get: <T>(key: string): T | undefined => {
    const value = cache.get<T>(key);
    if (value !== undefined) {
      stats.hits++;
      return value;
    }
    stats.misses++;
    return undefined;
  },

  // Set value in cache
  set: <T>(key: string, value: T, ttl?: number): boolean => {
    stats.sets++;
    return cache.set(key, value, ttl || 0);
  },

  // Delete value from cache
  del: (key: string | string[]): number => {
    stats.deletes++;
    return cache.del(key);
  },

  // Check if key exists
  has: (key: string): boolean => {
    return cache.has(key);
  },

  // Get all keys
  keys: (): string[] => {
    return cache.keys();
  },

  // Clear all cache
  flush: (): void => {
    cache.flushAll();
    stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  },

  // Get cache statistics
  getStats: () => {
    const total = stats.hits + stats.misses;
    return {
      ...stats,
      total,
      hitRate: total > 0 ? (stats.hits / total) * 100 : 0,
      size: cache.keys().length,
    };
  },
};

// Cache decorator for async functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : `cache:${fn.name}:${JSON.stringify(args)}`;

    // Try to get from cache
    const cached = cacheHelper.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    cacheHelper.set(key, result, ttl);
    return result;
  }) as T;
}

// Cache key generators
export const cacheKeys = {
  debate: (id: string) => `debate:${id}`,
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  debateStatements: (debateId: string) => `debate:statements:${debateId}`,
  debateVerdicts: (debateId: string) => `debate:verdicts:${debateId}`,
  debateComments: (debateId: string) => `debate:comments:${debateId}`,
  userNotifications: (userId: string) => `user:notifications:${userId}`,
  leaderboard: (limit?: number) => `leaderboard:${limit || 'all'}`,
  trendingDebates: () => 'debates:trending',
};

// Cache invalidation helpers
export const cacheInvalidation = {
  debate: (debateId: string) => {
    cacheHelper.del([
      cacheKeys.debate(debateId),
      cacheKeys.debateStatements(debateId),
      cacheKeys.debateVerdicts(debateId),
      cacheKeys.debateComments(debateId),
      cacheKeys.trendingDebates(),
    ]);
  },
  user: (userId: string) => {
    cacheHelper.del([
      cacheKeys.user(userId),
      cacheKeys.userProfile(userId),
      cacheKeys.userNotifications(userId),
    ]);
  },
  leaderboard: () => {
    const keys = cacheHelper.keys().filter((k) => k.startsWith('leaderboard:'));
    if (keys.length > 0) {
      cacheHelper.del(keys);
    }
  },
};

export default cache;

