/**
 * Simple in-memory cache utility
 * For production, replace with Redis or similar
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: number | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000) as any as number;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  // Cache key generators
  static key = {
    debate: (id: string) => `debate:${id}`,
    user: (id: string) => `user:${id}`,
    userProfile: (id: string) => `user:profile:${id}`,
    debateList: (params: string) => `debates:list:${params}`,
    trendingDebates: () => 'debates:trending',
    leaderboard: () => 'leaderboard',
    notifications: (userId: string) => `notifications:${userId}`,
  };
}

// Singleton instance
export const cache = new Cache();

// Cache TTL constants (in seconds)
export const cacheTTL = {
  debate: 300, // 5 minutes
  user: 600, // 10 minutes
  debateList: 60, // 1 minute
  trending: 300, // 5 minutes
  leaderboard: 600, // 10 minutes
  notifications: 30, // 30 seconds
};

