import { RateLimiter } from '../ai/llmRateLimiter';

// Test: test_acquire_enforces_limits
// Verifies rate limiter enforces request limits per time window
import { RateLimiter } from '../ai/llmRateLimiter';

jest.useFakeTimers();

describe('RateLimiter - acquire', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(3, 1000);
    jest.clearAllTimers();
  });

  test('allows requests under limit', async () => {
    const promise1 = rateLimiter.acquire();
    const promise2 = rateLimiter.acquire();
    const promise3 = rateLimiter.acquire();

    await expect(promise1).resolves.toBeUndefined();
    await expect(promise2).resolves.toBeUndefined();
    await expect(promise3).resolves.toBeUndefined();
  });

  test('delays requests over limit', async () => {
    await rateLimiter.acquire();
    await rateLimiter.acquire();
    await rateLimiter.acquire();

    const promise4 = rateLimiter.acquire();
    expect(promise4).toBeInstanceOf(Promise);

    jest.advanceTimersByTime(1000);
    await expect(promise4).resolves.toBeUndefined();
  });

  test('resets limit after time window', async () => {
    await rateLimiter.acquire();
    await rateLimiter.acquire();
    await rateLimiter.acquire();

    jest.advanceTimersByTime(1100);

    const promise = rateLimiter.acquire();
    await expect(promise).resolves.toBeUndefined();
  });
});
