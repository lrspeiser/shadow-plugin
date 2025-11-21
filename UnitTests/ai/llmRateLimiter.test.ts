import { LLMRateLimiter } from '../../src/ai/llmRateLimiter';

describe('LLMRateLimiter - constructor', () => {
  test('should initialize with OpenAI rate limit configuration', () => {
    const rateLimiter = new LLMRateLimiter();
    
    // Access the private configs map using type assertion
    const configs = (rateLimiter as any).configs;
    
    expect(configs.has('openai')).toBe(true);
    const openaiConfig = configs.get('openai');
    expect(openaiConfig).toBeDefined();
    expect(openaiConfig.maxRequests).toBe(60);
    expect(openaiConfig.windowMs).toBe(60000);
  });

  test('should initialize with Claude rate limit configuration', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    
    expect(configs.has('claude')).toBe(true);
    const claudeConfig = configs.get('claude');
    expect(claudeConfig).toBeDefined();
    expect(claudeConfig.maxRequests).toBe(50);
    expect(claudeConfig.windowMs).toBe(60000);
  });

  test('should initialize with both provider configurations', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    
    expect(configs.size).toBe(2);
    expect(configs.has('openai')).toBe(true);
    expect(configs.has('claude')).toBe(true);
  });

  test('should set OpenAI with higher request limit than Claude', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    const openaiConfig = configs.get('openai');
    const claudeConfig = configs.get('claude');
    
    expect(openaiConfig.maxRequests).toBeGreaterThan(claudeConfig.maxRequests);
  });

  test('should set same time window for both providers', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    const openaiConfig = configs.get('openai');
    const claudeConfig = configs.get('claude');
    
    expect(openaiConfig.windowMs).toBe(claudeConfig.windowMs);
    expect(openaiConfig.windowMs).toBe(60000);
  });

  test('should create multiple independent instances', () => {
    const rateLimiter1 = new LLMRateLimiter();
    const rateLimiter2 = new LLMRateLimiter();
    
    const configs1 = (rateLimiter1 as any).configs;
    const configs2 = (rateLimiter2 as any).configs;
    
    expect(configs1).not.toBe(configs2);
    expect(configs1.get('openai')).toEqual(configs2.get('openai'));
    expect(configs1.get('claude')).toEqual(configs2.get('claude'));
  });

  test('should have valid window duration in milliseconds', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    const openaiConfig = configs.get('openai');
    const claudeConfig = configs.get('claude');
    
    expect(openaiConfig.windowMs).toBeGreaterThan(0);
    expect(claudeConfig.windowMs).toBeGreaterThan(0);
    expect(openaiConfig.windowMs).toBe(60 * 1000); // 1 minute
    expect(claudeConfig.windowMs).toBe(60 * 1000); // 1 minute
  });

  test('should have positive max request limits', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    const openaiConfig = configs.get('openai');
    const claudeConfig = configs.get('claude');
    
    expect(openaiConfig.maxRequests).toBeGreaterThan(0);
    expect(claudeConfig.maxRequests).toBeGreaterThan(0);
  });
});