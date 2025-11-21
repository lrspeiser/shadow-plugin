import { analyzeTestability } from '../testabilityAnalyzer';
import * as complexityAnalyzer from '../../analysis/complexityAnalyzer';
import * as dependencyAnalyzer from '../../analysis/dependencyAnalyzer';

// Mocks
jest.mock('../../analysis/complexityAnalyzer');
jest.mock('../../analysis/dependencyAnalyzer');

describe('analyzeTestability', () => {
  let mockComplexityAnalyzer: jest.Mocked<typeof complexityAnalyzer>;
  let mockDependencyAnalyzer: jest.Mocked<typeof dependencyAnalyzer>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
    mockDependencyAnalyzer = dependencyAnalyzer as jest.Mocked<typeof dependencyAnalyzer>;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('happy path', () => {
    test('should analyze testability for a simple function with low complexity', () => {
      const sourceCode = 'function add(a: number, b: number) { return a + b; }';
      const functionName = 'add';
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 1,
        cognitiveComplexity: 1,
        score: 'low'
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockReturnValue({
        dependencies: [],
        externalDependencies: [],
        count: 0
      });

      const result = analyzeTestability(sourceCode, functionName);

      expect(result).toBeDefined();
      expect(result.testabilityScore).toBeGreaterThan(70);
      expect(result.complexity).toBe('low');
      expect(mockComplexityAnalyzer.analyzeComplexity).toHaveBeenCalledWith(sourceCode, functionName);
      expect(mockDependencyAnalyzer.analyzeDependencies).toHaveBeenCalledWith(sourceCode, functionName);
    });

    test('should analyze testability for a function with medium complexity', () => {
      const sourceCode = 'function processData(data: any) { if (data) { return data.map(x => x * 2); } return []; }';
      const functionName = 'processData';
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 3,
        cognitiveComplexity: 4,
        score: 'medium'
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockReturnValue({
        dependencies: ['Array'],
        externalDependencies: [],
        count: 1
      });

      const result = analyzeTestability(sourceCode, functionName);

      expect(result).toBeDefined();
      expect(result.testabilityScore).toBeGreaterThan(40);
      expect(result.testabilityScore).toBeLessThan(70);
      expect(result.complexity).toBe('medium');
    });

    test('should analyze testability for a function with high complexity and many dependencies', () => {
      const sourceCode = 'function complexFunction(input: any) { /* complex logic */ }';
      const functionName = 'complexFunction';
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 15,
        cognitiveComplexity: 20,
        score: 'high'
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockReturnValue({
        dependencies: ['fs', 'path', 'http', 'crypto'],
        externalDependencies: ['axios', 'lodash'],
        count: 6
      });

      const result = analyzeTestability(sourceCode, functionName);

      expect(result).toBeDefined();
      expect(result.testabilityScore).toBeLessThan(40);
      expect(result.complexity).toBe('high');
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    test('should handle empty source code', () => {
      const sourceCode = '';
      const functionName = 'emptyFunction';
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        score: 'low'
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockReturnValue({
        dependencies: [],
        externalDependencies: [],
        count: 0
      });

      const result = analyzeTestability(sourceCode, functionName);

      expect(result).toBeDefined();
      expect(result.testabilityScore).toBeGreaterThanOrEqual(0);
    });

    test('should handle function name not found in source code', () => {
      const sourceCode = 'function existingFunction() { return true; }';
      const functionName = 'nonExistentFunction';
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        score: 'low'
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockReturnValue({
        dependencies: [],
        externalDependencies: [],
        count: 0
      });

      const result = analyzeTestability(sourceCode, functionName);

      expect(result).toBeDefined();
    });

    test('should handle special characters in function name', () => {
      const sourceCode = 'const $myFunc = () => { return 42; }';
      const functionName = '$myFunc';
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 1,
        cognitiveComplexity: 1,
        score: 'low'
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockReturnValue({
        dependencies: [],
        externalDependencies: [],
        count: 0
      });

      const result = analyzeTestability(sourceCode, functionName);

      expect(result).toBeDefined();
      expect(mockComplexityAnalyzer.analyzeComplexity).toHaveBeenCalled();
    });

    test('should handle very long source code', () => {
      const sourceCode = 'function longFunction() {\n' + '  return true;\n'.repeat(1000) + '}';
      const functionName = 'longFunction';
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        score: 'medium'
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockReturnValue({
        dependencies: [],
        externalDependencies: [],
        count: 0
      });

      const result = analyzeTestability(sourceCode, functionName);

      expect(result).toBeDefined();
      expect(result.testabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.testabilityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('error handling', () => {
    test('should handle complexity analyzer throwing an error', () => {
      const sourceCode = 'function testFunc() { return true; }';
      const functionName = 'testFunc';
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockImplementation(() => {
        throw new Error('Complexity analysis failed');
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockReturnValue({
        dependencies: [],
        externalDependencies: [],
        count: 0
      });

      expect(() => analyzeTestability(sourceCode, functionName)).toThrow('Complexity analysis failed');
    });

    test('should handle dependency analyzer throwing an error', () => {
      const sourceCode = 'function testFunc() { return true; }';
      const functionName = 'testFunc';
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 1,
        cognitiveComplexity: 1,
        score: 'low'
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockImplementation(() => {
        throw new Error('Dependency analysis failed');
      });

      expect(() => analyzeTestability(sourceCode, functionName)).toThrow('Dependency analysis failed');
    });

    test('should handle null or undefined source code', () => {
      const sourceCode = null as any;
      const functionName = 'testFunc';
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        score: 'low'
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockReturnValue({
        dependencies: [],
        externalDependencies: [],
        count: 0
      });

      expect(() => analyzeTestability(sourceCode, functionName)).toThrow();
    });

    test('should handle null or undefined function name', () => {
      const sourceCode = 'function testFunc() { return true; }';
      const functionName = null as any;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 1,
        cognitiveComplexity: 1,
        score: 'low'
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockReturnValue({
        dependencies: [],
        externalDependencies: [],
        count: 0
      });

      expect(() => analyzeTestability(sourceCode, functionName)).toThrow();
    });
  });

  describe('testability score calculation', () => {
    test('should return score between 0 and 100', () => {
      const sourceCode = 'function testFunc() { return true; }';
      const functionName = 'testFunc';
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        score: 'medium'
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockReturnValue({
        dependencies: ['fs', 'path'],
        externalDependencies: ['axios'],
        count: 3
      });

      const result = analyzeTestability(sourceCode, functionName);

      expect(result.testabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.testabilityScore).toBeLessThanOrEqual(100);
    });

    test('should provide recommendations for low testability scores', () => {
      const sourceCode = 'function veryComplexFunc() { /* very complex */ }';
      const functionName = 'veryComplexFunc';
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 25,
        cognitiveComplexity: 30,
        score: 'high'
      });
      
      mockDependencyAnalyzer.analyzeDependencies = jest.fn().mockReturnValue({
        dependencies: ['fs', 'path', 'http', 'crypto', 'os'],
        externalDependencies: ['axios', 'lodash', 'moment'],
        count: 8
      });

      const result = analyzeTestability(sourceCode, functionName);

      expect(result.testabilityScore).toBeLessThan(50);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });
});