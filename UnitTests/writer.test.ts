import { writeAnalysisCache } from '../writer';
import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('writeAnalysisCache', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.join = jest.fn((...args: string[]) => args.join('/'));
    mockPath.dirname = jest.fn((filePath: string) => filePath.split('/').slice(0, -1).join('/'));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('happy path', () => {
    test('should write cache data to file successfully', async () => {
      const testCachePath = '/test/cache/analysis.json';
      const testData = { key: 'value', timestamp: Date.now() };

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.writeFileSync = jest.fn();

      await writeAnalysisCache(testCachePath, testData);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        testCachePath,
        JSON.stringify(testData, null, 2),
        'utf8'
      );
    });

    test('should create directory if it does not exist', async () => {
      const testCachePath = '/test/cache/analysis.json';
      const testData = { analysis: 'result' };

      mockFs.existsSync = jest.fn().mockReturnValue(false);
      mockFs.mkdirSync = jest.fn();
      mockFs.writeFileSync = jest.fn();

      await writeAnalysisCache(testCachePath, testData);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    test('should handle empty data object', async () => {
      const testCachePath = '/test/cache/empty.json';
      const testData = {};

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.writeFileSync = jest.fn();

      await writeAnalysisCache(testCachePath, testData);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        testCachePath,
        JSON.stringify(testData, null, 2),
        'utf8'
      );
    });

    test('should handle nested object data', async () => {
      const testCachePath = '/test/cache/nested.json';
      const testData = {
        level1: {
          level2: {
            level3: 'deep value'
          }
        }
      };

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.writeFileSync = jest.fn();

      await writeAnalysisCache(testCachePath, testData);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        testCachePath,
        JSON.stringify(testData, null, 2),
        'utf8'
      );
    });
  });

  describe('edge cases', () => {
    test('should handle null data', async () => {
      const testCachePath = '/test/cache/null.json';
      const testData = null;

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.writeFileSync = jest.fn();

      await writeAnalysisCache(testCachePath, testData);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        testCachePath,
        JSON.stringify(testData, null, 2),
        'utf8'
      );
    });

    test('should handle array data', async () => {
      const testCachePath = '/test/cache/array.json';
      const testData = [1, 2, 3, { key: 'value' }];

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.writeFileSync = jest.fn();

      await writeAnalysisCache(testCachePath, testData);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        testCachePath,
        JSON.stringify(testData, null, 2),
        'utf8'
      );
    });

    test('should handle special characters in file path', async () => {
      const testCachePath = '/test/cache/special-chars_123.json';
      const testData = { test: true };

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.writeFileSync = jest.fn();

      await writeAnalysisCache(testCachePath, testData);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        testCachePath,
        expect.any(String),
        'utf8'
      );
    });

    test('should handle large data objects', async () => {
      const testCachePath = '/test/cache/large.json';
      const testData = {
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, data: `item${i}` }))
      };

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.writeFileSync = jest.fn();

      await writeAnalysisCache(testCachePath, testData);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should throw error when writeFileSync fails', async () => {
      const testCachePath = '/test/cache/error.json';
      const testData = { key: 'value' };
      const writeError = new Error('Write permission denied');

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.writeFileSync = jest.fn().mockImplementation(() => {
        throw writeError;
      });

      await expect(writeAnalysisCache(testCachePath, testData)).rejects.toThrow('Write permission denied');
    });

    test('should throw error when mkdirSync fails', async () => {
      const testCachePath = '/test/cache/error.json';
      const testData = { key: 'value' };
      const mkdirError = new Error('Cannot create directory');

      mockFs.existsSync = jest.fn().mockReturnValue(false);
      mockFs.mkdirSync = jest.fn().mockImplementation(() => {
        throw mkdirError;
      });

      await expect(writeAnalysisCache(testCachePath, testData)).rejects.toThrow('Cannot create directory');
    });

    test('should handle disk full error', async () => {
      const testCachePath = '/test/cache/full.json';
      const testData = { key: 'value' };
      const diskFullError = new Error('ENOSPC: no space left on device');

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.writeFileSync = jest.fn().mockImplementation(() => {
        throw diskFullError;
      });

      await expect(writeAnalysisCache(testCachePath, testData)).rejects.toThrow('ENOSPC: no space left on device');
    });

    test('should handle invalid path error', async () => {
      const testCachePath = '';
      const testData = { key: 'value' };

      mockFs.existsSync = jest.fn().mockReturnValue(false);
      mockFs.mkdirSync = jest.fn().mockImplementation(() => {
        throw new Error('Invalid path');
      });

      await expect(writeAnalysisCache(testCachePath, testData)).rejects.toThrow();
    });

    test('should handle non-serializable data gracefully', async () => {
      const testCachePath = '/test/cache/circular.json';
      const circular: any = { key: 'value' };
      circular.self = circular;

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.writeFileSync = jest.fn();

      await expect(writeAnalysisCache(testCachePath, circular)).rejects.toThrow();
    });
  });
});