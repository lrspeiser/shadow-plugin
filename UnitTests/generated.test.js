/**
 * Auto-generated unit tests
 * Generated: 2025-11-26T15:58:12.094Z
 */




// Tests for canMakeRequest from src/ai/llmRateLimiter.ts
const { canMakeRequest } = require('../src/ai/llmRateLimiter'); describe('canMakeRequest', () => { beforeEach(() => { jest.clearAllMocks(); }); test('should return true when no previous requests exist for provider', () => { const result = canMakeRequest('openai'); expect(result).toBe(true); }); test('should return false when rate limit is exceeded for provider', () => { canMakeRequest('anthropic'); canMakeRequest('anthropic'); canMakeRequest('anthropic'); canMakeRequest('anthropic'); canMakeRequest('anthropic'); const result = canMakeRequest('anthropic'); expect(result).toBe(false); }); test('should return true for different providers independently', () => { canMakeRequest('openai'); canMakeRequest('openai'); canMakeRequest('openai'); const result = canMakeRequest('anthropic'); expect(result).toBe(true); }); });

// Tests for parseFileSummary from src/ai/llmResponseParser.ts
const { parseFileSummary } = require('../src/ai/llmResponseParser');

describe('parseFileSummary', () => {
  it('should parse valid JSON response', () => {
    const jsonResponse = JSON.stringify({
      summary: 'This is a test summary',
      keyPoints: ['Point 1', 'Point 2']
    });
    const result = parseFileSummary(jsonResponse);
    expect(result).toEqual({
      summary: 'This is a test summary',
      keyPoints: ['Point 1', 'Point 2']
    });
  });

  it('should extract summary from text when JSON parsing fails', () => {
    const textResponse = 'Here is some text with a summary: This is the extracted summary. And more text.';
    const result = parseFileSummary(textResponse);
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('should handle empty or invalid input gracefully', () => {
    const emptyResponse = '';
    const result = parseFileSummary(emptyResponse);
    expect(result).toBeDefined();
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

  it('should execute operation successfully on first attempt', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    const result = await executeWithRetry(mockOperation);
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should retry operation on failure and eventually succeed', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValueOnce('success');
    const promise = executeWithRetry(mockOperation, { maxRetries: 3, initialDelay: 100 });
    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max retries exceeded', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
    const promise = executeWithRetry(mockOperation, { maxRetries: 2, initialDelay: 100 });
    await jest.runAllTimersAsync();
    await expect(promise).rejects.toThrow('Persistent failure');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });
});

// Tests for analyzeTypeScriptFunction from src/analysis/enhancedAnalyzer.ts
const { analyzeTypeScriptFunction: analyzeTypeScriptFunctionEnhanced } = require('../src/analysis/enhancedAnalyzer');

describe('analyzeTypeScriptFunction from enhancedAnalyzer', () => {
  it('should analyze a simple TypeScript function and extract metadata', () => {
    const sourceCode = `
      function calculateSum(a: number, b: number): number {
        return a + b;
      }
    `;
    
    const result = analyzeTypeScriptFunctionEnhanced(sourceCode, 'calculateSum');
    
    expect(result).toBeDefined();
    expect(result.name).toBe('calculateSum');
    expect(result.parameters).toHaveLength(2);
    expect(result.parameters[0]).toMatchObject({ name: 'a', type: 'number' });
    expect(result.parameters[1]).toMatchObject({ name: 'b', type: 'number' });
    expect(result.returnType).toBe('number');
  });

  it('should handle arrow functions with complex types', () => {
    const sourceCode = `
      const processUser = (user: { id: string; name: string }, options?: { verbose: boolean }): Promise<void> => {
        console.log(user.name);
      };
    `;
    
    const result = analyzeTypeScriptFunctionEnhanced(sourceCode, 'processUser');
    
    expect(result).toBeDefined();
    expect(result.name).toBe('processUser');
    expect(result.parameters).toHaveLength(2);
    expect(result.parameters[0].name).toBe('user');
    expect(result.parameters[1].name).toBe('options');
    expect(result.returnType).toContain('Promise');
  });

  it('should return null or throw error for invalid or missing function', () => {
    const sourceCode = `
      const notAFunction = 42;
    `;
    
    const result = analyzeTypeScriptFunctionEnhanced(sourceCode, 'nonExistentFunction');
    
    expect(result).toBeNull();
  });
});

// Tests for analyzeTypeScriptFunction from src/analysis/functionAnalyzer.ts
const { analyzeTypeScriptFunction: analyzeTypeScriptFunctionAnalyzer } = require('../src/analysis/functionAnalyzer');

describe('analyzeTypeScriptFunction from functionAnalyzer', () => {
  it('should analyze a simple TypeScript function with parameters and return type', () => {
    const sourceCode = `
      function calculateSum(a: number, b: number): number {
        return a + b;
      }
    `;
    const functionName = 'calculateSum';
    
    const result = analyzeTypeScriptFunctionAnalyzer(sourceCode, functionName);
    
    expect(result).toBeDefined();
    expect(result.name).toBe('calculateSum');
    expect(result.parameters).toHaveLength(2);
    expect(result.parameters[0]).toEqual({ name: 'a', type: 'number' });
    expect(result.parameters[1]).toEqual({ name: 'b', type: 'number' });
    expect(result.returnType).toBe('number');
  });

  it('should handle function with dependencies on other functions', () => {
    const sourceCode = `
      function helper(x: string): string {
        return x.toUpperCase();
      }
      
      function processData(input: string): string {
        const result = helper(input);
        return result;
      }
    `;
    const functionName = 'processData';
    
    const result = analyzeTypeScriptFunctionAnalyzer(sourceCode, functionName);
    
    expect(result).toBeDefined();
    expect(result.name).toBe('processData');
    expect(result.dependencies).toBeDefined();
    expect(result.dependencies).toContain('helper');
  });

  it('should return null or handle gracefully when function is not found', () => {
    const sourceCode = `
      function existingFunction(): void {
        console.log('test');
      }
    `;
    const functionName = 'nonExistentFunction';
    
    const result = analyzeTypeScriptFunctionAnalyzer(sourceCode, functionName);
    
    expect(result).toBeNull();
  });
});

// Tests for analyzeDependencies from src/analyzer.ts
const { analyzeDependencies } = require('../src/analyzer');

describe('analyzeDependencies', () => {
  it('should identify imported files and orphaned files correctly', () => {
    const files = [
      { path: 'src/index.ts', imports: ['src/utils.ts', 'src/helpers.ts'] },
      { path: 'src/utils.ts', imports: ['src/helpers.ts'] },
      { path: 'src/helpers.ts', imports: [] },
      { path: 'src/orphan.ts', imports: [] }
    ];
    const result = analyzeDependencies(files);
    expect(result.imported).toContain('src/utils.ts');
    expect(result.imported).toContain('src/helpers.ts');
    expect(result.orphaned).toContain('src/orphan.ts');
    expect(result.orphaned).not.toContain('src/index.ts');
  });

  it('should handle empty file list', () => {
    const files = [];
    const result = analyzeDependencies(files);
    expect(result.imported).toEqual([]);
    expect(result.orphaned).toEqual([]);
  });

  it('should handle circular dependencies', () => {
    const files = [
      { path: 'src/a.ts', imports: ['src/b.ts'] },
      { path: 'src/b.ts', imports: ['src/a.ts'] },
      { path: 'src/c.ts', imports: [] }
    ];
    const result = analyzeDependencies(files);
    expect(result.imported).toContain('src/a.ts');
    expect(result.imported).toContain('src/b.ts');
    expect(result.orphaned).toContain('src/c.ts');
  });
});
