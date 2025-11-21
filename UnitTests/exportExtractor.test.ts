import { extractExports } from '../exportExtractor';
import * as astParser from '../astParser';

// Mocks
jest.mock('../astParser');

import { extractExports } from '../exportExtractor';
import * as astParser from '../astParser';

jest.mock('../astParser');

const mockAstParser = astParser as jest.Mocked<typeof astParser>;

describe('extractExports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should extract named exports from valid TypeScript code', () => {
    const sourceCode = `
      export const foo = 'bar';
      export function myFunction() {}
      export class MyClass {}
    `;
    
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'ExportNamedDeclaration',
          declaration: {
            type: 'VariableDeclaration',
            declarations: [{ id: { name: 'foo' } }]
          }
        },
        {
          type: 'ExportNamedDeclaration',
          declaration: {
            type: 'FunctionDeclaration',
            id: { name: 'myFunction' }
          }
        },
        {
          type: 'ExportNamedDeclaration',
          declaration: {
            type: 'ClassDeclaration',
            id: { name: 'MyClass' }
          }
        }
      ]
    };

    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = extractExports(sourceCode);

    expect(result).toEqual(['foo', 'myFunction', 'MyClass']);
    expect(mockAstParser.parse).toHaveBeenCalledWith(sourceCode);
  });

  test('should extract default export from TypeScript code', () => {
    const sourceCode = `
      export default function defaultFunction() {}
    `;
    
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'ExportDefaultDeclaration',
          declaration: {
            type: 'FunctionDeclaration',
            id: { name: 'defaultFunction' }
          }
        }
      ]
    };

    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = extractExports(sourceCode);

    expect(result).toEqual(['default']);
    expect(mockAstParser.parse).toHaveBeenCalledWith(sourceCode);
  });

  test('should return empty array when no exports found', () => {
    const sourceCode = `
      const foo = 'bar';
      function myFunction() {}
      class MyClass {}
    `;
    
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'VariableDeclaration',
          declarations: [{ id: { name: 'foo' } }]
        },
        {
          type: 'FunctionDeclaration',
          id: { name: 'myFunction' }
        },
        {
          type: 'ClassDeclaration',
          id: { name: 'MyClass' }
        }
      ]
    };

    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = extractExports(sourceCode);

    expect(result).toEqual([]);
    expect(mockAstParser.parse).toHaveBeenCalledWith(sourceCode);
  });

  test('should handle export all declarations', () => {
    const sourceCode = `
      export * from './module';
    `;
    
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'ExportAllDeclaration',
          source: { value: './module' }
        }
      ]
    };

    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = extractExports(sourceCode);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  test('should handle mixed export types', () => {
    const sourceCode = `
      export const foo = 'bar';
      export default MyClass;
      export { bar, baz };
    `;
    
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'ExportNamedDeclaration',
          declaration: {
            type: 'VariableDeclaration',
            declarations: [{ id: { name: 'foo' } }]
          }
        },
        {
          type: 'ExportDefaultDeclaration',
          declaration: { name: 'MyClass' }
        },
        {
          type: 'ExportNamedDeclaration',
          specifiers: [
            { exported: { name: 'bar' } },
            { exported: { name: 'baz' } }
          ]
        }
      ]
    };

    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = extractExports(sourceCode);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('should handle parsing errors gracefully', () => {
    const sourceCode = 'invalid typescript code {';
    
    if (mockAstParser.parse) {
      mockAstParser.parse.mockImplementation(() => {
        throw new Error('Parse error');
      });
    }

    expect(() => extractExports(sourceCode)).toThrow('Parse error');
  });

  test('should handle empty source code', () => {
    const sourceCode = '';
    
    const mockAst = {
      type: 'Program',
      body: []
    };

    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = extractExports(sourceCode);

    expect(result).toEqual([]);
  });

  test('should extract re-exported named exports', () => {
    const sourceCode = `
      export { foo, bar as baz } from './module';
    `;
    
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'ExportNamedDeclaration',
          specifiers: [
            { exported: { name: 'foo' } },
            { exported: { name: 'baz' } }
          ],
          source: { value: './module' }
        }
      ]
    };

    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = extractExports(sourceCode);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});