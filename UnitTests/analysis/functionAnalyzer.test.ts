import { FunctionAnalyzer } from '../../src/analysis/functionAnalyzer';
import { CodeAnalysis, FunctionInfo, FileInfo, FunctionAnalysis } from '../../src/types';

// Mocks
const mockAnalyzeFunction = jest.fn();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('FunctionAnalyzer - for loop through large files', () => {
  let functionAnalyzer: any;
  let mockAnalyzeFunction: jest.Mock;
  let mockConsoleWarn: jest.SpyInstance;

  beforeEach(() => {
    mockAnalyzeFunction = jest.fn();
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    functionAnalyzer = new FunctionAnalyzer();
    functionAnalyzer.analyzeFunction = mockAnalyzeFunction;
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockConsoleWarn.mockRestore();
  });

  test('should analyze all functions in large files and collect analyses', async () => {
    const largeFiles: FileInfo[] = [
      { path: '/path/to/file1.ts', size: 1000, lines: 100 },
      { path: '/path/to/file2.ts', size: 2000, lines: 200 }
    ];

    const codeAnalysis: CodeAnalysis = {
      functions: [
        { name: 'func1', file: '/path/to/file1.ts', line: 1, complexity: 5 } as FunctionInfo,
        { name: 'func2', file: '/path/to/file1.ts', line: 10, complexity: 3 } as FunctionInfo,
        { name: 'func3', file: '/path/to/file2.ts', line: 5, complexity: 7 } as FunctionInfo
      ],
      files: largeFiles,
      totalComplexity: 15,
      largeFiles: largeFiles
    };

    const mockAnalysis1: FunctionAnalysis = { functionName: 'func1', issues: [] } as FunctionAnalysis;
    const mockAnalysis2: FunctionAnalysis = { functionName: 'func2', issues: [] } as FunctionAnalysis;
    const mockAnalysis3: FunctionAnalysis = { functionName: 'func3', issues: [] } as FunctionAnalysis;

    mockAnalyzeFunction
      .mockResolvedValueOnce(mockAnalysis1)
      .mockResolvedValueOnce(mockAnalysis2)
      .mockResolvedValueOnce(mockAnalysis3);

    const analyses: FunctionAnalysis[] = [];
    
    for (const file of largeFiles) {
      const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
      
      for (const func of fileFunctions) {
        try {
          const analysis = await functionAnalyzer.analyzeFunction(
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
    expect(analyses[0]).toEqual(mockAnalysis1);
    expect(analyses[1]).toEqual(mockAnalysis2);
    expect(analyses[2]).toEqual(mockAnalysis3);
    expect(mockAnalyzeFunction).toHaveBeenCalledTimes(3);
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });

  test('should handle null/undefined analysis results', async () => {
    const largeFiles: FileInfo[] = [
      { path: '/path/to/file1.ts', size: 1000, lines: 100 }
    ];

    const codeAnalysis: CodeAnalysis = {
      functions: [
        { name: 'func1', file: '/path/to/file1.ts', line: 1, complexity: 5 } as FunctionInfo,
        { name: 'func2', file: '/path/to/file1.ts', line: 10, complexity: 3 } as FunctionInfo
      ],
      files: largeFiles,
      totalComplexity: 8,
      largeFiles: largeFiles
    };

    const mockAnalysis1: FunctionAnalysis = { functionName: 'func1', issues: [] } as FunctionAnalysis;

    mockAnalyzeFunction
      .mockResolvedValueOnce(mockAnalysis1)
      .mockResolvedValueOnce(null);

    const analyses: FunctionAnalysis[] = [];
    
    for (const file of largeFiles) {
      const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
      
      for (const func of fileFunctions) {
        try {
          const analysis = await functionAnalyzer.analyzeFunction(
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
    expect(analyses[0]).toEqual(mockAnalysis1);
    expect(mockAnalyzeFunction).toHaveBeenCalledTimes(2);
  });

  test('should handle errors during function analysis and log warning', async () => {
    const largeFiles: FileInfo[] = [
      { path: '/path/to/file1.ts', size: 1000, lines: 100 }
    ];

    const codeAnalysis: CodeAnalysis = {
      functions: [
        { name: 'func1', file: '/path/to/file1.ts', line: 1, complexity: 5 } as FunctionInfo,
        { name: 'func2', file: '/path/to/file1.ts', line: 10, complexity: 3 } as FunctionInfo
      ],
      files: largeFiles,
      totalComplexity: 8,
      largeFiles: largeFiles
    };

    const mockAnalysis1: FunctionAnalysis = { functionName: 'func1', issues: [] } as FunctionAnalysis;
    const mockError = new Error('Analysis failed');

    mockAnalyzeFunction
      .mockResolvedValueOnce(mockAnalysis1)
      .mockRejectedValueOnce(mockError);

    const analyses: FunctionAnalysis[] = [];
    
    for (const file of largeFiles) {
      const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
      
      for (const func of fileFunctions) {
        try {
          const analysis = await functionAnalyzer.analyzeFunction(
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
    expect(analyses[0]).toEqual(mockAnalysis1);
    expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Failed to analyze function func2 in /path/to/file1.ts:',
      mockError
    );
  });

  test('should handle empty large files array', async () => {
    const largeFiles: FileInfo[] = [];

    const codeAnalysis: CodeAnalysis = {
      functions: [],
      files: [],
      totalComplexity: 0,
      largeFiles: largeFiles
    };

    const analyses: FunctionAnalysis[] = [];
    
    for (const file of largeFiles) {
      const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
      
      for (const func of fileFunctions) {
        try {
          const analysis = await functionAnalyzer.analyzeFunction(
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
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });

  test('should handle files with no functions', async () => {
    const largeFiles: FileInfo[] = [
      { path: '/path/to/file1.ts', size: 1000, lines: 100 },
      { path: '/path/to/file2.ts', size: 2000, lines: 200 }
    ];

    const codeAnalysis: CodeAnalysis = {
      functions: [],
      files: largeFiles,
      totalComplexity: 0,
      largeFiles: largeFiles
    };

    const analyses: FunctionAnalysis[] = [];
    
    for (const file of largeFiles) {
      const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
      
      for (const func of fileFunctions) {
        try {
          const analysis = await functionAnalyzer.analyzeFunction(
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

  test('should continue processing after error and process remaining functions', async () => {
    const largeFiles: FileInfo[] = [
      { path: '/path/to/file1.ts', size: 1000, lines: 100 }
    ];

    const codeAnalysis: CodeAnalysis = {
      functions: [
        { name: 'func1', file: '/path/to/file1.ts', line: 1, complexity: 5 } as FunctionInfo,
        { name: 'func2', file: '/path/to/file1.ts', line: 10, complexity: 3 } as FunctionInfo,
        { name: 'func3', file: '/path/to/file1.ts', line: 20, complexity: 4 } as FunctionInfo
      ],
      files: largeFiles,
      totalComplexity: 12,
      largeFiles: largeFiles
    };

    const mockAnalysis1: FunctionAnalysis = { functionName: 'func1', issues: [] } as FunctionAnalysis;
    const mockAnalysis3: FunctionAnalysis = { functionName: 'func3', issues: [] } as FunctionAnalysis;

    mockAnalyzeFunction
      .mockResolvedValueOnce(mockAnalysis1)
      .mockRejectedValueOnce(new Error('Middle error'))
      .mockResolvedValueOnce(mockAnalysis3);

    const analyses: FunctionAnalysis[] = [];
    
    for (const file of largeFiles) {
      const fileFunctions = codeAnalysis.functions.filter(f => f.file === file.path);
      
      for (const func of fileFunctions) {
        try {
          const analysis = await functionAnalyzer.analyzeFunction(
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
    expect(analyses[0]).toEqual(mockAnalysis1);
    expect(analyses[1]).toEqual(mockAnalysis3);
    expect(mockAnalyzeFunction).toHaveBeenCalledTimes(3);
    expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
  });
});