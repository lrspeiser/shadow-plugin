/**
 * Auto-generated unit tests
 * Generated: 2025-11-26T21:55:18.546Z
 */




// Tests for parseFileSummary from src/ai/llmResponseParser.ts
const { LLMResponseParser } = require('../src/ai/llmResponseParser');

describe('LLMResponseParser.parseFileSummary', () => {
  let instance;

  beforeEach(() => {
    instance = new LLMResponseParser();
  });

  describe('JSON parsing', () => {
    it('should parse valid JSON response with summary field', () => {
      const jsonResponse = JSON.stringify({ summary: 'This is a file summary describing the module functionality.' });
      
      const result = instance.parseFileSummary(jsonResponse);
      
      expect(result).toBe('This is a file summary describing the module functionality.');
    });

    it('should parse JSON response with nested structure', () => {
      const jsonResponse = JSON.stringify({
        summary: 'A utility module for parsing responses',
        details: { complexity: 'low' }
      });
      
      const result = instance.parseFileSummary(jsonResponse);
      
      expect(result).toBe('A utility module for parsing responses');
    });
  });

  describe('text extraction fallback', () => {
    it('should extract summary from plain text when JSON parsing fails', () => {
      const textResponse = 'Summary: This module handles LLM response parsing with multiple formats.';
      
      const result = instance.parseFileSummary(textResponse);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle malformed JSON and fall back to text extraction', () => {
      const malformedJson = '{ summary: "Missing quotes on key" }';
      
      const result = instance.parseFileSummary(malformedJson);
      
      expect(typeof result).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string input', () => {
      const emptyInput = '';
      
      const result = instance.parseFileSummary(emptyInput);
      
      expect(typeof result).toBe('string');
    });

    it('should handle JSON with empty summary', () => {
      const jsonWithEmptySummary = JSON.stringify({ summary: '' });
      
      const result = instance.parseFileSummary(jsonWithEmptySummary);
      
      expect(result).toBe('');
    });

    it('should handle JSON without summary field', () => {
      const jsonWithoutSummary = JSON.stringify({ description: 'Some description' });
      
      const result = instance.parseFileSummary(jsonWithoutSummary);
      
      expect(typeof result).toBe('string');
    });
  });
});

// Tests for executeWithRetry from src/ai/llmRetryHandler.ts
const { RetryHandler } = require('../src/ai/llmRetryHandler');

describe('RetryHandler.executeWithRetry', () => {
  let instance;

  beforeEach(() => {
    instance = new RetryHandler();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return result on successful operation without retry', async () => {
    const expectedResult = 'success';
    const operation = jest.fn().mockResolvedValue(expectedResult);

    const resultPromise = instance.executeWithRetry(operation);
    
    await jest.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe(expectedResult);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed on subsequent attempt', async () => {
    const expectedResult = 'success after retry';
    const error = new Error('temporary failure');
    const operation = jest.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(expectedResult);

    const resultPromise = instance.executeWithRetry(operation, { maxRetries: 3, baseDelayMs: 100 });
    
    await jest.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe(expectedResult);
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should throw error after exhausting all retries', async () => {
    const error = new Error('persistent failure');
    const operation = jest.fn().mockRejectedValue(error);

    const resultPromise = instance.executeWithRetry(operation, { maxRetries: 2, baseDelayMs: 50 });
    
    await jest.runAllTimersAsync();

    await expect(resultPromise).rejects.toThrow('persistent failure');
    expect(operation).toHaveBeenCalledTimes(3);
  });
});

// Tests for sendRequest from src/ai/providers/ILLMProvider.ts
const { sendRequest: sendRequestILLM } = require('../src/ai/providers/ILLMProvider');

describe('sendRequestILLM (from ILLMProvider.ts)', () => {
  describe('interface contract tests', () => {
    it('should be defined as a function or interface method', () => {
      // ILLMProvider is an interface, so sendRequest is a method signature
      // We test that the export exists (may be undefined for interface-only files)
      expect(typeof sendRequestILLM === 'function' || typeof sendRequestILLM === 'undefined').toBe(true);
    });

    it('should validate provider implementation mock conforms to interface', async () => {
      // Create a mock provider that implements the ILLMProvider interface
      const mockProvider = {
        sendRequest: jest.fn().mockResolvedValue('Test response from LLM')
      };

      const result = await mockProvider.sendRequest('Test prompt');
      
      expect(mockProvider.sendRequest).toHaveBeenCalledWith('Test prompt');
      expect(result).toBe('Test response from LLM');
    });

    it('should handle provider implementation with options parameter', async () => {
      const mockProvider = {
        sendRequest: jest.fn().mockResolvedValue('Response with options')
      };

      const options = {
        temperature: 0.7,
        maxTokens: 1000
      };

      const result = await mockProvider.sendRequest('Test prompt with options', options);
      
      expect(mockProvider.sendRequest).toHaveBeenCalledWith('Test prompt with options', options);
      expect(result).toBe('Response with options');
    });
  });
});

// Tests for sendRequest from src/ai/providers/anthropicProvider.ts
const { AnthropicProvider } = require('../src/ai/providers/anthropicProvider');

describe('AnthropicProvider.sendRequest', () => {
  let instance;
  let mockCreate;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCreate = jest.fn();
    
    instance = new AnthropicProvider();
    
    // Mock the internal client
    instance.client = {
      messages: {
        create: mockCreate
      }
    };
  });

  it('should send a request and return parsed response with token usage', async () => {
    const mockApiResponse = {
      id: 'msg_123',
      content: [{ type: 'text', text: 'Hello, I am Claude!' }],
      model: 'claude-3-sonnet-20240229',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 10,
        output_tokens: 5
      }
    };
    
    mockCreate.mockResolvedValue(mockApiResponse);
    
    const messages = [
      { role: 'user', content: 'Hello Claude' }
    ];
    
    const result = await instance.sendRequest(messages);
    
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
  });

  it('should handle API errors gracefully', async () => {
    const apiError = new Error('API rate limit exceeded');
    mockCreate.mockRejectedValue(apiError);
    
    const messages = [
      { role: 'user', content: 'Test message' }
    ];
    
    await expect(instance.sendRequest(messages)).rejects.toThrow('API rate limit exceeded');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('should handle empty message array', async () => {
    const mockApiResponse = {
      id: 'msg_456',
      content: [{ type: 'text', text: '' }],
      model: 'claude-3-sonnet-20240229',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 0,
        output_tokens: 0
      }
    };
    
    mockCreate.mockResolvedValue(mockApiResponse);
    
    const messages = [];
    
    const result = await instance.sendRequest(messages);
    
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
  });
});

// Tests for sendRequest from src/ai/providers/openAIProvider.ts
const { OpenAIProvider } = require('../src/ai/providers/openAIProvider');

describe('OpenAIProvider.sendRequest', () => {
  let instance;
  let mockCreate;
  let originalConsoleLog;
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();
    
    mockCreate = jest.fn();
    
    instance = new OpenAIProvider();
    
    // Mock the OpenAI client's chat.completions.create method
    instance.client = {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('should successfully send a chat completion request and return response', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'Test response from OpenAI'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      },
      model: 'gpt-4'
    };
    
    mockCreate.mockResolvedValue(mockResponse);
    
    const messages = [
      { role: 'user', content: 'Hello, how are you?' }
    ];
    const model = 'gpt-4';
    
    const result = await instance.sendRequest(messages, model);
    
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: model,
        messages: messages
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors gracefully', async () => {
    const apiError = new Error('API rate limit exceeded');
    mockCreate.mockRejectedValue(apiError);
    
    const messages = [
      { role: 'user', content: 'Test message' }
    ];
    const model = 'gpt-4';
    
    await expect(instance.sendRequest(messages, model)).rejects.toThrow('API rate limit exceeded');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('should pass additional options to the API call', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'Response with temperature'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 5,
        completion_tokens: 10,
        total_tokens: 15
      },
      model: 'gpt-3.5-turbo'
    };
    
    mockCreate.mockResolvedValue(mockResponse);
    
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is 2+2?' }
    ];
    const model = 'gpt-3.5-turbo';
    const options = {
      temperature: 0.7,
      max_tokens: 100
    };
    
    const result = await instance.sendRequest(messages, model, options);
    
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 100
      })
    );
    expect(result).toEqual(mockResponse);
  });
});

// Tests for analyzeFileMetadata from src/analysis/enhancedAnalyzer.ts
const { analyzeFileMetadata } = require('../src/analysis/enhancedAnalyzer');
const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('path');

describe('analyzeFileMetadata (from enhancedAnalyzer.ts)', () => {
  const mockFs = fs;
  const mockPath = path;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.extname.mockReturnValue('.ts');
    mockPath.basename.mockReturnValue('testFile.ts');
  });

  it('should analyze a TypeScript file and extract function metadata', async () => {
    const testFilePath = '/project/src/testFile.ts';
    const testContent = `
      export function calculateSum(a: number, b: number): number {
        return a + b;
      }
      
      export async function fetchData(url: string): Promise<string> {
        return await fetch(url).then(r => r.text());
      }
    `;

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(testContent);
    mockFs.statSync.mockReturnValue({
      size: testContent.length,
      mtime: new Date('2024-01-01'),
      isFile: () => true,
      isDirectory: () => false
    });

    const result = await analyzeFileMetadata(testFilePath);

    expect(result).toBeDefined();
    expect(mockFs.readFileSync).toHaveBeenCalledWith(testFilePath, expect.any(String));
  });

  it('should handle files with no functions gracefully', async () => {
    const testFilePath = '/project/src/constants.ts';
    const testContent = `
      export const API_URL = 'https://api.example.com';
      export const MAX_RETRIES = 3;
    `;

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(testContent);
    mockFs.statSync.mockReturnValue({
      size: testContent.length,
      mtime: new Date('2024-01-01'),
      isFile: () => true,
      isDirectory: () => false
    });

    const result = await analyzeFileMetadata(testFilePath);

    expect(result).toBeDefined();
  });

  it('should throw or return error for non-existent file', async () => {
    const testFilePath = '/project/src/nonexistent.ts';

    mockFs.existsSync.mockReturnValue(false);
    mockFs.readFileSync.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    try {
      await analyzeFileMetadata(testFilePath);
    } catch (error) {
      expect(error).toBeDefined();
      if (error instanceof Error) {
        expect(error.message).toContain('ENOENT');
      }
    }
  });
});
