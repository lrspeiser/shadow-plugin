import { identifyEntryPoints } from '../entryPointDetector';
import * as fs from 'fs';
import { parsePackageJson } from '../../utils/packageParser';

// Mocks
jest.mock('fs');
jest.mock('../../utils/packageParser');

describe('identifyEntryPoints', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockParsePackageJson = parsePackageJson as jest.MockedFunction<typeof parsePackageJson>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path scenarios', () => {
    test('should identify entry points from package.json main field', () => {
      const mockPackageJson = {
        name: 'test-package',
        main: 'dist/index.js'
      };
      mockParsePackageJson.mockReturnValue(mockPackageJson);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockPackageJson));

      const result = identifyEntryPoints('/test/project');

      expect(result).toBeDefined();
      expect(result).toContain('dist/index.js');
      expect(mockParsePackageJson).toHaveBeenCalledWith('/test/project/package.json');
    });

    test('should identify multiple entry points from exports field', () => {
      const mockPackageJson = {
        name: 'test-package',
        exports: {
          '.': './dist/index.js',
          './utils': './dist/utils.js'
        }
      };
      mockParsePackageJson.mockReturnValue(mockPackageJson);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockPackageJson));

      const result = identifyEntryPoints('/test/project');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should identify entry points from bin field', () => {
      const mockPackageJson = {
        name: 'test-package',
        bin: {
          'my-cli': './bin/cli.js'
        }
      };
      mockParsePackageJson.mockReturnValue(mockPackageJson);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockPackageJson));

      const result = identifyEntryPoints('/test/project');

      expect(result).toBeDefined();
      expect(result).toContain('./bin/cli.js');
    });

    test('should identify entry point from string bin field', () => {
      const mockPackageJson = {
        name: 'test-package',
        bin: './bin/cli.js'
      };
      mockParsePackageJson.mockReturnValue(mockPackageJson);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockPackageJson));

      const result = identifyEntryPoints('/test/project');

      expect(result).toBeDefined();
      expect(result).toContain('./bin/cli.js');
    });
  });

  describe('edge cases', () => {
    test('should return default entry point when package.json has no entry fields', () => {
      const mockPackageJson = {
        name: 'test-package'
      };
      mockParsePackageJson.mockReturnValue(mockPackageJson);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockPackageJson));

      const result = identifyEntryPoints('/test/project');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle missing package.json file', () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false);
      mockParsePackageJson.mockReturnValue(null);

      const result = identifyEntryPoints('/test/project');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle empty project path', () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false);
      mockParsePackageJson.mockReturnValue(null);

      const result = identifyEntryPoints('');

      expect(result).toBeDefined();
    });

    test('should handle complex exports field with conditions', () => {
      const mockPackageJson = {
        name: 'test-package',
        exports: {
          '.': {
            import: './dist/index.mjs',
            require: './dist/index.cjs'
          }
        }
      };
      mockParsePackageJson.mockReturnValue(mockPackageJson);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockPackageJson));

      const result = identifyEntryPoints('/test/project');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should deduplicate entry points', () => {
      const mockPackageJson = {
        name: 'test-package',
        main: 'dist/index.js',
        module: 'dist/index.js'
      };
      mockParsePackageJson.mockReturnValue(mockPackageJson);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockPackageJson));

      const result = identifyEntryPoints('/test/project');

      expect(result).toBeDefined();
      const uniqueEntries = [...new Set(result)];
      expect(result.length).toBe(uniqueEntries.length);
    });
  });

  describe('error handling', () => {
    test('should handle invalid JSON in package.json', () => {
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('invalid json{');
      mockParsePackageJson.mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      const result = identifyEntryPoints('/test/project');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle file read errors', () => {
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied');
      });
      mockParsePackageJson.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = identifyEntryPoints('/test/project');

      expect(result).toBeDefined();
    });

    test('should handle null or undefined package.json content', () => {
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockParsePackageJson.mockReturnValue(null as any);

      const result = identifyEntryPoints('/test/project');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle malformed exports field', () => {
      const mockPackageJson = {
        name: 'test-package',
        exports: null
      };
      mockParsePackageJson.mockReturnValue(mockPackageJson);
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockPackageJson));

      const result = identifyEntryPoints('/test/project');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});