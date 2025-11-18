import { InsightGenerator } from '../insightGenerator';

// Test: test_generateInsights_formatsCorrectly
// Verifies insight generator formats analysis results into human-readable insights
import { InsightGenerator } from '../insightGenerator';

describe('InsightGenerator.generateInsights', () => {
  let generator: InsightGenerator;

  beforeEach(() => {
    generator = new InsightGenerator();
  });

  test('formats god object insights correctly', () => {
    const issues = [
      {
        type: 'god-object',
        filePath: 'src/large.ts',
        lineCount: 1500,
        severity: 'error'
      }
    ];

    const insights = generator.generateInsights(issues);

    expect(insights).toHaveLength(1);
    expect(insights[0].description).toContain('large');
    expect(insights[0].severity).toBe('error');
    expect(insights[0].file).toBe('src/large.ts');
  });

  test('formats circular dependency insights', () => {
    const issues = [
      {
        type: 'circular-dependency',
        cycle: ['src/a.ts', 'src/b.ts', 'src/a.ts'],
        severity: 'error'
      }
    ];

    const insights = generator.generateInsights(issues);

    expect(insights).toHaveLength(1);
    expect(insights[0].description).toContain('circular');
    expect(insights[0].description).toContain('src/a.ts');
  });

  test('formats complexity insights with actionable suggestions', () => {
    const issues = [
      {
        type: 'complexity',
        filePath: 'src/complex.ts',
        functionName: 'processData',
        complexity: 15,
        severity: 'warning'
      }
    ];

    const insights = generator.generateInsights(issues);

    expect(insights).toHaveLength(1);
    expect(insights[0].description).toContain('complex');
    expect(insights[0].severity).toBe('warning');
  });

  test('handles empty issues array', () => {
    const insights = generator.generateInsights([]);

    expect(insights).toHaveLength(0);
  });
});
