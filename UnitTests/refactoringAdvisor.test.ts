import { generateRefactoringRecommendations } from '../refactoringAdvisor';
import { detectCodeSmells } from '../codeSmellDetector';
import { aiService } from '../../services/aiService';

// Mocks
jest.mock('../codeSmellDetector');
jest.mock('../../services/aiService');

describe('generateRefactoringRecommendations', () => {
  const mockDetectCodeSmells = detectCodeSmells as jest.MockedFunction<typeof detectCodeSmells>;
  const mockAiService = aiService as jest.Mocked<typeof aiService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Happy Path', () => {
    test('should generate refactoring recommendations for code with detected smells', async () => {
      const mockCode = 'function longFunction() { /* lots of code */ }';
      const mockFilePath = '/test/file.ts';
      const mockCodeSmells = [
        { type: 'longMethod', severity: 'high', line: 1, description: 'Method is too long' },
        { type: 'duplicateCode', severity: 'medium', line: 5, description: 'Duplicate code detected' }
      ];
      const mockAiRecommendations = [
        { smell: 'longMethod', recommendation: 'Extract method', priority: 1 },
        { smell: 'duplicateCode', recommendation: 'Create reusable function', priority: 2 }
      ];

      mockDetectCodeSmells.mockResolvedValue(mockCodeSmells);
      mockAiService.generateRecommendations = jest.fn().mockResolvedValue(mockAiRecommendations);

      const result = await generateRefactoringRecommendations(mockCode, mockFilePath);

      expect(mockDetectCodeSmells).toHaveBeenCalledWith(mockCode, mockFilePath);
      expect(mockAiService.generateRecommendations).toHaveBeenCalledWith(mockCodeSmells);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ smell: 'longMethod', recommendation: 'Extract method' }),
        expect.objectContaining({ smell: 'duplicateCode', recommendation: 'Create reusable function' })
      ]));
      expect(result).toHaveLength(2);
    });

    test('should return empty array when no code smells are detected', async () => {
      const mockCode = 'function cleanFunction() { return 42; }';
      const mockFilePath = '/test/clean.ts';

      mockDetectCodeSmells.mockResolvedValue([]);
      mockAiService.generateRecommendations = jest.fn().mockResolvedValue([]);

      const result = await generateRefactoringRecommendations(mockCode, mockFilePath);

      expect(mockDetectCodeSmells).toHaveBeenCalledWith(mockCode, mockFilePath);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test('should handle multiple code smells of same type', async () => {
      const mockCode = 'const code = "test";';
      const mockFilePath = '/test/duplicate.ts';
      const mockCodeSmells = [
        { type: 'duplicateCode', severity: 'high', line: 1, description: 'First duplicate' },
        { type: 'duplicateCode', severity: 'high', line: 10, description: 'Second duplicate' },
        { type: 'duplicateCode', severity: 'medium', line: 20, description: 'Third duplicate' }
      ];
      const mockAiRecommendations = [
        { smell: 'duplicateCode', recommendation: 'Consolidate duplicates', priority: 1 }
      ];

      mockDetectCodeSmells.mockResolvedValue(mockCodeSmells);
      mockAiService.generateRecommendations = jest.fn().mockResolvedValue(mockAiRecommendations);

      const result = await generateRefactoringRecommendations(mockCode, mockFilePath);

      expect(result).toBeDefined();
      expect(mockDetectCodeSmells).toHaveBeenCalledTimes(1);
      expect(mockAiService.generateRecommendations).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty code string', async () => {
      const mockCode = '';
      const mockFilePath = '/test/empty.ts';

      mockDetectCodeSmells.mockResolvedValue([]);
      mockAiService.generateRecommendations = jest.fn().mockResolvedValue([]);

      const result = await generateRefactoringRecommendations(mockCode, mockFilePath);

      expect(result).toEqual([]);
      expect(mockDetectCodeSmells).toHaveBeenCalledWith('', mockFilePath);
    });

    test('should handle null or undefined file path', async () => {
      const mockCode = 'function test() {}';
      const mockCodeSmells = [];

      mockDetectCodeSmells.mockResolvedValue(mockCodeSmells);
      mockAiService.generateRecommendations = jest.fn().mockResolvedValue([]);

      const result = await generateRefactoringRecommendations(mockCode, undefined as any);

      expect(result).toEqual([]);
      expect(mockDetectCodeSmells).toHaveBeenCalled();
    });

    test('should handle very large code input', async () => {
      const mockCode = 'a'.repeat(100000);
      const mockFilePath = '/test/large.ts';
      const mockCodeSmells = [{ type: 'longFile', severity: 'high', line: 1, description: 'File too large' }];

      mockDetectCodeSmells.mockResolvedValue(mockCodeSmells);
      mockAiService.generateRecommendations = jest.fn().mockResolvedValue([{ smell: 'longFile', recommendation: 'Split file', priority: 1 }]);

      const result = await generateRefactoringRecommendations(mockCode, mockFilePath);

      expect(result).toBeDefined();
      expect(mockDetectCodeSmells).toHaveBeenCalled();
    });

    test('should handle special characters in code', async () => {
      const mockCode = 'const str = "<script>alert(\'xss\')</script>"';
      const mockFilePath = '/test/special.ts';

      mockDetectCodeSmells.mockResolvedValue([]);
      mockAiService.generateRecommendations = jest.fn().mockResolvedValue([]);

      const result = await generateRefactoringRecommendations(mockCode, mockFilePath);

      expect(result).toEqual([]);
      expect(mockDetectCodeSmells).toHaveBeenCalledWith(mockCode, mockFilePath);
    });
  });

  describe('Error Handling', () => {
    test('should handle detectCodeSmells throwing an error', async () => {
      const mockCode = 'function test() {}';
      const mockFilePath = '/test/error.ts';
      const error = new Error('Code smell detection failed');

      mockDetectCodeSmells.mockRejectedValue(error);

      await expect(generateRefactoringRecommendations(mockCode, mockFilePath)).rejects.toThrow('Code smell detection failed');
      expect(mockDetectCodeSmells).toHaveBeenCalledWith(mockCode, mockFilePath);
    });

    test('should handle aiService.generateRecommendations throwing an error', async () => {
      const mockCode = 'function test() {}';
      const mockFilePath = '/test/ai-error.ts';
      const mockCodeSmells = [{ type: 'longMethod', severity: 'high', line: 1, description: 'Long method' }];
      const error = new Error('AI service unavailable');

      mockDetectCodeSmells.mockResolvedValue(mockCodeSmells);
      mockAiService.generateRecommendations = jest.fn().mockRejectedValue(error);

      await expect(generateRefactoringRecommendations(mockCode, mockFilePath)).rejects.toThrow('AI service unavailable');
      expect(mockAiService.generateRecommendations).toHaveBeenCalledWith(mockCodeSmells);
    });

    test('should handle network timeout errors', async () => {
      const mockCode = 'function test() {}';
      const mockFilePath = '/test/timeout.ts';
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      mockDetectCodeSmells.mockRejectedValue(timeoutError);

      await expect(generateRefactoringRecommendations(mockCode, mockFilePath)).rejects.toThrow('Request timeout');
    });

    test('should handle malformed code smell data', async () => {
      const mockCode = 'function test() {}';
      const mockFilePath = '/test/malformed.ts';
      const malformedSmells: any = [{ invalidField: 'bad data' }];

      mockDetectCodeSmells.mockResolvedValue(malformedSmells);
      mockAiService.generateRecommendations = jest.fn().mockResolvedValue([]);

      const result = await generateRefactoringRecommendations(mockCode, mockFilePath);

      expect(mockAiService.generateRecommendations).toHaveBeenCalledWith(malformedSmells);
      expect(result).toBeDefined();
    });

    test('should handle aiService returning null', async () => {
      const mockCode = 'function test() {}';
      const mockFilePath = '/test/null.ts';
      const mockCodeSmells = [{ type: 'smell', severity: 'low', line: 1, description: 'Test' }];

      mockDetectCodeSmells.mockResolvedValue(mockCodeSmells);
      mockAiService.generateRecommendations = jest.fn().mockResolvedValue(null as any);

      const result = await generateRefactoringRecommendations(mockCode, mockFilePath);

      expect(result).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    test('should prioritize high severity smells', async () => {
      const mockCode = 'function complex() {}';
      const mockFilePath = '/test/priority.ts';
      const mockCodeSmells = [
        { type: 'lowIssue', severity: 'low', line: 1, description: 'Minor issue' },
        { type: 'highIssue', severity: 'high', line: 2, description: 'Critical issue' },
        { type: 'mediumIssue', severity: 'medium', line: 3, description: 'Moderate issue' }
      ];
      const mockAiRecommendations = [
        { smell: 'highIssue', recommendation: 'Fix immediately', priority: 1 },
        { smell: 'mediumIssue', recommendation: 'Fix soon', priority: 2 },
        { smell: 'lowIssue', recommendation: 'Fix when possible', priority: 3 }
      ];

      mockDetectCodeSmells.mockResolvedValue(mockCodeSmells);
      mockAiService.generateRecommendations = jest.fn().mockResolvedValue(mockAiRecommendations);

      const result = await generateRefactoringRecommendations(mockCode, mockFilePath);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(expect.objectContaining({ priority: 1 }));
    });

    test('should handle mixed valid and invalid recommendations', async () => {
      const mockCode = 'function test() {}';
      const mockFilePath = '/test/mixed.ts';
      const mockCodeSmells = [{ type: 'smell', severity: 'medium', line: 1, description: 'Test smell' }];
      const mockAiRecommendations = [
        { smell: 'smell', recommendation: 'Valid recommendation', priority: 1 },
        null,
        { smell: 'smell', recommendation: 'Another valid', priority: 2 }
      ];

      mockDetectCodeSmells.mockResolvedValue(mockCodeSmells);
      mockAiService.generateRecommendations = jest.fn().mockResolvedValue(mockAiRecommendations as any);

      const result = await generateRefactoringRecommendations(mockCode, mockFilePath);

      expect(result).toBeDefined();
      expect(mockAiService.generateRecommendations).toHaveBeenCalled();
    });
  });
});