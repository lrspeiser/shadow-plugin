import { Analyzer } from '../analyzer';
import * as fs from 'fs';

// Test: test_detectGodObjects_identifiesLargeFiles
// Verifies detectGodObjects correctly identifies files exceeding line count threshold as god objects
import { Analyzer } from '../analyzer';
import * as fs from 'fs';

jest.mock('fs');

const mockFs = fs as jest.Mocked;

describe('Analyzer.detectGodObjects', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer();
    jest.clearAllMocks();
  });

  test('identifies files exceeding line count threshold', () => {
    const mockFileAnalysis = [
      { filePath: '/src/large.ts', lineCount: 1000, functions: [], imports: [], exports: [] },
      { filePath: '/src/small.ts', lineCount: 300, functions: [], imports: [], exports: [] },
      { filePath: '/src/empty.ts', lineCount: 0, functions: [], imports: [], exports: [] }
    ];

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('mock content');

    const result = analyzer.detectGodObjects(mockFileAnalysis);

    expect(result).toHaveLength(1);
    expect(result[0].filePath).toBe('/src/large.ts');
    expect(result[0].lineCount).toBe(1000);
    expect(result[0].severity).toBe('error');
  });

  test('returns empty array when no files exceed threshold', () => {
    const mockFileAnalysis = [
      { filePath: '/src/small1.ts', lineCount: 100, functions: [], imports: [], exports: [] },
      { filePath: '/src/small2.ts', lineCount: 200, functions: [], imports: [], exports: [] }
    ];

    const result = analyzer.detectGodObjects(mockFileAnalysis);

    expect(result).toHaveLength(0);
  });

  test('handles empty file analysis array', () => {
    const result = analyzer.detectGodObjects([]);

    expect(result).toHaveLength(0);
  });
});

// Test: test_findCircularDependencies_detectsCycles
// Verifies findCircularDependencies correctly identifies circular import chains
import { Analyzer } from '../analyzer';

describe('Analyzer.findCircularDependencies', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer();
  });

  test('detects simple A->B->A circular dependency', () => {
    const mockFileAnalysis = [
      { filePath: '/src/a.ts', imports: ['/src/b.ts'], exports: [], functions: [], lineCount: 10 },
      { filePath: '/src/b.ts', imports: ['/src/a.ts'], exports: [], functions: [], lineCount: 10 }
    ];

    const result = analyzer.findCircularDependencies(mockFileAnalysis);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].cycle).toContain('/src/a.ts');
    expect(result[0].cycle).toContain('/src/b.ts');
    expect(result[0].severity).toBe('error');
  });

  test('detects complex A->B->C->A circular dependency', () => {
    const mockFileAnalysis = [
      { filePath: '/src/a.ts', imports: ['/src/b.ts'], exports: [], functions: [], lineCount: 10 },
      { filePath: '/src/b.ts', imports: ['/src/c.ts'], exports: [], functions: [], lineCount: 10 },
      { filePath: '/src/c.ts', imports: ['/src/a.ts'], exports: [], functions: [], lineCount: 10 }
    ];

    const result = analyzer.findCircularDependencies(mockFileAnalysis);

    expect(result.length).toBeGreaterThan(0);
    const cycle = result[0].cycle;
    expect(cycle).toContain('/src/a.ts');
    expect(cycle).toContain('/src/b.ts');
    expect(cycle).toContain('/src/c.ts');
  });

  test('returns empty array when no circular dependencies exist', () => {
    const mockFileAnalysis = [
      { filePath: '/src/a.ts', imports: ['/src/b.ts'], exports: [], functions: [], lineCount: 10 },
      { filePath: '/src/b.ts', imports: [], exports: [], functions: [], lineCount: 10 }
    ];

    const result = analyzer.findCircularDependencies(mockFileAnalysis);

    expect(result).toHaveLength(0);
  });
});

// Test: test_calculateComplexity_computesCyclomaticComplexity
// Verifies calculateComplexity correctly computes cyclomatic complexity for functions
import { Analyzer } from '../analyzer';

describe('Analyzer.calculateComplexity', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer();
  });

  test('simple function returns complexity 1', () => {
    const functionNode = {
      name: 'simpleFunc',
      startLine: 1,
      endLine: 3,
      body: 'return true;'
    };

    const complexity = analyzer.calculateComplexity(functionNode);

    expect(complexity).toBe(1);
  });

  test('function with if statement increases complexity', () => {
    const functionNode = {
      name: 'conditionalFunc',
      startLine: 1,
      endLine: 5,
      body: 'if (x > 0) { return x; } return 0;'
    };

    const complexity = analyzer.calculateComplexity(functionNode);

    expect(complexity).toBeGreaterThanOrEqual(2);
  });

  test('function with multiple branches returns higher complexity', () => {
    const functionNode = {
      name: 'complexFunc',
      startLine: 1,
      endLine: 10,
      body: 'if (a) {} else if (b) {} for (let i = 0; i  {
    const functionNode = {
      name: 'emptyFunc',
      startLine: 1,
      endLine: 1,
      body: ''
    };

    const complexity = analyzer.calculateComplexity(functionNode);

    expect(complexity).toBe(1);
  });
});

// Test: test_calculateHealthScore_computesAccurateScore
// Verifies calculateHealthScore computes accurate health percentage based on issues
import { Analyzer } from '../analyzer';

describe('Analyzer.calculateHealthScore', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer();
  });

  test('no issues returns 100% health score', () => {
    const issues = [];

    const score = analyzer.calculateHealthScore(issues);

    expect(score).toBe(100);
  });

  test('critical errors significantly reduce score', () => {
    const issues = [
      { severity: 'error', category: 'god-object', description: 'Large file', file: 'a.ts' },
      { severity: 'error', category: 'circular-dependency', description: 'Cycle', file: 'b.ts' },
      { severity: 'error', category: 'dead-code', description: 'Unused', file: 'c.ts' }
    ];

    const score = analyzer.calculateHealthScore(issues);

    expect(score).toBeLessThan(70);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('warnings reduce score less than errors', () => {
    const errorIssues = [
      { severity: 'error', category: 'complexity', description: 'Complex', file: 'a.ts' }
    ];
    const warningIssues = [
      { severity: 'warning', category: 'complexity', description: 'Complex', file: 'a.ts' }
    ];

    const errorScore = analyzer.calculateHealthScore(errorIssues);
    const warningScore = analyzer.calculateHealthScore(warningIssues);

    expect(warningScore).toBeGreaterThan(errorScore);
  });

  test('mix of errors and warnings calculated correctly', () => {
    const issues = [
      { severity: 'error', category: 'god-object', description: 'Large', file: 'a.ts' },
      { severity: 'warning', category: 'complexity', description: 'Complex', file: 'b.ts' },
      { severity: 'info', category: 'style', description: 'Format', file: 'c.ts' }
    ];

    const score = analyzer.calculateHealthScore(issues);

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });
});
