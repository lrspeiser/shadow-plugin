import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('traverse function', () => {
  let mockFiles: string[];
  let mockReaddirSync: jest.Mock;
  let mockJoin: jest.Mock;
  let mockExtname: jest.Mock;
  const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git']);
  const CODE_EXTENSIONS: Record<string, boolean> = {
    '.ts': true,
    '.js': true,
    '.tsx': true,
    '.jsx': true,
    '.py': true,
    '.java': true,
    '.cpp': true,
    '.c': true
  };

  beforeEach(() => {
    mockFiles = [];
    mockReaddirSync = fs.readdirSync as jest.Mock;
    mockJoin = path.join as jest.Mock;
    mockExtname = path.extname as jest.Mock;
    
    jest.clearAllMocks();
    
    mockJoin.mockImplementation((...args: string[]) => args.join('/'));
    mockExtname.mockImplementation((filename: string) => {
      const match = filename.match(/\.[^.]+$/);
      return match ? match[0] : '';
    });
  });

  const createTraverse = () => {
    const files = mockFiles;
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
    return traverse;
  };

  test('should traverse directory and collect code files', () => {
    mockReaddirSync.mockReturnValueOnce([
      { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
      { name: 'file2.js', isDirectory: () => false, isFile: () => true },
      { name: 'readme.md', isDirectory: () => false, isFile: () => true }
    ]);

    const traverse = createTraverse();
    traverse('/test/path');

    expect(mockFiles).toEqual(['/test/path/file1.ts', '/test/path/file2.js']);
    expect(mockFiles).not.toContain('/test/path/readme.md');
  });

  test('should recursively traverse subdirectories', () => {
    mockReaddirSync
      .mockReturnValueOnce([
        { name: 'src', isDirectory: () => true, isFile: () => false },
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true }
      ])
      .mockReturnValueOnce([
        { name: 'file2.js', isDirectory: () => false, isFile: () => true }
      ]);

    const traverse = createTraverse();
    traverse('/test/path');

    expect(mockReaddirSync).toHaveBeenCalledTimes(2);
    expect(mockFiles).toEqual(['/test/path/file1.ts', '/test/path/src/file2.js']);
  });

  test('should skip directories in SKIP_DIRS set', () => {
    mockReaddirSync.mockReturnValueOnce([
      { name: 'node_modules', isDirectory: () => true, isFile: () => false },
      { name: 'dist', isDirectory: () => true, isFile: () => false },
      { name: '.git', isDirectory: () => true, isFile: () => false },
      { name: 'src', isDirectory: () => true, isFile: () => false }
    ]);

    mockReaddirSync.mockReturnValueOnce([
      { name: 'file1.ts', isDirectory: () => false, isFile: () => true }
    ]);

    const traverse = createTraverse();
    traverse('/test/path');

    expect(mockReaddirSync).toHaveBeenCalledTimes(2);
    expect(mockReaddirSync).toHaveBeenCalledWith('/test/path', { withFileTypes: true });
    expect(mockReaddirSync).toHaveBeenCalledWith('/test/path/src', { withFileTypes: true });
  });

  test('should skip directories starting with dot', () => {
    mockReaddirSync.mockReturnValueOnce([
      { name: '.hidden', isDirectory: () => true, isFile: () => false },
      { name: '.cache', isDirectory: () => true, isFile: () => false },
      { name: 'visible', isDirectory: () => true, isFile: () => false }
    ]);

    mockReaddirSync.mockReturnValueOnce([
      { name: 'file1.ts', isDirectory: () => false, isFile: () => true }
    ]);

    const traverse = createTraverse();
    traverse('/test/path');

    expect(mockReaddirSync).toHaveBeenCalledTimes(2);
    expect(mockReaddirSync).not.toHaveBeenCalledWith('/test/path/.hidden', expect.any(Object));
    expect(mockReaddirSync).not.toHaveBeenCalledWith('/test/path/.cache', expect.any(Object));
  });

  test('should only collect files with CODE_EXTENSIONS', () => {
    mockReaddirSync.mockReturnValueOnce([
      { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
      { name: 'file2.tsx', isDirectory: () => false, isFile: () => true },
      { name: 'file3.py', isDirectory: () => false, isFile: () => true },
      { name: 'file4.txt', isDirectory: () => false, isFile: () => true },
      { name: 'image.png', isDirectory: () => false, isFile: () => true },
      { name: 'doc.pdf', isDirectory: () => false, isFile: () => true }
    ]);

    const traverse = createTraverse();
    traverse('/test/path');

    expect(mockFiles).toEqual([
      '/test/path/file1.ts',
      '/test/path/file2.tsx',
      '/test/path/file3.py'
    ]);
    expect(mockFiles).not.toContain('/test/path/file4.txt');
    expect(mockFiles).not.toContain('/test/path/image.png');
  });

  test('should handle empty directory', () => {
    mockReaddirSync.mockReturnValueOnce([]);

    const traverse = createTraverse();
    traverse('/test/empty');

    expect(mockFiles).toEqual([]);
    expect(mockReaddirSync).toHaveBeenCalledTimes(1);
  });

  test('should handle deeply nested directory structure', () => {
    mockReaddirSync
      .mockReturnValueOnce([
        { name: 'level1', isDirectory: () => true, isFile: () => false }
      ])
      .mockReturnValueOnce([
        { name: 'level2', isDirectory: () => true, isFile: () => false }
      ])
      .mockReturnValueOnce([
        { name: 'level3', isDirectory: () => true, isFile: () => false }
      ])
      .mockReturnValueOnce([
        { name: 'deep.ts', isDirectory: () => false, isFile: () => true }
      ]);

    const traverse = createTraverse();
    traverse('/test/path');

    expect(mockReaddirSync).toHaveBeenCalledTimes(4);
    expect(mockFiles).toEqual(['/test/path/level1/level2/level3/deep.ts']);
  });

  test('should handle mixed files and directories', () => {
    mockReaddirSync
      .mockReturnValueOnce([
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
        { name: 'subdir', isDirectory: () => true, isFile: () => false },
        { name: 'file2.js', isDirectory: () => false, isFile: () => true },
        { name: 'node_modules', isDirectory: () => true, isFile: () => false },
        { name: 'file3.py', isDirectory: () => false, isFile: () => true }
      ])
      .mockReturnValueOnce([
        { name: 'nested.tsx', isDirectory: () => false, isFile: () => true }
      ]);

    const traverse = createTraverse();
    traverse('/test/path');

    expect(mockFiles).toEqual([
      '/test/path/file1.ts',
      '/test/path/file2.js',
      '/test/path/file3.py',
      '/test/path/subdir/nested.tsx'
    ]);
  });

  test('should handle files without extensions', () => {
    mockReaddirSync.mockReturnValueOnce([
      { name: 'Makefile', isDirectory: () => false, isFile: () => true },
      { name: 'README', isDirectory: () => false, isFile: () => true },
      { name: 'file.ts', isDirectory: () => false, isFile: () => true }
    ]);

    const traverse = createTraverse();
    traverse('/test/path');

    expect(mockFiles).toEqual(['/test/path/file.ts']);
    expect(mockFiles).not.toContain('/test/path/Makefile');
  });
});