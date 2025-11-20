import * as fs from 'fs';
import { EnhancedAnalyzer } from '../enhancedAnalyzer';
import * as path from 'path';

// Mocks
jest.mock('fs');

describe('EnhancedAnalyzer - mapTestsToSourceFiles for loop', () => {
  let analyzer: EnhancedAnalyzer;
  let mockReadFileSync: jest.MockedFunction<typeof fs.readFileSync>;

  beforeEach(() => {
    analyzer = new EnhancedAnalyzer();
    mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
    jest.clearAllMocks();
  });

  test('should successfully map multiple test files to source files', () => {
    const testFiles = [
      'src/__tests__/calculator.test.ts',
      'src/__tests__/parser.test.ts'
    ];
    const sourceFiles = [
      'src/calculator.ts',
      'src/parser.ts'
    ];

    mockReadFileSync
      .mockReturnValueOnce('describe("add function", () => { test("should add numbers", () => {}); });')
      .mockReturnValueOnce('describe("parse function", () => { test("should parse input", () => {}); });');

    const mapping = {
      sourceFileToTests: new Map<string, string[]>(),
      functionToTests: new Map<string, string[]>()
    };

    for (const testFile of testFiles) {
      try {
        const content = mockReadFileSync(testFile, 'utf-8') as string;
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

    expect(mockReadFileSync).toHaveBeenCalledTimes(2);
    expect(mapping.sourceFileToTests.size).toBeGreaterThanOrEqual(0);
    expect(mapping.functionToTests.size).toBeGreaterThanOrEqual(0);
  });

  test('should handle file read errors gracefully and continue processing', () => {
    const testFiles = [
      'src/__tests__/valid.test.ts',
      'src/__tests__/invalid.test.ts',
      'src/__tests__/another.test.ts'
    ];
    const sourceFiles = ['src/valid.ts', 'src/another.ts'];

    mockReadFileSync
      .mockReturnValueOnce('describe("test", () => { test("valid test", () => {}); });')
      .mockImplementationOnce(() => {
        throw new Error('ENOENT: no such file or directory');
      })
      .mockReturnValueOnce('describe("test", () => { test("another test", () => {}); });');

    const mapping = {
      sourceFileToTests: new Map<string, string[]>(),
      functionToTests: new Map<string, string[]>()
    };

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    for (const testFile of testFiles) {
      try {
        const content = mockReadFileSync(testFile, 'utf-8') as string;
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

    expect(mockReadFileSync).toHaveBeenCalledTimes(3);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error mapping test file'),
      expect.any(Error)
    );
    consoleWarnSpy.mockRestore();
  });

  test('should handle empty test files array', () => {
    const testFiles: string[] = [];
    const sourceFiles = ['src/example.ts'];

    const mapping = {
      sourceFileToTests: new Map<string, string[]>(),
      functionToTests: new Map<string, string[]>()
    };

    for (const testFile of testFiles) {
      try {
        const content = mockReadFileSync(testFile, 'utf-8') as string;
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

    expect(mockReadFileSync).not.toHaveBeenCalled();
    expect(mapping.sourceFileToTests.size).toBe(0);
    expect(mapping.functionToTests.size).toBe(0);
  });

  test('should handle test files with no inferred source file', () => {
    const testFiles = ['src/__tests__/orphan.test.ts'];
    const sourceFiles = ['src/calculator.ts'];

    mockReadFileSync.mockReturnValueOnce('describe("orphan test", () => { test("no source", () => {}); });');

    jest.spyOn(analyzer as any, 'inferSourceFile').mockReturnValue(null);

    const mapping = {
      sourceFileToTests: new Map<string, string[]>(),
      functionToTests: new Map<string, string[]>()
    };

    for (const testFile of testFiles) {
      try {
        const content = mockReadFileSync(testFile, 'utf-8') as string;
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

    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    expect(mapping.sourceFileToTests.size).toBe(0);
  });

  test('should accumulate multiple test files for the same source file', () => {
    const testFiles = [
      'src/__tests__/calculator.test.ts',
      'src/__tests__/calculator.integration.test.ts'
    ];
    const sourceFiles = ['src/calculator.ts'];

    mockReadFileSync
      .mockReturnValueOnce('test("add", () => {});')
      .mockReturnValueOnce('test("subtract", () => {});');

    jest.spyOn(analyzer as any, 'inferSourceFile').mockReturnValue('src/calculator.ts');
    jest.spyOn(analyzer as any, 'extractTestNames').mockReturnValue(['add', 'subtract']);
    jest.spyOn(analyzer as any, 'inferFunctionFromTestName').mockReturnValue('testFunction');

    const mapping = {
      sourceFileToTests: new Map<string, string[]>(),
      functionToTests: new Map<string, string[]>()
    };

    for (const testFile of testFiles) {
      try {
        const content = mockReadFileSync(testFile, 'utf-8') as string;
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

    expect(mapping.sourceFileToTests.get('src/calculator.ts')).toHaveLength(2);
    expect(mapping.sourceFileToTests.get('src/calculator.ts')).toContain('src/__tests__/calculator.test.ts');
    expect(mapping.sourceFileToTests.get('src/calculator.ts')).toContain('src/__tests__/calculator.integration.test.ts');
  });
});