/**
 * Auto-generated unit tests
 * Generated: 2025-11-26T16:29:52.030Z
 */




// Tests for canMakeRequest from src/ai/llmRateLimiter.ts
const { canMakeRequest } = require('../src/ai/llmRateLimiter');

describe('canMakeRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when no requests have been made for the provider', () => {
    const result = canMakeRequest('openai');
    expect(result).toBe(true);
  });

  it('should return false when rate limit is exceeded for the provider', () => {
    const provider = 'anthropic';
    for (let i = 0; i < 100; i++) {
      canMakeRequest(provider);
    }
    const result = canMakeRequest(provider);
    expect(result).toBe(false);
  });

  it('should handle multiple providers independently', () => {
    const provider1 = 'openai';
    const provider2 = 'google';
    
    const result1 = canMakeRequest(provider1);
    const result2 = canMakeRequest(provider2);
    
    expect(result1).toBe(true);
    expect(result2).toBe(true);
  });
});

// Tests for parseFileSummary from src/ai/llmResponseParser.ts
const { parseFileSummary } = require('../src/ai/llmResponseParser');

describe('parseFileSummary', () => {
  it('should parse valid JSON response', () => {
    const jsonResponse = JSON.stringify({
      summary: 'This file contains user authentication logic',
      purpose: 'Handles user login and session management',
      keyFunctions: ['login', 'logout', 'validateSession']
    });
    
    const result = parseFileSummary(jsonResponse);
    
    expect(result).toEqual({
      summary: 'This file contains user authentication logic',
      purpose: 'Handles user login and session management',
      keyFunctions: ['login', 'logout', 'validateSession']
    });
  });

  it('should fallback to text extraction when JSON parsing fails', () => {
    const textResponse = 'Summary: This is a utility module\nPurpose: Provides helper functions\nKey Functions: formatDate, parseInput';
    
    const result = parseFileSummary(textResponse);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('should handle empty or invalid input gracefully', () => {
    const emptyResponse = '';
    
    const result = parseFileSummary(emptyResponse);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });
});

// Tests for executeWithRetry from src/ai/llmRetryHandler.ts
const { executeWithRetry } = require('../src/ai/llmRetryHandler');

describe('executeWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return result on successful first attempt', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    const promise = executeWithRetry(mockOperation);
    const result = await promise;
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('Failure 1'))
      .mockRejectedValueOnce(new Error('Failure 2'))
      .mockResolvedValueOnce('success');
    const promise = executeWithRetry(mockOperation, { maxRetries: 3, initialDelay: 100 });
    setTimeout(() => jest.advanceTimersByTime(100), 0);
    setTimeout(() => jest.advanceTimersByTime(200), 0);
    const result = await promise;
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max retries exceeded', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
    const promise = executeWithRetry(mockOperation, { maxRetries: 2, initialDelay: 50 });
    setTimeout(() => jest.advanceTimersByTime(50), 0);
    setTimeout(() => jest.advanceTimersByTime(100), 0);
    await expect(promise).rejects.toThrow('Persistent failure');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });
});

// Tests for sendStructuredRequest from src/ai/providers/anthropicProvider.ts
const { sendStructuredRequest: sendStructuredRequestAnthropic } = require('../src/ai/providers/anthropicProvider');

describe('sendStructuredRequest (Anthropic)', () => {
  let mockAnthropicCreate;
  let originalAnthropic;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnthropicCreate = jest.fn();
    originalAnthropic = global.Anthropic;
    global.Anthropic = jest.fn().mockImplementation(() => ({
      messages: {
        create: mockAnthropicCreate
      }
    }));
  });

  afterEach(() => {
    global.Anthropic = originalAnthropic;
  });

  it('should successfully send a structured request and return parsed JSON response', async () => {
    const mockResponse = {
      content: [{
        type: 'text',
        text: JSON.stringify({ result: 'success', data: 'test data' })
      }]
    };
    mockAnthropicCreate.mockResolvedValue(mockResponse);

    const prompt = 'Test prompt';
    const schema = {
      type: 'object',
      properties: {
        result: { type: 'string' },
        data: { type: 'string' }
      },
      required: ['result', 'data']
    };
    const apiKey = 'test-api-key';

    const result = await sendStructuredRequestAnthropic(prompt, schema, apiKey);

    expect(result).toEqual({ result: 'success', data: 'test data' });
    expect(mockAnthropicCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: expect.any(String),
      messages: expect.arrayContaining([expect.objectContaining({ role: 'user', content: expect.stringContaining(prompt) })])
    }));
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('API request failed');
    mockAnthropicCreate.mockRejectedValue(error);

    const prompt = 'Test prompt';
    const schema = { type: 'object', properties: {} };
    const apiKey = 'test-api-key';

    await expect(sendStructuredRequestAnthropic(prompt, schema, apiKey)).rejects.toThrow('API request failed');
  });

  it('should handle invalid JSON response from API', async () => {
    const mockResponse = {
      content: [{
        type: 'text',
        text: 'This is not valid JSON'
      }]
    };
    mockAnthropicCreate.mockResolvedValue(mockResponse);

    const prompt = 'Test prompt';
    const schema = { type: 'object', properties: {} };
    const apiKey = 'test-api-key';

    await expect(sendStructuredRequestAnthropic(prompt, schema, apiKey)).rejects.toThrow();
  });
});

// Tests for sendStructuredRequest from src/ai/providers/openAIProvider.ts
const { sendStructuredRequest: sendStructuredRequestOpenAI } = require('../src/ai/providers/openAIProvider');

describe('sendStructuredRequest (OpenAI)', () => {
  let mockOpenAI;
  let mockCreate;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate = jest.fn();
    mockOpenAI = {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
  });
  
  it('should successfully parse and return structured JSON response', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({ name: 'John', age: 30 })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);
    
    const result = await sendStructuredRequestOpenAI(mockOpenAI, 'gpt-4', [{ role: 'user', content: 'test' }], { type: 'object', properties: { name: { type: 'string' }, age: { type: 'number' } } });
    
    expect(result).toEqual({ name: 'John', age: 30 });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'test' }],
      response_format: { type: 'json_object' }
    }));
  });
  
  it('should throw error when response is not valid JSON', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'invalid json {'
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);
    
    await expect(sendStructuredRequestOpenAI(mockOpenAI, 'gpt-4', [{ role: 'user', content: 'test' }], { type: 'object' })).rejects.toThrow();
  });
  
  it('should handle empty or missing response content', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: null
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);
    
    await expect(sendStructuredRequestOpenAI(mockOpenAI, 'gpt-4', [{ role: 'user', content: 'test' }], { type: 'object' })).rejects.toThrow();
  });
});

// Tests for analyzeFileMetadata from src/analysis/enhancedAnalyzer.ts
const { analyzeFileMetadata } = require('../src/analysis/enhancedAnalyzer'); const fs = require('fs'); const path = require('path'); jest.mock('fs'); jest.mock('path'); jest.mock('../src/analysis/typeScriptAnalyzer', () => ({ analyzeTypeScriptFile: jest.fn() })); jest.mock('../src/analysis/regexAnalyzer', () => ({ analyzeWithRegex: jest.fn() })); const { analyzeTypeScriptFile } = require('../src/analysis/typeScriptAnalyzer'); const { analyzeWithRegex } = require('../src/analysis/regexAnalyzer'); describe('analyzeFileMetadata', () => { beforeEach(() => { jest.clearAllMocks(); }); test('should analyze TypeScript file using TypeScript analyzer', () => { const filePath = '/project/src/file.ts'; const mockContent = 'function test() { return true; }'; const mockMetadata = { functions: [{ name: 'test', complexity: 1, lines: 1 }] }; fs.readFileSync.mockReturnValue(mockContent); path.extname.mockReturnValue('.ts'); analyzeTypeScriptFile.mockReturnValue(mockMetadata); const result = analyzeFileMetadata(filePath); expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8'); expect(path.extname).toHaveBeenCalledWith(filePath); expect(analyzeTypeScriptFile).toHaveBeenCalledWith(mockContent, filePath); expect(result).toEqual(mockMetadata); expect(analyzeWithRegex).not.toHaveBeenCalled(); }); test('should analyze JavaScript file using regex analyzer', () => { const filePath = '/project/src/file.js'; const mockContent = 'function test() { return true; }'; const mockMetadata = { functions: [{ name: 'test', complexity: 1, lines: 1 }] }; fs.readFileSync.mockReturnValue(mockContent); path.extname.mockReturnValue('.js'); analyzeWithRegex.mockReturnValue(mockMetadata); const result = analyzeFileMetadata(filePath); expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8'); expect(path.extname).toHaveBeenCalledWith(filePath); expect(analyzeWithRegex).toHaveBeenCalledWith(mockContent, filePath); expect(result).toEqual(mockMetadata); expect(analyzeTypeScriptFile).not.toHaveBeenCalled(); }); test('should handle file read errors gracefully', () => { const filePath = '/project/src/missing.ts'; fs.readFileSync.mockImplementation(() => { throw new Error('File not found'); }); expect(() => analyzeFileMetadata(filePath)).toThrow('File not found'); expect(analyzeTypeScriptFile).not.toHaveBeenCalled(); expect(analyzeWithRegex).not.toHaveBeenCalled(); }); });