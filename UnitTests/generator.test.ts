import { generateTests } from '../generator';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');
jest.mock('../../ai/provider', () => ({ AIProvider: jest.fn() }));
jest.mock('../framework-detector', () => ({ detectTestFramework: jest.fn() }));
jest.mock('../../utils/batch-processor', () => ({ BatchProcessor: jest.fn() }));

import { AIProvider } from '../../ai/provider';
import { detectTestFramework } from '../framework-detector';
import { BatchProcessor } from '../../utils/batch-processor';

describe('generateTests', () => {
  let mockAIProvider: jest.Mocked<any>;
  let mockBatchProcessor: jest.Mocked<any>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAIProvider = {
      generateTestCode: jest.fn(),
      initialize: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true)
    };
    
    mockBatchProcessor = {
      process: jest.fn(),
      addTask: jest.fn()
    };
    
    (AIProvider as jest.MockedClass<any>).mockImplementation(() => mockAIProvider);
    (BatchProcessor as jest.MockedClass<any>).mockImplementation(() => mockBatchProcessor);
    (detectTestFramework as jest.Mock).mockResolvedValue('jest');
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('Happy Path', () => {
    test('should generate tests for a simple function', async () => {
      const sourceCode = 'function add(a, b) { return a + b; }';
      const expectedTest = 'test("add function", () => { expect(add(1, 2)).toBe(3); })';
      
      mockAIProvider.generateTestCode.mockResolvedValue(expectedTest);
      
      const result = await generateTests(sourceCode, {
        framework: 'jest',
        coverage: 'basic'
      });
      
      expect(result).toBeDefined();
      expect(result.testCode).toBe(expectedTest);
      expect(mockAIProvider.generateTestCode).toHaveBeenCalledWith(
        sourceCode,
        expect.objectContaining({ framework: 'jest' })
      );
    });
    
    test('should handle multiple test cases for complex functions', async () => {
      const sourceCode = 'class Calculator { add(a, b) { return a + b; } subtract(a, b) { return a - b; } }';
      const expectedTests = 'describe("Calculator", () => { test("add", () => {}); test("subtract", () => {}); })';
      
      mockAIProvider.generateTestCode.mockResolvedValue(expectedTests);
      
      const result = await generateTests(sourceCode, {
        framework: 'jest',
        coverage: 'comprehensive'
      });
      
      expect(result).toBeDefined();
      expect(result.testCode).toContain('describe');
      expect(result.testCode).toContain('Calculator');
    });
    
    test('should auto-detect test framework when not specified', async () => {
      const sourceCode = 'export function greet(name) { return `Hello ${name}`; }';
      
      (detectTestFramework as jest.Mock).mockResolvedValue('mocha');
      mockAIProvider.generateTestCode.mockResolvedValue('it("greets", () => {})');
      
      const result = await generateTests(sourceCode);
      
      expect(detectTestFramework).toHaveBeenCalled();
      expect(result.framework).toBe('mocha');
    });
    
    test('should generate tests with mocking when dependencies detected', async () => {
      const sourceCode = 'import { api } from "./api"; export function fetchData() { return api.get(); }';
      
      mockAIProvider.generateTestCode.mockResolvedValue(
        'jest.mock("./api"); test("fetchData", () => {})'
      );
      
      const result = await generateTests(sourceCode, {
        framework: 'jest',
        includeMocks: true
      });
      
      expect(result.testCode).toContain('jest.mock');
      expect(result.hasMocks).toBe(true);
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle empty source code', async () => {
      const result = await generateTests('');
      
      expect(result).toEqual(expect.objectContaining({
        testCode: '',
        error: expect.stringContaining('empty')
      }));
    });
    
    test('should handle null or undefined input', async () => {
      const resultNull = await generateTests(null as any);
      const resultUndefined = await generateTests(undefined as any);
      
      expect(resultNull.error).toBeDefined();
      expect(resultUndefined.error).toBeDefined();
    });
    
    test('should handle very long source code', async () => {
      const longCode = 'function test() { return true; }'.repeat(1000);
      
      mockAIProvider.generateTestCode.mockResolvedValue('test("long function", () => {})');
      
      const result = await generateTests(longCode);
      
      expect(result).toBeDefined();
      expect(result.testCode).toBeTruthy();
    });
    
    test('should handle code with syntax errors gracefully', async () => {
      const invalidCode = 'function broken( { return ;';
      
      mockAIProvider.generateTestCode.mockResolvedValue(
        '// Unable to parse, generating basic structure\ntest("broken", () => {})');
      
      const result = await generateTests(invalidCode);
      
      expect(result).toBeDefined();
      expect(result.warning).toBeDefined();
    });
    
    test('should handle unsupported test frameworks', async () => {
      const sourceCode = 'function test() {}';
      
      const result = await generateTests(sourceCode, {
        framework: 'unsupported-framework' as any
      });
      
      expect(result.error).toContain('unsupported');
    });
  });
  
  describe('Error Handling', () => {
    test('should handle AI provider failures', async () => {
      const sourceCode = 'function test() {}';
      
      mockAIProvider.generateTestCode.mockRejectedValue(new Error('AI service unavailable'));
      
      const result = await generateTests(sourceCode);
      
      expect(result.error).toContain('AI service unavailable');
      expect(result.testCode).toBe('');
    });
    
    test('should handle timeout errors', async () => {
      const sourceCode = 'function test() {}';
      
      mockAIProvider.generateTestCode.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );
      
      const result = await generateTests(sourceCode, { timeout: 50 });
      
      expect(result.error).toBeDefined();
    });
    
    test('should handle batch processing errors', async () => {
      const sourceCode = 'function test1() {}\nfunction test2() {}';
      
      mockBatchProcessor.process.mockRejectedValue(new Error('Batch failed'));
      
      const result = await generateTests(sourceCode, { batch: true });
      
      expect(result.error).toContain('Batch failed');
    });
    
    test('should retry on transient failures', async () => {
      const sourceCode = 'function test() {}';
      
      mockAIProvider.generateTestCode
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValueOnce('test("test", () => {})');
      
      const result = await generateTests(sourceCode, { retry: true });
      
      expect(result.testCode).toBeTruthy();
      expect(mockAIProvider.generateTestCode).toHaveBeenCalledTimes(2);
    });
    
    test('should handle configuration errors', async () => {
      const sourceCode = 'function test() {}';
      
      (vscode.workspace.getConfiguration as jest.Mock).mockImplementation(() => {
        throw new Error('Config read error');
      });
      
      const result = await generateTests(sourceCode);
      
      expect(result.error).toBeDefined();
    });
  });
  
  describe('Integration Scenarios', () => {
    test('should generate tests for TypeScript code with types', async () => {
      const sourceCode = 'function add(a: number, b: number): number { return a + b; }';
      
      mockAIProvider.generateTestCode.mockResolvedValue(
        'test("add with types", () => { expect(add(1, 2)).toBe(3); })'
      );
      
      const result = await generateTests(sourceCode, { language: 'typescript' });
      
      expect(result.testCode).toBeDefined();
      expect(mockAIProvider.generateTestCode).toHaveBeenCalledWith(
        sourceCode,
        expect.objectContaining({ language: 'typescript' })
      );
    });
    
    test('should handle async functions correctly', async () => {
      const sourceCode = 'async function fetchUser(id) { return await api.getUser(id); }';
      
      mockAIProvider.generateTestCode.mockResolvedValue(
        'test("fetchUser", async () => { const user = await fetchUser(1); expect(user).toBeDefined(); })'
      );
      
      const result = await generateTests(sourceCode);
      
      expect(result.testCode).toContain('async');
      expect(result.testCode).toContain('await');
    });
    
    test('should include setup and teardown when needed', async () => {
      const sourceCode = 'class Database { connect() {} disconnect() {} query() {} }';
      
      mockAIProvider.generateTestCode.mockResolvedValue(
        'describe("Database", () => { beforeEach(() => {}); afterEach(() => {}); test("query", () => {}); })'
      );
      
      const result = await generateTests(sourceCode, { includeSetup: true });
      
      expect(result.testCode).toContain('beforeEach');
      expect(result.testCode).toContain('afterEach');
    });
  });
});