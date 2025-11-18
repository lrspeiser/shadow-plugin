import { LLMRateLimiter } from '../ai/llmRateLimiter';

// Test: test_rateLimiter_throttlesRequests
// Verifies rate limiter properly throttles API requests
import { LLMRateLimiter } from '../ai/llmRateLimiter';

describe('LLMRateLimiter.throttle', () => {
  let rateLimiter: LLMRateLimiter;

  beforeEach(() => {
    rateLimiter = new LLMRateLimiter({ requestsPerMinute: 10, tokensPerMinute: 100000 });
  });

  test('allows requests when under limit', async () => {
    const start = Date.now();

    await rateLimiter.throttle();

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  test('tracks request count correctly', async () => {
    for (let i = 0; i  {
    const limit = 3;
    const limiter = new LLMRateLimiter({ requestsPerMinute: limit, tokensPerMinute: 100000 });

    for (let i = 0; i  {
    await rateLimiter.throttle(1000);
    await rateLimiter.throttle(2000);

    const stats = rateLimiter.getStats();
    expect(stats.tokenCount).toBe(3000);
  });
});
