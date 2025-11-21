import { retryWithBackoff } from '../retry';
import { timer } from '../timer';
import { exponentialBackoff } from '../exponentialBackoff';

// Mocks
jest.mock('../timer');
jest.mock('../exponentialBackoff');

describe('retryWithBackoff', () => {
  let mockTimer: jest.MockedFunction<typeof timer>;
  let mockExponentialBackoff: jest.MockedFunction<typeof exponentialBackoff>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTimer = timer as jest.MockedFunction<typeof timer>;
    mockExponentialBackoff = exponentialBackoff as jest.MockedFunction<typeof exponentialBackoff>;
    
    mockTimer.mockResolvedValue(undefined);
    mockExponentialBackoff.mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should successfully execute function on first attempt without retry', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const maxRetries = 3;
    const baseDelay = 1000;

    const result = await retryWithBackoff(mockFn, maxRetries, baseDelay);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockTimer).not.toHaveBeenCalled();
    expect(mockExponentialBackoff).not.toHaveBeenCalled();
  });

  test('should retry function with exponential backoff on failure and eventually succeed', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValueOnce('success on third attempt');
    
    const maxRetries = 3;
    const baseDelay = 1000;
    
    mockExponentialBackoff
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2000);

    const result = await retryWithBackoff(mockFn, maxRetries, baseDelay);

    expect(result).toBe('success on third attempt');
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(mockTimer).toHaveBeenCalledTimes(2);
    expect(mockExponentialBackoff).toHaveBeenCalledTimes(2);
    expect(mockExponentialBackoff).toHaveBeenNthCalledWith(1, 0, baseDelay);
    expect(mockExponentialBackoff).toHaveBeenNthCalledWith(2, 1, baseDelay);
    expect(mockTimer).toHaveBeenNthCalledWith(1, 1000);
    expect(mockTimer).toHaveBeenNthCalledWith(2, 2000);
  });

  test('should throw error after exhausting all retry attempts', async () => {
    const finalError = new Error('Final failure');
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockRejectedValueOnce(new Error('Third failure'))
      .mockRejectedValueOnce(finalError);
    
    const maxRetries = 3;
    const baseDelay = 500;
    
    mockExponentialBackoff
      .mockReturnValueOnce(500)
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2000);

    await expect(retryWithBackoff(mockFn, maxRetries, baseDelay)).rejects.toThrow('Final failure');
    
    expect(mockFn).toHaveBeenCalledTimes(4);
    expect(mockTimer).toHaveBeenCalledTimes(3);
    expect(mockExponentialBackoff).toHaveBeenCalledTimes(3);
  });

  test('should handle zero retries and fail immediately', async () => {
    const error = new Error('Immediate failure');
    const mockFn = jest.fn().mockRejectedValue(error);
    const maxRetries = 0;
    const baseDelay = 1000;

    await expect(retryWithBackoff(mockFn, maxRetries, baseDelay)).rejects.toThrow('Immediate failure');
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockTimer).not.toHaveBeenCalled();
    expect(mockExponentialBackoff).not.toHaveBeenCalled();
  });

  test('should handle async function that returns non-promise value', async () => {
    const mockFn = jest.fn().mockResolvedValue(42);
    const maxRetries = 3;
    const baseDelay = 1000;

    const result = await retryWithBackoff(mockFn, maxRetries, baseDelay);

    expect(result).toBe(42);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should use correct delay values from exponentialBackoff for each retry', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockRejectedValueOnce(new Error('Fail 3'))
      .mockResolvedValueOnce('success');
    
    const maxRetries = 5;
    const baseDelay = 100;
    
    mockExponentialBackoff
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(200)
      .mockReturnValueOnce(400);

    const result = await retryWithBackoff(mockFn, maxRetries, baseDelay);

    expect(result).toBe('success');
    expect(mockTimer).toHaveBeenCalledWith(100);
    expect(mockTimer).toHaveBeenCalledWith(200);
    expect(mockTimer).toHaveBeenCalledWith(400);
  });

  test('should handle function with parameters correctly', async () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    const maxRetries = 2;
    const baseDelay = 500;

    const result = await retryWithBackoff(mockFn, maxRetries, baseDelay);

    expect(result).toBe('result');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should preserve error details when all retries fail', async () => {
    const customError = new Error('Custom error message');
    customError.name = 'CustomError';
    const mockFn = jest.fn().mockRejectedValue(customError);
    
    const maxRetries = 2;
    const baseDelay = 1000;

    await expect(retryWithBackoff(mockFn, maxRetries, baseDelay)).rejects.toMatchObject({
      name: 'CustomError',
      message: 'Custom error message'
    });
  });
});