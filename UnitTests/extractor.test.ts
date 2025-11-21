import { extractFunctions } from '../extractor';
import * as ts from 'typescript';

describe('extractFunctions', () => {
  // Helper to create a TypeScript source file from code
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
      const code = `
        function myFunction() {
          return 42;
        }
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('myFunction');
    });

    test('should extract arrow function assigned to variable', () => {
      const code = `
        const myArrowFunc = () => {
          return 'hello';
        };
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('myArrowFunc');
    });

    test('should extract multiple functions', () => {
      const code = `
        function func1() { return 1; }
        const func2 = () => { return 2; };
        function func3() { return 3; }
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toHaveLength(3);
      expect(functions[0].name).toBe('func1');
      expect(functions[1].name).toBe('func2');
      expect(functions[2].name).toBe('func3');
    });

    test('should extract function with parameters', () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b;
        }
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('add');
      expect(functions[0].parameters).toBeDefined();
    });

    test('should extract async function', () => {
      const code = `
        async function fetchData() {
          return await Promise.resolve('data');
        }
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('fetchData');
      expect(functions[0].isAsync).toBe(true);
    });

    test('should extract exported functions', () => {
      const code = `
        export function exportedFunc() {
          return true;
        }
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('exportedFunc');
      expect(functions[0].isExported).toBe(true);
    });

    test('should extract class methods', () => {
      const code = `
        class MyClass {
          myMethod() {
            return 'method';
          }
        }
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions.length).toBeGreaterThanOrEqual(1);
      const method = functions.find(f => f.name === 'myMethod');
      expect(method).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty source file', () => {
      const code = '';
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toEqual([]);
    });

    test('should handle file with only comments', () => {
      const code = `
        // This is a comment
        /* Multi-line comment */
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toEqual([]);
    });

    test('should handle anonymous functions not assigned to variables', () => {
      const code = `
        setTimeout(function() {
          console.log('timeout');
        }, 1000);
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      // Anonymous functions should either be excluded or have generated names
      expect(functions).toBeDefined();
    });

    test('should handle nested functions', () => {
      const code = `
        function outerFunc() {
          function innerFunc() {
            return 'inner';
          }
          return innerFunc();
        }
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions.length).toBeGreaterThanOrEqual(1);
      expect(functions.some(f => f.name === 'outerFunc')).toBe(true);
    });

    test('should handle function expressions', () => {
      const code = `
        const myFunc = function namedFunc() {
          return 'named';
        };
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toMatch(/myFunc|namedFunc/);
    });

    test('should handle generator functions', () => {
      const code = `
        function* generatorFunc() {
          yield 1;
          yield 2;
        }
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('generatorFunc');
    });

    test('should handle constructor functions', () => {
      const code = `
        class MyClass {
          constructor(private value: number) {}
        }
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toBeDefined();
    });

    test('should extract function location information', () => {
      const code = `
function testFunc() {
  return 1;
}
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toHaveLength(1);
      expect(functions[0].line).toBeDefined();
      expect(functions[0].line).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed code gracefully', () => {
      const code = `
        function brokenFunc() {
          return
        // Missing closing brace
      `;
      const sourceFile = createSourceFile(code);
      
      expect(() => extractFunctions(sourceFile)).not.toThrow();
    });

    test('should handle null or undefined sourceFile', () => {
      expect(() => extractFunctions(null as any)).not.toThrow();
      expect(() => extractFunctions(undefined as any)).not.toThrow();
    });

    test('should handle very large files', () => {
      const largeFunctionCount = 1000;
      const code = Array.from({ length: largeFunctionCount }, (_, i) => 
        `function func${i}() { return ${i}; }`
      ).join('\n');
      
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions.length).toBe(largeFunctionCount);
    });

    test('should handle complex TypeScript syntax', () => {
      const code = `
        type MyType = { value: string };
        interface MyInterface { method(): void; }
        function typedFunc(param: MyType): MyInterface {
          return { method: () => {} };
        }
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('typedFunc');
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle mixed function types in single file', () => {
      const code = `
        function regularFunc() {}
        const arrowFunc = () => {};
        export async function asyncFunc() {}
        class MyClass {
          method() {}
          static staticMethod() {}
        }
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions.length).toBeGreaterThanOrEqual(3);
    });

    test('should extract decorators if present', () => {
      const code = `
        function decorator(target: any) {}
        
        class MyClass {
          @decorator
          decoratedMethod() {}
        }
      `;
      const sourceFile = createSourceFile(code);
      const functions = extractFunctions(sourceFile);
      
      expect(functions).toBeDefined();
      expect(functions.length).toBeGreaterThanOrEqual(1);
    });
  });
});