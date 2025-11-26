# Analysis + Test Report
Generated: 2025-11-26T17:18:40.747Z

## Analysis Summary
Shadow Watch is a VS Code extension for comprehensive code analysis and documentation generation that uses LLM providers (OpenAI/Anthropic) to analyze workspaces, extract code structure, generate insights, and provide interactive visualization of code architecture through tree views.

### Stats
- Files: 73
- Lines: 55924
- Functions: 105
- Analysis time: 155.6s

### Functions
- **activate** (src/extension.ts): Initializes and activates the extension by bootstrapping components, registering commands, setting up file watchers, and handling configuration
- **createCommandHandlers** (src/extension.ts): Creates command handler functions with access to extension components for dependency injection
- **analyzeWorkspace** (src/extension.ts): Analyzes the entire workspace for architecture issues, generates insights, updates diagnostics and tree view, and runs comprehensive LLM analysis
- **analyzeCurrentFile** (src/extension.ts): Analyzes the currently active file for architecture issues and updates diagnostics for that specific file
- **clearAllData** (src/extension.ts): Clears all cached data, reports, and resets the extension state
- **showSettings** (src/extension.ts): Opens the extension settings page in VS Code
- **constructor** (src/ai/llmRateLimiter.ts): Initializes the rate limiter with default configurations for OpenAI (60 req/min) and Claude (50 req/min)
- **configure** (src/ai/llmRateLimiter.ts): Sets custom rate limit configuration for a specific provider
- **canMakeRequest** (src/ai/llmRateLimiter.ts): Checks if a request can be made without exceeding rate limits for the given provider
- **recordRequest** (src/ai/llmRateLimiter.ts): Records a request timestamp for the given provider in the request history
- **waitUntilAvailable** (src/ai/llmRateLimiter.ts): Asynchronously waits until a request can be made if rate limited, returns immediately otherwise
- **getRequestCount** (src/ai/llmRateLimiter.ts): Returns the number of requests made within the current time window for a provider
- **clearHistory** (src/ai/llmRateLimiter.ts): Clears request history for a specific provider or all providers if none specified
- **parseFileSummary** (src/ai/llmResponseParser.ts): Parses file summary from LLM response, attempting JSON parsing first then falling back to text extraction
- **parseModuleSummary** (src/ai/llmResponseParser.ts): Parses module summary from LLM response with JSON and text fallback
- **parseProductDocs** (src/ai/llmResponseParser.ts): Parses product documentation sections including overview, features, architecture, tech stack, endpoints, data models, and user flows
- **parseProductLevelDoc** (src/ai/llmResponseParser.ts): Parses comprehensive product level documentation including user perspectives, workflow integration, and problems solved
- **parseArchitectureInsights** (src/ai/llmResponseParser.ts): Parses architecture insights including assessment, strengths, issues, organization recommendations, and scaling considerations
- **extractSection** (src/ai/llmResponseParser.ts): Extracts a text section from content by header name
- **extractListSection** (src/ai/llmResponseParser.ts): Extracts a list of items from a section with bullet points or numbered lists
- **executeWithRetry** (src/ai/llmRetryHandler.ts): Execute an operation with retry logic using exponential backoff
- **isRetryableError** (src/ai/llmRetryHandler.ts): Check if an error is retryable based on error patterns, codes, and status codes
- **delay** (src/ai/llmRetryHandler.ts): Delay execution for specified milliseconds
- **executeWithRetryAndCount** (src/ai/llmRetryHandler.ts): Execute with retry logic and return result with attempt count
- **getLLMStats** (src/ai/providers/anthropicProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetLLMStats** (src/ai/providers/anthropicProvider.ts): Resets all LLM call statistics counters to zero
- **constructor** (src/ai/providers/anthropicProvider.ts): Initializes the AnthropicProvider instance
- **initialize** (src/ai/providers/anthropicProvider.ts): Sets up the Anthropic client with API key from configuration manager
- **isConfigured** (src/ai/providers/anthropicProvider.ts): Checks if the Claude API client is properly configured
- **getName** (src/ai/providers/anthropicProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/anthropicProvider.ts): Sends a standard request to Claude API and returns response with token tracking
- **sendStructuredRequest** (src/ai/providers/anthropicProvider.ts): Sends a request to Claude API with JSON schema validation for structured output
- **getOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Returns current statistics for OpenAI LLM calls including call count and token usage
- **resetOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Resets all OpenAI LLM call statistics to zero
- **constructor** (src/ai/providers/openAIProvider.ts): Initializes the OpenAI provider instance and sets up the client
- **initialize** (src/ai/providers/openAIProvider.ts): Configures the OpenAI client with API key from configuration manager
- **isConfigured** (src/ai/providers/openAIProvider.ts): Checks if the OpenAI client is properly configured with an API key
- **getName** (src/ai/providers/openAIProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/openAIProvider.ts): Sends a chat completion request to OpenAI API with token tracking and logging
- **sendStructuredRequest** (src/ai/providers/openAIProvider.ts): Sends a request to OpenAI and parses the response as structured JSON using schema
- **sendRequestWithFallback** (src/ai/providers/openAIProvider.ts): Attempts to send request using multiple OpenAI models in sequence until one succeeds
- **getProvider** (src/ai/providers/providerFactory.ts): Gets or creates a singleton provider instance for the specified provider type (openai or claude)
- **getCurrentProvider** (src/ai/providers/providerFactory.ts): Gets the current provider instance based on the configuration manager settings
- **isProviderConfigured** (src/ai/providers/providerFactory.ts): Checks if a specific provider has been properly configured with required credentials
- **getConfiguredProviders** (src/ai/providers/providerFactory.ts): Returns an array of all providers that are currently configured and available for use
- **analyzeFileMetadata** (src/analysis/enhancedAnalyzer.ts): Analyzes a single file and extracts enhanced metadata for all functions, routing to TypeScript AST analysis or regex-based fallback
- **analyzeTypeScriptFunction** (src/analysis/enhancedAnalyzer.ts): Analyzes TypeScript/JavaScript functions using AST parsing to extract detailed metadata
- **findFunctionNode** (src/analysis/enhancedAnalyzer.ts): Locates function node in AST by matching function name and starting line number
- **getFunctionName** (src/analysis/enhancedAnalyzer.ts): Extracts function name from various AST node types including declarations, expressions, and arrow functions
- **extractMetadataFromAST** (src/analysis/enhancedAnalyzer.ts): Extracts comprehensive metadata from AST node including parameters, return type, visibility, branches, dependencies, and state mutations
- **analyzeNode** (src/analysis/enhancedAnalyzer.ts): Recursively traverses AST nodes to detect branches, dependencies, and state mutations
- **extractFunctionContent** (src/analysis/enhancedAnalyzer.ts): Extracts function source code content between start and end lines
- **analyzeFunctionWithRegex** (src/analysis/enhancedAnalyzer.ts): Fallback regex-based analysis for non-TypeScript languages or when AST parsing fails
- **extractDocstring** (src/analysis/enhancedAnalyzer.ts): Extracts JSDoc documentation comments from AST node
- **calculateRiskLevel** (src/analysis/enhancedAnalyzer.ts): Determines risk level based on branch complexity, dependencies, and state mutations
- **analyzeFunctions** (src/analysis/functionAnalyzer.ts): Analyzes all functions in large files and extracts detailed information for refactoring analysis
- **analyzeFunction** (src/analysis/functionAnalyzer.ts): Analyzes a single function in detail, routing to TypeScript AST or regex-based analysis
- **analyzeTypeScriptFunction** (src/analysis/functionAnalyzer.ts): Analyzes TypeScript/JavaScript functions using AST to extract signatures, parameters, dependencies, and responsibilities
- **analyzeFunctionWithRegex** (src/analysis/functionAnalyzer.ts): Fallback regex-based analysis when AST parsing fails or for non-TypeScript languages
- **findFunctionNode** (src/analysis/functionAnalyzer.ts): Finds the function node in the TypeScript AST by name and line number
- **extractSignature** (src/analysis/functionAnalyzer.ts): Extracts the complete function signature from AST node
- **extractParameters** (src/analysis/functionAnalyzer.ts): Extracts parameter names and types from function node
- **extractReturnType** (src/analysis/functionAnalyzer.ts): Extracts the return type from function node
- **isPublic** (src/analysis/functionAnalyzer.ts): Determines if function has public visibility
- **isAsync** (src/analysis/functionAnalyzer.ts): Determines if function is async
- **extractDependencies** (src/analysis/functionAnalyzer.ts): Extracts function calls and dependencies from AST node
- **extractDependents** (src/analysis/functionAnalyzer.ts): Finds all functions that call this function
- **extractResponsibilities** (src/analysis/functionAnalyzer.ts): Extracts semantic responsibilities from function implementation
- **extractDependenciesRegex** (src/analysis/functionAnalyzer.ts): Regex-based extraction of function dependencies when AST unavailable
- **extractResponsibilitiesRegex** (src/analysis/functionAnalyzer.ts): Regex-based heuristic extraction of function responsibilities
- **resolveFilePath** (src/analysis/functionAnalyzer.ts): Resolves relative file path to absolute path
- **setAnalysis** (src/analysisViewer.ts): Updates the analysis data and refreshes the tree view
- **refresh** (src/analysisViewer.ts): Triggers a tree view refresh by firing the change event
- **getTreeItem** (src/analysisViewer.ts): Returns the tree item representation for a given element
- **getChildren** (src/analysisViewer.ts): Returns child items for a given tree element based on its type
- **getRootItems** (src/analysisViewer.ts): Creates the root-level tree items including statistics, files, languages, functions, entry points, dependencies, and orphaned files
- **getStatisticsItems** (src/analysisViewer.ts): Generates tree items displaying code analysis statistics
- **getFilesItems** (src/analysisViewer.ts): Groups and returns files organized by directory structure
- **getFileDetails** (src/analysisViewer.ts): Returns detailed information tree items for a specific file
- **getDirectoryFiles** (src/analysisViewer.ts): Returns files within a specific directory
- **getFunctionsItems** (src/analysisViewer.ts): Returns tree items for all functions in the codebase
- **getFileFunctions** (src/analysisViewer.ts): Returns functions defined in a specific file
- **getFileImports** (src/analysisViewer.ts): Returns import dependencies for a specific file
- **getEntryPointsItems** (src/analysisViewer.ts): Returns tree items for application entry points
- **getDependenciesItems** (src/analysisViewer.ts): Returns tree items showing file import relationships
- **getOrphanedFilesItems** (src/analysisViewer.ts): Returns tree items for files not imported anywhere
- **getLanguagesItems** (src/analysisViewer.ts): Returns tree items for programming languages found in codebase
- **getLanguageFiles** (src/analysisViewer.ts): Returns files for a specific programming language
- **getUniqueLanguages** (src/analysisViewer.ts): Extracts unique programming languages from analyzed files
- **analyzeWorkspace** (src/analyzer.ts): Recursively analyzes all files in a workspace to extract code metrics, functions, imports, dependencies, entry points, and organizational structure
- **analyzeFile** (src/analyzer.ts): Analyzes a single file to extract lines, functions, imports, and language information
- **findCodeFiles** (src/analyzer.ts): Recursively discovers all code files in a directory while skipping configured directories
- **findAllFiles** (src/analyzer.ts): Recursively discovers all files in a directory including non-code files for organization analysis
- **extractFunctions** (src/analyzer.ts): Parses file content to identify and extract function definitions with location and size information
- **extractImports** (src/analyzer.ts): Extracts import statements from file content and resolves them to actual file paths
- **analyzeDependencies** (src/analyzer.ts): Analyzes import relationships to identify imported files and orphaned files with no incoming references
- **detectEntryPoints** (src/analyzer.ts): Identifies potential entry points in the workspace like main files, package.json scripts, and configuration files
- **constructor** (src/cache.ts): Initializes cache with storage path and ensures cache directory exists
- **ensureCacheDir** (src/cache.ts): Creates cache directory if it doesn't exist
- **getCacheKey** (src/cache.ts): Generates a safe base64 filename from workspace path
- **get** (src/cache.ts): Retrieves cached analysis data if exists and not expired (24 hours)
- **set** (src/cache.ts): Stores code analysis data to cache file with timestamp
- **clear** (src/cache.ts): Deletes all cached files from cache directory
- **getCacheFile** (src/cache.ts): Constructs full cache file path for given workspace
- **getStats** (src/cache.ts): Calculates total number of cache files and their combined size

### Strengths
- Strong abstraction of LLM providers through factory pattern enabling easy addition of new AI services
- Comprehensive error handling with retry logic and exponential backoff for resilient API interactions
- Multi-format response parsing supporting various LLM output structures
- Layered analysis approach with basic regex fallback when AST parsing unavailable
- Caching strategy to optimize performance and reduce redundant API calls
- Clean separation between business logic and VS Code API integration

### Issues
- No evidence of input validation or sanitization before sending code to LLM APIs
- Missing authentication/authorization mechanisms for LLM API key management
- Cache expiration logic exists but no cache size limits could lead to unbounded disk usage
- Error classification in retry handler may not cover all edge cases for different provider failures
- No observable telemetry or logging strategy for production debugging
- Response parser uses string manipulation which is fragile for malformed LLM outputs
- Dependency resolution in functionAnalyzer uses file path resolution without validation of file existence

---

## Test Results
- Tests generated: 7
- Test file: /Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.ts
- **Passed: 0**
- **Failed: 0**

### Test Output
```
{"numFailedTestSuites":1,"numFailedTests":0,"numPassedTestSuites":0,"numPassedTests":0,"numPendingTestSuites":0,"numPendingTests":0,"numRuntimeErrorTestSuites":1,"numTodoTests":0,"numTotalTestSuites":1,"numTotalTests":0,"openHandles":[],"snapshot":{"added":0,"didUpdate":false,"failure":false,"filesAdded":0,"filesRemoved":0,"filesRemovedList":[],"filesUnmatched":0,"filesUpdated":0,"matched":0,"total":0,"unchecked":0,"uncheckedKeysByFile":[],"unmatched":0,"updated":0},"startTime":1764177519632,"success":false,"testResults":[{"assertionResults":[],"coverage":{},"endTime":1764177520726,"message":"  ● Test suite failed to run\n\n    \u001b[96mUnitTests/generated.test.ts\u001b[0m:\u001b[93m68\u001b[0m:\u001b[93m7\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS7034: \u001b[0mVariable 'mockDate' implicitly has type 'any' in some locations where its type cannot be determined.\n\n    \u001b[7m68\u001b[0m   let mockDate;\n    \u001b[7m  \u001b[0m \u001b[91m      ~~~~~~~~\u001b[0m\n    \u001b[96mUnitTests/generated.test.ts\u001b[0m:\u001b[93m77\u001b[0m:\u001b[93m5\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS7005: \u001b[0mVariable 'mockDate' implicitly has an 'any' type.\n\n    \u001b[7m77\u001b[0m     mockDate.mockRestore();\n    \u001b[7m  \u001b[0m \u001b[91m    ~~~~~~~~\u001b[0m\n    \u001b[96mUnitTests/generated.test.ts\u001b[0m:\u001b[93m81\u001b[0m:\u001b[93m5\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS7005: \u001b[0mVariable 'mockDate' implicitly has an 'any' type.\n\n    \u001b[7m81\u001b[0m     mockDate.mockReturnValue(1000000);\n    \u001b[7m  \u001b[0m \u001b[91m    ~~~~~~~~\u001b[0m\n    \u001b[96mUnitTests/generated.test.ts\u001b[0m:\u001b[93m87\u001b[0m:\u001b[93m5\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS7005: \u001b[0mVariable 'mockDate' implicitly has an 'any' type.\n\n    \u001b[7m87\u001b[0m     mockDate.mockReturnValue(1000000);\n    \u001b[7m  \u001b[0m \u001b[91m    ~~~~~~~~\u001b[0m\n    \u001b[96mUnitTests/generated.test.ts\u001b[0m:\u
```
