import { FileAccessHelper } from '../fileAccessHelper';
import * as fs from 'fs';

// Test: test_shouldSearchFile_applies_ignore_patterns
// Verifies shouldSearchFile correctly filters files based on ignore patterns and file extensions
import { FileAccessHelper } from '../fileAccessHelper';

describe('FileAccessHelper.shouldSearchFile', () => {
  let helper: FileAccessHelper;
  
  beforeEach(() => {
    helper = new FileAccessHelper();
  });
  
  it('excludes files in node_modules directory', () => {
    const result = helper.shouldSearchFile('project/node_modules/package/index.js');
    
    expect(result).toBe(false);
  });
  
  it('excludes files in .git directory', () => {
    const result = helper.shouldSearchFile('project/.git/config');
    
    expect(result).toBe(false);
  });
  
  it('includes TypeScript source files', () => {
    const result = helper.shouldSearchFile('src/analyzer.ts');
    
    expect(result).toBe(true);
  });
  
  it('includes JavaScript source files', () => {
    const result = helper.shouldSearchFile('src/module.js');
    
    expect(result).toBe(true);
  });
  
  it('excludes binary files', () => {
    const result = helper.shouldSearchFile('assets/image.png');
    
    expect(result).toBe(false);
  });
  
  it('excludes compiled output files', () => {
    const result = helper.shouldSearchFile('dist/bundle.js');
    
    expect(result).toBe(false);
  });
  
  it('handles dot files according to configuration', () => {
    const result = helper.shouldSearchFile('.eslintrc.js');
    
    expect(typeof result).toBe('boolean');
  });
  
  it('includes Python source files', () => {
    const result = helper.shouldSearchFile('scripts/analyze.py');
    
    expect(result).toBe(true);
  });
});

// Test: test_searchDirectory_scans_recursively
// Verifies searchDirectory recursively scans directories and collects matching files
import { FileAccessHelper } from '../fileAccessHelper';
import * as fs from 'fs';

jest.mock('fs');

describe('FileAccessHelper.searchDirectory', () => {
  let helper: FileAccessHelper;
  let mockReaddirSync: jest.Mock;
  let mockStatSync: jest.Mock;
  
  beforeEach(() => {
    helper = new FileAccessHelper();
    mockReaddirSync = jest.fn();
    mockStatSync = jest.fn();
    (fs.readdirSync as any) = mockReaddirSync;
    (fs.statSync as any) = mockStatSync;
  });
  
  it('recursively scans directory structure', () => {
    mockReaddirSync.mockReturnValueOnce(['src', 'test'])
                   .mockReturnValueOnce(['analyzer.ts'])
                   .mockReturnValueOnce(['analyzer.test.ts']);
    
    mockStatSync.mockReturnValueOnce({ isDirectory: () => true })
                .mockReturnValueOnce({ isDirectory: () => true })
                .mockReturnValueOnce({ isDirectory: () => false })
                .mockReturnValueOnce({ isDirectory: () => false });
    
    const files = helper.searchDirectory('/project');
    
    expect(files.length).toBeGreaterThan(0);
    expect(mockReaddirSync).toHaveBeenCalledTimes(3);
  });
  
  it('collects only matching file extensions', () => {
    mockReaddirSync.mockReturnValueOnce(['file.ts', 'file.txt', 'file.js']);
    mockStatSync.mockReturnValue({ isDirectory: () => false });
    
    const files = helper.searchDirectory('/project', ['.ts', '.js']);
    
    expect(files).not.toContain('/project/file.txt');
  });
  
  it('handles empty directories gracefully', () => {
    mockReaddirSync.mockReturnValueOnce([]);
    
    const files = helper.searchDirectory('/empty');
    
    expect(files).toEqual([]);
  });
  
  it('skips ignored directories', () => {
    mockReaddirSync.mockReturnValueOnce(['src', 'node_modules']);
    mockStatSync.mockReturnValue({ isDirectory: () => true });
    
    const files = helper.searchDirectory('/project');
    
    expect(mockReaddirSync).not.toHaveBeenCalledWith(
      expect.stringContaining('node_modules')
    );
  });
});
