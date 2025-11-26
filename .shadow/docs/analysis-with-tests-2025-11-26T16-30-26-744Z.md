# Analysis + Test Report
Generated: 2025-11-26T16:30:26.744Z

## Analysis Summary
Shadow Watch is a VS Code extension that provides comprehensive code analysis and insights generation for TypeScript/JavaScript codebases using LLM integration. It analyzes workspace structure, functions, dependencies, and entry points while offering AI-powered documentation and architecture insights.

### Stats
- Files: 73
- Lines: 55829
- Functions: 105
- Analysis time: 160.5s

### Functions
- **activate** (src/extension.ts): Main extension activation function that bootstraps all components, registers commands, sets up file watchers, and initializes the UI
- **createCommandHandlers** (src/extension.ts): Factory function that creates command handler implementations with access to initialized components
- **analyzeWorkspace** (src/extension.ts): Performs comprehensive workspace analysis, generates insights, updates diagnostics and tree view, and triggers LLM-based comprehensive analysis workflow
- **analyzeCurrentFile** (src/extension.ts): Analyzes the currently active file in the editor, generates file-specific insights, and updates diagnostics
- **clearAllData** (src/extension.ts): Clears all cached analysis data, diagnostics, tree view content, and LLM-generated reports
- **showSettings** (src/extension.ts): Opens the extension settings UI in VS Code settings editor
- **deactivate** (src/extension.ts): Extension cleanup function called when the extension is deactivated
- **constructor** (src/ai/llmRateLimiter.ts): Initializes the rate limiter with default configurations for OpenAI and Claude providers
- **configure** (src/ai/llmRateLimiter.ts): Configure custom rate limits for a specific provider
- **canMakeRequest** (src/ai/llmRateLimiter.ts): Check if a request can be made for the given provider based on current rate limits
- **recordRequest** (src/ai/llmRateLimiter.ts): Record a request timestamp for the given provider
- **waitUntilAvailable** (src/ai/llmRateLimiter.ts): Wait until a request can be made if rate limited, returns immediately if no wait needed
- **getRequestCount** (src/ai/llmRateLimiter.ts): Get the number of requests made in the current window for a provider
- **clearHistory** (src/ai/llmRateLimiter.ts): Clear request history for a provider or all providers, useful for testing or reset
- **parseFileSummary** (src/ai/llmResponseParser.ts): Parse file summary from LLM response, attempting JSON parsing first then falling back to text extraction
- **parseModuleSummary** (src/ai/llmResponseParser.ts): Parse module summary from LLM response with JSON parsing and text fallback
- **parseProductDocs** (src/ai/llmResponseParser.ts): Parse product documentation from LLM response extracting overview, features, architecture, tech stack, API endpoints, data models, and user flows
- **parseProductLevelDoc** (src/ai/llmResponseParser.ts): Parse enhanced product level documentation including overview, user perspectives, workflow integration, and problems solved
- **parseArchitectureInsights** (src/ai/llmResponseParser.ts): Parse architecture insights from LLM response including assessment, strengths, issues, organization, and recommendations
- **extractSection** (src/ai/llmResponseParser.ts): Extract a specific section from text content using pattern matching
- **extractListSection** (src/ai/llmResponseParser.ts): Extract list items from a specific section in the content
- **executeWithRetry** (src/ai/llmRetryHandler.ts): Executes an operation with retry logic using exponential backoff
- **isRetryableError** (src/ai/llmRetryHandler.ts): Checks if an error is retryable based on error patterns, codes, and HTTP status codes
- **delay** (src/ai/llmRetryHandler.ts): Creates a promise that resolves after specified milliseconds
- **executeWithRetryAndCount** (src/ai/llmRetryHandler.ts): Executes an operation with retry logic and returns result with attempt count
- **getLLMStats** (src/ai/providers/anthropicProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetLLMStats** (src/ai/providers/anthropicProvider.ts): Resets all LLM call statistics counters to zero
- **constructor** (src/ai/providers/anthropicProvider.ts): Initializes the AnthropicProvider instance
- **initialize** (src/ai/providers/anthropicProvider.ts): Sets up the Anthropic client with API key from configuration
- **isConfigured** (src/ai/providers/anthropicProvider.ts): Checks if the provider is properly configured with an API key
- **getName** (src/ai/providers/anthropicProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/anthropicProvider.ts): Sends a standard request to Claude API and returns the text response
- **sendStructuredRequest** (src/ai/providers/anthropicProvider.ts): Sends a request to Claude API with JSON schema for structured output validation
- **getOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Resets all LLM call statistics counters to zero
- **initialize** (src/ai/providers/openAIProvider.ts): Initializes OpenAI client with API key from configuration manager
- **isConfigured** (src/ai/providers/openAIProvider.ts): Checks if OpenAI client is properly configured with API key
- **getName** (src/ai/providers/openAIProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/openAIProvider.ts): Sends a chat completion request to OpenAI with token tracking and logging
- **sendStructuredRequest** (src/ai/providers/openAIProvider.ts): Sends a request expecting JSON structured output, parses and validates the response
- **sendRequestWithFallback** (src/ai/providers/openAIProvider.ts): Attempts request with multiple OpenAI models in sequence until one succeeds
- **getProvider** (src/ai/providers/providerFactory.ts): Get the provider instance for the specified provider type, creating it if needed using singleton pattern
- **getCurrentProvider** (src/ai/providers/providerFactory.ts): Get the current provider instance based on configuration manager settings
- **isProviderConfigured** (src/ai/providers/providerFactory.ts): Check if a specific provider has valid configuration
- **getConfiguredProviders** (src/ai/providers/providerFactory.ts): Get array of all providers that are properly configured
- **analyzeFileMetadata** (src/analysis/enhancedAnalyzer.ts): Analyzes a single file and extracts enhanced metadata for all functions by delegating to TypeScript AST analysis or regex fallback based on language
- **analyzeTypeScriptFunction** (src/analysis/enhancedAnalyzer.ts): Analyzes TypeScript/JavaScript functions using AST parsing to extract detailed metadata, with fallback to regex analysis on failure
- **findFunctionNode** (src/analysis/enhancedAnalyzer.ts): Traverses the AST to locate a specific function node by name and starting line number
- **getFunctionName** (src/analysis/enhancedAnalyzer.ts): Extracts the function name from various AST node types including declarations, expressions, and arrow functions
- **extractMetadataFromAST** (src/analysis/enhancedAnalyzer.ts): Extracts comprehensive function metadata from AST node including parameters, return type, visibility, branches, dependencies, and state mutations
- **analyzeNode** (src/analysis/enhancedAnalyzer.ts): Recursively analyzes AST nodes to detect branches (if/switch statements), dependencies, and state mutations within function bodies
- **extractFunctionContent** (src/analysis/enhancedAnalyzer.ts): Extracts the content of a function from the full file content based on start and end line numbers
- **analyzeFunctionWithRegex** (src/analysis/enhancedAnalyzer.ts): Performs regex-based analysis as a fallback for languages without AST support or when AST parsing fails
- **extractDocstring** (src/analysis/enhancedAnalyzer.ts): Extracts JSDoc comments from AST nodes to provide function documentation
- **calculateRiskLevel** (src/analysis/enhancedAnalyzer.ts): Calculates the risk level of a function based on complexity factors like number of branches, dependencies, and state mutations
- **analyzeFunctions** (src/analysis/functionAnalyzer.ts): Analyzes all functions in large files and extracts detailed information for refactoring
- **analyzeFunction** (src/analysis/functionAnalyzer.ts): Analyzes a single function in detail by delegating to language-specific analyzers
- **analyzeTypeScriptFunction** (src/analysis/functionAnalyzer.ts): Analyzes TypeScript/JavaScript functions using AST parsing to extract detailed metadata
- **analyzeFunctionWithRegex** (src/analysis/functionAnalyzer.ts): Provides fallback regex-based analysis when AST parsing fails or for non-TypeScript languages
- **findFunctionNode** (src/analysis/functionAnalyzer.ts): Locates a specific function node in the TypeScript AST by name and line number
- **extractSignature** (src/analysis/functionAnalyzer.ts): Extracts the complete function signature from AST node
- **extractParameters** (src/analysis/functionAnalyzer.ts): Extracts function parameter names from AST node
- **extractReturnType** (src/analysis/functionAnalyzer.ts): Extracts the return type annotation from function AST node
- **isPublic** (src/analysis/functionAnalyzer.ts): Determines if function has public visibility
- **isAsync** (src/analysis/functionAnalyzer.ts): Determines if function is asynchronous
- **extractDependencies** (src/analysis/functionAnalyzer.ts): Extracts what other functions this function calls using AST analysis
- **extractDependents** (src/analysis/functionAnalyzer.ts): Extracts what other functions call this function
- **extractResponsibilities** (src/analysis/functionAnalyzer.ts): Extracts semantic responsibilities of the function from AST
- **extractDependenciesRegex** (src/analysis/functionAnalyzer.ts): Extracts function dependencies using regex pattern matching as fallback
- **extractResponsibilitiesRegex** (src/analysis/functionAnalyzer.ts): Extracts function responsibilities using regex heuristics as fallback
- **resolveFilePath** (src/analysis/functionAnalyzer.ts): Resolves relative file paths to absolute paths
- **setAnalysis** (src/analysisViewer.ts): Sets the code analysis data to display and triggers a refresh of the tree view
- **refresh** (src/analysisViewer.ts): Triggers a refresh event to update the tree view display
- **getTreeItem** (src/analysisViewer.ts): Returns the tree item representation for a given element
- **getChildren** (src/analysisViewer.ts): Returns child items for a given tree element, handling different item types like files, functions, statistics
- **getRootItems** (src/analysisViewer.ts): Generates the root level items of the tree view including statistics, files, languages, functions, entry points, dependencies, and orphaned files
- **getStatisticsItems** (src/analysisViewer.ts): Generates statistics items showing total files, lines, functions, large files, imported files, and orphaned files
- **getFilesItems** (src/analysisViewer.ts): Groups and returns files organized by directory structure
- **getFileDetails** (src/analysisViewer.ts): Returns detailed information about a specific file including functions and imports
- **getDirectoryFiles** (src/analysisViewer.ts): Returns files within a specific directory
- **getFunctionsItems** (src/analysisViewer.ts): Returns all functions from the analysis grouped and sortable
- **getFileFunctions** (src/analysisViewer.ts): Returns functions belonging to a specific file
- **getFileImports** (src/analysisViewer.ts): Returns import statements for a specific file
- **getEntryPointsItems** (src/analysisViewer.ts): Returns all entry points found in the codebase
- **getDependenciesItems** (src/analysisViewer.ts): Returns files that have dependencies/imports
- **getOrphanedFilesItems** (src/analysisViewer.ts): Returns files that are not imported anywhere in the codebase
- **getLanguagesItems** (src/analysisViewer.ts): Returns unique programming languages found in the analyzed files
- **getLanguageFiles** (src/analysisViewer.ts): Returns files filtered by a specific programming language
- **getUniqueLanguages** (src/analysisViewer.ts): Extracts unique language values from all analyzed files
- **analyzeWorkspace** (src/analyzer.ts): Recursively scans workspace to analyze all code files, extract functions, imports, dependencies and identify entry points
- **analyzeFile** (src/analyzer.ts): Analyzes a single file to extract its lines, functions, and imports
- **findCodeFiles** (src/analyzer.ts): Recursively finds all code files in workspace directory by scanning filesystem and filtering by extension
- **findAllFiles** (src/analyzer.ts): Recursively finds all files in workspace including non-code files for organization analysis
- **extractFunctions** (src/analyzer.ts): Parses file content to extract function definitions with location and size information
- **extractImports** (src/analyzer.ts): Parses file content to extract import statements and resolve local file dependencies
- **analyzeDependencies** (src/analyzer.ts): Analyzes import relationships to identify imported files and orphaned files without incoming references
- **detectEntryPoints** (src/analyzer.ts): Identifies potential application entry points by finding main files, servers, CLIs and package.json scripts
- **constructor** (src/cache.ts): Initializes the cache with a storage path and ensures cache directory exists
- **ensureCacheDir** (src/cache.ts): Creates the cache directory if it doesn't exist
- **getCacheKey** (src/cache.ts): Generates a safe base64-encoded filename from workspace path
- **get** (src/cache.ts): Retrieves cached analysis data for a workspace if valid (within 24 hours)
- **set** (src/cache.ts): Stores analysis data with timestamp in cache file
- **clear** (src/cache.ts): Deletes all cached files from the cache directory
- **getCacheFile** (src/cache.ts): Constructs the full file path for a workspace's cache file
- **getStats** (src/cache.ts): Returns statistics about cached files including count and total size

### Strengths
- Strong separation of concerns with dedicated modules for analysis, AI, and visualization
- Provider pattern enables easy addition of new LLM services
- AST-based analysis provides accurate function metadata
- Rate limiting and retry mechanisms ensure robust API handling
- File-based caching improves performance for repeated analysis
- Comprehensive function analysis including dependencies, risks, and responsibilities

### Issues
- No apparent error handling or logging abstraction across modules
- Cache expiration logic may not handle concurrent access safely
- Multiple analysis approaches (AST vs regex fallback) suggest complexity in handling edge cases
- LLM response parsing uses text extraction which is fragile compared to structured outputs
- No clear dependency injection pattern - tight coupling between extension and analysis components
- Missing telemetry or monitoring for LLM usage and performance tracking

---

## Test Results
- Tests generated: 6
- Test file: /Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.js
- **Passed: 0**
- **Failed: 0**

### Test Output
```
No tests found, exiting with code 1
Run with `--passWithNoTests` to exit with code 0
In /Users/leonardspeiser/Projects/shadow-plugin
  69 files checked.
  testMatch: **/__tests__/**/*.test.ts, **/?(*.)+(spec|test).ts - 0 matches
  testPathIgnorePatterns: /node_modules/ - 69 matches
  testRegex:  - 0 matches
Pattern: /Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.js - 0 matches

```
