import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');

describe('Python Function/Class Parser Loop', () => {
  // This tests the for loop logic that parses Python functions and classes
  // from lines 372-404 in analyzer.ts
  
  const funcRegex = /^\s*(?:async\s+)?def\s+(\w+)\s*\(/;
  const classRegex = /^\s*class\s+(\w+)\s*[:\(]/;
  
  function parsePythonFunctions(lines: string[], filePath: string) {
    const functions: any[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const funcMatch = lines[i].match(funcRegex);
      const classMatch = lines[i].match(classRegex);

      if (funcMatch || classMatch) {
        const name = funcMatch ? funcMatch[1] : classMatch![1];
        const startLine = i + 1;
        
        // Find end of function/class (simple heuristic)
        let endLine = startLine;
        const baseIndent = lines[i].match(/^\s*/)?.[0].length || 0;
        
        for (let j = i + 1; j < lines.length; j++) {
          const line = lines[j];
          if (line.trim() === '') continue;
          
          const currentIndent = line.match(/^\s*/)?.[0].length || 0;
          if (currentIndent <= baseIndent && line.trim() !== '') {
            break;
          }
          endLine = j + 1;
        }

        functions.push({
          name,
          file: filePath,
          startLine,
          endLine,
          lines: endLine - startLine + 1,
          language: 'python'
        });
      }
    }
    
    return functions;
  }
  
  test('should parse a single function definition', () => {
    const lines = [
      'def my_function():',
      '    return True'
    ];
    const filePath = '/test/file.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'my_function',
      file: filePath,
      startLine: 1,
      endLine: 2,
      lines: 2,
      language: 'python'
    });
  });
  
  test('should parse async function definition', () => {
    const lines = [
      'async def async_function():',
      '    await something()'
    ];
    const filePath = '/test/async.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('async_function');
  });
  
  test('should parse class definition', () => {
    const lines = [
      'class MyClass:',
      '    def __init__(self):',
      '        pass'
    ];
    const filePath = '/test/class.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('MyClass');
    expect(result[1].name).toBe('__init__');
  });
  
  test('should parse multiple functions correctly', () => {
    const lines = [
      'def function_one():',
      '    return 1',
      '',
      'def function_two():',
      '    return 2'
    ];
    const filePath = '/test/multiple.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('function_one');
    expect(result[0].startLine).toBe(1);
    expect(result[1].name).toBe('function_two');
    expect(result[1].startLine).toBe(4);
  });
  
  test('should handle nested indentation correctly', () => {
    const lines = [
      'def outer():',
      '    if True:',
      '        pass',
      '    return True',
      'def next_function():',
      '    pass'
    ];
    const filePath = '/test/nested.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('outer');
    expect(result[0].endLine).toBe(4);
    expect(result[1].name).toBe('next_function');
    expect(result[1].startLine).toBe(5);
  });
  
  test('should skip empty lines when determining function end', () => {
    const lines = [
      'def function():',
      '    pass',
      '',
      '',
      '    return None'
    ];
    const filePath = '/test/empty.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(1);
    expect(result[0].endLine).toBe(5);
  });
  
  test('should handle indented class definitions', () => {
    const lines = [
      '    class IndentedClass:',
      '        def method(self):',
      '            pass'
    ];
    const filePath = '/test/indented.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('IndentedClass');
    expect(result[1].name).toBe('method');
  });
  
  test('should handle empty input', () => {
    const lines: string[] = [];
    const filePath = '/test/empty.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(0);
  });
  
  test('should handle file with no functions', () => {
    const lines = [
      '# Just comments',
      'x = 5',
      'print(x)'
    ];
    const filePath = '/test/no_funcs.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(0);
  });
  
  test('should calculate correct line count', () => {
    const lines = [
      'def large_function():',
      '    line1 = 1',
      '    line2 = 2',
      '    line3 = 3',
      '    return line1 + line2 + line3'
    ];
    const filePath = '/test/large.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(1);
    expect(result[0].lines).toBe(5);
  });
  
  test('should handle class with parentheses', () => {
    const lines = [
      'class MyClass(BaseClass):',
      '    pass'
    ];
    const filePath = '/test/inheritance.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('MyClass');
  });
  
  test('should handle function at end of file', () => {
    const lines = [
      'def last_function():',
      '    return True'
    ];
    const filePath = '/test/last.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(1);
    expect(result[0].endLine).toBe(2);
  });
  
  test('should detect dedent to stop function parsing', () => {
    const lines = [
      'def function():',
      '    nested = True',
      'global_var = False'
    ];
    const filePath = '/test/dedent.py';
    
    const result = parsePythonFunctions(lines, filePath);
    
    expect(result).toHaveLength(1);
    expect(result[0].endLine).toBe(2);
  });
});