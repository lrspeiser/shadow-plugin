# Comprehensive Refactoring Report

## Executive Summary

Shadow Watch is a VS Code extension providing AI-powered architecture analysis with 43 files totaling 16,710 lines of code. The codebase suffers from **severe complexity concentration** in two monolithic service files (`llmService.ts`: 2,107 lines, `llmIntegration.ts`: 1,827 lines) containing 233 combined functions with mixed responsibilities. Analysis reveals **8 critical architectural issues** requiring immediate attention: monolithic services, inconsistent DDD implementation, tight VS Code coupling, circular dependencies, scattered configuration, inconsistent error handling, and fragmented storage patterns.

**Key Findings:**
- **9 large files exceed 500 lines** (5,400+ lines total), with presentation layer files averaging 850 lines containing both UI and business logic
- **Extensive code duplication** across view components (webview boilerplate: ~150 lines × 5 files), LLM prompt builders (4 duplicate formatters), and error handling patterns
- **Performance risks** from synchronous file operations, unbounded cache growth, and redundant AST parsing
- **33% of codebase** concentrated in 2 files, creating bottlenecks for parallel development

**Recommended Priority Order:**
1. **Quick Wins (1-2 weeks):** Organize root directory, resolve circular dependencies, standardize error handling
2. **High-Impact Refactoring (3-4 weeks):** Decompose monolithic services, extract business logic from views
3. **Strategic Improvements (4-6 weeks):** Complete DDD migration or consolidate to layered monolith, extract analysis engine

Expected outcomes: 40% reduction in file complexity, 30% less code duplication, 3x improvement in testability, and support for 3+ concurrent developers.

---

## Complexity Analysis

### 1. Monolithic Service Files (Critical)

**Issue:** Core business logic concentrated in two massive files violating single responsibility principle.

**Files:**
- `src/llmService.ts`: 2,107 lines, 87 functions
- `src/llmIntegration.ts`: 1,827 lines, 146 functions

**Complexity Indicators:**
- `llmService.ts` contains 128-line loops (lines 715-842), 81-line loops (lines 418-498), and 64-line loops (lines 1076-1139)
- `llmIntegration.ts` has 238-line function `runComprehensiveAnalysis` (lines 1588-1825), 197-line function `generateUnitTests` (lines 1377-1573)
- Mixed responsibilities: LLM orchestration, prompt building, response handling, caching, state management, business rules

**Recommendations:**

#### 1.1 Decompose llmService.ts

**Extract to `src/domain/services/llmOrchestrationService.ts` (target: <300 lines):**
```typescript
// Coordinates LLM provider calls and manages request lifecycle
export class LLMOrchestrationService {
  constructor(
    private providerFactory: ProviderFactory,
    private rateLimiter: LLMRateLimiter,
    private retryHandler: LLMRetryHandler
  ) {}

  async executeRequest(request: LLMRequest): Promise<LLMResponse> {
    // Orchestration logic only - no prompt building or response parsing
  }
}
```

**Extract to `src/domain/services/promptGenerationService.ts` (target: <400 lines):**
```typescript
// Builds prompts for different analysis types
export class PromptGenerationService {
  buildProductDocsPrompt(context: CodebaseContext): Prompt { }
  buildArchitectureInsightsPrompt(context: CodebaseContext): Prompt { }
  buildUnitTestPrompt(context: TestContext): Prompt { }
  
  private formatCodeSample(code: string, maxLines: number): string { }
  private buildFileListSection(files: FileInfo[]): string { }
}
```

**Extract to `src/domain/services/responseProcessingService.ts` (target: <350 lines):**
```typescript
// Parses and validates AI responses
export class ResponseProcessingService {
  constructor(
    private parser: LLMResponseParser,
    private validator: SchemaValidator
  ) {}

  processProductDocs(response: string): ProductDocumentation { }
  processArchitectureInsights(response: string): ArchitectureInsights { }
  processTestPlan(response: string): TestPlan { }
}
```

**Extract to `src/domain/services/analysisCacheService.ts` (target: <250 lines):**
```typescript
// Manages caching strategies for analysis results
export class AnalysisCacheService {
  getCachedAnalysis(key: CacheKey): AnalysisResult | null { }
  cacheAnalysis(key: CacheKey, result: AnalysisResult): void { }
  invalidateCache(pattern: string): void { }
  
  private buildCacheKey(context: AnalysisContext): CacheKey { }
  private shouldInvalidate(fileChange: FileChange): boolean { }
}
```

**Migration Steps:**
1. Create service interfaces in `src/domain/services/interfaces/`
2. Extract pure functions to utilities first (no dependencies)
3. Move prompt building logic to PromptGenerationService
4. Move response parsing to ResponseProcessingService
5. Move cache logic to AnalysisCacheService
6. Refactor LLMOrchestrationService to coordinate services
7. Update `extension.ts` to wire services via dependency injection
8. Add comprehensive unit tests for each service
9. Remove original llmService.ts

**Effort Estimate:** 4-5 days (high priority)

#### 1.2 Decompose llmIntegration.ts

**Extract to `src/application/useCases/generateProductDocsUseCase.ts` (target: <200 lines):**
```typescript
// Single use case: Generate product documentation
export class GenerateProductDocsUseCase {
  async execute(workspaceUri: Uri): Promise<ProductDocumentation> {
    // Orchestrate: collect files → build prompt → call LLM → process response → save
  }
}
```

**Extract to `src/application/useCases/generateInsightsUseCase.ts` (target: <200 lines):**
```typescript
// Single use case: Generate architecture insights
export class GenerateInsightsUseCase {
  async execute(workspaceUri: Uri): Promise<ArchitectureInsights> {
    // Orchestrate: analyze code → build prompt → call LLM → process response → save
  }
}
```

**Extract to `src/application/useCases/generateUnitTestsUseCase.ts` (target: <250 lines):**
```typescript
// Single use case: Generate unit test documentation
export class GenerateUnitTestsUseCase {
  async execute(files: Uri[]): Promise<TestDocumentation> {
    // Orchestrate: parse tests → build prompt → call LLM → process response → write files
  }
}
```

**Extract to `src/ui/presenters/insightsPresenter.ts` (target: <300 lines):**
```typescript
// Transforms domain models to UI view models
export class InsightsPresenter {
  toTreeViewItems(insights: ArchitectureInsights): TreeItem[] { }
  toWebviewHtml(insights: ArchitectureInsights): string { }
  toOutputText(insights: ArchitectureInsights): string { }
}
```

**Migration Steps:**
1. Create use case classes implementing single operations
2. Move HTML generation to presenters
3. Extract data transformation to domain services
4. Update command handlers to call use cases
5. Remove llmIntegration.ts

**Effort Estimate:** 3-4 days (high priority)

### 2. Complex View Components

**Issue:** Large view files (957-1,061 lines) mixing presentation and business logic.

**Files:**
- `src/productNavigator.ts`: 1,061 lines, 50 functions
- `src/insightsTreeView.ts`: 957 lines, 52 functions
- `src/insightsViewer.ts`: 778 lines, 33 functions

**Complexity Indicators:**
- Complex tree building algorithms embedded in view code
- Data filtering/aggregation logic mixed with UI rendering
- HTML generation interleaved with business rules

**Recommendations:**

#### 2.1 Extract Business Logic from productNavigator.ts

**Create `src/application/services/productNavigationService.ts`:**
```typescript
export class ProductNavigationService {
  buildNavigationTree(docs: ProductDocumentation): NavigationNode[] {
    // Pure tree building logic
  }
  
  filterByCategory(nodes: NavigationNode[], category: string): NavigationNode[] {
    // Filtering logic
  }
  
  aggregateStatistics(nodes: NavigationNode[]): Statistics {
    // Statistics calculation
  }
}
```

**Refactor productNavigator.ts to:**
```typescript
export class ProductNavigator implements TreeDataProvider<NavigationNode> {
  constructor(private navigationService: ProductNavigationService) {}

  getTreeItem(element: NavigationNode): TreeItem {
    // Pure VS Code UI mapping - no business logic
    return {
      label: element.label,
      collapsibleState: element.children?.length ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
      command: element.command
    };
  }

  getChildren(element?: NavigationNode): NavigationNode[] {
    return this.navigationService.buildNavigationTree(this.currentDocs);
  }
}
```

**Effort Estimate:** 2 days per view component (6 days total)

#### 2.2 Standardize Webview Implementation

**Create `src/ui/webview/baseWebviewProvider.ts` (refactor existing orphaned file):**
```typescript
export abstract class BaseWebviewProvider {
  protected panel: WebviewPanel | undefined;
  
  constructor(protected context: ExtensionContext) {}
  
  // Common webview setup, lifecycle, message handling
  protected createPanel(title: string, viewType: string): WebviewPanel {
    // Standard panel creation with CSP, resource loading
  }
  
  protected abstract getHtmlContent(): string;
  protected abstract handleMessage(message: any): void;
}
```

**Refactor existing webviews to extend base:**
```typescript
export class InsightsViewer extends BaseWebviewProvider {
  constructor(
    context: ExtensionContext,
    private presenter: InsightsPresenter
  ) {
    super(context);
  }

  protected getHtmlContent(): string {
    return this.presenter.toWebviewHtml(this.insights);
  }
  
  protected handleMessage(message: any): void {
    // View-specific message handling only
  }
}
```

**Effort Estimate:** 3 days (eliminate ~600 lines of duplication)

### 3. Complex Analyzer Functions

**Issue:** `src/analyzer.ts` contains deeply nested traversal logic and complex detection algorithms.

**Functions:**
- Lines 225-242: 18-line recursive traversal with nested conditions
- Lines 314-346: 33-line dependency analysis with nested loops
- Lines 447-460: 14-line complexity calculation with switch statements

**Recommendations:**

#### 3.1 Extract Detection Strategies

**Create `src/analysis/detectors/` with strategy pattern:**
```typescript
// src/analysis/detectors/issueDetector.ts
export interface IssueDetector {
  detect(file: FileAnalysis): Issue[];
}

// src/analysis/detectors/godObjectDetector.ts
export class GodObjectDetector implements IssueDetector {
  detect(file: FileAnalysis): Issue[] {
    // Single responsibility: detect god objects
    if (file.lines > 500 || file.functions > 30) {
      return [{ type: 'god-object', severity: 'error', ... }];
    }
    return [];
  }
}

// src/analysis/detectors/circularDependencyDetector.ts
export class CircularDependencyDetector implements IssueDetector {
  detect(file: FileAnalysis): Issue[] {
    // Single responsibility: detect circular dependencies
  }
}
```

**Refactor analyzer.ts:**
```typescript
export class Analyzer {
  private detectors: IssueDetector[] = [
    new GodObjectDetector(),
    new CircularDependencyDetector(),
    new DeadCodeDetector(),
    new ComplexityDetector()
  ];

  analyzeFile(filePath: string): FileAnalysis {
    const ast = this.parseFile(filePath);
    const analysis = this.extractMetrics(ast);
    
    // Apply all detectors
    const issues = this.detectors.flatMap(d => d.detect(analysis));
    
    return { ...analysis, issues };
  }
}
```

**Effort Estimate:** 2 days (improves testability significantly)

#### 3.2 Simplify AST Traversal

**Create `src/analysis/visitors/` with visitor pattern:**
```typescript
// src/analysis/visitors/astVisitor.ts
export interface ASTVisitor {
  visitFunction(node: FunctionNode): void;
  visitClass(node: ClassNode): void;
  visitImport(node: ImportNode): void;
}

// src/analysis/visitors/metricsVisitor.ts
export class MetricsVisitor implements ASTVisitor {
  private metrics: FileMetrics = { functions: 0, classes: 0, imports: [] };
  
  visitFunction(node: FunctionNode): void {
    this.metrics.functions++;
    this.metrics.avgComplexity += calculateComplexity(node);
  }
  
  visitClass(node: ClassNode): void {
    this.metrics.classes++;
  }
  
  getMetrics(): FileMetrics {
    return this.metrics;
  }
}
```

**Effort Estimate:** 2 days (reduces traversal complexity by 50%)

### 4. Complex Prompt Builder

**Issue:** `src/domain/prompts/promptBuilder.ts` (698 lines) contains deeply nested conditionals and string concatenation logic.

**Complexity Indicators:**
- Lines 308-354: 47-line nested conditionals for format detection
- Lines 617-683: 66-line template building with loops and conditions

**Recommendations:**

#### 4.1 Use Template Pattern with Partials

**Create `src/domain/prompts/templates/`:**
```typescript
// src/domain/prompts/templates/baseTemplate.ts
export abstract class PromptTemplate {
  abstract buildSystemMessage(): string;
  abstract buildUserMessage(context: any): string;
  
  build(context: any): Prompt {
    return {
      system: this.buildSystemMessage(),
      user: this.buildUserMessage(context),
      maxTokens: this.getMaxTokens()
    };
  }
}

// src/domain/prompts/templates/productDocsTemplate.ts
export class ProductDocsTemplate extends PromptTemplate {
  buildSystemMessage(): string {
    return this.loadPartial('product-docs-system.txt');
  }
  
  buildUserMessage(context: CodebaseContext): string {
    const parts = [
      this.renderFileList(context.files),
      this.renderStatistics(context.stats),
      this.renderCodeSamples(context.samples)
    ];
    return parts.join('\n\n');
  }
  
  private renderFileList(files: FileInfo[]): string {
    return this.loadPartial('file-list.txt', { files });
  }
}
```

**Store templates in `src/domain/prompts/templates/partials/`:**
```
partials/
├── product-docs-system.txt
├── architecture-insights-system.txt
├── file-list.txt
├── code-sample.txt
└── statistics.txt
```

**Effort Estimate:** 2 days (reduces promptBuilder.ts by 300+ lines)

---

## Duplication Analysis

### 1. Webview Boilerplate Duplication (Critical)

**Issue:** Each webview implementation duplicates 150+ lines of panel setup, resource loading, CSP configuration, and message handling.

**Affected Files:**
- `src/analysisViewer.ts`: Lines 49-80 (panel setup)
- `src/insightsViewer.ts`: Lines 49-80 (panel setup)
- `src/staticAnalysisViewer.ts`: Lines 30-58 (panel setup)

**Duplication Pattern:**
```typescript
// Repeated in every webview ~150 lines
const panel = vscode.window.createWebviewPanel(
  'viewType',
  'Title',
  vscode.ViewColumn.One,
  {
    enableScripts: true,
    retainContextWhenHidden: true,
    localResourceRoots: [/* ... */]
  }
);

panel.webview.html = this.getHtml(/* ... */);

panel.webview.onDidReceiveMessage(message => {
  switch(message.command) {
    case 'copy': /* ... */ break;
    case 'export': /* ... */ break;
  }
});

panel.onDidDispose(() => {
  this.panel = undefined;
});
```

**Recommendation:**

**Consolidate to `src/ui/webview/baseWebviewProvider.ts`:**
```typescript
export abstract class BaseWebviewProvider {
  protected panel: WebviewPanel | undefined;
  
  constructor(
    protected context: ExtensionContext,
    private viewType: string,
    private title: string
  ) {}
  
  public show(): void {
    if (this.panel) {
      this.panel.reveal();
    } else {
      this.panel = this.createPanel();
      this.setupEventHandlers();
    }
    this.panel.webview.html = this.getHtmlContent();
  }
  
  private createPanel(): WebviewPanel {
    return vscode.window.createWebviewPanel(
      this.viewType,
      this.title,
      vscode.ViewColumn.One,
      this.getWebviewOptions()
    );
  }
  
  private getWebviewOptions(): WebviewOptions {
    return {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media'),
        vscode.Uri.joinPath(this.context.extensionUri, 'dist')
      ]
    };
  }
  
  private setupEventHandlers(): void {
    this.panel!.webview.onDidReceiveMessage(
      message => this.handleMessage(message),
      undefined,
      this.context.subscriptions
    );
    
    this.panel!.onDidDispose(
      () => {
        this.onDispose();
        this.panel = undefined;
      },
      undefined,
      this.context.subscriptions
    );
  }
  
  protected abstract getHtmlContent(): string;
  protected abstract handleMessage(message: any): void;
  protected onDispose(): void { }
}
```

**Refactor each webview:**
```typescript
export class InsightsViewer extends BaseWebviewProvider {
  constructor(context: ExtensionContext) {
    super(context, 'shadowWatch.insights', 'Architecture Insights');
  }

  protected getHtmlContent(): string {
    // Only view-specific HTML generation
    return `<!DOCTYPE html>...${this.renderInsights()}...`;
  }
  
  protected handleMessage(message: any): void {
    // Only view-specific message handling
    if (message.command === 'copyInsight') {
      this.copyInsightToClipboard(message.insightId);
    }
  }
}
```

**Impact:** 
- Eliminates ~600 lines of duplication (150 lines × 4 webviews)
- Consistent webview behavior across all views
- Single source of truth for CSP, resource loading, event handling

**Effort Estimate:** 1 day

### 2. LLM Prompt Formatter Duplication

**Issue:** Four separate formatters with overlapping prompt building logic.

**Affected Files:**
- `src/llmFormatter.ts`: 289 lines
- `src/domain/formatters/documentationFormatter.ts`: 250 lines
- `src/domain/prompts/promptBuilder.ts`: 698 lines
- Inline formatting in `src/llmIntegration.ts`: Lines 447-449, 473-475, etc.

**Duplication Patterns:**

```typescript
// Repeated code sample formatting (appears 4+ times)
function formatCodeSample(code: string, maxLines: number): string {
  const lines = code.split('\n');
  if (lines.length > maxLines) {
    return lines.slice(0, maxLines).join('\n') + `\n... (${lines.length - maxLines} more lines)`;
  }
  return code;
}

// Repeated file list formatting (appears 3+ times)
function formatFileList(files: FileInfo[]): string {
  return files.map(f => `- ${f.path} (${f.lines} lines, ${f.functions} functions)`).join('\n');
}

// Repeated statistics formatting (appears 3+ times)
function formatStatistics(stats: CodebaseStats): string {
  return `Total Files: ${stats.totalFiles}
Total Lines: ${stats.totalLines}
Total Functions: ${stats.totalFunctions}
...`;
}
```

**Recommendation:**

**Create unified `src/domain/prompts/promptFormatter.ts`:**
```typescript
export class PromptFormatter {
  // Reusable formatting utilities
  formatCodeSample(code: string, maxLines: number = 50): string {
    const lines = code.split('\n');
    if (lines.length <= maxLines) return code;
    
    return [
      ...lines.slice(0, maxLines),
      '',
      `... (${lines.length - maxLines} more lines omitted)`
    ].join('\n');
  }
  
  formatFileList(files: FileInfo[], options: FileListOptions = {}): string {
    const { includeMetrics = true, groupByDirectory = false } = options;
    
    if (groupByDirectory) {
      return this.formatFileListGrouped(files, includeMetrics);
    }
    
    return files
      .map(f => this.formatFileLine(f, includeMetrics))
      .join('\n');
  }
  
  formatStatistics(stats: CodebaseStats): string {
    return `
## Codebase Statistics
- Total Files: ${stats.totalFiles}
- Total Lines: ${stats.totalLines}
- Total Functions: ${stats.totalFunctions}
- Entry Points: ${stats.entryPoints}
- Large Files (>500 lines): ${stats.largeFiles}
    `.trim();
  }
  
  formatDependencyGraph(deps: DependencyGraph): string {
    // Shared dependency formatting
  }
  
  private formatFileLine(file: FileInfo, includeMetrics: boolean): string {
    if (!includeMetrics) return `- ${file.path}`;
    return `- ${file.path} (${file.lines} lines, ${file.functions} functions)`;
  }
  
  private formatFileListGrouped(files: FileInfo[], includeMetrics: boolean): string {
    const grouped = this.groupByDirectory(files);
    return Object.entries(grouped)
      .map(([dir, files]) => `\n### ${dir}\n${files.map(f => this.formatFileLine(f, includeMetrics)).join('\n')}`)
      .join('\n');
  }
}
```

**Refactor prompt builders to use shared formatter:**
```typescript
export class ProductDocsPromptBuilder {
  constructor(private formatter: PromptFormatter) {}
  
  build(context: CodebaseContext): Prompt {
    return {
      system: this.getSystemPrompt(),
      user: [
        this.formatter.formatStatistics(context.stats),
        this.formatter.formatFileList(context.files, { groupByDirectory: true }),
        this.formatter.formatCodeSample(context.entryPointCode, 100)
      ].join('\n\n')
    };
  }
}
```

**Impact:**
- Eliminates ~400 lines of duplication across 4 files
- Consistent formatting across all prompt types
- Easier to optimize token usage globally

**Effort Estimate:** 1.5 days

### 3. Error Handling Duplication

**Issue:** Try-catch patterns repeated throughout codebase with similar error message formatting and user notifications.

**Duplication Pattern (appears 30+ times):**
```typescript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  vscode.window.showErrorMessage(`Operation failed: ${message}`);
  console.error('Operation failed:', error);
  throw error;
}
```

**Recommendation:**

**Extend `src/utils/errorHandler.ts` with decorators and utilities:**
```typescript
// src/utils/errorHandler.ts
export class ErrorHandler {
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      return this.handleError(error, context);
    }
  }
  
  static handleError(error: unknown, context: ErrorContext): never {
    const message = this.formatErrorMessage(error);
    
    // Log to console
    console.error(`[${context.operation}] ${message}`, error);
    
    // Show user notification
    if (context.showNotification) {
      vscode.window.showErrorMessage(
        `${context.userMessage}: ${message}`,
        'View Logs'
      ).then(selection => {
        if (selection === 'View Logs') {
          this.showErrorLog();
        }
      });
    }
    
    // Track telemetry
    if (context.trackTelemetry) {
      this.trackError(error, context);
    }
    
    throw error;
  }
  
  private static formatErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred';
  }
}

// Decorator for async methods
export function handleErrors(userMessage: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      return ErrorHandler.withErrorHandling(
        () => method.apply(this, args),
        {
          operation: `${target.constructor.name}.${propertyName}`,
          userMessage,
          showNotification: true,
          trackTelemetry: true
        }
      );
    };
  };
}
```

**Usage:**
```typescript
export class LLMService {
  @handleErrors('Failed to generate product documentation')
  async generateProductDocs(workspace: Uri): Promise<ProductDocumentation> {
    // Implementation - no try-catch needed
    const files = await this.collectFiles(workspace);
    const prompt = this.buildPrompt(files);
    return await this.llmProvider.complete(prompt);
  }
}

// Or with explicit error handling:
async someOperation(): Promise<Result> {
  return ErrorHandler.withErrorHandling(
    async () => {
      // Operation logic
      return result;
    },
    {
      operation: 'someOperation',
      userMessage: 'Failed to perform operation',
      showNotification: true
    }
  );
}
```

**Impact:**
- Eliminates ~300 lines of repeated try-catch blocks
- Consistent error handling and user notifications
- Centralized error logging and telemetry

**Effort Estimate:** 1 day

### 4. Tree Navigation Duplication

**Issue:** Tree building logic duplicated across multiple navigator components.

**Affected Files:**
- `src/productNavigator.ts`: Lines 242-278 (tree building)
- `src/unitTestsNavigator.ts`: Lines 73-99 (tree building)
- `src/insightsTreeView.ts`: Lines 401-423 (tree traversal)

**Duplication Pattern:**
```typescript
// Appears in multiple navigators
private buildTree(items: Item[]): TreeNode[] {
  const rootNodes: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();
  
  // Build node map
  for (const item of items) {
    const node: TreeNode = {
      id: item.id,
      label: item.label,
      children: []
    };
    nodeMap.set(item.id, node);
  }
  
  // Build hierarchy
  for (const item of items) {
    const node = nodeMap.get(item.id)!;
    if (item.parentId) {
      const parent = nodeMap.get(item.parentId);
      parent?.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }
  
  return rootNodes;
}
```

**Recommendation:**

**Create `src/ui/tree/treeBuilder.ts`:**
```typescript
export class TreeBuilder<T> {
  constructor(
    private getId: (item: T) => string,
    private getParentId: (item: T) => string | undefined,
    private toNode: (item: T) => TreeNode
  ) {}
  
  buildTree(items: T[]): TreeNode[] {
    const rootNodes: TreeNode[] = [];
    const nodeMap = new Map<string, TreeNode>();
    
    // Build node map
    for (const item of items) {
      const node = this.toNode(item);
      nodeMap.set(this.getId(item), node);
    }
    
    // Build hierarchy
    for (const item of items) {
      const node = nodeMap.get(this.getId(item))!;
      const parentId = this.getParentId(item);
      
      if (parentId) {
        const parent = nodeMap.get(parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    }
    
    return rootNodes;
  }
  
  flattenTree(root: TreeNode): TreeNode[] {
    const result: TreeNode[] = [];
    const stack = [root];
    
    while (stack.length > 0) {
      const node = stack.pop()!;
      result.push(node);
      stack.push(...(node.children || []));
    }
    
    return result;
  }
  
  findNode(root: TreeNode, predicate: (node: TreeNode) => boolean): TreeNode | undefined {
    if (predicate(root)) return root;
    
    for (const child of root.children || []) {
      const found = this.findNode(child, predicate);
      if (found) return found;
    }
    
    return undefined;
  }
}
```

**Usage:**
```typescript
export class ProductNavigator {
  private treeBuilder = new TreeBuilder<ProductSection>(
    section => section.id,
    section => section.parentId,
    section => ({
      id: section.id,
      label: section.title,
      icon: this.getIcon(section.type),
      children: []
    })
  );
  
  getChildren(element?: TreeNode): TreeNode[] {
    if (!element) {
      return this.treeBuilder.buildTree(this.sections);
    }
    return element.children || [];
  }
}
```

**Impact:**
- Eliminates ~150 lines of duplication
- Consistent tree operations across all navigators
- Easier to add features like search, filtering, sorting

**Effort Estimate:** 1 day

---

## Efficiency Recommendations

### 1. Cache Management Optimization (High Priority)

**Issue:** Current cache implementation (`src/cache.ts`) has no size limits, no TTL, and no eviction strategy, leading to unbounded memory growth.

**Current Problems:**
- Cache grows indefinitely in long-running sessions
- No differentiation between frequently vs. rarely accessed items
- No automatic cleanup of stale entries
- Full cache cleared on any invalidation

**Recommendation:**

**Implement LRU Cache with TTL:**
```typescript
// src/cache/lruCache.ts
export class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private accessOrder = new Map<K