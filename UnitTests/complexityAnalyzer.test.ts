import { calculateComplexity } from '../complexityAnalyzer';
import * as ts from 'typescript';

describe('calculateComplexity', () => {
  const createSourceFile = (code: string): ts.SourceFile => {
    return ts.createSourceFile(
      'test.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );
  };

  describe('happy path', () => {
    test('should calculate complexity for simple function', () => {
      const code = `function simple() { return true; }`;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(1);
    });

    test('should calculate higher complexity for function with if statements', () => {
      const code = `
        function withConditions(x: number) {
          if (x > 0) {
            return 'positive';
          } else if (x < 0) {
            return 'negative';
          } else {
            return 'zero';
          }
        }
      `;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(1);
    });

    test('should calculate complexity for function with loops', () => {
      const code = `
        function withLoops(arr: number[]) {
          for (let i = 0; i < arr.length; i++) {
            if (arr[i] > 0) {
              return true;
            }
          }
          return false;
        }
      `;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(1);
    });

    test('should calculate complexity for function with switch statement', () => {
      const code = `
        function withSwitch(val: string) {
          switch(val) {
            case 'a': return 1;
            case 'b': return 2;
            case 'c': return 3;
            default: return 0;
          }
        }
      `;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(1);
    });

    test('should handle nested functions', () => {
      const code = `
        function outer(x: number) {
          function inner(y: number) {
            if (y > 0) return true;
            return false;
          }
          if (x > 0) return inner(x);
          return false;
        }
      `;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(1);
    });
  });

  describe('edge cases', () => {
    test('should handle empty file', () => {
      const code = ``;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });

    test('should handle file with only comments', () => {
      const code = `// This is a comment\n/* Another comment */`;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });

    test('should handle file with multiple functions', () => {
      const code = `
        function first() { return 1; }
        function second(x: number) {
          if (x > 0) return true;
          return false;
        }
        function third() { return 3; }
      `;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(result).toBeGreaterThanOrEqual(1);
    });

    test('should handle class methods', () => {
      const code = `
        class MyClass {
          method1() { return 1; }
          method2(x: number) {
            if (x > 0) return true;
            return false;
          }
        }
      `;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(result).toBeGreaterThanOrEqual(1);
    });

    test('should handle arrow functions', () => {
      const code = `
        const arrow1 = () => true;
        const arrow2 = (x: number) => x > 0 ? 'positive' : 'negative';
        const arrow3 = (arr: number[]) => {
          for (let i = 0; i < arr.length; i++) {
            if (arr[i] > 0) return true;
          }
          return false;
        };
      `;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(result).toBeGreaterThanOrEqual(1);
    });

    test('should handle logical operators', () => {
      const code = `
        function withLogical(x: number, y: number) {
          return x > 0 && y > 0 || x < 0 && y < 0;
        }
      `;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(1);
    });

    test('should handle try-catch blocks', () => {
      const code = `
        function withTryCatch() {
          try {
            return doSomething();
          } catch (e) {
            return null;
          }
        }
      `;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(result).toBeGreaterThanOrEqual(1);
    });

    test('should handle ternary operators', () => {
      const code = `
        function withTernary(x: number) {
          return x > 0 ? 'positive' : x < 0 ? 'negative' : 'zero';
        }
      `;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(1);
    });
  });

  describe('complex scenarios', () => {
    test('should handle highly complex function', () => {
      const code = `
        function complex(x: number, y: number, z: number) {
          if (x > 0) {
            for (let i = 0; i < x; i++) {
              if (y > 0) {
                while (z > 0) {
                  if (i === z) return true;
                  z--;
                }
              } else if (y < 0) {
                switch(i) {
                  case 0: return false;
                  case 1: return true;
                  default: break;
                }
              }
            }
          } else if (x < 0) {
            return y > 0 && z > 0 || y < 0 && z < 0;
          }
          return false;
        }
      `;
      const sourceFile = createSourceFile(code);
      const result = calculateComplexity(sourceFile);
      
      expect(result).toBeDefined();
      expect(result).toBeGreaterThan(5);
    });
  });
});