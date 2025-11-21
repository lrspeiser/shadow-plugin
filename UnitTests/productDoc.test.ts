import { generateProductDocumentation } from '../productDoc';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');
const mockAiProvider = { generateCompletion: jest.fn() };
const mockBuildPrompt = jest.fn();
const mockParseResponse = jest.fn();
const mockAnalysisResults = { complexity: 5, dependencies: ['dep1'], issues: [] };

import { generateProductDocumentation } from '../productDoc';
import * as vscode from 'vscode';

jest.mock('vscode');

const mockAiProvider = {
  generateCompletion: jest.fn(),
  isAvailable: jest.fn().mockReturnValue(true)
};

const mockBuildPrompt = jest.fn();
const mockParseResponse = jest.fn();
const mockAnalysisResults = {
  complexity: 5,
  dependencies: ['module1', 'module2'],
  issues: [],
  codeStructure: {
    functions: ['func1', 'func2'],
    classes: ['Class1']
  }
};

jest.mock('../../../utils/aiProvider', () => ({
  aiProvider: mockAiProvider
}));

jest.mock('../../../utils/buildPrompt', () => ({
  buildPrompt: mockBuildPrompt
}));

jest.mock('../../../utils/parseResponse', () => ({
  parseResponse: mockParseResponse
}));

jest.mock('../../../analysis/analysisResults', () => ({
  analysisResults: mockAnalysisResults
}));

describe('generateProductDocumentation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildPrompt.mockReturnValue('Generated prompt for documentation');
    mockParseResponse.mockReturnValue({
      documentation: '# Product Documentation\n\nThis is the documentation.',
      sections: ['Overview', 'Features', 'Usage']
    });
    mockAiProvider.generateCompletion.mockResolvedValue({
      content: '# Product Documentation\n\nThis is generated documentation.',
      usage: { tokens: 500 }
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should successfully generate product documentation with valid inputs', async () => {
    const projectPath = '/test/project';
    const options = {
      includeArchitecture: true,
      includeFeatures: true,
      format: 'markdown'
    };

    const result = await generateProductDocumentation(projectPath, options);

    expect(mockBuildPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'product-documentation',
        projectPath,
        options
      })
    );
    expect(mockAiProvider.generateCompletion).toHaveBeenCalledWith(
      'Generated prompt for documentation'
    );
    expect(mockParseResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.any(String)
      })
    );
    expect(result).toBeDefined();
    expect(result.documentation).toContain('Product Documentation');
    expect(result.sections).toEqual(['Overview', 'Features', 'Usage']);
  });

  test('should handle AI provider errors gracefully', async () => {
    const projectPath = '/test/project';
    const options = { format: 'markdown' };
    const errorMessage = 'AI service unavailable';

    mockAiProvider.generateCompletion.mockRejectedValueOnce(
      new Error(errorMessage)
    );

    await expect(
      generateProductDocumentation(projectPath, options)
    ).rejects.toThrow(errorMessage);

    expect(mockBuildPrompt).toHaveBeenCalled();
    expect(mockAiProvider.generateCompletion).toHaveBeenCalled();
    expect(mockParseResponse).not.toHaveBeenCalled();
  });

  test('should handle empty or invalid project path', async () => {
    const emptyPath = '';
    const options = { format: 'markdown' };

    await expect(
      generateProductDocumentation(emptyPath, options)
    ).rejects.toThrow('Invalid project path');

    expect(mockBuildPrompt).not.toHaveBeenCalled();
    expect(mockAiProvider.generateCompletion).not.toHaveBeenCalled();
  });

  test('should generate documentation without optional features when not specified', async () => {
    const projectPath = '/test/project';
    const minimalOptions = {};

    mockParseResponse.mockReturnValueOnce({
      documentation: '# Basic Documentation',
      sections: ['Overview']
    });

    const result = await generateProductDocumentation(projectPath, minimalOptions);

    expect(mockBuildPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'product-documentation',
        projectPath,
        options: minimalOptions
      })
    );
    expect(result.documentation).toBe('# Basic Documentation');
    expect(result.sections).toEqual(['Overview']);
  });

  test('should handle parse response errors and retry or fallback', async () => {
    const projectPath = '/test/project';
    const options = { format: 'markdown' };

    mockParseResponse.mockImplementationOnce(() => {
      throw new Error('Failed to parse response');
    });

    await expect(
      generateProductDocumentation(projectPath, options)
    ).rejects.toThrow('Failed to parse response');

    expect(mockAiProvider.generateCompletion).toHaveBeenCalled();
    expect(mockParseResponse).toHaveBeenCalled();
  });

  test('should include analysis results in documentation generation', async () => {
    const projectPath = '/test/project';
    const options = {
      includeComplexity: true,
      includeDependencies: true
    };

    await generateProductDocumentation(projectPath, options);

    expect(mockBuildPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisResults: expect.objectContaining({
          complexity: 5,
          dependencies: expect.arrayContaining(['module1', 'module2'])
        })
      })
    );
  });

  test('should handle different output formats correctly', async () => {
    const projectPath = '/test/project';
    const htmlOptions = { format: 'html' };

    mockParseResponse.mockReturnValueOnce({
      documentation: '<html><body><h1>Product Documentation</h1></body></html>',
      sections: ['Overview'],
      format: 'html'
    });

    const result = await generateProductDocumentation(projectPath, htmlOptions);

    expect(result.documentation).toContain('<html>');
    expect(result.format).toBe('html');
  });

  test('should handle timeout scenarios when AI provider takes too long', async () => {
    const projectPath = '/test/project';
    const options = { format: 'markdown', timeout: 5000 };

    mockAiProvider.generateCompletion.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ content: 'delayed response' }), 10000);
      });
    });

    await expect(
      generateProductDocumentation(projectPath, options)
    ).rejects.toThrow('timeout');
  }, 10000);

  test('should validate and sanitize user input options', async () => {
    const projectPath = '/test/project';
    const maliciousOptions = {
      format: 'markdown',
      includeScripts: '<script>alert("xss")</script>',
      customTemplate: '../../../etc/passwd'
    };

    const result = await generateProductDocumentation(projectPath, maliciousOptions);

    expect(mockBuildPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.not.objectContaining({
          includeScripts: expect.stringContaining('<script>')
        })
      })
    );
    expect(result).toBeDefined();
  });
});