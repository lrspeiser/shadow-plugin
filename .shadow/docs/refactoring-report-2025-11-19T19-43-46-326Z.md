# COMPREHENSIVE REFACTORING REPORT: SHADOW WATCH VS CODE EXTENSION

## Executive Summary

This report provides detailed, actionable refactoring plans for the Shadow Watch VS Code extension. The codebase contains **8 very large files (>1000 lines)** requiring immediate decomposition. The primary refactoring targets are:

1. **src/llmService.ts** (2,942 lines) - Monolithic AI service
2. **src/llmIntegration.ts** (2,722 lines) - Integration orchestration
3. **src/insightsTreeView.ts** (1,097 lines) - UI tree management
4. **src/productNavigator.ts** (1,094 lines) - Navigation logic
5. **src/domain/prompts/promptBuilder.ts** (1,014 lines) - Prompt construction
6. **src/analysis/enhancedAnalyzer.ts** (871 lines) - Code analysis
7. **src/insightsViewer.ts** (778 lines) - Insights display
8. **src/extension.ts** (715 lines) - Extension entry point

**Estimated Refactoring Impact**: 
- Files to create: ~35 new files
- Lines to refactor: ~10,000+ lines
- Breaking changes: Minimal (primarily internal)
- Time estimate: 3-4 weeks with testing

---

## PRIORITY 1: src/llmService.ts (2,942 lines, 116 functions)

### Critical Issues
- **God Object Anti-Pattern**: Single class handles API communication, response parsing, rate limiting, retry logic, caching, and state management
- **High Coupling**: 116 functions tightly coupled within one file
- **Testing Difficulty**: Cannot test components in isolation
- **Maintenance Nightmare**: Any change requires understanding entire file

---

### 1. Function Inventory

#### API Communication Functions
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|-----------------|--------------|------------|
| `constructor()` | 97-113 | Initialize service, setup providers | OpenAI, Anthropic clients | Low |
| `callLLM()` | 260-340 | Main API call orchestration | Provider clients, rate limiter, retry handler | High (nested conditionals, loops) |
| `callOpenAI()` | 350-450 | OpenAI-specific API calls | OpenAI SDK | Medium |
| `callAnthropic()` | 460-560 | Anthropic-specific API calls | Anthropic SDK | Medium |
| `streamResponse()` | 570-650 | Handle streaming responses | Provider clients | High |
| `buildRequestPayload()` | 660-720 | Construct API request body | Config, validation | Medium |

#### Response Processing Functions
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|-----------------|--------------|------------|
| `parseResponse()` | 730-820 | Parse and validate API responses | JSON schema validator | Medium |
| `extractContent()` | 830-880 | Extract content from response | Response parsers | Low |
| `validateResponse()` | 890-940 | Validate response structure | Schema definitions | Medium |
| `transformResponse()` | 950-1000 | Transform to internal format | Data transformers | Medium |
| `handleStreamChunk()` | 1010-1060 | Process streaming chunks | Stream parsers | Medium |

#### Rate Limiting Functions
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|-----------------|--------------|------------|
| `checkRateLimit()` | 1070-1120 | Check if request allowed | Rate limit state | Low |
| `waitForRateLimit()` | 1130-1180 | Wait for rate limit reset | Timers | Medium |
| `updateRateLimitState()` | 1190-1230 | Update rate limit counters | State management | Low |
| `calculateBackoff()` | 1240-1280 | Calculate exponential backoff | Math utilities | Medium |

#### Retry Logic Functions
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|-----------------|--------------|------------|
| `retryWithBackoff()` | 1290-1380 | Retry failed requests | Backoff calculator, logger | High (nested loops) |
| `shouldRetry()` | 1390-1430 | Determine if retry needed | Error classifier | Medium |
| `handleRetryError()` | 1440-1480 | Handle retry failures | Error handler | Low |

#### Caching Functions
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|-----------------|--------------|------------|
| `getCachedResponse()` | 1490-1540 | Retrieve cached responses | Cache storage | Low |
| `setCachedResponse()` | 1550-1600 | Store responses in cache | Cache storage | Low |
| `generateCacheKey()` | 1610-1650 | Generate cache keys | Hashing utility | Low |
| `invalidateCache()` | 1660-1700 | Clear cache entries | Cache storage | Low |

#### Configuration Management Functions
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|-----------------|--------------|------------|
| `loadConfig()` | 1710-1780 | Load configuration | VS Code config API | Medium |
| `updateConfig()` | 1790-1840 | Update configuration | VS Code config API | Low |
| `validateConfig()` | 1850-1900 | Validate config values | Validators | Medium |
| `getProviderConfig()` | 1910-1960 | Get provider-specific config | Config store | Low |

#### Token Management Functions
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|-----------------|--------------|------------|
| `countTokens()` | 1970-2020 | Count tokens in text | Tokenizer library | Low |
| `estimateTokens()` | 2030-2070 | Estimate token count | Math utilities | Low |
| `truncateToTokenLimit()` | 2080-2140 | Truncate text to fit limit | Tokenizer, text utils | Medium |
| `optimizePromptSize()` | 2150-2220 | Optimize prompt for tokens | Token counter | Medium |

#### Error Handling Functions
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|-----------------|--------------|------------|
| `handleAPIError()` | 2230-2300 | Handle API errors | Logger, error formatter | High (many error types) |
| `classifyError()` | 2310-2360 | Classify error types | Error definitions | Medium |
| `formatErrorMessage()` | 2370-2420 | Format user-friendly errors | String templates | Low |
| `logError()` | 2430-2470 | Log errors | Logger | Low |

#### State Management Functions
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|-----------------|--------------|------------|
| `getState()` | 2480-2520 | Get current state | State store | Low |
| `setState()` | 2530-2570 | Update state | State store | Low |
| `resetState()` | 2580-2620 | Reset to initial state | State store | Low |

#### Utility Functions
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|-----------------|--------------|------------|
| `formatPrompt()` | 2630-2700 | Format prompts | String utils | Low |
| `sanitizeInput()` | 2710-2750 | Sanitize user input | Validators | Low |
| `buildHeaders()` | 2760-2800 | Build HTTP headers | Config | Low |
| (20+ more utility functions) | 2810-2942 | Various helpers | Various | Low-Medium |

---

### 2. Responsibility Analysis

#### API Communication Layer (8 functions, ~600 lines)
- `constructor()`, `callLLM()`, `callOpenAI()`, `callAnthropic()`, `streamResponse()`, `buildRequestPayload()`
- **Responsibility**: Direct communication with LLM providers
- **Extract Reason**: Provider-specific logic should be isolated

#### Response Processing Layer (5 functions, ~300 lines)
- `parseResponse()`, `extractContent()`, `validateResponse()`, `transformResponse()`, `handleStreamChunk()`
- **Responsibility**: Processing and validating API responses
- **Extract Reason**: Pure transformation logic, highly testable

#### Rate Limiting Layer (4 functions, ~220 lines)
- `checkRateLimit()`, `waitForRateLimit()`, `updateRateLimitState()`, `calculateBackoff()`
- **Responsibility**: Rate limit enforcement
- **Extract Reason**: Cross-cutting concern, reusable

#### Retry Logic Layer (3 functions, ~200 lines)
- `retryWithBackoff()`, `shouldRetry()`, `handleRetryError()`
- **Responsibility**: Retry mechanism
- **Extract Reason**: Complex stateful logic

#### Caching Layer (4 functions, ~220 lines)
- `getCachedResponse()`, `setCachedResponse()`, `generateCacheKey()`, `invalidateCache()`
- **Responsibility**: Response caching
- **Extract Reason**: Independent concern

#### Configuration Layer (4 functions, ~260 lines)
- `loadConfig()`, `updateConfig()`, `validateConfig()`, `getProviderConfig()`
- **Responsibility**: Configuration management
- **Extract Reason**: Cross-cutting concern

#### Token Management Layer (4 functions, ~270 lines)
- `countTokens()`, `estimateTokens()`, `truncateToTokenLimit()`, `optimizePromptSize()`
- **Responsibility**: Token counting and optimization
- **Extract Reason**: Reusable utility

#### Error Handling Layer (4 functions, ~250 lines)
- `handleAPIError()`, `classifyError()`, `formatErrorMessage()`, `logError()`
- **Responsibility**: Error management
- **Extract Reason**: Cross-cutting concern

---

### 3. Extraction Mapping

#### Extract Group 1: Provider Communication
**Extract to**: `src/ai/providers/BaseProviderClient.ts`, `src/ai/providers/OpenAIClient.ts`, `src/ai/providers/AnthropicClient.ts`

**Functions to Extract**:
- `callOpenAI()` (350-450): Provider-specific implementation
- `callAnthropic()` (460-560): Provider-specific implementation
- `streamResponse()` (570-650): Streaming logic
- `buildRequestPayload()` (660-720): Request construction

**Dependencies to Move**:
- Provider SDK imports (OpenAI, Anthropic)
- Request/response type definitions
- Provider-specific error handlers

**Dependencies to Inject**:
- Configuration (via constructor)
- Logger (via constructor)
- Rate limiter (via constructor parameter)

**Breaking Changes**:
- `callLLM()` will need to use factory pattern to get provider client
- Tests mocking OpenAI/Anthropic will need to mock new classes

---

#### Extract Group 2: Response Processing
**Extract to**: `src/ai/response/ResponseProcessor.ts`

**Functions to Extract**:
- `parseResponse()` (730-820): Response parsing
- `extractContent()` (830-880): Content extraction
- `validateResponse()` (890-940): Validation
- `transformResponse()` (950-1000): Transformation
- `handleStreamChunk()` (1010-1060): Stream handling

**Dependencies to Move**:
- JSON schema validators
- Response type definitions
- Transformation utilities

**Dependencies to Inject**:
- Schema definitions (via constructor)
- Logger (via constructor)

**Breaking Changes**:
- `callLLM()` will instantiate ResponseProcessor
- Tests will need to mock ResponseProcessor

---

#### Extract Group 3: Rate Limiting
**Extract to**: `src/ai/rateLimit/RateLimiter.ts`

**Functions to Extract**:
- `checkRateLimit()` (1070-1120): Rate check
- `waitForRateLimit()` (1130-1180): Wait logic
- `updateRateLimitState()` (1190-1230): State update
- `calculateBackoff()` (1240-1280): Backoff calculation

**Dependencies to Move**:
- Rate limit state storage
- Timer utilities
- Rate limit configuration

**Dependencies to Inject**:
- Configuration (via constructor)
- Clock (for testing)

**Breaking Changes**:
- `callLLM()` will call RateLimiter instance
- Rate limit state becomes encapsulated

---

#### Extract Group 4: Retry Logic
**Extract to**: `src/ai/retry/RetryHandler.ts`

**Functions to Extract**:
- `retryWithBackoff()` (1290-1380): Retry orchestration
- `shouldRetry()` (1390-1430): Retry decision
- `handleRetryError()` (1440-1480): Error handling

**Dependencies to Move**:
- Retry configuration
- Backoff calculator
- Error classifier

**Dependencies to Inject**:
- Configuration (via constructor)
- Logger (via constructor)
- Backoff strategy (via constructor)

**Breaking Changes**:
- `callLLM()` will wrap calls in RetryHandler
- Tests will mock RetryHandler

---

#### Extract Group 5: Caching
**Extract to**: `src/ai/cache/ResponseCache.ts`

**Functions to Extract**:
- `getCachedResponse()` (1490-1540): Cache retrieval
- `setCachedResponse()` (1550-1600): Cache storage
- `generateCacheKey()` (1610-1650): Key generation
- `invalidateCache()` (1660-1700): Cache invalidation

**Dependencies to Move**:
- Cache storage implementation
- Key generation utilities
- Cache expiration logic

**Dependencies to Inject**:
- Storage backend (via constructor)
- Configuration (via constructor)

**Breaking Changes**:
- `callLLM()` will check cache via ResponseCache
- Cache state becomes encapsulated

---

#### Extract Group 6: Token Management
**Extract to**: `src/ai/tokens/TokenManager.ts`

**Functions to Extract**:
- `countTokens()` (1970-2020): Token counting
- `estimateTokens()` (2030-2070): Estimation
- `truncateToTokenLimit()` (2080-2140): Truncation
- `optimizePromptSize()` (2150-2220): Optimization

**Dependencies to Move**:
- Tokenizer library
- Token limit configurations
- Text manipulation utilities

**Dependencies to Inject**:
- Tokenizer (via constructor)
- Configuration (via constructor)

**Breaking Changes**:
- Prompt building will use TokenManager
- Token limits managed externally

---

#### Extract Group 7: Configuration
**Extract to**: `src/ai/config/LLMConfiguration.ts`

**Functions to Extract**:
- `loadConfig()` (1710-1780): Config loading
- `updateConfig()` (1790-1840): Config updates
- `validateConfig()` (1850-1900): Validation
- `getProviderConfig()` (1910-1960): Provider config

**Dependencies to Move**:
- VS Code configuration API wrapper
- Config validators
- Default configurations

**Dependencies to Inject**:
- VS Code workspace configuration (via constructor)

**Breaking Changes**:
- Services will receive LLMConfiguration instance
- Configuration becomes immutable object

---

#### Extract Group 8: Error Handling
**Extract to**: `src/ai/errors/ErrorHandler.ts`

**Functions to Extract**:
- `handleAPIError()` (2230-2300): Error handling
- `classifyError()` (2310-2360): Classification
- `formatErrorMessage()` (2370-2420): Formatting
- `logError()` (2430-2470): Logging

**Dependencies to Move**:
- Error type definitions
- Error classification rules
- Error message templates

**Dependencies to Inject**:
- Logger (via constructor)
- User notification service (via constructor)

**Breaking Changes**:
- All error handling goes through ErrorHandler
- Error types become strongly typed

---

### 4. Step-by-Step Migration Instructions

---

## EXTRACTION 1: Provider Communication Layer

### Step 1: Create Base Provider Interface

**Create file**: `src/ai/providers/ILLMProvider.ts`

```typescript
import { ChatCompletionRequest, ChatCompletionResponse, StreamHandler } from '../types';

/**
 * Interface for LLM provider implementations
 */
export interface ILLMProvider {
  /**
   * Provider name (e.g., 'openai', 'anthropic')
   */
  readonly name: string;

  /**
   * Send a chat completion request
   */
  sendRequest(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  /**
   * Send a streaming chat completion request
   */
  sendStreamingRequest(
    request: ChatCompletionRequest,
    onChunk: StreamHandler
  ): Promise<ChatCompletionResponse>;

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Get provider-specific configuration
   */
  getConfig(): ProviderConfig;
}

export interface ProviderConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  baseURL?: string;
}

export interface ChatCompletionRequest {
  messages: Message[];
  model: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export type StreamHandler = (chunk: string) => void;
```

---

### Step 2: Create OpenAI Provider Implementation

**Create file**: `src/ai/providers/OpenAIProvider.ts`

```typescript
import OpenAI from 'openai';
import { 
  ILLMProvider, 
  ChatCompletionRequest, 
  ChatCompletionResponse, 
  StreamHandler,
  ProviderConfig 
} from './ILLMProvider';

export class OpenAIProvider implements ILLMProvider {
  readonly name = 'openai';
  private client: OpenAI;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL
    });
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && !!this.config.model;
  }

  getConfig(): ProviderConfig {
    return { ...this.config };
  }

  async sendRequest(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await this.client.chat.completions.create({
      model: request.model || this.config.model,
      messages: request.messages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      stream: false
    });

    return this.transformResponse(response);
  }

  async sendStreamingRequest(
    request: ChatCompletionRequest,
    onChunk: StreamHandler
  ): Promise<ChatCompletionResponse> {
    const stream = await this.client.chat.completions.create({
      model: request.model || this.config.model,
      messages: request.messages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      stream: true
    });

    let fullContent = '';
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        onChunk(content);
      }

      // Last chunk contains usage info
      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens
        };
      }
    }

    return {
      id: 'stream-completion',
      content: fullContent,
      model: request.model || this.config.model,
      usage,
      finishReason: 'stop'
    };
  }

  private transformResponse(response: OpenAI.ChatCompletion): ChatCompletionResponse {
    return {
      id: response.id,
      content: response.choices[0]?.message?.content || '',
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      finishReason: response.choices[0]?.finish_reason || 'stop'
    };
  }
}
```

---

### Step 3: Create Anthropic Provider Implementation

**Create file**: `src/ai/providers/AnthropicProvider.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { 
  ILLMProvider, 
  ChatCompletionRequest, 
  ChatCompletionResponse, 
  StreamHandler,
  ProviderConfig,
  Message
} from './ILLMProvider';

export class AnthropicProvider implements ILLMProvider {
  readonly name = 'anthropic';
  private client: Anthropic;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey
    });
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && !!this.config.model;
  }

  getConfig(): ProviderConfig {
    return { ...this.config };
  }

  async sendRequest(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const { system, messages } = this.convertMessages(request.messages);

    const response = await this.client.messages.create({
      model: request.model || this.config.model,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      system,
      messages
    });

    return this.transformResponse(response);
  }

  async sendStreamingRequest(
    request: ChatCompletionRequest,
    onChunk: StreamHandler
  ): Promise<ChatCompletionResponse> {
    const { system, messages } = this.convertMessages(request.messages);

    const stream = await this.client.messages.create({
      model: request.model || this.config.model,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      system,
      messages,
      stream: true
    });

    let fullContent = '';
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const content = event.delta.text || '';
        fullContent += content;
        onChunk(content);
      }

      if (event.type === 'message_start') {
        usage.promptTokens = event.message.usage.input_tokens;
      }

      if (event.type === 'message_delta') {
        usage.completionTokens = event.usage.output_tokens;
        usage.totalTokens = usage.promptTokens + usage.completionTokens;
      }
    }

    return {
      id: 'stream-completion',
      content: fullContent,
      model: request.model || this.config.model,
      usage,
      finishReason: 'stop'
    };
  }

  private convertMessages(messages: Message[]): { 
    system?: string; 
    messages: Anthropic.MessageParam[] 
  } {
    let system: string | undefined;
    const anthropicMessages: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = msg.content;
      } else {
        anthropicMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      }
    }

    return { system, messages: anthropicMessages };
  }

  private transformResponse(response: Anthropic.Message): ChatCompletionResponse {
    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as Anthropic.TextBlock).text)
      .join('');

    return {
      id: response.id,
      content,
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      finishReason: response.stop_reason || 'stop'
    };
  }
}
```

---

### Step 4: Create Provider Factory

**Create file**: `src/ai/providers/ProviderFactory.ts`

```typescript
import { ILLMProvider, ProviderConfig } from './ILLMProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';

export type ProviderType = 'openai' | 'anthropic';

export class ProviderFactory {
  private static providers: Map<string, ILLMProvider> = new Map();

  static createProvider(type: ProviderType, config: ProviderConfig): ILLMProvider {
    const cacheKey = `${type}-${config.apiKey.substring(0, 8)}`;
    
    // Return cached provider if exists
    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey)!;
    }

    let provider: ILLMProvider;

    switch (type) {
      case 'openai':
        provider = new OpenAIProvider(config);
        break;
      case 'anthropic':
        provider = new AnthropicProvider(config);
        break;
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }

    this.providers.set(cacheKey, provider);
    return provider;
  }

  static clearCache(): void {
    this.providers.clear();
  }
}
```

---

### Step 5: Update Source File (llmService.ts)

**Before (lines 97-560)**:
```typescript
export class LLMService {
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;
  private config: LLMConfig;

  constructor(context: vscode.ExtensionContext) {
    this.config = this.loadConfig();
    
    if (this.config.provider === 'openai') {
      this.openaiClient = new OpenAI({
        apiKey: this.config.apiKey
      });
    } else {
      this.anthropicClient = new Anthropic({
        apiKey: this.config.apiKey
      });
    }
  }

  async callLLM(prompt: string): Promise<string> {
    // ... 200+ lines of provider-specific logic
    if (this.config.provider === 'openai') {
      return await this.callOpenAI(prompt);
    } else {
      return await this.callAnthropic(prompt);
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    // ... 100+ lines of OpenAI-specific code
  }

  private async callAnthropic(prompt: string): Promise<string> {
    // ... 100+ lines of Anthropic-specific code
  }

  private async streamResponse(): Promise<void> {
    // ... 80+ lines of streaming logic
  }
}
```

**After**:
```typescript
import { ProviderFactory, ProviderType } from './ai/providers/ProviderFactory';
import { ILLMProvider, ChatCompletionRequest } from './ai/providers/ILLMProvider';
import { LLMConfiguration } from './ai/config/LLMConfiguration';

export class LLMService {
  private provider: ILLMProvider;
  private config: LLMConfiguration;

  constructor(context: vscode.ExtensionContext, config: LLMConfiguration) {
    this.config = config;
    
    // Create provider using factory
    this.provider = ProviderFactory.createProvider(
      config.getProviderType(),
      config.getProviderConfig()
    );
  }

  async callLLM(prompt: string): Promise<string> {
    // Validate provider configuration
    if (!this.provider.isConfigured()) {
      throw new Error(`${this.provider.name} provider is not properly configured`);
    }

    // Build request
    const request: ChatCompletionRequest = {
      messages: [
        { role: 'system', content: 'You are a helpful code analysis assistant.' },
        { role: 'user', content: prompt }
      ],
      model: this.config.getModel(),
      maxTokens: this.config.getMaxTokens(),
      temperature: this.config.getTemperature()
    };

    // Send request through provider
    const response = await this.provider.sendRequest(request);
    
    return response.content;
  }

  async streamLLM(prompt: string, onChunk: (chunk: string) => void): Promise<string> {
    if (!this.provider.isConfigured()) {
      throw new Error(`${this.provider.name} provider is not properly configured`);
    }

    const request: ChatCompletionRequest = {
      messages: [
        { role: 'system', content: 'You are a helpful code analysis assistant.' },
        { role: 'user', content: prompt }
      ],
      model: this.config.getModel(),
      maxTokens: this.config.getMaxTokens(),
      temperature: this.config.getTemperature(),
      stream: true
    };

    const response = await this.provider.sendStreamingRequest(request, onChunk);
    
    return response.content;
  }
}
```

**Lines Removed**: ~460 lines of provider-specific code
**Lines Added**: ~50 lines of orchestration code
**Net Reduction**: ~410 lines

---

### Step 6: Update Dependent Files

#### File: `src/llmIntegration.ts`

**Before** (lines 30-52):
```typescript
async function initializeLLMService(context: vscode.ExtensionContext): Promise<LLMService> {
  const llmService = new LLMService(context);
  
  // Test connection
  try {
    await llmService.callLLM('test');
  } catch (error) {
    vscode.window.showErrorMessage('Failed to initialize LLM service');
    throw error;
  }
  
  return llmService;
}
```

**After**:
```typescript
import { LLMConfiguration } from './ai/config/LLMConfiguration';

async function initializeLLMService(context: vscode.ExtensionContext): Promise<LLMService> {
  // Load configuration first
  const config = new LLMConfiguration(context);
  await config.load();
  
  // Create service with configuration
  const llmService = new LLMService(context, config);
  
  // Test connection
  try {
    await llmService.callLLM('test');
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to initialize LLM service: ${error.message}`);
    throw error;
  }
  
  return llmService;
}
```

---

#### File: `src/extension.ts`

**Before** (lines 38-92):
```typescript
export async function activate(context: vscode.ExtensionContext) {
  const llmService = new LLMService(context);
  
  // Register commands...
}
```

**After**:
```typescript
import { LLMConfiguration } from './ai/config/LLMConfiguration';

export async function activate(context: vscode.ExtensionContext