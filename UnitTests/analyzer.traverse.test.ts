import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('traverse', () => {
  let files: string[];
  const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git']);
  const CODE_EXTENSIONS: Record<string, boolean> = {
    '.ts': true,
    '.tsx': true,
    '.js': true,
    '.jsx': true,
    '.py': true,
    '.java': true
  };

  const traverse = (currentPath: string) => {
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

  beforeEach(() => {
    files = [];
    jest.clearAllMocks();
    (path.join as jest.Mock).mockImplementation((...args: string[]) => args.join('/'));
    (path.extname as jest.Mock).mockImplementation((filename: string) => {
      const parts = filename.split('.');
      return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
    });
  });

  test('should collect files with valid code extensions', () => {
    const mockEntries = [
      { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
      { name: 'file2.js', isDirectory: () => false, isFile: () => true },
      { name: 'file3.txt', isDirectory: () => false, isFile: () => true }
    ];

    (fs.readdirSync as jest.Mock).mockReturnValue(mockEntries);

    traverse('/test/path');

    expect(files).toHaveLength(2);
    expect(files).toContain('/test/path/file1.ts');
    expect(files).toContain('/test/path/file2.js');
    expect(files).not.toContain('/test/path/file3.txt');
  });

  test('should recursively traverse subdirectories', () => {
    (fs.readdirSync as jest.Mock)
      .mockReturnValueOnce([
        { name: 'src', isDirectory: () => true, isFile: () => false },
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true }
      ])
      .mockReturnValueOnce([
        { name: 'file2.js', isDirectory: () => false, isFile: () => true }
      ]);

    traverse('/test/path');

    expect(files).toHaveLength(2);
    expect(files).toContain('/test/path/file1.ts');
    expect(files).toContain('/test/path/src/file2.js');
    expect(fs.readdirSync).toHaveBeenCalledTimes(2);
  });

  test('should skip directories in SKIP_DIRS set', () => {
    const mockEntries = [
      { name: 'node_modules', isDirectory: () => true, isFile: () => false },
      { name: 'dist', isDirectory: () => true, isFile: () => false },
      { name: 'src', isDirectory: () => true, isFile: () => false }
    ];

    (fs.readdirSync as jest.Mock)
      .mockReturnValueOnce(mockEntries)
      .mockReturnValueOnce([
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true }
      ]);

    traverse('/test/path');

    expect(fs.readdirSync).toHaveBeenCalledTimes(2);
    expect(fs.readdirSync).toHaveBeenCalledWith('/test/path', { withFileTypes: true });
    expect(fs.readdirSync).toHaveBeenCalledWith('/test/path/src', { withFileTypes: true });
    expect(files).toHaveLength(1);
  });

  test('should skip hidden directories starting with dot', () => {
    const mockEntries = [
      { name: '.git', isDirectory: () => true, isFile: () => false },
      { name: '.vscode', isDirectory: () => true, isFile: () => false },
      { name: 'src', isDirectory: () => true, isFile: () => false }
    ];

    (fs.readdirSync as jest.Mock)
      .mockReturnValueOnce(mockEntries)
      .mockReturnValueOnce([
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true }
      ]);

    traverse('/test/path');

    expect(fs.readdirSync).toHaveBeenCalledTimes(2);
    expect(files).toHaveLength(1);
    expect(files).toContain('/test/path/src/file1.ts');
  });

  test('should handle empty directories', () => {
    (fs.readdirSync as jest.Mock).mockReturnValue([]);

    traverse('/test/path');

    expect(files).toHaveLength(0);
    expect(fs.readdirSync).toHaveBeenCalledWith('/test/path', { withFileTypes: true });
  });

  test('should handle multiple file types correctly', () => {
    const mockEntries = [
      { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
      { name: 'file2.tsx', isDirectory: () => false, isFile: () => true },
      { name: 'file3.py', isDirectory: () => false, isFile: () => true },
      { name: 'file4.java', isDirectory: () => false, isFile: () => true },
      { name: 'README.md', isDirectory: () => false, isFile: () => true }
    ];

    (fs.readdirSync as jest.Mock).mockReturnValue(mockEntries);

    traverse('/test/path');

    expect(files).toHaveLength(4);
    expect(files).toContain('/test/path/file1.ts');
    expect(files).toContain('/test/path/file2.tsx');
    expect(files).toContain('/test/path/file3.py');
    expect(files).toContain('/test/path/file4.java');
    expect(files).not.toContain('/test/path/README.md');
  });

  test('should handle deeply nested directory structures', () => {
    (fs.readdirSync as jest.Mock)
      .mockReturnValueOnce([
        { name: 'level1', isDirectory: () => true, isFile: () => false }
      ])
      .mockReturnValueOnce([
        { name: 'level2', isDirectory: () => true, isFile: () => false }
      ])
      .mockReturnValueOnce([
        { name: 'file.ts', isDirectory: () => false, isFile: () => true }
      ]);

    traverse('/test/path');

    expect(files).toHaveLength(1);
    expect(files).toContain('/test/path/level1/level2/file.ts');
    expect(fs.readdirSync).toHaveBeenCalledTimes(3);
  });

  test('should handle mixed files and directories', () => {
    (fs.readdirSync as jest.Mock)
      .mockReturnValueOnce([
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
        { name: 'subdir', isDirectory: () => true, isFile: () => false },
        { name: 'file2.js', isDirectory: () => false, isFile: () => true }
      ])
      .mockReturnValueOnce([
        { name: 'file3.tsx', isDirectory: () => false, isFile: () => true }
      ]);

    traverse('/test/path');

    expect(files).toHaveLength(3);
    expect(files).toContain('/test/path/file1.ts');
    expect(files).toContain('/test/path/file2.js');
    expect(files).toContain('/test/path/subdir/file3.tsx');
  });

  test('should not add files without extensions', () => {
    const mockEntries = [
      { name: 'Makefile', isDirectory: () => false, isFile: () => true },
      { name: 'Dockerfile', isDirectory: () => false, isFile: () => true },
      { name: 'file.ts', isDirectory: () => false, isFile: () => true }
    ];

    (fs.readdirSync as jest.Mock).mockReturnValue(mockEntries);

    traverse('/test/path');

    expect(files).toHaveLength(1);
    expect(files).toContain('/test/path/file.ts');
  });
}