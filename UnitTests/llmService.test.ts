import { LLMService } from '../llmService';
import { ILLMProvider } from '../ai/providers/ILLMProvider';
import { ConfigurationManager } from '../config/configurationManager';
import { LLMRateLimiter } from '../ai/llmRateLimiter';
import { LLMRetryHandler } from '../ai/llmRetryHandler';

// Test: test_generateProductDocumentation_calls_provider
// Verifies product documentation generation orchestrates LLM provider correctly
import { LLMService } from '../llmService';
import { ILLMProvider } from '../ai/providers/ILLMProvider';
import { ConfigurationManager } from '../config/configurationManager';

jest.mock('../config/configurationManager');

describe('LLMService.generateProductDocumentation', () => {
  let llmService: LLMService;
  let mockProvider: jest.Mocked;
  let mockConfig: jest.Mocked;

  beforeEach(() => {
    mockProvider = {
      generateCompletion: jest.fn(),
      getName: jest.fn().mockReturnValue('test-provider'),
      isConfigured: jest.fn().mockReturnValue(true)
    } as any;
    
    mockConfig = {
      getActiveProvider: jest.fn().mockReturnValue('openai'),
      getOpenAIApiKey: jest.fn().mockReturnValue('test-key')
    } as any;
    
    llmService = new LLMService(mockProvider, mockConfig);
  });

  test('calls provider with correct prompt for documentation generation', async () => {
    const mockResponse = JSON.stringify({
      product_overview: 'Test product',
      what_it_does: ['Feature 1', 'Feature 2']
    });
    mockProvider.generateCompletion.mockResolvedValue(mockResponse);
    
    const codebaseStats = {
      totalFiles: 10,
      totalLines: 1000,
      languages: ['typescript']
    };
    
    const result = await llmService.generateProductDocumentation(codebaseStats);
    
    expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('product_overview');
    expect(result).toHaveProperty('what_it_does');
  });

  test('handles provider failure with error', async () => {
    mockProvider.generateCompletion.mockRejectedValue(new Error('API Error'));
    
    const codebaseStats = { totalFiles: 10, totalLines: 1000, languages: ['typescript'] };
    
    await expect(llmService.generateProductDocumentation(codebaseStats)).rejects.toThrow();
  });

  test('validates response against schema', async () => {
    const invalidResponse = JSON.stringify({ invalid: 'data' });
    mockProvider.generateCompletion.mockResolvedValue(invalidResponse);
    
    const codebaseStats = { totalFiles: 10, totalLines: 1000, languages: ['typescript'] };
    
    await expect(llmService.generateProductDocumentation(codebaseStats)).rejects.toThrow();
  });
});

// Test: test_generateArchitectureInsights_analyzes_codebase
// Verifies architecture insights generation processes codebase structure correctly
import { LLMService } from '../llmService';
import { ILLMProvider } from '../ai/providers/ILLMProvider';

jest.mock('../config/configurationManager');

describe('LLMService.generateArchitectureInsights', () => {
  let llmService: LLMService;
  let mockProvider: jest.Mocked;

  beforeEach(() => {
    mockProvider = {
      generateCompletion: jest.fn(),
      getName: jest.fn().mockReturnValue('test-provider'),
      isConfigured: jest.fn().mockReturnValue(true)
    } as any;
    
    llmService = new LLMService(mockProvider, {} as any);
  });

  test('generates architecture insights with valid response', async () => {
    const mockInsights = JSON.stringify({
      overall_assessment: 'Well-structured codebase',
      strengths: ['Good separation of concerns'],
      critical_issues: [],
      recommendations: ['Consider adding tests']
    });
    mockProvider.generateCompletion.mockResolvedValue(mockInsights);
    
    const analysisResult = {
      files: ['src/test.ts'],
      issues: [],
      statistics: { totalFiles: 1 }
    };
    
    const insights = await llmService.generateArchitectureInsights(analysisResult);
    
    expect(insights).toHaveProperty('overall_assessment');
    expect(insights).toHaveProperty('strengths');
    expect(insights).toHaveProperty('recommendations');
  });

  test('handles large codebase by chunking requests', async () => {
    mockProvider.generateCompletion.mockResolvedValue(JSON.stringify({ overall_assessment: 'Test' }));
    
    const largeAnalysisResult = {
      files: new Array(1000).fill('src/file.ts'),
      issues: [],
      statistics: { totalFiles: 1000 }
    };
    
    await llmService.generateArchitectureInsights(largeAnalysisResult);
    
    expect(mockProvider.generateCompletion).toHaveBeenCalled();
  });
});

// Test: test_rateLimiting_throttles_requests
// Verifies rate limiting prevents exceeding provider API limits
import { LLMRateLimiter } from '../ai/llmRateLimiter';

jest.useFakeTimers();

describe('LLMRateLimiter.throttle', () => {
  let rateLimiter: LLMRateLimiter;

  beforeEach(() => {
    rateLimiter = new LLMRateLimiter({
      maxRequestsPerMinute: 10,
      maxTokensPerMinute: 10000
    });
  });

  test('allows requests within rate limit', async () => {
    const request = async () => 'success';
    
    const result = await rateLimiter.throttle(request, 100);
    
    expect(result).toBe('success');
  });

  test('delays requests exceeding rate limit', async () => {
    for (let i = 0; i  'ok', 100);
    }
    
    const delayedRequest = rateLimiter.throttle(async () => 'delayed', 100);
    
    jest.advanceTimersByTime(6000);
    
    const result = await delayedRequest;
    expect(result).toBe('delayed');
  });

  test('tracks token consumption', async () => {
    await rateLimiter.throttle(async () => 'ok', 5000);
    await rateLimiter.throttle(async () => 'ok', 5000);
    
    const stats = rateLimiter.getStats();
    expect(stats.tokensUsed).toBe(10000);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
});

// Test: test_retryHandler_retries_failed_requests
// Verifies retry logic handles transient failures with exponential backoff
import { LLMRetryHandler } from '../ai/llmRetryHandler';

jest.useFakeTimers();

describe('LLMRetryHandler.retryWithBackoff', () => {
  let retryHandler: LLMRetryHandler;

  beforeEach(() => {
    retryHandler = new LLMRetryHandler({ maxRetries: 3, baseDelay: 1000 });
  });

  test('retries request on transient failure', async () => {
    let attempts = 0;
    const operation = jest.fn(async () => {
      attempts++;
      if (attempts  {
    const operation = jest.fn(async () => {
      throw new Error('Persistent error');
    });
    
    await expect(retryHandler.retryWithBackoff(operation)).rejects.toThrow();
    expect(operation).toHaveBeenCalledTimes(4);
  });

  test('uses exponential backoff', async () => {
    const delays: number[] = [];
    const operation = jest.fn(async () => {
      delays.push(Date.now());
      throw new Error('Error');
    });
    
    retryHandler.retryWithBackoff(operation).catch(() => {});
    
    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(2000);
    jest.advanceTimersByTime(4000);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
});
