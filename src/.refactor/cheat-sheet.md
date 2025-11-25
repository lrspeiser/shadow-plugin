# Codebase Cheat Sheet
Generated: 2025-11-25T05:42:38.633Z

## Quick Stats
- **Files**: 68
- **Lines**: 28,011
- **Functions**: 101
- **Languages**: typescript (28011 lines)

## Refactoring Opportunities
- **Exact duplicates**: 1 groups (9 lines savable)
- **Dead code**: 21 unused exports + 7 unreachable functions (260 lines)
- **Similar names**: 7 groups to review

---

## File Index
| File | Lines | Functions | Exports |
|------|-------|-----------|---------|
| llmService.ts | 3433 | 0 | LLMService |
| llmIntegration.ts | 3386 | 37 | initializeLLMService, setTreeProvider, setProductNavigator... |
| insightsTreeView.ts | 1178 | 1 | InsightsTreeProvider, TreeItem |
| domain/prompts/promptBuilder.ts | 1147 | 0 | PromptBuilder |
| productNavigator.ts | 1094 | 0 | ProductNavigatorProvider, ProductNavItem |
| analysis/enhancedAnalyzer.ts | 871 | 2 | EnhancedAnalyzer |
| insightsViewer.ts | 778 | 0 | InsightsViewerProvider, InsightItem |
| extension.ts | 685 | 20 | activate, deactivate |
| analyzer.ts | 644 | 2 | CodeAnalyzer |
| llmSchemas.ts | 559 | 0 | productPurposeAnalysisSchema, llmInsightsSchema, productDocumentationSchema... |
| analysis/functionAnalyzer.ts | 535 | 2 | FunctionAnalyzer |
| analysisViewer.ts | 525 | 0 | AnalysisViewerProvider, AnalysisItem |
| domain/handlers/navigationHandler.ts | 494 | 0 | NavigationHandler |
| domain/services/testing/llmTestGenerationService.ts | 458 | 0 | LLMTestGenerationService |
| ai/llmResponseParser.ts | 455 | 0 | LLMResponseParser |
| domain/services/testConfigurationService.ts | 421 | 1 | TestConfigurationService, window, workspace... |
| domain/services/testing/llmTestSetupService.ts | 417 | 0 | LLMTestSetupService, window, workspace... |
| domain/prompts/refactoringPromptBuilder.ts | 409 | 0 | RefactoringPromptBuilder |
| ui/reportsViewer.ts | 396 | 0 | ReportsViewer |
| fileAccessHelper.ts | 374 | 0 | FileAccessHelper |
| unitTestsNavigator.ts | 363 | 0 | UnitTestsNavigatorProvider, UnitTestItem |
| utils/errorHandler.ts | 362 | 0 | Result, DomainError, AIProviderError... |
| insightGenerator.ts | 360 | 0 | InsightGenerator |
| infrastructure/persistence/analysisResultRepository.ts | 359 | 0 | AnalysisResultRepository |
| domain/prompts/testPrompts.ts | 343 | 1 | buildSetupPrompt, buildPlanningPrompt, buildFunctionSelectionPrompt... |
| domain/services/analysis/analysisPlanner.ts | 332 | 3 | scanProjectStructure, buildPlannerPrompt, plannerResponseSchema... |
| domain/services/analysis/simpleExtractor.ts | 323 | 3 | SCHEMAS, buildTinyProjectPrompt, buildFilePrompt... |
| storage/incrementalStorage.ts | 310 | 0 | IncrementalStorage, createTimestampedStorage, createIterationStorage... |
| ui/webview/webviewTemplateEngine.ts | 308 | 1 | WebviewTemplateEngine |
| llmFormatter.ts | 289 | 0 | LLMFormatter |
| domain/services/testing/llmTestPlanningService.ts | 288 | 0 | LLMTestPlanningService |
| domain/services/fileWatcherService.ts | 281 | 0 | FileWatcherService |
| utils/jsonExtractor.ts | 273 | 5 | extractJSON, safeParseJSON |
| domain/services/analysis/streamlinedAnalysis.ts | 253 | 2 | StreamlinedAnalysisService |
| domain/formatters/documentationFormatter.ts | 250 | 0 | DocumentationFormatter |
| fileDocumentation.ts | 243 | 4 | detectFileRole, groupFilesByModule, detectModuleType... |
| domain/services/testing/llmTestValidationService.ts | 233 | 0 | LLMTestValidationService |
| domain/services/testing/testExecutionService.ts | 230 | 0 | TestExecutionService |
| infrastructure/fileSystem/fileCache.ts | 225 | 1 | FileCache, getGlobalFileCache |
| staticAnalysisViewer.ts | 216 | 0 | StaticAnalysisViewerProvider, StaticAnalysisItem |
| infrastructure/fileSystem/fileProcessor.ts | 214 | 0 | DefaultFileFilter, DefaultFileReader, FileProcessor |
| config/configurationManager.ts | 209 | 1 | ConfigurationManager, getConfigurationManager |
| state/llmStateManager.ts | 208 | 1 | LLMStateManager, getStateManager |
| domain/bootstrap/commandRegistry.ts | 200 | 0 | CommandRegistry |
| ai/providers/anthropicProvider.ts | 197 | 2 | getLLMStats, resetLLMStats, AnthropicProvider |
| ai/llmRetryHandler.ts | 193 | 0 | RetryHandler |
| domain/services/incrementalAnalysisService.ts | 193 | 0 | IncrementalAnalysisService |
| domain/bootstrap/extensionBootstrapper.ts | 186 | 0 | ExtensionBootstrapper |
| ai/providers/openAIProvider.ts | 174 | 2 | getOpenAILLMStats, resetOpenAILLMStats, OpenAIProvider |
| domain/services/testing/llmFunctionExtractionService.ts | 171 | 0 | LLMFunctionExtractionService |
| reportsTreeProvider.ts | 171 | 0 | ReportTreeItem, ReportsTreeProvider |
| test/__mocks__/vscode.ts | 170 | 2 | EventEmitter, window, workspace... |
| state/baseStateManager.ts | 159 | 0 | - |
| utils/fileFilter.ts | 158 | 5 | SKIP_DIRECTORIES, SKIP_FILE_PATTERNS, CODE_EXTENSIONS... |
| fileWatcher.ts | 156 | 0 | FileWatcher |
| domain/prompts/functionExtractionPrompt.ts | 154 | 0 | buildFunctionExtractionPrompt, buildSingleFileExtractionPrompt |
| infrastructure/progressService.ts | 139 | 0 | ProgressService, progressService |
| ai/llmRateLimiter.ts | 137 | 0 | RateLimiter |
| cache.ts | 107 | 0 | AnalysisCache |
| diagnosticsProvider.ts | 103 | 0 | DiagnosticsProvider |
| context/analysisContextBuilder.ts | 102 | 3 | convertCodeAnalysisToContext, saveCodeAnalysis, loadSavedCodeAnalysis |
| ui/webview/baseWebviewProvider.ts | 84 | 0 | BaseWebviewProvider |
| ai/providers/providerFactory.ts | 72 | 0 | ProviderFactory |
| ai/providers/ILLMProvider.ts | 63 | 0 | - |
| domain/services/testing/types/testResultTypes.ts | 58 | 0 | - |
| domain/services/testing/types/testPlanTypes.ts | 48 | 0 | - |
| domain/services/testing/types/testSetupTypes.ts | 47 | 0 | - |
| logger.ts | 38 | 0 | SWLogger |

---

## Function Signatures

### llmIntegration.ts
```
export initializeLLMService() // line 31
loadSavedInsights() // line 55
loadSavedProductDocs() // line 94
export setTreeProvider(provider: InsightsTreeProvider) // line 143
export setProductNavigator(provider: ProductNavigatorProvider) // line 147
export setUnitTestsNavigator(provider: UnitTestsNavigatorProvider) // line 151
export setInsightsViewer(provider: InsightsViewerProvider) // line 155
export setAnalysisViewer(provider: AnalysisViewerProvider) // line 159
export setReportsTreeProvider(provider: any) // line 163
export setCodeAnalysis(analysis: CodeAnalysis) // line 167
export setAnalysisContext(context: AnalysisContext) // line 176
export loadSavedCodeAnalysis() // line 183
checkForExistingUnitTests() // line 198
export copyLLMInsight(type: string, content: string) // line 236
export setApiKey() // line 254
export setClaudeApiKey() // line 274
export generateProductDocs() // line 291
export generateLLMInsights() // line 427
export showProductDocs() // line 730
export showLLMInsights() // line 747
showProductDocsInOutput() // line 769
showArchitectureInsightsInOutput() // line 824
getEnhancedProductDocsHtml(docs: EnhancedProductDocumentation) // line 938
getLLMInsightsHtml(insights: LLMInsights) // line 1041
copyToClipboard(text, buttonElement) // line 1043
export clearAllData() // line 1183
export generateUnitTests() // line 1483
escapeHtml(text: string) // line 2002
export runComprehensiveAnalysis(cancellationToken?: vscode.CancellationToken) // line 2081
export generateWorkspaceReport() // line 2403
export generateProductReport() // line 2516
export generateArchitectureReport() // line 2622
refreshReportsViewer() // line 2741
export refreshReportsOnStartup() // line 2778
export showReports() // line 2785
export runUnitTests() // line 2803
export runStreamlinedAnalysis(cancellationToken?: vscode.CancellationToken) // line 3228
```

### insightsTreeView.ts
```
traverse() // line 592
```

### analysis/enhancedAnalyzer.ts
```
visit() // line 104
traverse() // line 744
```

### extension.ts
```
export activate(context: vscode.ExtensionContext) // line 31
createCommandHandlers(components: ExtensionComponents) // line 96
analyzeWorkspace() // line 123
analyzeCurrentFile() // line 193
copyAllInsights() // line 226
copyFileInsights() // line 242
copyInsight(item: any) // line 266
clearCache() // line 280
copyMenuStructure() // line 288
showProviderStatus() // line 312
switchProvider() // line 360
clearAllData() // line 396
showSettings() // line 424
getSettingsHtml(currentProvider: string) // line 465
switchProvider() // line 593
copyMenuStructure() // line 597
openVSCodeSettings() // line 601
openLatestReport() // line 614
openLatestUnitTestReport() // line 645
export deactivate() // line 676
```

### analyzer.ts
```
traverse() // line 270
traverse() // line 296
```

### analysis/functionAnalyzer.ts
```
visit() // line 198
visit() // line 339
```

### domain/services/testConfigurationService.ts
```
createMockFn() // line 296
```

### domain/prompts/testPrompts.ts
```
export buildSetupPrompt(workspaceRoot: string, fileList: string[], packageJsonContent?: string) // line 8
```

### domain/services/analysis/analysisPlanner.ts
```
export scanProjectStructure(workspaceRoot: string) // line 47
walkDir(dir: string, relPath: string = '') // line 61
export buildPlannerPrompt(summary: ProjectSummary) // line 131
```

### domain/services/analysis/simpleExtractor.ts
```
export buildTinyProjectPrompt(files: { path: string; content: string }[]) // line 127
export buildFilePrompt(filePath: string, content: string) // line 156
export buildArchitecturePrompt(fileSummaries: { path: string; purpose: string; functions: any[] }[]) // line 179
```

### ui/webview/webviewTemplateEngine.ts
```
copyToClipboard(text) // line 181
```

### utils/jsonExtractor.ts
```
export extractJSON(content: string) // line 11
extractValidJSONObject(text: string) // line 66
extractValidJSONArray(text: string) // line 135
tryFixJSON(json: string) // line 201
export safeParseJSON(content: string, fallback: any = null) // line 256
```

### domain/services/analysis/streamlinedAnalysis.ts
```
getCodeFiles(workspaceRoot: string, summary: ProjectSummary) // line 35
walkDir(dir: string, relPath: string = '') // line 40
```

### fileDocumentation.ts
```
export detectFileRole(filePath: string, fileInfo: FileInfo) // line 122
export groupFilesByModule(files: FileInfo[]) // line 183
export detectModuleType(modulePath: string) // line 202
export readFileContent(filePath: string, workspaceRoot: string) // line 231
```

### infrastructure/fileSystem/fileCache.ts
```
export getGlobalFileCache() // line 217
```

### config/configurationManager.ts
```
export getConfigurationManager() // line 202
```

### state/llmStateManager.ts
```
export getStateManager() // line 201
```

### ai/providers/anthropicProvider.ts
```
export getLLMStats() // line 15
export resetLLMStats() // line 19
```

### ai/providers/openAIProvider.ts
```
export getOpenAILLMStats() // line 15
export resetOpenAILLMStats() // line 19
```

### test/__mocks__/vscode.ts
```
createMockFn() // line 6
dispose() // line 161
```

### utils/fileFilter.ts
```
export shouldSkipDirectory(dirName: string) // line 76
export shouldAnalyzeFile(filePath: string, workspaceRoot?: string) // line 86
export isCodeFile(filePath: string) // line 119
export getLanguageFromExtension(ext: string) // line 127
export filterAnalyzableFiles(files: string[], workspaceRoot?: string) // line 155
```

### context/analysisContextBuilder.ts
```
export convertCodeAnalysisToContext(analysis: CodeAnalysis) // line 14
export saveCodeAnalysis(analysis: CodeAnalysis) // line 40
export loadSavedCodeAnalysis() // line 75
```

---

## 🔴 EXACT DUPLICATES
*These functions have identical code. Keep one, delete the rest.*

### 1. `createMockFn` duplicated 2 times
**Savings**: 9 lines

| Location | Lines |
|----------|-------|
| ../shadow-plugin/src/domain/services/testConfigurationService.ts:296 | 9 |
| ../shadow-plugin/src/test/__mocks__/vscode.ts:6 | 9 |

**Action**: Keep `../shadow-plugin/src/domain/services/testConfigurationService.ts`, delete others.


---

## 🟡 DEAD CODE

### Unused Exports
*These are exported but never imported anywhere.*

- `extension.ts`: `activate` (61 lines)
- `extension.ts`: `deactivate` (8 lines)
- `infrastructure/fileSystem/fileCache.ts`: `FileCache` (1 lines)
- `infrastructure/fileSystem/fileCache.ts`: `getGlobalFileCache` (6 lines)
- `infrastructure/fileSystem/fileProcessor.ts`: `DefaultFileFilter` (1 lines)
- `infrastructure/fileSystem/fileProcessor.ts`: `DefaultFileReader` (1 lines)
- `infrastructure/fileSystem/fileProcessor.ts`: `FileProcessor` (1 lines)
- `infrastructure/progressService.ts`: `ProgressService` (1 lines)
- `infrastructure/progressService.ts`: `progressService` (1 lines)
- `test/__mocks__/vscode.ts`: `EventEmitter` (1 lines)
- `test/__mocks__/vscode.ts`: `window` (1 lines)
- `test/__mocks__/vscode.ts`: `workspace` (1 lines)
- `test/__mocks__/vscode.ts`: `commands` (1 lines)
- `test/__mocks__/vscode.ts`: `Uri` (1 lines)
- `test/__mocks__/vscode.ts`: `ExtensionContext` (1 lines)

*...and 6 more*

### Unreachable Functions
*These are defined but never called.*

- `../shadow-plugin/src/analysis/enhancedAnalyzer.ts:104`: `visit`
- `../shadow-plugin/src/analysis/functionAnalyzer.ts:198`: `visit`
- `../shadow-plugin/src/analysis/functionAnalyzer.ts:339`: `visit`
- `../shadow-plugin/src/domain/services/analysis/streamlinedAnalysis.ts:35`: `getCodeFiles`
- `../shadow-plugin/src/domain/services/testConfigurationService.ts:296`: `createMockFn`
- `../shadow-plugin/src/llmIntegration.ts:769`: `showProductDocsInOutput`
- `../shadow-plugin/src/test/__mocks__/vscode.ts:6`: `createMockFn`

---

## 🟠 SIMILAR NAMES (Review for Consolidation)
*These functions have similar names and might be doing the same thing.*

### Functions matching "visit"
- `../shadow-plugin/src/analysis/enhancedAnalyzer.ts:104`: `visit()`
- `../shadow-plugin/src/analysis/functionAnalyzer.ts:198`: `visit()`
- `../shadow-plugin/src/analysis/functionAnalyzer.ts:339`: `visit()`

### Functions matching "traverse"
- `../shadow-plugin/src/analysis/enhancedAnalyzer.ts:744`: `traverse()`
- `../shadow-plugin/src/analyzer.ts:270`: `traverse()`
- `../shadow-plugin/src/analyzer.ts:296`: `traverse()`
- `../shadow-plugin/src/insightsTreeView.ts:592`: `traverse()`

### Functions matching "loadsavedcodeanalysis"
- `../shadow-plugin/src/context/analysisContextBuilder.ts:75`: `loadSavedCodeAnalysis()`
- `../shadow-plugin/src/llmIntegration.ts:183`: `loadSavedCodeAnalysis()`

### Functions matching "walkdir"
- `../shadow-plugin/src/domain/services/analysis/analysisPlanner.ts:61`: `walkDir(dir: string, relPath: string = '')`
- `../shadow-plugin/src/domain/services/analysis/streamlinedAnalysis.ts:40`: `walkDir(dir: string, relPath: string = '')`

### Functions matching "createmockfn"
- `../shadow-plugin/src/domain/services/testConfigurationService.ts:296`: `createMockFn()`
- `../shadow-plugin/src/test/__mocks__/vscode.ts:6`: `createMockFn()`

### Functions matching "clearalldata"
- `../shadow-plugin/src/extension.ts:396`: `clearAllData()`
- `../shadow-plugin/src/llmIntegration.ts:1183`: `clearAllData()`

### Functions matching "copytoclipboard"
- `../shadow-plugin/src/llmIntegration.ts:1043`: `copyToClipboard(text, buttonElement)`
- `../shadow-plugin/src/ui/webview/webviewTemplateEngine.ts:181`: `copyToClipboard(text)`


---

## Summary
| Issue | Count | Lines Affected |
|-------|-------|----------------|
| Exact duplicates | 1 groups | 9 savable |
| Dead exports | 21 | 93 |
| Unreachable functions | 7 | 167 |
| Similar names | 7 groups | - |

**Potential reduction**: 269 lines (1.0% of codebase)
