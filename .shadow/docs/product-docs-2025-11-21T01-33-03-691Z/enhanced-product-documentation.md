# Product Documentation

*Generated: 11/20/2025, 5:48:57 PM (2025-11-21 01:48:57 UTC)*

---

## Product Overview

Shadow Watch is a VS Code extension that provides AI-powered code intelligence and automated documentation for software development teams. The extension analyzes codebases to understand their architecture, purpose, and potential issues, then generates comprehensive insights and documentation automatically. Users interact with Shadow Watch primarily through VS Code's sidebar panels and command palette, where they can trigger analysis, view results in interactive tree views, and navigate directly to relevant code sections. The extension connects to AI services (OpenAI GPT or Anthropic Claude) to generate intelligent insights about code quality, architecture patterns, testability, and documentation.

The extension serves as an intelligent assistant that continuously monitors your codebase and provides actionable feedback. When you save files, Shadow Watch can automatically re-analyze them and update insights in real-time. It identifies code quality issues like large files, orphaned code, circular dependencies, and god objects, presenting these as inline diagnostics directly in your editor with specific line numbers and remediation suggestions. The extension also generates product-level documentation that explains what your application does, how components interact, and what workflows it supports.

Shadow Watch streamlines multiple development workflows including code review, documentation creation, test planning, and refactoring. Users can generate comprehensive test plans with AI-recommended test cases, receive step-by-step refactoring guidance for complex code, and export analysis results as formatted reports. The extension caches results for 24 hours to ensure fast subsequent loads, and all insights can be formatted for different AI assistants (Cursor, ChatGPT) or exported as standalone HTML reports.

## What It Does

- Analyzes codebases to identify code quality issues, architectural patterns, and potential improvements
- Generates comprehensive product documentation explaining what your application does and how it works
- Creates AI-powered test plans identifying which functions need testing and recommending test strategies
- Provides inline diagnostics showing code issues directly in your editor with specific locations and fixes
- Automatically generates unit tests for your code using AI analysis of function behavior
- Validates and auto-fixes failing tests by analyzing failures and regenerating corrected test code
- Detects entry points including main functions, CLI tools, and test files across your codebase
- Navigates you directly to functions, endpoints, and code sections when you click items in tree views
- Monitors file changes and automatically re-analyzes code when you save files
- Exports analysis results and documentation as formatted reports for sharing with your team
- Provides architecture insights explaining component relationships and design patterns in your code
- Generates refactoring recommendations with before/after code examples and migration steps
- Formats insights for specific AI assistants to improve code generation and review workflows

## User Perspective

### GUI

- View code analysis results in an interactive tree structure showing files, functions, and dependencies
- See inline warnings and errors directly in your editor highlighting specific code issues
- Browse AI-generated insights about your codebase architecture in a dedicated sidebar panel
- Navigate product documentation organized by features, modules, and components
- Review test plans showing which functions need testing and why
- Monitor test generation progress with real-time status updates
- Click any code element to jump directly to its location in your editor
- Export analysis results and documentation as HTML reports
- Toggle analyze-on-save to automatically update insights when files change
- Switch between OpenAI and Claude AI providers through settings

### CLI

- Trigger codebase analysis through VS Code command palette
- Generate product documentation on-demand via commands
- Create test plans for your codebase using commands
- Run automated test generation for specific files or entire projects
- Clear cached analysis results to force fresh analysis
- Copy insights to clipboard for sharing or documentation
- Switch LLM providers between OpenAI and Claude

### API

- Connect to OpenAI GPT models for AI-powered code analysis
- Integrate with Anthropic Claude for alternative AI analysis
- Submit code for analysis and receive structured insights
- Request file content or search patterns during iterative analysis
- Generate documentation in multiple formats optimized for different tools

### CI/CD

- Integrate automated test generation into CI pipelines
- Export analysis results for build-time quality checks
- Generate documentation as part of release processes
- Validate test coverage and quality metrics

## Workflow Integration

- Code review workflow: Analyze code before review to identify issues and generate documentation for reviewers
- Documentation workflow: Automatically generate and maintain product documentation as code evolves
- Test-driven development: Generate test plans and test code to increase coverage systematically
- Refactoring workflow: Receive AI-guided refactoring recommendations with specific extraction plans
- Onboarding workflow: Help new developers understand codebase architecture through AI-generated insights
- Quality assurance workflow: Continuously monitor code quality with automatic analysis on save
- CI/CD integration: Generate tests and documentation as part of automated build pipelines
- Technical debt workflow: Identify and track code quality issues with prioritized remediation steps

## Problems Solved

- Eliminates manual documentation creation by automatically generating comprehensive product and architecture documentation
- Reduces time spent understanding unfamiliar codebases by providing AI-powered architecture insights and navigation
- Increases test coverage by automatically generating test plans and test code for functions
- Saves code review time by automatically identifying quality issues before human review
- Prevents technical debt accumulation by continuously monitoring for code smells and anti-patterns
- Reduces onboarding time for new developers by providing clear documentation and architecture explanations
- Eliminates guesswork in refactoring by providing AI-analyzed extraction plans and migration steps
- Automates test maintenance by detecting and auto-fixing failing tests
- Prevents API rate limit issues when using AI services through intelligent throttling and retry logic
- Reduces context switching by providing all insights within VS Code without external tools

## Architecture Summary

Shadow Watch follows a modular architecture organized around core capabilities: code analysis, AI integration, UI presentation, and persistence. The analysis engine parses code into abstract syntax trees to extract detailed metadata about functions, dependencies, complexity, and behavioral patterns. This structural analysis feeds into an AI integration layer that communicates with LLM providers (OpenAI or Claude) to generate intelligent insights about architecture, code quality, and documentation. The AI layer includes rate limiting, retry logic, and response parsing to ensure reliable operation even under challenging network conditions.

The UI layer consists of multiple tree view providers that present analysis results, insights, test plans, and documentation in VS Code's sidebar. A diagnostics provider surfaces code quality issues as inline editor warnings with specific line numbers and remediation suggestions. Navigation handlers enable users to jump directly from tree views to relevant code locations. All components communicate through a command registry and event system that coordinates user actions across the extension.

Persistence and caching layers optimize performance by storing analysis results and AI-generated insights to disk, eliminating redundant processing. A file watcher monitors workspace changes and triggers automatic re-analysis when configured. Progress notifications keep users informed during long-running operations like test generation or comprehensive codebase analysis. The architecture supports iterative AI analysis where the system can request additional files or search results across multiple conversation rounds to build comprehensive understanding.

## Module Documentation

### . (other)

This module configures the Jest testing framework for the project, enabling developers to write and execute unit tests for TypeScript code. It serves as the foundation for the project's testing infrastructure by defining how tests are discovered, executed, and reported.

The configuration establishes TypeScript support through ts-jest, allowing tests to be written in TypeScript and automatically transformed during execution. It includes coverage reporting capabilities that track code quality metrics and can enforce coverage thresholds to maintain testing standards.

Developers benefit from this configuration through streamlined test execution, consistent module resolution that mirrors the application's import paths, and comprehensive coverage reports that identify untested code. While this is a development-time configuration file with no runtime impact, it directly enables the quality assurance workflow that ensures code reliability and maintainability.

**Capabilities:**
- Provides Jest testing framework configuration for the project
- Enables TypeScript-based unit testing with ts-jest transformation
- Supports code coverage reporting with configurable thresholds
- Facilitates module resolution and import path mapping for tests

### src/ai (other)

The AI module provides robust infrastructure for interacting with Large Language Model (LLM) APIs in a reliable and efficient manner. It ensures that AI-powered code analysis and documentation generation operations run smoothly by managing the complexities of external API communication. When you request AI analysis of your code, this module works behind the scenes to coordinate API calls, handle errors gracefully, and deliver structured results.

The module implements three critical safeguards for AI operations: rate limiting prevents your requests from being rejected by exceeding API quotas, intelligent parsing transforms raw AI text responses into organized data structures that the application can use, and automatic retry logic ensures temporary failures don't interrupt your workflow. These components work together to provide a seamless experience where AI operations 'just work' even when dealing with rate limits, network hiccups, or service timeouts.

For users, this means more reliable AI-powered documentation and analysis. Instead of encountering errors when the AI service is busy or rate limits are reached, requests are automatically queued, throttled, or retried as needed. The structured parsing ensures that AI-generated insights about your code are consistently formatted and easy to consume, whether you're viewing file summaries, module overviews, or product-level documentation.

**Capabilities:**
- Automatically manages API rate limits across different LLM providers (OpenAI, Claude) to prevent service disruptions
- Parses unstructured AI responses into organized, structured data for file summaries, module summaries, and product documentation
- Provides resilient AI operations with automatic retry logic and exponential backoff for handling temporary failures
- Intelligently throttles requests to stay within provider-specific rate limits
- Handles transient errors (rate limits, timeouts, network issues) transparently without user intervention

### src/ai/providers (other)

This module provides a unified AI provider abstraction layer that enables users to interact with multiple AI language models (OpenAI GPT and Anthropic Claude) through a single consistent interface. Users can configure their preferred AI provider and API key in the extension settings, and the module automatically handles provider initialization, API key validation, and request routing.

The module supports both conversational interactions with full message history and structured data requests. Users can send prompts to AI models and receive either natural language responses or formatted JSON data depending on their needs. The provider factory automatically selects the appropriate AI service based on user configuration and validates that required API keys are present before attempting connections.

All AI interactions flow through a standardized interface that abstracts away provider-specific implementation details. This allows users to switch between OpenAI and Claude seamlessly, with the application handling differences in API formats, authentication methods, and response structures. The module ensures consistent behavior regardless of which underlying AI provider is being used, while still allowing access to provider-specific features like different model variants (GPT-4, Claude Sonnet, Opus, Haiku).

**Capabilities:**
- Connect to multiple AI providers (OpenAI GPT models and Anthropic Claude models) through a unified interface
- Automatically select and initialize the appropriate AI provider based on user configuration and available API keys
- Send conversational messages with full conversation history to AI models for context-aware responses
- Receive both plain text responses and structured JSON data from AI models
- Request file content or search patterns from AI models during conversations
- Validate API keys automatically before making requests to prevent errors
- Switch between different AI providers transparently without changing application behavior
- Configure provider-specific settings including model selection and API keys

### src/analysis (other)

The analysis module provides sophisticated code intelligence capabilities that help developers understand and improve their codebase. It performs deep structural analysis by parsing code into abstract syntax trees, extracting rich metadata about functions, their behaviors, dependencies, and complexity characteristics. Users receive comprehensive insights about how their functions operate, including what branches exist, what state changes occur, and what other parts of the codebase are involved.

This module is particularly valuable when working with large files that need refactoring. It automatically identifies functions that may benefit from being split or reorganized, providing detailed reports about each function's purpose, dependencies, and relationships within the codebase. The analysis includes behavioral hints that help developers quickly understand whether functions are pure, asynchronous, recursive, or have side effects.

The insights generated by this module enable data-driven refactoring decisions by highlighting code complexity, identifying tightly coupled components, and revealing functions that modify state or depend on external resources. Developers can use this information to improve code maintainability, reduce complexity, and make informed architectural decisions about their codebase structure.

**Capabilities:**
- Deep code analysis through abstract syntax tree (AST) parsing to understand code structure and behavior
- Extraction of comprehensive function metadata including signatures, parameters, return types, and responsibilities
- Detection and analysis of conditional branches and code paths within functions
- Identification of function dependencies, both internal and external to the codebase
- Tracking of state mutations and variable modifications throughout function execution
- Recognition of behavioral patterns such as pure functions, async operations, and recursive calls
- Analysis of function complexity and side effects for refactoring decisions
- Generation of detailed function analysis reports for large files requiring refactoring

### src (other)

The src module is a VS Code extension that provides comprehensive AI-powered code analysis and insights. It analyzes codebases to generate intelligent documentation, detect code quality issues, and provide actionable recommendations for improvement. The extension integrates LLM services (OpenAI and Claude) to understand code purpose, architecture patterns, and potential problems, presenting this information through interactive tree views and inline diagnostics.

Users interact with the extension primarily through VS Code's sidebar tree views and inline editor diagnostics. The extension automatically watches for file changes and can trigger analysis on save, providing real-time feedback. It generates multiple types of reports including product documentation, architecture insights, unit test plans, and static analysis results. All insights are presented with specific file locations, line numbers, and actionable suggestions for remediation.

The module supports iterative workflows where users can generate initial insights, navigate to problematic code sections, make changes, and automatically see updated analysis. Results are cached for 24 hours to improve performance on subsequent loads. The extension formats insights for different consumption methods - whether viewing in VS Code's tree views, exporting to HTML reports, or formatting for specific AI assistants like Cursor or ChatGPT.

**Capabilities:**
- AI-powered code analysis and insights generation using LLM services (OpenAI/Claude)
- Automated code quality detection including large files, orphaned code, circular dependencies, and god objects
- Interactive tree-based visualization of code structure, analysis results, and insights
- Real-time inline diagnostics showing code issues directly in the editor
- Automated product documentation generation explaining codebase purpose and architecture
- File and module-level documentation with behavioral summaries
- Entry point detection for main functions, test files, and CLI tools
- Code search and file access capabilities for iterative LLM analysis
- Automatic file watching with on-save analysis triggering
- Persistent caching of analysis results for improved performance
- Export functionality for analysis results and documentation
- Unit test planning and coverage analysis
- Multiple LLM output formats optimized for different AI assistants

**Commands:**
- `shadow-watch.analyzeCode`: Triggers comprehensive code analysis of the workspace, generating insights and documentation
- `shadow-watch.generateInsights`: Generates AI-powered code insights including quality issues, architecture analysis, and refactoring suggestions
- `shadow-watch.generateProductDocs`: Creates AI-generated product documentation explaining what the codebase does and its purpose
- `shadow-watch.generateUnitTests`: Generates unit test plans and test coverage analysis for functions and modules
- `shadow-watch.exportAnalysis`: Exports analysis results and documentation to files in various formats
- `shadow-watch.refreshInsights`: Refreshes the insights tree view to show updated analysis information
- `shadow-watch.clearCache`: Clears the analysis cache to force fresh analysis on next run

### src/config (other)

The config module serves as the central configuration hub for the Shadow Watch extension, managing all user preferences and settings. It provides a unified interface for controlling how the extension operates, from basic activation toggles to advanced LLM provider configurations. The module ensures that all components of the extension stay synchronized when users modify their settings through VS Code's settings UI.

Users can customize their experience by controlling when and how code analysis occurs. The module supports toggling analyze-on-save functionality, adjusting inline hint visibility, and setting minimum severity thresholds to filter which issues appear in the editor. For AI-powered analysis, users can select between different LLM providers (OpenAI or Claude), configure API credentials, and choose output formats that match their preferred workflow (Cursor, ChatGPT, Generic, or Compact).

The configuration system also enables performance optimization through adjustable parameters like batch size and concurrency limits. When users modify any setting, the module immediately propagates these changes throughout the extension, ensuring consistent behavior across all features. This reactive configuration management allows users to fine-tune Shadow Watch to match their development environment and coding style without requiring extension restarts.

**Capabilities:**
- Centralized management of all Shadow Watch extension settings and preferences
- Real-time configuration change notifications to keep UI and analysis components synchronized
- Control over extension activation state and analysis triggers
- Customizable analysis behavior including severity thresholds and output formats
- Flexible LLM provider configuration supporting multiple AI services
- Performance tuning through adjustable batch sizes and concurrency limits

### src/context (other)

The context module serves as the bridge between code analysis and LLM-based documentation. It takes raw analysis results from the codebase and transforms them into a structured, timestamped format optimized for language model consumption. This enables LLMs to better understand the codebase structure, dependencies, and relationships when generating or modifying code.

All analysis results are automatically saved to the .shadow/docs directory within the workspace, creating a persistent documentation layer. Each snapshot includes comprehensive file statistics, identified entry points, and detailed import relationship mappings. The timestamped nature of these snapshots allows developers and automated systems to track how the codebase structure evolves over time.

This module is essential for maintaining context awareness in AI-assisted development workflows. By providing a standardized format for code structure information, it ensures that LLMs have access to accurate, up-to-date information about the codebase when performing tasks like code generation, refactoring, or documentation creation.

**Capabilities:**
- Automatically captures and structures code analysis results for LLM consumption
- Persists analysis snapshots to disk with timestamps for historical tracking
- Organizes analysis data including file statistics, entry points, and import relationships
- Provides a structured documentation format that can be referenced by LLMs during code generation and modification tasks
- Maintains a persistent record of codebase structure in the .shadow/docs directory

### src/domain/bootstrap (other)

This module serves as the foundation and entry point for the entire VS Code extension, handling both command registration and component initialization. It wires together all the pieces users interact with - from the command palette actions to the sidebar tree views - and ensures they work cohesively.

When the extension activates, this module establishes the complete user interface including the Insights viewer, Analysis panel, Product Navigator, Unit Tests view, and Reports viewer. It also sets up automatic file monitoring so that as developers edit code, the extension continuously re-analyzes and updates insights without manual intervention. The status bar displays real-time feedback about analysis progress and current state.

Users interact with this module's capabilities primarily through VS Code commands (accessible via command palette or context menus) that enable actions like analyzing the workspace, copying insights to clipboard, clearing cached data, switching LLM providers, and navigating through code structure. The module ensures all these commands are properly registered and connected to their underlying functionality, while also managing the visual feedback through diagnostics, tree views, and status indicators that appear throughout the VS Code interface.

**Capabilities:**
- Registers and exposes all extension commands that users can trigger from the command palette, context menus, and UI controls
- Initializes the complete extension architecture including analyzers, viewers, tree providers, and status indicators
- Automatically monitors file changes and triggers re-analysis to keep code insights current
- Integrates all extension components into VS Code's UI including sidebar panels, status bar, and diagnostics
- Manages the lifecycle of all extension services from activation through runtime operations

**Commands:**
- `extension.analyzeWorkspace`: Analyze entire workspace to generate comprehensive code insights across all files
- `extension.analyzeCurrentFile`: Analyze only the currently open file for focused insights
- `extension.copyAllInsights`: Copy all generated insights to clipboard for sharing or documentation
- `extension.copyInsightsForFile`: Copy insights for a specific file to clipboard
- `extension.copyInsight`: Copy an individual insight item to clipboard
- `extension.clearCache`: Clear cached analysis data to force fresh analysis
- `extension.clearAllData`: Clear all extension data including cache and settings
- `extension.openSettings`: Open extension configuration settings
- `extension.openLatestReport`: View the most recent analysis report
- `extension.openLatestUnitTestReport`: View the most recent unit test report
- `extension.switchProvider`: Switch between different LLM providers (OpenAI, Anthropic, etc.)
- `extension.copyMenuStructure`: Copy the menu structure to clipboard
- `extension.showProviderStatus`: Display current LLM provider configuration and status
- `extension.navigateToProductItem`: Navigate to a specific product item in the codebase
- `extension.navigateToAnalysisItem`: Navigate to a specific analysis item
- `extension.showProductItemDetails`: Show detailed information panel for a product item
- `extension.showInsightDetails`: Show detailed information panel for an insight
- `extension.showUnitTestDetails`: Show detailed information panel for a unit test item

### src/domain/formatters (other)

The formatters module transforms raw product documentation and AI-generated insights into polished, human-readable Markdown format. It takes structured data about a codebase and converts it into comprehensive documentation that users can easily read, understand, and export.

Users interact with this module when viewing generated documentation in their editor or exporting it to files. The module automatically organizes content into logical sections including product overviews, usage instructions segmented by interface type, technical architecture details, and AI insights. Each document includes a timestamp for version tracking and follows a consistent formatting structure.

The primary workflow involves receiving structured documentation data, applying formatting rules to create well-organized Markdown sections, and outputting the result for display or export. This enables users to quickly access professional-quality documentation about their codebase without manual formatting effort.

**Capabilities:**
- Format product documentation into human-readable Markdown with organized sections
- Generate timestamped documentation exports for version tracking
- Structure AI-generated insights into accessible, readable formats
- Organize usage information by interface type (GUI, CLI, API)
- Present technical architecture and design patterns in clear sections
- Format integration details and dependency information
- Display code quality assessments and improvement suggestions

### src/domain/handlers (other)

The Navigation Handler module enables seamless code navigation throughout the codebase from the product navigator and analysis viewer interfaces. Users can click on various code elements (files, functions, endpoints, entry points) to instantly open and position their cursor at the exact location in the editor.

This module orchestrates the complete navigation workflow: when a user selects an item in the navigator, the handler opens the corresponding file in the editor, positions the cursor at the relevant line number, and highlights the target code element. It supports navigation to multiple code artifact types including standalone files, function definitions, API endpoint implementations, and application entry points. The handler provides visual feedback through code previews and displays helpful error messages when files cannot be located or opened, ensuring users always understand the navigation outcome.

**Capabilities:**
- Navigate to specific files in the codebase by clicking navigator items
- Jump to and highlight function definitions within files
- Navigate to API endpoint implementations in the code
- Navigate to application entry points with automatic cursor positioning
- Preview code details and locations for selected items
- Open files at specific line numbers with cursor positioning
- Receive error notifications when navigation fails

### src/domain/prompts (other)

The prompts module serves as the central prompt engineering layer that enables high-quality AI-powered code analysis, documentation, testing, and refactoring capabilities. It provides standardized prompt templates and builders that structure requests to LLMs for various software development tasks, ensuring consistent and contextually-rich AI responses across the application.

Users interact with this module indirectly through features like architecture analysis, documentation generation, test creation, and refactoring suggestions. When a user requests any of these capabilities, the module constructs detailed prompts that include relevant code context, dependency information, and specific instructions to guide the LLM toward producing actionable results. For refactoring tasks, the module generates prompts that yield step-by-step migration plans with before/after code examples, while for testing, it creates prompts that produce complete test suites with proper setup, assertions, and edge case coverage.

The module supports a workflow where raw codebase data is transformed into structured prompts that maximize LLM understanding and output quality. This includes providing function-level analysis context, dependency mappings, architecture patterns, and specific formatting requirements. The result is more accurate architecture insights, better quality documentation, more comprehensive test coverage recommendations, and practical refactoring guidance that developers can immediately apply to improve their codebase.

**Capabilities:**
- Generate structured prompts for LLM-based architecture analysis of codebases
- Create prompts for automated documentation generation from code analysis
- Build prompts for comprehensive test planning and test code generation
- Generate detailed refactoring recommendations with extraction plans and migration steps
- Produce context-aware prompts that help LLMs understand code purpose and dependencies
- Create test setup configuration prompts based on codebase characteristics
- Generate prioritized test plans with coverage targets and test case specifications

### src/domain/services (other)

The services module provides core infrastructure services that enhance the extension's responsiveness and intelligence. It enables automatic monitoring of workspace changes, ensuring that features like product documentation and insights stay synchronized with the actual codebase without requiring manual refresh actions.

The module supports advanced iterative analysis workflows where AI-powered features can request additional files or search results across multiple conversation rounds, automatically fetching context up to a maximum number of iterations. This enables more thorough and context-aware analysis without overwhelming the system.

For testing capabilities, the module automatically detects test frameworks (Jest, Mocha, Vitest, Pytest) from project configuration files and identifies missing dependencies or setup issues. This eliminates the need for manual test configuration and helps users quickly understand what's required to get their test environment working properly.

**Capabilities:**
- Automatic file system monitoring and change detection across the workspace
- Real-time updates when project files are created, modified, or deleted
- Iterative LLM analysis sessions that can request additional context across multiple rounds
- Automatic test framework detection and configuration validation
- Missing test dependency identification without manual configuration
- Intelligent file and search result fetching during analysis iterations

### src/domain/services/testing (tests)

This module provides comprehensive AI-powered test automation capabilities for software projects. It enables users to automatically generate, execute, and maintain unit tests without manual intervention. The workflow begins with test planning, where the system analyzes code to identify testable functions and prioritize them based on complexity and importance. Users receive a detailed test plan showing which functions need testing and strategic recommendations based on their codebase architecture.

Once planning is complete, the module can automatically generate test code using AI, processing functions in small batches and providing progress updates throughout the generation process. The system intelligently detects the project's test environment, including programming language, testing framework (Jest, Pytest), and configuration files, ensuring generated tests match the project's conventions. After generation, tests are automatically executed with detailed reporting of passed, failed, and error counts.

The module includes a self-healing capability that automatically validates and fixes failing tests. When tests fail, the system uses AI analysis to understand the failure and regenerate corrected test code, repeating this process until tests pass or a maximum number of attempts is reached. Users receive comprehensive reports throughout the entire lifecycle, from initial planning through final validation, with all progress, results, and recommendations displayed in real-time. Test plans and configurations are persisted in the .skyway/testing directory for ongoing reference and iteration.

**Capabilities:**
- Automatically analyze codebases to identify testable functions and create prioritized test plans
- Generate unit tests incrementally using AI, creating test code for functions in small batches
- Detect and configure test environments including frameworks, directories, and configuration files
- Execute test suites (Jest, Pytest) and capture detailed results with pass/fail statistics
- Automatically validate and fix failing tests using AI-powered analysis and code regeneration
- Provide real-time progress updates during test generation, execution, and validation
- Save test plans and recommendations to the workspace for future reference

### src/domain/services/testing/types (tests)

This module provides comprehensive type definitions for the entire test generation and execution lifecycle. It defines the data structures that enable users to track test workflows from initial setup through planning, generation, validation, and completion. Users can monitor which functions are being tested, view their validation status, and track progress through each phase of the testing process.

The module supports detailed visibility into test execution results, providing statistics on passed, failed, and errored tests along with actionable recommendations for improvement. Users receive structured feedback about their test environment setup, including information about testing frameworks, required dependencies, configuration files, and existing test infrastructure. Error handling capabilities allow users to review detailed failure information including stack traces and retry attempts, enabling effective debugging and test quality improvement.

**Capabilities:**
- Track test generation workflow through multiple phases (setup, planning, generation, validation, complete)
- Monitor test plan creation with function grouping and validation state tracking
- View comprehensive test execution results with pass/fail/error statistics
- Access detailed test reports with summary metrics and pass rates
- Receive actionable recommendations for improving test quality
- Review test setup configuration including framework, dependencies, and config files
- Track test setup execution results including file creation and dependency installation
- Monitor existing test environment detection (package.json, tsconfig, jest config, test directories)
- View error details with test names, error messages, and stack traces
- Track test failure retry attempts and error recovery

### src/infrastructure/fileSystem (other)

This module provides a high-performance file system layer that optimizes how the extension reads and processes files. It caches file contents in memory so that when the same file is accessed multiple times, subsequent reads are nearly instantaneous. The cache automatically invalidates when files are modified on disk, ensuring users always see up-to-date content without manual intervention.

The module includes intelligent filtering that automatically excludes common non-source directories like node_modules, .git, dist, build, coverage, and IDE configuration folders. This prevents the extension from wasting time processing files that users typically don't want to analyze. When working with multiple files, the module processes them in parallel to maximize performance and reduce wait times.

Users experience faster extension responses when navigating code, analyzing projects, or performing bulk operations. The combination of caching and parallel processing means that repetitive tasks complete quickly, while the automatic cache invalidation ensures data accuracy. Error handling is built-in, so individual file failures don't crash the entire operation.

**Capabilities:**
- Automatically caches file contents to speed up repeated file access across the extension
- Intelligently detects when files change on disk and refreshes cached content automatically
- Filters out unwanted directories and files (node_modules, .git, dist, build, etc.) from file operations
- Processes multiple files in parallel for faster bulk operations
- Handles file processing errors gracefully without disrupting the extension

### src/infrastructure/persistence (other)

The persistence module provides comprehensive storage and retrieval capabilities for all AI-generated analysis results within the workspace. It manages the lifecycle of documentation artifacts by saving them to an organized .shadow directory structure, ensuring that product documentation, architecture insights, and summaries are preserved with proper timestamps and versioning.

Users benefit from automatic persistence of their analysis sessions, with documentation saved to .shadow/docs and insights stored in .shadow/insights, each in timestamped subdirectories. The module handles both incremental updates and full documentation consolidation, allowing teams to track how their understanding of the codebase evolves over time.

The module creates consolidated summary files that combine results from multiple analyses, making it easy to review comprehensive findings at a glance. All stored artifacts maintain their timestamps, enabling users to trace the history of their documentation efforts and compare different analysis iterations.

**Capabilities:**
- Persistent storage of AI-generated product documentation in the workspace
- Archival of architecture insights and analysis results with timestamps
- Generation of consolidated summary files combining multiple analyses
- Incremental documentation updates with version tracking
- Organized storage structure in .shadow directory for all analysis artifacts

### src/infrastructure (other)

The infrastructure module provides a centralized progress notification service that keeps users informed during long-running operations. It delivers a consistent user experience by displaying progress indicators with customizable titles, status messages, and cancel functionality.

Users interact with this module passively through progress notifications that appear automatically when operations begin. The service displays real-time updates showing the current status of tasks, and users can cancel operations at any time using the cancel button in the notification. Progress can be tracked visually in multiple locations including the notification area and status bar, ensuring users always know when the application is working on their behalf.

This module serves as the foundation for all progress-related UI feedback in the application, standardizing how operations communicate their status to users and enabling a predictable, user-friendly experience across different features and workflows.

**Capabilities:**
- Display standardized progress notifications during long-running operations
- Show real-time progress updates with titles and status messages
- Allow users to cancel ongoing operations through the notification interface
- Track incremental progress across different UI locations (notification area, status bar)
- Provide consistent progress feedback across all application operations

## File-Level Documentation

*Detailed documentation for 50 files*

### jest.config.js

**Role:** Core Logic

**Purpose:** Configures Jest testing framework for TypeScript unit tests with coverage reporting and module resolution settings

**User Actions:**
- No direct user-facing actions - this is a development configuration file

**Key Functions:**
- `testMatch`: Identifies test files to run based on naming patterns
  - Inputs: File path patterns
  - Outputs: Array of test file paths matching **/__tests__/**/*.ts or **/*.spec.ts or **/*.test.ts
- `transform`: Converts TypeScript files to JavaScript for test execution
  - Inputs: TypeScript files with .ts extension
  - Outputs: Transpiled JavaScript with ES2020 target and CommonJS modules
- `collectCoverageFrom`: Specifies which source files to include in code coverage analysis
  - Inputs: Source file patterns
  - Outputs: Coverage metrics excluding test files, type definitions, test utilities, and mocks
- `moduleNameMapper`: Redirects VSCode module imports to mock implementation during tests
  - Inputs: Module import requests for 'vscode'
  - Outputs: Mock VSCode module from src/test/__mocks__/vscode.ts

### src/ai/llmRateLimiter.ts

**Role:** Core Logic

**Purpose:** Prevents LLM API requests from exceeding rate limits by tracking and throttling requests per provider

**User Actions:**
- API requests are automatically throttled to prevent hitting rate limits
- Requests may be delayed or rejected when rate limits are approached
- Different LLM providers (OpenAI, Claude) have different rate limits applied

**Key Functions:**
- `constructor`: Initializes rate limiter with default limits (OpenAI: 60 req/min, Claude: 50 req/min)
  - Inputs: none
  - Outputs: RateLimiter instance
- `configure`: Sets custom rate limit configuration for a specific LLM provider
  - Inputs: provider (openai or claude), config (maxRequests, windowMs)
  - Outputs: void
- `canMakeRequest`: Checks if a new request can be made without exceeding rate limits
  - Inputs: provider (openai or claude)
  - Outputs: boolean - true if request is allowed
- `recordRequest`: Records a request timestamp to track usage against rate limits
  - Inputs: provider (openai or claude)
  - Outputs: void

### src/ai/llmResponseParser.ts

**Role:** Core Logic

**Purpose:** Parses LLM text responses into structured data objects for file summaries, module summaries, and product documentation

**User Actions:**
- Receives structured analysis results from AI that describe code files in plain language
- Gets organized information about what code files do from a user perspective
- Views parsed product documentation with user-facing features and benefits

**Key Functions:**
- `parseFileSummary`: Converts LLM response text into a FileSummary object with purpose, actions, and dependencies
  - Inputs: content (LLM response text), filePath, role
  - Outputs: FileSummary object
- `parseModuleSummary`: Extracts module-level summary information from LLM response
  - Inputs: content (LLM response text), moduleName
  - Outputs: ModuleSummary object
- `parseLLMInsights`: Parses LLM analysis into structured insights with themes and patterns
  - Inputs: content (LLM response text), context
  - Outputs: LLMInsights object
- `parseProductPurpose`: Extracts product purpose analysis from LLM response
  - Inputs: content (LLM response text)
  - Outputs: ProductPurposeAnalysis object
- `parseEnhancedProductDoc`: Generates enhanced product documentation from LLM response
  - Inputs: content (LLM response text), existingDocs
  - Outputs: EnhancedProductDocumentation object
- `extractSection`: Extracts a specific section of text from LLM response by section name
  - Inputs: content, sectionName
  - Outputs: Extracted text string
- `extractListSection`: Extracts a list/array of items from a section in LLM response
  - Inputs: content, sectionName
  - Outputs: Array of strings

### src/ai/llmRetryHandler.ts

**Role:** Core Logic

**Purpose:** Handles retry logic with exponential backoff for LLM API requests that fail due to rate limits, timeouts, or temporary errors

**User Actions:**
- When an AI operation fails temporarily, the system automatically retries the request instead of showing an immediate error
- Rate limit errors and network timeouts are handled gracefully with automatic retries
- Long-running AI operations have built-in resilience against temporary service disruptions

**Key Functions:**
- `executeWithRetry`: Executes an async operation with automatic retry on failure, using exponential backoff between attempts
  - Inputs: operation function to execute, optional retry configuration (maxRetries, delays, retryable error types, onRetry callback)
  - Outputs: The successful result of the operation, or throws the final error if all retries exhausted
- `isRetryableError`: Determines whether an error should trigger a retry based on error type and message content
  - Inputs: error object, list of retryable error patterns
  - Outputs: boolean indicating if the error is retryable

### src/ai/providers/ILLMProvider.ts

**Role:** Core Logic

**Purpose:** Defines the standard interface for integrating different AI language model providers (OpenAI, Claude, etc.) into the application

**User Actions:**
- User can interact with different AI providers (OpenAI, Claude, custom) transparently without knowing which one is being used
- User receives text responses from AI models
- User receives structured JSON data responses from AI models
- User can send messages with conversation history to AI models
- User can request file content or search patterns from AI models

**Key Functions:**
- `isConfigured`: Verifies if the AI provider has valid API keys and is ready to use
  - Inputs: none
  - Outputs: boolean indicating if provider is ready
- `sendRequest`: Sends a conversation to the AI model and receives a text response
  - Inputs: LLMRequestOptions (model, messages, temperature, maxTokens, responseFormat)
  - Outputs: Promise<LLMResponse> with content, finish reason, and model info
- `sendStructuredRequest`: Sends a request expecting structured JSON output, optionally validated against a schema
  - Inputs: LLMRequestOptions and optional schema
  - Outputs: Promise<StructuredOutputResponse<T>> with parsed data and optional file/grep requests
- `getName`: Returns the name identifier of the AI provider
  - Inputs: none
  - Outputs: string with provider name

### src/ai/providers/anthropicProvider.ts

**Role:** Core Logic

**Purpose:** Provides integration with Anthropic's Claude AI models for generating text responses and structured outputs

**User Actions:**
- User can interact with Claude AI models through the extension
- User receives AI-generated responses from Claude models (Sonnet, Opus, Haiku)
- User can configure Claude API key in settings to enable Claude provider
- User sees error messages when Claude API key is not configured
- User experiences AI conversations with system prompts and message history

**Key Functions:**
- `isConfigured`: Checks if Claude API key is configured and provider is ready to use
  - Inputs: none
  - Outputs: boolean indicating if provider is configured
- `getName`: Returns the identifier name for this provider
  - Inputs: none
  - Outputs: string 'claude'
- `sendRequest`: Sends a text generation request to Claude and returns the response
  - Inputs: LLMRequestOptions with model, messages, system prompt, max tokens
  - Outputs: LLMResponse with generated text content and token usage
- `sendStructuredOutputRequest`: Requests structured JSON output from Claude with validation and retry logic
  - Inputs: LLMRequestOptions with JSON schema requirements
  - Outputs: StructuredOutputResponse with parsed JSON data or validation error
- `initialize`: Sets up the Claude client with API key from configuration
  - Inputs: none (reads from config)
  - Outputs: none (initializes internal client)

### src/ai/providers/openAIProvider.ts

**Role:** Core Logic

**Purpose:** Provides OpenAI integration for making LLM requests with support for both standard and structured JSON responses

**User Actions:**
- User's prompts are sent to OpenAI's GPT models for AI-powered responses
- User receives AI-generated text responses based on their input
- User can get structured JSON responses when requesting specific data formats
- User experiences automatic API key validation before making requests

**Key Functions:**
- `initialize`: Sets up the OpenAI client with API key from configuration
  - Inputs: None (reads from config manager)
  - Outputs: void (initializes client)
- `isConfigured`: Checks if the provider has a valid API key and is ready to use
  - Inputs: None
  - Outputs: boolean indicating configuration status
- `getName`: Returns the provider identifier
  - Inputs: None
  - Outputs: string 'openai'
- `sendRequest`: Sends a chat completion request to OpenAI with messages and optional system prompt
  - Inputs: LLMRequestOptions (model, messages, systemPrompt, responseFormat)
  - Outputs: Promise<LLMResponse> with content and finish reason
- `sendStructuredOutputRequest`: Sends a request expecting structured JSON output and parses the response
  - Inputs: LLMRequestOptions with expected JSON format
  - Outputs: Promise<StructuredOutputResponse> with parsed JSON data

### src/ai/providers/providerFactory.ts

**Role:** Core Logic

**Purpose:** Creates and manages AI provider instances (OpenAI or Claude) based on user configuration

**User Actions:**
- Automatically connects to the AI provider selected in settings (OpenAI or Claude)
- Only shows available AI providers that have valid API keys configured
- Uses the default AI provider from configuration when generating responses

**Key Functions:**
- `getProvider`: Returns a specific AI provider instance (OpenAI or Claude)
  - Inputs: provider: 'openai' | 'claude'
  - Outputs: ILLMProvider instance
- `getCurrentProvider`: Returns the AI provider that is currently active in user settings
  - Inputs: none
  - Outputs: ILLMProvider instance
- `isProviderConfigured`: Checks if a provider has valid configuration (API key, etc.)
  - Inputs: provider: 'openai' | 'claude'
  - Outputs: boolean
- `getConfiguredProviders`: Returns list of all providers that have valid configuration
  - Inputs: none
  - Outputs: Array of provider names

### src/analysis/enhancedAnalyzer.ts

**Role:** Core Logic

**Purpose:** Performs deep code analysis by parsing abstract syntax trees (AST) to extract detailed function metadata including branches, dependencies, state mutations, and behavioral patterns.

**User Actions:**
- Receives enhanced code intelligence about function behavior and complexity
- Gets insights about function dependencies and side effects
- Sees analysis of conditional branches and code paths within functions
- Receives information about state mutations and variable modifications
- Gets behavioral hints about function characteristics (pure, async, recursive, etc.)

**Key Functions:**
- `analyzeFileMetadata`: Analyzes a code file and extracts enhanced metadata for all functions within it
  - Inputs: filePath (string), content (string), language (string), functions (FunctionInfo[])
  - Outputs: Map<string, FunctionMetadata> containing detailed metadata for each function
- `analyzeTypeScriptFunction`: Performs AST-based analysis on TypeScript/JavaScript functions to extract detailed metadata
  - Inputs: filePath (string), content (string), func (FunctionInfo), functionContent (string)
  - Outputs: FunctionMetadata object with branch info, dependencies, mutations, and behavioral hints
- `analyzeFunctionWithRegex`: Provides fallback regex-based analysis for languages other than TypeScript/JavaScript
  - Inputs: filePath (string), func (FunctionInfo), functionContent (string), language (string)
  - Outputs: FunctionMetadata object with basic analysis data
- `extractFunctionContent`: Extracts the source code content of a function based on line numbers
  - Inputs: content (string), startLine (number), endLine (number)
  - Outputs: String containing the function's source code

### src/analysis/functionAnalyzer.ts

**Role:** Core Logic

**Purpose:** Analyzes functions in large code files to extract detailed metadata including signatures, dependencies, and responsibilities for generating refactoring reports.

**User Actions:**
- Identifies functions in large files that may need refactoring
- Generates detailed function analysis reports showing what each function does
- Highlights function dependencies and relationships within the codebase
- Provides function signature information for understanding code structure

**Key Functions:**
- `analyzeFunctions`: Analyzes all functions in files exceeding a size threshold and extracts detailed information
  - Inputs: codeAnalysis (CodeAnalysis object), largeFileThreshold (optional number, default 500 lines)
  - Outputs: Promise<FunctionAnalysis[]> - array of detailed function analyses
- `analyzeFunction`: Performs detailed analysis on a single function to extract its metadata and relationships
  - Inputs: filePath (string), func (FunctionInfo), codeAnalysis (CodeAnalysis)
  - Outputs: Promise<FunctionAnalysis | null> - detailed function analysis or null if analysis fails
- `resolveFilePath`: Resolves the full file path for a given file in the code analysis
  - Inputs: filePath (string), codeAnalysis (CodeAnalysis)
  - Outputs: string - resolved full file path

### src/analysisViewer.ts

**Role:** GUI View

**Purpose:** Provides a tree view in VS Code that displays code analysis results including file statistics, functions, imports, and entry points.

**User Actions:**
- View a tree structure showing code analysis results organized by categories
- Browse file statistics (total files, lines of code, functions)
- Explore files grouped by directory in a hierarchical view
- See detailed information for each file including language, lines of code, and function count
- View list of all functions with their parameter counts and line numbers
- Browse import statements and dependencies for each file
- View entry points (main functions, test files, CLI tools) detected in the codebase
- Click on any item to navigate to the corresponding location in the source file
- See descriptive tooltips when hovering over items in the tree
- View 'No analysis available' message when analysis hasn't been run yet

**Key Functions:**
- `setAnalysis`: Updates the viewer with new analysis results and refreshes the tree view
  - Inputs: CodeAnalysis object or null
  - Outputs: void
- `refresh`: Triggers a refresh of the tree view to display updated data
  - Inputs: none
  - Outputs: void
- `getTreeItem`: Returns the tree item representation for VS Code to render
  - Inputs: AnalysisItem element
  - Outputs: vscode.TreeItem
- `getChildren`: Returns child items for a given tree node to build the hierarchy
  - Inputs: Optional AnalysisItem element (undefined for root)
  - Outputs: Promise of AnalysisItem array
- `getRootItems`: Creates top-level tree items showing statistics, files, functions, and entry points categories
  - Inputs: none
  - Outputs: Array of AnalysisItem
- `getStatisticsItems`: Generates tree items displaying code metrics like total files, LOC, and function counts
  - Inputs: none
  - Outputs: Array of AnalysisItem
- `getFilesItems`: Organizes files into directory groups for hierarchical browsing
  - Inputs: none
  - Outputs: Array of AnalysisItem representing directories and standalone files
- `getFileDetails`: Returns detailed information about a specific file including functions, imports, and exports
  - Inputs: AnalysisItem representing a file
  - Outputs: Promise of AnalysisItem array
- `getFunctionItems`: Creates tree items for all functions across the codebase with navigation links
  - Inputs: none
  - Outputs: Array of AnalysisItem
- `getEntryPointItems`: Lists detected entry points categorized by type (main, tests, CLI, etc.)
  - Inputs: none
  - Outputs: Array of AnalysisItem

### src/analyzer.ts

**Role:** Core Logic

**Purpose:** Defines interfaces and structures for code analysis results, including file metadata, function information, dependencies, test mappings, and code quality metrics.

**User Actions:**
- View total counts of files, lines, and functions in their codebase
- See which files are large and may need refactoring
- Identify orphaned files that aren't imported anywhere
- Discover entry points in the application
- Find duplicate code blocks across the codebase
- Understand function risk levels (high, medium, low)
- See which functions lack test coverage

**Key Functions:**
- `CodeAnalysis`: Main analysis result container with file counts, function metadata, dependencies, and test coverage
  - Inputs: N/A (interface)
  - Outputs: Structured data including totalFiles, totalLines, functions, imports, orphanedFiles, duplicates, testMapping
- `FunctionMetadata`: Detailed information about a function including parameters, branches, dependencies, and risk level
  - Inputs: N/A (interface)
  - Outputs: Function name, parameters with types, return type, visibility, branches, dependencies, state mutations, risk assessment
- `TestMapping`: Maps source files and functions to their test coverage
  - Inputs: N/A (interface)
  - Outputs: Source-to-test file mappings, function-to-test mappings, list of uncovered functions
- `DependencyInfo`: Identifies external dependencies like databases, HTTP calls, filesystem operations
  - Inputs: N/A (interface)
  - Outputs: Dependency name, type (db/http/filesystem/etc), whether internal or external, line number
- `EntryPoint`: Identifies application entry points and their types
  - Inputs: N/A (interface)
  - Outputs: File path, entry point type (main/cli/api/config/test), function name, description

### src/cache.ts

**Role:** Core Logic

**Purpose:** Manages persistent caching of code analysis results to improve performance and avoid redundant analysis

**User Actions:**
- Faster project loading when reopening a workspace (analysis loads from cache instead of re-analyzing)
- Automatic cache expiration after 24 hours ensures fresh analysis
- Cache clearing capability to force fresh analysis when needed

**Key Functions:**
- `constructor`: Initializes cache system with storage location and creates cache directory
  - Inputs: storagePath: string - where to store cache files
  - Outputs: AnalysisCache instance
- `get`: Retrieves cached analysis for a workspace if available and not expired
  - Inputs: workspaceRoot: string - path to workspace
  - Outputs: Promise<CodeAnalysis | null> - cached analysis or null if not found/expired
- `set`: Saves analysis results to cache with current timestamp
  - Inputs: workspaceRoot: string, data: CodeAnalysis - workspace path and analysis to cache
  - Outputs: Promise<void>
- `clear`: Removes all cached analysis files from the cache directory
  - Inputs: none
  - Outputs: Promise<void>
- `getCacheKey`: Generates a safe filesystem-compatible cache key from workspace path
  - Inputs: workspaceRoot: string - workspace path
  - Outputs: string - base64 encoded safe filename

### src/config/configurationManager.ts

**Role:** Core Logic

**Purpose:** Manages all Shadow Watch extension settings and notifies components when configuration changes occur.

**User Actions:**
- User enables or disables Shadow Watch extension
- User toggles analyze-on-save functionality
- User shows or hides inline hints in the editor
- User configures which LLM provider to use (OpenAI or Claude)
- User selects output format for LLM results (Cursor, ChatGPT, Generic, or Compact)
- User sets minimum severity threshold for displayed issues (error, warning, or info)
- User configures API keys and endpoints for LLM services
- User adjusts analysis settings like batch size and concurrency limits

**Key Functions:**
- `constructor`: Initializes configuration manager and sets up automatic configuration change detection
  - Inputs: none
  - Outputs: ConfigurationManager instance
- `onConfigurationChange`: Registers a callback function to be notified when any Shadow Watch configuration changes
  - Inputs: callback function
  - Outputs: void
- `removeConfigurationChangeListener`: Unregisters a previously registered configuration change callback
  - Inputs: callback function
  - Outputs: void
- `enabled (getter)`: Returns whether Shadow Watch extension is currently enabled
  - Inputs: none
  - Outputs: boolean
- `analyzeOnSave (getter)`: Returns whether automatic analysis should run when files are saved
  - Inputs: none
  - Outputs: boolean
- `showInlineHints (getter)`: Returns whether inline hints should be displayed in the editor
  - Inputs: none
  - Outputs: boolean
- `llmProvider (getter)`: Returns the selected LLM provider (OpenAI or Claude)
  - Inputs: none
  - Outputs: LLMProvider type
- `llmFormat (getter)`: Returns the selected output format for LLM analysis results
  - Inputs: none
  - Outputs: LLMFormat type
- `severityThreshold (getter)`: Returns the minimum severity level for displaying issues
  - Inputs: none
  - Outputs: SeverityThreshold type
- `validate`: Checks if the current configuration is valid and returns any errors found
  - Inputs: none
  - Outputs: ConfigValidationResult with valid flag and error list

### src/context/analysisContextBuilder.ts

**Role:** Core Logic

**Purpose:** Converts code analysis results into a structured format for LLM consumption and saves them to disk for documentation and future reference

**User Actions:**
- Code analysis results are automatically saved to the .shadow/docs directory in the workspace
- Analysis results include file statistics, entry points, and import relationships
- Analysis snapshots are timestamped for tracking when documentation was generated

**Key Functions:**
- `convertCodeAnalysisToContext`: Transforms CodeAnalysis format into AnalysisContext format for LLM service consumption
  - Inputs: analysis: CodeAnalysis object containing files, imports, entry points, and statistics
  - Outputs: AnalysisContext object with formatted file data, imports, entry points, orphaned files, and code metrics
- `saveCodeAnalysis`: Persists code analysis results to disk in JSON format with metadata
  - Inputs: analysis: CodeAnalysis object to save
  - Outputs: void (creates .shadow/docs/code-analysis.json file)

### src/diagnosticsProvider.ts

**Role:** Core Logic

**Purpose:** Manages and displays code insights as inline diagnostics (warnings, errors, info) in the VS Code editor

**User Actions:**
- Sees inline diagnostics (squiggly underlines) in code files where insights are detected
- Hovers over diagnostics to see insight descriptions and severity levels
- Views diagnostics in the Problems panel organized by file
- Sees diagnostics labeled as 'Shadow Watch' with unique insight IDs
- Diagnostics automatically clear and refresh when insights update

**Key Functions:**
- `updateDiagnostics`: Takes a list of insights and displays them as diagnostics across all affected files
  - Inputs: Array of Insight objects
  - Outputs: void (updates VS Code UI)
- `updateDiagnosticsForFile`: Updates diagnostics for a specific file URI
  - Inputs: VS Code URI and array of Insight objects
  - Outputs: void (updates VS Code UI)
- `clear`: Removes all diagnostics from all files
  - Inputs: none
  - Outputs: void
- `createDiagnostic`: Converts a single insight into a VS Code diagnostic object
  - Inputs: Insight object
  - Outputs: VS Code Diagnostic object
- `getSeverity`: Maps insight severity to VS Code diagnostic severity level
  - Inputs: Severity string from insight
  - Outputs: VS Code DiagnosticSeverity enum
- `dispose`: Cleans up the diagnostic collection when extension deactivates
  - Inputs: none
  - Outputs: void

### src/domain/bootstrap/commandRegistry.ts

**Role:** Core Logic

**Purpose:** Registers and manages all VS Code commands that users and developers can trigger in the extension

**User Actions:**
- Analyze entire workspace to get code insights
- Analyze currently open file
- Copy all insights to clipboard
- Copy insights for specific file
- Copy individual insight
- Clear cached analysis data
- Clear all extension data
- Open extension settings
- Open latest analysis report
- Open latest unit test report
- Switch between different LLM providers
- Copy menu structure
- View current provider status
- Navigate to product items in codebase
- Navigate to analysis items
- Show detailed information for product items
- Show detailed information for insights
- Show detailed information for unit test items

**Key Functions:**
- `register`: Registers all extension commands with VS Code and creates command handlers
  - Inputs: VS Code extension context and extension components
  - Outputs: Command handlers object for all registered commands
- `CommandHandlers interface`: Defines all available command handler functions in the extension
  - Inputs: Various - depends on specific command (workspace, files, items)
  - Outputs: Promise<void> for async operations

### src/domain/bootstrap/extensionBootstrapper.ts

**Role:** Core Logic

**Purpose:** Initializes and wires together all VS Code extension components during activation, setting up analyzers, viewers, providers, and event handlers

**User Actions:**
- Extension activates and displays status bar item showing analysis state
- Tree views appear in sidebar (Insights, Analysis, Product Navigator, Unit Tests, Reports)
- File changes trigger automatic re-analysis with visual feedback
- Diagnostics appear in Problems panel for code issues
- Status bar shows current analysis or generation status
- Reports viewer displays generated analysis reports
- Product Navigator shows navigable code structure
- Static analysis results appear in dedicated viewer

**Key Functions:**
- `bootstrap`: Main entry point that initializes all extension components and returns them as a structured object
  - Inputs: context: vscode.ExtensionContext (VS Code extension context)
  - Outputs: ExtensionComponents (object containing all initialized extension components)
- `createAnalyzer`: Creates and configures the code analyzer component
  - Inputs: context
  - Outputs: CodeAnalyzer instance
- `createInsightGenerator`: Creates the insight generator for producing code insights
  - Inputs: context
  - Outputs: InsightGenerator instance
- `createFileWatcher`: Sets up file watching to detect code changes and trigger re-analysis
  - Inputs: context, analyzer
  - Outputs: FileWatcher instance
- `createTreeProviders`: Initializes all tree view providers for different UI panels
  - Inputs: context, components
  - Outputs: Object containing tree providers and tree views
- `createStatusBarItem`: Creates the status bar indicator showing extension state
  - Inputs: none
  - Outputs: vscode.StatusBarItem
- `registerCommands`: Registers all VS Code commands provided by the extension
  - Inputs: context, components
  - Outputs: void
- `setupEventHandlers`: Configures event listeners for configuration changes and other events
  - Inputs: context, components
  - Outputs: void

### src/domain/formatters/documentationFormatter.ts

**Role:** Core Logic

**Purpose:** Formats product documentation and AI insights into human-readable Markdown format for display and export.

**User Actions:**
- View generated product documentation in Markdown format with timestamp
- See structured sections including Product Overview, What It Does, and User Perspective
- Read GUI, CLI, and API usage information organized by interface type
- View technical architecture documentation with structure and patterns
- See integration details and external dependencies
- Review AI-generated insights about the codebase in organized sections
- Read architecture overview with quality assessment
- See design patterns, security considerations, and scalability notes
- View suggested improvements and optimization opportunities
- Export documentation as formatted Markdown files

**Key Functions:**
- `formatEnhancedDocsAsMarkdown`: Converts enhanced product documentation object into formatted Markdown with sections for overview, features, user perspective, architecture, and integrations
  - Inputs: EnhancedProductDocumentation object containing product details
  - Outputs: Markdown-formatted string with hierarchical documentation structure
- `formatInsightsAsMarkdown`: Converts AI-generated insights into formatted Markdown with sections for architecture, design patterns, security, scalability, and improvements
  - Inputs: LLMInsights object containing AI analysis results
  - Outputs: Markdown-formatted string with structured insights and recommendations

### src/domain/handlers/navigationHandler.ts

**Role:** Core Logic

**Purpose:** Handles navigation to files, functions, endpoints, and other code locations when users interact with the product navigator and analysis viewer.

**User Actions:**
- Opens files in the editor when clicking on file items in the navigator
- Jumps to specific functions within files and highlights the function location
- Navigates to API endpoints and displays their location in code
- Shows error messages when files cannot be opened or locations cannot be found
- Displays code previews and details for selected items
- Navigates to entry points and highlights their definitions
- Opens and positions cursor at specific line numbers in files

**Key Functions:**
- `navigateToProductItem`: Navigates to a product navigation item (file, function, endpoint)
  - Inputs: ProductNavItem containing file path, function name, and type information
  - Outputs: Promise<void> - opens document and positions cursor
- `navigateToAnalysisItem`: Navigates to an analysis viewer item
  - Inputs: AnalysisItem with file and location details
  - Outputs: Promise<void> - opens document at specified location
- `navigateToEntryPoint`: Navigates to an entry point definition
  - Inputs: EntryPoint with file path and position information
  - Outputs: Promise<void> - opens file and highlights entry point
- `showItemDetails`: Displays detailed information about a selected item
  - Inputs: Item object with metadata and description
  - Outputs: void - shows details panel or quick pick with information
- `findFunctionInDocument`: Searches for a function definition within an open document
  - Inputs: TextDocument and function name string
  - Outputs: Position or Range where function is located, or undefined if not found


*... and 30 more files*
