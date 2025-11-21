import { createTestPlan } from '../testPlanner';
import { analyzeTestability } from '../testPlanner';
import { prioritizeFunctions } from '../testPlanner';
import { calculateCoverage } from '../testPlanner';

// Mocks
jest.mock('../testPlanner', () => ({ ...jest.requireActual('../testPlanner'), analyzeTestability: jest.fn(), prioritizeFunctions: jest.fn(), calculateCoverage: jest.fn() }));

describe('createTestPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    test('should create a comprehensive test plan with all components', () => {
      const mockAnalysis = {
        complexity: 'high',
        testable: true,
        dependencies: ['dep1', 'dep2'],
        edgeCases: ['null input', 'empty array']
      };
      const mockPrioritizedFunctions = [
        { name: 'func1', priority: 1, complexity: 10 },
        { name: 'func2', priority: 2, complexity: 5 }
      ];
      const mockCoverage = {
        totalLines: 100,
        coveredLines: 75,
        percentage: 75
      };

      (analyzeTestability as jest.Mock).mockReturnValue(mockAnalysis);
      (prioritizeFunctions as jest.Mock).mockReturnValue(mockPrioritizedFunctions);
      (calculateCoverage as jest.Mock).mockReturnValue(mockCoverage);

      const input = {
        sourceCode: 'function test() { return true; }',
        functionName: 'test',
        filePath: '/path/to/file.ts'
      };

      const result = createTestPlan(input);

      expect(result).toBeDefined();
      expect(result.analysis).toEqual(mockAnalysis);
      expect(result.prioritizedFunctions).toEqual(mockPrioritizedFunctions);
      expect(result.coverage).toEqual(mockCoverage);
      expect(analyzeTestability).toHaveBeenCalledWith(input);
      expect(prioritizeFunctions).toHaveBeenCalled();
      expect(calculateCoverage).toHaveBeenCalled();
    });

    test('should handle simple functions with low complexity', () => {
      const mockAnalysis = {
        complexity: 'low',
        testable: true,
        dependencies: [],
        edgeCases: []
      };
      const mockPrioritizedFunctions = [
        { name: 'simpleFunc', priority: 3, complexity: 1 }
      ];
      const mockCoverage = {
        totalLines: 10,
        coveredLines: 10,
        percentage: 100
      };

      (analyzeTestability as jest.Mock).mockReturnValue(mockAnalysis);
      (prioritizeFunctions as jest.Mock).mockReturnValue(mockPrioritizedFunctions);
      (calculateCoverage as jest.Mock).mockReturnValue(mockCoverage);

      const input = {
        sourceCode: 'function simple() { return 1; }',
        functionName: 'simple',
        filePath: '/path/to/simple.ts'
      };

      const result = createTestPlan(input);

      expect(result).toBeDefined();
      expect(result.analysis.complexity).toBe('low');
      expect(result.coverage.percentage).toBe(100);
    });

    test('should create test plan for functions with multiple dependencies', () => {
      const mockAnalysis = {
        complexity: 'medium',
        testable: true,
        dependencies: ['dep1', 'dep2', 'dep3', 'dep4'],
        edgeCases: ['boundary condition', 'error state']
      };
      const mockPrioritizedFunctions = [
        { name: 'func1', priority: 1, complexity: 8 },
        { name: 'func2', priority: 2, complexity: 6 }
      ];
      const mockCoverage = {
        totalLines: 50,
        coveredLines: 35,
        percentage: 70
      };

      (analyzeTestability as jest.Mock).mockReturnValue(mockAnalysis);
      (prioritizeFunctions as jest.Mock).mockReturnValue(mockPrioritizedFunctions);
      (calculateCoverage as jest.Mock).mockReturnValue(mockCoverage);

      const input = {
        sourceCode: 'function complex() { /* complex logic */ }',
        functionName: 'complex',
        filePath: '/path/to/complex.ts'
      };

      const result = createTestPlan(input);

      expect(result.analysis.dependencies).toHaveLength(4);
      expect(result.analysis.edgeCases).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    test('should handle empty source code', () => {
      const mockAnalysis = {
        complexity: 'low',
        testable: false,
        dependencies: [],
        edgeCases: []
      };
      const mockPrioritizedFunctions = [];
      const mockCoverage = {
        totalLines: 0,
        coveredLines: 0,
        percentage: 0
      };

      (analyzeTestability as jest.Mock).mockReturnValue(mockAnalysis);
      (prioritizeFunctions as jest.Mock).mockReturnValue(mockPrioritizedFunctions);
      (calculateCoverage as jest.Mock).mockReturnValue(mockCoverage);

      const input = {
        sourceCode: '',
        functionName: 'empty',
        filePath: '/path/to/empty.ts'
      };

      const result = createTestPlan(input);

      expect(result).toBeDefined();
      expect(result.prioritizedFunctions).toHaveLength(0);
      expect(result.coverage.percentage).toBe(0);
    });

    test('should handle null or undefined input gracefully', () => {
      const mockAnalysis = {
        complexity: 'unknown',
        testable: false,
        dependencies: [],
        edgeCases: []
      };
      const mockPrioritizedFunctions = [];
      const mockCoverage = {
        totalLines: 0,
        coveredLines: 0,
        percentage: 0
      };

      (analyzeTestability as jest.Mock).mockReturnValue(mockAnalysis);
      (prioritizeFunctions as jest.Mock).mockReturnValue(mockPrioritizedFunctions);
      (calculateCoverage as jest.Mock).mockReturnValue(mockCoverage);

      const input = {
        sourceCode: null as any,
        functionName: '',
        filePath: ''
      };

      expect(() => createTestPlan(input)).not.toThrow();
    });

    test('should handle functions with no testable components', () => {
      const mockAnalysis = {
        complexity: 'high',
        testable: false,
        dependencies: ['external'],
        edgeCases: []
      };
      const mockPrioritizedFunctions = [];
      const mockCoverage = {
        totalLines: 20,
        coveredLines: 0,
        percentage: 0
      };

      (analyzeTestability as jest.Mock).mockReturnValue(mockAnalysis);
      (prioritizeFunctions as jest.Mock).mockReturnValue(mockPrioritizedFunctions);
      (calculateCoverage as jest.Mock).mockReturnValue(mockCoverage);

      const input = {
        sourceCode: 'function untestable() { /* side effects */ }',
        functionName: 'untestable',
        filePath: '/path/to/untestable.ts'
      };

      const result = createTestPlan(input);

      expect(result.analysis.testable).toBe(false);
      expect(result.prioritizedFunctions).toHaveLength(0);
    });

    test('should handle very large source files', () => {
      const mockAnalysis = {
        complexity: 'very high',
        testable: true,
        dependencies: Array(50).fill('dep'),
        edgeCases: Array(20).fill('edge case')
      };
      const mockPrioritizedFunctions = Array(100).fill(null).map((_, i) => ({
        name: `func${i}`,
        priority: i,
        complexity: Math.random() * 10
      }));
      const mockCoverage = {
        totalLines: 10000,
        coveredLines: 5000,
        percentage: 50
      };

      (analyzeTestability as jest.Mock).mockReturnValue(mockAnalysis);
      (prioritizeFunctions as jest.Mock).mockReturnValue(mockPrioritizedFunctions);
      (calculateCoverage as jest.Mock).mockReturnValue(mockCoverage);

      const input = {
        sourceCode: 'x'.repeat(100000),
        functionName: 'largeFunc',
        filePath: '/path/to/large.ts'
      };

      const result = createTestPlan(input);

      expect(result.prioritizedFunctions).toHaveLength(100);
      expect(result.coverage.totalLines).toBe(10000);
    });
  });

  describe('error handling', () => {
    test('should handle analyzeTestability throwing an error', () => {
      (analyzeTestability as jest.Mock).mockImplementation(() => {
        throw new Error('Analysis failed');
      });

      const input = {
        sourceCode: 'function test() {}',
        functionName: 'test',
        filePath: '/path/to/test.ts'
      };

      expect(() => createTestPlan(input)).toThrow('Analysis failed');
    });

    test('should handle prioritizeFunctions returning invalid data', () => {
      const mockAnalysis = {
        complexity: 'medium',
        testable: true,
        dependencies: [],
        edgeCases: []
      };
      (analyzeTestability as jest.Mock).mockReturnValue(mockAnalysis);
      (prioritizeFunctions as jest.Mock).mockReturnValue(null);
      (calculateCoverage as jest.Mock).mockReturnValue({
        totalLines: 10,
        coveredLines: 5,
        percentage: 50
      });

      const input = {
        sourceCode: 'function test() {}',
        functionName: 'test',
        filePath: '/path/to/test.ts'
      };

      const result = createTestPlan(input);

      expect(result.prioritizedFunctions).toBeNull();
    });

    test('should handle calculateCoverage throwing an error', () => {
      const mockAnalysis = {
        complexity: 'low',
        testable: true,
        dependencies: [],
        edgeCases: []
      };
      const mockPrioritizedFunctions = [{ name: 'func1', priority: 1, complexity: 5 }];

      (analyzeTestability as jest.Mock).mockReturnValue(mockAnalysis);
      (prioritizeFunctions as jest.Mock).mockReturnValue(mockPrioritizedFunctions);
      (calculateCoverage as jest.Mock).mockImplementation(() => {
        throw new Error('Coverage calculation failed');
      });

      const input = {
        sourceCode: 'function test() {}',
        functionName: 'test',
        filePath: '/path/to/test.ts'
      };

      expect(() => createTestPlan(input)).toThrow('Coverage calculation failed');
    });

    test('should handle malformed input structure', () => {
      const mockAnalysis = {
        complexity: 'unknown',
        testable: false,
        dependencies: [],
        edgeCases: []
      };
      (analyzeTestability as jest.Mock).mockReturnValue(mockAnalysis);
      (prioritizeFunctions as jest.Mock).mockReturnValue([]);
      (calculateCoverage as jest.Mock).mockReturnValue({
        totalLines: 0,
        coveredLines: 0,
        percentage: 0
      });

      const input = {} as any;

      expect(() => createTestPlan(input)).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    test('should properly chain all dependency functions', () => {
      const mockAnalysis = {
        complexity: 'medium',
        testable: true,
        dependencies: ['dep1'],
        edgeCases: ['case1']
      };
      const mockPrioritizedFunctions = [
        { name: 'func1', priority: 1, complexity: 7 }
      ];
      const mockCoverage = {
        totalLines: 30,
        coveredLines: 20,
        percentage: 66.67
      };

      (analyzeTestability as jest.Mock).mockReturnValue(mockAnalysis);
      (prioritizeFunctions as jest.Mock).mockReturnValue(mockPrioritizedFunctions);
      (calculateCoverage as jest.Mock).mockReturnValue(mockCoverage);

      const input = {
        sourceCode: 'function integration() { return true; }',
        functionName: 'integration',
        filePath: '/path/to/integration.ts'
      };

      const result = createTestPlan(input);

      expect(analyzeTestability).toHaveBeenCalledTimes(1);
      expect(prioritizeFunctions).toHaveBeenCalledTimes(1);
      expect(calculateCoverage).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        analysis: mockAnalysis,
        prioritizedFunctions: mockPrioritizedFunctions,
        coverage: mockCoverage
      });
    });
  });
});