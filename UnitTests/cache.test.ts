import { Cache } from '../cache';
import * as fs from 'fs';

// Test: test_cache_stores_and_retrieves_results
// Verifies cache stores and retrieves analysis results correctly
import { Cache } from '../cache';
import * as fs from 'fs';

jest.mock('fs');

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache('test-workspace');
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({}));
  });

  test('stores and retrieves values', () => {
    const key = 'test-file.ts';
    const value = { result: 'analysis data' };
    
    cache.set(key, value);
    const retrieved = cache.get(key);
    
    expect(retrieved).toEqual(value);
  });

  test('returns null for cache miss', () => {
    const result = cache.get('non-existent-key');
    
    expect(result).toBeNull();
  });

  test('clears all entries on clear', () => {
    cache.set('key1', { data: 'value1' });
    cache.set('key2', { data: 'value2' });
    
    cache.clear();
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  test('invalidates specific entry', () => {
    cache.set('key1', { data: 'value1' });
    cache.set('key2', { data: 'value2' });
    
    cache.invalidate('key1');
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).not.toBeNull();
  });
});
