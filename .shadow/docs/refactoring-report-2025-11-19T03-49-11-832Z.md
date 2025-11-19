# Comprehensive Refactoring Report

## Executive Summary

Shadow Watch exhibits a **split architecture** with modern domain-driven components coexisting alongside massive legacy monoliths. The two primary technical debt items—`src/llmService.ts` (2,321 lines, 97 functions) and `src/llmIntegration.ts` (2,246 lines, 158 functions)—represent God Objects that violate Single Responsibility Principle and block architectural progress. The codebase contains duplicate analyzer implementations, circular dependencies between core services, and presentation components that mix concerns. However, the emerging domain structure in `src/domain/`, the AI provider abstraction layer, and the incremental analysis system demonstrate solid architectural decisions that align with product goals.

**Critical Priorities:**
1. Decompose monolithic LLM services into focused, single-responsibility classes
2. Eliminate duplicate analyzer implementations
3. Break circular dependencies through interface-based dependency inversion
4. Refactor massive viewer components using presenter pattern
5. Organize root directory and establish clear service layer boundaries

**Estimated Total Effort:** 18-24 developer weeks across 5 major refactoring initiatives. Recommended approach is iterative, starting with low-risk organizational improvements and progressing to structural decomposition.

---

## Complexity Analysis

### High-Complexity Files Requiring Decomposition

#### 1. src/llmService.ts (2,321 lines, 97 functions)
**Complexity Issues:**
- Handles 8+ distinct responsibilities: API communication, response parsing, rate limiting, retry logic, caching, state management, error handling, and formatting
- 128-line loop (lines 716-843) with 31-line nested conditional (lines 740-770)
- 81-line loop (lines 419-499) with multiple nested conditionals
- 64-line loop (lines 1077-1140) with 38-line nested conditional block
- Method complexity averages 20+ lines per function with deep nesting

**Refactoring Strategy:**
```
Current Structure:
src/llmService.ts (2321 lines)
└── Everything (API, parsing, retry, cache, format, state)

Proposed Structure:
src/ai/
├── services/
│   ├── llmApiService.ts (API communication only, ~200 lines)
│   ├── llmOrchestrationService.ts (coordinates operations, ~300 lines)
├── middleware/
│   ├── rateLimitMiddleware.ts (~150 lines)
│   ├── retryMiddleware.ts (~150 lines)
│   ├── cacheMiddleware.ts (~200 lines)
├── parsers/
│   ├── productDocsParser.ts (~150 lines)
│   ├── architectureInsightsParser.ts (~150 lines)
│   ├── unitTestParser.ts (~150 lines)
└── validators/
    └── responseValidator.ts (~100 lines)
```

**Implementation Steps:**
1. Extract `src/ai/services/llmApiService.ts` with pure API call logic (no retry, no caching)
2. Create middleware wrapper pattern: `RateLimitMiddleware.wrap(RetryMiddleware.wrap(CacheMiddleware.wrap(apiService)))`
3. Move response parsing functions to `src/ai/parsers/` with one parser per response type
4. Extract validation logic to `src/ai/validators/responseValidator.ts`
5. Create `src/ai/services/llmOrchestrationService.ts` that coordinates parsers, validators, and middleware-wrapped API service
6. Update `src/llmIntegration.ts` to use orchestration service instead of direct llmService calls

**Estimated Effort:** 5-6 developer weeks

---

#### 2. src/llmIntegration.ts (2,246 lines, 158 functions)
**Complexity Issues:**
- 305-line function `generateLLMInsights` (lines 379-683) with 41-line nested conditional
- 238-line function `runComprehensiveAnalysis` (lines 1592-1829) with multiple nested blocks
- 244-line function `runUnitTests` (lines 1834-2077) with 146-line loop containing nested logic
- 197-line function `generateUnitTests` (lines 1381-1577)
- Mixes UI logic, business logic, file I/O, and API orchestration in single file

**Refactoring Strategy:**
```
Current Structure:
src/llmIntegration.ts (2246 lines)
└── Command handlers, UI updates, API calls, file I/O, state management

Proposed Structure:
src/application/
├── commands/
│   ├── generateProductDocsCommand.ts (~150 lines)
│   ├── generateInsightsCommand.ts (~150 lines)
│   ├── generateUnitTestsCommand.ts (~200 lines)
│   ├── runAnalysisCommand.ts (~200 lines)
│   └── runUnitTestsCommand.ts (~200 lines)
├── services/
│   ├── documentationService.ts (~200 lines)
│   ├── insightsService.ts (~200 lines)
│   └── testingService.ts (~250 lines)
└── presenters/
    ├── productDocsPresenter.ts (~150 lines)
    ├── insightsPresenter.ts (~150 lines)
    └── testReportPresenter.ts (~150 lines)
```

**Implementation Steps:**
1. Extract command handler functions to `src/application/commands/` classes implementing common `ICommand` interface
2. Move business logic to application services that orchestrate domain and infrastructure layers
3. Create presenter classes that transform domain models into view models for UI display
4. Update `src/extension.ts` command registration to use extracted command classes
5. Move file I/O operations to `src/infrastructure/fileSystem/` services
6. Extract state management to `src/state/` classes (expand on existing `llmStateManager.ts`)

**Estimated Effort:** 5-6 developer weeks

---

#### 3. src/productNavigator.ts (1,094 lines, 50 functions)
**Complexity Issues:**
- Mixes webview rendering, HTML generation, data fetching, event handling, and navigation logic
- Large switch statement (lines 380-414, 35 lines) for command handling
- Multiple conditional blocks checking node types and triggering different actions
- Direct coupling to VS Code API and domain models simultaneously

**Refactoring Strategy:**
```
Current Structure:
src/productNavigator.ts (1094 lines)
└── WebView + HTML + Data + Events + Navigation

Proposed Structure:
src/ui/
├── webview/
│   └── productNavigatorView.ts (~200 lines, orchestrates UI only)
├── templates/
│   └── productNavigationTemplate.ts (~300 lines, HTML generation)
├── presenters/
│   └── productNavigationPresenter.ts (~200 lines, data transformation)
└── handlers/
    └── productNavigationHandler.ts (~200 lines, event handling)
src/application/services/
└── productNavigationService.ts (~200 lines, business logic)
```

**Implementation Steps:**
1. Extract HTML generation to template class with methods for each view section
2. Create presenter that fetches data from services and transforms to view models
3. Move event handling logic to handler class that delegates to application services
4. Reduce view class to webview lifecycle management and template rendering only
5. Create application service for product navigation business logic (filtering, sorting, searching)

**Estimated Effort:** 3-4 developer weeks

---

#### 4. src/insightsTreeView.ts (1,006 lines, 54 functions)
**Complexity Issues:**
- Single file handles tree structure, data provider, node rendering, command handling, and state management
- Complex traversal logic mixed with presentation logic
- Direct coupling to multiple domain concepts (files, insights, categories)

**Refactoring Strategy:**
```
Current Structure:
src/insightsTreeView.ts (1006 lines)
└── Tree data + Rendering + Commands + State + Traversal

Proposed Structure:
src/ui/
├── treeView/
│   ├── insightsTreeProvider.ts (~200 lines, VS Code TreeDataProvider implementation)
│   ├── insightsTreeNodeFactory.ts (~150 lines, creates tree nodes)
│   └── insightsTreeRenderer.ts (~150 lines, formats nodes for display)
├── presenters/
│   └── insightsTreePresenter.ts (~200 lines, transforms data to tree structure)
└── handlers/
    └── insightsTreeCommandHandler.ts (~200 lines, handles tree commands)
```

**Implementation Steps:**
1. Extract tree node creation to factory class
2. Create presenter that transforms flat insight list to hierarchical tree structure
3. Move command handling to dedicated handler class
4. Reduce tree provider to implementation of VS Code's TreeDataProvider interface only
5. Extract rendering logic (icons, labels, tooltips) to renderer class

**Estimated Effort:** 2-3 developer weeks

---

#### 5. src/insightsViewer.ts (778 lines, 33 functions)
**Complexity Issues:**
- Large switch statement (lines 334-360, 27 lines) for message handling
- Multiple similar conditional blocks for different insight types (lines 368-482)
- HTML generation inline with business logic
- Direct file access mixed with UI updates

**Refactoring Strategy:**
```
Current Structure:
src/insightsViewer.ts (778 lines)
└── WebView + HTML + Commands + Data

Proposed Structure:
src/ui/
├── webview/
│   └── insightsWebView.ts (~150 lines, webview orchestration)
├── templates/
│   └── insightsTemplate.ts (~250 lines, HTML generation)
└── handlers/
    └── insightsMessageHandler.ts (~200 lines, webview message handling)
src/application/services/
└── insightsDisplayService.ts (~150 lines, business logic)
```

**Implementation Steps:**
1. Extract HTML template generation to template class
2. Create message handler using command pattern to handle webview messages
3. Move data fetching and transformation to application service
4. Reduce webview class to lifecycle management and template rendering

**Estimated Effort:** 2-3 developer weeks

---

### Complex Loops and Conditionals

#### src/llmService.ts Deep Nesting
```typescript
// Lines 716-843 (128 lines) - Current
for (const file of files) {
    if (condition1) { /* 3 lines */ }
    if (condition2) { /* 6 lines */ }
    if (condition3) { /* 31 lines with nested logic */ }
    // ... more conditions and loops
}

// Proposed Refactoring
class FileProcessor {
    async processFiles(files: string[]): Promise<ProcessedFile[]> {
        return Promise.all(files.map(file => this.processFile(file)));
    }
    
    private async processFile(file: string): Promise<ProcessedFile> {
        const validation = this.validateFile(file);
        if (!validation.valid) return validation.result;
        
        const content = await this.readFileContent(file);
        const analysis = this.analyzeContent(content);
        return this.formatResult(file, analysis);
    }
    
    private validateFile(file: string): ValidationResult { /* extracted */ }
    private analyzeContent(content: string): Analysis { /* extracted */ }
    private formatResult(file: string, analysis: Analysis): ProcessedFile { /* extracted */ }
}
```

**Benefit:** Reduces cyclomatic complexity from 15+ to 3-4 per method, enables parallel processing, improves testability.

---

#### src/llmIntegration.ts Function Decomposition
```typescript
// Lines 1834-2077 (244 lines) - runUnitTests function
// Current: Single massive function with 146-line loop

// Proposed: Extract to service class
class UnitTestExecutionService {
    async runTests(plan: TestPlan): Promise<TestResults> {
        this.validateTestPlan(plan);
        const testSuites = this.organizeTestSuites(plan);
        const results = await this.executeTestSuites(testSuites);
        return this.aggregateResults(results);
    }
    
    private validateTestPlan(plan: TestPlan): void { /* 20 lines */ }
    
    private organizeTestSuites(plan: TestPlan): TestSuite[] { /* 30 lines */ }
    
    private async executeTestSuites(suites: TestSuite[]): Promise<SuiteResult[]> {
        return Promise.all(suites.map(suite => this.executeSuite(suite)));
    }
    
    private async executeSuite(suite: TestSuite): Promise<SuiteResult> { /* 40 lines */ }
    
    private aggregateResults(results: SuiteResult[]): TestResults { /* 30 lines */ }
}
```

**Benefit:** Each method has single responsibility, reduces function from 244 to 5 methods of 20-40 lines each.

---

## Duplication Analysis

### 1. Duplicate Analyzer Implementations

**Files Affected:**
- `src/analyzer.ts` (650 lines, 30 functions)
- `src/analysis/enhancedAnalyzer.ts` (871 lines, 36 functions)

**Duplication Evidence:**
Both files:
- Parse TypeScript source files into AST
- Traverse AST to detect patterns
- Track imports and dependencies
- Detect god objects, circular dependencies, dead code
- Calculate complexity metrics
- Return similar result structures

**Consolidation Strategy:**

```typescript
// src/analysis/codeAnalyzer.ts (unified implementation)
export class CodeAnalyzer {
    constructor(private config: AnalysisConfig) {}
    
    async analyzeFile(filePath: string): Promise<FileAnalysis> {
        const ast = await this.parseFile(filePath);
        const results = await Promise.all([
            this.config.detectGodObjects && this.detectGodObjects(ast),
            this.config.detectCircularDeps && this.detectCircularDependencies(ast),
            this.config.detectDeadCode && this.detectDeadCode(ast),
            this.config.calculateComplexity && this.calculateComplexity(ast)
        ].filter(Boolean));
        
        return this.aggregateResults(results);
    }
    
    // Combine best features from both analyzers
    private detectGodObjects(ast: SourceFile): Issue[] {
        // Use enhanced logic from enhancedAnalyzer.ts
    }
    
    private detectCircularDependencies(ast: SourceFile): Issue[] {
        // Use algorithm from analyzer.ts
    }
}

// src/analysis/analysisConfig.ts
export interface AnalysisConfig {
    detectGodObjects: boolean;
    detectCircularDeps: boolean;
    detectDeadCode: boolean;
    calculateComplexity: boolean;
    complexityThreshold: number;
    // Add feature flags for optional analysis features
}
```

**Migration Plan:**
1. Create feature comparison matrix documenting unique capabilities of each analyzer
2. Implement unified analyzer incorporating all unique features
3. Add feature flags in configuration for optional analysis features
4. Update `src/analysisViewer.ts` to use unified analyzer with feature flags from config
5. Update `src/extension.ts` command handlers to use unified analyzer
6. Deprecate both old analyzers with warning logs
7. Remove deprecated analyzers after one release cycle

**Estimated Effort:** 2-3 developer weeks

**Savings:** Eliminates ~800 lines of duplicate code, reduces maintenance burden by 50% for analysis features.

---

### 2. Duplicate Error Handling Patterns

**Files Affected:**
- `src/llmService.ts` (inline try-catch blocks throughout)
- `src/llmIntegration.ts` (repeated error handling patterns)
- `src/ai/providers/openAIProvider.ts` (provider-specific error handling)
- `src/ai/providers/anthropicProvider.ts` (similar error handling)

**Duplication Example:**
```typescript
// Pattern repeated 15+ times across files
try {
    // operation
} catch (error) {
    console.error(`Operation failed: ${error}`);
    vscode.window.showErrorMessage(`Failed: ${error.message}`);
    return undefined;
}
```

**Consolidation Strategy:**

```typescript
// src/utils/errorHandler.ts (enhanced)
export class ErrorBoundary {
    static async execute<T>(
        operation: () => Promise<T>,
        context: ErrorContext
    ): Promise<Result<T>> {
        try {
            const result = await operation();
            return Result.success(result);
        } catch (error) {
            return this.handleError(error, context);
        }
    }
    
    private static handleError(error: unknown, context: ErrorContext): Result<never> {
        const domainError = this.transformError(error, context);
        this.logError(domainError);
        this.notifyUser(domainError);
        return Result.failure(domainError);
    }
    
    private static transformError(error: unknown, context: ErrorContext): DomainError {
        if (error instanceof NetworkError) return new AIProviderError(error, context);
        if (error instanceof FileSystemError) return new AnalysisError(error, context);
        return new UnknownError(error, context);
    }
}

// Usage
const result = await ErrorBoundary.execute(
    () => this.apiService.analyze(code),
    { operation: 'AI Analysis', retry: true }
);

if (result.isSuccess) {
    return result.value;
} else {
    return this.handleFailure(result.error);
}
```

**Estimated Effort:** 1-2 developer weeks

**Savings:** Eliminates ~200 lines of duplicate error handling code, provides consistent error experience.

---

### 3. Duplicate HTML Generation Patterns

**Files Affected:**
- `src/insightsViewer.ts` (inline HTML strings)
- `src/analysisViewer.ts` (similar HTML patterns)
- `src/productNavigator.ts` (webview HTML generation)
- `src/staticAnalysisViewer.ts` (HTML generation)
- `src/llmIntegration.ts` (functions `getLLMInsightsHtml`, `getEnhancedProductDocsHtml`)

**Duplication Evidence:**
Each file generates HTML with:
- Common CSS styles repeated
- Similar JavaScript for clipboard copying
- Identical navigation patterns
- Duplicate button/link generation logic

**Consolidation Strategy:**

```typescript
// src/ui/templates/baseTemplate.ts
export class BaseWebViewTemplate {
    protected getBaseStyles(): string {
        return `/* Shared CSS for all webviews */`;
    }
    
    protected getBaseScripts(): string {
        return `
            <script>
                const vscode = acquireVsCodeApi();
                function copyToClipboard(text) { /* shared implementation */ }
                function navigateToFile(path, line) { /* shared implementation */ }
            </script>
        `;
    }
    
    protected renderPage(title: string, content: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>${this.getBaseStyles()}</style>
            </head>
            <body>
                ${content}
                ${this.getBaseScripts()}
            </body>
            </html>
        `;
    }
}

// src/ui/templates/insightsTemplate.ts
export class InsightsTemplate extends BaseWebViewTemplate {
    render(insights: Insight[]): string {
        const content = insights.map(i => this.renderInsight(i)).join('');
        return this.renderPage('Insights', content);
    }
    
    private renderInsight(insight: Insight): string {
        // Insight-specific rendering
    }
}
```

**Estimated Effort:** 1-2 developer weeks

**Savings:** Eliminates ~400 lines of duplicate HTML/CSS/JavaScript across viewer files.

---

### 4. Duplicate File Processing Logic

**Files Affected:**
- `src/fileAccessHelper.ts` (file traversal and filtering)
- `src/analyzer.ts` (file processing loops)
- `src/llmService.ts` (file content reading and processing)
- `src/domain/services/fileWatcherService.ts` (file change handling)

**Duplication Pattern:**
```typescript
// Repeated across files:
for (const file of files) {
    if (shouldSkipFile(file)) continue;
    const content = await fs.readFile(file, 'utf-8');
    const analysis = await processFile(content);
    results.push(analysis);
}
```

**Consolidation Strategy:**

```typescript
// src/infrastructure/fileSystem/fileProcessor.ts
export class FileProcessor {
    constructor(
        private filter: IFileFilter,
        private reader: IFileReader
    ) {}
    
    async processFiles<T>(
        files: string[],
        processor: (content: string, path: string) => Promise<T>
    ): Promise<T[]> {
        const filtered = files.filter(f => this.filter.shouldProcess(f));
        return Promise.all(
            filtered.map(async file => {
                const content = await this.reader.readFile(file);
                return processor(content, file);
            })
        );
    }
    
    async processFilesSequentially<T>(
        files: string[],
        processor: (content: string, path: string) => Promise<T>,
        onProgress?: (current: number, total: number) => void
    ): Promise<T[]> {
        const filtered = files.filter(f => this.filter.shouldProcess(f));
        const results: T[] = [];
        
        for (let i = 0; i < filtered.length; i++) {
            const file = filtered[i];
            const content = await this.reader.readFile(file);
            results.push(await processor(content, file));
            onProgress?.(i + 1, filtered.length);
        }
        
        return results;
    }
}

// Usage
const processor = new FileProcessor(fileFilter, fileReader);
const analyses = await processor.processFiles(
    workspaceFiles,
    async (content, path) => analyzer.analyze(content, path)
);
```

**Estimated Effort:** 1 developer week

**Savings:** Eliminates ~150 lines of duplicate file processing loops.

---

### 5. Duplicate State Management Patterns

**Files Affected:**
- `src/state/llmStateManager.ts` (LLM provider state)
- `src/insightsTreeView.ts` (tree view state)
- `src/insightsViewer.ts` (viewer state)
- `src/productNavigator.ts` (navigation state)

**Duplication Evidence:**
Each file implements its own:
- State storage and retrieval
- State change notifications
- State serialization/deserialization
- State validation

**Consolidation Strategy:**

```typescript
// src/state/baseStateManager.ts
export abstract class BaseStateManager<T> {
    private state: T;
    private listeners: ((state: T) => void)[] = [];
    
    constructor(private context: vscode.ExtensionContext, private key: string) {
        this.state = this.loadState();
    }
    
    protected loadState(): T {
        return this.context.globalState.get<T>(this.key) || this.getDefaultState();
    }
    
    protected abstract getDefaultState(): T;
    
    setState(newState: T): void {
        this.validateState(newState);
        this.state = newState;
        this.context.globalState.update(this.key, newState);
        this.notifyListeners();
    }
    
    getState(): T {
        return { ...this.state }; // defensive copy
    }
    
    subscribe(listener: (state: T) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.state));
    }
    
    protected validateState(state: T): void {
        // Override in subclasses for validation
    }
}

// Usage
class InsightsViewState extends BaseStateManager<ViewState> {
    getDefaultState(): ViewState {
        return { expanded: [], filter: 'all' };
    }
    
    toggleExpanded(nodeId: string): void {
        const state = this.getState();
        const expanded = state.expanded.includes(nodeId)
            ? state.expanded.filter(id => id !== nodeId)
            : [...state.expanded, nodeId];
        this.setState({ ...state, expanded });
    }
}
```

**Estimated Effort:** 1 developer week

**Savings:** Eliminates ~100 lines of duplicate state management code.

---

## Efficiency Recommendations

### 1. Optimize File System Operations

**Current Issue:**
Multiple components read same files repeatedly:
- `src/analyzer.ts` reads files for analysis
- `src/llmService.ts` reads files for AI processing
- `src/fileDocumentation.ts` reads files for documentation
- `src/insightGenerator.ts` reads files for insight generation

**Performance Impact:** 
For 100-file workspace, each component reads all files = 400 file reads total. At 5ms per read = 2 seconds of wasted I/O.

**Optimization Strategy:**

```typescript
// src/infrastructure/fileSystem/fileCache.ts
export class FileCache {
    private cache = new Map<string, CachedFile>();
    private watcher: vscode.FileSystemWatcher;
    
    constructor(private maxSize: number = 500) {
        this.setupWatcher();
    }
    
    async getFile(path: string): Promise<string> {
        const cached = this.cache.get(path);
        
        if (cached && !this.isStale(cached)) {
            return cached.content;
        }
        
        const content = await vscode.workspace.fs.readFile(vscode.Uri.file(path));
        const contentStr = Buffer.from(content).toString('utf-8');
        
        this.cache.set(path, {
            content: contentStr,
            timestamp: Date.now(),
            size: content.length
        });
        
        this.evictIfNeeded();
        return contentStr;
    }
    
    private isStale(cached: CachedFile): boolean {
        return Date.now() - cached.timestamp > 5000; // 5 second TTL
    }
    
    private evictIfNeeded(): void {
        if (this.cache.size <= this.maxSize) return;
        
        // LRU eviction
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        for (let i = 0; i < entries.length - this.maxSize; i++) {
            this.cache.delete(entries[i][0]);
        }
    }
    
    private setupWatcher(): void {
        this.watcher = vscode.workspace.createFileSystemWatcher('**/*');
        this.watcher.onDidChange(uri => this.cache.delete(uri.fsPath));
        this.watcher.onDidDelete(uri => this.cache.delete(uri.fsPath));
    }
}
```

**Implementation:**
1. Create `FileCache` as singleton in `src/infrastructure/fileSystem/`
2. Inject into all components that read files
3. Update `FileAccessHelper` to use cache
4. Add cache statistics tracking (hit rate, size)

**Expected Improvement:** 
- Reduces file reads from 400 to ~100 for typical workspace scan
- Improves analysis time by 1-2 seconds for medium workspaces
- Reduces disk I/O by 75%

**Estimated Effort:** 1 developer week

---

### 2. Parallelize AI API Calls

**Current Issue:**
`src/llmService.ts` processes files sequentially:
```typescript
for (const file of files) {
    const analysis = await this.analyzeFile(file); // Sequential
}
```

For 50 files at 500ms per API call = 25 seconds total.

**Optimization Strategy:**

```typescript
// src/ai/services/llmBatchProcessor.ts
export class LLMBatchProcessor {
    constructor(
        private apiService: ILLMService,
        private concurrencyLimit: number = 5
    ) {}
    
    async processFiles(files: string[]): Promise<AnalysisResult[]> {
        const batches = this.createBatches(files, this.concurrencyLimit);
        const results: AnalysisResult[] = [];
        
        for (const batch of batches) {
            const batchResults = await Promise.all(
                batch.map(file => this.processFile(file))
            );
            results.push(...batchResults);
        }
        
        return results;
    }
    
    private createBatches<T>(items: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
    
    private async processFile(file: string): Promise<AnalysisResult> {
        return this.apiService.analyzeFile(file);
    }
}
```

**Implementation:**
1. Create batch processor with configurable concurrency
2. Update `llmService.ts` to use batch processor for multi-file operations
3. Add rate limit awareness to batch processor
4. Add progress reporting for batch operations

**Expected Improvement:**
- Reduces 50-file analysis from 25 seconds to ~5 seconds (5x improvement)
- Respects rate limits while maximizing throughput
- Provides better progress feedback

**Estimated Effort:** 1 developer week

---

### 3. Optimize AST Parsing with Caching

**Current Issue:**
`src/analyzer.ts` and `src/analysis/enhancedAnalyzer.ts` parse files into AST repeatedly even when file hasn't changed.

**Performance Impact:**
Parsing 100 TypeScript files = 3-5 seconds per analysis run.

**Optimization Strategy:**

```typescript
// src/analysis/astCache.ts
export class ASTCache {
    private cache = new Map<string, CachedAST>();
    
    async getAST(filePath: string): Promise<ts.SourceFile> {
        const cached = this.cache.get(filePath);
        const currentHash = await this.getFileHash(filePath);
        
        if (cached && cached.hash === currentHash) {
            return cached.ast;
        }
        
        const content = await fs.readFile(filePath, 'utf-8');
        const ast = ts.createSourceFile(
            filePath,
            content,
            ts.ScriptTarget.Latest,
            true
        );
        
        this.cache.set(filePath, { ast, hash: currentHash });
        return ast;
    }
    
    private async getFileHash(filePath: string): Promise<string> {
        const stat = await fs.stat(filePath);
        return `${stat.mtime.getTime()}-${stat.size}`;
    }
    
    invalidate(filePath: string): void {
        this.cache.delete(filePath);
    }
}
```

**Implementation:**
1. Create AST cache with file hash-based invalidation
2. Integrate with file watcher to invalidate on change
3. Update analyzer to use cached ASTs
4. Add cache size limits and eviction policy

**Expected Improvement:**
- First analysis: 3-5 seconds
- Subsequent analyses of unchanged files: <100ms (50x improvement)
- Reduces CPU usage by 95% for unchanged files

**Estimated Effort:** 1 developer week

---

### 4. Lazy Load Viewer Content

**Current Issue:**
`src/insightsTreeView.ts` and other viewers load all content immediately even if not visible:

```typescript
// Current: Load all insights eagerly
const allInsights = this.loadAllInsights(); // Loads 1000+ insights
this.tree.refresh(allInsights);
```

**Performance Impact:**
Loading 1000 insights = 500ms to generate tree nodes + 200ms to render = 700ms blocking operation.

**Optimization Strategy:**

```typescript
// src/ui/treeView/lazyTreeDataProvider.ts
export class LazyInsightsTreeProvider implements vscode.TreeDataProvider<TreeNode> {
    private loadedNodes = new Set<string>();
    
    async getChildren(element?: TreeNode): Promise<TreeNode[]> {
        if (!element)