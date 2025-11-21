import { buildPromptForAnalysis } from '../prompts';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('buildPromptForAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    test('should build prompt with valid analysis results', () => {
      const analysisResults = {
        complexity: 5,
        dependencies: ['moduleA', 'moduleB'],
        issues: ['High complexity detected'],
        metrics: {
          loc: 100,
          cyclomaticComplexity: 8
        }
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('complexity');
    });

    test('should handle minimal analysis results', () => {
      const analysisResults = {
        complexity: 1,
        dependencies: [],
        issues: []
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should include all analysis result properties in prompt', () => {
      const analysisResults = {
        complexity: 10,
        dependencies: ['dep1', 'dep2', 'dep3'],
        issues: ['issue1', 'issue2'],
        metrics: {
          loc: 500,
          cyclomaticComplexity: 15,
          maintainabilityIndex: 60
        },
        fileName: 'test.ts'
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).toContain('10');
      expect(result).toContain('dep1');
      expect(result).toContain('issue1');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty analysis results object', () => {
      const analysisResults = {};

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle null values in analysis results', () => {
      const analysisResults = {
        complexity: null,
        dependencies: null,
        issues: null
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).toBeDefined();
    });

    test('should handle undefined properties', () => {
      const analysisResults = {
        complexity: undefined,
        dependencies: undefined
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).toBeDefined();
    });

    test('should handle very large dependency arrays', () => {
      const largeDependencies = Array.from({ length: 1000 }, (_, i) => `dep${i}`);
      const analysisResults = {
        complexity: 3,
        dependencies: largeDependencies,
        issues: []
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle special characters in strings', () => {
      const analysisResults = {
        complexity: 5,
        dependencies: ['module-with-dashes', 'module_with_underscores'],
        issues: ['Issue with "quotes"', 'Issue with \\backslashes'],
        fileName: 'test-file.ts'
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle zero complexity', () => {
      const analysisResults = {
        complexity: 0,
        dependencies: [],
        issues: []
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).toBeDefined();
      expect(result).toContain('0');
    });

    test('should handle very long issue descriptions', () => {
      const longIssue = 'a'.repeat(10000);
      const analysisResults = {
        complexity: 5,
        dependencies: [],
        issues: [longIssue]
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid input type - null', () => {
      expect(() => {
        buildPromptForAnalysis(null as any);
      }).not.toThrow();
    });

    test('should handle invalid input type - undefined', () => {
      expect(() => {
        buildPromptForAnalysis(undefined as any);
      }).not.toThrow();
    });

    test('should handle invalid input type - string', () => {
      expect(() => {
        buildPromptForAnalysis('invalid' as any);
      }).not.toThrow();
    });

    test('should handle invalid input type - number', () => {
      expect(() => {
        buildPromptForAnalysis(123 as any);
      }).not.toThrow();
    });

    test('should handle circular references gracefully', () => {
      const analysisResults: any = {
        complexity: 5,
        dependencies: [],
        issues: []
      };
      analysisResults.circular = analysisResults;

      expect(() => {
        buildPromptForAnalysis(analysisResults);
      }).not.toThrow();
    });
  });

  describe('Template Integration', () => {
    test('should produce consistent output format', () => {
      const analysisResults = {
        complexity: 7,
        dependencies: ['dep1'],
        issues: ['issue1']
      };

      const result1 = buildPromptForAnalysis(analysisResults);
      const result2 = buildPromptForAnalysis(analysisResults);

      expect(result1).toBe(result2);
    });

    test('should format dependencies as a list or comma-separated', () => {
      const analysisResults = {
        complexity: 3,
        dependencies: ['dep1', 'dep2', 'dep3'],
        issues: []
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).toBeDefined();
      expect(result).toMatch(/dep1|dependencies/i);
    });

    test('should handle nested objects in metrics', () => {
      const analysisResults = {
        complexity: 5,
        dependencies: [],
        issues: [],
        metrics: {
          loc: 200,
          functions: {
            total: 10,
            complex: 3
          }
        }
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    test('should return non-empty string for valid input', () => {
      const analysisResults = {
        complexity: 5,
        dependencies: ['dep1'],
        issues: ['issue1']
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result.length).toBeGreaterThan(0);
      expect(result.trim()).not.toBe('');
    });

    test('should not contain undefined or null in output string', () => {
      const analysisResults = {
        complexity: 5,
        dependencies: ['dep1'],
        issues: ['issue1']
      };

      const result = buildPromptForAnalysis(analysisResults);

      expect(result).not.toContain('undefined');
      expect(result).not.toContain('null');
    });
  });
});