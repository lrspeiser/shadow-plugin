import { Analyzer } from '../analyzer';
import { Cache } from '../cache';
import * as fs from 'fs';

// Test: test_detectGodObjects_identifies_large_files
// Verifies that detectGodObjects correctly identifies files exceeding line threshold as god objects
import { Analyzer } from '../analyzer';
import { Cache } from '../cache';
import * as fs from 'fs';

jest.mock('fs');
jest.mock('../cache');

describe('Analyzer.detectGodObjects', () => {
  let analyzer: Analyzer;
  let mockCache: jest.Mocked;

  beforeEach(() => {
    mockCache = new Cache('test') as jest.Mocked;
    mockCache.get = jest.fn().mockReturnValue(null);
    mockCache.set = jest.fn();
    analyzer = new Analyzer('test-workspace');
  });

  test('identifies files exceeding line threshold as god objects', () => {
    const files = [
      { path: 'src/large.ts', lines: 1500, functions: [] },
      { path: 'src/small.ts', lines: 100, functions: [] }
    ];
    const godObjects = analyzer.detectGodObjects(files, 1000);
    
    expect(godObjects.length).toBe(1);
    expect(godObjects[0].file).toBe('src/large.ts');
    expect(godObjects[0].severity).toBe('error');
    expect(godObjects[0].category).toBe('Code Organization');
  });

  test('returns empty array when no files exceed threshold', () => {
    const files = [
      { path: 'src/small1.ts', lines: 100, functions: [] },
      { path: 'src/small2.ts', lines: 200, functions: [] }
    ];
    const godObjects = analyzer.detectGodObjects(files, 1000);
    
    expect(godObjects.length).toBe(0);
  });

  test('handles empty file list', () => {
    const files: any[] = [];
    const godObjects = analyzer.detectGodObjects(files, 1000);
    
    expect(godObjects).toEqual([]);
  });
});

// Test: test_findCircularDependencies_detects_cycles
// Verifies circular dependency detection correctly identifies import cycles between modules
import { Analyzer } from '../analyzer';
import * as fs from 'fs';

jest.mock('fs');

describe('Analyzer.findCircularDependencies', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer('test-workspace');
  });

  test('detects direct circular dependency', () => {
    const dependencyGraph = {
      'moduleA.ts': ['moduleB.ts'],
      'moduleB.ts': ['moduleA.ts']
    };
    const cycles = analyzer.findCircularDependencies(dependencyGraph);
    
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0].severity).toBe('warning');
    expect(cycles[0].category).toBe('Dependencies');
  });

  test('detects transitive circular dependency', () => {
    const dependencyGraph = {
      'moduleA.ts': ['moduleB.ts'],
      'moduleB.ts': ['moduleC.ts'],
      'moduleC.ts': ['moduleA.ts']
    };
    const cycles = analyzer.findCircularDependencies(dependencyGraph);
    
    expect(cycles.length).toBeGreaterThan(0);
  });

  test('returns empty array for acyclic graph', () => {
    const dependencyGraph = {
      'moduleA.ts': ['moduleB.ts'],
      'moduleB.ts': ['moduleC.ts'],
      'moduleC.ts': []
    };
    const cycles = analyzer.findCircularDependencies(dependencyGraph);
    
    expect(cycles).toEqual([]);
  });
});

// Test: test_identifyDeadCode_finds_unused_functions
// Verifies dead code detection identifies unused functions, classes, and imports
import { Analyzer } from '../analyzer';

jest.mock('fs');

describe('Analyzer.identifyDeadCode', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer('test-workspace');
  });

  test('identifies unused exported functions', () => {
    const codebase = {
      files: [
        { path: 'src/utils.ts', functions: [{ name: 'unusedHelper', line: 10, references: 0 }] }
      ]
    };
    const deadCode = analyzer.identifyDeadCode(codebase);
    
    expect(deadCode.length).toBeGreaterThan(0);
    expect(deadCode[0].description).toContain('unusedHelper');
    expect(deadCode[0].severity).toBe('info');
    expect(deadCode[0].category).toBe('Dead Code');
  });

  test('excludes functions with references', () => {
    const codebase = {
      files: [
        { path: 'src/utils.ts', functions: [{ name: 'usedHelper', line: 10, references: 5 }] }
      ]
    };
    const deadCode = analyzer.identifyDeadCode(codebase);
    
    expect(deadCode.length).toBe(0);
  });

  test('handles empty codebase', () => {
    const codebase = { files: [] };
    const deadCode = analyzer.identifyDeadCode(codebase);
    
    expect(deadCode).toEqual([]);
  });
});

// Test: test_calculateComplexity_measures_cyclomatic_complexity
// Verifies cyclomatic complexity calculation for functions with branches and loops
import { Analyzer } from '../analyzer';

jest.mock('fs');

describe('Analyzer.calculateComplexity', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer('test-workspace');
  });

  test('calculates complexity for simple function', () => {
    const functionNode = {
      type: 'FunctionDeclaration',
      body: { type: 'BlockStatement', body: [] }
    };
    const complexity = analyzer.calculateComplexity(functionNode);
    
    expect(complexity).toBe(1);
  });

  test('increases complexity for if statements', () => {
    const functionNode = {
      type: 'FunctionDeclaration',
      body: {
        type: 'BlockStatement',
        body: [
          { type: 'IfStatement' },
          { type: 'IfStatement' }
        ]
      }
    };
    const complexity = analyzer.calculateComplexity(functionNode);
    
    expect(complexity).toBeGreaterThan(1);
  });

  test('increases complexity for loops', () => {
    const functionNode = {
      type: 'FunctionDeclaration',
      body: {
        type: 'BlockStatement',
        body: [
          { type: 'ForStatement' },
          { type: 'WhileStatement' }
        ]
      }
    };
    const complexity = analyzer.calculateComplexity(functionNode);
    
    expect(complexity).toBeGreaterThan(2);
  });
});

// Test: test_calculateHealthScore_computes_codebase_health
// Verifies health score calculation based on issue severity and count
import { Analyzer } from '../analyzer';

jest.mock('fs');

describe('Analyzer.calculateHealthScore', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer('test-workspace');
  });

  test('returns perfect score with no issues', () => {
    const issues: any[] = [];
    const score = analyzer.calculateHealthScore(issues);
    
    expect(score).toBe(100);
  });

  test('reduces score for error issues', () => {
    const issues = [
      { severity: 'error', category: 'Code Organization' },
      { severity: 'error', category: 'Dependencies' }
    ];
    const score = analyzer.calculateHealthScore(issues);
    
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('reduces score less for warnings than errors', () => {
    const errorIssues = [{ severity: 'error', category: 'Code Organization' }];
    const warningIssues = [{ severity: 'warning', category: 'Code Organization' }];
    
    const errorScore = analyzer.calculateHealthScore(errorIssues);
    const warningScore = analyzer.calculateHealthScore(warningIssues);
    
    expect(warningScore).toBeGreaterThan(errorScore);
  });

  test('handles mixed severity issues', () => {
    const issues = [
      { severity: 'error', category: 'Code Organization' },
      { severity: 'warning', category: 'Dependencies' },
      { severity: 'info', category: 'Style' }
    ];
    const score = analyzer.calculateHealthScore(issues);
    
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
