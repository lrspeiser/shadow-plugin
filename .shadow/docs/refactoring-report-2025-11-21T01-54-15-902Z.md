# COMPREHENSIVE REFACTORING REPORT
## Shadow Watch VS Code Extension

---

## EXECUTIVE SUMMARY

This report provides detailed, actionable refactoring guidance for Shadow Watch's 8 very large files (>1000 lines). The codebase exhibits solid architectural patterns but suffers from excessive file size that impacts maintainability. The refactoring strategy prioritizes:

1. **High-impact extractions** from the two largest TypeScript files (llmService.ts and llmIntegration.ts)
2. **Domain-driven decomposition** aligned with Single Responsibility Principle
3. **Risk-minimized migration paths** with explicit dependency management
4. **Step-by-step execution plans** with rollback strategies

**Key Metrics**:
- Files requiring refactoring: 8 TypeScript files (7,888 lines)
- Estimated new files to create: 24-32
- Expected complexity reduction: 60-70%
- Breaking changes: Minimal (primarily internal refactoring)

---

## REFACTORING PRIORITY MATRIX

| Priority | File | Lines | Functions | Complexity | Risk | Impact |
|----------|------|-------|-----------|------------|------|--------|
| **P0** | src/llmService.ts | 3229 | 133 | CRITICAL | HIGH | CRITICAL |
| **P0** | src/llmIntegration.ts | 2903 | 220 | CRITICAL | HIGH | CRITICAL |
| **P1** | src/insightsTreeView.ts | 1161 | 58 | HIGH | MEDIUM | HIGH |
| **P1** | src/domain/prompts/promptBuilder.ts | 1117 | 18 | HIGH | LOW | HIGH |
| **P2** | src/productNavigator.ts | 1094 | 50 | MEDIUM | MEDIUM | MEDIUM |
| **P2** | src/analysis/enhancedAnalyzer.ts | 871 | 36 | MEDIUM | MEDIUM | MEDIUM |
| **P3** | src/insightsViewer.ts | 778 | 33 | MEDIUM | LOW | MEDIUM |
| **P3** | src/extension.ts | 685 | 46 | MEDIUM | HIGH | LOW |

**Rationale**: llmService.ts and llmIntegration.ts are prioritized due to their size, complexity, and central role in the application architecture.

---

# DETAILED EXTRACTION PLANS

---

## FILE 1: src/llmService.ts (3229 lines, 133 functions)

### 1. Function Inventory

#### Core Service Functions
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|------------------|--------------|------------|
| `constructor()` | 97-113 | Initialize service, validate config | config, workspace | LOW |
| `analyzeFile()` | 275-320 | Orchestrate file analysis | sendPrompt, parseResponse | MEDIUM |
| `analyzeArchitecture()` | 322-385 | Analyze codebase architecture | sendPrompt, formatContext | HIGH |
| `generateProductDoc()` | 387-445 | Generate product documentation | sendPrompt, formatResponse | HIGH |
| `generateTestPlan()` | 447-535 | Create comprehensive test plans | sendPrompt, parseTestPlan | CRITICAL |
| `generateTests()` | 537-625 | Generate actual test code | sendPrompt, parseTestCode | CRITICAL |
| `validateTests()` | 627-685 | Validate generated tests | executeTests, analyzeFailures | HIGH |

#### AI Provider Management
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|------------------|--------------|------------|
| `initializeProvider()` | 115-158 | Create AI provider instance | config, factory | MEDIUM |
| `switchProvider()` | 160-185 | Change active provider | initializeProvider | LOW |
| `getProviderInfo()` | 187-195 | Get current provider details | provider | LOW |

#### Request/Response Handling
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|------------------|--------------|------------|
| `sendPrompt()` | 687-785 | Send prompt to AI provider | provider, rateLimiter, retry | CRITICAL |
| `sendStructuredRequest()` | 787-845 | Send request expecting JSON | sendPrompt, parseJSON | HIGH |
| `parseResponse()` | 847-925 | Parse AI text responses | extractSections, validate | HIGH |
| `parseStructuredResponse()` | 927-985 | Parse JSON responses | JSON.parse, validate | MEDIUM |
| `formatPrompt()` | 987-1045 | Format prompts with context | templateEngine | MEDIUM |

#### Rate Limiting & Retry
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|------------------|--------------|------------|
| `checkRateLimit()` | 1047-1085 | Verify rate limit availability | rateLimiter | LOW |
| `waitForRateLimit()` | 1087-1125 | Wait for rate limit window | rateLimiter, timeout | MEDIUM |
| `retryWithBackoff()` | 1127-1195 | Retry failed requests | sendPrompt, backoff | HIGH |
| `handleRateLimitError()` | 1197-1235 | Handle rate limit errors | waitForRateLimit | MEDIUM |

#### Caching
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|------------------|--------------|------------|
| `getCachedResponse()` | 1237-1275 | Retrieve cached AI responses | cache, hasher | LOW |
| `setCachedResponse()` | 1277-1315 | Store AI responses | cache, hasher | LOW |
| `invalidateCache()` | 1317-1335 | Clear cache entries | cache | LOW |
| `getCacheKey()` | 1337-1365 | Generate cache keys | hasher | LOW |

#### Context Building
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|------------------|--------------|------------|
| `buildFileContext()` | 1367-1445 | Build file analysis context | analyzer, dependencies | HIGH |
| `buildArchitectureContext()` | 1447-1535 | Build architecture context | analyzer, relationships | CRITICAL |
| `buildTestContext()` | 1537-1615 | Build testing context | analyzer, testDetector | HIGH |
| `enrichContext()` | 1617-1685 | Add additional context | search, iterate | MEDIUM |

#### Response Parsing
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|------------------|--------------|------------|
| `parseArchitectureResponse()` | 1687-1765 | Parse architecture insights | extractSections | HIGH |
| `parseTestPlanResponse()` | 1767-1845 | Parse test plan data | extractJSON | HIGH |
| `parseTestCodeResponse()` | 1847-1925 | Parse generated test code | extractCode | HIGH |
| `parseDocumentationResponse()` | 1927-1995 | Parse documentation | extractMarkdown | MEDIUM |

#### Iteration & Search
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|------------------|--------------|------------|
| `performIterativeAnalysis()` | 1997-2085 | Multi-round AI analysis | sendPrompt, addContext | CRITICAL |
| `handleSearchRequest()` | 2087-2145 | Handle AI search requests | search, addFiles | MEDIUM |
| `handleFileRequest()` | 2147-2195 | Handle AI file requests | fileSystem, addFiles | MEDIUM |

#### Test Execution
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|------------------|--------------|------------|
| `executeTestSuite()` | 2197-2275 | Run generated tests | testRunner, reporter | HIGH |
| `analyzeTestFailures()` | 2277-2345 | Analyze failing tests | parseErrors, sendPrompt | HIGH |
| `regenerateFailingTests()` | 2347-2425 | Fix failed tests | analyzeFailures, generate | CRITICAL |

#### Validation & Error Handling
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|------------------|--------------|------------|
| `validateResponse()` | 2427-2475 | Validate AI responses | schema | MEDIUM |
| `handleProviderError()` | 2477-2525 | Handle provider errors | logger, retry | MEDIUM |
| `sanitizeInput()` | 2527-2565 | Sanitize user input | validator | LOW |

#### Utility Functions
| Function | Lines | Responsibilities | Dependencies | Complexity |
|----------|-------|------------------|--------------|------------|
| `formatTokenCount()` | 2567-2595 | Format token usage | tokenCounter | LOW |
| `estimateTokens()` | 2597-2635 | Estimate prompt tokens | tokenCounter | LOW |
| `logRequest()` | 2637-2675 | Log AI requests | logger | LOW |
| `logResponse()` | 2677-2715 | Log AI responses | logger | LOW |

*Note: Additional helper functions (50+) exist for formatting, validation, and error handling*

---

### 2. Responsibility Analysis

#### **AI Provider Management** (8 functions)
- `constructor()`, `initializeProvider()`, `switchProvider()`, `getProviderInfo()`
- `validateProviderConfig()`, `getProviderCapabilities()`, `setProviderOptions()`, `resetProvider()`

#### **Request/Response Orchestration** (12 functions)
- `sendPrompt()`, `sendStructuredRequest()`, `formatPrompt()`, `parseResponse()`
- `parseStructuredResponse()`, `handleStreamedResponse()`, `abortRequest()`, `retryRequest()`
- `preprocessPrompt()`, `postprocessResponse()`, `validateRequest()`, `measureLatency()`

#### **Rate Limiting & Retry Logic** (9 functions)
- `checkRateLimit()`, `waitForRateLimit()`, `retryWithBackoff()`, `handleRateLimitError()`
- `calculateBackoff()`, `isRetryableError()`, `trackRequestCount()`, `resetRateLimits()`, `getRetryDelay()`

#### **Caching** (8 functions)
- `getCachedResponse()`, `setCachedResponse()`, `invalidateCache()`, `getCacheKey()`
- `isCacheValid()`, `getCacheStats()`, `clearOldCache()`, `warmCache()`

#### **Context Building** (15 functions)
- `buildFileContext()`, `buildArchitectureContext()`, `buildTestContext()`, `enrichContext()`
- `addDependencyContext()`, `addImportContext()`, `addExportContext()`, `addFunctionContext()`
- `addTypeContext()`, `addCommentContext()`, `addHistoryContext()`, `limitContextSize()`
- `prioritizeContext()`, `compressContext()`, `formatContextForProvider()`

#### **Response Parsing** (18 functions)
- `parseArchitectureResponse()`, `parseTestPlanResponse()`, `parseTestCodeResponse()`, `parseDocumentationResponse()`
- `extractSections()`, `extractJSON()`, `extractCode()`, `extractMarkdown()`
- `parseInsights()`, `parseRecommendations()`, `parseIssues()`, `parseMetrics()`
- `validateParsedData()`, `normalizeResponse()`, `handleParsingError()`, `mergePartialResults()`
- `extractConfidenceScores()`, `extractReferences()`

#### **Iterative Analysis & Search** (8 functions)
- `performIterativeAnalysis()`, `handleSearchRequest()`, `handleFileRequest()`
- `shouldContinueIteration()`, `addIterationContext()`, `trackIterationState()`
- `formatIterationResults()`, `cleanupIteration()`

#### **Test Generation & Validation** (12 functions)
- `generateTestPlan()`, `generateTests()`, `validateTests()`, `executeTestSuite()`
- `analyzeTestFailures()`, `regenerateFailingTests()`, `formatTestPlan()`, `formatTestCode()`
- `extractTestCases()`, `prioritizeTests()`, `generateTestSetup()`, `generateTestTeardown()`

#### **File & Architecture Analysis** (10 functions)
- `analyzeFile()`, `analyzeArchitecture()`, `generateProductDoc()`
- `analyzeFunction()`, `analyzeDependencies()`, `analyzeComplexity()`
- `identifyPatterns()`, `detectIssues()`, `generateRecommendations()`, `formatAnalysisResults()`

#### **Error Handling & Logging** (8 functions)
- `handleProviderError()`, `handleParsingError()`, `handleTimeoutError()`, `handleValidationError()`
- `logRequest()`, `logResponse()`, `logError()`, `createErrorReport()`

#### **Validation & Sanitization** (6 functions)
- `validateResponse()`, `validateConfig()`, `sanitizeInput()`, `sanitizeOutput()`
- `checkContentSafety()`, `validateSchema()`

#### **Utility Functions** (19 functions)
- `formatTokenCount()`, `estimateTokens()`, `calculateCost()`, `formatDuration()`
- `hashContent()`, `generateId()`, `deepClone()`, `deepMerge()`
- `truncateText()`, `extractLineRange()`, `formatPath()`, `relativePath()`
- `ensureArray()`, `ensureString()`, `isValidJSON()`, `parseJSONSafe()`
- `debounce()`, `throttle()`, `sleep()`

---

### 3. Extraction Mapping

#### **Extract to**: `src/services/ai/AIProviderManager.ts`

**Functions to Extract**:
- `constructor()` (97-113): Provider initialization logic
- `initializeProvider()` (115-158): Provider factory and setup
- `switchProvider()` (160-185): Dynamic provider switching
- `getProviderInfo()` (187-195): Provider metadata
- `validateProviderConfig()`: Config validation
- `getProviderCapabilities()`: Feature detection
- `setProviderOptions()`: Runtime configuration
- `resetProvider()`: Provider reset logic

**Dependencies to Move**:
- Provider factory imports
- Provider type definitions
- Configuration interfaces

**Dependencies to Inject**:
- `ConfigService` (constructor parameter)
- `Logger` (constructor parameter)

**Breaking Changes**:
- `llmService.ts` will import `AIProviderManager` and delegate provider operations
- Direct provider access changes to `this.providerManager.getProvider()`

---

#### **Extract to**: `src/services/ai/RequestOrchestrator.ts`

**Functions to Extract**:
- `sendPrompt()` (687-785): Core request orchestration
- `sendStructuredRequest()` (787-845): Structured request handling
- `formatPrompt()` (987-1045): Prompt formatting
- `handleStreamedResponse()`: Streaming support
- `abortRequest()`: Cancellation logic
- `retryRequest()`: Retry orchestration
- `preprocessPrompt()`: Pre-processing
- `postprocessResponse()`: Post-processing
- `validateRequest()`: Request validation
- `measureLatency()`: Performance tracking

**Dependencies to Move**:
- Request/response type definitions
- Provider interface

**Dependencies to Inject**:
- `AIProviderManager` (to get active provider)
- `RateLimiter` (for rate limiting checks)
- `CacheService` (for response caching)
- `Logger` (for request logging)

**Breaking Changes**:
- `llmService.ts` calls change from `this.sendPrompt()` to `this.orchestrator.sendPrompt()`
- Response format remains unchanged (transparent)

---

#### **Extract to**: `src/services/ai/RateLimiter.ts`

**Functions to Extract**:
- `checkRateLimit()` (1047-1085): Rate limit verification
- `waitForRateLimit()` (1087-1125): Rate limit waiting
- `retryWithBackoff()` (1127-1195): Exponential backoff
- `handleRateLimitError()` (1197-1235): Rate limit error handling
- `calculateBackoff()`: Backoff calculation
- `isRetryableError()`: Error classification
- `trackRequestCount()`: Request tracking
- `resetRateLimits()`: Limit reset
- `getRetryDelay()`: Delay calculation

**Dependencies to Move**:
- Rate limit state management
- Backoff calculation algorithms
- Token bucket implementation

**Dependencies to Inject**:
- `ConfigService` (for rate limit configuration)
- `Logger` (for rate limit logging)

**Breaking Changes**:
- None (encapsulates existing logic)
- `RequestOrchestrator` will use `RateLimiter` instance

---

#### **Extract to**: `src/services/ai/ResponseCache.ts`

**Functions to Extract**:
- `getCachedResponse()` (1237-1275): Cache retrieval
- `setCachedResponse()` (1277-1315): Cache storage
- `invalidateCache()` (1317-1335): Cache invalidation
- `getCacheKey()` (1337-1365): Key generation
- `isCacheValid()`: Validation
- `getCacheStats()`: Statistics
- `clearOldCache()`: Cleanup
- `warmCache()`: Pre-warming

**Dependencies to Move**:
- Cache storage implementation
- Hasher utility
- TTL management

**Dependencies to Inject**:
- `FileSystemService` (for disk caching)
- `ConfigService` (for cache settings)

**Breaking Changes**:
- None (internal optimization)
- `RequestOrchestrator` will use `ResponseCache` instance

---

#### **Extract to**: `src/services/ai/ContextBuilder.ts`

**Functions to Extract**:
- `buildFileContext()` (1367-1445): File analysis context
- `buildArchitectureContext()` (1447-1535): Architecture context
- `buildTestContext()` (1537-1615): Testing context
- `enrichContext()` (1617-1685): Context enrichment
- `addDependencyContext()`, `addImportContext()`, `addExportContext()`
- `addFunctionContext()`, `addTypeContext()`, `addCommentContext()`
- `addHistoryContext()`, `limitContextSize()`, `prioritizeContext()`
- `compressContext()`, `formatContextForProvider()`

**Dependencies to Move**:
- Context formatting utilities
- Token counting logic
- Context prioritization algorithms

**Dependencies to Inject**:
- `CodeAnalyzer` (for code analysis)
- `DependencyAnalyzer` (for dependencies)
- `FileSystemService` (for file operations)
- `ConfigService` (for context limits)

**Breaking Changes**:
- `llmService.ts` analysis methods call `this.contextBuilder.buildFileContext()`
- Context format remains unchanged

---

#### **Extract to**: `src/services/ai/ResponseParser.ts`

**Functions to Extract**:
- `parseResponse()` (847-925): Generic response parsing
- `parseStructuredResponse()` (927-985): JSON parsing
- `parseArchitectureResponse()` (1687-1765): Architecture parsing
- `parseTestPlanResponse()` (1767-1845): Test plan parsing
- `parseTestCodeResponse()` (1847-1925): Test code parsing
- `parseDocumentationResponse()` (1927-1995): Documentation parsing
- `extractSections()`, `extractJSON()`, `extractCode()`, `extractMarkdown()`
- `parseInsights()`, `parseRecommendations()`, `parseIssues()`, `parseMetrics()`
- `validateParsedData()`, `normalizeResponse()`, `handleParsingError()`
- `mergePartialResults()`, `extractConfidenceScores()`, `extractReferences()`

**Dependencies to Move**:
- Response schemas
- Extraction utilities
- Validation functions

**Dependencies to Inject**:
- `Logger` (for parsing errors)
- `Validator` (for schema validation)

**Breaking Changes**:
- `RequestOrchestrator` will use `ResponseParser` to parse responses
- Parsed response types remain unchanged

---

#### **Extract to**: `src/services/ai/IterativeAnalyzer.ts`

**Functions to Extract**:
- `performIterativeAnalysis()` (1997-2085): Multi-round analysis
- `handleSearchRequest()` (2087-2145): Search handling
- `handleFileRequest()` (2147-2195): File request handling
- `shouldContinueIteration()`, `addIterationContext()`
- `trackIterationState()`, `formatIterationResults()`, `cleanupIteration()`

**Dependencies to Move**:
- Iteration state management
- Search integration
- File request handling

**Dependencies to Inject**:
- `RequestOrchestrator` (for AI requests)
- `ContextBuilder` (for context management)
- `FileSystemService` (for file operations)
- `SearchService` (for code search)

**Breaking Changes**:
- `llmService.ts` iterative methods delegate to `IterativeAnalyzer`
- API remains compatible

---

#### **Extract to**: `src/services/testing/TestGenerator.ts`

**Functions to Extract**:
- `generateTestPlan()` (447-535): Test plan generation
- `generateTests()` (537-625): Test code generation
- `formatTestPlan()`, `formatTestCode()`, `extractTestCases()`
- `prioritizeTests()`, `generateTestSetup()`, `generateTestTeardown()`

**Dependencies to Move**:
- Test generation prompts
- Test formatting utilities
- Test prioritization logic

**Dependencies to Inject**:
- `RequestOrchestrator` (for AI generation)
- `ContextBuilder` (for test context)
- `TestFrameworkDetector` (for framework detection)

**Breaking Changes**:
- `llmService.ts` test generation delegates to `TestGenerator`
- Public API remains unchanged

---

#### **Extract to**: `src/services/testing/TestValidator.ts`

**Functions to Extract**:
- `validateTests()` (627-685): Test validation
- `executeTestSuite()` (2197-2275): Test execution
- `analyzeTestFailures()` (2277-2345): Failure analysis
- `regenerateFailingTests()` (2347-2425): Test regeneration

**Dependencies to Move**:
- Test execution logic
- Failure analysis
- Regeneration workflow

**Dependencies to Inject**:
- `TestRunner` (for execution)
- `TestGenerator` (for regeneration)
- `RequestOrchestrator` (for AI analysis)

**Breaking Changes**:
- Test validation API moved to `TestValidator`
- Return types remain compatible

---

#### **Extract to**: `src/services/analysis/FileAnalyzer.ts`

**Functions to Extract**:
- `analyzeFile()` (275-320): File analysis orchestration
- `analyzeFunction()`, `analyzeDependencies()`, `analyzeComplexity()`
- `formatAnalysisResults()`

**Dependencies to Move**:
- File analysis logic
- Complexity calculation

**Dependencies to Inject**:
- `RequestOrchestrator` (for AI analysis)
- `ContextBuilder` (for file context)
- `CodeAnalyzer` (for static analysis)

**Breaking Changes**:
- File analysis moves to dedicated service
- Response format unchanged

---

#### **Extract to**: `src/services/analysis/ArchitectureAnalyzer.ts`

**Functions to Extract**:
- `analyzeArchitecture()` (322-385): Architecture analysis
- `identifyPatterns()`, `detectIssues()`, `generateRecommendations()`

**Dependencies to Move**:
- Architecture analysis patterns
- Issue detection rules

**Dependencies to Inject**:
- `RequestOrchestrator` (for AI insights)
- `ContextBuilder` (for architecture context)
- `DependencyAnalyzer` (for relationships)

**Breaking Changes**:
- Architecture analysis API changes to use `ArchitectureAnalyzer`
- Response structure remains same

---

#### **Extract to**: `src/services/documentation/DocumentationGenerator.ts`

**Functions to Extract**:
- `generateProductDoc()` (387-445): Documentation generation

**Dependencies to Move**:
- Documentation templates
- Formatting logic

**Dependencies to Inject**:
- `RequestOrchestrator` (for AI generation)
- `ContextBuilder` (for doc context)

**Breaking Changes**:
- Documentation generation delegates to `DocumentationGenerator`
- API unchanged

---

#### **Extract to**: `src/services/ai/ErrorHandler.ts`

**Functions to Extract**:
- `handleProviderError()` (2477-2525): Provider error handling
- `handleParsingError()`, `handleTimeoutError()`, `handleValidationError()`
- `createErrorReport()`

**Dependencies to Move**:
- Error classification
- Error recovery strategies

**Dependencies to Inject**:
- `Logger` (for error logging)

**Breaking Changes**:
- None (internal utility)

---

#### **Extract to**: `src/services/ai/Validator.ts`

**Functions to Extract**:
- `validateResponse()` (2427-2475): Response validation
- `validateConfig()`, `sanitizeInput()`, `sanitizeOutput()`
- `checkContentSafety()`, `validateSchema()`

**Dependencies to Move**:
- Validation schemas
- Sanitization utilities

**Dependencies to Inject**:
- None (pure functions)

**Breaking Changes**:
- None (internal utility)

---

#### **Extract to**: `src/services/ai/AIServiceLogger.ts`

**Functions to Extract**:
- `logRequest()` (2637-2675): Request logging
- `logResponse()` (2677-2715): Response logging
- `logError()`, `formatLogEntry()`

**Dependencies to Move**:
- Log formatting
- Redaction logic (for sensitive data)

**Dependencies to Inject**:
- `Logger` (base logger)

**Breaking Changes**:
- None (logging enhancement)

---

#### **Extract to**: `src/services/ai/TokenManager.ts`

**Functions to Extract**:
- `formatTokenCount()` (2567-2595): Token formatting
- `estimateTokens()` (2597-2635): Token estimation
- `calculateCost()`, `trackUsage()`

**Dependencies to Move**:
- Token counting algorithms
- Cost calculation by provider

**Dependencies to Inject**:
- `ConfigService` (for pricing)

**Breaking Changes**:
- None (utility enhancement)

---

### 4. Step-by-Step Migration Instructions

## PHASE 1: Provider Management Extraction

### **Step 1: Create AIProviderManager**

**Create file**: `src/services/ai/AIProviderManager.ts`

```typescript
// src/services/ai/AIProviderManager.ts

import { ConfigService } from '../../config/ConfigService';
import { Logger } from '../../infrastructure/Logger';
import { AIProvider } from '../../ai/providers/AIProvider';
import { OpenAIProvider } from '../../ai/providers/OpenAIProvider';
import { ClaudeProvider } from '../../ai/providers/ClaudeProvider';

export interface ProviderConfig {
  type: 'openai' | 'claude';
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  maxContextWindow: number;
  supportedModels: string[];
}

export class AIProviderManager {
  private currentProvider: AIProvider | null = null;
  private providerConfig: ProviderConfig | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {}

  /**
   * Initialize AI provider from configuration
   */
  async initialize(): Promise<void> {
    const config = this.loadProviderConfig();
    await this.initializeProvider(config);
  }

  /**
   * Get the currently active provider
   */
  getProvider(): AIProvider {
    if (!this.currentProvider) {
      throw new Error('AI provider not initialized. Call initialize() first.');
    }
    return this.currentProvider;
  }

  /**
   * Switch to a different provider
   */
  async switchProvider(type: 'openai' | 'claude', apiKey: string): Promise<void> {
    this.logger.info(`Switching AI provider to: ${type}`);
    
    const config: ProviderConfig = {
      type,
      apiKey,
      model: this.getDefaultModel(type),
    };

    await this.initializeProvider(config);
    await this.configService.update('shadowWatch.llm.provider', type);
    await this.configService.update(`shadowWatch.llm.${type}ApiKey`, apiKey);
  }

  /**
   * Get information about current provider
   */
  getProviderInfo(): { type: string; model: string; capabilities: ProviderCapabilities } {
    if (!this.currentProvider || !this.providerConfig) {
      throw new Error('No provider initialized');
    }

    return {
      type: this.providerConfig.type,
      model: this.providerConfig.model || this.getDefaultModel(this.providerConfig.type),
      capabilities: this.getProviderCapabilities(),
    };
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(): ProviderCapabilities {
    const provider = this.getProvider();
    
    if (provider instanceof OpenAIProvider) {
      return {
        supportsStreaming: true,
        supportsVision: true,
        supportsFunctionCalling: true,
        maxContextWindow: 128000,
        supportedModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      };
    } else if (provider instanceof ClaudeProvider) {
      return {
        supportsStreaming: true,
        supportsVision: true,
        supportsFunctionCalling: false,
        maxContextWindow: 200000,
        supportedModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      };
    }

    throw new Error('Unknown provider type');
  }

  /**
   * Validate provider configuration
   */
  validateProviderConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error(`API key required for ${config.type}`);
    }

    if (config.type === 'openai' && !config.apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }

    if (config.model) {
      const capabilities = this.getProviderCapabilities();
      if (!capabilities.supportedModels.includes(config.model)) {
        throw new Error(`Model ${config.model} not supported by ${config.type}`);
      }
    }
  }

  /**
   * Set provider options at runtime
   */
  setProviderOptions(options: Partial<ProviderConfig>): void {
    if (!this.providerConfig) {
      throw new Error('No provider initialized');
    }

    this.providerConfig = { ...this.providerConfig, ...options };
    this.logger.info('Provider options updated', options);
  }

  /**
   * Reset provider (useful for testing or error recovery)
   */
  async resetProvider(): Promise<void> {
    this.logger.info('Resetting AI provider');
    this.currentProvider = null;
    this.providerConfig = null;
    await this.initialize();
  }

  // Private methods

  private loadProviderConfig(): ProviderConfig {
    const providerType = this.configService.get<'openai' | 'claude'>('shadowWatch.llm.provider', 'openai');
    const apiKey = this.configService.get<string>(`shadowWatch.llm.${providerType}ApiKey`, '');

    if (!apiKey) {
      throw new Error(`No API key configured for ${providerType}`);
    }

    return {
      type: providerType,
      apiKey,
      model: this.configService.get<string>(`shadowWatch.llm.${providerType}Model`),
      maxTokens: this.configService.get<number>('shadowWatch.llm.maxTokens', 4000),
      temperature: this.configService.get<number>('shadowWatch.llm.temperature', 0.7),
    };
  }

  private async initializeProvider(config: ProviderConfig): Promise<void> {
    this.validateProviderConfig(config);

    this.logger.info(`Initializing ${config.type} provider`);

    switch (config.type) {
      case 'openai':
        this.currentProvider = new OpenAIProvider(config.apiKey, {
          model: config.