# Product Documentation

*Generated: 11/19/2025, 10:42:16 PM (2025-11-20 06:42:16 UTC)*

---

## Product Overview

Shadow Watch is an AI-powered VS Code extension that automatically analyzes codebases to generate human-readable documentation, architectural insights, and actionable code quality recommendations. Users interact with the extension through integrated sidebar panels that display code analysis results, quality metrics, test coverage information, and AI-generated documentation. The extension continuously monitors workspace files and updates its analysis when code changes, providing developers with real-time insights into code structure, complexity, dependencies, and potential issues.

The extension serves as an intelligent code understanding assistant that bridges the gap between raw source code and comprehensible documentation. It automatically identifies entry points, maps dependencies between files and functions, detects code smells like circular dependencies and orphaned files, and generates test coverage reports. Users can explore their codebase through multiple specialized views including hierarchical analysis trees, insights panels, and documentation browsers that make complex codebases easier to navigate and understand.

Shadow Watch integrates AI language models (OpenAI GPT or Anthropic Claude) to generate contextual documentation and refactoring recommendations. Users can trigger analysis on-demand or enable automatic analysis on file save, view generated insights directly in the VS Code Problems panel, export analysis results in formats optimized for different AI assistants, and navigate instantly from analysis results to the corresponding code locations. The extension maintains a persistent knowledge base of analysis results that improves over time and supports iterative AI-powered analysis workflows.

## What It Does

- Automatically analyzes code structure and generates human-readable documentation explaining what code does from a user perspective
- Displays code quality metrics and complexity assessments in interactive sidebar tree views
- Identifies test coverage gaps showing which functions have tests and which need testing
- Detects code organization issues including large files, orphaned code, circular dependencies, and duplicate code
- Generates AI-powered refactoring recommendations with detailed migration guidance
- Creates automated test generation plans and executes tests with validation and auto-fixing capabilities
- Provides real-time diagnostics in the VS Code Problems panel showing code quality warnings and suggestions
- Enables instant navigation from analysis results to specific code locations in the editor
- Exports analysis results in formats optimized for ChatGPT, Cursor AI, and other AI assistants
- Monitors file changes and automatically refreshes analysis when code is modified
- Generates comprehensive product documentation describing application features and architecture
- Creates test plans prioritizing which functions need testing based on complexity and risk

## User Perspective

### GUI

- Interactive sidebar tree views displaying code analysis hierarchy with files, functions, and metrics
- Insights panel showing AI-generated recommendations categorized by type (quality, architecture, testing)
- Documentation browser for viewing generated product documentation and architecture insights
- Problems panel integration displaying code quality diagnostics with severity levels
- Status bar indicators showing analysis progress and current state
- Webview panels displaying detailed information about selected code elements with syntax highlighting
- Tree view navigation allowing direct jumps to code locations by clicking on analysis items
- Progress notifications during long-running analysis and test generation operations
- Configuration settings interface for enabling/disabling features and selecting AI providers

## Workflow Integration

- Code review workflow: Developers review AI-generated insights before merging code changes to identify quality issues
- Documentation generation workflow: Automatically create and update product documentation when codebase changes
- Test-driven development workflow: Generate test plans and implement tests based on AI recommendations
- Refactoring workflow: Use AI-generated refactoring reports to safely restructure large files and improve code organization
- Onboarding workflow: New developers explore codebase through generated documentation and analysis views
- Technical debt management workflow: Track and prioritize code quality issues through diagnostics and insights panels

## Problems Solved

- Eliminates manual documentation effort by automatically generating human-readable explanations of code purpose
- Reduces time spent understanding unfamiliar codebases through AI-powered architectural insights
- Identifies hidden code quality issues that manual review might miss (circular dependencies, orphaned files, complexity hotspots)
- Accelerates test writing by automatically generating test plans and test code with validation
- Prevents technical debt accumulation by surfacing refactoring opportunities before files become unmaintainable
- Improves code navigation in large projects through structured analysis hierarchies and instant jump-to-definition
- Standardizes documentation format across projects through consistent AI-generated output
- Reduces cognitive load during code review by highlighting specific issues with actionable recommendations

## Architecture Summary

Shadow Watch follows a layered architecture with distinct separation between domain logic, infrastructure concerns, and presentation. The domain layer contains services for code analysis, AI integration, test generation, and insight creation. These services orchestrate workflows like analyzing code structure, generating documentation, planning tests, and creating refactoring recommendations. The infrastructure layer handles persistence, file system operations, caching, and external AI provider integration. The presentation layer consists of VS Code UI components including tree view providers, webview panels, diagnostics providers, and command handlers.

The extension uses an event-driven architecture where file system watchers detect code changes and trigger analysis pipelines. Analysis results flow through multiple stages: initial code parsing extracts structural information, AI services enrich this data with semantic understanding and recommendations, formatters transform results into human-readable documentation, and UI components display formatted results to users. A caching layer stores analysis results to avoid redundant processing and improve performance.

AI integration follows a provider abstraction pattern allowing seamless switching between OpenAI and Anthropic Claude. The system implements rate limiting, retry logic with exponential backoff, and response parsing to ensure reliable AI interactions. Test generation uses an iterative workflow where the AI analyzes code, creates test plans, generates tests in small batches, executes them, captures results, and automatically fixes failures through multiple refinement cycles. All analysis results are persisted to a workspace directory structure enabling version history and cross-session continuity.

## Module Documentation

### . (other)

This module provides the Jest testing framework configuration for the project. It sets up the testing environment specifically for TypeScript-based unit tests, enabling developers to write and execute automated tests that verify code functionality and prevent regressions.

As a development infrastructure component, this module does not expose user-facing features directly. Instead, it supports developers in maintaining code quality by providing a configured testing environment. The configuration determines how tests are discovered, executed, and reported, ensuring consistent test behavior across the development team.

Developers interact with this configuration indirectly when running test commands (typically 'npm test' or 'jest'), which use these settings to execute the test suite. The module ensures that TypeScript files are properly transformed and tested, supporting the overall development workflow and continuous integration processes.

**Capabilities:**
- Configures the Jest testing framework for TypeScript-based unit tests
- Enables developers to run automated tests to verify code functionality
- Provides test environment setup for quality assurance workflows

### src/ai (other)

This module provides the core infrastructure for reliable and efficient communication with LLM providers. It ensures that all AI requests are automatically throttled to stay within API quotas, handles transient failures gracefully through automatic retries, and transforms raw AI responses into structured, typed documentation objects.

When users trigger AI-powered documentation generation, this module works behind the scenes to manage the request lifecycle. Rate limiting prevents API quota exhaustion by enforcing provider-specific request limits, while the retry handler automatically recovers from temporary failures like rate limit errors or timeouts using exponential backoff. The response parser then converts AI-generated text into organized documentation structures for file summaries, module summaries, insights, and product documentation.

The user experience is seamless: requests are automatically queued when rate limits are approached, failures are retried transparently, and only non-recoverable errors surface to the user after all retry attempts are exhausted. This creates a reliable AI documentation pipeline that handles the complexities of API management, allowing users to focus on generating high-quality documentation without worrying about API limits or transient errors.

**Capabilities:**
- Automatic rate limiting for LLM API requests across multiple providers (OpenAI, Claude)
- Intelligent retry handling with exponential backoff for failed API requests
- Structured parsing of AI-generated documentation into typed objects
- Transparent error recovery without user intervention for temporary failures
- Provider-specific rate limit enforcement (OpenAI: 60 requests/min, Claude: 50 requests/min)
- Fallback text parsing when AI returns non-JSON responses

### src/ai/providers (other)

This module provides a unified interface for interacting with multiple AI language model providers within the extension. Users can leverage AI capabilities powered by either OpenAI's GPT models or Anthropic's Claude models without needing to know which backend is being used. The module abstracts away provider-specific implementation details and presents a consistent experience across different AI services.

Users can send code-related queries and receive intelligent AI-generated responses for tasks like code explanation, refactoring suggestions, documentation generation, and other code analysis features. The module supports both conversational text responses and structured JSON outputs for data extraction tasks. A factory pattern manages provider instances, allowing users to switch between AI providers while maintaining the same workflow and user experience.

The module includes built-in safety features like timeout protection to prevent indefinite waits and clear error messaging when API credentials are missing or misconfigured. This ensures users have a reliable and predictable experience when using AI-powered features throughout the extension.

**Capabilities:**
- Switch between multiple AI provider backends (OpenAI GPT and Anthropic Claude) seamlessly
- Send natural language prompts to AI models and receive intelligent text responses
- Request and receive structured JSON data from AI for parsed information extraction
- Experience consistent AI-powered features regardless of which provider is active
- Get timeout protection with automatic 5-minute maximum wait time for AI responses
- Receive clear error messages when API keys are not configured

### src/analysis (other)

The analysis module provides comprehensive code intelligence capabilities that help users understand, refactor, and test their codebase more effectively. It uses AST parsing to extract deep insights about code behavior, function relationships, and structural patterns.

Users can leverage this module to receive detailed reports about function responsibilities, dependencies, and behavioral characteristics. The module analyzes branching logic, state mutations, and complexity metrics to generate actionable recommendations for test coverage improvements. For large files, it identifies refactoring opportunities by mapping out function relationships and responsibilities, making it easier to split monolithic code into maintainable units.

The analysis workflow starts with parsing code files to build a structural understanding, then extracts function-level metadata including what each function does, what it depends on, and how it affects system state. This information feeds into recommendation engines that suggest where to add tests, which functions to refactor, and how code behavior impacts the overall system. The module bridges the gap between raw code structure and human-understandable insights about code purpose and quality.

**Capabilities:**
- Deep code analysis using AST parsing to understand code structure and behavior
- Function-level metadata extraction including signatures, dependencies, and responsibilities
- Branch logic and complexity analysis to identify testing gaps
- State mutation and side effect detection
- Behavioral pattern recognition to understand what code does from a user perspective
- Large file refactoring recommendations based on function relationships
- Enhanced test coverage suggestions based on actual code paths and complexity

### src (other)

This module provides a comprehensive VS Code extension that leverages AI and static analysis to help developers understand, navigate, and improve their codebase. It automatically analyzes code structure, generates human-readable documentation, and surfaces actionable insights about code quality, organization, and architecture. The extension integrates deeply with VS Code's UI through tree views, diagnostics panels, and status bar indicators to provide a seamless experience.

Users can explore their codebase through multiple interactive views: an Analysis Viewer showing file/function hierarchies, an Insights Tree View displaying AI-generated recommendations, and an Insights Viewer for architecture documentation. The extension automatically detects entry points, maps dependencies, identifies test coverage gaps, and highlights problematic patterns like large files, orphaned code, circular dependencies, and overly complex functions. All analysis results are cached for performance and can be exported or viewed in various formats optimized for different AI assistants.

The workflow begins when users open a workspace or save files (if auto-analysis is enabled). The extension scans code, generates insights using LLM services, and displays results in sidebar tree views and the Problems panel. Users can click on any insight, file, or function to navigate directly to the relevant code location. The extension also provides specialized commands for generating documentation, creating test plans, and formatting analysis results for AI assistants like ChatGPT or Cursor AI.

**Capabilities:**
- Automated code analysis and insight generation for understanding codebase architecture and behavior
- AI-powered documentation generation that explains what code does from a user perspective
- Real-time code quality diagnostics and warnings displayed in VS Code Problems panel
- Interactive tree views for browsing analysis results, insights, and documentation
- Intelligent file and function navigation based on entry points and dependencies
- Test coverage analysis showing which functions have tests and which don't
- Code complexity and risk assessment to prioritize maintenance efforts
- Orphaned file detection to identify unused code
- Duplicate code detection across the codebase
- LLM-optimized prompt generation for AI-assisted code analysis
- Automatic analysis refresh with intelligent caching (24-hour expiration)
- File watching with auto-analysis on save
- Pattern-based code search with grep integration
- Architecture violation detection and refactoring suggestions

**Commands:**
- `shadow-watch.analyzeCode`: Analyzes the entire workspace to generate insights about code behavior, dependencies, and architecture
- `shadow-watch.generatePrompt`: Creates LLM-optimized prompts for AI code analysis with structured context
- `shadow-watch.refreshInsights`: Refreshes all analysis results, insights, and documentation views
- `shadow-watch.exportInsights`: Exports analysis results and insights to external formats
- `shadow-watch.navigateToCode`: Navigates to specific code locations from insights or analysis results
- `shadow-watch.clearCache`: Clears cached analysis results to force a fresh analysis
- `shadow-watch.generateDocumentation`: Generates comprehensive AI-powered product documentation from code analysis
- `shadow-watch.generateTestPlan`: Creates intelligent test plans showing what should be tested and why
- `shadow-watch.formatForAI`: Formats analysis results optimally for different AI assistants (ChatGPT, Cursor, etc.)

### src/config (other)

The config module provides comprehensive configuration management for the Shadow Watch extension, serving as the central hub for all user preferences and settings. It enables users to customize every aspect of the extension's behavior, from basic on/off controls to advanced LLM integration settings and performance parameters.

Users interact with this module primarily through VS Code's settings interface, where they can enable or disable the extension, control when automatic analysis occurs (such as on file save), and configure how diagnostics appear in their editor. The module supports fine-grained control over diagnostic severity thresholds, allowing users to filter which issues are shown based on importance. Additionally, users can select their preferred LLM provider (OpenAI or Claude) and choose from multiple output formats tailored for different AI chat interfaces.

The module implements a reactive architecture that immediately propagates configuration changes to all dependent components throughout the extension. This ensures that when users adjust settings like file size limits, ignored file patterns, or analysis debounce delays, the changes take effect without requiring extension restarts. This real-time responsiveness creates a seamless configuration experience while maintaining performance through intelligent debouncing and validation.

**Capabilities:**
- Centralized configuration management for all Shadow Watch extension settings
- Real-time configuration updates with change notifications to dependent components
- User-controlled extension activation and automatic analysis behavior
- Customizable diagnostic display and severity filtering
- Flexible LLM provider selection and output format configuration
- Performance tuning through file size limits and debounce settings
- File exclusion management via pattern-based ignore rules

### src/context (other)

This module serves as a bridge between code analysis operations and LLM-powered features. It takes raw code analysis results and transforms them into a structured format optimized for AI processing, making the codebase's structure and relationships comprehensible to language models.

The module automatically saves all analysis results to .shadow/docs/code-analysis.json in the workspace, creating a persistent knowledge base about the codebase. This persistence means that after the initial analysis, subsequent operations can leverage cached data for improved performance. The structured format ensures that AI features have consistent, well-organized access to information about functions, classes, dependencies, and code relationships.

Users benefit from this module indirectly through faster and more accurate AI-powered code operations. The saved analysis context enables features like intelligent code suggestions, documentation generation, and semantic search to work more effectively by providing the LLM with comprehensive understanding of the codebase structure and conventions.

**Capabilities:**
- Converts code analysis results into structured context for LLM processing
- Persists analysis data to disk for reuse across sessions
- Maintains historical analysis data in the workspace
- Provides formatted context suitable for AI-powered code operations
- Enables faster subsequent operations by caching analysis results

### src/domain/bootstrap (other)

The bootstrap module serves as the foundation layer that activates and initializes the VS Code extension, orchestrating all components necessary for code intelligence and analysis capabilities. When the extension starts, it automatically sets up analyzers, tree view providers, diagnostics panels, file watchers, and the status bar interface, making the full suite of features immediately available to users.

This module provides comprehensive command registration for all user interactions, including workspace-wide and file-specific analysis, insight management (viewing, copying, clearing), LLM provider configuration, and navigation through code structure and analysis reports. Users can trigger analysis through command palette actions or contextual menus, switch between different AI providers (OpenAI, Anthropic, etc.), and manage their analysis data through various clearing and export operations.

The bootstrapping process establishes automatic workflows such as real-time file watching that triggers re-analysis when code changes, populating tree views with structured insights and test results, and displaying diagnostics for code issues. This creates a seamless experience where the extension continuously monitors the workspace and provides up-to-date code intelligence without manual intervention, while still offering granular control through registered commands for specific analysis tasks and configuration changes.

**Capabilities:**
- Extension initialization and activation with all core components
- Command registration for code analysis, insights management, and LLM provider switching
- Automated workspace and file analysis for code intelligence
- Interactive navigation through code structure and analysis results
- Report generation and viewing for analysis insights and unit tests
- Real-time file monitoring and automatic re-analysis on code changes
- Multi-provider LLM integration with configurable AI backends
- Clipboard operations for sharing insights and analysis results
- Settings and data management for extension configuration

**Commands:**
- `analyze-workspace`: Analyzes the entire workspace to generate comprehensive code insights and intelligence
- `analyze-file`: Analyzes the currently open file for code insights and recommendations
- `copy-all-insights`: Copies all generated insights across the workspace to the clipboard
- `copy-file-insights`: Copies insights for a specific file to the clipboard
- `copy-single-insight`: Copies an individual insight item to the clipboard
- `clear-cache`: Clears all cached analysis results to force fresh analysis
- `clear-data`: Clears all extension data including settings and cached results
- `open-settings`: Opens the extension's configuration settings panel
- `open-analysis-report`: Opens the latest analysis report with detailed insights
- `open-unit-test-report`: Opens the latest unit test analysis report
- `switch-llm-provider`: Switches between different LLM providers (OpenAI, Anthropic, etc.)
- `copy-menu-structure`: Copies the current menu structure to the clipboard for reference
- `view-provider-status`: Displays the current LLM provider configuration and status
- `navigate-to-product-item`: Navigates to a specific product/code item in the editor
- `navigate-to-analysis-item`: Navigates to a specific analysis result item in reports
- `view-product-details`: Shows detailed information about a product/code structure item
- `view-insight-details`: Shows detailed information about a specific insight
- `view-unit-test-details`: Shows detailed information about unit test analysis results

### src/domain/formatters (other)

The formatters module transforms raw code analysis data and product insights into human-readable, well-structured Markdown documentation. It serves as the presentation layer that converts technical findings into accessible documentation format for developers and stakeholders.

Users can view comprehensive product documentation that includes feature descriptions, architectural insights, quality metrics, and user perspectives organized by interaction type. The module structures information into logical sections including overviews, feature lists, file categorizations, code quality findings, technical debt assessments, and dependency mappings.

The documentation workflow generates timestamped reports that present code quality findings with risk levels, improvement recommendations with effort estimates, and categorized file listings that help users understand the codebase structure. All output is formatted in Markdown for easy integration into documentation systems, version control, and knowledge bases.

**Capabilities:**
- Formats product documentation into structured Markdown documents with metadata
- Organizes documentation by interaction types (GUI, CLI, API)
- Presents code analysis insights with quality metrics and risk assessments
- Categorizes files by their architectural roles (Core, UI, Config, Tests)
- Displays technical debt items with priority levels and effort estimates
- Shows dependency information and external service integrations
- Generates timestamped documentation with generation metadata

### src/domain/handlers (other)

The Navigation Handler module provides comprehensive navigation and information display capabilities within the VS Code editor. It acts as the bridge between analysis results and the actual codebase, enabling users to seamlessly move from abstract analysis data to concrete code locations.

Users can navigate directly to files, functions, and API endpoints discovered during code analysis. When navigating to functions, the handler automatically positions the cursor and highlights the relevant code section. The module also provides rich information displays through webview panels, showing formatted code snippets with syntax highlighting, function signatures with parameter details, and file location information.

The primary workflow involves users interacting with analysis results (such as API endpoints, functions, or entry points) and clicking to navigate to their definitions in the code. The handler manages the entire process of opening files, positioning the editor view, highlighting relevant code sections, and displaying detailed contextual information. Error handling ensures users receive clear feedback when navigation attempts fail due to missing files or invalid locations.

**Capabilities:**
- Navigate directly to any file in the workspace from analysis results
- Jump to specific functions within files with automatic highlighting
- Navigate to API endpoint definitions in the codebase
- View detailed information about analysis items in rich webview panels
- See formatted code snippets with syntax highlighting for better readability
- View comprehensive function metadata including signatures, parameters, and return types
- Access precise file locations with paths and line numbers
- View formatted entry point details with contextual information
- Receive clear error notifications when navigation operations fail

### src/domain/prompts (other)

This module serves as the prompt engineering layer that powers all AI-driven code analysis and generation features. It constructs specialized, structured prompts that guide LLM interactions for tasks like architecture analysis, documentation creation, test generation, and code refactoring. Each prompt is carefully crafted to extract specific insights from codebases or generate particular outputs.

The module supports three primary workflows: (1) Code Analysis - generating prompts to understand project architecture, file relationships, and module structure; (2) Documentation Generation - creating prompts that produce product documentation, API references, and code summaries from source files; (3) Test & Refactoring - building prompts for automated test generation with full test plans and actual test code, plus detailed refactoring recommendations with step-by-step migration instructions.

Users interact with this module indirectly through higher-level features that leverage these prompts. The prompts handle context injection, constraint specification, and output formatting requirements to ensure LLM responses are consistent, actionable, and tailored to specific code analysis needs. This centralized approach ensures all AI interactions maintain quality standards and produce results in expected formats.

**Capabilities:**
- Generates structured prompts for AI-driven code analysis and architecture evaluation
- Creates prompts for automated documentation generation from source code
- Produces prompts for comprehensive test generation including setup, planning, and test code
- Builds prescriptive refactoring prompts with extraction plans and migration guidance
- Generates prompts for analyzing project structure, purpose, and target audience
- Creates prompts for module-level summaries and relationship mapping
- Provides templates for test framework setup and dependency recommendations

### src/domain/services (other)

This module provides core services that power the extension's intelligent automation features. It monitors file system changes and document saves to keep the UI and analysis up-to-date without user intervention. When files are created, modified, or deleted, the service automatically detects these changes and triggers appropriate updates across the extension.

The module enables AI-powered analysis through an iterative process where the LLM can progressively request additional files or perform grep searches across the codebase until it has sufficient information to complete its task. This allows for thorough, context-aware analysis without overwhelming the AI with unnecessary information upfront.

For test generation workflows, the module automatically detects which test framework is in use (Jest, Mocha, Vitest, or Pytest), validates the configuration, and identifies missing dependencies. Users receive clear feedback about what needs to be installed or configured before generated tests can run, eliminating manual setup and configuration guesswork.

**Capabilities:**
- Automatic detection and monitoring of file system changes across the workspace
- Intelligent test framework detection and configuration validation
- Iterative AI-powered codebase analysis with progressive information gathering
- Consolidated event handling to prevent duplicate processing of file changes
- Automatic dependency and configuration validation for test frameworks

### src/domain/services/testing (tests)

This module provides an AI-powered automated testing system that generates, executes, and validates tests for code in the workspace. It analyzes the codebase to create intelligent test plans, prioritizing which functions need testing based on complexity, risk, and existing coverage. The system automatically detects the test framework being used (Jest, Mocha, pytest, JUnit, etc.) and generates tests that follow the project's conventions and structure.

The testing workflow operates in stages: first analyzing functions to determine testability, then generating tests in small batches for incremental validation, executing those tests to capture results, and automatically fixing any failures through LLM-powered iteration. Users receive continuous progress updates showing which function is being tested (e.g., '3 of 10: validateUser'), along with real-time pass/fail results and detailed error messages for any failures.

The module handles the complete testing lifecycle from setup to reporting, including detecting missing test infrastructure, generating appropriate test directory structures, executing test suites with timeout handling, and producing comprehensive coverage reports. It supports multiple testing frameworks and programming languages, adapting its test generation strategy to match the project's existing patterns and conventions. Failed tests are automatically refined through multiple fix attempts, with each iteration learning from previous failures to improve test quality.

**Capabilities:**
- Automatically generates AI-powered tests for code functions in the workspace
- Creates prioritized test plans that determine which functions need testing and in what order
- Detects existing test framework configuration (Jest, pytest, JUnit, etc.) and generates appropriate test setups
- Executes tests and captures detailed results including pass/fail status, error messages, and coverage metrics
- Automatically fixes failing tests through iterative LLM-powered refinement
- Provides real-time progress updates during test generation, execution, and validation
- Generates comprehensive test reports with statistics on coverage, success rates, and identified issues

### src/domain/services/testing/types (tests)

This module provides the complete type system for automated test generation and execution workflows. It defines three core type categories: test setup types for environment configuration, test plan types for organizing and tracking which functions need tests generated, and test result types for capturing execution outcomes and generating reports.

Users interact with these types through a multi-phase workflow: first configuring the test environment with appropriate frameworks and dependencies, then planning which functions to test based on complexity and priority, generating tests for those functions, validating the generated tests, and finally executing them to produce detailed reports. The type system tracks each function's journey through these phases, maintaining status information, error details, retry counts, and timing metrics.

The module enables comprehensive visibility into the testing process, allowing users to see exactly which functions are testable, how many tests have been generated and validated, which tests are passing or failing, and where improvements are needed. Test reports include pass rates, execution durations, error messages with stack traces, and actionable recommendations for enhancing test quality. This structured approach ensures systematic test coverage across the entire codebase while providing clear feedback at every step.

**Capabilities:**
- Define structured type definitions for test generation workflows across setup, planning, generation, validation, and execution phases
- Track test generation progress and status for each function in the codebase with detailed phase tracking
- Monitor test execution results including pass/fail status, error details, and performance metrics
- Organize functions by testing complexity and priority for systematic test generation
- Configure test environments with language-specific frameworks and dependencies
- Generate comprehensive test reports with quality recommendations and pass rate statistics
- Track retry attempts and failure reasons for failed test generation or validation

### src/infrastructure/fileSystem (other)

The fileSystem module provides high-performance file operations for the extension through intelligent caching and parallel processing. It ensures users experience fast, responsive file access by maintaining an in-memory cache that automatically detects and reflects file changes, eliminating redundant disk reads when analyzing or processing the same files multiple times.

When working with multiple files, the module automatically filters out common non-source directories (node_modules, .git, dist, build, etc.) to focus on relevant source code. It processes files in parallel for maximum throughput while maintaining robust error handling that prevents individual file failures from disrupting entire operations. This results in faster analysis, smoother navigation, and more reliable file operations throughout the extension.

The module serves as the foundation for all file-based operations in the extension, providing a unified system that balances performance with accuracy. Users benefit from near-instantaneous access to previously opened files while always seeing current content, making workflows like code analysis, documentation generation, and multi-file operations significantly faster and more efficient.

**Capabilities:**
- Accelerates file operations through intelligent in-memory caching
- Automatically filters out non-source directories and files during processing
- Processes multiple files simultaneously for improved performance
- Detects file changes automatically to ensure content accuracy
- Handles file processing errors gracefully without disrupting workflows

### src/infrastructure/persistence (other)

The persistence module manages the storage and organization of AI-generated analysis results within the workspace. It provides a structured approach to saving different types of analysis outputs including product documentation, architecture insights, and analysis summaries to a dedicated .shadow directory hierarchy.

Users benefit from automatic organization of analysis results into timestamped directories, ensuring that each analysis run is preserved and easily accessible. Product documentation is saved to .shadow/docs/product-docs-[timestamp]/ directories, while architecture insights are stored in .shadow/insights/architecture-[timestamp]/ directories. All documentation is formatted as markdown files and organized according to the source file paths they document.

The module implements a versioning strategy through timestamp-based directories, allowing users to maintain a complete history of analysis runs without overwriting previous results. This enables comparison of analyses over time and provides a reliable audit trail of how documentation and insights have evolved throughout the development process.

**Capabilities:**
- Persist AI-generated analysis results to a structured .shadow directory in the workspace
- Store product documentation with timestamp-based versioning
- Save architecture insights in organized, timestamped directories
- Maintain historical analysis runs through timestamped directory structure
- Organize documentation as markdown files structured by file paths
- Preserve analysis history by creating new directories for each run

### src/infrastructure (other)

The infrastructure module provides a centralized progress notification service that keeps users informed during long-running operations. Users can see real-time progress updates with descriptive titles and messages, allowing them to understand what the application is doing and how much work remains.

This module enables users to monitor operations that take significant time to complete, such as file processing, data analysis, or network requests. Progress notifications can appear in various locations throughout the interface, providing visibility without blocking other work. For operations that support cancellation, users can interrupt the process if they change their mind or need to prioritize other tasks.

The service handles the complexity of managing multiple simultaneous operations, ensuring that users can track several processes at once without confusion. Progress updates increment as work completes, giving users clear feedback about operation status and estimated completion.

**Capabilities:**
- Display progress notifications to users during long-running operations with customizable titles and messages
- Provide cancellation support for operations that can be interrupted by user request
- Show progress indicators in different UI locations such as notification areas and windows
- Track and report incremental progress updates as operations advance
- Manage multiple concurrent progress notifications for parallel operations

## File-Level Documentation

*Detailed documentation for 50 files*

### jest.config.js

**Role:** Core Logic

**Purpose:** Configures Jest test framework for running TypeScript unit tests in the project

**User Actions:**
- No direct user-facing actions - this is a development configuration file

**Key Functions:**
- `preset`: Uses ts-jest preset to enable TypeScript testing
  - Inputs: Configuration string
  - Outputs: Jest configuration with TypeScript support
- `testMatch`: Defines which files are recognized as test files
  - Inputs: Array of glob patterns
  - Outputs: Matches *.test.ts and *.spec.ts files
- `transform`: Configures TypeScript compilation for test files
  - Inputs: TypeScript files with ES2020 target
  - Outputs: Compiled JavaScript executable by Jest
- `collectCoverageFrom`: Specifies which files to include in coverage reports
  - Inputs: Array of glob patterns
  - Outputs: Coverage data excluding mocks, tests, and type definitions
- `moduleNameMapper`: Maps vscode module imports to mock implementation
  - Inputs: Module path mappings
  - Outputs: Mocked vscode module for testing

### src/ai/llmRateLimiter.ts

**Role:** Core Logic

**Purpose:** Manages rate limiting for LLM API requests to prevent exceeding provider API quotas

**User Actions:**
- API requests to OpenAI and Claude are automatically throttled to stay within rate limits
- Requests that would exceed rate limits are prevented from being sent
- Different rate limits are enforced for different LLM providers (OpenAI: 60/min, Claude: 50/min)

**Key Functions:**
- `constructor`: Initializes rate limiter with default limits for OpenAI (60/min) and Claude (50/min)
  - Inputs: none
  - Outputs: RateLimiter instance
- `configure`: Sets custom rate limit configuration for a specific LLM provider
  - Inputs: provider (LLMProvider), config (RateLimitConfig with maxRequests and windowMs)
  - Outputs: void
- `canMakeRequest`: Checks if a new request is allowed based on current rate limit status
  - Inputs: provider (LLMProvider)
  - Outputs: boolean - true if request can be made, false if rate limit would be exceeded
- `recordRequest`: Records a request timestamp for rate limiting tracking
  - Inputs: provider (LLMProvider)
  - Outputs: void

### src/ai/llmResponseParser.ts

**Role:** Core Logic

**Purpose:** Parses and extracts structured data from LLM text responses into typed objects for different analysis types (file summaries, module summaries, insights, and product documentation).

**User Actions:**
- Converts raw AI-generated text responses into organized documentation
- Extracts file purposes and actions from AI analysis
- Generates structured module and product documentation from AI responses
- Provides fallback text parsing when AI returns non-JSON responses

**Key Functions:**
- `parseFileSummary`: Converts LLM response text into a FileSummary object with purpose, actions, and dependencies
  - Inputs: content (LLM response text), filePath (string), role (string)
  - Outputs: FileSummary object
- `parseModuleSummary`: Extracts module-level documentation including purpose, features, and structure from LLM response
  - Inputs: content (LLM response text), moduleName (string)
  - Outputs: ModuleSummary object
- `parseInsights`: Structures AI insights about the codebase into categories like architecture patterns and improvement areas
  - Inputs: content (LLM response text), context (AnalysisContext)
  - Outputs: LLMInsights object
- `parseProductDocumentation`: Builds comprehensive product documentation from LLM analysis including overview, features, and use cases
  - Inputs: content (LLM response text)
  - Outputs: EnhancedProductDocumentation object
- `parsePurposeAnalysis`: Extracts product purpose analysis including main purpose, target audience, and value proposition
  - Inputs: content (LLM response text)
  - Outputs: ProductPurposeAnalysis object
- `extractSection`: Helper that pulls out a specific labeled section from unstructured text
  - Inputs: content (text), sectionName (string)
  - Outputs: Extracted section text or empty string
- `extractListSection`: Helper that extracts bullet points or list items from a text section
  - Inputs: content (text), sectionName (string)
  - Outputs: Array of list items

### src/ai/llmRetryHandler.ts

**Role:** Core Logic

**Purpose:** Handles automatic retry logic for LLM API requests with exponential backoff when requests fail due to rate limits, timeouts, or temporary errors

**User Actions:**
- Automatic retry when AI requests fail due to rate limits or temporary issues
- Delayed retry attempts that increase wait time between retries
- Transparent error recovery without user intervention for recoverable errors
- Final error display only after all retry attempts are exhausted

**Key Functions:**
- `executeWithRetry`: Executes an LLM operation with automatic retry on failure
  - Inputs: operation (async function to execute), options (retry configuration including maxRetries, delays, retryable error types, callback)
  - Outputs: Promise resolving to the operation result, or throws error after all retries exhausted
- `isRetryableError`: Determines if an error should trigger a retry attempt
  - Inputs: error object, list of retryable error patterns
  - Outputs: Boolean indicating whether the error is retryable

### src/ai/providers/ILLMProvider.ts

**Role:** Core Logic

**Purpose:** Defines a standard interface for interacting with different AI language model providers (OpenAI, Claude, custom providers) in a unified way

**User Actions:**
- User receives AI-generated text responses to their queries
- User receives structured JSON data from AI for parsed information
- User may experience different response formats (text or JSON) depending on request type

**Key Functions:**
- `isConfigured`: Checks if the AI provider has valid credentials and is ready to accept requests
  - Inputs: none
  - Outputs: boolean indicating configuration status
- `sendRequest`: Sends a prompt to the AI and receives a text response
  - Inputs: LLMRequestOptions (model, system prompt, messages, max tokens, temperature, response format)
  - Outputs: LLMResponse containing content string, finish reason, model name, and raw response
- `sendStructuredRequest`: Sends a prompt to the AI and receives parsed JSON data with optional follow-up requests
  - Inputs: LLMRequestOptions and optional JSON schema
  - Outputs: StructuredOutputResponse with typed data and optional file/grep requests
- `getName`: Returns the identifier of the AI provider
  - Inputs: none
  - Outputs: string with provider name

### src/ai/providers/anthropicProvider.ts

**Role:** Core Logic

**Purpose:** Integrates Anthropic's Claude AI models to provide language model capabilities for code analysis and generation within the extension.

**User Actions:**
- Sends prompts to Claude AI and receives intelligent responses for code-related tasks
- Receives structured JSON responses from Claude for data extraction tasks
- Experiences Claude AI-powered features like code explanation, refactoring suggestions, and documentation generation
- Gets error messages when Claude API key is not configured

**Key Functions:**
- `isConfigured`: Checks if Claude API key is set up and provider is ready to use
  - Inputs: none
  - Outputs: boolean indicating configuration status
- `getName`: Returns the provider identifier
  - Inputs: none
  - Outputs: string 'claude'
- `sendRequest`: Sends a prompt to Claude and returns the AI-generated response
  - Inputs: LLMRequestOptions with messages, system prompt, model, and max tokens
  - Outputs: LLMResponse with generated text and usage statistics
- `sendStructuredRequest`: Sends a prompt to Claude expecting a JSON response and extracts structured data
  - Inputs: LLMRequestOptions with messages and schema information
  - Outputs: StructuredOutputResponse with parsed JSON data and usage statistics
- `initialize`: Sets up the Anthropic client with API key from configuration
  - Inputs: none (reads from config manager)
  - Outputs: none (initializes client)

### src/ai/providers/openAIProvider.ts

**Role:** Core Logic

**Purpose:** Provides OpenAI integration for sending chat requests and receiving AI-generated responses with support for structured JSON outputs.

**User Actions:**
- Sends chat messages to OpenAI's GPT models and receives AI-generated responses
- Receives structured JSON responses from AI when requested
- Experiences timeout protection with 5-minute maximum wait time for responses
- Gets error messages when OpenAI API key is not configured

**Key Functions:**
- `initialize`: Sets up OpenAI client with API key from configuration
  - Inputs: None
  - Outputs: void
- `isConfigured`: Checks if provider has valid API key and is ready to use
  - Inputs: None
  - Outputs: boolean indicating if configured
- `getName`: Returns provider identifier
  - Inputs: None
  - Outputs: string 'openai'
- `sendRequest`: Sends chat completion request to OpenAI and returns response
  - Inputs: LLMRequestOptions (system prompt, messages, model, response format)
  - Outputs: Promise<LLMResponse> with content and finish reason
- `sendStructuredOutputRequest`: Sends request expecting structured JSON response conforming to a schema
  - Inputs: LLMRequestOptions with JSON schema
  - Outputs: Promise<StructuredOutputResponse> with parsed JSON object

### src/ai/providers/providerFactory.ts

**Role:** Core Logic

**Purpose:** Factory that creates and manages AI provider instances (OpenAI, Claude) for the application

**User Actions:**
- Switch between different AI providers (OpenAI or Claude) for generating responses
- Receive AI responses from the currently configured provider
- Experience consistent AI functionality regardless of which provider is active

**Key Functions:**
- `getProvider`: Returns a specific AI provider instance by name
  - Inputs: provider: 'openai' | 'claude'
  - Outputs: ILLMProvider instance
- `getCurrentProvider`: Returns the AI provider that is currently active in configuration
  - Inputs: none
  - Outputs: ILLMProvider instance
- `isProviderConfigured`: Checks if a specific provider has valid configuration/API key
  - Inputs: provider: 'openai' | 'claude'
  - Outputs: boolean
- `getConfiguredProviders`: Returns list of all providers that have valid API keys
  - Inputs: none
  - Outputs: LLMProvider[] array

### src/analysis/enhancedAnalyzer.ts

**Role:** Core Logic

**Purpose:** Provides deep code analysis capabilities that extract function metadata, branch logic, dependencies, state mutations, and behavioral patterns from code files using AST parsing.

**User Actions:**
- Receives detailed analysis of code behavior including what functions do and how they interact
- Gets information about code complexity and branching logic
- Sees enhanced test coverage recommendations based on code structure
- Receives behavioral hints about what code does from a user perspective

**Key Functions:**
- `analyzeFileMetadata`: Analyzes a file and extracts enhanced metadata for all functions including branches, dependencies, and behavioral patterns
  - Inputs: filePath (string), content (string), language (string), functions (FunctionInfo[])
  - Outputs: Promise<Map<string, FunctionMetadata>> - Map of function names to their metadata
- `analyzeTypeScriptFunction`: Performs AST-based analysis on TypeScript/JavaScript functions to extract detailed metadata
  - Inputs: filePath (string), content (string), func (FunctionInfo), functionContent (string)
  - Outputs: Promise<FunctionMetadata> - Detailed function metadata including AST-parsed information
- `analyzeFunctionWithRegex`: Provides fallback regex-based analysis for languages that don't have AST parsing support
  - Inputs: filePath (string), func (FunctionInfo), functionContent (string), language (string)
  - Outputs: FunctionMetadata - Basic function metadata extracted via pattern matching
- `extractFunctionContent`: Extracts the source code content of a function between specified line numbers
  - Inputs: content (string), startLine (number), endLine (number)
  - Outputs: string - The extracted function source code

### src/analysis/functionAnalyzer.ts

**Role:** Core Logic

**Purpose:** Analyzes functions in large code files to extract detailed information about signatures, dependencies, and responsibilities for refactoring recommendations.

**User Actions:**
- Receives refactoring reports that identify which functions in large files should be split or refactored
- Gets function-level insights showing what each function does and what it depends on
- Views function responsibilities and their relationships to other code

**Key Functions:**
- `analyzeFunctions`: Analyzes all functions in files larger than the threshold size
  - Inputs: codeAnalysis (CodeAnalysis object), largeFileThreshold (optional, default 500 lines)
  - Outputs: Promise<FunctionAnalysis[]> - array of detailed function analyses
- `analyzeFunction`: Performs detailed analysis on a single function
  - Inputs: filePath (string), func (FunctionInfo), codeAnalysis (CodeAnalysis)
  - Outputs: Promise<FunctionAnalysis | null> - detailed function analysis or null if failed
- `resolveFilePath`: Resolves and validates the full path to a source file
  - Inputs: filePath (string), codeAnalysis (CodeAnalysis)
  - Outputs: string or null - full resolved file path

### src/analysisViewer.ts

**Role:** GUI View

**Purpose:** Provides a tree view UI in VSCode that displays structured code analysis results including statistics, files, functions, and entry points

**User Actions:**
- View a hierarchical tree of code analysis results in the sidebar
- See 'No analysis available' message when no analysis has been run
- Browse analysis statistics (total files, functions, entry points, lines of code)
- Explore files organized by directory structure
- View details about each analyzed file (path, language, line count, function count)
- Browse all functions found in the codebase with their locations
- See entry points detected in the code
- Click on files, functions, or entry points to navigate to their location in the editor
- View tooltips with additional context when hovering over tree items
- Refresh the analysis view when new analysis results are available

**Key Functions:**
- `setAnalysis`: Updates the viewer with new code analysis results and refreshes the display
  - Inputs: analysis: CodeAnalysis | null
  - Outputs: void
- `refresh`: Triggers the tree view to update and redraw
  - Inputs: none
  - Outputs: void
- `getTreeItem`: Returns the VSCode TreeItem representation for a given analysis item
  - Inputs: element: AnalysisItem
  - Outputs: vscode.TreeItem
- `getChildren`: Returns child items for a given tree node or root items if no element provided
  - Inputs: element?: AnalysisItem
  - Outputs: Thenable<AnalysisItem[]>
- `getRootItems`: Generates top-level tree items (statistics, files, functions, entry points)
  - Inputs: none
  - Outputs: AnalysisItem[]
- `getStatisticsItems`: Creates tree items showing analysis statistics (counts and metrics)
  - Inputs: none
  - Outputs: AnalysisItem[]
- `getFilesItems`: Generates tree items for files organized by directory structure
  - Inputs: none
  - Outputs: AnalysisItem[]
- `getFileDetails`: Returns detailed information about a specific file including functions
  - Inputs: element: AnalysisItem
  - Outputs: AnalysisItem[]
- `getDirectoryFiles`: Returns files and subdirectories within a directory node
  - Inputs: element: AnalysisItem
  - Outputs: AnalysisItem[]

### src/analyzer.ts

**Role:** Core Logic

**Purpose:** Defines data structures and interfaces for representing code analysis results including file metrics, function metadata, dependencies, test mappings, and code relationships

**User Actions:**
- View total file, line, and function counts across the codebase
- See list of large files that may need optimization
- Identify orphaned files not imported anywhere
- Discover entry points into the application
- Find duplicate code blocks across the codebase
- Review function risk levels (high, medium, low) for maintenance priority
- See which functions have test coverage and which don't
- View import relationships between files
- Identify functions with external dependencies (databases, HTTP, filesystem, etc.)

**Key Functions:**
- `CodeAnalysis`: Main interface representing complete codebase analysis results
  - Inputs: N/A (interface)
  - Outputs: Structure containing files, functions, imports, orphans, entry points, duplicates, and optional enhanced metadata
- `FunctionMetadata`: Detailed metadata about a single function including parameters, branches, dependencies, and risk assessment
  - Inputs: N/A (interface)
  - Outputs: Function name, file location, parameters, return type, visibility, branches, dependencies, state mutations, risk level
- `TestMapping`: Maps source code to test coverage
  - Inputs: N/A (interface)
  - Outputs: Source files to test files mapping, functions to test names mapping, list of uncovered functions
- `DependencyInfo`: Describes external or internal dependencies used by functions
  - Inputs: N/A (interface)
  - Outputs: Dependency name, type (db/http/filesystem/etc), whether internal or external, line number
- `BranchInfo`: Represents control flow branches for complexity analysis
  - Inputs: N/A (interface)
  - Outputs: Branch type (if/loop/try/etc), human-readable condition, line number
- `StateMutationInfo`: Tracks how functions modify state
  - Inputs: N/A (interface)
  - Outputs: Target of mutation, mutation type (assign/modify/delete/read), line number

### src/cache.ts

**Role:** Core Logic

**Purpose:** Manages persistent storage and retrieval of code analysis results with automatic expiration

**User Actions:**
- Faster workspace analysis on subsequent loads (cached results loaded instantly)
- Automatic refresh of analysis after 24 hours to ensure accuracy
- Analysis cache cleared when user requests it

**Key Functions:**
- `constructor`: Initializes cache storage location and ensures directory exists
  - Inputs: storagePath: string (where to store cache files)
  - Outputs: AnalysisCache instance
- `get`: Retrieves cached analysis for a workspace if available and not expired
  - Inputs: workspaceRoot: string (workspace identifier)
  - Outputs: Promise<CodeAnalysis | null> (cached data or null if missing/expired)
- `set`: Saves analysis results to cache with current timestamp
  - Inputs: workspaceRoot: string, data: CodeAnalysis (analysis to cache)
  - Outputs: Promise<void>
- `clear`: Removes all cached analysis files from storage
  - Inputs: none
  - Outputs: Promise<void>
- `getCacheKey`: Generates safe filename from workspace path
  - Inputs: workspaceRoot: string
  - Outputs: string (base64-encoded safe filename)

### src/config/configurationManager.ts

**Role:** Core Logic

**Purpose:** Manages all Shadow Watch extension settings and notifies components when configuration changes

**User Actions:**
- User can enable/disable the Shadow Watch extension through settings
- User can toggle automatic analysis when saving files
- User can show/hide inline hints for diagnostics in the editor
- User can configure severity thresholds for diagnostics
- User can select LLM provider (OpenAI or Claude) for analysis
- User can choose output format for LLM reports (Cursor, ChatGPT, Generic, Compact)
- User can set file size limits for analysis
- User can configure ignored file patterns
- User can adjust analysis debounce delays

**Key Functions:**
- `constructor`: Initializes the configuration manager and sets up the configuration change watcher
  - Inputs: none
  - Outputs: ConfigurationManager instance
- `onConfigurationChange`: Registers a callback to be notified when Shadow Watch settings change
  - Inputs: callback function
  - Outputs: void
- `removeConfigurationChangeListener`: Unregisters a configuration change callback
  - Inputs: callback function
  - Outputs: void
- `enabled`: Gets whether the Shadow Watch extension is enabled
  - Inputs: none (getter)
  - Outputs: boolean
- `analyzeOnSave`: Gets whether analysis should run automatically when files are saved
  - Inputs: none (getter)
  - Outputs: boolean
- `showInlineHints`: Gets whether inline diagnostic hints should be displayed in the editor
  - Inputs: none (getter)
  - Outputs: boolean

### src/context/analysisContextBuilder.ts

**Role:** Core Logic

**Purpose:** Converts code analysis results into a format suitable for LLM processing and saves them to disk for future reference

**User Actions:**
- Code analysis results are automatically saved to .shadow/docs/code-analysis.json in the workspace
- Analysis data persists between sessions for faster subsequent operations

**Key Functions:**
- `convertCodeAnalysisToContext`: Transforms CodeAnalysis data structure into AnalysisContext format suitable for LLM consumption
  - Inputs: CodeAnalysis object containing files, imports, entry points, and statistics
  - Outputs: AnalysisContext object with formatted file information, imports, entry points, orphaned files, and totals
- `saveCodeAnalysis`: Persists code analysis results to a JSON file in the workspace's .shadow/docs directory with generation metadata
  - Inputs: CodeAnalysis object to be saved
  - Outputs: void (writes to file system)

### src/diagnosticsProvider.ts

**Role:** Core Logic

**Purpose:** Manages the display of code insights and warnings in the VS Code Problems panel by creating and updating diagnostic markers.

**User Actions:**
- Code insights appear as warnings or errors in the Problems panel
- Inline squiggly lines appear under problematic code lines
- Clicking on a problem in the Problems panel navigates to the affected code location
- Problem markers are grouped by file in the Problems panel
- Diagnostics show 'Shadow Watch' as the source in the Problems panel

**Key Functions:**
- `updateDiagnostics`: Updates all diagnostic markers across all files based on a collection of insights
  - Inputs: insights: Insight[] - array of code insights to display
  - Outputs: void - displays diagnostics in Problems panel
- `updateDiagnosticsForFile`: Updates diagnostic markers for a specific file only
  - Inputs: uri: vscode.Uri - file location, insights: Insight[] - insights for that file
  - Outputs: void - displays diagnostics for the specified file
- `clear`: Removes all diagnostic markers from the Problems panel
  - Inputs: none
  - Outputs: void - clears all displayed diagnostics
- `createDiagnostic`: Converts an insight into a VS Code diagnostic marker with severity, location, and description
  - Inputs: insight: Insight - the insight to convert
  - Outputs: vscode.Diagnostic - a VS Code diagnostic object
- `dispose`: Cleans up and removes the diagnostic collection when no longer needed
  - Inputs: none
  - Outputs: void - releases resources

### src/domain/bootstrap/commandRegistry.ts

**Role:** Core Logic

**Purpose:** Registers all VS Code commands for the extension, mapping command IDs to their handler functions

**User Actions:**
- Analyze entire workspace to generate insights
- Analyze current file for code insights
- Copy all generated insights to clipboard
- Copy insights for a specific file to clipboard
- Copy individual insight to clipboard
- Clear cached analysis results
- Clear all extension data
- Open extension settings
- Open latest analysis report
- Open latest unit test report
- Switch between different LLM providers (OpenAI, Anthropic, etc.)
- Copy menu structure to clipboard
- View current LLM provider status
- Navigate to product items in the code
- Navigate to analysis items in reports
- View detailed information about product items
- View detailed information about insights
- View detailed information about unit test results

**Key Functions:**
- `register`: Registers all VS Code commands with their handler functions
  - Inputs: context (ExtensionContext), components (ExtensionComponents)
  - Outputs: void
- `analyzeWorkspace`: Triggers analysis of entire workspace
  - Inputs: none
  - Outputs: Promise<void>
- `analyzeCurrentFile`: Triggers analysis of the currently open file
  - Inputs: none
  - Outputs: Promise<void>
- `copyAllInsights`: Copies all generated insights to clipboard
  - Inputs: none
  - Outputs: Promise<void>
- `copyInsight`: Copies a specific insight item to clipboard
  - Inputs: item (insight object)
  - Outputs: Promise<void>
- `clearCache`: Clears cached analysis data
  - Inputs: none
  - Outputs: Promise<void>
- `switchProvider`: Switches between different LLM providers
  - Inputs: none
  - Outputs: Promise<void>
- `navigateToProductItem`: Navigates to a product item in the code
  - Inputs: item (ProductNavItem)
  - Outputs: Promise<void>
- `showProviderStatus`: Displays current LLM provider status
  - Inputs: none
  - Outputs: Promise<void>

### src/domain/bootstrap/extensionBootstrapper.ts

**Role:** Core Logic

**Purpose:** Initializes and bootstraps all extension components when the VS Code extension activates, setting up analyzers, viewers, providers, and services needed for code intelligence features.

**User Actions:**
- Extension activates and displays status bar item showing analysis status
- Tree views populate with insights, analysis results, unit tests, and reports
- Diagnostics panel shows code issues and warnings from static analysis
- Product navigator becomes available for browsing code structure
- Reports viewer displays generated analysis reports
- File watching begins for automatic re-analysis on code changes

**Key Functions:**
- `bootstrap`: Main entry point that initializes all extension components in proper order
  - Inputs: vscode.ExtensionContext
  - Outputs: ExtensionComponents object containing all initialized services
- `createAnalyzer`: Instantiates the code analyzer component
  - Inputs: none
  - Outputs: CodeAnalyzer instance
- `createInsightGenerator`: Creates the insight generation service
  - Inputs: none
  - Outputs: InsightGenerator instance
- `createTreeProviders`: Sets up all tree view data providers for displaying structured data
  - Inputs: none
  - Outputs: Multiple tree provider instances
- `registerViews`: Registers custom VS Code views for insights, analysis, and reports
  - Inputs: vscode.ExtensionContext, tree providers
  - Outputs: Registered tree views
- `initializeServices`: Starts background services like file watching and diagnostics
  - Inputs: ExtensionComponents
  - Outputs: void
- `setupStatusBar`: Creates and configures the status bar item for displaying extension state
  - Inputs: vscode.ExtensionContext
  - Outputs: vscode.StatusBarItem

### src/domain/formatters/documentationFormatter.ts

**Role:** Core Logic

**Purpose:** Formats product documentation and code analysis insights into human-readable Markdown documents with structured sections and metadata.

**User Actions:**
- Views product documentation in Markdown format with overview, features, and user perspectives
- Sees documentation organized by GUI, CLI, and API interaction types
- Reads feature descriptions, architectural insights, and quality metrics in formatted sections
- Views timestamped documentation with generation date and time
- Reviews code quality findings with risk levels and improvement recommendations
- Sees categorized file listings organized by role (Core, UI, Config, Tests)
- Reads technical debt items with priority levels and effort estimates
- Views dependency information and external service integrations

**Key Functions:**
- `formatEnhancedDocsAsMarkdown`: Converts enhanced product documentation into a complete Markdown document with all sections
  - Inputs: EnhancedProductDocumentation object with overview, features, user perspectives, architecture, etc.
  - Outputs: Formatted Markdown string with headers, lists, and metadata
- `formatInsightsAsMarkdown`: Converts LLM code analysis insights into a structured Markdown report
  - Inputs: LLMInsights object with strengths, improvements, architecture, quality metrics, etc.
  - Outputs: Formatted Markdown string with analysis sections and findings

### src/domain/handlers/navigationHandler.ts

**Role:** Core Logic

**Purpose:** Handles navigation between code files, functions, and displays detailed information about analysis items in the VS Code editor.

**User Actions:**
- Navigate to a specific file in the workspace
- Navigate to a specific function within a file and highlight it
- Navigate to API endpoints and see their location in code
- View detailed information about analysis items in a webview panel
- See formatted code snippets with syntax highlighting
- View function signatures, parameters, and return types
- See file paths and line numbers for code locations
- View entry point details with formatted information
- See error messages when navigation fails

**Key Functions:**
- `navigateToProductItem`: Opens a file or navigates to a function location based on the product navigation item type
  - Inputs: ProductNavItem (containing file path, function name, and line information)
  - Outputs: Promise<void> (opens document in editor)
- `navigateToAnalysisItem`: Opens a file and positions cursor at a specific line number for analysis items
  - Inputs: AnalysisItem (containing file path and line number)
  - Outputs: Promise<void> (opens document and reveals line)
- `showItemDetails`: Displays detailed information about an analysis item in a webview panel with formatted HTML
  - Inputs: AnalysisItem (analysis data to display)
  - Outputs: void (creates or updates webview panel)
- `generateDetailsHtml`: Creates formatted HTML content for displaying item details with syntax highlighting and structured layout
  - Inputs: AnalysisItem (item to format)
  - Outputs: string (HTML content)
- `escapeHtml`: Sanitizes text content for safe HTML rendering
  - Inputs: string (text to escape)
  - Outputs: string (escaped HTML)
- `formatValue`: Converts various data types into readable HTML-formatted strings
  - Inputs: any (value to format)
  - Outputs: string (formatted HTML)


*... and 30 more files*
