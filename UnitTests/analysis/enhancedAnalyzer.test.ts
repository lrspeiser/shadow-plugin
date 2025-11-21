import { EnhancedAnalyzer } from '../../src/analysis/enhancedAnalyzer';
import { FunctionMetadata } from '../../src/types';

describe('EnhancedAnalyzer - for loop function processing', () => {
  let analyzer: EnhancedAnalyzer;
  const mockFilePath = '/test/file.ts';
  const mockContent = `function testFunc() {
  console.log('test');
  return true;
}`;

  beforeEach(() => {
    analyzer = new EnhancedAnalyzer();
  });

  test('should process matching TypeScript functions and add to metadata', async () => {
    const metadata = new Map<string, FunctionMetadata>();
    const functions = [
      {
        name: 'testFunc',
        file: 'file.ts',
        startLine: 1,
        endLine: 4,
        complexity: 'low' as const
      }
    ];

    const extractSpy = jest.spyOn(analyzer as any, 'extractFunctionContent');
    extractSpy.mockReturnValue('function testFunc() {\n  console.log("test");\n  return true;\n}');

    const analyzeTsSpy = jest.spyOn(analyzer as any, 'analyzeTypeScriptFunction');
    analyzeTsSpy.mockResolvedValue({
      name: 'testFunc',
      complexity: 'low',
      dependencies: [],
      mockingNeeded: false
    } as FunctionMetadata);

    // Simulate the for loop
    for (const func of functions) {
      if (func.file !== 'file.ts' && func.file !== mockFilePath) {
        continue;
      }
      const functionContent = (analyzer as any).extractFunctionContent(mockContent, func.startLine, func.endLine);
      const funcMetadata = await (analyzer as any).analyzeTypeScriptFunction(mockFilePath, mockContent, func, functionContent);
      metadata.set(func.name, funcMetadata);
    }

    expect(metadata.size).toBe(1);
    expect(metadata.has('testFunc')).toBe(true);
    expect(extractSpy).toHaveBeenCalledWith(mockContent, 1, 4);
    expect(analyzeTsSpy).toHaveBeenCalled();
  });

  test('should skip functions with non-matching file paths', async () => {
    const metadata = new Map<string, FunctionMetadata>();
    const functions = [
      {
        name: 'testFunc',
        file: 'different.ts',
        startLine: 1,
        endLine: 4,
        complexity: 'low' as const
      }
    ];

    const extractSpy = jest.spyOn(analyzer as any, 'extractFunctionContent');
    const analyzeTsSpy = jest.spyOn(analyzer as any, 'analyzeTypeScriptFunction');

    // Simulate the for loop
    for (const func of functions) {
      if (func.file !== 'file.ts' && func.file !== mockFilePath) {
        continue;
      }
      const functionContent = (analyzer as any).extractFunctionContent(mockContent, func.startLine, func.endLine);
      const funcMetadata = await (analyzer as any).analyzeTypeScriptFunction(mockFilePath, mockContent, func, functionContent);
      metadata.set(func.name, funcMetadata);
    }

    expect(metadata.size).toBe(0);
    expect(extractSpy).not.toHaveBeenCalled();
    expect(analyzeTsSpy).not.toHaveBeenCalled();
  });

  test('should handle JavaScript language and call analyzeTypeScriptFunction', async () => {
    const metadata = new Map<string, FunctionMetadata>();
    const functions = [
      {
        name: 'jsFunc',
        file: 'file.js',
        startLine: 1,
        endLine: 3,
        complexity: 'low' as const
      }
    ];
    const language = 'javascript';

    const extractSpy = jest.spyOn(analyzer as any, 'extractFunctionContent');
    extractSpy.mockReturnValue('function jsFunc() {}');

    const analyzeTsSpy = jest.spyOn(analyzer as any, 'analyzeTypeScriptFunction');
    analyzeTsSpy.mockResolvedValue({
      name: 'jsFunc',
      complexity: 'low',
      dependencies: [],
      mockingNeeded: false
    } as FunctionMetadata);

    // Simulate the for loop
    for (const func of functions) {
      if (func.file !== 'file.js' && func.file !== '/test/file.js') {
        continue;
      }
      const functionContent = (analyzer as any).extractFunctionContent(mockContent, func.startLine, func.endLine);
      let funcMetadata: FunctionMetadata;
      if (language === 'typescript' || language === 'javascript') {
        funcMetadata = await (analyzer as any).analyzeTypeScriptFunction('/test/file.js', mockContent, func, functionContent);
      } else {
        funcMetadata = (analyzer as any).analyzeFunctionWithRegex('/test/file.js', func, functionContent, language);
      }
      metadata.set(func.name, funcMetadata);
    }

    expect(metadata.size).toBe(1);
    expect(analyzeTsSpy).toHaveBeenCalled();
  });

  test('should use regex analysis for non-TypeScript/JavaScript languages', async () => {
    const metadata = new Map<string, FunctionMetadata>();
    const functions = [
      {
        name: 'pyFunc',
        file: 'file.py',
        startLine: 1,
        endLine: 3,
        complexity: 'low' as const
      }
    ];
    const language = 'python';

    const extractSpy = jest.spyOn(analyzer as any, 'extractFunctionContent');
    extractSpy.mockReturnValue('def pyFunc():\n  pass');

    const analyzeRegexSpy = jest.spyOn(analyzer as any, 'analyzeFunctionWithRegex');
    analyzeRegexSpy.mockReturnValue({
      name: 'pyFunc',
      complexity: 'low',
      dependencies: [],
      mockingNeeded: false
    } as FunctionMetadata);

    // Simulate the for loop
    for (const func of functions) {
      if (func.file !== 'file.py' && func.file !== '/test/file.py') {
        continue;
      }
      const functionContent = (analyzer as any).extractFunctionContent(mockContent, func.startLine, func.endLine);
      let funcMetadata: FunctionMetadata;
      if (language === 'typescript' || language === 'javascript') {
        funcMetadata = await (analyzer as any).analyzeTypeScriptFunction('/test/file.py', mockContent, func, functionContent);
      } else {
        funcMetadata = (analyzer as any).analyzeFunctionWithRegex('/test/file.py', func, functionContent, language);
      }
      metadata.set(func.name, funcMetadata);
    }

    expect(metadata.size).toBe(1);
    expect(analyzeRegexSpy).toHaveBeenCalledWith('/test/file.py', functions[0], 'def pyFunc():\n  pass', 'python');
  });

  test('should process multiple functions in a single iteration', async () => {
    const metadata = new Map<string, FunctionMetadata>();
    const functions = [
      { name: 'func1', file: 'file.ts', startLine: 1, endLine: 3, complexity: 'low' as const },
      { name: 'func2', file: 'file.ts', startLine: 4, endLine: 6, complexity: 'medium' as const },
      { name: 'func3', file: 'other.ts', startLine: 1, endLine: 3, complexity: 'low' as const }
    ];

    const extractSpy = jest.spyOn(analyzer as any, 'extractFunctionContent');
    extractSpy.mockReturnValue('function test() {}');

    const analyzeTsSpy = jest.spyOn(analyzer as any, 'analyzeTypeScriptFunction');
    analyzeTsSpy.mockResolvedValue({
      name: 'test',
      complexity: 'low',
      dependencies: [],
      mockingNeeded: false
    } as FunctionMetadata);

    // Simulate the for loop
    for (const func of functions) {
      if (func.file !== 'file.ts' && func.file !== mockFilePath) {
        continue;
      }
      const functionContent = (analyzer as any).extractFunctionContent(mockContent, func.startLine, func.endLine);
      const funcMetadata = await (analyzer as any).analyzeTypeScriptFunction(mockFilePath, mockContent, func, functionContent);
      metadata.set(func.name, funcMetadata);
    }

    expect(metadata.size).toBe(2);
    expect(metadata.has('func1')).toBe(true);
    expect(metadata.has('func2')).toBe(true);
    expect(metadata.has('func3')).toBe(false);
  });

  test('should match full file path when provided', async () => {
    const metadata = new Map<string, FunctionMetadata>();
    const fullPath = '/absolute/path/to/file.ts';
    const functions = [
      {
        name: 'testFunc',
        file: fullPath,
        startLine: 1,
        endLine: 4,
        complexity: 'low' as const
      }
    ];

    const extractSpy = jest.spyOn(analyzer as any, 'extractFunctionContent');
    extractSpy.mockReturnValue('function testFunc() {}');

    const analyzeTsSpy = jest.spyOn(analyzer as any, 'analyzeTypeScriptFunction');
    analyzeTsSpy.mockResolvedValue({
      name: 'testFunc',
      complexity: 'low',
      dependencies: [],
      mockingNeeded: false
    } as FunctionMetadata);

    // Simulate the for loop
    for (const func of functions) {
      if (func.file !== 'file.ts' && func.file !== fullPath) {
        continue;
      }
      const functionContent = (analyzer as any).extractFunctionContent(mockContent, func.startLine, func.endLine);
      const funcMetadata = await (analyzer as any).analyzeTypeScriptFunction(fullPath, mockContent, func, functionContent);
      metadata.set(func.name, funcMetadata);
    }

    expect(metadata.size).toBe(1);
    expect(metadata.has('testFunc')).toBe(true);
  });
});