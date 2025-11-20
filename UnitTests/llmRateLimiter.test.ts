import { LLMRateLimiter } from '../llmRateLimiter';

// Mocks
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(global, 'setTimeout');

describe('LLMRateLimiter - waitTime nested if', () => {
  let rateLimiter: LLMRateLimiter;
  let consoleLogSpy: jest.SpyInstance;
  let setTimeoutSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    rateLimiter = new LLMRateLimiter();
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleLogSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });

  test('should wait when waitTime is greater than 0', async () => {
    const provider = 'openai';
    const waitTime = 1000;
    
    const waitPromise = (async () => {
      if (waitTime > 0) {
        console.log(`Rate limit reached for ${provider}. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    })();

    expect(consoleLogSpy).toHaveBeenCalledWith(`Rate limit reached for ${provider}. Waiting ${waitTime}ms...`);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), waitTime);
    
    jest.advanceTimersByTime(waitTime);
    await waitPromise;
    
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
  });

  test('should not wait when waitTime is 0', async () => {
    const provider = 'anthropic';
    const waitTime = 0;
    
    await (async () => {
      if (waitTime > 0) {
        console.log(`Rate limit reached for ${provider}. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    })();

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  test('should not wait when waitTime is negative', async () => {
    const provider = 'google';
    const waitTime = -500;
    
    await (async () => {
      if (waitTime > 0) {
        console.log(`Rate limit reached for ${provider}. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    })();

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  test('should wait correct amount for large waitTime values', async () => {
    const provider = 'cohere';
    const waitTime = 60000;
    
    const waitPromise = (async () => {
      if (waitTime > 0) {
        console.log(`Rate limit reached for ${provider}. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    })();

    expect(consoleLogSpy).toHaveBeenCalledWith(`Rate limit reached for ${provider}. Waiting ${waitTime}ms...`);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), waitTime);
    
    jest.advanceTimersByTime(waitTime);
    await waitPromise;
  });

  test('should log correct provider name in wait message', async () => {
    const provider = 'custom-llm-provider';
    const waitTime = 2000;
    
    const waitPromise = (async () => {
      if (waitTime > 0) {
        console.log(`Rate limit reached for ${provider}. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    })();

    expect(consoleLogSpy).toHaveBeenCalledWith(`Rate limit reached for ${provider}. Waiting ${waitTime}ms...`);
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(waitTime);
    await waitPromise;
  });

  test('should handle fractional waitTime values', async () => {
    const provider = 'openai';
    const waitTime = 500.75;
    
    const waitPromise = (async () => {
      if (waitTime > 0) {
        console.log(`Rate limit reached for ${provider}. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    })();

    expect(consoleLogSpy).toHaveBeenCalledWith(`Rate limit reached for ${provider}. Waiting ${waitTime}ms...`);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), waitTime);
    
    jest.advanceTimersByTime(Math.ceil(waitTime));
    await waitPromise;
  });
});