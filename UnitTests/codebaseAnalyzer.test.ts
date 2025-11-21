import { analyzeCodebase } from '../codebaseAnalyzer';
import * as fs from 'fs';
import * as typescript from 'typescript';
import { parseSourceFile } from '../parseSourceFile';
import { extractFunctions } from '../extractFunctions';
import { detectCircularDependencies } from '../detectCircularDependencies';

// Mocks
jest.mock('fs');
jest.mock('typescript');
jest.mock('../parseSourceFile');
jest.mock('../extractFunctions');
jest.mock('../detectCircularDependencies');

describe('analyzeCodebase', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockTypescript = typescript as jest.Mocked<typeof typescript>;
  const mockParseSourceFile = parseSourceFile as jest.MockedFunction<typeof parseSourceFile>;
  const mockExtractFunctions = extractFunctions as jest.MockedFunction<typeof extractFunctions>;
  const mockDetectCircularDependencies = detectCircularDependencies as jest.MockedFunction<typeof detectCircularDependencies>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    test('should successfully analyze a simple codebase', async () => {
      const mockSourceFile = { fileName: 'test.ts', statements: [] } as any;
      const mockFunctions = [
        { name: 'testFunction', lineStart: 1, lineEnd: 10, complexity: 2 }
      ];
      
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readdirSync = jest.fn().mockReturnValue(['test.ts']);
      mockFs.readFileSync = jest.fn().mockReturnValue('function testFunction() {}');
      mockFs.statSync = jest.fn().mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);
      
      mockParseSourceFile.mockReturnValue(mockSourceFile);
      mockExtractFunctions.mockReturnValue(mockFunctions);
      mockDetectCircularDependencies.mockReturnValue([]);

      const result = await analyzeCodebase('/test/path');

      expect(result).toBeDefined();
      expect(mockParseSourceFile).toHaveBeenCalled();
      expect(mockExtractFunctions).toHaveBeenCalled();
      expect(mockDetectCircularDependencies).toHaveBeenCalled();
    });

    test('should analyze multiple files in codebase', async () => {
      const mockFiles = ['file1.ts', 'file2.ts', 'file3.ts'];
      const mockSourceFile = { fileName: 'test.ts', statements: [] } as any;
      const mockFunctions = [
        { name: 'func1', lineStart: 1, lineEnd: 5, complexity: 1 },
        { name: 'func2', lineStart: 6, lineEnd: 10, complexity: 3 }
      ];

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readdirSync = jest.fn().mockReturnValue(mockFiles);
      mockFs.readFileSync = jest.fn().mockReturnValue('const test = 1;');
      mockFs.statSync = jest.fn().mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);
      
      mockParseSourceFile.mockReturnValue(mockSourceFile);
      mockExtractFunctions.mockReturnValue(mockFunctions);
      mockDetectCircularDependencies.mockReturnValue([]);

      const result = await analyzeCodebase('/test/path');

      expect(result).toBeDefined();
      expect(mockParseSourceFile).toHaveBeenCalledTimes(mockFiles.length);
    });

    test('should detect and report circular dependencies', async () => {
      const mockSourceFile = { fileName: 'test.ts', statements: [] } as any;
      const mockCircularDeps = [
        { from: 'moduleA.ts', to: 'moduleB.ts' },
        { from: 'moduleB.ts', to: 'moduleA.ts' }
      ];

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readdirSync = jest.fn().mockReturnValue(['test.ts']);
      mockFs.readFileSync = jest.fn().mockReturnValue('import "./other";');
      mockFs.statSync = jest.fn().mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);
      
      mockParseSourceFile.mockReturnValue(mockSourceFile);
      mockExtractFunctions.mockReturnValue([]);
      mockDetectCircularDependencies.mockReturnValue(mockCircularDeps);

      const result = await analyzeCodebase('/test/path');

      expect(result).toBeDefined();
      expect(mockDetectCircularDependencies).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('should handle empty directory', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readdirSync = jest.fn().mockReturnValue([]);
      mockFs.statSync = jest.fn().mockReturnValue({ isDirectory: () => true, isFile: () => false } as any);

      const result = await analyzeCodebase('/empty/path');

      expect(result).toBeDefined();
      expect(mockParseSourceFile).not.toHaveBeenCalled();
    });

    test('should skip non-TypeScript files', async () => {
      const mockFiles = ['test.js', 'readme.md', 'config.json', 'valid.ts'];
      const mockSourceFile = { fileName: 'valid.ts', statements: [] } as any;

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readdirSync = jest.fn().mockReturnValue(mockFiles);
      mockFs.readFileSync = jest.fn().mockReturnValue('const x = 1;');
      mockFs.statSync = jest.fn().mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);
      
      mockParseSourceFile.mockReturnValue(mockSourceFile);
      mockExtractFunctions.mockReturnValue([]);
      mockDetectCircularDependencies.mockReturnValue([]);

      const result = await analyzeCodebase('/test/path');

      expect(result).toBeDefined();
    });

    test('should handle nested directory structure', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readdirSync = jest.fn()
        .mockReturnValueOnce(['subdir', 'file.ts'])
        .mockReturnValueOnce(['nested.ts']);
      mockFs.readFileSync = jest.fn().mockReturnValue('const y = 2;');
      mockFs.statSync = jest.fn()
        .mockReturnValueOnce({ isDirectory: () => true, isFile: () => false } as any)
        .mockReturnValueOnce({ isDirectory: () => false, isFile: () => true } as any)
        .mockReturnValueOnce({ isDirectory: () => false, isFile: () => true } as any);
      
      const mockSourceFile = { fileName: 'test.ts', statements: [] } as any;
      mockParseSourceFile.mockReturnValue(mockSourceFile);
      mockExtractFunctions.mockReturnValue([]);
      mockDetectCircularDependencies.mockReturnValue([]);

      const result = await analyzeCodebase('/test/path');

      expect(result).toBeDefined();
    });

    test('should handle files with no functions', async () => {
      const mockSourceFile = { fileName: 'empty.ts', statements: [] } as any;

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readdirSync = jest.fn().mockReturnValue(['empty.ts']);
      mockFs.readFileSync = jest.fn().mockReturnValue('const CONSTANT = 42;');
      mockFs.statSync = jest.fn().mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);
      
      mockParseSourceFile.mockReturnValue(mockSourceFile);
      mockExtractFunctions.mockReturnValue([]);
      mockDetectCircularDependencies.mockReturnValue([]);

      const result = await analyzeCodebase('/test/path');

      expect(result).toBeDefined();
      expect(mockExtractFunctions).toHaveBeenCalled();
    });

    test('should handle special characters in file paths', async () => {
      const mockSourceFile = { fileName: 'test file (1).ts', statements: [] } as any;

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readdirSync = jest.fn().mockReturnValue(['test file (1).ts']);
      mockFs.readFileSync = jest.fn().mockReturnValue('const z = 3;');
      mockFs.statSync = jest.fn().mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);
      
      mockParseSourceFile.mockReturnValue(mockSourceFile);
      mockExtractFunctions.mockReturnValue([]);
      mockDetectCircularDependencies.mockReturnValue([]);

      const result = await analyzeCodebase('/test/path with spaces');

      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    test('should throw error when path does not exist', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false);

      await expect(analyzeCodebase('/nonexistent/path')).rejects.toThrow();
    });

    test('should handle file read errors gracefully', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readdirSync = jest.fn().mockReturnValue(['error.ts']);
      mockFs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied');
      });
      mockFs.statSync = jest.fn().mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);

      await expect(analyzeCodebase('/test/path')).rejects.toThrow('Permission denied');
    });

    test('should handle parse errors in source files', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readdirSync = jest.fn().mockReturnValue(['invalid.ts']);
      mockFs.readFileSync = jest.fn().mockReturnValue('invalid typescript code {{{');
      mockFs.statSync = jest.fn().mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);
      
      mockParseSourceFile.mockImplementation(() => {
        throw new Error('Parse error');
      });

      await expect(analyzeCodebase('/test/path')).rejects.toThrow('Parse error');
    });

    test('should handle null or undefined input path', async () => {
      await expect(analyzeCodebase(null as any)).rejects.toThrow();
      await expect(analyzeCodebase(undefined as any)).rejects.toThrow();
    });

    test('should handle empty string path', async () => {
      await expect(analyzeCodebase('')).rejects.toThrow();
    });

    test('should handle errors in extractFunctions', async () => {
      const mockSourceFile = { fileName: 'test.ts', statements: [] } as any;

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readdirSync = jest.fn().mockReturnValue(['test.ts']);
      mockFs.readFileSync = jest.fn().mockReturnValue('function test() {}');
      mockFs.statSync = jest.fn().mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);
      
      mockParseSourceFile.mockReturnValue(mockSourceFile);
      mockExtractFunctions.mockImplementation(() => {
        throw new Error('Extraction failed');
      });

      await expect(analyzeCodebase('/test/path')).rejects.toThrow('Extraction failed');
    });

    test('should handle errors in detectCircularDependencies', async () => {
      const mockSourceFile = { fileName: 'test.ts', statements: [] } as any;

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readdirSync = jest.fn().mockReturnValue(['test.ts']);
      mockFs.readFileSync = jest.fn().mockReturnValue('import x from "y";');
      mockFs.statSync = jest.fn().mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);
      
      mockParseSourceFile.mockReturnValue(mockSourceFile);
      mockExtractFunctions.mockReturnValue([]);
      mockDetectCircularDependencies.mockImplementation(() => {
        throw new Error('Circular dependency check failed');
      });

      await expect(analyzeCodebase('/test/path')).rejects.toThrow('Circular dependency check failed');
    });
  });
});