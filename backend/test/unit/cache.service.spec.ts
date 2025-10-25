import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../../src/system/cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set and get', () => {
    it('should set and get a value', () => {
      const key = 'test-key';
      const value = 'test-value';

      service.set(key, value);
      const result = service.get(key);

      expect(result).toBe(value);
    });

    it('should return null for non-existent key', () => {
      const result = service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should set value with custom TTL', () => {
      const key = 'test-key';
      const value = 'test-value';
      const customTtl = 5000;

      service.set(key, value, customTtl);
      const result = service.get(key);

      expect(result).toBe(value);
    });

    it('should handle different data types', () => {
      const stringKey = 'string-key';
      const numberKey = 'number-key';
      const objectKey = 'object-key';
      const arrayKey = 'array-key';

      const stringValue = 'test string';
      const numberValue = 42;
      const objectValue = { name: 'test', age: 25 };
      const arrayValue = [1, 2, 3, 'test'];

      service.set(stringKey, stringValue);
      service.set(numberKey, numberValue);
      service.set(objectKey, objectValue);
      service.set(arrayKey, arrayValue);

      expect(service.get(stringKey)).toBe(stringValue);
      expect(service.get(numberKey)).toBe(numberValue);
      expect(service.get(objectKey)).toEqual(objectValue);
      expect(service.get(arrayKey)).toEqual(arrayValue);
    });
  });

  describe('delete', () => {
    it('should delete a key', () => {
      const key = 'test-key';
      const value = 'test-value';

      service.set(key, value);
      expect(service.get(key)).toBe(value);

      const deleted = service.delete(key);
      expect(deleted).toBe(true);
      expect(service.get(key)).toBeNull();
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = service.delete('non-existent-key');
      expect(deleted).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      const key = 'test-key';
      const value = 'test-value';

      service.set(key, value);
      expect(service.has(key)).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(service.has('non-existent-key')).toBe(false);
    });

    it('should return false for expired key', () => {
      jest.useFakeTimers();
      
      const key = 'test-key';
      const value = 'test-value';
      const shortTtl = 1000; // 1 second

      service.set(key, value, shortTtl);
      expect(service.has(key)).toBe(true);

      // Fast forward time beyond TTL
      jest.advanceTimersByTime(1001);
      expect(service.has(key)).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('clear', () => {
    it('should clear all keys', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');

      expect(service.size()).toBe(3);

      service.clear();

      expect(service.size()).toBe(0);
      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBeNull();
      expect(service.get('key3')).toBeNull();
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      expect(service.size()).toBe(0);

      service.set('key1', 'value1');
      expect(service.size()).toBe(1);

      service.set('key2', 'value2');
      expect(service.size()).toBe(2);

      service.delete('key1');
      expect(service.size()).toBe(1);
    });

    it('should not count expired items in size', () => {
      jest.useFakeTimers();

      const shortTtl = 1000;
      service.set('key1', 'value1', shortTtl);
      service.set('key2', 'value2'); // Default TTL

      expect(service.size()).toBe(2);

      // Fast forward time beyond short TTL
      jest.advanceTimersByTime(1001);
      
      // Should exclude expired item
      expect(service.size()).toBe(1);

      jest.useRealTimers();
    });
  });

  describe('keys', () => {
    it('should return all non-expired keys', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');

      const keys = service.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should exclude expired keys', () => {
      jest.useFakeTimers();

      const shortTtl = 1000;
      service.set('key1', 'value1', shortTtl);
      service.set('key2', 'value2'); // Default TTL

      expect(service.keys()).toHaveLength(2);

      // Fast forward time beyond short TTL
      jest.advanceTimersByTime(1001);
      
      const keys = service.keys();
      expect(keys).toHaveLength(1);
      expect(keys).toContain('key2');
      expect(keys).not.toContain('key1');

      jest.useRealTimers();
    });
  });

  describe('values', () => {
    it('should return all non-expired values', () => {
      service.set('key1', 'value1');
      service.set('key2', 42);
      service.set('key3', { name: 'test' });

      const values = service.values();
      expect(values).toHaveLength(3);
      expect(values).toContain('value1');
      expect(values).toContain(42);
      expect(values).toContainEqual({ name: 'test' });
    });
  });

  describe('entries', () => {
    it('should return all non-expired entries', () => {
      service.set('key1', 'value1');
      service.set('key2', 42);

      const entries = service.entries();
      expect(entries).toHaveLength(2);
      expect(entries).toContainEqual(['key1', 'value1']);
      expect(entries).toContainEqual(['key2', 42]);
    });
  });

  describe('flush', () => {
    it('should flush all data', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');

      expect(service.size()).toBe(2);

      service.flush();

      expect(service.size()).toBe(0);
    });
  });

  describe('stats', () => {
    it('should return cache statistics', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');

      const stats = service.stats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('defaultTTL');
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(1000);
      expect(stats.defaultTTL).toBe(3600000);
    });
  });

  describe('TTL and expiration', () => {
    it('should expire items after TTL', () => {
      jest.useFakeTimers();

      const key = 'test-key';
      const value = 'test-value';
      const shortTtl = 1000; // 1 second

      service.set(key, value, shortTtl);
      expect(service.get(key)).toBe(value);

      // Fast forward time beyond TTL
      jest.advanceTimersByTime(1001);
      
      expect(service.get(key)).toBeNull();

      jest.useRealTimers();
    });

    it('should not expire items without TTL', () => {
      const key = 'test-key';
      const value = 'test-value';

      service.set(key, value, 0); // No TTL
      expect(service.get(key)).toBe(value);

      // Items without TTL should never expire
      expect(service.get(key)).toBe(value);
    });
  });

  describe('max size handling', () => {
    it('should evict oldest items when max size is reached', () => {
      // Create a service with smaller max size for testing
      const smallCacheService = new CacheService();
      // Access private property for testing
      (smallCacheService as any).maxSize = 2;

      smallCacheService.set('key1', 'value1');
      smallCacheService.set('key2', 'value2');
      expect(smallCacheService.size()).toBe(2);

      // Adding third item should evict the first
      smallCacheService.set('key3', 'value3');
      expect(smallCacheService.size()).toBe(2);
      expect(smallCacheService.get('key1')).toBeNull(); // Should be evicted
      expect(smallCacheService.get('key2')).toBe('value2');
      expect(smallCacheService.get('key3')).toBe('value3');
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully in get operation', () => {
      // Mock the store to throw an error
      const originalStore = (service as any).store;
      (service as any).store = {
        get: jest.fn().mockImplementation(() => {
          throw new Error('Test error');
        }),
      };

      const result = service.get('test-key');
      expect(result).toBeNull();

      // Restore original store
      (service as any).store = originalStore;
    });

    it('should handle errors gracefully in set operation', () => {
      // Mock the store to throw an error
      const originalStore = (service as any).store;
      (service as any).store = {
        size: 0,
        has: jest.fn().mockReturnValue(false),
        set: jest.fn().mockImplementation(() => {
          throw new Error('Test error');
        }),
      };

      // Should not throw error
      expect(() => service.set('test-key', 'test-value')).not.toThrow();

      // Restore original store
      (service as any).store = originalStore;
    });
  });
});
