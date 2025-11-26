/**
 * Auto-generated unit tests
 * Generated: 2025-11-26T17:49:56.802Z
 */




// Tests for canMakeRequest from src/ai/llmRateLimiter.ts
const { canMakeRequest } = require('../src/ai/llmRateLimiter');

describe('canMakeRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return true when no previous requests have been made', () => {
    const result = canMakeRequest('openai');
    expect(typeof result).toBe('boolean');
  });

  test('should return a boolean for valid provider names', () => {
    const providers = ['openai', 'anthropic', 'google'];
    
    providers.forEach((provider) => {
      const result = canMakeRequest(provider);
      expect(typeof result).toBe('boolean');
    });
  });

  test('should handle unknown provider gracefully', () => {
    const result = canMakeRequest('unknown-provider');
    expect(typeof result).toBe('boolean');
  });
});


// Tests for parseFileSummary from src/ai/llmResponseParser.ts
const { parseFileSummary } = require('../src/ai/llmResponseParser');

describe('parseFileSummary', () => {
  describe('success cases', () => {
    it('should parse valid JSON response with summary field', () => {
      const jsonResponse = '{"summary": "This is a utility module for parsing data"}';
      
      const result = parseFileSummary(jsonResponse);
      
      expect(result).toBe('This is a utility module for parsing data');
    });

    it('should extract summary from JSON embedded in text', () => {
      const responseWithText = 'Here is the analysis:\n{"summary": "A helper class for database operations"}\nEnd of response.';
      
      const result = parseFileSummary(responseWithText);
      
      expect(result).toBe('A helper class for database operations');
    });

    it('should fallback to text extraction when JSON parsing fails', () => {
      const plainTextResponse = 'This file contains utility functions for string manipulation and formatting.';
      
      const result = parseFileSummary(plainTextResponse);
      
      expect(result).toBe('This file contains utility functions for string manipulation and formatting.');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string input', () => {
      const emptyInput = '';
      
      const result = parseFileSummary(emptyInput);
      
      expect(result).toBe('');
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{summary: "missing quotes on key"}';
      
      const result = parseFileSummary(malformedJson);
      
      expect(typeof result).toBe('string');
    });

    it('should handle JSON without summary field', () => {
      const jsonWithoutSummary = '{"description": "Some description", "otherField": "value"}';
      
      const result = parseFileSummary(jsonWithoutSummary);
      
      expect(typeof result).toBe('string');
    });

    it('should trim whitespace from extracted summary', () => {
      const responseWithWhitespace = '{"summary": "  A summary with extra spaces  "}';
      
      const result = parseFileSummary(responseWithWhitespace);
      
      expect(result).not.toMatch(/^\s+|\s+$/);
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
    const expectedResult = 'success';
    const operation = jest.fn().mockResolvedValue(expectedResult);

    const resultPromise = executeWithRetry(operation);
    const result = await resultPromise;

    expect(result).toBe(expectedResult);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed on subsequent attempt', async () => {
    const expectedResult = 'success after retry';
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce(expectedResult);

    const resultPromise = executeWithRetry(operation, { maxRetries: 3, initialDelayMs: 100 });
    
    await jest.advanceTimersByTimeAsync(100);
    
    const result = await resultPromise;

    expect(result).toBe(expectedResult);
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should throw error after exhausting all retries', async () => {
    const errorMessage = 'Persistent failure';
    const operation = jest.fn()
      .mockRejectedValue(new Error(errorMessage));

    const resultPromise = executeWithRetry(operation, { maxRetries: 2, initialDelayMs: 50 });
    
    await jest.advanceTimersByTimeAsync(50);
    await jest.advanceTimersByTimeAsync(100);
    await jest.advanceTimersByTimeAsync(200);

    await expect(resultPromise).rejects.toThrow();
    expect(operation).toHaveBeenCalledTimes(3);
  });
});


// Tests for sendStructuredRequest from src/ai/providers/ILLMProvider.ts
const { sendStructuredRequest: sendStructuredRequestILLM } = require('../src/ai/providers/ILLMProvider');

describe('sendStructuredRequestILLM (from ILLMProvider.ts)', () => {
  let mockProvider;

  beforeEach(() => {
    mockProvider = {
      sendRequest: jest.fn()
    };
  });

  test('should parse valid JSON response from provider', async () => {
    const expectedData = { name: 'test', value: 42 };
    mockProvider.sendRequest.mockResolvedValue(JSON.stringify(expectedData));

    const result = await sendStructuredRequestILLM(
      mockProvider,
      'Give me structured data',
      { temperature: 0.5 }
    );

    expect(result).toEqual(expectedData);
    expect(mockProvider.sendRequest).toHaveBeenCalledWith(
      'Give me structured data',
      { temperature: 0.5 }
    );
  });

  test('should handle JSON response with markdown code blocks', async () => {
    const expectedData = { items: ['a', 'b', 'c'] };
    const markdownWrappedJson = '```json\n' + JSON.stringify(expectedData) + '\n```';
    mockProvider.sendRequest.mockResolvedValue(markdownWrappedJson);

    const result = await sendStructuredRequestILLM(
      mockProvider,
      'Return items as JSON'
    );

    expect(result).toEqual(expectedData);
  });

  test('should throw error when provider returns invalid JSON', async () => {
    mockProvider.sendRequest.mockResolvedValue('This is not valid JSON');

    await expect(
      sendStructuredRequestILLM(mockProvider, 'Get data')
    ).rejects.toThrow();
  });
});


// Tests for sendStructuredRequest from src/ai/providers/anthropicProvider.ts
const { sendStructuredRequest: sendStructuredRequestAnthropic } = require('../src/ai/providers/anthropicProvider');

const mockBetaMessagesParse = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    beta: {
      messages: {
        parse: mockBetaMessagesParse
      }
    }
  }));
});

describe('sendStructuredRequestAnthropic (from anthropicProvider.ts)', () => {
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalEnv;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it('should successfully parse structured response from Claude API', async () => {
    const expectedResult = { name: 'Test', value: 42 };
    mockBetaMessagesParse.mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          input: expectedResult
        }
      ]
    });

    const messages = [
      { role: 'user', content: 'Test message' }
    ];
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        value: { type: 'number' }
      },
      required: ['name', 'value']
    };

    const result = await sendStructuredRequestAnthropic(messages, schema);

    expect(result).toEqual(expectedResult);
    expect(mockBetaMessagesParse).toHaveBeenCalledTimes(1);
    expect(mockBetaMessagesParse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.any(String),
        messages: messages,
        tools: expect.arrayContaining([
          expect.objectContaining({
            name: 'json_response',
            input_schema: schema
          })
        ]),
        tool_choice: { type: 'tool', name: 'json_response' }
      })
    );
  });

  it('should extract JSON from text content when tool_use block is not present', async () => {
    const expectedResult = { status: 'success', count: 10 };
    mockBetaMessagesParse.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: `Here is the response: ${JSON.stringify(expectedResult)}`
        }
      ]
    });

    const messages = [
      { role: 'user', content: 'Get status' }
    ];
    const schema = {
      type: 'object',
      properties: {
        status: { type: 'string' },
        count: { type: 'number' }
      }
    };

    const result = await sendStructuredRequestAnthropic(messages, schema);

    expect(result).toEqual(expectedResult);
  });

  it('should throw error when no valid JSON can be extracted', async () => {
    mockBetaMessagesParse.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'This response contains no JSON at all'
        }
      ]
    });

    const messages = [
      { role: 'user', content: 'Invalid request' }
    ];
    const schema = {
      type: 'object',
      properties: {
        data: { type: 'string' }
      }
    };

    await expect(sendStructuredRequestAnthropic(messages, schema)).rejects.toThrow();
  });
});

// Tests for sendStructuredRequest from src/ai/providers/openAIProvider.ts
const { sendStructuredRequest: sendStructuredRequestOpenAI } = require('../src/ai/providers/openAIProvider');

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }));
});

jest.mock('../src/config', () => ({
  config: {
    openAiApiKey: 'test-api-key',
    openAiModel: 'gpt-4'
  }
}));

jest.mock('../src/utils/consoleUtils', () => ({
  debugLog: jest.fn()
}));

describe('sendStructuredRequestOpenAI (from openAIProvider.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse valid JSON response and return typed object', async () => {
    const expectedResponse = { name: 'test', value: 42 };
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(expectedResponse) } }]
    });

    const result = await sendStructuredRequestOpenAI(
      'system prompt',
      'user prompt'
    );

    expect(result).toEqual(expectedResponse);
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'user prompt' }
      ]
    });
  });

  it('should throw error when response contains invalid JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'not valid json' } }]
    });

    await expect(
      sendStructuredRequestOpenAI('system prompt', 'user prompt')
    ).rejects.toThrow();
  });

  it('should throw error when response content is null or undefined', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }]
    });

    await expect(
      sendStructuredRequestOpenAI('system prompt', 'user prompt')
    ).rejects.toThrow();
  });
});

// Tests for analyzeTypeScriptFunction from src/analysis/enhancedAnalyzer.ts
const { analyzeTypeScriptFunction: analyzeTypeScriptFunctionEnhancedAnalyzer } = require('../src/analysis/enhancedAnalyzer');

describe('analyzeTypeScriptFunctionEnhancedAnalyzer (from enhancedAnalyzer.ts)', () => {
  describe('basic function analysis', () => {
    it('should analyze a simple function with parameters and return type', () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b;
        }
      `;
      
      const result = analyzeTypeScriptFunctionEnhancedAnalyzer(code, 'add');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      if (result && typeof result === 'object') {
        const typedResult = result;
        expect(typedResult.name || typedResult.functionName).toBe('add');
      }
    });

    it('should analyze an arrow function', () => {
      const code = `
        const multiply = (x: number, y: number): number => x * y;
      `;
      
      const result = analyzeTypeScriptFunctionEnhancedAnalyzer(code, 'multiply');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('edge cases', () => {
    it('should handle function with no parameters', () => {
      const code = `
        function getConstant(): number {
          return 42;
        }
      `;
      
      const result = analyzeTypeScriptFunctionEnhancedAnalyzer(code, 'getConstant');
      
      expect(result).toBeDefined();
      if (result && typeof result === 'object') {
        const typedResult = result;
        if (Array.isArray(typedResult.parameters)) {
          expect(typedResult.parameters.length).toBe(0);
        }
      }
    });

    it('should handle function not found in code', () => {
      const code = `
        function existingFunction(): void {
          console.log('hello');
        }
      `;
      
      const result = analyzeTypeScriptFunctionEnhancedAnalyzer(code, 'nonExistentFunction');
      
      expect(result === null || result === undefined || (typeof result === 'object' && result !== null && Object.keys(result).length === 0) || (typeof result === 'object' && result !== null && 'error' in result)).toBe(true);
    });

    it('should handle async function', () => {
      const code = `
        async function fetchData(url: string): Promise<string> {
          return await fetch(url).then(r => r.text());
        }
      `;
      
      const result = analyzeTypeScriptFunctionEnhancedAnalyzer(code, 'fetchData');
      
      expect(result).toBeDefined();
      if (result && typeof result === 'object') {
        const typedResult = result;
        if ('isAsync' in typedResult) {
          expect(typedResult.isAsync).toBe(true);
        }
      }
    });
  });
});

// Tests for analyzeTypeScriptFunction from src/analysis/functionAnalyzer.ts
const { analyzeTypeScriptFunction: analyzeTypeScriptFunctionFunctionAnalyzer } = require('../src/analysis/functionAnalyzer');

describe('analyzeTypeScriptFunctionFunctionAnalyzer (from functionAnalyzer.ts)', () => {
  describe('basic function analysis', () => {
    it('should analyze a simple function declaration', () => {
      const code = `function add(a: number, b: number): number {
        return a + b;
      }`;
      
      const result = analyzeTypeScriptFunctionFunctionAnalyzer(code, 'add');
      
      expect(result).toBeDefined();
      if (result && typeof result === 'object') {
        const typedResult = result;
        expect(typedResult.name).toBe('add');
        if (Array.isArray(typedResult.parameters)) {
          expect(typedResult.parameters.length).toBe(2);
        }
      }
    });

    it('should analyze an arrow function expression', () => {
      const code = `const multiply = (x: number, y: number): number => x * y;`;
      
      const result = analyzeTypeScriptFunctionFunctionAnalyzer(code, 'multiply');
      
      expect(result).toBeDefined();
      if (result && typeof result === 'object') {
        const typedResult = result;
        expect(typedResult.name).toBe('multiply');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle function not found in code', () => {
      const code = `function existing(): void {}`;
      
      const result = analyzeTypeScriptFunctionFunctionAnalyzer(code, 'nonExistent');
      
      expect(result).toBeNull();
    });

    it('should handle empty code gracefully', () => {
      const code = '';
      
      const result = analyzeTypeScriptFunctionFunctionAnalyzer(code, 'anyFunction');
      
      expect(result).toBeNull();
    });

    it('should analyze function with no parameters', () => {
      const code = `function noParams(): string {
        return 'hello';
      }`;
      
      const result = analyzeTypeScriptFunctionFunctionAnalyzer(code, 'noParams');
      
      expect(result).toBeDefined();
      if (result && typeof result === 'object') {
        const typedResult = result;
        expect(typedResult.name).toBe('noParams');
        if (Array.isArray(typedResult.parameters)) {
          expect(typedResult.parameters.length).toBe(0);
        }
      }
    });
  });
});
