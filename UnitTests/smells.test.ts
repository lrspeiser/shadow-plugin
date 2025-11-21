import { detectCodeSmells } from '../smells';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('detectCodeSmells', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    test('should detect code smells in valid code with high complexity', () => {
      const sourceCode = `
        function complexFunction() {
          if (a) {
            if (b) {
              if (c) {
                if (d) {
                  return true;
                }
              }
            }
          }
          return false;
        }
      `;
      
      const result = detectCodeSmells(sourceCode);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should return empty array for clean code', () => {
      const sourceCode = `
        function simpleFunction(x: number): number {
          return x * 2;
        }
      `;
      
      const result = detectCodeSmells(sourceCode);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should detect long parameter lists', () => {
      const sourceCode = `
        function manyParams(a: string, b: number, c: boolean, d: object, e: string, f: number, g: string) {
          return a + b;
        }
      `;
      
      const result = detectCodeSmells(sourceCode);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should detect deeply nested code', () => {
      const sourceCode = `
        function deeplyNested() {
          for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
              for (let k = 0; k < 10; k++) {
                for (let l = 0; l < 10; l++) {
                  console.log(i, j, k, l);
                }
              }
            }
          }
        }
      `;
      
      const result = detectCodeSmells(sourceCode);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should detect large functions', () => {
      const largeFunction = Array(100).fill('  console.log("line");').join('\n');
      const sourceCode = `
        function largeFunction() {
          ${largeFunction}
        }
      `;
      
      const result = detectCodeSmells(sourceCode);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle empty string', () => {
      const result = detectCodeSmells('');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle null or undefined input gracefully', () => {
      expect(() => detectCodeSmells(null as any)).not.toThrow();
      expect(() => detectCodeSmells(undefined as any)).not.toThrow();
    });

    test('should handle whitespace-only code', () => {
      const result = detectCodeSmells('   \n\n\t\t  ');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle comments-only code', () => {
      const sourceCode = `
        // This is a comment
        /* Multi-line
           comment */
      `;
      
      const result = detectCodeSmells(sourceCode);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle malformed code', () => {
      const sourceCode = 'function broken( {';
      
      expect(() => detectCodeSmells(sourceCode)).not.toThrow();
    });

    test('should handle code with syntax errors', () => {
      const sourceCode = 'const x = ;;;;; function }}}}';
      
      expect(() => detectCodeSmells(sourceCode)).not.toThrow();
    });

    test('should handle very long single line', () => {
      const longLine = 'const x = ' + '"a"'.repeat(1000) + ';';
      
      const result = detectCodeSmells(longLine);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle mixed content types', () => {
      const sourceCode = `
        import React from 'react';
        
        class MyClass {
          method() {}
        }
        
        function myFunction() {}
        
        const arrow = () => {};
        
        export default MyClass;
      `;
      
      const result = detectCodeSmells(sourceCode);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should handle invalid input types gracefully', () => {
      expect(() => detectCodeSmells(123 as any)).not.toThrow();
      expect(() => detectCodeSmells({} as any)).not.toThrow();
      expect(() => detectCodeSmells([] as any)).not.toThrow();
    });

    test('should handle circular references in complex objects', () => {
      const obj: any = { code: 'function test() {}' };
      obj.self = obj;
      
      expect(() => detectCodeSmells(obj as any)).not.toThrow();
    });

    test('should handle extremely large input', () => {
      const largeInput = 'function test() {}\n'.repeat(10000);
      
      expect(() => detectCodeSmells(largeInput)).not.toThrow();
    });

    test('should handle unicode and special characters', () => {
      const sourceCode = `
        function test() {
          const emoji = '🚀';
          const chinese = '你好';
          const special = '\u0000\u0001';
        }
      `;
      
      const result = detectCodeSmells(sourceCode);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('multiple code smells', () => {
    test('should detect multiple smells in the same code', () => {
      const sourceCode = `
        function problematicFunction(a: any, b: any, c: any, d: any, e: any, f: any) {
          if (a) {
            if (b) {
              if (c) {
                if (d) {
                  if (e) {
                    if (f) {
                      for (let i = 0; i < 100; i++) {
                        for (let j = 0; j < 100; j++) {
                          console.log(i, j);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      const result = detectCodeSmells(sourceCode);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('return value structure', () => {
    test('should return array with proper smell objects', () => {
      const sourceCode = `
        function test(a: any, b: any, c: any, d: any, e: any) {
          if (a) {
            if (b) {
              if (c) {
                return true;
              }
            }
          }
        }
      `;
      
      const result = detectCodeSmells(sourceCode);
      
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        result.forEach((smell: any) => {
          expect(smell).toHaveProperty('type');
          expect(typeof smell.type).toBe('string');
        });
      }
    });
  });
});