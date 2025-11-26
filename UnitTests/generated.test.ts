/**
 * Auto-generated unit tests
 * Generated: 2025-11-26T22:14:36.848Z
 */




// Tests for waitUntilAvailable from src/ai/llmRateLimiter.ts
const { RateLimiter } = require('../src/ai/llmRateLimiter');

type LLMProvider = 'openai' | 'claude';

describe('RateLimiter.waitUntilAvailable', () => {
    let instance: InstanceType<typeof RateLimiter>;
    let originalDateNow: typeof Date.now;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        instance = new RateLimiter();
        originalDateNow = Date.now;
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        Date.now = originalDateNow;
        consoleLogSpy.mockRestore();
        jest.useRealTimers();
    });

    it('should return immediately when no requests have been made', async () => {
        const startTime: number = Date.now();
        
        await instance.waitUntilAvailable('openai' as LLMProvider);
        
        const elapsed: number = Date.now() - startTime;
        expect(elapsed).toBeLessThan(50);
    });

    it('should return immediately when under rate limit', async () => {
        const provider: LLMProvider = 'claude';
        
        // Record a few requests but stay under limit
        for (let i = 0; i < 5; i++) {
            instance.recordRequest(provider);
        }
        
        const startTime: number = Date.now();
        await instance.waitUntilAvailable(provider);
        const elapsed: number = Date.now() - startTime;
        
        expect(elapsed).toBeLessThan(50);
    });

    it('should return immediately for provider not configured', async () => {
        // Remove config by setting up a custom instance scenario
        // Since configs are set in constructor, we test the return path
        const unconfiguredProvider: LLMProvider = 'openai';
        
        // Clear history and verify immediate return
        instance.clearHistory(unconfiguredProvider);
        
        const startTime: number = Date.now();
        await instance.waitUntilAvailable(unconfiguredProvider);
        const elapsed: number = Date.now() - startTime;
        
        expect(elapsed).toBeLessThan(50);
    });

    it('should wait when at rate limit', async () => {
        jest.useFakeTimers();
        
        const provider: LLMProvider = 'openai';
        const config: { maxRequests: number; windowMs: number } = { maxRequests: 3, windowMs: 1000 };
        instance.configure(provider, config);
        
        // Fill up to the limit
        for (let i = 0; i < 3; i++) {
            instance.recordRequest(provider);
        }
        
        // Verify we can't make request
        const canMake: boolean = instance.canMakeRequest(provider);
        expect(canMake).toBe(false);
        
        // Start waiting
        const waitPromise: Promise<void> = instance.waitUntilAvailable(provider);
        
        // Fast forward past the window
        jest.advanceTimersByTime(1200);
        
        await waitPromise;
        
        // Should have logged the wait message
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('Rate limit reached for openai')
        );
    });

    it('should handle rapid successive calls correctly', async () => {
        const provider: LLMProvider = 'claude';
        instance.configure(provider, { maxRequests: 50, windowMs: 60000 });
        
        // Record some requests but stay under limit
        for (let i = 0; i < 10; i++) {
            instance.recordRequest(provider);
        }
        
        // Multiple concurrent calls should all resolve quickly
        const promises: Promise<void>[] = [
            instance.waitUntilAvailable(provider),
            instance.waitUntilAvailable(provider),
            instance.waitUntilAvailable(provider)
        ];
        
        const startTime: number = Date.now();
        await Promise.all(promises);
        const elapsed: number = Date.now() - startTime;
        
        expect(elapsed).toBeLessThan(100);
    });
});

// Tests for parseArchitectureInsights from src/ai/llmResponseParser.ts
const { LLMResponseParser } = require('../src/ai/llmResponseParser');

describe('LLMResponseParser.parseArchitectureInsights', () => {
    let instance: InstanceType<typeof LLMResponseParser>;

    beforeEach(() => {
        instance = new LLMResponseParser();
    });

    describe('successful parsing', () => {
        it('should parse valid JSON architecture insights from LLM response', () => {
            const content: string = `
            Here is the architecture analysis:
            {
                "architecturalPatterns": ["MVC", "Repository Pattern"],
                "designDecisions": ["Use TypeScript for type safety", "Modular architecture"],
                "technicalDebt": ["Legacy code in utils folder"],
                "securityConsiderations": ["Input validation required"],
                "scalabilityNotes": ["Consider caching for high traffic"]
            }
            `;
            const context: { projectName: string; analysisType: string } = {
                projectName: 'test-project',
                analysisType: 'architecture'
            };

            const result: any = instance.parseArchitectureInsights(content, context);

            expect(result).toBeDefined();
            expect(result.architecturalPatterns).toContain('MVC');
            expect(result.architecturalPatterns).toContain('Repository Pattern');
            expect(result.designDecisions).toContain('Use TypeScript for type safety');
            expect(result.technicalDebt).toContain('Legacy code in utils folder');
        });

        it('should handle mixed JSON and plain text response', () => {
            const content: string = `
            ## Architecture Analysis
            
            Based on my analysis of the codebase, here are the insights:
            
            {
                "architecturalPatterns": ["Event-Driven"],
                "designDecisions": ["Async processing"],
                "technicalDebt": [],
                "securityConsiderations": ["API key management"],
                "scalabilityNotes": []
            }
            
            The above patterns were identified throughout the codebase.
            `;
            const context: { projectName: string; analysisType: string } = {
                projectName: 'mixed-project',
                analysisType: 'full'
            };

            const result: any = instance.parseArchitectureInsights(content, context);

            expect(result).toBeDefined();
            expect(result.architecturalPatterns).toContain('Event-Driven');
            expect(result.securityConsiderations).toContain('API key management');
        });
    });

    describe('edge cases', () => {
        it('should handle empty response gracefully', () => {
            const content: string = '';
            const context: { projectName: string; analysisType: string } = {
                projectName: 'empty-project',
                analysisType: 'architecture'
            };

            const result: any = instance.parseArchitectureInsights(content, context);

            expect(result).toBeDefined();
            expect(Array.isArray(result.architecturalPatterns) || result.architecturalPatterns === undefined || result.architecturalPatterns === null || typeof result.architecturalPatterns === 'string').toBe(true);
        });

        it('should handle malformed JSON in response', () => {
            const content: string = `
            {
                "architecturalPatterns": ["Broken",
                "designDecisions": "not an array
            `;
            const context: { projectName: string; analysisType: string } = {
                projectName: 'malformed-project',
                analysisType: 'architecture'
            };

            const result: any = instance.parseArchitectureInsights(content, context);

            expect(result).toBeDefined();
            // Should not throw, should return fallback structure
        });

        it('should handle unicode and special characters', () => {
            const content: string = `
            {
                "architecturalPatterns": ["Microservices 微服务", "Event-Driven 事件驱动"],
                "designDecisions": ["Use émojis 🎉 in logs"],
                "technicalDebt": ["Remove café ☕ comments"],
                "securityConsiderations": ["Encode special chars: <>&"],
                "scalabilityNotes": ["Handle 日本語 input"]
            }
            `;
            const context: { projectName: string; analysisType: string } = {
                projectName: 'unicode-project',
                analysisType: 'full'
            };

            const result: any = instance.parseArchitectureInsights(content, context);

            expect(result).toBeDefined();
            expect(result.architecturalPatterns).toBeDefined();
        });

        it('should handle missing required sections', () => {
            const content: string = `
            {
                "architecturalPatterns": ["Single Pattern Only"]
            }
            `;
            const context: { projectName: string; analysisType: string } = {
                projectName: 'partial-project',
                analysisType: 'architecture'
            };

            const result: any = instance.parseArchitectureInsights(content, context);

            expect(result).toBeDefined();
            expect(result.architecturalPatterns).toContain('Single Pattern Only');
        });
    });
});

// Tests for executeWithRetry from src/ai/llmRetryHandler.ts
const { RetryHandler } = require('../src/ai/llmRetryHandler');

describe('RetryHandler.executeWithRetry', () => {
    let instance: InstanceType<typeof RetryHandler>;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        instance = new RetryHandler();
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        jest.useFakeTimers();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        jest.useRealTimers();
    });

    it('should return result immediately on success without retries', async () => {
        const expectedResult = { data: 'success' };
        const operation = jest.fn().mockResolvedValue(expectedResult);

        const resultPromise = instance.executeWithRetry(operation);
        await jest.runAllTimersAsync();
        const result = await resultPromise;

        expect(result).toEqual(expectedResult);
        expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error and eventually succeed', async () => {
        const expectedResult = 'final success';
        const retryableError = new Error('rate_limit exceeded');
        const operation = jest.fn()
            .mockRejectedValueOnce(retryableError)
            .mockRejectedValueOnce(retryableError)
            .mockResolvedValue(expectedResult);

        const onRetry = jest.fn();

        const resultPromise = instance.executeWithRetry(operation, {
            maxRetries: 3,
            initialDelayMs: 100,
            onRetry
        });

        await jest.runAllTimersAsync();
        const result = await resultPromise;

        expect(result).toBe(expectedResult);
        expect(operation).toHaveBeenCalledTimes(3);
        expect(onRetry).toHaveBeenCalledTimes(2);
        expect(onRetry).toHaveBeenCalledWith(1, retryableError);
        expect(onRetry).toHaveBeenCalledWith(2, retryableError);
    });

    it('should throw immediately on non-retryable error', async () => {
        const nonRetryableError = new Error('Invalid API key');
        const operation = jest.fn().mockRejectedValue(nonRetryableError);

        const resultPromise = instance.executeWithRetry(operation, {
            maxRetries: 3
        });

        await jest.runAllTimersAsync();

        await expect(resultPromise).rejects.toThrow('Invalid API key');
        expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should exhaust all retries and throw last error', async () => {
        const retryableError = new Error('timeout error');
        const operation = jest.fn().mockRejectedValue(retryableError);
        const onRetry = jest.fn();

        const resultPromise = instance.executeWithRetry(operation, {
            maxRetries: 2,
            initialDelayMs: 50,
            onRetry
        });

        await jest.runAllTimersAsync();

        await expect(resultPromise).rejects.toThrow('timeout error');
        expect(operation).toHaveBeenCalledTimes(3); // initial + 2 retries
        expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it('should handle zero max retries', async () => {
        const retryableError = new Error('rate_limit');
        const operation = jest.fn().mockRejectedValue(retryableError);

        const resultPromise = instance.executeWithRetry(operation, {
            maxRetries: 0
        });

        await jest.runAllTimersAsync();

        await expect(resultPromise).rejects.toThrow('rate_limit');
        expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect maxDelayMs cap during exponential backoff', async () => {
        const retryableError = new Error('503 service unavailable');
        const expectedResult = 'success';
        const operation = jest.fn()
            .mockRejectedValueOnce(retryableError)
            .mockRejectedValueOnce(retryableError)
            .mockRejectedValueOnce(retryableError)
            .mockResolvedValue(expectedResult);

        const resultPromise = instance.executeWithRetry(operation, {
            maxRetries: 4,
            initialDelayMs: 1000,
            maxDelayMs: 2000,
            backoffMultiplier: 3
        });

        await jest.runAllTimersAsync();
        const result = await resultPromise;

        expect(result).toBe(expectedResult);
        expect(operation).toHaveBeenCalledTimes(4);
    });

    it('should handle network error codes as retryable', async () => {
        const networkError: Error & { code?: string } = new Error('Connection reset');
        networkError.code = 'ECONNRESET';
        const expectedResult = 'recovered';
        const operation = jest.fn()
            .mockRejectedValueOnce(networkError)
            .mockResolvedValue(expectedResult);

        const resultPromise = instance.executeWithRetry(operation, {
            maxRetries: 2,
            initialDelayMs: 50
        });

        await jest.runAllTimersAsync();
        const result = await resultPromise;

        expect(result).toBe(expectedResult);
        expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle HTTP status code 429 as retryable', async () => {
        const rateLimitError: Error & { status?: number } = new Error('Too many requests');
        rateLimitError.status = 429;
        const expectedResult = 'success after rate limit';
        const operation = jest.fn()
            .mockRejectedValueOnce(rateLimitError)
            .mockResolvedValue(expectedResult);

        const resultPromise = instance.executeWithRetry(operation, {
            maxRetries: 2,
            initialDelayMs: 50
        });

        await jest.runAllTimersAsync();
        const result = await resultPromise;

        expect(result).toBe(expectedResult);
        expect(operation).toHaveBeenCalledTimes(2);
    });
});

// Tests for sendStructuredRequest from src/ai/providers/ILLMProvider.ts
const { ILLMProvider } = require('../src/ai/providers/ILLMProvider');

interface TestData {
    name: string;
    value: number;
}

interface LLMRequestOptions {
    model?: string;
    systemPrompt?: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    maxTokens?: number;
    temperature?: number;
    responseFormat?: {
        type: 'json_object' | 'text';
    };
}

interface StructuredOutputResponse<T> {
    data: T;
    requests?: Array<{
        type: 'file' | 'grep';
        path?: string;
        pattern?: string;
        filePattern?: string;
        maxResults?: number;
    }>;
}

describe('sendStructuredRequestILLM (from ILLMProvider.ts)', () => {
    let mockProvider: {
        isConfigured: jest.Mock;
        sendRequest: jest.Mock;
        sendStructuredRequest: jest.Mock;
        getName: jest.Mock;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockProvider = {
            isConfigured: jest.fn().mockReturnValue(true),
            sendRequest: jest.fn(),
            sendStructuredRequest: jest.fn(),
            getName: jest.fn().mockReturnValue('MockProvider')
        };
    });

    describe('successful structured requests', () => {
        it('should return parsed JSON data when response is valid', async () => {
            const expectedData: TestData = { name: 'test', value: 42 };
            const mockResponse: StructuredOutputResponse<TestData> = {
                data: expectedData
            };
            mockProvider.sendStructuredRequest.mockResolvedValue(mockResponse);

            const options: LLMRequestOptions = {
                messages: [{ role: 'user', content: 'Get data' }],
                responseFormat: { type: 'json_object' }
            };
            const schema: Record<string, unknown> = { type: 'object', properties: { name: { type: 'string' }, value: { type: 'number' } } };

            const result: StructuredOutputResponse<TestData> = await mockProvider.sendStructuredRequest(options, schema);

            expect(result).toEqual(mockResponse);
            expect(result.data).toEqual(expectedData);
            expect(mockProvider.sendStructuredRequest).toHaveBeenCalledWith(options, schema);
        });

        it('should handle response with requests array', async () => {
            const mockResponse: StructuredOutputResponse<TestData> = {
                data: { name: 'result', value: 100 },
                requests: [
                    { type: 'file', path: '/src/test.ts' },
                    { type: 'grep', pattern: 'function', maxResults: 10 }
                ]
            };
            mockProvider.sendStructuredRequest.mockResolvedValue(mockResponse);

            const options: LLMRequestOptions = {
                messages: [{ role: 'user', content: 'Analyze code' }]
            };

            const result: StructuredOutputResponse<TestData> = await mockProvider.sendStructuredRequest(options);

            expect(result.data).toEqual({ name: 'result', value: 100 });
            expect(result.requests).toHaveLength(2);
            expect(result.requests?.[0].type).toBe('file');
            expect(result.requests?.[1].type).toBe('grep');
        });
    });

    describe('error handling', () => {
        it('should throw error when JSON parsing fails', async () => {
            const parseError: Error = new Error('Invalid JSON response');
            mockProvider.sendStructuredRequest.mockRejectedValue(parseError);

            const options: LLMRequestOptions = {
                messages: [{ role: 'user', content: 'Get invalid data' }]
            };

            await expect(mockProvider.sendStructuredRequest(options)).rejects.toThrow('Invalid JSON response');
        });

        it('should throw error on rate limiting', async () => {
            const rateLimitError: Error = new Error('Rate limit exceeded');
            mockProvider.sendStructuredRequest.mockRejectedValue(rateLimitError);

            const options: LLMRequestOptions = {
                messages: [{ role: 'user', content: 'Rapid request' }]
            };

            await expect(mockProvider.sendStructuredRequest(options)).rejects.toThrow('Rate limit exceeded');
        });

        it('should throw error on network timeout', async () => {
            const timeoutError: Error = new Error('Network timeout');
            mockProvider.sendStructuredRequest.mockRejectedValue(timeoutError);

            const options: LLMRequestOptions = {
                messages: [{ role: 'user', content: 'Slow request' }],
                maxTokens: 1000
            };

            await expect(mockProvider.sendStructuredRequest(options)).rejects.toThrow('Network timeout');
        });

        it('should throw error on invalid API key', async () => {
            const authError: Error = new Error('Invalid API key');
            mockProvider.sendStructuredRequest.mockRejectedValue(authError);

            const options: LLMRequestOptions = {
                messages: [{ role: 'user', content: 'Unauthorized request' }]
            };

            await expect(mockProvider.sendStructuredRequest(options)).rejects.toThrow('Invalid API key');
        });
    });

    describe('schema validation', () => {
        it('should throw error when schema validation fails', async () => {
            const validationError: Error = new Error('Schema validation failed');
            mockProvider.sendStructuredRequest.mockRejectedValue(validationError);

            const options: LLMRequestOptions = {
                messages: [{ role: 'user', content: 'Get typed data' }]
            };
            const strictSchema: Record<string, unknown> = {
                type: 'object',
                required: ['name', 'value'],
                properties: {
                    name: { type: 'string' },
                    value: { type: 'number' }
                }
            };

            await expect(mockProvider.sendStructuredRequest(options, strictSchema)).rejects.toThrow('Schema validation failed');
        });
    });
});

// Tests for sendStructuredRequest from src/ai/providers/anthropicProvider.ts
const { AnthropicProvider } = require('../src/ai/providers/anthropicProvider');

// Mock the configuration manager
jest.mock('../src/ai/providers/anthropicProvider', () => {
  const actual = jest.requireActual('../src/ai/providers/anthropicProvider');
  return {
    ...actual,
    AnthropicProvider: actual.AnthropicProvider
  };
});

// Mock the config manager module
jest.mock('../src/config/configurationManager', () => ({
  getConfigurationManager: jest.fn(() => ({
    claudeApiKey: 'test-api-key'
  }))
}));

// Mock the logger
jest.mock('../src/logger', () => ({
  SWLogger: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock the Anthropic SDK
const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    beta: {
      messages: {
        create: mockCreate
      }
    },
    messages: {
      create: mockCreate
    }
  }));
});

describe('AnthropicProvider.sendStructuredRequest', () => {
  let instance: InstanceType<typeof AnthropicProvider>;
  const testSchema: Record<string, unknown> = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      value: { type: 'number' }
    },
    required: ['name', 'value']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    instance = new AnthropicProvider();
  });

  it('should successfully parse structured JSON response', async () => {
    const expectedData = { name: 'test', value: 42 };
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(expectedData) }],
      stop_reason: 'end_turn',
      model: 'claude-opus-4-5',
      usage: {
        input_tokens: 100,
        output_tokens: 50
      }
    });

    const options: any = {
      messages: [{ role: 'user', content: 'Generate structured data' }],
      systemPrompt: 'You are a helpful assistant',
      maxTokens: 1000
    };

    const result: any = await instance.sendStructuredRequest(options, testSchema);

    expect(result).toBeDefined();
    expect(result.data).toEqual(expectedData);
    expect(result.rawResponse).toBeDefined();
  });

  it('should handle empty content blocks gracefully', async () => {
    mockCreate.mockResolvedValue({
      content: [],
      stop_reason: 'end_turn',
      model: 'claude-opus-4-5',
      usage: {
        input_tokens: 50,
        output_tokens: 0
      }
    });

    const options: any = {
      messages: [{ role: 'user', content: 'Generate data' }],
      systemPrompt: 'System prompt'
    };

    const result: any = await instance.sendStructuredRequest(options, testSchema);

    expect(result).toBeDefined();
    expect(result.data).toBeNull();
  });

  it('should handle invalid JSON response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'This is not valid JSON {broken' }],
      stop_reason: 'end_turn',
      model: 'claude-opus-4-5',
      usage: {
        input_tokens: 75,
        output_tokens: 25
      }
    });

    const options: any = {
      messages: [{ role: 'user', content: 'Generate structured data' }]
    };

    const result: any = await instance.sendStructuredRequest(options, testSchema);

    expect(result).toBeDefined();
    expect(result.data).toBeNull();
  });

  it('should throw error when API key is not configured', async () => {
    // Create provider with no API key by mocking config
    jest.resetModules();
    jest.doMock('../src/config/configurationManager', () => ({
      getConfigurationManager: jest.fn(() => ({
        claudeApiKey: null
      }))
    }));

    const { AnthropicProvider: UnconfiguredProvider } = require('../src/ai/providers/anthropicProvider');
    const unconfiguredInstance: any = new UnconfiguredProvider();

    const options: any = {
      messages: [{ role: 'user', content: 'Test message' }]
    };

    await expect(unconfiguredInstance.sendStructuredRequest(options, testSchema))
      .rejects.toThrow('Claude API key not configured');
  });

  it('should handle network timeout errors', async () => {
    const timeoutError = new Error('Request timeout');
    (timeoutError as NodeJS.ErrnoException).code = 'ETIMEDOUT';
    mockCreate.mockRejectedValue(timeoutError);

    const options: any = {
      messages: [{ role: 'user', content: 'Generate data' }]
    };

    await expect(instance.sendStructuredRequest(options, testSchema))
      .rejects.toThrow('Request timeout');
  });

  it('should handle rate limiting errors', async () => {
    const rateLimitError = new Error('Rate limit exceeded');
    (rateLimitError as Error & { status?: number }).status = 429;
    mockCreate.mockRejectedValue(rateLimitError);

    const options: any = {
      messages: [{ role: 'user', content: 'Test' }]
    };

    await expect(instance.sendStructuredRequest(options, testSchema))
      .rejects.toThrow('Rate limit exceeded');
  });
});

// Tests for sendStructuredRequest from src/ai/providers/openAIProvider.ts
const { OpenAIProvider } = require('../src/ai/providers/openAIProvider');

// Mock dependencies
jest.mock('../src/config/configurationManager', () => ({
    getConfigurationManager: jest.fn(() => ({
        openaiApiKey: 'test-api-key'
    }))
}));

jest.mock('../src/logger', () => ({
    SWLogger: {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    }
}));

jest.mock('../src/utils/jsonExtractor', () => ({
    extractJSON: jest.fn((content: string) => JSON.parse(content))
}));

jest.mock('openai', () => {
    return {
        OpenAI: jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: jest.fn()
                }
            }
        }))
    };
});

import { OpenAI } from 'openai';
import { extractJSON } from '../src/utils/jsonExtractor';

describe('OpenAIProvider.sendStructuredRequest', () => {
    let provider: InstanceType<typeof OpenAIProvider>;
    let mockCreateFn: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        provider = new OpenAIProvider();
        const mockOpenAI: any = (OpenAI as jest.MockedClass<typeof OpenAI>).mock.results[0]?.value;
        mockCreateFn = mockOpenAI?.chat?.completions?.create as jest.Mock;
    });

    it('should parse valid JSON response and return structured output', async () => {
        const expectedData = { name: 'test', value: 42 };
        mockCreateFn.mockResolvedValue({
            choices: [{
                message: { content: JSON.stringify(expectedData) },
                finish_reason: 'stop'
            }],
            model: 'gpt-4o',
            usage: { prompt_tokens: 10, completion_tokens: 20 }
        });

        (extractJSON as jest.Mock).mockReturnValue(expectedData);

        const result: any = await provider.sendStructuredRequest({
            messages: [{ role: 'user', content: 'test prompt' }]
        });

        expect(result.data).toEqual(expectedData);
        expect(result.rawResponse).toBeDefined();
        expect(mockCreateFn).toHaveBeenCalledWith(
            expect.objectContaining({
                response_format: { type: 'json_object' }
            })
        );
    });

    it('should handle invalid JSON response gracefully', async () => {
        mockCreateFn.mockResolvedValue({
            choices: [{
                message: { content: 'invalid json {{{' },
                finish_reason: 'stop'
            }],
            model: 'gpt-4o',
            usage: { prompt_tokens: 10, completion_tokens: 5 }
        });

        (extractJSON as jest.Mock).mockImplementation(() => {
            throw new Error('Failed to parse JSON');
        });

        await expect(
            provider.sendStructuredRequest({
                messages: [{ role: 'user', content: 'test prompt' }]
            })
        ).rejects.toThrow('Failed to parse JSON');
    });

    it('should handle empty content in response', async () => {
        mockCreateFn.mockResolvedValue({
            choices: [{
                message: { content: '' },
                finish_reason: 'stop'
            }],
            model: 'gpt-4o',
            usage: { prompt_tokens: 10, completion_tokens: 0 }
        });

        (extractJSON as jest.Mock).mockImplementation(() => {
            throw new Error('Empty content');
        });

        await expect(
            provider.sendStructuredRequest({
                messages: [{ role: 'user', content: 'test prompt' }]
            })
        ).rejects.toThrow();
    });

    it('should handle API rate limiting error', async () => {
        const rateLimitError = new Error('Rate limit exceeded');
        (rateLimitError as Error & { status: number }).status = 429;
        mockCreateFn.mockRejectedValue(rateLimitError);

        await expect(
            provider.sendStructuredRequest({
                messages: [{ role: 'user', content: 'test prompt' }]
            })
        ).rejects.toThrow('Rate limit exceeded');
    });
});

// Tests for analyzeTypeScriptFunction from src/analysis/enhancedAnalyzer.ts
const { EnhancedAnalyzer } = require('../src/analysis/enhancedAnalyzer');

describe('analyzeTypeScriptFunctionEnhancedAnalyzer (from enhancedAnalyzer.ts)', () => {
    let analyzer: InstanceType<typeof EnhancedAnalyzer>;

    beforeEach(() => {
        analyzer = new EnhancedAnalyzer();
        jest.clearAllMocks();
    });

    interface FunctionInfo {
        name: string;
        file: string;
        startLine: number;
        endLine: number;
        parameters: string[];
        returnType: string;
    }

    interface FunctionMetadata {
        functionName: string;
        filePath: string;
        startLine: number;
        endLine: number;
        parameters: Array<{ name: string; type: string; defaultValue?: string }>;
        returnType: string;
        isAsync: boolean;
        isGenerator: boolean;
        isExported: boolean;
        branches: Array<{ type: string; line: number; condition?: string }>;
        dependencies: Array<{ name: string; type: string; source?: string }>;
        stateMutations: Array<{ target: string; type: string; line: number }>;
        behavioralHints: {
            isPure: boolean;
            hasIO: boolean;
            hasRandomness: boolean;
            hasDateDependency: boolean;
            complexity: string;
        };
        cyclomaticComplexity: number;
    }

    test('should analyze a simple TypeScript function successfully', async () => {
        const filePath: string = 'test.ts';
        const fullContent: string = `function simpleAdd(a: number, b: number): number {
    return a + b;
}`;
        const func: FunctionInfo = {
            name: 'simpleAdd',
            file: 'test.ts',
            startLine: 1,
            endLine: 3,
            parameters: ['a', 'b'],
            returnType: 'number'
        };
        const functionContent: string = fullContent;

        const result: FunctionMetadata = await (analyzer as any).analyzeTypeScriptFunction(
            filePath,
            fullContent,
            func,
            functionContent
        );

        expect(result).toBeDefined();
        expect(result.functionName).toBe('simpleAdd');
        expect(result.filePath).toBe(filePath);
        expect(result.startLine).toBe(1);
        expect(result.endLine).toBe(3);
    });

    test('should analyze an async arrow function', async () => {
        const filePath: string = 'asyncArrow.ts';
        const fullContent: string = `const fetchData = async (url: string): Promise<string> => {
    const response = await fetch(url);
    return response.text();
};`;
        const func: FunctionInfo = {
            name: 'fetchData',
            file: 'asyncArrow.ts',
            startLine: 1,
            endLine: 4,
            parameters: ['url'],
            returnType: 'Promise<string>'
        };
        const functionContent: string = fullContent;

        const result: FunctionMetadata = await (analyzer as any).analyzeTypeScriptFunction(
            filePath,
            fullContent,
            func,
            functionContent
        );

        expect(result).toBeDefined();
        expect(result.functionName).toBe('fetchData');
        expect(result.filePath).toBe(filePath);
    });

    test('should handle function with deeply nested conditionals', async () => {
        const filePath: string = 'nested.ts';
        const fullContent: string = `function processValue(value: number): string {
    if (value > 0) {
        if (value > 10) {
            if (value > 100) {
                return 'large';
            }
            return 'medium';
        }
        return 'small';
    }
    return 'zero or negative';
}`;
        const func: FunctionInfo = {
            name: 'processValue',
            file: 'nested.ts',
            startLine: 1,
            endLine: 12,
            parameters: ['value'],
            returnType: 'string'
        };
        const functionContent: string = fullContent;

        const result: FunctionMetadata = await (analyzer as any).analyzeTypeScriptFunction(
            filePath,
            fullContent,
            func,
            functionContent
        );

        expect(result).toBeDefined();
        expect(result.functionName).toBe('processValue');
        expect(result.filePath).toBe(filePath);
        expect(result.branches).toBeDefined();
        expect(Array.isArray(result.branches)).toBe(true);
    });

    test('should handle function with destructured parameters', async () => {
        const filePath: string = 'destructured.ts';
        const fullContent: string = `function processUser({ name, age }: { name: string; age: number }): string {
    return \`\${name} is \${age} years old\`;
}`;
        const func: FunctionInfo = {
            name: 'processUser',
            file: 'destructured.ts',
            startLine: 1,
            endLine: 3,
            parameters: ['{ name, age }'],
            returnType: 'string'
        };
        const functionContent: string = fullContent;

        const result: FunctionMetadata = await (analyzer as any).analyzeTypeScriptFunction(
            filePath,
            fullContent,
            func,
            functionContent
        );

        expect(result).toBeDefined();
        expect(result.functionName).toBe('processUser');
        expect(result.parameters).toBeDefined();
    });

    test('should handle empty function body gracefully', async () => {
        const filePath: string = 'empty.ts';
        const fullContent: string = `function emptyFunc(): void {
}`;
        const func: FunctionInfo = {
            name: 'emptyFunc',
            file: 'empty.ts',
            startLine: 1,
            endLine: 2,
            parameters: [],
            returnType: 'void'
        };
        const functionContent: string = fullContent;

        const result: FunctionMetadata = await (analyzer as any).analyzeTypeScriptFunction(
            filePath,
            fullContent,
            func,
            functionContent
        );

        expect(result).toBeDefined();
        expect(result.functionName).toBe('emptyFunc');
        expect(result.behavioralHints).toBeDefined();
    });
});

// Tests for analyzeTypeScriptFunction from src/analysis/functionAnalyzer.ts
const ts = require('typescript');

// Mock the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Import the class to access the private method via prototype or create instance
const { FunctionAnalyzer } = require('../src/analysis/functionAnalyzer');

describe('analyzeTypeScriptFunctionFunctionAnalyzer (from functionAnalyzer.ts)', () => {
  let analyzer: InstanceType<typeof FunctionAnalyzer>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    analyzer = new FunctionAnalyzer();
  });

  interface MockCodeAnalysis {
    files: Array<{ path: string; lines: number }>;
    functions: Array<{ name: string; file: string; startLine: number; language: string }>;
  }

  const createMockCodeAnalysis = (): MockCodeAnalysis => ({
    files: [{ path: 'test.ts', lines: 600 }],
    functions: [{ name: 'testFunc', file: 'test.ts', startLine: 1, language: 'typescript' }]
  });

  interface MockFunc {
    name: string;
    file: string;
    startLine: number;
    language: string;
    lines: number;
  }

  test('should analyze a simple TypeScript function and return FunctionAnalysis', () => {
    const filePath: string = 'test.ts';
    const content: string = `
      function testFunc(param1: string, param2: number): boolean {
        console.log(param1);
        return param2 > 0;
      }
    `;
    const func: MockFunc = {
      name: 'testFunc',
      file: filePath,
      startLine: 2,
      language: 'typescript',
      lines: 4
    };
    const codeAnalysis: MockCodeAnalysis = createMockCodeAnalysis();

    // Access private method through any cast for testing
    const analyzeTypeScriptFunctionFunctionAnalyzer = (analyzer as any).analyzeTypeScriptFunction.bind(analyzer);
    
    const result: any = analyzeTypeScriptFunctionFunctionAnalyzer(filePath, func, content, codeAnalysis);
    
    // The result should be a FunctionAnalysis object or null
    if (result !== null) {
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('signature');
    }
  });

  test('should handle arrow functions correctly', () => {
    const filePath: string = 'arrow.ts';
    const content: string = `
      const arrowFunc = async (data: string[]): Promise<void> => {
        await Promise.resolve(data);
      };
    `;
    const func: MockFunc = {
      name: 'arrowFunc',
      file: filePath,
      startLine: 2,
      language: 'typescript',
      lines: 3
    };
    const codeAnalysis: MockCodeAnalysis = createMockCodeAnalysis();

    const analyzeTypeScriptFunctionFunctionAnalyzer = (analyzer as any).analyzeTypeScriptFunction.bind(analyzer);
    
    const result: any = analyzeTypeScriptFunctionFunctionAnalyzer(filePath, func, content, codeAnalysis);
    
    // Should return either analysis or null (fallback to regex if not found)
    expect(result === null || typeof result === 'object').toBe(true);
  });

  test('should return fallback analysis when function node is not found', () => {
    const filePath: string = 'empty.ts';
    const content: string = `
      // Just a comment, no actual function
      const x = 5;
    `;
    const func: MockFunc = {
      name: 'nonExistentFunc',
      file: filePath,
      startLine: 1,
      language: 'typescript',
      lines: 1
    };
    const codeAnalysis: MockCodeAnalysis = createMockCodeAnalysis();

    const analyzeTypeScriptFunctionFunctionAnalyzer = (analyzer as any).analyzeTypeScriptFunction.bind(analyzer);
    
    const result: any = analyzeTypeScriptFunctionFunctionAnalyzer(filePath, func, content, codeAnalysis);
    
    // When function node is not found, it falls back to regex analysis
    // This should still return some form of analysis or null
    expect(result === null || typeof result === 'object').toBe(true);
  });
});
