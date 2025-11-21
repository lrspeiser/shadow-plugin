# Shadow Watch - Comprehensive Refactoring Plan

## Executive Summary

This refactoring plan addresses **8 critical files** requiring decomposition (>1000 lines), with detailed extraction strategies for **3288 lines** (llmService.ts), **2903 lines** (llmIntegration.ts), and 6 other large files. The plan provides actionable, step-by-step instructions to reduce complexity, improve maintainability, and eliminate architectural debt while preserving all functionality.

**Priority Order**: 
1. llmService.ts (highest complexity, 140 functions)
2. llmIntegration.ts (220 functions, high coupling)
3. promptBuilder.ts (1157 lines, prompt management)
4. insightsTreeView.ts (1161 lines, UI logic)
5. productNavigator.ts (1094 lines, navigation)
6. enhancedAnalyzer.ts (871 lines, analysis logic)
7. insightsViewer.ts (778 lines, UI presentation)
8. extension.ts (685 lines, entry point)

---

## File 1: src/llmService.ts (3288 lines, 140 functions)

### 1. Function Inventory

#### Core Service Functions
- `constructor()` (97-113, 17 lines) - Initializes LLM service with rate limiter and retry handler
  - **Dependencies**: RateLimiter, RetryHandler, LLMProviderFactory
  - **Dependents**: All methods in the service
  - **Complexity**: Medium (conditional initialization)

- `initializeProvider()` (114-159, 46 lines) - Sets up OpenAI or Claude provider
  - **Dependencies**: Config, LLMProviderFactory
  - **Dependents**: constructor, switchProvider
  - **Complexity**: High (nested conditionals, error handling)

- `switchProvider()` (160-180, 21 lines) - Changes between AI providers
  - **Dependencies**: initializeProvider
  - **Dependents**: External command handlers
  - **Complexity**: Medium (state management)

#### Rate Limiting & Retry Functions
- `executeWithRateLimit()` (181-215, 35 lines) - Wraps calls with rate limiting
  - **Dependencies**: RateLimiter
  - **Dependents**: All API call methods
  - **Complexity**: Medium (async handling)

- `executeWithRetry()` (216-264, 49 lines) - Implements retry logic with exponential backoff
  - **Dependencies**: RetryHandler
  - **Dependents**: All API call methods
  - **Complexity**: High (nested loops, error classification)

- `shouldRetry()` (265-290, 26 lines) - Determines if error is retryable
  - **Dependencies**: None
  - **Dependents**: executeWithRetry
  - **Complexity**: Medium (error classification logic)

#### Document Generation Functions
- `generateProductDocs()` (291-390, 100 lines) - Generates product documentation
  - **Dependencies**: FileAnalyzer, PromptBuilder, Provider
  - **Dependents**: External command handlers
  - **Complexity**: Very High (nested loops, batch processing)

- `generateFileSummary()` (391-450, 60 lines) - Creates summary for single file
  - **Dependencies**: Provider, PromptBuilder
  - **Dependents**: generateProductDocs
  - **Complexity**: High (prompt construction)

- `generateModuleSummary()` (451-528, 78 lines) - Aggregates file summaries
  - **Dependencies**: Provider, PromptBuilder
  - **Dependents**: generateProductDocs
  - **Complexity**: High (for loop, aggregation logic)

- `generateArchitectureInsights()` (529-620, 92 lines) - Creates architecture analysis
  - **Dependencies**: Provider, PromptBuilder, FileAnalyzer
  - **Dependents**: External command handlers
  - **Complexity**: Very High (complex prompt construction)

#### Test Generation Functions
- `generateTestPlan()` (621-710, 90 lines) - Creates test strategy
  - **Dependencies**: Provider, PromptBuilder, FunctionAnalyzer
  - **Dependents**: Test generation workflow
  - **Complexity**: High (analysis aggregation)

- `generateUnitTests()` (711-820, 110 lines) - Generates test code
  - **Dependencies**: Provider, PromptBuilder, TestConfigService
  - **Dependents**: External command handlers
  - **Complexity**: Very High (batch generation, progress tracking)

- `generateTestForFunction()` (821-900, 80 lines) - Creates tests for single function
  - **Dependencies**: Provider, PromptBuilder
  - **Dependents**: generateUnitTests
  - **Complexity**: High (context gathering)

- `fixFailingTest()` (901-980, 80 lines) - Attempts to fix broken tests
  - **Dependencies**: Provider, PromptBuilder
  - **Dependents**: Test execution workflow
  - **Complexity**: High (error analysis)

#### Refactoring Analysis Functions
- `analyzeForRefactoring()` (981-1080, 100 lines) - Identifies refactoring opportunities
  - **Dependencies**: ComplexityAnalyzer, PromptBuilder
  - **Dependents**: External command handlers
  - **Complexity**: Very High (metrics calculation)

- `generateRefactoringPlan()` (1081-1180, 100 lines) - Creates refactoring strategy
  - **Dependencies**: Provider, PromptBuilder
  - **Dependents**: analyzeForRefactoring
  - **Complexity**: High (structured output parsing)

- `generateExtractionSteps()` (1181-1270, 90 lines) - Creates step-by-step extraction guide
  - **Dependencies**: Provider, PromptBuilder
  - **Dependents**: generateRefactoringPlan
  - **Complexity**: High (detailed instruction generation)

#### Response Parsing Functions
- `parseStructuredResponse()` (1271-1320, 50 lines) - Extracts JSON from markdown
  - **Dependencies**: None
  - **Dependents**: All structured output methods
  - **Complexity**: Medium (regex, JSON parsing)

- `parseTestResponse()` (1321-1380, 60 lines) - Parses test generation response
  - **Dependencies**: parseStructuredResponse
  - **Dependents**: generateUnitTests
  - **Complexity**: Medium (format handling)

- `parseRefactoringResponse()` (1381-1450, 70 lines) - Parses refactoring suggestions
  - **Dependencies**: parseStructuredResponse
  - **Dependents**: generateRefactoringPlan
  - **Complexity**: Medium (structured extraction)

#### Caching Functions
- `getCachedResponse()` (1451-1480, 30 lines) - Retrieves cached LLM responses
  - **Dependencies**: ResponseCache
  - **Dependents**: All API call methods
  - **Complexity**: Low

- `setCachedResponse()` (1481-1510, 30 lines) - Stores LLM responses
  - **Dependencies**: ResponseCache
  - **Dependents**: All API call methods
  - **Complexity**: Low

- `generateCacheKey()` (1511-1540, 30 lines) - Creates cache keys
  - **Dependencies**: crypto
  - **Dependents**: getCachedResponse, setCachedResponse
  - **Complexity**: Low (hash generation)

#### Progress Tracking Functions
- `reportProgress()` (1541-1570, 30 lines) - Updates progress UI
  - **Dependencies**: ProgressService
  - **Dependents**: All long-running operations
  - **Complexity**: Low

- `createProgressToken()` (1571-1600, 30 lines) - Creates progress tracking context
  - **Dependencies**: ProgressService
  - **Dependents**: All long-running operations
  - **Complexity**: Low

#### Error Handling Functions
- `handleProviderError()` (1601-1680, 80 lines) - Processes provider-specific errors
  - **Dependencies**: Logger
  - **Dependents**: All API call methods
  - **Complexity**: High (error classification, logging)

- `formatErrorMessage()` (1681-1720, 40 lines) - Creates user-friendly error messages
  - **Dependencies**: None
  - **Dependents**: handleProviderError
  - **Complexity**: Medium (message templating)

#### Configuration Functions
- `updateConfiguration()` (1721-1760, 40 lines) - Updates runtime config
  - **Dependencies**: ConfigManager
  - **Dependents**: External command handlers
  - **Complexity**: Medium (validation)

- `validateConfiguration()` (1761-1820, 60 lines) - Checks config validity
  - **Dependencies**: ConfigManager
  - **Dependents**: initializeProvider
  - **Complexity**: High (comprehensive validation)

#### File Analysis Support Functions
- `getRelevantContext()` (1821-1920, 100 lines) - Gathers context for analysis
  - **Dependencies**: FileAnalyzer, WorkspaceScanner
  - **Dependents**: All generation methods
  - **Complexity**: Very High (context aggregation)

- `findRelatedFiles()` (1921-2000, 80 lines) - Discovers related code files
  - **Dependencies**: DependencyAnalyzer
  - **Dependents**: getRelevantContext
  - **Complexity**: High (dependency traversal)

- `extractFunctionContext()` (2001-2080, 80 lines) - Gets function-specific context
  - **Dependencies**: FunctionAnalyzer
  - **Dependents**: generateTestForFunction
  - **Complexity**: High (AST analysis)

#### Batch Processing Functions
- `processBatch()` (2081-2160, 80 lines) - Handles batch operations
  - **Dependencies**: None
  - **Dependents**: generateProductDocs, generateUnitTests
  - **Complexity**: High (parallel processing)

- `batchWithConcurrencyLimit()` (2161-2220, 60 lines) - Controls concurrent executions
  - **Dependencies**: None
  - **Dependents**: processBatch
  - **Complexity**: Medium (async queue management)

#### Token Management Functions
- `estimateTokens()` (2221-2260, 40 lines) - Estimates token count
  - **Dependencies**: TokenCounter
  - **Dependents**: All API call methods
  - **Complexity**: Medium (approximation logic)

- `truncateToTokenLimit()` (2261-2320, 60 lines) - Reduces content to fit limits
  - **Dependencies**: TokenCounter
  - **Dependents**: All prompt construction
  - **Complexity**: High (smart truncation)

#### Prompt Construction Functions
- `buildPrompt()` (2321-2400, 80 lines) - Constructs LLM prompts
  - **Dependencies**: PromptBuilder
  - **Dependents**: All generation methods
  - **Complexity**: High (template assembly)

- `addSystemContext()` (2401-2450, 50 lines) - Adds system-level context
  - **Dependencies**: PromptBuilder
  - **Dependents**: buildPrompt
  - **Complexity**: Medium

- `addCodeContext()` (2451-2520, 70 lines) - Adds code-specific context
  - **Dependencies**: PromptBuilder, FileAnalyzer
  - **Dependents**: buildPrompt
  - **Complexity**: High (context formatting)

#### Result Formatting Functions
- `formatDocumentation()` (2521-2600, 80 lines) - Formats docs output
  - **Dependencies**: MarkdownFormatter
  - **Dependents**: generateProductDocs
  - **Complexity**: High (markdown generation)

- `formatTestOutput()` (2601-2670, 70 lines) - Formats test output
  - **Dependencies**: CodeFormatter
  - **Dependents**: generateUnitTests
  - **Complexity**: Medium (code formatting)

- `formatRefactoringOutput()` (2671-2750, 80 lines) - Formats refactoring output
  - **Dependencies**: MarkdownFormatter
  - **Dependents**: generateRefactoringPlan
  - **Complexity**: High (structured formatting)

#### State Management Functions
- `getState()` (2751-2770, 20 lines) - Returns service state
  - **Dependencies**: None
  - **Dependents**: External monitoring
  - **Complexity**: Low

- `resetState()` (2771-2800, 30 lines) - Resets service state
  - **Dependencies**: None
  - **Dependents**: switchProvider, error recovery
  - **Complexity**: Low

#### Logging Functions
- `logOperation()` (2801-2840, 40 lines) - Logs operation details
  - **Dependencies**: Logger
  - **Dependents**: All operations
  - **Complexity**: Low

- `logPerformance()` (2841-2880, 40 lines) - Logs performance metrics
  - **Dependencies**: Logger
  - **Dependents**: All operations
  - **Complexity**: Low

#### Validation Functions
- `validateInput()` (2881-2940, 60 lines) - Validates operation inputs
  - **Dependencies**: None
  - **Dependents**: All public methods
  - **Complexity**: Medium (validation rules)

- `validateOutput()` (2941-3000, 60 lines) - Validates LLM outputs
  - **Dependencies**: None
  - **Dependents**: All generation methods
  - **Complexity**: Medium (output checking)

#### Utility Functions
- `sleep()` (3001-3010, 10 lines) - Async sleep utility
  - **Dependencies**: None
  - **Dependents**: executeWithRetry
  - **Complexity**: Low

- `sanitizeInput()` (3011-3050, 40 lines) - Sanitizes user input
  - **Dependencies**: None
  - **Dependents**: All methods accepting external input
  - **Complexity**: Medium (sanitization rules)

- `extractCodeBlocks()` (3051-3110, 60 lines) - Extracts code from markdown
  - **Dependencies**: None
  - **Dependents**: Response parsing methods
  - **Complexity**: Medium (regex parsing)

#### Cleanup Functions
- `dispose()` (3111-3150, 40 lines) - Cleans up resources
  - **Dependencies**: None
  - **Dependents**: Extension deactivation
  - **Complexity**: Low

### 2. Responsibility Analysis

**API Communication** (15 functions):
- executeWithRateLimit
- executeWithRetry
- shouldRetry
- handleProviderError
- initializeProvider
- switchProvider
- updateConfiguration
- validateConfiguration
- estimateTokens
- truncateToTokenLimit
- getCachedResponse
- setCachedResponse
- generateCacheKey
- logOperation
- logPerformance

**Response Parsing** (8 functions):
- parseStructuredResponse
- parseTestResponse
- parseRefactoringResponse
- validateOutput
- extractCodeBlocks
- formatDocumentation
- formatTestOutput
- formatRefactoringOutput

**Document Generation** (4 functions):
- generateProductDocs
- generateFileSummary
- generateModuleSummary
- generateArchitectureInsights

**Test Generation** (4 functions):
- generateTestPlan
- generateUnitTests
- generateTestForFunction
- fixFailingTest

**Refactoring Analysis** (3 functions):
- analyzeForRefactoring
- generateRefactoringPlan
- generateExtractionSteps

**Context Gathering** (4 functions):
- getRelevantContext
- findRelatedFiles
- extractFunctionContext
- addCodeContext

**Prompt Construction** (3 functions):
- buildPrompt
- addSystemContext
- addCodeContext

**Batch Processing** (2 functions):
- processBatch
- batchWithConcurrencyLimit

**Progress Tracking** (2 functions):
- reportProgress
- createProgressToken

**State Management** (2 functions):
- getState
- resetState

**Validation** (3 functions):
- validateInput
- validateOutput
- sanitizeInput

**Error Handling** (2 functions):
- handleProviderError
- formatErrorMessage

**Utilities** (3 functions):
- sleep
- extractCodeBlocks
- dispose

### 3. Extraction Mapping

#### Extraction 1: API Communication Layer

**Extract to**: `src/ai/LLMApiClient.ts`

**Functions to Extract**:
- `executeWithRateLimit()` (lines 181-215): Core API execution with rate limiting
- `executeWithRetry()` (lines 216-264): Retry logic with exponential backoff
- `shouldRetry()` (lines 265-290): Error classification for retries
- `handleProviderError()` (lines 1601-1680): Provider-specific error handling
- `formatErrorMessage()` (lines 1681-1720): User-friendly error formatting
- `estimateTokens()` (lines 2221-2260): Token estimation
- `truncateToTokenLimit()` (lines 2261-2320): Content truncation

**Dependencies to Move**:
- RateLimiter instance
- RetryHandler instance
- Logger instance
- TokenCounter utility

**Dependencies to Inject**:
- LLMProvider (as interface, injected via constructor)
- Configuration (timeout, max retries, token limits)

**Breaking Changes**:
- All methods in llmService.ts that call API methods will need to use new LLMApiClient
- Error handling patterns will change to use centralized error handler

#### Extraction 2: Response Processing Layer

**Extract to**: `src/ai/ResponseProcessor.ts`

**Functions to Extract**:
- `parseStructuredResponse()` (lines 1271-1320): JSON extraction from markdown
- `parseTestResponse()` (lines 1321-1380): Test-specific parsing
- `parseRefactoringResponse()` (lines 1381-1450): Refactoring-specific parsing
- `validateOutput()` (lines 2941-3000): Output validation
- `extractCodeBlocks()` (lines 3051-3110): Code block extraction
- `sanitizeInput()` (lines 3011-3050): Input sanitization

**Dependencies to Move**:
- None (pure functions)

**Dependencies to Inject**:
- None (static utility class)

**Breaking Changes**:
- All methods parsing LLM responses need to import ResponseProcessor

#### Extraction 3: Document Generation Service

**Extract to**: `src/domain/services/DocumentGenerationService.ts`

**Functions to Extract**:
- `generateProductDocs()` (lines 291-390): Main doc generation orchestrator
- `generateFileSummary()` (lines 391-450): Single file summary
- `generateModuleSummary()` (lines 451-528): Module-level summary
- `generateArchitectureInsights()` (lines 529-620): Architecture analysis
- `formatDocumentation()` (lines 2521-2600): Documentation formatting

**Dependencies to Move**:
- PromptBuilder reference
- FileAnalyzer reference

**Dependencies to Inject**:
- LLMApiClient (from Extraction 1)
- ResponseProcessor (from Extraction 2)
- ProgressService
- PersistenceService

**Breaking Changes**:
- External commands calling generateProductDocs need new import
- Progress tracking callbacks may need adjustment

#### Extraction 4: Test Generation Service

**Extract to**: `src/domain/services/testing/TestGenerationService.ts`

**Functions to Extract**:
- `generateTestPlan()` (lines 621-710): Test planning
- `generateUnitTests()` (lines 711-820): Batch test generation
- `generateTestForFunction()` (lines 821-900): Single function test generation
- `fixFailingTest()` (lines 901-980): Test fixing logic
- `formatTestOutput()` (lines 2601-2670): Test output formatting

**Dependencies to Move**:
- TestConfigService reference
- FunctionAnalyzer reference

**Dependencies to Inject**:
- LLMApiClient
- ResponseProcessor
- ProgressService
- TestConfigService

**Breaking Changes**:
- Test generation commands need new import
- Test execution workflow needs service injection

#### Extraction 5: Refactoring Analysis Service

**Extract to**: `src/domain/services/RefactoringService.ts`

**Functions to Extract**:
- `analyzeForRefactoring()` (lines 981-1080): Refactoring opportunity detection
- `generateRefactoringPlan()` (lines 1081-1180): Refactoring strategy creation
- `generateExtractionSteps()` (lines 1181-1270): Step-by-step extraction guide
- `formatRefactoringOutput()` (lines 2671-2750): Refactoring output formatting

**Dependencies to Move**:
- ComplexityAnalyzer reference

**Dependencies to Inject**:
- LLMApiClient
- ResponseProcessor
- ProgressService

**Breaking Changes**:
- Refactoring commands need new import
- UI components displaying refactoring info need updates

#### Extraction 6: Context Gathering Service

**Extract to**: `src/domain/services/ContextGatheringService.ts`

**Functions to Extract**:
- `getRelevantContext()` (lines 1821-1920): Context aggregation
- `findRelatedFiles()` (lines 1921-2000): Related file discovery
- `extractFunctionContext()` (lines 2001-2080): Function-specific context
- `addCodeContext()` (lines 2451-2520): Code context formatting

**Dependencies to Move**:
- FileAnalyzer reference
- DependencyAnalyzer reference
- FunctionAnalyzer reference

**Dependencies to Inject**:
- WorkspaceScanner
- FileSystemService

**Breaking Changes**:
- All generation services need to use new ContextGatheringService
- Context format may change slightly

#### Extraction 7: Prompt Management Service

**Extract to**: `src/domain/services/PromptManagementService.ts`

**Functions to Extract**:
- `buildPrompt()` (lines 2321-2400): Prompt construction
- `addSystemContext()` (lines 2401-2450): System context addition
- `addCodeContext()` (lines 2451-2520): Code context addition (coordinate with Extraction 6)

**Dependencies to Move**:
- PromptBuilder reference

**Dependencies to Inject**:
- ContextGatheringService (from Extraction 6)

**Breaking Changes**:
- All generation methods need to use PromptManagementService

#### Extraction 8: Caching Service

**Extract to**: `src/ai/ResponseCache.ts`

**Functions to Extract**:
- `getCachedResponse()` (lines 1451-1480): Cache retrieval
- `setCachedResponse()` (lines 1481-1510): Cache storage
- `generateCacheKey()` (lines 1511-1540): Cache key generation

**Dependencies to Move**:
- Cache storage (Map or external cache)

**Dependencies to Inject**:
- None (self-contained)

**Breaking Changes**:
- LLMApiClient needs to use ResponseCache

#### Extraction 9: Batch Processing Utilities

**Extract to**: `src/infrastructure/BatchProcessor.ts`

**Functions to Extract**:
- `processBatch()` (lines 2081-2160): Batch operation handler
- `batchWithConcurrencyLimit()` (lines 2161-2220): Concurrency control

**Dependencies to Move**:
- None (pure utilities)

**Dependencies to Inject**:
- None (static utility functions)

**Breaking Changes**:
- Document and test generation services need to import BatchProcessor

### 4. Step-by-Step Migration Instructions

#### Migration 1: Extract API Communication Layer

**Step 1: Create Target File**

Create file `src/ai/LLMApiClient.ts`:

```typescript
import { RateLimiter } from './RateLimiter';
import { RetryHandler } from './RetryHandler';
import { LLMProvider } from './providers/LLMProvider';
import { TokenCounter } from './TokenCounter';
import { Logger } from '../infrastructure/Logger';

export interface LLMApiClientConfig {
  timeout: number;
  maxRetries: number;
  tokenLimit: number;
  rateLimitPerMinute: number;
}

export interface ApiCallOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export class LLMApiClient {
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;
  private tokenCounter: TokenCounter;
  private logger: Logger;
  
  constructor(
    private provider: LLMProvider,
    private config: LLMApiClientConfig,
    logger: Logger
  ) {
    this.rateLimiter = new RateLimiter(config.rateLimitPerMinute);
    this.retryHandler = new RetryHandler(config.maxRetries);
    this.tokenCounter = new TokenCounter();
    this.logger = logger;
  }

  async executeCall(options: ApiCallOptions): Promise<string> {
    // Validate and prepare call
    const validatedOptions = this.prepareCall(options);
    
    // Execute with rate limiting and retry
    return this.executeWithRateLimit(async () => {
      return this.executeWithRetry(async () => {
        try {
          const response = await this.provider.generateText(validatedOptions);
          this.logOperation('executeCall', true, validatedOptions.prompt.length);
          return response;
        } catch (error) {
          this.handleProviderError(error);
          throw error;
        }
      });
    });
  }

  private prepareCall(options: ApiCallOptions): ApiCallOptions {
    // Estimate tokens
    const estimatedTokens = this.estimateTokens(options.prompt);
    
    // Truncate if necessary
    if (estimatedTokens > this.config.tokenLimit) {
      options.prompt = this.truncateToTokenLimit(options.prompt, this.config.tokenLimit);
    }
    
    return options;
  }

  private async executeWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    await this.rateLimiter.acquire();
    try {
      return await fn();
    } finally {
      this.rateLimiter.release();
    }
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }
        
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        this.logger.warn(`Retry attempt ${attempt + 1} after ${delay}ms`, { error });
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.config.maxRetries) {
      return false;
    }
    
    // Retryable errors
    const retryableErrors = [
      'RATE_LIMIT_EXCEEDED',
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE'
    ];
    
    const errorCode = error?.code || error?.message || '';
    return retryableErrors.some(code => errorCode.includes(code));
  }

  private handleProviderError(error: any): void {
    const errorMessage = this.formatErrorMessage(error);
    this.logger.error('LLM Provider Error', { error, formattedMessage: errorMessage });
    
    // Enhanced error with user-friendly message
    if (error) {
      error.userMessage = errorMessage;
    }
  }

  private formatErrorMessage(error: any): string {
    if (error?.code === 'RATE_LIMIT_EXCEEDED') {
      return 'API rate limit exceeded. Please wait a moment and try again.';
    }
    if (error?.code === 'INVALID_API_KEY') {
      return 'Invalid API key. Please check your configuration.';
    }
    if (error?.code === 'TIMEOUT') {
      return 'Request timed out. Please try again.';
    }
    return error?.message || 'An unexpected error occurred with the AI provider.';
  }

  private estimateTokens(text: string): number {
    return this.tokenCounter.estimate(text);
  }

  private truncateToTokenLimit(text: string, limit: number): string {
    return this.tokenCounter.truncate(text, limit);
  }

  private logOperation(operation: string, success: boolean, promptLength: number): void {
    this.logger.info(`API Operation: ${operation}`, {
      success,
      promptLength,
      timestamp: new Date().toISOString()
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Step 2: Extract Functions**

The functions are extracted into the class above. Key changes:
- All functions are now methods of LLMApiClient class
- Dependencies are injected via constructor
- Rate limiter and retry handler are encapsulated
- Error handling is centralized

**Step 3: Update Source File**

Update `src/llmService.ts`:

```typescript
import { LLMApiClient, LLMApiClientConfig } from '../ai/LLMApiClient';
import { LLMProvider } from '../ai/providers/LLMProvider';
import { LLMProviderFactory } from '../ai/providers/LLMProviderFactory';
import { ConfigManager } from '../config/ConfigManager';
import { Logger } from '../infrastructure/Logger';

export class LLMService {
  private apiClient: LLMApiClient | null = null;
  private provider: LLMProvider | null = null;
  
  constructor(
    private configManager: ConfigManager,
    private logger: Logger
  ) {
    this.initializeProvider();
  }

  private async initializeProvider(): Promise<void> {
    const config = this.configManager.getLLMConfig();
    
    // Create provider
    this.provider = LLMProviderFactory.create(config);
    
    // Create API client with configuration
    const apiConfig: LLMApiClientConfig = {
      timeout: config.timeout || 300000,
      maxRetries: config.maxRetries || 3,
      tokenLimit: config.tokenLimit || 4000,
      rateLimitPerMinute: config.rateLimitPerMinute || 20
    };
    
    this.apiClient = new LLMApiClient(this.provider, apiConfig, this.logger);
  }

  async switchProvider(providerName: string): Promise<void> {
    this.logger.info(`Switching provider to: ${providerName}`);
    await this.initializeProvider();
  }

  // All API calls now delegate to apiClient
  private async callLLM(prompt: string, options?: any): Promise<string> {
    if (!this.apiClient) {
      throw new Error('LLM API client not initialized');
    }
    
    return this.apiClient.executeCall({
      prompt,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      stopSequences: options?.stopSequences
    });
  }

  // Rest of the service methods that use callLLM...
  // (Document generation, test generation, etc. - these will be extracted in later steps)
}
```

**Step 4: Update Dependent Files**

No direct dependent files at this stage - LLMService encapsulates all API calls.

**Step 5: Handle Dependencies**

Dependencies resolved:
- ✅ RateLimiter: Instantiated within LLMApiClient
- ✅ RetryHandler: Instantiated within LLMApiClient
- ✅ TokenCounter: Instantiated within LLMApiClient
- ✅ Logger: Injected via constructor
- ✅ LLMProvider: Injected via constructor

**Step 6: Testing**

Test checklist:
- [ ] Test API call with rate limiting
- [ ] Test retry logic with transient errors
- [ ] Test non-retryable errors fail immediately
- [ ] Test token estimation and truncation
- [ ] Test error message formatting
- [ ] Test provider switching doesn't break API client

---

#### Migration 2: Extract Response Processing Layer

**Step 1: Create Target File**

Create file `src/ai/ResponseProcessor.ts`:

```typescript
export interface ParsedResponse<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
}

export interface TestResponse {
  testCode: string;
  description: string;
  framework: string;
  dependencies: string[];
}

export interface Refac