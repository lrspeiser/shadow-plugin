import { detectCodeSmells } from '../codeSmellDetector';
import * as complexityAnalyzer from '../complexityAnalyzer';
import * as dependencyAnalyzer from '../dependencyAnalyzer';
import * as patternMatcher from '../patternMatcher';

// Mocks
jest.mock('../complexityAnalyzer');
jest.mock('../dependencyAnalyzer');
jest.mock('../patternMatcher');

describe('detectCodeSmells', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    test('should detect long method code smell', () => {
      const mockCode = 'function longMethod() { /* ... */ }';
      const mockComplexity = { cyclomaticComplexity: 5, linesOfCode: 150 };
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue(mockComplexity);
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue([]);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      const result = detectCodeSmells(mockCode);

      expect(result).toBeDefined();
      expect(result.smells).toContainEqual(expect.objectContaining({
        type: 'LongMethod',
        severity: expect.any(String)
      }));
    });

    test('should detect high complexity code smell', () => {
      const mockCode = 'function complexMethod() { /* complex logic */ }';
      const mockComplexity = { cyclomaticComplexity: 25, linesOfCode: 50 };
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue(mockComplexity);
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue([]);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      const result = detectCodeSmells(mockCode);

      expect(result).toBeDefined();
      expect(result.smells).toContainEqual(expect.objectContaining({
        type: 'HighComplexity',
        severity: 'high'
      }));
    });

    test('should detect excessive dependencies code smell', () => {
      const mockCode = 'import A from "a"; import B from "b"; /* many imports */';
      const mockDependencies = Array(15).fill({ name: 'dep', type: 'import' });
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue({ cyclomaticComplexity: 5, linesOfCode: 50 });
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue(mockDependencies);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      const result = detectCodeSmells(mockCode);

      expect(result).toBeDefined();
      expect(result.smells).toContainEqual(expect.objectContaining({
        type: 'ExcessiveDependencies',
        severity: expect.any(String)
      }));
    });

    test('should detect multiple code smells in same code', () => {
      const mockCode = 'function problematicMethod() { /* issues */ }';
      const mockComplexity = { cyclomaticComplexity: 20, linesOfCode: 120 };
      const mockDependencies = Array(12).fill({ name: 'dep', type: 'import' });
      const mockPatterns = [{ pattern: 'GodClass', matches: 1 }];
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue(mockComplexity);
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue(mockDependencies);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue(mockPatterns);

      const result = detectCodeSmells(mockCode);

      expect(result).toBeDefined();
      expect(result.smells.length).toBeGreaterThan(1);
      expect(complexityAnalyzer.analyzeComplexity).toHaveBeenCalledWith(mockCode);
      expect(dependencyAnalyzer.analyzeDependencies).toHaveBeenCalledWith(mockCode);
      expect(patternMatcher.matchPatterns).toHaveBeenCalledWith(mockCode);
    });

    test('should return no smells for clean code', () => {
      const mockCode = 'function cleanMethod() { return true; }';
      const mockComplexity = { cyclomaticComplexity: 1, linesOfCode: 10 };
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue(mockComplexity);
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue([]);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      const result = detectCodeSmells(mockCode);

      expect(result).toBeDefined();
      expect(result.smells).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    test('should handle empty code input', () => {
      const mockCode = '';
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue({ cyclomaticComplexity: 0, linesOfCode: 0 });
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue([]);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      const result = detectCodeSmells(mockCode);

      expect(result).toBeDefined();
      expect(result.smells).toEqual([]);
    });

    test('should handle whitespace-only code input', () => {
      const mockCode = '   \n\t  \n  ';
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue({ cyclomaticComplexity: 0, linesOfCode: 0 });
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue([]);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      const result = detectCodeSmells(mockCode);

      expect(result).toBeDefined();
    });

    test('should handle very large code input', () => {
      const mockCode = 'function test() {\n'.repeat(1000) + '}';
      const mockComplexity = { cyclomaticComplexity: 50, linesOfCode: 1001 };
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue(mockComplexity);
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue([]);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      const result = detectCodeSmells(mockCode);

      expect(result).toBeDefined();
      expect(result.smells).toContainEqual(expect.objectContaining({
        type: expect.any(String)
      }));
    });

    test('should handle malformed code input', () => {
      const mockCode = 'function incomplete() { if (true';
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue({ cyclomaticComplexity: 2, linesOfCode: 1 });
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue([]);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      const result = detectCodeSmells(mockCode);

      expect(result).toBeDefined();
    });

    test('should handle code with special characters', () => {
      const mockCode = 'const str = "\\n\\t💩"';
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue({ cyclomaticComplexity: 1, linesOfCode: 1 });
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue([]);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      const result = detectCodeSmells(mockCode);

      expect(result).toBeDefined();
      expect(complexityAnalyzer.analyzeComplexity).toHaveBeenCalledWith(mockCode);
    });
  });

  describe('error handling', () => {
    test('should handle complexity analyzer error gracefully', () => {
      const mockCode = 'function test() {}';
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockImplementation(() => {
        throw new Error('Complexity analysis failed');
      });
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue([]);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      expect(() => detectCodeSmells(mockCode)).not.toThrow();
    });

    test('should handle dependency analyzer error gracefully', () => {
      const mockCode = 'function test() {}';
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue({ cyclomaticComplexity: 1, linesOfCode: 10 });
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockImplementation(() => {
        throw new Error('Dependency analysis failed');
      });
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      expect(() => detectCodeSmells(mockCode)).not.toThrow();
    });

    test('should handle pattern matcher error gracefully', () => {
      const mockCode = 'function test() {}';
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue({ cyclomaticComplexity: 1, linesOfCode: 10 });
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue([]);
      (patternMatcher as any).matchPatterns = jest.fn().mockImplementation(() => {
        throw new Error('Pattern matching failed');
      });

      expect(() => detectCodeSmells(mockCode)).not.toThrow();
    });

    test('should handle null return values from analyzers', () => {
      const mockCode = 'function test() {}';
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue(null);
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue(null);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue(null);

      const result = detectCodeSmells(mockCode);

      expect(result).toBeDefined();
    });

    test('should handle undefined return values from analyzers', () => {
      const mockCode = 'function test() {}';
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue(undefined);
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue(undefined);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue(undefined);

      const result = detectCodeSmells(mockCode);

      expect(result).toBeDefined();
    });
  });

  describe('severity classification', () => {
    test('should classify critical severity correctly', () => {
      const mockCode = 'function test() {}';
      const mockComplexity = { cyclomaticComplexity: 50, linesOfCode: 500 };
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue(mockComplexity);
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue([]);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      const result = detectCodeSmells(mockCode);

      expect(result.smells.some(smell => smell.severity === 'critical')).toBe(true);
    });

    test('should classify low severity correctly', () => {
      const mockCode = 'function test() {}';
      const mockComplexity = { cyclomaticComplexity: 6, linesOfCode: 55 };
      
      (complexityAnalyzer as any).analyzeComplexity = jest.fn().mockReturnValue(mockComplexity);
      (dependencyAnalyzer as any).analyzeDependencies = jest.fn().mockReturnValue([]);
      (patternMatcher as any).matchPatterns = jest.fn().mockReturnValue([]);

      const result = detectCodeSmells(mockCode);

      if (result.smells.length > 0) {
        expect(result.smells.some(smell => smell.severity === 'low' || smell.severity === 'medium')).toBe(true);
      }
    });
  });
});