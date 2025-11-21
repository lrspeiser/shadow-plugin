import { generateTests } from '../testGenerator';
import { aiService } from '../../services/aiService';
import { buildPromptForAnalysis } from '../../utils/promptBuilder';
import { validateTests } from '../../utils/testValidator';
import { batchProcessor } from '../../utils/batchProcessor';

// Mocks
jest.mock('../../services/aiService');
jest.mock('../../utils/promptBuilder');
jest.mock('../../utils/testValidator');
jest.mock('../../utils/batchProcessor');

describe('generateTests', () => {
  const mockAiService = aiService as jest.Mocked<typeof aiService>;
  const mockBuildPrompt = buildPromptForAnalysis as jest.MockedFunction<typeof buildPromptForAnalysis>;
  const mockValidateTests = validateTests as jest.MockedFunction<typeof validateTests>;
  const mockBatchProcessor = batchProcessor as jest.Mocked<typeof batchProcessor>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    test('should generate tests successfully for valid function', async () => {
      const mockFunctionCode = 'function add(a: number, b: number): number { return a + b; }';
      const mockPrompt = 'Generate tests for add function';
      const mockGeneratedTests = 'describe("add", () => { test("adds numbers", () => { expect(add(1, 2)).toBe(3); }); });';
      
      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateTests = jest.fn().mockResolvedValue(mockGeneratedTests);
      mockValidateTests.mockReturnValue({ isValid: true, errors: [] });

      const result = await generateTests(mockFunctionCode, { functionName: 'add', filePath: 'test.ts' });

      expect(mockBuildPrompt).toHaveBeenCalledWith(mockFunctionCode, expect.any(Object));
      expect(mockAiService.generateTests).toHaveBeenCalledWith(mockPrompt);
      expect(mockValidateTests).toHaveBeenCalledWith(mockGeneratedTests);
      expect(result).toBe(mockGeneratedTests);
    });

    test('should handle complex functions with multiple test cases', async () => {
      const mockComplexFunction = 'function calculate(op: string, a: number, b: number): number { /* implementation */ }';
      const mockPrompt = 'Generate comprehensive tests';
      const mockTests = 'describe("calculate", () => { /* multiple tests */ });';
      
      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateTests = jest.fn().mockResolvedValue(mockTests);
      mockValidateTests.mockReturnValue({ isValid: true, errors: [] });

      const result = await generateTests(mockComplexFunction, { functionName: 'calculate', filePath: 'calc.ts' });

      expect(result).toBe(mockTests);
      expect(mockValidateTests).toHaveBeenCalled();
    });

    test('should use batch processor for large functions', async () => {
      const largeFunctionCode = 'function largeFunc() {' + '\n  // line\n'.repeat(300) + '}';
      const mockBatchedTests = ['test batch 1', 'test batch 2'];
      const mockCombinedTests = 'describe("largeFunc", () => { /* combined tests */ });';
      
      mockBatchProcessor.processBatches = jest.fn().mockResolvedValue(mockBatchedTests);
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateTests = jest.fn().mockResolvedValue(mockCombinedTests);
      mockValidateTests.mockReturnValue({ isValid: true, errors: [] });

      const result = await generateTests(largeFunctionCode, { functionName: 'largeFunc', filePath: 'large.ts' });

      expect(mockBatchProcessor.processBatches).toHaveBeenCalled();
      expect(result).toBe(mockCombinedTests);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty function code', async () => {
      const result = await generateTests('', { functionName: 'empty', filePath: 'test.ts' });

      expect(result).toBeNull();
      expect(mockAiService.generateTests).not.toHaveBeenCalled();
    });

    test('should handle null or undefined input', async () => {
      const resultNull = await generateTests(null as any, { functionName: 'test', filePath: 'test.ts' });
      const resultUndefined = await generateTests(undefined as any, { functionName: 'test', filePath: 'test.ts' });

      expect(resultNull).toBeNull();
      expect(resultUndefined).toBeNull();
    });

    test('should handle function with minimal code', async () => {
      const minimalCode = 'const x = 1;';
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateTests = jest.fn().mockResolvedValue('test code');
      mockValidateTests.mockReturnValue({ isValid: true, errors: [] });

      const result = await generateTests(minimalCode, { functionName: 'x', filePath: 'test.ts' });

      expect(result).toBe('test code');
    });

    test('should handle special characters in function code', async () => {
      const specialCharsCode = 'function test() { return "\"\\n\\t"; }';
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateTests = jest.fn().mockResolvedValue('test');
      mockValidateTests.mockReturnValue({ isValid: true, errors: [] });

      const result = await generateTests(specialCharsCode, { functionName: 'test', filePath: 'test.ts' });

      expect(result).toBe('test');
    });
  });

  describe('Error Handling', () => {
    test('should handle AI service errors gracefully', async () => {
      const mockCode = 'function test() {}';
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateTests = jest.fn().mockRejectedValue(new Error('AI service unavailable'));

      await expect(generateTests(mockCode, { functionName: 'test', filePath: 'test.ts' }))
        .rejects.toThrow('AI service unavailable');
    });

    test('should handle validation failures', async () => {
      const mockCode = 'function test() {}';
      const invalidTests = 'invalid test code';
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateTests = jest.fn().mockResolvedValue(invalidTests);
      mockValidateTests.mockReturnValue({ 
        isValid: false, 
        errors: ['Syntax error', 'Missing imports'] 
      });

      const result = await generateTests(mockCode, { functionName: 'test', filePath: 'test.ts' });

      expect(result).toBeNull();
      expect(mockValidateTests).toHaveBeenCalledWith(invalidTests);
    });

    test('should handle prompt builder errors', async () => {
      const mockCode = 'function test() {}';
      mockBuildPrompt.mockImplementation(() => {
        throw new Error('Prompt builder failed');
      });

      await expect(generateTests(mockCode, { functionName: 'test', filePath: 'test.ts' }))
        .rejects.toThrow('Prompt builder failed');
    });

    test('should handle batch processor errors', async () => {
      const largeFunctionCode = 'function large() {' + '\n  // line\n'.repeat(300) + '}';
      mockBatchProcessor.processBatches = jest.fn().mockRejectedValue(new Error('Batch processing failed'));

      await expect(generateTests(largeFunctionCode, { functionName: 'large', filePath: 'test.ts' }))
        .rejects.toThrow('Batch processing failed');
    });

    test('should handle timeout scenarios', async () => {
      const mockCode = 'function test() {}';
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateTests = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      await expect(generateTests(mockCode, { functionName: 'test', filePath: 'test.ts' }))
        .rejects.toThrow('Timeout');
    });
  });

  describe('Options and Configuration', () => {
    test('should respect custom options passed', async () => {
      const mockCode = 'function test() {}';
      const customOptions = {
        functionName: 'customTest',
        filePath: 'custom.ts',
        testFramework: 'jest',
        coverage: true
      };
      
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateTests = jest.fn().mockResolvedValue('test');
      mockValidateTests.mockReturnValue({ isValid: true, errors: [] });

      await generateTests(mockCode, customOptions);

      expect(mockBuildPrompt).toHaveBeenCalledWith(mockCode, customOptions);
    });

    test('should use default options when not provided', async () => {
      const mockCode = 'function test() {}';
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateTests = jest.fn().mockResolvedValue('test');
      mockValidateTests.mockReturnValue({ isValid: true, errors: [] });

      await generateTests(mockCode);

      expect(mockBuildPrompt).toHaveBeenCalledWith(mockCode, undefined);
    });
  });

  describe('Retry Logic', () => {
    test('should retry on transient failures', async () => {
      const mockCode = 'function test() {}';
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateTests = jest.fn()
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValueOnce('test code');
      mockValidateTests.mockReturnValue({ isValid: true, errors: [] });

      const result = await generateTests(mockCode, { functionName: 'test', filePath: 'test.ts', retry: true });

      expect(result).toBe('test code');
      expect(mockAiService.generateTests).toHaveBeenCalledTimes(2);
    });
  });
});