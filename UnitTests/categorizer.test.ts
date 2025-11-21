import { categorizeInsight } from '../categorizer';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('categorizeInsight', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    test('should categorize performance insight correctly', () => {
      const insight = {
        type: 'performance',
        message: 'Function execution time is high',
        severity: 'warning',
        location: { file: 'test.ts', line: 10 }
      };

      const result = categorizeInsight(insight);

      expect(result).toBeDefined();
      expect(result.category).toBe('performance');
      expect(result.insight).toEqual(insight);
    });

    test('should categorize security insight correctly', () => {
      const insight = {
        type: 'security',
        message: 'Potential security vulnerability detected',
        severity: 'error',
        location: { file: 'auth.ts', line: 25 }
      };

      const result = categorizeInsight(insight);

      expect(result).toBeDefined();
      expect(result.category).toBe('security');
      expect(result.insight).toEqual(insight);
    });

    test('should categorize code quality insight correctly', () => {
      const insight = {
        type: 'code-quality',
        message: 'Complex function detected',
        severity: 'info',
        location: { file: 'utils.ts', line: 50 }
      };

      const result = categorizeInsight(insight);

      expect(result).toBeDefined();
      expect(result.category).toBe('code-quality');
      expect(result.insight).toEqual(insight);
    });

    test('should categorize bug insight correctly', () => {
      const insight = {
        type: 'bug',
        message: 'Potential null pointer exception',
        severity: 'error',
        location: { file: 'index.ts', line: 100 }
      };

      const result = categorizeInsight(insight);

      expect(result).toBeDefined();
      expect(result.category).toBe('bug');
      expect(result.insight).toEqual(insight);
    });
  });

  describe('edge cases', () => {
    test('should handle insight with unknown type', () => {
      const insight = {
        type: 'unknown-type',
        message: 'Some message',
        severity: 'info',
        location: { file: 'test.ts', line: 1 }
      };

      const result = categorizeInsight(insight);

      expect(result).toBeDefined();
      expect(result.category).toBe('other');
    });

    test('should handle insight without type field', () => {
      const insight = {
        message: 'Message without type',
        severity: 'warning',
        location: { file: 'test.ts', line: 5 }
      };

      const result = categorizeInsight(insight);

      expect(result).toBeDefined();
      expect(result.category).toBe('other');
    });

    test('should handle insight with empty type', () => {
      const insight = {
        type: '',
        message: 'Empty type insight',
        severity: 'info',
        location: { file: 'test.ts', line: 15 }
      };

      const result = categorizeInsight(insight);

      expect(result).toBeDefined();
      expect(result.category).toBe('other');
    });

    test('should handle insight with null type', () => {
      const insight = {
        type: null,
        message: 'Null type insight',
        severity: 'warning',
        location: { file: 'test.ts', line: 20 }
      };

      const result = categorizeInsight(insight);

      expect(result).toBeDefined();
      expect(result.category).toBe('other');
    });

    test('should handle insight with mixed case type', () => {
      const insight = {
        type: 'PERFORMANCE',
        message: 'Mixed case type',
        severity: 'info',
        location: { file: 'test.ts', line: 30 }
      };

      const result = categorizeInsight(insight);

      expect(result).toBeDefined();
      expect(['performance', 'other']).toContain(result.category);
    });
  });

  describe('error handling', () => {
    test('should handle null insight', () => {
      expect(() => categorizeInsight(null as any)).toThrow();
    });

    test('should handle undefined insight', () => {
      expect(() => categorizeInsight(undefined as any)).toThrow();
    });

    test('should handle non-object insight', () => {
      expect(() => categorizeInsight('string' as any)).toThrow();
    });

    test('should handle empty object insight', () => {
      const result = categorizeInsight({} as any);

      expect(result).toBeDefined();
      expect(result.category).toBe('other');
    });
  });

  describe('severity levels', () => {
    test('should handle error severity', () => {
      const insight = {
        type: 'bug',
        message: 'Critical bug',
        severity: 'error',
        location: { file: 'test.ts', line: 40 }
      };

      const result = categorizeInsight(insight);

      expect(result.insight.severity).toBe('error');
    });

    test('should handle warning severity', () => {
      const insight = {
        type: 'performance',
        message: 'Performance warning',
        severity: 'warning',
        location: { file: 'test.ts', line: 45 }
      };

      const result = categorizeInsight(insight);

      expect(result.insight.severity).toBe('warning');
    });

    test('should handle info severity', () => {
      const insight = {
        type: 'code-quality',
        message: 'Code quality info',
        severity: 'info',
        location: { file: 'test.ts', line: 50 }
      };

      const result = categorizeInsight(insight);

      expect(result.insight.severity).toBe('info');
    });
  });
});