import { Cache } from '../cache';

// Test: test_cache_hit_returns_cached_result
// Verifies cache returns stored results on subsequent requests with same key
describe('Cache - get and set operations', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
  });

  test('should return null on cache miss', () => {
    const result = cache.get('nonexistent-key');

    expect(result).toBeNull();
  });

  test('should return cached value on cache hit', () => {
    const key = 'test-key';
    const value = { data: 'test data', timestamp: Date.now() };

    cache.set(key, value);
    const result = cache.get(key);

    expect(result).toEqual(value);
  });

  test('should handle multiple cache entries', () => {
    cache.set('key1', { value: 1 });
    cache.set('key2', { value: 2 });
    cache.set('key3', { value: 3 });

    expect(cache.get('key1')).toEqual({ value: 1 });
    expect(cache.get('key2')).toEqual({ value: 2 });
    expect(cache.get('key3')).toEqual({ value: 3 });
  });

  test('should overwrite existing cache entry', () => {
    const key = 'test-key';
    cache.set(key, { value: 'old' });
    cache.set(key, { value: 'new' });

    const result = cache.get(key);

    expect(result).toEqual({ value: 'new' });
  });
});

// Test: test_cache_invalidation_on_file_change
// Verifies cache entries are invalidated when source files are modified
describe('Cache - invalidation', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
  });

  test('should invalidate specific cache entry', () => {
    cache.set('key1', { value: 1 });
    cache.set('key2', { value: 2 });

    cache.invalidate('key1');

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toEqual({ value: 2 });
  });

  test('should clear all cache entries', () => {
    cache.set('key1', { value: 1 });
    cache.set('key2', { value: 2 });
    cache.set('key3', { value: 3 });

    cache.clear();

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
    expect(cache.get('key3')).toBeNull();
  });

  test('should invalidate entries matching pattern', () => {
    cache.set('file:src/test1.ts', { value: 1 });
    cache.set('file:src/test2.ts', { value: 2 });
    cache.set('analysis:workspace', { value: 3 });

    cache.invalidatePattern(/^file:/);

    expect(cache.get('file:src/test1.ts')).toBeNull();
    expect(cache.get('file:src/test2.ts')).toBeNull();
    expect(cache.get('analysis:workspace')).toEqual({ value: 3 });
  });
});
