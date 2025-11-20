import { LLMRetryHandler } from '../llmRetryHandler';
import { RetryOptions } from '../llmRetryHandler';

// Mocks
jest.useFakeTimers();

describe('LLMRetryHandler.retryWithBackoff', () => {
  let handler: LLMRetryHandler;
  let mockOperation: jest.Mock;
  let mockOnRetry: jest.Mock;

  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
    handler = new LLMRetryHandler();
    mockOperation = jest.fn();
    mockOnRetry = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should return result on successful first attempt without retries', async () => {
    const expectedResult = { data: 'success' };
    mockOperation.mockResolvedValue(expectedResult);

    const options: RetryOptions = {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT'],
      onRetry: mockOnRetry
    };

    const resultPromise = handler.retryWithBackoff(mockOperation, options);
    const result = await resultPromise;

    expect(result).toEqual(expectedResult);
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockOnRetry).not.toHaveBeenCalled();
  });

  test('should retry with exponential backoff on retryable errors and succeed', async () => {
    const expectedResult = { data: 'success after retries' };
    const retryableError = new Error('RATE_LIMIT');
    retryableError.name = 'RATE_LIMIT';

    mockOperation
      .mockRejectedValueOnce(retryableError)
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValueOnce(expectedResult);

    const options: RetryOptions = {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['RATE_LIMIT'],
      onRetry: mockOnRetry
    };

    const resultPromise = handler.retryWithBackoff(mockOperation, options);

    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    jest.advanceTimersByTime(2000);
    await Promise.resolve();

    const result = await resultPromise;

    expect(result).toEqual(expectedResult);
    expect(mockOperation).toHaveBeenCalledTimes(3);
    expect(mockOnRetry).toHaveBeenCalledTimes(2);
    expect(mockOnRetry).toHaveBeenNthCalledWith(1, 1, retryableError);
    expect(mockOnRetry).toHaveBeenNthCalledWith(2, 2, retryableError);
  });

  test('should throw non-retryable error immediately without retries', async () => {
    const nonRetryableError = new Error('INVALID_REQUEST');
    nonRetryableError.name = 'INVALID_REQUEST';

    mockOperation.mockRejectedValue(nonRetryableError);

    const options: RetryOptions = {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT'],
      onRetry: mockOnRetry
    };

    await expect(handler.retryWithBackoff(mockOperation, options)).rejects.toThrow('INVALID_REQUEST');
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockOnRetry).not.toHaveBeenCalled();
  });

  test('should throw last error after exhausting all retries', async () => {
    const retryableError = new Error('TIMEOUT');
    retryableError.name = 'TIMEOUT';

    mockOperation.mockRejectedValue(retryableError);

    const options: RetryOptions = {
      maxRetries: 2,
      initialDelayMs: 500,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      retryableErrors: ['TIMEOUT'],
      onRetry: mockOnRetry
    };

    const resultPromise = handler.retryWithBackoff(mockOperation, options);

    jest.advanceTimersByTime(500);
    await Promise.resolve();
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    await expect(resultPromise).rejects.toThrow('TIMEOUT');
    expect(mockOperation).toHaveBeenCalledTimes(3);
    expect(mockOnRetry).toHaveBeenCalledTimes(2);
  });

  test('should respect maxDelayMs cap on exponential backoff', async () => {
    const retryableError = new Error('RATE_LIMIT');
    retryableError.name = 'RATE_LIMIT';
    const expectedResult = { data: 'success' };

    mockOperation
      .mockRejectedValueOnce(retryableError)
      .mockRejectedValueOnce(retryableError)
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValueOnce(expectedResult);

    const options: RetryOptions = {
      maxRetries: 4,
      initialDelayMs: 1000,
      maxDelayMs: 3000,
      backoffMultiplier: 3,
      retryableErrors: ['RATE_LIMIT'],
      onRetry: mockOnRetry
    };

    const resultPromise = handler.retryWithBackoff(mockOperation, options);

    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    jest.advanceTimersByTime(3000);
    await Promise.resolve();
    jest.advanceTimersByTime(3000);
    await Promise.resolve();

    const result = await resultPromise;

    expect(result).toEqual(expectedResult);
    expect(mockOperation).toHaveBeenCalledTimes(4);
  });

  test('should handle zero maxRetries by trying operation once', async () => {
    const error = new Error('RATE_LIMIT');
    error.name = 'RATE_LIMIT';
    mockOperation.mockRejectedValue(error);

    const options: RetryOptions = {
      maxRetries: 0,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['RATE_LIMIT'],
      onRetry: mockOnRetry
    };

    await expect(handler.retryWithBackoff(mockOperation, options)).rejects.toThrow('RATE_LIMIT');
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockOnRetry).not.toHaveBeenCalled();
  });

  test('should work without onRetry callback', async () => {
    const expectedResult = { data: 'success' };
    const retryableError = new Error('TIMEOUT');
    retryableError.name = 'TIMEOUT';

    mockOperation
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValueOnce(expectedResult);

    const options: RetryOptions = {
      maxRetries: 2,
      initialDelayMs: 500,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      retryableErrors: ['TIMEOUT']
    };

    const resultPromise = handler.retryWithBackoff(mockOperation, options);

    jest.advanceTimersByTime(500);
    await Promise.resolve();

    const result = await resultPromise;

    expect(result).toEqual(expectedResult);
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });
});