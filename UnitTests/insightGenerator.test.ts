import { InsightGenerator } from '../insightGenerator';
import { AnalysisResult } from '../analyzer';

// Test: test_generate_insights_from_analysis
// Verifies insight generation produces categorized insights from analysis results
describe('InsightGenerator - generateInsights', () => {
  let generator: InsightGenerator;

  beforeEach(() => {
    generator = new InsightGenerator();
  });

  test('should generate insights from analysis with issues', () => {
    const mockAnalysis: Partial = {
      godObjects: [
        {
          file: 'largeFile.ts',
          lines: 1500,
          functions: 75
        }
      ],
      circularDependencies: [
        {
          files: ['fileA.ts', 'fileB.ts']
        }
      ],
      complexFunctions: []
    };

    const insights = generator.generateInsights(mockAnalysis as AnalysisResult);

    expect(insights.length).toBeGreaterThan(0);
    expect(insights.some(i => i.category === 'organization')).toBe(true);
    expect(insights.some(i => i.category === 'dependencies')).toBe(true);
  });

  test('should return empty array for clean analysis', () => {
    const mockAnalysis: Partial = {
      godObjects: [],
      circularDependencies: [],
      complexFunctions: [],
      deadCode: []
    };

    const insights = generator.generateInsights(mockAnalysis as AnalysisResult);

    expect(insights).toEqual([]);
  });

  test('should assign correct severity levels', () => {
    const mockAnalysis: Partial = {
      godObjects: [
        {
          file: 'massiveFile.ts',
          lines: 3000,
          functions: 150
        }
      ]
    };

    const insights = generator.generateInsights(mockAnalysis as AnalysisResult);

    const godObjectInsight = insights.find(i => i.category === 'organization');
    expect(godObjectInsight?.severity).toBe('Error');
  });

  test('should provide actionable suggestions', () => {
    const mockAnalysis: Partial = {
      complexFunctions: [
        {
          file: 'complex.ts',
          function: 'processData',
          complexity: 25,
          line: 50
        }
      ]
    };

    const insights = generator.generateInsights(mockAnalysis as AnalysisResult);

    const complexityInsight = insights.find(i => i.category === 'complexity');
    expect(complexityInsight?.suggestion).toContain('refactor');
  });
});
