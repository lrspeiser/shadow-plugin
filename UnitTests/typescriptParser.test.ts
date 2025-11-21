import { parseTypeScriptFile } from '../typescriptParser';
import * as ts from 'typescript';

describe('parseTypeScriptFile', () => {
  test('should parse a simple TypeScript file with function declarations', () => {
    const sourceCode = `
      function add(a: number, b: number): number {
        return a + b;
      }
      
      function subtract(x: number, y: number): number {
        return x - y;
      }
    `;
    
    const result = parseTypeScriptFile(sourceCode, 'test.ts');
    
    expect(result).toBeDefined();
    expect(result.functions).toBeDefined();
    expect(result.functions.length).toBeGreaterThanOrEqual(2);
    expect(result.functions.some(f => f.name === 'add')).toBe(true);
    expect(result.functions.some(f => f.name === 'subtract')).toBe(true);
  });

  test('should parse TypeScript file with classes and methods', () => {
    const sourceCode = `
      class Calculator {
        private value: number = 0;
        
        add(n: number): void {
          this.value += n;
        }
        
        getValue(): number {
          return this.value;
        }
      }
      
      export class AdvancedCalculator extends Calculator {
        multiply(n: number): void {
          // implementation
        }
      }
    `;
    
    const result = parseTypeScriptFile(sourceCode, 'calculator.ts');
    
    expect(result).toBeDefined();
    expect(result.classes).toBeDefined();
    expect(result.classes.length).toBeGreaterThanOrEqual(2);
    expect(result.classes.some(c => c.name === 'Calculator')).toBe(true);
    expect(result.classes.some(c => c.name === 'AdvancedCalculator')).toBe(true);
    
    const calculatorClass = result.classes.find(c => c.name === 'Calculator');
    expect(calculatorClass?.methods).toBeDefined();
    expect(calculatorClass?.methods.length).toBeGreaterThanOrEqual(2);
  });

  test('should parse TypeScript file with interfaces and type aliases', () => {
    const sourceCode = `
      interface User {
        id: number;
        name: string;
        email: string;
      }
      
      type UserId = number;
      
      interface AdminUser extends User {
        role: string;
        permissions: string[];
      }
      
      type UserOrAdmin = User | AdminUser;
    `;
    
    const result = parseTypeScriptFile(sourceCode, 'types.ts');
    
    expect(result).toBeDefined();
    expect(result.interfaces).toBeDefined();
    expect(result.types).toBeDefined();
    expect(result.interfaces.length).toBeGreaterThanOrEqual(2);
    expect(result.types.length).toBeGreaterThanOrEqual(2);
  });

  test('should parse TypeScript file with arrow functions and variables', () => {
    const sourceCode = `
      const greet = (name: string): string => {
        return 'Hello, ' + name;
      };
      
      const multiply = (a: number, b: number) => a * b;
      
      export const API_URL = 'https://api.example.com';
      
      let counter: number = 0;
    `;
    
    const result = parseTypeScriptFile(sourceCode, 'utils.ts');
    
    expect(result).toBeDefined();
    expect(result.variables || result.constants).toBeDefined();
    expect(result.functions || result.arrowFunctions).toBeDefined();
  });

  test('should parse TypeScript file with imports and exports', () => {
    const sourceCode = `
      import { Request, Response } from 'express';
      import * as fs from 'fs';
      
      export function handleRequest(req: Request, res: Response): void {
        res.send('OK');
      }
      
      export default class RequestHandler {
        handle() {
          // implementation
        }
      }
    `;
    
    const result = parseTypeScriptFile(sourceCode, 'handler.ts');
    
    expect(result).toBeDefined();
    expect(result.imports).toBeDefined();
    expect(result.exports).toBeDefined();
    expect(result.imports.length).toBeGreaterThanOrEqual(2);
  });

  test('should handle empty TypeScript file', () => {
    const sourceCode = '';
    
    const result = parseTypeScriptFile(sourceCode, 'empty.ts');
    
    expect(result).toBeDefined();
    expect(result.functions || []).toHaveLength(0);
    expect(result.classes || []).toHaveLength(0);
  });

  test('should handle TypeScript file with only comments', () => {
    const sourceCode = `
      // This is a comment
      /* This is a block comment */
      /**
       * This is a JSDoc comment
       */
    `;
    
    const result = parseTypeScriptFile(sourceCode, 'comments.ts');
    
    expect(result).toBeDefined();
  });

  test('should handle TypeScript file with syntax errors gracefully', () => {
    const sourceCode = `
      function broken(
        // missing closing parenthesis and body
      
      class Invalid {
        method() {
          // missing closing brace
    `;
    
    const result = parseTypeScriptFile(sourceCode, 'broken.ts');
    
    expect(result).toBeDefined();
    expect(result.errors || result.parseErrors).toBeDefined();
  });

  test('should parse complex nested structures', () => {
    const sourceCode = `
      namespace MyNamespace {
        export class OuterClass {
          innerMethod(): void {
            function innerFunction() {
              const innerArrow = () => {
                return true;
              };
            }
          }
        }
        
        export interface Config {
          nested: {
            value: string;
          };
        }
      }
    `;
    
    const result = parseTypeScriptFile(sourceCode, 'nested.ts');
    
    expect(result).toBeDefined();
    expect(result.namespaces || result.classes).toBeDefined();
  });

  test('should extract function parameters and return types', () => {
    const sourceCode = `
      function process(
        id: number,
        data: string[],
        options?: { verbose: boolean }
      ): Promise<void> {
        return Promise.resolve();
      }
    `;
    
    const result = parseTypeScriptFile(sourceCode, 'params.ts');
    
    expect(result).toBeDefined();
    expect(result.functions).toBeDefined();
    expect(result.functions.length).toBeGreaterThan(0);
    
    const processFunc = result.functions.find(f => f.name === 'process');
    expect(processFunc).toBeDefined();
    expect(processFunc?.parameters).toBeDefined();
    expect(processFunc?.parameters.length).toBe(3);
    expect(processFunc?.returnType).toBeDefined();
  });

  test('should parse decorators in TypeScript', () => {
    const sourceCode = `
      function log(target: any, key: string) {
        // decorator implementation
      }
      
      class MyClass {
        @log
        myMethod(): void {
          console.log('method called');
        }
      }
    `;
    
    const result = parseTypeScriptFile(sourceCode, 'decorators.ts');
    
    expect(result).toBeDefined();
    expect(result.classes).toBeDefined();
    
    const myClass = result.classes?.find(c => c.name === 'MyClass');
    expect(myClass).toBeDefined();
  });

  test('should handle generic types', () => {
    const sourceCode = `
      function identity<T>(arg: T): T {
        return arg;
      }
      
      class GenericClass<T, U> {
        private data: T;
        
        process(input: U): T {
          return this.data;
        }
      }
      
      interface GenericInterface<T> {
        value: T;
        process(input: T): T;
      }
    `;
    
    const result = parseTypeScriptFile(sourceCode, 'generics.ts');
    
    expect(result).toBeDefined();
    expect(result.functions).toBeDefined();
    expect(result.classes).toBeDefined();
    expect(result.interfaces).toBeDefined();
    
    const identityFunc = result.functions?.find(f => f.name === 'identity');
    expect(identityFunc).toBeDefined();
    expect(identityFunc?.typeParameters || identityFunc?.generics).toBeDefined();
  });
});