import { LLMService } from '../llmService';
import { ProviderFactory } from '../ai/providers/providerFactory';
import { ConfigurationManager } from '../config/configurationManager';
import { LLMRateLimiter } from '../ai/llmRateLimiter';
import { LLMRetryHandler } from '../ai/llmRetryHandler';

// Test: test_callLLMAPI_sends_request_successfully
// Verifies LLM API call sends request with correct parameters and returns response
import { LLMService } from '../llmService';
import { ProviderFactory } from '../ai/providers/providerFactory';
import { ConfigurationManager } from '../config/configurationManager';

jest.mock('../ai/providers/providerFactory');
jest.mock('../config/configurationManager');

describe('LLMService.callLLMAPI', () => {
  let llmService: LLMService;
  let mockProvider: any;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProvider = {
      sendRequest: jest.fn().mockResolvedValue({ content: 'test response', usage: { tokens: 100 } })
    };
    mockConfig = {
      getProvider: jest.fn().mockReturnValue('openai'),
      getModel: jest.fn().mockReturnValue('gpt-4'),
      getApiKey: jest.fn().mockReturnValue('test-key')
    };
    (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);
    (ConfigurationManager.getInstance as jest.Mock).mockReturnValue(mockConfig);
    llmService = new LLMService();
  });

  it('should send request with correct parameters', async () => {
    const prompt = 'test prompt';
    const systemPrompt = 'system prompt';

    await llmService.callLLMAPI(prompt, systemPrompt);

    expect(mockProvider.sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system', content: systemPrompt }),
          expect.objectContaining({ role: 'user', content: prompt })
        ])
      })
    );
  });

  it('should return parsed response', async () => {
    const prompt = 'test prompt';
    const expected = { content: 'test response', usage: { tokens: 100 } };

    const result = await llmService.callLLMAPI(prompt, 'system');

    expect(result).toEqual(expected);
  });

  it('should handle valid JSON response', async () => {
    const jsonResponse = { data: { key: 'value' } };
    mockProvider.sendRequest.mockResolvedValue({ content: JSON.stringify(jsonResponse), usage: { tokens: 100 } });

    const result = await llmService.callLLMAPI('test', 'system');

    expect(result.content).toBe(JSON.stringify(jsonResponse));
  });
});

// Test: test_parseResponse_validates_json_schema
// Verifies parseResponse correctly validates LLM response against JSON schema
import { LLMService } from '../llmService';

describe('LLMService.parseResponse', () => {
  let llmService: LLMService;

  beforeEach(() => {
    llmService = new LLMService();
  });

  it('should parse valid JSON matching schema', () => {
    const validJson = JSON.stringify({
      insights: [{ type: 'architecture', description: 'test', severity: 'info' }],
      summary: 'test summary'
    });

    const result = llmService.parseResponse(validJson, 'insights');

    expect(result).toHaveProperty('insights');
    expect(result).toHaveProperty('summary');
    expect(Array.isArray(result.insights)).toBe(true);
  });

  it('should throw error for invalid JSON syntax', () => {
    const invalidJson = '{ invalid json';

    expect(() => llmService.parseResponse(invalidJson, 'insights')).toThrow();
  });

  it('should throw error for missing required fields', () => {
    const missingFields = JSON.stringify({ summary: 'test' });

    expect(() => llmService.parseResponse(missingFields, 'insights')).toThrow();
  });

  it('should preserve valid data structure', () => {
    const validJson = JSON.stringify({
      insights: [
        { type: 'architecture', description: 'test insight', severity: 'warning', file: 'test.ts' }
      ],
      summary: 'test summary',
      metadata: { analyzed_at: '2024-01-01' }
    });

    const result = llmService.parseResponse(validJson, 'insights');

    expect(result.insights[0].type).toBe('architecture');
    expect(result.insights[0].description).toBe('test insight');
    expect(result.summary).toBe('test summary');
  });
});

// Test: test_rateLimiter_throttles_requests
// Verifies rate limiter correctly throttles requests to configured rate
import { LLMRateLimiter } from '../ai/llmRateLimiter';

jest.useFakeTimers();

describe('LLMRateLimiter.throttle', () => {
  let rateLimiter: LLMRateLimiter;

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimiter = new LLMRateLimiter(2, 1000);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should allow requests within limit', async () => {
    const fn = jest.fn().mockResolvedValue('result');

    const promise1 = rateLimiter.throttle(fn);
    const promise2 = rateLimiter.throttle(fn);

    await Promise.all([promise1, promise2]);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should queue requests exceeding limit', async () => {
    const fn = jest.fn().mockResolvedValue('result');

    rateLimiter.throttle(fn);
    rateLimiter.throttle(fn);
    const promise3 = rateLimiter.throttle(fn);

    expect(fn).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(1000);
    await promise3;

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should process queue in order', async () => {
    const results: number[] = [];
    const fn = (id: number) => {
      results.push(id);
      return Promise.resolve(id);
    };

    rateLimiter.throttle(() => fn(1));
    rateLimiter.throttle(() => fn(2));
    rateLimiter.throttle(() => fn(3));

    jest.advanceTimersByTime(2000);
    await Promise.resolve();

    expect(results).toEqual([1, 2, 3]);
  });
});

// Test: test_retryHandler_retries_failed_requests
// Verifies retry handler retries failed requests with exponential backoff
import { LLMRetryHandler } from '../ai/llmRetryHandler';

jest.useFakeTimers();

describe('LLMRetryHandler.retry', () => {
  let retryHandler: LLMRetryHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    retryHandler = new LLMRetryHandler(3, 1000);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should succeed on first try without retry', async () => {
    const fn = jest.fn().mockResolvedValue('success');

    const result = await retryHandler.retry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on transient failure and succeed', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success');

    const promise = retryHandler.retry(fn);
    jest.advanceTimersByTime(1000);
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should give up after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Persistent error'));

    const promise = retryHandler.retry(fn);
    jest.advanceTimersByTime(10000);

    await expect(promise).rejects.toThrow('Persistent error');
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('should fail immediately for non-retryable errors', async () => {
    const authError = new Error('Authentication failed');
    authError.name = 'AuthenticationError';
    const fn = jest.fn().mockRejectedValue(authError);

    await expect(retryHandler.retry(fn)).rejects.toThrow('Authentication failed');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
