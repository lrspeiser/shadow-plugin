import { generateInsights } from '../insightGenerator';
import { detectDesignPatterns } from '../insightGenerator';

// Test: test_generateInsights_produces_architecture_analysis
// Verifies insight generation from analysis results
import { generateInsights } from '../insightGenerator';

describe('insightGenerator.generateInsights', () => {
  test('generates insights from analysis results', () => {
    const analysisResult = {
      files: [
        { path: 'src/module1.ts', lines: 500, functions: ['func1', 'func2'] },
        { path: 'src/module2.ts', lines: 300, functions: ['func3'] }
      ],
      issues: [
        { severity: 'error', category: 'Code Organization', description: 'God object' }
      ],
      healthScore: 75,
      statistics: {
        totalFiles: 2,
        totalLines: 800,
        totalFunctions: 3
      }
    };
    
    const insights = generateInsights(analysisResult);
    
    expect(insights).toHaveProperty('patterns');
    expect(insights).toHaveProperty('metrics');
    expect(insights.patterns.length).toBeGreaterThan(0);
  });

  test('detects architecture patterns', () => {
    const analysisResult = {
      files: [
        { path: 'src/controllers/userController.ts', lines: 200, functions: [] },
        { path: 'src/services/userService.ts', lines: 150, functions: [] },
        { path: 'src/models/user.ts', lines: 100, functions: [] }
      ],
      issues: [],
      healthScore: 90,
      statistics: { totalFiles: 3, totalLines: 450, totalFunctions: 0 }
    };
    
    const insights = generateInsights(analysisResult);
    
    expect(insights.patterns).toContain(expect.stringMatching(/MVC|layered/i));
  });

  test('calculates architecture metrics', () => {
    const analysisResult = {
      files: [{ path: 'src/test.ts', lines: 100, functions: [] }],
      issues: [],
      healthScore: 100,
      statistics: { totalFiles: 1, totalLines: 100, totalFunctions: 0 }
    };
    
    const insights = generateInsights(analysisResult);
    
    expect(insights.metrics).toHaveProperty('averageFileSize');
    expect(insights.metrics).toHaveProperty('complexityScore');
  });
});

// Test: test_detectDesignPatterns_identifies_common_patterns
// Verifies design pattern detection from file structure and naming
import { detectDesignPatterns } from '../insightGenerator';

describe('insightGenerator.detectDesignPatterns', () => {
  test('detects MVC pattern from file structure', () => {
    const files = [
      'src/controllers/homeController.ts',
      'src/views/homeView.ts',
      'src/models/home.ts'
    ];
    
    const patterns = detectDesignPatterns(files);
    
    expect(patterns).toContain(expect.objectContaining({
      name: 'MVC',
      confidence: expect.any(Number)
    }));
  });

  test('detects factory pattern from naming', () => {
    const files = [
      'src/factories/userFactory.ts',
      'src/factories/productFactory.ts'
    ];
    
    const patterns = detectDesignPatterns(files);
    
    expect(patterns).toContain(expect.objectContaining({
      name: expect.stringMatching(/factory/i)
    }));
  });

  test('returns empty array for unstructured codebase', () => {
    const files = [
      'src/random1.ts',
      'src/random2.ts'
    ];
    
    const patterns = detectDesignPatterns(files);
    
    expect(patterns.length).toBe(0);
  });
});
