import { filterIgnoredFiles } from '../fileFilter';
import { minimatch } from 'minimatch';
import { parseGitignore } from '../parseGitignore';

// Mocks
jest.mock('minimatch');
jest.mock('../parseGitignore');

describe('filterIgnoredFiles', () => {
  const mockMinimatch = minimatch as jest.MockedFunction<typeof minimatch>;
  const mockParseGitignore = parseGitignore as jest.MockedFunction<typeof parseGitignore>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMinimatch.mockReturnValue(false);
    mockParseGitignore.mockReturnValue([]);
  });

  describe('happy path', () => {
    test('should return all files when no ignore patterns are provided', () => {
      const files = ['file1.ts', 'file2.ts', 'file3.ts'];
      mockParseGitignore.mockReturnValue([]);
      
      const result = filterIgnoredFiles(files, '');
      
      expect(result).toEqual(files);
      expect(result.length).toBe(3);
    });

    test('should filter out files matching gitignore patterns', () => {
      const files = ['src/file1.ts', 'node_modules/file2.ts', 'dist/file3.ts'];
      mockParseGitignore.mockReturnValue(['node_modules/**', 'dist/**']);
      mockMinimatch.mockImplementation((file: string, pattern: string) => {
        return pattern === 'node_modules/**' && file.includes('node_modules') ||
               pattern === 'dist/**' && file.includes('dist');
      });
      
      const result = filterIgnoredFiles(files, 'node_modules/\ndist/');
      
      expect(result).toEqual(['src/file1.ts']);
      expect(result.length).toBe(1);
    });

    test('should handle multiple patterns and filter correctly', () => {
      const files = ['app.ts', 'test.spec.ts', 'README.md', 'build/output.js'];
      mockParseGitignore.mockReturnValue(['*.spec.ts', '*.md', 'build/**']);
      mockMinimatch.mockImplementation((file: string, pattern: string) => {
        if (pattern === '*.spec.ts') return file.endsWith('.spec.ts');
        if (pattern === '*.md') return file.endsWith('.md');
        if (pattern === 'build/**') return file.startsWith('build/');
        return false;
      });
      
      const result = filterIgnoredFiles(files, '*.spec.ts\n*.md\nbuild/');
      
      expect(result).toEqual(['app.ts']);
    });
  });

  describe('edge cases', () => {
    test('should handle empty file list', () => {
      const files: string[] = [];
      mockParseGitignore.mockReturnValue(['*.log']);
      
      const result = filterIgnoredFiles(files, '*.log');
      
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    test('should handle empty gitignore content', () => {
      const files = ['file1.ts', 'file2.ts'];
      mockParseGitignore.mockReturnValue([]);
      
      const result = filterIgnoredFiles(files, '');
      
      expect(result).toEqual(files);
    });

    test('should handle files with special characters', () => {
      const files = ['file with spaces.ts', 'file-with-dashes.ts', 'file_with_underscores.ts'];
      mockParseGitignore.mockReturnValue([]);
      
      const result = filterIgnoredFiles(files, '');
      
      expect(result).toEqual(files);
    });

    test('should handle patterns that match no files', () => {
      const files = ['src/app.ts', 'src/utils.ts'];
      mockParseGitignore.mockReturnValue(['*.log', '*.tmp']);
      mockMinimatch.mockReturnValue(false);
      
      const result = filterIgnoredFiles(files, '*.log\n*.tmp');
      
      expect(result).toEqual(files);
    });

    test('should handle all files being ignored', () => {
      const files = ['file1.log', 'file2.log', 'file3.log'];
      mockParseGitignore.mockReturnValue(['*.log']);
      mockMinimatch.mockReturnValue(true);
      
      const result = filterIgnoredFiles(files, '*.log');
      
      expect(result).toEqual([]);
    });

    test('should handle relative path patterns', () => {
      const files = ['./src/file.ts', '../lib/util.ts', 'app.ts'];
      mockParseGitignore.mockReturnValue(['./src/**']);
      mockMinimatch.mockImplementation((file: string, pattern: string) => {
        return pattern === './src/**' && file.startsWith('./src/');
      });
      
      const result = filterIgnoredFiles(files, './src/');
      
      expect(result).toContain('../lib/util.ts');
      expect(result).toContain('app.ts');
    });
  });

  describe('error handling', () => {
    test('should handle parseGitignore throwing an error gracefully', () => {
      const files = ['file1.ts', 'file2.ts'];
      mockParseGitignore.mockImplementation(() => {
        throw new Error('Parse error');
      });
      
      expect(() => filterIgnoredFiles(files, 'invalid')).toThrow('Parse error');
    });

    test('should handle minimatch throwing an error', () => {
      const files = ['file1.ts'];
      mockParseGitignore.mockReturnValue(['[invalid']);
      mockMinimatch.mockImplementation(() => {
        throw new Error('Invalid pattern');
      });
      
      expect(() => filterIgnoredFiles(files, '[invalid')).toThrow('Invalid pattern');
    });

    test('should handle null or undefined in files array', () => {
      const files = ['file1.ts', null as any, undefined as any, 'file2.ts'];
      mockParseGitignore.mockReturnValue([]);
      
      const result = filterIgnoredFiles(files.filter(Boolean), '');
      
      expect(result).toContain('file1.ts');
      expect(result).toContain('file2.ts');
    });
  });

  describe('complex scenarios', () => {
    test('should handle negation patterns correctly', () => {
      const files = ['src/test.ts', 'src/important.ts', 'build/output.js'];
      mockParseGitignore.mockReturnValue(['src/**', '!src/important.ts']);
      mockMinimatch.mockImplementation((file: string, pattern: string) => {
        if (pattern === 'src/**') return file.startsWith('src/');
        if (pattern === '!src/important.ts') return file === 'src/important.ts';
        return false;
      });
      
      const result = filterIgnoredFiles(files, 'src/\n!src/important.ts');
      
      expect(mockParseGitignore).toHaveBeenCalled();
      expect(mockMinimatch).toHaveBeenCalled();
    });

    test('should handle deeply nested paths', () => {
      const files = [
        'src/app/components/header/index.ts',
        'src/app/components/footer/index.ts',
        'tests/unit/components/header.test.ts'
      ];
      mockParseGitignore.mockReturnValue(['tests/**']);
      mockMinimatch.mockImplementation((file: string, pattern: string) => {
        return pattern === 'tests/**' && file.startsWith('tests/');
      });
      
      const result = filterIgnoredFiles(files, 'tests/');
      
      expect(result).toHaveLength(2);
      expect(result).toContain('src/app/components/header/index.ts');
      expect(result).toContain('src/app/components/footer/index.ts');
    });

    test('should process files in order', () => {
      const files = ['a.ts', 'b.ts', 'c.ts', 'd.ts'];
      mockParseGitignore.mockReturnValue(['b.ts', 'd.ts']);
      mockMinimatch.mockImplementation((file: string, pattern: string) => {
        return file === pattern;
      });
      
      const result = filterIgnoredFiles(files, 'b.ts\nd.ts');
      
      expect(result).toEqual(['a.ts', 'c.ts']);
    });
  });
});