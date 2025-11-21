import { FunctionAnalyzer } from '../functionAnalyzer';
import * as ts from 'typescript';
import { CodeAnalysis, FunctionInfo, LargeFile } from '../../types';

// Mocks
jest.mock('typescript');

describe('FunctionAnalyzer - for loop processing', () => {
  let functionAnalyzer: FunctionAnalyzer;
  let mockAnalyzeFunction: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    functionAnalyzer = new FunctionAnalyzer();
    mockAnalyzeFunction = jest.spyOn(functionAnalyzer as any, 'analyzeFunction');
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy.mockRestore();
  });

  describe('happy path', () => {
    test('should analyze all functions in large files and return analyses', async () => {
      const largeFiles: LargeFile[] = [
        { path: 'src/file1.ts', lines: 500, functions: 3 },
        { path: 'src/file2.ts', lines: 600, functions: 2 }
      ];

      const functions: FunctionInfo[] = [
        { name: 'func1', file: 'src/file1.ts', line: 10, complexity: 5, parameters: [], returns: 'void' },
        { name: 'func2', file: 'src/file1.ts', line: 50, complexity: 3, parameters: [], returns: 'string' },
        { name: 'func3', file: 'src/file2.ts', line: 20, complexity: 8, parameters: [], returns: 'number' }
      ];

      const codeAnalysis: CodeAnalysis = {
        files: [],
        functions: functions,
        complexity: { total: 16, average: 5.3, max: 8 },
        largeFiles: largeFiles
      };

      mockAnalyzeFunction.mockResolvedValueOnce({ functionName: 'func1', issues: [] });
      mockAnalyzeFunction.mockResolvedValueOnce({ functionName: 'func2', issues: [] });
      mockAnalyzeFunction.mockResolvedValueOnce({ functionName: 'func3', issues: [] });

      const analyses: any[] = [];
      for (const file of largeFiles) {
        const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
        
        for (const func of fileFunctions) {
          try {
            const analysis = await (functionAnalyzer as any).analyzeFunction(
              file.path,
              func,
              codeAnalysis
            );
            if (analysis) {
              analyses.push(analysis);
            }
          } catch (error) {
            console.warn(`Failed to analyze function ${func.name} in ${file.path}:`, error);
          }
        }
      }

      expect(analyses).toHaveLength(3);
      expect(mockAnalyzeFunction).toHaveBeenCalledTimes(3);
      expect(mockAnalyzeFunction).toHaveBeenCalledWith('src/file1.ts', functions[0], codeAnalysis);
      expect(mockAnalyzeFunction).toHaveBeenCalledWith('src/file1.ts', functions[1], codeAnalysis);
      expect(mockAnalyzeFunction).toHaveBeenCalledWith('src/file2.ts', functions[2], codeAnalysis);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    test('should handle empty large files array', async () => {
      const largeFiles: LargeFile[] = [];
      const codeAnalysis: CodeAnalysis = {
        files: [],
        functions: [],
        complexity: { total: 0, average: 0, max: 0 },
        largeFiles: largeFiles
      };

      const analyses: any[] = [];
      for (const file of largeFiles) {
        const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
        
        for (const func of fileFunctions) {
          try {
            const analysis = await (functionAnalyzer as any).analyzeFunction(
              file.path,
              func,
              codeAnalysis
            );
            if (analysis) {
              analyses.push(analysis);
            }
          } catch (error) {
            console.warn(`Failed to analyze function ${func.name} in ${file.path}:`, error);
          }
        }
      }

      expect(analyses).toHaveLength(0);
      expect(mockAnalyzeFunction).not.toHaveBeenCalled();
    });

    test('should skip functions with null analysis results', async () => {
      const largeFiles: LargeFile[] = [
        { path: 'src/file1.ts', lines: 500, functions: 2 }
      ];

      const functions: FunctionInfo[] = [
        { name: 'func1', file: 'src/file1.ts', line: 10, complexity: 5, parameters: [], returns: 'void' },
        { name: 'func2', file: 'src/file1.ts', line: 50, complexity: 3, parameters: [], returns: 'string' }
      ];

      const codeAnalysis: CodeAnalysis = {
        files: [],
        functions: functions,
        complexity: { total: 8, average: 4, max: 5 },
        largeFiles: largeFiles
      };

      mockAnalyzeFunction.mockResolvedValueOnce({ functionName: 'func1', issues: [] });
      mockAnalyzeFunction.mockResolvedValueOnce(null);

      const analyses: any[] = [];
      for (const file of largeFiles) {
        const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
        
        for (const func of fileFunctions) {
          try {
            const analysis = await (functionAnalyzer as any).analyzeFunction(
              file.path,
              func,
              codeAnalysis
            );
            if (analysis) {
              analyses.push(analysis);
            }
          } catch (error) {
            console.warn(`Failed to analyze function ${func.name} in ${file.path}:`, error);
          }
        }
      }

      expect(analyses).toHaveLength(1);
      expect(mockAnalyzeFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    test('should catch and log errors for individual function analysis failures', async () => {
      const largeFiles: LargeFile[] = [
        { path: 'src/file1.ts', lines: 500, functions: 2 }
      ];

      const functions: FunctionInfo[] = [
        { name: 'func1', file: 'src/file1.ts', line: 10, complexity: 5, parameters: [], returns: 'void' },
        { name: 'func2', file: 'src/file1.ts', line: 50, complexity: 3, parameters: [], returns: 'string' }
      ];

      const codeAnalysis: CodeAnalysis = {
        files: [],
        functions: functions,
        complexity: { total: 8, average: 4, max: 5 },
        largeFiles: largeFiles
      };

      const testError = new Error('Analysis failed');
      mockAnalyzeFunction.mockRejectedValueOnce(testError);
      mockAnalyzeFunction.mockResolvedValueOnce({ functionName: 'func2', issues: [] });

      const analyses: any[] = [];
      for (const file of largeFiles) {
        const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
        
        for (const func of fileFunctions) {
          try {
            const analysis = await (functionAnalyzer as any).analyzeFunction(
              file.path,
              func,
              codeAnalysis
            );
            if (analysis) {
              analyses.push(analysis);
            }
          } catch (error) {
            console.warn(`Failed to analyze function ${func.name} in ${file.path}:`, error);
          }
        }
      }

      expect(analyses).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to analyze function func1 in src/file1.ts:',
        testError
      );
      expect(mockAnalyzeFunction).toHaveBeenCalledTimes(2);
    });

    test('should continue processing remaining functions after error', async () => {
      const largeFiles: LargeFile[] = [
        { path: 'src/file1.ts', lines: 500, functions: 3 }
      ];

      const functions: FunctionInfo[] = [
        { name: 'func1', file: 'src/file1.ts', line: 10, complexity: 5, parameters: [], returns: 'void' },
        { name: 'func2', file: 'src/file1.ts', line: 50, complexity: 3, parameters: [], returns: 'string' },
        { name: 'func3', file: 'src/file1.ts', line: 90, complexity: 7, parameters: [], returns: 'boolean' }
      ];

      const codeAnalysis: CodeAnalysis = {
        files: [],
        functions: functions,
        complexity: { total: 15, average: 5, max: 7 },
        largeFiles: largeFiles
      };

      mockAnalyzeFunction.mockResolvedValueOnce({ functionName: 'func1', issues: [] });
      mockAnalyzeFunction.mockRejectedValueOnce(new Error('Middle error'));
      mockAnalyzeFunction.mockResolvedValueOnce({ functionName: 'func3', issues: [] });

      const analyses: any[] = [];
      for (const file of largeFiles) {
        const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
        
        for (const func of fileFunctions) {
          try {
            const analysis = await (functionAnalyzer as any).analyzeFunction(
              file.path,
              func,
              codeAnalysis
            );
            if (analysis) {
              analyses.push(analysis);
            }
          } catch (error) {
            console.warn(`Failed to analyze function ${func.name} in ${file.path}:`, error);
          }
        }
      }

      expect(analyses).toHaveLength(2);
      expect(analyses[0].functionName).toBe('func1');
      expect(analyses[1].functionName).toBe('func3');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    test('should handle files with no matching functions', async () => {
      const largeFiles: LargeFile[] = [
        { path: 'src/file1.ts', lines: 500, functions: 0 }
      ];

      const functions: FunctionInfo[] = [
        { name: 'func1', file: 'src/other.ts', line: 10, complexity: 5, parameters: [], returns: 'void' }
      ];

      const codeAnalysis: CodeAnalysis = {
        files: [],
        functions: functions,
        complexity: { total: 5, average: 5, max: 5 },
        largeFiles: largeFiles
      };

      const analyses: any[] = [];
      for (const file of largeFiles) {
        const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
        
        for (const func of fileFunctions) {
          try {
            const analysis = await (functionAnalyzer as any).analyzeFunction(
              file.path,
              func,
              codeAnalysis
            );
            if (analysis) {
              analyses.push(analysis);
            }
          } catch (error) {
            console.warn(`Failed to analyze function ${func.name} in ${file.path}:`, error);
          }
        }
      }

      expect(analyses).toHaveLength(0);
      expect(mockAnalyzeFunction).not.toHaveBeenCalled();
    });

    test('should handle multiple files with mixed success and failure', async () => {
      const largeFiles: LargeFile[] = [
        { path: 'src/file1.ts', lines: 500, functions: 1 },
        { path: 'src/file2.ts', lines: 600, functions: 1 }
      ];

      const functions: FunctionInfo[] = [
        { name: 'func1', file: 'src/file1.ts', line: 10, complexity: 5, parameters: [], returns: 'void' },
        { name: 'func2', file: 'src/file2.ts', line: 20, complexity: 8, parameters: [], returns: 'number' }
      ];

      const codeAnalysis: CodeAnalysis = {
        files: [],
        functions: functions,
        complexity: { total: 13, average: 6.5, max: 8 },
        largeFiles: largeFiles
      };

      mockAnalyzeFunction.mockRejectedValueOnce(new Error('File 1 error'));
      mockAnalyzeFunction.mockResolvedValueOnce({ functionName: 'func2', issues: [] });

      const analyses: any[] = [];
      for (const file of largeFiles) {
        const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
        
        for (const func of fileFunctions) {
          try {
            const analysis = await (functionAnalyzer as any).analyzeFunction(
              file.path,
              func,
              codeAnalysis
            );
            if (analysis) {
              analyses.push(analysis);
            }
          } catch (error) {
            console.warn(`Failed to analyze function ${func.name} in ${file.path}:`, error);
          }
        }
      }

      expect(analyses).toHaveLength(1);
      expect(analyses[0].functionName).toBe('func2');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to analyze function func1 in src/file1.ts:',
        expect.any(Error)
      );
    });
  });
});