# Product Documentation

*Generated: 11/19/2025, 6:50:45 PM (2025-11-20 02:50:45 UTC)*

---

## Product Overview

Shadow Watch is a Visual Studio Code extension that provides AI-powered code intelligence and documentation generation for software development teams. It automatically analyzes codebases to understand their structure, purpose, and quality, then generates comprehensive documentation explaining what the code does and why it exists. Users can analyze individual files or entire projects, with results appearing as inline diagnostics, browsable tree views in the sidebar, and exportable markdown reports.

The extension integrates deeply with VS Code's interface, allowing developers to navigate seamlessly between analysis insights and source code locations. When users save files, Shadow Watch automatically re-analyzes the changes and updates its insights in real-time. The extension supports multiple AI providers (OpenAI GPT and Anthropic Claude) for generating documentation and architectural analysis, with configurable output formats optimized for different AI assistants and workflows.

Beyond documentation, Shadow Watch helps development teams improve code quality by identifying architectural patterns, code smells, circular dependencies, orphaned files, and potential refactoring opportunities. It can generate unit test plans, create test code with proper mocks and assertions, validate tests by executing them, and automatically fix failing tests through iterative AI-powered corrections.

## What It Does

- Analyzes codebases to generate product documentation explaining what applications do from a user perspective
- Creates module and file-level documentation describing code purpose, features, and capabilities
- Identifies architecture patterns, code quality issues, and potential improvement opportunities
- Generates unit test plans prioritized by function complexity and importance
- Creates unit test code with appropriate framework setup, mocks, and assertions
- Automatically validates and fixes failing tests through iterative AI corrections
- Displays inline diagnostics showing code issues as squiggly underlines in the editor
- Provides browsable tree views showing code structure, statistics, and analysis results
- Exports analysis results and documentation to markdown files for sharing
- Enables navigation from insights directly to relevant source code locations
- Monitors file changes and automatically updates analysis when files are saved
- Caches analysis results for fast repeated access without re-scanning
- Supports switching between OpenAI GPT and Anthropic Claude AI providers
- Formats documentation in multiple styles optimized for different AI assistants

## User Perspective

### GUI

- Browse code analysis results in a hierarchical tree view in the VS Code sidebar
- View inline diagnostics with squiggly underlines showing code quality issues in the Problems panel
- Click on analysis insights to jump directly to the relevant source code location
- See real-time progress indicators in the status bar during long-running analysis operations
- Review generated documentation in formatted markdown within VS Code
- Access action buttons to generate tests, analyze files, or export results
- View unit test reports showing passed/failed counts, execution duration, and coverage metrics
- Navigate between different analysis views including insights, architecture, and test results

### CLI

- Execute extension commands through the VS Code command palette
- Trigger analysis on specific files or entire workspaces via keyboard shortcuts
- Switch between AI providers using command palette actions
- Copy generated insights and documentation to clipboard for external use

### API

- Configure AI provider settings (API keys, model selection) through VS Code settings
- Set diagnostic severity levels to control which issues appear in the Problems panel
- Enable or disable automatic analysis on file save
- Choose output format for AI-generated content (Cursor, ChatGPT, Generic, Compact)
- Specify LLM models for different providers through configuration

### CI/CD

- Export analysis results as markdown files for documentation repositories
- Generate test plans and test code that integrate with existing CI/CD test suites
- Produce architecture insights that can inform code review processes
- Create documentation artifacts suitable for version control and documentation systems

## Workflow Integration

- Code review workflow: Analyze pull requests to identify quality issues and generate documentation for new features
- Documentation generation workflow: Automatically create and update product, module, and file-level documentation as code evolves
- Test-driven development workflow: Generate test plans and initial test code from existing functions, then validate and fix tests iteratively
- Refactoring workflow: Identify large or complex functions that should be extracted, with detailed migration instructions
- Architecture assessment workflow: Understand codebase structure, identify patterns, and spot architectural issues like circular dependencies
- Onboarding workflow: Generate comprehensive documentation to help new team members understand what the codebase does
- Quality assurance workflow: Continuously monitor code quality through automatic analysis on file save, with inline feedback

## Problems Solved

- Eliminates manual documentation writing by automatically generating comprehensive product and code documentation
- Reduces time spent understanding unfamiliar codebases by providing AI-generated summaries and architectural insights
- Prevents outdated documentation by automatically updating analysis when code changes
- Speeds up test creation by generating unit tests with proper setup, mocks, and assertions
- Reduces debugging time by automatically fixing failing tests through AI-powered corrections
- Improves code quality by identifying issues like circular dependencies, orphaned files, and code smells
- Accelerates code reviews by providing immediate insights into code structure and potential issues
- Simplifies onboarding by generating clear explanations of what code does from a user perspective
- Maintains consistent documentation quality across large codebases through standardized AI analysis
- Enables seamless navigation from analysis insights to source code, reducing context switching

## Architecture Summary

Shadow Watch follows a layered architecture with clear separation between infrastructure, domain logic, and user interface components. The infrastructure layer manages AI provider integration (OpenAI and Claude), file system access with caching, and persistent storage of analysis results. The domain layer contains the core business logic for code analysis, test generation, and documentation creation, organized into services that orchestrate complex workflows like incremental AI analysis and test validation. The UI layer provides VS Code integration through tree view providers, diagnostic providers, webview panels, and command handlers.

The extension uses a request-response pattern for AI interactions, where analysis operations make structured requests to language models and parse responses into typed objects. A rate limiter prevents API quota exhaustion, while a retry handler manages transient failures with exponential backoff. Code analysis flows through an AST-based parser that extracts function metadata, dependencies, and behavioral patterns, feeding this structured data into prompt builders that generate context-rich queries for the AI.

State management is centralized through managers that track analysis progress, configuration changes, and test generation status. File watching services monitor the workspace for changes and trigger automatic re-analysis. Results are cached both in memory and on disk to avoid redundant processing. The architecture supports extensibility through provider factories and standardized interfaces, allowing new AI providers or analysis capabilities to be added without modifying existing components.

## Module Documentation

### . (other)

This module configures the Jest testing framework for the project, enabling developers to run and maintain automated tests written in TypeScript. It establishes the testing infrastructure that allows development teams to verify code functionality, track code coverage metrics, and ensure software quality through unit and integration tests.

The configuration supports seamless integration with Visual Studio Code, providing developers with in-editor testing capabilities and debugging support. The setup includes TypeScript transformation rules, coverage reporting thresholds, and mock handling for external dependencies, creating a comprehensive testing environment that helps maintain code reliability and catch regressions early in the development cycle.

**Capabilities:**
- Provides Jest testing framework configuration for TypeScript-based test execution
- Enables code coverage reporting for test suites
- Supports Visual Studio Code integration with mocking capabilities
- Configures test environment settings for consistent test execution across the project

### src/ai (other)

The AI module provides robust infrastructure for interacting with large language model APIs (OpenAI and Claude) to analyze codebases. It ensures reliable AI-powered analysis by managing three critical aspects: rate limiting to prevent API quota errors, automatic retry logic for handling transient failures, and structured parsing of AI responses into typed objects.

Users benefit from seamless AI functionality that automatically handles common failure scenarios. When making AI requests to analyze code, the module prevents rate limit errors by tracking request frequency, automatically retries failed requests with exponential backoff for network issues or temporary API problems, and converts raw AI text responses into structured data about files, modules, and product documentation.

The module operates transparently in the background during code analysis workflows. When users trigger AI analysis operations, requests flow through the rate limiter to ensure they stay within API quotas, are automatically retried if they fail due to transient errors, and finally parsed into structured insights including file summaries (purpose and key functions), module summaries (user-facing capabilities), and product documentation (what the codebase does). This creates a resilient AI analysis pipeline that handles errors gracefully without requiring manual intervention.

**Capabilities:**
- Reliable AI-powered code analysis with automatic error recovery
- Rate-limited API request management to prevent quota exhaustion
- Structured extraction of code insights from AI responses
- Automatic retry handling for transient API failures
- Seamless integration with OpenAI and Claude APIs

### src/ai/providers (other)

This module provides a unified abstraction layer for interacting with multiple AI language model providers. Users can communicate with either OpenAI's GPT models or Anthropic's Claude AI through a consistent interface, allowing them to switch between providers without changing how they interact with the AI. The module handles all provider-specific implementation details, authentication, and response formatting behind the scenes.

Users can send natural language prompts and receive AI-generated responses in two formats: regular text for conversational interactions, or structured JSON for data extraction and code analysis tasks. The module supports both streaming responses (where text appears progressively) and complete responses. It automatically handles message history to maintain context across multi-turn conversations and validates JSON responses to ensure data integrity.

The factory pattern implementation allows users to easily switch between AI providers based on their configuration settings, with the system automatically selecting and initializing the appropriate provider (OpenAI or Claude) based on available API keys. This flexibility enables users to choose the best AI model for their specific needs while maintaining a consistent experience regardless of which provider is active.

**Capabilities:**
- Switch between multiple AI providers (OpenAI GPT models and Anthropic Claude) for natural language processing
- Send prompts and receive AI-generated text responses in a provider-agnostic way
- Request and receive structured JSON responses from AI models for data extraction and code analysis
- Maintain conversation history across multiple exchanges with AI models
- Stream AI responses progressively for real-time user feedback
- Automatically validate and extract JSON from AI responses when structured output is needed
- Configure and manage AI provider credentials through a unified interface

### src/analysis (other)

The analysis module provides comprehensive code intelligence for TypeScript and JavaScript codebases. It performs deep static analysis by parsing source files into Abstract Syntax Trees (ASTs) and extracting detailed metadata about functions, their relationships, and behavioral patterns. Users gain insights into code complexity, dependencies, and structure to make informed refactoring decisions.

The module enables developers to understand their codebase at both the macro and micro levels. At the file level, it identifies large or complex files that may benefit from refactoring. At the function level, it provides granular details including complexity metrics, dependency chains, branch coverage, and behavioral hints such as whether a function performs queries, mutations, or validations. This helps teams maintain code quality and identify technical debt.

Typical workflows include analyzing existing codebases to find refactoring opportunities, understanding function relationships before making changes, identifying potential side effects, and tracking code complexity metrics. The module serves as the foundation for automated refactoring suggestions by providing the structured data needed to understand how code components interact and where improvements can be made.

**Capabilities:**
- Deep code analysis through Abstract Syntax Tree (AST) parsing of TypeScript and JavaScript files
- Function-level metadata extraction including signatures, parameters, return types, and complexity metrics
- Automatic dependency and relationship mapping between functions
- Behavioral pattern detection (queries, mutations, validations, side effects)
- Branch coverage analysis showing different execution paths
- State mutation and side effect identification
- Large file refactoring recommendations based on complexity and size thresholds
- Function interdependency visualization

### src (other)

This module is a VSCode extension that provides comprehensive AI-powered code analysis and documentation capabilities. It analyzes your codebase to identify architecture patterns, code quality issues, dependencies, entry points, and organizational problems. The extension surfaces these insights through multiple interfaces: inline diagnostics with squiggly underlines, a browsable tree view in the sidebar showing code structure and statistics, and an insights panel displaying AI-generated recommendations.

The module supports end-to-end workflows from initial analysis through documentation generation. Users can analyze individual files or entire workspaces, with results automatically updating when files are saved. The AI integration generates structured documentation explaining what code does and why it exists, identifies potential issues like circular dependencies and orphaned files, and can even generate unit test plans. All analysis results are cached for performance and can be exported to markdown files.

The extension integrates deeply with VSCode's UI, providing clickable navigation from insights to source code locations, status bar indicators showing analysis progress, and multiple output formats optimized for different AI assistants. Users can configure LLM providers and API settings, control when analysis runs, and choose between different formatting styles for generated content.

**Capabilities:**
- Automated code analysis and architecture insight generation using AI (LLM)
- Visual tree-view browsing of code structure, statistics, and analysis results
- Inline diagnostics showing code quality issues and warnings in the Problems panel
- AI-powered documentation generation for products, modules, and files
- Unit test analysis and AI-assisted test generation
- Real-time file monitoring with automatic analysis on save
- Intelligent code search and file content inspection
- Caching system for faster repeated analysis
- Multiple LLM provider support (OpenAI, Claude) with configurable models
- Export and sharing of generated insights and documentation

**Commands:**
- `shadow-watch.analyzeFile`: Analyze the current file to generate code insights, structure analysis, and quality metrics
- `shadow-watch.generateDocumentation`: Generate comprehensive LLM-powered documentation for the entire codebase
- `shadow-watch.refreshAnalysis`: Manually refresh the analysis results and update all views
- `shadow-watch.clearCache`: Clear all cached analysis data to force fresh analysis
- `shadow-watch.exportInsights`: Export generated insights and analysis results to a file
- `shadow-watch.generateProductDoc`: Generate AI-powered product-level documentation explaining purpose and architecture
- `shadow-watch.generateInsights`: Generate AI-powered insights about code quality, organization, and potential issues
- `shadow-watch.generateUnitTests`: Analyze test coverage and generate AI-powered unit test plans
- `shadow-watch.openReport`: Open a generated report (workspace, product, architecture, or unit test analysis)
- `shadow-watch.configureSettings`: Configure extension settings including LLM provider, API keys, and analysis options

### src/config (other)

The config module serves as the central configuration hub for the Shadow Watch extension, managing all user preferences and settings. It provides a unified interface for accessing and updating extension configuration, including core features like extension activation, automatic file analysis, inline hint display, and diagnostic severity levels.

This module enables users to customize their Shadow Watch experience through VS Code's settings UI. Users can choose between different LLM providers (OpenAI or Claude), select their preferred output format for AI interactions (Cursor, ChatGPT, Generic, or Compact), and control when and how the extension provides feedback. The module implements a reactive architecture that automatically notifies all relevant extension components when settings change, ensuring the extension behavior always reflects current user preferences.

The configuration manager handles the complete lifecycle of settings management, from reading initial values to propagating updates throughout the extension. This ensures consistent behavior across all Shadow Watch features and provides users with immediate feedback when they adjust settings, making the extension highly responsive and adaptable to individual workflow requirements.

**Capabilities:**
- Centralized management of all Shadow Watch extension settings
- Real-time configuration change notifications to extension components
- User control over extension activation and automatic analysis behavior
- Customizable display options for code hints and diagnostics
- Flexible LLM provider selection and output format configuration
- Configurable diagnostic severity filtering

### src/context (other)

The context module provides automated persistence and formatting of code analysis results. When code is analyzed, this module automatically captures the results and saves them to .shadow/docs/code-analysis.json in a format optimized for Large Language Model consumption. This ensures that analysis insights are preserved across VS Code sessions and can be referenced by AI features without requiring repeated analysis.

The module acts as a bridge between raw code analysis output and AI-ready context. It transforms analysis data into a structured format that LLMs can efficiently process, making code understanding and documentation generation more effective. Users benefit from faster AI responses since previously analyzed code doesn't need to be re-scanned.

All analysis data is automatically managed in the background - users don't need to manually save or load analysis results. The module ensures that documentation and code insights remain available even after closing and reopening projects, creating a seamless experience for AI-assisted development workflows.

**Capabilities:**
- Automatically persists code analysis results to disk for future reference
- Converts code analysis data into LLM-optimized format for AI consumption
- Maintains analysis context across VS Code sessions
- Stores structured documentation in a standardized location (.shadow/docs/)
- Enables analysis data reuse without re-scanning codebases

### src/domain/bootstrap (other)

This bootstrap module serves as the initialization layer for the VS Code extension, responsible for setting up all user-facing features and workflows when the extension activates. It coordinates the registration of commands, configuration of UI components, and establishment of automatic analysis triggers that enable users to interact with the extension's code intelligence capabilities.

The module handles two primary responsibilities: command registration and extension bootstrapping. Command registration maps user actions (such as analyzing files, copying insights, switching LLM providers, and navigating code) to their execution handlers, making these features accessible through the VS Code command palette, context menus, and keyboard shortcuts. Extension bootstrapping initializes all supporting infrastructure including tree view providers for insights and analysis results, file system watchers for automatic re-analysis, diagnostics providers for displaying warnings and errors, status bar indicators, and custom webview renderers for reports.

Users interact with this module indirectly through the features it enables. Upon activation, the extension becomes fully functional with visible UI elements (status bar, tree views in the sidebar), active command mappings (accessible via command palette), and automatic workflows (file change detection triggering re-analysis). This module ensures that all components work together cohesively, providing a seamless experience for code analysis, insight generation, unit test reporting, and navigation throughout the codebase.

**Capabilities:**
- Initialize and configure all extension components during VS Code activation
- Register and manage all user-facing commands for workspace and file analysis
- Set up automatic file watching and re-analysis triggers
- Configure UI elements including status bar, tree views, and diagnostics panels
- Establish command mappings between user actions and their corresponding handlers
- Bootstrap analyzers, providers, and reporting systems for code intelligence

**Commands:**
- `analyze-workspace`: Analyze entire workspace for code insights and patterns
- `analyze-file`: Analyze the currently open file for insights
- `copy-all-insights`: Copy all generated insights to clipboard
- `copy-file-insights`: Copy insights specific to current file to clipboard
- `copy-insight`: Copy individual insight item to clipboard
- `clear-cache`: Clear analysis cache to force re-analysis
- `clear-all-data`: Clear all extension data including cache and stored results
- `open-settings`: Open extension settings configuration
- `view-analysis-report`: View latest analysis report in custom viewer
- `view-unit-test-report`: View latest unit test report with coverage details
- `switch-llm-provider`: Switch between LLM providers (OpenAI, Anthropic, etc.)
- `copy-menu-structure`: Copy extension menu structure to clipboard
- `view-provider-status`: View current LLM provider status and configuration
- `navigate-to-product-item`: Navigate to product items in codebase
- `navigate-to-analysis-item`: Navigate to specific analysis items
- `show-product-item-details`: Show detailed information for product items
- `show-insight-details`: Show detailed information for insights
- `show-unit-test-details`: Show detailed information for unit test items

### src/domain/formatters (other)

The formatters module provides documentation generation capabilities that transform raw product data and AI insights into polished, human-readable Markdown documents. Users can generate comprehensive documentation that includes product overviews, feature descriptions, technical architecture details, and quality assessments, all formatted with consistent structure and clear sections.

This module enables users to create professional documentation that organizes information by interface type (GUI, CLI, API), presenting key features, main capabilities, and technical implementation details in an accessible format. The generated documents include timestamps, structured headings, and bullet-pointed lists that make it easy for developers and stakeholders to understand product capabilities and architecture.

The module also formats AI-generated insights, incorporating architectural pattern analysis, dependency assessments, and quality metrics into the documentation. Users can view improvement suggestions, technical recommendations, and action items in a clear, organized manner that facilitates decision-making and development planning. All documentation is formatted with proper Markdown syntax for seamless integration into documentation systems, wikis, or version control repositories.

**Capabilities:**
- Generates comprehensive product documentation in human-readable Markdown format
- Formats product metadata including name, type, description, and timestamps
- Organizes documentation by interface type (GUI, CLI, API) with detailed sections
- Presents key features and capabilities in structured bullet-point lists
- Formats technical architecture details including patterns, dependencies, and file structure
- Displays AI-generated insights with architectural recommendations and best practices
- Shows quality assessment metrics and scores in an easy-to-read format
- Highlights improvement suggestions and actionable items for development teams

### src/domain/handlers (other)

The navigation handler module enables seamless code navigation within VS Code by managing all editor interactions triggered by user selections. When users interact with code analysis results, this module handles the heavy lifting of opening files, positioning the cursor, and displaying the relevant code context.

Users can click on any code item from analysis views—whether it's a file reference, function definition, API endpoint, or other code element—and the handler will automatically open the correct file in the editor and position the cursor at the exact location. This creates a smooth workflow where users can explore code relationships, trace dependencies, and investigate analysis findings without manually searching for files or locations.

The module provides robust error handling, displaying clear messages when files cannot be found or locations are invalid. This ensures users always receive feedback about navigation actions, whether successful or unsuccessful, maintaining a reliable and predictable editing experience.

**Capabilities:**
- Navigate to any code location (files, functions, endpoints) directly from analysis results
- Jump to precise line and column positions within source code files
- Open and display file contents in the VS Code editor
- View detailed information about code elements when selected
- Handle navigation errors gracefully with user-friendly error messages

### src/domain/prompts (other)

The prompts module serves as the centralized prompt engineering layer for all LLM-powered features in the application. It ensures that every interaction with language models—whether for documentation generation, architecture analysis, test planning, or code refactoring—follows consistent formatting conventions and produces structured, predictable outputs. This standardization enables reliable parsing of LLM responses and maintains quality across all AI-generated content.

Users benefit from this module through enhanced documentation workflows that generate consistent, well-organized technical documentation at file, module, and product levels. When analyzing codebases, the module produces architecture insights with customizable depth, helping teams understand system structure and dependencies. For testing, it generates prioritized test plans based on code analysis and provides framework-specific recommendations including mock requirements for external dependencies.

The refactoring capabilities stand out by providing actionable, step-by-step guidance for improving code structure. Users receive detailed extraction plans showing exactly which functions should move to new files, complete with dependency analysis revealing caller-callee relationships. Each refactoring recommendation includes before-and-after code examples and comprehensive migration instructions, making it straightforward to implement suggested improvements while maintaining code functionality.

**Capabilities:**
- Standardizes LLM prompt generation for all code analysis and documentation tasks
- Generates structured prompts for architecture analysis with configurable depth and detail levels
- Creates prompts for comprehensive test plan generation aligned with project conventions
- Produces prompts for code refactoring recommendations with function-level extraction plans
- Builds prompts for module and file-level documentation summaries with consistent formatting
- Generates prompts for test configuration setup and framework selection
- Provides detailed migration instructions and dependency analysis for refactoring workflows

### src/domain/services (other)

This module provides intelligent automation services that enhance the development workflow through file monitoring, AI-powered analysis, and test environment management. Users benefit from automatic detection of file changes (creation, modification, deletion) that trigger relevant UI updates across the extension, while file watching can be configured to ignore specific patterns or directories. The module orchestrates multi-step AI analysis workflows that progressively gather code context by reading additional files and searching for patterns when needed, with built-in safeguards to prevent infinite analysis loops.

The services work together to minimize manual configuration and provide a seamless experience. When users save documents or modify their workspace, the file watcher automatically propagates these changes to relevant components. During code analysis, the incremental analysis service intelligently determines what additional information is needed and fetches it iteratively, showing progress throughout long-running operations. The test configuration service automatically identifies the project's test framework, detects missing dependencies, and flags configuration issues, ensuring that generated tests work correctly without requiring users to manually configure test setups or specify framework details.

**Capabilities:**
- Automatically monitors workspace file system changes in real-time
- Progressively analyzes code using AI with iterative context gathering
- Automatically detects test framework configuration and setup requirements
- Filters and manages which files trigger automated responses
- Performs intelligent code searches when AI needs specific information
- Validates test environment configuration without manual user intervention

### src/domain/services/testing (tests)

This module provides comprehensive AI-powered test generation and management capabilities for software projects. It leverages LLM technology to intelligently analyze codebases, create test plans, generate unit tests, and automatically fix failing tests. The module handles the complete testing workflow from environment detection and setup through test execution and validation.

Users can automatically generate tests for their code functions in batches, with the system tracking progress and providing feedback on each function being tested. The module intelligently prioritizes which functions should be tested based on complexity and importance, then generates appropriate test cases using AI analysis. When tests fail, the system automatically attempts to fix them through multiple retry attempts, significantly reducing manual debugging effort.

The module supports a wide range of programming languages and testing frameworks, automatically detecting the project environment and configuring the appropriate test runners and dependencies. Test execution results are captured in structured formats showing passed/failed counts, execution duration, error messages, stack traces, and coverage information. This comprehensive approach streamlines the entire testing process from setup through validation.

**Capabilities:**
- Automatically generate unit tests for code functions using AI-powered analysis
- Create prioritized test plans by analyzing codebases to determine testing strategy
- Detect and configure test environments across multiple languages and frameworks
- Execute test suites and capture structured results with detailed reporting
- Automatically validate and fix failing tests through iterative AI-powered corrections
- Track test generation progress with real-time updates on function coverage
- Support multiple test frameworks including Jest, Mocha, Pytest, and JUnit

### src/domain/services/testing/types (tests)

This module provides the type definitions that enable comprehensive test generation and execution tracking across an entire codebase. Users can monitor the complete testing lifecycle from initial setup through test generation, validation, and execution, with detailed visibility into which functions are testable, which have been tested, and which encountered issues. The types support organizing tests by function groups with priorities, tracking complexity and dependencies, and viewing granular results.

The module structures three main workflow areas: test planning (tracking progress and function analysis), test results (generation, validation, and execution outcomes), and test setup (environment configuration and initialization). Users receive clear feedback at each stage, including phase indicators, success/failure metrics, pass rates, execution durations, and actionable recommendations. Error details include test names, messages, and stack traces to facilitate debugging.

Through these type definitions, users can configure testing frameworks, establish test directories, install dependencies, generate test files with appropriate imports and mocks, validate test correctness, execute tests, and review comprehensive reports. The system provides both high-level summaries (total functions analyzed, overall pass rates) and detailed function-level information (complexity scores, dependencies, individual test results) to support effective test management and quality assurance workflows.

**Capabilities:**
- Define type structures for automated test generation workflow tracking
- Track test generation progress through multiple phases (setup, planning, generation, validation, completion)
- Monitor test coverage across codebases with function-level granularity
- Organize test generation by function groups with priority management
- View detailed test execution results including pass/fail counts and durations
- Access comprehensive test reports with summaries and improvement recommendations
- Configure test environment setup with framework and dependency specifications
- Track test validation status with detailed error reporting

### src/infrastructure/fileSystem (other)

The fileSystem module provides optimized file access and processing capabilities for the codebase analysis system. It acts as an intelligent layer between the application and the file system, ensuring fast and efficient file operations.

The module automatically caches file contents in memory, eliminating redundant disk reads when the same files are accessed multiple times. The cache stays synchronized with disk changes, automatically updating when files are modified. This dramatically improves responsiveness during analysis operations that require repeated file access.

For file processing workflows, the module automatically filters out non-source directories and processes multiple files in parallel. This ensures that operations like scanning repositories or analyzing codebases focus only on relevant source files while maintaining high performance through concurrent processing. All file operations use standardized error handling to provide consistent and reliable behavior throughout the application.

**Capabilities:**
- Provides fast, cached access to file contents with automatic cache invalidation
- Filters files intelligently to skip non-source directories (node_modules, .git, dist, build, etc.)
- Processes multiple files in parallel for improved performance
- Standardizes file reading and processing with consistent error handling across the codebase

### src/infrastructure/persistence (other)

The persistence module provides the storage layer for all code analysis outputs, managing how documentation and insights are saved to the .shadow directory. It ensures that each analysis run is preserved with a unique identifier and timestamp, creating an organized historical record of all documentation generation activities.

Users benefit from automatic organization of their analysis results, with product documentation saved to .shadow/docs and architecture insights to .shadow/architecture. Each analysis session creates a complete snapshot including individual file documentation, summary overviews, and metadata, making it easy to track changes over time and reference previous analysis runs. The module handles all file system operations transparently, allowing users to focus on analyzing their code while documentation is reliably stored in a well-structured format.

**Capabilities:**
- Persist code analysis results to the local filesystem in a structured format
- Store product documentation generated from code analysis in timestamped directories
- Save architecture insights and patterns discovered during analysis
- Organize analysis outputs by run with unique identifiers for traceability
- Maintain file-level documentation with metadata for tracking analysis history
- Create summary files and overview documentation for each analysis session

### src/infrastructure (other)

This infrastructure module provides a centralized progress notification system that keeps users informed during long-running operations throughout the application. It standardizes how progress is displayed, ensuring a consistent experience whether users are processing files, running analyses, or executing other time-intensive tasks.

Users see progress notifications that include descriptive titles and messages explaining what's happening. As operations proceed, the progress indicator updates incrementally to show completion status. For operations that support cancellation, users can click a cancel button to stop the process early. The service flexibly displays progress in different UI locations depending on the context, such as the notification area for background tasks or the window status bar for focused operations.

This module serves as the foundation for all progress reporting in the application, ensuring that users always have visibility into what the application is doing and how long operations might take. It eliminates uncertainty during long tasks and gives users control over cancellable operations.

**Capabilities:**
- Display progress notifications for long-running operations with customizable titles and messages
- Show incremental progress updates as operations proceed through their tasks
- Allow users to cancel operations in progress when cancellation is supported
- Present progress indicators in various UI locations (notification area, window status, etc.)
- Provide standardized progress reporting across all application features

## File-Level Documentation

*Detailed documentation for 50 files*

### jest.config.js

**Role:** Core Logic

**Purpose:** Configures Jest testing framework for TypeScript test execution with coverage reporting and VS Code mocking support

**User Actions:**
- N/A - Configuration file with no direct user-facing actions

### src/ai/llmRateLimiter.ts

**Role:** Core Logic

**Purpose:** Prevents AI API rate limit errors by tracking and controlling the frequency of requests to OpenAI and Claude APIs

**User Actions:**
- Prevents application errors when too many AI requests are made in a short time
- Ensures smooth AI functionality by automatically managing request timing
- Avoids API quota exceeded errors during heavy AI usage

**Key Functions:**
- `canMakeRequest`: Checks if an AI request is allowed based on rate limits
  - Inputs: provider ('openai' or 'claude')
  - Outputs: boolean - true if request can proceed, false if limit reached
- `recordRequest`: Records that an AI request was made to track against limits
  - Inputs: provider ('openai' or 'claude')
  - Outputs: void - updates internal tracking
- `configure`: Sets custom rate limits for an AI provider
  - Inputs: provider ('openai' or 'claude'), config (maxRequests and windowMs)
  - Outputs: void - updates provider configuration

### src/ai/llmResponseParser.ts

**Role:** Core Logic

**Purpose:** Extracts structured data from LLM text responses and converts them into typed objects for file summaries, module summaries, and product documentation.

**User Actions:**
- Receives parsed insights about code files including their purpose and key functions
- Gets product-level documentation with clear explanations of what the codebase does
- Views structured information about user-facing actions and developer-facing actions extracted from AI responses

**Key Functions:**
- `parseFileSummary`: Converts LLM response text into a FileSummary object containing purpose, actions, and dependencies
  - Inputs: content (string), filePath (string), role (string)
  - Outputs: FileSummary object
- `extractSection`: Extracts a named section from text response
  - Inputs: content (string), sectionName (string)
  - Outputs: Extracted text string
- `extractListSection`: Extracts a list/array section from text response
  - Inputs: content (string), sectionName (string)
  - Outputs: Array of strings

### src/ai/llmRetryHandler.ts

**Role:** Core Logic

**Purpose:** Provides automatic retry logic with exponential backoff for LLM API requests that fail due to transient errors like rate limits or network issues.

**User Actions:**
- Automatic retry of failed AI requests without manual intervention
- Seamless recovery from temporary API failures (rate limits, timeouts, network errors)
- Delayed retries that gradually increase wait time between attempts
- Eventual success or clear failure after exhausting retry attempts

**Key Functions:**
- `executeWithRetry`: Executes an async operation with automatic retry logic, exponential backoff, and error classification
  - Inputs: operation (async function returning Promise<T>), options (RetryOptions with maxRetries, delays, retryableErrors, onRetry callback)
  - Outputs: Promise<T> containing the operation result, or throws error if all retries exhausted
- `isRetryableError`: Determines if an error should trigger a retry based on error message/code matching
  - Inputs: error object, array of retryable error patterns
  - Outputs: boolean indicating if error is retryable

### src/ai/providers/ILLMProvider.ts

**Role:** Core Logic

**Purpose:** Defines the contract for AI language model providers (OpenAI, Claude, etc.) to enable communication with different LLM services in a unified way

**User Actions:**
- User receives AI-generated text responses to their queries
- User receives structured JSON responses when requesting formatted data
- User experiences consistent AI behavior regardless of which provider (OpenAI, Claude, etc.) is configured

**Key Functions:**
- `isConfigured`: Checks if the provider has valid credentials and is ready to use
  - Inputs: None
  - Outputs: Boolean indicating if provider is configured
- `sendRequest`: Sends a prompt to the LLM and returns text response
  - Inputs: LLMRequestOptions (model, messages, temperature, maxTokens, responseFormat)
  - Outputs: Promise<LLMResponse> with content, finish reason, model name, and raw response
- `sendStructuredRequest`: Sends a prompt to the LLM and returns parsed JSON data with optional follow-up requests
  - Inputs: LLMRequestOptions and optional JSON schema
  - Outputs: Promise<StructuredOutputResponse<T>> with typed data and optional file/grep requests
- `getName`: Returns the provider's display name
  - Inputs: None
  - Outputs: String provider name (e.g., 'OpenAI', 'Claude')

### src/ai/providers/anthropicProvider.ts

**Role:** Core Logic

**Purpose:** Provides integration with Anthropic's Claude AI models for natural language processing and code analysis tasks

**User Actions:**
- Sends prompts to Claude AI and receives AI-generated responses
- Generates structured data (JSON) from Claude's responses for code analysis
- Processes conversations with Claude while maintaining message history
- Receives error messages when Claude API key is not configured

**Key Functions:**
- `isConfigured`: Checks if Claude API key is set up and ready to use
  - Inputs: none
  - Outputs: boolean indicating if provider is configured
- `getName`: Returns the provider identifier
  - Inputs: none
  - Outputs: string 'claude'
- `sendRequest`: Sends a prompt with conversation history to Claude and returns the response
  - Inputs: LLMRequestOptions (messages, model, systemPrompt, maxTokens)
  - Outputs: LLMResponse with text content and token usage
- `sendStructuredRequest`: Sends a request to Claude and extracts JSON data from the response
  - Inputs: LLMRequestOptions with expected JSON structure
  - Outputs: StructuredOutputResponse with parsed JSON data
- `initialize`: Sets up the Claude API client with credentials from configuration
  - Inputs: none (reads from config manager)
  - Outputs: void (initializes client)

### src/ai/providers/openAIProvider.ts

**Role:** Core Logic

**Purpose:** Provides OpenAI API integration for sending chat completion requests and receiving AI-generated responses

**User Actions:**
- Sends user messages to OpenAI's GPT models and receives AI-generated responses
- Supports both regular text responses and structured JSON responses from the AI
- Handles streaming responses where AI text appears progressively
- Automatically validates and extracts JSON from AI responses when structured output is requested

**Key Functions:**
- `initialize`: Sets up OpenAI client with API key from configuration
  - Inputs: None
  - Outputs: void
- `isConfigured`: Checks if OpenAI provider is ready to use
  - Inputs: None
  - Outputs: boolean indicating if API key is set
- `getName`: Returns provider identifier
  - Inputs: None
  - Outputs: String 'openai'
- `sendRequest`: Sends a chat completion request to OpenAI and returns the response
  - Inputs: LLMRequestOptions with model, messages, systemPrompt, responseFormat
  - Outputs: Promise<LLMResponse> with content, finishReason, and usage stats
- `streamRequest`: Streams a chat completion request with progressive content delivery
  - Inputs: LLMRequestOptions with model, messages, systemPrompt, responseFormat
  - Outputs: AsyncIterable<string> yielding content chunks as they arrive
- `sendStructuredOutputRequest`: Sends request expecting JSON response and validates the output
  - Inputs: LLMRequestOptions with model, messages, systemPrompt, responseFormat
  - Outputs: Promise<StructuredOutputResponse> with parsed JSON data or validation errors

### src/ai/providers/providerFactory.ts

**Role:** Core Logic

**Purpose:** Factory that creates and manages AI provider instances (OpenAI or Claude) based on configuration settings

**User Actions:**
- Switches between different AI providers (OpenAI or Claude) for generating responses
- Ensures only configured AI providers are available for use
- Maintains consistent AI provider throughout the session unless configuration changes

**Key Functions:**
- `getProvider`: Returns the AI provider instance for a specific provider type (openai or claude)
  - Inputs: provider: LLMProvider (either 'openai' or 'claude')
  - Outputs: ILLMProvider instance
- `getCurrentProvider`: Returns the AI provider that is currently set in user configuration
  - Inputs: none
  - Outputs: ILLMProvider instance of the configured provider
- `isProviderConfigured`: Checks if a specific AI provider has valid configuration and API keys
  - Inputs: provider: LLMProvider (either 'openai' or 'claude')
  - Outputs: boolean indicating if provider is ready to use
- `getConfiguredProviders`: Returns a list of all AI providers that are properly configured
  - Inputs: none
  - Outputs: Array of LLMProvider types that are configured

### src/analysis/enhancedAnalyzer.ts

**Role:** Core Logic

**Purpose:** Provides deep code analysis capabilities by parsing TypeScript/JavaScript files using AST to extract function metadata, dependencies, branches, and behavioral patterns.

**User Actions:**
- Receives detailed analysis of code functions including complexity metrics
- Gets insights about code dependencies and how functions relate to each other
- Views behavioral hints about what functions do (queries, mutations, validations)
- Sees branch coverage information showing different code paths
- Understands state mutations and side effects in functions

**Key Functions:**
- `analyzeFileMetadata`: Analyzes a code file and extracts enhanced metadata for all functions in it
  - Inputs: filePath (string), content (string), language (string), functions (FunctionInfo[])
  - Outputs: Map<string, FunctionMetadata> containing detailed analysis for each function
- `analyzeTypeScriptFunction`: Performs AST-based analysis of TypeScript/JavaScript functions to extract detailed metadata
  - Inputs: filePath (string), content (string), func (FunctionInfo), functionContent (string)
  - Outputs: FunctionMetadata with branches, dependencies, mutations, and behavioral hints
- `analyzeFunctionWithRegex`: Provides fallback regex-based analysis for non-TypeScript languages
  - Inputs: filePath (string), func (FunctionInfo), functionContent (string), language (string)
  - Outputs: FunctionMetadata with basic pattern-matched analysis
- `extractFunctionContent`: Extracts the source code content of a function between specified line numbers
  - Inputs: content (string), startLine (number), endLine (number)
  - Outputs: String containing the function's source code

### src/analysis/functionAnalyzer.ts

**Role:** Core Logic

**Purpose:** Analyzes functions in large code files to extract detailed metadata including signatures, dependencies, and relationships for refactoring recommendations

**User Actions:**
- Identifies functions in large files that may need refactoring
- Provides detailed function analysis reports showing what each function does
- Shows which functions depend on each other
- Highlights functions that exceed complexity or size thresholds

**Key Functions:**
- `analyzeFunctions`: Analyzes all functions in files that exceed the size threshold and returns detailed analysis for each
  - Inputs: CodeAnalysis object, optional largeFileThreshold (default 500)
  - Outputs: Array of FunctionAnalysis objects containing function metadata
- `analyzeFunction`: Performs detailed analysis of a single function extracting its signature, dependencies, and relationships
  - Inputs: File path, FunctionInfo object, CodeAnalysis context
  - Outputs: FunctionAnalysis object or null if analysis fails
- `resolveFilePath`: Resolves relative file paths to absolute paths in the project structure
  - Inputs: Relative file path, CodeAnalysis context
  - Outputs: Absolute file path string

### src/analysisViewer.ts

**Role:** GUI View

**Purpose:** Provides a tree view panel in VSCode that displays code analysis results in an organized, browsable hierarchy.

**User Actions:**
- View a tree-structured panel showing code analysis results organized by categories
- Browse statistics about analyzed code (file counts, function counts, line counts)
- Explore files and directories in the analyzed codebase
- See detailed information about individual files (lines, functions, imports, exports)
- View function details (name, parameters, return type, line numbers)
- Browse entry points (main functions, exports, classes) discovered in the code
- Click on items to navigate to specific locations in source files
- See contextual descriptions for each tree item
- View 'No analysis available' message when no analysis has been run
- Refresh the view to see updated analysis results

**Key Functions:**
- `setAnalysis`: Updates the tree view with new analysis results
  - Inputs: analysis: CodeAnalysis | null
  - Outputs: void
- `refresh`: Triggers a refresh of the entire tree view
  - Inputs: none
  - Outputs: void
- `getTreeItem`: Returns the VSCode tree item for display
  - Inputs: element: AnalysisItem
  - Outputs: vscode.TreeItem
- `getChildren`: Returns child items for a given tree node or root items if none specified
  - Inputs: element?: AnalysisItem
  - Outputs: Thenable<AnalysisItem[]>
- `getRootItems`: Returns top-level categories in the tree (Statistics, Files, Functions, Entry Points)
  - Inputs: none
  - Outputs: AnalysisItem[]
- `getStatisticsItems`: Returns statistical summary items about the analyzed code
  - Inputs: none
  - Outputs: AnalysisItem[]
- `getFilesItems`: Returns file and directory items organized by directory structure
  - Inputs: none
  - Outputs: AnalysisItem[]
- `getFileDetails`: Returns detailed information items for a specific file
  - Inputs: element: AnalysisItem
  - Outputs: AnalysisItem[]
- `getDirectoryFiles`: Returns files contained within a directory item
  - Inputs: element: AnalysisItem
  - Outputs: AnalysisItem[]

### src/analyzer.ts

**Role:** Core Logic

**Purpose:** Defines core data structures and interfaces for code analysis results, including file metrics, function metadata, dependencies, and test mappings.

**User Actions:**
- View total project statistics (files, lines, functions)
- See large files identified in the codebase
- Browse function information with parameters and return types
- Examine import relationships between files
- Identify orphaned files not imported anywhere
- Discover entry points in the application
- View duplicate code groups
- See function risk levels (high/medium/low)
- Review function documentation and visibility
- Explore test coverage mapping for functions

**Key Functions:**
- `CodeAnalysis`: Main interface that aggregates all analysis results for a codebase
  - Inputs: Analysis data from file system traversal
  - Outputs: Structured metrics including files, functions, imports, orphans, entry points, and optional enhanced metadata
- `FunctionMetadata`: Comprehensive metadata for individual functions including control flow and dependencies
  - Inputs: Parsed function information from source code
  - Outputs: Structured function details with parameters, branches, dependencies, mutations, and risk assessment
- `TestMapping`: Maps source code to test files and identifies untested functions
  - Inputs: Source files and test files from analysis
  - Outputs: Bidirectional mapping between source files/functions and their tests, plus uncovered functions list
- `DependencyInfo`: Categorizes and tracks external and internal dependencies
  - Inputs: Import statements and function calls
  - Outputs: Classified dependencies by type (db/http/filesystem/etc.) with internal/external flag

### src/cache.ts

**Role:** Core Logic

**Purpose:** Manages persistent caching of code analysis results to improve performance by avoiding redundant analysis.

**User Actions:**
- Analysis results load faster when reopening a workspace (within 24 hours)
- Previously analyzed code doesn't need to be re-analyzed immediately
- Cache data is automatically cleaned up when old

**Key Functions:**
- `constructor`: Initializes cache storage location
  - Inputs: storagePath: string
  - Outputs: AnalysisCache instance
- `get`: Retrieves cached analysis results for a workspace if valid
  - Inputs: workspaceRoot: string
  - Outputs: Promise<CodeAnalysis | null>
- `set`: Saves analysis results to cache with timestamp
  - Inputs: workspaceRoot: string, data: CodeAnalysis
  - Outputs: Promise<void>
- `clear`: Removes all cached analysis data
  - Inputs: none
  - Outputs: Promise<void>
- `getCacheKey`: Generates a safe filename identifier from workspace path
  - Inputs: workspaceRoot: string
  - Outputs: string (base64 encoded safe filename)

### src/config/configurationManager.ts

**Role:** Core Logic

**Purpose:** Manages all Shadow Watch extension settings and notifies components when configuration changes occur

**User Actions:**
- User enables/disables Shadow Watch extension
- User toggles automatic analysis when saving files
- User toggles inline hints display in code editor
- User configures which LLM provider to use (OpenAI or Claude)
- User selects output format for LLM interactions (Cursor, ChatGPT, Generic, or Compact)
- User sets minimum severity level for showing diagnostics (Error, Warning, or Info)
- User changes any Shadow Watch setting in VS Code settings UI

**Key Functions:**
- `onConfigurationChange`: Registers a callback function to be invoked whenever Shadow Watch settings change
  - Inputs: callback function with no parameters
  - Outputs: void
- `removeConfigurationChangeListener`: Unregisters a previously registered configuration change callback
  - Inputs: callback function to remove
  - Outputs: void
- `enabled`: Returns whether the Shadow Watch extension is currently enabled
  - Inputs: none (getter property)
  - Outputs: boolean
- `analyzeOnSave`: Returns whether automatic analysis should run when files are saved
  - Inputs: none (getter property)
  - Outputs: boolean
- `showInlineHints`: Returns whether inline hints should be displayed in the code editor
  - Inputs: none (getter property)
  - Outputs: boolean

### src/context/analysisContextBuilder.ts

**Role:** Core Logic

**Purpose:** Converts code analysis data into a format suitable for LLM consumption and saves it to disk for future reference.

**User Actions:**
- Code analysis results are automatically saved to .shadow/docs/code-analysis.json for future use
- Analysis data is persisted across VS Code sessions

**Key Functions:**
- `convertCodeAnalysisToContext`: Transforms CodeAnalysis data structure into AnalysisContext format suitable for LLM consumption
  - Inputs: analysis: CodeAnalysis (contains files, imports, entry points, metrics)
  - Outputs: AnalysisContext (formatted data with files, imports, entry points, orphaned files, and totals)
- `saveCodeAnalysis`: Persists code analysis data to .shadow/docs/code-analysis.json with timestamp metadata
  - Inputs: analysis: CodeAnalysis (code analysis data to save)
  - Outputs: void (writes to file system)

### src/diagnosticsProvider.ts

**Role:** Core Logic

**Purpose:** Displays code insights as inline diagnostics (squiggly underlines) in the VS Code editor's Problems panel

**User Actions:**
- Shows warnings or errors under specific lines of code with squiggly underlines
- Displays insights in the Problems panel at the bottom of VS Code
- Highlights problematic code locations across multiple files
- Shows insight descriptions when hovering over underlined code
- Groups diagnostics by file in the Problems panel

**Key Functions:**
- `updateDiagnostics`: Updates all diagnostics across all files based on provided insights
  - Inputs: Array of Insight objects
  - Outputs: void (updates UI)
- `updateDiagnosticsForFile`: Updates diagnostics for a single specific file
  - Inputs: File URI and array of Insight objects
  - Outputs: void (updates UI)
- `clear`: Removes all diagnostics from the Problems panel
  - Inputs: none
  - Outputs: void
- `createDiagnostic`: Converts an insight into a VS Code diagnostic entry with range, severity, and metadata
  - Inputs: Single Insight object
  - Outputs: vscode.Diagnostic object
- `getSeverity`: Maps insight severity to VS Code diagnostic severity level
  - Inputs: Insight severity string
  - Outputs: vscode.DiagnosticSeverity enum

### src/domain/bootstrap/commandRegistry.ts

**Role:** Core Logic

**Purpose:** Registers all VS Code commands for the extension, mapping user actions to their corresponding handlers

**User Actions:**
- Analyze entire workspace for insights
- Analyze current open file
- Copy all insights to clipboard
- Copy file-specific insights to clipboard
- Copy individual insight to clipboard
- Clear analysis cache
- Clear all extension data
- Open extension settings
- View latest analysis report
- View latest unit test report
- Switch between LLM providers (OpenAI, Anthropic, etc.)
- Copy menu structure to clipboard
- View current LLM provider status
- Navigate to product items in codebase
- Navigate to analysis items
- Show detailed information for product items
- Show detailed information for insights
- Show detailed information for unit test items

**Key Functions:**
- `register`: Registers all VS Code commands with their corresponding handlers
  - Inputs: VS Code extension context and extension components (analyzers, providers, caches)
  - Outputs: void - commands are registered as side effect

### src/domain/bootstrap/extensionBootstrapper.ts

**Role:** Core Logic

**Purpose:** Initializes and configures all extension components during VS Code extension activation, setting up analyzers, watchers, providers, and UI elements.

**User Actions:**
- Status bar item appears showing extension state
- Tree views become available in sidebar (Insights, Analysis, Static Analysis, Unit Tests, Product Navigator, Reports)
- Diagnostics (warnings/errors) appear in Problems panel
- File change notifications trigger automatic re-analysis
- Reports viewer displays analysis reports
- Custom webviews render for different analysis types

**Key Functions:**
- `ExtensionComponents interface`: Defines all components that need to be initialized for the extension to function
  - Inputs: N/A (interface definition)
  - Outputs: Type definition including analyzer, generators, watchers, providers, cache, UI elements
- `bootstrap (implied)`: Orchestrates initialization of all extension components in correct order
  - Inputs: vscode.ExtensionContext
  - Outputs: ExtensionComponents object with all initialized services

### src/domain/formatters/documentationFormatter.ts

**Role:** Core Logic

**Purpose:** Formats product documentation and LLM insights into structured Markdown documents for human readability

**User Actions:**
- Generates comprehensive product documentation in Markdown format with timestamps
- Creates formatted sections for product overview, features, and user perspectives
- Displays documentation organized by interface type (GUI, CLI, API)
- Shows key features and main capabilities in bullet-point format
- Presents technical details including architecture, dependencies, and file structure
- Formats AI-generated insights with architectural patterns and recommendations
- Displays quality assessment scores and metrics
- Shows identified improvement suggestions and action items

**Key Functions:**
- `formatEnhancedDocsAsMarkdown`: Converts enhanced product documentation object into a comprehensive Markdown document
  - Inputs: EnhancedProductDocumentation object containing overview, features, perspectives, architecture, etc.
  - Outputs: Formatted Markdown string with sections for overview, features, user perspectives, technical details, and file structure
- `formatInsightsAsMarkdown`: Converts LLM-generated insights into a structured Markdown report
  - Inputs: LLMInsights object containing architectural patterns, quality assessment, and recommendations
  - Outputs: Formatted Markdown string with sections for key insights, architecture, quality scores, and improvement suggestions

### src/domain/handlers/navigationHandler.ts

**Role:** Core Logic

**Purpose:** Handles navigation to files, functions, endpoints, and other code locations within the VS Code editor, displaying details about code items when clicked.

**User Actions:**
- Click on a file item to open that file in the editor
- Click on a function to jump to its definition in the source code
- Click on an endpoint to navigate to its implementation
- Click on an analysis item to view its details in the editor
- View error messages when navigation fails to find a file or location
- See the cursor positioned at the exact line and column of the selected code element

**Key Functions:**
- `navigateToProductItem`: Opens files and navigates to specific code locations (functions, endpoints) from product navigation items
  - Inputs: ProductNavItem containing file path, function name, and location data
  - Outputs: Promise<void> - opens document in editor or shows error
- `navigateToAnalysisItem`: Navigates to code locations from analysis results, positioning cursor at specific lines
  - Inputs: AnalysisItem with file path and line/column information
  - Outputs: Promise<void> - opens document and sets cursor position
- `navigateToEntryPoint`: Jumps to entry point definitions in the codebase from analysis data
  - Inputs: EntryPoint object with file location and position details
  - Outputs: Promise<void> - navigates to entry point location
- `showItemDetails`: Displays detailed information about a selected code item
  - Inputs: Product item or analysis item with metadata
  - Outputs: void - shows details in appropriate VS Code panel


*... and 30 more files*
