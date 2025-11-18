import { FileAccessHelper } from '../fileAccessHelper';
import * as fs from 'fs';
import * as path from 'path';

// Test: test_searchDirectory_findsMatchingFiles
// Verifies searchDirectory finds files matching criteria
import { FileAccessHelper } from '../fileAccessHelper';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

const mockFs = fs as jest.Mocked;

describe('FileAccessHelper.searchDirectory', () => {
  let helper: FileAccessHelper;

  beforeEach(() => {
    helper = new FileAccessHelper();
    jest.clearAllMocks();
  });

  test('finds TypeScript files in directory', () => {
    mockFs.readdirSync.mockReturnValue([
      'file1.ts',
      'file2.ts',
      'file3.js',
      'readme.md'
    ] as any);
    mockFs.statSync.mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);

    const result = helper.searchDirectory('/src', ['.ts']);

    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.some(f => f.endsWith('.ts'))).toBe(true);
  });

  test('filters files by extension correctly', () => {
    mockFs.readdirSync.mockReturnValue(['test.ts', 'test.js', 'test.py'] as any);
    mockFs.statSync.mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);

    const result = helper.searchDirectory('/src', ['.ts']);

    expect(result.every(f => f.endsWith('.ts'))).toBe(true);
  });

  test('respects ignore patterns', () => {
    mockFs.readdirSync.mockReturnValue(['node_modules', 'src', 'test'] as any);
    mockFs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false } as any);

    const result = helper.searchDirectory('/', ['.ts'], ['node_modules']);

    expect(result.some(f => f.includes('node_modules'))).toBe(false);
  });

  test('handles nested directory structure', () => {
    mockFs.readdirSync
      .mockReturnValueOnce(['src'] as any)
      .mockReturnValueOnce(['subdir'] as any)
      .mockReturnValueOnce(['file.ts'] as any);
    mockFs.statSync
      .mockReturnValueOnce({ isDirectory: () => true, isFile: () => false } as any)
      .mockReturnValueOnce({ isDirectory: () => true, isFile: () => false } as any)
      .mockReturnValueOnce({ isDirectory: () => false, isFile: () => true } as any);

    const result = helper.searchDirectory('/', ['.ts']);

    expect(result.length).toBeGreaterThan(0);
  });
});
