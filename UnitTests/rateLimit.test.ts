import { enforceRateLimit } from '../rateLimit';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');
jest.useFakeTimers();

describe('enforceRateLimit', () => {
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
    test('should allow first request immediately', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      const result = await enforceRateLimit(callback, 1000, 5);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    test('should allow multiple requests within rate limit', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      
      await enforceRateLimit(callback, 1000, 3);
      await enforceRateLimit(callback, 1000, 3);
      await enforceRateLimit(callback, 1000, 3);
      
      expect(callback).toHaveBeenCalledTimes(3);
    });

    test('should reset rate limit after time window expires', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      
      await enforceRateLimit(callback, 1000, 2);
      await enforceRateLimit(callback, 1000, 2);
      
      jest.advanceTimersByTime(1001);
      
      await enforceRateLimit(callback, 1000, 2);
      
      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('rate limit enforcement', () => {
    test('should block requests exceeding rate limit', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      
      await enforceRateLimit(callback, 1000, 2);
      await enforceRateLimit(callback, 1000, 2);
      
      const blockedPromise = enforceRateLimit(callback, 1000, 2);
      
      expect(callback).toHaveBeenCalledTimes(2);
      
      jest.advanceTimersByTime(1001);
      await blockedPromise;
      
      expect(callback).toHaveBeenCalledTimes(3);
    });

    test('should queue multiple blocked requests', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      
      await enforceRateLimit(callback, 1000, 1);
      
      const promise1 = enforceRateLimit(callback, 1000, 1);
      const promise2 = enforceRateLimit(callback, 1000, 1);
      
      expect(callback).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(1001);
      await promise1;
      expect(callback).toHaveBeenCalledTimes(2);
      
      jest.advanceTimersByTime(1001);
      await promise2;
      expect(callback).toHaveBeenCalledTimes(3);
    });

    test('should calculate correct wait time for rate limit', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      const startTime = Date.now();
      
      await enforceRateLimit(callback, 2000, 1);
      
      jest.advanceTimersByTime(500);
      
      const blockedPromise = enforceRateLimit(callback, 2000, 1);
      
      jest.advanceTimersByTime(1501);
      await blockedPromise;
      
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    test('should handle zero rate limit (always allow)', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      
      await enforceRateLimit(callback, 1000, 0);
      await enforceRateLimit(callback, 1000, 0);
      await enforceRateLimit(callback, 1000, 0);
      
      expect(callback).toHaveBeenCalledTimes(3);
    });

    test('should handle very short time windows', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      
      await enforceRateLimit(callback, 1, 1);
      
      jest.advanceTimersByTime(2);
      
      await enforceRateLimit(callback, 1, 1);
      
      expect(callback).toHaveBeenCalledTimes(2);
    });

    test('should handle very large rate limits', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      
      for (let i = 0; i < 100; i++) {
        await enforceRateLimit(callback, 1000, 100);
      }
      
      expect(callback).toHaveBeenCalledTimes(100);
    });

    test('should handle undefined or null callback gracefully', async () => {
      await expect(enforceRateLimit(null as any, 1000, 5)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    test('should propagate callback errors', async () => {
      const callback = jest.fn().mockRejectedValue(new Error('callback error'));
      
      await expect(enforceRateLimit(callback, 1000, 5)).rejects.toThrow('callback error');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should not affect rate limit on callback error', async () => {
      const callback = jest.fn()
        .mockRejectedValueOnce(new Error('error'))
        .mockResolvedValue('success');
      
      await expect(enforceRateLimit(callback, 1000, 2)).rejects.toThrow();
      
      const result = await enforceRateLimit(callback, 1000, 2);
      
      expect(result).toBe('success');
      expect(callback).toHaveBeenCalledTimes(2);
    });

    test('should handle negative time window', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      
      await expect(enforceRateLimit(callback, -1000, 5)).rejects.toThrow();
    });

    test('should handle negative max requests', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      
      const result = await enforceRateLimit(callback, 1000, -1);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });
  });

  describe('concurrent requests', () => {
    test('should handle concurrent requests properly', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      
      const promises = [
        enforceRateLimit(callback, 1000, 2),
        enforceRateLimit(callback, 1000, 2),
        enforceRateLimit(callback, 1000, 2)
      ];
      
      expect(callback).toHaveBeenCalledTimes(2);
      
      jest.advanceTimersByTime(1001);
      await Promise.all(promises);
      
      expect(callback).toHaveBeenCalledTimes(3);
    });

    test('should maintain order of queued requests', async () => {
      const results: number[] = [];
      const callback = jest.fn().mockImplementation((id: number) => {
        results.push(id);
        return Promise.resolve(id);
      });
      
      await enforceRateLimit(() => callback(1), 1000, 1);
      const p2 = enforceRateLimit(() => callback(2), 1000, 1);
      const p3 = enforceRateLimit(() => callback(3), 1000, 1);
      
      jest.advanceTimersByTime(1001);
      await p2;
      
      jest.advanceTimersByTime(1001);
      await p3;
      
      expect(results).toEqual([1, 2, 3]);
    });
  });
});