import { fixFailingTests } from '../testValidator';
import { aiService } from '../../services/aiService';
import { parseTestErrors } from '../testValidator';
import { regenerateTest } from '../testValidator';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');
jest.mock('../../services/aiService', () => ({ aiService: { analyzeTestFailures: jest.fn(), suggestTestFixes: jest.fn() } }));
jest.mock('../testValidator', () => ({ ...jest.requireActual('../testValidator'), parseTestErrors: jest.fn(), regenerateTest: jest.fn() }));

describe('fixFailingTests', () => {
  let mockAiService: jest.Mocked<typeof aiService>;
  let mockParseTestErrors: jest.MockedFunction<typeof parseTestErrors>;
  let mockRegenerateTest: jest.MockedFunction<typeof regenerateTest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiService = aiService as jest.Mocked<typeof aiService>;
    mockParseTestErrors = parseTestErrors as jest.MockedFunction<typeof parseTestErrors>;
    mockRegenerateTest = regenerateTest as jest.MockedFunction<typeof regenerateTest>;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should successfully fix failing tests with valid input', async () => {
    const testFilePath = '/path/to/test.spec.ts';
    const testOutput = 'Test failed: expected true to be false';
    const parsedErrors = [
      { testName: 'should validate input', error: 'Assertion error', line: 10 }
    ];
    const fixSuggestions = [
      { testName: 'should validate input', suggestedFix: 'Change assertion', code: 'expect(true).toBe(true);' }
    ];

    mockParseTestErrors.mockReturnValue(parsedErrors);
    mockAiService.analyzeTestFailures.mockResolvedValue(fixSuggestions);
    mockRegenerateTest.mockResolvedValue(true);

    const result = await fixFailingTests(testFilePath, testOutput);

    expect(mockParseTestErrors).toHaveBeenCalledWith(testOutput);
    expect(mockAiService.analyzeTestFailures).toHaveBeenCalledWith(parsedErrors, testFilePath);
    expect(mockRegenerateTest).toHaveBeenCalledWith(testFilePath, fixSuggestions[0]);
    expect(result).toEqual({ success: true, fixedCount: 1, errors: [] });
  });

  test('should handle empty test output gracefully', async () => {
    const testFilePath = '/path/to/test.spec.ts';
    const testOutput = '';

    mockParseTestErrors.mockReturnValue([]);

    const result = await fixFailingTests(testFilePath, testOutput);

    expect(mockParseTestErrors).toHaveBeenCalledWith(testOutput);
    expect(mockAiService.analyzeTestFailures).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, fixedCount: 0, errors: [] });
  });

  test('should handle multiple failing tests and fix them all', async () => {
    const testFilePath = '/path/to/test.spec.ts';
    const testOutput = 'Multiple test failures';
    const parsedErrors = [
      { testName: 'test1', error: 'Error 1', line: 10 },
      { testName: 'test2', error: 'Error 2', line: 20 },
      { testName: 'test3', error: 'Error 3', line: 30 }
    ];
    const fixSuggestions = [
      { testName: 'test1', suggestedFix: 'Fix 1', code: 'code1' },
      { testName: 'test2', suggestedFix: 'Fix 2', code: 'code2' },
      { testName: 'test3', suggestedFix: 'Fix 3', code: 'code3' }
    ];

    mockParseTestErrors.mockReturnValue(parsedErrors);
    mockAiService.analyzeTestFailures.mockResolvedValue(fixSuggestions);
    mockRegenerateTest.mockResolvedValue(true);

    const result = await fixFailingTests(testFilePath, testOutput);

    expect(mockRegenerateTest).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ success: true, fixedCount: 3, errors: [] });
  });

  test('should handle AI service failure gracefully', async () => {
    const testFilePath = '/path/to/test.spec.ts';
    const testOutput = 'Test failed';
    const parsedErrors = [{ testName: 'test1', error: 'Error', line: 10 }];

    mockParseTestErrors.mockReturnValue(parsedErrors);
    mockAiService.analyzeTestFailures.mockRejectedValue(new Error('AI service unavailable'));

    const result = await fixFailingTests(testFilePath, testOutput);

    expect(result).toEqual({ success: false, fixedCount: 0, errors: ['AI service unavailable'] });
  });

  test('should handle partial fix failures', async () => {
    const testFilePath = '/path/to/test.spec.ts';
    const testOutput = 'Multiple test failures';
    const parsedErrors = [
      { testName: 'test1', error: 'Error 1', line: 10 },
      { testName: 'test2', error: 'Error 2', line: 20 }
    ];
    const fixSuggestions = [
      { testName: 'test1', suggestedFix: 'Fix 1', code: 'code1' },
      { testName: 'test2', suggestedFix: 'Fix 2', code: 'code2' }
    ];

    mockParseTestErrors.mockReturnValue(parsedErrors);
    mockAiService.analyzeTestFailures.mockResolvedValue(fixSuggestions);
    mockRegenerateTest
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await fixFailingTests(testFilePath, testOutput);

    expect(result).toEqual({ success: true, fixedCount: 1, errors: ['Failed to regenerate test2'] });
  });

  test('should handle parseTestErrors throwing an error', async () => {
    const testFilePath = '/path/to/test.spec.ts';
    const testOutput = 'Malformed output';

    mockParseTestErrors.mockImplementation(() => {
      throw new Error('Parse error');
    });

    const result = await fixFailingTests(testFilePath, testOutput);

    expect(result).toEqual({ success: false, fixedCount: 0, errors: ['Parse error'] });
  });

  test('should handle null or undefined test file path', async () => {
    const testFilePath = null as any;
    const testOutput = 'Test failed';

    const result = await fixFailingTests(testFilePath, testOutput);

    expect(result).toEqual({ success: false, fixedCount: 0, errors: ['Invalid test file path'] });
  });

  test('should handle regenerateTest throwing an error', async () => {
    const testFilePath = '/path/to/test.spec.ts';
    const testOutput = 'Test failed';
    const parsedErrors = [{ testName: 'test1', error: 'Error', line: 10 }];
    const fixSuggestions = [{ testName: 'test1', suggestedFix: 'Fix', code: 'code' }];

    mockParseTestErrors.mockReturnValue(parsedErrors);
    mockAiService.analyzeTestFailures.mockResolvedValue(fixSuggestions);
    mockRegenerateTest.mockRejectedValue(new Error('File write error'));

    const result = await fixFailingTests(testFilePath, testOutput);

    expect(result).toEqual({ success: false, fixedCount: 0, errors: ['File write error'] });
  });

  test('should handle empty fix suggestions from AI service', async () => {
    const testFilePath = '/path/to/test.spec.ts';
    const testOutput = 'Test failed';
    const parsedErrors = [{ testName: 'test1', error: 'Error', line: 10 }];

    mockParseTestErrors.mockReturnValue(parsedErrors);
    mockAiService.analyzeTestFailures.mockResolvedValue([]);

    const result = await fixFailingTests(testFilePath, testOutput);

    expect(mockRegenerateTest).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, fixedCount: 0, errors: [] });
  });

  test('should handle mismatched errors and suggestions', async () => {
    const testFilePath = '/path/to/test.spec.ts';
    const testOutput = 'Test failed';
    const parsedErrors = [
      { testName: 'test1', error: 'Error 1', line: 10 },
      { testName: 'test2', error: 'Error 2', line: 20 }
    ];
    const fixSuggestions = [
      { testName: 'test1', suggestedFix: 'Fix 1', code: 'code1' }
    ];

    mockParseTestErrors.mockReturnValue(parsedErrors);
    mockAiService.analyzeTestFailures.mockResolvedValue(fixSuggestions);
    mockRegenerateTest.mockResolvedValue(true);

    const result = await fixFailingTests(testFilePath, testOutput);

    expect(mockRegenerateTest).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, fixedCount: 1, errors: [] });
  });
});