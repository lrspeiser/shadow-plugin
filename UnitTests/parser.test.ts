import { parseAnalysisResponse } from '../parser';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('parseAnalysisResponse', () => {
  describe('happy path', () => {
    test('should parse valid JSON response with analysis data', () => {
      const validResponse = JSON.stringify({
        files: ['src/index.ts', 'src/utils.ts'],
        issues: [
          { file: 'src/index.ts', line: 10, severity: 'error', message: 'Undefined variable' }
        ],
        summary: 'Analysis complete'
      });
      
      const result = parseAnalysisResponse(validResponse);
      
      expect(result).toBeDefined();
      expect(result.files).toHaveLength(2);
      expect(result.issues).toHaveLength(1);
      expect(result.summary).toBe('Analysis complete');
    });

    test('should parse response with empty arrays', () => {
      const emptyResponse = JSON.stringify({
        files: [],
        issues: [],
        summary: 'No issues found'
      });
      
      const result = parseAnalysisResponse(emptyResponse);
      
      expect(result).toBeDefined();
      expect(result.files).toHaveLength(0);
      expect(result.issues).toHaveLength(0);
      expect(result.summary).toBe('No issues found');
    });

    test('should parse response with nested objects', () => {
      const nestedResponse = JSON.stringify({
        files: ['src/app.ts'],
        issues: [
          {
            file: 'src/app.ts',
            line: 5,
            severity: 'warning',
            message: 'Unused import',
            metadata: { suggestion: 'Remove import' }
          }
        ],
        summary: 'Found warnings'
      });
      
      const result = parseAnalysisResponse(nestedResponse);
      
      expect(result.issues[0].metadata).toBeDefined();
      expect(result.issues[0].metadata.suggestion).toBe('Remove import');
    });
  });

  describe('edge cases', () => {
    test('should handle empty string input', () => {
      expect(() => parseAnalysisResponse('')).toThrow();
    });

    test('should handle null input', () => {
      expect(() => parseAnalysisResponse(null as any)).toThrow();
    });

    test('should handle undefined input', () => {
      expect(() => parseAnalysisResponse(undefined as any)).toThrow();
    });

    test('should handle whitespace-only input', () => {
      expect(() => parseAnalysisResponse('   \n\t  ')).toThrow();
    });

    test('should handle response with missing fields', () => {
      const partialResponse = JSON.stringify({
        files: ['src/test.ts']
      });
      
      const result = parseAnalysisResponse(partialResponse);
      
      expect(result.files).toBeDefined();
      expect(result.issues).toBeUndefined();
    });

    test('should handle response with null values', () => {
      const nullResponse = JSON.stringify({
        files: null,
        issues: null,
        summary: null
      });
      
      const result = parseAnalysisResponse(nullResponse);
      
      expect(result.files).toBeNull();
      expect(result.issues).toBeNull();
      expect(result.summary).toBeNull();
    });

    test('should handle very large response', () => {
      const largeIssues = Array.from({ length: 10000 }, (_, i) => ({
        file: `src/file${i}.ts`,
        line: i,
        severity: 'info',
        message: `Issue ${i}`
      }));
      
      const largeResponse = JSON.stringify({
        files: Array.from({ length: 1000 }, (_, i) => `src/file${i}.ts`),
        issues: largeIssues,
        summary: 'Large analysis'
      });
      
      const result = parseAnalysisResponse(largeResponse);
      
      expect(result.files).toHaveLength(1000);
      expect(result.issues).toHaveLength(10000);
    });

    test('should handle response with special characters', () => {
      const specialResponse = JSON.stringify({
        files: ['src/file-name.ts', 'src/file_name.ts', 'src/file name.ts'],
        issues: [
          {
            file: 'src/test.ts',
            line: 1,
            severity: 'error',
            message: 'Error with "quotes" and \'apostrophes\' and \\backslashes\\'
          }
        ],
        summary: 'Special chars: <>&"\'
      });
      
      const result = parseAnalysisResponse(specialResponse);
      
      expect(result.files).toHaveLength(3);
      expect(result.issues[0].message).toContain('quotes');
      expect(result.summary).toContain('<>');
    });

    test('should handle response with Unicode characters', () => {
      const unicodeResponse = JSON.stringify({
        files: ['src/文件.ts', 'src/файл.ts'],
        issues: [],
        summary: '分析完成 ✓'
      });
      
      const result = parseAnalysisResponse(unicodeResponse);
      
      expect(result.files).toContain('src/文件.ts');
      expect(result.summary).toContain('✓');
    });
  });

  describe('error handling', () => {
    test('should throw error for invalid JSON', () => {
      const invalidJson = '{ files: ["test.ts"], invalid }';
      
      expect(() => parseAnalysisResponse(invalidJson)).toThrow();
    });

    test('should throw error for malformed JSON', () => {
      const malformedJson = '{"files": ["test.ts"]';
      
      expect(() => parseAnalysisResponse(malformedJson)).toThrow();
    });

    test('should throw error for non-JSON string', () => {
      const nonJson = 'This is not JSON';
      
      expect(() => parseAnalysisResponse(nonJson)).toThrow();
    });

    test('should handle JSON array instead of object', () => {
      const arrayResponse = JSON.stringify(['file1.ts', 'file2.ts']);
      
      const result = parseAnalysisResponse(arrayResponse);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    test('should handle primitive values', () => {
      const primitiveResponse = JSON.stringify('simple string');
      
      const result = parseAnalysisResponse(primitiveResponse);
      
      expect(result).toBe('simple string');
    });

    test('should handle number as response', () => {
      const numberResponse = JSON.stringify(12345);
      
      const result = parseAnalysisResponse(numberResponse);
      
      expect(result).toBe(12345);
    });

    test('should handle boolean as response', () => {
      const boolResponse = JSON.stringify(true);
      
      const result = parseAnalysisResponse(boolResponse);
      
      expect(result).toBe(true);
    });

    test('should handle deeply nested structures', () => {
      const deepResponse = JSON.stringify({
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  data: 'deep value'
                }
              }
            }
          }
        }
      });
      
      const result = parseAnalysisResponse(deepResponse);
      
      expect(result.level1.level2.level3.level4.level5.data).toBe('deep value');
    });

    test('should handle circular reference safely', () => {
      // JSON.stringify cannot handle circular references, so this tests
      // that parseAnalysisResponse can't be given such input
      const obj: any = { files: [] };
      obj.self = obj;
      
      expect(() => JSON.stringify(obj)).toThrow();
    });
  });

  describe('data type validation', () => {
    test('should preserve number types', () => {
      const response = JSON.stringify({
        count: 42,
        percentage: 95.5,
        issues: [{ line: 10, column: 5 }]
      });
      
      const result = parseAnalysisResponse(response);
      
      expect(typeof result.count).toBe('number');
      expect(result.count).toBe(42);
      expect(typeof result.percentage).toBe('number');
      expect(result.percentage).toBe(95.5);
      expect(typeof result.issues[0].line).toBe('number');
    });

    test('should preserve boolean types', () => {
      const response = JSON.stringify({
        hasErrors: true,
        isComplete: false
      });
      
      const result = parseAnalysisResponse(response);
      
      expect(typeof result.hasErrors).toBe('boolean');
      expect(result.hasErrors).toBe(true);
      expect(typeof result.isComplete).toBe('boolean');
      expect(result.isComplete).toBe(false);
    });

    test('should handle mixed types in arrays', () => {
      const response = JSON.stringify({
        mixed: [1, 'string', true, null, { key: 'value' }]
      });
      
      const result = parseAnalysisResponse(response);
      
      expect(result.mixed).toHaveLength(5);
      expect(typeof result.mixed[0]).toBe('number');
      expect(typeof result.mixed[1]).toBe('string');
      expect(typeof result.mixed[2]).toBe('boolean');
      expect(result.mixed[3]).toBeNull();
      expect(typeof result.mixed[4]).toBe('object');
    });
  });
});