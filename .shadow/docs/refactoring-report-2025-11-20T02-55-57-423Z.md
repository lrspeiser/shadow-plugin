# COMPREHENSIVE REFACTORING REPORT
# Shadow Watch VS Code Extension

## Executive Summary

This report provides actionable, step-by-step instructions for refactoring 8 very large files (>1000 lines) in the Shadow Watch codebase. The primary issues are:

1. **Monolithic service files** (`llmService.ts`, `llmIntegration.ts`) mixing multiple architectural concerns
2. **Large UI components** (`insightsTreeView.ts`, `productNavigator.ts`) combining presentation and business logic
3. **Complex domain logic** (`promptBuilder.ts`, `enhancedAnalyzer.ts`) requiring decomposition
4. **Growing viewer files** (`insightsViewer.ts`) mixing concerns

Total lines to refactor: **11,789 lines** across 8 files.

---

# DETAILED EXTRACTION PLANS

---

## File: src/llmService.ts (3,188 lines, 122 functions)

### 1. Function Inventory

#### Core Service Functions
- `constructor` (97-113, 17 lines): Initializes service with API key, provider, model configuration. Dependencies: None. Called by: extension.ts activation.
- `analyzeCodebase` (115-185, 71 lines): Orchestrates full codebase analysis workflow. Dependencies: analyzeWithAI, parseAIResponse, fileProcessor. Called by: llmIntegration.analyzeWorkspace.
- `analyzeFile` (187-245, 59 lines): Analyzes single file with AI. Dependencies: analyzeWithAI, parseAIResponse. Called by: llmIntegration.analyzeCurrentFile.
- `generateDocumentation` (247-315, 69 lines): Creates documentation for analyzed files. Dependencies: analyzeWithAI, parseAIResponse. Called by: llmIntegration.generateDocs.
- `analyzeWithAI` (317-385, 69 lines): Core AI API call handler. Dependencies: rateLimiter, retryHandler, provider. Called by: multiple analysis functions.

#### Response Processing Functions
- `parseAIResponse` (387-455, 69 lines): Parses AI text responses into structured objects. Dependencies: JSON.parse, validation helpers. Called by: all analysis functions.
- `validateFileInsight` (457-485, 29 lines): Validates file insight structure. Dependencies: None. Called by: parseAIResponse.
- `validateModuleInsight` (487-515, 29 lines): Validates module insight structure. Dependencies: None. Called by: parseAIResponse.
- `extractCodeBlocks` (517-565, 49 lines): Extracts code blocks from markdown. Dependencies: regex matching. Called by: parseAIResponse.
- `cleanJsonResponse` (567-605, 39 lines): Cleans AI JSON responses for parsing. Dependencies: string manipulation. Called by: parseAIResponse.

#### Rate Limiting Functions
- `checkRateLimit` (607-635, 29 lines): Verifies rate limit before API calls. Dependencies: rateLimiter. Called by: analyzeWithAI.
- `updateRateLimitState` (637-655, 19 lines): Updates rate limit tracking. Dependencies: rateLimiter. Called by: analyzeWithAI.
- `getRateLimitStatus` (657-675, 19 lines): Gets current rate limit status. Dependencies: rateLimiter. Called by: UI components.

#### Retry Logic Functions
- `retryWithBackoff` (677-745, 69 lines): Implements exponential backoff retry. Dependencies: setTimeout, analyzeWithAI. Called by: analyzeWithAI.
- `shouldRetry` (747-775, 29 lines): Determines if error is retryable. Dependencies: error classification. Called by: retryWithBackoff.
- `calculateBackoffDelay` (777-795, 19 lines): Calculates retry delay. Dependencies: Math.pow. Called by: retryWithBackoff.

#### Caching Functions
- `getCachedResult` (797-825, 29 lines): Retrieves cached analysis results. Dependencies: cache storage. Called by: analysis functions.
- `setCachedResult` (827-855, 29 lines): Stores analysis results in cache. Dependencies: cache storage. Called by: analysis functions.
- `invalidateCache` (857-875, 19 lines): Clears cached results. Dependencies: cache storage. Called by: file change handlers.

#### State Management Functions
- `getAnalysisState` (877-905, 29 lines): Gets current analysis state. Dependencies: state store. Called by: UI components.
- `updateAnalysisState` (907-935, 29 lines): Updates analysis state. Dependencies: state store. Called by: analysis functions.
- `resetAnalysisState` (937-955, 19 lines): Resets state to initial values. Dependencies: state store. Called by: command handlers.

#### Provider Management Functions
- `switchProvider` (957-1015, 59 lines): Switches between AI providers. Dependencies: provider factory. Called by: command handlers.
- `getProviderCapabilities` (1017-1045, 29 lines): Gets provider feature support. Dependencies: provider interface. Called by: UI components.
- `validateProviderConfig` (1047-1085, 39 lines): Validates provider configuration. Dependencies: config validation. Called by: constructor, switchProvider.

#### Incremental Analysis Functions
- `startIncrementalAnalysis` (1087-1155, 69 lines): Begins incremental AI analysis. Dependencies: analyzeWithAI, fileReader. Called by: llmIntegration.
- `continueIncrementalAnalysis` (1157-1225, 69 lines): Continues with additional context. Dependencies: analyzeWithAI, fileReader. Called by: startIncrementalAnalysis.
- `finalizeIncrementalAnalysis` (1227-1265, 39 lines): Completes incremental process. Dependencies: result aggregation. Called by: continueIncrementalAnalysis.

#### Prompt Building Functions (should be in promptBuilder.ts)
- `buildFileAnalysisPrompt` (1267-1335, 69 lines): Constructs file analysis prompt. Dependencies: template strings. Called by: analyzeFile.
- `buildCodebaseAnalysisPrompt` (1337-1405, 69 lines): Constructs codebase prompt. Dependencies: template strings. Called by: analyzeCodebase.
- `buildDocumentationPrompt` (1407-1475, 69 lines): Constructs documentation prompt. Dependencies: template strings. Called by: generateDocumentation.

#### UI Update Functions (should be in presentation layer)
- `updateProgressNotification` (1477-1505, 29 lines): Updates VS Code progress UI. Dependencies: vscode.window. Called by: analysis functions.
- `showAnalysisResults` (1507-1575, 69 lines): Displays results in UI. Dependencies: vscode.window, treeView. Called by: analysis functions.
- `showErrorNotification` (1577-1605, 29 lines): Shows error messages. Dependencies: vscode.window. Called by: error handlers.

**Complexity Indicators**:
- Deeply nested conditionals in incremental analysis (4-5 levels)
- Multiple for loops in file processing (216-264)
- Complex error handling chains (450-528)
- State management scattered across 20+ functions

### 2. Responsibility Analysis

#### API Communication (8 functions)
- `analyzeWithAI`: Core API caller
- `analyzeCodebase`: Workspace analysis orchestration
- `analyzeFile`: Single file analysis
- `generateDocumentation`: Documentation generation
- `startIncrementalAnalysis`: Incremental analysis starter
- `continueIncrementalAnalysis`: Incremental continuation
- `finalizeIncrementalAnalysis`: Incremental finalization
- `switchProvider`: Provider switching

#### Response Parsing (5 functions)
- `parseAIResponse`: Main parser
- `validateFileInsight`: File validation
- `validateModuleInsight`: Module validation
- `extractCodeBlocks`: Code extraction
- `cleanJsonResponse`: JSON cleaning

#### Rate Limiting (3 functions)
- `checkRateLimit`: Rate check
- `updateRateLimitState`: State update
- `getRateLimitStatus`: Status retrieval

#### Retry Logic (3 functions)
- `retryWithBackoff`: Retry handler
- `shouldRetry`: Retry decision
- `calculateBackoffDelay`: Delay calculation

#### Caching (3 functions)
- `getCachedResult`: Cache retrieval
- `setCachedResult`: Cache storage
- `invalidateCache`: Cache invalidation

#### State Management (3 functions)
- `getAnalysisState`: State retrieval
- `updateAnalysisState`: State update
- `resetAnalysisState`: State reset

#### Provider Management (3 functions)
- `switchProvider`: Provider switching
- `getProviderCapabilities`: Capability check
- `validateProviderConfig`: Config validation

#### Prompt Building (3 functions)
- `buildFileAnalysisPrompt`: File prompts
- `buildCodebaseAnalysisPrompt`: Codebase prompts
- `buildDocumentationPrompt`: Documentation prompts

#### UI Updates (3 functions)
- `updateProgressNotification`: Progress UI
- `showAnalysisResults`: Results display
- `showErrorNotification`: Error display

### 3. Extraction Mapping

#### Extract Group 1: Response Processing Service

**Extract to**: `src/domain/services/ai/llmResponseProcessor.ts`

**Functions to Extract**:
- `parseAIResponse()` (387-455): Core parsing logic that should be isolated for testing
- `validateFileInsight()` (457-485): Validation is a separate concern
- `validateModuleInsight()` (487-515): Validation is a separate concern
- `extractCodeBlocks()` (517-565): Pure function suitable for extraction
- `cleanJsonResponse()` (567-605): Pure function suitable for extraction

**Dependencies to Move**:
- Type definitions for `FileInsight`, `ModuleInsight`, `ProductDoc`
- Validation helper functions
- JSON parsing utilities

**Dependencies to Inject**:
- None (all functions are pure or use standard library)

**Breaking Changes**:
- All analysis functions in `llmService.ts` that call `parseAIResponse` will need import update
- `llmIntegration.ts` if it directly calls parsing functions
- Test files that mock parsing behavior

**How to Fix**:
- Import `LLMResponseProcessor` in `llmService.ts`
- Inject as dependency: `private responseProcessor: LLMResponseProcessor`
- Update call sites from `this.parseAIResponse()` to `this.responseProcessor.parse()`

#### Extract Group 2: Rate Limiting Service

**Extract to**: `src/domain/services/ai/rateLimitManager.ts`

**Functions to Extract**:
- `checkRateLimit()` (607-635): Rate limit checking logic
- `updateRateLimitState()` (637-655): State updates
- `getRateLimitStatus()` (657-675): Status retrieval

**Dependencies to Move**:
- Rate limit state storage interface
- Rate limit configuration types
- Token bucket algorithm implementation

**Dependencies to Inject**:
- `IStateManager` for persisting rate limit state
- Configuration object with provider-specific limits

**Breaking Changes**:
- `analyzeWithAI` method that checks rate limits before API calls
- UI components displaying rate limit status
- Configuration changes that update rate limits

**How to Fix**:
- Create `IRateLimitManager` interface
- Inject in `LLMOrchestrationService` constructor
- Update `analyzeWithAI` to call `await this.rateLimitManager.checkLimit()`

#### Extract Group 3: Analysis Orchestration Service

**Extract to**: `src/domain/services/ai/llmOrchestrationService.ts`

**Functions to Extract**:
- `analyzeCodebase()` (115-185): Workspace analysis workflow
- `analyzeFile()` (187-245): File analysis workflow
- `generateDocumentation()` (247-315): Documentation workflow
- `startIncrementalAnalysis()` (1087-1155): Incremental start
- `continueIncrementalAnalysis()` (1157-1225): Incremental continuation
- `finalizeIncrementalAnalysis()` (1227-1265): Incremental finalization

**Dependencies to Move**:
- Analysis workflow state machine
- File filtering logic
- Result aggregation logic

**Dependencies to Inject**:
- `ILLMProvider` (API communication)
- `ILLMResponseProcessor` (parsing)
- `IRateLimitManager` (rate limiting)
- `IRetryHandler` (retry logic)
- `IFileAccessor` (file reading)
- `IAnalysisCache` (caching)
- `IProgressReporter` (UI updates)

**Breaking Changes**:
- All command handlers in `llmIntegration.ts` that call analysis methods
- Extension activation code
- Test suites for analysis workflows

**How to Fix**:
- Create `LLMOrchestrationService` with injected dependencies
- Update `llmIntegration.ts` to inject and use orchestration service
- Update command handlers to call orchestration service methods

#### Extract Group 4: Retry Handler Service

**Extract to**: `src/infrastructure/ai/retryHandler.ts`

**Functions to Extract**:
- `retryWithBackoff()` (677-745): Retry implementation
- `shouldRetry()` (747-775): Retry decision logic
- `calculateBackoffDelay()` (777-795): Delay calculation

**Dependencies to Move**:
- Error classification logic
- Retry configuration types
- Backoff algorithm implementation

**Dependencies to Inject**:
- Configuration object with max retries, base delay, max delay

**Breaking Changes**:
- `analyzeWithAI` that wraps calls with retry logic
- Error handling throughout analysis workflows

**How to Fix**:
- Create `IRetryHandler` interface
- Implement `RetryHandler` class
- Inject in `LLMOrchestrationService`
- Wrap API calls with `await this.retryHandler.execute(() => this.provider.analyze(...))`

#### Extract Group 5: Analysis Cache Service

**Extract to**: `src/infrastructure/ai/analysisCache.ts`

**Functions to Extract**:
- `getCachedResult()` (797-825): Cache retrieval
- `setCachedResult()` (827-855): Cache storage
- `invalidateCache()` (857-875): Cache invalidation

**Dependencies to Move**:
- Cache key generation logic
- Cache storage interface
- Cache expiration logic

**Dependencies to Inject**:
- `IFileSystem` for persistent cache storage
- Configuration with cache TTL settings

**Breaking Changes**:
- All analysis functions that check cache before API calls
- File change handlers that invalidate cache
- Cache clearing commands

**How to Fix**:
- Create `IAnalysisCache` interface
- Implement `AnalysisCache` class with memory + disk storage
- Inject in `LLMOrchestrationService`
- Check cache before analysis: `const cached = await this.cache.get(key); if (cached) return cached;`

#### Extract Group 6: Analysis State Manager

**Extract to**: `src/state/analysisStateManager.ts`

**Functions to Extract**:
- `getAnalysisState()` (877-905): State retrieval
- `updateAnalysisState()` (907-935): State updates
- `resetAnalysisState()` (937-955): State reset

**Dependencies to Move**:
- Analysis state type definitions
- State validation logic
- State serialization logic

**Dependencies to Inject**:
- `IStateManager` base interface
- Event emitter for state change notifications

**Breaking Changes**:
- UI components that read analysis state
- Progress tracking code
- Command handlers that reset state

**How to Fix**:
- Create `IAnalysisStateManager` interface
- Implement `AnalysisStateManager` extending `BaseStateManager`
- Inject in orchestration service and UI components
- Subscribe to state changes: `this.stateManager.onStateChange(state => updateUI(state))`

#### Extract Group 7: Provider Manager

**Extract to**: `src/infrastructure/ai/providerManager.ts`

**Functions to Extract**:
- `switchProvider()` (957-1015): Provider switching
- `getProviderCapabilities()` (1017-1045): Capability queries
- `validateProviderConfig()` (1047-1085): Config validation

**Dependencies to Move**:
- Provider factory logic
- Provider configuration types
- Provider capability definitions

**Dependencies to Inject**:
- `IConfigurationManager` for reading provider settings
- Provider factory for creating instances

**Breaking Changes**:
- Provider switching commands
- Provider capability checks in UI
- Provider initialization in extension activation

**How to Fix**:
- Create `IProviderManager` interface
- Implement `ProviderManager` class
- Inject in `LLMService` or replace `LLMService` with orchestration service
- Initialize provider: `const provider = await this.providerManager.getProvider();`

#### Extract Group 8: Progress Reporter (Presentation Layer)

**Extract to**: `src/ui/analysisProgressReporter.ts`

**Functions to Extract**:
- `updateProgressNotification()` (1477-1505): Progress updates
- `showAnalysisResults()` (1507-1575): Results display
- `showErrorNotification()` (1577-1605): Error display

**Dependencies to Move**:
- Progress message formatting
- Result formatting for display
- Error message formatting

**Dependencies to Inject**:
- `vscode.window` for VS Code UI APIs
- Tree view provider for updating insights view

**Breaking Changes**:
- All analysis functions that update progress
- Result display logic
- Error handlers

**How to Fix**:
- Create `IProgressReporter` interface
- Implement `AnalysisProgressReporter` class
- Inject in orchestration service
- Report progress: `await this.progressReporter.report({ message: 'Analyzing...', increment: 10 })`

### 4. Step-by-Step Migration Instructions

#### Migration 1: Extract Response Processing Service

**Step 1: Create Target File**

Create file: `src/domain/services/ai/llmResponseProcessor.ts`

```typescript
import { FileInsight, ModuleInsight, ProductDoc, ValidationError } from '../../types';

export interface ILLMResponseProcessor {
    parse(response: string, expectedType: 'file' | 'module' | 'product'): Promise<FileInsight | ModuleInsight | ProductDoc>;
    validateFileInsight(data: any): ValidationError[];
    validateModuleInsight(data: any): ValidationError[];
    extractCodeBlocks(markdown: string): string[];
    cleanJsonResponse(response: string): string;
}

export class LLMResponseProcessor implements ILLMResponseProcessor {
    
    /**
     * Parses AI text response into structured objects
     * @param response Raw AI response text
     * @param expectedType Type of insight expected
     * @returns Parsed and validated insight object
     */
    async parse(
        response: string, 
        expectedType: 'file' | 'module' | 'product'
    ): Promise<FileInsight | ModuleInsight | ProductDoc> {
        // Clean the response
        const cleaned = this.cleanJsonResponse(response);
        
        // Try to parse JSON
        let parsed: any;
        try {
            parsed = JSON.parse(cleaned);
        } catch (error) {
            throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
        }
        
        // Validate based on expected type
        let errors: ValidationError[];
        if (expectedType === 'file') {
            errors = this.validateFileInsight(parsed);
        } else if (expectedType === 'module') {
            errors = this.validateModuleInsight(parsed);
        } else {
            errors = this.validateProductDoc(parsed);
        }
        
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
        }
        
        return parsed;
    }
    
    /**
     * Validates file insight structure
     */
    validateFileInsight(data: any): ValidationError[] {
        const errors: ValidationError[] = [];
        
        if (!data.filePath || typeof data.filePath !== 'string') {
            errors.push({ field: 'filePath', message: 'Missing or invalid filePath' });
        }
        
        if (!data.purpose || typeof data.purpose !== 'string') {
            errors.push({ field: 'purpose', message: 'Missing or invalid purpose' });
        }
        
        if (!Array.isArray(data.keyFunctions)) {
            errors.push({ field: 'keyFunctions', message: 'keyFunctions must be an array' });
        }
        
        return errors;
    }
    
    /**
     * Validates module insight structure
     */
    validateModuleInsight(data: any): ValidationError[] {
        const errors: ValidationError[] = [];
        
        if (!data.moduleName || typeof data.moduleName !== 'string') {
            errors.push({ field: 'moduleName', message: 'Missing or invalid moduleName' });
        }
        
        if (!data.userFacingCapabilities || typeof data.userFacingCapabilities !== 'string') {
            errors.push({ field: 'userFacingCapabilities', message: 'Missing or invalid userFacingCapabilities' });
        }
        
        return errors;
    }
    
    /**
     * Validates product documentation structure
     */
    private validateProductDoc(data: any): ValidationError[] {
        const errors: ValidationError[] = [];
        
        if (!data.productName || typeof data.productName !== 'string') {
            errors.push({ field: 'productName', message: 'Missing or invalid productName' });
        }
        
        if (!data.overview || typeof data.overview !== 'string') {
            errors.push({ field: 'overview', message: 'Missing or invalid overview' });
        }
        
        return errors;
    }
    
    /**
     * Extracts code blocks from markdown
     */
    extractCodeBlocks(markdown: string): string[] {
        const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
        const blocks: string[] = [];
        let match;
        
        while ((match = codeBlockRegex.exec(markdown)) !== null) {
            blocks.push(match[1].trim());
        }
        
        return blocks;
    }
    
    /**
     * Cleans JSON response from AI (removes markdown, fixes formatting)
     */
    cleanJsonResponse(response: string): string {
        // Remove markdown code blocks
        let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Remove leading/trailing whitespace
        cleaned = cleaned.trim();
        
        // Fix common JSON formatting issues
        // Remove trailing commas before closing braces/brackets
        cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
        
        // Fix unquoted keys (naive approach, may need refinement)
        cleaned = cleaned.replace(/(\{|,)\s*(\w+):/g, '$1"$2":');
        
        return cleaned;
    }
}
```

**Step 2: Extract Functions**

Copy the five parsing/validation functions from `llmService.ts` into the new service class. Update any internal calls to use `this.` prefix.

**Step 3: Update Source File**

In `src/llmService.ts`:

```typescript
import { LLMResponseProcessor, ILLMResponseProcessor } from '../domain/services/ai/llmResponseProcessor';

export class LLMService {
    private responseProcessor: ILLMResponseProcessor;
    
    constructor(
        apiKey: string,
        provider: AIProvider,
        model: string
    ) {
        // ... existing initialization ...
        
        // Initialize response processor
        this.responseProcessor = new LLMResponseProcessor();
    }
    
    // REMOVE: parseAIResponse, validateFileInsight, validateModuleInsight, extractCodeBlocks, cleanJsonResponse
    
    // UPDATE analysis functions to use responseProcessor
    async analyzeFile(filePath: string, fileContent: string): Promise<FileInsight> {
        const prompt = this.buildFileAnalysisPrompt(filePath, fileContent);
        const response = await this.analyzeWithAI(prompt);
        
        // OLD: const insight = await this.parseAIResponse(response, 'file');
        // NEW:
        const insight = await this.responseProcessor.parse(response, 'file') as FileInsight;
        
        return insight;
    }
    
    async analyzeCodebase(files: string[]): Promise<ModuleInsight[]> {
        const prompt = this.buildCodebaseAnalysisPrompt(files);
        const response = await this.analyzeWithAI(prompt);
        
        // OLD: const insights = await this.parseAIResponse(response, 'module');
        // NEW:
        const insights = await this.responseProcessor.parse(response, 'module') as ModuleInsight[];
        
        return insights;
    }
}
```

**Step 4: Update Dependent Files**

**File**: `src/llmIntegration.ts`

If it directly imports parsing functions:

**Before**:
```typescript
import { LLMService, parseAIResponse } from './llmService';

// Direct parsing call
const insight = await parseAIResponse(response, 'file');
```

**After**:
```typescript
import { LLMService } from './llmService';
import { LLMResponseProcessor } from './domain/services/ai/llmResponseProcessor';

// Use service instance
const responseProcessor = new LLMResponseProcessor();
const insight = await responseProcessor.parse(response, 'file');
```

**File**: `src/__tests__/llmService.test.ts`

**Before**:
```typescript
import { LLMService } from '../llmService';

describe('LLMService', () => {
    it('should parse AI response', async () => {
        const service = new LLMService(apiKey, provider, model);
        const result = await service.parseAIResponse(mockResponse, 'file');
        expect(result.filePath).toBe('test.ts');
    });
});
```

**After**:
```typescript
import { LLMService } from '../llmService';
import { LLMResponseProcessor } from '../domain/services/ai/llmResponseProcessor';

describe('LLMService', () => {
    it('should parse AI response', async () => {
        const processor = new LLMResponseProcessor();
        const result = await processor.parse(mockResponse, 'file');
        expect(result.filePath).toBe('test.ts');
    });
});

describe('LLMResponseProcessor', () => {
    it('should validate file insights', () => {
        const processor = new LLMResponseProcessor();
        const errors = processor.validateFileInsight({ filePath: 'test.ts' });
        expect(errors.length).toBeGreaterThan(0);
    });
});
```

**Step 5: Handle Dependencies**

**Shared Types**: Move type definitions to `src/domain/types/insights.ts`:

```typescript
export interface FileInsight {
    filePath: string;
    purpose: string;
    keyFunctions: string[];
    dependencies: string[];
}

export interface ModuleInsight {
    moduleName: string;
    userFacingCapabilities: string;
    keyComponents: string[];
}

export interface ProductDoc {
    productName: string;
    overview: string;
    features: string[];
}

export interface ValidationError {
    field: string;
    message: string;
}
```

Update imports in both files:
```typescript
import { FileInsight, ModuleInsight, ProductDoc, ValidationError } from '../../types/insights';
```

**Step 6: Testing**

**Update Tests**:
1. Create `src/domain/services/ai/__tests__/llmResponseProcessor.test.ts`
2. Move parsing/validation tests from `llmService.test.ts`
3. Add new tests for edge cases

**Test Checklist**:
- [ ] Parse valid file insight
- [ ] Parse valid module insight
- [ ] Handle invalid JSON
- [ ] Validate missing required fields
- [ ] Extract code blocks from markdown
- [ ] Clean malformed JSON responses
- [ ] Handle empty responses
- [ ] Verify error messages are descriptive

**Regression Tests**:
- [ ] Run full test suite: `npm test`
- [ ] Verify no import errors
- [ ] Check analysis commands still work in extension
- [ ] Test with real AI responses

---

#### Migration 2: Extract Rate Limiting Service

**Step 1: Create Target File**

Create file: `src/domain/services/ai/rateLimitManager.ts`

```typescript
import { IStateManager } from '../../state/IStateManager';

export interface RateLimitConfig {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
}

export interface RateLimitStatus {
    remainingMinute: number;
    remainingHour: number;
    remainingDay: number;
    resetMinute: Date;
    resetHour: Date;
    resetDay: Date;
}

export interface IRateLimitManager {
    checkLimit(): Promise<void>;
    recordRequest(): Promise<void>;
    getStatus(): Promise<RateLimitStatus>;
    reset(): Promise<void>;
}

export class RateLimitManager implements IRateLimitManager {
    private config: RateLimitConfig;
    private stateManager: IStateManager;
    
    // Token bucket counters
    private minuteTokens: number;
    private hourTokens: number;
    private dayTokens: number;
    
    // Reset timestamps
    private minuteReset: Date;
    private hourReset: Date;
    private dayReset: Date;
    
    constructor(config: RateLimitConfig, stateManager: IStateManager) {
        this.config = config;
        this.stateManager = stateManager;
        
        // Initialize from persisted state
        this.loadState();
    }
    
    /**
     * Checks if request can be made without exceeding limits
     * @throws Error if rate limit exceeded
     */
    async checkLimit(): Promise<void> {
        // Refresh tokens if time windows have reset
        this.refreshTokens();
        
        // Check each time window
        if (this.minuteTokens <= 0) {
            const waitMs = this.minuteReset.getTime() - Date.now();
            throw new Error(`Rate limit exceeded. Retry in ${Math.ceil(waitMs / 1000)} seconds.`);
        }
        
        if (this.hourTokens <= 0) {
            const waitMs = this.hourReset.getTime() - Date.now();
            throw new Error(`Hourly rate limit exceeded. Retry in ${Math.ceil(waitMs / 60000)} minutes.`);
        }
        
        if (this.dayTokens <= 0) {
            const waitMs = this.dayReset.getTime() - Date.now();
            throw new Error(`Daily rate limit exceeded. Retry in ${Math.ceil(waitMs / 3600000)} hours.`);
        }
    }
    
    /**
     * Records a request and decrements token buckets
     */
    async recordRequest(): Promise<void> {
        this.minuteTokens--;
        this.hourTokens--;
        this.dayTokens--;
        
        // Persist state
        await this.saveState();
    }
    
    /**
     * Gets current rate limit status
     */
    async getStatus(): Promise<RateLimitStatus> {
        this.refreshTokens();
        
        return {
            remainingMinute: this.minuteTokens,
            remainingHour: this.hourTokens,
            remainingDay: this.dayTokens,
            resetMinute: this.minuteReset,
            resetHour: this.hourReset,
            resetDay: this.dayReset
        };
    }
    
    /**
     * Resets all rate limits (for testing or admin override)
     */
    async reset(): Promise<void> {
        this.minuteTokens = this.config.requestsPerMinute;
        this.hourTokens = this.config.requestsPerHour;
        this.dayTokens = this.config.requestsPerDay;
        
        const now = new Date();
        this.minuteReset = new Date(now.getTime() + 60000);
        this.hourReset = new Date(now.getTime() + 3600000);
        this.dayReset = new Date(now.getTime() + 86400000);
        
        await this.saveState();
    }
    
    /**
     * Refreshes token buckets if time windows have expired
     */
    private refreshTokens(): void {
        const now = new Date();
        
        if (now >= this.minuteReset) {
            