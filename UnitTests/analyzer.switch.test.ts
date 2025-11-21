import * as fs from 'fs';
import * as path from 'path';

describe('Analyzer - Import Detection Switch Statement', () => {
  // Helper function to simulate the switch statement logic
  function extractImports(language: string, content: string): string[] {
    const imports: string[] = [];
    let match: RegExpExecArray | null;

    switch (language) {
      case 'python': {
        const pyImportRegex = /^(?:from\s+([\w.]+)\s+)?import\s+([\w\s,.*]+)/gm;
        while ((match = pyImportRegex.exec(content)) !== null) {
          if (match[1]) imports.push(match[1]);
          if (match[2] && !match[2].includes('*')) {
            imports.push(...match[2].split(',').map(s => s.trim()));
          }
        }
        break;
      }

      case 'javascript':
      case 'typescript': {
        const jsImportRegex = /^import\s+(?:{[^}]+}|\w+|[*\s]+(?:as\s+\w+)?)\s+from\s+['"]([^'"]+)['"]/gm;
        const jsRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        
        while ((match = jsImportRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        while ((match = jsRequireRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
      }
    }

    return imports;
  }

  describe('Python imports', () => {
    test('should extract simple import statements', () => {
      const content = 'import os\nimport sys';
      const imports = extractImports('python', content);
      expect(imports).toEqual(['os', 'sys']);
    });

    test('should extract from...import statements', () => {
      const content = 'from os.path import join\nfrom sys import argv';
      const imports = extractImports('python', content);
      expect(imports).toEqual(['os.path', 'join', 'sys', 'argv']);
    });

    test('should extract multiple imports from single line', () => {
      const content = 'from module import func1, func2, func3';
      const imports = extractImports('python', content);
      expect(imports).toEqual(['module', 'func1', 'func2', 'func3']);
    });

    test('should handle wildcard imports without adding them', () => {
      const content = 'from module import *';
      const imports = extractImports('python', content);
      expect(imports).toEqual(['module']);
    });

    test('should handle imports with whitespace', () => {
      const content = 'from   module   import   func1  ,  func2';
      const imports = extractImports('python', content);
      expect(imports).toEqual(['module', 'func1', 'func2']);
    });

    test('should handle dotted module paths', () => {
      const content = 'from package.subpackage.module import function';
      const imports = extractImports('python', content);
      expect(imports).toEqual(['package.subpackage.module', 'function']);
    });

    test('should handle empty content', () => {
      const content = '';
      const imports = extractImports('python', content);
      expect(imports).toEqual([]);
    });

    test('should only match imports at start of line', () => {
      const content = '# import fake\nimport real';
      const imports = extractImports('python', content);
      expect(imports).toEqual(['real']);
    });
  });

  describe('JavaScript imports', () => {
    test('should extract ES6 default imports', () => {
      const content = "import React from 'react';";
      const imports = extractImports('javascript', content);
      expect(imports).toEqual(['react']);
    });

    test('should extract ES6 named imports', () => {
      const content = "import { useState, useEffect } from 'react';";
      const imports = extractImports('javascript', content);
      expect(imports).toEqual(['react']);
    });

    test('should extract ES6 namespace imports', () => {
      const content = "import * as fs from 'fs';";
      const imports = extractImports('javascript', content);
      expect(imports).toEqual(['fs']);
    });

    test('should extract require statements', () => {
      const content = "const fs = require('fs');\nconst path = require('path');";
      const imports = extractImports('javascript', content);
      expect(imports).toEqual(['fs', 'path']);
    });

    test('should extract both import and require in same file', () => {
      const content = "import React from 'react';\nconst fs = require('fs');";
      const imports = extractImports('javascript', content);
      expect(imports).toEqual(['react', 'fs']);
    });

    test('should handle single and double quotes', () => {
      const content = "import a from 'module-a';\nimport b from \"module-b\";";
      const imports = extractImports('javascript', content);
      expect(imports).toEqual(['module-a', 'module-b']);
    });

    test('should handle scoped packages', () => {
      const content = "import { Button } from '@mui/material';";
      const imports = extractImports('javascript', content);
      expect(imports).toEqual(['@mui/material']);
    });

    test('should handle relative paths', () => {
      const content = "import utils from './utils';\nimport config from '../config';";
      const imports = extractImports('javascript', content);
      expect(imports).toEqual(['./utils', '../config']);
    });

    test('should handle empty content', () => {
      const content = '';
      const imports = extractImports('javascript', content);
      expect(imports).toEqual([]);
    });
  });

  describe('TypeScript imports', () => {
    test('should extract ES6 imports like JavaScript', () => {
      const content = "import { Component } from '@angular/core';";
      const imports = extractImports('typescript', content);
      expect(imports).toEqual(['@angular/core']);
    });

    test('should extract type imports', () => {
      const content = "import type { User } from './types';";
      const imports = extractImports('typescript', content);
      expect(imports).toEqual(['./types']);
    });

    test('should handle mixed imports and requires', () => {
      const content = "import * as vscode from 'vscode';\nconst fs = require('fs');";
      const imports = extractImports('typescript', content);
      expect(imports).toEqual(['vscode', 'fs']);
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle unknown language gracefully', () => {
      const content = 'import something';
      const imports = extractImports('unknown', content);
      expect(imports).toEqual([]);
    });

    test('should handle multiline content', () => {
      const content = "import React from 'react';\nimport Vue from 'vue';\nimport Angular from '@angular/core';";
      const imports = extractImports('javascript', content);
      expect(imports).toEqual(['react', 'vue', '@angular/core']);
    });

    test('should handle content with comments', () => {
      const content = "// import fake from 'fake';\nimport real from 'real';";
      const imports = extractImports('javascript', content);
      expect(imports).toEqual(['real']);
    });

    test('should not extract imports from strings in code', () => {
      const content = "const str = \"import fake from 'fake'\";\nimport real from 'real';";
      const imports = extractImports('javascript', content);
      expect(imports).toEqual(['real']);
    });

    test('should handle very long import lists', () => {
      const content = 'from module import func1, func2, func3, func4, func5, func6, func7, func8';
      const imports = extractImports('python', content);
      expect(imports).toHaveLength(9); // module + 8 functions
      expect(imports[0]).toBe('module');
    });

    test('should handle require with spaces', () => {
      const content = "const a = require(  'module'  );";
      const imports = extractImports('javascript', content);
      expect(imports).toEqual(['module']);
    });
  });
});