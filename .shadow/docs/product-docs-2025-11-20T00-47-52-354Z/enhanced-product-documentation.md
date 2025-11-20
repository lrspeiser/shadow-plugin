# Product Documentation

*Generated: 11/19/2025, 5:04:05 PM (2025-11-20 01:04:05 UTC)*

---

## Product Overview

Shadow Watch is a VS Code extension that provides AI-powered code intelligence and automated testing capabilities for software development teams. The extension analyzes your codebase to generate comprehensive documentation, identify code quality issues, and create unit tests automatically. Users interact with the extension through multiple sidebar panels, command palette actions, and inline diagnostics that appear directly in the editor as you work.

The extension connects to AI language models (OpenAI GPT-4 or Anthropic Claude) to understand your code at multiple levels - from individual functions to entire product architecture. It automatically generates documentation describing what your application does, how components relate to each other, and what problems your code solves. The extension watches your files for changes and can automatically re-analyze your code as you save, keeping documentation and insights up to date.

Shadow Watch transforms time-consuming manual tasks into automated workflows. Instead of manually writing documentation, reviewing code for quality issues, or creating unit tests from scratch, users can generate these artifacts with a few clicks. The extension presents all analysis results in organized tree views, exports documentation in multiple formats optimized for different AI assistants, and provides detailed reports that help teams understand and improve their codebase.

## What It Does

- Generates comprehensive product documentation automatically by analyzing your entire codebase
- Creates detailed architecture insights describing system components and their relationships
- Identifies code quality issues like large files, orphaned code, circular dependencies, and complexity problems
- Generates unit tests automatically for your functions with AI-powered test planning
- Executes test suites and automatically fixes failing tests using AI assistance
- Provides interactive tree views for navigating code structure, dependencies, and entry points
- Displays inline diagnostics showing code issues directly in the editor with squiggly underlines
- Exports analysis results in multiple formats (Markdown, JSON) optimized for Cursor, ChatGPT, and other AI tools
- Watches files for changes and automatically re-analyzes code when you save
- Searches codebases using grep patterns to find specific code elements
- Caches analysis results for 24 hours to provide instant access across sessions
- Detects test framework configuration and generates setup instructions if needed
- Creates prioritized test plans based on function complexity, dependencies, and risk
- Generates tests in small batches with real-time progress tracking
- Validates generated tests by running them and captures detailed results

## User Perspective

### GUI

- Browse code structure through interactive tree views showing products, analyses, insights, and test results
- View AI-generated architecture insights in a dedicated sidebar panel
- Navigate from high-level components down to specific functions with single clicks
- See code quality issues highlighted with inline squiggly underlines in the editor
- Monitor analysis progress through status bar indicators showing current operations
- View comprehensive reports in webview panels displaying formatted documentation
- Access detailed information about functions, API endpoints, and dependencies in popup panels
- Track test generation progress with real-time updates showing completed and failed tests
- Review test execution results with pass/fail counts and error details
- Copy analysis results, insights, and documentation to clipboard for sharing

### CLI

- Execute workspace analysis through VS Code command palette
- Trigger file-specific analysis for currently open files
- Generate product documentation on demand
- Clear cached analysis data to force fresh analysis
- Switch between OpenAI and Claude AI providers
- Configure extension settings through VS Code preferences
- Export analysis results in different formats
- Access test generation and validation workflows

### API

- Integrates with OpenAI GPT-4 API for AI-powered code analysis
- Connects to Anthropic Claude API as alternative AI provider
- Handles API rate limiting automatically to prevent quota violations
- Retries failed API requests with intelligent backoff strategies
- Supports streaming responses for real-time AI text generation
- Validates API credentials and provider availability before use

### CI/CD

- Generates test suites that integrate with existing test frameworks (Jest, Mocha, Vitest, Pytest, JUnit, Google Test)
- Detects test environment configuration automatically
- Creates setup instructions for missing test dependencies
- Executes tests and captures results for CI/CD pipeline integration
- Exports analysis results in standardized formats for automated workflows
- Validates generated tests to ensure they run successfully

## Workflow Integration

- Code review workflow: Analyze files to identify quality issues before committing changes
- Documentation workflow: Generate comprehensive product and architecture documentation automatically
- Testing workflow: Create test plans, generate unit tests, execute tests, and fix failures in one automated flow
- Refactoring workflow: Analyze function dependencies and complexity to plan safe code reorganization
- Onboarding workflow: Generate architecture insights and documentation to help new team members understand the codebase
- AI-assisted development: Export analysis results in formats optimized for Cursor, ChatGPT, and other AI coding assistants
- Quality monitoring: Continuously track code quality through automatic re-analysis on file save
- Test coverage workflow: Identify untested functions and generate tests to improve coverage
- Cross-language testing: Support multiple programming languages and testing frameworks in polyglot projects

## Problems Solved

- Eliminates manual documentation writing by automatically generating comprehensive product and architecture documentation
- Reduces time spent understanding unfamiliar codebases through AI-generated insights and navigation tools
- Catches code quality issues early by identifying large files, orphaned code, and circular dependencies automatically
- Accelerates test creation by generating unit tests with AI assistance instead of writing them manually
- Reduces debugging time by automatically fixing failing tests through AI-powered retry attempts
- Prevents API quota violations through automatic rate limiting when calling AI services
- Maintains up-to-date documentation through automatic re-analysis when code changes
- Streamlines code reviews by highlighting quality issues with inline diagnostics
- Simplifies test environment setup by detecting configuration and generating setup instructions
- Improves test coverage by prioritizing which functions need tests based on complexity and risk
- Enables efficient code navigation through interactive tree views showing dependencies and relationships
- Reduces context switching by keeping analysis results accessible for 24 hours across sessions
- Supports diverse workflows by exporting results in multiple formats for different tools
- Handles temporary API failures gracefully through intelligent retry logic
- Provides consistent AI interactions across multiple providers (OpenAI, Claude) through unified interface

## Architecture Summary

Shadow Watch follows a layered architecture with distinct separation between user interface, domain logic, infrastructure services, and AI integration. The user interface layer consists of multiple VS Code tree view providers and webview panels that present analysis results, insights, and reports. These views receive data from the domain layer and respond to user commands through registered command handlers. The extension bootstrapper initializes all components during activation and establishes the communication pathways between layers.

The domain layer contains the core business logic organized into specialized services. The analysis services parse code files to extract structure, dependencies, and function information. The testing services orchestrate the complete test generation workflow from planning through execution and validation. The prompt builders construct structured instructions for AI models based on analysis requirements. The formatting services transform raw analysis data into human-readable documentation. All domain services coordinate with each other through well-defined interfaces and data structures.

The infrastructure layer provides foundational capabilities that support the domain logic. The file system services handle efficient file reading, caching, and watching operations. The persistence layer manages storage and retrieval of analysis results in a timestamped directory structure. The AI provider layer abstracts interactions with different language models (OpenAI, Claude) behind a common interface. Rate limiting, retry logic, and response parsing ensure reliable AI interactions. The configuration manager centralizes all user preferences and broadcasts changes to interested components. This layered design enables each component to focus on its specific responsibility while maintaining clean boundaries and testability.

## Module Documentation

### . (other)

This module configures the testing infrastructure for the VSCode extension, enabling developers to write and execute automated tests. It establishes the testing environment with TypeScript support, ensuring that the extension's functionality can be validated through comprehensive test suites.

The configuration supports the development workflow by providing a standardized testing framework that integrates seamlessly with the extension's build process. This ensures code quality and helps catch regressions early in the development cycle, ultimately delivering a more reliable extension to end users.

While users don't directly interact with this testing configuration, it underpins the quality and reliability of the extension features they use daily. The testing infrastructure validates that extension commands, UI interactions, and core functionality work as expected across different scenarios and edge cases.

**Capabilities:**
- Provides automated testing infrastructure for the VSCode extension
- Enables TypeScript-based test execution with proper module resolution
- Supports test coverage reporting and analysis
- Facilitates continuous integration and quality assurance workflows

### src/ai (other)

This module provides robust AI request management infrastructure that ensures reliable and compliant interactions with LLM providers. It handles the complete lifecycle of AI requests from rate limiting to response processing, protecting users from API quota violations while maintaining a smooth experience.

The module automatically throttles outgoing requests to stay within provider rate limits, preventing errors before they occur. When temporary failures do happen (network issues, rate limits, transient errors), the retry handler automatically recovers with intelligent backoff strategies. Once responses arrive, the parser extracts and structures the AI-generated content into standardized documentation formats including file summaries, module descriptions, and product-level documentation.

Users experience seamless AI-powered documentation generation without needing to understand or manage API limitations, retry logic, or response formatting. The module handles all complexity behind the scenes, ensuring requests succeed when possible and fail gracefully when necessary, while always delivering structured, usable documentation output.

**Capabilities:**
- Automatically manages AI API request rates to prevent exceeding provider limits
- Intelligently retries failed AI requests with exponential backoff
- Parses and structures AI-generated documentation into standardized formats
- Converts natural language AI responses into organized documentation components
- Provides seamless error handling and recovery for temporary API failures
- Ensures reliable AI interactions even under rate limiting or network issues

### src/ai/providers (other)

This module provides a unified abstraction layer for integrating multiple AI language model providers into the application. Users can interact with different AI services (OpenAI's GPT models and Anthropic's Claude models) through a consistent interface without needing to understand provider-specific implementations. The module handles provider selection, credential validation, and instance management automatically based on user configuration.

Users can generate both free-form text responses and structured JSON outputs from AI models, enabling both conversational AI features and automated data processing workflows. The factory pattern ensures efficient resource usage by maintaining single instances of each provider, while the common interface allows seamless switching between providers. The module supports advanced features like streaming responses for real-time interaction and system prompts for guiding AI behavior, making it suitable for a wide range of AI-powered features within the extension.

**Capabilities:**
- Connect to multiple AI language model providers (OpenAI GPT-4, Anthropic Claude) through a unified interface
- Generate text responses from AI models based on user prompts and system instructions
- Request structured JSON outputs from AI providers following specific schemas for automated data processing
- Automatically manage AI provider instances ensuring single instance per provider type
- Validate AI provider availability and credential configuration before use
- Support streaming responses for real-time AI text generation
- Configure and switch between different AI providers based on user preferences
- Handle provider-specific token limits and model configurations (Claude: 8192 tokens output, GPT-4 models)

### src/analysis (other)

The analysis module provides comprehensive code intelligence capabilities that help developers understand, refactor, and improve their codebase. It performs deep static analysis on source code files by parsing their Abstract Syntax Trees to extract detailed information about functions, their behaviors, complexities, and relationships.

Users can analyze individual functions or entire large files to receive insights about code structure, control flow branches, dependencies, and behavioral patterns. The module identifies what functions do (such as validation, transformation, or API interactions), how they modify application state, and which external dependencies they rely on. This information is particularly valuable for automated refactoring workflows, where understanding function responsibilities and their dependency chains is critical.

The module supports refactoring decisions by highlighting which functions in large files need attention, showing their signatures, listing their dependencies (both incoming and outgoing), and providing behavioral hints. This enables developers to make informed decisions about code splitting, function extraction, and architectural improvements while understanding the full impact of potential changes.

**Capabilities:**
- Deep code analysis through Abstract Syntax Tree (AST) parsing to extract comprehensive function metadata
- Function signature and dependency extraction for refactoring analysis
- Control flow and execution path analysis to identify code complexity
- Behavioral pattern recognition to classify function purposes (validation, transformation, API calls, etc.)
- State mutation and side effect detection across functions
- Large file analysis to identify refactoring candidates and their relationships
- Dependency graph generation showing function interdependencies

### src (other)

The src module provides a comprehensive VS Code extension for intelligent code analysis and documentation. It combines static code analysis with AI-powered insights to help developers understand, navigate, and improve their codebase. The extension analyzes code structure, extracts dependencies, identifies entry points, and detects quality issues like complexity, orphaned files, and circular dependencies.

Users interact with the analysis through multiple integrated views: a tree-based code structure browser, an insights panel showing categorized issues with severity levels, and inline diagnostics that appear as squiggly underlines in the editor. The extension supports both manual and automatic analysis workflows, with file watching capabilities that trigger re-analysis on save. Analysis results are cached for 24 hours to provide instant access when reopening workspaces.

The module leverages LLM services (OpenAI/Claude) to generate intelligent documentation at file, module, and product levels. It formats analysis results in multiple ways optimized for different AI assistants, provides structured schemas for consistent LLM responses, and offers grep-based search capabilities for iterative code exploration. All user actions—from viewing insights to generating documentation—are logged with timestamps for debugging and audit purposes.

**Capabilities:**
- Automated code analysis and structure extraction from entire codebase or individual files
- Interactive tree view navigation of code architecture, dependencies, and entry points
- AI-powered code insights generation with severity-based categorization and recommendations
- Real-time diagnostics display showing code quality issues as inline squiggles and problem panel entries
- LLM-assisted documentation generation for files, modules, and product-level architecture
- Code quality monitoring with detection of large files, orphaned code, circular dependencies, and complexity issues
- Persistent caching of analysis results with automatic 24-hour expiration
- File watching with automatic re-analysis on save
- Multiple export formats (Markdown, JSON) optimized for different LLM tools (Cursor, ChatGPT)
- Test coverage mapping and unit test navigation
- Grep-based code search for pattern discovery
- Structured documentation hierarchy from file-level to product-level

**Commands:**
- `shadow-watch.analyzeWorkspace`: Trigger full codebase analysis to extract structure, dependencies, functions, and generate insights
- `shadow-watch.analyzeCurrentFile`: Analyze only the currently open file for structure and quality issues
- `shadow-watch.formatForLLM`: Export analysis results in LLM-optimized format (Cursor, ChatGPT, or generic)
- `shadow-watch.exportToMarkdown`: Export analysis results as a Markdown file
- `shadow-watch.exportToJSON`: Export analysis results as a structured JSON file
- `shadow-watch.clearCache`: Clear cached analysis data to force fresh analysis
- `shadow-watch.generateProductDocumentation`: Generate AI-powered product-level documentation including architecture and purpose
- `shadow-watch.generateArchitectureDocumentation`: Generate AI-powered architecture documentation with diagrams and relationships
- `shadow-watch.generateUnitTests`: Generate AI-powered unit test plans for functions
- `shadow-watch.refreshInsights`: Refresh the insights tree view to update displayed analysis results

### src/config (other)

The config module serves as the central configuration hub for the Shadow Watch extension, managing all user preferences and settings. It provides a type-safe interface for accessing configuration values such as LLM provider selection, API credentials, analysis triggers, and display preferences. The module ensures that any component in the extension can reliably read current settings and respond to changes in real-time.

Users interact with this module through VS Code's settings interface to control core behaviors like enabling/disabling the extension, automatic analysis on file save, and inline hint visibility. They can configure which AI service to use (OpenAI or Claude) along with corresponding API keys and custom endpoints. The module also manages output formatting options (Cursor, ChatGPT, Generic, or Compact) to match different workflow preferences.

Additional configuration options allow users to fine-tune the extension's behavior by setting minimum severity levels for problem display (Error, Warning, or Info), adjusting HTTP timeouts for AI requests, limiting maximum file sizes for analysis, and toggling debug logging. The module's notification system ensures that when users change any setting, all dependent components immediately receive updates and can adjust their behavior accordingly, providing a seamless and responsive configuration experience.

**Capabilities:**
- Centralized management of all Shadow Watch extension settings
- Type-safe access to user preferences across the extension
- Real-time notification system for configuration changes
- Support for multiple LLM providers (OpenAI and Claude)
- Configurable analysis behavior and output formatting
- Flexible filtering and display options for detected issues
- Performance tuning through file size limits and timeout settings

### src/context (other)

The context module provides automatic preservation and formatting of code analysis results. When code is analyzed, this module captures the results and saves them to a dedicated .shadow/docs directory within the workspace, creating timestamped snapshots that can be referenced later.

This module acts as a bridge between the analysis engine and persistent storage, transforming raw analysis data into a structured format optimized for use with Large Language Models. Each analysis session generates a new snapshot, allowing users to track changes over time and maintain a history of their codebase understanding.

Users benefit from this module passively - as they analyze their code, the context module automatically handles the storage and formatting of results without requiring manual intervention. The preserved analysis data remains available across VSCode sessions, enabling faster subsequent analyses and providing a foundation for AI-assisted development features.

**Capabilities:**
- Automatically preserves code analysis results for future reference
- Creates timestamped snapshots of analysis data in the workspace
- Converts technical analysis results into LLM-friendly context format
- Maintains a persistent documentation directory within the workspace
- Enables retrieval of historical analysis data across sessions

### src/domain/bootstrap (other)

The bootstrap module serves as the initialization and configuration hub for the VS Code extension, responsible for setting up all user-facing components when the extension activates. It orchestrates the registration of commands, creation of tree views, and initialization of services that power the extension's code analysis capabilities.

Users interact with this module primarily through the extension's activation process, which automatically configures sidebar views for navigating products, viewing analysis results, exploring insights, examining static analysis findings, and managing unit tests. The module establishes a comprehensive command palette with commands for analyzing workspaces or individual files, copying analysis data to the clipboard, clearing cached data, accessing settings, viewing reports, and switching LLM providers.

The module enables a seamless workflow where file changes trigger automatic re-analysis, results populate in organized tree views, and users can access detailed information through navigation commands. Status bar integration provides at-a-glance feedback on analysis progress and current LLM provider status, while the diagnostics panel surfaces code issues and warnings in real-time.

**Capabilities:**
- Initialize and configure the VS Code extension environment with all necessary components and services
- Register and manage all extension commands for code analysis, insights, navigation, and settings
- Set up interactive tree views for navigating products, analyses, insights, static analysis results, and unit tests
- Provide status bar integration showing real-time analysis progress and LLM provider information
- Enable automatic code analysis and view updates when files change in the workspace
- Manage clipboard operations for copying analysis results, insights, and menu structures
- Configure diagnostics panel integration for displaying code issues and warnings
- Support switching between different LLM providers during runtime

**Commands:**
- `analyzeWorkspace`: Analyze the entire workspace to generate comprehensive code insights and analysis results
- `analyzeCurrentFile`: Analyze the currently open file for code insights and quality metrics
- `copyAllInsights`: Copy all generated insights to the system clipboard
- `copyInsightsForFile`: Copy insights for a specific file to the system clipboard
- `copyInsight`: Copy an individual insight to the system clipboard
- `clearCache`: Clear all cached analysis data to force fresh analysis
- `clearAllData`: Clear all extension data including cache, settings, and stored results
- `openSettings`: Open the extension settings panel for configuration
- `viewLatestReport`: Display the most recent analysis report
- `viewUnitTestReport`: Display the latest unit test analysis report
- `switchProvider`: Switch between available LLM providers for code analysis
- `copyMenuStructure`: Copy the extension's menu structure to the clipboard
- `showProviderStatus`: Display information about the current LLM provider configuration
- `navigateToProductItem`: Navigate to a specific product item in the codebase
- `navigateToAnalysisItem`: Navigate to a specific analysis result item
- `viewProductItemDetails`: View detailed information about a selected product item
- `viewInsightDetails`: View detailed information about a specific insight
- `viewUnitTestDetails`: View detailed information about a unit test

### src/domain/formatters (other)

The formatters module provides capabilities for transforming raw product documentation and codebase analysis into human-readable Markdown format. It serves as the presentation layer that takes structured data about a product's features, architecture, and insights and converts it into well-organized documentation that users can read and understand.

Users interact with this module's output when viewing generated documentation. The formatter creates comprehensive reports that include an overview section, detailed feature breakdowns organized by user perspective (GUI, CLI, API), key insights about the codebase, and technical considerations for developers. Each generated document includes a timestamp showing when it was created, helping users track documentation versions.

The module supports multiple documentation workflows: formatting complete product documentation with all perspectives and insights, generating focused reports on specific aspects like file analysis, and presenting domain-level understanding including architectural patterns and system themes. All output is structured as Markdown, making it easy to read in documentation viewers, code editors, or convert to other formats.

**Capabilities:**
- Format product documentation into structured Markdown reports
- Organize documentation by user perspective (GUI, CLI, API)
- Display key insights and themes from codebase analysis
- Generate timestamped documentation with creation metadata
- Present file analysis results in readable report format
- Structure developer-facing technical information
- Format domain insights including patterns and system understanding

### src/domain/handlers (other)

The handlers module provides navigation and information display capabilities for exploring codebases within VS Code. It enables users to quickly jump to any code location - whether a file, function definition, or API endpoint - and view comprehensive details about code items in dedicated webview panels.

This module supports developer workflows by making code exploration intuitive and efficient. Users can navigate from high-level API endpoints down to specific function implementations, view function signatures with complete parameter information, and examine file dependencies. The module displays analysis results and code metrics alongside the actual code, helping developers understand both structure and quality.

When navigation operations fail - such as attempting to access non-existent files or invalid line numbers - the module provides clear error messages to guide users. All navigation actions integrate seamlessly with VS Code's editor, opening files at the correct locations and presenting supplementary information in webview panels that don't disrupt the main editing workflow.

**Capabilities:**
- Navigate to specific files, functions, and API endpoints in the codebase
- Display detailed information about code items in interactive webview panels
- Show function signatures with parameters and return types
- View API endpoint details including HTTP methods and paths
- Display file contents with dependencies and relationships
- Jump to precise line numbers within files
- Present code analysis results and metrics
- Handle navigation errors with informative error messages

### src/domain/prompts (other)

This module serves as the prompt engineering layer for LLM-based code analysis and generation workflows. It provides centralized prompt construction services that transform analysis requirements into structured, detailed instructions for language models. The module handles multiple analysis scenarios including architecture documentation, product summaries, code refactoring recommendations, and test generation.

Users interact with this module indirectly through various code analysis and generation features. When requesting codebase analysis, the module constructs prompts that guide LLMs to produce architecture overviews, identify patterns, and document system structure. For refactoring scenarios, it builds detailed prompts that include function-by-function analysis, dependency graphs, step-by-step migration plans, and before/after code examples. The module also supports test-driven workflows by generating prompts that analyze source code and create comprehensive test plans with actual test implementations.

The prompt building workflow operates at multiple abstraction levels: file-level for detailed code analysis, module-level for component summaries, and product-level for comprehensive documentation. Each prompt type is carefully structured to include relevant context, specific instructions, and output formatting requirements that ensure consistent, high-quality LLM responses. This centralized approach to prompt management ensures consistency across all AI-assisted code analysis and generation features while maintaining the flexibility to handle diverse analysis scenarios.

**Capabilities:**
- Generates specialized prompts for LLM-based code analysis across multiple analysis types
- Creates structured prompts for architecture analysis and documentation generation
- Produces prompts for intelligent code refactoring with detailed migration plans
- Builds prompts for automated test plan creation and test code generation
- Constructs prompts for multi-level documentation (file, module, and product levels)
- Generates prompts that guide LLMs to analyze product purpose and value propositions
- Creates prompts with function-level analysis for code extraction and reorganization
- Produces prompts that include dependency relationship analysis for refactoring impact assessment

### src/domain/services (other)

The services module provides core automation and monitoring capabilities that power the extension's intelligent features. It includes a file watching service that continuously monitors the workspace for file system changes, enabling real-time responses to file creation, modification, deletion, and save events based on configurable file patterns. This allows the extension to stay synchronized with workspace changes without manual intervention.

The module features an incremental analysis service that orchestrates multi-round LLM conversations for deep code analysis. This service automatically gathers information across multiple iterations, retrieving file contents and executing searches based on previous results, continuing until analysis criteria are met or iteration limits are reached. This enables comprehensive understanding of complex codebases through progressive refinement.

Additionally, the module includes a test configuration service that automatically detects which testing framework is in use (Jest, Mocha, Vitest, or Pytest) and validates the test environment setup. It identifies missing dependencies, reports configuration status, and provides actionable setup requirements, ensuring generated tests can run successfully without manual configuration troubleshooting.

**Capabilities:**
- Automatic file system monitoring and change detection across the workspace
- Iterative code analysis using LLM with multi-round information gathering
- Automatic test framework detection and configuration validation
- Real-time response to file creation, modification, and deletion events
- Progressive analysis with automatic file content and search result retrieval
- Test dependency and setup requirement identification

### src/domain/services/testing (tests)

This module provides an end-to-end AI-powered testing workflow that helps developers create, execute, and maintain unit tests for their codebase. It begins by analyzing the code to understand which functions are testable and creates a prioritized test plan based on complexity, dependencies, and risk factors. The module then detects the current test environment configuration and can generate setup instructions if the testing infrastructure is incomplete.

Once the environment is ready, the module generates unit tests for selected functions using AI assistance, processing them in small batches while providing real-time progress updates. After test generation, it automatically executes the test suites using the appropriate testing framework (Jest, Mocha, pytest, JUnit, or Google Test) and captures detailed results including pass/fail counts, error messages, stack traces, and execution timing.

When tests fail, the module leverages AI to automatically analyze and fix the failures through multiple retry attempts, significantly reducing manual debugging effort. Throughout the entire workflow, users receive progress notifications, detailed statistics, and comprehensive test reports that help them understand their codebase's test coverage and health. This automated approach transforms testing from a manual, time-consuming task into a streamlined, AI-assisted process.

**Capabilities:**
- Automatically analyze codebases to identify testable functions and create prioritized test plans based on complexity and risk
- Detect existing test environments and generate setup plans for multiple programming languages (TypeScript, JavaScript, Python, Java, C++) and frameworks (Jest, Mocha, pytest, JUnit, Google Test)
- Generate unit tests for code functions using AI in small batches with real-time progress tracking
- Execute test suites and capture detailed results including pass/fail status, error messages, and execution statistics
- Automatically validate and fix failing tests through AI-powered retry attempts
- Provide comprehensive test reports showing overall test health and coverage

### src/domain/services/testing/types (tests)

This module provides comprehensive type definitions for the testing workflow system, enabling users to understand and track the entire test lifecycle from setup through execution. It structures all the data types needed to represent test planning, generation, validation, and execution phases, giving users visibility into each step of the automated testing process.

Users can monitor test generation as it progresses through distinct phases, seeing which functions are being tested, how many have completed, and any failures that occur along the way. The module supports detailed test execution reporting, including pass rates, error diagnostics with stack traces, and actionable recommendations for improving test quality. For test setup, users receive clear information about required test frameworks, dependencies to install, configuration files to create, and the overall status of their test environment, ensuring they have everything needed before test generation begins.

**Capabilities:**
- Track test generation progress through multiple phases (setup, planning, generation, validation, complete)
- Monitor individual function test status and completion
- View test execution results with pass/fail statistics and error details
- Access test quality recommendations and improvement suggestions
- Review test setup configurations including frameworks, dependencies, and required files
- Monitor test environment status and identify missing dependencies
- View generated mock statements with explanations for test scenarios
- Track test generation failures with error messages and retry attempts

### src/infrastructure/fileSystem (other)

The fileSystem module provides high-performance file processing infrastructure that handles reading, filtering, and caching operations across the codebase. It serves as the foundation for any feature that needs to analyze or process multiple files efficiently.

When you work with files, this module automatically skips irrelevant directories like node_modules, .git, dist, build, .shadow, coverage, .vscode, and .idea to focus only on source files. It processes files in parallel for maximum speed while caching frequently accessed files to avoid redundant reads. The cache automatically detects when files change and refreshes its content, ensuring you always work with up-to-date data.

This module is used internally by other features that need to scan, analyze, or process files across your project. It ensures these operations complete quickly even in large codebases, while keeping memory usage under control through intelligent cache management and cleanup.

**Capabilities:**
- Efficiently processes multiple files in parallel across the codebase
- Automatically caches file contents to reduce redundant file system reads
- Intelligently filters out common non-source directories (node_modules, .git, dist, build, etc.)
- Detects file changes automatically and invalidates cached content
- Manages memory through automatic cache cleanup
- Handles processing errors gracefully without stopping the entire operation

### src/infrastructure/persistence (other)

The persistence module provides comprehensive storage capabilities for code analysis results. It manages a structured file system under .shadow/docs where each analysis run is stored in a timestamped directory, ensuring full history and traceability of all analyses performed.

Users benefit from automatic organization of analysis outputs including product documentation, architecture insights, and code summaries. Each analysis run captures complete metadata such as execution timing, file counts, and statistics. The module maintains a 'latest' symbolic link that always points to the most recent analysis, enabling quick access to current results without needing to navigate timestamped directories.

The module handles the entire lifecycle of analysis result persistence, from initial directory creation through final metadata recording. All documentation artifacts are automatically saved with appropriate naming conventions and directory structures, making it easy to review past analyses, track changes over time, and access the most current understanding of a codebase.

**Capabilities:**
- Persistent storage of code analysis results in organized, timestamped directory structures
- Automatic generation and saving of product documentation for analyzed codebases
- Storage of architecture insights and patterns discovered during analysis
- Creation of code summaries with statistics and metadata
- Maintenance of a 'latest' reference for easy access to most recent analysis
- Structured organization of analysis runs with complete metadata and timing information

### src/infrastructure (other)

This infrastructure module provides a standardized progress notification service for VS Code extensions. It enables developers to communicate the status of long-running operations to users through consistent, professional progress notifications that appear in the VS Code interface.

The module supports displaying titled progress notifications with updatable status messages, allowing users to track operations as they move through different stages. When operations are cancellable, users can click a cancel button in the notification to stop the operation mid-execution. The service manages the complete lifecycle of progress notifications, from initial display through updates to completion or cancellation.

This creates a unified user experience across all extension operations that require time to complete, such as file processing, API calls, or code generation tasks. Users receive clear visual feedback about what's happening and maintain control over long-running processes through the cancellation capability.

**Capabilities:**
- Display progress notifications to users during long-running operations
- Update progress messages dynamically as operations progress through different stages
- Provide cancellable operations with a cancel button in the notification
- Show progress indicators in the notification area or other specified locations
- Handle user cancellation requests and propagate them to the underlying operation

## File-Level Documentation

*Detailed documentation for 50 files*

### jest.config.js

**Role:** Core Logic

**Purpose:** Configures Jest testing framework for TypeScript testing in a VSCode extension project

**User Actions:**
- Users do not directly interact with this file - it supports the extension's testing infrastructure

**Key Functions:**
- `preset`: Configures Jest to use ts-jest preset for TypeScript testing
  - Inputs: None
  - Outputs: ts-jest configuration
- `testMatch`: Defines file patterns for test discovery
  - Inputs: None
  - Outputs: Array of glob patterns matching test files
- `transform`: Transpiles TypeScript files using ts-jest with specific compiler options
  - Inputs: TypeScript files
  - Outputs: Compiled JavaScript for testing
- `collectCoverageFrom`: Specifies which files to include/exclude from coverage reports
  - Inputs: None
  - Outputs: Array of file patterns for coverage collection
- `moduleNameMapper`: Mocks the vscode module for testing purposes
  - Inputs: None
  - Outputs: Mock implementation path

### src/ai/llmRateLimiter.ts

**Role:** Core Logic

**Purpose:** Prevents LLM API requests from exceeding provider rate limits by tracking and enforcing request quotas per time window

**User Actions:**
- User's AI requests are automatically throttled to prevent exceeding API limits
- User experiences prevented errors when too many AI requests are made too quickly
- User's requests are blocked when rate limits are reached within a time window

**Key Functions:**
- `canMakeRequest`: Checks if a new request is allowed based on recent request history and configured limits
  - Inputs: provider: LLMProvider ('openai' or 'claude')
  - Outputs: boolean - true if request can proceed, false if rate limit reached
- `recordRequest`: Records a timestamp for a completed request to track usage against rate limits
  - Inputs: provider: LLMProvider ('openai' or 'claude')
  - Outputs: void - updates internal request history
- `configure`: Sets custom rate limit configuration for a specific LLM provider
  - Inputs: provider: LLMProvider, config: RateLimitConfig (maxRequests, windowMs)
  - Outputs: void - updates provider configuration

### src/ai/llmResponseParser.ts

**Role:** Core Logic

**Purpose:** Parses and extracts structured data from LLM text responses into standardized documentation formats

**User Actions:**
- Receives natural language analysis from AI and converts it into organized documentation
- Displays parsed file summaries showing what each code file does
- Shows module-level documentation describing groups of related files
- Presents product-level documentation explaining overall system purpose
- Provides fallback text parsing when AI responses aren't in expected JSON format

**Key Functions:**
- `parseFileSummary`: Converts LLM response text into a structured FileSummary object
  - Inputs: content (LLM response text), filePath (file being analyzed), role (file's role in system)
  - Outputs: FileSummary object with purpose, actions, functions, dependencies, and intent
- `parseModuleSummary`: Extracts module-level documentation from LLM response
  - Inputs: content (LLM response text), moduleName (name of module being analyzed)
  - Outputs: ModuleSummary object describing the module's purpose and components
- `parseProductDocumentation`: Parses high-level product documentation from LLM response
  - Inputs: content (LLM response text)
  - Outputs: EnhancedProductDocumentation object with product overview and architecture
- `parseLLMInsights`: Extracts AI-generated insights about code quality and patterns
  - Inputs: content (LLM response text)
  - Outputs: LLMInsights object with analysis findings
- `parseProductPurpose`: Extracts the overall purpose and goals of the product from LLM analysis
  - Inputs: content (LLM response text), context (analysis context)
  - Outputs: ProductPurposeAnalysis object describing what the product does
- `extractSection`: Finds and extracts a specific section from text response
  - Inputs: content (text to search), sectionName (section identifier)
  - Outputs: Extracted section text or empty string
- `extractListSection`: Extracts bullet-point lists from text responses
  - Inputs: content (text to search), sectionName (list identifier)
  - Outputs: Array of list items

### src/ai/llmRetryHandler.ts

**Role:** Core Logic

**Purpose:** Handles automatic retries of LLM API requests when they fail due to temporary errors like rate limits or network issues

**User Actions:**
- When an AI request fails temporarily, the system automatically retries it without user intervention
- Requests that fail due to rate limits or network issues are automatically retried with increasing delays between attempts
- Failed requests are retried up to a maximum number of times before finally failing
- Users experience seamless AI interactions even when temporary API issues occur

**Key Functions:**
- `executeWithRetry`: Executes an async operation with automatic retry logic and exponential backoff
  - Inputs: operation function to execute, retry options (maxRetries, delays, retryable errors, callback)
  - Outputs: Promise resolving to operation result with attempt count metadata
- `isRetryableError`: Determines if an error should trigger a retry attempt based on error type and message
  - Inputs: error object, list of retryable error patterns
  - Outputs: boolean indicating if the error is retryable

### src/ai/providers/ILLMProvider.ts

**Role:** Core Logic

**Purpose:** Defines the contract for integrating different AI language model providers (OpenAI, Claude, etc.) into the system

**User Actions:**
- Receives AI-generated text responses from different language model providers
- Gets structured JSON data from AI providers for automated processing
- System checks if an AI provider is available before attempting to use it

**Key Functions:**
- `isConfigured`: Checks if the provider has valid credentials and is ready to use
  - Inputs: none
  - Outputs: boolean indicating if provider is configured
- `sendRequest`: Sends a prompt to the AI provider and receives a text response
  - Inputs: LLMRequestOptions with messages, model settings, temperature, and token limits
  - Outputs: LLMResponse with generated text content and metadata
- `sendStructuredRequest`: Sends a prompt expecting structured JSON output with optional follow-up requests
  - Inputs: LLMRequestOptions and optional schema for validation
  - Outputs: StructuredOutputResponse with parsed data and optional file/grep requests
- `getName`: Returns the provider's identifying name
  - Inputs: none
  - Outputs: string name of the provider

### src/ai/providers/anthropicProvider.ts

**Role:** Core Logic

**Purpose:** Provides an interface to Anthropic's Claude AI model for generating text responses and structured JSON outputs within the extension

**User Actions:**
- Sends prompts to Claude AI and receives text responses
- Generates structured JSON outputs from Claude based on schemas
- Uses Claude models (like claude-sonnet-4-5) for AI-powered features
- Experiences AI responses with up to 8192 tokens of output
- May see errors if Claude API key is not configured

**Key Functions:**
- `isConfigured`: Checks if Claude API key is configured and client is ready
  - Inputs: none
  - Outputs: boolean indicating if provider is ready to use
- `getName`: Returns the identifier name for this provider
  - Inputs: none
  - Outputs: string 'claude'
- `sendRequest`: Sends a text prompt to Claude and returns the response
  - Inputs: LLMRequestOptions (messages, model, system prompt, max tokens)
  - Outputs: LLMResponse with generated text and token counts
- `sendStructuredOutputRequest`: Requests structured JSON output from Claude based on a schema
  - Inputs: LLMRequestOptions with schema and output instructions
  - Outputs: StructuredOutputResponse with parsed JSON object
- `initialize`: Sets up the Anthropic client with API key from configuration
  - Inputs: none (reads from config manager)
  - Outputs: void (initializes client or sets to null)

### src/ai/providers/openAIProvider.ts

**Role:** Core Logic

**Purpose:** Provides integration with OpenAI's language models (like GPT-4) for generating AI responses in the application

**User Actions:**
- Receives AI-generated text responses to user prompts
- Gets structured JSON responses when requesting formatted data
- Experiences AI conversation with system prompts guiding behavior
- Receives streaming responses for real-time AI text generation

**Key Functions:**
- `isConfigured`: Checks if OpenAI API key is set and client is ready
  - Inputs: none
  - Outputs: boolean indicating configuration status
- `getName`: Returns the provider identifier
  - Inputs: none
  - Outputs: string 'openai'
- `sendRequest`: Sends a chat completion request to OpenAI and returns the response
  - Inputs: LLMRequestOptions (model, messages, system prompt, response format)
  - Outputs: LLMResponse with content and finish reason
- `sendStructuredRequest`: Requests a JSON-formatted response and extracts structured data
  - Inputs: LLMRequestOptions with JSON response format
  - Outputs: StructuredOutputResponse with parsed JSON data
- `streamRequest`: Streams AI responses in real-time chunks as they are generated
  - Inputs: LLMRequestOptions and callback function for each chunk
  - Outputs: complete response content after streaming finishes

### src/ai/providers/providerFactory.ts

**Role:** Core Logic

**Purpose:** Creates and manages AI provider instances (OpenAI or Claude) based on configuration, ensuring only one instance of each provider exists at a time.

**User Actions:**
- Automatically switches between OpenAI and Claude AI providers based on user configuration
- Validates that the selected AI provider has valid credentials before use
- Shows only configured AI providers as available options

**Key Functions:**
- `getProvider`: Returns the provider instance for a specific AI service (openai or claude)
  - Inputs: provider: 'openai' | 'claude'
  - Outputs: ILLMProvider instance
- `getCurrentProvider`: Returns the currently active AI provider based on user configuration
  - Inputs: none
  - Outputs: ILLMProvider instance
- `isProviderConfigured`: Checks if a specific AI provider has valid configuration and credentials
  - Inputs: provider: 'openai' | 'claude'
  - Outputs: boolean (true if configured)
- `getConfiguredProviders`: Returns list of all AI providers that are properly configured and ready to use
  - Inputs: none
  - Outputs: array of provider names ['openai', 'claude']

### src/analysis/enhancedAnalyzer.ts

**Role:** Core Logic

**Purpose:** Performs deep code analysis by parsing Abstract Syntax Trees (AST) to extract detailed function metadata, control flow branches, dependencies, and behavioral patterns from source code files.

**User Actions:**
- Receives detailed analysis of code functions including their complexity, dependencies, and behavior patterns
- Gets insights into how functions modify state and interact with external dependencies
- Views control flow analysis showing different execution paths and branches in code
- Sees behavioral hints about what functions do (e.g., validation, transformation, API calls)

**Key Functions:**
- `analyzeFileMetadata`: Analyzes all functions in a file and returns detailed metadata for each
  - Inputs: filePath (string), content (string), language (string), functions (FunctionInfo[])
  - Outputs: Map<string, FunctionMetadata> containing analysis results for each function
- `analyzeTypeScriptFunction`: Performs AST-based analysis on TypeScript/JavaScript functions for detailed insights
  - Inputs: filePath (string), content (string), func (FunctionInfo), functionContent (string)
  - Outputs: FunctionMetadata with branches, dependencies, mutations, and behavioral hints
- `analyzeFunctionWithRegex`: Fallback analysis method using pattern matching for non-TypeScript languages
  - Inputs: filePath (string), func (FunctionInfo), functionContent (string), language (string)
  - Outputs: FunctionMetadata with basic analysis from regex patterns
- `extractFunctionContent`: Extracts the source code content for a specific function by line numbers
  - Inputs: content (string), startLine (number), endLine (number)
  - Outputs: String containing the function's source code

### src/analysis/functionAnalyzer.ts

**Role:** Core Logic

**Purpose:** Extracts detailed function information from large code files to support automated refactoring analysis and reporting.

**User Actions:**
- Receives analysis reports showing which functions in large files need refactoring
- Gets function signatures, dependencies, and responsibilities listed in refactoring suggestions
- Views which functions depend on or are depended upon by target functions

**Key Functions:**
- `analyzeFunctions`: Analyzes all functions in files exceeding a size threshold and returns detailed function information
  - Inputs: CodeAnalysis object, optional size threshold in lines (default 500)
  - Outputs: Array of FunctionAnalysis objects containing function details
- `analyzeFunction`: Performs deep analysis on a single function to extract its signature, dependencies, and relationships
  - Inputs: File path, FunctionInfo object, CodeAnalysis context
  - Outputs: FunctionAnalysis object or null if analysis fails
- `resolveFilePath`: Resolves relative file paths to absolute paths for file access
  - Inputs: File path string, CodeAnalysis context
  - Outputs: Resolved absolute file path

### src/analysisViewer.ts

**Role:** GUI View

**Purpose:** Provides a tree view interface in VSCode's sidebar to browse and navigate code analysis results organized by files, functions, dependencies, and entry points.

**User Actions:**
- View a tree structure showing code analysis results in the sidebar
- See summary statistics (total files, functions, dependencies, entry points)
- Browse files organized by directory structure
- Expand files to see their functions, imports, and exports
- View function details including parameters and complexity metrics
- See detected entry points in the codebase
- Click on items to jump to specific code locations in the editor
- View complexity warnings and dependency information
- See file roles (config, test, component, etc.) with icons
- Navigate through nested directory structures
- View 'No analysis available' message when no analysis has been run

**Key Functions:**
- `setAnalysis`: Updates the tree view with new analysis results
  - Inputs: CodeAnalysis object or null
  - Outputs: void (triggers tree refresh)
- `getTreeItem`: Returns the tree item representation for display
  - Inputs: AnalysisItem element
  - Outputs: vscode.TreeItem
- `getChildren`: Returns child items for a given tree node or root items if no element provided
  - Inputs: optional AnalysisItem element
  - Outputs: Promise<AnalysisItem[]>
- `getRootItems`: Creates the top-level tree items (statistics, files, functions, dependencies, entry points)
  - Inputs: none
  - Outputs: AnalysisItem[] array
- `getStatisticsItems`: Creates tree items showing analysis statistics counts
  - Inputs: none
  - Outputs: AnalysisItem[] array
- `getFilesItems`: Creates tree items for files and directories organized hierarchically
  - Inputs: none
  - Outputs: AnalysisItem[] array
- `getFileDetails`: Creates tree items showing details of a specific file (functions, imports, exports)
  - Inputs: AnalysisItem representing a file
  - Outputs: AnalysisItem[] array
- `getFunctionsItems`: Creates tree items listing all functions across the codebase
  - Inputs: none
  - Outputs: AnalysisItem[] array
- `getDependenciesItems`: Creates tree items showing file dependency relationships
  - Inputs: none
  - Outputs: AnalysisItem[] array
- `getEntryPointsItems`: Creates tree items for detected application entry points
  - Inputs: none
  - Outputs: AnalysisItem[] array
- `createFileLocation`: Creates a vscode.Location object for navigating to specific code positions
  - Inputs: file path, optional line/column numbers
  - Outputs: vscode.Location object

### src/analyzer.ts

**Role:** Core Logic

**Purpose:** Analyzes code files to extract structure, dependencies, functions, and relationships for codebase understanding and visualization

**User Actions:**
- View total file count, line count, and function count statistics
- See list of large files that may need refactoring
- View all functions with their metadata and locations
- See import relationships between files
- Identify orphaned files not imported by others
- Find entry points (files not importing others)
- Detect duplicate code blocks across the codebase
- View risk levels (high/medium/low) for functions
- See test coverage mapping for source files and functions
- Identify uncovered functions without tests

**Key Functions:**
- `CodeAnalysis`: Main data structure containing complete analysis results
  - Inputs: N/A (interface)
  - Outputs: Object with totalFiles, totalLines, functions, imports, orphanedFiles, duplicates, testMapping, etc.
- `FunctionMetadata`: Detailed metadata about a single function
  - Inputs: N/A (interface)
  - Outputs: Object with symbolName, parameters, returnType, visibility, branches, dependencies, riskLevel, docstring
- `BranchInfo`: Information about conditional branches and control flow
  - Inputs: N/A (interface)
  - Outputs: Object with type (if/loop/try/etc), condition description, lineNumber
- `DependencyInfo`: Tracks external and internal dependencies
  - Inputs: N/A (interface)
  - Outputs: Object with dependency name, type (db/http/filesystem/etc), isInternal flag
- `StateMutationInfo`: Tracks where and how state is modified
  - Inputs: N/A (interface)
  - Outputs: Object with target name, mutationType (assign/modify/delete/read), lineNumber
- `TestMapping`: Maps source files and functions to their test files
  - Inputs: N/A (interface)
  - Outputs: Object with sourceFileToTests map, functionToTests map, uncoveredFunctions list

### src/cache.ts

**Role:** Core Logic

**Purpose:** Manages persistent storage and retrieval of code analysis results with automatic expiration after 24 hours

**User Actions:**
- Analysis results are loaded instantly when reopening a previously analyzed workspace
- Analysis results become stale and are automatically refreshed after 24 hours
- Cache storage is automatically created in the workspace on first use
- Old analysis data can be cleared to free up disk space

**Key Functions:**
- `constructor`: Initializes the cache manager with a storage location
  - Inputs: storagePath (string) - base directory for cache storage
  - Outputs: AnalysisCache instance
- `getCacheKey`: Converts a workspace path into a safe filename for cache storage
  - Inputs: workspaceRoot (string) - workspace directory path
  - Outputs: string - base64-encoded safe filename
- `get`: Retrieves cached analysis results if they exist and are not expired
  - Inputs: workspaceRoot (string) - workspace directory path
  - Outputs: Promise<CodeAnalysis | null> - cached analysis or null if expired/missing
- `set`: Saves analysis results to cache with current timestamp
  - Inputs: workspaceRoot (string), data (CodeAnalysis) - workspace path and analysis to cache
  - Outputs: Promise<void>
- `clear`: Removes all cached analysis files from storage
  - Inputs: none
  - Outputs: Promise<void>

### src/config/configurationManager.ts

**Role:** Core Logic

**Purpose:** Manages all configuration settings for the Shadow Watch extension, providing type-safe access to user preferences and notifying components when settings change.

**User Actions:**
- Enable or disable the Shadow Watch extension entirely
- Toggle automatic analysis when saving files
- Show or hide inline hint decorations in the editor
- Configure which LLM provider to use (OpenAI or Claude)
- Set API keys for AI services
- Choose output format for AI reports (Cursor, ChatGPT, Generic, or Compact)
- Adjust minimum severity level for displaying problems (Error, Warning, or Info)
- Set custom endpoints for AI services
- Configure HTTP timeout for AI requests
- Set maximum file size for analysis
- Enable or disable debug logging
- Show or hide decorations in the status bar

**Key Functions:**
- `Constructor`: Initializes the configuration manager and sets up automatic watching for configuration changes
  - Inputs: None
  - Outputs: ConfigurationManager instance
- `onConfigurationChange`: Registers a callback function to be invoked whenever Shadow Watch configuration changes
  - Inputs: callback function
  - Outputs: void
- `removeConfigurationChangeListener`: Removes a previously registered configuration change callback
  - Inputs: callback function
  - Outputs: void
- `enabled`: Returns whether the Shadow Watch extension is enabled
  - Inputs: None (getter)
  - Outputs: boolean
- `analyzeOnSave`: Returns whether automatic analysis on file save is enabled
  - Inputs: None (getter)
  - Outputs: boolean
- `showInlineHints`: Returns whether inline hint decorations should be displayed
  - Inputs: None (getter)
  - Outputs: boolean
- `llmProvider`: Returns the configured LLM provider (OpenAI or Claude)
  - Inputs: None (getter)
  - Outputs: LLMProvider type
- `llmFormat`: Returns the configured output format for LLM reports
  - Inputs: None (getter)
  - Outputs: LLMFormat type
- `severityThreshold`: Returns the minimum severity level for displaying problems
  - Inputs: None (getter)
  - Outputs: SeverityThreshold type
- `validate`: Validates the current configuration and returns any errors found
  - Inputs: None
  - Outputs: ConfigValidationResult with validation status and error messages
- `getConfigForResource`: Retrieves configuration specific to a workspace folder or file
  - Inputs: vscode.Uri resource
  - Outputs: workspace-specific configuration
- `updateConfig`: Updates a configuration value programmatically
  - Inputs: key, value, configuration target
  - Outputs: Promise that resolves when update completes

### src/context/analysisContextBuilder.ts

**Role:** Core Logic

**Purpose:** Converts code analysis results into a format suitable for LLM context and saves them to persistent storage for future use.

**User Actions:**
- Analysis results are automatically saved to the workspace for future reference
- Analysis data is preserved in a .shadow/docs directory within the workspace
- Timestamped analysis snapshots are created each time code is analyzed

**Key Functions:**
- `convertCodeAnalysisToContext`: Transforms raw code analysis data into the specific format required by LLM services
  - Inputs: CodeAnalysis object containing files, imports, entry points, and metrics
  - Outputs: AnalysisContext object formatted for LLM consumption with file paths, lines, functions, imports, and statistics
- `saveCodeAnalysis`: Persists code analysis results to disk with timestamp metadata for future retrieval
  - Inputs: CodeAnalysis object to be saved
  - Outputs: void - creates code-analysis.json file in .shadow/docs directory

### src/diagnosticsProvider.ts

**Role:** Core Logic

**Purpose:** Manages the display of code insights as inline diagnostics (squiggly underlines and problems panel entries) in the VS Code editor.

**User Actions:**
- See squiggly underlines in code where insights are detected
- View insights in the Problems panel with severity indicators (error, warning, info)
- Click on problems to navigate to the corresponding code location
- See 'Shadow Watch' as the source of diagnostic messages
- View insight descriptions as diagnostic messages
- Have diagnostics automatically cleared when insights are updated

**Key Functions:**
- `updateDiagnostics`: Updates diagnostics for all files based on provided insights
  - Inputs: Array of Insight objects
  - Outputs: Void - displays diagnostics in editor and Problems panel
- `updateDiagnosticsForFile`: Updates diagnostics for a specific file
  - Inputs: File URI and array of Insight objects for that file
  - Outputs: Void - displays diagnostics for the specified file
- `clear`: Removes all diagnostics from the editor and Problems panel
  - Inputs: None
  - Outputs: Void
- `createDiagnostic`: Converts an insight into a VS Code diagnostic with severity, message, and location
  - Inputs: Insight object
  - Outputs: VS Code Diagnostic object
- `dispose`: Cleans up the diagnostics collection when no longer needed
  - Inputs: None
  - Outputs: Void

### src/domain/bootstrap/commandRegistry.ts

**Role:** Core Logic

**Purpose:** Registers all VS Code commands for the extension and maps them to their handler functions

**User Actions:**
- Analyze entire workspace for code insights
- Analyze currently open file
- Copy all insights to clipboard
- Copy insights for specific file to clipboard
- Copy individual insight to clipboard
- Clear cached analysis data
- Clear all extension data
- Open extension settings
- View latest analysis report
- View latest unit test report
- Switch between LLM providers
- Copy menu structure to clipboard
- View current LLM provider status
- Navigate to specific product items
- Navigate to analysis items
- View detailed information about product items
- View detailed information about insights
- View detailed information about unit tests

**Key Functions:**
- `register`: Registers all extension commands with VS Code
  - Inputs: context (ExtensionContext), components (ExtensionComponents)
  - Outputs: void
- `analyzeWorkspace`: Triggers analysis of entire workspace
  - Inputs: none
  - Outputs: Promise<void>
- `analyzeCurrentFile`: Triggers analysis of currently open file
  - Inputs: none
  - Outputs: Promise<void>
- `copyAllInsights`: Copies all generated insights to clipboard
  - Inputs: none
  - Outputs: Promise<void>
- `copyFileInsights`: Copies insights for specific file to clipboard
  - Inputs: none
  - Outputs: Promise<void>
- `copyInsight`: Copies single insight item to clipboard
  - Inputs: item (any)
  - Outputs: Promise<void>
- `clearCache`: Clears cached analysis results
  - Inputs: none
  - Outputs: Promise<void>
- `clearAllData`: Clears all extension data including cache and settings
  - Inputs: none
  - Outputs: Promise<void>
- `showSettings`: Opens extension settings panel
  - Inputs: none
  - Outputs: Promise<void>
- `openLatestReport`: Opens most recent analysis report
  - Inputs: none
  - Outputs: Promise<void>
- `openLatestUnitTestReport`: Opens most recent unit test report
  - Inputs: none
  - Outputs: Promise<void>
- `switchProvider`: Switches between different LLM providers
  - Inputs: none
  - Outputs: Promise<void>
- `copyMenuStructure`: Copies menu structure to clipboard
  - Inputs: none
  - Outputs: Promise<void>
- `showProviderStatus`: Displays current LLM provider status and configuration
  - Inputs: none
  - Outputs: Promise<void>
- `navigateToProductItem`: Navigates to specific product item in codebase
  - Inputs: item (ProductNavItem)
  - Outputs: Promise<void>
- `navigateToAnalysisItem`: Navigates to specific analysis result
  - Inputs: item (AnalysisItem)
  - Outputs: Promise<void>
- `showProductItemDetails`: Shows detailed view of product item
  - Inputs: item (ProductNavItem)
  - Outputs: Promise<void>
- `showInsightItemDetails`: Shows detailed view of insight
  - Inputs: item (any)
  - Outputs: Promise<void>
- `showUnitTestItemDetails`: Shows detailed view of unit test item
  - Inputs: item (any)
  - Outputs: Promise<void>

### src/domain/bootstrap/extensionBootstrapper.ts

**Role:** Core Logic

**Purpose:** Bootstraps and initializes all extension components when the VS Code extension is activated, setting up views, commands, and services.

**User Actions:**
- Extension activates and displays status bar item showing analysis status
- Product Navigator tree view becomes available in the sidebar
- Analysis Viewer tree view displays code analysis results
- Insights Viewer tree view shows generated insights
- Static Analysis Viewer tree view presents static analysis findings
- Unit Tests Navigator tree view lists unit tests
- Reports tree view displays generated reports
- Diagnostics panel shows code issues and warnings
- File changes trigger automatic re-analysis and view updates

**Key Functions:**
- `bootstrap`: Initializes all extension components and returns them as a structured interface
  - Inputs: vscode.ExtensionContext
  - Outputs: ExtensionComponents interface containing all initialized services
- `ExtensionComponents (interface)`: Defines the structure of all extension components including analyzers, viewers, providers, and services
  - Inputs: N/A (type definition)
  - Outputs: Type definition for component collection

### src/domain/formatters/documentationFormatter.ts

**Role:** Core Logic

**Purpose:** Formats product documentation and insights into readable Markdown format for display to users

**User Actions:**
- View formatted product documentation with overview, features, and user perspectives
- See generated documentation with timestamp showing when it was created
- Read documentation organized by sections: GUI, CLI, and API perspectives
- View key insights about the codebase in structured format
- See developer-facing information like architecture and technical considerations
- Read file analysis results formatted as Markdown reports
- View domain insights including themes, patterns, and system understanding

**Key Functions:**
- `formatEnhancedDocsAsMarkdown`: Converts enhanced product documentation object into formatted Markdown string with sections for overview, features, user perspectives, technical details, and architecture
  - Inputs: EnhancedProductDocumentation object
  - Outputs: Markdown string with formatted documentation
- `formatInsightsAsMarkdown`: Converts LLM-generated insights into formatted Markdown documentation with sections for product understanding, user perspective, and developer information
  - Inputs: LLMInsights object
  - Outputs: Markdown string with formatted insights
- `formatFileAnalysisAsMarkdown`: Formats individual file analysis results into Markdown report showing file role, purpose, behavior, and key functions
  - Inputs: File analysis object with metadata and extracted information
  - Outputs: Markdown string with file analysis report
- `formatDomainInsightsAsMarkdown`: Formats domain-level insights into Markdown documentation showing themes, patterns, system understanding, and technical considerations
  - Inputs: Domain insights object
  - Outputs: Markdown string with domain insights documentation

### src/domain/handlers/navigationHandler.ts

**Role:** Core Logic

**Purpose:** Handles navigation to code locations (files, functions, endpoints) and displays detailed information about code items in the VS Code editor.

**User Actions:**
- Navigate to a specific file in the workspace
- Navigate to a function definition within a file
- Navigate to an API endpoint implementation
- View detailed information about a code item in a webview panel
- See function signatures, parameters, and return types
- View endpoints with their HTTP methods and paths
- See file contents and dependencies
- Jump to specific line numbers in files
- View analysis results and code metrics
- See error messages when navigation fails

**Key Functions:**
- `navigateToProductItem`: Navigates to a product navigation item (file, function, or endpoint)
  - Inputs: ProductNavItem (contains type and data with file/function/endpoint information)
  - Outputs: Promise<void> - completes when navigation is done
- `showProductItemDetails`: Displays detailed information about a product item in a webview panel
  - Inputs: ProductNavItem (contains item data to display)
  - Outputs: void - opens webview with formatted details
- `navigateToAnalysisItem`: Navigates to an analysis item location in the code
  - Inputs: AnalysisItem (contains file path and optional line number)
  - Outputs: Promise<void> - completes when editor opens
- `showAnalysisItemDetails`: Displays detailed analysis information in a webview panel
  - Inputs: AnalysisItem (contains analysis data and metrics)
  - Outputs: void - shows webview with analysis details
- `navigateToEntryPoint`: Navigates to an entry point function in the codebase
  - Inputs: EntryPoint (contains file path and function name)
  - Outputs: Promise<void> - opens file and jumps to function


*... and 30 more files*
