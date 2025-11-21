import { detectTestFramework } from '../framework';
import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('detectTestFramework', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.join = jest.fn((...args) => args.join('/'));
  });

  test('should detect Jest framework when jest is in devDependencies', () => {
    const packageJson = JSON.stringify({
      devDependencies: {
        jest: '^29.0.0'
      }
    });
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue(packageJson);

    const result = detectTestFramework('/test/project');

    expect(result).toBe('jest');
    expect(mockFs.readFileSync).toHaveBeenCalledWith('/test/project/package.json', 'utf8');
  });

  test('should detect Mocha framework when mocha is in devDependencies', () => {
    const packageJson = JSON.stringify({
      devDependencies: {
        mocha: '^10.0.0'
      }
    });
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue(packageJson);

    const result = detectTestFramework('/test/project');

    expect(result).toBe('mocha');
  });

  test('should detect Vitest framework when vitest is in devDependencies', () => {
    const packageJson = JSON.stringify({
      devDependencies: {
        vitest: '^0.34.0'
      }
    });
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue(packageJson);

    const result = detectTestFramework('/test/project');

    expect(result).toBe('vitest');
  });

  test('should detect framework in dependencies instead of devDependencies', () => {
    const packageJson = JSON.stringify({
      dependencies: {
        jest: '^29.0.0'
      }
    });
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue(packageJson);

    const result = detectTestFramework('/test/project');

    expect(result).toBe('jest');
  });

  test('should return null when package.json does not exist', () => {
    mockFs.existsSync = jest.fn().mockReturnValue(false);

    const result = detectTestFramework('/test/project');

    expect(result).toBeNull();
    expect(mockFs.readFileSync).not.toHaveBeenCalled();
  });

  test('should return null when no test framework is found', () => {
    const packageJson = JSON.stringify({
      devDependencies: {
        webpack: '^5.0.0',
        typescript: '^4.0.0'
      }
    });
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue(packageJson);

    const result = detectTestFramework('/test/project');

    expect(result).toBeNull();
  });

  test('should handle invalid JSON in package.json', () => {
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue('{ invalid json }');

    const result = detectTestFramework('/test/project');

    expect(result).toBeNull();
  });

  test('should handle file read errors gracefully', () => {
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockImplementation(() => {
      throw new Error('Permission denied');
    });

    const result = detectTestFramework('/test/project');

    expect(result).toBeNull();
  });

  test('should handle empty package.json', () => {
    const packageJson = JSON.stringify({});
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue(packageJson);

    const result = detectTestFramework('/test/project');

    expect(result).toBeNull();
  });

  test('should prioritize Jest over other frameworks when multiple exist', () => {
    const packageJson = JSON.stringify({
      devDependencies: {
        jest: '^29.0.0',
        mocha: '^10.0.0',
        vitest: '^0.34.0'
      }
    });
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue(packageJson);

    const result = detectTestFramework('/test/project');

    expect(result).toBe('jest');
  });

  test('should handle package.json with null dependencies', () => {
    const packageJson = JSON.stringify({
      devDependencies: null,
      dependencies: null
    });
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue(packageJson);

    const result = detectTestFramework('/test/project');

    expect(result).toBeNull();
  });
});