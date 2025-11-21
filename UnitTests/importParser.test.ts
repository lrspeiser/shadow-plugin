import { parseImports } from '../importParser';
import * as astParser from '../astParser';

// Mocks
jest.mock('../astParser');

describe('parseImports', () => {
  const mockAstParser = astParser as jest.Mocked<typeof astParser>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should parse ES6 named imports correctly', () => {
    const sourceCode = `import { foo, bar } from './module';
import { baz } from '../another';
`;
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'ImportDeclaration',
          specifiers: [
            { type: 'ImportSpecifier', imported: { name: 'foo' }, local: { name: 'foo' } },
            { type: 'ImportSpecifier', imported: { name: 'bar' }, local: { name: 'bar' } }
          ],
          source: { value: './module' }
        },
        {
          type: 'ImportDeclaration',
          specifiers: [
            { type: 'ImportSpecifier', imported: { name: 'baz' }, local: { name: 'baz' } }
          ],
          source: { value: '../another' }
        }
      ]
    };
    
    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = parseImports(sourceCode);

    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({
      specifiers: ['foo', 'bar'],
      source: './module',
      type: 'named'
    });
    expect(result[1]).toEqual({
      specifiers: ['baz'],
      source: '../another',
      type: 'named'
    });
  });

  test('should parse default imports correctly', () => {
    const sourceCode = `import React from 'react';
import Component from './Component';
`;
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'ImportDeclaration',
          specifiers: [
            { type: 'ImportDefaultSpecifier', local: { name: 'React' } }
          ],
          source: { value: 'react' }
        },
        {
          type: 'ImportDeclaration',
          specifiers: [
            { type: 'ImportDefaultSpecifier', local: { name: 'Component' } }
          ],
          source: { value: './Component' }
        }
      ]
    };
    
    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = parseImports(sourceCode);

    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({
      specifiers: ['React'],
      source: 'react',
      type: 'default'
    });
    expect(result[1]).toEqual({
      specifiers: ['Component'],
      source: './Component',
      type: 'default'
    });
  });

  test('should parse namespace imports correctly', () => {
    const sourceCode = `import * as utils from './utils';
import * as lodash from 'lodash';
`;
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'ImportDeclaration',
          specifiers: [
            { type: 'ImportNamespaceSpecifier', local: { name: 'utils' } }
          ],
          source: { value: './utils' }
        },
        {
          type: 'ImportDeclaration',
          specifiers: [
            { type: 'ImportNamespaceSpecifier', local: { name: 'lodash' } }
          ],
          source: { value: 'lodash' }
        }
      ]
    };
    
    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = parseImports(sourceCode);

    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({
      specifiers: ['utils'],
      source: './utils',
      type: 'namespace'
    });
    expect(result[1]).toEqual({
      specifiers: ['lodash'],
      source: 'lodash',
      type: 'namespace'
    });
  });

  test('should parse mixed import types correctly', () => {
    const sourceCode = `import React, { useState, useEffect } from 'react';
import * as utils from './utils';
`;
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'ImportDeclaration',
          specifiers: [
            { type: 'ImportDefaultSpecifier', local: { name: 'React' } },
            { type: 'ImportSpecifier', imported: { name: 'useState' }, local: { name: 'useState' } },
            { type: 'ImportSpecifier', imported: { name: 'useEffect' }, local: { name: 'useEffect' } }
          ],
          source: { value: 'react' }
        },
        {
          type: 'ImportDeclaration',
          specifiers: [
            { type: 'ImportNamespaceSpecifier', local: { name: 'utils' } }
          ],
          source: { value: './utils' }
        }
      ]
    };
    
    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = parseImports(sourceCode);

    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({
      specifiers: ['React', 'useState', 'useEffect'],
      source: 'react',
      type: 'mixed'
    });
  });

  test('should return empty array for code with no imports', () => {
    const sourceCode = `const x = 5;
function test() { return x; }
`;
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'VariableDeclaration',
          declarations: []
        },
        {
          type: 'FunctionDeclaration',
          id: { name: 'test' }
        }
      ]
    };
    
    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = parseImports(sourceCode);

    expect(result).toBeDefined();
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  test('should handle empty string input', () => {
    const sourceCode = '';
    const mockAst = {
      type: 'Program',
      body: []
    };
    
    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = parseImports(sourceCode);

    expect(result).toBeDefined();
    expect(result).toEqual([]);
  });

  test('should handle parsing errors gracefully', () => {
    const sourceCode = 'import { invalid syntax';
    
    if (mockAstParser.parse) {
      mockAstParser.parse.mockImplementation(() => {
        throw new Error('Parse error');
      });
    }

    expect(() => parseImports(sourceCode)).toThrow('Parse error');
  });

  test('should parse side-effect only imports', () => {
    const sourceCode = `import './styles.css';
import 'polyfill';
`;
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'ImportDeclaration',
          specifiers: [],
          source: { value: './styles.css' }
        },
        {
          type: 'ImportDeclaration',
          specifiers: [],
          source: { value: 'polyfill' }
        }
      ]
    };
    
    if (mockAstParser.parse) {
      mockAstParser.parse.mockReturnValue(mockAst);
    }

    const result = parseImports(sourceCode);

    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({
      specifiers: [],
      source: './styles.css',
      type: 'side-effect'
    });
    expect(result[1]).toEqual({
      specifiers: [],
      source: 'polyfill',
      type: 'side-effect'
    });
  });
});