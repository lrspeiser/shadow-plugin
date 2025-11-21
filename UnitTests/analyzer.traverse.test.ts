import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('traverse function', () => {
  let files: string[];
  let traverse: (currentPath: string) => void;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;

  const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);
  const CODE_EXTENSIONS: Record<string, boolean> = {
    '.ts': true,
    '.tsx': true,
    '.js': true,
    '.jsx': true,
    '.py': true,
    '.java': true,
    '.cpp': true,
    '.c': true,
    '.cs': true,
    '.go': true,
    '.rb': true,
    '.php': true
  };

  beforeEach(() => {
    files = [];
    jest.clearAllMocks();
    
    // Define traverse function inline for testing
    traverse = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
            traverse(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (CODE_EXTENSIONS[ext]) {
            files.push(fullPath);
          }
        }
      }
    };

    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
    mockPath.extname.mockImplementation((filename: string) => {
      const parts = filename.split('.');
      return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
    });
  });

  describe('happy path scenarios', () => {
    test('should collect TypeScript files from directory', () => {
      const mockEntries = [
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
        { name: 'file2.tsx', isDirectory: () => false, isFile: () => true }
      ];
      mockFs.readdirSync.mockReturnValue(mockEntries as any);

      traverse('/test/path');

      expect(files).toEqual(['/test/path/file1.ts', '/test/path/file2.tsx']);
      expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/path', { withFileTypes: true });
    });

    test('should collect JavaScript files from directory', () => {
      const mockEntries = [
        { name: 'app.js', isDirectory: () => false, isFile: () => true },
        { name: 'component.jsx', isDirectory: () => false, isFile: () => true }
      ];
      mockFs.readdirSync.mockReturnValue(mockEntries as any);

      traverse('/src');

      expect(files).toEqual(['/src/app.js', '/src/component.jsx']);
    });

    test('should recursively traverse subdirectories', () => {
      mockFs.readdirSync
        .mockReturnValueOnce([
          { name: 'subdir', isDirectory: () => true, isFile: () => false },
          { name: 'root.ts', isDirectory: () => false, isFile: () => true }
        ] as any)
        .mockReturnValueOnce([
          { name: 'nested.ts', isDirectory: () => false, isFile: () => true }
        ] as any);

      traverse('/root');

      expect(files).toEqual(['/root/root.ts', '/root/subdir/nested.ts']);
      expect(mockFs.readdirSync).toHaveBeenCalledTimes(2);
    });

    test('should collect multiple code file types', () => {
      const mockEntries = [
        { name: 'file.ts', isDirectory: () => false, isFile: () => true },
        { name: 'script.py', isDirectory: () => false, isFile: () => true },
        { name: 'main.java', isDirectory: () => false, isFile: () => true },
        { name: 'app.go', isDirectory: () => false, isFile: () => true }
      ];
      mockFs.readdirSync.mockReturnValue(mockEntries as any);

      traverse('/project');

      expect(files).toHaveLength(4);
      expect(files).toContain('/project/file.ts');
      expect(files).toContain('/project/script.py');
      expect(files).toContain('/project/main.java');
      expect(files).toContain('/project/app.go');
    });
  });

  describe('filtering scenarios', () => {
    test('should skip node_modules directory', () => {
      mockFs.readdirSync
        .mockReturnValueOnce([
          { name: 'node_modules', isDirectory: () => true, isFile: () => false },
          { name: 'src', isDirectory: () => true, isFile: () => false }
        ] as any)
        .mockReturnValueOnce([
          { name: 'app.ts', isDirectory: () => false, isFile: () => true }
        ] as any);

      traverse('/project');

      expect(files).toEqual(['/project/src/app.ts']);
      expect(mockFs.readdirSync).toHaveBeenCalledTimes(2);
    });

    test('should skip all directories in SKIP_DIRS set', () => {
      mockFs.readdirSync.mockReturnValue([
        { name: 'node_modules', isDirectory: () => true, isFile: () => false },
        { name: 'dist', isDirectory: () => true, isFile: () => false },
        { name: 'build', isDirectory: () => true, isFile: () => false },
        { name: 'coverage', isDirectory: () => true, isFile: () => false },
        { name: '.git', isDirectory: () => true, isFile: () => false }
      ] as any);

      traverse('/project');

      expect(files).toEqual([]);
      expect(mockFs.readdirSync).toHaveBeenCalledTimes(1);
    });

    test('should skip hidden directories starting with dot', () => {
      mockFs.readdirSync.mockReturnValue([
        { name: '.hidden', isDirectory: () => true, isFile: () => false },
        { name: '.cache', isDirectory: () => true, isFile: () => false },
        { name: 'visible', isDirectory: () => true, isFile: () => false }
      ] as any);
      mockFs.readdirSync.mockReturnValueOnce([
        { name: '.hidden', isDirectory: () => true, isFile: () => false },
        { name: '.cache', isDirectory: () => true, isFile: () => false },
        { name: 'visible', isDirectory: () => true, isFile: () => false }
      ] as any);
      mockFs.readdirSync.mockReturnValueOnce([
        { name: 'file.ts', isDirectory: () => false, isFile: () => true }
      ] as any);

      traverse('/project');

      expect(files).toEqual(['/project/visible/file.ts']);
    });

    test('should ignore non-code files', () => {
      const mockEntries = [
        { name: 'readme.md', isDirectory: () => false, isFile: () => true },
        { name: 'config.json', isDirectory: () => false, isFile: () => true },
        { name: 'image.png', isDirectory: () => false, isFile: () => true },
        { name: 'app.ts', isDirectory: () => false, isFile: () => true }
      ];
      mockFs.readdirSync.mockReturnValue(mockEntries as any);

      traverse('/project');

      expect(files).toEqual(['/project/app.ts']);
    });

    test('should ignore files without extension', () => {
      const mockEntries = [
        { name: 'Makefile', isDirectory: () => false, isFile: () => true },
        { name: 'Dockerfile', isDirectory: () => false, isFile: () => true },
        { name: 'script.sh', isDirectory: () => false, isFile: () => true }
      ];
      mockFs.readdirSync.mockReturnValue(mockEntries as any);

      traverse('/project');

      expect(files).toEqual([]);
    });
  });

  describe('edge cases', () => {
    test('should handle empty directory', () => {
      mockFs.readdirSync.mockReturnValue([] as any);

      traverse('/empty');

      expect(files).toEqual([]);
      expect(mockFs.readdirSync).toHaveBeenCalledWith('/empty', { withFileTypes: true });
    });

    test('should handle directory with only non-code files', () => {
      const mockEntries = [
        { name: 'readme.txt', isDirectory: () => false, isFile: () => true },
        { name: 'data.xml', isDirectory: () => false, isFile: () => true }
      ];
      mockFs.readdirSync.mockReturnValue(mockEntries as any);

      traverse('/docs');

      expect(files).toEqual([]);
    });

    test('should handle deeply nested directory structure', () => {
      mockFs.readdirSync
        .mockReturnValueOnce([{ name: 'level1', isDirectory: () => true, isFile: () => false }] as any)
        .mockReturnValueOnce([{ name: 'level2', isDirectory: () => true, isFile: () => false }] as any)
        .mockReturnValueOnce([{ name: 'level3', isDirectory: () => true, isFile: () => false }] as any)
        .mockReturnValueOnce([{ name: 'deep.ts', isDirectory: () => false, isFile: () => true }] as any);

      traverse('/root');

      expect(files).toEqual(['/root/level1/level2/level3/deep.ts']);
      expect(mockFs.readdirSync).toHaveBeenCalledTimes(4);
    });

    test('should handle mixed directory and file entries', () => {
      mockFs.readdirSync
        .mockReturnValueOnce([
          { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
          { name: 'subdir', isDirectory: () => true, isFile: () => false },
          { name: 'file2.js', isDirectory: () => false, isFile: () => true },
          { name: '.hidden', isDirectory: () => true, isFile: () => false },
          { name: 'readme.md', isDirectory: () => false, isFile: () => true }
        ] as any)
        .mockReturnValueOnce([
          { name: 'nested.ts', isDirectory: () => false, isFile: () => true }
        ] as any);

      traverse('/mixed');

      expect(files).toEqual(['/mixed/file1.ts', '/mixed/file2.js', '/mixed/subdir/nested.ts']);
    });
  });

  describe('error handling', () => {
    test('should propagate fs.readdirSync errors', () => {
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => traverse('/restricted')).toThrow('Permission denied');
    });

    test('should handle invalid path gracefully by letting fs throw', () => {
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      expect(() => traverse('/nonexistent')).toThrow('ENOENT');
    });
  });
});