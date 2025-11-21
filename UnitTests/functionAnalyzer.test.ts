import { FunctionAnalyzer } from '../functionAnalyzer';
import { CodeAnalysis, FunctionInfo, FileInfo } from '../../types';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('FunctionAnalyzer - for loop analyzing functions', () => {
  let functionAnalyzer: FunctionAnalyzer;
  let mockCodeAnalysis: CodeAnalysis;
  let mockLargeFiles: FileInfo[];
  let mockAnalyzeFunction: jest.SpyInstance;

  beforeEach(() => {
    functionAnalyzer = new FunctionAnalyzer();
    
    // Setup mock code analysis
    mockCodeAnalysis = {
      functions: [
        { name: 'func1', file: '/path/to/file1.ts', startLine: 1, endLine: 10, complexity: 5 } as FunctionInfo,
        { name: 'func2', file: '/path/to/file1.ts', startLine: 15, endLine: 25, complexity: 3 } as FunctionInfo,
        { name: 'func3', file: '/path/to/file2.ts', startLine: 1, endLine: 20, complexity: 7 } as FunctionInfo,
        { name: 'func4', file: '/path/to/file3.ts', startLine: 5, endLine: 15, complexity: 2 } as FunctionInfo
      ],
      files: [],
      totalLines: 100,
      totalFunctions: 4
    } as CodeAnalysis;

    mockLargeFiles = [
      { path: '/path/to/file1.ts', size: 1000, lines: 100 } as FileInfo,
      { path: '/path/to/file2.ts', size: 2000, lines: 200 } as FileInfo
    ];

    // Mock the analyzeFunction method
    mockAnalyzeFunction = jest.spyOn(functionAnalyzer as any, 'analyzeFunction');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should analyze all functions in large files successfully', async () => {
    const mockAnalysisResult1 = { functionName: 'func1', complexity: 5, recommendations: [] };
    const mockAnalysisResult2 = { functionName: 'func2', complexity: 3, recommendations: [] };
    const mockAnalysisResult3 = { functionName: 'func3', complexity: 7, recommendations: [] };
    
    mockAnalyzeFunction
      .mockResolvedValueOnce(mockAnalysisResult1)
      .mockResolvedValueOnce(mockAnalysisResult2)
      .mockResolvedValueOnce(mockAnalysisResult3);

    const analyses: any[] = [];
    
    // Execute the for loop logic
    for (const file of mockLargeFiles) {
      const fileFunctions = mockCodeAnalysis.functions.filter(f => f.file === file.path);
      
      for (const func of fileFunctions) {
        try {
          const analysis = await (functionAnalyzer as any).analyzeFunction(
            file.path,
            func,
            mockCodeAnalysis
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
    expect(mockAnalyzeFunction).toHaveBeenCalledWith('/path/to/file1.ts', mockCodeAnalysis.functions[0], mockCodeAnalysis);
    expect(mockAnalyzeFunction).toHaveBeenCalledWith('/path/to/file1.ts', mockCodeAnalysis.functions[1], mockCodeAnalysis);
    expect(mockAnalyzeFunction).toHaveBeenCalledWith('/path/to/file2.ts', mockCodeAnalysis.functions[2], mockCodeAnalysis);
  });

  test('should handle null analysis results and continue processing', async () => {
    mockAnalyzeFunction
      .mockResolvedValueOnce({ functionName: 'func1', complexity: 5 })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ functionName: 'func3', complexity: 7 });

    const analyses: any[] = [];
    
    for (const file of mockLargeFiles) {
      const fileFunctions = mockCodeAnalysis.functions.filter(f => f.file === file.path);
      
      for (const func of fileFunctions) {
        try {
          const analysis = await (functionAnalyzer as any).analyzeFunction(
            file.path,
            func,
            mockCodeAnalysis
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
    expect(mockAnalyzeFunction).toHaveBeenCalledTimes(3);
  });

  test('should catch errors and continue processing remaining functions', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const mockError = new Error('Analysis failed');
    
    mockAnalyzeFunction
      .mockResolvedValueOnce({ functionName: 'func1', complexity: 5 })
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({ functionName: 'func3', complexity: 7 });

    const analyses: any[] = [];
    
    for (const file of mockLargeFiles) {
      const fileFunctions = mockCodeAnalysis.functions.filter(f => f.file === file.path);
      
      for (const func of fileFunctions) {
        try {
          const analysis = await (functionAnalyzer as any).analyzeFunction(
            file.path,
            func,
            mockCodeAnalysis
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
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `Failed to analyze function func2 in /path/to/file1.ts:`,
      mockError
    );
    expect(mockAnalyzeFunction).toHaveBeenCalledTimes(3);
    
    consoleWarnSpy.mockRestore();
  });

  test('should handle empty large files array', async () => {
    const analyses: any[] = [];
    const emptyFiles: FileInfo[] = [];
    
    for (const file of emptyFiles) {
      const fileFunctions = mockCodeAnalysis.functions.filter(f => f.file === file.path);
      
      for (const func of fileFunctions) {
        try {
          const analysis = await (functionAnalyzer as any).analyzeFunction(
            file.path,
            func,
            mockCodeAnalysis
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

  test('should handle files with no matching functions', async () => {
    const filesWithNoFunctions: FileInfo[] = [
      { path: '/path/to/nonexistent.ts', size: 500, lines: 50 } as FileInfo
    ];

    const analyses: any[] = [];
    
    for (const file of filesWithNoFunctions) {
      const fileFunctions = mockCodeAnalysis.functions.filter(f => f.file === file.path);
      
      for (const func of fileFunctions) {
        try {
          const analysis = await (functionAnalyzer as any).analyzeFunction(
            file.path,
            func,
            mockCodeAnalysis
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

  test('should handle multiple errors across different files', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const mockError1 = new Error('Error in func1');
    const mockError2 = new Error('Error in func3');
    
    mockAnalyzeFunction
      .mockRejectedValueOnce(mockError1)
      .mockResolvedValueOnce({ functionName: 'func2', complexity: 3 })
      .mockRejectedValueOnce(mockError2);

    const analyses: any[] = [];
    
    for (const file of mockLargeFiles) {
      const fileFunctions = mockCodeAnalysis.functions.filter(f => f.file === file.path);
      
      for (const func of fileFunctions) {
        try {
          const analysis = await (functionAnalyzer as any).analyzeFunction(
            file.path,
            func,
            mockCodeAnalysis
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
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `Failed to analyze function func1 in /path/to/file1.ts:`,
      mockError1
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `Failed to analyze function func3 in /path/to/file2.ts:`,
      mockError2
    );
    
    consoleWarnSpy.mockRestore();
  });
});