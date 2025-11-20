import { LLMRateLimiter } from '../llmRateLimiter';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('LLMRateLimiter - checkQuota (if config check)', () => {
  let rateLimiter: LLMRateLimiter;

  beforeEach(() => {
    rateLimiter = new LLMRateLimiter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return early when provider config does not exist', async () => {
    const provider = 'nonexistent-provider';
    const tokens = 1000;

    const result = await rateLimiter.checkQuota(provider, tokens);

    expect(result).toBeUndefined();
  });

  test('should continue processing when provider config exists', async () => {
    const provider = 'openai';
    const tokens = 1000;
    const requestsPerMinute = 60;
    const tokensPerMinute = 90000;

    rateLimiter.setProviderConfig(provider, requestsPerMinute, tokensPerMinute);

    const result = await rateLimiter.checkQuota(provider, tokens);

    expect(result).toBeDefined();
  });

  test('should handle multiple providers with different configs', async () => {
    const provider1 = 'openai';
    const provider2 = 'anthropic';
    const provider3 = 'unknown';
    const tokens = 500;

    rateLimiter.setProviderConfig(provider1, 60, 90000);
    rateLimiter.setProviderConfig(provider2, 50, 100000);

    const result1 = await rateLimiter.checkQuota(provider1, tokens);
    const result2 = await rateLimiter.checkQuota(provider2, tokens);
    const result3 = await rateLimiter.checkQuota(provider3, tokens);

    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
    expect(result3).toBeUndefined();
  });

  test('should return undefined for null or empty provider', async () => {
    const tokens = 1000;

    const resultNull = await rateLimiter.checkQuota(null as any, tokens);
    const resultEmpty = await rateLimiter.checkQuota('', tokens);

    expect(resultNull).toBeUndefined();
    expect(resultEmpty).toBeUndefined();
  });

  test('should handle provider config being removed after initial setup', async () => {
    const provider = 'openai';
    const tokens = 1000;

    rateLimiter.setProviderConfig(provider, 60, 90000);
    let result1 = await rateLimiter.checkQuota(provider, tokens);
    expect(result1).toBeDefined();

    rateLimiter.removeProviderConfig(provider);
    let result2 = await rateLimiter.checkQuota(provider, tokens);
    expect(result2).toBeUndefined();
  });

  test('should handle case-sensitive provider names', async () => {
    const provider = 'OpenAI';
    const tokens = 1000;

    rateLimiter.setProviderConfig('openai', 60, 90000);

    const result = await rateLimiter.checkQuota(provider, tokens);

    expect(result).toBeUndefined();
  });
});