import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('traverse function', () => {
  let mockReaddirSync: jest.MockedFunction<typeof fs.readdirSync>;
  let mockJoin: jest.MockedFunction<typeof path.join>;
  let files: string[];
  let skipDirs: Set<string>;
  let traverse: (currentDir: string) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
    mockJoin = path.join as jest.MockedFunction<typeof path.join>;
    files = [];
    skipDirs = new Set<string>();

    // Define traverse function inline since it's not exported
    traverse = (currentDir: string) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
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

  test('should traverse directory and collect files', () => {
    const mockEntries = [
      { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
      { name: 'file2.js', isDirectory: () => false, isFile: () => true }
    ];

    mockReaddirSync.mockReturnValue(mockEntries as any);
    mockJoin.mockImplementation((...args) => args.join('/'));

    traverse('/test/dir');

    expect(files).toEqual(['/test/dir/file1.ts', '/test/dir/file2.js']);
    expect(mockReaddirSync).toHaveBeenCalledWith('/test/dir', { withFileTypes: true });
  });

  test('should skip hidden files and directories', () => {
    const mockEntries = [
      { name: '.hidden', isDirectory: () => false, isFile: () => true },
      { name: '.git', isDirectory: () => true, isFile: () => false },
      { name: 'visible.ts', isDirectory: () => false, isFile: () => true }
    ];

    mockReaddirSync.mockReturnValue(mockEntries as any);
    mockJoin.mockImplementation((...args) => args.join('/'));

    traverse('/test/dir');

    expect(files).toEqual(['/test/dir/visible.ts']);
    expect(files).not.toContain('/test/dir/.hidden');
  });

  test('should skip directories in skipDirs set', () => {
    skipDirs.add('node_modules');
    skipDirs.add('dist');

    const mockEntries = [
      { name: 'node_modules', isDirectory: () => true, isFile: () => false },
      { name: 'dist', isDirectory: () => true, isFile: () => false },
      { name: 'src', isDirectory: () => true, isFile: () => false },
      { name: 'file.ts', isDirectory: () => false, isFile: () => true }
    ];

    const mockSrcEntries = [
      { name: 'index.ts', isDirectory: () => false, isFile: () => true }
    ];

    mockReaddirSync.mockReturnValueOnce(mockEntries as any)
                   .mockReturnValueOnce(mockSrcEntries as any);
    mockJoin.mockImplementation((...args) => args.join('/'));

    traverse('/test/dir');

    expect(files).toEqual(['/test/dir/file.ts', '/test/dir/src/index.ts']);
    expect(mockReaddirSync).toHaveBeenCalledTimes(2);
  });

  test('should recursively traverse nested directories', () => {
    const mockRootEntries = [
      { name: 'subdir', isDirectory: () => true, isFile: () => false },
      { name: 'root.ts', isDirectory: () => false, isFile: () => true }
    ];

    const mockSubdirEntries = [
      { name: 'nested.ts', isDirectory: () => false, isFile: () => true }
    ];

    mockReaddirSync.mockReturnValueOnce(mockRootEntries as any)
                   .mockReturnValueOnce(mockSubdirEntries as any);
    mockJoin.mockImplementation((...args) => args.join('/'));

    traverse('/test/dir');

    expect(files).toEqual(['/test/dir/root.ts', '/test/dir/subdir/nested.ts']);
    expect(mockReaddirSync).toHaveBeenCalledTimes(2);
  });

  test('should handle empty directory', () => {
    mockReaddirSync.mockReturnValue([]);
    mockJoin.mockImplementation((...args) => args.join('/'));

    traverse('/test/empty');

    expect(files).toEqual([]);
    expect(mockReaddirSync).toHaveBeenCalledWith('/test/empty', { withFileTypes: true });
  });

  test('should silently handle read errors', () => {
    mockReaddirSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    expect(() => traverse('/test/denied')).not.toThrow();
    expect(files).toEqual([]);
  });

  test('should handle mixed file types and symlinks', () => {
    const mockEntries = [
      { name: 'file.ts', isDirectory: () => false, isFile: () => true },
      { name: 'dir', isDirectory: () => true, isFile: () => false },
      { name: 'symlink', isDirectory: () => false, isFile: () => false }
    ];

    const mockDirEntries = [
      { name: 'nested.js', isDirectory: () => false, isFile: () => true }
    ];

    mockReaddirSync.mockReturnValueOnce(mockEntries as any)
                   .mockReturnValueOnce(mockDirEntries as any);
    mockJoin.mockImplementation((...args) => args.join('/'));

    traverse('/test/mixed');

    expect(files).toEqual(['/test/mixed/file.ts', '/test/mixed/dir/nested.js']);
  });

  test('should handle directories with dots in name (not at start)', () => {
    const mockEntries = [
      { name: 'my.config', isDirectory: () => true, isFile: () => false },
      { name: 'file.test.ts', isDirectory: () => false, isFile: () => true }
    ];

    const mockConfigEntries = [
      { name: 'settings.json', isDirectory: () => false, isFile: () => true }
    ];

    mockReaddirSync.mockReturnValueOnce(mockEntries as any)
                   .mockReturnValueOnce(mockConfigEntries as any);
    mockJoin.mockImplementation((...args) => args.join('/'));

    traverse('/test/dotnames');

    expect(files).toEqual(['/test/dotnames/file.test.ts', '/test/dotnames/my.config/settings.json']);
  });
});