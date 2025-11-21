import * as fs from 'fs';
import * as path from 'path';

describe('Import Detection Switch Statement', () => {
  let imports: string[];
  let match: RegExpExecArray | null;

  beforeEach(() => {
    imports = [];
    match = null;
  });

  describe('Python import detection', () => {
    test('should detect standard import statements', () => {
      const language = 'python';
      const content = 'import os\nimport sys\nimport json';
      
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
      }
      
      expect(imports).toEqual(['os', 'sys', 'json']);
    });

    test('should detect from...import statements', () => {
      const language = 'python';
      const content = 'from os import path\nfrom collections import defaultdict';
      
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
      }
      
      expect(imports).toContain('os');
      expect(imports).toContain('path');
      expect(imports).toContain('collections');
      expect(imports).toContain('defaultdict');
    });

    test('should handle multiple imports on same line', () => {
      const language = 'python';
      const content = 'from os import path, walk, listdir';
      
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
      }
      
      expect(imports).toContain('os');
      expect(imports).toContain('path');
      expect(imports).toContain('walk');
      expect(imports).toContain('listdir');
    });

    test('should skip wildcard imports', () => {
      const language = 'python';
      const content = 'from os import *';
      
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
      }
      
      expect(imports).toEqual(['os']);
      expect(imports).not.toContain('*');
    });

    test('should handle dotted module names', () => {
      const language = 'python';
      const content = 'from os.path import join\nimport xml.etree.ElementTree';
      
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
      }
      
      expect(imports).toContain('os.path');
      expect(imports).toContain('join');
      expect(imports).toContain('xml.etree.ElementTree');
    });
  });

  describe('JavaScript import detection', () => {
    test('should detect ES6 import statements', () => {
      const language = 'javascript';
      const content = "import React from 'react';\nimport { useState } from 'react';";
      
      switch (language) {
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
      
      expect(imports).toEqual(['react', 'react']);
    });

    test('should detect require statements', () => {
      const language = 'javascript';
      const content = "const fs = require('fs');\nconst path = require('path');";
      
      switch (language) {
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
      
      expect(imports).toEqual(['fs', 'path']);
    });

    test('should detect namespace imports', () => {
      const language = 'javascript';
      const content = "import * as vscode from 'vscode';";
      
      switch (language) {
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
      
      expect(imports).toEqual(['vscode']);
    });

    test('should handle both single and double quotes', () => {
      const language = 'javascript';
      const content = "import React from \"react\";\nconst fs = require('fs');";
      
      switch (language) {
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
      
      expect(imports).toEqual(['react', 'fs']);
    });
  });

  describe('TypeScript import detection', () => {
    test('should detect TypeScript imports same as JavaScript', () => {
      const language = 'typescript';
      const content = "import { Component } from '@angular/core';";
      
      switch (language) {
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
      
      expect(imports).toEqual(['@angular/core']);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty content', () => {
      const language = 'python';
      const content = '';
      
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
      }
      
      expect(imports).toEqual([]);
    });

    test('should handle content with no imports', () => {
      const language = 'javascript';
      const content = 'const x = 5;\nconsole.log(x);';
      
      switch (language) {
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
      
      expect(imports).toEqual([]);
    });

    test('should handle unrecognized language by not matching any case', () => {
      const language = 'java';
      const content = 'import java.util.List;';
      
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
      
      expect(imports).toEqual([]);
    });
  });
});