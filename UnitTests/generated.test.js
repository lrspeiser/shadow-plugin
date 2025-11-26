/**
 * Auto-generated unit tests
 * Generated: 2025-11-26T15:33:23.230Z
 */




// Tests for canMakeRequest from src/ai/llmRateLimiter.ts
const { canMakeRequest } = require('../src/ai/llmRateLimiter');

describe('canMakeRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when no rate limit has been set for the provider', () => {
    const result = canMakeRequest('openai');
    expect(result).toBe(true);
  });

  it('should return false when rate limit is exceeded for the provider', () => {
    const provider = 'anthropic';
    for (let i = 0; i < 10; i++) {
      canMakeRequest(provider);
    }
    const result = canMakeRequest(provider);
    expect(result).toBe(false);
  });

  it('should return true after rate limit window has passed', (done) => {
    const provider = 'testProvider';
    for (let i = 0; i < 10; i++) {
      canMakeRequest(provider);
    }
    expect(canMakeRequest(provider)).toBe(false);
    
    setTimeout(() => {
      const result = canMakeRequest(provider);
      expect(result).toBe(true);
      done();
    }, 61000);
  }, 65000);
});

// Tests for parseFileSummary from src/ai/llmResponseParser.ts
const { parseFileSummary } = require('../src/ai/llmResponseParser');

describe('parseFileSummary', () => {
  it('should parse valid LLM response with complete file summary', () => {
    const llmResponse = JSON.stringify({
      purpose: 'Handles user authentication and session management',
      actions: ['Validates user credentials', 'Creates session tokens', 'Manages logout'],
      functions: ['login', 'logout', 'validateToken'],
      dependencies: ['bcrypt', 'jsonwebtoken', './database']
    });
    
    const result = parseFileSummary(llmResponse);
    
    expect(result).toEqual({
      purpose: 'Handles user authentication and session management',
      actions: ['Validates user credentials', 'Creates session tokens', 'Manages logout'],
      functions: ['login', 'logout', 'validateToken'],
      dependencies: ['bcrypt', 'jsonwebtoken', './database']
    });
  });

  it('should handle LLM response with partial data', () => {
    const llmResponse = JSON.stringify({
      purpose: 'Configuration helper',
      functions: ['loadConfig']
    });
    
    const result = parseFileSummary(llmResponse);
    
    expect(result.purpose).toBe('Configuration helper');
    expect(result.functions).toEqual(['loadConfig']);
    expect(result.actions).toBeUndefined();
    expect(result.dependencies).toBeUndefined();
  });

  it('should throw error for invalid JSON response', () => {
    const invalidResponse = 'This is not valid JSON';
    
    expect(() => parseFileSummary(invalidResponse)).toThrow();
  });
});

// Tests for executeWithRetry from src/ai/llmRetryHandler.ts
const { executeWithRetry } = require('../src/ai/llmRetryHandler');

describe('executeWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute operation successfully on first attempt', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    const result = await executeWithRetry(mockOperation);
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should retry operation on retryable errors and eventually succeed', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('Rate limit exceeded'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValue('success after retries');
    const result = await executeWithRetry(mockOperation, { maxRetries: 3, initialDelay: 10 });
    expect(result).toBe('success after retries');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('should throw error after exceeding max retries', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
    await expect(executeWithRetry(mockOperation, { maxRetries: 2, initialDelay: 10 })).rejects.toThrow('Persistent failure');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });
});

// Tests for analyzeFileMetadata from src/analysis/enhancedAnalyzer.ts
const { analyzeFileMetadata } = require('../src/analysis/enhancedAnalyzer');
const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('path');

describe('analyzeFileMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should analyze TypeScript file and extract function metadata using AST', async () => {
    const mockFilePath = '/test/sample.ts';
    const mockFileContent = `
      function exampleFunction(param1: string, param2: number): boolean {
        return param1.length > param2;
      }
      
      export const arrowFunc = (x: number) => x * 2;
    `;
    
    fs.readFileSync.mockReturnValue(mockFileContent);
    path.extname.mockReturnValue('.ts');
    path.basename.mockReturnValue('sample.ts');
    
    const result = await analyzeFileMetadata(mockFilePath);
    
    expect(result).toBeDefined();
    expect(result.filePath).toBe(mockFilePath);
    expect(result.functions).toBeDefined();
    expect(Array.isArray(result.functions)).toBe(true);
    expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath, 'utf-8');
  });

  it('should use regex fallback for non-TypeScript/JavaScript files', async () => {
    const mockFilePath = '/test/sample.py';
    const mockFileContent = `
      def python_function(arg1, arg2):
        return arg1 + arg2
    `;
    
    fs.readFileSync.mockReturnValue(mockFileContent);
    path.extname.mockReturnValue('.py');
    path.basename.mockReturnValue('sample.py');
    
    const result = await analyzeFileMetadata(mockFilePath);
    
    expect(result).toBeDefined();
    expect(result.filePath).toBe(mockFilePath);
    expect(result.functions).toBeDefined();
    expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath, 'utf-8');
  });

  it('should handle file read errors gracefully', async () => {
    const mockFilePath = '/test/nonexistent.ts';
    
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });
    path.extname.mockReturnValue('.ts');
    
    await expect(analyzeFileMetadata(mockFilePath)).rejects.toThrow();
    expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath, 'utf-8');
  });
});

// Tests for get from src/cache.ts
const { get } = require('../src/cache');

describe('get', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cached data when file exists and is valid (within 24 hours)', () => {
    const mockWorkspace = '/test/workspace';
    const mockCachePath = '/cache/path/cache.json';
    const mockData = { analysis: 'data', files: ['file1.ts'] };
    const currentTime = Date.now();
    const mockCacheContent = JSON.stringify({ timestamp: currentTime - 1000 * 60 * 60, data: mockData });

    path.join.mockReturnValue(mockCachePath);
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(mockCacheContent);
    jest.spyOn(Date, 'now').mockReturnValue(currentTime);

    const result = get(mockWorkspace);

    expect(result).toEqual(mockData);
    expect(fs.existsSync).toHaveBeenCalledWith(mockCachePath);
    expect(fs.readFileSync).toHaveBeenCalledWith(mockCachePath, 'utf-8');
  });

  it('should return null when cache file does not exist', () => {
    const mockWorkspace = '/test/workspace';
    const mockCachePath = '/cache/path/cache.json';

    path.join.mockReturnValue(mockCachePath);
    fs.existsSync.mockReturnValue(false);

    const result = get(mockWorkspace);

    expect(result).toBeNull();
    expect(fs.existsSync).toHaveBeenCalledWith(mockCachePath);
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  it('should return null when cache is expired (older than 24 hours)', () => {
    const mockWorkspace = '/test/workspace';
    const mockCachePath = '/cache/path/cache.json';
    const mockData = { analysis: 'data', files: ['file1.ts'] };
    const currentTime = Date.now();
    const expiredTimestamp = currentTime - 1000 * 60 * 60 * 25;
    const mockCacheContent = JSON.stringify({ timestamp: expiredTimestamp, data: mockData });

    path.join.mockReturnValue(mockCachePath);
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(mockCacheContent);
    jest.spyOn(Date, 'now').mockReturnValue(currentTime);

    const result = get(mockWorkspace);

    expect(result).toBeNull();
    expect(fs.existsSync).toHaveBeenCalledWith(mockCachePath);
    expect(fs.readFileSync).toHaveBeenCalledWith(mockCachePath, 'utf-8');
  });
});
