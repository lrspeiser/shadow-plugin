import { fixFailingTests } from '../testFixer';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');
jest.mock('../../ai/aiClient');
jest.mock('../../analysis/errorAnalyzer');
jest.mock('../../utils/testCode');

import { fixFailingTests } from '../testFixer';
import * as vscode from 'vscode';
import { aiClient } from '../../ai/aiClient';
import { errorAnalyzer } from '../../analysis/errorAnalyzer';
import { testCode } from '../../utils/testCode';

jest.mock('vscode');
jest.mock('../../ai/aiClient');
jest.mock('../../analysis/errorAnalyzer');
jest.mock('../../utils/testCode');

describe('fixFailingTests', () => {
  let mockAiClient: any;
  let mockErrorAnalyzer: any;
  let mockTestCode: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAiClient = {
      generateFix: jest.fn(),
      analyzeError: jest.fn()
    };
    
    mockErrorAnalyzer = {
      parseTestError: jest.fn(),
      categorizeError: jest.fn(),
      extractStackTrace: jest.fn()
    };
    
    mockTestCode = {
      parseTest: jest.fn(),
      applyFix: jest.fn(),
      validateSyntax: jest.fn()
    };

    (aiClient as any) = mockAiClient;
    (errorAnalyzer as any) = mockErrorAnalyzer;
    (testCode as any) = mockTestCode;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Happy Path', () => {
    test('should successfully fix a failing test with valid error analysis', async () => {
      const testFilePath = '/path/to/test.spec.ts';
      const testName = 'should calculate sum correctly';
      const errorMessage = 'Expected 5 to equal 6';
      const testContent = 'test("should calculate sum correctly", () => { expect(2+3).toBe(6); });';
      
      mockErrorAnalyzer.parseTestError.mockReturnValue({
        type: 'assertion',
        line: 5,
        column: 10,
        message: errorMessage
      });
      
      mockErrorAnalyzer.categorizeError.mockReturnValue('ASSERTION_ERROR');
      
      mockErrorAnalyzer.extractStackTrace.mockReturnValue([
        'at test.spec.ts:5:10',
        'at TestRunner.run:100:5'
      ]);
      
      mockTestCode.parseTest.mockReturnValue({
        name: testName,
        code: testContent,
        location: { start: 0, end: 100 }
      });
      
      const fixedCode = 'test("should calculate sum correctly", () => { expect(2+3).toBe(5); });';
      mockAiClient.generateFix.mockResolvedValue({
        success: true,
        fixedCode: fixedCode,
        explanation: 'Changed expected value from 6 to 5'
      });
      
      mockTestCode.applyFix.mockReturnValue(true);
      mockTestCode.validateSyntax.mockReturnValue({ valid: true });
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.fixedCode).toBe(fixedCode);
      expect(mockErrorAnalyzer.parseTestError).toHaveBeenCalledWith(errorMessage);
      expect(mockErrorAnalyzer.categorizeError).toHaveBeenCalled();
      expect(mockAiClient.generateFix).toHaveBeenCalled();
      expect(mockTestCode.applyFix).toHaveBeenCalledWith(testContent, fixedCode);
    });

    test('should handle multiple fix attempts and return best solution', async () => {
      const testFilePath = '/path/to/complex.test.ts';
      const testName = 'should handle async operations';
      const errorMessage = 'Timeout exceeded';
      const testContent = 'test("async test", async () => { await slowOperation(); });';
      
      mockErrorAnalyzer.parseTestError.mockReturnValue({
        type: 'timeout',
        message: errorMessage
      });
      
      mockErrorAnalyzer.categorizeError.mockReturnValue('TIMEOUT_ERROR');
      mockErrorAnalyzer.extractStackTrace.mockReturnValue([]);
      mockTestCode.parseTest.mockReturnValue({ name: testName, code: testContent });
      
      const firstFix = 'test("async test", async () => { await slowOperation(); }, 10000);';
      mockAiClient.generateFix.mockResolvedValue({
        success: true,
        fixedCode: firstFix,
        explanation: 'Increased timeout to 10 seconds'
      });
      
      mockTestCode.applyFix.mockReturnValue(true);
      mockTestCode.validateSyntax.mockReturnValue({ valid: true });
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result.success).toBe(true);
      expect(result.fixedCode).toContain('10000');
      expect(mockAiClient.generateFix).toHaveBeenCalled();
    });

    test('should preserve test structure while fixing assertion errors', async () => {
      const testFilePath = '/path/to/unit.test.ts';
      const testName = 'should validate user input';
      const errorMessage = 'Expected true to be false';
      const testContent = 'describe("validation", () => { test("should validate user input", () => { expect(validate("test")).toBe(false); }); });';
      
      mockErrorAnalyzer.parseTestError.mockReturnValue({
        type: 'assertion',
        message: errorMessage
      });
      
      mockErrorAnalyzer.categorizeError.mockReturnValue('ASSERTION_ERROR');
      mockErrorAnalyzer.extractStackTrace.mockReturnValue(['at unit.test.ts:3:50']);
      mockTestCode.parseTest.mockReturnValue({ name: testName, code: testContent });
      
      const fixedCode = 'describe("validation", () => { test("should validate user input", () => { expect(validate("test")).toBe(true); }); });';
      mockAiClient.generateFix.mockResolvedValue({
        success: true,
        fixedCode: fixedCode,
        explanation: 'Fixed assertion expectation'
      });
      
      mockTestCode.applyFix.mockReturnValue(true);
      mockTestCode.validateSyntax.mockReturnValue({ valid: true });
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result.success).toBe(true);
      expect(result.fixedCode).toContain('describe');
      expect(result.fixedCode).toContain('test(');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty test content gracefully', async () => {
      const testFilePath = '/path/to/empty.test.ts';
      const testName = 'empty test';
      const errorMessage = 'Test has no assertions';
      const testContent = '';
      
      mockErrorAnalyzer.parseTestError.mockReturnValue(null);
      mockTestCode.parseTest.mockReturnValue(null);
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('empty');
    });

    test('should handle malformed error messages', async () => {
      const testFilePath = '/path/to/test.ts';
      const testName = 'test with bad error';
      const errorMessage = null as any;
      const testContent = 'test("something", () => { expect(1).toBe(2); });';
      
      mockErrorAnalyzer.parseTestError.mockReturnValue(null);
      mockErrorAnalyzer.categorizeError.mockReturnValue('UNKNOWN_ERROR');
      mockTestCode.parseTest.mockReturnValue({ name: testName, code: testContent });
      
      mockAiClient.generateFix.mockResolvedValue({
        success: false,
        error: 'Cannot analyze null error message'
      });
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result.success).toBe(false);
      expect(mockErrorAnalyzer.parseTestError).toHaveBeenCalledWith(errorMessage);
    });

    test('should handle tests with no fixable issues', async () => {
      const testFilePath = '/path/to/unfixable.test.ts';
      const testName = 'test with environmental issue';
      const errorMessage = 'Database connection refused';
      const testContent = 'test("db test", async () => { await db.connect(); });';
      
      mockErrorAnalyzer.parseTestError.mockReturnValue({
        type: 'runtime',
        message: errorMessage
      });
      
      mockErrorAnalyzer.categorizeError.mockReturnValue('ENVIRONMENT_ERROR');
      mockTestCode.parseTest.mockReturnValue({ name: testName, code: testContent });
      
      mockAiClient.generateFix.mockResolvedValue({
        success: false,
        error: 'Cannot fix environmental issues in test code',
        recommendation: 'Check database configuration'
      });
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result.success).toBe(false);
      expect(result.recommendation).toBeDefined();
    });

    test('should handle very long test files efficiently', async () => {
      const testFilePath = '/path/to/large.test.ts';
      const testName = 'test in large suite';
      const errorMessage = 'Expected value mismatch';
      const testContent = 'test'.repeat(10000) + 'expect(1).toBe(2);';
      
      mockErrorAnalyzer.parseTestError.mockReturnValue({ type: 'assertion', message: errorMessage });
      mockErrorAnalyzer.categorizeError.mockReturnValue('ASSERTION_ERROR');
      mockTestCode.parseTest.mockReturnValue({ name: testName, code: testContent });
      
      mockAiClient.generateFix.mockResolvedValue({
        success: true,
        fixedCode: testContent.replace('toBe(2)', 'toBe(1)'),
        explanation: 'Fixed assertion'
      });
      
      mockTestCode.applyFix.mockReturnValue(true);
      mockTestCode.validateSyntax.mockReturnValue({ valid: true });
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result.success).toBe(true);
      expect(mockAiClient.generateFix).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle AI client failures gracefully', async () => {
      const testFilePath = '/path/to/test.ts';
      const testName = 'failing test';
      const errorMessage = 'Some error';
      const testContent = 'test("test", () => {});';
      
      mockErrorAnalyzer.parseTestError.mockReturnValue({ type: 'assertion', message: errorMessage });
      mockErrorAnalyzer.categorizeError.mockReturnValue('ASSERTION_ERROR');
      mockTestCode.parseTest.mockReturnValue({ name: testName, code: testContent });
      
      mockAiClient.generateFix.mockRejectedValue(new Error('AI service unavailable'));
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('AI service unavailable');
    });

    test('should handle error analyzer failures', async () => {
      const testFilePath = '/path/to/test.ts';
      const testName = 'test';
      const errorMessage = 'Error message';
      const testContent = 'test code';
      
      mockErrorAnalyzer.parseTestError.mockImplementation(() => {
        throw new Error('Parser error');
      });
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle test code validation failures', async () => {
      const testFilePath = '/path/to/test.ts';
      const testName = 'test with syntax error';
      const errorMessage = 'Test failed';
      const testContent = 'test("test", () => { expect(1).toBe(1); });';
      
      mockErrorAnalyzer.parseTestError.mockReturnValue({ type: 'assertion', message: errorMessage });
      mockErrorAnalyzer.categorizeError.mockReturnValue('ASSERTION_ERROR');
      mockTestCode.parseTest.mockReturnValue({ name: testName, code: testContent });
      
      const invalidFixedCode = 'test("test", () => { expect(1).toBe(1) });';
      mockAiClient.generateFix.mockResolvedValue({
        success: true,
        fixedCode: invalidFixedCode
      });
      
      mockTestCode.validateSyntax.mockReturnValue({
        valid: false,
        errors: ['Missing semicolon']
      });
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('syntax');
    });

    test('should handle network timeouts when calling AI service', async () => {
      const testFilePath = '/path/to/test.ts';
      const testName = 'test';
      const errorMessage = 'Test error';
      const testContent = 'test code';
      
      mockErrorAnalyzer.parseTestError.mockReturnValue({ type: 'assertion', message: errorMessage });
      mockErrorAnalyzer.categorizeError.mockReturnValue('ASSERTION_ERROR');
      mockTestCode.parseTest.mockReturnValue({ name: testName, code: testContent });
      
      mockAiClient.generateFix.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    test('should handle invalid file paths', async () => {
      const testFilePath = '';
      const testName = 'test';
      const errorMessage = 'Error';
      const testContent = 'test code';
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle circular reference errors in test code', async () => {
      const testFilePath = '/path/to/circular.test.ts';
      const testName = 'test with circular ref';
      const errorMessage = 'Maximum call stack exceeded';
      const testContent = 'test("test", () => { const a = { b: null }; a.b = a; });';
      
      mockErrorAnalyzer.parseTestError.mockReturnValue({ type: 'runtime', message: errorMessage });
      mockErrorAnalyzer.categorizeError.mockReturnValue('RUNTIME_ERROR');
      mockTestCode.parseTest.mockReturnValue({ name: testName, code: testContent });
      
      mockAiClient.generateFix.mockResolvedValue({
        success: true,
        fixedCode: 'test("test", () => { const a = { b: null }; });',
        explanation: 'Removed circular reference'
      });
      
      mockTestCode.applyFix.mockReturnValue(true);
      mockTestCode.validateSyntax.mockReturnValue({ valid: true });
      
      const result = await fixFailingTests(testFilePath, testName, errorMessage, testContent);
      
      expect(result.success).toBe(true);
      expect(result.fixedCode).not.toContain('a.b = a');
    });
  });
});