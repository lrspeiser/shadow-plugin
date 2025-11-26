# Analysis + Test Report
Generated: 2025-11-26T06:35:03.459Z

## Analysis Summary
Shadow Watch is a VS Code extension that performs deep code analysis on TypeScript/JavaScript workspaces, leveraging multiple LLM providers (OpenAI, Anthropic) to generate insights about architecture, functions, dependencies, and refactoring opportunities with caching and visualization capabilities.

### Stats
- Files: 73
- Lines: 51564
- Functions: 112
- Analysis time: 157.7s

### Functions
- **activate** (src/extension.ts): Initializes the extension, bootstraps all components, registers commands, sets up file watchers and configuration handlers
- **createCommandHandlers** (src/extension.ts): Creates command handler functions with access to initialized extension components
- **analyzeWorkspace** (src/extension.ts): Analyzes the entire workspace, generates insights, updates diagnostics and tree view, runs comprehensive analysis workflow
- **analyzeCurrentFile** (src/extension.ts): Analyzes the currently active file in the editor
- **copyAllInsights** (src/extension.ts): Copies all generated insights to clipboard
- **copyFileInsights** (src/extension.ts): Copies insights for a specific file to clipboard
- **copyInsight** (src/extension.ts): Copies a specific insight item to clipboard
- **clearCache** (src/extension.ts): Clears the analysis cache
- **clearAllData** (src/extension.ts): Clears all extension data including cache and reports
- **showSettings** (src/extension.ts): Opens the extension settings page
- **openLatestReport** (src/extension.ts): Opens the most recent analysis report
- **openLatestUnitTestReport** (src/extension.ts): Opens the most recent unit test report
- **switchProvider** (src/extension.ts): Switches between LLM providers
- **copyMenuStructure** (src/extension.ts): Copies the menu structure to clipboard
- **showProviderStatus** (src/extension.ts): Displays current LLM provider status
- **constructor** (src/ai/llmRateLimiter.ts): Initializes rate limiter with default rate limit configurations for OpenAI and Claude providers
- **configure** (src/ai/llmRateLimiter.ts): Configures custom rate limits for a specific provider
- **canMakeRequest** (src/ai/llmRateLimiter.ts): Checks if a request can be made for the given provider based on current rate limits
- **recordRequest** (src/ai/llmRateLimiter.ts): Records a request timestamp for the given provider
- **waitUntilAvailable** (src/ai/llmRateLimiter.ts): Waits until a request can be made if rate limited, returns immediately if no wait is needed
- **getRequestCount** (src/ai/llmRateLimiter.ts): Gets the number of requests made in the current time window for a provider
- **clearHistory** (src/ai/llmRateLimiter.ts): Clears request history for a specific provider or all providers
- **parseFileSummary** (src/ai/llmResponseParser.ts): Parses file summary from LLM response, attempting JSON parsing first then falling back to text extraction
- **parseModuleSummary** (src/ai/llmResponseParser.ts): Parses module summary from LLM response with JSON parsing and text fallback
- **parseProductDocs** (src/ai/llmResponseParser.ts): Parses product documentation extracting sections like overview, features, architecture, tech stack, API endpoints, data models, and user flows
- **parseProductLevelDoc** (src/ai/llmResponseParser.ts): Parses product level documentation extracting overview, user perspectives (GUI/CLI/API/CICD), workflow integration, problems solved, and architecture
- **parseArchitectureInsights** (src/ai/llmResponseParser.ts): Parses architecture insights from LLM response including assessment, strengths, issues, and organization
- **extractSection** (src/ai/llmResponseParser.ts): Helper method to extract a named section from text content
- **extractListSection** (src/ai/llmResponseParser.ts): Helper method to extract a list/array section from text content
- **executeWithRetry** (src/ai/llmRetryHandler.ts): Execute an operation with retry logic using exponential backoff
- **isRetryableError** (src/ai/llmRetryHandler.ts): Check if an error should trigger a retry based on error patterns and status codes
- **delay** (src/ai/llmRetryHandler.ts): Delay execution for specified milliseconds
- **executeWithRetryAndCount** (src/ai/llmRetryHandler.ts): Execute operation with retry logic and return result with attempt count
- **getLLMStats** (src/ai/providers/anthropicProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetLLMStats** (src/ai/providers/anthropicProvider.ts): Resets all LLM call statistics counters to zero
- **initialize** (src/ai/providers/anthropicProvider.ts): Initializes the Anthropic client with API key from configuration manager
- **isConfigured** (src/ai/providers/anthropicProvider.ts): Checks if the Claude API client is properly configured with an API key
- **getName** (src/ai/providers/anthropicProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/anthropicProvider.ts): Sends a standard LLM request to Claude API and returns the response with token usage logging
- **sendStructuredRequest** (src/ai/providers/anthropicProvider.ts): Sends a structured output request to Claude API using beta structured outputs feature with JSON schema validation
- **getOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Resets LLM call statistics counters to zero
- **initialize** (src/ai/providers/openAIProvider.ts): Initializes OpenAI client with API key from configuration manager
- **isConfigured** (src/ai/providers/openAIProvider.ts): Checks if OpenAI client is properly configured with API key
- **getName** (src/ai/providers/openAIProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/openAIProvider.ts): Sends a chat completion request to OpenAI API with token tracking and logging
- **sendStructuredRequest** (src/ai/providers/openAIProvider.ts): Sends request expecting JSON response, extracts and parses structured data
- **sendRequestWithFallback** (src/ai/providers/openAIProvider.ts): Attempts request with multiple OpenAI models in sequence until one succeeds
- **getProvider** (src/ai/providers/providerFactory.ts): Get the provider instance for the specified provider type, creating it if needed
- **getCurrentProvider** (src/ai/providers/providerFactory.ts): Get the current provider instance based on configuration manager settings
- **isProviderConfigured** (src/ai/providers/providerFactory.ts): Check if a specific provider has valid configuration
- **getConfiguredProviders** (src/ai/providers/providerFactory.ts): Get list of all providers that are properly configured
- **analyzeFileMetadata** (src/analysis/enhancedAnalyzer.ts): Analyzes a single file and extracts enhanced metadata for all functions, delegating to TypeScript AST analysis or regex-based fallback
- **analyzeTypeScriptFunction** (src/analysis/enhancedAnalyzer.ts): Analyzes TypeScript/JavaScript functions using AST parsing to extract detailed metadata
- **findFunctionNode** (src/analysis/enhancedAnalyzer.ts): Locates a specific function node in the AST by matching function name and start line number
- **getFunctionName** (src/analysis/enhancedAnalyzer.ts): Extracts the function name from various AST node types including declarations, expressions, and arrow functions
- **extractMetadataFromAST** (src/analysis/enhancedAnalyzer.ts): Extracts comprehensive function metadata from AST node including parameters, return type, visibility, branches, dependencies, and state mutations
- **analyzeNode** (src/analysis/enhancedAnalyzer.ts): Recursively traverses AST nodes to identify branches, dependencies, and state mutations within function body
- **extractFunctionContent** (src/analysis/enhancedAnalyzer.ts): Extracts function source code content between specified line numbers
- **analyzeFunctionWithRegex** (src/analysis/enhancedAnalyzer.ts): Fallback regex-based analysis for non-TypeScript languages or when AST parsing fails
- **extractDocstring** (src/analysis/enhancedAnalyzer.ts): Extracts JSDoc comment associated with a function node
- **calculateRiskLevel** (src/analysis/enhancedAnalyzer.ts): Determines risk level based on complexity of branches, dependencies, and state mutations
- **analyzeFunctions** (src/analysis/functionAnalyzer.ts): Analyzes all functions in large files (above threshold) and extracts detailed information for each function
- **analyzeFunction** (src/analysis/functionAnalyzer.ts): Analyzes a single function in detail by resolving file path, reading content, and delegating to language-specific analyzers
- **analyzeTypeScriptFunction** (src/analysis/functionAnalyzer.ts): Analyzes TypeScript/JavaScript functions using AST parsing to extract signature, parameters, return type, visibility, async status, dependencies, dependents, and responsibilities
- **analyzeFunctionWithRegex** (src/analysis/functionAnalyzer.ts): Fallback regex-based analysis for functions when AST parsing fails or for non-TypeScript languages
- **findFunctionNode** (src/analysis/functionAnalyzer.ts): Traverses TypeScript AST to find a specific function node by name and start line number
- **extractSignature** (src/analysis/functionAnalyzer.ts): Extracts the complete function signature from AST node
- **extractParameters** (src/analysis/functionAnalyzer.ts): Extracts parameter names and types from function AST node
- **extractReturnType** (src/analysis/functionAnalyzer.ts): Extracts the return type annotation from function AST node
- **isPublic** (src/analysis/functionAnalyzer.ts): Determines if function has public visibility based on modifiers
- **isAsync** (src/analysis/functionAnalyzer.ts): Determines if function is async based on modifiers
- **extractDependencies** (src/analysis/functionAnalyzer.ts): Extracts what functions/identifiers this function calls by analyzing AST
- **extractDependents** (src/analysis/functionAnalyzer.ts): Extracts what other functions call this function by searching codeAnalysis
- **extractResponsibilities** (src/analysis/functionAnalyzer.ts): Extracts responsibilities/purposes of function by analyzing AST structure and patterns
- **extractDependenciesRegex** (src/analysis/functionAnalyzer.ts): Fallback regex-based dependency extraction when AST parsing unavailable
- **extractResponsibilitiesRegex** (src/analysis/functionAnalyzer.ts): Fallback regex-based responsibility extraction using simple heuristics
- **resolveFilePath** (src/analysis/functionAnalyzer.ts): Resolves relative file path to absolute path using codeAnalysis context
- **setAnalysis** (src/analysisViewer.ts): Updates the analysis data and refreshes the tree view
- **refresh** (src/analysisViewer.ts): Triggers a refresh of the tree view
- **getTreeItem** (src/analysisViewer.ts): Returns the tree item representation for an analysis element
- **getChildren** (src/analysisViewer.ts): Returns child items for a given tree element, handling different item types
- **getRootItems** (src/analysisViewer.ts): Generates root level items showing statistics, files, languages, functions, entry points, dependencies, and orphaned files
- **getStatisticsItems** (src/analysisViewer.ts): Returns statistics items including total files, lines, functions, large files, imported and orphaned files
- **getFilesItems** (src/analysisViewer.ts): Groups and returns file items organized by directory structure
- **getFileDetails** (src/analysisViewer.ts): Returns detailed information for a specific file including functions and imports
- **getDirectoryFiles** (src/analysisViewer.ts): Returns files belonging to a specific directory
- **getFunctionsItems** (src/analysisViewer.ts): Returns all functions found in the codebase
- **getFileFunctions** (src/analysisViewer.ts): Returns functions belonging to a specific file
- **getFileImports** (src/analysisViewer.ts): Returns import statements for a specific file
- **getEntryPointsItems** (src/analysisViewer.ts): Returns application entry points from the analysis
- **getDependenciesItems** (src/analysisViewer.ts): Returns files that have import relationships
- **getOrphanedFilesItems** (src/analysisViewer.ts): Returns files that are not imported anywhere in the codebase
- **getLanguagesItems** (src/analysisViewer.ts): Returns unique programming languages found in the codebase
- **getLanguageFiles** (src/analysisViewer.ts): Returns files associated with a specific programming language
- **getUniqueLanguages** (src/analysisViewer.ts): Extracts and returns unique languages from analyzed files
- **analyzeWorkspace** (src/analyzer.ts): Recursively analyzes all code files in a workspace, extracting metrics, functions, imports, dependencies, and entry points
- **analyzeFile** (src/analyzer.ts): Analyzes a single file for code metrics, functions, and imports
- **findCodeFiles** (src/analyzer.ts): Recursively finds all code files in a directory based on file extensions
- **findAllFiles** (src/analyzer.ts): Recursively finds all files in a directory including non-code files
- **extractFunctions** (src/analyzer.ts): Extracts function definitions from source code based on language
- **extractImports** (src/analyzer.ts): Extracts import statements from source code based on language
- **analyzeDependencies** (src/analyzer.ts): Analyzes file dependencies to identify imported and orphaned files
- **detectEntryPoints** (src/analyzer.ts): Detects entry point files in the workspace like main files, package.json scripts, etc.
- **constructor** (src/cache.ts): Initializes the cache with a storage path and creates the cache directory
- **ensureCacheDir** (src/cache.ts): Creates the cache directory if it doesn't exist
- **getCacheKey** (src/cache.ts): Generates a safe base64-encoded cache key from a workspace path
- **get** (src/cache.ts): Retrieves cached code analysis data if it exists and is not expired (24 hours)
- **set** (src/cache.ts): Stores code analysis data in the cache with a timestamp
- **clear** (src/cache.ts): Removes all cached files from the cache directory
- **getCacheFile** (src/cache.ts): Constructs the full file path for a cache file based on workspace root
- **getStats** (src/cache.ts): Returns cache statistics including number of files and total size in bytes

### Strengths
- Provider abstraction allows seamless switching between OpenAI and Anthropic
- Comprehensive rate limiting and retry logic for API reliability
- Deep AST-based analysis with regex fallbacks for robustness
- File-based caching reduces redundant API calls and improves performance
- Structured response parsing supports multiple documentation formats
- Clear separation between analysis, AI processing, and presentation layers

### Issues
- No explicit error handling strategy visible in extension.ts command handlers
- Cache expiration logic exists but no cache invalidation on file changes
- Missing input validation before sending code to LLM providers
- No mechanism to handle partial analysis failures in multi-file workspaces
- Rate limiter configuration appears static with no dynamic adjustment
- Response parser uses brittle string extraction that may fail on format variations
- No test files present despite Jest configuration
- Function analyzer has duplicate logic between enhancedAnalyzer and functionAnalyzer

---

## Test Results
- Tests generated: 7
- Test file: /Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.js
- **Passed: 0**
- **Failed: 0**

### Test Output
```
{"numFailedTestSuites":1,"numFailedTests":0,"numPassedTestSuites":0,"numPassedTests":0,"numPendingTestSuites":0,"numPendingTests":0,"numRuntimeErrorTestSuites":1,"numTodoTests":0,"numTotalTestSuites":1,"numTotalTests":0,"openHandles":[],"snapshot":{"added":0,"didUpdate":false,"failure":false,"filesAdded":0,"filesRemoved":0,"filesRemovedList":[],"filesUnmatched":0,"filesUpdated":0,"matched":0,"total":0,"unchecked":0,"uncheckedKeysByFile":[],"unmatched":0,"updated":0},"startTime":1764138903025,"success":false,"testResults":[{"assertionResults":[],"coverage":{},"endTime":1764138903438,"message":"  ● Test suite failed to run\n\n    Jest encountered an unexpected token\n\n    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.\n\n    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.\n\n    By default \"node_modules\" folder is ignored by transformers.\n\n    Here's what you can do:\n     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.\n     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript\n     • To have some of your \"node_modules\" files transformed, you can specify a custom \"transformIgnorePatterns\" in your config.\n     • If you need a custom transformation specify a \"transform\" option in your config.\n     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the \"moduleNameMapper\" config option.\n\n    You'll find more details and examples of these config options in the docs:\n    https://jestjs.io/docs/configuration\n    For information about custom transformations, see:\n    https://jestjs.io/docs/code-transformation\n\n    Details:\n\n    /Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.t
```
