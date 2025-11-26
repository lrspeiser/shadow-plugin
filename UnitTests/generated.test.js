/**
 * Auto-generated unit tests
 * Generated: 2025-11-26T06:34:30.036Z
 */

const { describe, test, expect, beforeEach, jest, it, afterEach } = require('@jest/globals');
const { canMakeRequest } = require('../llmRateLimiter');
const { parseFileSummary } = require('../ai/llmResponseParser');
const { executeWithRetry } = require('../llmRetryHandler');
const { sendRequest: anthropicSendRequest, sendStructuredRequest: anthropicSendStructuredRequest } = require('../anthropicProvider');
const Anthropic = require('@anthropic-ai/sdk');
const { sendRequest: openAISendRequest, sendStructuredRequest: openAISendStructuredRequest } = require('../openAIProvider');
const fetch = require('node-fetch');
const OpenAI = require('openai');

jest.mock('@anthropic-ai/sdk');
jest.mock('node-fetch');
jest.mock('openai');

// Tests for canMakeRequest from src/ai/llmRateLimiter.ts
describe('canMakeRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should allow request when no rate limit has been set', () => {
    const result = canMakeRequest('openai');
    expect(result).toBe(true);
  });

  test('should deny request when rate limit has been exceeded', () => {
    canMakeRequest('anthropic');
    const result = canMakeRequest('anthropic');
    expect(result).toBe(false);
  });

  test('should allow request after rate limit window expires', () => {
    jest.useFakeTimers();
    canMakeRequest('gemini');
    jest.advanceTimersByTime(60000);
    const result = canMakeRequest('gemini');
    expect(result).toBe(true);
    jest.useRealTimers();
  });
});

// Tests for parseFileSummary from src/ai/llmResponseParser.ts
describe('parseFileSummary', () => {
  it('should parse valid JSON response', () => {
    const response = JSON.stringify({ summary: 'File handles user auth', keyInsights: ['Uses JWT', 'Has rate limiting'] });
    const result = parseFileSummary(response);
    expect(result.summary).toBe('File handles user auth');
    expect(result.keyInsights).toEqual(['Uses JWT', 'Has rate limiting']);
  });

  it('should extract text when JSON parsing fails', () => {
    const response = 'Summary: Authentication module\nKey insights: Implements OAuth2';
    const result = parseFileSummary(response);
    expect(result.summary).toContain('Authentication module');
    expect(result.keyInsights).toBeDefined();
  });

  it('should handle malformed responses gracefully', () => {
    const response = 'Invalid data';
    const result = parseFileSummary(response);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });
});

// Tests for executeWithRetry from src/ai/llmRetryHandler.ts
describe('executeWithRetry', () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should return result on successful execution', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    const result = await executeWithRetry(mockOperation, { maxRetries: 3, initialDelay: 100 });
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should retry with exponential backoff on failure then succeed', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValueOnce('success');
    const promise = executeWithRetry(mockOperation, { maxRetries: 3, initialDelay: 100, backoffFactor: 2 });
    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('should throw error after exhausting all retries', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('persistent failure'));
    const promise = executeWithRetry(mockOperation, { maxRetries: 2, initialDelay: 100 });
    await jest.runAllTimersAsync();
    await expect(promise).rejects.toThrow('persistent failure');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });
});

// Tests for sendRequest from src/ai/providers/anthropicProvider.ts
describe('sendRequest', () => {
  let mockCreate;
  let mockAnthropicInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate = jest.fn();
    mockAnthropicInstance = { messages: { create: mockCreate } };
    Anthropic.mockImplementation(() => mockAnthropicInstance);
  });

  it('should send request with API key and return Claude response with token usage', async () => {
    const mockResponse = {
      content: [{ type: 'text', text: 'Test response' }],
      usage: { input_tokens: 100, output_tokens: 50 }
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await anthropicSendRequest('test-api-key', [{ role: 'user', content: 'Hello' }], 'claude-3-sonnet-20240229', 1024, 0.7);

    expect(Anthropic).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{ role: 'user', content: 'Hello' }]
    });
    expect(result).toEqual({ text: 'Test response', usage: { inputTokens: 100, outputTokens: 50 } });
  });

  it('should throw error when API call fails', async () => {
    mockCreate.mockRejectedValue(new Error('API Error'));

    await expect(anthropicSendRequest('test-api-key', [{ role: 'user', content: 'Hello' }], 'claude-3-sonnet-20240229', 1024, 0.7)).rejects.toThrow('API Error');
  });

  it('should handle response with multiple content blocks', async () => {
    const mockResponse = {
      content: [{ type: 'text', text: 'Part 1' }, { type: 'text', text: 'Part 2' }],
      usage: { input_tokens: 200, output_tokens: 100 }
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await anthropicSendRequest('test-api-key', [{ role: 'user', content: 'Hello' }], 'claude-3-sonnet-20240229', 1024, 0.7);

    expect(result.text).toBe('Part 1');
  });
});

// Tests for sendStructuredRequest from src/ai/providers/anthropicProvider.ts
describe('sendStructuredRequest', () => {
  let mockClient;
  
  beforeEach(() => {
    mockClient = { messages: { create: jest.fn() } };
  });

  it('should send structured request with JSON schema and return parsed content', async () => {
    const mockResponse = { content: [{ type: 'text', text: '{"result":"test"}' }] };
    mockClient.messages.create.mockResolvedValue(mockResponse);
    
    const schema = { type: 'object', properties: { result: { type: 'string' } }, required: ['result'] };
    const result = await anthropicSendStructuredRequest(mockClient, 'test prompt', schema, 'TestSchema');
    
    expect(mockClient.messages.create).toHaveBeenCalledWith(expect.objectContaining({ model: expect.any(String), messages: [{ role: 'user', content: 'test prompt' }] }));
    expect(result).toEqual({ result: 'test' });
  });

  it('should throw error when API call fails', async () => {
    mockClient.messages.create.mockRejectedValue(new Error('API Error'));
    
    const schema = { type: 'object', properties: {} };
    await expect(anthropicSendStructuredRequest(mockClient, 'test', schema, 'Schema')).rejects.toThrow('API Error');
  });

  it('should handle empty or invalid JSON response gracefully', async () => {
    const mockResponse = { content: [{ type: 'text', text: 'invalid json' }] };
    mockClient.messages.create.mockResolvedValue(mockResponse);
    
    const schema = { type: 'object', properties: {} };
    await expect(anthropicSendStructuredRequest(mockClient, 'test', schema, 'Schema')).rejects.toThrow();
  });
});

// Tests for sendRequest from src/ai/providers/openAIProvider.ts
describe('sendRequest', () => {
  const mockApiKey = 'test-api-key';
  const mockMessages = [{ role: 'user', content: 'test message' }];
  const mockModel = 'gpt-4';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully send request and return response with token usage', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'test response' } }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await openAISendRequest(mockApiKey, mockMessages, mockModel);

    expect(fetch).toHaveBeenCalledWith('https://api.openai.com/chat/completions', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Authorization': `Bearer ${mockApiKey}`,
        'Content-Type': 'application/json'
      }),
      body: expect.stringContaining(mockModel)
    }));
    expect(result).toEqual({ content: 'test response', tokenUsage: mockResponse.usage });
  });

  it('should throw error when API returns non-ok response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    await expect(openAISendRequest(mockApiKey, mockMessages, mockModel)).rejects.toThrow();
  });

  it('should handle network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(openAISendRequest(mockApiKey, mockMessages, mockModel)).rejects.toThrow('Network error');
  });
});

// Tests for sendStructuredRequest from src/ai/providers/openAIProvider.ts
describe('sendStructuredRequest', () => {
  let mockOpenAI;
  let mockCreate;

  beforeEach(() => {
    mockCreate = jest.fn();
    mockOpenAI = {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
  });

  it('should successfully parse and return JSON from response', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: '{"result":"success","value":42}'
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await openAISendStructuredRequest(mockOpenAI, 'gpt-4', 'test prompt', { maxTokens: 1000 });

    expect(result).toEqual({ result: 'success', value: 42 });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'test prompt' }],
      max_tokens: 1000
    }));
  });

  it('should throw error when response contains no JSON', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'This is plain text without JSON'
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    await expect(openAISendStructuredRequest(mockOpenAI, 'gpt-4', 'test prompt', {})).rejects.toThrow('No JSON found');
  });

  it('should throw error when API call fails', async () => {
    mockCreate.mockRejectedValue(new Error('API error'));

    await expect(openAISendStructuredRequest(mockOpenAI, 'gpt-4', 'test prompt', {})).rejects.toThrow('API error');
  });
});
