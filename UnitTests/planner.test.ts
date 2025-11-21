import { createTestPlan } from '../planner';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('createTestPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    test('should create test plan for simple function', () => {
      const functionInfo = {
        name: 'addNumbers',
        parameters: ['a: number', 'b: number'],
        returnType: 'number',
        complexity: 1,
        lines: { start: 1, end: 3 }
      };

      const result = createTestPlan(functionInfo);

      expect(result).toBeDefined();
      expect(result.functionName).toBe('addNumbers');
      expect(result.testCases).toBeInstanceOf(Array);
      expect(result.testCases.length).toBeGreaterThan(0);
      expect(result.mockingStrategy).toBeDefined();
    });

    test('should create test plan for complex function', () => {
      const functionInfo = {
        name: 'processData',
        parameters: ['data: any[]', 'options: ProcessOptions'],
        returnType: 'Promise<Result>',
        complexity: 15,
        lines: { start: 10, end: 50 },
        dependencies: ['database', 'logger']
      };

      const result = createTestPlan(functionInfo);

      expect(result).toBeDefined();
      expect(result.functionName).toBe('processData');
      expect(result.complexity).toBe(15);
      expect(result.testCases.length).toBeGreaterThan(3);
      expect(result.requiresMocking).toBe(true);
      expect(result.dependencies).toContain('database');
      expect(result.dependencies).toContain('logger');
    });

    test('should identify edge cases based on parameter types', () => {
      const functionInfo = {
        name: 'validateInput',
        parameters: ['input: string | null', 'length: number'],
        returnType: 'boolean',
        complexity: 5,
        lines: { start: 1, end: 10 }
      };

      const result = createTestPlan(functionInfo);

      expect(result.testCases).toBeDefined();
      const edgeCases = result.testCases.filter((tc: any) => tc.type === 'edge');
      expect(edgeCases.length).toBeGreaterThan(0);
      expect(result.testCases.some((tc: any) => tc.description.includes('null'))).toBe(true);
    });

    test('should handle async functions', () => {
      const functionInfo = {
        name: 'fetchData',
        parameters: ['url: string'],
        returnType: 'Promise<Data>',
        complexity: 8,
        lines: { start: 1, end: 20 },
        isAsync: true
      };

      const result = createTestPlan(functionInfo);

      expect(result.isAsync).toBe(true);
      expect(result.testCases.some((tc: any) => tc.description.includes('error') || tc.description.includes('reject'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle function with no parameters', () => {
      const functionInfo = {
        name: 'generateId',
        parameters: [],
        returnType: 'string',
        complexity: 2,
        lines: { start: 1, end: 5 }
      };

      const result = createTestPlan(functionInfo);

      expect(result).toBeDefined();
      expect(result.functionName).toBe('generateId');
      expect(result.testCases.length).toBeGreaterThan(0);
    });

    test('should handle function with void return type', () => {
      const functionInfo = {
        name: 'logMessage',
        parameters: ['message: string'],
        returnType: 'void',
        complexity: 1,
        lines: { start: 1, end: 3 }
      };

      const result = createTestPlan(functionInfo);

      expect(result).toBeDefined();
      expect(result.returnType).toBe('void');
    });

    test('should handle function with optional parameters', () => {
      const functionInfo = {
        name: 'formatText',
        parameters: ['text: string', 'options?: FormatOptions'],
        returnType: 'string',
        complexity: 4,
        lines: { start: 1, end: 15 }
      };

      const result = createTestPlan(functionInfo);

      expect(result.testCases.some((tc: any) => tc.description.includes('without') || tc.description.includes('optional'))).toBe(true);
    });

    test('should handle function with array parameters', () => {
      const functionInfo = {
        name: 'sumArray',
        parameters: ['numbers: number[]'],
        returnType: 'number',
        complexity: 3,
        lines: { start: 1, end: 8 }
      };

      const result = createTestPlan(functionInfo);

      expect(result.testCases.some((tc: any) => tc.description.includes('empty') || tc.description.includes('array'))).toBe(true);
    });

    test('should handle very high complexity functions', () => {
      const functionInfo = {
        name: 'complexAlgorithm',
        parameters: ['input: ComplexType'],
        returnType: 'Result',
        complexity: 50,
        lines: { start: 1, end: 200 }
      };

      const result = createTestPlan(functionInfo);

      expect(result.complexity).toBe(50);
      expect(result.testCases.length).toBeGreaterThan(5);
      expect(result.needsRefactoring).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should throw error for missing function name', () => {
      const functionInfo = {
        name: '',
        parameters: [],
        returnType: 'void',
        complexity: 1,
        lines: { start: 1, end: 1 }
      };

      expect(() => createTestPlan(functionInfo)).toThrow();
    });

    test('should throw error for invalid complexity', () => {
      const functionInfo = {
        name: 'testFunc',
        parameters: [],
        returnType: 'void',
        complexity: -1,
        lines: { start: 1, end: 1 }
      };

      expect(() => createTestPlan(functionInfo)).toThrow();
    });

    test('should throw error for null or undefined input', () => {
      expect(() => createTestPlan(null as any)).toThrow();
      expect(() => createTestPlan(undefined as any)).toThrow();
    });

    test('should handle malformed function info gracefully', () => {
      const functionInfo = {
        name: 'testFunc'
      } as any;

      expect(() => createTestPlan(functionInfo)).toThrow();
    });
  });

  describe('mocking strategy', () => {
    test('should recommend no mocking for simple pure functions', () => {
      const functionInfo = {
        name: 'multiply',
        parameters: ['a: number', 'b: number'],
        returnType: 'number',
        complexity: 1,
        lines: { start: 1, end: 3 },
        dependencies: []
      };

      const result = createTestPlan(functionInfo);

      expect(result.requiresMocking).toBe(false);
      expect(result.mockingStrategy.dependencies.length).toBe(0);
    });

    test('should recommend mocking for functions with dependencies', () => {
      const functionInfo = {
        name: 'saveUser',
        parameters: ['user: User'],
        returnType: 'Promise<void>',
        complexity: 7,
        lines: { start: 1, end: 25 },
        dependencies: ['database', 'emailService', 'logger']
      };

      const result = createTestPlan(functionInfo);

      expect(result.requiresMocking).toBe(true);
      expect(result.mockingStrategy.dependencies.length).toBe(3);
      expect(result.mockingStrategy.dependencies).toContain('database');
      expect(result.mockingStrategy.dependencies).toContain('emailService');
      expect(result.mockingStrategy.dependencies).toContain('logger');
    });
  });

  describe('test coverage estimation', () => {
    test('should estimate test count based on complexity', () => {
      const lowComplexity = {
        name: 'simple',
        parameters: [],
        returnType: 'void',
        complexity: 2,
        lines: { start: 1, end: 5 }
      };

      const highComplexity = {
        name: 'complex',
        parameters: ['a: any', 'b: any'],
        returnType: 'any',
        complexity: 20,
        lines: { start: 1, end: 100 }
      };

      const lowResult = createTestPlan(lowComplexity);
      const highResult = createTestPlan(highComplexity);

      expect(highResult.testCases.length).toBeGreaterThan(lowResult.testCases.length);
    });
  });
});