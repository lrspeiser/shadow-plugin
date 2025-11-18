import { Cache } from '../cache';

// Test: test_cache_storesAndRetrievesCorrectly
// Verifies cache stores analysis results and retrieves them correctly
import { Cache } from '../cache';

describe('Cache operations', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
  });

  test('stores and retrieves analysis results correctly', () => {
    const key = 'src/test.ts';
    const analysisResult = {
      filePath: 'src/test.ts',
      issues: [{ severity: 'warning', description: 'Test issue' }],
      healthScore: 85
    };

    cache.set(key, analysisResult);
    const retrieved = cache.get(key);

    expect(retrieved).toEqual(analysisResult);
  });

  test('cache miss returns null', () => {
    const result = cache.get('nonexistent-key');

    expect(result).toBeNull();
  });

  test('cache hit returns exact stored data', () => {
    const key = 'src/module.ts';
    const data = { test: 'data', nested: { value: 42 } };

    cache.set(key, data);
    const retrieved = cache.get(key);

    expect(retrieved).toEqual(data);
    expect(retrieved.nested.value).toBe(42);
  });

  test('clear removes all cached entries', () => {
    cache.set('key1', { data: 1 });
    cache.set('key2', { data: 2 });

    cache.clear();

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  test('handles cache invalidation by key', () => {
    cache.set('key1', { data: 1 });
    cache.set('key2', { data: 2 });

    cache.invalidate('key1');

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toEqual({ data: 2 });
  });
});
