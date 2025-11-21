import { generateInsights } from '../insightGenerator';
import * as aiService from '../aiService';
import { buildPromptForAnalysis } from '../promptBuilder';
import { parseAnalysisResponse } from '../responseParser';
import { enforceRateLimit } from '../rateLimiter';

// Mocks
jest.mock('../aiService');
jest.mock('../promptBuilder');
jest.mock('../responseParser');
jest.mock('../rateLimiter');

describe('generateInsights', () => {
  const mockAiService = aiService as jest.Mocked<typeof aiService>;
  const mockBuildPrompt = buildPromptForAnalysis as jest.MockedFunction<typeof buildPromptForAnalysis>;
  const mockParseResponse = parseAnalysisResponse as jest.MockedFunction<typeof parseAnalysisResponse>;
  const mockEnforceRateLimit = enforceRateLimit as jest.MockedFunction<typeof enforceRateLimit>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    it('should generate insights successfully with valid input', async () => {
      const mockData = { code: 'function test() {}', context: 'unit test' };
      const mockPrompt = 'Analyze this code: function test() {}';
      const mockAiResponse = { insights: ['Insight 1', 'Insight 2'], confidence: 0.9 };
      const mockParsedInsights = [
        { type: 'suggestion', message: 'Insight 1', severity: 'info' },
        { type: 'warning', message: 'Insight 2', severity: 'warning' }
      ];

      mockEnforceRateLimit.mockResolvedValue(undefined);
      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateCompletion = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedInsights);

      const result = await generateInsights(mockData);

      expect(mockEnforceRateLimit).toHaveBeenCalledTimes(1);
      expect(mockBuildPrompt).toHaveBeenCalledWith(mockData);
      expect(mockAiService.generateCompletion).toHaveBeenCalledWith(mockPrompt);
      expect(mockParseResponse).toHaveBeenCalledWith(mockAiResponse);
      expect(result).toEqual(mockParsedInsights);
    });

    it('should handle multiple code analysis requests', async () => {
      const mockData1 = { code: 'const a = 1;', context: 'test1' };
      const mockData2 = { code: 'const b = 2;', context: 'test2' };
      const mockInsights = [{ type: 'info', message: 'test', severity: 'info' }];

      mockEnforceRateLimit.mockResolvedValue(undefined);
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateCompletion = jest.fn().mockResolvedValue({ insights: [] });
      mockParseResponse.mockReturnValue(mockInsights);

      const result1 = await generateInsights(mockData1);
      const result2 = await generateInsights(mockData2);

      expect(mockEnforceRateLimit).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(mockInsights);
      expect(result2).toEqual(mockInsights);
    });
  });

  describe('edge cases', () => {
    it('should handle empty code input', async () => {
      const mockData = { code: '', context: 'empty' };
      const emptyInsights: any[] = [];

      mockEnforceRateLimit.mockResolvedValue(undefined);
      mockBuildPrompt.mockReturnValue('');
      mockAiService.generateCompletion = jest.fn().mockResolvedValue({ insights: [] });
      mockParseResponse.mockReturnValue(emptyInsights);

      const result = await generateInsights(mockData);

      expect(result).toEqual(emptyInsights);
    });

    it('should handle null context', async () => {
      const mockData = { code: 'test', context: null };
      const mockInsights = [{ type: 'info', message: 'test', severity: 'info' }];

      mockEnforceRateLimit.mockResolvedValue(undefined);
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateCompletion = jest.fn().mockResolvedValue({ insights: [] });
      mockParseResponse.mockReturnValue(mockInsights);

      const result = await generateInsights(mockData);

      expect(result).toEqual(mockInsights);
    });

    it('should handle very large code input', async () => {
      const largeCode = 'a'.repeat(100000);
      const mockData = { code: largeCode, context: 'large' };
      const mockInsights = [{ type: 'warning', message: 'Large file', severity: 'warning' }];

      mockEnforceRateLimit.mockResolvedValue(undefined);
      mockBuildPrompt.mockReturnValue('large prompt');
      mockAiService.generateCompletion = jest.fn().mockResolvedValue({ insights: [] });
      mockParseResponse.mockReturnValue(mockInsights);

      const result = await generateInsights(mockData);

      expect(result).toEqual(mockInsights);
    });

    it('should handle AI response with no insights', async () => {
      const mockData = { code: 'test', context: 'test' };
      const emptyInsights: any[] = [];

      mockEnforceRateLimit.mockResolvedValue(undefined);
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateCompletion = jest.fn().mockResolvedValue(null);
      mockParseResponse.mockReturnValue(emptyInsights);

      const result = await generateInsights(mockData);

      expect(result).toEqual(emptyInsights);
    });

    it('should handle malformed AI response', async () => {
      const mockData = { code: 'test', context: 'test' };
      const fallbackInsights: any[] = [];

      mockEnforceRateLimit.mockResolvedValue(undefined);
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateCompletion = jest.fn().mockResolvedValue({ malformed: 'data' });
      mockParseResponse.mockReturnValue(fallbackInsights);

      const result = await generateInsights(mockData);

      expect(result).toEqual(fallbackInsights);
    });
  });

  describe('error handling', () => {
    it('should handle rate limit errors', async () => {
      const mockData = { code: 'test', context: 'test' };
      const rateLimitError = new Error('Rate limit exceeded');

      mockEnforceRateLimit.mockRejectedValue(rateLimitError);

      await expect(generateInsights(mockData)).rejects.toThrow('Rate limit exceeded');
      expect(mockBuildPrompt).not.toHaveBeenCalled();
    });

    it('should handle AI service errors', async () => {
      const mockData = { code: 'test', context: 'test' };
      const aiError = new Error('AI service unavailable');

      mockEnforceRateLimit.mockResolvedValue(undefined);
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateCompletion = jest.fn().mockRejectedValue(aiError);

      await expect(generateInsights(mockData)).rejects.toThrow('AI service unavailable');
    });

    it('should handle prompt building errors', async () => {
      const mockData = { code: 'test', context: 'test' };
      const promptError = new Error('Invalid prompt format');

      mockEnforceRateLimit.mockResolvedValue(undefined);
      mockBuildPrompt.mockImplementation(() => { throw promptError; });

      await expect(generateInsights(mockData)).rejects.toThrow('Invalid prompt format');
    });

    it('should handle parsing errors', async () => {
      const mockData = { code: 'test', context: 'test' };
      const parseError = new Error('Failed to parse response');

      mockEnforceRateLimit.mockResolvedValue(undefined);
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateCompletion = jest.fn().mockResolvedValue({ data: 'test' });
      mockParseResponse.mockImplementation(() => { throw parseError; });

      await expect(generateInsights(mockData)).rejects.toThrow('Failed to parse response');
    });

    it('should handle network timeout errors', async () => {
      const mockData = { code: 'test', context: 'test' };
      const timeoutError = new Error('Request timeout');

      mockEnforceRateLimit.mockResolvedValue(undefined);
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateCompletion = jest.fn().mockRejectedValue(timeoutError);

      await expect(generateInsights(mockData)).rejects.toThrow('Request timeout');
    });

    it('should handle invalid input data', async () => {
      const invalidData: any = null;

      mockEnforceRateLimit.mockResolvedValue(undefined);

      await expect(generateInsights(invalidData)).rejects.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should respect rate limiting between requests', async () => {
      const mockData = { code: 'test', context: 'test' };
      let callCount = 0;

      mockEnforceRateLimit.mockImplementation(async () => {
        callCount++;
        if (callCount > 3) {
          throw new Error('Too many requests');
        }
      });
      mockBuildPrompt.mockReturnValue('prompt');
      mockAiService.generateCompletion = jest.fn().mockResolvedValue({ insights: [] });
      mockParseResponse.mockReturnValue([]);

      await generateInsights(mockData);
      await generateInsights(mockData);
      await generateInsights(mockData);

      await expect(generateInsights(mockData)).rejects.toThrow('Too many requests');
      expect(callCount).toBe(4);
    });

    it('should pass through all data correctly in the pipeline', async () => {
      const mockData = { code: 'function test() { return true; }', context: 'unit test', metadata: { file: 'test.ts' } };
      const mockPrompt = 'Analyze: function test() { return true; }';
      const mockAiResponse = { insights: ['Good function'], confidence: 0.95 };
      const mockParsedInsights = [{ type: 'success', message: 'Good function', severity: 'info' }];

      mockEnforceRateLimit.mockResolvedValue(undefined);
      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateCompletion = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedInsights);

      const result = await generateInsights(mockData);

      expect(mockBuildPrompt).toHaveBeenCalledWith(mockData);
      expect(mockAiService.generateCompletion).toHaveBeenCalledWith(mockPrompt);
      expect(mockParseResponse).toHaveBeenCalledWith(mockAiResponse);
      expect(result).toEqual(mockParsedInsights);
    });
  });
});