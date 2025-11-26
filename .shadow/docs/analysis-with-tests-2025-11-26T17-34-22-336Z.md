# Analysis + Test Report
Generated: 2025-11-26T17:34:22.336Z

## Analysis Summary
A VS Code extension that provides comprehensive code analysis and documentation generation capabilities using LLM (Large Language Model) providers. The extension analyzes workspace files to extract metadata, functions, dependencies, and generates structured documentation through AI-powered insights.

### Stats
- Files: 73
- Lines: 56017
- Functions: 106
- Analysis time: 155.4s

### Functions
- **activate** (src/extension.ts): Initializes the extension, bootstraps all components, registers commands, sets up file watcher, and handles configuration changes
- **createCommandHandlers** (src/extension.ts): Creates command handler functions with access to extension components
- **analyzeWorkspace** (src/extension.ts): Analyzes entire workspace for architecture issues, generates insights, updates diagnostics and tree view, then runs comprehensive analysis workflow
- **analyzeCurrentFile** (src/extension.ts): Analyzes the currently active file in the editor for architecture issues and updates diagnostics
- **formatForLLM** (src/extension.ts): Formats analyzed code into LLM-friendly representation and displays in webview panel
- **formatCurrentFileForLLM** (src/extension.ts): Formats the currently active file for LLM consumption and displays in webview panel
- **showSettings** (src/extension.ts): Opens VS Code settings UI filtered to Shadow Watch extension settings
- **clearAllData** (src/extension.ts): Clears analysis cache, diagnostics, and resets tree view to initial state
- **deactivate** (src/extension.ts): Cleans up extension resources when extension is deactivated
- **constructor** (src/ai/llmRateLimiter.ts): Initializes the rate limiter with default rate limits for OpenAI (60 req/min) and Claude (50 req/min)
- **configure** (src/ai/llmRateLimiter.ts): Configures custom rate limits for a specific provider
- **canMakeRequest** (src/ai/llmRateLimiter.ts): Checks if a request can be made for the given provider based on current rate limits
- **recordRequest** (src/ai/llmRateLimiter.ts): Records a request timestamp for the given provider to track usage
- **waitUntilAvailable** (src/ai/llmRateLimiter.ts): Asynchronously waits until a request can be made if rate limited, returns immediately if no wait needed
- **getRequestCount** (src/ai/llmRateLimiter.ts): Returns the number of requests made in the current time window for a provider
- **clearHistory** (src/ai/llmRateLimiter.ts): Clears request history for a specific provider or all providers if none specified
- **parseFileSummary** (src/ai/llmResponseParser.ts): Parses file summary from LLM response, attempting JSON parsing first then falling back to text extraction
- **parseModuleSummary** (src/ai/llmResponseParser.ts): Parses module summary from LLM response with JSON parsing fallback
- **parseProductDocs** (src/ai/llmResponseParser.ts): Extracts product documentation sections including overview, features, architecture, tech stack, API endpoints, data models, and user flows
- **parseProductLevelDoc** (src/ai/llmResponseParser.ts): Parses comprehensive product-level documentation including user perspectives, workflow integration, and problems solved
- **parseArchitectureInsights** (src/ai/llmResponseParser.ts): Extracts architecture insights including overall assessment, strengths, issues, and organization from LLM response
- **extractSection** (src/ai/llmResponseParser.ts): Helper method to extract a specific section from text content
- **extractListSection** (src/ai/llmResponseParser.ts): Helper method to extract list items from a specific section
- **executeWithRetry** (src/ai/llmRetryHandler.ts): Execute an operation with retry logic using exponential backoff
- **isRetryableError** (src/ai/llmRetryHandler.ts): Check if an error is retryable based on error patterns, codes, and HTTP status codes
- **delay** (src/ai/llmRetryHandler.ts): Delay execution for specified milliseconds
- **executeWithRetryAndCount** (src/ai/llmRetryHandler.ts): Execute operation with retry logic and return result with attempt count
- **getLLMStats** (src/ai/providers/anthropicProvider.ts): Returns statistics about LLM API calls including call count and token usage
- **resetLLMStats** (src/ai/providers/anthropicProvider.ts): Resets all LLM call tracking statistics to zero
- **initialize** (src/ai/providers/anthropicProvider.ts): Initializes Anthropic client with API key from configuration manager
- **isConfigured** (src/ai/providers/anthropicProvider.ts): Checks if the Anthropic client is properly configured with an API key
- **getName** (src/ai/providers/anthropicProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/anthropicProvider.ts): Sends a standard LLM request to Claude API with message conversion and token tracking
- **sendStructuredRequest** (src/ai/providers/anthropicProvider.ts): Sends a structured output request to Claude API using beta structured outputs feature with JSON schema validation
- **getOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Returns current LLM call statistics including call count and token usage
- **resetOpenAILLMStats** (src/ai/providers/openAIProvider.ts): Resets all LLM call statistics counters to zero
- **initialize** (src/ai/providers/openAIProvider.ts): Initializes OpenAI client with API key from configuration manager
- **isConfigured** (src/ai/providers/openAIProvider.ts): Checks if OpenAI client is properly configured with API key
- **getName** (src/ai/providers/openAIProvider.ts): Returns the provider name identifier
- **sendRequest** (src/ai/providers/openAIProvider.ts): Sends a chat completion request to OpenAI API with token tracking and logging
- **sendStructuredRequest** (src/ai/providers/openAIProvider.ts): Sends request expecting JSON response and parses it with robust JSON extraction
- **sendRequestWithFallback** (src/ai/providers/openAIProvider.ts): Attempts request with multiple OpenAI models in sequence until one succeeds
- **getProvider** (src/ai/providers/providerFactory.ts): Returns the provider instance for the specified provider type (openai or claude), creating it if it doesn't exist
- **getCurrentProvider** (src/ai/providers/providerFactory.ts): Gets the current provider instance based on configuration manager settings
- **isProviderConfigured** (src/ai/providers/providerFactory.ts): Checks if a specific provider is properly configured
- **getConfiguredProviders** (src/ai/providers/providerFactory.ts): Returns an array of all providers that are currently configured
- **analyzeFileMetadata** (src/analysis/enhancedAnalyzer.ts): Analyzes a single file and extracts enhanced metadata for all functions, routing to AST or regex-based analysis
- **analyzeTypeScriptFunction** (src/analysis/enhancedAnalyzer.ts): Analyzes TypeScript/JavaScript functions using AST parsing with fallback to regex
- **findFunctionNode** (src/analysis/enhancedAnalyzer.ts): Locates function node in AST by name and line number
- **getFunctionName** (src/analysis/enhancedAnalyzer.ts): Extracts function name from AST node
- **extractMetadataFromAST** (src/analysis/enhancedAnalyzer.ts): Extracts comprehensive metadata from AST node including parameters, return types, visibility, branches, and dependencies
- **analyzeNode** (src/analysis/enhancedAnalyzer.ts): Recursively analyzes AST nodes to detect branches, dependencies, and state mutations
- **extractFunctionContent** (src/analysis/enhancedAnalyzer.ts): Extracts function content from source code by line range
- **analyzeFunctionWithRegex** (src/analysis/enhancedAnalyzer.ts): Performs regex-based function analysis as fallback for non-TypeScript languages
- **extractDocstring** (src/analysis/enhancedAnalyzer.ts): Extracts JSDoc comment from AST node
- **calculateRiskLevel** (src/analysis/enhancedAnalyzer.ts): Calculates risk level based on branches, dependencies, and state mutations
- **analyzeFunctions** (src/analysis/functionAnalyzer.ts): Analyzes all functions in large files above a threshold and returns detailed function analysis data
- **analyzeFunction** (src/analysis/functionAnalyzer.ts): Performs detailed analysis of a single function including signature extraction and dependency mapping
- **analyzeTypeScriptFunction** (src/analysis/functionAnalyzer.ts): Analyzes TypeScript/JavaScript functions using AST parsing to extract metadata like signatures, parameters, return types, and dependencies
- **analyzeFunctionWithRegex** (src/analysis/functionAnalyzer.ts): Provides fallback regex-based function analysis when AST parsing fails or for non-TypeScript files
- **findFunctionNode** (src/analysis/functionAnalyzer.ts): Locates the AST node corresponding to a function by name and line number in the source file
- **extractSignature** (src/analysis/functionAnalyzer.ts): Extracts the function signature from an AST node
- **extractParameters** (src/analysis/functionAnalyzer.ts): Extracts parameter names from a function AST node
- **extractReturnType** (src/analysis/functionAnalyzer.ts): Extracts the return type annotation from a function AST node
- **isPublic** (src/analysis/functionAnalyzer.ts): Determines if a function has public visibility
- **isAsync** (src/analysis/functionAnalyzer.ts): Determines if a function is async
- **extractDependencies** (src/analysis/functionAnalyzer.ts): Extracts function calls and dependencies from the function body using AST
- **extractDependents** (src/analysis/functionAnalyzer.ts): Finds all functions that call the given function
- **extractResponsibilities** (src/analysis/functionAnalyzer.ts): Analyzes function body to determine its responsibilities
- **extractDependenciesRegex** (src/analysis/functionAnalyzer.ts): Fallback regex-based extraction of function dependencies when AST parsing is unavailable
- **extractResponsibilitiesRegex** (src/analysis/functionAnalyzer.ts): Uses regex patterns to identify function responsibilities as a fallback to AST analysis
- **resolveFilePath** (src/analysis/functionAnalyzer.ts): Resolves relative file paths to absolute paths
- **setAnalysis** (src/analysisViewer.ts): Updates the analysis data and refreshes the tree view
- **refresh** (src/analysisViewer.ts): Triggers a refresh of the tree view display
- **getTreeItem** (src/analysisViewer.ts): Returns the VS Code tree item representation of an analysis item
- **getChildren** (src/analysisViewer.ts): Returns child items for a given tree node or root items if no element provided
- **getRootItems** (src/analysisViewer.ts): Generates root level tree items showing statistics, files, languages, functions, entry points, dependencies and orphaned files
- **getStatisticsItems** (src/analysisViewer.ts): Creates tree items displaying analysis statistics like file count, lines, functions
- **getFilesItems** (src/analysisViewer.ts): Organizes and returns files grouped by directory as tree items
- **getFileDetails** (src/analysisViewer.ts): Returns detailed information about a specific file including functions and imports
- **getDirectoryFiles** (src/analysisViewer.ts): Returns all files within a specific directory
- **getFunctionsItems** (src/analysisViewer.ts): Returns all functions from the analysis as tree items
- **getFileFunctions** (src/analysisViewer.ts): Returns functions for a specific file
- **getFileImports** (src/analysisViewer.ts): Returns import dependencies for a specific file
- **getEntryPointsItems** (src/analysisViewer.ts): Returns application entry points as tree items
- **getDependenciesItems** (src/analysisViewer.ts): Returns files with their import dependencies organized as tree items
- **getOrphanedFilesItems** (src/analysisViewer.ts): Returns files that are not imported anywhere as tree items
- **getLanguagesItems** (src/analysisViewer.ts): Returns programming languages found in the analysis
- **getLanguageFiles** (src/analysisViewer.ts): Returns all files for a specific programming language
- **getUniqueLanguages** (src/analysisViewer.ts): Extracts unique programming languages from analyzed files
- **analyzeWorkspace** (src/analyzer.ts): Recursively analyzes all code files in a workspace, extracting metrics, functions, imports, dependencies, and entry points
- **analyzeFile** (src/analyzer.ts): Analyzes a single file to extract lines, functions, imports and basic metrics
- **findCodeFiles** (src/analyzer.ts): Recursively finds all code files in a directory based on file extensions, skipping excluded directories
- **findAllFiles** (src/analyzer.ts): Recursively finds all files including non-code files for organization analysis
- **extractFunctions** (src/analyzer.ts): Extracts function definitions from source code based on language-specific patterns
- **extractImports** (src/analyzer.ts): Extracts import statements from source code to analyze file dependencies
- **analyzeDependencies** (src/analyzer.ts): Analyzes import relationships to identify imported and orphaned files
- **detectEntryPoints** (src/analyzer.ts): Identifies potential application entry points like main files, package.json scripts, and framework files
- **constructor** (src/cache.ts): Initializes cache directory in specified storage path
- **ensureCacheDir** (src/cache.ts): Creates cache directory if it doesn't exist
- **getCacheKey** (src/cache.ts): Generates safe base64 filename from workspace path
- **get** (src/cache.ts): Retrieves cached analysis data if exists and not expired (24 hours)
- **set** (src/cache.ts): Stores code analysis data with timestamp to cache file
- **clear** (src/cache.ts): Deletes all cached files from cache directory
- **getCacheFile** (src/cache.ts): Constructs full cache file path from workspace root
- **getStats** (src/cache.ts): Calculates total number and size of cached files

### Strengths
- Strong separation of concerns with modular architecture
- Provider abstraction allows easy integration of multiple LLM services
- Comprehensive error handling with retry logic and rate limiting
- AST-based analysis provides accurate code metadata extraction
- File-based caching improves performance for repeated analyses
- Structured output parsing ensures consistent LLM responses
- Clear TypeScript interfaces define contracts between modules

### Issues
- Cache expiration strategy not evident from cache.ts summary
- No apparent error telemetry or logging infrastructure mentioned
- Potential for race conditions in concurrent file analysis workflows
- LLM response parsing appears fragile with text extraction methods
- Missing validation for LLM provider configuration before usage
- No clear dependency injection pattern for testability
- File watching implementation details not visible in summaries

---

## Test Results
- Tests generated: 5
- Test file: /Users/leonardspeiser/Projects/shadow-plugin/UnitTests/generated.test.ts
- **Passed: 0**
- **Failed: 0**

### Test Output
```
{"numFailedTestSuites":1,"numFailedTests":0,"numPassedTestSuites":0,"numPassedTests":0,"numPendingTestSuites":0,"numPendingTests":0,"numRuntimeErrorTestSuites":1,"numTodoTests":0,"numTotalTestSuites":1,"numTotalTests":0,"openHandles":[],"snapshot":{"added":0,"didUpdate":false,"failure":false,"filesAdded":0,"filesRemoved":0,"filesRemovedList":[],"filesUnmatched":0,"filesUpdated":0,"matched":0,"total":0,"unchecked":0,"uncheckedKeysByFile":[],"unmatched":0,"updated":0},"startTime":1764178461229,"success":false,"testResults":[{"assertionResults":[],"coverage":{},"endTime":1764178462315,"message":"  ● Test suite failed to run\n\n    \u001b[96mUnitTests/generated.test.ts\u001b[0m:\u001b[93m73\u001b[0m:\u001b[93m9\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS2451: \u001b[0mCannot redeclare block-scoped variable 'sendRequest'.\n\n    \u001b[7m73\u001b[0m const { sendRequest } = require('../src/ai/providers/anthropicProvider');\n    \u001b[7m  \u001b[0m \u001b[91m        ~~~~~~~~~~~\u001b[0m\n    \u001b[96mUnitTests/generated.test.ts\u001b[0m:\u001b[93m165\u001b[0m:\u001b[93m9\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS2451: \u001b[0mCannot redeclare block-scoped variable 'sendRequest'.\n\n    \u001b[7m165\u001b[0m const { sendRequest } = require('../src/ai/providers/openAIProvider');\n    \u001b[7m   \u001b[0m \u001b[91m        ~~~~~~~~~~~\u001b[0m\n    \u001b[96mUnitTests/generated.test.ts\u001b[0m:\u001b[93m258\u001b[0m:\u001b[93m215\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS2503: \u001b[0mCannot find namespace 'fs'.\n\n    \u001b[7m258\u001b[0m const { analyzeFileMetadata } = require('../src/analysis/enhancedAnalyzer'); const fs = require('fs'); const path = require('path'); describe('analyzeFileMetadata', () => { let mockReadFileSync: jest.Mock<string, [fs.PathOrFileDescriptor, BufferEncoding]>; let originalReadFileSync: typeof fs.readFileSync; beforeEach(() => { originalReadFileSync = fs.readFileSync; mockReadFileSync = jest.fn<string, [fs.PathOrFileDescr
```
