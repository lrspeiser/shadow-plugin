import * as fs from 'fs';
import * as path from 'path';

describe('findClosingBrace', () => {
  // Helper function to simulate the for loop logic
  function findClosingBrace(lines: string[], startIndex: number): number {
    let braceCount = 0;
    let foundFirst = false;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundFirst = true;
        } else if (char === '}') {
          braceCount--;
          if (foundFirst && braceCount === 0) {
            return i + 1;
          }
        }
      }
    }
    return -1;
  }

  test('should find closing brace on same line', () => {
    const lines = ['function test() { return true; }'];
    const result = findClosingBrace(lines, 0);
    expect(result).toBe(1);
  });

  test('should find closing brace across multiple lines', () => {
    const lines = [
      'function test() {',
      '  const x = 1;',
      '  return x;',
      '}'
    ];
    const result = findClosingBrace(lines, 0);
    expect(result).toBe(4);
  });

  test('should handle nested braces correctly', () => {
    const lines = [
      'function outer() {',
      '  if (true) {',
      '    return 1;',
      '  }',
      '}'
    ];
    const result = findClosingBrace(lines, 0);
    expect(result).toBe(5);
  });

  test('should handle multiple nested braces', () => {
    const lines = [
      'function test() {',
      '  const obj = {',
      '    nested: {',
      '      value: 1',
      '    }',
      '  };',
      '}'
    ];
    const result = findClosingBrace(lines, 0);
    expect(result).toBe(7);
  });

  test('should start from specified index', () => {
    const lines = [
      'function ignored() {',
      '}',
      'function target() {',
      '  return true;',
      '}'
    ];
    const result = findClosingBrace(lines, 2);
    expect(result).toBe(5);
  });

  test('should return -1 when no closing brace found', () => {
    const lines = [
      'function test() {',
      '  const x = 1;'
    ];
    const result = findClosingBrace(lines, 0);
    expect(result).toBe(-1);
  });

  test('should handle empty lines', () => {
    const lines = [
      'function test() {',
      '',
      '',
      '}'
    ];
    const result = findClosingBrace(lines, 0);
    expect(result).toBe(4);
  });

  test('should handle braces in comments (as actual braces)', () => {
    const lines = [
      'function test() {',
      '  // this is a comment with }',
      '  return true;',
      '}'
    ];
    const result = findClosingBrace(lines, 0);
    expect(result).toBe(2);
  });

  test('should handle multiple braces on same line', () => {
    const lines = [
      'function test() { if (true) { return 1; } }'
    ];
    const result = findClosingBrace(lines, 0);
    expect(result).toBe(1);
  });

  test('should not match closing brace before opening brace', () => {
    const lines = [
      '}',
      'function test() {',
      '}'
    ];
    const result = findClosingBrace(lines, 0);
    expect(result).toBe(-1);
  });

  test('should handle array with no lines after startIndex', () => {
    const lines = ['function test() {}'];
    const result = findClosingBrace(lines, 1);
    expect(result).toBe(-1);
  });

  test('should handle complex nested structures', () => {
    const lines = [
      'class Test {',
      '  method() {',
      '    const arr = [{ x: 1 }];',
      '    if (arr.length > 0) {',
      '      return arr[0];',
      '    }',
      '  }',
      '}'
    ];
    const result = findClosingBrace(lines, 0);
    expect(result).toBe(8);
  });

  test('should handle line with only braces', () => {
    const lines = [
      '{',
      '}'
    ];
    const result = findClosingBrace(lines, 0);
    expect(result).toBe(2);
  });

  test('should handle startIndex at line with opening brace', () => {
    const lines = [
      'const x = 1;',
      '{',
      '  const y = 2;',
      '}'
    ];
    const result = findClosingBrace(lines, 1);
    expect(result).toBe(4);
  });
});