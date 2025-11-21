import { buildDependencyGraph } from '../dependencyAnalyzer';
import { parseDependencies } from '../dependencyAnalyzer';

// Mocks
jest.mock('../dependencyAnalyzer', () => ({ ...jest.requireActual('../dependencyAnalyzer'), parseDependencies: jest.fn() }));

describe('buildDependencyGraph', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should build dependency graph for single file with no dependencies', () => {
    const mockParseDependencies = parseDependencies as jest.MockedFunction<typeof parseDependencies>;
    mockParseDependencies.mockReturnValue([]);

    const files = [{ path: 'src/index.ts', content: 'const x = 1;' }];
    const result = buildDependencyGraph(files);

    expect(result).toBeDefined();
    expect(result['src/index.ts']).toBeDefined();
    expect(result['src/index.ts'].dependencies).toEqual([]);
    expect(result['src/index.ts'].dependents).toEqual([]);
  });

  test('should build dependency graph with simple dependencies', () => {
    const mockParseDependencies = parseDependencies as jest.MockedFunction<typeof parseDependencies>;
    mockParseDependencies
      .mockReturnValueOnce(['./utils'])
      .mockReturnValueOnce([]);

    const files = [
      { path: 'src/index.ts', content: 'import { helper } from "./utils";' },
      { path: 'src/utils.ts', content: 'export const helper = () => {};' }
    ];
    const result = buildDependencyGraph(files);

    expect(result['src/index.ts'].dependencies).toContain('src/utils.ts');
    expect(result['src/utils.ts'].dependents).toContain('src/index.ts');
  });

  test('should handle circular dependencies', () => {
    const mockParseDependencies = parseDependencies as jest.MockedFunction<typeof parseDependencies>;
    mockParseDependencies
      .mockReturnValueOnce(['./b'])
      .mockReturnValueOnce(['./a']);

    const files = [
      { path: 'src/a.ts', content: 'import { b } from "./b";' },
      { path: 'src/b.ts', content: 'import { a } from "./a";' }
    ];
    const result = buildDependencyGraph(files);

    expect(result['src/a.ts'].dependencies).toContain('src/b.ts');
    expect(result['src/b.ts'].dependencies).toContain('src/a.ts');
    expect(result['src/a.ts'].dependents).toContain('src/b.ts');
    expect(result['src/b.ts'].dependents).toContain('src/a.ts');
  });

  test('should handle multiple dependencies', () => {
    const mockParseDependencies = parseDependencies as jest.MockedFunction<typeof parseDependencies>;
    mockParseDependencies
      .mockReturnValueOnce(['./utils', './helper'])
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const files = [
      { path: 'src/index.ts', content: 'import { a } from "./utils"; import { b } from "./helper";' },
      { path: 'src/utils.ts', content: 'export const a = 1;' },
      { path: 'src/helper.ts', content: 'export const b = 2;' }
    ];
    const result = buildDependencyGraph(files);

    expect(result['src/index.ts'].dependencies).toHaveLength(2);
    expect(result['src/index.ts'].dependencies).toContain('src/utils.ts');
    expect(result['src/index.ts'].dependencies).toContain('src/helper.ts');
  });

  test('should handle empty file list', () => {
    const files: any[] = [];
    const result = buildDependencyGraph(files);

    expect(result).toEqual({});
  });

  test('should handle files with same basename in different directories', () => {
    const mockParseDependencies = parseDependencies as jest.MockedFunction<typeof parseDependencies>;
    mockParseDependencies
      .mockReturnValueOnce(['../utils/index'])
      .mockReturnValueOnce([]);

    const files = [
      { path: 'src/app/index.ts', content: 'import { x } from "../utils/index";' },
      { path: 'src/utils/index.ts', content: 'export const x = 1;' }
    ];
    const result = buildDependencyGraph(files);

    expect(result['src/app/index.ts'].dependencies).toContain('src/utils/index.ts');
    expect(result['src/utils/index.ts'].dependents).toContain('src/app/index.ts');
  });

  test('should handle non-existent dependencies gracefully', () => {
    const mockParseDependencies = parseDependencies as jest.MockedFunction<typeof parseDependencies>;
    mockParseDependencies.mockReturnValueOnce(['./nonexistent']);

    const files = [
      { path: 'src/index.ts', content: 'import { x } from "./nonexistent";' }
    ];
    const result = buildDependencyGraph(files);

    expect(result['src/index.ts']).toBeDefined();
    expect(result['src/index.ts'].dependencies.length).toBeGreaterThanOrEqual(0);
  });

  test('should normalize file paths correctly', () => {
    const mockParseDependencies = parseDependencies as jest.MockedFunction<typeof parseDependencies>;
    mockParseDependencies
      .mockReturnValueOnce(['./utils'])
      .mockReturnValueOnce([]);

    const files = [
      { path: 'src/index.ts', content: 'import { x } from "./utils";' },
      { path: 'src/utils.ts', content: 'export const x = 1;' }
    ];
    const result = buildDependencyGraph(files);

    const keys = Object.keys(result);
    expect(keys).toContain('src/index.ts');
    expect(keys).toContain('src/utils.ts');
  });

  test('should handle complex dependency chains', () => {
    const mockParseDependencies = parseDependencies as jest.MockedFunction<typeof parseDependencies>;
    mockParseDependencies
      .mockReturnValueOnce(['./b'])
      .mockReturnValueOnce(['./c'])
      .mockReturnValueOnce([]);

    const files = [
      { path: 'src/a.ts', content: 'import { b } from "./b";' },
      { path: 'src/b.ts', content: 'import { c } from "./c";' },
      { path: 'src/c.ts', content: 'export const c = 1;' }
    ];
    const result = buildDependencyGraph(files);

    expect(result['src/a.ts'].dependencies).toContain('src/b.ts');
    expect(result['src/b.ts'].dependencies).toContain('src/c.ts');
    expect(result['src/c.ts'].dependents).toContain('src/b.ts');
    expect(result['src/b.ts'].dependents).toContain('src/a.ts');
  });
});