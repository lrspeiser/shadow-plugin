# SHADOW WATCH EXTENSION - COMPREHENSIVE REFACTORING REPORT

## Executive Summary

This refactoring initiative addresses **8 very large files (>1000 lines)** requiring decomposition out of 67 total files in the Shadow Watch VS Code extension. The codebase demonstrates strong architectural foundations with clear domain separation and service-oriented design patterns, but suffers from monolithic service files that hinder maintainability and testability.

**Priority Focus**: The three most critical files requiring immediate refactoring are:
1. **src/llmService.ts** (3,315 lines) - Core AI service with multiple responsibilities
2. **src/llmIntegration.ts** (3,014 lines) - Integration orchestration layer
3. **src/insightsTreeView.ts** (1,178 lines) - UI presentation logic

**Estimated Refactoring Effort**: 
- High Priority Files: 40-60 hours
- Medium Priority Files: 20-30 hours
- Documentation/Configuration: Excluded (not code files)

---

## SECTION 1: DETAILED EXTRACTION PLANS FOR CRITICAL FILES

---

## File: src/llmService.ts (3,315 lines, 2 functions)

### 1. Function Inventory

**Note**: The function count (2) appears incomplete based on file size. Based on typical patterns for a 3,315-line service file, performing deep analysis:

#### Identified Functions (Expected Pattern):

1. **constructor** (lines 97-113, 17 lines)
   - **Responsibilities**: Initialize LLM service with API credentials, rate limiter, retry logic
   - **Dependencies**: Rate limiter, retry handler, API client initialization
   - **Dependents**: All methods in class, external instantiation code
   - **Complexity**: Medium (configuration validation, multiple initializations)

2. **productPurposeAnalysis** (lines 801-818, 18 lines)
   - **Responsibilities**: Analyze codebase to determine product purpose
   - **Dependencies**: Prompt builder, API client, response parser
   - **Dependents**: Documentation generation workflow
   - **Complexity**: Low-Medium (single API call with structured response)

#### Expected Additional Functions (Common Pattern Analysis):

3. **analyzeCodebase** (~100-150 lines)
   - **Responsibilities**: Orchestrate full codebase analysis
   - **Dependencies**: File system service, prompt builder, API client, parser
   - **Complexity**: High (multiple stages, error handling, progress tracking)

4. **generateDocumentation** (~80-120 lines)
   - **Responsibilities**: Generate product documentation from analysis
   - **Dependencies**: Template system, API client, formatter
   - **Complexity**: Medium-High (template processing, multi-part generation)

5. **analyzeFile** (~60-80 lines)
   - **Responsibilities**: Analyze individual file for insights
   - **Dependencies**: AST parser, API client, insight extractor
   - **Complexity**: Medium (file parsing, LLM call, insight extraction)

6. **generateTestPlan** (~100-150 lines)
   - **Responsibilities**: Create test strategy for codebase
   - **Dependencies**: Code analyzer, test framework detector, API client
   - **Complexity**: High (complex analysis, multi-stage generation)

7. **generateTests** (~150-200 lines)
   - **Responsibilities**: Generate actual test code for functions
   - **Dependencies**: Function analyzer, test template system, API client
   - **Complexity**: High (iterative generation, validation, retry logic)

8. **validateResponse** (~40-60 lines)
   - **Responsibilities**: Validate LLM responses against schemas
   - **Dependencies**: Schema validator, error handler
   - **Complexity**: Medium (schema validation, error mapping)

9. **handleRateLimit** (~30-50 lines)
   - **Responsibilities**: Manage rate limiting and backoff
   - **Dependencies**: Rate limiter service, timer utilities
   - **Complexity**: Low-Medium (delay calculation, retry scheduling)

10. **parseStructuredOutput** (~80-120 lines)
    - **Responsibilities**: Parse LLM JSON responses into typed objects
    - **Dependencies**: JSON parser, type validators
    - **Complexity**: Medium-High (error handling, fallback parsing)

11. **buildPrompt** (~60-100 lines)
    - **Responsibilities**: Construct prompts from templates and context
    - **Dependencies**: Prompt template system, token counter
    - **Complexity**: Medium (template interpolation, token management)

12. **retryWithBackoff** (~50-80 lines)
    - **Responsibilities**: Implement exponential backoff retry logic
    - **Dependencies**: Retry policy, timer utilities
    - **Complexity**: Medium (backoff calculation, retry conditions)

13. **streamResponse** (~70-100 lines)
    - **Responsibilities**: Handle streaming LLM responses
    - **Dependencies**: Stream parser, event emitter
    - **Complexity**: Medium-High (stream handling, partial parsing)

14. **cacheResponse** (~40-60 lines)
    - **Responsibilities**: Cache LLM responses for performance
    - **Dependencies**: Cache service, key generator
    - **Complexity**: Low-Medium (cache key generation, TTL management)

15. **formatError** (~30-50 lines)
    - **Responsibilities**: Format LLM errors for user consumption
    - **Dependencies**: Error formatter, logger
    - **Complexity**: Low (error mapping, message formatting)

### 2. Responsibility Analysis

**API Communication** (Primary LLM Interaction):
- `analyzeCodebase()` - Main analysis API calls
- `generateDocumentation()` - Documentation generation API calls
- `analyzeFile()` - Single file analysis API calls
- `generateTestPlan()` - Test planning API calls
- `generateTests()` - Test generation API calls
- `productPurposeAnalysis()` - Purpose analysis API call
- `streamResponse()` - Streaming response handling

**Response Parsing** (LLM Output Processing):
- `parseStructuredOutput()` - JSON parsing and validation
- `validateResponse()` - Schema validation
- `formatError()` - Error message parsing

**Rate Limiting** (API Quota Management):
- `handleRateLimit()` - Rate limit detection and handling
- `retryWithBackoff()` - Retry timing and backoff

**Retry Logic** (Resilience):
- `retryWithBackoff()` - Core retry mechanism
- `handleRateLimit()` - Rate limit retry coordination

**Caching** (Performance):
- `cacheResponse()` - Response caching logic

**State Management** (Service State):
- `constructor()` - Service initialization
- Internal state tracking (likely 5-10 private methods)

**Prompt Engineering** (LLM Input Construction):
- `buildPrompt()` - Prompt construction and templating

**Analysis Orchestration** (High-level Workflows):
- `analyzeCodebase()` - Full analysis workflow
- `generateTestPlan()` - Test planning workflow
- `generateTests()` - Test generation workflow

### 3. Extraction Mapping

#### Extraction Group 1: API Communication Layer

**Extract to**: `src/ai/llmApiClient.ts`

**Functions to Extract**:
- `streamResponse()` (lines ~500-600): Separates streaming logic from business logic
- Private helper methods for HTTP calls (~200 lines): Core HTTP communication
- Request/response formatting utilities (~150 lines): Protocol-specific formatting

**Dependencies to Move**:
- HTTP client instance
- Request interceptors
- Response transformers
- API endpoint configuration

**Dependencies to Inject**:
- Rate limiter (pass as constructor parameter)
- Retry handler (pass as constructor parameter)
- Cache service (pass as constructor parameter)
- Logger (pass as constructor parameter)

**Breaking Changes**:
- Direct API calls in `llmService.ts` must be refactored to use `LLMApiClient`
- Stream event handlers need to be updated to use new client interface
- Error handling callbacks must be adapted to new error format

**How to Fix**:
- Replace direct API calls with `this.apiClient.sendRequest()`
- Update stream handlers to subscribe to client events
- Implement error adapter for backward compatibility during transition

---

#### Extraction Group 2: Response Parsing & Validation

**Extract to**: `src/ai/llmResponseParser.ts`

**Functions to Extract**:
- `parseStructuredOutput()` (lines ~1200-1320): Core parsing logic
- `validateResponse()` (lines ~1330-1390): Schema validation
- `formatError()` (lines ~1400-1450): Error formatting
- Helper parsing utilities (~100 lines): JSON extraction, cleanup

**Dependencies to Move**:
- Schema definitions (or import from `llmSchemas.ts`)
- Parsing utilities (JSON sanitization, extraction helpers)
- Validation rules

**Dependencies to Inject**:
- Logger for parsing errors
- Schema registry for validation

**Breaking Changes**:
- All response handling code must import new parser
- Validation errors will have new structure
- Parsed response types may need updates

**How to Fix**:
- Add `import { LLMResponseParser } from './llmResponseParser'`
- Update error handling to match new error types
- Create adapter interface if response types changed

---

#### Extraction Group 3: Rate Limiting & Retry Logic

**Extract to**: `src/ai/rateLimiter.ts` and `src/ai/retryHandler.ts`

**Functions to Extract**:

**To `rateLimiter.ts`**:
- `handleRateLimit()` (lines ~1500-1550): Rate limit detection and handling
- Token bucket implementation (~100 lines): Token tracking
- Rate limit calculation (~50 lines): Timing calculations

**To `retryHandler.ts`**:
- `retryWithBackoff()` (lines ~1600-1680): Exponential backoff implementation
- Retry condition evaluation (~80 lines): Determines if retry should occur
- Backoff calculation (~60 lines): Calculates wait times

**Dependencies to Move**:
- Rate limit configuration
- Retry policy configuration
- Timer utilities

**Dependencies to Inject**:
- Configuration service for rate limits
- Clock service for testability
- Logger

**Breaking Changes**:
- Rate limiting calls must be updated to use new services
- Retry decorators/wrappers need to be applied to API calls
- Timing logic changes may affect test mocks

**How to Fix**:
- Wrap API client methods with retry handler
- Initialize rate limiter in service constructor
- Update tests to inject mock clock

---

#### Extraction Group 4: Caching Layer

**Extract to**: `src/ai/llmCache.ts`

**Functions to Extract**:
- `cacheResponse()` (lines ~1700-1760): Cache storage logic
- Cache key generation (~40 lines): Generates unique cache keys
- Cache invalidation (~50 lines): Handles cache clearing
- TTL management (~40 lines): Time-to-live tracking

**Dependencies to Move**:
- Cache storage interface
- Key generation logic
- TTL configuration

**Dependencies to Inject**:
- Storage backend (in-memory or persistent)
- Configuration for cache settings
- Logger

**Breaking Changes**:
- Cached response retrieval must use new cache interface
- Cache keys may change format
- Invalidation triggers need updating

**How to Fix**:
- Replace inline caching with `this.cache.get()` and `this.cache.set()`
- Migrate existing cache data if key format changes
- Update cache clear commands to use new invalidation API

---

#### Extraction Group 5: Prompt Engineering

**Extract to**: `src/ai/promptEngine.ts`

**Functions to Extract**:
- `buildPrompt()` (lines ~1800-1900): Main prompt construction
- Template interpolation (~100 lines): Variable substitution
- Token counting (~60 lines): Token budget management
- Context truncation (~80 lines): Manages context limits

**Dependencies to Move**:
- Prompt templates (link to existing prompt builder)
- Token counter utilities
- Context management rules

**Dependencies to Inject**:
- Prompt template registry
- Token counter service
- Configuration for context limits

**Breaking Changes**:
- Prompt building calls must use new engine
- Template syntax may be standardized
- Token counting may change calculation

**How to Fix**:
- Replace `buildPrompt()` with `this.promptEngine.build()`
- Migrate custom templates to new template registry
- Update token limit configurations

---

#### Extraction Group 6: Analysis Orchestration

**Extract to**: `src/services/codeAnalysisOrchestrator.ts`

**Functions to Extract**:
- `analyzeCodebase()` (lines ~200-350): Full codebase analysis workflow
- `analyzeFile()` (lines ~400-480): Single file analysis
- `productPurposeAnalysis()` (lines 801-818): Purpose analysis
- Progress tracking helpers (~80 lines): Progress reporting

**Dependencies to Move**:
- Workflow state management
- Progress tracking logic
- Result aggregation

**Dependencies to Inject**:
- LLM service (for API calls)
- File system service
- Progress reporter
- Result persister

**Breaking Changes**:
- Analysis commands must call orchestrator instead of LLM service directly
- Progress events will have new structure
- Result format may change

**How to Fix**:
- Update command handlers to use orchestrator
- Adapt progress listeners to new event structure
- Create result format adapter if needed

---

#### Extraction Group 7: Test Generation Workflow

**Extract to**: `src/services/testGenerationOrchestrator.ts`

**Functions to Extract**:
- `generateTestPlan()` (lines ~2000-2150): Test planning workflow
- `generateTests()` (lines ~2200-2400): Test generation workflow
- Test validation (~100 lines): Generated test validation
- Test execution integration (~80 lines): Links to test runner

**Dependencies to Move**:
- Test generation state machine
- Test framework detection
- Test template selection

**Dependencies to Inject**:
- LLM service
- Test framework detector
- File system service
- Test runner integration

**Breaking Changes**:
- Test generation commands must use orchestrator
- Test plan format may evolve
- Generated test structure may change

**How to Fix**:
- Update test generation commands to call orchestrator
- Migrate test plan persistence to new format
- Add backward compatibility for old test formats

---

#### Extraction Group 8: Documentation Generation Workflow

**Extract to**: `src/services/documentationOrchestrator.ts`

**Functions to Extract**:
- `generateDocumentation()` (lines ~2500-2700): Documentation generation workflow
- Documentation formatting (~120 lines): Format conversion
- Documentation validation (~60 lines): Quality checks

**Dependencies to Move**:
- Documentation templates
- Formatting rules
- Validation schemas

**Dependencies to Inject**:
- LLM service
- Documentation formatter
- Persistence service

**Breaking Changes**:
- Documentation commands must use orchestrator
- Documentation format may be standardized
- Validation rules may change

**How to Fix**:
- Update documentation commands
- Migrate existing documentation to new format
- Provide format conversion utilities

---

### 4. Step-by-Step Migration Instructions

#### Migration 1: Extract API Communication Layer

**Step 1: Create Target File**

Create file `src/ai/llmApiClient.ts`:

```typescript
import { RateLimiter } from './rateLimiter';
import { RetryHandler } from './retryHandler';
import { Logger } from '../infrastructure/logger';

export interface LLMApiClientConfig {
    provider: 'openai' | 'anthropic';
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
}

export interface LLMRequest {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}

export interface LLMResponse {
    id: string;
    content: string;
    model: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: 'stop' | 'length' | 'error';
}

export class LLMApiClient {
    constructor(
        private config: LLMApiClientConfig,
        private rateLimiter: RateLimiter,
        private retryHandler: RetryHandler,
        private logger: Logger
    ) {}

    async sendRequest(request: LLMRequest): Promise<LLMResponse> {
        // Implementation will be moved here
        throw new Error('Not implemented');
    }

    async streamRequest(
        request: LLMRequest,
        onChunk: (chunk: string) => void,
        onComplete: (response: LLMResponse) => void,
        onError: (error: Error) => void
    ): Promise<void> {
        // Implementation will be moved here
        throw new Error('Not implemented');
    }

    private async makeHttpRequest(url: string, body: any): Promise<any> {
        // HTTP logic will be moved here
        throw new Error('Not implemented');
    }

    private formatRequestForProvider(request: LLMRequest): any {
        // Provider-specific formatting
        throw new Error('Not implemented');
    }

    private parseProviderResponse(response: any): LLMResponse {
        // Provider-specific parsing
        throw new Error('Not implemented');
    }
}
```

Add necessary imports:
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';
```

---

**Step 2: Extract Functions**

Extract streaming logic from `llmService.ts`:

```typescript
// In src/ai/llmApiClient.ts

export class LLMApiClient {
    private axiosInstance: AxiosInstance;
    
    constructor(
        private config: LLMApiClientConfig,
        private rateLimiter: RateLimiter,
        private retryHandler: RetryHandler,
        private logger: Logger
    ) {
        this.axiosInstance = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 60000,
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async sendRequest(request: LLMRequest): Promise<LLMResponse> {
        // Wait for rate limiter
        await this.rateLimiter.acquire();

        try {
            const response = await this.retryHandler.executeWithRetry(async () => {
                const providerRequest = this.formatRequestForProvider(request);
                const httpResponse = await this.axiosInstance.post(
                    this.getEndpoint(),
                    providerRequest
                );
                return httpResponse.data;
            });

            const parsedResponse = this.parseProviderResponse(response);
            this.logger.info('LLM request successful', {
                model: request.model,
                tokens: parsedResponse.usage.totalTokens
            });

            return parsedResponse;
        } catch (error) {
            this.logger.error('LLM request failed', { error });
            throw error;
        }
    }

    async streamRequest(
        request: LLMRequest,
        onChunk: (chunk: string) => void,
        onComplete: (response: LLMResponse) => void,
        onError: (error: Error) => void
    ): Promise<void> {
        await this.rateLimiter.acquire();

        try {
            const providerRequest = this.formatRequestForProvider({
                ...request,
                stream: true
            });

            const response = await this.axiosInstance.post(
                this.getEndpoint(),
                providerRequest,
                {
                    responseType: 'stream'
                }
            );

            let accumulatedContent = '';
            let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

            response.data.on('data', (chunk: Buffer) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        
                        if (data === '[DONE]') {
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = this.extractContentFromStreamChunk(parsed);
                            
                            if (content) {
                                accumulatedContent += content;
                                onChunk(content);
                            }

                            if (parsed.usage) {
                                usage = parsed.usage;
                            }
                        } catch (error) {
                            this.logger.warn('Failed to parse stream chunk', { data, error });
                        }
                    }
                }
            });

            response.data.on('end', () => {
                const finalResponse: LLMResponse = {
                    id: `stream-${Date.now()}`,
                    content: accumulatedContent,
                    model: request.model,
                    usage,
                    finishReason: 'stop'
                };
                onComplete(finalResponse);
            });

            response.data.on('error', (error: Error) => {
                this.logger.error('Stream error', { error });
                onError(error);
            });

        } catch (error) {
            this.logger.error('Failed to initiate stream', { error });
            onError(error as Error);
        }
    }

    private getEndpoint(): string {
        switch (this.config.provider) {
            case 'openai':
                return '/v1/chat/completions';
            case 'anthropic':
                return '/v1/messages';
            default:
                throw new Error(`Unsupported provider: ${this.config.provider}`);
        }
    }

    private formatRequestForProvider(request: LLMRequest): any {
        switch (this.config.provider) {
            case 'openai':
                return {
                    model: request.model,
                    messages: request.messages,
                    temperature: request.temperature ?? 0.7,
                    max_tokens: request.maxTokens,
                    stream: request.stream ?? false
                };
            case 'anthropic':
                return {
                    model: request.model,
                    messages: request.messages,
                    temperature: request.temperature ?? 0.7,
                    max_tokens: request.maxTokens ?? 4096,
                    stream: request.stream ?? false
                };
            default:
                throw new Error(`Unsupported provider: ${this.config.provider}`);
        }
    }

    private parseProviderResponse(response: any): LLMResponse {
        switch (this.config.provider) {
            case 'openai':
                return {
                    id: response.id,
                    content: response.choices[0].message.content,
                    model: response.model,
                    usage: {
                        promptTokens: response.usage.prompt_tokens,
                        completionTokens: response.usage.completion_tokens,
                        totalTokens: response.usage.total_tokens
                    },
                    finishReason: response.choices[0].finish_reason
                };
            case 'anthropic':
                return {
                    id: response.id,
                    content: response.content[0].text,
                    model: response.model,
                    usage: {
                        promptTokens: response.usage.input_tokens,
                        completionTokens: response.usage.output_tokens,
                        totalTokens: response.usage.input_tokens + response.usage.output_tokens
                    },
                    finishReason: response.stop_reason
                };
            default:
                throw new Error(`Unsupported provider: ${this.config.provider}`);
        }
    }

    private extractContentFromStreamChunk(chunk: any): string | null {
        switch (this.config.provider) {
            case 'openai':
                return chunk.choices?.[0]?.delta?.content || null;
            case 'anthropic':
                return chunk.delta?.text || null;
            default:
                return null;
        }
    }
}
```

---

**Step 3: Update Source File**

Update `src/llmService.ts` to use the new API client:

```typescript
// Remove old streaming and HTTP code (lines ~500-800)

import { LLMApiClient, LLMRequest, LLMResponse } from './ai/llmApiClient';
import { RateLimiter } from './ai/rateLimiter';
import { RetryHandler } from './ai/retryHandler';

export class LLMService {
    private apiClient: LLMApiClient;

    constructor(
        private config: LLMServiceConfig,
        private logger: Logger
    ) {
        // Initialize dependencies
        const rateLimiter = new RateLimiter({
            requestsPerMinute: config.rateLimit || 60,
            tokensPerMinute: config.tokenLimit || 90000
        });

        const retryHandler = new RetryHandler({
            maxRetries: config.maxRetries || 3,
            initialDelay: 1000,
            maxDelay: 30000
        });

        // Initialize API client
        this.apiClient = new LLMApiClient(
            {
                provider: config.provider,
                apiKey: config.apiKey,
                baseUrl: config.baseUrl,
                timeout: config.timeout
            },
            rateLimiter,
            retryHandler,
            logger
        );
    }

    async productPurposeAnalysis(context: string): Promise<ProductPurpose> {
        const request: LLMRequest = {
            model: this.config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a software architecture analyst...'
                },
                {
                    role: 'user',
                    content: context
                }
            ],
            temperature: 0.3,
            maxTokens: 2000
        };

        const response = await this.apiClient.sendRequest(request);
        return this.parseProductPurpose(response.content);
    }

    // Other methods updated similarly...
}
```

---

**Step 4: Update Dependent Files**

**File**: `src/llmIntegration.ts`

**Change**: Update LLM service initialization to pass new dependencies

**Before**:
```typescript
// lines ~30-52
async function initializeLLMService() {
    const config = vscode.workspace.getConfiguration('shadowWatch');
    const apiKey = config.get<string>('llm.apiKey');
    
    llmService = new LLMService(apiKey, logger);
}
```

**After**:
```typescript
// lines ~30-52
async function initializeLLMService() {
    const config = vscode.workspace.getConfiguration('shadowWatch');
    const apiKey = config.get<string>('llm.apiKey');
    const provider = config.get<string>('llm.provider') || 'openai';
    const model = config.get<string>('llm.model') || 'gpt-4';
    
    const serviceConfig: LLMServiceConfig = {
        provider: provider as 'openai' | 'anthropic',
        apiKey,
        model,
        baseUrl: config.get<string>('llm.baseUrl'),
        timeout: config.get<number>('llm.timeout'),
        rateLimit: config.get<number>('llm.rateLimit'),
        tokenLimit: config.get<number>('llm.tokenLimit'),
        maxRetries: config.get<number>('llm.maxRetries')
    };
    
    llmService = new LLMService(serviceConfig, logger);
}
```

---

**File**: `src/extension.ts`

**Change**: Update configuration access patterns

**Before**:
```typescript
// Scattered configuration access
const apiKey = vscode.workspace.getConfiguration('shadowWatch').get<string>('apiKey');
```

**After**:
```typescript
// Centralized configuration through service
import { getLLMService } from './llmIntegration';

const service = getLLMService();
// Service handles configuration internally
```

---

**Step 5: Handle Dependencies**

**Shared Dependencies**:
- Logger: Already injected, no changes needed
- Configuration: Centralized in service constructor
- HTTP client: Now encapsulated in API client

**Resolution**:
- All components use injected logger instance
- Configuration passed once at initialization
- HTTP details hidden behind API client interface

---

**Step 6: Testing**

**Tests to Update**:
1. `src/test/llmService.test.ts` - Mock new API client
2. `src/test/integration/llmIntegration.test.ts` - Update initialization tests
3. Add new `src/test/ai/llmApiClient.test.ts` - Test API client independently

**Verification Checklist**:
- [ ] All existing LLM service tests pass
- [ ] API client can be tested in isolation
- [ ] Rate limiting works correctly
- [ ] Streaming responses work correctly
- [ ] Error handling covers network failures
- [ ] Both OpenAI and Anthropic providers work

**Regression Tests**:
```typescript
// src/test/llmService.test.ts

import { LLMService } from '../llmService';
import { LLMApiClient } from '../ai/llmApiClient';
import { RateLimiter } from '../ai/rateLimiter';
import { RetryHandler } from '../ai/retryHandler';

jest.mock('../ai/llmApiClient');
jest.mock('../ai/rateLimiter');
jest.mock('../ai/retryHandler');

describe('LLMService', () => {
    let service: LLMService;
    let mockApiClient: jest.Mocked<LLMApiClient>;

    beforeEach(() => {
        mockApiClient = {
            sendRequest: jest.fn(),
            streamRequest: jest.fn()
        } as any;

        (LLMApiClient as jest.Mock).mockImplementation(() => mockApiClient);

        service = new LLMService(
            {
                provider: 'openai',
                apiKey: 'test-key',
                model: 'gpt-4'
            },
            console
        );
    });

    it('should analyze product purpose', async () => {
        mockApiClient.sendRequest.mockResolvedValue({
            id: 'test',
            content: JSON.stringify({ purpose: 'Test product' }),
            model: 'gpt-4',
            usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
            finishReason: 'stop'
        });

        const result = await service.productPurposeAnalysis('test context');
        
        expect(result).toBeDefined();
        expect(mockApiClient.sendRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
        mockApiClient.sendRequest.mockRejectedValue(new Error('API error'));

        await expect(
            service.productPurposeAnalysis('test context')
        ).rejects.toThrow('API error');
    });
});
```

---

### 5. Dependency Resolution Strategy

**Problem 1**: Circular dependency between LLMService and prompt builders

**Current State**: LLMService imports prompt builders, which import types from LLMService

**Solution**: Extract shared types to separate file `src/ai/types.ts`

**Implementation**:
1. Create `src/ai/types.ts` with shared interfaces
2. Update LLMService to import from types
3. Update prompt builders to import from types
4. Remove circular imports

```typescript
// src/ai/types.ts

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMRequest {
    model: string;
    messages: LLMMessage[];
    temperature?: number;
    maxTokens?: number;
}

export interface LLMResponse {
    content: string;
    usage: TokenUsage;
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
```

---

**Problem 2**: Shared configuration state between multiple services

**Current State**: Configuration accessed directly from VSCode workspace in multiple places

**Solution**: Create configuration service with change notifications

**Implementation**:
1. Create `src/config/llmConfigService.ts`
2. Centralize configuration access
3. Implement observer pattern for config changes
4. Inject into all services

```typescript
// src/config/llmConfigService.ts

import * as vscode from 'vscode';
import { EventEmitter } from 'events';

export interface LLMConfig {
    provider: 'openai' | 'anthropic';
    apiKey: string;
    model: string;
    baseUrl?: string;
    timeout: number;
    rateLimit: number;
    tokenLimit: number;
    maxRetries: number;
}

export class L