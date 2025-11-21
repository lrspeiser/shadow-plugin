import { validateTests } from '../validator';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');
const mockTestRunner = { runTests: jest.fn() };
const mockErrorParser = { parseErrors: jest.fn() };
const mockAIProvider = { analyzeFailures: jest.fn() };

describe('validateTests', () => {
  let mockTestRunner: any;
  let mockErrorParser: any;
  let mockAIProvider: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTestRunner = { runTests: jest.fn() };
    mockErrorParser = { parseErrors: jest.fn() };
    mockAIProvider = { analyzeFailures: jest.fn() };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Happy Path', () => {
    test('should validate tests successfully when all tests pass', async () => {
      const testFiles = ['test1.ts', 'test2.ts'];
      const mockResults = {
        passed: 10,
        failed: 0,
        total: 10,
        results: []
      };
      
      mockTestRunner.runTests.mockResolvedValue(mockResults);
      
      const result = await validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider);
      
      expect(result).toBeDefined();
      expect(result.passed).toBe(10);
      expect(result.failed).toBe(0);
      expect(mockTestRunner.runTests).toHaveBeenCalledWith(testFiles);
      expect(mockErrorParser.parseErrors).not.toHaveBeenCalled();
    });

    test('should validate and parse errors when tests fail', async () => {
      const testFiles = ['test1.ts'];
      const mockResults = {
        passed: 5,
        failed: 3,
        total: 8,
        results: [
          { testName: 'test1', error: 'AssertionError', stack: 'stack trace' },
          { testName: 'test2', error: 'TypeError', stack: 'stack trace 2' },
          { testName: 'test3', error: 'ReferenceError', stack: 'stack trace 3' }
        ]
      };
      const parsedErrors = [
        { line: 10, message: 'Expected true but got false' },
        { line: 25, message: 'Cannot read property of undefined' },
        { line: 40, message: 'Variable not defined' }
      ];
      
      mockTestRunner.runTests.mockResolvedValue(mockResults);
      mockErrorParser.parseErrors.mockReturnValue(parsedErrors);
      
      const result = await validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider);
      
      expect(result.failed).toBe(3);
      expect(mockErrorParser.parseErrors).toHaveBeenCalledWith(mockResults.results);
      expect(result.errors).toEqual(parsedErrors);
    });

    test('should use AI provider to analyze failures', async () => {
      const testFiles = ['test1.ts'];
      const mockResults = {
        passed: 0,
        failed: 2,
        total: 2,
        results: [
          { testName: 'test1', error: 'Error', stack: 'stack' },
          { testName: 'test2', error: 'Error', stack: 'stack' }
        ]
      };
      const aiAnalysis = {
        suggestions: ['Fix assertion', 'Update mock data'],
        confidence: 0.85
      };
      
      mockTestRunner.runTests.mockResolvedValue(mockResults);
      mockErrorParser.parseErrors.mockReturnValue([]);
      mockAIProvider.analyzeFailures.mockResolvedValue(aiAnalysis);
      
      const result = await validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider);
      
      expect(mockAIProvider.analyzeFailures).toHaveBeenCalledWith(mockResults.results);
      expect(result.aiSuggestions).toEqual(aiAnalysis);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty test files array', async () => {
      const testFiles: string[] = [];
      const mockResults = { passed: 0, failed: 0, total: 0, results: [] };
      
      mockTestRunner.runTests.mockResolvedValue(mockResults);
      
      const result = await validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider);
      
      expect(result.total).toBe(0);
      expect(mockTestRunner.runTests).toHaveBeenCalledWith([]);
    });

    test('should handle null or undefined inputs gracefully', async () => {
      mockTestRunner.runTests.mockResolvedValue({ passed: 0, failed: 0, total: 0, results: [] });
      
      await expect(validateTests(null as any, mockTestRunner, mockErrorParser, mockAIProvider)).rejects.toThrow();
      await expect(validateTests(undefined as any, mockTestRunner, mockErrorParser, mockAIProvider)).rejects.toThrow();
    });

    test('should handle test results with no errors array', async () => {
      const testFiles = ['test1.ts'];
      const mockResults = {
        passed: 5,
        failed: 0,
        total: 5
      };
      
      mockTestRunner.runTests.mockResolvedValue(mockResults);
      
      const result = await validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider);
      
      expect(result.passed).toBe(5);
      expect(result.errors).toBeUndefined();
    });

    test('should handle large number of test files', async () => {
      const testFiles = Array.from({ length: 1000 }, (_, i) => `test${i}.ts`);
      const mockResults = { passed: 5000, failed: 0, total: 5000, results: [] };
      
      mockTestRunner.runTests.mockResolvedValue(mockResults);
      
      const result = await validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider);
      
      expect(result.total).toBe(5000);
      expect(mockTestRunner.runTests).toHaveBeenCalledTimes(1);
    });

    test('should handle tests with special characters in file names', async () => {
      const testFiles = ['test-1.ts', 'test_2.ts', 'test.spec.ts', 'test@feature.ts'];
      const mockResults = { passed: 4, failed: 0, total: 4, results: [] };
      
      mockTestRunner.runTests.mockResolvedValue(mockResults);
      
      const result = await validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider);
      
      expect(result.passed).toBe(4);
    });
  });

  describe('Error Handling', () => {
    test('should handle test runner errors', async () => {
      const testFiles = ['test1.ts'];
      const error = new Error('Test runner failed');
      
      mockTestRunner.runTests.mockRejectedValue(error);
      
      await expect(validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider)).rejects.toThrow('Test runner failed');
    });

    test('should handle error parser failures', async () => {
      const testFiles = ['test1.ts'];
      const mockResults = {
        passed: 0,
        failed: 1,
        total: 1,
        results: [{ testName: 'test1', error: 'Error', stack: 'stack' }]
      };
      
      mockTestRunner.runTests.mockResolvedValue(mockResults);
      mockErrorParser.parseErrors.mockImplementation(() => {
        throw new Error('Parser error');
      });
      
      await expect(validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider)).rejects.toThrow('Parser error');
    });

    test('should handle AI provider failures gracefully', async () => {
      const testFiles = ['test1.ts'];
      const mockResults = {
        passed: 0,
        failed: 1,
        total: 1,
        results: [{ testName: 'test1', error: 'Error', stack: 'stack' }]
      };
      
      mockTestRunner.runTests.mockResolvedValue(mockResults);
      mockErrorParser.parseErrors.mockReturnValue([]);
      mockAIProvider.analyzeFailures.mockRejectedValue(new Error('AI service unavailable'));
      
      const result = await validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider);
      
      expect(result.failed).toBe(1);
      expect(result.aiSuggestions).toBeUndefined();
    });

    test('should handle timeout errors', async () => {
      const testFiles = ['test1.ts'];
      
      mockTestRunner.runTests.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        });
      });
      
      await expect(validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider)).rejects.toThrow('Timeout');
    });

    test('should handle malformed test results', async () => {
      const testFiles = ['test1.ts'];
      const mockResults = {
        passed: 'invalid',
        failed: null,
        total: undefined
      };
      
      mockTestRunner.runTests.mockResolvedValue(mockResults);
      
      await expect(validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider)).rejects.toThrow();
    });

    test('should handle missing dependencies', async () => {
      const testFiles = ['test1.ts'];
      
      await expect(validateTests(testFiles, null as any, mockErrorParser, mockAIProvider)).rejects.toThrow();
      await expect(validateTests(testFiles, mockTestRunner, null as any, mockAIProvider)).rejects.toThrow();
      await expect(validateTests(testFiles, mockTestRunner, mockErrorParser, null as any)).rejects.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle mixed results with partial failures', async () => {
      const testFiles = ['test1.ts', 'test2.ts', 'test3.ts'];
      const mockResults = {
        passed: 15,
        failed: 5,
        total: 20,
        results: Array.from({ length: 5 }, (_, i) => ({
          testName: `test${i}`,
          error: `Error ${i}`,
          stack: `stack ${i}`
        }))
      };
      const parsedErrors = mockResults.results.map((r, i) => ({
        line: i * 10,
        message: r.error
      }));
      
      mockTestRunner.runTests.mockResolvedValue(mockResults);
      mockErrorParser.parseErrors.mockReturnValue(parsedErrors);
      mockAIProvider.analyzeFailures.mockResolvedValue({ suggestions: ['Fix tests'], confidence: 0.9 });
      
      const result = await validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider);
      
      expect(result.passed).toBe(15);
      expect(result.failed).toBe(5);
      expect(result.total).toBe(20);
      expect(result.errors).toHaveLength(5);
      expect(result.aiSuggestions).toBeDefined();
    });

    test('should validate with all dependencies working together', async () => {
      const testFiles = ['integration.test.ts'];
      const mockResults = {
        passed: 8,
        failed: 2,
        total: 10,
        results: [
          { testName: 'should work', error: 'Expected 5 to be 6', stack: 'at line 42' },
          { testName: 'should pass', error: 'Timeout exceeded', stack: 'at line 88' }
        ]
      };
      const parsedErrors = [
        { line: 42, message: 'Expected 5 to be 6', file: 'integration.test.ts' },
        { line: 88, message: 'Timeout exceeded', file: 'integration.test.ts' }
      ];
      const aiAnalysis = {
        suggestions: [
          'Update assertion value from 6 to 5',
          'Increase timeout or optimize async operation'
        ],
        confidence: 0.92,
        rootCause: 'Incorrect expected values and timeout configuration'
      };
      
      mockTestRunner.runTests.mockResolvedValue(mockResults);
      mockErrorParser.parseErrors.mockReturnValue(parsedErrors);
      mockAIProvider.analyzeFailures.mockResolvedValue(aiAnalysis);
      
      const result = await validateTests(testFiles, mockTestRunner, mockErrorParser, mockAIProvider);
      
      expect(mockTestRunner.runTests).toHaveBeenCalledWith(testFiles);
      expect(mockErrorParser.parseErrors).toHaveBeenCalledWith(mockResults.results);
      expect(mockAIProvider.analyzeFailures).toHaveBeenCalledWith(mockResults.results);
      
      expect(result).toMatchObject({
        passed: 8,
        failed: 2,
        total: 10,
        errors: parsedErrors,
        aiSuggestions: aiAnalysis
      });
    });
  });
});