/**
 * Auto-generated unit tests
 * Generated: 2025-11-26T17:33:46.084Z
 */




// Tests for parseFileSummary from src/ai/llmResponseParser.ts
const { parseFileSummary } = require('../src/ai/llmResponseParser');

describe('parseFileSummary', () => {
  it('should parse valid JSON response with summary object', () => {
    const jsonResponse: string = JSON.stringify({ summary: 'This is a file summary' });
    const result: string = parseFileSummary(jsonResponse);
    expect(result).toBe('This is a file summary');
  });

  it('should extract summary from text when JSON parsing fails', () => {
    const textResponse: string = 'Some preamble text\n\nSummary: This file contains utility functions\n\nMore text after';
    const result: string = parseFileSummary(textResponse);
    expect(result).toContain('This file contains utility functions');
  });

  it('should handle malformed input and return fallback', () => {
    const malformedResponse: string = 'No summary pattern here at all';
    const result: string = parseFileSummary(malformedResponse);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle empty string input', () => {
    const emptyResponse: string = '';
    const result: string = parseFileSummary(emptyResponse);
    expect(typeof result).toBe('string');
  });
});

// Tests for executeWithRetry from src/ai/llmRetryHandler.ts
const { executeWithRetry } = require('../src/ai/llmRetryHandler');

describe('executeWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully execute operation on first try', async () => {
    const mockOperation = jest.fn<Promise<string>, []>().mockResolvedValue('success');
    const result: string = await executeWithRetry(mockOperation);
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should retry operation on failure and eventually succeed', async () => {
    const mockOperation = jest.fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValueOnce('success');
    const result: string = await executeWithRetry(mockOperation, { maxRetries: 3, initialDelay: 10 });
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('should throw error after exhausting all retries', async () => {
    const mockError: Error = new Error('Persistent failure');
    const mockOperation = jest.fn<Promise<string>, []>().mockRejectedValue(mockError);
    await expect(executeWithRetry(mockOperation, { maxRetries: 2, initialDelay: 10 })).rejects.toThrow('Persistent failure');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });
});

// Tests for sendRequest from src/ai/providers/anthropicProvider.ts
const { sendRequest } = require('../src/ai/providers/anthropicProvider');

describe('sendRequest', () => {
  let mockAnthropicCreate: jest.Mock<any, any>;
  let originalAnthropic: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnthropicCreate = jest.fn();
    originalAnthropic = (global as any).Anthropic;
    (global as any).Anthropic = jest.fn().mockImplementation(() => ({
      messages: {
        create: mockAnthropicCreate
      }
    }));
  });

  afterEach(() => {
    (global as any).Anthropic = originalAnthropic;
  });

  it('should successfully send a request and return formatted response with token usage', async () => {
    const mockResponse: any = {
      id: 'msg_123',
      content: [{ type: 'text', text: 'Hello, how can I help you?' }],
      usage: {
        input_tokens: 10,
        output_tokens: 8
      },
      stop_reason: 'end_turn'
    };
    mockAnthropicCreate.mockResolvedValue(mockResponse);

    const messages: Array<{ role: string; content: string }> = [
      { role: 'user', content: 'Hello' }
    ];
    const result: any = await sendRequest('claude-3-sonnet-20240229', messages, {}, 'test-api-key');

    expect(result).toEqual({
      content: 'Hello, how can I help you?',
      tokensUsed: { input: 10, output: 8, total: 18 },
      stopReason: 'end_turn'
    });
    expect(mockAnthropicCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-3-sonnet-20240229',
        messages: messages
      })
    );
  });

  it('should handle system messages by converting to system parameter', async () => {
    const mockResponse: any = {
      id: 'msg_456',
      content: [{ type: 'text', text: 'Response with system context' }],
      usage: {
        input_tokens: 25,
        output_tokens: 15
      },
      stop_reason: 'end_turn'
    };
    mockAnthropicCreate.mockResolvedValue(mockResponse);

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Help me' }
    ];
    const result: any = await sendRequest('claude-3-opus-20240229', messages, {}, 'test-api-key');

    expect(result.content).toBe('Response with system context');
    expect(mockAnthropicCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Help me' }]
      })
    );
  });

  it('should handle API errors and throw appropriate error', async () => {
    const apiError: Error = new Error('API rate limit exceeded');
    mockAnthropicCreate.mockRejectedValue(apiError);

    const messages: Array<{ role: string; content: string }> = [
      { role: 'user', content: 'Test message' }
    ];

    await expect(sendRequest('claude-3-sonnet-20240229', messages, {}, 'test-api-key')).rejects.toThrow('API rate limit exceeded');
    expect(mockAnthropicCreate).toHaveBeenCalled();
  });
});

// Tests for sendRequest from src/ai/providers/openAIProvider.ts
const { sendRequest } = require('../src/ai/providers/openAIProvider');

describe('sendRequest', () => {
  let mockOpenAICreate: jest.Mock<Promise<any>, any[]>;
  let mockLogger: { log: jest.Mock<void, [string]>; error: jest.Mock<void, [string, any?]> };
  let originalOpenAI: any;
  let originalLogger: any;

  beforeEach(() => {
    mockOpenAICreate = jest.fn<Promise<any>, any[]>();
    mockLogger = {
      log: jest.fn<void, [string]>(),
      error: jest.fn<void, [string, any?]>()
    };

    const mockOpenAIInstance: any = {
      chat: {
        completions: {
          create: mockOpenAICreate
        }
      }
    };

    jest.mock('openai', () => {
      return {
        __esModule: true,
        default: jest.fn(() => mockOpenAIInstance)
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully send a request and return response with token tracking', async () => {
    const mockResponse: any = {
      choices: [{ message: { content: 'Test response' } }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
    };
    mockOpenAICreate.mockResolvedValue(mockResponse);

    const messages: Array<{ role: string; content: string }> = [
      { role: 'user', content: 'Test message' }
    ];
    const options: { model: string; temperature: number } = {
      model: 'gpt-4',
      temperature: 0.7
    };

    const result: any = await sendRequest(messages, options);

    expect(mockOpenAICreate).toHaveBeenCalledWith(expect.objectContaining({
      messages,
      model: options.model,
      temperature: options.temperature
    }));
    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors and throw appropriate error', async () => {
    const mockError: Error = new Error('API rate limit exceeded');
    mockOpenAICreate.mockRejectedValue(mockError);

    const messages: Array<{ role: string; content: string }> = [
      { role: 'user', content: 'Test message' }
    ];
    const options: { model: string } = { model: 'gpt-4' };

    await expect(sendRequest(messages, options)).rejects.toThrow('API rate limit exceeded');
  });

  it('should handle empty messages array', async () => {
    const mockResponse: any = {
      choices: [{ message: { content: 'Empty response' } }],
      usage: { prompt_tokens: 0, completion_tokens: 5, total_tokens: 5 }
    };
    mockOpenAICreate.mockResolvedValue(mockResponse);

    const messages: Array<{ role: string; content: string }> = [];
    const options: { model: string } = { model: 'gpt-3.5-turbo' };

    const result: any = await sendRequest(messages, options);

    expect(mockOpenAICreate).toHaveBeenCalledWith(expect.objectContaining({
      messages,
      model: options.model
    }));
    expect(result).toEqual(mockResponse);
  });
});

// Tests for analyzeFileMetadata from src/analysis/enhancedAnalyzer.ts
const { analyzeFileMetadata } = require('../src/analysis/enhancedAnalyzer'); const fs = require('fs'); const path = require('path'); describe('analyzeFileMetadata', () => { let mockReadFileSync: jest.Mock<string, [fs.PathOrFileDescriptor, BufferEncoding]>; let originalReadFileSync: typeof fs.readFileSync; beforeEach(() => { originalReadFileSync = fs.readFileSync; mockReadFileSync = jest.fn<string, [fs.PathOrFileDescriptor, BufferEncoding]>(); fs.readFileSync = mockReadFileSync; }); afterEach(() => { fs.readFileSync = originalReadFileSync; jest.restoreAllMocks(); }); test('should analyze a TypeScript file with a simple function', () => { const filePath: string = '/test/sample.ts'; const fileContent: string = 'function add(a: number, b: number): number { return a + b; }'; mockReadFileSync.mockReturnValue(fileContent); const result: unknown = analyzeFileMetadata(filePath); expect(mockReadFileSync).toHaveBeenCalledWith(filePath, 'utf-8'); expect(result).toBeDefined(); expect(typeof result).toBe('object'); expect(result).toHaveProperty('functions'); const resultObj: { functions?: unknown[] } = result as { functions?: unknown[] }; expect(Array.isArray(resultObj.functions)).toBe(true); if (resultObj.functions && resultObj.functions.length > 0) { const firstFunc: unknown = resultObj.functions[0]; expect(firstFunc).toHaveProperty('name'); const funcWithName: { name?: string } = firstFunc as { name?: string }; expect(funcWithName.name).toBe('add'); } }); test('should handle files with no functions', () => { const filePath: string = '/test/empty.ts'; const fileContent: string = 'const x: number = 5;'; mockReadFileSync.mockReturnValue(fileContent); const result: unknown = analyzeFileMetadata(filePath); expect(result).toBeDefined(); expect(typeof result).toBe('object'); expect(result).toHaveProperty('functions'); const resultObj: { functions?: unknown[] } = result as { functions?: unknown[] }; expect(Array.isArray(resultObj.functions)).toBe(true); expect(resultObj.functions?.length || 0).toBe(0); }); test('should handle file read errors gracefully', () => { const filePath: string = '/test/nonexistent.ts'; mockReadFileSync.mockImplementation(() => { throw new Error('File not found'); }); expect(() => analyzeFileMetadata(filePath)).toThrow('File not found'); }); });
