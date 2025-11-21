import { retryWithBackoff } from '../apiClient';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');
jest.useFakeTimers();

describe('retryWithBackoff', () => {
  let mockLogger: any;
  let outputChannel: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    outputChannel = {
      appendLine: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn(),
      show: jest.fn()
    };
    
    (vscode.window.createOutputChannel as jest.Mock).mockReturnValue(outputChannel);
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should succeed on first attempt without retry', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    const maxRetries = 3;
    const baseDelay = 1000;

    const promise = retryWithBackoff(mockOperation, maxRetries, baseDelay);
    await promise;

    expect(mockOperation).toHaveBeenCalledTimes(1);
    const result = await promise;
    expect(result).toBe('success');
  });

  test('should retry with exponential backoff and eventually succeed', async () => {
    let attemptCount = 0;
    const mockOperation = jest.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.reject(new Error('Temporary failure'));
      }
      return Promise.resolve('success after retries');
    });
    const maxRetries = 5;
    const baseDelay = 100;

    const promise = retryWithBackoff(mockOperation, maxRetries, baseDelay);
    
    // Fast-forward through first retry delay (100ms)
    await Promise.resolve();
    jest.advanceTimersByTime(100);
    
    // Fast-forward through second retry delay (200ms)
    await Promise.resolve();
    jest.advanceTimersByTime(200);
    
    // Allow final success
    await Promise.resolve();
    
    const result = await promise;
    
    expect(mockOperation).toHaveBeenCalledTimes(3);
    expect(result).toBe('success after retries');
  });

  test('should fail after exhausting all retries', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
    const maxRetries = 3;
    const baseDelay = 50;

    const promise = retryWithBackoff(mockOperation, maxRetries, baseDelay);
    
    // Fast-forward through all retry delays
    for (let i = 0; i < maxRetries; i++) {
      await Promise.resolve();
      jest.advanceTimersByTime(baseDelay * Math.pow(2, i));
    }
    
    await expect(promise).rejects.toThrow('Persistent failure');
    expect(mockOperation).toHaveBeenCalledTimes(maxRetries + 1);
  });

  test('should handle immediate success with zero retries configured', async () => {
    const mockOperation = jest.fn().mockResolvedValue('immediate success');
    const maxRetries = 0;
    const baseDelay = 1000;

    const result = await retryWithBackoff(mockOperation, maxRetries, baseDelay);
    
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(result).toBe('immediate success');
  });

  test('should apply exponential backoff with correct delay intervals', async () => {
    let attemptCount = 0;
    const delays: number[] = [];
    const mockOperation = jest.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount <= 3) {
        return Promise.reject(new Error('Retry'));
      }
      return Promise.resolve('done');
    });
    const maxRetries = 4;
    const baseDelay = 100;

    const promise = retryWithBackoff(mockOperation, maxRetries, baseDelay);
    
    // Capture and verify delays: 100ms, 200ms, 400ms
    for (let i = 0; i < 3; i++) {
      await Promise.resolve();
      const expectedDelay = baseDelay * Math.pow(2, i);
      delays.push(expectedDelay);
      jest.advanceTimersByTime(expectedDelay);
    }
    
    await Promise.resolve();
    await promise;
    
    expect(delays).toEqual([100, 200, 400]);
    expect(mockOperation).toHaveBeenCalledTimes(4);
  });

  test('should handle non-Error rejection objects', async () => {
    const mockOperation = jest.fn().mockRejectedValue('string error');
    const maxRetries = 2;
    const baseDelay = 50;

    const promise = retryWithBackoff(mockOperation, maxRetries, baseDelay);
    
    for (let i = 0; i < maxRetries; i++) {
      await Promise.resolve();
      jest.advanceTimersByTime(baseDelay * Math.pow(2, i));
    }
    
    await expect(promise).rejects.toBe('string error');
    expect(mockOperation).toHaveBeenCalledTimes(maxRetries + 1);
  });

  test('should succeed on last possible retry attempt', async () => {
    let attemptCount = 0;
    const mockOperation = jest.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount <= 3) {
        return Promise.reject(new Error('Not yet'));
      }
      return Promise.resolve('success on final attempt');
    });
    const maxRetries = 3;
    const baseDelay = 100;

    const promise = retryWithBackoff(mockOperation, maxRetries, baseDelay);
    
    for (let i = 0; i < 3; i++) {
      await Promise.resolve();
      jest.advanceTimersByTime(baseDelay * Math.pow(2, i));
    }
    
    await Promise.resolve();
    const result = await promise;
    
    expect(result).toBe('success on final attempt');
    expect(mockOperation).toHaveBeenCalledTimes(4);
  });
});