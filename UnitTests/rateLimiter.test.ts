import { enforceRateLimit } from '../rateLimiter';
import { tokenCounter } from '../tokenCounter';

// Mocks
jest.mock('../tokenCounter');
jest.useFakeTimers();

describe('enforceRateLimit', () => {
  const mockTokenCounter = tokenCounter as jest.MockedFunction<typeof tokenCounter>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('happy path', () => {
    test('should allow request when under rate limit', async () => {
      mockTokenCounter.mockReturnValue(100);
      
      const request = { text: 'test request', tokens: 100 };
      const result = await enforceRateLimit(request);
      
      expect(result).toBe(true);
      expect(mockTokenCounter).toHaveBeenCalledWith(request.text);
    });

    test('should process multiple requests within limit', async () => {
      mockTokenCounter.mockReturnValue(50);
      
      const request1 = { text: 'request 1', tokens: 50 };
      const request2 = { text: 'request 2', tokens: 50 };
      
      const result1 = await enforceRateLimit(request1);
      const result2 = await enforceRateLimit(request2);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    test('should reset rate limit after time window', async () => {
      mockTokenCounter.mockReturnValue(1000);
      
      const request = { text: 'large request', tokens: 1000 };
      await enforceRateLimit(request);
      
      jest.advanceTimersByTime(60000);
      
      const result = await enforceRateLimit(request);
      expect(result).toBe(true);
    });
  });

  describe('rate limiting scenarios', () => {
    test('should reject request when rate limit exceeded', async () => {
      mockTokenCounter.mockReturnValue(10000);
      
      const largeRequest = { text: 'very large request', tokens: 10000 };
      const result = await enforceRateLimit(largeRequest);
      
      expect(result).toBe(false);
    });

    test('should queue requests and delay when approaching limit', async () => {
      mockTokenCounter.mockReturnValue(500);
      
      const requests = Array(5).fill(null).map((_, i) => ({
        text: `request ${i}`,
        tokens: 500
      }));
      
      const promises = requests.map(req => enforceRateLimit(req));
      
      jest.advanceTimersByTime(5000);
      
      const results = await Promise.all(promises);
      expect(results.every(r => typeof r === 'boolean')).toBe(true);
    });

    test('should handle burst of requests', async () => {
      mockTokenCounter.mockReturnValue(100);
      
      const burstRequests = Array(10).fill(null).map((_, i) => ({
        text: `burst ${i}`,
        tokens: 100
      }));
      
      const results = await Promise.all(
        burstRequests.map(req => enforceRateLimit(req))
      );
      
      expect(results.length).toBe(10);
      expect(results.filter(r => r === true).length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    test('should handle zero token request', async () => {
      mockTokenCounter.mockReturnValue(0);
      
      const request = { text: '', tokens: 0 };
      const result = await enforceRateLimit(request);
      
      expect(result).toBe(true);
    });

    test('should handle undefined text', async () => {
      mockTokenCounter.mockReturnValue(0);
      
      const request = { text: undefined as any, tokens: 0 };
      const result = await enforceRateLimit(request);
      
      expect(result).toBe(true);
    });

    test('should handle negative token count', async () => {
      mockTokenCounter.mockReturnValue(-100);
      
      const request = { text: 'test', tokens: -100 };
      const result = await enforceRateLimit(request);
      
      expect(result).toBe(true);
    });

    test('should handle very large token count', async () => {
      mockTokenCounter.mockReturnValue(999999);
      
      const request = { text: 'huge request', tokens: 999999 };
      const result = await enforceRateLimit(request);
      
      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    test('should handle tokenCounter throwing error', async () => {
      mockTokenCounter.mockImplementation(() => {
        throw new Error('Token counting failed');
      });
      
      const request = { text: 'test', tokens: 100 };
      
      await expect(enforceRateLimit(request)).rejects.toThrow('Token counting failed');
    });

    test('should handle null request', async () => {
      mockTokenCounter.mockReturnValue(0);
      
      const request = null as any;
      
      await expect(enforceRateLimit(request)).rejects.toThrow();
    });

    test('should recover after error', async () => {
      mockTokenCounter
        .mockImplementationOnce(() => { throw new Error('Temporary error'); })
        .mockReturnValue(100);
      
      const request = { text: 'test', tokens: 100 };
      
      await expect(enforceRateLimit(request)).rejects.toThrow();
      
      const result = await enforceRateLimit(request);
      expect(result).toBe(true);
    });
  });

  describe('concurrent requests', () => {
    test('should handle concurrent requests safely', async () => {
      mockTokenCounter.mockReturnValue(200);
      
      const requests = Array(20).fill(null).map((_, i) => ({
        text: `concurrent ${i}`,
        tokens: 200
      }));
      
      const promises = requests.map(req => enforceRateLimit(req));
      const results = await Promise.all(promises);
      
      expect(results.length).toBe(20);
      expect(results.every(r => typeof r === 'boolean')).toBe(true);
    });

    test('should maintain rate limit across concurrent calls', async () => {
      mockTokenCounter.mockReturnValue(1500);
      
      const highTokenRequests = Array(5).fill(null).map((_, i) => ({
        text: `high token ${i}`,
        tokens: 1500
      }));
      
      const results = await Promise.all(
        highTokenRequests.map(req => enforceRateLimit(req))
      );
      
      const rejectedCount = results.filter(r => r === false).length;
      expect(rejectedCount).toBeGreaterThan(0);
    });
  });
});