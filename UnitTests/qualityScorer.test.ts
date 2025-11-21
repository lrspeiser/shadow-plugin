import { calculateQualityScore } from '../qualityScorer';
import * as complexityAnalyzer from '../complexityAnalyzer';
import * as testCoverageAnalyzer from '../testCoverageAnalyzer';

// Mocks
jest.mock('../complexityAnalyzer');
jest.mock('../testCoverageAnalyzer');

describe('calculateQualityScore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path scenarios', () => {
    test('should calculate quality score for high quality code', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      const mockTestCoverageAnalyzer = testCoverageAnalyzer as jest.Mocked<typeof testCoverageAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        maintainabilityIndex: 85
      });
      
      mockTestCoverageAnalyzer.getCoverage = jest.fn().mockReturnValue({
        linesCovered: 90,
        totalLines: 100,
        coveragePercentage: 90
      });

      const code = 'function test() { return true; }';
      const result = calculateQualityScore(code);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(mockComplexityAnalyzer.analyzeComplexity).toHaveBeenCalledWith(code);
      expect(mockTestCoverageAnalyzer.getCoverage).toHaveBeenCalled();
    });

    test('should calculate quality score for medium quality code', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      const mockTestCoverageAnalyzer = testCoverageAnalyzer as jest.Mocked<typeof testCoverageAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 15,
        cognitiveComplexity: 12,
        maintainabilityIndex: 60
      });
      
      mockTestCoverageAnalyzer.getCoverage = jest.fn().mockReturnValue({
        linesCovered: 60,
        totalLines: 100,
        coveragePercentage: 60
      });

      const code = 'function test() { if(true) { return true; } else { return false; } }';
      const result = calculateQualityScore(code);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.score).toBeLessThan(80);
    });

    test('should calculate quality score for low quality code', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      const mockTestCoverageAnalyzer = testCoverageAnalyzer as jest.Mocked<typeof testCoverageAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 30,
        cognitiveComplexity: 25,
        maintainabilityIndex: 30
      });
      
      mockTestCoverageAnalyzer.getCoverage = jest.fn().mockReturnValue({
        linesCovered: 20,
        totalLines: 100,
        coveragePercentage: 20
      });

      const code = 'function complex() { /* very complex code */ }';
      const result = calculateQualityScore(code);

      expect(result).toBeDefined();
      expect(result.score).toBeLessThan(40);
    });
  });

  describe('edge cases', () => {
    test('should handle empty code string', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      const mockTestCoverageAnalyzer = testCoverageAnalyzer as jest.Mocked<typeof testCoverageAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        maintainabilityIndex: 100
      });
      
      mockTestCoverageAnalyzer.getCoverage = jest.fn().mockReturnValue({
        linesCovered: 0,
        totalLines: 0,
        coveragePercentage: 0
      });

      const result = calculateQualityScore('');

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    test('should handle code with zero test coverage', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      const mockTestCoverageAnalyzer = testCoverageAnalyzer as jest.Mocked<typeof testCoverageAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        maintainabilityIndex: 80
      });
      
      mockTestCoverageAnalyzer.getCoverage = jest.fn().mockReturnValue({
        linesCovered: 0,
        totalLines: 100,
        coveragePercentage: 0
      });

      const code = 'function untested() { return true; }';
      const result = calculateQualityScore(code);

      expect(result).toBeDefined();
      expect(result.score).toBeLessThan(100);
    });

    test('should handle code with perfect metrics', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      const mockTestCoverageAnalyzer = testCoverageAnalyzer as jest.Mocked<typeof testCoverageAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 1,
        cognitiveComplexity: 0,
        maintainabilityIndex: 100
      });
      
      mockTestCoverageAnalyzer.getCoverage = jest.fn().mockReturnValue({
        linesCovered: 100,
        totalLines: 100,
        coveragePercentage: 100
      });

      const code = 'function perfect() { return true; }';
      const result = calculateQualityScore(code);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(90);
    });

    test('should handle very large code input', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      const mockTestCoverageAnalyzer = testCoverageAnalyzer as jest.Mocked<typeof testCoverageAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 10,
        cognitiveComplexity: 8,
        maintainabilityIndex: 70
      });
      
      mockTestCoverageAnalyzer.getCoverage = jest.fn().mockReturnValue({
        linesCovered: 500,
        totalLines: 1000,
        coveragePercentage: 50
      });

      const largeCode = 'function test() {\n'.repeat(1000) + '}';
      const result = calculateQualityScore(largeCode);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    test('should handle complexity analyzer throwing error', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      const mockTestCoverageAnalyzer = testCoverageAnalyzer as jest.Mocked<typeof testCoverageAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockImplementation(() => {
        throw new Error('Complexity analysis failed');
      });
      
      mockTestCoverageAnalyzer.getCoverage = jest.fn().mockReturnValue({
        linesCovered: 50,
        totalLines: 100,
        coveragePercentage: 50
      });

      const code = 'function test() { return true; }';
      
      expect(() => calculateQualityScore(code)).toThrow();
    });

    test('should handle test coverage analyzer throwing error', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      const mockTestCoverageAnalyzer = testCoverageAnalyzer as jest.Mocked<typeof testCoverageAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        maintainabilityIndex: 80
      });
      
      mockTestCoverageAnalyzer.getCoverage = jest.fn().mockImplementation(() => {
        throw new Error('Coverage analysis failed');
      });

      const code = 'function test() { return true; }';
      
      expect(() => calculateQualityScore(code)).toThrow();
    });

    test('should handle null or undefined input', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockImplementation(() => {
        throw new Error('Invalid input');
      });

      expect(() => calculateQualityScore(null as any)).toThrow();
      expect(() => calculateQualityScore(undefined as any)).toThrow();
    });

    test('should handle invalid complexity metrics', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      const mockTestCoverageAnalyzer = testCoverageAnalyzer as jest.Mocked<typeof testCoverageAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: -1,
        cognitiveComplexity: -1,
        maintainabilityIndex: -1
      });
      
      mockTestCoverageAnalyzer.getCoverage = jest.fn().mockReturnValue({
        linesCovered: 50,
        totalLines: 100,
        coveragePercentage: 50
      });

      const code = 'function test() { return true; }';
      const result = calculateQualityScore(code);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('boundary conditions', () => {
    test('should handle maximum complexity values', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      const mockTestCoverageAnalyzer = testCoverageAnalyzer as jest.Mocked<typeof testCoverageAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: Number.MAX_SAFE_INTEGER,
        cognitiveComplexity: Number.MAX_SAFE_INTEGER,
        maintainabilityIndex: 0
      });
      
      mockTestCoverageAnalyzer.getCoverage = jest.fn().mockReturnValue({
        linesCovered: 0,
        totalLines: 100,
        coveragePercentage: 0
      });

      const code = 'function extreme() { /* extremely complex */ }';
      const result = calculateQualityScore(code);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    test('should return score within valid range 0-100', () => {
      const mockComplexityAnalyzer = complexityAnalyzer as jest.Mocked<typeof complexityAnalyzer>;
      const mockTestCoverageAnalyzer = testCoverageAnalyzer as jest.Mocked<typeof testCoverageAnalyzer>;
      
      mockComplexityAnalyzer.analyzeComplexity = jest.fn().mockReturnValue({
        cyclomaticComplexity: 20,
        cognitiveComplexity: 15,
        maintainabilityIndex: 50
      });
      
      mockTestCoverageAnalyzer.getCoverage = jest.fn().mockReturnValue({
        linesCovered: 75,
        totalLines: 100,
        coveragePercentage: 75
      });

      const code = 'function test() { return true; }';
      const result = calculateQualityScore(code);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});