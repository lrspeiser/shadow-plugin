# Product Documentation

*Generated: 11/20/2025, 8:29:45 PM (2025-11-21 04:29:45 UTC)*

---

## Product Overview

Shadow Watch is a Visual Studio Code extension that provides AI-powered code analysis and automated documentation generation for software development teams. It analyzes your codebase to identify code quality issues, generate comprehensive documentation, and provide intelligent refactoring recommendations. The extension continuously monitors your workspace, automatically detecting problems like high complexity functions, circular dependencies, orphaned code, and missing test coverage, then presents these findings through interactive visualizations and structured reports.

Users interact with Shadow Watch through VS Code's command palette, sidebar views, and inline editor annotations. The extension integrates with AI providers (OpenAI or Claude) to generate intelligent insights about your codebase architecture, produce product documentation, and create automated tests. All analysis results are presented through multiple interactive views including a problem diagnostics panel, hierarchical tree views for browsing insights, and a product navigator that shows your codebase structure organized by modules and components.

Shadow Watch enables development workflows focused on code quality improvement, technical debt management, and knowledge capture. It automatically saves all analysis results with timestamps, allowing teams to track code health over time and maintain comprehensive documentation without manual effort. The extension works continuously in the background, re-analyzing code when files change and keeping all views synchronized with the current codebase state.

## What It Does

- Automatically analyzes code quality and identifies issues like high complexity, large files, and circular dependencies
- Generates comprehensive product documentation and architecture insights using AI language models
- Creates interactive visualizations of code problems directly in the VS Code editor and Problems panel
- Provides hierarchical navigation of analysis results through multiple sidebar tree views
- Automatically generates unit tests for functions with AI-powered test planning and validation
- Detects and configures test frameworks (Jest, Mocha, Vitest, Pytest) without manual setup
- Exports analysis results in multiple formats optimized for AI assistants like Cursor and ChatGPT
- Tracks code coverage and identifies untested functions across your codebase
- Monitors file changes and automatically re-analyzes modified code
- Generates detailed refactoring recommendations with step-by-step implementation guidance
- Creates timestamped documentation archives to track codebase evolution over time
- Provides search capabilities for AI agents to explore and understand codebases

## User Perspective

### GUI

- Command palette commands for triggering workspace or file-specific analysis
- Interactive tree views in the sidebar showing analysis results, insights, and documentation hierarchy
- Visual problem indicators in the editor with color-coded severity levels
- Hover tooltips displaying detailed information about detected issues
- Click-to-navigate functionality from tree views to source code locations
- Status bar indicators showing analysis progress and extension state
- Real-time progress notifications during long-running operations with cancel buttons
- Problems panel integration displaying all detected code issues with jump-to-source links
- Webview panels for viewing detailed reports and documentation
- Context menus for quick access to analysis and documentation commands

### CLI

- VS Code command palette commands like 'Shadow Watch: Analyze Workspace'
- Commands for generating insights, clearing cache, and switching AI providers
- Export commands for saving analysis results to disk in various formats
- Test generation commands for creating automated unit tests
- Commands for navigating to specific code elements and viewing details

### API

- Integration with OpenAI API for GPT-based code analysis and documentation generation
- Integration with Anthropic Claude API for alternative AI-powered analysis
- Extensible provider system allowing integration of additional AI services
- File system watching API for detecting workspace changes
- Analysis result storage API for persisting documentation and insights

### CI/CD

- Can be integrated into CI/CD pipelines through VS Code automation
- Exports analysis results that can be consumed by automated quality gates
- Generates machine-readable JSON reports for integration with other tools
- Timestamps all analysis runs for tracking quality metrics over time

## Workflow Integration

- Code review preparation: Generate documentation and identify issues before submitting pull requests
- Technical debt management: Identify and prioritize refactoring opportunities based on complexity metrics
- Onboarding new team members: Provide AI-generated architecture documentation and codebase overviews
- Test coverage improvement: Automatically generate missing tests and validate they execute correctly
- Knowledge capture: Maintain up-to-date documentation that evolves with the codebase
- Quality monitoring: Track code health metrics across multiple analysis runs
- Refactoring planning: Get AI-generated step-by-step guidance for extracting complex functions
- Documentation maintenance: Keep product documentation synchronized with code changes

## Problems Solved

- Manual documentation becomes outdated quickly - Shadow Watch automatically generates and updates documentation as code changes
- Identifying code quality issues requires expertise - The extension automatically detects complexity, circular dependencies, and other problems
- Writing tests is time-consuming - AI-powered test generation creates comprehensive unit tests automatically
- Understanding large codebases is difficult - Interactive navigation and AI-generated insights make exploration easier
- Tracking code health over time requires manual effort - Timestamped analysis runs create a historical record
- Setting up test frameworks is complex - Automatic detection and configuration eliminates manual setup
- Refactoring complex code is risky - Detailed step-by-step plans reduce the chance of introducing bugs
- Finding relevant code quickly in large projects - Search and navigation tools help locate specific functions and modules

## Architecture Summary

Shadow Watch follows a modular architecture organized around core domains: analysis, documentation generation, testing automation, and user interface presentation. The analysis domain performs deep code inspection using TypeScript/JavaScript AST parsing to extract function metadata, complexity metrics, and dependency relationships. This analysis data flows through a caching layer that stores results to avoid redundant processing, then feeds into insight generators that identify code quality issues and refactoring opportunities.

The documentation generation domain integrates with AI language model providers through an abstraction layer that supports both OpenAI and Claude. Rate limiting, retry handling, and response parsing components ensure reliable AI interactions. Documentation requests flow through a prompt building system that constructs specialized queries for different tasks (architecture analysis, test generation, refactoring guidance), then results are formatted into structured Markdown and persisted to timestamped storage directories.

The user interface architecture consists of multiple coordinated views: tree view providers for hierarchical data display, diagnostics providers for inline problem annotations, webview providers for rich content display, and a navigation handler for jumping between code locations. A file watching service monitors workspace changes and triggers appropriate updates across all views, while a progress service provides consistent user feedback during long-running operations. All components communicate through a command registry that maps user actions to appropriate handlers, creating a cohesive user experience across the extension.

## Module Documentation

### . (other)

This module establishes the testing infrastructure for the project by configuring Jest as the testing framework. It enables developers to write and execute TypeScript tests with proper module resolution, transformation, and coverage reporting.

The configuration supports developers in validating code quality and functionality through automated testing. It defines how test files are discovered, how TypeScript code is transformed for execution, and how coverage metrics are collected and reported. This ensures consistent testing practices across the development workflow.

While this is a configuration module with no direct user-facing features, it is essential for the development process, enabling quality assurance through automated testing, continuous integration pipelines, and code coverage analysis.

**Capabilities:**
- Provides standardized Jest testing environment for TypeScript-based tests
- Enables code coverage tracking and reporting across the codebase
- Supports module path resolution and TypeScript transformation during test execution
- Configures test file discovery patterns and execution environment

### src/ai (other)

This module provides robust infrastructure for reliable AI interactions throughout the documentation generation process. It acts as a resilient middleware layer between the application and LLM providers (OpenAI, Claude), ensuring that AI requests complete successfully even in the face of rate limits, network issues, and temporary service disruptions.

Users benefit from automatic rate limiting that prevents API quota exhaustion, intelligent retry logic that handles transient failures without manual intervention, and smart response parsing that extracts structured data from AI-generated text. When AI requests fail due to rate limits or timeouts, the system automatically waits and retries with exponential backoff, while non-recoverable errors fail immediately to save time.

The module enables seamless AI-powered documentation workflows by handling the complexity of API communication, allowing users to generate file summaries, module summaries, and product documentation without worrying about rate limits, parsing errors, or temporary service interruptions. All AI interactions are automatically throttled, retried when appropriate, and parsed into usable structured formats.

**Capabilities:**
- Automatically rate limits AI API requests to stay within OpenAI and Claude provider limits
- Intelligently retries failed AI requests with exponential backoff for transient errors
- Parses AI-generated responses into structured documentation formats
- Provides graceful error handling and fallback mechanisms for AI interactions
- Ensures smooth and reliable AI-powered documentation generation without manual intervention

### src/ai/providers (other)

This module serves as the AI provider abstraction layer, enabling the application to integrate with multiple AI language model services through a unified interface. Users interact with AI capabilities without needing to know which provider (OpenAI or Claude) is being used behind the scenes. The module automatically instantiates the appropriate provider based on system configuration and API key availability.

Users can generate both free-form text responses and structured JSON outputs from AI models. When requesting AI assistance, prompts are routed through the configured provider, which handles the underlying API communication and response formatting. The module ensures reliable operation by validating provider configuration, managing timeouts, and providing clear error messages when API keys are missing or invalid.

The provider factory pattern allows seamless switching between AI services, giving system administrators flexibility in choosing their preferred AI backend while maintaining consistent functionality for end users. All AI interactions are protected by a 5-minute timeout to prevent indefinite waiting, and the system gracefully handles scenarios where providers are not properly configured.

**Capabilities:**
- Provides unified interface for multiple AI language model providers (OpenAI and Anthropic Claude)
- Generates text responses from AI models based on user prompts
- Produces structured JSON outputs from AI models using defined schemas
- Automatically selects and initializes the configured AI provider
- Handles provider configuration validation and error reporting
- Enforces 5-minute timeout protection for long-running AI requests

### src/analysis (other)

The analysis module provides comprehensive code analysis capabilities for TypeScript and JavaScript projects. It enables users to gain deep insights into their codebase by examining function-level details, complexity metrics, and inter-function relationships. This module is essential for understanding code quality, identifying refactoring opportunities, and mapping dependencies.

Users can leverage this module to analyze individual functions or entire files to understand code complexity through branch analysis, track how functions interact through dependency mapping, and identify potential code smells. The module extracts metadata such as function signatures, parameters, return types, and behavioral characteristics like state mutations and side effects.

The typical workflow involves passing source code files to the analyzers, which parse the Abstract Syntax Tree (AST) to extract function metadata. The enhanced analyzer provides detailed complexity metrics and behavioral insights, while the function analyzer focuses on relationships and refactoring candidates. Together, these tools help developers make informed decisions about code maintenance, refactoring priorities, and architectural improvements.

**Capabilities:**
- Analyze TypeScript and JavaScript code files to extract detailed function metadata
- Calculate code complexity metrics including branch complexity and decision points
- Map function dependencies and relationships across the codebase
- Identify state mutations and side effects in functions
- Extract behavioral hints and function responsibilities
- Detect functions that may need refactoring based on size and complexity
- Track which functions are called by many other parts of the code (dependents)
- Parse function signatures and parameter information

### src (other)

This module provides a comprehensive VS Code extension for AI-powered code analysis and documentation. Users can analyze their entire codebase or individual files to understand structure, quality, and architecture. The extension automatically detects code issues like large files, high complexity functions, circular dependencies, orphaned code, and missing test coverage, presenting findings through visual diagnostics, interactive tree views, and structured reports.

The extension integrates with LLM providers to generate intelligent architecture insights, product documentation, and refactoring suggestions. Users see real-time analysis updates through multiple interactive views including an analysis browser, insights tree, and product navigator. All analysis results can be exported in various formats optimized for different LLM interfaces. The extension features automatic file watching that triggers analysis on save, with intelligent caching to avoid redundant processing.

Key workflows include: (1) Analyzing workspace to get comprehensive code health metrics and insights, (2) Viewing diagnostics as color-coded problems in the editor with hover tooltips, (3) Browsing hierarchical analysis results through sidebar tree views with click-to-navigate functionality, (4) Generating AI-powered documentation and architecture insights with progress tracking, (5) Exporting results in formats optimized for AI assistants like Cursor or ChatGPT, and (6) Navigating codebase through product navigator showing modules, components, and entry points.

**Capabilities:**
- Automated code analysis and quality assessment across entire workspace or individual files
- AI-powered architecture insights and documentation generation using LLM providers (OpenAI/Claude)
- Real-time code diagnostics and visual problem indicators in editor and Problems panel
- Interactive tree views for browsing analysis results, insights, and documentation hierarchy
- Automatic file watching and analysis on save with intelligent caching
- Code health monitoring including complexity metrics, orphaned files, and duplicate detection
- Test coverage tracking and identification of uncovered functions
- Multiple export formats (Markdown, JSON) for analysis results and documentation
- LLM-optimized formatting for integration with Cursor AI, ChatGPT, and other AI assistants
- Intelligent file access and search capabilities for LLM agent exploration

**Commands:**
- `shadow-watch.analyzeWorkspace`: Analyze entire workspace to extract code structure, metrics, and quality insights
- `shadow-watch.analyzeFile`: Analyze currently active file to generate file-specific insights
- `shadow-watch.refreshInsights`: Refresh the insights tree view to show updated analysis results
- `shadow-watch.clearCache`: Clear analysis cache to force fresh analysis of workspace
- `shadow-watch.exportAnalysis`: Export analysis results in selected format (Markdown or JSON)
- `shadow-watch.generateProductDocs`: Generate AI-powered product documentation from codebase analysis
- `shadow-watch.generateArchitectureInsights`: Generate AI-powered architecture insights and design pattern analysis
- `shadow-watch.viewInEditor`: Open analysis results or documentation in editor view
- `shadow-watch.navigateToCode`: Jump to specific code location from tree view item

### src/config (other)

The config module serves as the central configuration hub for Shadow Watch, providing type-safe access to all extension settings and automatically detecting when users modify preferences. It acts as the bridge between VS Code's settings system and the extension's runtime behavior, ensuring that configuration changes immediately affect how the extension operates.

Users interact with this module indirectly through VS Code's settings interface. When they modify Shadow Watch preferences, the configuration manager detects these changes and notifies relevant extension components. This enables workflows like enabling 'analyze on save' to automatically trigger security analysis whenever a file is saved, adjusting diagnostic severity thresholds to filter which security issues are displayed in the editor, or switching between OpenAI and Claude as the AI provider.

The module manages critical settings that control the entire user experience: whether inline security hints appear in the editor, how long analysis operations can run before timing out, which severity level of issues should be shown as VS Code diagnostics, and how analysis results are formatted in the output panel. All configuration access is type-safe, preventing runtime errors from misconfigured settings and ensuring consistent behavior across the extension.

**Capabilities:**
- Centralized management of all Shadow Watch extension settings with type-safe access
- Automatic detection and propagation of configuration changes across the extension
- Control of analysis behavior including auto-trigger on file save and timeout limits
- Customization of editor display features like inline hints and diagnostic severity filtering
- Selection and configuration of AI provider (OpenAI or Claude) for security analysis
- Control of analysis output format and presentation
- Real-time configuration updates without requiring extension reload

### src/context (other)

This module bridges the gap between code analysis and AI language model services by transforming raw analysis results into a structured format optimized for LLM consumption. When code analysis is performed, this module automatically processes the results and saves them to the workspace in a standardized context format.

The module manages persistent storage of analysis data within a dedicated .shadow/docs directory structure in your workspace. Each analysis result is saved with comprehensive metadata including generation timestamps, ensuring you have a historical record of code analysis for reference and tracking purposes. This persistent storage enables AI services to access and utilize analysis data efficiently without requiring re-analysis.

From a user perspective, this module operates automatically in the background - whenever code analysis occurs, the results are seamlessly converted and stored without manual intervention. The stored context data becomes available for AI-powered features like code explanations, refactoring suggestions, and intelligent code completion, providing a foundation for enhanced developer productivity through AI assistance.

**Capabilities:**
- Automatically converts code analysis results into LLM-compatible context format
- Persists analysis data to workspace storage for future reference
- Generates timestamped metadata for tracking analysis provenance
- Stores analysis documentation in a structured .shadow/docs directory
- Provides formatted context data suitable for AI-powered code understanding

### src/domain/bootstrap (other)

The bootstrap module serves as the initialization and command coordination layer for the code analysis extension. It handles the complete startup sequence when the extension activates in VS Code, setting up all necessary UI components, registering commands, and preparing the extension for user interaction. This module acts as the entry point that transforms the extension from an inactive state to a fully operational code analysis tool.

The module provides comprehensive command registration covering the entire extension workflow - from analyzing code (workspace-wide or single files) to managing insights, viewing reports, switching between AI providers, and navigating analyzed code structures. Users interact with these commands through the VS Code command palette, context menus, and custom UI elements like tree views and status bars.

Through this module, users gain access to a complete suite of code analysis capabilities including generating insights, copying analysis results, clearing cached data, viewing detailed reports, managing unit test information, accessing static analysis results, and navigating through their codebase using the product navigator. The module ensures all these features are properly initialized and ready to respond to user actions from the moment the extension activates.

**Capabilities:**
- Initialize and activate the VS Code extension with all required components
- Register and manage all extension commands for code analysis operations
- Set up UI components including status bar, tree views, and diagnostics
- Enable automatic file watching for continuous analysis
- Provide command palette access to all extension features
- Configure multiple sidebar views for insights, reports, and navigation
- Manage LLM provider switching and configuration

**Commands:**
- `analyzeWorkspace`: Analyze the entire workspace to generate comprehensive code insights
- `analyzeCurrentFile`: Analyze only the currently active file in the editor
- `copyAllInsights`: Copy all generated analysis insights to the clipboard
- `copyFileInsights`: Copy insights for a specific file to the clipboard
- `copyInsightItem`: Copy a single insight item to the clipboard
- `clearCache`: Clear cached analysis data to force fresh analysis
- `clearAllData`: Clear all extension data including cache and settings
- `openSettings`: Open the extension settings panel
- `viewAnalysisReport`: View the latest analysis report
- `viewUnitTestReport`: View the latest unit test report
- `switchLLMProvider`: Switch between different LLM providers (OpenAI, Anthropic, etc.)
- `viewMenuStructure`: View the menu structure of the analyzed codebase
- `checkProviderStatus`: Check the current status of the active LLM provider
- `navigateToItem`: Navigate to a specific product or code item in the codebase
- `viewInsightDetails`: View detailed information about a specific insight
- `viewUnitTestDetails`: View detailed information about unit tests

### src/domain/formatters (other)

This module provides documentation formatting capabilities that transform technical analysis and product information into well-structured Markdown documents. It serves as the presentation layer for both product documentation and code analysis insights, ensuring consistent formatting and organization that makes complex technical information accessible to human readers.

Users receive documentation organized into logical sections including overview summaries, feature lists, user perspectives for different interaction modes (GUI, CLI, API), and detailed technical specifications. The module formats code analysis results by grouping file behaviors by their roles and types, making it easy to understand how different components work together. All output includes timestamps and follows a consistent structure that supports quick scanning and comprehension.

The formatting workflow takes raw analysis data and product information as input, then applies structured templates to produce Markdown documents suitable for technical documentation, developer guides, and system understanding. This enables teams to quickly generate readable documentation from automated code analysis and maintain consistent documentation standards across products.

**Capabilities:**
- Transforms raw product documentation into structured, human-readable Markdown format with consistent sections
- Formats LLM-generated code analysis insights into organized documentation with clear behavioral descriptions
- Organizes documentation by user perspective (GUI, CLI, API) to support different interaction patterns
- Structures technical details, features, and workflows into scannable sections with timestamps
- Presents file-by-file code behavior analysis grouped by role and type for easy comprehension
- Formats usage examples, configuration requirements, and deployment considerations into readable guides

### src/domain/handlers (other)

The Navigation Handler module provides comprehensive code navigation capabilities within the workspace. It enables users to seamlessly move between different code locations, whether they're files, functions, API endpoints, or other code elements that have been analyzed.

The module supports multiple navigation workflows: direct file opening in the editor, precise function location with automatic scrolling, and endpoint-to-implementation navigation. When users interact with analyzed code items, they can click to navigate to the source or view detailed information in a separate panel that displays signatures, parameters, and relationships.

Error handling is built into the navigation flow, providing clear feedback when files cannot be opened or navigation targets are unavailable. This makes code exploration intuitive and reliable, helping users understand and traverse their codebase structure efficiently.

**Capabilities:**
- Navigate to specific files in the workspace editor
- Jump to function definitions and scroll to their exact location in code
- Navigate to API endpoints and their implementations
- View detailed information panels about code elements including signatures and parameters
- Access entry points in the codebase through navigation items
- Display formatted details about analyzed code structures
- Handle navigation errors with informative error messages

### src/domain/prompts (other)

This module serves as the prompt engineering foundation for AI-powered code analysis and transformation. It constructs carefully designed prompts that guide large language models to analyze codebases, generate documentation, create tests, and recommend refactorings. Users interact with this module through the various AI-assisted features in the application, where it translates their code into structured queries that produce actionable insights.

The module supports multiple user workflows: documentation generation (from architecture analysis to product summaries), test creation (from test planning to implementation guidance), and code refactoring (from analysis to prescriptive extraction steps). Each workflow produces structured, consistent output that helps developers understand their codebase, improve test coverage, and maintain code quality through systematic refactoring.

By centralizing all prompt construction logic, the module ensures consistency across different AI-powered features while providing specialized templates for distinct tasks like configuration analysis, function extraction planning, and mock requirement identification. This enables users to leverage AI assistance for complex development tasks without needing to craft prompts themselves.

**Capabilities:**
- Generate AI prompts for comprehensive code analysis and architecture documentation
- Create structured prompts for automated test generation and test planning
- Build detailed refactoring recommendations with step-by-step extraction plans
- Extract product documentation and value propositions from codebases
- Produce file-level and module-level documentation summaries
- Analyze test configurations and recommend optimal testing strategies
- Generate prescriptive migration instructions for code reorganization

### src/domain/services (other)

This services module provides the core automation and intelligence layer that makes the extension reactive and context-aware. It handles three critical workflows: monitoring the file system for changes and triggering appropriate responses, managing iterative analysis sessions where the LLM can request additional files or search for patterns across multiple rounds until it has enough context, and automatically detecting and configuring test frameworks to ensure generated tests work without manual setup.

Users benefit from automatic change detection - when they create, modify, or delete files, the system automatically updates relevant views and features without manual refresh. When the LLM needs more information to complete a task, the incremental analysis service orchestrates multiple rounds of context gathering, dynamically including additional files and performing grep searches until the analysis is complete or reaches maximum iterations.

The test configuration service eliminates manual setup by detecting which testing framework is in use (Jest, Mocha, Vitest, or Pytest), identifying missing dependencies and configuration files, and providing setup guidance. This ensures that generated tests are immediately executable without requiring users to manually configure their test environment, creating a seamless test generation experience.

**Capabilities:**
- Automatic file system monitoring that detects when files are created, modified, or deleted
- Multi-round intelligent analysis that iteratively requests additional context until sufficient information is gathered
- Automatic test framework detection and configuration setup for Jest, Mocha, Vitest, and Pytest
- Event-driven architecture that triggers appropriate handlers when workspace files change
- Dynamic file and pattern searching across the codebase during analysis
- Zero-configuration test generation with automatic dependency and configuration detection

### src/domain/services/testing (tests)

This module provides a comprehensive AI-powered testing workflow that automates the entire testing lifecycle from environment setup through test generation, execution, and validation. Users can leverage LLM capabilities to automatically generate unit tests for their code functions, receive intelligent recommendations on which functions should be tested, and get prioritized test plans organized by testing areas such as core logic, edge cases, and integration points.

The module supports multiple programming languages (TypeScript, JavaScript, Python, Java, C++) and test frameworks (Jest, Mocha, Pytest, Vitest), automatically detecting the project's configuration and setting up the necessary test environment. During test generation, users receive incremental progress updates showing which functions are being tested and can view the generated test code along with execution results. The system executes tests in small batches to provide immediate feedback on test outcomes.

When tests fail, the module automatically attempts to fix them using LLM analysis, making multiple fix attempts if needed and providing detailed error messages and stack traces. Users can run tests for specific files or the entire workspace, view comprehensive test results including pass/fail counts, execution duration, and coverage information, all without requiring manual intervention for test creation or failure remediation.

**Capabilities:**
- Automated test generation for code functions using AI-powered analysis
- Intelligent test planning with prioritized recommendations based on code structure
- Automatic test environment detection and setup for multiple frameworks and languages
- Test execution across multiple test frameworks (Jest, Mocha, Pytest, Vitest)
- Automated test validation and fixing of failing tests using LLM analysis
- Real-time progress tracking during test generation and execution
- Test coverage analysis and reporting

**Workers:**
- Test Generation Workflow: Generates unit tests for code functions using LLM analysis
  - Flow: 1) User initiates test generation for a code file or function. 2) System analyzes code structure and generates tests incrementally. 3) Progress updates show which function is being tested (e.g., 'Generating test 5 of 20 for functionName'). 4) Tests are executed in small batches. 5) Results display generated test code, success/failure status, and execution outcomes for each function.
- Test Planning Workflow: Creates prioritized test plans using LLM-based code analysis
  - Flow: 1) User requests test recommendations for their codebase. 2) System analyzes code structure and complexity. 3) LLM generates prioritized list of functions that should be tested. 4) Results include confidence scores, rationale, and organization by testing areas (core logic, edge cases, integration points). 5) User can use recommendations to guide manual or automated test generation.
- Test Setup Workflow: Detects and configures test environment automatically
  - Flow: 1) System detects project programming language and existing test framework configuration. 2) Generates test setup plan with required dependencies and configuration files. 3) Executes setup by installing dependencies (npm/pip packages) and creating config files. 4) Verifies setup by running test command and checking for successful execution. 5) Reports setup status and any configuration issues.
- Test Validation and Fixing Workflow: Validates tests and automatically fixes failures
  - Flow: 1) Tests are executed in the workspace. 2) System captures test results including pass/fail counts and error messages. 3) For failing tests, LLM analyzes errors and generates fixes. 4) Fixed tests are re-executed automatically. 5) Multiple fix attempts are made if initial fixes don't resolve issues. 6) Final results show whether all tests pass and details of any remaining failures.
- Test Execution Workflow: Runs test suites and captures results
  - Flow: 1) User triggers test execution for specific file or entire workspace. 2) System detects test framework (Jest, Mocha, Pytest, Vitest) and runs appropriate test command. 3) Captures test output including pass/fail status, duration, and coverage. 4) Displays detailed error messages and stack traces for failures. 5) Notifies user of execution completion or timeout. 6) Presents comprehensive test results for analysis.

### src/domain/services/testing/types (tests)

This module provides comprehensive type definitions for the automated testing system, enabling users to track and monitor the entire test generation lifecycle. It defines the data structures that power test planning, generation, validation, and reporting capabilities throughout the application.

Users can monitor test generation progress through distinct phases, from initial setup through planning, generation, validation, and completion. The module supports tracking which functions are testable, which have been tested, and how they're prioritized. Users receive detailed feedback on test execution results, including pass/fail statistics, error details with stack traces, and overall test coverage metrics.

The type system enables users to review test setup plans showing required frameworks and dependencies, see which configuration files will be created, and get feedback on setup execution. Users can access comprehensive test reports that provide summary statistics, pass rates, and actionable recommendations for improving test coverage and quality.

**Capabilities:**
- Track automated test generation progress through multiple phases (setup, planning, generation, validation, completion)
- Monitor test coverage metrics showing total functions, testable functions, and tested functions
- View test execution results with pass/fail/error statistics and detailed error information
- Organize and prioritize functions for testing based on complexity and importance
- Validate generated tests to ensure they execute correctly
- Review comprehensive test reports with summary statistics and actionable recommendations
- Track test setup configuration including frameworks, dependencies, and generated files
- Monitor failed test generation attempts with detailed error diagnostics

### src/infrastructure/fileSystem (other)

This module provides high-performance file system operations for the application by combining intelligent caching and efficient batch processing. It dramatically reduces disk I/O by caching file contents in memory and automatically keeping the cache synchronized with file system changes, ensuring that multiple components can access the same files quickly without repeated disk reads.

The module offers a robust file processing framework that can handle large codebases efficiently. It automatically filters out non-source directories (node_modules, .git, dist, build, .shadow, coverage, .vscode, .idea) and processes multiple files simultaneously using parallel execution. The processing engine is fault-tolerant, logging errors for individual files while continuing to process the remaining files.

Users benefit from faster application responsiveness when analyzing or working with large projects, as the caching mechanism reduces latency for repeated file access, and the parallel processing capabilities significantly speed up operations that need to read or analyze many files at once. The module handles all the complexity of cache management and parallel execution automatically, requiring no manual intervention.

**Capabilities:**
- Intelligently caches file contents in memory to avoid redundant disk reads
- Automatically invalidates cache when files are modified, created, or deleted
- Provides a reusable framework for processing multiple files with built-in filtering
- Processes files in parallel for improved performance on large codebases
- Automatically excludes common non-source directories from processing
- Handles processing errors gracefully without stopping overall operations

### src/infrastructure/persistence (other)

The persistence module handles the automatic storage and organization of all documentation generated during codebase analysis. When you run an analysis, this module creates a timestamped directory structure under .shadow/docs that preserves the complete results of that analysis run. Each analysis session generates organized folders containing product documentation (one file per analyzed source file) and architecture insights (consolidated summaries).

The module ensures that all generated documentation is properly saved in markdown format, making it easy to review, compare across different analysis runs, and commit to version control. It automatically creates the necessary directory structure, handles file naming conventions, and provides feedback on what was saved and where. This allows you to maintain a historical record of your codebase documentation, track how your architecture evolves over time, and easily reference documentation from specific points in time.

Users don't need to interact directly with this module—it works automatically in the background whenever an analysis is performed. The timestamped folder structure means you never lose previous analysis results, and the organized layout makes it simple to find specific documentation files or compare insights across different analysis runs.

**Capabilities:**
- Automatically saves all analysis results to organized disk storage
- Creates timestamped directories for each analysis run to maintain history
- Organizes documentation into separate folders for product docs and architecture insights
- Generates markdown-formatted documentation files for easy reading and version control
- Provides progress summaries showing files processed and execution time
- Maintains a structured file hierarchy under .shadow/docs directory

### src/infrastructure (other)

The infrastructure module provides a centralized progress notification service that keeps users informed during long-running operations. It displays standardized progress indicators with clear titles and status messages, ensuring users understand what tasks are currently executing and their progress.

Users can interact with progress notifications by canceling operations when needed, using the cancellation button that appears in the notification. The service intelligently displays progress in appropriate locations within the interface, including the notification area for prominent alerts, the window status bar for less intrusive updates, and the source control view for version control operations.

This module standardizes how the application communicates ongoing work to users, creating a consistent experience across all features that require user feedback during processing. It handles the complexity of progress reporting while providing a simple interface for displaying status updates and respecting user cancellation requests.

**Capabilities:**
- Display progress notifications to users during long-running operations
- Allow users to cancel ongoing operations through interactive progress notifications
- Show progress indicators in multiple UI locations (notification area, window status, source control view)
- Provide consistent progress reporting with titles and status messages across the application
- Support both cancellable and non-cancellable progress notifications

## File-Level Documentation

*Detailed documentation for 50 files*

### jest.config.js

**Role:** Core Logic

**Purpose:** Configures Jest testing framework for TypeScript test execution with coverage reporting and module resolution.

**User Actions:**
- No direct user-visible actions - this is a testing configuration file

### src/ai/llmRateLimiter.ts

**Role:** Core Logic

**Purpose:** Manages rate limiting for LLM API requests to prevent exceeding provider rate limits

**User Actions:**
- User's AI requests are automatically throttled to prevent API rate limit errors
- User experiences smooth AI interactions without hitting rate limit errors from OpenAI or Claude
- User's rapid successive AI requests are controlled to stay within provider limits

**Key Functions:**
- `constructor`: Initializes rate limiter with default limits for OpenAI (60 req/min) and Claude (50 req/min)
  - Inputs: none
  - Outputs: RateLimiter instance
- `configure`: Sets custom rate limit configuration for a specific LLM provider
  - Inputs: provider (openai or claude), config (maxRequests and windowMs)
  - Outputs: void
- `canMakeRequest`: Checks if a new request can be made without exceeding the rate limit
  - Inputs: provider (openai or claude)
  - Outputs: boolean (true if request allowed, false if rate limited)
- `recordRequest`: Records timestamp of a completed request for rate limit tracking
  - Inputs: provider (openai or claude)
  - Outputs: void

### src/ai/llmResponseParser.ts

**Role:** Core Logic

**Purpose:** Parses and extracts structured data from LLM text responses into typed objects for file summaries, module summaries, and product documentation.

**User Actions:**
- Converts AI-generated text responses into structured documentation format
- Extracts meaningful information from AI responses even when JSON parsing fails
- Provides fallback text extraction when AI responses are not in expected format

**Key Functions:**
- `parseFileSummary`: Converts LLM response text into FileSummary object with file metadata, purpose, actions, and dependencies
  - Inputs: content (string), filePath (string), role (string)
  - Outputs: FileSummary object
- `parseModuleSummary`: Converts LLM response text into ModuleSummary object with module overview and file relationships
  - Inputs: content (string)
  - Outputs: ModuleSummary object
- `parseProductDocumentation`: Converts LLM response text into EnhancedProductDocumentation with complete product information
  - Inputs: content (string)
  - Outputs: EnhancedProductDocumentation object
- `parseLLMInsights`: Extracts LLM analysis insights about product behavior and architecture from response text
  - Inputs: content (string)
  - Outputs: LLMInsights object
- `parseProductPurposeAnalysis`: Extracts structured product purpose information from LLM response
  - Inputs: content (string)
  - Outputs: ProductPurposeAnalysis object
- `extractSection`: Helper that extracts a specific named section from text content
  - Inputs: content (string), sectionName (string)
  - Outputs: Extracted section text as string
- `extractListSection`: Helper that extracts a list of items from a named section in text
  - Inputs: content (string), sectionName (string)
  - Outputs: Array of strings

### src/ai/llmRetryHandler.ts

**Role:** Core Logic

**Purpose:** Handles automatic retries of failed LLM API requests with exponential backoff and intelligent error classification

**User Actions:**
- When LLM API requests fail temporarily, they automatically retry without user intervention
- Users experience fewer failures from rate limits, timeouts, and temporary network issues
- Failed requests wait progressively longer between retries to avoid overwhelming the API
- Non-recoverable errors fail immediately instead of wasting time retrying

**Key Functions:**
- `executeWithRetry`: Executes an async operation with automatic retry logic and exponential backoff
  - Inputs: operation function that returns a Promise, optional retry configuration (maxRetries, delays, error types, callback)
  - Outputs: Promise resolving to operation result along with number of attempts made
- `isRetryableError`: Determines if an error should trigger a retry or fail immediately
  - Inputs: error object, list of retryable error patterns
  - Outputs: boolean indicating whether the error is retryable

### src/ai/providers/ILLMProvider.ts

**Role:** Core Logic

**Purpose:** Defines the contract for integrating different AI language model providers (OpenAI, Claude, etc.) into the system

**User Actions:**
- User receives text responses from AI models through any configured provider
- User receives structured JSON responses from AI models for data parsing
- User gets appropriate error handling when AI provider is not configured

**Key Functions:**
- `isConfigured`: Checks if the AI provider has valid credentials and is ready to use
  - Inputs: none
  - Outputs: boolean indicating configuration status
- `sendRequest`: Sends a prompt with messages to the AI and gets back a text response
  - Inputs: LLMRequestOptions with model, messages, system prompt, temperature, max tokens
  - Outputs: LLMResponse with content string and metadata
- `sendStructuredRequest`: Sends a prompt and gets back parsed JSON data with optional follow-up requests
  - Inputs: LLMRequestOptions and optional JSON schema for validation
  - Outputs: StructuredOutputResponse with typed data and optional file/grep requests
- `getName`: Returns the identifier name of the provider
  - Inputs: none
  - Outputs: string with provider name

### src/ai/providers/anthropicProvider.ts

**Role:** Core Logic

**Purpose:** Provides integration with Anthropic's Claude AI models for text generation and structured output requests

**User Actions:**
- Sends prompts to Claude AI and receives text responses
- Generates structured JSON outputs from Claude based on schemas
- Receives error messages when Claude API is not configured
- Experiences 5-minute timeout for long-running requests

**Key Functions:**
- `isConfigured`: Checks if Claude API key is configured and provider is ready to use
  - Inputs: none
  - Outputs: boolean indicating configuration status
- `sendRequest`: Sends a text generation request to Claude with messages and system prompt
  - Inputs: LLMRequestOptions (messages, model, systemPrompt, maxTokens)
  - Outputs: LLMResponse with content and token usage
- `sendStructuredOutputRequest`: Requests Claude to generate output matching a specific JSON schema
  - Inputs: LLMRequestOptions with jsonSchema
  - Outputs: StructuredOutputResponse with parsed JSON object
- `getName`: Returns the provider identifier name
  - Inputs: none
  - Outputs: string 'claude'
- `initialize`: Sets up the Anthropic client with API key from configuration
  - Inputs: none
  - Outputs: void

### src/ai/providers/openAIProvider.ts

**Role:** Core Logic

**Purpose:** Provides integration with OpenAI's API to send chat completion requests and receive AI-generated responses

**User Actions:**
- Receives AI-generated text responses from OpenAI models (like GPT-4)
- Gets structured JSON responses when requesting formatted output
- Experiences timeout after 5 minutes if AI response takes too long
- Sees error messages when OpenAI API key is not configured

**Key Functions:**
- `initialize`: Sets up the OpenAI client with API key from configuration
  - Inputs: None
  - Outputs: void
- `isConfigured`: Checks if the provider has a valid API key and is ready to use
  - Inputs: None
  - Outputs: boolean indicating configuration status
- `getName`: Returns the provider identifier
  - Inputs: None
  - Outputs: string 'openai'
- `sendRequest`: Sends a chat completion request to OpenAI and returns the response
  - Inputs: LLMRequestOptions (model, messages, system prompt, response format)
  - Outputs: Promise<LLMResponse> with content, finish reason, and usage
- `sendRequestStructured`: Sends a request expecting structured JSON output and parses the result
  - Inputs: LLMRequestOptions with json_object response format
  - Outputs: Promise<StructuredOutputResponse> with parsed JSON data and raw content

### src/ai/providers/providerFactory.ts

**Role:** Core Logic

**Purpose:** Creates and manages AI language model provider instances (OpenAI and Claude) based on configuration

**User Actions:**
- AI responses come from the configured provider (OpenAI or Claude)
- System automatically uses the provider specified in settings
- AI features only work when at least one provider is properly configured with API keys

**Key Functions:**
- `getProvider`: Returns a provider instance for the specified AI service
  - Inputs: provider type ('openai' or 'claude')
  - Outputs: ILLMProvider instance for making AI requests
- `getCurrentProvider`: Returns the provider instance that matches the user's current configuration setting
  - Inputs: none (reads from config)
  - Outputs: ILLMProvider instance of the configured provider
- `isProviderConfigured`: Checks whether a specific provider has valid configuration and can be used
  - Inputs: provider type ('openai' or 'claude')
  - Outputs: boolean indicating if the provider is ready to use
- `getConfiguredProviders`: Returns a list of all providers that are properly configured and available
  - Inputs: none
  - Outputs: array of provider names that have valid configuration

### src/analysis/enhancedAnalyzer.ts

**Role:** Core Logic

**Purpose:** Provides deep code analysis capabilities by parsing TypeScript/JavaScript files to extract function metadata, including branch complexity, dependencies, state mutations, and behavioral hints

**User Actions:**
- Receives detailed analysis of code functions including complexity metrics
- Gets insights into function behavior and side effects
- Views branch analysis showing decision points in code
- Sees dependency relationships between functions and modules
- Obtains state mutation information showing what data changes

**Key Functions:**
- `analyzeFileMetadata`: Analyzes a file and extracts enhanced metadata for all functions including branches, dependencies, and mutations
  - Inputs: filePath: string, content: string, language: string, functions: FunctionInfo[]
  - Outputs: Promise<Map<string, FunctionMetadata>> - Map of function names to their detailed metadata
- `analyzeTypeScriptFunction`: Performs AST-based analysis on TypeScript/JavaScript functions to extract detailed structural and behavioral information
  - Inputs: filePath: string, content: string, func: FunctionInfo, functionContent: string
  - Outputs: Promise<FunctionMetadata> - Comprehensive function metadata
- `analyzeFunctionWithRegex`: Provides fallback regex-based analysis for non-TypeScript languages to extract basic function metadata
  - Inputs: filePath: string, func: FunctionInfo, functionContent: string, language: string
  - Outputs: FunctionMetadata - Basic function metadata
- `extractFunctionContent`: Extracts the source code content of a function given its start and end line numbers
  - Inputs: content: string, startLine: number, endLine: number
  - Outputs: string - The function's source code

### src/analysis/functionAnalyzer.ts

**Role:** Core Logic

**Purpose:** Analyzes functions in large code files to extract detailed metadata including signatures, dependencies, dependents, and responsibilities for refactoring reports.

**User Actions:**
- Identifies which functions in large files may need refactoring
- Shows function dependencies and relationships across the codebase
- Reveals which functions are called by many other parts of the code
- Displays function signatures and their responsibilities

**Key Functions:**
- `analyzeFunctions`: Analyzes all functions in large files to extract detailed information for refactoring
  - Inputs: codeAnalysis (full code analysis), largeFileThreshold (minimum lines, default 500)
  - Outputs: Array of FunctionAnalysis objects with detailed metadata
- `analyzeFunction`: Performs deep analysis on a single function to extract dependencies, dependents, and metadata
  - Inputs: filePath (file location), func (FunctionInfo), codeAnalysis (context)
  - Outputs: FunctionAnalysis object or null if analysis fails
- `resolveFilePath`: Resolves relative file paths to absolute paths for file system access
  - Inputs: filePath (relative path), codeAnalysis (for base directory)
  - Outputs: Absolute file path string

### src/analysisViewer.ts

**Role:** GUI View

**Purpose:** Provides a tree-view interface for browsing and exploring code analysis results in the VSCode sidebar

**User Actions:**
- View a hierarchical tree of code analysis results in the sidebar
- Browse analysis statistics (total files, lines of code, functions count)
- Explore files organized by directory structure
- View individual file details (LOC, complexity, functions)
- See all functions across the codebase with their signatures
- Browse entry points (main functions, exports) in the code
- Click on items to jump to specific locations in source files
- See message 'No analysis available' when no analysis has been run
- Refresh the tree view to see updated analysis results

**Key Functions:**
- `setAnalysis`: Updates the tree view with new code analysis results
  - Inputs: analysis: CodeAnalysis | null
  - Outputs: void
- `refresh`: Triggers a refresh of the entire tree view display
  - Inputs: none
  - Outputs: void
- `getTreeItem`: Returns the tree item representation for display in the view
  - Inputs: element: AnalysisItem
  - Outputs: vscode.TreeItem
- `getChildren`: Returns child items for a given tree node or root items if no element provided
  - Inputs: element?: AnalysisItem
  - Outputs: Thenable<AnalysisItem[]>
- `getRootItems`: Generates top-level categories shown in the tree (statistics, files, functions, entry points)
  - Inputs: none
  - Outputs: AnalysisItem[]
- `getStatisticsItems`: Creates tree items showing code metrics like file count, LOC, function count
  - Inputs: none
  - Outputs: AnalysisItem[]
- `getFilesItems`: Organizes files into a directory tree structure for browsing
  - Inputs: none
  - Outputs: AnalysisItem[]
- `getFileDetails`: Shows detailed information about a specific file (functions, complexity, LOC)
  - Inputs: element: AnalysisItem
  - Outputs: AnalysisItem[]

### src/analyzer.ts

**Role:** Core Logic

**Purpose:** Defines data structures and interfaces for code analysis results, including file metadata, function information, dependencies, test mappings, and code quality metrics.

**User Actions:**
- View total file count, line count, and function count in codebase
- See list of large files that may need refactoring
- Identify orphaned files not imported anywhere
- Discover entry points (main files) in the project
- Find duplicate code blocks across files
- View function complexity and risk levels
- See test coverage mapping for source files
- Identify uncovered functions without tests

**Key Functions:**
- `CodeAnalysis`: Main interface containing complete analysis results for a codebase
  - Inputs: none (interface/type definition)
  - Outputs: Structure with totalFiles, totalLines, functions, imports, orphanedFiles, duplicates, and optional enhanced metadata
- `FunctionMetadata`: Detailed information about a single function including signature, complexity, and dependencies
  - Inputs: none (interface/type definition)
  - Outputs: Structure with symbolName, parameters, returnType, visibility, branches, dependencies, stateMutations, riskLevel
- `TestMapping`: Maps source files and functions to their corresponding test files and test cases
  - Inputs: none (interface/type definition)
  - Outputs: Structure with sourceFileToTests map, functionToTests map, and uncoveredFunctions list
- `DependencyInfo`: Describes a single dependency with its type and whether it's internal or external
  - Inputs: none (interface/type definition)
  - Outputs: Structure with name, type (db/http/filesystem/etc), isInternal flag, and optional lineNumber
- `BranchInfo`: Represents a branching point in code (if/else, switch, loop, exception handling)
  - Inputs: none (interface/type definition)
  - Outputs: Structure with type, human-readable condition, and lineNumber

### src/cache.ts

**Role:** Core Logic

**Purpose:** Manages persistent storage and retrieval of code analysis results to avoid redundant analysis operations

**User Actions:**
- Analysis results load instantly when reopening a previously analyzed workspace
- Analysis cache automatically expires after 24 hours, ensuring fresh results
- Cache can be cleared to force fresh analysis of the workspace

**Key Functions:**
- `get`: Retrieves cached analysis results for a workspace if they exist and are less than 24 hours old
  - Inputs: workspaceRoot (string path)
  - Outputs: CodeAnalysis object or null if cache is invalid/missing
- `set`: Stores analysis results in cache with current timestamp for future retrieval
  - Inputs: workspaceRoot (string path), data (CodeAnalysis object)
  - Outputs: void (Promise)
- `clear`: Removes all cached analysis files from the cache directory
  - Inputs: none
  - Outputs: void (Promise)
- `getCacheKey`: Generates a safe filename identifier from workspace path using base64 encoding
  - Inputs: workspaceRoot (string path)
  - Outputs: string (sanitized cache key)

### src/config/configurationManager.ts

**Role:** Core Logic

**Purpose:** Manages all Shadow Watch extension settings with type-safe access and automatic change detection

**User Actions:**
- Extension behavior changes when user modifies settings in VS Code preferences
- Analysis triggers automatically on save if analyzeOnSave is enabled
- Inline hints appear in editor based on showInlineHints setting
- Analysis respects configured timeout limits
- Diagnostic severity threshold filters which issues are shown
- LLM provider (OpenAI/Claude) determines which AI service is used
- Output format controls how analysis results are displayed

**Key Functions:**
- `constructor`: Initializes configuration manager and sets up change watcher
  - Inputs: none
  - Outputs: ConfigurationManager instance
- `setupWatcher`: Monitors VS Code settings changes and triggers listener callbacks
  - Inputs: none
  - Outputs: void
- `onConfigurationChange`: Registers callback to be invoked when configuration changes
  - Inputs: callback function
  - Outputs: void
- `removeConfigurationChangeListener`: Unregisters a configuration change callback
  - Inputs: callback function
  - Outputs: void
- `enabled (getter)`: Returns whether Shadow Watch extension is enabled
  - Inputs: none
  - Outputs: boolean
- `analyzeOnSave (getter)`: Returns whether to automatically analyze files on save
  - Inputs: none
  - Outputs: boolean
- `showInlineHints (getter)`: Returns whether to display inline hints in editor
  - Inputs: none
  - Outputs: boolean
- `llmProvider (getter)`: Returns configured LLM provider (openai or claude)
  - Inputs: none
  - Outputs: LLMProvider
- `llmFormat (getter)`: Returns output format for LLM responses
  - Inputs: none
  - Outputs: LLMFormat
- `severityThreshold (getter)`: Returns minimum severity level for displaying diagnostics
  - Inputs: none
  - Outputs: SeverityThreshold
- `validate`: Validates current configuration and returns errors if any
  - Inputs: none
  - Outputs: ConfigValidationResult

### src/context/analysisContextBuilder.ts

**Role:** Core Logic

**Purpose:** Converts code analysis data into a context format suitable for LLM services and saves it to persistent storage.

**User Actions:**
- Code analysis results are automatically saved to the workspace
- Analysis data is stored in a .shadow/docs directory for future reference
- Analysis includes metadata with generation timestamp

**Key Functions:**
- `convertCodeAnalysisToContext`: Transforms CodeAnalysis data structure into AnalysisContext format
  - Inputs: analysis: CodeAnalysis object containing files, imports, entry points, and statistics
  - Outputs: AnalysisContext object with formatted file paths, imports, entry points, and metrics
- `saveCodeAnalysis`: Persists code analysis results to a JSON file in the workspace
  - Inputs: analysis: CodeAnalysis object to save
  - Outputs: void (creates/updates code-analysis.json file with metadata)

### src/diagnosticsProvider.ts

**Role:** Core Logic

**Purpose:** Displays code insights as visual diagnostic messages (warnings, errors, info) in the VS Code Problems panel and editor gutter

**User Actions:**
- See colored underlines/squiggles in code where insights are detected
- View insights listed in the Problems panel (Ctrl+Shift+M)
- Hover over underlined code to see insight descriptions
- Click on problems to navigate to specific code locations
- See insight severity indicated by icon color (error/warning/info)

**Key Functions:**
- `updateDiagnostics`: Updates all diagnostics across all files based on new insights
  - Inputs: Array of insights
  - Outputs: Visual diagnostics in editor and Problems panel
- `updateDiagnosticsForFile`: Updates diagnostics for a single specific file
  - Inputs: File URI and array of insights for that file
  - Outputs: Visual diagnostics for that file only
- `createDiagnostic`: Converts an insight into a VS Code diagnostic message with appropriate severity and location
  - Inputs: Single insight object
  - Outputs: VS Code Diagnostic object
- `clear`: Removes all diagnostic messages from the editor and Problems panel
  - Inputs: None
  - Outputs: Cleared diagnostics UI

### src/domain/bootstrap/commandRegistry.ts

**Role:** Core Logic

**Purpose:** Registers and manages all VS Code commands for the code analysis extension, mapping command IDs to their handler functions.

**User Actions:**
- Analyze entire workspace to generate insights
- Analyze current file being edited
- Copy all analysis insights to clipboard
- Copy insights for a specific file
- Copy a single insight item
- Clear cached analysis data
- Clear all extension data
- Open extension settings
- View latest analysis report
- View latest unit test report
- Switch between LLM providers (e.g., OpenAI, Anthropic)
- View menu structure of analyzed code
- Check current LLM provider status
- Navigate to specific product/code items
- View detailed information about insights
- View detailed information about unit tests

**Key Functions:**
- `register`: Registers all VS Code commands with their corresponding handler functions
  - Inputs: context: vscode.ExtensionContext, components: ExtensionComponents
  - Outputs: void

### src/domain/bootstrap/extensionBootstrapper.ts

**Role:** Core Logic

**Purpose:** Initializes and bootstraps all extension components during VS Code extension activation

**User Actions:**
- Extension activates and becomes ready to use in VS Code
- Status bar item appears showing extension status
- Multiple tree views become available in the sidebar (Insights, Analysis, Reports, Product Navigator, Unit Tests, Static Analysis)
- Code diagnostics and insights start appearing in the editor
- File watching begins for automatic analysis on file changes
- Commands become available in the command palette for interacting with the extension

**Key Functions:**
- `bootstrap`: Main entry point that initializes all extension components and wires them together
  - Inputs: vscode.ExtensionContext - VS Code extension context for registration
  - Outputs: ExtensionComponents - Object containing all initialized component instances
- `ExtensionComponents interface`: Defines the structure of all components that make up the extension
  - Inputs: N/A - Type definition
  - Outputs: Type containing analyzer, generators, viewers, providers, cache, status bar, and tree views

### src/domain/formatters/documentationFormatter.ts

**Role:** Core Logic

**Purpose:** Formats product documentation and code analysis insights into structured Markdown documents for human reading.

**User Actions:**
- Receives formatted product documentation in Markdown with timestamps, overview, features, and user perspectives
- Sees documentation organized by sections: What It Does, User Perspective (GUI/CLI/API), Key Features, Technical Details
- Views LLM analysis insights formatted as Markdown with file-by-file behavioral descriptions
- Reads structured sections for product patterns, architecture decisions, user workflows, and technical stack
- Sees formatted usage examples, configuration requirements, and deployment considerations
- Gets human-readable summaries of code behavior grouped by file role and type

**Key Functions:**
- `formatEnhancedDocsAsMarkdown`: Converts enhanced product documentation object into a formatted Markdown document with sections for overview, features, user perspectives, and technical details
  - Inputs: EnhancedProductDocumentation object containing overview, features, user perspectives, technical details, etc.
  - Outputs: String containing formatted Markdown document with headers, timestamps, and structured sections
- `formatLLMInsightsAsMarkdown`: Converts LLM analysis insights into a formatted Markdown document with product summary and per-file behavioral descriptions
  - Inputs: LLMInsights object containing product summary and array of file insights with behavior descriptions
  - Outputs: String containing formatted Markdown document with product overview and file-by-file analysis sections

### src/domain/handlers/navigationHandler.ts

**Role:** Core Logic

**Purpose:** Handles navigation to files, functions, endpoints, and other code locations within the workspace, and displays detailed information about analyzed items.

**User Actions:**
- Navigate to a specific file in the editor when clicking on file items
- Navigate to a specific function definition within a file and scroll to its location
- Navigate to API endpoints and their implementations in code
- View detailed information panel showing function signatures, parameters, and relationships
- See error messages when files cannot be opened or navigation fails
- Jump to entry points in the codebase from navigation items
- View formatted details about analyzed code elements in a separate panel

**Key Functions:**
- `navigateToProductItem`: Navigates to a product navigation item (file, function, or endpoint) in the editor
  - Inputs: ProductNavItem containing type and data with file/function information
  - Outputs: Promise<void> - completes when navigation is finished or fails with error message
- `navigateToAnalysisItem`: Navigates to an analysis item and optionally shows its details
  - Inputs: AnalysisItem with file path and optional line number
  - Outputs: Promise<void> - opens document and positions cursor at specified location
- `showAnalysisItemDetails`: Displays detailed information about an analyzed item in a webview panel
  - Inputs: AnalysisItem containing element details, dependencies, and metadata
  - Outputs: void - creates and shows a webview panel with formatted HTML content
- `navigateToEntryPoint`: Navigates to an entry point in the codebase
  - Inputs: EntryPoint object with file path and optional line/column information
  - Outputs: Promise<void> - opens file and positions at entry point location
- `findFunctionInDocument`: Searches for a function definition within a document to determine its line number
  - Inputs: TextDocument and function name string
  - Outputs: number or undefined - line number where function is defined


*... and 30 more files*
