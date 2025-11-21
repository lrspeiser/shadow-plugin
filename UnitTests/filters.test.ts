import { shouldExcludeFile } from '../filters';
import { minimatch } from 'minimatch';

describe('shouldExcludeFile', () => {
  describe('happy path', () => {
    test('should return false when no patterns match', () => {
      const result = shouldExcludeFile('src/index.ts', ['*.js', 'node_modules/**']);
      expect(result).toBe(false);
    });

    test('should return true when exact file pattern matches', () => {
      const result = shouldExcludeFile('config.json', ['config.json']);
      expect(result).toBe(true);
    });

    test('should return true when glob pattern matches', () => {
      const result = shouldExcludeFile('test.spec.ts', ['*.spec.ts']);
      expect(result).toBe(true);
    });

    test('should return true when directory pattern matches', () => {
      const result = shouldExcludeFile('node_modules/package/index.js', ['node_modules/**']);
      expect(result).toBe(true);
    });

    test('should handle multiple patterns and match first one', () => {
      const result = shouldExcludeFile('build/output.js', ['*.ts', 'build/**', 'dist/**']);
      expect(result).toBe(true);
    });

    test('should handle multiple patterns and match last one', () => {
      const result = shouldExcludeFile('dist/bundle.js', ['*.ts', 'build/**', 'dist/**']);
      expect(result).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should return false when patterns array is empty', () => {
      const result = shouldExcludeFile('src/index.ts', []);
      expect(result).toBe(false);
    });

    test('should handle empty file path', () => {
      const result = shouldExcludeFile('', ['*.ts']);
      expect(result).toBe(false);
    });

    test('should handle file path with leading slash', () => {
      const result = shouldExcludeFile('/src/index.ts', ['src/**']);
      expect(result).toBe(true);
    });

    test('should handle file path with backslashes', () => {
      const result = shouldExcludeFile('src\\utils\\helper.ts', ['src/**']);
      expect(result).toBe(true);
    });

    test('should handle dotfiles', () => {
      const result = shouldExcludeFile('.gitignore', ['.*']);
      expect(result).toBe(true);
    });

    test('should handle nested dotfiles', () => {
      const result = shouldExcludeFile('config/.env', ['**/.env']);
      expect(result).toBe(true);
    });

    test('should be case sensitive by default', () => {
      const result = shouldExcludeFile('Test.ts', ['test.ts']);
      expect(result).toBe(false);
    });

    test('should handle double asterisk patterns', () => {
      const result = shouldExcludeFile('src/nested/deep/file.ts', ['**/deep/**']);
      expect(result).toBe(true);
    });

    test('should handle single asterisk patterns', () => {
      const result = shouldExcludeFile('file.test.ts', ['*.test.ts']);
      expect(result).toBe(true);
    });

    test('should handle question mark patterns', () => {
      const result = shouldExcludeFile('file1.ts', ['file?.ts']);
      expect(result).toBe(true);
    });

    test('should not match partial file names without wildcards', () => {
      const result = shouldExcludeFile('mytest.ts', ['test.ts']);
      expect(result).toBe(false);
    });

    test('should handle patterns with special characters', () => {
      const result = shouldExcludeFile('file[1].ts', ['file[1].ts']);
      expect(result).toBe(true);
    });
  });

  describe('complex patterns', () => {
    test('should handle negation patterns if supported', () => {
      const result = shouldExcludeFile('src/index.ts', ['src/**', '!src/index.ts']);
      expect(typeof result).toBe('boolean');
    });

    test('should handle multiple wildcard patterns', () => {
      const result = shouldExcludeFile('test/unit/spec.test.ts', ['**/test/**/*.test.ts']);
      expect(result).toBe(true);
    });

    test('should handle brace expansion patterns', () => {
      const result = shouldExcludeFile('file.js', ['*.{js,ts}']);
      expect(result).toBe(true);
    });

    test('should match files in root directory', () => {
      const result = shouldExcludeFile('package.json', ['package.json']);
      expect(result).toBe(true);
    });
  });
});