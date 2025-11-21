import { readAnalysisCache } from '../reader';
import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('readAnalysisCache', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    test('should read and parse valid cache file', () => {
      const mockCacheData = {
        files: [
          { path: 'test.ts', complexity: 5, lines: [1, 10] }
        ],
        timestamp: Date.now()
      };
      const mockCachePath = '/project/.shadow-watch/cache.json';

      mockPath.join = jest.fn().mockReturnValue(mockCachePath);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockCacheData));

      const result = readAnalysisCache('/project');

      expect(mockPath.join).toHaveBeenCalledWith('/project', '.shadow-watch', 'cache.json');
      expect(mockFs.existsSync).toHaveBeenCalledWith(mockCachePath);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(mockCachePath, 'utf-8');
      expect(result).toEqual(mockCacheData);
    });

    test('should handle empty cache file', () => {
      const mockCacheData = { files: [], timestamp: Date.now() };
      const mockCachePath = '/project/.shadow-watch/cache.json';

      mockPath.join = jest.fn().mockReturnValue(mockCachePath);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockCacheData));

      const result = readAnalysisCache('/project');

      expect(result).toEqual(mockCacheData);
      expect(result.files).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    test('should return null when cache file does not exist', () => {
      const mockCachePath = '/project/.shadow-watch/cache.json';

      mockPath.join = jest.fn().mockReturnValue(mockCachePath);
      mockFs.existsSync = jest.fn().mockReturnValue(false);

      const result = readAnalysisCache('/project');

      expect(mockFs.existsSync).toHaveBeenCalledWith(mockCachePath);
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('should handle cache file with special characters in path', () => {
      const mockCacheData = { files: [], timestamp: Date.now() };
      const specialPath = '/project/with spaces/and-dashes';
      const mockCachePath = specialPath + '/.shadow-watch/cache.json';

      mockPath.join = jest.fn().mockReturnValue(mockCachePath);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockCacheData));

      const result = readAnalysisCache(specialPath);

      expect(result).toEqual(mockCacheData);
    });

    test('should handle cache file with nested data structures', () => {
      const mockCacheData = {
        files: [
          {
            path: 'complex.ts',
            complexity: 10,
            lines: [1, 50],
            dependencies: ['dep1', 'dep2'],
            metadata: { author: 'test', version: '1.0' }
          }
        ],
        timestamp: Date.now()
      };
      const mockCachePath = '/project/.shadow-watch/cache.json';

      mockPath.join = jest.fn().mockReturnValue(mockCachePath);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockCacheData));

      const result = readAnalysisCache('/project');

      expect(result).toEqual(mockCacheData);
      expect(result.files[0].dependencies).toEqual(['dep1', 'dep2']);
    });
  });

  describe('error handling', () => {
    test('should return null when JSON parsing fails', () => {
      const mockCachePath = '/project/.shadow-watch/cache.json';

      mockPath.join = jest.fn().mockReturnValue(mockCachePath);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('invalid json {');

      const result = readAnalysisCache('/project');

      expect(result).toBeNull();
    });

    test('should return null when readFileSync throws error', () => {
      const mockCachePath = '/project/.shadow-watch/cache.json';

      mockPath.join = jest.fn().mockReturnValue(mockCachePath);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = readAnalysisCache('/project');

      expect(result).toBeNull();
    });

    test('should handle corrupted cache file with missing fields', () => {
      const mockCacheData = { files: [] };
      const mockCachePath = '/project/.shadow-watch/cache.json';

      mockPath.join = jest.fn().mockReturnValue(mockCachePath);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockCacheData));

      const result = readAnalysisCache('/project');

      expect(result).toEqual(mockCacheData);
    });

    test('should handle empty file content', () => {
      const mockCachePath = '/project/.shadow-watch/cache.json';

      mockPath.join = jest.fn().mockReturnValue(mockCachePath);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('');

      const result = readAnalysisCache('/project');

      expect(result).toBeNull();
    });

    test('should handle path.join throwing error', () => {
      mockPath.join = jest.fn().mockImplementation(() => {
        throw new Error('Invalid path');
      });

      const result = readAnalysisCache('/project');

      expect(result).toBeNull();
    });

    test('should handle existsSync throwing error', () => {
      const mockCachePath = '/project/.shadow-watch/cache.json';

      mockPath.join = jest.fn().mockReturnValue(mockCachePath);
      mockFs.existsSync = jest.fn().mockImplementation(() => {
        throw new Error('File system error');
      });

      const result = readAnalysisCache('/project');

      expect(result).toBeNull();
    });
  });
});