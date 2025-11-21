import { LLMRateLimiter } from '../../src/ai/llmRateLimiter';

describe('LLMRateLimiter constructor', () => {
  test('should initialize with default OpenAI rate limit configuration', () => {
    const rateLimiter = new LLMRateLimiter();
    
    // Access the private configs map through type assertion
    const configs = (rateLimiter as any).configs;
    const openaiConfig = configs.get('openai');
    
    expect(openaiConfig).toBeDefined();
    expect(openaiConfig.maxRequests).toBe(60);
    expect(openaiConfig.windowMs).toBe(60000);
  });

  test('should initialize with default Claude rate limit configuration', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    const claudeConfig = configs.get('claude');
    
    expect(claudeConfig).toBeDefined();
    expect(claudeConfig.maxRequests).toBe(50);
    expect(claudeConfig.windowMs).toBe(60000);
  });

  test('should initialize both OpenAI and Claude configurations simultaneously', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    
    expect(configs.size).toBeGreaterThanOrEqual(2);
    expect(configs.has('openai')).toBe(true);
    expect(configs.has('claude')).toBe(true);
  });

  test('should set OpenAI window to exactly 1 minute (60000ms)', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    const openaiConfig = configs.get('openai');
    
    expect(openaiConfig.windowMs).toBe(60 * 1000);
  });

  test('should set Claude window to exactly 1 minute (60000ms)', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    const claudeConfig = configs.get('claude');
    
    expect(claudeConfig.windowMs).toBe(60 * 1000);
  });

  test('should create independent instances with separate configurations', () => {
    const rateLimiter1 = new LLMRateLimiter();
    const rateLimiter2 = new LLMRateLimiter();
    
    const configs1 = (rateLimiter1 as any).configs;
    const configs2 = (rateLimiter2 as any).configs;
    
    expect(configs1).not.toBe(configs2);
    expect(configs1.get('openai')).toEqual(configs2.get('openai'));
    expect(configs1.get('claude')).toEqual(configs2.get('claude'));
  });

  test('should have OpenAI maxRequests higher than Claude maxRequests', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    const openaiConfig = configs.get('openai');
    const claudeConfig = configs.get('claude');
    
    expect(openaiConfig.maxRequests).toBeGreaterThan(claudeConfig.maxRequests);
  });

  test('should initialize configs as a Map data structure', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    
    expect(configs).toBeInstanceOf(Map);
  });

  test('should have valid positive numbers for all configuration values', () => {
    const rateLimiter = new LLMRateLimiter();
    
    const configs = (rateLimiter as any).configs;
    const openaiConfig = configs.get('openai');
    const claudeConfig = configs.get('claude');
    
    expect(openaiConfig.maxRequests).toBeGreaterThan(0);
    expect(openaiConfig.windowMs).toBeGreaterThan(0);
    expect(claudeConfig.maxRequests).toBeGreaterThan(0);
    expect(claudeConfig.windowMs).toBeGreaterThan(0);
  });
});