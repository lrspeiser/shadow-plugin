import { generateProductDocumentation } from './documentationGenerator';
import { aiService } from './aiService';
import { buildPromptForAnalysis } from './promptBuilder';
import { parseAnalysisResponse } from './responseParser';

// Mocks
jest.mock('./aiService');
jest.mock('./promptBuilder');
jest.mock('./responseParser');

describe('generateProductDocumentation', () => {
  const mockAiService = aiService as jest.Mocked<typeof aiService>;
  const mockBuildPrompt = buildPromptForAnalysis as jest.MockedFunction<typeof buildPromptForAnalysis>;
  const mockParseResponse = parseAnalysisResponse as jest.MockedFunction<typeof parseAnalysisResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Happy Path', () => {
    test('should generate documentation successfully with valid input', async () => {
      const mockProductData = {
        name: 'TestProduct',
        version: '1.0.0',
        features: ['feature1', 'feature2']
      };
      const mockPrompt = 'Generate documentation for TestProduct';
      const mockAiResponse = 'AI generated documentation content';
      const mockParsedDoc = {
        title: 'TestProduct Documentation',
        content: 'Detailed documentation',
        sections: ['Introduction', 'Features']
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedDoc);

      const result = await generateProductDocumentation(mockProductData);

      expect(mockBuildPrompt).toHaveBeenCalledWith(mockProductData);
      expect(mockAiService.generateResponse).toHaveBeenCalledWith(mockPrompt);
      expect(mockParseResponse).toHaveBeenCalledWith(mockAiResponse);
      expect(result).toEqual(mockParsedDoc);
    });

    test('should handle complex product data with multiple sections', async () => {
      const complexProductData = {
        name: 'ComplexProduct',
        version: '2.5.1',
        features: ['auth', 'api', 'database', 'ui'],
        modules: ['core', 'plugins'],
        dependencies: ['react', 'node']
      };
      const mockPrompt = 'Complex prompt';
      const mockAiResponse = 'Complex AI response';
      const mockParsedDoc = {
        title: 'ComplexProduct Documentation',
        content: 'Complex documentation',
        sections: ['Overview', 'Architecture', 'API', 'Setup']
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedDoc);

      const result = await generateProductDocumentation(complexProductData);

      expect(result).toEqual(mockParsedDoc);
      expect(result.sections).toHaveLength(4);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty product data', async () => {
      const emptyProductData = {};
      const mockPrompt = 'Empty prompt';
      const mockAiResponse = 'Minimal response';
      const mockParsedDoc = {
        title: 'Untitled Documentation',
        content: '',
        sections: []
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedDoc);

      const result = await generateProductDocumentation(emptyProductData);

      expect(result).toEqual(mockParsedDoc);
      expect(mockBuildPrompt).toHaveBeenCalledWith(emptyProductData);
    });

    test('should handle null or undefined input', async () => {
      const mockPrompt = 'Default prompt';
      const mockAiResponse = 'Default response';
      const mockParsedDoc = {
        title: 'Default Documentation',
        content: 'No data provided',
        sections: []
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedDoc);

      const resultNull = await generateProductDocumentation(null as any);
      expect(resultNull).toEqual(mockParsedDoc);

      const resultUndefined = await generateProductDocumentation(undefined as any);
      expect(resultUndefined).toEqual(mockParsedDoc);
    });

    test('should handle very large product data', async () => {
      const largeProductData = {
        name: 'LargeProduct',
        features: new Array(1000).fill('feature'),
        description: 'x'.repeat(10000)
      };
      const mockPrompt = 'Large prompt';
      const mockAiResponse = 'Large response';
      const mockParsedDoc = {
        title: 'LargeProduct Documentation',
        content: 'Comprehensive documentation',
        sections: ['Section1', 'Section2']
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedDoc);

      const result = await generateProductDocumentation(largeProductData);

      expect(result).toEqual(mockParsedDoc);
      expect(mockBuildPrompt).toHaveBeenCalled();
    });

    test('should handle special characters in product data', async () => {
      const specialCharData = {
        name: 'Product<>&"\'\'',
        version: '1.0.0',
        description: 'Contains special chars: <>{}[]()'
      };
      const mockPrompt = 'Escaped prompt';
      const mockAiResponse = 'Escaped response';
      const mockParsedDoc = {
        title: 'Product<>&"\'\' Documentation',
        content: 'Special chars handled',
        sections: ['Overview']
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedDoc);

      const result = await generateProductDocumentation(specialCharData);

      expect(result).toEqual(mockParsedDoc);
    });
  });

  describe('Error Handling', () => {
    test('should handle AI service failure', async () => {
      const mockProductData = { name: 'TestProduct' };
      const mockPrompt = 'Test prompt';
      const errorMessage = 'AI service unavailable';

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockRejectedValue(new Error(errorMessage));

      await expect(generateProductDocumentation(mockProductData)).rejects.toThrow(errorMessage);
      expect(mockParseResponse).not.toHaveBeenCalled();
    });

    test('should handle prompt building failure', async () => {
      const mockProductData = { name: 'TestProduct' };
      const errorMessage = 'Failed to build prompt';

      mockBuildPrompt.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(generateProductDocumentation(mockProductData)).rejects.toThrow(errorMessage);
      expect(mockAiService.generateResponse).not.toHaveBeenCalled();
    });

    test('should handle response parsing failure', async () => {
      const mockProductData = { name: 'TestProduct' };
      const mockPrompt = 'Test prompt';
      const mockAiResponse = 'Invalid response format';
      const errorMessage = 'Failed to parse response';

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(generateProductDocumentation(mockProductData)).rejects.toThrow(errorMessage);
    });

    test('should handle network timeout', async () => {
      const mockProductData = { name: 'TestProduct' };
      const mockPrompt = 'Test prompt';
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockRejectedValue(timeoutError);

      await expect(generateProductDocumentation(mockProductData)).rejects.toThrow('Request timeout');
    });

    test('should handle invalid AI response format', async () => {
      const mockProductData = { name: 'TestProduct' };
      const mockPrompt = 'Test prompt';
      const invalidResponse = null;

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockResolvedValue(invalidResponse);
      mockParseResponse.mockReturnValue(null as any);

      const result = await generateProductDocumentation(mockProductData);

      expect(result).toBeNull();
    });

    test('should handle empty AI response', async () => {
      const mockProductData = { name: 'TestProduct' };
      const mockPrompt = 'Test prompt';
      const emptyResponse = '';
      const mockParsedDoc = {
        title: 'TestProduct Documentation',
        content: '',
        sections: []
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockResolvedValue(emptyResponse);
      mockParseResponse.mockReturnValue(mockParsedDoc);

      const result = await generateProductDocumentation(mockProductData);

      expect(result).toEqual(mockParsedDoc);
      expect(result.content).toBe('');
    });
  });

  describe('Integration Scenarios', () => {
    test('should maintain data flow through all dependencies', async () => {
      const mockProductData = { name: 'IntegrationTest', version: '1.0' };
      const mockPrompt = 'Integration prompt';
      const mockAiResponse = 'Integration AI response';
      const mockParsedDoc = {
        title: 'IntegrationTest Documentation',
        content: 'Integration content',
        sections: ['Section1']
      };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValue(mockParsedDoc);

      const result = await generateProductDocumentation(mockProductData);

      expect(mockBuildPrompt).toHaveBeenCalledTimes(1);
      expect(mockAiService.generateResponse).toHaveBeenCalledTimes(1);
      expect(mockParseResponse).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockParsedDoc);
    });

    test('should handle multiple concurrent calls', async () => {
      const mockProductData1 = { name: 'Product1' };
      const mockProductData2 = { name: 'Product2' };
      const mockPrompt = 'Concurrent prompt';
      const mockAiResponse = 'Concurrent response';
      const mockParsedDoc1 = { title: 'Product1 Doc', content: 'Doc1', sections: [] };
      const mockParsedDoc2 = { title: 'Product2 Doc', content: 'Doc2', sections: [] };

      mockBuildPrompt.mockReturnValue(mockPrompt);
      mockAiService.generateResponse = jest.fn().mockResolvedValue(mockAiResponse);
      mockParseResponse.mockReturnValueOnce(mockParsedDoc1).mockReturnValueOnce(mockParsedDoc2);

      const [result1, result2] = await Promise.all([
        generateProductDocumentation(mockProductData1),
        generateProductDocumentation(mockProductData2)
      ]);

      expect(result1).toEqual(mockParsedDoc1);
      expect(result2).toEqual(mockParsedDoc2);
      expect(mockBuildPrompt).toHaveBeenCalledTimes(2);
    });
  });
});