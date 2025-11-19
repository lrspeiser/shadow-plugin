import { EnhancedAnalyzer } from '../analysis/enhancedAnalyzer';
import * as fs from 'fs';

// Test: test_analyzeFile_parses_typescript
// Verifies analyzeFile correctly parses TypeScript files and extracts metrics
import { EnhancedAnalyzer } from '../analysis/enhancedAnalyzer';
import * as fs from 'fs';

jest.mock('fs');

describe('EnhancedAnalyzer.analyzeFile', () => {
  let analyzer: EnhancedAnalyzer;
  const mockFs = fs as jest.Mocked;

  beforeEach(() => {
    jest.clearAllMocks();
    analyzer = new EnhancedAnalyzer();
  });

  it('should parse valid TypeScript file', () => {
    const validCode = `
      function testFunction() {
        return 42;
      }
      export { testFunction };
    `;
    mockFs.readFileSync.mockReturnValue(validCode);

    const result = analyzer.analyzeFile('test.ts');

    expect(result).toHaveProperty('functions');
    expect(result.functions).toHaveLength(1);
  });

  it('should include function count in result', () => {
    const code = `
      function fn1() {}
      function fn2() {}
      const fn3 = () => {};
    `;
    mockFs.readFileSync.mockReturnValue(code);

    const result = analyzer.analyzeFile('test.ts');

    expect(result.functions.length).toBeGreaterThanOrEqual(2);
  });

  it('should include complexity metrics', () => {
    const complexCode = `
      function complex(x: number) {
        if (x > 0) {
          for (let i = 0; i  {
    const invalidCode = 'function invalid( {';
    mockFs.readFileSync.mockReturnValue(invalidCode);

    expect(() => analyzer.analyzeFile('test.ts')).toThrow();
  });

  it('should handle empty files', () => {
    mockFs.readFileSync.mockReturnValue('');

    const result = analyzer.analyzeFile('test.ts');

    expect(result.functions).toHaveLength(0);
  });
});

// Test: test_detectPatterns_identifies_design_patterns
// Verifies detectPatterns correctly identifies common design patterns in code
import { EnhancedAnalyzer } from '../analysis/enhancedAnalyzer';

describe('EnhancedAnalyzer.detectPatterns', () => {
  let analyzer: EnhancedAnalyzer;

  beforeEach(() => {
    analyzer = new EnhancedAnalyzer();
  });

  it('should identify singleton pattern', () => {
    const singletonCode = `
      class Singleton {
        private static instance: Singleton;
        private constructor() {}
        static getInstance(): Singleton {
          if (!Singleton.instance) {
            Singleton.instance = new Singleton();
          }
          return Singleton.instance;
        }
      }
    `;

    const patterns = analyzer.detectPatterns(singletonCode);

    expect(patterns).toContain('singleton');
  });

  it('should identify factory pattern', () => {
    const factoryCode = `
      class Factory {
        static create(type: string) {
          if (type === 'A') return new ClassA();
          if (type === 'B') return new ClassB();
        }
      }
    `;

    const patterns = analyzer.detectPatterns(factoryCode);

    expect(patterns).toContain('factory');
  });

  it('should return empty array for no patterns', () => {
    const simpleCode = `
      function simpleFunction() {
        return 42;
      }
    `;

    const patterns = analyzer.detectPatterns(simpleCode);

    expect(patterns).toHaveLength(0);
  });
});
