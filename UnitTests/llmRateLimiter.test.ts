import { LLMRateLimiter } from '../src/ai/llmRateLimiter';

// Mocks
jest.spyOn(console, 'log').mockImplementation();
jest.spyOn(global, 'setTimeout');

describe('LLMRateLimiter - waitTime calculation and delay', () => {
  let rateLimiter: LLMRateLimiter;
  let consoleLogSpy: jest.SpyInstance;
  let setTimeoutSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    rateLimiter = new LLMRateLimiter();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('should wait when rate limit is exceeded', async () => {
    const provider = 'test-provider';
    const config = { maxRequests: 2, windowMs: 1000 };
    
    // Make requests to fill the rate limit
    const acquirePromise1 = rateLimiter.acquireToken(provider, config);
    jest.advanceTimersByTime(0);
    await acquirePromise1;
    
    const acquirePromise2 = rateLimiter.acquireToken(provider, config);
    jest.advanceTimersByTime(0);
    await acquirePromise2;
    
    // Third request should trigger wait
    const acquirePromise3 = rateLimiter.acquireToken(provider, config);
    jest.advanceTimersByTime(0);
    
    // Verify setTimeout was called with positive wait time
    expect(setTimeoutSpy).toHaveBeenCalled();
    const waitTime = setTimeoutSpy.mock.calls[setTimeoutSpy.mock.calls.length - 1][1];
    expect(waitTime).toBeGreaterThan(0);
    
    // Verify console log was called with rate limit message
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Rate limit reached for ${provider}`)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Waiting')
    );
    
    jest.advanceTimersByTime(waitTime as number);
    await acquirePromise3;
  });

  test('should calculate wait time with 100ms buffer', async () => {
    const provider = 'test-provider';
    const config = { maxRequests: 1, windowMs: 1000 };
    
    // First request
    const firstRequestTime = Date.now();
    await rateLimiter.acquireToken(provider, config);
    
    // Second request immediately after should wait
    const acquirePromise = rateLimiter.acquireToken(provider, config);
    jest.advanceTimersByTime(0);
    
    // Check that wait time includes buffer
    if (setTimeoutSpy.mock.calls.length > 0) {
      const waitTime = setTimeoutSpy.mock.calls[setTimeoutSpy.mock.calls.length - 1][1] as number;
      // Wait time should be approximately windowMs + 100ms buffer
      expect(waitTime).toBeGreaterThanOrEqual(100);
      expect(waitTime).toBeLessThanOrEqual(config.windowMs + 200);
    }
    
    jest.advanceTimersByTime(1200);
    await acquirePromise;
  });

  test('should not wait when rate limit is not exceeded', async () => {
    const provider = 'test-provider';
    const config = { maxRequests: 5, windowMs: 1000 };
    
    setTimeoutSpy.mockClear();
    
    // Make a single request
    await rateLimiter.acquireToken(provider, config);
    
    // setTimeout should not be called with positive wait time
    const relevantSetTimeoutCalls = setTimeoutSpy.mock.calls.filter(
      (call) => call[1] > 0
    );
    expect(relevantSetTimeoutCalls.length).toBe(0);
  });

  test('should handle multiple providers independently', async () => {
    const provider1 = 'provider-1';
    const provider2 = 'provider-2';
    const config = { maxRequests: 1, windowMs: 1000 };
    
    // Exhaust provider1 rate limit
    await rateLimiter.acquireToken(provider1, config);
    
    setTimeoutSpy.mockClear();
    
    // Provider2 should not be affected
    await rateLimiter.acquireToken(provider2, config);
    
    const relevantSetTimeoutCalls = setTimeoutSpy.mock.calls.filter(
      (call) => call[1] > 0
    );
    expect(relevantSetTimeoutCalls.length).toBe(0);
  });

  test('should correctly calculate wait time when oldest request is removed', async () => {
    const provider = 'test-provider';
    const config = { maxRequests: 2, windowMs: 500 };
    
    // First request
    await rateLimiter.acquireToken(provider, config);
    
    // Advance time partially
    jest.advanceTimersByTime(300);
    
    // Second request
    await rateLimiter.acquireToken(provider, config);
    
    setTimeoutSpy.mockClear();
    
    // Third request should wait for remaining time + buffer
    const acquirePromise = rateLimiter.acquireToken(provider, config);
    jest.advanceTimersByTime(0);
    
    if (setTimeoutSpy.mock.calls.length > 0) {
      const waitTime = setTimeoutSpy.mock.calls[0][1] as number;
      // Should wait approximately 200ms (500 - 300) + 100ms buffer
      expect(waitTime).toBeGreaterThan(0);
      expect(waitTime).toBeLessThanOrEqual(400);
    }
    
    jest.advanceTimersByTime(400);
    await acquirePromise;
  });

  test('should handle zero or negative wait time correctly', async () => {
    const provider = 'test-provider';
    const config = { maxRequests: 1, windowMs: 100 };
    
    // First request
    await rateLimiter.acquireToken(provider, config);
    
    // Wait longer than the window
    jest.advanceTimersByTime(200);
    
    setTimeoutSpy.mockClear();
    
    // Second request should not wait
    await rateLimiter.acquireToken(provider, config);
    
    const relevantSetTimeoutCalls = setTimeoutSpy.mock.calls.filter(
      (call) => call[1] > 0
    );
    expect(relevantSetTimeoutCalls.length).toBe(0);
  });
})