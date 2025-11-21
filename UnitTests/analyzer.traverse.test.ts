import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('traverse', () => {
  let files: string[];
  const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage']);
  const CODE_EXTENSIONS: Record<string, boolean> = {
    '.ts': true,
    '.js': true,
    '.tsx': true,
    '.jsx': true,
    '.py': true,
    '.java': true
  };

  // Recreate the traverse function for testing
  const createTraverse = () => {
    files = [];
    return (currentPath: string) => {
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
  };

  let traverse: (currentPath: string) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    files = [];
    traverse = createTraverse();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Happy Path', () => {
    test('should collect all code files from a directory', () => {
      const mockEntries = [
        { name: 'test.ts', isDirectory: () => false, isFile: () => true },
        { name: 'index.js', isDirectory: () => false, isFile: () => true },
        { name: 'readme.md', isDirectory: () => false, isFile: () => true }
      ];

      (fs.readdirSync as jest.Mock).mockReturnValue(mockEntries);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);
      (path.extname as jest.Mock).mockImplementation((file) => {
        const match = file.match(/\.[^.]+$/);
        return match ? match[0] : '';
      });

      traverse('/test/path');

      expect(files).toHaveLength(2);
      expect(files).toContain('/test/path/test.ts');
      expect(files).toContain('/test/path/index.js');
      expect(files).not.toContain('/test/path/readme.md');
    });

    test('should recursively traverse subdirectories', () => {
      const mockRootEntries = [
        { name: 'file.ts', isDirectory: () => false, isFile: () => true },
        { name: 'subdir', isDirectory: () => true, isFile: () => false }
      ];
      const mockSubEntries = [
        { name: 'nested.js', isDirectory: () => false, isFile: () => true }
      ];

      (fs.readdirSync as jest.Mock)
        .mockReturnValueOnce(mockRootEntries)
        .mockReturnValueOnce(mockSubEntries);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);
      (path.extname as jest.Mock).mockImplementation((file) => {
        const match = file.match(/\.[^.]+$/);
        return match ? match[0] : '';
      });

      traverse('/root');

      expect(files).toHaveLength(2);
      expect(files).toContain('/root/file.ts');
      expect(files).toContain('/root/subdir/nested.js');
    });

    test('should handle multiple file extensions correctly', () => {
      const mockEntries = [
        { name: 'script.ts', isDirectory: () => false, isFile: () => true },
        { name: 'component.tsx', isDirectory: () => false, isFile: () => true },
        { name: 'app.jsx', isDirectory: () => false, isFile: () => true },
        { name: 'main.py', isDirectory: () => false, isFile: () => true },
        { name: 'Main.java', isDirectory: () => false, isFile: () => true }
      ];

      (fs.readdirSync as jest.Mock).mockReturnValue(mockEntries);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);
      (path.extname as jest.Mock).mockImplementation((file) => {
        const match = file.match(/\.[^.]+$/);
        return match ? match[0] : '';
      });

      traverse('/multi');

      expect(files).toHaveLength(5);
      expect(files).toContain('/multi/script.ts');
      expect(files).toContain('/multi/component.tsx');
      expect(files).toContain('/multi/app.jsx');
      expect(files).toContain('/multi/main.py');
      expect(files).toContain('/multi/Main.java');
    });
  });

  describe('Directory Skipping', () => {
    test('should skip node_modules directory', () => {
      const mockEntries = [
        { name: 'file.ts', isDirectory: () => false, isFile: () => true },
        { name: 'node_modules', isDirectory: () => true, isFile: () => false }
      ];

      (fs.readdirSync as jest.Mock).mockReturnValue(mockEntries);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);
      (path.extname as jest.Mock).mockImplementation((file) => {
        const match = file.match(/\.[^.]+$/);
        return match ? match[0] : '';
      });

      traverse('/project');

      expect(fs.readdirSync).toHaveBeenCalledTimes(1);
      expect(files).toHaveLength(1);
      expect(files[0]).toBe('/project/file.ts');
    });

    test('should skip all directories in SKIP_DIRS set', () => {
      const mockEntries = [
        { name: 'dist', isDirectory: () => true, isFile: () => false },
        { name: 'build', isDirectory: () => true, isFile: () => false },
        { name: 'coverage', isDirectory: () => true, isFile: () => false },
        { name: 'src', isDirectory: () => true, isFile: () => false }
      ];
      const mockSrcEntries = [
        { name: 'index.ts', isDirectory: () => false, isFile: () => true }
      ];

      (fs.readdirSync as jest.Mock)
        .mockReturnValueOnce(mockEntries)
        .mockReturnValueOnce(mockSrcEntries);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);
      (path.extname as jest.Mock).mockImplementation((file) => {
        const match = file.match(/\.[^.]+$/);
        return match ? match[0] : '';
      });

      traverse('/project');

      expect(fs.readdirSync).toHaveBeenCalledTimes(2);
      expect(files).toHaveLength(1);
      expect(files[0]).toBe('/project/src/index.ts');
    });

    test('should skip hidden directories starting with dot', () => {
      const mockEntries = [
        { name: '.git', isDirectory: () => true, isFile: () => false },
        { name: '.vscode', isDirectory: () => true, isFile: () => false },
        { name: 'src', isDirectory: () => true, isFile: () => false }
      ];
      const mockSrcEntries = [
        { name: 'app.ts', isDirectory: () => false, isFile: () => true }
      ];

      (fs.readdirSync as jest.Mock)
        .mockReturnValueOnce(mockEntries)
        .mockReturnValueOnce(mockSrcEntries);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);
      (path.extname as jest.Mock).mockImplementation((file) => {
        const match = file.match(/\.[^.]+$/);
        return match ? match[0] : '';
      });

      traverse('/project');

      expect(files).toHaveLength(1);
      expect(files[0]).toBe('/project/src/app.ts');
    });
  });

  describe('File Filtering', () => {
    test('should ignore non-code files', () => {
      const mockEntries = [
        { name: 'readme.md', isDirectory: () => false, isFile: () => true },
        { name: 'package.json', isDirectory: () => false, isFile: () => true },
        { name: 'image.png', isDirectory: () => false, isFile: () => true },
        { name: 'script.ts', isDirectory: () => false, isFile: () => true }
      ];

      (fs.readdirSync as jest.Mock).mockReturnValue(mockEntries);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);
      (path.extname as jest.Mock).mockImplementation((file) => {
        const match = file.match(/\.[^.]+$/);
        return match ? match[0] : '';
      });

      traverse('/mixed');

      expect(files).toHaveLength(1);
      expect(files[0]).toBe('/mixed/script.ts');
    });

    test('should handle files without extensions', () => {
      const mockEntries = [
        { name: 'Makefile', isDirectory: () => false, isFile: () => true },
        { name: 'script.js', isDirectory: () => false, isFile: () => true }
      ];

      (fs.readdirSync as jest.Mock).mockReturnValue(mockEntries);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);
      (path.extname as jest.Mock).mockImplementation((file) => {
        const match = file.match(/\.[^.]+$/);
        return match ? match[0] : '';
      });

      traverse('/project');

      expect(files).toHaveLength(1);
      expect(files[0]).toBe('/project/script.js');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty directory', () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([]);

      traverse('/empty');

      expect(files).toHaveLength(0);
    });

    test('should handle directory with only subdirectories', () => {
      const mockEntries = [
        { name: 'dir1', isDirectory: () => true, isFile: () => false },
        { name: 'dir2', isDirectory: () => true, isFile: () => false }
      ];

      (fs.readdirSync as jest.Mock)
        .mockReturnValueOnce(mockEntries)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);

      traverse('/dirs-only');

      expect(files).toHaveLength(0);
    });

    test('should handle directory with only files', () => {
      const mockEntries = [
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
        { name: 'file2.js', isDirectory: () => false, isFile: () => true }
      ];

      (fs.readdirSync as jest.Mock).mockReturnValue(mockEntries);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);
      (path.extname as jest.Mock).mockImplementation((file) => {
        const match = file.match(/\.[^.]+$/);
        return match ? match[0] : '';
      });

      traverse('/files-only');

      expect(files).toHaveLength(2);
    });

    test('should handle deep nested directory structure', () => {
      (fs.readdirSync as jest.Mock)
        .mockReturnValueOnce([{ name: 'level1', isDirectory: () => true, isFile: () => false }])
        .mockReturnValueOnce([{ name: 'level2', isDirectory: () => true, isFile: () => false }])
        .mockReturnValueOnce([{ name: 'deep.ts', isDirectory: () => false, isFile: () => true }]);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);
      (path.extname as jest.Mock).mockImplementation((file) => {
        const match = file.match(/\.[^.]+$/);
        return match ? match[0] : '';
      });

      traverse('/root');

      expect(files).toHaveLength(1);
      expect(files[0]).toBe('/root/level1/level2/deep.ts');
    });
  });
});