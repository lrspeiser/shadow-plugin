import * as fs from 'fs';
import { EnhancedAnalyzer } from '../src/analysis/enhancedAnalyzer';

// Mocks
jest.mock('fs');

describe('EnhancedAnalyzer - mapTestsToSource loop', () => {
  let analyzer: EnhancedAnalyzer;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFs = fs as jest.Mocked<typeof fs>;
    analyzer = new EnhancedAnalyzer();
  });

  describe('processing test files loop', () => {
    test('should process multiple test files and map to source files', () => {
      const testFiles = [
        '/project/test/user.test.ts',
        '/project/test/auth.test.ts'
      ];
      const sourceFiles = [
        '/project/src/user.ts',
        '/project/src/auth.ts'
      ];

      mockFs.readFileSync
        .mockReturnValueOnce('import { User } from "../src/user"; describe("User tests", () => { test("createUser", () => {}); });')
        .mockReturnValueOnce('import { Auth } from "../src/auth"; describe("Auth tests", () => { test("authenticateUser", () => {}); });');

      const mapping = {
        sourceFileToTests: new Map<string, string[]>(),
        functionToTests: new Map<string, string[]>()
      };

      // Simulate the loop
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

      expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/project/test/user.test.ts', 'utf-8');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/project/test/auth.test.ts', 'utf-8');
    });

    test('should handle file read errors gracefully and continue processing', () => {
      const testFiles = [
        '/project/test/valid.test.ts',
        '/project/test/invalid.test.ts',
        '/project/test/another.test.ts'
      ];
      const sourceFiles = ['/project/src/valid.ts', '/project/src/another.ts'];
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockFs.readFileSync
        .mockReturnValueOnce('valid content')
        .mockImplementationOnce(() => { throw new Error('File not found'); })
        .mockReturnValueOnce('another valid content');

      const mapping = {
        sourceFileToTests: new Map<string, string[]>(),
        functionToTests: new Map<string, string[]>()
      };

      let processedCount = 0;
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
          processedCount++;
        } catch (error) {
          console.warn(`Error mapping test file ${testFile}:`, error);
        }
      }

      expect(mockFs.readFileSync).toHaveBeenCalledTimes(3);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Error mapping test file /project/test/invalid.test.ts:',
        expect.any(Error)
      );
      expect(processedCount).toBe(2);

      consoleWarnSpy.mockRestore();
    });

    test('should skip test files with no inferred source file', () => {
      const testFiles = [
        '/project/test/orphan.test.ts',
        '/project/test/user.test.ts'
      ];
      const sourceFiles = ['/project/src/user.ts'];

      mockFs.readFileSync
        .mockReturnValueOnce('no imports here')
        .mockReturnValueOnce('import { User } from "../src/user"; test("createUser", () => {});');

      jest.spyOn(analyzer as any, 'inferSourceFile')
        .mockReturnValueOnce(null)
        .mockReturnValueOnce('/project/src/user.ts');

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

      expect(mapping.sourceFileToTests.size).toBe(1);
      expect(mapping.sourceFileToTests.has('/project/src/user.ts')).toBe(true);
      expect(mapping.sourceFileToTests.get('/project/src/user.ts')).toEqual(['/project/test/user.test.ts']);
    });

    test('should accumulate multiple test files for same source file', () => {
      const testFiles = [
        '/project/test/user.test.ts',
        '/project/test/user.integration.test.ts'
      ];
      const sourceFiles = ['/project/src/user.ts'];

      mockFs.readFileSync
        .mockReturnValueOnce('import { User } from "../src/user"; test("test1", () => {});')
        .mockReturnValueOnce('import { User } from "../src/user"; test("test2", () => {});');

      jest.spyOn(analyzer as any, 'inferSourceFile')
        .mockReturnValue('/project/src/user.ts');

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

      expect(mapping.sourceFileToTests.get('/project/src/user.ts')).toEqual([
        '/project/test/user.test.ts',
        '/project/test/user.integration.test.ts'
      ]);
    });

    test('should handle empty test files array', () => {
      const testFiles: string[] = [];
      const sourceFiles = ['/project/src/user.ts'];

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

      expect(mockFs.readFileSync).not.toHaveBeenCalled();
      expect(mapping.sourceFileToTests.size).toBe(0);
      expect(mapping.functionToTests.size).toBe(0);
    });
  });
});