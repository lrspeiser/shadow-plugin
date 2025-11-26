# Analysis + Test Report
Generated: 2025-11-26T15:33:54.496Z

## Analysis Summary
Shadow Watch is a VS Code extension that provides intelligent code analysis and insights by combining TypeScript AST parsing with LLM-powered analysis to help developers understand codebases, identify refactoring opportunities, and maintain code quality

### Stats
- Files: 73
- Lines: 51963
- Functions: 101
- Analysis time: 174.5s

### Functions
- **activate** (src/extension.ts): Initializes the extension, bootstraps all components, registers commands, sets up file watchers and configuration handlers
- **createCommandHandlers** (src/extension.ts): Creates command handler functions with access to initialized components for registration in the command palette
- **analyzeWorkspace** (src/extension.ts): Analyzes the entire workspace for code issues, generates insights, updates diagnostics and tree view, and runs comprehensive LLM analysis
- **constructor** (src/ai/llmRateLimiter.ts): Initializes rate limiter with default rate limits for OpenAI (60 req/min) and Claude (50 req/min)
- **configure** (src/ai/llmRateLimiter.ts): Configures custom rate limits for a specific provider
- **canMakeRequest** (src/ai/llmRateLimiter.ts): Checks if a request can be made for the given provider based on current rate limits
- **recordRequest** (src/ai/llmRateLimiter.ts): Records a request timestamp for the given provider to track rate limit usage
- **waitUntilAvailable** (src/ai/llmRateLimiter.ts): Waits until a request can be made if rate limited, returns immediately if no wait needed
- **getRequestCount** (src/ai/llmRateLimiter.ts): Gets the number of requests made in the current time window for a provider
- **clearHistory** (src/ai/llmRateLimiter.ts): Clears request history for a specific provider or all providers for testing or reset
- **parseFileSummary** (src/ai/llmResponseParser.ts): Parses LLM response to extract file summary information including purpose, actions, functions, and dependencies
- **parseModuleSummary** (src/ai/llmResponseParser.ts): Parses LLM response to extract module-level summary including capabilities, endpoints, commands, and workers
- **parseProductDocs** (src/ai/llmResponseParser.ts): Parses LLM response to extract product documentation sections including overview, features, architecture, tech stack, and API endpoints
- **parseProductLevelDoc** (src/ai/llmResponseParser.ts): Parses comprehensive product-level documentation including overview, user perspectives, workflow integration, and problems solved
- **parseArchitectureInsights** (src/ai/llmResponseParser.ts): Parses LLM response to extract architecture analysis insights including assessment, strengths, issues, and recommendations
- **extractSection** (src/ai/llmResponseParser.ts): Helper method to extract a named section from text content using various patterns
- **extractListSection** (src/ai/llmResponseParser.ts): Helper method to extract bullet point lists from text content for a named section
- **executeWithRetry** (src/ai/llmRetryHandler.ts): Executes an operation with retry logic using exponential backoff for retryable errors
- **isRetryableError** (src/ai/llmRetryHandler.ts): Checks if an error is retryable based on error patterns, network codes, and HTTP status codes
- **delay** (src/ai/llmRetryHandler.ts): Creates a promise that resolves after specified milliseconds
- **executeWithRetryAndCount** (src/ai/llmRetryHandler.ts): Executes an operation with retry logic and returns result along with attempt count
- **getLLMStats** (src/ai/providers/anthropicProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetLLMStats** (src/ai/providers/anthropicProvider.ts): Resets all LLM call statistics counters to zero
- **initialize** (src/ai/providers/anthropicProvider.ts): Initializes Anthropic client with API key from configuration manager
- **isConfigured** (src/ai/providers/anthropicProvider.ts): Checks if the Anthropic client is properly configured with API key
- **getName** (src/ai/providers/anthropicProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/anthropicProvider.ts): Sends a standard LLM request to Claude and returns unstructured text response
- **sendStructuredRequest** (src/ai/providers/anthropicProvider.ts): Sends a structured LLM request to Claude with JSON schema validation and returns typed response
- **getOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Resets all LLM call statistics to zero
- **constructor** (src/ai/providers/openAIProvider.ts): Initializes the OpenAI provider by calling initialize method
- **initialize** (src/ai/providers/openAIProvider.ts): Sets up OpenAI client with API key from configuration manager
- **isConfigured** (src/ai/providers/openAIProvider.ts): Checks if the OpenAI client is properly configured with API key
- **getName** (src/ai/providers/openAIProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/openAIProvider.ts): Sends a chat completion request to OpenAI API with logging and token tracking
- **sendStructuredRequest** (src/ai/providers/openAIProvider.ts): Sends request expecting JSON structured output, parses and validates response
- **sendRequestWithFallback** (src/ai/providers/openAIProvider.ts): Attempts request with multiple models in sequence until one succeeds
- **getProvider** (src/ai/providers/providerFactory.ts): Get the provider instance for the specified provider type, creating it lazily if needed
- **getCurrentProvider** (src/ai/providers/providerFactory.ts): Get the current provider based on configuration
- **isProviderConfigured** (src/ai/providers/providerFactory.ts): Check if a provider is configured
- **getConfiguredProviders** (src/ai/providers/providerFactory.ts): Get all configured providers
- **analyzeFileMetadata** (src/analysis/enhancedAnalyzer.ts): Analyzes a single file and extracts enhanced metadata for all functions by either using AST parsing for TypeScript/JavaScript or regex fallback for other languages
- **analyzeTypeScriptFunction** (src/analysis/enhancedAnalyzer.ts): Analyzes TypeScript/JavaScript functions using AST parsing to extract detailed metadata, with regex fallback on parsing failures
- **findFunctionNode** (src/analysis/enhancedAnalyzer.ts): Traverses the AST to find a specific function node by matching function name and start line number
- **getFunctionName** (src/analysis/enhancedAnalyzer.ts): Extracts the function name from various types of function AST nodes including declarations, expressions, and arrow functions
- **extractMetadataFromAST** (src/analysis/enhancedAnalyzer.ts): Extracts comprehensive metadata from function AST node including parameters, return type, visibility, branches, dependencies, state mutations, docstrings, and risk level
- **analyzeNode** (src/analysis/enhancedAnalyzer.ts): Recursively traverses AST nodes to detect and collect branches, dependencies, and state mutations throughout the function body
- **extractFunctionContent** (src/analysis/enhancedAnalyzer.ts): Extracts the source code content of a function between specified line numbers
- **analyzeFunctionWithRegex** (src/analysis/enhancedAnalyzer.ts): Provides regex-based fallback analysis for functions when AST parsing is unavailable or fails
- **extractDocstring** (src/analysis/enhancedAnalyzer.ts): Extracts JSDoc comment documentation from function AST node
- **calculateRiskLevel** (src/analysis/enhancedAnalyzer.ts): Calculates the risk level of a function based on complexity of branches, dependencies, and state mutations
- **analyzeFunctions** (src/analysis/functionAnalyzer.ts): Analyzes all functions in files exceeding a size threshold and extracts detailed information
- **analyzeFunction** (src/analysis/functionAnalyzer.ts): Analyzes a single function in detail by dispatching to language-specific analyzers
- **analyzeTypeScriptFunction** (src/analysis/functionAnalyzer.ts): Analyzes TypeScript/JavaScript functions using AST parsing to extract signature, parameters, dependencies, and responsibilities
- **analyzeFunctionWithRegex** (src/analysis/functionAnalyzer.ts): Provides fallback regex-based function analysis when AST parsing is unavailable or fails
- **findFunctionNode** (src/analysis/functionAnalyzer.ts): Locates function node in TypeScript AST by matching function name and start line
- **extractSignature** (src/analysis/functionAnalyzer.ts): Extracts the complete function signature from AST node
- **extractParameters** (src/analysis/functionAnalyzer.ts): Extracts parameter names and types from function node
- **extractReturnType** (src/analysis/functionAnalyzer.ts): Extracts return type annotation from function node
- **isPublic** (src/analysis/functionAnalyzer.ts): Determines if function has public visibility
- **isAsync** (src/analysis/functionAnalyzer.ts): Checks if function is declared as async
- **extractDependencies** (src/analysis/functionAnalyzer.ts): Extracts functions and modules that the analyzed function depends on
- **extractDependents** (src/analysis/functionAnalyzer.ts): Finds all functions that call the analyzed function
- **extractResponsibilities** (src/analysis/functionAnalyzer.ts): Analyzes function body to identify key responsibilities and actions
- **extractDependenciesRegex** (src/analysis/functionAnalyzer.ts): Fallback regex-based dependency extraction when AST parsing unavailable
- **extractResponsibilitiesRegex** (src/analysis/functionAnalyzer.ts): Uses heuristics and regex patterns to identify function responsibilities
- **resolveFilePath** (src/analysis/functionAnalyzer.ts): Resolves relative file path to absolute path for file system access
- **setAnalysis** (src/analysisViewer.ts): Updates the analysis data and refreshes the tree view
- **refresh** (src/analysisViewer.ts): Triggers a refresh of the tree view display
- **getTreeItem** (src/analysisViewer.ts): Returns the tree item representation for display
- **getChildren** (src/analysisViewer.ts): Returns child items for a given tree element, handling different item types and categories
- **getRootItems** (src/analysisViewer.ts): Generates top-level tree items showing statistics, files, languages, functions, entry points, dependencies, and orphaned files
- **getStatisticsItems** (src/analysisViewer.ts): Creates tree items displaying code statistics like file count, lines, functions, and large files
- **getFilesItems** (src/analysisViewer.ts): Organizes files into directory groups and creates corresponding tree items
- **getFileDetails** (src/analysisViewer.ts): Returns detailed information items for a specific file including functions and imports
- **getDirectoryFiles** (src/analysisViewer.ts): Returns file items within a specific directory
- **getFunctionsItems** (src/analysisViewer.ts): Creates tree items for all functions in the analysis
- **getFileFunctions** (src/analysisViewer.ts): Returns function items for a specific file
- **getFileImports** (src/analysisViewer.ts): Returns import/dependency items for a specific file
- **getEntryPointsItems** (src/analysisViewer.ts): Creates tree items for application entry points
- **getDependenciesItems** (src/analysisViewer.ts): Creates tree items showing file dependency relationships
- **getOrphanedFilesItems** (src/analysisViewer.ts): Creates tree items for files not imported anywhere in the codebase
- **getLanguagesItems** (src/analysisViewer.ts): Creates tree items for each programming language found in the analysis
- **getLanguageFiles** (src/analysisViewer.ts): Returns file items for a specific programming language
- **getUniqueLanguages** (src/analysisViewer.ts): Extracts unique programming languages from analyzed files
- **analyzeWorkspace** (src/analyzer.ts): Recursively analyzes all code files in workspace, extracting functions, imports, dependencies, and organizational metrics
- **analyzeFile** (src/analyzer.ts): Analyzes a single file to extract functions, imports, and metrics
- **findCodeFiles** (src/analyzer.ts): Recursively finds all code files in directory based on known file extensions
- **findAllFiles** (src/analyzer.ts): Recursively finds all files in directory for organizational analysis
- **extractFunctions** (src/analyzer.ts): Extracts function definitions from file content based on language syntax
- **extractImports** (src/analyzer.ts): Extracts import statements from file content based on language syntax
- **analyzeDependencies** (src/analyzer.ts): Analyzes import relationships to identify imported and orphaned files
- **detectEntryPoints** (src/analyzer.ts): Detects entry point files like main.py, index.js, package.json scripts
- **constructor** (src/cache.ts): Initializes cache with storage path and ensures cache directory exists
- **ensureCacheDir** (src/cache.ts): Creates cache directory if it doesn't exist
- **getCacheKey** (src/cache.ts): Generates a safe base64-encoded cache key from workspace path
- **get** (src/cache.ts): Retrieves cached analysis data for a workspace if valid (within 24 hours)
- **set** (src/cache.ts): Stores code analysis data with timestamp to cache file
- **clear** (src/cache.ts): Removes all cache files from the cache directory
- **getCacheFile** (src/cache.ts): Constructs full file path for cache file based on workspace root
- **getStats** (src/cache.ts): Calculates and returns statistics about cached files count and total size

### Strengths
- Strong separation of concerns with distinct modules for analysis, AI, caching, and UI
- Provider abstraction pattern allows multiple LLM backends (OpenAI, Anthropic) without tight coupling
- Comprehensive error handling with retry logic and rate limiting for external API calls
- Dual analysis approach combining AST parsing for accuracy with regex fallback for robustness
- Caching layer reduces redundant analysis and API costs
- Detailed metadata extraction including risk levels, dependencies, and behavioral hints

### Issues
- Response parser uses text parsing with regex instead of leveraging structured output from LLM providers consistently
- No apparent error recovery or graceful degradation if LLM providers are unavailable
- Cache invalidation strategy not evident - unclear when stale analysis is refreshed
- Function analyzer has duplicate logic between enhancedAnalyzer and functionAnalyzer modules
- Missing validation layer between raw LLM responses and parsed structured data
- No observable metrics or telemetry for monitoring extension performance in production

---

## Test Results
- Tests generated: 5
- Test file: /Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.js
- **Passed: 0**
- **Failed: 0**

### Test Output
```

> shadow-watch@1.0.0 pretest
> npm run compile-tests && npm run compile && npm run lint


> shadow-watch@1.0.0 compile-tests
> tsc -p . --outDir out

src/domain/bootstrap/commandRegistry.ts(47,28): error TS2551: Property 'insightsProvider' does not exist on type 'ExtensionComponents'. Did you mean 'insightsViewer'?
src/extension.ts(98,9): error TS2353: Object literal may only specify known properties, and 'analyzeWorkspace' does not exist in type 'CommandHandlers'.
src/llmIntegration.ts(2130,19): error TS2339: Property 'recommended_test_targets' does not exist on type 'LLMInsights'.
src/llmService.ts(1071,44): error TS2339: Property 'recommended_test_targets' does not exist on type 'LLMInsights'.
src/llmService.ts(3231,35): error TS2304: Cannot find name 'path'.
src/test/__mocks__/vscode.ts(143,22): error TS2749: 'TreeItemCollapsibleState' refers to a value, but is being used as a type here. Did you mean 'typeof TreeItemCollapsibleState'?
src/test/__mocks__/vscode.ts(152,24): error TS2749: 'TreeItemCollapsibleState' refers to a value, but is being used as a type here. Did you mean 'typeof TreeItemCollapsibleState'?

```
