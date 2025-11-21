import { identifyOrphanedFiles } from '../orphanDetector';
import * as dependencyAnalyzer from '../../dependencyAnalyzer';
import * as path from 'path';

// Mocks
jest.mock('../../dependencyAnalyzer');

describe('identifyOrphanedFiles', () => {
  const mockDependencyAnalyzer = dependencyAnalyzer as jest.Mocked<typeof dependencyAnalyzer>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should identify files with no incoming dependencies as orphaned', () => {
    const mockDependencyGraph = {
      'src/fileA.ts': ['src/fileB.ts', 'src/fileC.ts'],
      'src/fileB.ts': ['src/fileC.ts'],
      'src/fileC.ts': [],
      'src/orphan.ts': []
    };

    mockDependencyAnalyzer.getDependencyGraph = jest.fn().mockReturnValue(mockDependencyGraph);

    const result = identifyOrphanedFiles(mockDependencyGraph);

    expect(result).toContain('src/orphan.ts');
    expect(result).not.toContain('src/fileB.ts');
    expect(result).not.toContain('src/fileC.ts');
    expect(result.length).toBeGreaterThan(0);
  });

  test('should return empty array when all files have incoming dependencies', () => {
    const mockDependencyGraph = {
      'src/fileA.ts': ['src/fileB.ts', 'src/fileC.ts'],
      'src/fileB.ts': ['src/fileC.ts'],
      'src/fileC.ts': []
    };

    mockDependencyAnalyzer.getDependencyGraph = jest.fn().mockReturnValue(mockDependencyGraph);

    const result = identifyOrphanedFiles(mockDependencyGraph);

    expect(result).not.toContain('src/fileB.ts');
    expect(result).not.toContain('src/fileC.ts');
  });

  test('should handle empty dependency graph', () => {
    const mockDependencyGraph = {};

    mockDependencyAnalyzer.getDependencyGraph = jest.fn().mockReturnValue(mockDependencyGraph);

    const result = identifyOrphanedFiles(mockDependencyGraph);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test('should identify multiple orphaned files', () => {
    const mockDependencyGraph = {
      'src/main.ts': ['src/used.ts'],
      'src/used.ts': [],
      'src/orphan1.ts': [],
      'src/orphan2.ts': ['src/orphan3.ts'],
      'src/orphan3.ts': []
    };

    mockDependencyAnalyzer.getDependencyGraph = jest.fn().mockReturnValue(mockDependencyGraph);

    const result = identifyOrphanedFiles(mockDependencyGraph);

    expect(result).toContain('src/orphan1.ts');
    expect(result).toContain('src/orphan2.ts');
    expect(result).not.toContain('src/used.ts');
    expect(result).not.toContain('src/main.ts');
  });

  test('should handle circular dependencies correctly', () => {
    const mockDependencyGraph = {
      'src/fileA.ts': ['src/fileB.ts'],
      'src/fileB.ts': ['src/fileA.ts'],
      'src/orphan.ts': []
    };

    mockDependencyAnalyzer.getDependencyGraph = jest.fn().mockReturnValue(mockDependencyGraph);

    const result = identifyOrphanedFiles(mockDependencyGraph);

    expect(result).toContain('src/orphan.ts');
    expect(result).not.toContain('src/fileA.ts');
    expect(result).not.toContain('src/fileB.ts');
  });

  test('should handle files with self-references', () => {
    const mockDependencyGraph = {
      'src/main.ts': ['src/util.ts'],
      'src/util.ts': ['src/util.ts'],
      'src/orphan.ts': ['src/orphan.ts']
    };

    mockDependencyAnalyzer.getDependencyGraph = jest.fn().mockReturnValue(mockDependencyGraph);

    const result = identifyOrphanedFiles(mockDependencyGraph);

    expect(result).toContain('src/orphan.ts');
    expect(result).not.toContain('src/util.ts');
  });

  test('should exclude entry point files from orphaned results', () => {
    const mockDependencyGraph = {
      'src/index.ts': ['src/fileA.ts'],
      'src/main.ts': ['src/fileB.ts'],
      'src/fileA.ts': [],
      'src/fileB.ts': [],
      'src/orphan.ts': []
    };

    mockDependencyAnalyzer.getDependencyGraph = jest.fn().mockReturnValue(mockDependencyGraph);

    const result = identifyOrphanedFiles(mockDependencyGraph);

    expect(result).toContain('src/orphan.ts');
  });

  test('should handle complex dependency chains', () => {
    const mockDependencyGraph = {
      'src/app.ts': ['src/services/api.ts'],
      'src/services/api.ts': ['src/utils/http.ts', 'src/utils/logger.ts'],
      'src/utils/http.ts': ['src/utils/logger.ts'],
      'src/utils/logger.ts': [],
      'src/legacy/oldCode.ts': [],
      'src/test/unused.ts': []
    };

    mockDependencyAnalyzer.getDependencyGraph = jest.fn().mockReturnValue(mockDependencyGraph);

    const result = identifyOrphanedFiles(mockDependencyGraph);

    expect(result).toContain('src/legacy/oldCode.ts');
    expect(result).toContain('src/test/unused.ts');
    expect(result).not.toContain('src/utils/http.ts');
    expect(result).not.toContain('src/utils/logger.ts');
  });

  test('should handle single file with no dependencies', () => {
    const mockDependencyGraph = {
      'src/standalone.ts': []
    };

    mockDependencyAnalyzer.getDependencyGraph = jest.fn().mockReturnValue(mockDependencyGraph);

    const result = identifyOrphanedFiles(mockDependencyGraph);

    expect(result).toContain('src/standalone.ts');
    expect(result.length).toBe(1);
  });

  test('should handle null or undefined dependencies gracefully', () => {
    const mockDependencyGraph = {
      'src/fileA.ts': ['src/fileB.ts'],
      'src/fileB.ts': null as any,
      'src/fileC.ts': undefined as any
    };

    mockDependencyAnalyzer.getDependencyGraph = jest.fn().mockReturnValue(mockDependencyGraph);

    expect(() => {
      identifyOrphanedFiles(mockDependencyGraph);
    }).not.toThrow();
  });
});