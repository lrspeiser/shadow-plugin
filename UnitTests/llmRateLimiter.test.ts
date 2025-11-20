import { LLMRateLimiter, LLMProvider, RateLimitConfig } from '../llmRateLimiter';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');
jest.useFakeTimers();

describe('LLMRateLimiter.enforceRateLimit', () => {
  let rateLimiter: LLMRateLimiter;
  let originalDateNow: () => number;
  let mockTime: number;

  beforeEach(() => {
    rateLimiter = new LLMRateLimiter();
    jest.useFakeTimers();
    mockTime = 1000000000;
    originalDateNow = Date.now;
    Date.now = jest.fn(() => mockTime);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    Date.now = originalDateNow;
  });

  describe('canMakeRequest', () => {
    test('should return true when no rate limit is configured for provider', () => {
      const provider: LLMProvider = 'openai';
      const result = rateLimiter.canMakeRequest(provider);
      expect(result).toBe(true);
    });

    test('should return true when request count is under limit', () => {
      const provider: LLMProvider = 'anthropic';
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000
      };
      rateLimiter.setRateLimit(provider, config);
      
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      
      const result = rateLimiter.canMakeRequest(provider);
      expect(result).toBe(true);
    });

    test('should return false when request count reaches limit', () => {
      const provider: LLMProvider = 'openai';
      const config: RateLimitConfig = {
        maxRequests: 3,
        windowMs: 60000
      };
      rateLimiter.setRateLimit(provider, config);
      
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      
      const result = rateLimiter.canMakeRequest(provider);
      expect(result).toBe(false);
    });

    test('should filter out old requests outside the time window', () => {
      const provider: LLMProvider = 'openai';
      const config: RateLimitConfig = {
        maxRequests: 3,
        windowMs: 60000
      };
      rateLimiter.setRateLimit(provider, config);
      
      mockTime = 1000000000;
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      
      mockTime = 1000000000 + 61000;
      
      const result = rateLimiter.canMakeRequest(provider);
      expect(result).toBe(true);
    });

    test('should correctly handle requests at window boundary', () => {
      const provider: LLMProvider = 'anthropic';
      const config: RateLimitConfig = {
        maxRequests: 2,
        windowMs: 10000
      };
      rateLimiter.setRateLimit(provider, config);
      
      mockTime = 1000000000;
      rateLimiter.recordRequest(provider);
      
      mockTime = 1000000000 + 5000;
      rateLimiter.recordRequest(provider);
      
      mockTime = 1000000000 + 10001;
      
      const result = rateLimiter.canMakeRequest(provider);
      expect(result).toBe(true);
    });
  });

  describe('recordRequest', () => {
    test('should record a single request timestamp', () => {
      const provider: LLMProvider = 'openai';
      mockTime = 1234567890;
      
      rateLimiter.recordRequest(provider);
      
      const count = rateLimiter.getRequestCount(provider);
      expect(count).toBe(0);
    });

    test('should record multiple request timestamps', () => {
      const provider: LLMProvider = 'openai';
      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000
      };
      rateLimiter.setRateLimit(provider, config);
      
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      
      const count = rateLimiter.getRequestCount(provider);
      expect(count).toBe(3);
    });

    test('should maintain separate histories for different providers', () => {
      const provider1: LLMProvider = 'openai';
      const provider2: LLMProvider = 'anthropic';
      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000
      };
      rateLimiter.setRateLimit(provider1, config);
      rateLimiter.setRateLimit(provider2, config);
      
      rateLimiter.recordRequest(provider1);
      rateLimiter.recordRequest(provider1);
      rateLimiter.recordRequest(provider2);
      
      expect(rateLimiter.getRequestCount(provider1)).toBe(2);
      expect(rateLimiter.getRequestCount(provider2)).toBe(1);
    });
  });

  describe('waitUntilAvailable', () => {
    test('should return immediately when no rate limit is configured', async () => {
      const provider: LLMProvider = 'openai';
      const startTime = Date.now();
      
      await rateLimiter.waitUntilAvailable(provider);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBe(0);
    });

    test('should return immediately when under rate limit', async () => {
      const provider: LLMProvider = 'openai';
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000
      };
      rateLimiter.setRateLimit(provider, config);
      
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      
      const startTime = Date.now();
      await rateLimiter.waitUntilAvailable(provider);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBe(0);
    });

    test('should wait when rate limit is exceeded', async () => {
      const provider: LLMProvider = 'openai';
      const config: RateLimitConfig = {
        maxRequests: 2,
        windowMs: 10000
      };
      rateLimiter.setRateLimit(provider, config);
      
      mockTime = 1000000000;
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      
      mockTime = 1000000000 + 2000;
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const waitPromise = rateLimiter.waitUntilAvailable(provider);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit reached for openai')
      );
      
      await jest.advanceTimersByTimeAsync(8100);
      mockTime = 1000000000 + 10100;
      
      await waitPromise;
      
      consoleLogSpy.mockRestore();
    });

    test('should calculate correct wait time based on oldest request', async () => {
      const provider: LLMProvider = 'anthropic';
      const config: RateLimitConfig = {
        maxRequests: 3,
        windowMs: 5000
      };
      rateLimiter.setRateLimit(provider, config);
      
      mockTime = 1000000000;
      rateLimiter.recordRequest(provider);
      
      mockTime = 1000000000 + 1000;
      rateLimiter.recordRequest(provider);
      
      mockTime = 1000000000 + 2000;
      rateLimiter.recordRequest(provider);
      
      mockTime = 1000000000 + 3000;
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const waitPromise = rateLimiter.waitUntilAvailable(provider);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Waiting \d+ms/)
      );
      
      await jest.advanceTimersByTimeAsync(2100);
      mockTime = 1000000000 + 5100;
      
      await waitPromise;
      
      consoleLogSpy.mockRestore();
    });

    test('should return immediately when request history is empty but limit exists', async () => {
      const provider: LLMProvider = 'openai';
      const config: RateLimitConfig = {
        maxRequests: 2,
        windowMs: 10000
      };
      rateLimiter.setRateLimit(provider, config);
      
      await rateLimiter.waitUntilAvailable(provider);
      
      expect(true).toBe(true);
    });
  });

  describe('getRequestCount', () => {
    test('should return 0 when no configuration exists', () => {
      const provider: LLMProvider = 'openai';
      const count = rateLimiter.getRequestCount(provider);
      expect(count).toBe(0);
    });

    test('should return 0 when no requests have been made', () => {
      const provider: LLMProvider = 'openai';
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000
      };
      rateLimiter.setRateLimit(provider, config);
      
      const count = rateLimiter.getRequestCount(provider);
      expect(count).toBe(0);
    });

    test('should return correct count of recent requests', () => {
      const provider: LLMProvider = 'anthropic';
      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000
      };
      rateLimiter.setRateLimit(provider, config);
      
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      
      const count = rateLimiter.getRequestCount(provider);
      expect(count).toBe(4);
    });

    test('should exclude requests outside the time window', () => {
      const provider: LLMProvider = 'openai';
      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 5000
      };
      rateLimiter.setRateLimit(provider, config);
      
      mockTime = 1000000000;
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      
      mockTime = 1000000000 + 6000;
      rateLimiter.recordRequest(provider);
      
      const count = rateLimiter.getRequestCount(provider);
      expect(count).toBe(1);
    });
  });

  describe('clearHistory', () => {
    test('should clear history for specific provider', () => {
      const provider: LLMProvider = 'openai';
      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000
      };
      rateLimiter.setRateLimit(provider, config);
      
      rateLimiter.recordRequest(provider);
      rateLimiter.recordRequest(provider);
      rateLimiter.clearHistory(provider);
      
      const count = rateLimiter.getRequestCount(provider);
      expect(count).toBe(0);
    });

    test('should clear history for all providers when no provider specified', () => {
      const provider1: LLMProvider = 'openai';
      const provider2: LLMProvider = 'anthropic';
      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000
      };
      rateLimiter.setRateLimit(provider1, config);
      rateLimiter.setRateLimit(provider2, config);
      
      rateLimiter.recordRequest(provider1);
      rateLimiter.recordRequest(provider2);
      rateLimiter.clearHistory();
      
      expect(rateLimiter.getRequestCount(provider1)).toBe(0);
      expect(rateLimiter.getRequestCount(provider2)).toBe(0);
    });

    test('should not affect other providers when clearing specific provider', () => {
      const provider1: LLMProvider = 'openai';
      const provider2: LLMProvider = 'anthropic';
      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000
      };
      rateLimiter.setRateLimit(provider1, config);
      rateLimiter.setRateLimit(provider2, config);
      
      rateLimiter.recordRequest(provider1);
      rateLimiter.recordRequest(provider2);
      rateLimiter.recordRequest(provider2);
      
      rateLimiter.clearHistory(provider1);
      
      expect(rateLimiter.getRequestCount(provider1)).toBe(0);
      expect(rateLimiter.getRequestCount(provider2)).toBe(2);
    });
  });

  describe('integration scenarios', () => {
    test('should enforce rate limit correctly over multiple requests', async () => {
      const provider: LLMProvider = 'openai';
      const config: RateLimitConfig = {
        maxRequests: 3,
        windowMs: 1000
      };
      rateLimiter.setRateLimit(provider, config);
      
      mockTime = 1000000000;
      rateLimiter.recordRequest(provider);
      expect(rateLimiter.canMakeRequest(provider)).toBe(true);
      
      rateLimiter.recordRequest(provider);
      expect(rateLimiter.canMakeRequest(provider)).toBe(true);
      
      rateLimiter.recordRequest(provider);
      expect(rateLimiter.canMakeRequest(provider)).toBe(false);
      
      mockTime = 1000000000 + 1100;
      expect(rateLimiter.canMakeRequest(provider)).toBe(true);
    });

    test('should handle concurrent rate limiting for multiple providers', () => {
      const provider1: LLMProvider = 'openai';
      const provider2: LLMProvider = 'anthropic';
      const config1: RateLimitConfig = { maxRequests: 2, windowMs: 1000 };
      const config2: RateLimitConfig = { maxRequests: 5, windowMs: 1000 };
      
      rateLimiter.setRateLimit(provider1, config1);
      rateLimiter.setRateLimit(provider2, config2);
      
      rateLimiter.recordRequest(provider1);
      rateLimiter.recordRequest(provider1);
      rateLimiter.recordRequest(provider2);
      rateLimiter.recordRequest(provider2);
      
      expect(rateLimiter.canMakeRequest(provider1)).toBe(false);
      expect(rateLimiter.canMakeRequest(provider2)).toBe(true);
    });

    test('should handle edge case with zero requests in history', () => {
      const provider: LLMProvider = 'openai';
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000
      };
      rateLimiter.setRateLimit(provider, config);
      
      expect(rateLimiter.canMakeRequest(provider)).toBe(true);
      expect(rateLimiter.getRequestCount(provider)).toBe(0);
    });
  });
});