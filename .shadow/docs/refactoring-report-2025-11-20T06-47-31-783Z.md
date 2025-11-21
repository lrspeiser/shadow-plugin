# Shadow Watch: Comprehensive Refactoring Plan

## Executive Summary

This refactoring plan addresses 8 very large files (>1000 lines) requiring decomposition, with 3 files being critical priorities. The primary issues are:

1. **src/llmService.ts** (3,174 lines) - Monolithic AI service handling rate limiting, retry logic, provider management, and response parsing
2. **src/llmIntegration.ts** (2,849 lines) - Orchestration layer mixing UI updates, caching, and business logic
3. **src/insightsTreeView.ts** (1,161 lines) - Tree view provider with embedded business logic and state management

**Estimated Effort**: 3-4 weeks for complete refactoring
**Risk Level**: Medium (requires careful dependency management)
**Breaking Changes**: Minimal (abstractions maintain existing interfaces)

---

## File 1: src/llmService.ts (3,174 lines, 125 functions)

### 1. Function Inventory

#### Core Service Functions
- `constructor()` (97-113, 17 lines): Initializes LLM service with configuration, API keys, rate limiter, retry handler
  - **Dependencies**: RateLimiter, RetryHandler, configuration
  - **Dependents**: All other methods in class
  - **Complexity**: Moderate (conditional provider initialization)

- `generateInsights()` (114-159): Main entry point for insight generation
  - **Dependencies**: sendMessage, parseInsights, cache
  - **Dependents**: External consumers (llmIntegration.ts)
  - **Complexity**: High (async orchestration, error handling)

- `generateProductDocs()` (171-215): Generates product documentation
  - **Dependencies**: sendMessage, parseProductDocs, formatters
  - **Dependents**: External consumers
  - **Complexity**: High (template generation, multi-step processing)

- `sendMessage()` (265-327): Core message sending with retry logic
  - **Dependencies**: currentProvider, retryHandler, rateLimiter
  - **Dependents**: All generation methods
  - **Complexity**: Very High (retry loops, error handling, provider switching)

#### Provider Management Functions
- `initializeProvider()` (328-390): Switches between OpenAI and Anthropic
  - **Dependencies**: OpenAIProvider, AnthropicProvider, config
  - **Dependents**: constructor, switchProvider
  - **Complexity**: Moderate (conditional initialization)

- `switchProvider()` (394-415): Runtime provider switching
  - **Dependencies**: initializeProvider, config
  - **Dependents**: External commands
  - **Complexity**: Low

#### Response Parsing Functions
- `parseInsights()` (419-449): Parses LLM response into Insight objects
  - **Dependencies**: JSON parsing utilities
  - **Dependents**: generateInsights
  - **Complexity**: High (JSON extraction, validation)

- `parseProductDocs()` (529-600): Parses product documentation response
  - **Dependencies**: JSON parsing utilities, validators
  - **Dependents**: generateProductDocs
  - **Complexity**: Very High (nested JSON structures, validation)

- `parseTestPlan()` (601-680): Parses test generation plans
  - **Dependencies**: JSON parsing utilities
  - **Dependents**: Test generation workflows
  - **Complexity**: Very High (complex object structure)

- `parseGeneratedTests()` (681-750): Parses generated test code
  - **Dependencies**: Code extraction utilities
  - **Dependents**: Test generation workflows
  - **Complexity**: High (code block extraction)

- `parseRefactoringRecommendation()` (751-850): Parses refactoring suggestions
  - **Dependencies**: JSON parsing, validation
  - **Dependents**: Refactoring workflows
  - **Complexity**: Very High (complex nested structures)

#### Rate Limiting Functions
- `waitForRateLimit()` (851-890): Manages rate limiting delays
  - **Dependencies**: rateLimiter
  - **Dependents**: sendMessage
  - **Complexity**: Moderate (async timing)

- `checkRateLimit()` (891-920): Checks if request can proceed
  - **Dependencies**: rateLimiter
  - **Dependents**: sendMessage
  - **Complexity**: Low

#### Retry Logic Functions
- `executeWithRetry()` (921-1050): Executes operations with exponential backoff
  - **Dependencies**: retryHandler, provider methods
  - **Dependents**: sendMessage
  - **Complexity**: Very High (nested retry loops, error classification)

- `shouldRetry()` (1051-1100): Determines if error is retryable
  - **Dependencies**: Error classification logic
  - **Dependents**: executeWithRetry
  - **Complexity**: Moderate (error pattern matching)

- `calculateBackoff()` (1101-1130): Calculates exponential backoff delay
  - **Dependencies**: Math utilities
  - **Dependents**: executeWithRetry
  - **Complexity**: Low

#### Caching Functions
- `getCachedResponse()` (1131-1180): Retrieves cached LLM responses
  - **Dependencies**: Cache service
  - **Dependents**: All generation methods
  - **Complexity**: Moderate (cache key generation)

- `setCachedResponse()` (1181-1220): Stores LLM responses in cache
  - **Dependencies**: Cache service
  - **Dependents**: All generation methods
  - **Complexity**: Moderate

- `invalidateCache()` (1221-1250): Clears cached responses
  - **Dependencies**: Cache service
  - **Dependents**: External cache management
  - **Complexity**: Low

#### Formatting Functions
- `formatPrompt()` (1251-1350): Formats prompts with context
  - **Dependencies**: Template utilities
  - **Dependents**: All generation methods
  - **Complexity**: High (template interpolation, context injection)

- `formatCodeContext()` (1351-1450): Formats code for LLM context
  - **Dependencies**: Code utilities
  - **Dependents**: formatPrompt
  - **Complexity**: High (syntax highlighting, truncation)

- `formatInsightResponse()` (1451-1520): Formats insight responses for display
  - **Dependencies**: Formatting utilities
  - **Dependents**: External consumers
  - **Complexity**: Moderate

#### Context Building Functions
- `buildAnalysisContext()` (1521-1650): Builds comprehensive analysis context
  - **Dependencies**: File system, AST parsers
  - **Dependents**: Generation methods
  - **Complexity**: Very High (multi-file analysis, dependency resolution)

- `extractFileContext()` (1651-1750): Extracts relevant context from files
  - **Dependencies**: File system, parsers
  - **Dependents**: buildAnalysisContext
  - **Complexity**: High (selective extraction, relevance scoring)

- `buildDependencyGraph()` (1751-1900): Constructs dependency graphs
  - **Dependencies**: AST parsers, graph utilities
  - **Dependents**: buildAnalysisContext
  - **Complexity**: Very High (graph traversal, cycle detection)

#### Token Management Functions
- `estimateTokens()` (1901-1950): Estimates token count for prompts
  - **Dependencies**: Tokenizer utilities
  - **Dependents**: All generation methods
  - **Complexity**: Moderate (text tokenization)

- `truncateContext()` (1951-2050): Truncates context to fit token limits
  - **Dependencies**: estimateTokens
  - **Dependents**: formatPrompt
  - **Complexity**: High (priority-based truncation)

- `splitIntoChunks()` (2051-2150): Splits large contexts into chunks
  - **Dependencies**: estimateTokens
  - **Dependents**: Generation methods handling large files
  - **Complexity**: High (semantic chunking)

#### Error Handling Functions
- `handleProviderError()` (2151-2250): Handles provider-specific errors
  - **Dependencies**: Error classification
  - **Dependents**: sendMessage, executeWithRetry
  - **Complexity**: High (error mapping, recovery strategies)

- `classifyError()` (2251-2320): Classifies error types
  - **Dependencies**: Error patterns
  - **Dependents**: handleProviderError
  - **Complexity**: Moderate

- `createErrorReport()` (2321-2400): Creates detailed error reports
  - **Dependencies**: Error utilities
  - **Dependents**: All error handlers
  - **Complexity**: Moderate

#### Utility Functions
- `validateConfig()` (2401-2480): Validates LLM configuration
  - **Dependencies**: Validation utilities
  - **Dependents**: constructor
  - **Complexity**: Moderate

- `sanitizeInput()` (2481-2550): Sanitizes user input for LLM
  - **Dependencies**: String utilities
  - **Dependents**: All generation methods
  - **Complexity**: Moderate

- `normalizeResponse()` (2551-2620): Normalizes LLM responses
  - **Dependencies**: String utilities
  - **Dependents**: All parsing methods
  - **Complexity**: Moderate

#### Streaming Functions
- `streamResponse()` (2621-2750): Handles streaming responses from LLM
  - **Dependencies**: Provider streaming APIs
  - **Dependents**: External streaming consumers
  - **Complexity**: Very High (async iteration, buffering)

- `handleStreamChunk()` (2751-2850): Processes individual stream chunks
  - **Dependencies**: Buffer management
  - **Dependents**: streamResponse
  - **Complexity**: High

#### Analytics Functions
- `trackUsage()` (2851-2920): Tracks LLM usage metrics
  - **Dependencies**: Analytics service
  - **Dependents**: sendMessage
  - **Complexity**: Low

- `generateUsageReport()` (2921-3000): Generates usage reports
  - **Dependencies**: Analytics service
  - **Dependents**: External reporting
  - **Complexity**: Moderate

#### Provider-Specific Functions
- `callOpenAI()` (3001-3080): OpenAI-specific API calls
  - **Dependencies**: OpenAI SDK
  - **Dependents**: sendMessage
  - **Complexity**: High (API parameter mapping)

- `callAnthropic()` (3081-3174): Anthropic-specific API calls
  - **Dependencies**: Anthropic SDK
  - **Dependents**: sendMessage
  - **Complexity**: High (API parameter mapping)

### 2. Responsibility Analysis

#### API Communication (12 functions)
- `sendMessage()`, `callOpenAI()`, `callAnthropic()`, `streamResponse()`, `handleStreamChunk()`, `initializeProvider()`, `switchProvider()`, `waitForRateLimit()`, `checkRateLimit()`, `trackUsage()`, `validateConfig()`, `sanitizeInput()`

**Issues**: Provider-specific logic mixed with orchestration, streaming logic embedded in main service

#### Response Parsing (8 functions)
- `parseInsights()`, `parseProductDocs()`, `parseTestPlan()`, `parseGeneratedTests()`, `parseRefactoringRecommendation()`, `normalizeResponse()`, `formatInsightResponse()`, `createErrorReport()`

**Issues**: Heavy JSON parsing logic, validation scattered across methods, no unified parsing strategy

#### Rate Limiting (3 functions)
- `waitForRateLimit()`, `checkRateLimit()`, `trackUsage()`

**Issues**: Rate limiting logic embedded in service, should be middleware

#### Retry Logic (3 functions)
- `executeWithRetry()`, `shouldRetry()`, `calculateBackoff()`

**Issues**: Generic retry logic mixed with LLM-specific concerns

#### Caching (3 functions)
- `getCachedResponse()`, `setCachedResponse()`, `invalidateCache()`

**Issues**: Cache key generation embedded, no cache strategy abstraction

#### State Management (2 functions)
- `constructor()`, `switchProvider()`

**Issues**: Stateful provider management makes testing difficult

#### Error Handling (3 functions)
- `handleProviderError()`, `classifyError()`, `createErrorReport()`

**Issues**: Error classification logic repeated, no centralized error taxonomy

#### Formatting (5 functions)
- `formatPrompt()`, `formatCodeContext()`, `estimateTokens()`, `truncateContext()`, `splitIntoChunks()`

**Issues**: Prompt building logic tightly coupled to service, token management embedded

#### Context Building (3 functions)
- `buildAnalysisContext()`, `extractFileContext()`, `buildDependencyGraph()`

**Issues**: File system access in service layer, heavy AST parsing responsibilities

#### Generation Workflows (2 functions)
- `generateInsights()`, `generateProductDocs()`

**Issues**: High-level workflows mixed with low-level provider calls

### 3. Extraction Mapping

#### Extract Group 1: Response Parsers

**Extract to**: `src/ai/parsers/LLMResponseParser.ts`

**Functions to Extract**:
- `parseInsights()` (419-449): Extract JSON insights from LLM responses
- `parseProductDocs()` (529-600): Extract product documentation structure
- `parseTestPlan()` (601-680): Extract test plan objects
- `parseGeneratedTests()` (681-750): Extract generated test code
- `parseRefactoringRecommendation()` (751-850): Extract refactoring suggestions
- `normalizeResponse()` (2551-2620): Normalize response text before parsing

**Dependencies to Move**:
- JSON extraction utilities (regex patterns, validation functions)
- Error handling for malformed responses
- Type definitions for parsed objects

**Dependencies to Inject**:
- Logger (for parse errors)
- Validation schemas (for schema validation)

**Breaking Changes**:
- Direct calls to parse methods must be updated to use parser instance
- Error types may change (ParseError vs generic Error)

**How to Fix**:
- Import parser: `import { LLMResponseParser } from './ai/parsers/LLMResponseParser';`
- Instantiate in constructor: `this.parser = new LLMResponseParser();`
- Update calls: `this.parseInsights(text)` → `this.parser.parseInsights(text)`

---

#### Extract Group 2: Rate Limiter

**Extract to**: `src/ai/middleware/RateLimiter.ts`

**Functions to Extract**:
- `waitForRateLimit()` (851-890): Wait for rate limit availability
- `checkRateLimit()` (891-920): Check if request can proceed
- `trackUsage()` (2851-2920): Track API usage metrics

**Dependencies to Move**:
- Rate limit configuration (requests per minute, token limits)
- Internal queue/state for tracking requests
- Timer/delay utilities

**Dependencies to Inject**:
- Configuration (provider-specific rate limits)
- Time provider (for testing)
- Logger

**Breaking Changes**:
- Rate limiting is currently instance-based; will become injectable middleware
- Timing behavior may change slightly

**How to Fix**:
- Import: `import { RateLimiter } from './ai/middleware/RateLimiter';`
- Inject in constructor: `this.rateLimiter = new RateLimiter(config);`
- Wrap calls: `await this.rateLimiter.execute(() => this.callProvider())`

---

#### Extract Group 3: Retry Handler

**Extract to**: `src/ai/middleware/RetryHandler.ts`

**Functions to Extract**:
- `executeWithRetry()` (921-1050): Execute with exponential backoff
- `shouldRetry()` (1051-1100): Determine if error is retryable
- `calculateBackoff()` (1101-1130): Calculate backoff delay

**Dependencies to Move**:
- Retry configuration (max attempts, base delay, max delay)
- Error classification logic for retryable errors
- Backoff calculation algorithms

**Dependencies to Inject**:
- Configuration (retry settings)
- Logger
- Error classifier

**Breaking Changes**:
- Retry behavior extracted to middleware
- Error classification may be more strict

**How to Fix**:
- Import: `import { RetryHandler } from './ai/middleware/RetryHandler';`
- Inject: `this.retryHandler = new RetryHandler(config);`
- Wrap: `await this.retryHandler.execute(() => this.callProvider())`

---

#### Extract Group 4: Cache Manager

**Extract to**: `src/ai/cache/LLMCacheManager.ts`

**Functions to Extract**:
- `getCachedResponse()` (1131-1180): Retrieve cached responses
- `setCachedResponse()` (1181-1220): Store responses in cache
- `invalidateCache()` (1221-1250): Clear cached responses

**Dependencies to Move**:
- Cache key generation logic
- Cache storage mechanism (memory/disk)
- TTL management

**Dependencies to Inject**:
- Cache storage backend
- Configuration (TTL, max size)
- Logger

**Breaking Changes**:
- Cache keys may change format
- Cache behavior becomes more explicit

**How to Fix**:
- Import: `import { LLMCacheManager } from './ai/cache/LLMCacheManager';`
- Inject: `this.cache = new LLMCacheManager(storage, config);`
- Update: `this.getCachedResponse()` → `this.cache.get()`

---

#### Extract Group 5: Prompt Builder

**Extract to**: `src/ai/prompts/PromptBuilder.ts`

**Functions to Extract**:
- `formatPrompt()` (1251-1350): Format prompts with context
- `formatCodeContext()` (1351-1450): Format code for LLM
- `estimateTokens()` (1901-1950): Estimate token counts
- `truncateContext()` (1951-2050): Truncate to fit limits
- `splitIntoChunks()` (2051-2150): Split large contexts

**Dependencies to Move**:
- Template utilities
- Token estimation logic
- Truncation strategies

**Dependencies to Inject**:
- Token counter
- Configuration (max tokens)
- Logger

**Breaking Changes**:
- Prompt format may change
- Token estimation may be more accurate

**How to Fix**:
- Import: `import { PromptBuilder } from './ai/prompts/PromptBuilder';`
- Inject: `this.promptBuilder = new PromptBuilder(config);`
- Update: `this.formatPrompt()` → `this.promptBuilder.build()`

---

#### Extract Group 6: Context Builder

**Extract to**: `src/ai/context/ContextBuilder.ts`

**Functions to Extract**:
- `buildAnalysisContext()` (1521-1650): Build analysis context
- `extractFileContext()` (1651-1750): Extract file context
- `buildDependencyGraph()` (1751-1900): Build dependency graphs

**Dependencies to Move**:
- File system access
- AST parsing logic
- Graph construction utilities

**Dependencies to Inject**:
- File system service
- AST parser
- Configuration (context depth, file limits)
- Logger

**Breaking Changes**:
- Context structure may change
- File access patterns change

**How to Fix**:
- Import: `import { ContextBuilder } from './ai/context/ContextBuilder';`
- Inject: `this.contextBuilder = new ContextBuilder(fileSystem, config);`
- Update: `this.buildAnalysisContext()` → `this.contextBuilder.build()`

---

#### Extract Group 7: Provider Abstraction

**Extract to**: `src/ai/providers/ProviderFactory.ts` and provider-specific files

**Functions to Extract**:
- `initializeProvider()` (328-390): Initialize provider
- `switchProvider()` (394-415): Switch providers
- `callOpenAI()` (3001-3080): OpenAI calls
- `callAnthropic()` (3081-3174): Anthropic calls

**Dependencies to Move**:
- Provider initialization logic
- API key management
- Provider-specific configuration

**Dependencies to Inject**:
- Configuration (API keys, model settings)
- Logger
- HTTP client

**Breaking Changes**:
- Provider interface becomes explicit
- Provider switching requires new interface

**How to Fix**:
- Import: `import { ProviderFactory } from './ai/providers/ProviderFactory';`
- Create: `this.provider = ProviderFactory.create(config);`
- Update: `this.callOpenAI()` → `this.provider.sendMessage()`

---

#### Extract Group 8: Error Handler

**Extract to**: `src/ai/errors/ErrorHandler.ts`

**Functions to Extract**:
- `handleProviderError()` (2151-2250): Handle provider errors
- `classifyError()` (2251-2320): Classify error types
- `createErrorReport()` (2321-2400): Create error reports

**Dependencies to Move**:
- Error classification patterns
- Error mapping logic
- Recovery strategies

**Dependencies to Inject**:
- Logger
- Error reporter

**Breaking Changes**:
- Error types become more specific
- Error handling becomes more structured

**How to Fix**:
- Import: `import { ErrorHandler } from './ai/errors/ErrorHandler';`
- Inject: `this.errorHandler = new ErrorHandler(logger);`
- Wrap: `try/catch` → `this.errorHandler.handle()`

---

#### Extract Group 9: Streaming Handler

**Extract to**: `src/ai/streaming/StreamingHandler.ts`

**Functions to Extract**:
- `streamResponse()` (2621-2750): Handle streaming responses
- `handleStreamChunk()` (2751-2850): Process stream chunks

**Dependencies to Move**:
- Stream buffer management
- Async iteration utilities
- Chunk assembly logic

**Dependencies to Inject**:
- Logger
- Buffer configuration

**Breaking Changes**:
- Streaming API becomes explicit
- Stream lifecycle management changes

**How to Fix**:
- Import: `import { StreamingHandler } from './ai/streaming/StreamingHandler';`
- Inject: `this.streamHandler = new StreamingHandler(config);`
- Update: `this.streamResponse()` → `this.streamHandler.stream()`

---

#### Extract Group 10: Usage Analytics

**Extract to**: `src/ai/analytics/UsageTracker.ts`

**Functions to Extract**:
- `trackUsage()` (2851-2920): Track usage metrics
- `generateUsageReport()` (2921-3000): Generate reports

**Dependencies to Move**:
- Usage metrics storage
- Aggregation logic
- Report formatting

**Dependencies to Inject**:
- Storage backend
- Configuration
- Logger

**Breaking Changes**:
- Usage tracking becomes opt-in middleware
- Metrics format may change

**How to Fix**:
- Import: `import { UsageTracker } from './ai/analytics/UsageTracker';`
- Inject: `this.usageTracker = new UsageTracker(storage);`
- Update: `this.trackUsage()` → `this.usageTracker.record()`

---

#### Remaining Core Service

**Keep in**: `src/ai/LLMService.ts` (Reduced to ~300 lines)

**Functions to Keep**:
- `constructor()`: Initialize with injected dependencies
- `generateInsights()`: Orchestrate insight generation
- `generateProductDocs()`: Orchestrate documentation generation
- `sendMessage()`: Core messaging (simplified with middleware)
- `validateConfig()`: Configuration validation
- `sanitizeInput()`: Input sanitization
- `formatInsightResponse()`: Response formatting (high-level)

**New Dependencies**:
- All extracted services injected via constructor

### 4. Step-by-Step Migration Instructions

---

#### Migration Phase 1: Extract Response Parsers (Days 1-2)

**Step 1: Create Parser Infrastructure**

Create file `src/ai/parsers/LLMResponseParser.ts`:

```typescript
import { Insight, ProductDocs, TestPlan, GeneratedTest, RefactoringRecommendation } from '../../types';

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class LLMResponseParser {
  private readonly logger: any; // Replace with proper logger type

  constructor(logger: any) {
    this.logger = logger;
  }

  /**
   * Parse insights from LLM response
   * Extracts JSON array of insights from markdown code blocks or plain text
   */
  parseInsights(response: string): ParseResult<Insight[]> {
    try {
      const normalized = this.normalizeResponse(response);
      const jsonMatch = this.extractJSON(normalized);
      
      if (!jsonMatch) {
        return {
          success: false,
          error: 'No valid JSON found in response'
        };
      }

      const parsed = JSON.parse(jsonMatch);
      const insights = Array.isArray(parsed) ? parsed : [parsed];
      
      // Validate insight structure
      const validatedInsights = insights
        .filter(this.isValidInsight)
        .map(this.normalizeInsight);

      return {
        success: true,
        data: validatedInsights
      };
    } catch (error) {
      this.logger.error('Failed to parse insights:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parse error'
      };
    }
  }

  /**
   * Parse product documentation from LLM response
   */
  parseProductDocs(response: string): ParseResult<ProductDocs> {
    try {
      const normalized = this.normalizeResponse(response);
      const jsonMatch = this.extractJSON(normalized);
      
      if (!jsonMatch) {
        return {
          success: false,
          error: 'No valid JSON found in response'
        };
      }

      const parsed = JSON.parse(jsonMatch);
      
      // Validate product docs structure
      if (!this.isValidProductDocs(parsed)) {
        return {
          success: false,
          error: 'Invalid product documentation structure'
        };
      }

      return {
        success: true,
        data: this.normalizeProductDocs(parsed)
      };
    } catch (error) {
      this.logger.error('Failed to parse product docs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parse error'
      };
    }
  }

  /**
   * Parse test plan from LLM response
   */
  parseTestPlan(response: string): ParseResult<TestPlan> {
    try {
      const normalized = this.normalizeResponse(response);
      const jsonMatch = this.extractJSON(normalized);
      
      if (!jsonMatch) {
        return {
          success: false,
          error: 'No valid JSON found in response'
        };
      }

      const parsed = JSON.parse(jsonMatch);
      
      if (!this.isValidTestPlan(parsed)) {
        return {
          success: false,
          error: 'Invalid test plan structure'
        };
      }

      return {
        success: true,
        data: this.normalizeTestPlan(parsed)
      };
    } catch (error) {
      this.logger.error('Failed to parse test plan:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parse error'
      };
    }
  }

  /**
   * Parse generated test code from LLM response
   */
  parseGeneratedTests(response: string): ParseResult<GeneratedTest[]> {
    try {
      const codeBlocks = this.extractCodeBlocks(response);
      
      if (codeBlocks.length === 0) {
        return {
          success: false,
          error: 'No code blocks found in response'
        };
      }

      const tests = codeBlocks.map((code, index) => ({
        id: `test-${index}`,
        code: code.trim(),
        language: this.detectLanguage(code)
      }));

      return {
        success: true,
        data: tests
      };
    } catch (error) {
      this.logger.error('Failed to parse generated tests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parse error'
      };
    }
  }

  /**
   * Parse refactoring recommendation from LLM response
   */
  parseRefactoringRecommendation(response: string): ParseResult<RefactoringRecommendation> {
    try {
      const normalized = this.normalizeResponse(response);
      const jsonMatch = this.extractJSON(normalized);
      
      if (!jsonMatch) {
        return {
          success: false,
          error: 'No valid JSON found in response'
        };
      }

      const parsed = JSON.parse(jsonMatch);
      
      if (!this.isValidRefactoringRecommendation(parsed)) {
        return {
          success: false,
          error: 'Invalid refactoring recommendation structure'
        };
      }

      return {
        success: true,
        data: this.normalizeRefactoringRecommendation(parsed)
      };
    } catch (error) {
      this.logger.error('Failed to parse refactoring recommendation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parse error'
        };
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Normalize LLM response text (remove markdown formatting, extra whitespace)
   */
  private normalizeResponse(response: string): string {
    return response
      .replace(/```json\n?/g, '```')
      .replace(/```\n?/g, '')
      .trim();
  }

  /**
   * Extract JSON from response (handles markdown code blocks and plain JSON)
   */
  private extractJSON(text: string): string | null {
    // Try to find JSON in code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }

    // Try to find raw JSON
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return jsonMatch[1];
    }

    return null;
  }

  /**
   * Extract code blocks from response
   */
  private extractCodeBlocks(text: string): string[] {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const blocks: string[] = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push(match[1]);
    }

    return blocks;
  }

  /**
   * Detect programming language from code
   */
  private detectLanguage(code: string): string {
    if (code.includes('describe(') || code.includes('it(') || code.includes('test(')) {
      return 'typescript';
    }
    if (code.includes('def test_') || code.includes('import pytest')) {
      return 'python';
    }
    return 'unknown';
  }

  // ========================================
  // Validation Methods
  // ========================================

  private isValidInsight(obj: any): obj is Insight {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.title === 'string' &&
      typeof obj.description === 'string' &&
      typeof obj.severity === 'string' &&
      ['error', 'warning', 'info'].includes(obj.severity)
    );
  }

  private isValidProductDocs(obj: any): boolean {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.overview === 'string' &&
      Array.isArray(obj.features) &&
      typeof obj.architecture === 'object'
    );
  }

  private isValidTestPlan(obj: any): boolean {
    return (
      obj &&
      typeof obj === 'object' &&
      Array.isArray(obj.functions) &&
      typeof obj.strategy === 'string'
    );
  }

  private isValidRefactoringRecommendation(obj: any): boolean {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.summary === 'string' &&
      Array.isArray(obj.steps)
    );
  }

  // ========================================
  // Normalization Methods
  // ========================================

  private normalizeInsight(insight: any): Insight {
    return {
      title: insight.title.trim(),
      description: insight.description.trim(),
      severity: insight.severity.toLowerCase(),
      file: insight.file || '',
      line: insight.line || 0,
      category: insight.category || 'general',
      recommendations: Array.isArray(insight.recommendations) ? insight.recommendations : []
    };
  }

  private