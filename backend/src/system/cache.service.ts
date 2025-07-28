import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

export interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private store: Map<string, CacheItem<any>>;
  private defaultTTL: number;
  private maxSize: number;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.store = new Map();
    this.defaultTTL = 3600000; // 1 hour default
    this.maxSize = 1000;
  }

  async onModuleInit() {
    this.logger.log('Cache service initialized');
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Cleanup every minute
  }

  async onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    this.logger.log('Cache service destroyed');
  }

  get<T>(key: string): T | null {
    try {
      const item = this.store.get(key);

      if (!item) {
        return null;
      }

      if (this.isExpired(item)) {
        this.delete(key);
        return null;
      }

      return item.value;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  set<T>(key: string, value: T, ttl?: number): void {
    try {
      if (this.store.size >= this.maxSize && !this.store.has(key)) {
        this.evictOldest();
      }

      const item: CacheItem<T> = {
        value,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL,
      };

      this.store.set(key, item);
      this.logger.debug(`Cache key ${key} set with TTL ${item.ttl}ms`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  has(key: string): boolean {
    const item = this.store.get(key);

    if (!item) {
      return false;
    }

    if (this.isExpired(item)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    this.cleanupExpired();
    return this.store.size;
  }

  keys(): string[] {
    this.cleanupExpired();
    return Array.from(this.store.keys());
  }

  values<T>(): T[] {
    this.cleanupExpired();
    return Array.from(this.store.values()).map((item) => item.value);
  }

  entries<T>(): Array<[string, T]> {
    this.cleanupExpired();
    return Array.from(this.store.entries()).map(([key, item]) => [
      key,
      item.value,
    ]);
  }

  flush(): void {
    this.clear();
  }

  stats(): { size: number; maxSize: number; defaultTTL: number } {
    return {
      size: this.size(),
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
    };
  }

  private isExpired(item: CacheItem<any>): boolean {
    if (!item.ttl) return false;
    return Date.now() - item.timestamp > item.ttl;
  }

  private evictOldest(): void {
    const oldestKey = this.store.keys().next().value;
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.store.entries()) {
      if (item.ttl && now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.delete(key));
  }
}
