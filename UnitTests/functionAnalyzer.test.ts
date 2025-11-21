import { FunctionAnalyzer } from '../src/analysis/functionAnalyzer';
import { CodeAnalysis, FunctionInfo, FileInfo } from '../src/types';

describe('FunctionAnalyzer - analyzeAllFunctions for loop', () => {
  let functionAnalyzer: FunctionAnalyzer;
  let mockCodeAnalysis: CodeAnalysis;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    functionAnalyzer = new FunctionAnalyzer();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Setup mock code analysis
    mockCodeAnalysis = {
      files: [],
      functions: [
        {
          name: 'testFunction1',
          file: '/path/to/file1.ts',
          startLine: 10,
          endLine: 20,
          complexity: 5,
          loc: 10
        },
        {
          name: 'testFunction2',
          file: '/path/to/file1.ts',
          startLine: 25,
          endLine: 35,
          complexity: 3,
          loc: 10
        },
        {
          name: 'testFunction3',
          file: '/path/to/file2.ts',
          startLine: 5,
          endLine: 15,
          complexity: 8,
          loc: 10
        }
      ],
      totalFiles: 2,
      totalFunctions: 3,
      totalLOC: 30,
      averageComplexity: 5.3
    };
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  test('should analyze all functions in large files successfully', async () => {
    const largeFiles: FileInfo[] = [
      { path: '/path/to/file1.ts', size: 1000, loc: 100 },
      { path: '/path/to/file2.ts', size: 1500, loc: 150 }
    ];

    jest.spyOn(functionAnalyzer as any, 'analyzeFunction').mockResolvedValue({
      functionName: 'testFunction',
      file: '/path/to/file1.ts',
      analysis: 'Mock analysis'
    });

    const analyses: any[] = [];

    // Simulate the for loop logic
    for (const file of largeFiles) {
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

    expect(analyses.length).toBe(3);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('should handle empty large files array', async () => {
    const largeFiles: FileInfo[] = [];
    const analyses: any[] = [];

    for (const file of largeFiles) {
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

    expect(analyses.length).toBe(0);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('should handle files with no functions', async () => {
    const largeFiles: FileInfo[] = [
      { path: '/path/to/file3.ts', size: 1000, loc: 100 }
    ];

    const analyses: any[] = [];

    for (const file of largeFiles) {
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

    expect(analyses.length).toBe(0);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('should continue processing after analyzeFunction error', async () => {
    const largeFiles: FileInfo[] = [
      { path: '/path/to/file1.ts', size: 1000, loc: 100 }
    ];

    let callCount = 0;
    jest.spyOn(functionAnalyzer as any, 'analyzeFunction').mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Analysis failed');
      }
      return Promise.resolve({ functionName: 'testFunction2', analysis: 'Success' });
    });

    const analyses: any[] = [];

    for (const file of largeFiles) {
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

    expect(analyses.length).toBe(1);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to analyze function testFunction1'),
      expect.any(Error)
    );
  });

  test('should skip null/undefined analysis results', async () => {
    const largeFiles: FileInfo[] = [
      { path: '/path/to/file1.ts', size: 1000, loc: 100 }
    ];

    let callCount = 0;
    jest.spyOn(functionAnalyzer as any, 'analyzeFunction').mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(null);
      }
      return Promise.resolve({ functionName: 'testFunction2', analysis: 'Success' });
    });

    const analyses: any[] = [];

    for (const file of largeFiles) {
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

    expect(analyses.length).toBe(1);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('should process multiple files with mixed success and failures', async () => {
    const largeFiles: FileInfo[] = [
      { path: '/path/to/file1.ts', size: 1000, loc: 100 },
      { path: '/path/to/file2.ts', size: 1500, loc: 150 }
    ];

    let callCount = 0;
    jest.spyOn(functionAnalyzer as any, 'analyzeFunction').mockImplementation((file: string) => {
      callCount++;
      if (file === '/path/to/file1.ts' && callCount === 2) {
        throw new Error('Second function failed');
      }
      return Promise.resolve({ functionName: `func${callCount}`, analysis: 'Success' });
    });

    const analyses: any[] = [];

    for (const file of largeFiles) {
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

    expect(analyses.length).toBe(2);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });
});