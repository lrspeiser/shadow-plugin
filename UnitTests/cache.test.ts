import { Cache } from '../cache';
import { IncrementalStorage } from '../storage/incrementalStorage';
import * as fs from 'fs';

// Test: test_cache_get_set_operations
// Verifies cache correctly stores and retrieves analysis results
import { Cache } from '../cache';

describe('Cache.get and Cache.set', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
  });

  it('should return stored value on cache hit', () => {
    const key = 'test-key';
    const value = { data: 'test data' };

    cache.set(key, value);
    const result = cache.get(key);

    expect(result).toEqual(value);
  });

  it('should return undefined on cache miss', () => {
    const result = cache.get('nonexistent-key');

    expect(result).toBeUndefined();
  });

  it('should handle multiple keys independently', () => {
    cache.set('key1', { data: 'value1' });
    cache.set('key2', { data: 'value2' });

    expect(cache.get('key1')).toEqual({ data: 'value1' });
    expect(cache.get('key2')).toEqual({ data: 'value2' });
  });

  it('should persist values until cleared', () => {
    cache.set('key', { data: 'value' });

    expect(cache.get('key')).toEqual({ data: 'value' });
    expect(cache.get('key')).toEqual({ data: 'value' });
  });
});

// Test: test_cache_invalidation_clears_entries
// Verifies cache invalidation correctly removes stale entries
import { Cache } from '../cache';

describe('Cache.invalidate and Cache.clear', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
  });

  it('should remove specific key on invalidate', () => {
    cache.set('key1', { data: 'value1' });
    cache.set('key2', { data: 'value2' });

    cache.invalidate('key1');

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toEqual({ data: 'value2' });
  });

  it('should remove all entries on clear', () => {
    cache.set('key1', { data: 'value1' });
    cache.set('key2', { data: 'value2' });

    cache.clear();

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
  });

  it('should return undefined after invalidation', () => {
    cache.set('key', { data: 'value' });
    cache.invalidate('key');

    const result = cache.get('key');

    expect(result).toBeUndefined();
  });

  it('should preserve other keys during invalidation', () => {
    cache.set('key1', { data: 'value1' });
    cache.set('key2', { data: 'value2' });
    cache.set('key3', { data: 'value3' });

    cache.invalidate('key2');

    expect(cache.get('key1')).toEqual({ data: 'value1' });
    expect(cache.get('key3')).toEqual({ data: 'value3' });
  });
});

// Test: test_incrementalStorage_saves_and_loads
// Verifies incremental storage correctly persists analysis results to disk
import { IncrementalStorage } from '../storage/incrementalStorage';
import * as fs from 'fs';

jest.mock('fs');

describe('IncrementalStorage.save and load', () => {
  let storage: IncrementalStorage;
  const mockFs = fs as jest.Mocked;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new IncrementalStorage('/test/path');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => {});
  });

  it('should write to disk on save', () => {
    const data = { healthScore: 85, issues: [], timestamp: Date.now() };
    mockFs.writeFileSync.mockImplementation(() => {});

    storage.save('test-key', data);

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('test-key'),
      expect.any(String)
    );
  });

  it('should read from disk on load', () => {
    const data = { healthScore: 85, issues: [], timestamp: Date.now() };
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(data));

    const result = storage.load('test-key');

    expect(result).toEqual(data);
  });

  it('should return null for missing files', () => {
    mockFs.existsSync.mockReturnValue(false);

    const result = storage.load('nonexistent-key');

    expect(result).toBeNull();
  });

  it('should validate loaded data structure', () => {
    const invalidData = { invalid: 'structure' };
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidData));

    expect(() => storage.load('test-key')).toThrow();
  });
});
