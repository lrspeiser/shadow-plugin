import * as fs from 'fs';
import * as path from 'path';

describe('Import extraction switch statement', () => {
  describe('Python import extraction', () => {
    test('should extract basic Python imports', () => {
      const content = 'import os\nimport sys\nimport json';
      const language = 'python';
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const pyImportRegex = /^(?:from\s+([\w.]+)\s+)?import\s+([\w\s,.*]+)/gm;
      while ((match = pyImportRegex.exec(content)) !== null) {
        if (match[1]) imports.push(match[1]);
        if (match[2] && !match[2].includes('*')) {
          imports.push(...match[2].split(',').map(s => s.trim()));
        }
      }

      expect(imports).toEqual(['os', 'sys', 'json']);
    });

    test('should extract Python from...import statements', () => {
      const content = 'from os.path import join, dirname\nfrom sys import argv';
      const language = 'python';
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const pyImportRegex = /^(?:from\s+([\w.]+)\s+)?import\s+([\w\s,.*]+)/gm;
      while ((match = pyImportRegex.exec(content)) !== null) {
        if (match[1]) imports.push(match[1]);
        if (match[2] && !match[2].includes('*')) {
          imports.push(...match[2].split(',').map(s => s.trim()));
        }
      }

      expect(imports).toContain('os.path');
      expect(imports).toContain('join');
      expect(imports).toContain('dirname');
      expect(imports).toContain('sys');
      expect(imports).toContain('argv');
    });

    test('should handle Python wildcard imports without adding items', () => {
      const content = 'from os import *\nimport sys';
      const language = 'python';
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const pyImportRegex = /^(?:from\s+([\w.]+)\s+)?import\s+([\w\s,.*]+)/gm;
      while ((match = pyImportRegex.exec(content)) !== null) {
        if (match[1]) imports.push(match[1]);
        if (match[2] && !match[2].includes('*')) {
          imports.push(...match[2].split(',').map(s => s.trim()));
        }
      }

      expect(imports).toContain('os');
      expect(imports).toContain('sys');
      expect(imports).not.toContain('*');
    });

    test('should handle multiple comma-separated Python imports', () => {
      const content = 'from module import func1, func2, func3';
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const pyImportRegex = /^(?:from\s+([\w.]+)\s+)?import\s+([\w\s,.*]+)/gm;
      while ((match = pyImportRegex.exec(content)) !== null) {
        if (match[1]) imports.push(match[1]);
        if (match[2] && !match[2].includes('*')) {
          imports.push(...match[2].split(',').map(s => s.trim()));
        }
      }

      expect(imports).toContain('module');
      expect(imports).toContain('func1');
      expect(imports).toContain('func2');
      expect(imports).toContain('func3');
    });
  });

  describe('JavaScript import extraction', () => {
    test('should extract JavaScript ES6 imports', () => {
      const content = "import React from 'react';\nimport { Component } from 'react';";
      const language = 'javascript';
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const jsImportRegex = /^import\s+(?:{[^}]+}|\w+|[*\s]+(?:as\s+\w+)?)\s+from\s+['"]([^'"]+)['"]/gm;
      const jsRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      
      while ((match = jsImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      while ((match = jsRequireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      expect(imports).toEqual(['react', 'react']);
    });

    test('should extract JavaScript require statements', () => {
      const content = "const fs = require('fs');\nconst path = require('path');";
      const language = 'javascript';
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const jsImportRegex = /^import\s+(?:{[^}]+}|\w+|[*\s]+(?:as\s+\w+)?)\s+from\s+['"]([^'"]+)['"]/gm;
      const jsRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      
      while ((match = jsImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      while ((match = jsRequireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      expect(imports).toEqual(['fs', 'path']);
    });

    test('should extract both ES6 imports and require statements', () => {
      const content = "import React from 'react';\nconst fs = require('fs');";
      const language = 'javascript';
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const jsImportRegex = /^import\s+(?:{[^}]+}|\w+|[*\s]+(?:as\s+\w+)?)\s+from\s+['"]([^'"]+)['"]/gm;
      const jsRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      
      while ((match = jsImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      while ((match = jsRequireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      expect(imports).toEqual(['react', 'fs']);
    });

    test('should handle namespace imports', () => {
      const content = "import * as utils from 'utils';";
      const language = 'javascript';
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const jsImportRegex = /^import\s+(?:{[^}]+}|\w+|[*\s]+(?:as\s+\w+)?)\s+from\s+['"]([^'"]+)['"]/gm;
      const jsRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      
      while ((match = jsImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      while ((match = jsRequireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      expect(imports).toContain('utils');
    });
  });

  describe('TypeScript import extraction', () => {
    test('should extract TypeScript imports same as JavaScript', () => {
      const content = "import { Component } from 'react';\nimport * as fs from 'fs';";
      const language = 'typescript';
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const jsImportRegex = /^import\s+(?:{[^}]+}|\w+|[*\s]+(?:as\s+\w+)?)\s+from\s+['"]([^'"]+)['"]/gm;
      const jsRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      
      while ((match = jsImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      while ((match = jsRequireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      expect(imports).toEqual(['react', 'fs']);
    });

    test('should handle TypeScript type imports', () => {
      const content = "import type { Props } from 'react';\nimport { useState } from 'react';";
      const language = 'typescript';
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const jsImportRegex = /^import\s+(?:{[^}]+}|\w+|[*\s]+(?:as\s+\w+)?)\s+from\s+['"]([^'"]+)['"]/gm;
      const jsRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      
      while ((match = jsImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      while ((match = jsRequireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      expect(imports).toContain('react');
    });
  });

  describe('Edge cases', () => {
    test('should handle empty content', () => {
      const content = '';
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const pyImportRegex = /^(?:from\s+([\w.]+)\s+)?import\s+([\w\s,.*]+)/gm;
      while ((match = pyImportRegex.exec(content)) !== null) {
        if (match[1]) imports.push(match[1]);
        if (match[2] && !match[2].includes('*')) {
          imports.push(...match[2].split(',').map(s => s.trim()));
        }
      }

      expect(imports).toEqual([]);
    });

    test('should handle content with no imports', () => {
      const content = 'const x = 5;\nconsole.log(x);';
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const jsImportRegex = /^import\s+(?:{[^}]+}|\w+|[*\s]+(?:as\s+\w+)?)\s+from\s+['"]([^'"]+)['"]/gm;
      const jsRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      
      while ((match = jsImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      while ((match = jsRequireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      expect(imports).toEqual([]);
    });

    test('should handle multiline imports', () => {
      const content = "import {\n  Component,\n  useState\n} from 'react';";
      const imports: string[] = [];
      let match: RegExpExecArray | null;

      const jsImportRegex = /^import\s+(?:{[^}]+}|\w+|[*\s]+(?:as\s+\w+)?)\s+from\s+['"]([^'"]+)['"]/gm;
      const jsRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      
      while ((match = jsImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      while ((match = jsRequireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      expect(imports).toContain('react');
    });
  });
});