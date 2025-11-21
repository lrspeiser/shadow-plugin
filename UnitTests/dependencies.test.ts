import { buildDependencyGraph } from '../dependencies';
import * as path from 'path';
import * as fs from 'fs';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('buildDependencyGraph', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.resolve = jest.fn((p) => p);
    mockPath.dirname = jest.fn((p) => p.split('/').slice(0, -1).join('/'));
    mockPath.join = jest.fn((...args) => args.join('/'));
    mockPath.extname = jest.fn((p) => {
      const parts = p.split('.');
      return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Happy Path', () => {
    test('should build dependency graph for single file with no dependencies', () => {
      const entryPoint = '/project/src/index.ts';
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('export const foo = "bar";');

      const result = buildDependencyGraph(entryPoint);

      expect(result).toBeDefined();
      expect(result[entryPoint]).toBeDefined();
      expect(result[entryPoint].dependencies).toEqual([]);
    });

    test('should build dependency graph with multiple imports', () => {
      const entryPoint = '/project/src/index.ts';
      const moduleA = '/project/src/moduleA.ts';
      const moduleB = '/project/src/moduleB.ts';

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn((filePath) => {
        if (filePath === entryPoint) {
          return 'import { a } from "./moduleA";\nimport { b } from "./moduleB";';
        } else if (filePath === moduleA) {
          return 'export const a = 1;';
        } else if (filePath === moduleB) {
          return 'export const b = 2;';
        }
        return '';
      });

      const result = buildDependencyGraph(entryPoint);

      expect(result[entryPoint]).toBeDefined();
      expect(result[entryPoint].dependencies.length).toBeGreaterThan(0);
    });

    test('should handle relative imports correctly', () => {
      const entryPoint = '/project/src/index.ts';
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('import { util } from "../utils/helper";');

      const result = buildDependencyGraph(entryPoint);

      expect(result).toBeDefined();
      expect(result[entryPoint]).toBeDefined();
    });

    test('should handle node_modules imports', () => {
      const entryPoint = '/project/src/index.ts';
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('import express from "express";\nimport { Router } from "express";');

      const result = buildDependencyGraph(entryPoint);

      expect(result).toBeDefined();
      expect(result[entryPoint]).toBeDefined();
    });

    test('should handle circular dependencies', () => {
      const fileA = '/project/src/fileA.ts';
      const fileB = '/project/src/fileB.ts';

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn((filePath) => {
        if (filePath === fileA) {
          return 'import { b } from "./fileB";';
        } else if (filePath === fileB) {
          return 'import { a } from "./fileA";';
        }
        return '';
      });

      const result = buildDependencyGraph(fileA);

      expect(result).toBeDefined();
      expect(result[fileA]).toBeDefined();
      expect(result[fileB]).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty file', () => {
      const entryPoint = '/project/src/empty.ts';
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('');

      const result = buildDependencyGraph(entryPoint);

      expect(result).toBeDefined();
      expect(result[entryPoint].dependencies).toEqual([]);
    });

    test('should handle file with only comments', () => {
      const entryPoint = '/project/src/comments.ts';
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('// This is a comment\n/* Multi-line\ncomment */');

      const result = buildDependencyGraph(entryPoint);

      expect(result).toBeDefined();
    });

    test('should handle dynamic imports', () => {
      const entryPoint = '/project/src/dynamic.ts';
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('const module = import("./lazy");');

      const result = buildDependencyGraph(entryPoint);

      expect(result).toBeDefined();
    });

    test('should handle re-exports', () => {
      const entryPoint = '/project/src/barrel.ts';
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('export * from "./moduleA";\nexport { default } from "./moduleB";');

      const result = buildDependencyGraph(entryPoint);

      expect(result).toBeDefined();
    });

    test('should handle mixed import styles', () => {
      const entryPoint = '/project/src/mixed.ts';
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(
        'import defaultExport from "./module";\n' +
        'import * as namespace from "./module2";\n' +
        'import { named } from "./module3";\n' +
        'const require = require("./module4");'
      );

      const result = buildDependencyGraph(entryPoint);

      expect(result).toBeDefined();
    });

    test('should handle files without extension in import', () => {
      const entryPoint = '/project/src/index.ts';
      mockFs.existsSync = jest.fn((p) => p.endsWith('.ts') || p.endsWith('.js'));
      mockFs.readFileSync = jest.fn().mockReturnValue('import { foo } from "./module";');

      const result = buildDependencyGraph(entryPoint);

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should throw error when entry point does not exist', () => {
      const entryPoint = '/project/src/nonexistent.ts';
      mockFs.existsSync = jest.fn().mockReturnValue(false);

      expect(() => buildDependencyGraph(entryPoint)).toThrow();
    });

    test('should handle file read errors gracefully', () => {
      const entryPoint = '/project/src/index.ts';
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => buildDependencyGraph(entryPoint)).toThrow('Permission denied');
    });

    test('should handle invalid import syntax', () => {
      const entryPoint = '/project/src/invalid.ts';
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('import { from "./broken');

      const result = buildDependencyGraph(entryPoint);

      expect(result).toBeDefined();
      expect(result[entryPoint]).toBeDefined();
    });

    test('should handle null or undefined entry point', () => {
      expect(() => buildDependencyGraph(null as any)).toThrow();
      expect(() => buildDependencyGraph(undefined as any)).toThrow();
    });

    test('should handle empty string entry point', () => {
      expect(() => buildDependencyGraph('')).toThrow();
    });

    test('should handle very deep dependency chains', () => {
      const entryPoint = '/project/src/level0.ts';
      let depth = 0;
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn((filePath) => {
        const level = parseInt(filePath.match(/level(\d+)/)?.[1] || '0');
        if (level < 50) {
          return `import { foo } from "./level${level + 1}";`;
        }
        return 'export const foo = "bar";';
      });

      const result = buildDependencyGraph(entryPoint);

      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBeGreaterThan(1);
    });

    test('should handle malformed file paths', () => {
      const entryPoint = '///invalid//path//.ts';
      mockFs.existsSync = jest.fn().mockReturnValue(false);

      expect(() => buildDependencyGraph(entryPoint)).toThrow();
    });
  });

  describe('Performance', () => {
    test('should handle large number of dependencies efficiently', () => {
      const entryPoint = '/project/src/index.ts';
      const imports = Array.from({ length: 100 }, (_, i) => `import { mod${i} } from "./module${i}";`).join('\n');

      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn((filePath) => {
        if (filePath === entryPoint) {
          return imports;
        }
        return `export const mod = ${Math.random()};`;
      });

      const startTime = Date.now();
      const result = buildDependencyGraph(entryPoint);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});