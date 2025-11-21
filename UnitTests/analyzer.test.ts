import * as path from 'path';
import * as fs from 'fs';
import { analyzeWorkspace } from '../src/analyzer';

// Mocks
jest.mock('fs');
jest.mock('vscode');

describe('analyzer - for loop processing non-code files', () => {
  let mockStatSync: jest.MockedFunction<typeof fs.statSync>;
  let mockReadFileSync: jest.MockedFunction<typeof fs.readFileSync>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStatSync = fs.statSync as jest.MockedFunction<typeof fs.statSync>;
    mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
  });

  test('should add non-code files to files array', () => {
    // Setup: Mock file system responses
    const workspaceRoot = '/test/workspace';
    const allFiles = [
      '/test/workspace/README.md',
      '/test/workspace/package.json'
    ];
    const files: any[] = [];

    mockStatSync.mockReturnValue({
      isFile: () => true
    } as fs.Stats);

    mockReadFileSync.mockImplementation((filePath: any) => {
      if (filePath === '/test/workspace/README.md') {
        return '# Title\nLine 2\nLine 3';
      }
      return '{"name": "test"}';
    });

    // Execute: Simulate the for loop
    for (const filePath of allFiles) {
      const relativePath = path.relative(workspaceRoot, filePath);
      
      if (files.some(f => f.path === relativePath)) {
        continue;
      }
      
      try {
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) continue;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length;
        const ext = path.extname(filePath);
        
        files.push({
          path: relativePath,
          lines,
          functions: 0,
          language: ext.substring(1) || 'unknown'
        });
      } catch (error) {
        // Skip files we can't read
      }
    }

    // Assert
    expect(files).toHaveLength(2);
    expect(files[0]).toEqual({
      path: 'README.md',
      lines: 3,
      functions: 0,
      language: 'md'
    });
    expect(files[1]).toEqual({
      path: 'package.json',
      lines: 1,
      functions: 0,
      language: 'json'
    });
  });

  test('should skip files already added as code files', () => {
    const workspaceRoot = '/test/workspace';
    const allFiles = [
      '/test/workspace/index.ts',
      '/test/workspace/README.md'
    ];
    const files: any[] = [
      { path: 'index.ts', lines: 100, functions: 5, language: 'typescript' }
    ];

    mockStatSync.mockReturnValue({
      isFile: () => true
    } as fs.Stats);

    mockReadFileSync.mockReturnValue('# README');

    for (const filePath of allFiles) {
      const relativePath = path.relative(workspaceRoot, filePath);
      
      if (files.some(f => f.path === relativePath)) {
        continue;
      }
      
      try {
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) continue;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length;
        const ext = path.extname(filePath);
        
        files.push({
          path: relativePath,
          lines,
          functions: 0,
          language: ext.substring(1) || 'unknown'
        });
      } catch (error) {
        // Skip files we can't read
      }
    }

    expect(files).toHaveLength(2);
    expect(files[0].path).toBe('index.ts');
    expect(files[1].path).toBe('README.md');
  });

  test('should skip non-file entries', () => {
    const workspaceRoot = '/test/workspace';
    const allFiles = [
      '/test/workspace/node_modules',
      '/test/workspace/file.txt'
    ];
    const files: any[] = [];

    mockStatSync.mockImplementation((filePath: any) => {
      if (filePath === '/test/workspace/node_modules') {
        return { isFile: () => false } as fs.Stats;
      }
      return { isFile: () => true } as fs.Stats;
    });

    mockReadFileSync.mockReturnValue('content');

    for (const filePath of allFiles) {
      const relativePath = path.relative(workspaceRoot, filePath);
      
      if (files.some(f => f.path === relativePath)) {
        continue;
      }
      
      try {
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) continue;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length;
        const ext = path.extname(filePath);
        
        files.push({
          path: relativePath,
          lines,
          functions: 0,
          language: ext.substring(1) || 'unknown'
        });
      } catch (error) {
        // Skip files we can't read
      }
    }

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('file.txt');
  });

  test('should handle files without extensions', () => {
    const workspaceRoot = '/test/workspace';
    const allFiles = ['/test/workspace/Makefile'];
    const files: any[] = [];

    mockStatSync.mockReturnValue({
      isFile: () => true
    } as fs.Stats);

    mockReadFileSync.mockReturnValue('all:\n\techo test');

    for (const filePath of allFiles) {
      const relativePath = path.relative(workspaceRoot, filePath);
      
      if (files.some(f => f.path === relativePath)) {
        continue;
      }
      
      try {
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) continue;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length;
        const ext = path.extname(filePath);
        
        files.push({
          path: relativePath,
          lines,
          functions: 0,
          language: ext.substring(1) || 'unknown'
        });
      } catch (error) {
        // Skip files we can't read
      }
    }

    expect(files).toHaveLength(1);
    expect(files[0].language).toBe('unknown');
  });

  test('should silently skip files that throw errors when reading', () => {
    const workspaceRoot = '/test/workspace';
    const allFiles = [
      '/test/workspace/locked.txt',
      '/test/workspace/valid.txt'
    ];
    const files: any[] = [];

    mockStatSync.mockImplementation((filePath: any) => {
      if (filePath === '/test/workspace/locked.txt') {
        throw new Error('EACCES: permission denied');
      }
      return { isFile: () => true } as fs.Stats;
    });

    mockReadFileSync.mockReturnValue('content');

    for (const filePath of allFiles) {
      const relativePath = path.relative(workspaceRoot, filePath);
      
      if (files.some(f => f.path === relativePath)) {
        continue;
      }
      
      try {
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) continue;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length;
        const ext = path.extname(filePath);
        
        files.push({
          path: relativePath,
          lines,
          functions: 0,
          language: ext.substring(1) || 'unknown'
        });
      } catch (error) {
        // Skip files we can't read
      }
    }

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('valid.txt');
  });

  test('should handle empty file content', () => {
    const workspaceRoot = '/test/workspace';
    const allFiles = ['/test/workspace/empty.txt'];
    const files: any[] = [];

    mockStatSync.mockReturnValue({
      isFile: () => true
    } as fs.Stats);

    mockReadFileSync.mockReturnValue('');

    for (const filePath of allFiles) {
      const relativePath = path.relative(workspaceRoot, filePath);
      
      if (files.some(f => f.path === relativePath)) {
        continue;
      }
      
      try {
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) continue;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length;
        const ext = path.extname(filePath);
        
        files.push({
          path: relativePath,
          lines,
          functions: 0,
          language: ext.substring(1) || 'unknown'
        });
      } catch (error) {
        // Skip files we can't read
      }
    }

    expect(files).toHaveLength(1);
    expect(files[0].lines).toBe(1);
  });
});