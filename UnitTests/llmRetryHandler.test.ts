import { LLMRetryHandler } from '../ai/llmRetryHandler';

// Test: test_retryHandler_retriesTransientFailures
// Verifies retry handler retries transient failures appropriately
import { LLMRetryHandler } from '../ai/llmRetryHandler';

describe('LLMRetryHandler.executeWithRetry', () => {
  let retryHandler: LLMRetryHandler;

  beforeEach(() => {
    retryHandler = new LLMRetryHandler({ maxRetries: 3, initialDelay: 100 });
  });

  test('retries on transient network errors', async () => {
    let attempts = 0;
    const operation = jest.fn(async () => {
      attempts++;
      if (attempts  {
    const operation = jest.fn(async () => {
      throw new Error('Persistent error');
    });

    await expect(retryHandler.executeWithRetry(operation)).rejects.toThrow('Persistent error');
    expect(operation).toHaveBeenCalledTimes(4);
  });

  test('succeeds on first attempt without retry', async () => {
    const operation = jest.fn(async () => 'immediate success');

    const result = await retryHandler.executeWithRetry(operation);

    expect(result).toBe('immediate success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  test('applies exponential backoff between retries', async () => {
    let attempts = 0;
    const timestamps: number[] = [];
    const operation = jest.fn(async () => {
      timestamps.push(Date.now());
      attempts++;
      if (attempts < 3) {
        throw new Error('Retry me');
      }
      return 'success';
    });

    await retryHandler.executeWithRetry(operation);

    expect(timestamps.length).toBe(3);
    const delay1 = timestamps[1] - timestamps[0];
    const delay2 = timestamps[2] - timestamps[1];
    expect(delay2).toBeGreaterThan(delay1);
  });
});
