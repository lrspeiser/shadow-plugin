# Analysis + Test Report
Generated: 2025-11-26T18:25:42.661Z

## Analysis Summary
Shadow Watch - A VS Code extension for AI-powered code analysis that provides architectural insights, function extraction, dependency analysis, and documentation generation using LLM providers (OpenAI, Anthropic Claude)

### Stats
- Files: 73
- Lines: 56134
- Functions: 115
- Analysis time: 155.0s

### Functions
- **activate** (src/extension.ts): Initializes all extension components using bootstrapper, registers commands, sets up file watchers, and configures event handlers
- **createCommandHandlers** (src/extension.ts): Creates command handler functions that have access to extension components
- **analyzeWorkspace** (src/extension.ts): Performs full workspace analysis including code analysis, insight generation, diagnostics update, and comprehensive LLM analysis
- **analyzeCurrentFile** (src/extension.ts): Analyzes the currently active file in the editor and updates diagnostics
- **showInsights** (src/extension.ts): Opens the Shadow Watch insights panel webview with analysis results
- **formatForLLM** (src/extension.ts): Formats code analysis results for LLM consumption and copies to clipboard or opens in new document
- **showSettings** (src/extension.ts): Opens VS Code settings filtered to Shadow Watch configuration
- **clearCache** (src/extension.ts): Clears the analysis cache and shows confirmation
- **clearAllData** (src/extension.ts): Clears all extension data including cache, insights, reports, and resets providers
- **showReportDetails** (src/extension.ts): Opens a detailed view of a selected analysis report in a webview panel
- **deactivate** (src/extension.ts): Cleanup function called when extension is deactivated
- **constructor** (src/ai/llmRateLimiter.ts): Initializes the rate limiter with default rate limit configurations for OpenAI (60/min) and Claude (50/min)
- **configure** (src/ai/llmRateLimiter.ts): Configure custom rate limits for a specific LLM provider
- **canMakeRequest** (src/ai/llmRateLimiter.ts): Check if a request can be made for the given provider without exceeding rate limits
- **recordRequest** (src/ai/llmRateLimiter.ts): Record a request timestamp for the given provider
- **waitUntilAvailable** (src/ai/llmRateLimiter.ts): Wait until a request can be made if rate limited, returns immediately if no wait needed
- **getRequestCount** (src/ai/llmRateLimiter.ts): Get the number of requests made in the current time window for a provider
- **clearHistory** (src/ai/llmRateLimiter.ts): Clear request history for a specific provider or all providers
- **parseFileSummary** (src/ai/llmResponseParser.ts): Parse file summary from LLM response, attempting JSON parsing first with text extraction fallback
- **parseModuleSummary** (src/ai/llmResponseParser.ts): Parse module summary from LLM response with JSON parsing and text fallback
- **parseProductDocs** (src/ai/llmResponseParser.ts): Parse product documentation from LLM response, extracting overview, features, architecture, tech stack, API endpoints, data models, and user flows
- **parseProductLevelDoc** (src/ai/llmResponseParser.ts): Parse enhanced product level documentation with user perspective sections (GUI, CLI, API, CI/CD)
- **parseArchitectureInsights** (src/ai/llmResponseParser.ts): Parse architecture insights from LLM response including assessment, strengths, issues, and organization
- **extractSection** (src/ai/llmResponseParser.ts): Extract a named text section from content (implied helper method)
- **extractListSection** (src/ai/llmResponseParser.ts): Extract a named list section as array from content (implied helper method)
- **executeWithRetry** (src/ai/llmRetryHandler.ts): Execute an async operation with automatic retry logic using exponential backoff
- **isRetryableError** (src/ai/llmRetryHandler.ts): Check if an error matches retryable patterns (rate limits, network errors, 5xx status codes)
- **delay** (src/ai/llmRetryHandler.ts): Create a promise that resolves after specified milliseconds
- **executeWithRetryAndCount** (src/ai/llmRetryHandler.ts): Execute with retry and return both result and number of attempts made
- **isConfigured** (src/ai/providers/ILLMProvider.ts): Check if the provider is configured and ready to use
- **sendRequest** (src/ai/providers/ILLMProvider.ts): Send a request and get a text response
- **sendStructuredRequest** (src/ai/providers/ILLMProvider.ts): Send a request with structured output (JSON), returns parsed JSON data
- **getName** (src/ai/providers/ILLMProvider.ts): Get the provider name
- **getLLMStats** (src/ai/providers/anthropicProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetLLMStats** (src/ai/providers/anthropicProvider.ts): Resets all LLM call statistics to zero
- **constructor** (src/ai/providers/anthropicProvider.ts): Initializes the Anthropic provider and calls initialize
- **initialize** (src/ai/providers/anthropicProvider.ts): Sets up the Anthropic client with API key from configuration manager
- **isConfigured** (src/ai/providers/anthropicProvider.ts): Checks if the Anthropic client is properly configured
- **getName** (src/ai/providers/anthropicProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/anthropicProvider.ts): Sends a standard chat request to Claude API with message conversion and token tracking
- **sendStructuredRequest** (src/ai/providers/anthropicProvider.ts): Sends a structured output request to Claude API using beta structured outputs feature with JSON schema validation
- **getOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Resets all LLM call statistics to zero
- **initialize** (src/ai/providers/openAIProvider.ts): Initializes the OpenAI client with API key from configuration
- **isConfigured** (src/ai/providers/openAIProvider.ts): Checks if the OpenAI client is properly configured with an API key
- **getName** (src/ai/providers/openAIProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/openAIProvider.ts): Sends a chat completion request to OpenAI API with optional system prompt and logs usage statistics
- **sendStructuredRequest** (src/ai/providers/openAIProvider.ts): Sends a request expecting JSON response and parses it into typed object using robust JSON extraction
- **sendRequestWithFallback** (src/ai/providers/openAIProvider.ts): Tries multiple OpenAI models in sequence until one succeeds, useful for handling model availability issues
- **getProvider** (src/ai/providers/providerFactory.ts): Get or create a provider instance for the specified provider type (lazy initialization)
- **getCurrentProvider** (src/ai/providers/providerFactory.ts): Get the current provider based on configuration manager settings
- **isProviderConfigured** (src/ai/providers/providerFactory.ts): Check if a specific provider has valid configuration (API key)
- **getConfiguredProviders** (src/ai/providers/providerFactory.ts): Get list of all providers that are properly configured
- **analyzeFileMetadata** (src/analysis/enhancedAnalyzer.ts): Analyze a single file and extract enhanced metadata for all functions
- **analyzeTypeScriptFunction** (src/analysis/enhancedAnalyzer.ts): Analyze TypeScript/JavaScript function using AST parsing
- **findFunctionNode** (src/analysis/enhancedAnalyzer.ts): Find function node in AST by name and line number
- **getFunctionName** (src/analysis/enhancedAnalyzer.ts): Get function name from AST node
- **extractMetadataFromAST** (src/analysis/enhancedAnalyzer.ts): Extract metadata from AST node including parameters, return type, visibility, branches, dependencies
- **analyzeNode** (src/analysis/enhancedAnalyzer.ts): Recursively analyze AST node for branches, dependencies, and mutations
- **extractFunctionContent** (src/analysis/enhancedAnalyzer.ts): Extract function content from source by line numbers
- **analyzeFunctionWithRegex** (src/analysis/enhancedAnalyzer.ts): Fallback regex-based analysis for non-TypeScript languages
- **extractDocstring** (src/analysis/enhancedAnalyzer.ts): Extract JSDoc comment from function node
- **calculateRiskLevel** (src/analysis/enhancedAnalyzer.ts): Determine risk level based on branches, dependencies and mutations
- **analyzeFunctions** (src/analysis/functionAnalyzer.ts): Analyze all functions in large files and extract detailed information
- **analyzeFunction** (src/analysis/functionAnalyzer.ts): Analyze a single function in detail, dispatching to TypeScript or regex analyzer
- **analyzeTypeScriptFunction** (src/analysis/functionAnalyzer.ts): Analyze TypeScript/JavaScript function using AST for detailed extraction
- **analyzeFunctionWithRegex** (src/analysis/functionAnalyzer.ts): Fallback regex-based analysis for non-TypeScript files or when AST fails
- **findFunctionNode** (src/analysis/functionAnalyzer.ts): Find function node in AST by name and start line
- **extractSignature** (src/analysis/functionAnalyzer.ts): Extract function signature from AST node
- **extractParameters** (src/analysis/functionAnalyzer.ts): Extract parameter names from function node
- **extractReturnType** (src/analysis/functionAnalyzer.ts): Extract return type from function node
- **isPublic** (src/analysis/functionAnalyzer.ts): Check if function has public visibility
- **isAsync** (src/analysis/functionAnalyzer.ts): Check if function is async
- **extractDependencies** (src/analysis/functionAnalyzer.ts): Extract dependencies (what this function calls) using AST
- **extractDependents** (src/analysis/functionAnalyzer.ts): Extract dependents (what calls this function)
- **extractResponsibilities** (src/analysis/functionAnalyzer.ts): Extract responsibilities from function using AST analysis
- **extractDependenciesRegex** (src/analysis/functionAnalyzer.ts): Extract dependencies using regex-based approach
- **extractResponsibilitiesRegex** (src/analysis/functionAnalyzer.ts): Extract responsibilities using regex heuristics
- **resolveFilePath** (src/analysis/functionAnalyzer.ts): Resolve file path to absolute path
- **setAnalysis** (src/analysisViewer.ts): Sets the code analysis data and triggers a tree refresh
- **refresh** (src/analysisViewer.ts): Fires the tree data change event to refresh the view
- **getTreeItem** (src/analysisViewer.ts): Returns the tree item representation for an element
- **getChildren** (src/analysisViewer.ts): Returns child items for a given tree element, handling different item types like files, functions, entry points, etc.
- **getRootItems** (src/analysisViewer.ts): Creates the root level tree items showing statistics, files, languages, functions, entry points, dependencies, and orphaned files
- **getStatisticsItems** (src/analysisViewer.ts): Returns tree items displaying analysis statistics like total files, lines, and functions
- **getFilesItems** (src/analysisViewer.ts): Groups and returns files organized by directory structure
- **getFileDetails** (src/analysisViewer.ts): Returns detail items for a specific file
- **getDirectoryFiles** (src/analysisViewer.ts): Returns file items for files within a specific directory
- **getFunctionsItems** (src/analysisViewer.ts): Returns tree items for all functions in the codebase
- **getFileFunctions** (src/analysisViewer.ts): Returns function items for a specific file
- **getFileImports** (src/analysisViewer.ts): Returns import items for a specific file
- **getEntryPointsItems** (src/analysisViewer.ts): Returns tree items for application entry points
- **getDependenciesItems** (src/analysisViewer.ts): Returns tree items for file import dependencies
- **getOrphanedFilesItems** (src/analysisViewer.ts): Returns tree items for files not imported anywhere
- **getLanguagesItems** (src/analysisViewer.ts): Returns tree items for each programming language found
- **getLanguageFiles** (src/analysisViewer.ts): Returns file items filtered by a specific language
- **getUniqueLanguages** (src/analysisViewer.ts): Extracts unique programming languages from analyzed files
- **constructor** (src/analyzer.ts): Initializes CodeAnalyzer with an AnalysisCache instance
- **analyzeWorkspace** (src/analyzer.ts): Recursively analyzes all code files in a workspace, extracting metrics, functions, imports, dependencies, and entry points
- **analyzeFile** (src/analyzer.ts): Analyzes a single file for code metrics, functions, and imports
- **findCodeFiles** (src/analyzer.ts): Recursively finds all code files with supported extensions in a directory
- **findAllFiles** (src/analyzer.ts): Recursively finds all files in a directory including non-code files
- **extractFunctions** (src/analyzer.ts): Extracts function definitions from source code based on language-specific patterns
- **extractImports** (src/analyzer.ts): Extracts import/require statements and resolves them to file paths
- **resolveImportPath** (src/analyzer.ts): Resolves a relative import path to an actual file in the workspace
- **analyzeDependencies** (src/analyzer.ts): Analyzes import relationships to identify imported and orphaned files
- **detectEntryPoints** (src/analyzer.ts): Detects application entry points by looking for common patterns like main files, package.json, etc.
- **constructor** (src/cache.ts): Initializes cache with storage path and ensures cache directory exists
- **ensureCacheDir** (src/cache.ts): Creates the cache directory if it doesn't exist
- **getCacheKey** (src/cache.ts): Generates a safe base64-encoded filename from workspace path
- **get** (src/cache.ts): Retrieves cached analysis data if exists and not expired (24h TTL)
- **set** (src/cache.ts): Stores analysis data with timestamp to cache file
- **clear** (src/cache.ts): Removes all cached files from the cache directory
- **getCacheFile** (src/cache.ts): Constructs the full file path for a workspace's cache file
- **getStats** (src/cache.ts): Returns statistics about cache usage including file count and total size

### Strengths
- Clean provider abstraction allowing easy addition of new LLM backends
- Robust error handling with retry logic and exponential backoff for API resilience
- Dual parsing strategy (AST with regex fallback) ensures broad code compatibility
- File-based caching reduces redundant API calls and improves performance
- Clear module boundaries with single responsibility principle
- Rate limiting prevents API quota exhaustion

### Issues
- Response parser has multiple extraction strategies suggesting inconsistent LLM output formats
- Cache expiration is hardcoded (24 hours) rather than configurable
- Provider factory uses lazy initialization which may hide configuration errors until runtime
- Missing centralized error handling or logging infrastructure
- Analyzer module (src/analyzer.ts) appears to have overlapping responsibilities with enhancedAnalyzer.ts

---

## Test Results
- Tests generated: 8
- Test file: /Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.ts
- **Passed: 0**
- **Failed: 0**

### Test Output
```
{"numFailedTestSuites":1,"numFailedTests":0,"numPassedTestSuites":0,"numPassedTests":0,"numPendingTestSuites":0,"numPendingTests":0,"numRuntimeErrorTestSuites":1,"numTodoTests":0,"numTotalTestSuites":1,"numTotalTests":0,"openHandles":[],"snapshot":{"added":0,"didUpdate":false,"failure":false,"filesAdded":0,"filesRemoved":0,"filesRemovedList":[],"filesUnmatched":0,"filesUpdated":0,"matched":0,"total":0,"unchecked":0,"uncheckedKeysByFile":[],"unmatched":0,"updated":0},"startTime":1764181541495,"success":false,"testResults":[{"assertionResults":[],"coverage":{},"endTime":1764181542641,"message":"  ● Test suite failed to run\n\n    Cannot find module '../src/config/aiConfig' from 'UnitTests/generated.test.ts'\n\n      332 | });\n      333 |\n    > 334 | jest.mock('../src/config/aiConfig', () => ({\n          |      ^\n      335 |   getAIConfig: jest.fn().mockReturnValue({\n      336 |     openai: {\n      337 |       apiKey: 'test-api-key',\n\n      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)\n      at Object.<anonymous> (UnitTests/generated.test.ts:334:6)\n","name":"/Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.ts","startTime":1764181542641,"status":"failed","summary":""}],"wasInterrupted":false}

```
