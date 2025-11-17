# Product Documentation

*Generated: 11/16/2025, 10:36:17 PM (2025-11-17 06:36:17 UTC)*

---

## Product Overview

Shadow Watch is a Visual Studio Code extension that provides intelligent codebase analysis and documentation generation. It helps developers understand complex codebases by automatically analyzing code structure, generating insights, and creating comprehensive documentation. The extension watches your workspace in real-time, providing contextual information about your code through multiple interactive views and navigation tools. It integrates with Large Language Models to generate human-readable documentation, architectural insights, and product documentation from your codebase.

## What It Does

- Analyzes codebases to identify modules, entry points, key files, and architectural patterns
- Generates AI-powered insights about code architecture, design patterns, and system organization
- Creates product documentation that describes what the application does from a user perspective
- Provides interactive tree views showing codebase structure, insights, and navigation options
- Monitors file changes in real-time and updates analysis automatically
- Generates documentation for individual files explaining their purpose and functionality
- Identifies and navigates to unit tests related to specific code files
- Displays diagnostics and problems found during code analysis
- Caches analysis results to improve performance and reduce redundant processing

## User Perspective

### GUI

- Interactive tree view showing codebase insights organized by categories (architecture, patterns, components)
- Analysis viewer displaying comprehensive codebase statistics, module information, and key files
- Static analysis viewer showing code quality metrics and potential issues
- File documentation viewer with AI-generated explanations of code purpose and functionality
- Right-click context menus on files and folders to trigger analysis or view documentation
- Status bar indicators showing analysis progress and cache status
- Webview panels displaying formatted analysis results with navigation and filtering

## Workflow Integration

- Onboarding new developers to unfamiliar codebases by providing automated documentation and insights
- Code review workflows by highlighting architectural patterns and design decisions
- Refactoring projects by understanding existing architecture before making changes
- Documentation maintenance by automatically generating and updating code documentation
- Understanding legacy codebases with unclear or missing documentation
- Navigating large codebases by providing structured views of modules and components
- Test coverage analysis by identifying which files have associated unit tests

## Problems Solved

- Eliminates manual effort required to understand unfamiliar codebases
- Reduces time spent searching for relevant code files and understanding their purpose
- Provides instant access to architectural insights without reading all the code
- Keeps documentation synchronized with code changes automatically
- Helps identify files that lack proper test coverage
- Makes implicit architectural decisions and patterns explicit and documented
- Provides consistent documentation format across the entire codebase

## Architecture Summary

Shadow Watch is built as a VSCode extension with a layered architecture. At its core, the Analyzer component examines workspace files to identify code structure, modules, entry points, and key files. It works in conjunction with a File Access Helper that reads and processes different file types. The Insight Generator processes analysis results and creates structured insights about architecture, patterns, and design decisions. The LLM Integration layer connects to various Large Language Model services (Claude, OpenAI, Gemini, Ollama) to generate human-readable documentation and insights. A comprehensive caching system stores analysis results to minimize redundant processing and API calls. The Cache Manager handles both file-level and aggregated analysis data with TTL-based expiration. Multiple viewer components provide different perspectives on the codebase: the Analysis Viewer shows overall statistics and structure, the Insights Tree View organizes findings by category, the Static Analysis Viewer displays code quality metrics, and the File Documentation viewer shows detailed explanations. A File Watcher monitors workspace changes and triggers incremental updates to keep all views synchronized. The Product Navigator generates user-facing product documentation by analyzing code from a product perspective rather than technical implementation. A Diagnostics Provider surfaces problems and issues discovered during analysis directly in the VSCode Problems panel.

