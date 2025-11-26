# Analysis + Test Report
Generated: 2025-11-26T22:19:43.386Z

## Analysis Summary
Shadow Watch - A VS Code extension that performs intelligent code analysis, generating architecture insights and documentation through LLM integration. It scans codebases to extract functions, dependencies, and organizational structure, then uses AI providers (OpenAI/Anthropic) to synthesize architectural understanding and detect issues.

### Stats
- Files: 73
- Lines: 56422
- Functions: 111
- Analysis time: 174.5s

### Functions
- **activate** (src/extension.ts): Initializes all extension components using bootstrapper, registers commands, sets up file watcher, and configures event handlers
- **createCommandHandlers** (src/extension.ts): Creates command handler functions that have access to extension components
- **analyzeWorkspace** (src/extension.ts): Performs full workspace analysis with progress reporting, generates insights, updates diagnostics and tree view, runs comprehensive LLM analysis
- **analyzeCurrentFile** (src/extension.ts): Analyzes the currently active editor file and updates diagnostics for that file only
- **clearAllData** (src/extension.ts): Clears all cached data, analysis results, generated reports, and resets UI state
- **showSettings** (src/extension.ts): Opens the extension settings page in VS Code preferences
- **deactivate** (src/extension.ts): Cleanup function called when extension is deactivated, disposes file watcher
- **constructor** (src/ai/llmRateLimiter.ts): Initializes rate limiter with default rate limits for OpenAI (60/min) and Claude (50/min)
- **configure** (src/ai/llmRateLimiter.ts): Configure rate limits for a specific provider
- **canMakeRequest** (src/ai/llmRateLimiter.ts): Check if a request can be made for the given provider without exceeding rate limits
- **recordRequest** (src/ai/llmRateLimiter.ts): Record a request timestamp for the given provider
- **waitUntilAvailable** (src/ai/llmRateLimiter.ts): Wait until a request can be made if currently rate limited, returns immediately if no wait needed
- **getRequestCount** (src/ai/llmRateLimiter.ts): Get the number of requests made in the current time window
- **clearHistory** (src/ai/llmRateLimiter.ts): Clear request history for a specific provider or all providers (useful for testing/reset)
- **parseFileSummary** (src/ai/llmResponseParser.ts): Parses file summary from LLM response, attempting JSON parsing first then falling back to text extraction
- **parseModuleSummary** (src/ai/llmResponseParser.ts): Parses module summary from LLM response with JSON parsing fallback to text extraction
- **parseProductDocs** (src/ai/llmResponseParser.ts): Parses product documentation from LLM response, extracting overview, features, architecture, tech stack, API endpoints, data models, and user flows
- **parseProductLevelDoc** (src/ai/llmResponseParser.ts): Parses enhanced product level documentation including user perspectives (GUI, CLI, API, CI/CD) and workflow integration
- **parseArchitectureInsights** (src/ai/llmResponseParser.ts): Parses architecture insights from LLM response with multiple section name variations for robustness
- **extractSection** (src/ai/llmResponseParser.ts): Extracts a named section from text content using pattern matching
- **extractListSection** (src/ai/llmResponseParser.ts): Extracts a list/array from a named section in text content
- **executeWithRetry** (src/ai/llmRetryHandler.ts): Execute an async operation with retry logic using exponential backoff
- **isRetryableError** (src/ai/llmRetryHandler.ts): Check if an error matches retryable patterns (rate limits, network errors, 5xx status codes)
- **delay** (src/ai/llmRetryHandler.ts): Create a promise that resolves after specified milliseconds
- **executeWithRetryAndCount** (src/ai/llmRetryHandler.ts): Execute with retry and return both result and attempt count
- **isConfigured** (src/ai/providers/ILLMProvider.ts): Check if the provider is configured and ready to use
- **sendRequest** (src/ai/providers/ILLMProvider.ts): Send a request and get a text response from the LLM
- **sendStructuredRequest** (src/ai/providers/ILLMProvider.ts): Send a request with structured output (JSON) and get parsed JSON data
- **getName** (src/ai/providers/ILLMProvider.ts): Get the provider name
- **getLLMStats** (src/ai/providers/anthropicProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetLLMStats** (src/ai/providers/anthropicProvider.ts): Resets all LLM statistics counters to zero
- **constructor** (src/ai/providers/anthropicProvider.ts): Initializes the Anthropic provider by calling initialize
- **initialize** (src/ai/providers/anthropicProvider.ts): Sets up the Anthropic client with API key from configuration manager
- **isConfigured** (src/ai/providers/anthropicProvider.ts): Checks if the provider has a valid API client configured
- **getName** (src/ai/providers/anthropicProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/anthropicProvider.ts): Sends a message request to Claude API and returns the response with token tracking
- **sendStructuredRequest** (src/ai/providers/anthropicProvider.ts): Sends a structured output request to Claude's beta API with JSON schema validation
- **getOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Resets all LLM call statistics to zero
- **constructor** (src/ai/providers/openAIProvider.ts): Initializes the OpenAI provider by calling initialize method
- **initialize** (src/ai/providers/openAIProvider.ts): Sets up the OpenAI client with API key from configuration manager
- **isConfigured** (src/ai/providers/openAIProvider.ts): Checks if the OpenAI client is properly configured with an API key
- **getName** (src/ai/providers/openAIProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/openAIProvider.ts): Sends a chat completion request to OpenAI API with logging and token tracking
- **sendStructuredRequest** (src/ai/providers/openAIProvider.ts): Sends a request expecting JSON response and parses it into a typed object
- **sendRequestWithFallback** (src/ai/providers/openAIProvider.ts): Tries multiple OpenAI models in sequence until one succeeds
- **getProvider** (src/ai/providers/providerFactory.ts): Get the provider instance for the specified provider type with lazy initialization
- **getCurrentProvider** (src/ai/providers/providerFactory.ts): Get the current provider based on configuration settings
- **isProviderConfigured** (src/ai/providers/providerFactory.ts): Check if a specific provider is configured with valid credentials
- **getConfiguredProviders** (src/ai/providers/providerFactory.ts): Get a list of all providers that are currently configured
- **analyzeFileMetadata** (src/analysis/enhancedAnalyzer.ts): Analyze a single file and extract enhanced metadata for all functions
- **analyzeTypeScriptFunction** (src/analysis/enhancedAnalyzer.ts): Analyze TypeScript/JavaScript function using AST parsing
- **findFunctionNode** (src/analysis/enhancedAnalyzer.ts): Find function node in AST by name and line number
- **getFunctionName** (src/analysis/enhancedAnalyzer.ts): Get function name from AST node
- **extractMetadataFromAST** (src/analysis/enhancedAnalyzer.ts): Extract comprehensive metadata from AST node including parameters, return type, visibility, branches, dependencies
- **analyzeNode** (src/analysis/enhancedAnalyzer.ts): Recursively analyze AST node for branches, dependencies, and state mutations
- **extractFunctionContent** (src/analysis/enhancedAnalyzer.ts): Extract function content from source by line numbers
- **analyzeFunctionWithRegex** (src/analysis/enhancedAnalyzer.ts): Fallback regex-based analysis for non-TypeScript languages
- **extractDocstring** (src/analysis/enhancedAnalyzer.ts): Extract JSDoc comment from function node
- **calculateRiskLevel** (src/analysis/enhancedAnalyzer.ts): Determine risk level based on branches, dependencies, and mutations
- **analyzeFunctions** (src/analysis/functionAnalyzer.ts): Analyze all functions in large files and extract detailed information
- **analyzeFunction** (src/analysis/functionAnalyzer.ts): Analyze a single function in detail, routing to appropriate analyzer based on language
- **analyzeTypeScriptFunction** (src/analysis/functionAnalyzer.ts): Analyze TypeScript/JavaScript function using AST parsing
- **analyzeFunctionWithRegex** (src/analysis/functionAnalyzer.ts): Fallback regex-based analysis when AST parsing fails or for non-TS/JS languages
- **findFunctionNode** (src/analysis/functionAnalyzer.ts): Find function node in TypeScript AST by name and line number
- **extractSignature** (src/analysis/functionAnalyzer.ts): Extract function signature from AST node
- **extractParameters** (src/analysis/functionAnalyzer.ts): Extract parameter list from function node
- **extractReturnType** (src/analysis/functionAnalyzer.ts): Extract return type from function node
- **isPublic** (src/analysis/functionAnalyzer.ts): Check if function has public visibility
- **isAsync** (src/analysis/functionAnalyzer.ts): Check if function is async
- **extractDependencies** (src/analysis/functionAnalyzer.ts): Extract dependencies (what this function calls) from AST
- **extractDependents** (src/analysis/functionAnalyzer.ts): Extract dependents (what calls this function)
- **extractResponsibilities** (src/analysis/functionAnalyzer.ts): Extract responsibilities from function using AST analysis
- **extractDependenciesRegex** (src/analysis/functionAnalyzer.ts): Extract dependencies using simple regex-based approach
- **extractResponsibilitiesRegex** (src/analysis/functionAnalyzer.ts): Extract responsibilities using simple heuristics from function content
- **resolveFilePath** (src/analysis/functionAnalyzer.ts): Resolve file path to full path
- **setAnalysis** (src/analysisViewer.ts): Sets the code analysis data and triggers a refresh of the tree view
- **refresh** (src/analysisViewer.ts): Fires the tree data change event to refresh the view
- **getTreeItem** (src/analysisViewer.ts): Returns the tree item for display
- **getChildren** (src/analysisViewer.ts): Returns child items for a given tree element, handling different item types
- **getRootItems** (src/analysisViewer.ts): Builds the root-level tree items showing statistics, files, languages, functions, entry points, dependencies, and orphaned files
- **getStatisticsItems** (src/analysisViewer.ts): Returns statistics items showing file counts, lines, functions, large files, imported and orphaned file counts
- **getFilesItems** (src/analysisViewer.ts): Groups files by directory and returns directory items for the tree
- **getUniqueLanguages** (src/analysisViewer.ts): Extracts unique programming languages from analyzed files
- **getLanguagesItems** (src/analysisViewer.ts): Creates tree items for each unique language found
- **getLanguageFiles** (src/analysisViewer.ts): Returns file items filtered by a specific language
- **getDirectoryFiles** (src/analysisViewer.ts): Returns file items for a specific directory
- **getFileDetails** (src/analysisViewer.ts): Returns detail items for a file including line count, language, functions, and imports
- **getFileFunctions** (src/analysisViewer.ts): Returns function items for a specific file
- **getFileImports** (src/analysisViewer.ts): Returns import items for a specific file
- **getFunctionsItems** (src/analysisViewer.ts): Returns all functions grouped or listed from the analysis
- **getEntryPointsItems** (src/analysisViewer.ts): Returns entry point items from the analysis
- **getDependenciesItems** (src/analysisViewer.ts): Returns dependency/import relationship items
- **getOrphanedFilesItems** (src/analysisViewer.ts): Returns items for files that are not imported anywhere
- **constructor** (src/analyzer.ts): Initializes CodeAnalyzer with an analysis cache
- **analyzeWorkspace** (src/analyzer.ts): Recursively analyzes all code files in a workspace directory, extracting metrics, functions, imports, and detecting entry points
- **analyzeFile** (src/analyzer.ts): Analyzes a single file for code metrics, functions, and imports
- **findCodeFiles** (src/analyzer.ts): Recursively finds all code files with recognized extensions in a directory
- **findAllFiles** (src/analyzer.ts): Recursively finds all files in a directory for organization analysis
- **extractFunctions** (src/analyzer.ts): Extracts function definitions from source code based on language-specific patterns
- **extractImports** (src/analyzer.ts): Extracts import/require statements from source code based on language patterns
- **analyzeDependencies** (src/analyzer.ts): Analyzes import relationships to identify imported and orphaned files
- **detectEntryPoints** (src/analyzer.ts): Detects application entry points by checking for common patterns like main files, package.json, etc.
- **constructor** (src/cache.ts): Initializes the cache with a storage path and ensures cache directory exists
- **ensureCacheDir** (src/cache.ts): Creates the cache directory if it doesn't exist
- **getCacheKey** (src/cache.ts): Generates a safe base64-encoded filename from workspace path
- **get** (src/cache.ts): Retrieves cached analysis data if valid (not expired past 24 hours)
- **set** (src/cache.ts): Stores analysis data in cache with current timestamp
- **clear** (src/cache.ts): Removes all files from the cache directory
- **getCacheFile** (src/cache.ts): Constructs the full file path for a workspace's cache file
- **getStats** (src/cache.ts): Returns statistics about cached files count and total size

### Strengths
- Clean provider abstraction pattern allows easy addition of new LLM backends
- Robust error handling with dedicated retry handler and rate limiter
- Dual analysis strategy using AST parsing with regex fallback for broader compatibility
- Well-structured caching with automatic expiration prevents stale data
- Comprehensive function metadata extraction including branch analysis, dependencies, and risk assessment
- Clear separation between UI (TreeDataProvider), business logic (analyzers), and AI integration

### Issues
- Provider factory uses lazy initialization without clear lifecycle management - potential for stale configurations
- Rate limiter tracks per-provider but provider factory returns potentially new instances
- Response parser handles multiple formats suggesting inconsistent LLM outputs - fragile parsing
- Cache expiration is hardcoded (24 hours) rather than configurable
- Enhanced analyzer has large monolithic functions with deep AST traversal - hard to test
- No apparent validation of LLM responses against expected schemas before use
- Circular dependency risk between functionAnalyzer and codeAnalysis data structure

---

## Test Results
- Tests generated: 8
- Test file: /Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.ts
- **Passed: 0**
- **Failed: 0**

### Test Output
```
{"numFailedTestSuites":1,"numFailedTests":0,"numPassedTestSuites":0,"numPassedTests":0,"numPendingTestSuites":0,"numPendingTests":0,"numRuntimeErrorTestSuites":1,"numTodoTests":0,"numTotalTestSuites":1,"numTotalTests":0,"openHandles":[],"snapshot":{"added":0,"didUpdate":false,"failure":false,"filesAdded":0,"filesRemoved":0,"filesRemovedList":[],"filesUnmatched":0,"filesUpdated":0,"matched":0,"total":0,"unchecked":0,"uncheckedKeysByFile":[],"unmatched":0,"updated":0},"startTime":1764195582000,"success":false,"testResults":[{"assertionResults":[],"coverage":{},"endTime":1764195583362,"message":"  ● Test suite failed to run\n\n    TypeError: Cannot read properties of undefined (reading 'native')\n\n       5 | import * as fs from 'fs';\n       6 | import * as path from 'path';\n    >  7 | import * as ts from 'typescript';\n         | ^\n       8 | import {\n       9 |     CodeAnalysis,\n      10 |     FunctionMetadata,\n\n      at getNodeSystem (node_modules/typescript/lib/typescript.js:8281:43)\n      at node_modules/typescript/lib/typescript.js:8665:12\n      at node_modules/typescript/lib/typescript.js:8671:3\n      at Object.<anonymous> (node_modules/typescript/lib/typescript.js:200275:3)\n      at Object.<anonymous> (src/analysis/enhancedAnalyzer.ts:7:1)\n      at Object.<anonymous> (UnitTests/generated.test.ts:894:30)\n","name":"/Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.ts","startTime":1764195583362,"status":"failed","summary":""}],"wasInterrupted":false}

```
