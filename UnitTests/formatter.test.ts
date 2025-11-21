import { formatInsightForDisplay } from '../formatter';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('formatInsightForDisplay', () => {
  describe('Happy Path', () => {
    test('should format a simple insight with markdown', () => {
      const insight = {
        title: 'Test Insight',
        description: 'This is a **bold** test',
        severity: 'info'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Test Insight');
    });

    test('should format insight with code blocks', () => {
      const insight = {
        title: 'Code Example',
        description: 'Here is code:\n```typescript\nconst x = 1;\n```',
        severity: 'warning'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
      expect(result).toContain('Code Example');
    });

    test('should format insight with lists', () => {
      const insight = {
        title: 'List Example',
        description: '- Item 1\n- Item 2\n- Item 3',
        severity: 'error'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
      expect(result).toContain('List Example');
    });

    test('should format insight with links', () => {
      const insight = {
        title: 'Link Example',
        description: 'Check [this link](https://example.com)',
        severity: 'info'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
      expect(result).toContain('Link Example');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty description', () => {
      const insight = {
        title: 'Empty Description',
        description: '',
        severity: 'info'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
      expect(result).toContain('Empty Description');
    });

    test('should handle missing title', () => {
      const insight = {
        title: '',
        description: 'No title here',
        severity: 'info'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
    });

    test('should handle special characters in description', () => {
      const insight = {
        title: 'Special Chars',
        description: 'Test <html> & "quotes" and \'apostrophes\'',
        severity: 'info'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
    });

    test('should handle very long description', () => {
      const insight = {
        title: 'Long Description',
        description: 'A'.repeat(10000),
        severity: 'info'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle multiline titles', () => {
      const insight = {
        title: 'Line 1\nLine 2',
        description: 'Test description',
        severity: 'warning'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
    });

    test('should handle insights with metadata', () => {
      const insight = {
        title: 'Metadata Test',
        description: 'Description',
        severity: 'error',
        timestamp: '2023-01-01',
        source: 'test-source'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle null insight', () => {
      expect(() => formatInsightForDisplay(null as any)).not.toThrow();
    });

    test('should handle undefined insight', () => {
      expect(() => formatInsightForDisplay(undefined as any)).not.toThrow();
    });

    test('should handle insight without required fields', () => {
      const insight = {} as any;
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
    });

    test('should handle insight with non-string values', () => {
      const insight = {
        title: 123 as any,
        description: true as any,
        severity: null as any
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
    });

    test('should handle malformed markdown', () => {
      const insight = {
        title: 'Malformed',
        description: '**unclosed bold and [unclosed link',
        severity: 'info'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
    });
  });

  describe('Severity Levels', () => {
    test('should format info severity', () => {
      const insight = {
        title: 'Info',
        description: 'Info message',
        severity: 'info'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
    });

    test('should format warning severity', () => {
      const insight = {
        title: 'Warning',
        description: 'Warning message',
        severity: 'warning'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
    });

    test('should format error severity', () => {
      const insight = {
        title: 'Error',
        description: 'Error message',
        severity: 'error'
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
    });

    test('should handle unknown severity', () => {
      const insight = {
        title: 'Unknown',
        description: 'Unknown severity',
        severity: 'critical' as any
      };
      const result = formatInsightForDisplay(insight);
      expect(result).toBeDefined();
    });
  });
});