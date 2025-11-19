import { Analyzer } from '../analyzer';
import * as fs from 'fs';

// Test: test_detectGodObjects_identifies_large_files
// Verifies detectGodObjects correctly identifies files exceeding line count threshold
import { Analyzer } from '../analyzer';
import * as fs from 'fs';

jest.mock('fs');

describe('Analyzer.detectGodObjects', () => {
  let analyzer: Analyzer;
  const mockFs = fs as jest.Mocked;

  beforeEach(() => {
    jest.clearAllMocks();
    analyzer = new Analyzer('');
  });

  it('should identify files exceeding line count threshold', () => {
    const largeFileContent = 'line\n'.repeat(600);
    mockFs.readFileSync.mockReturnValue(largeFileContent);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);

    const result = analyzer.detectGodObjects(['src/large.ts'], 500);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('file');
    expect(result[0]).toHaveProperty('lines');
    expect(result[0].lines).toBeGreaterThan(500);
  });

  it('should return empty array when no files exceed threshold', () => {
    const smallFileContent = 'line\n'.repeat(100);
    mockFs.readFileSync.mockReturnValue(smallFileContent);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);

    const result = analyzer.detectGodObjects(['src/small.ts'], 500);

    expect(result).toHaveLength(0);
  });

  it('should handle empty files', () => {
    mockFs.readFileSync.mockReturnValue('');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);

    const result = analyzer.detectGodObjects(['src/empty.ts'], 500);

    expect(result).toHaveLength(0);
  });

  it('should handle multiple files with mixed sizes', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);
    mockFs.readFileSync.mockImplementation((path: any) => {
      if (path.includes('large')) return 'line\n'.repeat(600);
      return 'line\n'.repeat(100);
    });

    const result = analyzer.detectGodObjects(['src/large.ts', 'src/small.ts'], 500);

    expect(result).toHaveLength(1);
    expect(result[0].file).toContain('large');
  });
});

// Test: test_findCircularDependencies_detects_cycles
// Verifies findCircularDependencies correctly identifies circular import chains
import { Analyzer } from '../analyzer';
import * as fs from 'fs';

jest.mock('fs');

describe('Analyzer.findCircularDependencies', () => {
  let analyzer: Analyzer;
  const mockFs = fs as jest.Mocked;

  beforeEach(() => {
    jest.clearAllMocks();
    analyzer = new Analyzer('');
  });

  it('should detect simple A->B->A cycle', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);
    mockFs.readFileSync.mockImplementation((path: any) => {
      if (path.includes('fileA.ts')) return "import { b } from './fileB';";
      if (path.includes('fileB.ts')) return "import { a } from './fileA';";
      return '';
    });

    const result = analyzer.findCircularDependencies(['src/fileA.ts', 'src/fileB.ts']);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toContain('fileA');
    expect(result[0]).toContain('fileB');
  });

  it('should detect complex A->B->C->A cycle', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);
    mockFs.readFileSync.mockImplementation((path: any) => {
      if (path.includes('fileA.ts')) return "import { b } from './fileB';";
      if (path.includes('fileB.ts')) return "import { c } from './fileC';";
      if (path.includes('fileC.ts')) return "import { a } from './fileA';";
      return '';
    });

    const result = analyzer.findCircularDependencies(['src/fileA.ts', 'src/fileB.ts', 'src/fileC.ts']);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toContain('fileA');
    expect(result[0]).toContain('fileB');
    expect(result[0]).toContain('fileC');
  });

  it('should return empty array when no cycles present', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);
    mockFs.readFileSync.mockImplementation((path: any) => {
      if (path.includes('fileA.ts')) return "import { b } from './fileB';";
      if (path.includes('fileB.ts')) return "import { c } from './fileC';";
      if (path.includes('fileC.ts')) return "const c = 1;";
      return '';
    });

    const result = analyzer.findCircularDependencies(['src/fileA.ts', 'src/fileB.ts', 'src/fileC.ts']);

    expect(result).toHaveLength(0);
  });
});

// Test: test_calculateComplexity_measures_cyclomatic_complexity
// Verifies calculateComplexity correctly measures function cyclomatic complexity
import { Analyzer } from '../analyzer';

describe('Analyzer.calculateComplexity', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer('');
  });

  it('should return complexity 1 for linear code', () => {
    const simpleCode = `
      function simple() {
        const a = 1;
        const b = 2;
        return a + b;
      }
    `;

    const result = analyzer.calculateComplexity(simpleCode);

    expect(result).toBe(1);
  });

  it('should increase complexity for if statements', () => {
    const codeWithIf = `
      function withIf(x: number) {
        if (x > 0) {
          return 1;
        }
        return 0;
      }
    `;

    const result = analyzer.calculateComplexity(codeWithIf);

    expect(result).toBeGreaterThan(1);
  });

  it('should increase complexity for loops', () => {
    const codeWithLoop = `
      function withLoop(arr: number[]) {
        for (let i = 0; i  0) {
            return arr[i];
          }
        }
        return 0;
      }
    `;

    const result = analyzer.calculateComplexity(codeWithLoop);

    expect(result).toBeGreaterThan(2);
  });

  it('should handle nested conditionals', () => {
    const nestedCode = `
      function nested(x: number, y: number) {
        if (x > 0) {
          if (y > 0) {
            return 1;
          }
          return 2;
        }
        return 0;
      }
    `;

    const result = analyzer.calculateComplexity(nestedCode);

    expect(result).toBeGreaterThan(2);
  });
});

// Test: test_calculateHealthScore_computes_percentage
// Verifies calculateHealthScore correctly computes overall codebase health percentage based on issues
import { Analyzer } from '../analyzer';

describe('Analyzer.calculateHealthScore', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer('');
  });

  it('should return 100% for no issues', () => {
    const score = analyzer.calculateHealthScore([]);

    expect(score).toBe(100);
  });

  it('should return value between 0-100', () => {
    const issues = [
      { severity: 'error', category: 'complexity', description: 'test', file: 'test.ts' },
      { severity: 'warning', category: 'style', description: 'test', file: 'test.ts' }
    ];

    const score = analyzer.calculateHealthScore(issues);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should decrease score with issue count', () => {
    const fewIssues = [{ severity: 'warning', category: 'style', description: 'test', file: 'test.ts' }];
    const manyIssues = [
      { severity: 'warning', category: 'style', description: 'test1', file: 'test.ts' },
      { severity: 'warning', category: 'style', description: 'test2', file: 'test.ts' },
      { severity: 'warning', category: 'style', description: 'test3', file: 'test.ts' }
    ];

    const scoreFew = analyzer.calculateHealthScore(fewIssues);
    const scoreMany = analyzer.calculateHealthScore(manyIssues);

    expect(scoreMany).toBeLessThan(scoreFew);
  });

  it('should weight errors more than warnings', () => {
    const withErrors = [
      { severity: 'error', category: 'complexity', description: 'test', file: 'test.ts' },
      { severity: 'error', category: 'complexity', description: 'test', file: 'test.ts' }
    ];
    const withWarnings = [
      { severity: 'warning', category: 'style', description: 'test', file: 'test.ts' },
      { severity: 'warning', category: 'style', description: 'test', file: 'test.ts' }
    ];

    const scoreErrors = analyzer.calculateHealthScore(withErrors);
    const scoreWarnings = analyzer.calculateHealthScore(withWarnings);

    expect(scoreErrors).toBeLessThan(scoreWarnings);
  });
});
