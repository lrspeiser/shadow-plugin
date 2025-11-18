# Comprehensive Refactoring Report

## Executive Summary

Shadow Watch has grown to 12,968 lines of code across 20 files with significant technical debt concentrated in two god objects: `src/llmService.ts` (2,753 lines, 141 functions) and `src/llmIntegration.ts` (2,291 lines, 200 functions). These files represent 39% of the codebase yet lack clear responsibility boundaries. The architecture is fundamentally sound with appropriate separation between monitoring, analysis, AI integration, and presentation layers, but implementation has accumulated responsibilities through organic growth.

**Critical Priorities:**
1. Decompose `llmService.ts` and `llmIntegration.ts` into focused modules (saves ~4,000 lines from god objects)
2. Establish test infrastructure (currently missing despite 719 functions)
3. Reorganize root directory (12 files → 5-6 essential files)
4. Refactor view components extracting data transformation logic

**Expected Impact:** Reducing the two largest files from 5,044 combined lines to ~1,000 lines (80% reduction) will dramatically improve maintainability, enable parallel development, and reduce onboarding time from days to hours.

## Complexity Analysis

### Critical Complexity Issues

#### 1. God Object: `src/llmService.ts` (2,753 lines, 141 functions)

**Current State:**
- Single file handling AI provider communication, response parsing, error handling, rate limiting, retry logic, streaming, prompt formatting, and provider-specific implementations
- 141 functions indicate multiple responsibilities accumulated without refactoring
- Deep nesting with `while` loop spanning 169 lines (lines 765-933) and another spanning 110 lines (lines 438-547)

**Specific Complexity Hotspots:**
- Lines 438-547: 110-line while loop with 6 nested if statements
- Lines 765-933: 169-line while loop with 8 nested if statements
- Lines 1564-1627: 64-line for loop with 38-line nested if containing 33-line sub-if
- Lines 1699-1749: 51-line for loop with nested control flow

**Refactoring Strategy:**

**Step 1: Extract AI Provider Implementations**
```typescript
// Create src/ai/providers/ directory structure
src/ai/
  providers/
    ILLMProvider.ts          // Interface definition
    OpenAIProvider.ts        // ~400 lines
    AnthropicProvider.ts     // ~400 lines
    CustomProvider.ts        // ~300 lines
    ProviderFactory.ts       // ~100 lines
```

Extract provider-specific logic (~1,500 lines total):
- Move OpenAI-specific communication, error handling, rate limiting to `OpenAIProvider.ts`
- Move Anthropic-specific streaming, prompt formatting to `AnthropicProvider.ts`
- Extract custom endpoint handling to `CustomProvider.ts`
- Define common interface: `ILLMProvider` with methods: `sendRequest()`, `streamRequest()`, `validateResponse()`

**Step 2: Extract Response Processing**
```typescript
// Create src/ai/llmResponseParser.ts (~400 lines)
export class LLMResponseParser {
  parseProductDocs(response: any): ProductDocumentation
  parseArchitectureInsights(response: any): ArchitectureInsights
  parseUnitTestDocs(response: any): UnitTestDocumentation
  validateAgainstSchema(response: any, schema: Schema): boolean
}
```

Move all response parsing, validation, and transformation logic from `llmService.ts` (estimated ~400 lines).

**Step 3: Extract Infrastructure Concerns**
```typescript
// Create src/ai/llmRateLimiter.ts (~200 lines)
export class RateLimiter {
  canMakeRequest(provider: string): boolean
  recordRequest(provider: string): void
  waitUntilAvailable(provider: string): Promise<void>
}

// Create src/ai/llmRetryHandler.ts (~200 lines)
export class RetryHandler {
  executeWithRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T>
}
```

**Step 4: Refactor Core Orchestration**
```typescript
// Refactored src/llmService.ts (~400 lines)
export class LLMService {
  private providerFactory: ProviderFactory
  private responseParser: LLMResponseParser
  private rateLimiter: RateLimiter
  private retryHandler: RetryHandler
  
  constructor() {
    this.providerFactory = new ProviderFactory()
    this.responseParser = new LLMResponseParser()
    this.rateLimiter = new RateLimiter()
    this.retryHandler = new RetryHandler()
  }
  
  async generateProductDocs(context: CodeContext): Promise<ProductDocumentation> {
    const provider = this.providerFactory.getProvider(this.config.provider)
    await this.rateLimiter.waitUntilAvailable(this.config.provider)
    
    const response = await this.retryHandler.executeWithRetry(
      () => provider.sendRequest(this.buildProductDocsPrompt(context))
    )
    
    return this.responseParser.parseProductDocs(response)
  }
  
  // Similar refactoring for generateArchitectureInsights, generateUnitTests
}
```

**Effort Estimate:** 3-4 days (with comprehensive testing)
**Impact:** High - enables parallel development, reduces merge conflicts, improves testability
**Risk:** Medium-High - requires careful extraction with comprehensive testing to prevent regression

#### 2. God Object: `src/llmIntegration.ts` (2,291 lines, 200 functions)

**Current State:**
- 200 functions suggest this file handles multiple distinct integration concerns
- Functions range from 3 lines (simple conditionals) to 299 lines (`generateLLMInsights`)
- Mixes UI integration, command handling, state management, file I/O, formatting

**Function Complexity Analysis:**
- `generateLLMInsights` (lines 497-795): 299 lines with 19 nested control structures
- `generateProductDocs` (lines 356-495): 140 lines with 11 nested control structures
- `generateUnitTests` (lines 1903-2047): 145 lines with 14 nested control structures
- `runComprehensiveAnalysis` (lines 2062-2289): 228 lines with 24 nested control structures

**Refactoring Strategy:**

**Step 1: Extract Command Handlers**
```typescript
// Create src/commands/llmCommands.ts (~500 lines)
export class LLMCommands {
  constructor(
    private llmService: LLMService,
    private stateManager: LLMStateManager,
    private uiIntegration: LLMUIIntegration
  ) {}
  
  async handleGenerateProductDocs(): Promise<void>
  async handleGenerateArchitectureInsights(): Promise<void>
  async handleGenerateUnitTests(): Promise<void>
  async handleRunComprehensiveAnalysis(): Promise<void>
  async handleClearAllData(): Promise<void>
}
```

Extract command handler logic (~500 lines) from large functions, keeping focused on orchestration.

**Step 2: Extract UI Integration**
```typescript
// Create src/ui/llmUIIntegration.ts (~400 lines)
export class LLMUIIntegration {
  showProductDocsInOutput(docs: ProductDocumentation): void
  showArchitectureInsightsInOutput(insights: ArchitectureInsights): void
  showLLMInsights(): void
  getEnhancedProductDocsHtml(docs: ProductDocumentation): string
  getLLMInsightsHtml(insights: ArchitectureInsights): string
}
```

Move all webview creation, HTML generation, output channel management (~400 lines).

**Step 3: Extract Context Building**
```typescript
// Create src/ai/llmContextBuilder.ts (~300 lines)
export class LLMContextBuilder {
  buildProductDocsContext(codeAnalysis: CodeAnalysis): CodeContext
  buildArchitectureInsightsContext(codeAnalysis: CodeAnalysis): CodeContext
  buildUnitTestContext(filePath: string, fileContent: string): CodeContext
  enrichContextWithDependencies(context: CodeContext): CodeContext
}
```

Extract all prompt context assembly logic (~300 lines).

**Step 4: Extract State Management**
```typescript
// Create src/state/llmStateManager.ts (~400 lines)
export class LLMStateManager {
  saveCodeAnalysis(analysis: CodeAnalysis): Promise<void>
  loadSavedCodeAnalysis(): Promise<CodeAnalysis | null>
  saveIncrementalProductDocIteration(iteration: ProductDocIteration): Promise<void>
  saveIncrementalArchitectureInsightsIteration(iteration: ArchitectureIteration): Promise<void>
  getProductDocsRunDir(): string
  getArchitectureInsightsRunDir(): string
}
```

Move all file I/O operations for saving/loading state (~400 lines).

**Step 5: Extract Formatting Logic**
```typescript
// Create src/formatters/llmMarkdownFormatter.ts (~300 lines)
export class LLMMarkdownFormatter {
  formatEnhancedDocsAsMarkdown(docs: ProductDocumentation): string
  formatInsightsAsMarkdown(insights: ArchitectureInsights): string
  formatUnitTestsAsMarkdown(tests: UnitTestDocumentation): string
}
```

**Step 6: Refactor Core Integration**
```typescript
// Refactored src/llmIntegration.ts (~400 lines)
export class LLMIntegration {
  private commands: LLMCommands
  private uiIntegration: LLMUIIntegration
  private contextBuilder: LLMContextBuilder
  private stateManager: LLMStateManager
  private markdownFormatter: LLMMarkdownFormatter
  
  constructor(private llmService: LLMService) {
    this.stateManager = new LLMStateManager()
    this.contextBuilder = new LLMContextBuilder()
    this.uiIntegration = new LLMUIIntegration()
    this.markdownFormatter = new LLMMarkdownFormatter()
    this.commands = new LLMCommands(llmService, this.stateManager, this.uiIntegration)
  }
  
  // Thin facade delegating to specialized components
  async generateProductDocs(): Promise<void> {
    return this.commands.handleGenerateProductDocs()
  }
}
```

**Effort Estimate:** 4-5 days (with comprehensive testing)
**Impact:** High - dramatically improves code organization and testability
**Risk:** Medium-High - requires careful dependency management to avoid circular dependencies

#### 3. Entry Point Overload: `src/extension.ts` (1,420 lines, 83 functions)

**Current State:**
- Main entry point mixing orchestration with implementation details
- 83 functions indicate direct implementation rather than delegation
- Long functions: `activate` (269 lines), `showUnitTestItemDetails` (200 lines), `showInsightItemDetails` (165 lines)

**Refactoring Strategy:**

**Step 1: Extract Command Registration**
```typescript
// Create src/commands/commandRegistry.ts (~300 lines)
export function registerAllCommands(
  context: vscode.ExtensionContext,
  handlers: CommandHandlers
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('shadowWatch.analyzeWorkspace', handlers.analyzeWorkspace),
    vscode.commands.registerCommand('shadowWatch.analyzeFile', handlers.analyzeCurrentFile),
    // ... all command registrations
  )
}

export interface CommandHandlers {
  analyzeWorkspace: () => Promise<void>
  analyzeCurrentFile: () => Promise<void>
  // ... all command handler signatures
}
```

**Step 2: Extract UI Initialization**
```typescript
// Create src/ui/uiInitializer.ts (~200 lines)
export class UIInitializer {
  initializeViews(context: vscode.ExtensionContext): UIComponents {
    const treeView = new InsightsTreeProvider()
    const productNavigator = new ProductNavigator()
    const insightsViewer = new InsightsViewer()
    const analysisViewer = new AnalysisViewer()
    
    return { treeView, productNavigator, insightsViewer, analysisViewer }
  }
  
  registerViewProviders(
    context: vscode.ExtensionContext, 
    components: UIComponents
  ): void
}
```

**Step 3: Extract Event Handlers**
```typescript
// Create src/events/eventHandlers.ts (~300 lines)
export class EventHandlers {
  constructor(
    private analyzer: Analyzer,
    private llmIntegration: LLMIntegration,
    private uiComponents: UIComponents
  ) {}
  
  async analyzeWorkspace(): Promise<void>
  async analyzeCurrentFile(): Promise<void>
  async copyAllInsights(): Promise<void>
  async navigateToProductItem(item: ProductItem): Promise<void>
  // ... all event handlers
}
```

**Step 4: Extract Detail Viewers**
```typescript
// Create src/ui/detailViewers.ts (~400 lines)
export class DetailViewers {
  showProductItemDetails(item: ProductItem): void
  showInsightItemDetails(item: InsightItem): void
  showUnitTestItemDetails(item: UnitTestItem): void
}
```

Move `showProductItemDetails` (44 lines), `showInsightItemDetails` (165 lines), `showUnitTestItemDetails` (200 lines).

**Step 5: Refactor Activation**
```typescript
// Refactored src/extension.ts (~250 lines)
export async function activate(context: vscode.ExtensionContext) {
  // 1. Load configuration
  const config = loadConfiguration()
  
  // 2. Initialize services
  const llmService = new LLMService(config)
  const analyzer = new Analyzer()
  const llmIntegration = new LLMIntegration(llmService)
  
  // 3. Initialize UI
  const uiInitializer = new UIInitializer()
  const uiComponents = uiInitializer.initializeViews(context)
  uiInitializer.registerViewProviders(context, uiComponents)
  
  // 4. Create event handlers
  const eventHandlers = new EventHandlers(analyzer, llmIntegration, uiComponents)
  
  // 5. Register commands
  registerAllCommands(context, eventHandlers)
  
  // 6. Setup file watcher
  const fileWatcher = new FileWatcher(analyzer)
  fileWatcher.start()
  
  // 7. Register diagnostics provider
  const diagnosticsProvider = new DiagnosticsProvider(analyzer)
  context.subscriptions.push(diagnosticsProvider)
}
```

**Effort Estimate:** 2-3 days
**Impact:** High - dramatically improves activation sequence clarity and testability
**Risk:** Medium - requires careful initialization order preservation

#### 4. Complex View Components

**`src/insightsTreeView.ts` (957 lines, 52 functions):**
- Mixes tree view logic, data transformation, event handling
- Complex traversal logic in multiple functions

**`src/productNavigator.ts` (964 lines, 45 functions):**
- Similar mixing of concerns
- Large switch statements for item type handling

**Refactoring Strategy (apply to both):**

```typescript
// Create src/formatters/treeViewFormatter.ts
export class InsightsTreeFormatter {
  formatInsightAsTreeItem(insight: Insight): vscode.TreeItem
  formatFileAsTreeItem(file: FileInsights): vscode.TreeItem
  buildTreeHierarchy(insights: CodeAnalysis): TreeNode[]
}

// Create src/handlers/treeViewHandlers.ts
export class InsightsTreeHandlers {
  handleItemClick(item: TreeItem): Promise<void>
  handleItemCopy(item: TreeItem): void
  handleRefresh(): Promise<void>
}

// Refactored src/insightsTreeView.ts (~300 lines)
export class InsightsTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  constructor(
    private formatter: InsightsTreeFormatter,
    private handlers: InsightsTreeHandlers
  ) {}
  
  getTreeItem(element: TreeItem): vscode.TreeItem {
    return this.formatter.formatInsightAsTreeItem(element)
  }
  
  getChildren(element?: TreeItem): TreeItem[] {
    // Delegate to formatter for hierarchy building
    return this.formatter.buildTreeHierarchy(this.data)
  }
}
```

**Effort Estimate:** 2 days per view component
**Impact:** Medium-High - improves testability and maintainability
**Risk:** Low-Medium - well-defined interface contracts reduce risk

### Complexity Reduction Summary

| File | Current Lines | Target Lines | Lines Extracted | New Files Created | Effort |
|------|--------------|--------------|-----------------|-------------------|--------|
| llmService.ts | 2,753 | 400 | 2,353 | 7 | 3-4 days |
| llmIntegration.ts | 2,291 | 400 | 1,891 | 6 | 4-5 days |
| extension.ts | 1,420 | 250 | 1,170 | 4 | 2-3 days |
| insightsTreeView.ts | 957 | 300 | 657 | 2 | 2 days |
| productNavigator.ts | 964 | 300 | 664 | 2 | 2 days |
| **Total** | **8,385** | **1,650** | **6,735** | **21** | **13-16 days** |

## Duplication Analysis

### 1. View HTML Generation Duplication

**Location:**
- `src/llmIntegration.ts`: `getEnhancedProductDocsHtml()` (lines 1557-1658, 102 lines)
- `src/llmIntegration.ts`: `getLLMInsightsHtml()` (lines 1660-1800, 141 lines)
- `src/extension.ts`: `getSettingsHtml()` (lines 1215-1382, 168 lines)
- `src/insightsViewer.ts`: HTML generation scattered across multiple methods

**Duplication Pattern:**
All functions follow similar pattern:
```typescript
return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    // CSS styles (50-100 lines duplicated)
  </style>
</head>
<body>
  // Content generation
  <script>
    // JavaScript handling (50-80 lines duplicated)
  </script>
</body>
</html>
`
```

**Consolidation Strategy:**

```typescript
// Create src/ui/webview/WebviewTemplateEngine.ts
export class WebviewTemplateEngine {
  private baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${this.getBaseStyles()}</style>
      <style>{{customStyles}}</style>
    </head>
    <body>
      {{content}}
      <script>${this.getBaseScript()}</script>
      <script>{{customScript}}</script>
    </body>
    </html>
  `
  
  render(options: WebviewTemplateOptions): string {
    return this.baseTemplate
      .replace('{{customStyles}}', options.customStyles || '')
      .replace('{{content}}', options.content)
      .replace('{{customScript}}', options.customScript || '')
  }
  
  private getBaseStyles(): string {
    // Shared CSS (extracted from duplicated code)
  }
  
  private getBaseScript(): string {
    // Shared JavaScript (extracted from duplicated code)
  }
}

// Create src/ui/webview/templates/ directory
templates/
  ProductDocsTemplate.ts
  ArchitectureInsightsTemplate.ts
  SettingsTemplate.ts

// Usage example:
export class ProductDocsTemplate {
  constructor(private engine: WebviewTemplateEngine) {}
  
  render(docs: ProductDocumentation): string {
    return this.engine.render({
      content: this.buildContent(docs),
      customStyles: this.getCustomStyles(),
      customScript: this.getCustomScript()
    })
  }
  
  private buildContent(docs: ProductDocumentation): string {
    // Only content-specific logic
  }
}
```

**Effort Estimate:** 2 days
**Lines Saved:** ~400 lines of duplicated HTML/CSS/JavaScript
**Impact:** High - eliminates maintenance burden of updating styles/scripts in 4+ places

### 2. File I/O Pattern Duplication

**Location:**
- `src/llmIntegration.ts`: Multiple save/load functions with similar patterns
  - `saveIncrementalFileSummary` (lines 862-888)
  - `saveIncrementalModuleSummary` (lines 924-950)
  - `saveIncrementalProductDocIteration` (lines 986-1008)
  - `saveEnhancedProductDocsToFile` (lines 1010-1054)
  - `saveArchitectureInsightsToFile` (lines 1284-1331)

**Duplication Pattern:**
```typescript
async function saveXYZ() {
  const timestamp = new Date().toISOString().replace(/:/g, '-')
  const fileName = `xyz_${timestamp}.json`
  const filePath = path.join(this.getRunDir(), fileName)
  
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Failed to save XYZ: ${error}`)
  }
}
```

**Consolidation Strategy:**

```typescript
// Create src/storage/incrementalStorage.ts
export class IncrementalStorage<T> {
  constructor(
    private baseDir: string,
    private filePrefix: string
  ) {}
  
  async save(data: T): Promise<void> {
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const fileName = `${this.filePrefix}_${timestamp}.json`
    const filePath = path.join(this.baseDir, fileName)
    
    await fs.promises.mkdir(this.baseDir, { recursive: true })
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2))
  }
  
  async loadLatest(): Promise<T | null> {
    const files = await fs.promises.readdir(this.baseDir)
    const matchingFiles = files
      .filter(f => f.startsWith(this.filePrefix))
      .sort()
      .reverse()
    
    if (matchingFiles.length === 0) return null
    
    const content = await fs.promises.readFile(
      path.join(this.baseDir, matchingFiles[0]),
      'utf-8'
    )
    return JSON.parse(content)
  }
  
  async loadAll(): Promise<T[]> {
    const files = await fs.promises.readdir(this.baseDir)
    const matchingFiles = files.filter(f => f.startsWith(this.filePrefix))
    
    return Promise.all(
      matchingFiles.map(async f => {
        const content = await fs.promises.readFile(
          path.join(this.baseDir, f),
          'utf-8'
        )
        return JSON.parse(content)
      })
    )
  }
}

// Usage:
class LLMStateManager {
  private fileSummaryStorage = new IncrementalStorage<FileSummary>(
    this.getProductDocsRunDir(),
    'file_summary'
  )
  
  private moduleSummaryStorage = new IncrementalStorage<ModuleSummary>(
    this.getProductDocsRunDir(),
    'module_summary'
  )
  
  async saveFileSummary(summary: FileSummary): Promise<void> {
    return this.fileSummaryStorage.save(summary)
  }
}
```

**Effort Estimate:** 1 day
**Lines Saved:** ~200 lines of duplicated file I/O logic
**Impact:** Medium - improves consistency and error handling

### 3. Error Handling Pattern Duplication

**Location:** Throughout codebase, especially in:
- `src/llmService.ts`: API request error handling repeated in multiple methods
- `src/analyzer.ts`: File reading error handling
- `src/llmIntegration.ts`: File operation error handling

**Duplication Pattern:**
```typescript
try {
  // operation
} catch (error) {
  console.error(`Failed to do X: ${error}`)
  vscode.window.showErrorMessage(`Failed to do X`)
}
```

**Consolidation Strategy:**

```typescript
// Create src/utils/errorHandler.ts
export class ErrorHandler {
  static async handle<T>(
    operation: () => Promise<T>,
    context: ErrorContext
  ): Promise<T | null> {
    try {
      return await operation()
    } catch (error) {
      this.logError(error, context)
      this.notifyUser(error, context)
      
      if (context.rethrow) {
        throw error
      }
      
      return null
    }
  }
  
  private static logError(error: any, context: ErrorContext): void {
    console.error(`[${context.component}] ${context.operation} failed:`, error)
    
    if (context.logToFile) {
      // Append to error log file
    }
  }
  
  private static notifyUser(error: any, context: ErrorContext): void {
    if (context.showUserMessage) {
      const message = context.userMessage || `${context.operation} failed`
      
      if (context.severity === 'error') {
        vscode.window.showErrorMessage(message)
      } else if (context.severity === 'warning') {
        vscode.window.showWarningMessage(message)
      }
    }
  }
}

interface ErrorContext {
  component: string
  operation: string
  severity?: 'error' | 'warning' | 'info'
  showUserMessage?: boolean
  userMessage?: string
  logToFile?: boolean
  rethrow?: boolean
}

// Usage:
async function analyzeFile(filePath: string): Promise<FileAnalysis | null> {
  return ErrorHandler.handle(
    () => this.performAnalysis(filePath),
    {
      component: 'Analyzer',
      operation: 'analyzeFile',
      severity: 'error',
      showUserMessage: true,
      userMessage: 'Failed to analyze file'
    }
  )
}
```

**Effort Estimate:** 1-2 days
**Lines Saved:** ~300-400 lines of duplicated try-catch blocks
**Impact:** Medium-High - improves error handling consistency and observability

### 4. Configuration Loading Duplication

**Location:**
- `src/llmService.ts`: Reads configuration for API keys, provider settings
- `src/extension.ts`: Reads configuration for extension settings
- Multiple files access workspace configuration individually

**Consolidation Strategy:**

```typescript
// Create src/config/configurationManager.ts
export class ConfigurationManager {
  private config: vscode.WorkspaceConfiguration
  
  constructor() {
    this.config = vscode.workspace.getConfiguration('shadowWatch')
    this.setupWatcher()
  }
  
  get openAIKey(): string | undefined {
    return this.config.get('openAIKey')
  }
  
  get anthropicKey(): string | undefined {
    return this.config.get('anthropicKey')
  }
  
  get provider(): 'openai' | 'anthropic' | 'custom' {
    return this.config.get('provider', 'openai')
  }
  
  get customEndpoint(): string | undefined {
    return this.config.get('customEndpoint')
  }
  
  async update(key: string, value: any): Promise<void> {
    await this.config.update(key, value, vscode.ConfigurationTarget.Global)
  }
  
  private setupWatcher(): void {
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('shadowWatch')) {
        this.config = vscode.workspace.getConfiguration('shadowWatch')
        // Emit configuration changed event
      }
    })
  }
  
  validate(): ConfigValidationResult {
    const errors: string[] = []
    
    if (this.provider === 'openai' && !this.openAIKey) {
      errors.push('OpenAI API key is required')
    }
    
    if (this.provider === 'anthropic' && !this.anthropicKey) {
      errors.push('Anthropic API key is required')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Single instance throughout extension
export const configManager = new ConfigurationManager()
```

**Effort Estimate:** 1 day
**Lines Saved:** ~150 lines of duplicated configuration access
**Impact:** Medium - centralizes configuration logic and validation

### Duplication Elimination Summary

| Pattern | Occurrences | Lines Duplicated | Lines After | Effort | Impact |
|---------|-------------|------------------|-------------|--------|--------|
| HTML Generation | 4+ files | ~400 | ~150 | 2 days | High |
| File I/O | 5 functions | ~200 | ~50 | 1 day | Medium |
| Error Handling | 50+ locations | ~300 | ~100 | 1-2 days | Medium-High |
| Configuration | 10+ locations | ~150 | ~50 | 1 day | Medium |
| **Total** | | **~1,050** | **~350** | **5-6 days** | |

## Efficiency Recommendations

### 1. Cache Warming Strategy

**Current Issue:**
- Cold cache on extension activation causes first analysis to be slow
- No background cache warming for frequently accessed files
- Cache invalidation is binary (clear all) rather than selective

**Optimization Strategy:**

```typescript
// Enhance src/cache.ts
export class SmartCache {
  private warmupInProgress = false
  
  async warmupCache(workspaceRoot: string): Promise<void> {
    if (this.warmupInProgress) return
    
    this.warmupInProgress = true
    
    // Get most recently modified files
    const recentFiles = await this.getRecentlyModifiedFiles(workspaceRoot, 20)
    
    // Analyze in background with low priority
    for (const file of recentFiles) {
      if (this.cache.has(file)) continue
      
      // Yield to other operations
      await new Promise(resolve => setTimeout(resolve, 100))
      
      try {
        const analysis = await this.analyzer.analyzeFile(file)
        this.cache.set(file, analysis)
      } catch (error) {
        // Silent fail during warmup
      }
    }
    
    this.warmupInProgress = false
  }
  
  invalidateSelective(filePath: string): void {
    // Invalidate the file and its direct dependencies
    const affected = this.getDependentFiles(filePath)
    
    for (const file of affected) {
      this.cache.delete(file)
    }
  }
  
  private getDependentFiles(filePath: string): string[] {
    // Use dependency graph to find affected files
    return this.dependencyGraph.getReverseDependencies(filePath)
  }
}
```

**Expected Impact:**
- Reduce first analysis time by 50-70% through cache warming
- Reduce unnecessary re-analysis by 80% through selective invalidation
- Improve perceived performance during extension activation

**Effort Estimate:** 2 days
**Risk:** Low - additive optimization with graceful degradation

### 2. Streaming Response Processing

**Current Issue:**
- `src/llmService.ts` buffers entire AI responses before processing
- Large responses (comprehensive analysis) cause memory spikes and UI freezing
- No progress feedback during long-running AI requests

**Optimization