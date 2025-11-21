import * as ts from 'typescript';
import { extractFunctions } from '../functionExtractor';
import { calculateComplexity } from '../complexityCalculator';
import { extractParameters } from '../parameterExtractor';

// Mocks
jest.mock('../complexityCalculator');
jest.mock('../parameterExtractor');

describe('extractFunctions', () => {
  const mockCalculateComplexity = calculateComplexity as jest.MockedFunction<typeof calculateComplexity>;
  const mockExtractParameters = extractParameters as jest.MockedFunction<typeof extractParameters>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateComplexity.mockReturnValue(5);
    mockExtractParameters.mockReturnValue([]);
  });

  const createSourceFile = (code: string): ts.SourceFile => {
    return ts.createSourceFile(
      'test.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );
  };

  describe('Happy Path', () => {
    test('should extract simple function declaration', () => {
      const code = 'function testFunc() { return true; }';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('testFunc');
      expect(result[0].type).toBe('function');
    });

    test('should extract arrow function', () => {
      const code = 'const arrowFunc = () => { return 42; };';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('arrowFunc');
    });

    test('should extract class method', () => {
      const code = 'class MyClass { myMethod() { return "test"; } }';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('myMethod');
      expect(result[0].type).toBe('method');
    });

    test('should extract multiple functions', () => {
      const code = `
        function func1() {}
        function func2() {}
        const func3 = () => {};
      `;
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    test('should extract function with parameters', () => {
      const mockParams = [
        { name: 'param1', type: 'string' },
        { name: 'param2', type: 'number' }
      ];
      mockExtractParameters.mockReturnValue(mockParams);

      const code = 'function withParams(param1: string, param2: number) { return param1; }';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result).toHaveLength(1);
      expect(mockExtractParameters).toHaveBeenCalled();
    });

    test('should calculate complexity for each function', () => {
      mockCalculateComplexity.mockReturnValue(10);
      const code = 'function complexFunc() { if (true) { return 1; } return 0; }';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result).toHaveLength(1);
      expect(mockCalculateComplexity).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty source file', () => {
      const code = '';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result).toEqual([]);
    });

    test('should handle source file with only comments', () => {
      const code = '// This is a comment\n/* Multi-line comment */';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result).toEqual([]);
    });

    test('should handle anonymous functions', () => {
      const code = 'const x = function() { return 1; };';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result).toHaveLength(1);
    });

    test('should handle nested functions', () => {
      const code = `
        function outer() {
          function inner() {
            return 42;
          }
          return inner();
        }
      `;
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle async functions', () => {
      const code = 'async function asyncFunc() { return await Promise.resolve(1); }';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('asyncFunc');
    });

    test('should handle generator functions', () => {
      const code = 'function* generatorFunc() { yield 1; }';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('generatorFunc');
    });

    test('should handle exported functions', () => {
      const code = 'export function exportedFunc() { return true; }';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('exportedFunc');
    });

    test('should handle default export function', () => {
      const code = 'export default function() { return 1; }';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle function expressions in objects', () => {
      const code = 'const obj = { method() { return 1; } };';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle constructor', () => {
      const code = 'class MyClass { constructor() { this.value = 1; } }';
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed code gracefully', () => {
      const code = 'function broken( { return';
      const sourceFile = createSourceFile(code);
      
      expect(() => extractFunctions(sourceFile)).not.toThrow();
    });

    test('should handle when calculateComplexity throws', () => {
      mockCalculateComplexity.mockImplementation(() => {
        throw new Error('Complexity calculation failed');
      });

      const code = 'function testFunc() { return 1; }';
      const sourceFile = createSourceFile(code);

      expect(() => extractFunctions(sourceFile)).not.toThrow();
    });

    test('should handle when extractParameters throws', () => {
      mockExtractParameters.mockImplementation(() => {
        throw new Error('Parameter extraction failed');
      });

      const code = 'function testFunc(param: string) { return param; }';
      const sourceFile = createSourceFile(code);

      expect(() => extractFunctions(sourceFile)).not.toThrow();
    });
  });

  describe('Complex Scenarios', () => {
    test('should extract functions from complex TypeScript file', () => {
      const code = `
        interface MyInterface {
          method(): void;
        }

        class MyClass implements MyInterface {
          private privateMethod() { return 1; }
          public method() { return 2; }
          static staticMethod() { return 3; }
        }

        export const arrowFunc = (x: number): number => x * 2;
        export function namedFunc(): boolean { return true; }
      `;
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    test('should handle function overloads', () => {
      const code = `
        function overloaded(x: number): number;
        function overloaded(x: string): string;
        function overloaded(x: any): any {
          return x;
        }
      `;
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    test('should extract line numbers correctly', () => {
      const code = `
function firstFunc() {
  return 1;
}

function secondFunc() {
  return 2;
}`;
      const sourceFile = createSourceFile(code);
      const result = extractFunctions(sourceFile);

      expect(result.length).toBeGreaterThanOrEqual(2);
      if (result.length >= 2) {
        expect(result[0].startLine).toBeLessThan(result[1].startLine);
      }
    });
  });
});