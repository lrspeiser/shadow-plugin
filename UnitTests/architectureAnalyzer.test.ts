import { generateArchitectureInsights } from '../architectureAnalyzer';
import * as aiService from '../../services/aiService';
import { buildPromptForAnalysis } from '../promptBuilder';
import { parseAnalysisResponse } from '../responseParser';

// Mocks
jest.mock('../../services/aiService');
jest.mock('../promptBuilder');
jest.mock('../responseParser');

describe('generateArchitectureInsights', () => {
  const mockAiService = aiService as jest.Mocked<typeof aiService>;
  const mockBuildPrompt = buildPromptForAnalysis as jest.MockedFunction<typeof buildPromptForAnalysis>;
  const mockParseResponse = parseAnalysisResponse as jest.MockedFunction<typeof parseAnalysisResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    test('should generate architecture insights successfully with valid input', async () => {
      const mockArchitectureData = {
        files: ['src/index.ts', 'src/utils.ts'],
        dependencies: ['express', 'lodash'],
        structure: { src: ['index.ts', 'utils.ts'] }
      };
      const mockPrompt = 'Analyze this architecture...';
      const mockAiResponse = 'Architecture analysis: Good separation of concerns...';
      const mockParsedInsights = {
        patterns: ['MVC', 'Repository'],
        suggestions: ['Consider adding tests'],
        complexity: 'medium'
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateCompletion = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedInsights);

      const result = await generateArchitectureInsights(mockArchitectureData);

      expect(mockBuildPrompt).toHaveBeenCalledWith(mockArchitectureData);
      expect(mockAiService.generateCompletion).toHaveBeenCalledWith(mockPrompt);
      expect(mockParseResponse).toHaveBeenCalledWith(mockAiResponse);
      expect(result).toEqual(mockParsedInsights);
    });

    test('should handle empty architecture data gracefully', async () => {
      const emptyArchitectureData = {
        files: [],
        dependencies: [],
        structure: {}
      };
      const mockPrompt = 'Analyze empty architecture...';
      const mockAiResponse = 'No architecture detected';
      const mockParsedInsights = {
        patterns: [],
        suggestions: ['Add files to analyze'],
        complexity: 'none'
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateCompletion = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedInsights);

      const result = await generateArchitectureInsights(emptyArchitectureData);

      expect(result).toEqual(mockParsedInsights);
      expect(mockBuildPrompt).toHaveBeenCalledWith(emptyArchitectureData);
    });

    test('should handle large architecture data', async () => {
      const largeArchitectureData = {
        files: Array.from({ length: 1000 }, (_, i) => `file${i}.ts`),
        dependencies: Array.from({ length: 100 }, (_, i) => `dep${i}`),
        structure: { src: Array.from({ length: 1000 }, (_, i) => `file${i}.ts`) }
      };
      const mockPrompt = 'Analyze large architecture...';
      const mockAiResponse = 'Complex architecture analysis...';
      const mockParsedInsights = {
        patterns: ['Microservices', 'Modular'],
        suggestions: ['Consider splitting into smaller services'],
        complexity: 'high'
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateCompletion = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedInsights);

      const result = await generateArchitectureInsights(largeArchitectureData);

      expect(result).toEqual(mockParsedInsights);
    });
  });

  describe('error handling', () => {
    test('should throw error when AI service fails', async () => {
      const mockArchitectureData = {
        files: ['src/index.ts'],
        dependencies: ['express'],
        structure: { src: ['index.ts'] }
      };
      const mockPrompt = 'Analyze this architecture...';
      const mockError = new Error('AI service unavailable');

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateCompletion = jest.fn().mockRejectedValue(mockError);

      await expect(generateArchitectureInsights(mockArchitectureData)).rejects.toThrow('AI service unavailable');
      expect(mockParseResponse).not.toHaveBeenCalled();
    });

    test('should throw error when prompt building fails', async () => {
      const mockArchitectureData = {
        files: ['src/index.ts'],
        dependencies: ['express'],
        structure: { src: ['index.ts'] }
      };
      const mockError = new Error('Invalid architecture data');

      mockBuildPrompt.mockImplementation(() => { throw mockError; });

      await expect(generateArchitectureInsights(mockArchitectureData)).rejects.toThrow('Invalid architecture data');
      expect(mockAiService.generateCompletion).not.toHaveBeenCalled();
    });

    test('should throw error when response parsing fails', async () => {
      const mockArchitectureData = {
        files: ['src/index.ts'],
        dependencies: ['express'],
        structure: { src: ['index.ts'] }
      };
      const mockPrompt = 'Analyze this architecture...';
      const mockAiResponse = 'Invalid response format';
      const mockError = new Error('Failed to parse response');

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateCompletion = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockImplementation(() => { throw mockError; });

      await expect(generateArchitectureInsights(mockArchitectureData)).rejects.toThrow('Failed to parse response');
    });

    test('should handle null or undefined input', async () => {
      const mockError = new Error('Architecture data is required');
      mockBuildPrompt.mockImplementation(() => { throw mockError; });

      await expect(generateArchitectureInsights(null as any)).rejects.toThrow();
      await expect(generateArchitectureInsights(undefined as any)).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    test('should handle AI service returning empty response', async () => {
      const mockArchitectureData = {
        files: ['src/index.ts'],
        dependencies: [],
        structure: { src: ['index.ts'] }
      };
      const mockPrompt = 'Analyze this architecture...';
      const emptyResponse = '';
      const mockParsedInsights = {
        patterns: [],
        suggestions: [],
        complexity: 'unknown'
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateCompletion = jest.fn().mockResolvedValue(emptyResponse);
      mockParseResponse.mockReturnValue(mockParsedInsights);

      const result = await generateArchitectureInsights(mockArchitectureData);

      expect(result).toEqual(mockParsedInsights);
      expect(mockParseResponse).toHaveBeenCalledWith(emptyResponse);
    });

    test('should handle special characters in file names', async () => {
      const mockArchitectureData = {
        files: ['src/@types/index.d.ts', 'src/utils.spec.ts', 'src/file[test].ts'],
        dependencies: ['@angular/core', 'lodash.debounce'],
        structure: { src: ['@types/index.d.ts'] }
      };
      const mockPrompt = 'Analyze architecture with special chars...';
      const mockAiResponse = 'Analysis complete';
      const mockParsedInsights = {
        patterns: ['TypeScript'],
        suggestions: ['Good type definitions'],
        complexity: 'low'
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateCompletion = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedInsights);

      const result = await generateArchitectureInsights(mockArchitectureData);

      expect(result).toEqual(mockParsedInsights);
    });

    test('should handle timeout or slow AI service response', async () => {
      const mockArchitectureData = {
        files: ['src/index.ts'],
        dependencies: ['express'],
        structure: { src: ['index.ts'] }
      };
      const mockPrompt = 'Analyze this architecture...';
      const mockAiResponse = 'Delayed analysis...';
      const mockParsedInsights = {
        patterns: ['REST API'],
        suggestions: ['Optimize performance'],
        complexity: 'medium'
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateCompletion = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockAiResponse), 100))
      );
      mockParseResponse.mockReturnValue(mockParsedInsights);

      const result = await generateArchitectureInsights(mockArchitectureData);

      expect(result).toEqual(mockParsedInsights);
    });
  });
});