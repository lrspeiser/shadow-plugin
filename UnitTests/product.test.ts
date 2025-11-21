import { generateProductDocumentation } from '../product';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');
const mockAIProvider = { generateText: jest.fn(), isAvailable: jest.fn() };
const mockAnalysisResults = { complexity: 'high', dependencies: [], functions: [], classes: [] };
const mockMarkdownFormatter = { format: jest.fn(), toMarkdown: jest.fn() };

describe('generateProductDocumentation', () => {
  let mockAIProvider: any;
  let mockAnalysisResults: any;
  let mockMarkdownFormatter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAIProvider = {
      generateText: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true)
    };
    mockAnalysisResults = {
      complexity: 'high',
      dependencies: ['dependency1', 'dependency2'],
      functions: [{ name: 'testFunc', complexity: 5 }],
      classes: [{ name: 'TestClass', methods: [] }],
      overview: 'Test overview'
    };
    mockMarkdownFormatter = {
      format: jest.fn().mockImplementation((text) => text),
      toMarkdown: jest.fn().mockImplementation((data) => `# ${data.title}\n${data.content}`)
    };
  });

  describe('Happy Path', () => {
    test('should generate complete product documentation with valid inputs', async () => {
      const expectedDocumentation = '# Product Documentation\nThis is the generated content';
      mockAIProvider.generateText.mockResolvedValue('This is the generated content');
      mockMarkdownFormatter.toMarkdown.mockReturnValue(expectedDocumentation);

      const result = await generateProductDocumentation(
        mockAnalysisResults,
        mockAIProvider,
        mockMarkdownFormatter
      );

      expect(result).toBe(expectedDocumentation);
      expect(mockAIProvider.generateText).toHaveBeenCalledTimes(1);
      expect(mockMarkdownFormatter.toMarkdown).toHaveBeenCalledTimes(1);
    });

    test('should include all sections when generating documentation', async () => {
      const sections = ['overview', 'architecture', 'dependencies', 'complexity'];
      mockAIProvider.generateText.mockResolvedValue('Generated section content');
      
      await generateProductDocumentation(
        mockAnalysisResults,
        mockAIProvider,
        mockMarkdownFormatter
      );

      const formatterCall = mockMarkdownFormatter.toMarkdown.mock.calls[0][0];
      expect(formatterCall).toBeDefined();
    });

    test('should handle analysis results with minimal data', async () => {
      const minimalResults = {
        complexity: 'low',
        dependencies: [],
        functions: [],
        classes: []
      };
      mockAIProvider.generateText.mockResolvedValue('Minimal documentation');

      const result = await generateProductDocumentation(
        minimalResults,
        mockAIProvider,
        mockMarkdownFormatter
      );

      expect(result).toBeDefined();
      expect(mockAIProvider.generateText).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty analysis results', async () => {
      const emptyResults = {};
      mockAIProvider.generateText.mockResolvedValue('Empty documentation');

      const result = await generateProductDocumentation(
        emptyResults,
        mockAIProvider,
        mockMarkdownFormatter
      );

      expect(result).toBeDefined();
    });

    test('should handle null or undefined dependencies', async () => {
      const resultsWithNullDeps = {
        ...mockAnalysisResults,
        dependencies: null
      };
      mockAIProvider.generateText.mockResolvedValue('Documentation');

      const result = await generateProductDocumentation(
        resultsWithNullDeps,
        mockAIProvider,
        mockMarkdownFormatter
      );

      expect(result).toBeDefined();
    });

    test('should handle very large analysis results', async () => {
      const largeResults = {
        ...mockAnalysisResults,
        functions: Array.from({ length: 1000 }, (_, i) => ({
          name: `func${i}`,
          complexity: i % 10
        })),
        dependencies: Array.from({ length: 500 }, (_, i) => `dep${i}`)
      };
      mockAIProvider.generateText.mockResolvedValue('Large documentation');

      const result = await generateProductDocumentation(
        largeResults,
        mockAIProvider,
        mockMarkdownFormatter
      );

      expect(result).toBeDefined();
      expect(mockAIProvider.generateText).toHaveBeenCalled();
    });

    test('should handle special characters in analysis data', async () => {
      const specialCharResults = {
        ...mockAnalysisResults,
        overview: 'Test with <html> & "quotes" and \\backslashes',
        functions: [{ name: 'func<T>', complexity: 5 }]
      };
      mockAIProvider.generateText.mockResolvedValue('Escaped documentation');

      const result = await generateProductDocumentation(
        specialCharResults,
        mockAIProvider,
        mockMarkdownFormatter
      );

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle AI provider failure gracefully', async () => {
      mockAIProvider.generateText.mockRejectedValue(new Error('AI service unavailable'));

      await expect(
        generateProductDocumentation(
          mockAnalysisResults,
          mockAIProvider,
          mockMarkdownFormatter
        )
      ).rejects.toThrow('AI service unavailable');
    });

    test('should handle markdown formatter failure', async () => {
      mockAIProvider.generateText.mockResolvedValue('Content');
      mockMarkdownFormatter.toMarkdown.mockImplementation(() => {
        throw new Error('Markdown formatting failed');
      });

      await expect(
        generateProductDocumentation(
          mockAnalysisResults,
          mockAIProvider,
          mockMarkdownFormatter
        )
      ).rejects.toThrow('Markdown formatting failed');
    });

    test('should handle AI provider unavailability', async () => {
      mockAIProvider.isAvailable.mockReturnValue(false);

      await expect(
        generateProductDocumentation(
          mockAnalysisResults,
          mockAIProvider,
          mockMarkdownFormatter
        )
      ).rejects.toThrow();
    });

    test('should handle timeout during AI generation', async () => {
      mockAIProvider.generateText.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(
        generateProductDocumentation(
          mockAnalysisResults,
          mockAIProvider,
          mockMarkdownFormatter
        )
      ).rejects.toThrow('Timeout');
    }, 10000);

    test('should handle invalid analysis results type', async () => {
      const invalidResults = 'not an object';
      mockAIProvider.generateText.mockResolvedValue('Content');

      await expect(
        generateProductDocumentation(
          invalidResults as any,
          mockAIProvider,
          mockMarkdownFormatter
        )
      ).rejects.toThrow();
    });

    test('should handle missing required parameters', async () => {
      await expect(
        generateProductDocumentation(null as any, null as any, null as any)
      ).rejects.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    test('should generate documentation with multiple AI calls', async () => {
      mockAIProvider.generateText
        .mockResolvedValueOnce('Overview section')
        .mockResolvedValueOnce('Details section')
        .mockResolvedValueOnce('Summary section');

      await generateProductDocumentation(
        mockAnalysisResults,
        mockAIProvider,
        mockMarkdownFormatter
      );

      expect(mockAIProvider.generateText.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    test('should properly format complex nested structures', async () => {
      const complexResults = {
        ...mockAnalysisResults,
        classes: [
          {
            name: 'ComplexClass',
            methods: [
              { name: 'method1', complexity: 10 },
              { name: 'method2', complexity: 15 }
            ],
            properties: ['prop1', 'prop2']
          }
        ]
      };
      mockAIProvider.generateText.mockResolvedValue('Complex documentation');

      const result = await generateProductDocumentation(
        complexResults,
        mockAIProvider,
        mockMarkdownFormatter
      );

      expect(result).toBeDefined();
    });
  });
});