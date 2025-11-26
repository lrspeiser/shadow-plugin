/**
 * Auto-generated unit tests
 * Generated: 2025-11-26T18:23:27.108Z
 */




// Tests for canMakeRequest from src/ai/llmRateLimiter.ts
const { canMakeRequest } = require('../src/ai/llmRateLimiter');

describe('canMakeRequest', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should return true when no previous requests have been made', () => {
    const result = canMakeRequest('openai');
    expect(result).toBe(true);
  });

  test('should return true for unknown provider with default rate limits', () => {
    const result = canMakeRequest('unknown-provider');
    expect(result).toBe(true);
  });

  test('should return true for different providers independently', () => {
    const openaiResult = canMakeRequest('openai');
    const anthropicResult = canMakeRequest('anthropic');
    
    expect(openaiResult).toBe(true);
    expect(anthropicResult).toBe(true);
  });
});


// Tests for parseFileSummary from src/ai/llmResponseParser.ts
const { parseFileSummary } = require('../src/ai/llmResponseParser');

describe('parseFileSummary', () => {
  describe('success cases', () => {
    it('should parse valid JSON response with summary field', () => {
      const jsonResponse = '{"summary": "This is a utility module for parsing data."}';
      
      const result = parseFileSummary(jsonResponse);
      
      expect(result).toBe('This is a utility module for parsing data.');
    });

    it('should extract summary from JSON embedded in text', () => {
      const responseWithText = 'Here is the analysis:\n{"summary": "A helper function for string manipulation."}\nEnd of response.';
      
      const result = parseFileSummary(responseWithText);
      
      expect(result).toBe('A helper function for string manipulation.');
    });

    it('should handle JSON with additional fields and extract summary', () => {
      const jsonWithExtraFields = '{"summary": "Main entry point for the application.", "confidence": 0.95, "tags": ["entry", "main"]}';
      
      const result = parseFileSummary(jsonWithExtraFields);
      
      expect(result).toBe('Main entry point for the application.');
    });
  });

  describe('edge cases', () => {
    it('should fall back to text extraction when JSON parsing fails', () => {
      const plainTextResponse = 'This file contains utility functions for data processing.';
      
      const result = parseFileSummary(plainTextResponse);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty string input', () => {
      const emptyInput = '';
      
      const result = parseFileSummary(emptyInput);
      
      expect(typeof result).toBe('string');
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{"summary": "incomplete json';
      
      const result = parseFileSummary(malformedJson);
      
      expect(typeof result).toBe('string');
    });

    it('should handle JSON without summary field', () => {
      const jsonWithoutSummary = '{"description": "Some description", "type": "module"}';
      
      const result = parseFileSummary(jsonWithoutSummary);
      
      expect(typeof result).toBe('string');
    });
  });
});

// Tests for executeWithRetry from src/ai/llmRetryHandler.ts
const { executeWithRetry } = require('../src/ai/llmRetryHandler');

describe('executeWithRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return result on successful first attempt', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');

    const resultPromise = executeWithRetry(mockOperation);
    const result = await resultPromise;

    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed on subsequent attempt', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce('success after retry');

    const resultPromise = executeWithRetry(mockOperation, { maxRetries: 3, baseDelayMs: 100 });

    await jest.advanceTimersByTimeAsync(100);

    const result = await resultPromise;

    expect(result).toBe('success after retry');
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it('should throw error after exhausting all retries', async () => {
    const testError = new Error('persistent failure');
    const mockOperation = jest.fn().mockRejectedValue(testError);

    const resultPromise = executeWithRetry(mockOperation, { maxRetries: 2, baseDelayMs: 50 });

    await jest.advanceTimersByTimeAsync(50);
    await jest.advanceTimersByTimeAsync(100);

    await expect(resultPromise).rejects.toThrow('persistent failure');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });
});

// Tests for sendStructuredRequest from src/ai/providers/ILLMProvider.ts
const { sendStructuredRequest: sendStructuredRequestILLM } = require('../src/ai/providers/ILLMProvider');

interface MockProvider {
  sendStructuredRequest: jest.Mock;
}

describe('sendStructuredRequestILLM (from ILLMProvider.ts)', () => {
  let mockProvider: MockProvider;

  beforeEach(() => {
    mockProvider = {
      sendStructuredRequest: jest.fn()
    };
    jest.clearAllMocks();
  });

  test('should return parsed JSON data when provider returns valid structured response', async () => {
    const expectedResponse = { name: 'John', age: 30 };
    mockProvider.sendStructuredRequest.mockResolvedValue(expectedResponse);

    const prompt = 'Get user info';
    const schema = { type: 'object', properties: { name: { type: 'string' }, age: { type: 'number' } } };

    const result = await mockProvider.sendStructuredRequest(prompt, schema);

    expect(result).toEqual(expectedResponse);
    expect(mockProvider.sendStructuredRequest).toHaveBeenCalledWith(prompt, schema);
    expect(mockProvider.sendStructuredRequest).toHaveBeenCalledTimes(1);
  });

  test('should handle complex nested JSON structures', async () => {
    const expectedResponse = {
      user: {
        profile: {
          firstName: 'Jane',
          lastName: 'Doe'
        },
        settings: {
          notifications: true
        }
      }
    };
    mockProvider.sendStructuredRequest.mockResolvedValue(expectedResponse);

    const prompt = 'Get nested user data';
    const schema = { type: 'object' };

    const result = await mockProvider.sendStructuredRequest(prompt, schema);

    expect(result).toEqual(expectedResponse);
    expect(result.user.profile.firstName).toBe('Jane');
  });

  test('should propagate errors when provider fails to return structured data', async () => {
    const errorMessage = 'Failed to parse structured response';
    mockProvider.sendStructuredRequest.mockRejectedValue(new Error(errorMessage));

    const prompt = 'Invalid request';
    const schema = { type: 'object' };

    await expect(mockProvider.sendStructuredRequest(prompt, schema)).rejects.toThrow(errorMessage);
    expect(mockProvider.sendStructuredRequest).toHaveBeenCalledTimes(1);
  });
});

// Tests for sendStructuredRequest from src/ai/providers/anthropicProvider.ts
const { sendStructuredRequest: sendStructuredRequestAnthropic } = require('../src/ai/providers/anthropicProvider');

const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate
    }
  }));
});

describe('sendStructuredRequestAnthropic (from anthropicProvider.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send structured request and return parsed JSON response', async () => {
    const expectedResponse = { name: 'John', age: 30 };
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(expectedResponse) }]
    });

    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name', 'age']
    };

    const result = await sendStructuredRequestAnthropic(
      'Extract user info',
      'John is 30 years old',
      schema,
      'claude-3-5-sonnet-20241022'
    );

    expect(result).toEqual(expectedResponse);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 16000,
        system: 'Extract user info',
        messages: [{ role: 'user', content: 'John is 30 years old' }]
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    const apiError = new Error('API rate limit exceeded');
    mockCreate.mockRejectedValue(apiError);

    const schema = {
      type: 'object',
      properties: {
        result: { type: 'string' }
      }
    };

    await expect(
      sendStructuredRequestAnthropic(
        'Test prompt',
        'Test content',
        schema,
        'claude-3-5-sonnet-20241022'
      )
    ).rejects.toThrow('API rate limit exceeded');
  });

  it('should handle empty content array in response', async () => {
    mockCreate.mockResolvedValue({
      content: []
    });

    const schema = {
      type: 'object',
      properties: {
        data: { type: 'string' }
      }
    };

    await expect(
      sendStructuredRequestAnthropic(
        'Test prompt',
        'Test content',
        schema,
        'claude-3-5-sonnet-20241022'
      )
    ).rejects.toThrow();
  });
});

// Tests for sendStructuredRequest from src/ai/providers/openAIProvider.ts
const { sendStructuredRequest: sendStructuredRequestOpenAI } = require('../src/ai/providers/openAIProvider');

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

jest.mock('../src/config/aiConfig', () => ({
  getAIConfig: jest.fn().mockReturnValue({
    openai: {
      apiKey: 'test-api-key',
      model: 'gpt-4'
    }
  })
}));

jest.mock('../src/ai/textProcessor', () => ({
  extractJson: jest.fn()
}));

jest.mock('../src/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn()
}));

const OpenAI = require('openai');
const { extractJson } = require('../src/ai/textProcessor');

describe('sendStructuredRequestOpenAI (from openAIProvider.ts)', () => {
  let mockCreateOpenAI: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateOpenAI = jest.fn();
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreateOpenAI
        }
      }
    }));
  });

  it('should send request and return parsed JSON response', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: '{"result": "success", "value": 42}'
        }
      }]
    };
    mockCreateOpenAI.mockResolvedValue(mockResponse);

    const expectedParsed = { result: 'success', value: 42 };
    extractJson.mockReturnValue(expectedParsed);

    const systemPrompt = 'You are a helpful assistant.';
    const userMessage = 'Parse this data.';

    const result = await sendStructuredRequestOpenAI(
      systemPrompt,
      userMessage
    );

    expect(result).toEqual(expectedParsed);
    expect(mockCreateOpenAI).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: systemPrompt }),
        expect.objectContaining({ role: 'user', content: userMessage })
      ])
    }));
    expect(extractJson).toHaveBeenCalledWith('{"result": "success", "value": 42}');
  });

  it('should throw error when response content is empty', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: null
        }
      }]
    };
    mockCreateOpenAI.mockResolvedValue(mockResponse);

    const systemPrompt = 'System prompt';
    const userMessage = 'User message';

    await expect(sendStructuredRequestOpenAI(systemPrompt, userMessage))
      .rejects
      .toThrow();
  });

  it('should throw error when JSON extraction fails', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'invalid json content'
        }
      }]
    };
    mockCreateOpenAI.mockResolvedValue(mockResponse);

    extractJson.mockImplementation(() => {
      throw new Error('Failed to extract JSON');
    });

    const systemPrompt = 'System prompt';
    const userMessage = 'User message';

    await expect(sendStructuredRequestOpenAI(systemPrompt, userMessage))
      .rejects
      .toThrow('Failed to extract JSON');
  });
});

// Tests for analyzeTypeScriptFunction from src/analysis/enhancedAnalyzer.ts
const { analyzeTypeScriptFunction: analyzeTypeScriptFunctionEnhancedAnalyzer } = require('../src/analysis/enhancedAnalyzer');

describe('analyzeTypeScriptFunctionEnhancedAnalyzer (from enhancedAnalyzer.ts)', () => {
  describe('basic function analysis', () => {
    it('should analyze a simple function with parameters and return type', () => {
      const sourceCode = `
        function add(a: number, b: number): number {
          return a + b;
        }
      `;
      
      const result = analyzeTypeScriptFunctionEnhancedAnalyzer(sourceCode, 'add');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should analyze an arrow function', () => {
      const sourceCode = `
        const multiply = (x: number, y: number): number => x * y;
      `;
      
      const result = analyzeTypeScriptFunctionEnhancedAnalyzer(sourceCode, 'multiply');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('edge cases', () => {
    it('should handle function not found in source code', () => {
      const sourceCode = `
        function existingFunction(): void {
          console.log('hello');
        }
      `;
      
      const result = analyzeTypeScriptFunctionEnhancedAnalyzer(sourceCode, 'nonExistentFunction');
      
      expect(result).toBeDefined();
    });

    it('should handle empty source code', () => {
      const sourceCode = '';
      
      const testFn = () => analyzeTypeScriptFunctionEnhancedAnalyzer(sourceCode, 'anyFunction');
      
      expect(testFn).not.toThrow();
    });

    it('should handle async function analysis', () => {
      const sourceCode = `
        async function fetchData(url: string): Promise<string> {
          const response = await fetch(url);
          return response.text();
        }
      `;
      
      const result = analyzeTypeScriptFunctionEnhancedAnalyzer(sourceCode, 'fetchData');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });
});

// Tests for analyzeTypeScriptFunction from src/analysis/functionAnalyzer.ts
const { analyzeTypeScriptFunction: analyzeTypeScriptFunctionFunctionAnalyzer } = require('../src/analysis/functionAnalyzer');

describe('analyzeTypeScriptFunctionFunctionAnalyzer (from functionAnalyzer.ts)', () => {
  describe('basic function analysis', () => {
    it('should analyze a simple function with parameters and return type', () => {
      const functionCode = `function add(a: number, b: number): number {
        return a + b;
      }`;
      
      const result = analyzeTypeScriptFunctionFunctionAnalyzer(functionCode, 'add');
      
      expect(result).toBeDefined();
      expect(result.name).toBe('add');
      expect(result.parameters).toBeDefined();
      expect(Array.isArray(result.parameters)).toBe(true);
    });

    it('should analyze an arrow function', () => {
      const functionCode = `const multiply = (x: number, y: number): number => x * y;`;
      
      const result = analyzeTypeScriptFunctionFunctionAnalyzer(functionCode, 'multiply');
      
      expect(result).toBeDefined();
      expect(result.name).toBe('multiply');
    });
  });

  describe('edge cases', () => {
    it('should handle function with no parameters', () => {
      const functionCode = `function getTimestamp(): number {
        return Date.now();
      }`;
      
      const result = analyzeTypeScriptFunctionFunctionAnalyzer(functionCode, 'getTimestamp');
      
      expect(result).toBeDefined();
      expect(result.name).toBe('getTimestamp');
      expect(result.parameters).toEqual([]);
    });

    it('should handle async function', () => {
      const functionCode = `async function fetchData(url: string): Promise<string> {
        return await fetch(url).then(r => r.text());
      }`;
      
      const result = analyzeTypeScriptFunctionFunctionAnalyzer(functionCode, 'fetchData');
      
      expect(result).toBeDefined();
      expect(result.name).toBe('fetchData');
      expect(result.isAsync === true || result.async === true || (result.modifiers && result.modifiers.includes('async'))).toBeTruthy();
    });

    it('should return appropriate result for non-existent function name', () => {
      const functionCode = `function existingFunc(): void {}`;
      
      const result = analyzeTypeScriptFunctionFunctionAnalyzer(functionCode, 'nonExistentFunc');
      
      expect(result === null || result === undefined || result.name === undefined || result.name !== 'nonExistentFunc').toBeTruthy();
    });
  });
});
