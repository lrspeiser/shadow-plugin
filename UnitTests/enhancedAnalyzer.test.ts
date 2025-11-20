import { EnhancedAnalyzer } from '../enhancedAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');
jest.mock('typescript');

describe('EnhancedAnalyzer - parseFile TypeScript/JavaScript branch', () => {
  let analyzer: EnhancedAnalyzer;
  let mockAnalyzeTypeScriptFunction: jest.SpyInstance;

  beforeEach(() => {
    analyzer = new EnhancedAnalyzer();
    mockAnalyzeTypeScriptFunction = jest.spyOn(analyzer as any, 'analyzeTypeScriptFunction');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should call analyzeTypeScriptFunction when language is typescript', async () => {
    const filePath = '/test/file.ts';
    const content = 'function testFunc() { return true; }';
    const func = { name: 'testFunc', start: 0, end: 38 };
    const functionContent = 'function testFunc() { return true; }';
    const language = 'typescript';
    const expectedMetadata = {
      name: 'testFunc',
      complexity: 1,
      parameters: [],
      returnType: 'boolean'
    };

    mockAnalyzeTypeScriptFunction.mockResolvedValue(expectedMetadata);

    const result = await (analyzer as any).parseFile(
      filePath,
      content,
      func,
      functionContent,
      language
    );

    expect(mockAnalyzeTypeScriptFunction).toHaveBeenCalledWith(
      filePath,
      content,
      func,
      functionContent
    );
    expect(mockAnalyzeTypeScriptFunction).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedMetadata);
  });

  test('should call analyzeTypeScriptFunction when language is javascript', async () => {
    const filePath = '/test/file.js';
    const content = 'function jsFunc(a, b) { return a + b; }';
    const func = { name: 'jsFunc', start: 0, end: 39 };
    const functionContent = 'function jsFunc(a, b) { return a + b; }';
    const language = 'javascript';
    const expectedMetadata = {
      name: 'jsFunc',
      complexity: 1,
      parameters: ['a', 'b'],
      returnType: 'any'
    };

    mockAnalyzeTypeScriptFunction.mockResolvedValue(expectedMetadata);

    const result = await (analyzer as any).parseFile(
      filePath,
      content,
      func,
      functionContent,
      language
    );

    expect(mockAnalyzeTypeScriptFunction).toHaveBeenCalledWith(
      filePath,
      content,
      func,
      functionContent
    );
    expect(mockAnalyzeTypeScriptFunction).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedMetadata);
  });

  test('should not call analyzeTypeScriptFunction for other languages', async () => {
    const filePath = '/test/file.py';
    const content = 'def python_func():\n    return True';
    const func = { name: 'python_func', start: 0, end: 35 };
    const functionContent = 'def python_func():\n    return True';
    const language = 'python';

    await (analyzer as any).parseFile(
      filePath,
      content,
      func,
      functionContent,
      language
    );

    expect(mockAnalyzeTypeScriptFunction).not.toHaveBeenCalled();
  });

  test('should handle analyzeTypeScriptFunction errors gracefully', async () => {
    const filePath = '/test/file.ts';
    const content = 'function errorFunc() { invalid syntax';
    const func = { name: 'errorFunc', start: 0, end: 38 };
    const functionContent = 'function errorFunc() { invalid syntax';
    const language = 'typescript';
    const error = new Error('Parse error: invalid syntax');

    mockAnalyzeTypeScriptFunction.mockRejectedValue(error);

    await expect(
      (analyzer as any).parseFile(
        filePath,
        content,
        func,
        functionContent,
        language
      )
    ).rejects.toThrow('Parse error: invalid syntax');

    expect(mockAnalyzeTypeScriptFunction).toHaveBeenCalledWith(
      filePath,
      content,
      func,
      functionContent
    );
  });

  test('should handle complex TypeScript with async/await', async () => {
    const filePath = '/test/async.ts';
    const content = 'async function fetchData(): Promise<string> { return await getData(); }';
    const func = { name: 'fetchData', start: 0, end: 72 };
    const functionContent = 'async function fetchData(): Promise<string> { return await getData(); }';
    const language = 'typescript';
    const expectedMetadata = {
      name: 'fetchData',
      complexity: 2,
      parameters: [],
      returnType: 'Promise<string>',
      isAsync: true
    };

    mockAnalyzeTypeScriptFunction.mockResolvedValue(expectedMetadata);

    const result = await (analyzer as any).parseFile(
      filePath,
      content,
      func,
      functionContent,
      language
    );

    expect(result).toEqual(expectedMetadata);
    expect(result.isAsync).toBe(true);
    expect(result.returnType).toBe('Promise<string>');
  });

  test('should handle JavaScript arrow functions', async () => {
    const filePath = '/test/arrow.js';
    const content = 'const arrowFunc = (x, y) => x * y;';
    const func = { name: 'arrowFunc', start: 0, end: 35 };
    const functionContent = 'const arrowFunc = (x, y) => x * y;';
    const language = 'javascript';
    const expectedMetadata = {
      name: 'arrowFunc',
      complexity: 1,
      parameters: ['x', 'y'],
      returnType: 'any'
    };

    mockAnalyzeTypeScriptFunction.mockResolvedValue(expectedMetadata);

    const result = await (analyzer as any).parseFile(
      filePath,
      content,
      func,
      functionContent,
      language
    );

    expect(mockAnalyzeTypeScriptFunction).toHaveBeenCalled();
    expect(result).toEqual(expectedMetadata);
  });
});