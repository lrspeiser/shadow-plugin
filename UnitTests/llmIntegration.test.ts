import { generateProductDocs } from '../llmIntegration';
import { LLMService } from '../llmService';
import * as fs from 'fs';
import { generateLLMInsights } from '../llmIntegration';
import { Analyzer } from '../analyzer';
import { generateUnitTests } from '../llmIntegration';

// Test: test_generateProductDocs_creates_documentation
// Verifies generateProductDocs creates comprehensive product documentation from codebase
import { generateProductDocs } from '../llmIntegration';
import { LLMService } from '../llmService';
import * as fs from 'fs';

jest.mock('../llmService');
jest.mock('fs');

describe('generateProductDocs', () => {
  let mockLLMService: jest.Mocked;
  const mockFs = fs as jest.Mocked;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLLMService = {
      callLLMAPI: jest.fn().mockResolvedValue({
        content: JSON.stringify({
          product_overview: 'Test product overview',
          key_features: ['Feature 1', 'Feature 2'],
          architecture_summary: 'Architecture summary',
          user_workflows: ['Workflow 1']
        })
      })
    } as any;
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.mkdirSync.mockImplementation(() => {});
  });

  it('should create documentation with all sections', async () => {
    const result = await generateProductDocs(mockLLMService, '/test/workspace');

    expect(result).toHaveProperty('product_overview');
    expect(result).toHaveProperty('key_features');
    expect(result).toHaveProperty('architecture_summary');
    expect(result).toHaveProperty('user_workflows');
  });

  it('should save documentation to file system', async () => {
    await generateProductDocs(mockLLMService, '/test/workspace');

    expect(mockFs.writeFileSync).toHaveBeenCalled();
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.shadow'),
      expect.any(String)
    );
  });

  it('should handle API failure gracefully', async () => {
    mockLLMService.callLLMAPI.mockRejectedValue(new Error('API Error'));

    await expect(generateProductDocs(mockLLMService, '/test/workspace')).rejects.toThrow('API Error');
  });

  it('should validate response format', async () => {
    mockLLMService.callLLMAPI.mockResolvedValue({
      content: JSON.stringify({ invalid: 'format' })
    });

    await expect(generateProductDocs(mockLLMService, '/test/workspace')).rejects.toThrow();
  });
});

// Test: test_generateLLMInsights_creates_architectural_insights
// Verifies generateLLMInsights creates architectural insights from code analysis
import { generateLLMInsights } from '../llmIntegration';
import { LLMService } from '../llmService';
import { Analyzer } from '../analyzer';

jest.mock('../llmService');
jest.mock('../analyzer');

describe('generateLLMInsights', () => {
  let mockLLMService: jest.Mocked;
  let mockAnalyzer: jest.Mocked;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLLMService = {
      callLLMAPI: jest.fn().mockResolvedValue({
        content: JSON.stringify({
          insights: [
            { type: 'architecture', description: 'Insight 1', severity: 'info', file: 'test.ts' },
            { type: 'performance', description: 'Insight 2', severity: 'warning', file: 'test.ts' }
          ],
          summary: 'Analysis summary'
        })
      })
    } as any;
    mockAnalyzer = {
      analyzeWorkspace: jest.fn().mockResolvedValue({
        healthScore: 85,
        issues: [],
        files: ['test.ts']
      })
    } as any;
  });

  it('should return insights array with metadata', async () => {
    const result = await generateLLMInsights(mockLLMService, mockAnalyzer, '/test/workspace');

    expect(Array.isArray(result.insights)).toBe(true);
    expect(result.insights).toHaveLength(2);
    expect(result).toHaveProperty('summary');
  });

  it('should categorize insights by type', async () => {
    const result = await generateLLMInsights(mockLLMService, mockAnalyzer, '/test/workspace');

    const types = result.insights.map((i: any) => i.type);
    expect(types).toContain('architecture');
    expect(types).toContain('performance');
  });

  it('should handle empty codebase', async () => {
    mockAnalyzer.analyzeWorkspace.mockResolvedValue({ healthScore: 100, issues: [], files: [] });
    mockLLMService.callLLMAPI.mockResolvedValue({
      content: JSON.stringify({ insights: [], summary: 'No insights' })
    });

    const result = await generateLLMInsights(mockLLMService, mockAnalyzer, '/test/workspace');

    expect(result.insights).toHaveLength(0);
    expect(result.summary).toBe('No insights');
  });
});

// Test: test_generateUnitTests_creates_test_plan
// Verifies generateUnitTests creates comprehensive unit test plan from codebase
import { generateUnitTests } from '../llmIntegration';
import { LLMService } from '../llmService';
import { Analyzer } from '../analyzer';

jest.mock('../llmService');
jest.mock('../analyzer');

describe('generateUnitTests', () => {
  let mockLLMService: jest.Mocked;
  let mockAnalyzer: jest.Mocked;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLLMService = {
      callLLMAPI: jest.fn().mockResolvedValue({
        content: JSON.stringify({
          unit_test_strategy: {
            overall_approach: 'Test approach',
            testing_frameworks: ['jest'],
            mocking_strategy: 'Mock strategy',
            isolation_level: 'Unit level'
          },
          test_suites: [
            {
              id: 'suite-1',
              name: 'Test Suite 1',
              description: 'Test suite description',
              test_file_path: 'src/test/test.test.ts',
              source_files: ['src/test.ts'],
              test_cases: [
                {
                  id: 'test-1',
                  name: 'test_function',
                  description: 'Test description',
                  target_function: 'targetFunction',
                  target_file: 'src/test.ts',
                  priority: 'high',
                  test_code: 'import { test } from "src/test"; test();',
                  run_instructions: 'npm test -- test.test.ts'
                }
              ]
            }
          ],
          rationale: 'Test rationale'
        })
      })
    } as any;
    mockAnalyzer = {
      analyzeWorkspace: jest.fn().mockResolvedValue({ files: ['test.ts'], functions: ['testFn'] })
    } as any;
  });

  it('should return test plan with test suites', async () => {
    const result = await generateUnitTests(mockLLMService, mockAnalyzer, '/test/workspace');

    expect(result).toHaveProperty('unit_test_strategy');
    expect(result).toHaveProperty('test_suites');
    expect(Array.isArray(result.test_suites)).toBe(true);
    expect(result.test_suites).toHaveLength(1);
  });

  it('should include executable test code', async () => {
    const result = await generateUnitTests(mockLLMService, mockAnalyzer, '/test/workspace');

    const testCase = result.test_suites[0].test_cases[0];
    expect(testCase.test_code).toBeTruthy();
    expect(testCase.test_code.length).toBeGreaterThan(0);
    expect(testCase.test_code).toContain('import');
  });

  it('should include run instructions', async () => {
    const result = await generateUnitTests(mockLLMService, mockAnalyzer, '/test/workspace');

    const testCase = result.test_suites[0].test_cases[0];
    expect(testCase.run_instructions).toBeTruthy();
    expect(testCase.run_instructions).toContain('npm test');
  });

  it('should validate test strategy structure', async () => {
    const result = await generateUnitTests(mockLLMService, mockAnalyzer, '/test/workspace');

    expect(result.unit_test_strategy).toHaveProperty('overall_approach');
    expect(result.unit_test_strategy).toHaveProperty('testing_frameworks');
    expect(result.unit_test_strategy).toHaveProperty('mocking_strategy');
    expect(result.unit_test_strategy).toHaveProperty('isolation_level');
  });
});
