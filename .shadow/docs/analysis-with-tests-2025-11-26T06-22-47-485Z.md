# Analysis + Test Report
Generated: 2025-11-26T06:22:47.485Z

## Analysis Summary
A VS Code extension called Shadow Watch that performs automated code analysis on workspaces, leveraging LLM providers (OpenAI, Anthropic) to generate insights about code structure, functions, dependencies, and architecture through AST parsing and AI-powered analysis

### Stats
- Files: 73
- Lines: 51537
- Functions: 114
- Analysis time: 159.9s

### Functions
- **activate** (src/extension.ts): Initializes the extension by bootstrapping all components, registering commands, setting up file watchers, and handling configuration changes
- **createCommandHandlers** (src/extension.ts): Creates and returns command handler functions that have access to initialized extension components
- **analyzeWorkspace** (src/extension.ts): Analyzes the entire workspace, generates insights, updates diagnostics and tree views, and triggers comprehensive analysis workflow
- **analyzeCurrentFile** (src/extension.ts): Analyzes the currently active file in the editor and updates insights and diagnostics
- **copyAllInsights** (src/extension.ts): Copies all generated insights to the clipboard in a formatted manner
- **copyFileInsights** (src/extension.ts): Copies insights for a specific file to the clipboard
- **copyInsight** (src/extension.ts): Copies a specific insight item to the clipboard
- **clearCache** (src/extension.ts): Clears the analysis cache and resets the extension state
- **clearAllData** (src/extension.ts): Clears all extension data including cache, reports, and product documentation
- **showSettings** (src/extension.ts): Opens the extension settings in VS Code
- **openLatestReport** (src/extension.ts): Opens the most recently generated analysis report
- **openLatestUnitTestReport** (src/extension.ts): Opens the most recently generated unit test report
- **switchProvider** (src/extension.ts): Switches between different LLM provider configurations
- **copyMenuStructure** (src/extension.ts): Copies the menu structure to the clipboard
- **showProviderStatus** (src/extension.ts): Displays the current LLM provider status and configuration
- **constructor** (src/ai/llmRateLimiter.ts): Initializes the rate limiter with default rate limits for OpenAI (60 req/min) and Claude (50 req/min)
- **configure** (src/ai/llmRateLimiter.ts): Configure rate limits for a specific provider
- **canMakeRequest** (src/ai/llmRateLimiter.ts): Check if a request can be made for the given provider without exceeding rate limits
- **recordRequest** (src/ai/llmRateLimiter.ts): Record a request timestamp for the given provider
- **waitUntilAvailable** (src/ai/llmRateLimiter.ts): Wait until a request can be made if rate limited, returns immediately if no wait is needed
- **getRequestCount** (src/ai/llmRateLimiter.ts): Get the number of requests made in the current time window for a provider
- **clearHistory** (src/ai/llmRateLimiter.ts): Clear request history for a specific provider or all providers (useful for testing or reset)
- **parseFileSummary** (src/ai/llmResponseParser.ts): Parses file summary from LLM response text, attempting JSON parsing first then falling back to text extraction
- **parseModuleSummary** (src/ai/llmResponseParser.ts): Parses module summary from LLM response into structured ModuleSummary object
- **parseProductDocs** (src/ai/llmResponseParser.ts): Parses product documentation from LLM response, extracting overview, features, architecture, tech stack, API endpoints, data models, and user flows
- **parseProductLevelDoc** (src/ai/llmResponseParser.ts): Parses comprehensive product level documentation including user perspectives, workflow integration, and problems solved
- **parseArchitectureInsights** (src/ai/llmResponseParser.ts): Parses architecture insights from LLM response including assessment, strengths, issues, organization, and recommendations
- **parseProductPurpose** (src/ai/llmResponseParser.ts): Parses product purpose analysis from LLM response
- **extractSection** (src/ai/llmResponseParser.ts): Extracts a named section from text content using various header patterns
- **extractListSection** (src/ai/llmResponseParser.ts): Extracts bullet point or numbered list items from a named section
- **executeWithRetry** (src/ai/llmRetryHandler.ts): Executes an operation with retry logic using exponential backoff for retryable errors
- **isRetryableError** (src/ai/llmRetryHandler.ts): Determines if an error should trigger a retry based on error patterns, codes, and HTTP status codes
- **delay** (src/ai/llmRetryHandler.ts): Creates a promise that resolves after a specified number of milliseconds
- **executeWithRetryAndCount** (src/ai/llmRetryHandler.ts): Executes an operation with retry logic and returns both the result and the number of attempts made
- **getLLMStats** (src/ai/providers/anthropicProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetLLMStats** (src/ai/providers/anthropicProvider.ts): Resets all LLM call statistics counters to zero
- **constructor** (src/ai/providers/anthropicProvider.ts): Initializes the AnthropicProvider instance and configures the client
- **initialize** (src/ai/providers/anthropicProvider.ts): Configures the Anthropic client with API key from configuration manager
- **isConfigured** (src/ai/providers/anthropicProvider.ts): Checks if the Anthropic client is properly configured with an API key
- **getName** (src/ai/providers/anthropicProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/anthropicProvider.ts): Sends an unstructured request to Claude API and returns the text response
- **sendStructuredRequest** (src/ai/providers/anthropicProvider.ts): Sends a request to Claude API with JSON schema for structured output validation
- **getOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Returns current statistics for OpenAI LLM calls including count and token usage
- **resetOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Resets all OpenAI LLM call statistics to zero
- **initialize** (src/ai/providers/openAIProvider.ts): Initializes OpenAI client with API key from configuration manager
- **isConfigured** (src/ai/providers/openAIProvider.ts): Checks if OpenAI client is properly configured with API key
- **getName** (src/ai/providers/openAIProvider.ts): Returns provider name identifier
- **sendRequest** (src/ai/providers/openAIProvider.ts): Sends chat completion request to OpenAI API with logging and token tracking
- **sendStructuredRequest** (src/ai/providers/openAIProvider.ts): Sends request expecting JSON response and parses into structured type
- **sendRequestWithFallback** (src/ai/providers/openAIProvider.ts): Attempts request with multiple models sequentially until success
- **getProvider** (src/ai/providers/providerFactory.ts): Gets or creates a provider instance for the specified provider type using lazy initialization
- **getCurrentProvider** (src/ai/providers/providerFactory.ts): Gets the current provider instance based on the configuration manager settings
- **isProviderConfigured** (src/ai/providers/providerFactory.ts): Checks if a specific provider has valid configuration settings
- **getConfiguredProviders** (src/ai/providers/providerFactory.ts): Returns an array of all providers that have valid configuration
- **analyzeFileMetadata** (src/analysis/enhancedAnalyzer.ts): Analyzes a single file and extracts enhanced metadata for all functions by delegating to AST or regex-based analysis
- **analyzeTypeScriptFunction** (src/analysis/enhancedAnalyzer.ts): Analyzes TypeScript/JavaScript functions using AST parsing with fallback to regex-based analysis on errors
- **findFunctionNode** (src/analysis/enhancedAnalyzer.ts): Finds function node in AST by matching function name and start line number
- **getFunctionName** (src/analysis/enhancedAnalyzer.ts): Extracts function name from various TypeScript node types including declarations, expressions, and arrow functions
- **extractMetadataFromAST** (src/analysis/enhancedAnalyzer.ts): Extracts comprehensive metadata from AST node including parameters, return type, visibility, branches, dependencies, and state mutations
- **analyzeNode** (src/analysis/enhancedAnalyzer.ts): Recursively analyzes AST nodes to detect branches (if/switch/loops), dependencies (function calls), and state mutations
- **extractFunctionContent** (src/analysis/enhancedAnalyzer.ts): Extracts function content from source code between start and end line numbers
- **analyzeFunctionWithRegex** (src/analysis/enhancedAnalyzer.ts): Fallback regex-based function analysis for non-TypeScript languages or when AST parsing fails
- **extractDocstring** (src/analysis/enhancedAnalyzer.ts): Extracts JSDoc comment documentation from function node
- **calculateRiskLevel** (src/analysis/enhancedAnalyzer.ts): Calculates risk level based on number of branches, dependencies, and state mutations
- **analyzeFunctions** (src/analysis/functionAnalyzer.ts): Analyzes all functions in large files (above threshold) and extracts detailed information including signatures, dependencies, and responsibilities
- **analyzeFunction** (src/analysis/functionAnalyzer.ts): Analyzes a single function in detail by determining the file type and routing to appropriate analysis method
- **analyzeTypeScriptFunction** (src/analysis/functionAnalyzer.ts): Analyzes TypeScript/JavaScript functions using AST parsing to extract signatures, parameters, return types, visibility, dependencies, dependents, and responsibilities
- **analyzeFunctionWithRegex** (src/analysis/functionAnalyzer.ts): Provides fallback regex-based analysis for functions when AST parsing is not available or fails
- **findFunctionNode** (src/analysis/functionAnalyzer.ts): Locates a specific function node in the TypeScript AST by name and start line number
- **extractSignature** (src/analysis/functionAnalyzer.ts): Extracts the complete function signature from a TypeScript AST node
- **extractParameters** (src/analysis/functionAnalyzer.ts): Extracts parameter information from a function node
- **extractReturnType** (src/analysis/functionAnalyzer.ts): Extracts the return type annotation from a function node
- **isPublic** (src/analysis/functionAnalyzer.ts): Determines if a function has public visibility
- **isAsync** (src/analysis/functionAnalyzer.ts): Determines if a function is asynchronous
- **extractDependencies** (src/analysis/functionAnalyzer.ts): Extracts what functions or methods this function calls internally
- **extractDependents** (src/analysis/functionAnalyzer.ts): Extracts what other functions call this function
- **extractResponsibilities** (src/analysis/functionAnalyzer.ts): Extracts the logical responsibilities of a function from its AST node
- **extractDependenciesRegex** (src/analysis/functionAnalyzer.ts): Extracts function dependencies using regex pattern matching as fallback
- **extractResponsibilitiesRegex** (src/analysis/functionAnalyzer.ts): Extracts function responsibilities using regex and heuristics as fallback
- **resolveFilePath** (src/analysis/functionAnalyzer.ts): Resolves the full file path for a given relative path
- **setAnalysis** (src/analysisViewer.ts): Updates the analysis data and refreshes the tree view
- **refresh** (src/analysisViewer.ts): Triggers a refresh of the tree view display
- **getTreeItem** (src/analysisViewer.ts): Returns the tree item representation for a given element
- **getChildren** (src/analysisViewer.ts): Returns child elements for a given tree item or root items if no element provided
- **getRootItems** (src/analysisViewer.ts): Creates root-level items showing statistics, files, languages, functions, entry points, dependencies, and orphaned files
- **getStatisticsItems** (src/analysisViewer.ts): Creates child items displaying detailed statistics like file count, lines, functions, and orphaned files
- **getFilesItems** (src/analysisViewer.ts): Groups files by directory and creates tree items for each directory with file counts
- **getFileDetails** (src/analysisViewer.ts): Returns detailed information items for a specific file including functions and imports
- **getDirectoryFiles** (src/analysisViewer.ts): Returns all files within a specific directory as tree items
- **getFunctionsItems** (src/analysisViewer.ts): Returns all functions in the codebase as tree items sorted by file
- **getFileFunctions** (src/analysisViewer.ts): Returns all functions for a specific file
- **getFileImports** (src/analysisViewer.ts): Returns all import statements for a specific file
- **getEntryPointsItems** (src/analysisViewer.ts): Returns all entry points as tree items grouped by type
- **getDependenciesItems** (src/analysisViewer.ts): Returns files that have imports as tree items
- **getOrphanedFilesItems** (src/analysisViewer.ts): Returns files that are not imported anywhere as tree items
- **getLanguagesItems** (src/analysisViewer.ts): Returns unique programming languages found in the codebase
- **getLanguageFiles** (src/analysisViewer.ts): Returns all files for a specific programming language
- **getUniqueLanguages** (src/analysisViewer.ts): Extracts unique programming languages from analyzed files
- **analyzeWorkspace** (src/analyzer.ts): Recursively analyzes all code files in a workspace to extract comprehensive metrics including files, functions, imports, dependencies, orphaned files, and entry points
- **analyzeFile** (src/analyzer.ts): Analyzes a single file to extract metrics including lines, functions, and imports
- **findCodeFiles** (src/analyzer.ts): Recursively finds all code files in a directory based on file extensions, skipping configured directories
- **findAllFiles** (src/analyzer.ts): Recursively finds all files in a directory including non-code files for organization analysis
- **extractFunctions** (src/analyzer.ts): Extracts function definitions from code content based on language-specific patterns
- **extractImports** (src/analyzer.ts): Extracts import statements from code content based on language-specific syntax
- **analyzeDependencies** (src/analyzer.ts): Analyzes file import relationships to identify imported files and orphaned files with no incoming references
- **detectEntryPoints** (src/analyzer.ts): Detects potential entry point files in the project such as main files, CLI scripts, and API endpoints
- **constructor** (src/cache.ts): Initializes the cache with a storage path and ensures cache directory exists
- **ensureCacheDir** (src/cache.ts): Creates the cache directory if it doesn't exist
- **getCacheKey** (src/cache.ts): Generates a safe base64-encoded filename from workspace path
- **get** (src/cache.ts): Retrieves cached analysis data for a workspace if valid (within 24 hours)
- **set** (src/cache.ts): Stores analysis data in cache with current timestamp
- **clear** (src/cache.ts): Removes all cached files from the cache directory
- **getCacheFile** (src/cache.ts): Returns the full path to the cache file for a given workspace
- **getStats** (src/cache.ts): Returns statistics about cache usage including file count and total size

### Strengths
- Clean abstraction of LLM providers enabling easy addition of new AI services
- Comprehensive rate limiting and retry logic for resilient API interactions
- Rich AST-based analysis extracting detailed function metadata beyond simple regex parsing
- Caching layer reduces redundant API calls and improves performance
- Clear separation of concerns between analysis, AI processing, and presentation
- Support for both structured and unstructured LLM outputs
- Hierarchical tree view provides intuitive navigation of analysis results

### Issues
- Cache invalidation strategy unclear - may serve stale results when code changes
- No apparent test files despite Jest configuration being present
- Error handling in analyzer.ts and functionAnalyzer.ts could propagate failures silently
- File path resolution in functionAnalyzer may fail with complex workspace structures
- No observable logging or telemetry infrastructure for debugging production issues
- Token budget management in LLM requests could exceed limits on large files
- Race conditions possible in concurrent file analysis without coordination
- AST parsing limited to TypeScript/JavaScript - other languages fall back to regex

---

## Test Results
- Tests generated: 1
- Test file: /Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.js
- **Passed: 1**
- **Failed: 0**

### Test Output
```
{"numFailedTestSuites":0,"numFailedTests":0,"numPassedTestSuites":1,"numPassedTests":1,"numPendingTestSuites":0,"numPendingTests":0,"numRuntimeErrorTestSuites":0,"numTodoTests":0,"numTotalTestSuites":1,"numTotalTests":1,"openHandles":[],"snapshot":{"added":0,"didUpdate":false,"failure":false,"filesAdded":0,"filesRemoved":0,"filesRemovedList":[],"filesUnmatched":0,"filesUpdated":0,"matched":0,"total":0,"unchecked":0,"uncheckedKeysByFile":[],"unmatched":0,"updated":0},"startTime":1764138167079,"success":true,"testResults":[{"assertionResults":[{"ancestorTitles":["Placeholder"],"duration":1,"failureDetails":[],"failureMessages":[],"fullName":"Placeholder should be replaced with real tests","invocations":1,"location":null,"numPassingAsserts":1,"retryReasons":[],"status":"passed","title":"should be replaced with real tests"}],"endTime":1764138167458,"message":"","name":"/Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.js","startTime":1764138167321,"status":"passed","summary":""}],"wasInterrupted":false}

```
