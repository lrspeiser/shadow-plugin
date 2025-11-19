import { RetryHandler } from '../ai/llmRetryHandler';

// Test: test_retry_handles_transient_failures
// Verifies retry handler retries transient failures with backoff
import { RetryHandler } from '../ai/llmRetryHandler';

jest.useFakeTimers();

describe('RetryHandler - retry', () => {
  let retryHandler: RetryHandler;

  beforeEach(() => {
    retryHandler = new RetryHandler(3, 100);
    jest.clearAllTimers();
  });

  test('succeeds on first attempt without retry', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await retryHandler.retry(operation);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  test('retries on transient failure', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('Transient failure'))
      .mockResolvedValue('success');

    const promise = retryHandler.retry(operation);
    jest.advanceTimersByTime(200);
    const result = await promise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  test('throws after max retries exceeded', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

    const promise = retryHandler.retry(operation);
    jest.advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow('Persistent failure');
    expect(operation).toHaveBeenCalledTimes(4);
  });

  test('uses exponential backoff', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    const promise = retryHandler.retry(operation);

    jest.advanceTimersByTime(100);
    expect(operation).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(200);
    expect(operation).toHaveBeenCalledTimes(3);

    await promise;
  });
});
