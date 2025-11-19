# Product Documentation

*Generated: 11/19/2025, 1:29:53 PM (2025-11-19 21:29:53 UTC)*

---

## Product Overview

Shadow Watch is a VS Code extension that provides AI-powered code intelligence and documentation capabilities for TypeScript and JavaScript projects. It analyzes your codebase to understand its structure, patterns, and quality, then generates comprehensive human-readable documentation automatically. The extension integrates with OpenAI GPT and Anthropic Claude models to transform raw code analysis into architectural insights, product documentation, and actionable recommendations. Users interact with Shadow Watch through multiple sidebar views, commands, and automated workflows that make understanding and documenting large codebases effortless.

The extension continuously monitors your workspace and can automatically analyze code as you save files, providing real-time feedback through VS Code's Problems panel. It identifies issues like orphaned files, circular dependencies, untested functions, code duplication, and complexity hotspots. All findings are presented with clickable diagnostics that navigate directly to problem locations. Shadow Watch also maintains a persistent cache of analysis results, so reopening your workspace provides instant access to previous insights without re-running expensive AI operations.

Beyond analysis, Shadow Watch transforms how developers navigate and understand codebases. Instead of browsing by file structure, users can explore code through a product-centric view organized by features and capabilities. The extension generates multiple report types including workspace summaries, architecture diagrams, refactoring guides, and test documentation, all accessible through a unified reports dashboard. For teams working with AI coding assistants, Shadow Watch provides specialized context generation that helps LLMs understand your codebase structure and make better recommendations.

## What It Does

- Automatically analyzes TypeScript and JavaScript codebases to identify quality issues, architectural patterns, and complexity metrics
- Generates AI-powered documentation including product overviews, architecture insights, and feature descriptions
- Provides multiple sidebar views for browsing code by functionality rather than file structure
- Displays real-time diagnostics in VS Code's Problems panel with clickable navigation to issues
- Creates comprehensive reports including workspace summaries, refactoring guides, and test documentation
- Monitors file changes and can automatically re-analyze code on save for continuous feedback
- Caches analysis results for 24 hours to provide instant access when reopening workspaces
- Identifies code quality issues like orphaned files, circular dependencies, duplicate code, and untested functions
- Generates structured context for AI coding assistants to improve their understanding of your codebase
- Supports both manual on-demand analysis and automatic analysis triggered by file saves

## User Perspective

### GUI

- Multiple tree view sidebars display analysis results, insights, product navigation, static analysis issues, and available reports
- Analysis Viewer shows codebase statistics, file classifications, function listings, and entry points in an expandable tree structure
- Insights Viewer displays AI-generated architectural analysis and documentation with automatic updates when files change
- Product Navigator organizes code by features and capabilities instead of file structure, allowing functional exploration
- Static Analysis Viewer categorizes issues by severity (errors, warnings, info) for easy browsing and navigation
- Reports Viewer shows a dashboard of all generated reports with generation timestamps and clickable cards to open reports in browser
- Status bar indicator displays current analysis state and provides quick access to commands
- Problems panel integration shows all detected issues with clickable diagnostics that jump to source locations
- Webview panels display rich HTML reports with formatted documentation, tables, and visual organization
- Context menus on sidebar items provide actions like regenerating content, opening files, copying to clipboard, and navigating to code

## Workflow Integration

- Automatic code analysis workflow: Save TypeScript files → Extension analyzes changes → Updates diagnostics and views → Displays new insights
- Documentation generation workflow: Trigger analysis command → Extension scans codebase → AI generates documentation → Reports saved and displayed
- Code exploration workflow: Open Product Navigator → Browse features/modules → Click items → Navigate to source code → View function details
- Issue investigation workflow: View problems in Problems panel → Click diagnostic → Navigate to issue location → Review context and recommendations
- Report generation workflow: Trigger report command → AI analyzes codebase → Multiple report types generated → Access via Reports Viewer dashboard
- Refactoring planning workflow: Analyze large files → Review refactoring suggestions → View extraction plans → Access step-by-step migration guides
- Test documentation workflow: Analyze test files → Generate test plans → Review coverage gaps → Access recommendations for missing tests
- AI assistant integration workflow: Export analysis context → Provide to AI coding assistant → Receive codebase-aware suggestions
- Workspace initialization workflow: Open project → Load cached analysis → Display previous insights → Optionally trigger fresh analysis

## Problems Solved

- Eliminates manual effort required to understand large, unfamiliar codebases by automatically generating comprehensive documentation
- Reduces time spent searching for specific functionality by providing product-centric navigation instead of file-based browsing
- Identifies code quality issues and technical debt that might otherwise go unnoticed until they cause problems
- Provides actionable refactoring guidance for large, complex files that need to be split or reorganized
- Reveals gaps in test coverage by mapping functions to their tests and identifying untested code paths
- Detects architectural problems like circular dependencies and orphaned files that impact maintainability
- Creates documentation that stays synchronized with code through automatic regeneration workflows
- Helps AI coding assistants understand project structure by generating structured context from code analysis
- Eliminates need to read through thousands of lines of code to understand what an application does
- Provides historical tracking of code insights and documentation through timestamped report preservation

## Architecture Summary

Shadow Watch is built as a VS Code extension with a modular architecture centered around code analysis, AI integration, and persistent state management. The core analysis engine examines TypeScript and JavaScript code using Abstract Syntax Tree (AST) parsing to extract detailed metadata about functions, dependencies, complexity metrics, and relationships. This analysis feeds into an insight generation system that identifies patterns, issues, and opportunities for improvement. All analysis results are cached in memory with automatic expiration and persisted to disk in the .shadow directory for historical tracking.

The AI integration layer connects to either OpenAI GPT or Anthropic Claude models through a provider abstraction that handles rate limiting, retry logic, and response parsing. Prompts are constructed through specialized builders that format analysis results into LLM-optimized inputs, ensuring consistent, high-quality documentation generation. The AI responses are parsed into structured formats and transformed into markdown documentation through formatters that organize content by section and category.

The user interface consists of multiple tree view providers that display different perspectives on the codebase: analysis results, AI insights, product navigation, static analysis issues, test structure, and available reports. A diagnostics provider integrates with VS Code's Problems panel to surface issues with clickable navigation. State management coordinates data flow between components, persisting user preferences and generated content across sessions. A file watcher service monitors changes and triggers automatic re-analysis, while an incremental analysis service supports iterative workflows where the system makes multiple rounds of file access and code searches until sufficient context is gathered.

## Module Documentation

### . (other)

This module provides the testing infrastructure foundation that ensures the reliability and stability of the extension. It configures Jest as the testing framework with TypeScript support, enabling automated unit tests that validate functionality and catch bugs before they reach users. The configuration includes coverage reporting capabilities that track which parts of the codebase are tested, helping maintain high quality standards.

Users benefit from this module indirectly through improved extension quality and reliability. Every feature and function can be automatically tested to ensure it works as expected, reducing the likelihood of bugs and unexpected behavior. The testing infrastructure includes special support for mocking VS Code APIs, allowing comprehensive testing of extension functionality without requiring a full VS Code environment.

The coverage reporting capability provides transparency into code quality, giving users confidence that the extension has been thoroughly tested. This testing foundation enables continuous integration workflows where code changes are automatically validated, ensuring that updates and new features maintain the extension's stability and don't introduce breaking changes.

**Capabilities:**
- Automated testing infrastructure that validates extension functionality and prevents regressions
- Code coverage reporting that ensures comprehensive test coverage across the codebase
- Integration with VS Code environment through mocking support for extension APIs
- TypeScript-native testing configuration for type-safe test development

### src/ai (other)

The AI module provides a robust infrastructure layer for interacting with Large Language Model (LLM) providers like OpenAI and Claude. It ensures reliable API communication through three key mechanisms: rate limiting, retry handling, and response parsing. Users benefit from automatic protection against API quota violations, with requests being intelligently throttled or delayed based on provider-specific limits.

When temporary failures occur (network issues, timeouts, rate limits), the module automatically retries requests with increasing wait times between attempts, maximizing the chance of success without user intervention. All LLM responses are parsed into standardized, structured formats suitable for file summaries, module summaries, and product documentation, with clear sections for purpose, user actions, and dependencies.

The module operates transparently in the background, handling all complexity of API communication while delivering clean, organized documentation to users. Even when AI responses are incomplete or malformed, the system provides partial data through fallback extraction mechanisms, ensuring users always receive useful output from their documentation generation requests.

**Capabilities:**
- Automatic rate limiting for multiple LLM providers (OpenAI, Claude) to prevent quota violations
- Intelligent retry handling with exponential backoff for transient API failures
- Structured parsing of LLM responses into standardized documentation formats
- Graceful degradation with fallback text extraction when AI responses are malformed
- Provider-specific rate limit management with automatic request throttling

### src/ai/providers (other)

This module provides a flexible AI provider abstraction layer that enables users to interact with multiple language model services through a single, consistent interface. Users can seamlessly work with either OpenAI's GPT models or Anthropic's Claude models without changing how they interact with the application, with the system automatically selecting the configured provider.

The module handles all aspects of AI communication including sending prompts, receiving text responses, and generating structured JSON outputs based on schemas. Users benefit from provider flexibility—if one service is unavailable or preferred over another, the application can switch providers without disrupting the user experience. The factory pattern implementation ensures that only properly configured providers (those with valid API keys) are made available, preventing runtime errors.

Typical workflows include: requesting AI-generated text content where prompts are sent to the configured provider and responses are returned, generating structured data where the AI produces JSON matching specific schemas, and managing provider configuration where users can choose their preferred AI service. The module abstracts away provider-specific implementation details, ensuring users receive consistent, high-quality AI responses regardless of the underlying service being used.

**Capabilities:**
- Switch between multiple AI language model providers (OpenAI GPT and Anthropic Claude) based on user configuration
- Generate AI-powered text responses to user prompts through a unified interface
- Produce structured JSON outputs from AI models based on defined schemas
- Automatically select and use available AI providers based on API key configuration
- Maintain consistent AI behavior and response handling across different provider backends
- Control AI response characteristics through configurable parameters like temperature and token limits

### src/analysis (other)

The analysis module provides comprehensive code analysis capabilities for understanding and improving codebases. It performs deep inspection of code using AST parsing to extract detailed metadata about functions, including their complexity, dependencies, state changes, and behavioral characteristics. This enables developers to make informed decisions about code quality and refactoring needs.

Users can leverage this module to identify problematic code patterns, understand function relationships, and generate detailed refactoring reports for large files. The module analyzes branch complexity to highlight decision-heavy code, maps dependencies to show how components interact, and identifies state mutations that may introduce bugs. It also correlates test coverage with functions to reveal gaps in testing.

The primary workflow involves analyzing code files to extract function-level insights, then generating comprehensive reports that highlight refactoring opportunities. The module flags functions exceeding size thresholds, provides detailed signatures and responsibilities, and shows call relationships between functions. This systematic analysis helps teams maintain code quality and plan refactoring efforts effectively.

**Capabilities:**
- Deep code analysis through Abstract Syntax Tree (AST) parsing to understand code structure and behavior
- Function-level analysis to identify refactoring opportunities in large code files
- Branch complexity and decision point detection to assess code maintainability
- Dependency mapping between modules and functions to visualize code relationships
- State mutation and side effect identification to understand function behavior
- Test coverage mapping to functions for quality assessment
- Size threshold detection to flag functions that may need refactoring
- Extraction of function signatures, dependencies, and responsibilities for documentation

### src (other)

Shadow Watch is a comprehensive VS Code extension that provides intelligent code analysis and documentation capabilities for TypeScript/JavaScript projects. It analyzes your codebase to identify code quality issues, architectural patterns, complexity metrics, and potential problems like orphaned files, circular dependencies, and untested functions. The extension integrates with AI services (OpenAI/Claude) to generate human-readable documentation, architectural insights, and refactoring suggestions based on the analysis results.

The extension provides multiple specialized views within VS Code's sidebar, including an Analysis Viewer showing statistics and code structure, an Insights Viewer displaying AI-generated architectural analysis, a Product Navigator organizing code by functionality rather than file structure, a Static Analysis Viewer for browsing issues by severity, and a Reports tree for accessing generated documentation. All findings are also surfaced through VS Code's native Problems panel with clickable diagnostics that navigate directly to problem locations.

Shadow Watch supports both manual and automatic analysis workflows. Users can trigger analysis on-demand through commands, or enable automatic analysis on file save for continuous feedback. Analysis results are cached for 24 hours to provide instant access when reopening workspaces. The extension also provides specialized features for LLM agents, including file reading capabilities and grep search functionality, enabling AI assistants to iteratively explore and understand codebases.

**Capabilities:**
- Automated code analysis and insights generation for TypeScript/JavaScript codebases
- AI-powered documentation generation using LLM integration (OpenAI/Claude)
- Real-time diagnostic reporting in VS Code's Problems panel
- Multiple specialized tree views for browsing code structure, insights, and reports
- Product-centric navigation organizing code by features instead of file structure
- Static analysis issue detection and reporting
- Code complexity and quality metrics tracking
- Duplicate code detection across files
- Test coverage gap identification
- Cached analysis results with automatic expiration
- File system monitoring with auto-analysis on save
- LLM-ready context generation for AI assistants

**Commands:**
- `shadow-watch.analyzeCode`: Triggers comprehensive code analysis of the current workspace, generating insights, diagnostics, and updating all tree views
- `shadow-watch.openAnalysisViewer`: Opens the Analysis Viewer panel showing codebase statistics, file structure, functions, and entry points
- `shadow-watch.openInsightsViewer`: Opens the Insights Viewer displaying AI-generated architectural insights and code quality recommendations
- `shadow-watch.openStaticAnalysisViewer`: Opens the Static Analysis Viewer showing detected issues organized by severity (errors, warnings, info)
- `shadow-watch.regenerateProductDocumentation`: Triggers AI-powered generation of product-level documentation describing the codebase's purpose and architecture
- `shadow-watch.regenerateInsights`: Regenerates AI-powered code insights including architectural patterns, technical decisions, and improvement suggestions
- `shadow-watch.regenerateUnitTests`: Generates AI-powered unit test plans identifying gaps in test coverage
- `shadow-watch.regenerateReport`: Regenerates a specific report type (workspace, product, architecture, or unit test documentation)
- `shadow-watch.clearCache`: Clears cached analysis results, forcing a fresh analysis on next run
- `shadow-watch.configureLLM`: Opens configuration for LLM provider settings (API keys, model selection)
- `shadow-watch.copyInsights`: Copies formatted analysis insights to clipboard for use with external AI assistants
- `shadow-watch.openReport`: Opens a specific generated report in the VS Code editor

**Workers:**
- File Watcher: Monitors TypeScript file saves and triggers automatic analysis
  - Flow: User saves a TypeScript file → File watcher detects change → Throttles rapid saves → Triggers code analysis → Updates all views and diagnostics → Displays results in tree views and Problems panel
- LLM Analysis Pipeline: Orchestrates AI-powered code analysis and documentation generation
  - Flow: User triggers analysis command → Code is parsed and analyzed for structure/metrics → Results formatted into LLM prompt → API call to OpenAI/Claude → Structured response parsed → Insights/documentation generated → Results saved to workspace → Tree views updated → User notified of completion
- Cache Manager: Manages persistent storage and automatic expiration of analysis results
  - Flow: Analysis completes → Results serialized to JSON → Saved to .shadow/cache directory with timestamp → On workspace open, checks cache age → If under 24 hours, loads from cache → If expired, triggers fresh analysis → Cache can be manually cleared via command
- Diagnostics Provider: Converts code insights into VS Code diagnostics displayed in Problems panel
  - Flow: Insights generated → Each insight mapped to diagnostic (error/warning/info) → Diagnostics associated with file locations and line numbers → Problems panel populated → Editor shows squiggles at problem locations → User clicks diagnostic → Editor navigates to problem location

### src/config (other)

The config module provides comprehensive settings management for the Shadow Watch extension, serving as the central configuration hub that controls all aspects of extension behavior. It enables users to customize their security analysis experience through VS Code's settings interface, managing everything from LLM provider credentials to analysis automation preferences.

Users can configure critical operational parameters including which LLM services to use (OpenAI or Claude), set security issue severity thresholds that determine when and how issues are flagged, and control when analysis occurs (automatically on save or manually triggered). The module also manages UI preferences like inline hint visibility and output formatting options.

All configuration changes are monitored in real-time, with automatic notifications sent to relevant extension components whenever settings are updated. This ensures that user preference changes take immediate effect without requiring extension reloads, providing a seamless configuration experience that adapts instantly to user needs.

**Capabilities:**
- Centralized management of all Shadow Watch extension settings and preferences
- Real-time configuration updates that automatically propagate to all extension components
- LLM provider configuration for OpenAI and Claude integrations with secure API key management
- Customizable security severity thresholds for error, warning, and info level issues
- Automatic code analysis triggers configurable for file save events
- Display preferences for inline code hints and annotations
- Flexible output format selection for LLM analysis results across multiple AI chat interfaces

### src/context (other)

The context module serves as a bridge between code analysis tools and AI-powered features by transforming raw analysis results into LLM-friendly formats. It automatically captures insights about code structure, dependencies, and relationships, then persists this information for future use.

When code is analyzed, this module saves the results to a dedicated .shadow/docs directory within your project workspace. This creates a persistent cache of code intelligence that can be leveraged across multiple AI interactions without re-analyzing the same code. The module handles the conversion of technical analysis data into structured contexts that language models can effectively interpret and use for tasks like code generation, refactoring suggestions, and documentation.

The workflow is transparent to users: as you work with AI features that analyze your code, the context module automatically manages the storage and formatting of analysis results in the background. This cached analysis improves performance and consistency across AI-powered development workflows.

**Capabilities:**
- Automatically persists code analysis results to disk for future reference and reuse
- Converts complex code analysis data into a structured format optimized for LLM consumption
- Maintains a persistent documentation cache in the project workspace
- Enables code intelligence features by storing analyzed code structure and metadata

### src/domain/bootstrap (other)

The bootstrap module serves as the initialization and configuration layer for the VS Code extension, responsible for setting up all components when the extension activates. It orchestrates the registration of commands, initialization of UI elements (status bar, tree views, diagnostics), and configuration of services that power the extension's code analysis and insight generation capabilities.

This module enables users to interact with the extension through registered commands for analyzing code, navigating product structures, viewing insights, and managing extension data. It establishes the connection between user actions (like clicking buttons or triggering commands) and the underlying services that perform analysis, generate insights, and display results.

The bootstrap process creates a complete workflow infrastructure: users can analyze their workspace or individual files, view results in dedicated tree views, navigate through product features and test structures, copy insights to clipboard, and monitor extension status through the status bar. The module also sets up automatic re-analysis triggers when files change, ensuring insights stay current as code evolves.

**Capabilities:**
- Initialize and configure the VS Code extension with all necessary components and services
- Register and manage all extension commands for code analysis, navigation, and insights
- Set up UI components including status bar, tree views, and diagnostic panels
- Establish event handlers for automatic file change detection and re-analysis
- Configure workspace-wide and file-specific code analysis capabilities
- Enable navigation between product features, analysis results, and test structures
- Provide clipboard operations for sharing insights and analysis data
- Manage extension settings and LLM provider configurations
- Display real-time status information and analysis reports

**Commands:**
- `analyze-workspace`: Analyze entire workspace for code insights and patterns
- `analyze-file`: Analyze currently open file for insights
- `copy-all-insights`: Copy all generated insights to clipboard
- `copy-file-insights`: Copy insights for a specific file to clipboard
- `copy-insight`: Copy a single insight to clipboard
- `clear-cache`: Clear cached analysis data
- `clear-all-data`: Clear all extension data and reset state
- `open-settings`: Open extension settings configuration
- `view-analysis-report`: View latest analysis report
- `view-test-report`: View latest unit test report
- `switch-llm-provider`: Switch between different LLM providers
- `copy-menu-structure`: Copy menu structure to clipboard
- `view-llm-status`: View current LLM provider status and configuration
- `navigate-to-product-item`: Navigate to a specific product feature or component
- `navigate-to-analysis-result`: Navigate to a specific analysis result location
- `view-product-details`: View detailed information about a product item
- `view-insight-details`: View detailed information about a code insight
- `view-test-details`: View detailed information about a unit test

### src/domain/formatters (other)

The formatters module provides documentation generation and formatting capabilities that convert raw product analysis and code insights into polished, user-ready Markdown documents. It serves as the presentation layer for all documentation output, ensuring consistent formatting and organization across different documentation types.

Users can generate comprehensive product documentation that includes feature overviews, behavioral summaries, and usage examples from multiple perspectives (GUI, CLI, and API). The module automatically organizes file analysis results into logical categories, making it easy to understand codebase structure and component purposes. All generated documentation includes timestamps and proper sectioning, with clear warnings when information is missing or incomplete.

The primary workflow involves taking structured data from code analysis and LLM insights, then transforming it into readable, exportable Markdown documents. This enables users to view, share, and export documentation that accurately represents their product's capabilities, architecture, and usage patterns in a standardized format suitable for both human consumption and further processing.

**Capabilities:**
- Transform product documentation and code analysis into structured Markdown format
- Generate comprehensive documentation with multiple user perspectives (GUI, CLI, API)
- Organize file analysis results by component categories (UI, Business Logic, Data, Infrastructure)
- Format LLM-generated insights with behavioral summaries, feature lists, and usage examples
- Create timestamped documentation exports showing generation date and time
- Display warning messages for missing or incomplete documentation sections
- Structure file classifications with clear purpose descriptions

### src/domain/handlers (other)

The handlers module provides comprehensive code navigation capabilities that enable users to explore their workspace through interactive navigation flows. Users can click on items in the product navigator or analysis viewer to instantly jump to the corresponding source code, whether it's a file, function, API endpoint, or reference location.

When navigating to functions, the module automatically opens the file, positions the cursor at the function definition, and highlights the relevant code section. Users can view detailed function information in a quick pick menu that displays signatures, descriptions, and metadata before navigating. For API endpoints, the module intelligently locates and opens the handler implementation. The module also supports navigating from analysis results, displaying code context with proper syntax highlighting.

Throughout all navigation workflows, the module provides helpful feedback through error messages when files cannot be opened and warnings when navigation targets are not found, ensuring users always understand the outcome of their navigation attempts.

**Capabilities:**
- Navigate to source code files from product navigator items
- Jump to specific function definitions with automatic highlighting
- Navigate to API endpoint handler implementations
- Jump to function usage locations and references
- View function details including signatures, descriptions, and metadata
- Open analysis results with syntax-highlighted code context
- Receive clear error messages when navigation targets are unavailable

### src/domain/prompts (other)

The prompts module provides centralized prompt construction services for all LLM-based code analysis and documentation tasks. It eliminates prompt duplication by offering specialized builders that generate structured, consistent prompts for different analysis purposes including architecture documentation, product feature extraction, test planning, and code understanding.

Users can leverage this module to generate comprehensive refactoring reports that include detailed extraction plans, step-by-step migration instructions, and before-and-after code examples. The module supports both high-level architecture analysis workflows and granular function-level analysis, providing detailed insights into code responsibilities, dependencies, and relationships.

The module serves as the foundation for automated documentation generation, enabling users to transform raw code into structured documentation, test plans, and refactoring strategies through carefully crafted LLM prompts that ensure consistent, high-quality output across all analysis tasks.

**Capabilities:**
- Generate structured prompts for LLM-based architecture analysis that produce comprehensive project documentation
- Create prompts for extracting user-facing product features and capabilities from codebases
- Build comprehensive test plan generation prompts that produce testing strategies for code files
- Generate code analysis prompts that explain file functionality, dependencies, and behavior
- Produce module-level summary prompts that consolidate related files into cohesive documentation
- Create detailed refactoring analysis prompts with extraction plans and migration steps
- Generate function-level analysis prompts that examine responsibilities, dependencies, and call relationships

### src/domain/services (other)

The services module provides three core automation capabilities that enhance the developer experience. It monitors the workspace file system to detect changes in real-time, ensuring that views and displays stay synchronized with the current state of files without manual intervention. When users save documents or add new files, the system automatically responds and updates relevant UI components.

The module enables intelligent analysis workflows where the system iteratively requests additional files and performs code searches across multiple rounds until it has gathered sufficient context to complete tasks. Users see progress updates as the analysis proceeds, and the system automatically incorporates grep search results and file content as needed. This creates a seamless experience where complex analysis tasks are handled through multiple automated iterations.

For testing workflows, the module automatically detects which test framework is in use (Jest, Mocha, Vitest, or Pytest) and validates the configuration setup. It identifies missing dependencies, checks for proper TypeScript support, and reports whether test setup files are present. This ensures that generated tests will work correctly without requiring manual configuration by the user.

**Capabilities:**
- Automatically monitors and responds to file system changes across the workspace without requiring manual refresh
- Performs iterative analysis by making multiple rounds of file access and code searches until sufficient context is gathered
- Automatically detects test framework configuration and identifies missing dependencies or setup requirements
- Updates UI views and displays in real-time when relevant files are created, modified, or deleted
- Retrieves additional file content and grep search results automatically during analysis workflows
- Reports test framework readiness including TypeScript support and configuration file status

### src/infrastructure/fileSystem (other)

The fileSystem module provides high-performance file access and processing capabilities for the extension. It maintains an intelligent in-memory cache that speeds up repeated file reads while automatically staying synchronized with disk changes, ensuring users always work with current file content without manual refresh actions.

The module handles bulk file operations efficiently by processing multiple files simultaneously and automatically filtering out non-source directories like node_modules, .git, dist, and build folders. This means users don't need to manually exclude common directories - the extension intelligently focuses on relevant source files.

All file operations are wrapped with consistent error handling, so users experience graceful degradation rather than crashes when file access issues occur. The combination of caching, parallel processing, and smart filtering results in noticeably faster extension performance, particularly when working with large codebases or performing operations that touch many files at once.

**Capabilities:**
- Caches file contents in memory to accelerate repeated file access operations
- Automatically refreshes cached content when files are modified on disk
- Processes multiple files in parallel for faster bulk operations
- Intelligently filters files to skip non-source directories and irrelevant files
- Provides consistent error handling across all file operations
- Reduces disk I/O to improve overall extension responsiveness

### src/infrastructure/persistence (other)

The persistence module provides automatic, organized storage of all analysis results generated by Shadow. When you run analyses on your codebase, this module ensures that every result—whether product documentation, architecture insights, or project summaries—is saved to disk in a structured, timestamped format. This creates a permanent record of your analysis history.

Each analysis run creates a new timestamped directory (e.g., .shadow/docs/2024-01-15_14-30-00) that contains all outputs from that session. This approach preserves the complete history of your project's evolution, allowing you to review past analyses, compare changes over time, and track how your documentation and insights have developed. Product documentation goes to .shadow/docs, while architecture insights are stored in .shadow/insights.

All saved files use formatted markdown with proper structure and metadata, making them easy to read, version control, and integrate into your existing documentation workflows. The persistent storage means you can always access previous analyses without re-running expensive AI operations, and you can track how your codebase understanding has evolved across different time periods.

**Capabilities:**
- Automatically persists all analysis results to disk in organized directory structures
- Creates timestamped folders for each analysis run to maintain complete history
- Saves product documentation to .shadow/docs with formatted markdown content
- Stores architecture insights in .shadow/insights as structured reports
- Preserves project summaries with metadata for later review
- Maintains versioned analysis history for comparison and tracking changes over time

### src/infrastructure (other)

The Infrastructure module provides a centralized progress notification service that enhances user experience during long-running operations. It enables the application to display consistent, informative progress indicators that keep users informed about ongoing tasks.

Users benefit from clear visual feedback when operations take time to complete, with the ability to cancel tasks if needed. Progress notifications can include both titles and dynamically updated messages, providing context about what's happening at each stage. The service supports multiple display locations, allowing progress information to appear in the most appropriate part of the interface—whether as a prominent notification or a subtle status bar indicator.

This module standardizes how progress is communicated throughout the application, ensuring users always have visibility into system activity and control over cancellable operations. It abstracts the complexity of progress management, providing a uniform interface for displaying task status regardless of the underlying operation type.

**Capabilities:**
- Display progress notifications for long-running operations
- Show cancellable progress indicators that users can interrupt
- Update progress messages dynamically during task execution
- Configure progress display location (notification area, status bar, etc.)
- Provide standardized progress feedback across the application

### src/state (other)

The state module provides comprehensive state management for the extension, ensuring that all user data, preferences, and LLM-generated content persists across VS Code sessions. It acts as the central nervous system for managing state across multiple UI components including the insights tree view, product navigator, analysis viewer, unit tests navigator, and reports viewer.

Users benefit from seamless state persistence where their settings, preferences, and generated content are automatically saved and restored when reopening VS Code. The module coordinates state changes across all LLM-powered features, ensuring that insights, analysis results, test information, and reports remain synchronized and immediately accessible. Changes are applied in real-time with automatic validation and persistence, providing a reliable and consistent user experience.

The module supports complex workflows involving multiple interconnected views and features, managing the lifecycle of LLM-generated content from creation through display and navigation. It handles state for documentation navigation, code analysis results, unit test exploration, and report generation, ensuring that all data remains consistent and accessible throughout the user's interaction with the extension.

**Capabilities:**
- Persistent state management across VS Code sessions
- Automatic saving and restoration of user preferences and settings
- Real-time state synchronization for LLM-powered features
- Centralized management of insights, navigation, analysis, and test data
- Multi-view state coordination across tree views and output channels

### src/storage (other)

The storage module provides a generic incremental storage system that automatically manages versioned data persistence to disk. It handles the complexity of saving data with timestamps and iteration numbers, ensuring that all historical versions are preserved for audit trails and recovery purposes.

Users can save data incrementally without worrying about overwriting previous versions - each save creates a new timestamped file while maintaining the previous versions. The module supports both JSON format for structured data and optional Markdown format for human-readable documentation. When retrieving data, users automatically get the most recent version, but all historical versions remain accessible through their timestamped filenames.

This module is ideal for workflows that require data versioning, audit trails, or the ability to track changes over time. Common use cases include saving analysis results, configuration snapshots, or any data that needs to be preserved across multiple iterations with automatic timestamp tracking.

**Capabilities:**
- Automatically save data to disk with timestamps for version tracking
- Incrementally save multiple versions of data with iteration numbers
- Preserve historical data across saves with timestamped file naming
- Store data in both JSON and optional Markdown formats
- Retrieve the most recent saved version of data
- Track when data was generated through automatic timestamping

### src/test/__mocks__ (tests)

This testing infrastructure module provides mock implementations of the VS Code Extension API specifically designed for Jest unit tests. It enables developers to test extension functionality in isolation without launching the full VS Code environment, significantly speeding up test execution and enabling automated testing in continuous integration pipelines.

The module mocks essential VS Code API surfaces including workspace configuration, window UI elements, language features, and command registration. This allows extension developers to write comprehensive unit tests that verify their extension's logic, error handling, and integration with VS Code APIs while maintaining fast test execution times and deterministic test behavior.

While this module has no direct user-facing features in the production extension, it provides critical testing infrastructure that ensures extension quality and reliability. Developers can run tests locally during development and in automated CI/CD pipelines to catch regressions and verify correctness before shipping updates to end users.

**Capabilities:**
- Enables isolated unit testing of VS Code extension code without requiring the actual VS Code extension host environment
- Provides mock implementations of core VS Code API objects including workspace, window, languages, and commands
- Supports test-driven development by simulating VS Code extension APIs with controllable test doubles
- Allows developers to verify extension behavior through automated Jest tests in a CI/CD pipeline

### src/ui (gui)

The UI module provides a unified Reports Viewer interface that serves as a central hub for accessing all documentation and analysis reports generated by the extension. Users can view a webview panel displaying organized cards for each report type, including workspace summaries, product documentation, architecture diagrams, refactoring guides, and unit test documentation.

The Reports Viewer displays the current status of each report, showing whether it has been generated and when it was last updated. Each report card includes a descriptive label, brief description, and visual indicators for availability. Users can click on any available report card to open the corresponding HTML report in their default web browser, streamlining the workflow for reviewing generated documentation.

This centralized interface eliminates the need to navigate through the file system to find generated reports, providing a convenient dashboard that shows at a glance which reports are available and allows immediate access to them. The panel can be refreshed to reflect newly generated reports and closed when no longer needed.

**Capabilities:**
- Provides a centralized dashboard view for all generated reports within the VS Code extension
- Displays clickable cards for each report type with availability status and metadata
- Shows timestamps indicating when each report was last generated
- Enables quick access to workspace, product, architecture, refactoring, and unit-test reports
- Distinguishes between available reports and reports not yet generated
- Opens HTML reports in the default browser with a single click

### src/ui/webview (gui)

The webview module provides the foundation for displaying custom web-based user interfaces within VSCode. It enables the application to show rich, interactive panels that can present information, forms, and visual content using HTML rendering. Users interact with these webview panels as they appear in the editor, with the module handling all the complexity of panel lifecycle management.

When users trigger actions that require custom visualizations or interfaces, this module ensures webview panels are created, displayed, and managed consistently. The module handles bringing existing panels to the front when reactivated, cleaning up resources when panels are closed, and rendering content through a structured template system that ensures proper styling and functionality.

This infrastructure supports various types of webview-based features throughout the application, providing a reusable foundation that reduces code duplication and ensures consistent behavior. Users experience smooth transitions as panels open, update, and close, with the module handling all technical aspects of webview integration with the VSCode environment.

**Capabilities:**
- Display custom webview panels within the VSCode interface
- Manage webview lifecycle including creation, activation, and disposal
- Render dynamic HTML content through a template-based system
- Handle webview state transitions and visibility changes
- Provide consistent webview behavior across different panel types

## File-Level Documentation

*Detailed documentation for 50 files*

### jest.config.js

**Role:** Core Logic

**Purpose:** Configures Jest testing framework for TypeScript unit tests with coverage reporting and VS Code mocking support.

**User Actions:**
- Users indirectly benefit from automated testing ensuring code quality and stability
- Test results and coverage reports help users trust the extension's reliability

### src/ai/llmRateLimiter.ts

**Role:** Core Logic

**Purpose:** Manages API rate limiting for LLM providers (OpenAI and Claude) to prevent exceeding their request quotas

**User Actions:**
- API requests are automatically throttled to stay within provider limits
- Requests may be delayed or rejected if rate limits are exceeded
- Different LLM providers (OpenAI, Claude) have different rate limit allowances

**Key Functions:**
- `constructor`: Initializes rate limiter with default limits for OpenAI (60 req/min) and Claude (50 req/min)
  - Inputs: none
  - Outputs: RateLimiter instance
- `configure`: Sets custom rate limit configuration for a specific LLM provider
  - Inputs: provider (openai|claude), config (maxRequests, windowMs)
  - Outputs: void
- `canMakeRequest`: Checks if a request can be made without exceeding the rate limit for the provider
  - Inputs: provider (openai|claude)
  - Outputs: boolean (true if request allowed, false if rate limit exceeded)
- `recordRequest`: Records the timestamp of a request to track usage against rate limits
  - Inputs: provider (openai|claude)
  - Outputs: void

### src/ai/llmResponseParser.ts

**Role:** Core Logic

**Purpose:** Parses and extracts structured data from LLM text responses into standardized formats for file summaries, module summaries, and product documentation.

**User Actions:**
- When AI analysis completes, user receives structured documentation with clear sections for purpose, actions, and dependencies
- User sees organized file and module summaries with extracted key information
- User receives product documentation with categorized features and use cases
- When AI responses are malformed, user still gets partial data with fallback text extraction

**Key Functions:**
- `parseFileSummary`: Extracts file-level documentation from LLM response
  - Inputs: content (string), filePath (string), role (string)
  - Outputs: FileSummary object with purpose, actions, functions, and dependencies
- `parseModuleSummary`: Extracts module-level documentation from LLM response
  - Inputs: content (string), modulePath (string)
  - Outputs: ModuleSummary object with organized module information
- `parseEnhancedProductDocumentation`: Extracts comprehensive product documentation from LLM response
  - Inputs: content (string)
  - Outputs: EnhancedProductDocumentation object with features, use cases, and target users
- `parseInsights`: Extracts general insights and analysis from LLM response
  - Inputs: content (string)
  - Outputs: LLMInsights object with purpose, capabilities, and context
- `extractSection`: Extracts a specific named section from text content
  - Inputs: content (string), sectionName (string)
  - Outputs: Extracted text string or empty string
- `extractListSection`: Extracts a list of items from a named section
  - Inputs: content (string), sectionName (string)
  - Outputs: Array of strings extracted from the section

### src/ai/llmRetryHandler.ts

**Role:** Core Logic

**Purpose:** Handles automatic retry logic for LLM API requests with exponential backoff when errors occur

**User Actions:**
- API requests automatically retry when temporary failures occur (rate limits, timeouts, network issues)
- Longer wait times occur between successive retry attempts
- Failed requests eventually succeed or show error after maximum retries exhausted

**Key Functions:**
- `executeWithRetry`: Executes an async operation with automatic retry logic and exponential backoff
  - Inputs: operation function to execute, optional retry configuration (maxRetries, delays, error types)
  - Outputs: Promise resolving to operation result with attempt count
- `isRetryableError`: Determines if an error should trigger a retry based on error type classification
  - Inputs: error object, list of retryable error patterns
  - Outputs: boolean indicating if error is retryable

### src/ai/providers/ILLMProvider.ts

**Role:** Core Logic

**Purpose:** Defines the standard interface that all AI language model providers (like OpenAI, Claude, etc.) must implement for consistent interaction throughout the application.

**User Actions:**
- User receives AI-generated text responses to their queries
- User receives structured JSON data from AI requests when specific formats are needed
- User experiences consistent AI behavior regardless of which provider (OpenAI, Claude, etc.) is configured
- User sees AI responses that respect configured parameters like temperature and token limits

**Key Functions:**
- `isConfigured`: Verifies if the AI provider has valid credentials and is ready to accept requests
  - Inputs: none
  - Outputs: boolean indicating if provider is configured
- `sendRequest`: Sends a conversation to the AI provider and retrieves a text response
  - Inputs: LLMRequestOptions containing model, messages, system prompt, and generation parameters
  - Outputs: Promise<LLMResponse> with content string and metadata
- `sendStructuredRequest`: Sends a request expecting structured JSON output, with optional schema validation
  - Inputs: LLMRequestOptions and optional schema definition
  - Outputs: Promise<StructuredOutputResponse<T>> with parsed typed data and optional follow-up requests
- `getName`: Returns the human-readable name of the provider for identification
  - Inputs: none
  - Outputs: string with provider name

### src/ai/providers/anthropicProvider.ts

**Role:** Core Logic

**Purpose:** Integrates Anthropic's Claude AI models as an LLM provider for generating AI responses and structured outputs in the application

**User Actions:**
- Sends prompts to Claude AI and receives text responses
- Generates structured JSON outputs from Claude based on schemas
- Receives error messages when Claude API is not configured
- Experiences AI-powered features using Claude's language models

**Key Functions:**
- `initialize`: Sets up the Claude API client with API key from configuration
  - Inputs: None (reads from config manager)
  - Outputs: void (sets up internal client)
- `isConfigured`: Checks if Claude provider is ready to use
  - Inputs: None
  - Outputs: boolean indicating if API key is configured
- `getName`: Returns the provider identifier
  - Inputs: None
  - Outputs: 'claude' string
- `sendRequest`: Sends a prompt to Claude and returns the AI response
  - Inputs: LLMRequestOptions (messages, model, systemPrompt, maxTokens)
  - Outputs: LLMResponse with content and token usage
- `sendStructuredOutputRequest`: Requests a JSON response from Claude conforming to a schema
  - Inputs: LLMRequestOptions with schema definition
  - Outputs: StructuredOutputResponse with extracted JSON data

### src/ai/providers/openAIProvider.ts

**Role:** Core Logic

**Purpose:** Implements OpenAI API integration to send chat requests and receive responses from GPT models

**User Actions:**
- Enables AI-powered chat interactions using OpenAI's GPT models
- Provides structured JSON responses from AI when requested
- Returns AI-generated text content based on user prompts
- Shows error when OpenAI API key is not configured

**Key Functions:**
- `initialize`: Sets up OpenAI client with API key from configuration
  - Inputs: None (reads from config)
  - Outputs: Initializes client or sets to null if no key
- `isConfigured`: Checks if the OpenAI provider is ready to use
  - Inputs: None
  - Outputs: Boolean indicating if API key is set
- `getName`: Returns the provider identifier
  - Inputs: None
  - Outputs: String 'openai'
- `sendRequest`: Sends a chat completion request to OpenAI and returns the response
  - Inputs: LLMRequestOptions (model, messages, systemPrompt, responseFormat)
  - Outputs: LLMResponse with content, finish reason, and token usage
- `requestStructuredOutput`: Requests AI response in JSON format and parses it
  - Inputs: LLMRequestOptions with JSON schema
  - Outputs: StructuredOutputResponse with parsed JSON object or null

### src/ai/providers/providerFactory.ts

**Role:** Core Logic

**Purpose:** Creates and manages AI provider instances (OpenAI and Claude) based on configuration settings

**User Actions:**
- Switches between different AI providers (OpenAI or Claude) based on user configuration
- Automatically uses the AI provider that is properly configured with API keys
- Provides list of available AI providers that have been configured

**Key Functions:**
- `getProvider`: Returns an instance of the specified AI provider (OpenAI or Claude)
  - Inputs: provider: 'openai' | 'claude'
  - Outputs: ILLMProvider instance
- `getCurrentProvider`: Returns the AI provider instance based on current user configuration
  - Inputs: none
  - Outputs: ILLMProvider instance for the configured provider
- `isProviderConfigured`: Checks if a specific AI provider has valid configuration and API keys
  - Inputs: provider: 'openai' | 'claude'
  - Outputs: boolean indicating if provider is ready to use
- `getConfiguredProviders`: Returns list of all AI providers that are properly configured
  - Inputs: none
  - Outputs: Array of configured provider names

### src/analysis/enhancedAnalyzer.ts

**Role:** Core Logic

**Purpose:** Performs deep code analysis by parsing Abstract Syntax Trees (AST) to extract detailed function metadata including branches, dependencies, state mutations, and behavioral hints.

**User Actions:**
- Provides detailed insights about code behavior and function characteristics
- Shows branch complexity and decision points in code
- Reveals dependencies between code modules and functions
- Identifies state mutations and side effects in functions
- Maps test coverage to functions

**Key Functions:**
- `analyzeFileMetadata`: Analyzes a single code file and extracts enhanced metadata for all functions in it
  - Inputs: filePath: string, content: string, language: string, functions: FunctionInfo[]
  - Outputs: Map<string, FunctionMetadata> containing detailed function analysis
- `analyzeTypeScriptFunction`: Uses TypeScript AST parser to deeply analyze a function's structure, branches, dependencies, and behavior
  - Inputs: filePath: string, content: string, func: FunctionInfo, functionContent: string
  - Outputs: FunctionMetadata with AST-derived insights
- `analyzeFunctionWithRegex`: Provides basic function analysis using pattern matching for languages without AST support
  - Inputs: filePath: string, func: FunctionInfo, functionContent: string, language: string
  - Outputs: FunctionMetadata with regex-based analysis
- `extractFunctionContent`: Extracts the source code content of a function between specified line numbers
  - Inputs: content: string, startLine: number, endLine: number
  - Outputs: string containing the function's source code

### src/analysis/functionAnalyzer.ts

**Role:** Core Logic

**Purpose:** Analyzes functions in large code files to extract detailed information for generating refactoring reports

**User Actions:**
- Generates detailed analysis reports for functions in large files
- Identifies functions that exceed size thresholds and may need refactoring
- Provides function signatures, dependencies, and responsibilities in refactoring reports
- Shows which functions call or are called by other functions

**Key Functions:**
- `analyzeFunctions`: Analyzes all functions in large files and extracts detailed information for refactoring
  - Inputs: codeAnalysis (full code analysis results), largeFileThreshold (line count threshold, default 500)
  - Outputs: Array of FunctionAnalysis objects containing detailed function information
- `analyzeFunction`: Performs detailed analysis of a single function including dependencies and responsibilities
  - Inputs: filePath (file location), func (function info object), codeAnalysis (full analysis context)
  - Outputs: FunctionAnalysis object with complete function details, or null if analysis fails
- `resolveFilePath`: Resolves relative or absolute file paths to full file system paths
  - Inputs: filePath (path to resolve), codeAnalysis (context for resolution)
  - Outputs: Full resolved file path

### src/analysisViewer.ts

**Role:** GUI View

**Purpose:** Provides a tree view panel that displays code analysis results including statistics, files, functions, and entry points in a browsable hierarchical structure

**User Actions:**
- View a tree structure showing code analysis results in the sidebar
- Browse statistics about the analyzed codebase (file count, line count, function count)
- Navigate through files and directories in the analysis
- See file details including line count, function count, import/export count, and complexity
- Browse all functions with their metadata (lines of code, complexity, parameters)
- View entry points (main functions, exported items, test files)
- Click on items to jump to their location in the source code
- See grouped views of files by directory structure
- See message 'No analysis available' when no analysis has been run yet
- Refresh the tree view to see updated analysis results

**Key Functions:**
- `setAnalysis`: Sets the code analysis data to display in the tree view and triggers a refresh
  - Inputs: analysis: CodeAnalysis | null
  - Outputs: void
- `refresh`: Refreshes the tree view to update displayed data
  - Inputs: none
  - Outputs: void
- `getTreeItem`: Returns the tree item representation for display in VS Code
  - Inputs: element: AnalysisItem
  - Outputs: vscode.TreeItem
- `getChildren`: Returns child items for a given tree node to build the hierarchy
  - Inputs: element?: AnalysisItem
  - Outputs: Thenable<AnalysisItem[]>
- `getRootItems`: Returns top-level categories shown in the tree (statistics, files, functions, entry points)
  - Inputs: none
  - Outputs: AnalysisItem[]
- `getStatisticsItems`: Returns statistical summary items (total files, lines, functions, etc.)
  - Inputs: none
  - Outputs: AnalysisItem[]
- `getFilesItems`: Returns all analyzed files organized by directory structure
  - Inputs: none
  - Outputs: AnalysisItem[]
- `getFileDetails`: Returns detailed information about a specific file (line count, functions, imports, exports)
  - Inputs: element: AnalysisItem
  - Outputs: AnalysisItem[]
- `getDirectoryFiles`: Returns all files within a specific directory
  - Inputs: element: AnalysisItem
  - Outputs: AnalysisItem[]

### src/analyzer.ts

**Role:** Core Logic

**Purpose:** Defines the core data structures and interfaces for code analysis results, including file metadata, function signatures, dependencies, test mappings, and code duplication detection.

**User Actions:**
- See analysis results showing total files, lines, and functions in their codebase
- View list of large files that may need refactoring
- Identify orphaned files that are not imported anywhere
- Discover entry points (main functions) in the codebase
- Find duplicate code blocks across files
- See which functions are not covered by tests
- View function complexity and risk levels (high/medium/low)
- Understand function dependencies on databases, HTTP, filesystem, and other external resources

**Key Functions:**
- `CodeAnalysis`: Primary interface containing complete codebase analysis results
  - Inputs: None (interface definition)
  - Outputs: Structured data with file counts, function lists, imports, orphaned files, entry points, duplicates, and optional enhanced metadata
- `FunctionMetadata`: Detailed metadata for a single function including signature, documentation, control flow, and dependencies
  - Inputs: None (interface definition)
  - Outputs: Function name, parameters, return type, visibility, branches, dependencies, state mutations, risk level, and line numbers
- `TestMapping`: Maps source files and functions to their corresponding test coverage
  - Inputs: None (interface definition)
  - Outputs: Source-to-test file mappings, function-to-test mappings, and list of uncovered functions
- `DependencyInfo`: Describes external and internal dependencies used by functions
  - Inputs: None (interface definition)
  - Outputs: Dependency name, type (db/http/filesystem/etc), whether it's internal, and line number
- `BranchInfo`: Represents control flow branches in code (if/else/loop/try/catch)
  - Inputs: None (interface definition)
  - Outputs: Branch type, human-readable condition description, and line number

### src/cache.ts

**Role:** Core Logic

**Purpose:** Manages persistent storage and retrieval of code analysis results with automatic expiration

**User Actions:**
- Analysis results load instantly when reopening a workspace (if cached within 24 hours)
- Analysis cache automatically expires after 24 hours, triggering fresh analysis
- Cache can be manually cleared to force fresh analysis

**Key Functions:**
- `constructor`: Initializes cache with storage location and creates cache directory
  - Inputs: storagePath: string
  - Outputs: AnalysisCache instance
- `getCacheKey`: Generates safe filename from workspace path for cache storage
  - Inputs: workspaceRoot: string
  - Outputs: base64-encoded string suitable for filename
- `get`: Retrieves cached analysis for workspace if exists and not expired
  - Inputs: workspaceRoot: string
  - Outputs: Promise<CodeAnalysis | null> - cached data or null if missing/expired
- `set`: Saves analysis results to cache with current timestamp
  - Inputs: workspaceRoot: string, data: CodeAnalysis
  - Outputs: Promise<void>
- `clear`: Removes all cached analysis files from cache directory
  - Inputs: none
  - Outputs: Promise<void>

### src/config/configurationManager.ts

**Role:** Core Logic

**Purpose:** Manages all Shadow Watch extension settings and notifies components when configuration changes

**User Actions:**
- User changes Shadow Watch settings in VS Code preferences
- Extension behavior updates automatically when settings change (e.g., enable/disable analysis, adjust thresholds)
- User configures LLM providers (OpenAI, Claude) and API keys
- User sets severity thresholds for security issues (error, warning, info)
- User enables/disables automatic analysis on file save
- User toggles inline hints display in code editor
- User configures output formats for LLM analysis results (Cursor, ChatGPT, generic, compact)

**Key Functions:**
- `constructor`: Initializes configuration manager and sets up automatic change detection
  - Inputs: none
  - Outputs: ConfigurationManager instance
- `onConfigurationChange`: Registers a callback function that runs when configuration changes
  - Inputs: callback function
  - Outputs: void
- `removeConfigurationChangeListener`: Unregisters a configuration change callback
  - Inputs: callback function
  - Outputs: void
- `enabled (getter)`: Returns whether Shadow Watch extension is enabled
  - Inputs: none
  - Outputs: boolean
- `analyzeOnSave (getter)`: Returns whether automatic analysis on file save is enabled
  - Inputs: none
  - Outputs: boolean
- `showInlineHints (getter)`: Returns whether inline security hints should be displayed in editor
  - Inputs: none
  - Outputs: boolean

### src/context/analysisContextBuilder.ts

**Role:** Core Logic

**Purpose:** Converts code analysis results into a format suitable for LLM consumption and persists analysis data to disk for future reference

**User Actions:**
- Analysis results are automatically saved to the workspace for future use
- Code analysis data is stored in a .shadow/docs directory within the project

**Key Functions:**
- `convertCodeAnalysisToContext`: Transforms CodeAnalysis data structure into AnalysisContext format for LLM processing
  - Inputs: CodeAnalysis object containing files, imports, entry points, and metrics
  - Outputs: AnalysisContext object with restructured file information, imports, entry points, and statistics
- `saveCodeAnalysis`: Persists code analysis results to the workspace filesystem for later retrieval
  - Inputs: CodeAnalysis object to be saved
  - Outputs: void - creates/updates code-analysis.json file in .shadow/docs directory

### src/diagnosticsProvider.ts

**Role:** Core Logic

**Purpose:** Manages and displays code diagnostics (warnings, errors, info messages) in the VS Code Problems panel based on insights generated from code analysis

**User Actions:**
- Shows diagnostic messages (warnings, errors, info) in the Problems panel for issues found in code files
- Displays colored underlines or squiggles in code editor at specific line numbers where issues are detected
- Groups diagnostic messages by file in the Problems panel
- Shows 'Shadow Watch' as the source of diagnostic messages
- Clears all diagnostic messages when requested
- Updates diagnostics in real-time as insights are generated

**Key Functions:**
- `updateDiagnostics`: Updates diagnostics for all files based on an array of insights
  - Inputs: insights: Insight[] - Array of insight objects containing file paths, line numbers, descriptions, and severity
  - Outputs: void - Displays diagnostics in Problems panel
- `updateDiagnosticsForFile`: Updates diagnostics for a specific file only
  - Inputs: uri: vscode.Uri - File URI, insights: Insight[] - Insights for that file
  - Outputs: void - Displays diagnostics for the specified file
- `clear`: Removes all diagnostics from the Problems panel
  - Inputs: None
  - Outputs: void
- `createDiagnostic`: Converts an Insight object into a VS Code Diagnostic object
  - Inputs: insight: Insight - Contains description, severity, line number, file path, and ID
  - Outputs: vscode.Diagnostic - VS Code diagnostic that appears in Problems panel and editor
- `getSeverity`: Maps insight severity string to VS Code DiagnosticSeverity enum
  - Inputs: severity: string - Severity level from insight
  - Outputs: vscode.DiagnosticSeverity - VS Code severity enum value
- `dispose`: Cleans up and disposes the diagnostic collection
  - Inputs: None
  - Outputs: void

### src/domain/bootstrap/commandRegistry.ts

**Role:** Core Logic

**Purpose:** Registers all VS Code commands for the extension, mapping command IDs to their handler functions

**User Actions:**
- Analyze entire workspace for code insights
- Analyze currently open file
- Copy all insights to clipboard
- Copy insights for a specific file
- Copy a single insight
- Clear cached analysis data
- Clear all extension data
- Open extension settings
- View latest analysis report
- View latest unit test report
- Switch between LLM providers
- Copy menu structure
- View current LLM provider status
- Navigate to a product feature or component
- Navigate to a specific analysis result
- View detailed information about a product item
- View detailed information about an insight
- View detailed information about a unit test

**Key Functions:**
- `register`: Registers all extension commands with VS Code's command system
  - Inputs: context: ExtensionContext, components: ExtensionComponents
  - Outputs: void - side effect of registering commands
- `analyzeWorkspace`: Triggers analysis of all files in the workspace
  - Inputs: none
  - Outputs: Promise<void>
- `analyzeCurrentFile`: Triggers analysis of the currently active file
  - Inputs: none
  - Outputs: Promise<void>
- `copyAllInsights`: Copies all generated insights to the clipboard
  - Inputs: none
  - Outputs: Promise<void>
- `copyFileInsights`: Copies insights for a specific file to the clipboard
  - Inputs: none
  - Outputs: Promise<void>
- `copyInsight`: Copies a single insight item to the clipboard
  - Inputs: item: any
  - Outputs: Promise<void>
- `clearCache`: Clears the analysis cache
  - Inputs: none
  - Outputs: Promise<void>
- `clearAllData`: Clears all extension data including cache and settings
  - Inputs: none
  - Outputs: Promise<void>
- `switchProvider`: Switches between different LLM provider configurations
  - Inputs: none
  - Outputs: Promise<void>
- `navigateToProductItem`: Opens the file/location associated with a product feature
  - Inputs: item: ProductNavItem
  - Outputs: Promise<void>
- `navigateToAnalysisItem`: Opens the file/location associated with an analysis result
  - Inputs: item: AnalysisItem
  - Outputs: Promise<void>
- `showProviderStatus`: Displays information about the current LLM provider configuration
  - Inputs: none
  - Outputs: Promise<void>

### src/domain/bootstrap/extensionBootstrapper.ts

**Role:** Core Logic

**Purpose:** Initializes and configures all extension components when the VS Code extension activates, connecting UI elements, services, and event handlers

**User Actions:**
- Status bar displays extension status and information
- Product Navigator view shows navigable product structure
- Analysis Viewer displays code analysis results
- Insights Viewer shows generated code insights
- Static Analysis Viewer presents static analysis findings
- Unit Tests Navigator displays test structure and results
- Reports Viewer shows generated analysis reports
- Diagnostics appear in Problems panel for code issues
- File changes trigger automatic re-analysis

**Key Functions:**
- `ExtensionComponents interface`: Defines the structure of all initialized extension components including analyzers, viewers, providers, and services
  - Inputs: N/A - interface definition
  - Outputs: Type definition for component container

### src/domain/formatters/documentationFormatter.ts

**Role:** Core Logic

**Purpose:** Formats product documentation and code analysis insights into structured Markdown documents for user consumption and export.

**User Actions:**
- View product documentation formatted as Markdown with overview, features, and user perspectives
- See file analysis results organized by component categories (UI, Business Logic, Data, Infrastructure)
- Read LLM insights formatted with behavioral summaries, feature lists, and usage examples
- Export documentation with timestamps showing generation date and time
- Access documentation sections for GUI, CLI, and API perspectives
- View file classifications and their purposes in structured sections
- See warning messages for empty or missing documentation sections

**Key Functions:**
- `formatEnhancedDocsAsMarkdown`: Converts enhanced product documentation object into formatted Markdown with sections for overview, features, user perspectives, tech stack, architecture, and file structures
  - Inputs: EnhancedProductDocumentation object containing overview, features, user perspectives, tech stack, architecture, and file analysis
  - Outputs: Formatted Markdown string with hierarchical sections and timestamps
- `formatFileAnalysisAsMarkdown`: Formats file analysis results into categorized Markdown sections (UI Components, Business Logic, Data Layer, Infrastructure) with file paths and purposes
  - Inputs: File analysis results with categorized files (uiComponents, businessLogic, dataLayer, infrastructure)
  - Outputs: Markdown string with categorized file listings or warning message if empty
- `formatInsightsAsMarkdown`: Converts LLM analysis insights into comprehensive Markdown documentation including behavioral summary, key features, user interactions, technical details, and usage examples
  - Inputs: LLMInsights object containing behavioral summary, features, interactions, technical details, and examples
  - Outputs: Formatted Markdown string with all insight sections organized hierarchically

### src/domain/handlers/navigationHandler.ts

**Role:** Core Logic

**Purpose:** Handles navigation to files, functions, and endpoints within the workspace when users interact with the product navigator and analysis viewer.

**User Actions:**
- Opens source code files in the editor when clicking on file items
- Navigates to specific functions in files and highlights the function definition
- Shows error messages when files cannot be opened
- Displays function details in a quick pick menu with signature, description, and metadata
- Navigates to endpoint handlers when clicking on API endpoints
- Navigates to function usage locations when clicking on references
- Opens analysis items showing code context with syntax highlighting
- Shows warnings when navigation targets cannot be found

**Key Functions:**
- `navigateToProductItem`: Opens files or navigates to functions/endpoints from product navigator items
  - Inputs: ProductNavItem containing file path, function name, and line number
  - Outputs: Promise<void> - opens editor at target location
- `navigateToAnalysisItem`: Opens files and shows code context for analysis viewer items
  - Inputs: AnalysisItem with file path and line number information
  - Outputs: Promise<void> - displays code in editor with selection
- `showItemDetails`: Displays detailed information about functions, endpoints, or entry points in a menu
  - Inputs: ProductNavItem or EntryPoint with metadata like signature, description, parameters
  - Outputs: Promise<void> - shows quick pick panel with formatted details


*... and 30 more files*
