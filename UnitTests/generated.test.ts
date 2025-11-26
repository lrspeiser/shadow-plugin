/**
 * Auto-generated unit tests
 * Generated: 2025-11-26T17:17:48.344Z
 */




// Tests for analyzeWorkspace from src/extension.ts
const { analyzeWorkspace } = require('../src/extension');
const vscode = require('vscode');
const { getConfigurationManager } = require('../src/extension');

jest.mock('vscode', () => ({
  window: {
    showWarningMessage: jest.fn()
  }
}));

jest.mock('../src/extension', () => {
  const actual = jest.requireActual('../src/extension');
  return {
    ...actual,
    getConfigurationManager: jest.fn()
  };
});

describe('analyzeWorkspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show warning message when Shadow Watch is disabled', () => {
    const mockConfigManager = { enabled: false };
    getConfigurationManager.mockReturnValue(mockConfigManager);

    analyzeWorkspace();

    expect(getConfigurationManager).toHaveBeenCalled();
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('Shadow Watch is disabled');
  });

  it('should not show warning message when Shadow Watch is enabled', () => {
    const mockConfigManager = { enabled: true };
    getConfigurationManager.mockReturnValue(mockConfigManager);

    analyzeWorkspace();

    expect(getConfigurationManager).toHaveBeenCalled();
    expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
  });

  it('should return early when configuration manager indicates disabled state', () => {
    const mockConfigManager = { enabled: false };
    getConfigurationManager.mockReturnValue(mockConfigManager);

    const result = analyzeWorkspace();

    expect(result).toBeUndefined();
    expect(getConfigurationManager).toHaveBeenCalledTimes(1);
  });
});

// Tests for canMakeRequest from src/ai/llmRateLimiter.ts
const { canMakeRequest } = require('../src/ai/llmRateLimiter');

describe('canMakeRequest', () => {
  let mockDate;
  let originalNow;

  beforeEach(() => {
    originalNow = Date.now;
    mockDate = jest.spyOn(Date, 'now');
  });

  afterEach(() => {
    mockDate.mockRestore();
  });

  it('should allow request when no previous requests exist', () => {
    mockDate.mockReturnValue(1000000);
    const result = canMakeRequest('openai');
    expect(result).toBe(true);
  });

  it('should deny request when rate limit is exceeded', () => {
    mockDate.mockReturnValue(1000000);
    canMakeRequest('openai');
    mockDate.mockReturnValue(1000100);
    const result = canMakeRequest('openai');
    expect(result).toBe(false);
  });

  it('should allow request after rate limit window has passed', () => {
    mockDate.mockReturnValue(1000000);
    canMakeRequest('anthropic');
    mockDate.mockReturnValue(1000000 + 61000);
    const result = canMakeRequest('anthropic');
    expect(result).toBe(true);
  });
});

// Tests for parseFileSummary from src/ai/llmResponseParser.ts
const { parseFileSummary } = require('../src/ai/llmResponseParser');

describe('parseFileSummary', () => {
  it('should parse valid JSON response', () => {
    const jsonResponse = JSON.stringify({ summary: 'This is a test summary' });
    const result = parseFileSummary(jsonResponse);
    expect(result).toBe('This is a test summary');
  });

  it('should extract summary from text when JSON parsing fails', () => {
    const textResponse = 'Some text before\nsummary: This is extracted summary\nSome text after';
    const result = parseFileSummary(textResponse);
    expect(result).toContain('This is extracted summary');
  });

  it('should handle empty or invalid input gracefully', () => {
    const emptyResponse = '';
    const result = parseFileSummary(emptyResponse);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});

// Tests for executeWithRetry from src/ai/llmRetryHandler.ts
const { executeWithRetry } = require('../src/ai/llmRetryHandler');

describe('executeWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully execute operation on first attempt', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    const result = await executeWithRetry(mockOperation, { maxRetries: 3, initialDelay: 100 });
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should retry operation on failure and eventually succeed', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockRejectedValueOnce(new Error('Another failure'))
      .mockResolvedValueOnce('success after retries');
    const result = await executeWithRetry(mockOperation, { maxRetries: 3, initialDelay: 10 });
    expect(result).toBe('success after retries');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('should throw error after exhausting all retries', async () => {
    const finalError = new Error('Permanent failure');
    const mockOperation = jest.fn().mockRejectedValue(finalError);
    await expect(executeWithRetry(mockOperation, { maxRetries: 2, initialDelay: 10 })).rejects.toThrow('Permanent failure');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });
});

// Tests for sendStructuredRequest from src/ai/providers/anthropicProvider.ts
const { sendStructuredRequest } = require('../src/ai/providers/anthropicProvider');

describe('sendStructuredRequest', () => {
  let mockFetch;
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('should successfully send a structured request and return parsed response', async () => {
    const mockResponseData = {
      content: [{
        type: 'text',
        text: JSON.stringify({ result: 'success', data: { value: 42 } })
      }]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
      status: 200,
      statusText: 'OK'
    });

    const schema = {
      type: 'object',
      properties: {
        result: { type: 'string' },
        data: { type: 'object' }
      }
    };

    const result = await sendStructuredRequest('test prompt', schema, 'test-api-key');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('anthropic.com'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'test-api-key',
          'anthropic-version': expect.any(String),
          'content-type': 'application/json'
        })
      })
    );
    expect(result).toEqual({ result: 'success', data: { value: 42 } });
  });

  it('should throw error when API request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'Invalid API key' })
    });

    const schema = { type: 'object' };

    await expect(sendStructuredRequest('test prompt', schema, 'invalid-key')).rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle malformed JSON response gracefully', async () => {
    const mockResponseData = {
      content: [{
        type: 'text',
        text: 'not valid json'
      }]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
      status: 200,
      statusText: 'OK'
    });

    const schema = { type: 'object' };

    await expect(sendStructuredRequest('test prompt', schema, 'test-api-key')).rejects.toThrow();
  });
});

// Tests for sendStructuredRequest from src/ai/providers/openAIProvider.ts
const { sendStructuredRequest: sendStructuredRequestOpenAI } = require('../src/ai/providers/openAIProvider');

describe('sendStructuredRequest', () => {
  let mockOpenAI;
  let mockBetaParse;
  let originalOpenAI;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBetaParse = jest.fn();
    mockOpenAI = {
      beta: {
        chat: {
          completions: {
            parse: mockBetaParse
          }
        }
      }
    };
    originalOpenAI = global.openAIClient;
    global.openAIClient = mockOpenAI;
  });

  afterEach(() => {
    global.openAIClient = originalOpenAI;
  });

  it('should successfully parse structured response from OpenAI', async () => {
    const mockSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name', 'age']
    };
    const mockResponse = {
      choices: [{
        message: {
          parsed: { name: 'John Doe', age: 30 }
        }
      }]
    };
    mockBetaParse.mockResolvedValue(mockResponse);

    const result = await sendStructuredRequestOpenAI('Test prompt', mockSchema, 'gpt-4o');

    expect(mockBetaParse).toHaveBeenCalledWith({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Test prompt' }],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'response_schema',
          schema: mockSchema,
          strict: true
        }
      }
    });
    expect(result).toEqual({ name: 'John Doe', age: 30 });
  });

  it('should handle API errors gracefully', async () => {
    const mockSchema = { type: 'object', properties: {} };
    const error = new Error('API Error: Rate limit exceeded');
    mockBetaParse.mockRejectedValue(error);

    await expect(sendStructuredRequestOpenAI('Test prompt', mockSchema, 'gpt-4o')).rejects.toThrow('API Error: Rate limit exceeded');
    expect(mockBetaParse).toHaveBeenCalledTimes(1);
  });

  it('should use default model when not specified', async () => {
    const mockSchema = { type: 'object', properties: { result: { type: 'string' } } };
    const mockResponse = {
      choices: [{
        message: {
          parsed: { result: 'success' }
        }
      }]
    };
    mockBetaParse.mockResolvedValue(mockResponse);

    const result = await sendStructuredRequestOpenAI('Test prompt', mockSchema);

    expect(mockBetaParse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.any(String),
        messages: [{ role: 'user', content: 'Test prompt' }]
      })
    );
    expect(result).toEqual({ result: 'success' });
  });
});

// Tests for analyzeWorkspace from src/analyzer.ts
const { analyzeWorkspace: analyzeWorkspaceAnalyzer } = require('../src/analyzer');
const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('path');

const mockFs = fs;
const mockPath = path;

describe('analyzeWorkspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should analyze a workspace with valid TypeScript files', () => {
    const workspacePath = '/test/workspace';
    const mockFiles = ['index.ts', 'utils.ts'];
    const mockStats1 = { isDirectory: () => false, isFile: () => true };
    const mockStats2 = { isDirectory: () => false, isFile: () => true };
    const mockContent1 = 'export function test() { return 42; }';
    const mockContent2 = 'export const util = () => true;';

    mockFs.readdirSync = jest.fn().mockReturnValue(mockFiles);
    mockFs.statSync = jest.fn().mockReturnValueOnce(mockStats1).mockReturnValueOnce(mockStats2);
    mockFs.readFileSync = jest.fn().mockReturnValueOnce(mockContent1).mockReturnValueOnce(mockContent2);
    mockPath.join = jest.fn((...args) => args.join('/'));
    mockPath.extname = jest.fn((file) => file.endsWith('.ts') ? '.ts' : '');

    const result = analyzeWorkspaceAnalyzer(workspacePath);

    expect(mockFs.readdirSync).toHaveBeenCalledWith(workspacePath);
    expect(result).toBeDefined();
  });

  it('should handle empty workspace directory', () => {
    const workspacePath = '/test/empty';
    const mockFiles = [];

    mockFs.readdirSync = jest.fn().mockReturnValue(mockFiles);
    mockPath.join = jest.fn((...args) => args.join('/'));

    const result = analyzeWorkspaceAnalyzer(workspacePath);

    expect(mockFs.readdirSync).toHaveBeenCalledWith(workspacePath);
    expect(result).toBeDefined();
  });

  it('should skip non-TypeScript files and directories', () => {
    const workspacePath = '/test/mixed';
    const mockFiles = ['test.ts', 'readme.md', 'node_modules'];
    const mockStatsFile = { isDirectory: () => false, isFile: () => true };
    const mockStatsDir = { isDirectory: () => true, isFile: () => false };
    const mockContent = 'export function main() {}';

    mockFs.readdirSync = jest.fn().mockReturnValue(mockFiles);
    mockFs.statSync = jest.fn().mockReturnValueOnce(mockStatsFile).mockReturnValueOnce(mockStatsFile).mockReturnValueOnce(mockStatsDir);
    mockFs.readFileSync = jest.fn().mockReturnValue(mockContent);
    mockPath.join = jest.fn((...args) => args.join('/'));
    mockPath.extname = jest.fn((file) => {
      if (file.endsWith('.ts')) return '.ts';
      if (file.endsWith('.md')) return '.md';
      return '';
    });

    const result = analyzeWorkspaceAnalyzer(workspacePath);

    expect(mockFs.readdirSync).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
