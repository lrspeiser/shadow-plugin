# Product Documentation

*Generated: 11/21/2025, 9:54:15 AM (2025-11-21 17:54:15 UTC)*

---

## Product Overview

Shadow Watch is an AI-powered VS Code extension that provides developers with comprehensive code analysis, automated documentation generation, and intelligent testing capabilities. It analyzes your entire codebase to understand its architecture, identify quality issues, and generate actionable insights—all without leaving your editor. The extension monitors your code continuously, automatically updating its analysis when you save files, and presents findings through an intuitive tree-based interface alongside your familiar VS Code panels.

Developers interact with Shadow Watch through multiple integrated views: a sidebar navigator for browsing documentation and analysis results, a dedicated insights panel showing AI-generated recommendations, the Problems panel for diagnostics, and output channels for detailed reports. The extension connects to AI language models (OpenAI GPT or Anthropic Claude) to generate human-readable documentation, suggest refactorings, create test plans, and identify architectural improvements. All analysis results are cached locally for instant access and preserved between sessions.

The extension transforms static code analysis into actionable development guidance. It identifies circular dependencies, dead code, orphaned files, overly complex functions, and missing test coverage—then provides specific recommendations for improvement. Developers can generate comprehensive test suites with a single command, navigate directly from insights to source code locations, and maintain up-to-date product documentation as their codebase evolves.

## What It Does

- Analyzes entire codebase architecture and generates AI-powered documentation describing what the application does
- Identifies code quality issues including circular dependencies, dead code, large files, and orphaned modules
- Generates comprehensive test plans and automatically creates unit tests for functions that lack coverage
- Monitors file changes in real-time and automatically updates analysis results when code is saved
- Provides AI-generated refactoring recommendations with detailed migration strategies
- Creates visual tree-based navigation of code structure, test coverage, and architecture insights
- Displays diagnostic warnings and errors in VS Code's Problems panel for quick issue identification
- Generates multiple documentation formats optimized for different AI chat interfaces (Cursor, ChatGPT, Claude)
- Maps test files to source code to identify untested functions and components
- Analyzes function complexity and identifies candidates for refactoring or splitting
- Detects entry points and visualizes code flow through the application
- Validates test configurations and automatically sets up testing frameworks (Jest, Mocha, Vitest, Pytest)

## User Perspective

### GUI

- Browse code analysis results in a hierarchical tree view in the VS Code sidebar
- View AI-generated architecture insights and recommendations in a dedicated insights panel
- Navigate directly to source code locations by clicking on insights, issues, or analysis results
- See diagnostic warnings and errors displayed in VS Code's Problems panel with severity indicators
- Monitor analysis progress through status bar indicators and progress notifications
- Access detailed test execution results showing pass/fail status for each test file
- View comprehensive product documentation generated from codebase analysis
- Switch between different AI providers (OpenAI, Claude) through configuration settings
- Copy formatted analysis results to clipboard for sharing or pasting into AI chat interfaces
- Clear cached analysis data and regenerate insights on demand

### CI/CD

- Integrate automated code analysis into CI/CD pipelines through command-line execution
- Generate and validate test suites as part of automated build processes
- Produce documentation artifacts during deployment workflows
- Cache analysis results for faster subsequent pipeline runs

## Workflow Integration

- Code review workflow: Analyze changes and identify quality issues before committing
- Documentation workflow: Generate and update product documentation as features are developed
- Testing workflow: Discover untested code, create test plans, generate tests, and validate coverage
- Refactoring workflow: Identify complex functions, receive AI-powered refactoring guidance, and track improvements
- Architecture review workflow: Understand codebase structure, detect anti-patterns, and plan improvements
- Onboarding workflow: New developers use generated documentation to understand the codebase quickly
- Maintenance workflow: Continuously monitor code quality and address issues as they arise

## Problems Solved

- Eliminates manual documentation effort by automatically generating comprehensive product and architecture docs
- Reduces time spent understanding unfamiliar codebases through AI-generated architecture insights
- Prevents circular dependency bugs by detecting them early in development
- Identifies dead code and orphaned files that waste maintenance effort
- Reduces technical debt by highlighting overly complex functions that need refactoring
- Improves test coverage by automatically discovering untested functions and generating test suites
- Saves time navigating large codebases by providing instant jumps from insights to source code
- Prevents API rate limit errors when using AI services through automatic throttling and retry logic
- Maintains documentation consistency across team members through automated generation
- Reduces context switching by integrating all analysis, documentation, and testing tools within VS Code

## Architecture Summary

Shadow Watch is built as a VS Code extension with a modular architecture centered around AI-powered analysis capabilities. The extension initializes through a bootstrapper that orchestrates multiple independent services: file watching, code analysis, insight generation, documentation formatting, and test automation. These services communicate through a centralized configuration manager that tracks user preferences and notifies components when settings change. All analysis results flow through a caching layer that persists data to disk and reloads it instantly when workspaces reopen.

The AI integration layer abstracts multiple language model providers (OpenAI and Anthropic) behind a unified interface, enabling seamless switching between providers based on user configuration. Rate limiting and retry logic ensure reliable API interactions even under high load or temporary service disruptions. LLM responses are parsed and validated against structured schemas to extract consistent, typed data from natural language outputs. The system implements an iterative analysis workflow where the AI can request additional file contents or grep searches to progressively deepen its understanding of the codebase.

The user interface layer presents analysis results through multiple coordinated views: tree-based navigators for browsing code structure and insights, diagnostic providers for showing issues in the Problems panel, and webview panels for displaying detailed reports. Navigation handlers allow users to jump directly from any insight or result to the corresponding source code location. The testing subsystem orchestrates an end-to-end workflow from test environment detection through test generation, execution, validation, and automatic fixing of failures. All components are designed to work asynchronously with comprehensive error handling and progress feedback to maintain a responsive user experience.

## Module Documentation

### . (other)

This module provides the testing infrastructure configuration for the project. It sets up Jest as the testing framework with TypeScript support, enabling developers to write and execute unit tests for the codebase.

The configuration establishes a Node.js test environment and integrates TypeScript preprocessing through ts-jest, allowing tests to be written in TypeScript alongside the source code. This ensures that the testing workflow matches the development workflow and maintains type safety throughout the test suite.

Developers can use this configuration to run automated tests, verify code behavior, and maintain code quality through test-driven development practices. The setup provides a foundation for continuous integration and automated testing pipelines.

**Capabilities:**
- Configure automated testing infrastructure for TypeScript code
- Enable unit test execution in a Node.js environment
- Support TypeScript-to-JavaScript transformation during test execution
- Provide isolated test environment setup and teardown

### src/ai (other)

This module provides the reliability and safety infrastructure for AI/LLM interactions throughout the application. It ensures that all AI API requests are automatically throttled to stay within provider rate limits, preventing errors and service disruptions. When requests do fail due to temporary issues like network problems or rate limiting, the module automatically retries them with intelligent backoff strategies until they succeed or reach maximum retry attempts.

The module also handles the critical task of converting unstructured text responses from LLMs into structured, typed data that the application can use. This includes parsing file summaries, module summaries, and product documentation from natural language responses into consistent JSON formats. When strict parsing fails, fallback mechanisms extract useful information to ensure users always receive actionable results.

Users benefit from seamless, reliable AI interactions without needing to understand the underlying complexity. Rate limiting happens transparently, retries occur automatically, and LLM responses are consistently formatted regardless of how the AI model structures its output. This creates a smooth experience where AI-powered features work reliably even under challenging conditions like high traffic or API instability.

**Capabilities:**
- Automatically manages AI/LLM API rate limits to prevent exceeding provider quotas
- Parses unstructured LLM text responses into structured, typed data for file and module summaries
- Handles temporary API failures with automatic retry logic and exponential backoff
- Tracks rate limits independently for different AI providers (OpenAI, Claude, etc.)
- Extracts and formats product documentation from LLM responses with fallback mechanisms
- Ensures reliable AI request completion despite network issues or temporary service disruptions

### src/ai/providers (other)

The AI Providers module serves as the abstraction layer for integrating multiple AI language model services into the application. It provides a standardized interface that allows users to interact with different AI providers (currently OpenAI's GPT models and Anthropic's Claude) transparently, without needing to understand the underlying implementation differences. The module handles provider instantiation, configuration management, and ensures consistent behavior across all supported AI services.

Users can send messages to AI models and receive intelligent text responses, generate structured JSON outputs based on predefined schemas, and benefit from automatic error handling including retry logic for transient failures. The provider factory pattern enables dynamic selection of the active AI provider based on user configuration, making it easy to switch between OpenAI and Claude depending on preferences or requirements. All AI-powered features in the application leverage this module to deliver consistent, reliable AI interactions regardless of which provider is configured.

The module emphasizes reliability and user experience through features like streaming response support for real-time output display, automatic configuration validation to catch setup issues early, and intelligent parsing of AI responses to extract structured data. This architecture ensures that as new AI providers become available, they can be integrated seamlessly without disrupting existing user workflows or requiring changes to other parts of the application.

**Capabilities:**
- Unified interface for interacting with multiple AI language model providers (OpenAI GPT and Anthropic Claude)
- Seamless switching between different AI providers based on configuration without changing workflows
- Structured JSON output generation from AI models using defined schemas
- Automatic request retry logic with exponential backoff for failed API calls
- Real-time streaming responses for immediate AI output display
- API key validation and configuration checking before processing requests
- Automatic extraction and parsing of JSON data from AI responses
- AI-suggested file and grep search requests based on analysis needs

### src/analysis (other)

The analysis module provides comprehensive static code analysis capabilities that help users understand their codebase at a deep structural level. By parsing Abstract Syntax Trees (AST), it extracts detailed metadata about functions, their dependencies, complexity patterns, and behavioral characteristics. Users can leverage this module to gain visibility into how their code is organized, identify potential refactoring opportunities, and understand the relationships between different parts of their codebase.

The module serves two primary workflows: enhanced analysis for understanding code behavior and complexity, and function-level analysis for refactoring support. Enhanced analysis examines conditional logic branches, dependency patterns, and state interactions to provide insights into code quality and test coverage. Function analysis focuses on extracting detailed information about individual functions within large files, showing their signatures, what they depend on, and what other code depends on them. Together, these capabilities enable users to make informed decisions about code maintenance, refactoring, and quality improvements.

This module is particularly valuable for developers working with large codebases who need to understand complex function interactions, identify tightly coupled components, or plan refactoring efforts. The analysis results can inform decisions about code splitting, test coverage improvements, and architectural changes by providing clear visibility into the existing code structure and dependencies.

**Capabilities:**
- Performs deep static code analysis by parsing Abstract Syntax Trees (AST) to understand code structure and behavior
- Extracts comprehensive function-level metadata including signatures, parameters, return types, and dependencies
- Analyzes code complexity metrics and identifies behavioral patterns in functions
- Maps relationships between functions to show what each function depends on and what depends on it
- Identifies conditional logic paths and provides branch coverage information
- Detects test-to-source code mappings to understand test coverage relationships
- Highlights functions in large files that may benefit from refactoring
- Provides insights into how functions interact with application state and external dependencies

### src (other)

This is the core VS Code extension module for Shadow Watch, an AI-powered code analysis and documentation tool. It provides developers with comprehensive insights into their codebase's architecture, quality, and maintainability through automated analysis and AI-generated documentation. The extension monitors code changes in real-time and automatically updates analysis results when files are saved.

Users interact with Shadow Watch through multiple VS Code interface components: a sidebar tree view for browsing analysis results, an insights panel for AI-generated recommendations, the Problems panel for diagnostics, and output channels for detailed reports. The extension analyzes code structure, tracks dependencies, identifies potential issues (circular dependencies, orphaned files, large files, dead code), and generates actionable recommendations. It also creates comprehensive product documentation by understanding the purpose and architecture of the codebase.

The module integrates deeply with LLM capabilities to provide intelligent analysis beyond simple static code inspection. Results are cached for performance and formatted for optimal consumption by various LLM interfaces. Users can navigate directly from insights to source code locations, view hierarchical breakdowns of their project structure, see test coverage gaps, and receive severity-categorized issues with specific remediation guidance. The extension supports iterative analysis workflows where users can search code, view file contents, and explore relationships between components.

**Capabilities:**
- Automatic code analysis and architecture insights generation
- AI-powered product documentation generation from source code
- Visual tree-based browsing of code analysis results and insights
- Real-time diagnostic reporting in VS Code's Problems panel
- Intelligent caching of analysis results for instant workspace reopening
- File change monitoring with automatic re-analysis on save
- LLM-optimized code context formatting for AI chat interfaces
- Code quality metrics including complexity, maintainability, and risk assessment
- Dependency tracking and circular dependency detection
- Test coverage mapping and uncovered function identification
- Entry point detection and code flow visualization
- Dead code and orphaned file detection
- Large file and 'god object' identification
- File search and content exploration for iterative LLM-based analysis
- Multi-format output optimized for different LLM interfaces (Cursor, ChatGPT, etc.)

**Commands:**
- `shadowwatch.analyzeCode`: Analyzes the entire codebase and generates comprehensive insights about architecture, dependencies, code quality, and potential issues
- `shadowwatch.copyContextToClipboard`: Copies formatted code context and analysis results to clipboard for pasting into LLM chat interfaces
- `shadowwatch.refreshAnalysis`: Manually triggers a fresh analysis of the codebase, bypassing cache
- `shadowwatch.clearCache`: Clears all cached analysis results, forcing a complete re-analysis on next run
- `shadowwatch.generateProductDocs`: Uses AI to generate comprehensive product documentation from source code analysis
- `shadowwatch.generateInsights`: Generates AI-powered insights and recommendations about code quality, architecture, and improvements
- `shadowwatch.refreshInsights`: Refreshes the insights tree view to display the latest AI-generated recommendations
- `shadowwatch.openAnalysisReport`: Opens detailed analysis reports (workspace, product, architecture, or unit test reports)

### src/config (other)

The config module serves as the central configuration management system for the Shadow Watch extension. It provides a unified interface for accessing and modifying all extension settings, from basic functionality toggles to advanced LLM integration parameters. The module implements a reactive architecture that automatically notifies registered listeners whenever configuration values change, ensuring all components stay synchronized with user preferences.

Users can control every aspect of Shadow Watch's behavior through this module. This includes enabling or disabling the extension entirely, configuring when and how code analysis runs (on save, manually, or continuously), and customizing the visual presentation of analysis results through inline hints and diagnostic severity filters. The module also manages critical integration settings such as LLM provider selection (OpenAI or Claude), API credentials, custom endpoints, and output format preferences.

The configuration system supports operational parameters that help users optimize Shadow Watch for their specific environment. This includes setting analysis timeouts to prevent long-running operations, defining file size and line count limits to control resource usage, and configuring retry behavior for API calls. All settings are persisted automatically and can be modified through VS Code's standard settings interface or programmatically through the configuration manager API.

**Capabilities:**
- Centralized management of all Shadow Watch extension settings
- Real-time configuration updates with automatic listener notification
- LLM provider configuration for OpenAI and Claude integrations
- Flexible analysis behavior customization (automatic analysis, inline hints, severity filtering)
- API endpoint and authentication management for external services
- Performance tuning through timeout and file size limit controls

### src/context (other)

The context module serves as a bridge between code analysis output and AI language model consumption. It automatically transforms technical code analysis results into a structured format optimized for LLM processing, ensuring that insights from code scanning can be effectively utilized by AI-powered features.

When code is analyzed, this module saves the results to the workspace's .shadow/docs directory, creating a persistent knowledge base. This allows analysis data to be reused across sessions without requiring re-analysis, improving performance and maintaining continuity. The module handles the serialization and storage of complex analysis structures, making them readily accessible for downstream AI features.

Users benefit from this module transparently - their code analysis results are automatically preserved and formatted without manual intervention. The persistent storage means that documentation, code insights, and analysis metadata remain available even after restarting the development environment, enabling consistent AI-assisted workflows throughout the development lifecycle.

**Capabilities:**
- Automatically converts code analysis results into LLM-ready context format
- Persists analysis data between sessions in workspace .shadow/docs directory
- Structures analyzed code information for efficient AI processing
- Maintains historical record of code analysis for future reference

### src/domain/bootstrap (other)

This module serves as the foundation for the VS Code extension, handling initialization and command registration. When the extension activates, it orchestrates the setup of all components including tree views for insights, status bar indicators, diagnostic panels, and file watchers. It ensures that all extension features are properly initialized and ready for user interaction.

The module registers a comprehensive set of commands that allow users to perform code analysis at workspace or file level, manage insights through copy and clear operations, switch between different LLM providers, and navigate to specific code locations. Users can trigger analysis, view results in multiple formats (tree views, diagnostics, reports), and interact with the extension through both UI elements and command palette entries.

The bootstrap process manages the complete lifecycle of extension components, ensuring proper dependency injection, event handling, and cleanup. It coordinates between analysis engines, storage systems, UI components, and external LLM services to provide a seamless user experience for code analysis and insight generation.

**Capabilities:**
- Initialize and configure all extension components on VS Code startup
- Register and manage all user-triggered commands for code analysis and insights
- Coordinate workspace and file-level code analysis workflows
- Manage insight data operations including viewing, copying, and clearing
- Switch between multiple LLM providers (OpenAI, Anthropic, etc.)
- Display analysis results in tree views, status bar, and diagnostics panel
- Provide navigation to code locations from insights and analysis results
- Manage extension lifecycle including activation, updates, and cleanup

**Commands:**
- `analyze-workspace`: Analyze entire workspace to generate code insights across all files
- `analyze-file`: Analyze the currently open file for code insights
- `copy-all-insights`: Copy all generated insights to clipboard
- `copy-file-insights`: Copy insights for a specific file to clipboard
- `copy-insight`: Copy an individual insight item to clipboard
- `clear-cache`: Clear cached analysis data to force fresh analysis
- `clear-all-data`: Clear all extension data including insights and cached results
- `open-settings`: Open extension configuration settings
- `open-analysis-report`: Open the latest analysis report in a viewer
- `open-unit-test-report`: Open the latest unit test report
- `switch-llm-provider`: Switch between different LLM providers (OpenAI, Anthropic, etc.)
- `copy-menu-structure`: Copy the menu structure to clipboard
- `view-llm-status`: View connection status and details for the active LLM provider
- `navigate-to-product-item`: Navigate to a product item's location in the codebase
- `navigate-to-analysis-item`: Navigate to the code location associated with an analysis item
- `view-product-item-details`: View detailed information about a selected product item
- `view-insight-details`: View detailed information about a specific insight
- `view-unit-test-details`: View detailed information about a unit test item

### src/domain/formatters (other)

The formatters module provides documentation formatting capabilities that transform raw product documentation and LLM-generated insights into polished, user-ready Markdown documents. It takes structured documentation data and applies consistent formatting rules to create organized, readable documentation with clear sections for different audiences (GUI users, CLI users, API developers).

Users interact with this module when they view product documentation in their development environment. The module automatically formats documentation to include a product overview, categorized feature lists organized by user type and functional domain, detailed behavior descriptions following a structured framework, and technical insights generated by LLMs. Each document includes quality indicators like confidence scores and accuracy ratings, helping users assess the reliability of the information.

The module supports documentation workflows by ensuring consistent presentation across different products and documentation types. It organizes complex technical information into scannable sections, groups related features together, and presents dependencies and integration points in a clear format. Generated timestamps help users understand when the documentation was last updated, supporting documentation maintenance and review processes.

**Capabilities:**
- Format product documentation into structured Markdown documents with consistent organization
- Generate comprehensive documentation sections including overview, features, and user perspectives
- Organize features by user roles (GUI, CLI, API) and categorize them by functional domains
- Structure behavior descriptions using the who/what/when/where/why/how framework
- Present LLM-generated insights about technical architecture, patterns, and implementation details
- Display quality metrics including confidence scores and accuracy ratings for documentation
- Format dependency information and integration point details in readable formats
- Add metadata such as generation timestamps to track documentation freshness

### src/domain/handlers (other)

This module provides comprehensive navigation capabilities that enable users to seamlessly move between different parts of their codebase directly from the product navigator and analysis viewer interfaces. When users interact with code items displayed in these views, the module handles opening the appropriate files in the editor and positioning the cursor at the exact location of interest.

The navigation system supports multiple types of code elements including files, functions, methods, and API endpoints. It automatically highlights the relevant code sections to help users quickly orient themselves in the file. When detailed information is needed, the module can display comprehensive details about code items in a dedicated webview panel, providing context without requiring users to search through files manually.

The module also handles edge cases gracefully by displaying informative error messages when files cannot be opened or navigation targets cannot be found. Additionally, it supports opening external links in the user's default browser, making it easy to access related documentation or resources referenced in the code analysis.

**Capabilities:**
- Navigate to specific files in the editor when clicking items in the product navigator or analysis viewer
- Jump directly to functions, methods, and other code elements with automatic cursor positioning
- Navigate to API endpoints and automatically highlight their location in the source code
- Display detailed information about code items in a dedicated webview panel
- Reveal and highlight specific code ranges when interacting with analysis results
- Open external links in the system's default browser
- Provide user feedback through error messages when navigation targets cannot be found

### src/domain/prompts (other)

The prompts module serves as the AI prompt engineering layer for the application, generating specialized instruction templates that guide language models to perform various code analysis, documentation, and testing tasks. It provides a collection of prompt builders that create structured, consistent instructions for LLMs to analyze codebases, extract information, and generate outputs like documentation, test plans, and refactoring recommendations.

This module enables users to leverage AI capabilities across multiple workflows including project documentation generation, test strategy development, code refactoring guidance, and automated test implementation. Each prompt builder is designed to ensure the LLM receives clear, contextual instructions that produce actionable results. The module handles the complexity of translating user intentions into effective AI prompts, managing token budgets, and structuring inputs for optimal LLM performance.

The prompt builders work together to support end-to-end workflows: from analyzing project architecture and documenting code structure, to identifying testable components and generating comprehensive test suites, to recommending refactoring strategies with detailed migration steps. This creates a cohesive AI-assisted development experience where users can generate high-quality documentation, testing artifacts, and improvement recommendations through natural language interactions with the codebase.

**Capabilities:**
- Generates structured prompts for AI-powered code analysis and documentation
- Creates prompts for extracting testable functions and methods from source code
- Builds prompts for comprehensive project architecture analysis
- Generates prompts for automated test plan creation and test code generation
- Produces prompts for code refactoring recommendations with migration plans
- Constructs prompts for module and file-level documentation generation

### src/domain/services (other)

The services module provides core automated workflows that enhance the user experience by eliminating manual configuration and monitoring tasks. It includes a file watcher service that automatically detects changes to files in the workspace, ensuring that all views and analysis results stay synchronized with the latest file system state without requiring manual refreshes. The incremental analysis service powers intelligent code understanding by iteratively requesting additional context, reading relevant files, and performing grep searches until sufficient information is gathered for analysis tasks.

The test configuration service automatically detects which testing framework is being used (Jest, Mocha, Vitest, or Pytest) and validates that the environment is properly configured to run generated tests. It identifies missing dependencies, checks for required configuration files, and provides actionable recommendations to fix any setup issues. Together, these services create a seamless experience where file changes are automatically tracked, code analysis progressively deepens its understanding, and test generation works reliably without manual environment setup.

These services work behind the scenes to support user-facing features like test generation, code analysis, and file-based insights. Users benefit from automatic updates when files change, intelligent analysis that knows when to gather more information, and test generation that adapts to their specific testing setup without requiring configuration knowledge.

**Capabilities:**
- Automatic file system monitoring and change detection across the extension
- Iterative AI-powered code analysis that automatically gathers required context
- Intelligent test framework detection and configuration validation
- Real-time synchronization of views and data when files are modified
- Automatic detection of missing test dependencies and configuration issues
- Progressive analysis that reads additional files and searches code as needed

### src/domain/services/testing (tests)

The testing services module provides an end-to-end AI-powered testing workflow that automates the entire process from test environment setup to test generation, execution, and validation. Users can leverage LLM-based analysis to discover testable functions in their codebase, assess their complexity and testability characteristics, and receive prioritized recommendations for which functions need testing coverage.

The module handles the complete testing lifecycle automatically: it detects the programming language and testing framework, sets up the necessary test infrastructure including directories and dependencies, generates unit tests in batches for selected functions, executes them immediately, and validates the results. When tests fail, the system automatically attempts to fix them using AI assistance, providing progress feedback throughout each stage.

Users benefit from intelligent analysis that identifies functions requiring mocks, rates complexity levels, and avoids false positives in testability assessments. The workflow provides continuous feedback showing batch processing status, test generation progress, execution results with pass/fail counts, and detailed error information when issues occur. This comprehensive automation reduces manual testing effort while improving test coverage quality.

**Capabilities:**
- Automated discovery and analysis of testable functions across the workspace
- AI-powered test generation with automatic execution and validation
- Intelligent test planning and prioritization based on code complexity
- Automatic test environment setup and configuration
- Self-healing test validation with automatic failure detection and fixing
- Comprehensive test execution with detailed pass/fail reporting

### src/domain/services/testing/types (tests)

This module provides TypeScript type definitions that structure the entire test generation and execution lifecycle. Users can view and track test plans that organize functions by priority, monitor progress as tests move through setup, planning, generation, and validation phases, and see detailed statistics on test coverage including counts of total, testable, generated, and validated functions.

The module enables users to receive comprehensive test execution results including pass/fail status for each test file, execution duration, error messages with stack traces, and overall test statistics. Users can access test reports that provide pass rates, file-level statistics, and actionable recommendations for improving test quality. The module also supports test environment configuration, allowing users to see what dependencies need to be installed, which configuration files will be created, and what mock requirements are needed for proper test execution.

Through these type definitions, users gain visibility into test failures with detailed error messages and retry attempt tracking, enabling them to diagnose and fix issues efficiently. The structured approach to test organization helps users understand which functions are being tested, their relative priority, and the overall health of their test suite through comprehensive reporting and progress tracking.

**Capabilities:**
- Define and track comprehensive test plan structures with function organization and priority grouping
- Monitor test generation progress through multiple phases (setup, planning, generation, validation, completion)
- Track test execution results with detailed pass/fail statistics and error reporting
- Configure test environment setup including framework selection, dependency management, and mock requirements
- Validate test quality with recommendations and detailed error diagnostics
- Organize testable functions with metadata including file paths, complexity, and priority levels

### src/infrastructure/fileSystem (other)

This module provides optimized file system operations for the VS Code extension, focusing on performance and efficiency. It implements a caching layer that stores file contents in memory, significantly reducing disk I/O when the extension needs to access the same files multiple times during operations like code analysis, documentation generation, or project scanning.

The module handles bulk file processing with intelligent defaults, automatically excluding common directories that typically don't contain source code (node_modules, .git, dist, build, .shadow, coverage, .vscode, .idea). Files are processed in parallel for maximum throughput, making operations on large codebases faster and more responsive.

Users benefit from faster extension performance without any configuration required. The cache automatically invalidates when files change, ensuring data stays fresh. Whether the extension is analyzing code, generating documentation, or scanning project structure, these file system utilities work behind the scenes to deliver a smooth, responsive experience.

**Capabilities:**
- Optimizes file system operations through intelligent caching to reduce redundant file reads
- Processes multiple files in parallel with automatic filtering of common non-source directories
- Automatically updates cached content when files are modified externally
- Provides consistent error handling across all file processing operations
- Improves extension responsiveness when accessing project files repeatedly

### src/infrastructure/persistence (other)

This module provides persistent storage capabilities for all codebase analysis results. It automatically saves analysis outputs to the local filesystem, organizing them into structured directories within the .shadow folder. Each analysis run creates a new timestamped folder, ensuring that historical results are preserved and easily accessible.

The module handles multiple types of documentation artifacts including product documentation, architecture insights, and summary documents. All results are stored with timestamps, allowing users to track how their codebase documentation evolves over time. The organized folder structure makes it easy to locate specific analysis runs and compare results across different points in time.

Users benefit from automatic persistence without manual intervention - every analysis automatically generates and saves results to predictable locations. The timestamped storage ensures that no previous analysis is overwritten, providing a complete audit trail of documentation changes and architectural evolution.

**Capabilities:**
- Automatically persists all analysis results to disk with timestamped organization
- Stores product documentation in organized run folders within .shadow/docs directory
- Maintains historical tracking of architecture insights with timestamps
- Creates and manages summary documents in dedicated .shadow/summary directory
- Preserves complete analysis history through timestamped folder structure

### src/infrastructure (other)

The infrastructure module provides a centralized progress service that manages how users are informed about ongoing operations throughout the extension. It creates a consistent user experience by displaying progress notifications with clear titles and messages whenever the extension performs time-consuming tasks.

Users interact with this module passively through visual feedback and actively when they choose to cancel operations. When any long-running task begins—such as file processing, API calls, or complex computations—the progress service automatically shows a notification that keeps users informed about what's happening. These notifications can appear in various locations within the VS Code interface, including the notification area and status bar.

The primary workflow involves the extension initiating an operation, the progress service displaying a notification with relevant status information, and users either waiting for completion or choosing to cancel via the notification's cancel button. This standardized approach ensures users always know when the extension is working and provides them with control over cancellable operations.

**Capabilities:**
- Display progress notifications for long-running operations with customizable titles and messages
- Show progress indicators in multiple locations (notification area, status bar, etc.)
- Allow users to cancel ongoing operations through progress notification controls
- Provide standardized progress feedback across all extension operations
- Track operation status and communicate progress updates to users in real-time

## File-Level Documentation

*Detailed documentation for 50 files*

### jest.config.js

**Role:** Core Logic

**Purpose:** Configures Jest testing framework for TypeScript-based unit tests in a Node.js environment

**User Actions:**
- No direct user-visible actions - this is a testing configuration file

### src/ai/llmRateLimiter.ts

**Role:** Core Logic

**Purpose:** Prevents LLM API requests from exceeding provider rate limits by tracking and enforcing request quotas per time window

**User Actions:**
- API requests are automatically throttled to prevent rate limit errors
- Requests are blocked when rate limits are reached within the time window
- Different AI providers (OpenAI, Claude) have independent rate limit tracking

**Key Functions:**
- `canMakeRequest`: Checks if a new request is allowed based on recent request history and configured limits
  - Inputs: provider: 'openai' | 'claude'
  - Outputs: boolean - true if request allowed, false if rate limit reached
- `recordRequest`: Records the timestamp of a request to track usage against rate limits
  - Inputs: provider: 'openai' | 'claude'
  - Outputs: void - updates internal request history
- `configure`: Sets custom rate limit configuration for a specific provider
  - Inputs: provider: 'openai' | 'claude', config: {maxRequests: number, windowMs: number}
  - Outputs: void - updates provider configuration

### src/ai/llmResponseParser.ts

**Role:** Core Logic

**Purpose:** Parses and extracts structured information from LLM text responses into typed data structures for file summaries, module summaries, and product documentation.

**User Actions:**
- User receives structured file analysis from unstructured LLM text responses
- User gets parsed product documentation with consistent formatting
- User sees extracted module summaries with organized information
- User receives fallback text extraction when JSON parsing fails

**Key Functions:**
- `parseFileSummary`: Converts LLM response text into a structured FileSummary object
  - Inputs: content (string), filePath (string), role (string)
  - Outputs: FileSummary object with purpose, actions, functions, dependencies
- `parseModuleSummary`: Extracts module-level information from LLM response
  - Inputs: content (string), moduleName (string)
  - Outputs: ModuleSummary object with module details
- `parseProductDocumentation`: Parses enhanced product documentation from LLM output
  - Inputs: content (string)
  - Outputs: EnhancedProductDocumentation object
- `parseLLMInsights`: Extracts analysis insights and context from LLM responses
  - Inputs: content (string)
  - Outputs: LLMInsights object with structured analysis data
- `extractSection`: Extracts a specific named section from text content
  - Inputs: content (string), sectionName (string)
  - Outputs: Extracted section text as string
- `extractListSection`: Extracts a list/array section from text content
  - Inputs: content (string), sectionName (string)
  - Outputs: Array of extracted list items

### src/ai/llmRetryHandler.ts

**Role:** Core Logic

**Purpose:** Handles automatic retries of failed AI/LLM API requests with exponential backoff when temporary errors occur

**User Actions:**
- AI requests automatically retry when they fail due to temporary issues like rate limits or network problems
- Multiple retry attempts happen transparently without user intervention
- Requests eventually succeed after temporary failures are resolved
- Requests fail with clear error after maximum retry attempts are exhausted

**Key Functions:**
- `executeWithRetry`: Executes an async operation with automatic retry logic and exponential backoff
  - Inputs: operation: async function to execute, options: retry configuration (maxRetries, delays, error types)
  - Outputs: Promise resolving to operation result, or throws error after retries exhausted
- `isRetryableError`: Determines if an error should trigger a retry based on error message and configured retryable error patterns
  - Inputs: error: caught exception, retryableErrors: list of error patterns to match
  - Outputs: boolean indicating if error is retryable

### src/ai/providers/ILLMProvider.ts

**Role:** Core Logic

**Purpose:** Defines the standard interface for all LLM (Large Language Model) provider implementations to ensure consistent AI integration across different providers like OpenAI and Claude.

**User Actions:**
- User receives AI-generated text responses to their queries
- User receives structured JSON data from AI models when requesting formatted output
- User can work with different AI providers (OpenAI, Claude, custom) transparently without changing their workflow
- User gets file and grep search requests suggested by the AI based on analysis needs

**Key Functions:**
- `isConfigured`: Verifies if the LLM provider has valid credentials and is ready to process requests
  - Inputs: none
  - Outputs: boolean indicating configuration status
- `sendRequest`: Sends a prompt to the LLM and retrieves a text response with optional configuration like temperature and token limits
  - Inputs: LLMRequestOptions (messages, model, temperature, maxTokens, systemPrompt, responseFormat)
  - Outputs: Promise<LLMResponse> containing generated text content, finish reason, model used, and raw response
- `sendStructuredRequest`: Sends a prompt expecting structured JSON output, optionally validated against a schema, with additional file/grep requests
  - Inputs: LLMRequestOptions and optional schema for validation
  - Outputs: Promise<StructuredOutputResponse<T>> containing parsed data and optional file/grep requests
- `getName`: Returns the identifier of the LLM provider for logging and user display
  - Inputs: none
  - Outputs: string with provider name

### src/ai/providers/anthropicProvider.ts

**Role:** Core Logic

**Purpose:** Provides integration with Anthropic's Claude AI models for sending chat requests and receiving AI-generated responses

**User Actions:**
- Sends messages to Claude AI and receives intelligent responses
- Generates structured JSON outputs from Claude based on schemas
- Automatically retries failed requests with exponential backoff
- Validates Claude API configuration before allowing requests
- Extracts and parses JSON from Claude's responses automatically

**Key Functions:**
- `isConfigured`: Checks if Claude API key is set up and provider is ready to use
  - Inputs: none
  - Outputs: boolean indicating configuration status
- `getName`: Returns the provider identifier
  - Inputs: none
  - Outputs: string 'claude'
- `sendRequest`: Sends a chat completion request to Claude with messages and options
  - Inputs: LLMRequestOptions with messages, model, maxTokens, systemPrompt
  - Outputs: LLMResponse with content, model, and token usage
- `sendStructuredOutputRequest`: Sends a request to Claude and ensures the response matches a provided JSON schema
  - Inputs: LLMRequestOptions plus JSON schema definition
  - Outputs: StructuredOutputResponse with validated JSON data and metadata
- `initialize`: Sets up the Claude client with API key from configuration
  - Inputs: none (reads from config)
  - Outputs: void (initializes internal client)

### src/ai/providers/openAIProvider.ts

**Role:** Core Logic

**Purpose:** Implements the OpenAI API provider to send chat completion requests and handle structured responses using OpenAI's GPT models

**User Actions:**
- Sends messages to OpenAI's GPT models and receives AI-generated responses
- Supports structured JSON output format when requested
- Processes streaming responses for real-time AI output display
- Validates API key configuration before allowing requests
- Returns error messages when OpenAI API key is not configured

**Key Functions:**
- `initialize`: Sets up OpenAI client with API key from configuration
  - Inputs: none
  - Outputs: void
- `isConfigured`: Checks if OpenAI client is ready with valid API key
  - Inputs: none
  - Outputs: boolean
- `getName`: Returns provider identifier
  - Inputs: none
  - Outputs: string 'openai'
- `sendRequest`: Sends chat completion request to OpenAI API with messages and options
  - Inputs: LLMRequestOptions (model, messages, systemPrompt, responseFormat)
  - Outputs: Promise<LLMResponse> with content and finish reason
- `sendStructuredRequest`: Sends request expecting JSON response and parses it into structured data
  - Inputs: LLMRequestOptions with JSON response format
  - Outputs: Promise<StructuredOutputResponse> with parsed JSON data
- `sendStreamingRequest`: Sends streaming request and yields response tokens in real-time
  - Inputs: LLMRequestOptions
  - Outputs: AsyncGenerator yielding content chunks and finish reason

### src/ai/providers/providerFactory.ts

**Role:** Core Logic

**Purpose:** Creates and manages AI language model provider instances (OpenAI and Anthropic/Claude) with lazy initialization and configuration checking

**User Actions:**
- Switches between different AI providers (OpenAI or Claude) based on configuration
- Uses the currently configured AI provider for all AI-powered features
- Gets error feedback when an unknown AI provider is selected

**Key Functions:**
- `getProvider`: Returns the provider instance for the specified provider type (openai or claude)
  - Inputs: provider: LLMProvider ('openai' | 'claude')
  - Outputs: ILLMProvider instance
- `getCurrentProvider`: Returns the currently configured provider based on user settings
  - Inputs: none
  - Outputs: ILLMProvider instance
- `isProviderConfigured`: Checks if a provider has valid configuration and credentials
  - Inputs: provider: LLMProvider ('openai' | 'claude')
  - Outputs: boolean indicating if provider is ready to use
- `getConfiguredProviders`: Returns a list of all providers that are properly configured
  - Inputs: none
  - Outputs: Array of configured LLMProvider names

### src/analysis/enhancedAnalyzer.ts

**Role:** Core Logic

**Purpose:** Performs deep code analysis by parsing Abstract Syntax Trees (AST) to extract detailed metadata about functions, branches, dependencies, and behavioral patterns.

**User Actions:**
- Receives detailed analysis of code complexity and behavioral hints
- Gets insights into how functions interact with state and dependencies
- Views branch coverage information for conditional logic paths
- Sees identified test mappings between test files and source code

**Key Functions:**
- `analyzeFileMetadata`: Analyzes a file and extracts enhanced metadata for all functions
  - Inputs: filePath: string, content: string, language: string, functions: FunctionInfo[]
  - Outputs: Map<string, FunctionMetadata>
- `analyzeTypeScriptFunction`: Performs AST-based analysis on TypeScript/JavaScript functions
  - Inputs: filePath: string, content: string, func: FunctionInfo, functionContent: string
  - Outputs: FunctionMetadata
- `analyzeFunctionWithRegex`: Fallback analysis using regex patterns for non-TypeScript languages
  - Inputs: filePath: string, func: FunctionInfo, functionContent: string, language: string
  - Outputs: FunctionMetadata
- `extractFunctionContent`: Extracts the text content of a function from a file
  - Inputs: content: string, startLine: number, endLine: number
  - Outputs: string

### src/analysis/functionAnalyzer.ts

**Role:** Core Logic

**Purpose:** Extracts detailed function information from large code files to support refactoring analysis and reporting.

**User Actions:**
- Identifies functions in large files that may need refactoring
- Provides detailed function information including signatures, dependencies, and responsibilities
- Highlights which functions are called by other parts of the codebase (dependents)
- Shows what other functions or modules each function depends on

**Key Functions:**
- `analyzeFunctions`: Analyzes all functions in large files and returns detailed function analysis data
  - Inputs: CodeAnalysis object, optional line threshold for large files (default 500)
  - Outputs: Array of FunctionAnalysis objects containing detailed function information
- `analyzeFunction`: Performs detailed analysis on a single function including extracting signature, dependencies, and dependent relationships
  - Inputs: File path, function information object, code analysis object
  - Outputs: FunctionAnalysis object or null if analysis fails
- `resolveFilePath`: Resolves relative file paths to absolute paths for file system access
  - Inputs: Relative file path, code analysis object
  - Outputs: Absolute file path string

### src/analysisViewer.ts

**Role:** GUI View

**Purpose:** Provides a tree view interface for browsing and exploring code analysis results in VS Code

**User Actions:**
- View a hierarchical tree of code analysis results in the sidebar
- See project statistics (file count, function count, complexity metrics)
- Browse analyzed files organized by directory structure
- Click on files to see their functions and entry points
- Click on functions to jump to their location in the code
- See file-level metrics (lines of code, complexity, function count)
- View entry points and their relationships
- See 'No analysis available' message when no analysis has been run
- Expand/collapse sections to drill down into analysis details

**Key Functions:**
- `setAnalysis`: Updates the tree view with new analysis results
  - Inputs: CodeAnalysis object or null
  - Outputs: void (triggers tree refresh)
- `refresh`: Forces the tree view to reload and redisplay all items
  - Inputs: none
  - Outputs: void
- `getTreeItem`: Returns the visual representation of a tree item
  - Inputs: AnalysisItem element
  - Outputs: vscode.TreeItem
- `getChildren`: Returns child items for a given tree node (or root items if none specified)
  - Inputs: optional AnalysisItem element
  - Outputs: Promise of AnalysisItem array
- `getRootItems`: Generates top-level tree items (statistics, files, functions, entry points)
  - Inputs: none
  - Outputs: Array of AnalysisItem
- `getStatisticsItems`: Creates tree items showing project-wide metrics
  - Inputs: none
  - Outputs: Array of AnalysisItem with statistics
- `getFilesItems`: Organizes analyzed files into a directory tree structure
  - Inputs: none
  - Outputs: Array of AnalysisItem representing files and directories
- `getFileDetails`: Shows functions and metrics for a specific file
  - Inputs: AnalysisItem representing a file
  - Outputs: Array of AnalysisItem with file details

### src/analyzer.ts

**Role:** Core Logic

**Purpose:** Defines data structures and interfaces for code analysis results, including file metadata, function information, dependencies, test mappings, and code quality metrics.

**User Actions:**
- View analysis of codebase structure including file counts, line counts, and function counts
- See identification of large files that may need refactoring
- View detected orphaned files that aren't imported anywhere
- See entry points in the codebase
- View duplicate code detection results
- See function-level risk assessments (high/medium/low)
- View function dependencies including database, HTTP, filesystem, and other external services
- See test coverage mapping showing which tests cover which source files and functions
- View uncovered functions that lack tests
- See code quality metrics including complexity scores and maintainability ratings

**Key Functions:**
- `CodeAnalysis`: Main interface representing complete codebase analysis results
  - Inputs: N/A (interface definition)
  - Outputs: Structure containing totalFiles, totalLines, totalFunctions, largeFiles, file list, function list, imports, orphaned files, entry points, duplicates, and optional enhanced metadata
- `FunctionMetadata`: Detailed metadata about a single function including complexity, dependencies, and risk
  - Inputs: N/A (interface definition)
  - Outputs: Structure with symbolName, file, parameters, returnType, visibility, docstring, branches, dependencies, state mutations, risk level, and line numbers
- `TestMapping`: Maps source code to test files and identifies coverage gaps
  - Inputs: N/A (interface definition)
  - Outputs: Maps from source files to test files, functions to test names, and list of uncovered functions
- `DuplicateGroup`: Groups duplicate or similar code blocks together
  - Inputs: N/A (interface definition)
  - Outputs: Array of duplicate instances with similarity score and total duplicate lines
- `QualityMetrics`: Provides code quality scores and ratings
  - Inputs: N/A (interface definition)
  - Outputs: Overall score, complexity score, maintainability rating, test coverage percentage, and documentation completeness

### src/cache.ts

**Role:** Core Logic

**Purpose:** Manages persistent storage and retrieval of code analysis results with automatic expiration

**User Actions:**
- Analysis results are loaded instantly from cache when reopening a workspace
- Cached analysis automatically expires after 24 hours to ensure freshness
- Cache is stored in a hidden .shadowwatch-cache directory

**Key Functions:**
- `getCacheKey`: Generates a safe filename identifier for a workspace
  - Inputs: workspaceRoot (string)
  - Outputs: base64-encoded workspace path (string)
- `get`: Retrieves cached analysis data if it exists and is less than 24 hours old
  - Inputs: workspaceRoot (string)
  - Outputs: CodeAnalysis object or null if not found/expired
- `set`: Saves code analysis results to disk with current timestamp
  - Inputs: workspaceRoot (string), data (CodeAnalysis)
  - Outputs: void (Promise)
- `clear`: Removes all cached analysis files from the cache directory
  - Inputs: none
  - Outputs: void (Promise)
- `ensureCacheDir`: Creates the cache directory if it doesn't exist
  - Inputs: none
  - Outputs: void

### src/config/configurationManager.ts

**Role:** Core Logic

**Purpose:** Manages all Shadow Watch extension configuration settings and notifies listeners when settings change

**User Actions:**
- Enable or disable the Shadow Watch extension
- Toggle automatic analysis when saving files
- Show or hide inline hints in the editor
- Configure which LLM provider to use (OpenAI or Claude)
- Set the output format for LLM analysis results
- Choose minimum severity level for displaying diagnostics
- Customize API keys and endpoints for LLM services
- Adjust timeout settings for analysis operations
- Control file size and line count limits for analysis

**Key Functions:**
- `onConfigurationChange`: Registers a callback function that executes whenever configuration settings change
  - Inputs: callback: () => void
  - Outputs: void
- `removeConfigurationChangeListener`: Unregisters a previously registered configuration change callback
  - Inputs: callback: () => void
  - Outputs: void
- `validate`: Checks if current configuration values are valid and returns any errors found
  - Inputs: none
  - Outputs: ConfigValidationResult with valid flag and error messages
- `enabled`: Returns whether the Shadow Watch extension is currently enabled
  - Inputs: none (getter property)
  - Outputs: boolean
- `analyzeOnSave`: Returns whether automatic analysis should run when files are saved
  - Inputs: none (getter property)
  - Outputs: boolean
- `llmProvider`: Returns the configured LLM provider (OpenAI or Claude)
  - Inputs: none (getter property)
  - Outputs: LLMProvider type ('openai' or 'claude')
- `severityThreshold`: Returns the minimum severity level for displaying diagnostics
  - Inputs: none (getter property)
  - Outputs: SeverityThreshold type ('error', 'warning', or 'info')

### src/context/analysisContextBuilder.ts

**Role:** Core Logic

**Purpose:** Converts code analysis results into a context format for LLM processing and saves them to disk for future use

**User Actions:**
- Code analysis results are automatically saved to workspace for future reference
- Analysis data persists between sessions in .shadow/docs directory

**Key Functions:**
- `convertCodeAnalysisToContext`: Transforms CodeAnalysis object into AnalysisContext format suitable for LLM consumption
  - Inputs: CodeAnalysis object containing files, imports, entry points, and metrics
  - Outputs: AnalysisContext object with reformatted data structure
- `saveCodeAnalysis`: Persists code analysis results to disk with metadata for future use
  - Inputs: CodeAnalysis object to save
  - Outputs: void (creates code-analysis.json file in workspace)

### src/diagnosticsProvider.ts

**Role:** Core Logic

**Purpose:** Manages diagnostic messages (warnings, errors, info) displayed in VS Code's Problems panel based on code insights

**User Actions:**
- User sees diagnostic messages appear in the Problems panel when issues are detected
- User sees warnings, errors, or informational messages inline in their code editor with squiggly underlines
- User can click on diagnostic messages to navigate to the problematic line of code
- User sees diagnostics organized by file in the Problems panel
- User sees 'Shadow Watch' as the source of diagnostic messages
- User sees diagnostics cleared when issues are resolved or analysis is reset

**Key Functions:**
- `updateDiagnostics`: Updates all diagnostics across multiple files based on provided insights
  - Inputs: Array of Insight objects containing file paths, line numbers, and descriptions
  - Outputs: void - displays diagnostics in VS Code Problems panel
- `updateDiagnosticsForFile`: Updates diagnostics for a specific file only
  - Inputs: VS Code URI of the file and array of Insight objects for that file
  - Outputs: void - displays diagnostics for the specific file
- `clear`: Removes all diagnostics from the Problems panel
  - Inputs: none
  - Outputs: void - clears all displayed diagnostics
- `createDiagnostic`: Converts an insight into a VS Code diagnostic message with proper formatting and severity
  - Inputs: Insight object with description, line number, and severity
  - Outputs: VS Code Diagnostic object ready for display
- `dispose`: Cleans up resources when the diagnostics provider is no longer needed
  - Inputs: none
  - Outputs: void - releases diagnostic collection resources

### src/domain/bootstrap/commandRegistry.ts

**Role:** Core Logic

**Purpose:** Registers all VS Code commands that users and the extension can trigger for code analysis, insight management, and LLM provider operations

**User Actions:**
- Analyze entire workspace for code insights
- Analyze currently open file
- Copy all insights to clipboard
- Copy insights for specific file
- Copy individual insight to clipboard
- Clear cached analysis data
- Clear all extension data
- Open extension settings
- Open latest analysis report
- Open latest unit test report
- Switch between LLM providers (OpenAI, Anthropic, etc.)
- Copy menu structure to clipboard
- View LLM provider connection status
- Navigate to product item in codebase
- Navigate to analysis item location
- View detailed information for product items
- View detailed information for insights
- View detailed information for unit test items

**Key Functions:**
- `CommandRegistry.register`: Registers all VS Code commands with their handlers
  - Inputs: context: vscode.ExtensionContext, components: ExtensionComponents
  - Outputs: void (registers commands as side effect)

### src/domain/bootstrap/extensionBootstrapper.ts

**Role:** Core Logic

**Purpose:** Initializes and orchestrates all VS Code extension components when the extension activates, managing their lifecycle and dependencies

**User Actions:**
- Extension components are initialized and ready when VS Code starts
- Status bar shows extension activity status
- Tree views populate with code insights, analysis results, reports, and test information
- Diagnostics appear in the Problems panel for code issues
- File changes trigger automatic analysis updates
- Reports viewer displays analysis reports
- Product navigation view becomes available
- Unit tests navigator shows test structure

**Key Functions:**
- `bootstrap`: Initializes all extension components and registers them with VS Code
  - Inputs: vscode.ExtensionContext
  - Outputs: ExtensionComponents object containing all initialized services
- `createComponents`: Instantiates all core services like analyzer, insight generator, formatters, and providers
  - Inputs: context
  - Outputs: Complete set of extension component instances
- `registerTreeViews`: Registers all tree view providers with VS Code UI
  - Inputs: context, components
  - Outputs: Registered tree views for insights, analysis, reports, and tests
- `setupFileWatching`: Configures automatic file monitoring and change detection
  - Inputs: components
  - Outputs: Active file watcher with event handlers
- `initializeCache`: Sets up the analysis cache system for storing results
  - Inputs: none
  - Outputs: Initialized cache instance

### src/domain/formatters/documentationFormatter.ts

**Role:** Core Logic

**Purpose:** Formats product documentation and LLM insights into structured Markdown documents for user consumption

**User Actions:**
- View formatted product documentation with overview, features, and user perspectives
- See organized sections for GUI, CLI, and API user interactions
- Read categorized features grouped by user roles and domains
- Access behavior descriptions organized by who/what/when/where/why/how
- View LLM-generated insights about technical architecture and patterns
- See quality scores and confidence ratings for documentation accuracy
- Read dependency information and integration points
- Access generated timestamps showing when documentation was created

**Key Functions:**
- `formatEnhancedDocsAsMarkdown`: Converts enhanced product documentation object into formatted Markdown document with all sections
  - Inputs: EnhancedProductDocumentation object containing overview, features, perspectives, behaviors
  - Outputs: Formatted Markdown string with sections for overview, features, user perspectives, behaviors, and quality scores
- `formatInsightsAsMarkdown`: Converts LLM-generated insights into formatted Markdown document with architecture and patterns
  - Inputs: LLMInsights object containing technical patterns, dependencies, and quality metrics
  - Outputs: Formatted Markdown string with sections for technical architecture, patterns, dependencies, and confidence ratings

### src/domain/handlers/navigationHandler.ts

**Role:** Core Logic

**Purpose:** Handles navigation to files, functions, endpoints, and other code items in the editor when user clicks items in the product navigator or analysis viewer.

**User Actions:**
- Opens files in the editor when clicking on file items in the navigator
- Jumps to specific functions or methods in files with cursor positioned at the function location
- Navigates to API endpoints and highlights their location in the code
- Shows error messages when files cannot be opened or found
- Displays detailed information about code items (functions, endpoints, etc.) in a webview panel
- Reveals and highlights specific code ranges when clicking on analysis items
- Opens external links in the default browser when clicked

**Key Functions:**
- `navigateToProductItem`: Navigates to a product navigation item (file or function) and opens it in the editor
  - Inputs: ProductNavItem (type: file/function/navigate, data with file path and optional function name)
  - Outputs: Promise<void>
- `navigateToAnalysisItem`: Navigates to an analysis item and reveals it in the editor with highlighting
  - Inputs: AnalysisItem (with file path, line number, and column information)
  - Outputs: Promise<void>
- `showItemDetails`: Displays detailed information about a code item in a webview panel
  - Inputs: ProductNavItem or AnalysisItem (with metadata like name, type, description, file location)
  - Outputs: void
- `navigateToEntryPoint`: Navigates to an entry point (function, endpoint, etc.) and positions cursor at its location
  - Inputs: EntryPoint (with file path, line number, column, and name)
  - Outputs: Promise<void>


*... and 30 more files*
