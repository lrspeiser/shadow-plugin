# COMPREHENSIVE REFACTORING REPORT
# Shadow Watch VS Code Extension

## Executive Summary

This report provides detailed, actionable refactoring plans for 8 files exceeding 1000 lines in the Shadow Watch codebase. The analysis focuses on decomposing large files while maintaining architectural integrity, following Clean Architecture and Layered Architecture patterns already established in the codebase.

**Critical Files Requiring Immediate Attention:**
1. `src/llmService.ts` (3,188 lines) - Core AI integration service
2. `src/llmIntegration.ts` (2,761 lines) - LLM orchestration layer
3. `src/insightsTreeView.ts` (1,161 lines) - UI tree view provider
4. `src/productNavigator.ts` (1,094 lines) - Product navigation service
5. `src/domain/prompts/promptBuilder.ts` (1,014 lines) - Prompt engineering
6. `src/analysis/enhancedAnalyzer.ts` (871 lines) - Code analysis engine
7. `src/insightsViewer.ts` (778 lines) - Insights display service
8. `src/extension.ts` (724 lines) - Extension entry point

**Excluded from detailed analysis:**
- `shadow-watch-1.0.0.vsix` (7,582 lines) - Binary package file
- `package-lock.json` (4,906 lines) - Dependency lock file
- `shadow-watch.vsix` (1,782 lines) - Binary package file
- `REFACTORING_PLAN.md` (532 lines) - Documentation
- `TEST_GENERATION_ENHANCEMENT_PLAN.md` (517 lines) - Documentation

---

## File 1: src/llmService.ts (3,188 lines, 122 functions)

### 1. Function Inventory

#### Core LLM Service Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `constructor()` | 97-113 | Initialize service with configuration | ConfigManager, RateLimiter, RetryHandler | All public methods | Medium (conditional provider setup) |
| `generateResponse()` | 115-180 | Generate text response from LLM | Provider, RateLimiter, RetryHandler | User-facing commands | High (error handling, retries, rate limiting) |
| `generateJSONResponse()` | 182-250 | Generate structured JSON response | Provider, RateLimiter, RetryHandler, ResponseParser | Analysis functions | High (parsing, validation, error recovery) |
| `generateStreamingResponse()` | 252-320 | Stream response from LLM | Provider, RateLimiter | Real-time features | High (async streams, error handling) |

#### Provider Management Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `setProvider()` | 322-360 | Switch LLM provider | OpenAIProvider, ClaudeProvider, ConfigManager | Settings change handler | Medium (provider instantiation) |
| `getCurrentProvider()` | 362-370 | Get active provider name | None | Status display | Low |
| `validateProvider()` | 372-420 | Check provider credentials | Provider API | Configuration validation | High (async validation, error handling) |
| `getProviderCapabilities()` | 422-450 | Return provider features | Provider | Feature detection | Low |

#### Rate Limiting Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `checkRateLimit()` | 452-480 | Verify request can proceed | RateLimiter | All request methods | Medium (threshold checks) |
| `waitForRateLimit()` | 482-510 | Delay until rate limit clears | RateLimiter | Request retry logic | Medium (async delays) |
| `getRateLimitStatus()` | 512-530 | Get current rate limit state | RateLimiter | Status display | Low |
| `resetRateLimits()` | 532-545 | Clear rate limit counters | RateLimiter | Manual reset | Low |

#### Response Processing Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `parseJSONResponse()` | 547-620 | Extract JSON from response | ResponseParser | generateJSONResponse | High (regex parsing, error recovery) |
| `validateResponseSchema()` | 622-680 | Check response structure | Schema validators | All JSON responses | High (recursive validation) |
| `extractCodeBlocks()` | 682-730 | Parse markdown code blocks | None | Documentation generation | Medium (regex parsing) |
| `sanitizeResponse()` | 732-760 | Clean response text | None | All responses | Low |

#### Caching Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `getCachedResponse()` | 762-800 | Retrieve cached result | Cache storage | All request methods | Medium (cache key generation) |
| `setCachedResponse()` | 802-830 | Store result in cache | Cache storage | All request methods | Medium (serialization) |
| `clearCache()` | 832-850 | Remove all cached entries | Cache storage | Manual clear | Low |
| `getCacheStats()` | 852-880 | Get cache metrics | Cache storage | Diagnostics | Low |

#### Error Handling Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `handleAPIError()` | 882-950 | Process API errors | Logger | All request methods | High (error classification, recovery) |
| `handleRateLimitError()` | 952-990 | Handle rate limit exceeded | RateLimiter | Request retry logic | Medium (backoff calculation) |
| `handleTimeoutError()` | 992-1020 | Handle request timeout | RetryHandler | Request retry logic | Medium (retry decision) |
| `handleAuthError()` | 1022-1050 | Handle authentication failure | ConfigManager | All requests | Medium (credential refresh) |

#### Token Management Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `estimateTokens()` | 1052-1100 | Calculate prompt token count | Tokenizer | Request preparation | High (tokenization algorithm) |
| `truncateToTokenLimit()` | 1102-1150 | Trim prompt to fit limit | Tokenizer | Request preparation | High (intelligent truncation) |
| `getTokenUsage()` | 1152-1180 | Return token statistics | Usage tracker | Billing/monitoring | Low |
| `resetTokenUsage()` | 1182-1195 | Clear usage counters | Usage tracker | Manual reset | Low |

#### Prompt Management Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `buildPrompt()` | 1197-1280 | Construct complete prompt | PromptBuilder | All request methods | High (template rendering, context injection) |
| `addSystemPrompt()` | 1282-1310 | Inject system instructions | None | buildPrompt | Low |
| `addContextWindow()` | 1312-1360 | Add relevant context | Context manager | buildPrompt | Medium (relevance ranking) |
| `formatPromptForProvider()` | 1362-1410 | Convert to provider format | Provider API specs | buildPrompt | Medium (format conversion) |

#### Batch Processing Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `processBatch()` | 1412-1500 | Process multiple requests | All request methods | Bulk operations | High (concurrency, error aggregation) |
| `retryFailedRequests()` | 1502-1550 | Retry batch failures | RetryHandler | processBatch | High (selective retry) |
| `aggregateBatchResults()` | 1552-1590 | Combine batch outputs | None | processBatch | Medium (result merging) |

#### Analysis-Specific Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `analyzeFile()` | 1592-1680 | Analyze single file | generateJSONResponse | File analysis | High (multi-stage analysis) |
| `analyzeModule()` | 1682-1770 | Analyze module structure | generateJSONResponse | Module analysis | High (dependency resolution) |
| `analyzeProduct()` | 1772-1860 | Analyze entire product | generateJSONResponse | Product documentation | Very High (iterative analysis) |
| `generateArchitecture()` | 1862-1950 | Generate architecture docs | generateResponse | Documentation | High (multi-round conversation) |

#### Documentation Generation Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `generateFileSummary()` | 1952-2020 | Create file documentation | generateResponse | Documentation workflow | Medium |
| `generateModuleSummary()` | 2022-2090 | Create module documentation | generateResponse | Documentation workflow | Medium |
| `generateProductDocs()` | 2092-2180 | Create product documentation | generateResponse | Documentation workflow | High (multi-part generation) |
| `formatDocumentation()` | 2182-2250 | Format docs for output | Formatter | All doc generation | Medium (template rendering) |

#### Testing Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `generateTestPlan()` | 2252-2340 | Create test strategy | generateJSONResponse | Test generation | High (complexity analysis) |
| `generateUnitTests()` | 2342-2430 | Generate test code | generateResponse | Test generation | High (code generation) |
| `analyzeTestFailures()` | 2432-2520 | Diagnose test failures | generateResponse | Test fixing | High (error analysis) |
| `fixFailingTests()` | 2522-2610 | Fix test code | generateResponse | Test fixing | High (code modification) |

#### Refactoring Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `analyzeForRefactoring()` | 2612-2700 | Identify refactoring needs | generateJSONResponse | Refactoring workflow | High (complexity analysis) |
| `generateRefactoringPlan()` | 2702-2790 | Create refactoring steps | generateResponse | Refactoring workflow | Very High (step-by-step planning) |
| `generateRefactoredCode()` | 2792-2880 | Generate new code | generateResponse | Refactoring workflow | Very High (code transformation) |

#### Utility Functions

| Function | Lines | Responsibilities | Dependencies | Dependents | Complexity |
|----------|-------|-----------------|--------------|------------|------------|
| `logRequest()` | 2882-2910 | Log API request | Logger | All requests | Low |
| `logResponse()` | 2912-2940 | Log API response | Logger | All requests | Low |
| `getMetrics()` | 2942-2980 | Get service metrics | All trackers | Monitoring | Medium (metric aggregation) |
| `dispose()` | 2982-3010 | Clean up resources | All components | Extension deactivation | Medium (cleanup sequence) |

### 2. Responsibility Analysis

**API Communication** (15 functions):
- `generateResponse()`, `generateJSONResponse()`, `generateStreamingResponse()`
- `setProvider()`, `getCurrentProvider()`, `validateProvider()`, `getProviderCapabilities()`
- `buildPrompt()`, `addSystemPrompt()`, `addContextWindow()`, `formatPromptForProvider()`
- `logRequest()`, `logResponse()`, `getMetrics()`, `dispose()`

**Response Parsing** (4 functions):
- `parseJSONResponse()`, `validateResponseSchema()`, `extractCodeBlocks()`, `sanitizeResponse()`

**Rate Limiting** (4 functions):
- `checkRateLimit()`, `waitForRateLimit()`, `getRateLimitStatus()`, `resetRateLimits()`

**Retry Logic** (2 functions):
- `handleTimeoutError()`, `retryFailedRequests()`

**Caching** (4 functions):
- `getCachedResponse()`, `setCachedResponse()`, `clearCache()`, `getCacheStats()`

**Error Handling** (4 functions):
- `handleAPIError()`, `handleRateLimitError()`, `handleTimeoutError()`, `handleAuthError()`

**Token Management** (4 functions):
- `estimateTokens()`, `truncateToTokenLimit()`, `getTokenUsage()`, `resetTokenUsage()`

**Batch Processing** (3 functions):
- `processBatch()`, `retryFailedRequests()`, `aggregateBatchResults()`

**Analysis Operations** (4 functions):
- `analyzeFile()`, `analyzeModule()`, `analyzeProduct()`, `generateArchitecture()`

**Documentation Generation** (4 functions):
- `generateFileSummary()`, `generateModuleSummary()`, `generateProductDocs()`, `formatDocumentation()`

**Testing Operations** (4 functions):
- `generateTestPlan()`, `generateUnitTests()`, `analyzeTestFailures()`, `fixFailingTests()`

**Refactoring Operations** (3 functions):
- `analyzeForRefactoring()`, `generateRefactoringPlan()`, `generateRefactoredCode()`

### 3. Extraction Mapping

#### Extraction Group 1: Response Processing

**Extract to**: `src/ai/responseProcessor.ts`

**Functions to Extract**:
- `parseJSONResponse()` (lines 547-620): Core parsing logic should be isolated for testing and reuse
- `validateResponseSchema()` (lines 622-680): Schema validation is independent concern
- `extractCodeBlocks()` (lines 682-730): Markdown parsing is utility function
- `sanitizeResponse()` (lines 732-760): Text cleaning is utility function

**Dependencies to Move**:
- Response parsing regex patterns
- Schema validation types
- Markdown parsing utilities

**Dependencies to Inject**:
- Logger instance (constructor injection)

**Breaking Changes**:
- `llmService.ts` will need to import and instantiate `ResponseProcessor`
- All calls to parsing functions must be updated to use new class
- Test files that mock these functions will need updates

---

#### Extraction Group 2: Rate Limiting

**Extract to**: `src/ai/rateLimiting/rateLimitManager.ts`

**Functions to Extract**:
- `checkRateLimit()` (lines 452-480): Core rate limit check
- `waitForRateLimit()` (lines 482-510): Delay logic
- `getRateLimitStatus()` (lines 512-530): Status reporting
- `resetRateLimits()` (lines 532-545): Manual reset capability

**Dependencies to Move**:
- `RateLimiter` class instance
- Rate limit configuration
- Rate limit state tracking

**Dependencies to Inject**:
- Configuration for rate limits (constructor injection)
- Logger instance (constructor injection)

**Breaking Changes**:
- `llmService.ts` must instantiate `RateLimitManager`
- All rate limit checks must go through new manager
- Configuration structure may need updates

---

#### Extraction Group 3: Token Management

**Extract to**: `src/ai/tokenManagement/tokenManager.ts`

**Functions to Extract**:
- `estimateTokens()` (lines 1052-1100): Token counting algorithm
- `truncateToTokenLimit()` (lines 1102-1150): Smart truncation
- `getTokenUsage()` (lines 1152-1180): Usage tracking
- `resetTokenUsage()` (lines 1182-1195): Counter reset

**Dependencies to Move**:
- Tokenizer instance
- Token counting algorithms
- Usage tracking state

**Dependencies to Inject**:
- Provider-specific tokenizer (constructor injection)
- Logger instance (constructor injection)

**Breaking Changes**:
- `llmService.ts` must instantiate `TokenManager`
- Token estimation calls must use new manager
- Provider switching must update tokenizer

---

#### Extraction Group 4: Cache Management

**Extract to**: `src/infrastructure/cache/llmCache.ts`

**Functions to Extract**:
- `getCachedResponse()` (lines 762-800): Cache retrieval
- `setCachedResponse()` (lines 802-830): Cache storage
- `clearCache()` (lines 832-850): Cache invalidation
- `getCacheStats()` (lines 852-880): Metrics reporting

**Dependencies to Move**:
- Cache storage implementation
- Cache key generation logic
- Cache TTL management

**Dependencies to Inject**:
- File system access (constructor injection)
- Configuration for cache settings (constructor injection)

**Breaking Changes**:
- `llmService.ts` must instantiate `LLMCache`
- All caching operations must use new class
- Cache directory structure may change

---

#### Extraction Group 5: Error Handling

**Extract to**: `src/ai/errorHandling/llmErrorHandler.ts`

**Functions to Extract**:
- `handleAPIError()` (lines 882-950): Generic API error processing
- `handleRateLimitError()` (lines 952-990): Rate limit specific handling
- `handleTimeoutError()` (lines 992-1020): Timeout specific handling
- `handleAuthError()` (lines 1022-1050): Authentication error handling

**Dependencies to Move**:
- Error classification logic
- Retry strategy configuration
- Error reporting utilities

**Dependencies to Inject**:
- RateLimitManager (constructor injection)
- RetryHandler (constructor injection)
- Logger (constructor injection)

**Breaking Changes**:
- `llmService.ts` must instantiate `LLMErrorHandler`
- All error handling must delegate to new handler
- Error response types may need standardization

---

#### Extraction Group 6: Prompt Construction

**Extract to**: `src/ai/promptManagement/promptComposer.ts`

**Functions to Extract**:
- `buildPrompt()` (lines 1197-1280): Main prompt assembly
- `addSystemPrompt()` (lines 1282-1310): System message injection
- `addContextWindow()` (lines 1312-1360): Context addition
- `formatPromptForProvider()` (lines 1362-1410): Provider-specific formatting

**Dependencies to Move**:
- Prompt templates
- Context selection algorithms
- Format conversion logic

**Dependencies to Inject**:
- PromptBuilder instance (constructor injection)
- Context manager (constructor injection)
- Provider API specs (constructor injection)

**Breaking Changes**:
- `llmService.ts` must instantiate `PromptComposer`
- All prompt building must use new composer
- Prompt format types may need updates

---

#### Extraction Group 7: Batch Operations

**Extract to**: `src/ai/batchProcessing/batchProcessor.ts`

**Functions to Extract**:
- `processBatch()` (lines 1412-1500): Batch request orchestration
- `retryFailedRequests()` (lines 1502-1550): Batch retry logic
- `aggregateBatchResults()` (lines 1552-1590): Result combination

**Dependencies to Move**:
- Concurrency control logic
- Batch state tracking
- Result aggregation algorithms

**Dependencies to Inject**:
- LLM request executor (constructor injection)
- Error handler (constructor injection)
- Progress reporter (constructor injection)

**Breaking Changes**:
- `llmService.ts` must instantiate `BatchProcessor`
- Batch operations must use new processor
- Batch result types may need standardization

---

#### Extraction Group 8: Analysis Services

**Extract to**: `src/domain/services/analysis/llmAnalysisService.ts`

**Functions to Extract**:
- `analyzeFile()` (lines 1592-1680): File analysis workflow
- `analyzeModule()` (lines 1682-1770): Module analysis workflow
- `analyzeProduct()` (lines 1772-1860): Product analysis workflow
- `generateArchitecture()` (lines 1862-1950): Architecture generation

**Dependencies to Move**:
- Analysis workflows
- Multi-stage analysis logic
- Result structuring

**Dependencies to Inject**:
- LLMService core (constructor injection)
- PromptBuilder (constructor injection)
- ResponseProcessor (constructor injection)

**Breaking Changes**:
- Analysis commands must use new service
- `llmIntegration.ts` must instantiate analysis service
- Analysis result types must be shared

---

#### Extraction Group 9: Documentation Services

**Extract to**: `src/domain/services/documentation/llmDocumentationService.ts`

**Functions to Extract**:
- `generateFileSummary()` (lines 1952-2020): File docs
- `generateModuleSummary()` (lines 2022-2090): Module docs
- `generateProductDocs()` (lines 2092-2180): Product docs
- `formatDocumentation()` (lines 2182-2250): Doc formatting

**Dependencies to Move**:
- Documentation templates
- Multi-part generation logic
- Formatting rules

**Dependencies to Inject**:
- LLMService core (constructor injection)
- PromptBuilder (constructor injection)
- Formatter (constructor injection)

**Breaking Changes**:
- Documentation commands must use new service
- `llmIntegration.ts` must instantiate doc service
- Documentation format types must be shared

---

#### Extraction Group 10: Testing Services

**Extract to**: `src/domain/services/testing/llmTestingService.ts`

**Functions to Extract**:
- `generateTestPlan()` (lines 2252-2340): Test planning
- `generateUnitTests()` (lines 2342-2430): Test generation
- `analyzeTestFailures()` (lines 2432-2520): Failure analysis
- `fixFailingTests()` (lines 2522-2610): Test fixing

**Dependencies to Move**:
- Test generation workflows
- Failure analysis logic
- Test fixing strategies

**Dependencies to Inject**:
- LLMService core (constructor injection)
- PromptBuilder (constructor injection)
- Test executor (constructor injection)

**Breaking Changes**:
- Testing commands must use new service
- `llmIntegration.ts` must instantiate testing service
- Test result types must be shared

---

#### Extraction Group 11: Refactoring Services

**Extract to**: `src/domain/services/refactoring/llmRefactoringService.ts`

**Functions to Extract**:
- `analyzeForRefactoring()` (lines 2612-2700): Refactoring analysis
- `generateRefactoringPlan()` (lines 2702-2790): Plan generation
- `generateRefactoredCode()` (lines 2792-2880): Code generation

**Dependencies to Move**:
- Refactoring workflows
- Plan generation logic
- Code transformation rules

**Dependencies to Inject**:
- LLMService core (constructor injection)
- PromptBuilder (constructor injection)
- Code analyzer (constructor injection)

**Breaking Changes**:
- Refactoring commands must use new service
- `llmIntegration.ts` must instantiate refactoring service
- Refactoring types must be shared

---

### 4. Step-by-Step Migration Instructions

#### EXTRACTION 1: Response Processing

**Step 1: Create Target File**

Create file: `src/ai/responseProcessor.ts`

```typescript
import { Logger } from '../infrastructure/logger';

/**
 * Handles parsing and validation of LLM responses
 */
export class ResponseProcessor {
    private logger: Logger;
    
    constructor(logger: Logger) {
        this.logger = logger;
    }
    
    /**
     * Parse JSON from LLM response, handling various formats
     */
    parseJSONResponse<T>(response: string): T {
        // Implementation will be moved here
        throw new Error('Not implemented');
    }
    
    /**
     * Validate response against expected schema
     */
    validateResponseSchema<T>(data: unknown, schema: SchemaDefinition): T {
        // Implementation will be moved here
        throw new Error('Not implemented');
    }
    
    /**
     * Extract code blocks from markdown response
     */
    extractCodeBlocks(response: string): CodeBlock[] {
        // Implementation will be moved here
        throw new Error('Not implemented');
    }
    
    /**
     * Sanitize response text by removing artifacts
     */
    sanitizeResponse(response: string): string {
        // Implementation will be moved here
        throw new Error('Not implemented');
    }
}

export interface CodeBlock {
    language: string;
    code: string;
    startLine: number;
    endLine: number;
}

export interface SchemaDefinition {
    type: string;
    properties?: Record<string, SchemaDefinition>;
    required?: string[];
    items?: SchemaDefinition;
}
```

**Step 2: Extract Functions**

Copy function implementations from `src/llmService.ts`:

```typescript
// src/ai/responseProcessor.ts

import { Logger } from '../infrastructure/logger';

export class ResponseProcessor {
    private logger: Logger;
    
    // JSON parsing patterns
    private readonly JSON_PATTERNS = [
        /```json\s*\n([\s\S]*?)\n```/,
        /```\s*\n([\s\S]*?)\n```/,
        /\{[\s\S]*\}/,
        /\[[\s\S]*\]/
    ];
    
    constructor(logger: Logger) {
        this.logger = logger;
    }
    
    /**
     * Parse JSON from LLM response, handling various formats
     * Extracted from llmService.ts lines 547-620
     */
    parseJSONResponse<T>(response: string): T {
        this.logger.debug('Parsing JSON response', { responseLength: response.length });
        
        // Try each pattern in order
        for (const pattern of this.JSON_PATTERNS) {
            const match = response.match(pattern);
            if (match) {
                const jsonStr = match[1] || match[0];
                try {
                    const parsed = JSON.parse(jsonStr.trim());
                    this.logger.debug('Successfully parsed JSON');
                    return parsed as T;
                } catch (error) {
                    this.logger.debug('Failed to parse with pattern', { pattern: pattern.source });
                    continue;
                }
            }
        }
        
        // Last resort: try parsing entire response
        try {
            const parsed = JSON.parse(response.trim());
            this.logger.debug('Parsed entire response as JSON');
            return parsed as T;
        } catch (error) {
            this.logger.error('Failed to parse JSON response', { error, response: response.substring(0, 200) });
            throw new Error(`Failed to parse JSON from response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Validate response against expected schema
     * Extracted from llmService.ts lines 622-680
     */
    validateResponseSchema<T>(data: unknown, schema: SchemaDefinition): T {
        this.logger.debug('Validating response schema', { schemaType: schema.type });
        
        if (schema.type === 'object') {
            if (typeof data !== 'object' || data === null) {
                throw new Error(`Expected object, got ${typeof data}`);
            }
            
            const obj = data as Record<string, unknown>;
            
            // Check required properties
            if (schema.required) {
                for (const requiredProp of schema.required) {
                    if (!(requiredProp in obj)) {
                        throw new Error(`Missing required property: ${requiredProp}`);
                    }
                }
            }
            
            // Validate nested properties
            if (schema.properties) {
                for (const [propName, propSchema] of Object.entries(schema.properties)) {
                    if (propName in obj) {
                        obj[propName] = this.validateResponseSchema(obj[propName], propSchema);
                    }
                }
            }
            
            return data as T;
        }
        
        if (schema.type === 'array') {
            if (!Array.isArray(data)) {
                throw new Error(`Expected array, got ${typeof data}`);
            }
            
            if (schema.items) {
                return data.map(item => this.validateResponseSchema(item, schema.items!)) as T;
            }
            
            return data as T;
        }
        
        if (schema.type === 'string' && typeof data !== 'string') {
            throw new Error(`Expected string, got ${typeof data}`);
        }
        
        if (schema.type === 'number' && typeof data !== 'number') {
            throw new Error(`Expected number, got ${typeof data}`);
        }
        
        if (schema.type === 'boolean' && typeof data !== 'boolean') {
            throw new Error(`Expected boolean, got ${typeof data}`);
        }
        
        return data as T;
    }
    
    /**
     * Extract code blocks from markdown response
     * Extracted from llmService.ts lines 682-730
     */
    extractCodeBlocks(response: string): CodeBlock[] {
        this.logger.debug('Extracting code blocks from response');
        
        const codeBlockPattern = /```(\w+)?\s*\n([\s\S]*?)\n```/g;
        const blocks: CodeBlock[] = [];
        let match;
        let lineNumber = 0;
        
        const lines = response.split('\n');
        
        while ((match = codeBlockPattern.exec(response)) !== null) {
            const language = match[1] || 'plaintext';
            const code = match[2];
            
            // Calculate line numbers
            const beforeMatch = response.substring(0, match.index);
            const startLine = beforeMatch.split('\n').length;
            const endLine = startLine + code.split('\n').length - 1;
            
            blocks.push({
                language,
                code: code.trim(),
                startLine,
                endLine
            });
        }
        
        this.logger.debug('Extracted code blocks', { count: blocks.length });
        return blocks;
    }
    
    /**
     * Sanitize response text by removing artifacts
     * Extracted from llmService.ts lines 732-760
     */
    sanitizeResponse(response: string): string {
        this.logger.debug('Sanitizing response');
        
        let sanitized = response;
        
        // Remove thinking/reasoning sections
        sanitized = sanitized.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');
        sanitized = sanitized.replace(/\[THINKING\][\s\S]*?\[\/THINKING\]/g, '');
        
        // Remove system artifacts
        sanitized = sanitized.replace(/^(Assistant:|AI:|Model:)\s*/gm, '');
        
        // Normalize whitespace
        sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
        sanitized = sanitized.trim();
        
        this.logger.debug('Response sanitized', {
            originalLength: response.length,
            sanitizedLength: sanitized.length
        });
        
        return sanitized;
    }
}

export interface CodeBlock {
    language: string;
    code: string;
    startLine: number;
    endLine: number;
}

export interface SchemaDefinition {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean';
    properties?: Record<string, SchemaDefinition>;
    required?: string[];
    items?: SchemaDefinition;
}
```

**Step 3: Update Source File**

Update `src/llmService.ts`:

```typescript
// src/llmService.ts

import { ResponseProcessor } from './ai/responseProcessor';

export class LLMService {
    private provider: LLMProvider;
    private rateLimiter: RateLimiter;
    private retryHandler: RetryHandler;
    private responseProcessor: ResponseProcessor; // NEW
    private logger: Logger;
    
    constructor(config: LLMServiceConfig, logger: Logger) {
        this.logger = logger;
        this.responseProcessor = new ResponseProcessor(logger); // NEW
        // ... rest of constructor
    }
    
    async generateJSONResponse<T>(prompt: string, schema: SchemaDefinition): Promise<T> {
        this.logger.debug('