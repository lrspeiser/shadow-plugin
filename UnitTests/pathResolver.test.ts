import { resolveModulePath } from '../pathResolver';
import * as path from 'path';
import * as fs from 'fs';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('resolveModulePath', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.resolve = jest.fn((basePath: string, modulePath: string) => {
      return `${basePath}/${modulePath}`;
    });
    mockPath.join = jest.fn((...parts: string[]) => {
      return parts.join('/');
    });
    mockPath.dirname = jest.fn((p: string) => {
      const parts = p.split('/');
      parts.pop();
      return parts.join('/');
    });
    mockPath.extname = jest.fn((p: string) => {
      const match = p.match(/\.[^.]+$/);
      return match ? match[0] : '';
    });
    mockPath.isAbsolute = jest.fn((p: string) => {
      return p.startsWith('/') || /^[A-Za-z]:/.test(p);
    });
  });

  test('should resolve absolute module path when file exists', () => {
    const basePath = '/project/src';
    const modulePath = '/project/lib/module.ts';
    
    mockPath.isAbsolute.mockReturnValue(true);
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    
    const result = resolveModulePath(basePath, modulePath);
    
    expect(result).toBe(modulePath);
    expect(mockPath.isAbsolute).toHaveBeenCalledWith(modulePath);
    expect(mockFs.existsSync).toHaveBeenCalledWith(modulePath);
  });

  test('should resolve relative module path with automatic extension detection', () => {
    const basePath = '/project/src/components';
    const modulePath = './utils/helper';
    const expectedPath = '/project/src/components/utils/helper';
    
    mockPath.isAbsolute.mockReturnValue(false);
    mockPath.resolve.mockReturnValue(expectedPath);
    mockPath.extname.mockReturnValue('');
    
    mockFs.existsSync = jest.fn((p: string) => {
      return p === `${expectedPath}.ts`;
    });
    
    const result = resolveModulePath(basePath, modulePath);
    
    expect(result).toBe(`${expectedPath}.ts`);
    expect(mockPath.resolve).toHaveBeenCalledWith(basePath, modulePath);
    expect(mockFs.existsSync).toHaveBeenCalled();
  });

  test('should resolve node_modules path when relative path not found', () => {
    const basePath = '/project/src';
    const modulePath = 'lodash';
    const nodeModulesPath = '/project/node_modules/lodash';
    
    mockPath.isAbsolute.mockReturnValue(false);
    mockPath.resolve.mockReturnValueOnce('/project/src/lodash');
    mockPath.dirname.mockReturnValue('/project/src');
    mockPath.join.mockReturnValue(nodeModulesPath);
    
    let callCount = 0;
    mockFs.existsSync = jest.fn((p: string) => {
      callCount++;
      if (callCount <= 6) return false;
      return p === nodeModulesPath;
    });
    
    const result = resolveModulePath(basePath, modulePath);
    
    expect(result).toBe(nodeModulesPath);
    expect(mockPath.join).toHaveBeenCalledWith(expect.any(String), 'node_modules', modulePath);
  });

  test('should try multiple extensions (.ts, .tsx, .js, .jsx) when no extension provided', () => {
    const basePath = '/project/src';
    const modulePath = './component';
    const resolvedBase = '/project/src/component';
    
    mockPath.isAbsolute.mockReturnValue(false);
    mockPath.resolve.mockReturnValue(resolvedBase);
    mockPath.extname.mockReturnValue('');
    
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
    let callCount = 0;
    
    mockFs.existsSync = jest.fn((p: string) => {
      callCount++;
      return p === `${resolvedBase}.jsx`;
    });
    
    const result = resolveModulePath(basePath, modulePath);
    
    expect(result).toBe(`${resolvedBase}.jsx`);
    expect(mockFs.existsSync).toHaveBeenCalledWith(`${resolvedBase}.ts`);
    expect(mockFs.existsSync).toHaveBeenCalledWith(`${resolvedBase}.tsx`);
    expect(mockFs.existsSync).toHaveBeenCalledWith(`${resolvedBase}.js`);
    expect(mockFs.existsSync).toHaveBeenCalledWith(`${resolvedBase}.jsx`);
  });

  test('should resolve index file when path is a directory', () => {
    const basePath = '/project/src';
    const modulePath = './components';
    const resolvedBase = '/project/src/components';
    
    mockPath.isAbsolute.mockReturnValue(false);
    mockPath.resolve.mockReturnValue(resolvedBase);
    mockPath.extname.mockReturnValue('');
    mockPath.join.mockImplementation((...parts: string[]) => parts.join('/'));
    
    mockFs.existsSync = jest.fn((p: string) => {
      return p === `${resolvedBase}/index.ts`;
    });
    
    const result = resolveModulePath(basePath, modulePath);
    
    expect(result).toBe(`${resolvedBase}/index.ts`);
    expect(mockFs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/index.ts'));
  });

  test('should return original path when file cannot be resolved', () => {
    const basePath = '/project/src';
    const modulePath = './nonexistent';
    const resolvedBase = '/project/src/nonexistent';
    
    mockPath.isAbsolute.mockReturnValue(false);
    mockPath.resolve.mockReturnValue(resolvedBase);
    mockPath.extname.mockReturnValue('');
    mockPath.dirname.mockReturnValue('/project/src');
    
    mockFs.existsSync = jest.fn().mockReturnValue(false);
    
    const result = resolveModulePath(basePath, modulePath);
    
    expect(result).toBe(resolvedBase);
  });

  test('should handle module path with existing extension', () => {
    const basePath = '/project/src';
    const modulePath = './utils/helper.ts';
    const resolvedPath = '/project/src/utils/helper.ts';
    
    mockPath.isAbsolute.mockReturnValue(false);
    mockPath.resolve.mockReturnValue(resolvedPath);
    mockPath.extname.mockReturnValue('.ts');
    
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    
    const result = resolveModulePath(basePath, modulePath);
    
    expect(result).toBe(resolvedPath);
    expect(mockFs.existsSync).toHaveBeenCalledWith(resolvedPath);
  });

  test('should handle scoped npm packages', () => {
    const basePath = '/project/src';
    const modulePath = '@types/node';
    const nodeModulesPath = '/project/node_modules/@types/node';
    
    mockPath.isAbsolute.mockReturnValue(false);
    mockPath.resolve.mockReturnValue('/project/src/@types/node');
    mockPath.dirname.mockReturnValue('/project/src');
    mockPath.join.mockReturnValue(nodeModulesPath);
    mockPath.extname.mockReturnValue('');
    
    let callCount = 0;
    mockFs.existsSync = jest.fn((p: string) => {
      callCount++;
      if (callCount <= 6) return false;
      return p === nodeModulesPath;
    });
    
    const result = resolveModulePath(basePath, modulePath);
    
    expect(result).toBe(nodeModulesPath);
    expect(mockPath.join).toHaveBeenCalledWith(expect.any(String), 'node_modules', modulePath);
  });

  test('should traverse up directory tree to find node_modules', () => {
    const basePath = '/project/src/components/nested';
    const modulePath = 'react';
    const nodeModulesPath = '/project/node_modules/react';
    
    mockPath.isAbsolute.mockReturnValue(false);
    mockPath.resolve.mockReturnValue('/project/src/components/nested/react');
    mockPath.extname.mockReturnValue('');
    
    const dirnameResults = [
      '/project/src/components/nested',
      '/project/src/components',
      '/project/src',
      '/project',
      '/'
    ];
    let dirnameIndex = 0;
    mockPath.dirname.mockImplementation(() => dirnameResults[dirnameIndex++] || '/');
    
    mockPath.join.mockImplementation((...parts: string[]) => parts.join('/'));
    
    let existsCallCount = 0;
    mockFs.existsSync = jest.fn((p: string) => {
      existsCallCount++;
      return p === nodeModulesPath;
    });
    
    const result = resolveModulePath(basePath, modulePath);
    
    expect(mockPath.dirname).toHaveBeenCalled();
    expect(mockPath.join).toHaveBeenCalledWith(expect.any(String), 'node_modules', modulePath);
  });
});