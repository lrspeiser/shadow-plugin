# Analysis + Test Report
Generated: 2025-11-26T17:50:55.532Z

## Analysis Summary
Shadow Watch is a VS Code extension for automated code analysis that uses LLM providers (OpenAI, Claude) to generate insights about codebase architecture, function summaries, and documentation

### Stats
- Files: 73
- Lines: 56072
- Functions: 110
- Analysis time: 150.5s

### Functions
- **activate** (src/extension.ts): Entry point that initializes all extension components, registers commands, sets up file watchers, and handles configuration
- **createCommandHandlers** (src/extension.ts): Creates command handler functions with access to extension components
- **analyzeWorkspace** (src/extension.ts): Performs full workspace analysis including code analysis, insight generation, diagnostics update, and comprehensive LLM analysis
- **analyzeCurrentFile** (src/extension.ts): Analyzes the currently active file in the editor and updates diagnostics
- **clearAllData** (src/extension.ts): Clears all cached data, reports, and resets extension state
- **showSettings** (src/extension.ts): Opens extension settings in VS Code settings editor
- **constructor** (src/ai/llmRateLimiter.ts): Initializes the rate limiter with default rate limit configurations for OpenAI (60/min) and Claude (50/min)
- **configure** (src/ai/llmRateLimiter.ts): Configure rate limits for a specific provider
- **canMakeRequest** (src/ai/llmRateLimiter.ts): Check if a request can be made for the given provider without exceeding rate limits
- **recordRequest** (src/ai/llmRateLimiter.ts): Record a request timestamp for the given provider
- **waitUntilAvailable** (src/ai/llmRateLimiter.ts): Wait until a request can be made if rate limited, returns immediately if no wait needed
- **getRequestCount** (src/ai/llmRateLimiter.ts): Get the number of requests made in the current time window
- **clearHistory** (src/ai/llmRateLimiter.ts): Clear request history for a specific provider or all providers
- **parseFileSummary** (src/ai/llmResponseParser.ts): Parse file summary from LLM response, attempting JSON parsing first with text extraction fallback
- **parseModuleSummary** (src/ai/llmResponseParser.ts): Parse module summary from LLM response into structured ModuleSummary object
- **parseProductDocs** (src/ai/llmResponseParser.ts): Parse product documentation from LLM response, extracting overview, features, architecture, tech stack, and other sections
- **parseProductLevelDoc** (src/ai/llmResponseParser.ts): Parse product level documentation into EnhancedProductDocumentation structure
- **parseArchitectureInsights** (src/ai/llmResponseParser.ts): Parse architecture insights from LLM response with multiple section name variations
- **extractSection** (src/ai/llmResponseParser.ts): Extract a named section from text content (implied helper method)
- **extractListSection** (src/ai/llmResponseParser.ts): Extract a list/array from a named section in text content (implied helper method)
- **executeWithRetry** (src/ai/llmRetryHandler.ts): Execute an async operation with automatic retry logic using exponential backoff
- **isRetryableError** (src/ai/llmRetryHandler.ts): Check if an error matches retryable patterns (rate limits, network errors, 5xx status codes)
- **delay** (src/ai/llmRetryHandler.ts): Delay execution for specified milliseconds
- **executeWithRetryAndCount** (src/ai/llmRetryHandler.ts): Execute with retry logic and return both result and attempt count
- **isConfigured** (src/ai/providers/ILLMProvider.ts): Check if the provider is configured and ready to use
- **sendRequest** (src/ai/providers/ILLMProvider.ts): Send a request and get a text response
- **sendStructuredRequest** (src/ai/providers/ILLMProvider.ts): Send a request with structured output (JSON) and return parsed JSON data
- **getName** (src/ai/providers/ILLMProvider.ts): Get the provider name
- **getLLMStats** (src/ai/providers/anthropicProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetLLMStats** (src/ai/providers/anthropicProvider.ts): Resets all LLM statistics counters to zero
- **constructor** (src/ai/providers/anthropicProvider.ts): Initializes the Anthropic provider and calls initialize method
- **initialize** (src/ai/providers/anthropicProvider.ts): Sets up the Anthropic client with API key from configuration manager
- **isConfigured** (src/ai/providers/anthropicProvider.ts): Checks if the Claude API client is properly configured
- **getName** (src/ai/providers/anthropicProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/anthropicProvider.ts): Sends a standard chat completion request to Claude API with message conversion and token logging
- **sendStructuredRequest** (src/ai/providers/anthropicProvider.ts): Sends a structured output request using Claude's beta API with JSON schema validation and fallback extraction
- **getOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Resets all LLM call statistics to zero
- **initialize** (src/ai/providers/openAIProvider.ts): Initializes the OpenAI client with API key from configuration
- **isConfigured** (src/ai/providers/openAIProvider.ts): Checks if the OpenAI client is properly configured
- **getName** (src/ai/providers/openAIProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/openAIProvider.ts): Sends a chat completion request to OpenAI API with token tracking and logging
- **sendStructuredRequest** (src/ai/providers/openAIProvider.ts): Sends a request expecting JSON response and parses it into typed object
- **sendRequestWithFallback** (src/ai/providers/openAIProvider.ts): Attempts request with multiple models in sequence until one succeeds
- **getProvider** (src/ai/providers/providerFactory.ts): Get or create a provider instance for the specified provider type using lazy initialization
- **getCurrentProvider** (src/ai/providers/providerFactory.ts): Get the current provider based on configuration manager settings
- **isProviderConfigured** (src/ai/providers/providerFactory.ts): Check if a specific provider has been configured with valid credentials
- **getConfiguredProviders** (src/ai/providers/providerFactory.ts): Get a list of all providers that are currently configured
- **analyzeFileMetadata** (src/analysis/enhancedAnalyzer.ts): Analyze a single file and extract enhanced metadata for all functions
- **analyzeTypeScriptFunction** (src/analysis/enhancedAnalyzer.ts): Analyze TypeScript/JavaScript function using AST parsing
- **findFunctionNode** (src/analysis/enhancedAnalyzer.ts): Find function node in AST by name and line number
- **getFunctionName** (src/analysis/enhancedAnalyzer.ts): Get function name from AST node
- **extractMetadataFromAST** (src/analysis/enhancedAnalyzer.ts): Extract metadata from AST node including parameters, return type, visibility, branches, dependencies
- **analyzeNode** (src/analysis/enhancedAnalyzer.ts): Recursively analyze AST node for branches, dependencies, and mutations
- **extractFunctionContent** (src/analysis/enhancedAnalyzer.ts): Extract function source code content by line range
- **analyzeFunctionWithRegex** (src/analysis/enhancedAnalyzer.ts): Fallback regex-based analysis for non-TypeScript languages
- **extractDocstring** (src/analysis/enhancedAnalyzer.ts): Extract JSDoc comment from function node
- **calculateRiskLevel** (src/analysis/enhancedAnalyzer.ts): Determine risk level based on branches, dependencies, and state mutations
- **analyzeFunctions** (src/analysis/functionAnalyzer.ts): Analyze all functions in large files and extract detailed information
- **analyzeFunction** (src/analysis/functionAnalyzer.ts): Analyze a single function in detail, delegating to AST or regex-based analysis
- **analyzeTypeScriptFunction** (src/analysis/functionAnalyzer.ts): Analyze TypeScript/JavaScript function using AST parsing for accurate extraction
- **analyzeFunctionWithRegex** (src/analysis/functionAnalyzer.ts): Fallback regex-based analysis when AST parsing fails or for non-TS/JS languages
- **findFunctionNode** (src/analysis/functionAnalyzer.ts): Find function node in AST by name and start line
- **extractSignature** (src/analysis/functionAnalyzer.ts): Extract function signature from AST node
- **extractParameters** (src/analysis/functionAnalyzer.ts): Extract parameter list from function node
- **extractReturnType** (src/analysis/functionAnalyzer.ts): Extract return type from function node
- **isPublic** (src/analysis/functionAnalyzer.ts): Check if function has public visibility
- **isAsync** (src/analysis/functionAnalyzer.ts): Check if function is async
- **extractDependencies** (src/analysis/functionAnalyzer.ts): Extract dependencies (what this function calls)
- **extractDependents** (src/analysis/functionAnalyzer.ts): Extract dependents (what calls this function)
- **extractResponsibilities** (src/analysis/functionAnalyzer.ts): Extract responsibilities from function AST
- **extractDependenciesRegex** (src/analysis/functionAnalyzer.ts): Extract dependencies using regex-based analysis
- **extractResponsibilitiesRegex** (src/analysis/functionAnalyzer.ts): Extract responsibilities using simple heuristics
- **resolveFilePath** (src/analysis/functionAnalyzer.ts): Resolve file path relative to project root
- **setAnalysis** (src/analysisViewer.ts): Sets the analysis data and refreshes the tree view
- **refresh** (src/analysisViewer.ts): Triggers a refresh of the tree view by firing the change event
- **getTreeItem** (src/analysisViewer.ts): Returns the tree item representation for an element
- **getChildren** (src/analysisViewer.ts): Returns child items for a given element or root items if no element provided
- **getRootItems** (src/analysisViewer.ts): Builds the root level tree items showing statistics, files, languages, functions, entry points, dependencies, and orphaned files
- **getStatisticsItems** (src/analysisViewer.ts): Returns statistics items showing total files, lines, functions, and other metrics
- **getFilesItems** (src/analysisViewer.ts): Groups files by directory and returns directory tree items
- **getFileDetails** (src/analysisViewer.ts): Returns detail items for a specific file including imports and functions
- **getDirectoryFiles** (src/analysisViewer.ts): Returns file items within a specific directory
- **getFunctionsItems** (src/analysisViewer.ts): Returns all function items grouped by file
- **getFileFunctions** (src/analysisViewer.ts): Returns function items for a specific file
- **getFileImports** (src/analysisViewer.ts): Returns import items for a specific file
- **getEntryPointsItems** (src/analysisViewer.ts): Returns entry point items from the analysis
- **getDependenciesItems** (src/analysisViewer.ts): Returns dependency/import relationship items
- **getOrphanedFilesItems** (src/analysisViewer.ts): Returns items for files that are not imported anywhere
- **getLanguagesItems** (src/analysisViewer.ts): Returns items grouped by programming language
- **getLanguageFiles** (src/analysisViewer.ts): Returns file items for a specific programming language
- **getUniqueLanguages** (src/analysisViewer.ts): Extracts unique languages from analyzed files
- **constructor** (src/analyzer.ts): Initializes the CodeAnalyzer with an analysis cache
- **analyzeWorkspace** (src/analyzer.ts): Recursively analyzes all code files in a workspace, extracting file info, functions, imports, dependencies, and entry points
- **analyzeFile** (src/analyzer.ts): Analyzes a single file for code metrics, functions, and imports
- **findCodeFiles** (src/analyzer.ts): Recursively finds all code files with recognized extensions in a directory
- **findAllFiles** (src/analyzer.ts): Recursively finds all files including non-code files for organization analysis
- **extractFunctions** (src/analyzer.ts): Extracts function definitions from code content based on language-specific patterns
- **extractImports** (src/analyzer.ts): Extracts import statements from code and resolves them to file paths
- **resolveImportPath** (src/analyzer.ts): Resolves a relative import path to an actual file path
- **analyzeDependencies** (src/analyzer.ts): Analyzes import relationships to identify imported and orphaned files
- **detectEntryPoints** (src/analyzer.ts): Identifies entry point files in the codebase based on naming patterns and content
- **constructor** (src/cache.ts): Initializes cache with storage path and ensures cache directory exists
- **ensureCacheDir** (src/cache.ts): Creates the cache directory if it doesn't exist
- **getCacheKey** (src/cache.ts): Generates a safe base64-encoded filename from workspace path
- **get** (src/cache.ts): Retrieves cached analysis data if valid (within 24 hours)
- **set** (src/cache.ts): Stores analysis data with timestamp to cache file
- **clear** (src/cache.ts): Deletes all cache files from the cache directory
- **getCacheFile** (src/cache.ts): Constructs full path to cache file for a workspace
- **getStats** (src/cache.ts): Returns statistics about cache including file count and total size

### Strengths
- Well-designed provider abstraction allows easy addition of new LLM backends
- Robust error handling with configurable retry logic and rate limiting
- Dual analysis strategy (AST-based with regex fallback) ensures broad language support
- Clean separation between AI communication, analysis logic, and presentation
- Comprehensive function analysis including risk assessment, dependency tracking, and state mutation detection
- File-based caching reduces redundant analysis operations

### Issues
- LLM response parsing relies on extracting sections from unstructured text which may be fragile
- Rate limiter and retry handler are separate concerns that could benefit from unified resilience middleware
- No visible error recovery or user notification strategy in extension entry point
- Cache TTL is hardcoded (24 hours) without configuration options
- Provider factory uses lazy initialization which could mask configuration errors until runtime

---

## Test Results
- Tests generated: 8
- Test file: /Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.ts
- **Passed: 0**
- **Failed: 0**

### Test Output
```
{"numFailedTestSuites":1,"numFailedTests":0,"numPassedTestSuites":0,"numPassedTests":0,"numPendingTestSuites":0,"numPendingTests":0,"numRuntimeErrorTestSuites":1,"numTodoTests":0,"numTotalTestSuites":1,"numTotalTests":0,"openHandles":[],"snapshot":{"added":0,"didUpdate":false,"failure":false,"filesAdded":0,"filesRemoved":0,"filesRemovedList":[],"filesUnmatched":0,"filesUpdated":0,"matched":0,"total":0,"unchecked":0,"uncheckedKeysByFile":[],"unmatched":0,"updated":0},"startTime":1764179454455,"success":false,"testResults":[{"assertionResults":[],"coverage":{},"endTime":1764179455510,"message":"  ● Test suite failed to run\n\n    \u001b[96mUnitTests/generated.test.ts\u001b[0m:\u001b[93m163\u001b[0m:\u001b[93m7\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS7034: \u001b[0mVariable 'mockProvider' implicitly has type 'any' in some locations where its type cannot be determined.\n\n    \u001b[7m163\u001b[0m   let mockProvider;\n    \u001b[7m   \u001b[0m \u001b[91m      ~~~~~~~~~~~~\u001b[0m\n    \u001b[96mUnitTests/generated.test.ts\u001b[0m:\u001b[93m173\u001b[0m:\u001b[93m5\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS7005: \u001b[0mVariable 'mockProvider' implicitly has an 'any' type.\n\n    \u001b[7m173\u001b[0m     mockProvider.sendRequest.mockResolvedValue(JSON.stringify(expectedData));\n    \u001b[7m   \u001b[0m \u001b[91m    ~~~~~~~~~~~~\u001b[0m\n    \u001b[96mUnitTests/generated.test.ts\u001b[0m:\u001b[93m176\u001b[0m:\u001b[93m7\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS7005: \u001b[0mVariable 'mockProvider' implicitly has an 'any' type.\n\n    \u001b[7m176\u001b[0m       mockProvider,\n    \u001b[7m   \u001b[0m \u001b[91m      ~~~~~~~~~~~~\u001b[0m\n    \u001b[96mUnitTests/generated.test.ts\u001b[0m:\u001b[93m182\u001b[0m:\u001b[93m12\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS7005: \u001b[0mVariable 'mockProvider' implicitly has an 'any' type.\n\n    \u001b[7m182\u001b[0m     expect(mockProvider.sendRequest).toHaveBeenCalledWith(\n    \u001b[7m 
```
