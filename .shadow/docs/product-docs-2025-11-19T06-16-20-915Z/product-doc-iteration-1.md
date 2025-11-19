# Product Documentation

*Generated: 11/18/2025, 10:20:46 PM (2025-11-19 06:20:46 UTC)*

---

## Product Overview

Shadow Watch is a Visual Studio Code extension that provides continuous code architecture monitoring and AI-powered documentation generation. It automatically analyzes code on every save, detecting architecture issues like god objects, circular dependencies, dead code, and complex functions. The extension generates LLM-ready insights specifically formatted for AI assistants like Cursor, ChatGPT, and other language models, allowing developers to quickly get AI help with refactoring and code quality improvements. Shadow Watch supports nine programming languages including Python, JavaScript, TypeScript, Java, Go, Rust, C/C++, Ruby, and PHP.

Developers interact with Shadow Watch through a dedicated sidebar in VS Code that displays a health score, categorized issues (errors, warnings, info), and one-click copy buttons for sharing insights with AI assistants. The extension offers multiple output formats optimized for different AI tools, making it easy to get context-aware suggestions from language models. Users can analyze entire workspaces, individual files, or let the extension monitor continuously in the background. All insights are clickable, allowing developers to navigate directly to problem areas in their code.

Beyond static analysis, Shadow Watch uses AI providers (OpenAI and Anthropic) to generate comprehensive documentation including product overviews, architecture insights, refactoring reports, and unit test scaffolding. The extension maintains intelligent caching to ensure fast performance even on large codebases, with initial analysis taking 2-5 seconds for medium projects and incremental updates completing in under one second. Background processing ensures the extension never blocks code editing, providing a seamless development experience.

## What It Does

- Continuously monitors code and analyzes on every save to detect architecture issues
- Detects god objects, circular dependencies, dead code, large files, and complex functions
- Generates LLM-ready insights formatted specifically for Cursor, ChatGPT, and other AI assistants
- Provides one-click copy buttons to share analysis with AI tools for refactoring help
- Displays real-time health score showing overall codebase quality (0-100%)
- Categorizes issues by severity (Error, Warning, Info) with actionable recommendations
- Creates comprehensive product documentation explaining what applications do for users
- Generates architecture insights describing system structure, components, and relationships
- Produces detailed refactoring reports with prioritized improvement recommendations
- Generates unit test scaffolding and test strategy recommendations
- Supports nine programming languages: Python, JavaScript, TypeScript, Java, Go, Rust, C/C++, Ruby, PHP
- Maintains intelligent caching for fast analysis with 80% time reduction on repeat operations
- Provides clickable navigation from issues directly to code locations
- Offers multiple output formats (Cursor, ChatGPT, Generic, Compact) optimized for different AI tools
- Analyzes entire workspaces, individual files, or runs continuous background monitoring

## User Perspective

### GUI

- Dedicated Shadow Watch sidebar in the activity bar showing all insights and health metrics
- Health score display (0-100%) indicating overall codebase quality
- Color-coded issue categories: red for errors, yellow for warnings, blue for info
- One-click copy buttons to share insights with AI assistants
- Clickable issues that navigate directly to problem locations in code
- Refresh button to manually trigger re-analysis
- Menu view with access to all analysis commands and features
- Analysis Viewer showing workspace analysis results
- Product Navigator displaying generated product documentation
- AI Architecture Insights viewer with detailed architectural analysis
- Unit Tests Navigator showing test recommendations and scaffolding
- Static Analysis Viewer with code quality metrics
- Settings panel for configuring providers, formats, and behavior
- Progress indicators showing analysis status during workspace scans
- Context menu options in file explorer for analyzing specific files
- Status bar indicators showing extension state and analysis progress

## Workflow Integration

- Code quality monitoring during active development with automatic analysis on save
- AI-assisted refactoring by copying insights to Cursor or ChatGPT for specific guidance
- Architecture review workflow using generated insights to identify systemic issues
- Technical debt assessment through automated detection of anti-patterns and code smells
- Team onboarding by generating product documentation that explains application functionality
- Code review preparation using architecture reports to provide context for reviewers
- Refactoring planning with prioritized reports showing effort estimates and implementation steps
- Test coverage improvement using generated unit test scaffolding and strategies
- Legacy code understanding through AI-generated architecture and product documentation
- Continuous improvement workflow with background monitoring alerting to new issues
- Documentation maintenance by regenerating product and architecture docs as code evolves
- Cross-team communication using exported markdown reports to share insights

## Problems Solved

- Eliminates manual architecture review time by automatically detecting common issues
- Reduces time to get AI help by formatting insights specifically for LLM consumption
- Prevents architecture degradation by continuously monitoring code quality on every save
- Accelerates refactoring decisions by providing AI-ready context for language models
- Minimizes onboarding time for new developers through auto-generated product documentation
- Identifies circular dependencies before they cause maintenance headaches
- Detects god objects and large files that indicate poor separation of concerns
- Finds dead code that clutters the codebase and confuses developers
- Highlights complex functions that need simplification for maintainability
- Provides consistent architecture insights across nine programming languages
- Eliminates context-switching by keeping all insights within VS Code
- Maintains fast performance on large codebases through intelligent caching
- Bridges the gap between static analysis and actionable AI-powered recommendations
- Standardizes code quality assessment across development teams

## Architecture Summary

Shadow Watch is built on a modular architecture with clear separation between analysis engines, AI integration, presentation layers, and infrastructure services. The core analysis engine performs static code analysis using AST parsing to examine function-level structure, dependency graphing to track import relationships, and pattern detection to identify anti-patterns and code smells. This analysis runs continuously in the background, triggered by file save events through a file watcher service that monitors workspace changes. The analysis engine supports multiple programming languages through language-specific analyzers that understand the syntax and patterns of each supported language.

The AI integration layer connects to multiple LLM providers (OpenAI and Anthropic) through a provider abstraction with a factory pattern for runtime selection. This layer includes sophisticated prompt building that constructs detailed analysis requests with code context and schema definitions, response parsing that validates and extracts structured data from AI responses, rate limiting to handle API quotas gracefully, and retry logic with exponential backoff for resilience. A state manager maintains conversation context across multiple AI interactions, while a formatter system converts analysis results into different output formats optimized for various AI assistants (Cursor, ChatGPT, Generic, Compact).

The presentation layer consists of multiple specialized views including a tree view sidebar for navigating insights by category and severity, webview panels for displaying rich formatted documentation with syntax highlighting, and diagnostic providers for inline code annotations. A navigation handler enables clickable links that jump from insights to specific code locations. The infrastructure layer provides caching through both in-memory and persistent storage to optimize performance, progress tracking for long-running operations, error handling with graceful degradation, and a configuration manager for user preferences. The extension bootstraps through a command registry that exposes all functionality through the VS Code command palette, making every feature accessible via keyboard shortcuts and context menus.

