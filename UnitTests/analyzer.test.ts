import { Analyzer } from '../analyzer';
import * as fs from 'fs';
import * as path from 'path';
jest.mock('fs');
jest.mock('path');

// Test: test_detect_entry_points_success
// Verifies entry point detection for package.json main field returns correct file path
describe('Analyzer - detectEntryPoints', () => {
  let analyzer: Analyzer;
  const mockWorkspaceRoot = '/mock/workspace';

  beforeEach(() => {
    analyzer = new Analyzer(mockWorkspaceRoot);
    jest.clearAllMocks();
  });

  test('should detect entry point from package.json main field', () => {
    const mockPackageJson = JSON.stringify({ main: './dist/extension.js' });
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPackageJson);
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));

    const result = analyzer.detectEntryPoints();

    expect(result).toContain('./dist/extension.js');
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('package.json'),
      'utf-8'
    );
  });

  test('should handle missing package.json gracefully', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const result = analyzer.detectEntryPoints();

    expect(result).toEqual([]);
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  test('should handle malformed package.json', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

    const result = analyzer.detectEntryPoints();

    expect(result).toEqual([]);
  });
});

// Test: test_detect_circular_dependencies
// Verifies circular dependency detection identifies dependency cycles in import graphs
describe('Analyzer - detectCircularDependencies', () => {
  let analyzer: Analyzer;
  const mockWorkspaceRoot = '/mock/workspace';

  beforeEach(() => {
    analyzer = new Analyzer(mockWorkspaceRoot);
    jest.clearAllMocks();
  });

  test('should detect two-file circular dependency', () => {
    const mockDependencies = {
      'fileA.ts': ['fileB.ts'],
      'fileB.ts': ['fileA.ts']
    };

    analyzer['dependencies'] = mockDependencies;

    const result = analyzer.detectCircularDependencies();

    expect(result.length).toBeGreaterThan(0);
    const circularDep = result[0];
    expect(circularDep.type).toBe('circular_dependency');
    expect(circularDep.description).toContain('fileA.ts');
    expect(circularDep.description).toContain('fileB.ts');
  });

  test('should detect three-file circular chain', () => {
    const mockDependencies = {
      'fileA.ts': ['fileB.ts'],
      'fileB.ts': ['fileC.ts'],
      'fileC.ts': ['fileA.ts']
    };

    analyzer['dependencies'] = mockDependencies;

    const result = analyzer.detectCircularDependencies();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].description).toContain('fileA.ts');
    expect(result[0].description).toContain('fileB.ts');
    expect(result[0].description).toContain('fileC.ts');
  });

  test('should not flag non-circular dependencies', () => {
    const mockDependencies = {
      'fileA.ts': ['fileB.ts'],
      'fileB.ts': ['fileC.ts'],
      'fileC.ts': []
    };

    analyzer['dependencies'] = mockDependencies;

    const result = analyzer.detectCircularDependencies();

    expect(result).toEqual([]);
  });

  test('should handle empty dependency graph', () => {
    analyzer['dependencies'] = {};

    const result = analyzer.detectCircularDependencies();

    expect(result).toEqual([]);
  });
});

// Test: test_detect_god_objects
// Verifies god object detection identifies files exceeding size and complexity thresholds
describe('Analyzer - detectGodObjects', () => {
  let analyzer: Analyzer;
  const mockWorkspaceRoot = '/mock/workspace';

  beforeEach(() => {
    analyzer = new Analyzer(mockWorkspaceRoot);
    jest.clearAllMocks();
  });

  test('should detect file exceeding line threshold', () => {
    const mockFileData = {
      'largeFile.ts': {
        lines: 1500,
        functions: 30
      }
    };

    analyzer['fileData'] = mockFileData;

    const result = analyzer.detectGodObjects();

    expect(result.length).toBeGreaterThan(0);
    const godObject = result.find(i => i.file === 'largeFile.ts');
    expect(godObject).toBeDefined();
    expect(godObject?.severity).toBe('Error');
    expect(godObject?.description).toContain('1500 lines');
  });

  test('should detect file with excessive functions', () => {
    const mockFileData = {
      'complexFile.ts': {
        lines: 400,
        functions: 75
      }
    };

    analyzer['fileData'] = mockFileData;

    const result = analyzer.detectGodObjects();

    expect(result.length).toBeGreaterThan(0);
    const godObject = result.find(i => i.file === 'complexFile.ts');
    expect(godObject).toBeDefined();
    expect(godObject?.description).toContain('75 functions');
  });

  test('should not flag normal-sized files', () => {
    const mockFileData = {
      'normalFile.ts': {
        lines: 200,
        functions: 15
      }
    };

    analyzer['fileData'] = mockFileData;

    const result = analyzer.detectGodObjects();

    expect(result).toEqual([]);
  });

  test('should handle empty file data', () => {
    analyzer['fileData'] = {};

    const result = analyzer.detectGodObjects();

    expect(result).toEqual([]);
  });
});

// Test: test_analyze_complexity
// Verifies cyclomatic complexity calculation for functions and identifies complex functions
describe('Analyzer - analyzeComplexity', () => {
  let analyzer: Analyzer;
  const mockWorkspaceRoot = '/mock/workspace';

  beforeEach(() => {
    analyzer = new Analyzer(mockWorkspaceRoot);
    jest.clearAllMocks();
  });

  test('should calculate low complexity for simple function', () => {
    const mockFunctionData = {
      name: 'simpleFunction',
      startLine: 10,
      endLine: 15,
      branches: 1,
      loops: 0,
      conditions: 0
    };

    const complexity = analyzer.calculateComplexity(mockFunctionData);

    expect(complexity).toBeLessThanOrEqual(5);
  });

  test('should calculate high complexity for function with multiple branches', () => {
    const mockFunctionData = {
      name: 'complexFunction',
      startLine: 20,
      endLine: 100,
      branches: 15,
      loops: 5,
      conditions: 10
    };

    const complexity = analyzer.calculateComplexity(mockFunctionData);

    expect(complexity).toBeGreaterThan(10);
  });

  test('should flag functions exceeding complexity threshold', () => {
    const mockFileData = {
      'testFile.ts': {
        functions: [
          {
            name: 'highComplexityFunction',
            startLine: 50,
            endLine: 150,
            complexity: 25
          }
        ]
      }
    };

    analyzer['fileData'] = mockFileData;

    const result = analyzer.analyzeComplexity();

    expect(result.length).toBeGreaterThan(0);
    const complexFunction = result[0];
    expect(complexFunction.severity).toBe('Warning');
    expect(complexFunction.description).toContain('complexity of 25');
  });

  test('should not flag functions below threshold', () => {
    const mockFileData = {
      'testFile.ts': {
        functions: [
          {
            name: 'simpleFunction',
            startLine: 10,
            endLine: 20,
            complexity: 3
          }
        ]
      }
    };

    analyzer['fileData'] = mockFileData;

    const result = analyzer.analyzeComplexity();

    expect(result).toEqual([]);
  });
});
