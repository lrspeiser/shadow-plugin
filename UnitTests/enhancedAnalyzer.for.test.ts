import * as fs from 'fs';
import * as path from 'path';
import { EnhancedAnalyzer } from '../enhancedAnalyzer';

// Mocks
jest.mock('fs');

describe('EnhancedAnalyzer - for loop in mapTestsToSourceFiles', () => {
  let analyzer: EnhancedAnalyzer;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFs = fs as jest.Mocked<typeof fs>;
    analyzer = new EnhancedAnalyzer();
  });

  describe('processing test files', () => {
    test('should map test files to source files correctly', () => {
      const testFiles = ['test/foo.test.ts', 'test/bar.test.ts'];
      const sourceFiles = ['src/foo.ts', 'src/bar.ts'];
      const mapping = {
        sourceFileToTests: new Map<string, string[]>(),
        functionToTests: new Map<string, string[]>()
      };

      mockFs.readFileSync = jest.fn()
        .mockReturnValueOnce('describe("foo", () => { test("should handle foo", () => {}); })')
        .mockReturnValueOnce('describe("bar", () => { test("should process bar", () => {}); })');

      jest.spyOn(analyzer as any, 'inferSourceFile')
        .mockReturnValueOnce('src/foo.ts')
        .mockReturnValueOnce('src/bar.ts');
      jest.spyOn(analyzer as any, 'extractTestNames')
        .mockReturnValueOnce(['should handle foo'])
        .mockReturnValueOnce(['should process bar']);
      jest.spyOn(analyzer as any, 'inferFunctionFromTestName')
        .mockReturnValue('handleFoo')
        .mockReturnValueOnce('handleFoo')
        .mockReturnValueOnce('processBar');

      for (const testFile of testFiles) {
        try {
          const content = mockFs.readFileSync(testFile, 'utf-8') as string;
          const sourceFile = (analyzer as any).inferSourceFile(testFile, content, sourceFiles);
          const testNames = (analyzer as any).extractTestNames(content);

          if (sourceFile) {
            if (!mapping.sourceFileToTests.has(sourceFile)) {
              mapping.sourceFileToTests.set(sourceFile, []);
            }
            mapping.sourceFileToTests.get(sourceFile)!.push(testFile);

            for (const testName of testNames) {
              const functionName = (analyzer as any).inferFunctionFromTestName(testName);
              if (functionName) {
                if (!mapping.functionToTests.has(functionName)) {
                  mapping.functionToTests.set(functionName, []);
                }
                mapping.functionToTests.get(functionName)!.push(testName);
              }
            }
          }
        } catch (error) {
          console.warn(`Error mapping test file ${testFile}:`, error);
        }
      }

      expect(mapping.sourceFileToTests.get('src/foo.ts')).toEqual(['test/foo.test.ts']);
      expect(mapping.sourceFileToTests.get('src/bar.ts')).toEqual(['test/bar.test.ts']);
      expect(mapping.functionToTests.get('handleFoo')).toContain('should handle foo');
      expect(mapping.functionToTests.get('processBar')).toContain('should process bar');
    });

    test('should handle test files with no matching source file', () => {
      const testFiles = ['test/orphan.test.ts'];
      const sourceFiles = ['src/foo.ts'];
      const mapping = {
        sourceFileToTests: new Map<string, string[]>(),
        functionToTests: new Map<string, string[]>()
      };

      mockFs.readFileSync = jest.fn()
        .mockReturnValueOnce('test("orphan test", () => {})');

      jest.spyOn(analyzer as any, 'inferSourceFile').mockReturnValueOnce(null);
      jest.spyOn(analyzer as any, 'extractTestNames').mockReturnValueOnce(['orphan test']);

      for (const testFile of testFiles) {
        try {
          const content = mockFs.readFileSync(testFile, 'utf-8') as string;
          const sourceFile = (analyzer as any).inferSourceFile(testFile, content, sourceFiles);
          const testNames = (analyzer as any).extractTestNames(content);

          if (sourceFile) {
            if (!mapping.sourceFileToTests.has(sourceFile)) {
              mapping.sourceFileToTests.set(sourceFile, []);
            }
            mapping.sourceFileToTests.get(sourceFile)!.push(testFile);

            for (const testName of testNames) {
              const functionName = (analyzer as any).inferFunctionFromTestName(testName);
              if (functionName) {
                if (!mapping.functionToTests.has(functionName)) {
                  mapping.functionToTests.set(functionName, []);
                }
                mapping.functionToTests.get(functionName)!.push(testName);
              }
            }
          }
        } catch (error) {
          console.warn(`Error mapping test file ${testFile}:`, error);
        }
      }

      expect(mapping.sourceFileToTests.size).toBe(0);
      expect(mapping.functionToTests.size).toBe(0);
    });

    test('should handle multiple test names in a single file', () => {
      const testFiles = ['test/multi.test.ts'];
      const sourceFiles = ['src/multi.ts'];
      const mapping = {
        sourceFileToTests: new Map<string, string[]>(),
        functionToTests: new Map<string, string[]>()
      };

      mockFs.readFileSync = jest.fn()
        .mockReturnValueOnce('test("test1", () => {}); test("test2", () => {}); test("test3", () => {})');

      jest.spyOn(analyzer as any, 'inferSourceFile').mockReturnValueOnce('src/multi.ts');
      jest.spyOn(analyzer as any, 'extractTestNames').mockReturnValueOnce(['test1', 'test2', 'test3']);
      jest.spyOn(analyzer as any, 'inferFunctionFromTestName')
        .mockReturnValueOnce('func1')
        .mockReturnValueOnce('func2')
        .mockReturnValueOnce('func3');

      for (const testFile of testFiles) {
        try {
          const content = mockFs.readFileSync(testFile, 'utf-8') as string;
          const sourceFile = (analyzer as any).inferSourceFile(testFile, content, sourceFiles);
          const testNames = (analyzer as any).extractTestNames(content);

          if (sourceFile) {
            if (!mapping.sourceFileToTests.has(sourceFile)) {
              mapping.sourceFileToTests.set(sourceFile, []);
            }
            mapping.sourceFileToTests.get(sourceFile)!.push(testFile);

            for (const testName of testNames) {
              const functionName = (analyzer as any).inferFunctionFromTestName(testName);
              if (functionName) {
                if (!mapping.functionToTests.has(functionName)) {
                  mapping.functionToTests.set(functionName, []);
                }
                mapping.functionToTests.get(functionName)!.push(testName);
              }
            }
          }
        } catch (error) {
          console.warn(`Error mapping test file ${testFile}:`, error);
        }
      }

      expect(mapping.sourceFileToTests.get('src/multi.ts')).toEqual(['test/multi.test.ts']);
      expect(mapping.functionToTests.size).toBe(3);
      expect(mapping.functionToTests.get('func1')).toContain('test1');
      expect(mapping.functionToTests.get('func2')).toContain('test2');
      expect(mapping.functionToTests.get('func3')).toContain('test3');
    });

    test('should handle error when reading test file', () => {
      const testFiles = ['test/error.test.ts', 'test/valid.test.ts'];
      const sourceFiles = ['src/valid.ts'];
      const mapping = {
        sourceFileToTests: new Map<string, string[]>(),
        functionToTests: new Map<string, string[]>()
      };
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockFs.readFileSync = jest.fn()
        .mockImplementationOnce(() => { throw new Error('File read error'); })
        .mockReturnValueOnce('test("valid test", () => {})');

      jest.spyOn(analyzer as any, 'inferSourceFile').mockReturnValueOnce('src/valid.ts');
      jest.spyOn(analyzer as any, 'extractTestNames').mockReturnValueOnce(['valid test']);
      jest.spyOn(analyzer as any, 'inferFunctionFromTestName').mockReturnValueOnce('validFunc');

      for (const testFile of testFiles) {
        try {
          const content = mockFs.readFileSync(testFile, 'utf-8') as string;
          const sourceFile = (analyzer as any).inferSourceFile(testFile, content, sourceFiles);
          const testNames = (analyzer as any).extractTestNames(content);

          if (sourceFile) {
            if (!mapping.sourceFileToTests.has(sourceFile)) {
              mapping.sourceFileToTests.set(sourceFile, []);
            }
            mapping.sourceFileToTests.get(sourceFile)!.push(testFile);

            for (const testName of testNames) {
              const functionName = (analyzer as any).inferFunctionFromTestName(testName);
              if (functionName) {
                if (!mapping.functionToTests.has(functionName)) {
                  mapping.functionToTests.set(functionName, []);
                }
                mapping.functionToTests.get(functionName)!.push(testName);
              }
            }
          }
        } catch (error) {
          console.warn(`Error mapping test file ${testFile}:`, error);
        }
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Error mapping test file test/error.test.ts:',
        expect.any(Error)
      );
      expect(mapping.sourceFileToTests.get('src/valid.ts')).toEqual(['test/valid.test.ts']);
      consoleWarnSpy.mockRestore();
    });

    test('should handle test names with no inferred function', () => {
      const testFiles = ['test/nofunction.test.ts'];
      const sourceFiles = ['src/nofunction.ts'];
      const mapping = {
        sourceFileToTests: new Map<string, string[]>(),
        functionToTests: new Map<string, string[]>()
      };

      mockFs.readFileSync = jest.fn()
        .mockReturnValueOnce('test("some generic test", () => {})');

      jest.spyOn(analyzer as any, 'inferSourceFile').mockReturnValueOnce('src/nofunction.ts');
      jest.spyOn(analyzer as any, 'extractTestNames').mockReturnValueOnce(['some generic test']);
      jest.spyOn(analyzer as any, 'inferFunctionFromTestName').mockReturnValueOnce(null);

      for (const testFile of testFiles) {
        try {
          const content = mockFs.readFileSync(testFile, 'utf-8') as string;
          const sourceFile = (analyzer as any).inferSourceFile(testFile, content, sourceFiles);
          const testNames = (analyzer as any).extractTestNames(content);

          if (sourceFile) {
            if (!mapping.sourceFileToTests.has(sourceFile)) {
              mapping.sourceFileToTests.set(sourceFile, []);
            }
            mapping.sourceFileToTests.get(sourceFile)!.push(testFile);

            for (const testName of testNames) {
              const functionName = (analyzer as any).inferFunctionFromTestName(testName);
              if (functionName) {
                if (!mapping.functionToTests.has(functionName)) {
                  mapping.functionToTests.set(functionName, []);
                }
                mapping.functionToTests.get(functionName)!.push(testName);
              }
            }
          }
        } catch (error) {
          console.warn(`Error mapping test file ${testFile}:`, error);
        }
      }

      expect(mapping.sourceFileToTests.get('src/nofunction.ts')).toEqual(['test/nofunction.test.ts']);
      expect(mapping.functionToTests.size).toBe(0);
    });

    test('should handle empty test files array', () => {
      const testFiles: string[] = [];
      const sourceFiles = ['src/foo.ts'];
      const mapping = {
        sourceFileToTests: new Map<string, string[]>(),
        functionToTests: new Map<string, string[]>()
      };

      for (const testFile of testFiles) {
        try {
          const content = mockFs.readFileSync(testFile, 'utf-8') as string;
          const sourceFile = (analyzer as any).inferSourceFile(testFile, content, sourceFiles);
          const testNames = (analyzer as any).extractTestNames(content);

          if (sourceFile) {
            if (!mapping.sourceFileToTests.has(sourceFile)) {
              mapping.sourceFileToTests.set(sourceFile, []);
            }
            mapping.sourceFileToTests.get(sourceFile)!.push(testFile);

            for (const testName of testNames) {
              const functionName = (analyzer as any).inferFunctionFromTestName(testName);
              if (functionName) {
                if (!mapping.functionToTests.has(functionName)) {
                  mapping.functionToTests.set(functionName, []);
                }
                mapping.functionToTests.get(functionName)!.push(testName);
              }
            }
          }
        } catch (error) {
          console.warn(`Error mapping test file ${testFile}:`, error);
        }
      }

      expect(mapping.sourceFileToTests.size).toBe(0);
      expect(mapping.functionToTests.size).toBe(0);
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });
  });
});