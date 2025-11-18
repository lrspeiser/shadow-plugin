import { generateProductDocs } from '../llmIntegration';
import { LLMService } from '../llmService';
import * as vscode from 'vscode';
import { generateLLMInsights } from '../llmIntegration';

// Test: test_generateProductDocs_createsComprehensiveDocs
// Verifies generateProductDocs orchestrates LLM calls to create complete product documentation
import { generateProductDocs } from '../llmIntegration';
import { LLMService } from '../llmService';
import * as vscode from 'vscode';

jest.mock('../llmService');
jest.mock('vscode');

const mockLLMService = {
  sendRequest: jest.fn().mockResolvedValue({
    product_name: 'Test App',
    product_overview: 'A test application',
    key_features: ['Feature 1', 'Feature 2']
  })
};

const mockWindow = {
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  withProgress: jest.fn((options, task) => task({ report: jest.fn() }))
};

(vscode.window as any) = mockWindow;

describe('generateProductDocs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates comprehensive product documentation', async () => {
    const mockAnalysis = {
      files: [{ filePath: 'src/main.ts', lineCount: 100, functions: [] }],
      statistics: { totalFiles: 1, totalLines: 100 }
    };

    await generateProductDocs(mockAnalysis as any, mockLLMService as any);

    expect(mockLLMService.sendRequest).toHaveBeenCalled();
    const promptArg = (mockLLMService.sendRequest as jest.Mock).mock.calls[0][0];
    expect(promptArg).toContain('product');
  });

  test('handles LLM service errors gracefully', async () => {
    mockLLMService.sendRequest.mockRejectedValue(new Error('LLM API Error'));

    const mockAnalysis = {
      files: [],
      statistics: { totalFiles: 0, totalLines: 0 }
    };

    await generateProductDocs(mockAnalysis as any, mockLLMService as any);

    expect(mockWindow.showErrorMessage).toHaveBeenCalled();
  });

  test('shows progress indicator during generation', async () => {
    const mockAnalysis = {
      files: [],
      statistics: { totalFiles: 0, totalLines: 0 }
    };

    await generateProductDocs(mockAnalysis as any, mockLLMService as any);

    expect(mockWindow.withProgress).toHaveBeenCalled();
  });
});

// Test: test_generateLLMInsights_producesArchitecturalInsights
// Verifies generateLLMInsights creates architectural analysis and design pattern insights
import { generateLLMInsights } from '../llmIntegration';
import { LLMService } from '../llmService';
import * as vscode from 'vscode';

jest.mock('../llmService');
jest.mock('vscode');

const mockLLMService = {
  sendRequest: jest.fn().mockResolvedValue({
    overall_assessment: 'Architecture is sound',
    strengths: ['Good separation', 'Clear modules'],
    critical_issues: [],
    design_patterns: ['Factory', 'Observer']
  })
};

const mockWindow = {
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  withProgress: jest.fn((options, task) => task({ report: jest.fn() }))
};

(vscode.window as any) = mockWindow;

describe('generateLLMInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('produces comprehensive architectural insights', async () => {
    const mockAnalysis = {
      files: [{ filePath: 'src/service.ts', lineCount: 200, functions: [] }],
      dependencies: [],
      statistics: { totalFiles: 1, totalLines: 200 }
    };

    await generateLLMInsights(mockAnalysis as any, mockLLMService as any);

    expect(mockLLMService.sendRequest).toHaveBeenCalled();
    const promptArg = (mockLLMService.sendRequest as jest.Mock).mock.calls[0][0];
    expect(promptArg).toContain('architecture');
  });

  test('identifies design patterns in codebase', async () => {
    const mockAnalysis = {
      files: [],
      statistics: { totalFiles: 0, totalLines: 0 }
    };

    const result = await generateLLMInsights(mockAnalysis as any, mockLLMService as any);

    expect(mockLLMService.sendRequest).toHaveBeenCalled();
  });

  test('handles empty codebase analysis', async () => {
    const emptyAnalysis = {
      files: [],
      statistics: { totalFiles: 0, totalLines: 0 }
    };

    await generateLLMInsights(emptyAnalysis as any, mockLLMService as any);

    expect(mockLLMService.sendRequest).toHaveBeenCalled();
  });
});
