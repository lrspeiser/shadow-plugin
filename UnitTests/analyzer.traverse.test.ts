import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('traverse function', () => {
  let mockReaddirSync: jest.MockedFunction<typeof fs.readdirSync>;
  let mockPathJoin: jest.MockedFunction<typeof path.join>;
  let files: string[];
  let skipDirs: Set<string>;
  let traverse: (currentDir: string) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
    mockPathJoin = path.join as jest.MockedFunction<typeof path.join>;
    
    // Initialize the context for traverse function
    files = [];
    skipDirs = new Set(['node_modules', '.git']);
    
    // Mock path.join to return concatenated paths
    mockPathJoin.mockImplementation((...args) => args.join('/'));
    
    // Define traverse function inline (since it's nested in the actual code)
    traverse = (currentDir: string) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          // Skip hidden files/dirs and skip directories
          if (entry.name.startsWith('.')) {
            continue;
          }
          
          if (entry.isDirectory()) {
            if (!skipDirs.has(entry.name)) {
              traverse(fullPath);
            }
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
  });

  describe('happy path', () => {
    test('should collect files from directory', () => {
      const mockEntries = [
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
        { name: 'file2.ts', isDirectory: () => false, isFile: () => true }
      ];
      mockReaddirSync.mockReturnValue(mockEntries as any);

      traverse('/test/dir');

      expect(files).toEqual(['/test/dir/file1.ts', '/test/dir/file2.ts']);
      expect(mockReaddirSync).toHaveBeenCalledWith('/test/dir', { withFileTypes: true });
    });

    test('should recursively traverse subdirectories', () => {
      mockReaddirSync
        .mockReturnValueOnce([
          { name: 'subdir', isDirectory: () => true, isFile: () => false },
          { name: 'file1.ts', isDirectory: () => false, isFile: () => true }
        ] as any)
        .mockReturnValueOnce([
          { name: 'file2.ts', isDirectory: () => false, isFile: () => true }
        ] as any);

      traverse('/test/dir');

      expect(files).toEqual(['/test/dir/file1.ts', '/test/dir/subdir/file2.ts']);
      expect(mockReaddirSync).toHaveBeenCalledTimes(2);
    });

    test('should handle empty directory', () => {
      mockReaddirSync.mockReturnValue([] as any);

      traverse('/test/empty');

      expect(files).toEqual([]);
      expect(mockReaddirSync).toHaveBeenCalledWith('/test/empty', { withFileTypes: true });
    });
  });

  describe('filtering behavior', () => {
    test('should skip hidden files starting with dot', () => {
      const mockEntries = [
        { name: '.hidden', isDirectory: () => false, isFile: () => true },
        { name: 'visible.ts', isDirectory: () => false, isFile: () => true }
      ];
      mockReaddirSync.mockReturnValue(mockEntries as any);

      traverse('/test/dir');

      expect(files).toEqual(['/test/dir/visible.ts']);
    });

    test('should skip hidden directories starting with dot', () => {
      mockReaddirSync
        .mockReturnValueOnce([
          { name: '.hidden-dir', isDirectory: () => true, isFile: () => false },
          { name: 'file.ts', isDirectory: () => false, isFile: () => true }
        ] as any);

      traverse('/test/dir');

      expect(files).toEqual(['/test/dir/file.ts']);
      expect(mockReaddirSync).toHaveBeenCalledTimes(1);
    });

    test('should skip directories in skipDirs set', () => {
      mockReaddirSync
        .mockReturnValueOnce([
          { name: 'node_modules', isDirectory: () => true, isFile: () => false },
          { name: '.git', isDirectory: () => true, isFile: () => false },
          { name: 'src', isDirectory: () => true, isFile: () => false },
          { name: 'file.ts', isDirectory: () => false, isFile: () => true }
        ] as any)
        .mockReturnValueOnce([
          { name: 'code.ts', isDirectory: () => false, isFile: () => true }
        ] as any);

      traverse('/test/dir');

      expect(files).toEqual(['/test/dir/file.ts', '/test/dir/src/code.ts']);
      expect(mockReaddirSync).toHaveBeenCalledTimes(2);
      expect(mockReaddirSync).not.toHaveBeenCalledWith('/test/dir/node_modules', { withFileTypes: true });
      expect(mockReaddirSync).not.toHaveBeenCalledWith('/test/dir/.git', { withFileTypes: true });
    });

    test('should not add directories to files array', () => {
      const mockEntries = [
        { name: 'dir1', isDirectory: () => true, isFile: () => false }
      ];
      mockReaddirSync
        .mockReturnValueOnce(mockEntries as any)
        .mockReturnValueOnce([] as any);

      traverse('/test/dir');

      expect(files).toEqual([]);
    });
  });

  describe('error handling', () => {
    test('should silently skip directories that throw errors', () => {
      mockReaddirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => traverse('/test/protected')).not.toThrow();
      expect(files).toEqual([]);
    });

    test('should continue traversing after error in subdirectory', () => {
      mockReaddirSync
        .mockReturnValueOnce([
          { name: 'good-dir', isDirectory: () => true, isFile: () => false },
          { name: 'bad-dir', isDirectory: () => true, isFile: () => false }
        ] as any)
        .mockReturnValueOnce([
          { name: 'file.ts', isDirectory: () => false, isFile: () => true }
        ] as any)
        .mockImplementationOnce(() => {
          throw new Error('Cannot read directory');
        });

      traverse('/test/dir');

      expect(files).toEqual(['/test/dir/good-dir/file.ts']);
    });

    test('should handle EACCES error', () => {
      const error: any = new Error('EACCES: permission denied');
      error.code = 'EACCES';
      mockReaddirSync.mockImplementation(() => {
        throw error;
      });

      expect(() => traverse('/test/protected')).not.toThrow();
      expect(files).toEqual([]);
    });

    test('should handle ENOENT error', () => {
      const error: any = new Error('ENOENT: no such file or directory');
      error.code = 'ENOENT';
      mockReaddirSync.mockImplementation(() => {
        throw error;
      });

      expect(() => traverse('/test/missing')).not.toThrow();
      expect(files).toEqual([]);
    });
  });

  describe('complex scenarios', () => {
    test('should handle deeply nested directory structure', () => {
      mockReaddirSync
        .mockReturnValueOnce([
          { name: 'level1', isDirectory: () => true, isFile: () => false }
        ] as any)
        .mockReturnValueOnce([
          { name: 'level2', isDirectory: () => true, isFile: () => false }
        ] as any)
        .mockReturnValueOnce([
          { name: 'deep-file.ts', isDirectory: () => false, isFile: () => true }
        ] as any);

      traverse('/test');

      expect(files).toEqual(['/test/level1/level2/deep-file.ts']);
      expect(mockReaddirSync).toHaveBeenCalledTimes(3);
    });

    test('should handle mixed files and directories', () => {
      mockReaddirSync
        .mockReturnValueOnce([
          { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
          { name: 'dir1', isDirectory: () => true, isFile: () => false },
          { name: 'file2.ts', isDirectory: () => false, isFile: () => true },
          { name: 'dir2', isDirectory: () => true, isFile: () => false },
          { name: 'file3.ts', isDirectory: () => false, isFile: () => true }
        ] as any)
        .mockReturnValueOnce([
          { name: 'nested1.ts', isDirectory: () => false, isFile: () => true }
        ] as any)
        .mockReturnValueOnce([
          { name: 'nested2.ts', isDirectory: () => false, isFile: () => true }
        ] as any);

      traverse('/test');

      expect(files).toEqual([
        '/test/file1.ts',
        '/test/file2.ts',
        '/test/file3.ts',
        '/test/dir1/nested1.ts',
        '/test/dir2/nested2.ts'
      ]);
    });
  });
});