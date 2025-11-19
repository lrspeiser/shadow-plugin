import { LLMService } from '../llmService';
import { ILLMProvider } from '../ai/providers/ILLMProvider';
import { LLMRateLimiter } from '../ai/llmRateLimiter';

// Test: test_generate_documentation_success
// Verifies successful documentation generation from AI provider with valid response
describe('LLMService - generateDocumentation', () => {
  let llmService: LLMService;
  let mockProvider: jest.Mocked;

  beforeEach(() => {
    mockProvider = {
      generateCompletion: jest.fn(),
      getModelName: jest.fn().mockReturnValue('gpt-4'),
      validateApiKey: jest.fn().mockReturnValue(true),
      estimateTokens: jest.fn().mockReturnValue(1000)
    } as any;

    llmService = new LLMService();
    llmService['provider'] = mockProvider;
    jest.clearAllMocks();
  });

  test('should generate documentation with valid response', async () => {
    const mockAnalysis = {
      files: ['file1.ts', 'file2.ts'],
      functions: 50,
      insights: []
    };

    const mockResponse = {
      content: JSON.stringify({
        overview: 'Application overview',
        features: ['Feature 1', 'Feature 2'],
        architecture: 'Architecture description'
      }),
      usage: { prompt_tokens: 500, completion_tokens: 300 }
    };

    mockProvider.generateCompletion.mockResolvedValue(mockResponse);

    const result = await llmService.generateDocumentation(mockAnalysis);

    expect(result).toBeDefined();
    expect(result.overview).toBe('Application overview');
    expect(result.features).toHaveLength(2);
    expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(1);
  });

  test('should handle API errors gracefully', async () => {
    const mockAnalysis = {
      files: ['file1.ts'],
      functions: 10,
      insights: []
    };

    mockProvider.generateCompletion.mockRejectedValue(
      new Error('API rate limit exceeded')
    );

    await expect(llmService.generateDocumentation(mockAnalysis)).rejects.toThrow(
      'API rate limit exceeded'
    );
  });

  test('should handle malformed response', async () => {
    const mockAnalysis = {
      files: ['file1.ts'],
      functions: 10,
      insights: []
    };

    const mockResponse = {
      content: 'invalid json',
      usage: { prompt_tokens: 100, completion_tokens: 50 }
    };

    mockProvider.generateCompletion.mockResolvedValue(mockResponse);

    await expect(llmService.generateDocumentation(mockAnalysis)).rejects.toThrow();
  });
});

// Test: test_rate_limiter_enforcement
// Verifies rate limiting enforces request limits and queues requests appropriately
jest.useFakeTimers();

describe('LLMRateLimiter', () => {
  let rateLimiter: LLMRateLimiter;

  beforeEach(() => {
    rateLimiter = new LLMRateLimiter({
      requestsPerMinute: 3,
      tokensPerMinute: 1000
    });
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should allow requests within rate limit', async () => {
    const mockRequest = jest.fn().mockResolvedValue('response');

    const result1 = await rateLimiter.executeWithRateLimit(mockRequest, 100);
    const result2 = await rateLimiter.executeWithRateLimit(mockRequest, 100);
    const result3 = await rateLimiter.executeWithRateLimit(mockRequest, 100);

    expect(result1).toBe('response');
    expect(result2).toBe('response');
    expect(result3).toBe('response');
    expect(mockRequest).toHaveBeenCalledTimes(3);
  });

  test('should queue requests exceeding rate limit', async () => {
    const mockRequest = jest.fn().mockResolvedValue('response');

    const promise1 = rateLimiter.executeWithRateLimit(mockRequest, 100);
    const promise2 = rateLimiter.executeWithRateLimit(mockRequest, 100);
    const promise3 = rateLimiter.executeWithRateLimit(mockRequest, 100);
    const promise4 = rateLimiter.executeWithRateLimit(mockRequest, 100);

    await promise1;
    await promise2;
    await promise3;

    expect(mockRequest).toHaveBeenCalledTimes(3);

    jest.advanceTimersByTime(60000);
    await promise4;

    expect(mockRequest).toHaveBeenCalledTimes(4);
  });

  test('should throw error on token limit exceeded', async () => {
    const mockRequest = jest.fn().mockResolvedValue('response');

    await expect(
      rateLimiter.executeWithRateLimit(mockRequest, 2000)
    ).rejects.toThrow('Token limit exceeded');
  });
});
