# Product Documentation

*Generated: 11/16/2025, 10:38:29 PM (2025-11-17 06:38:29 UTC)*

---

## Product Overview

Shadow Watch is a Visual Studio Code extension that continuously monitors and analyzes your codebase to identify architectural issues, code quality problems, and design patterns. It runs automatically in the background, analyzing your code whenever you save files, and presents findings through an intuitive sidebar interface. The extension specializes in preparing architecture insights in formats optimized for AI assistants like Cursor, ChatGPT, and other Large Language Models, enabling developers to quickly get AI-powered recommendations for fixing architectural problems. Shadow Watch detects common issues like god objects, circular dependencies, dead code, overly complex functions, and large files, categorizing them by severity (Error, Warning, Info) and providing actionable recommendations. The extension supports multiple programming languages including Python, JavaScript, TypeScript, Java, Go, Rust, C/C++, Ruby, and PHP.

Shadow Watch goes beyond basic code analysis by leveraging AI to generate comprehensive documentation. It can automatically create product documentation that describes what your application does from a user perspective, generate detailed architecture insights explaining design patterns and system organization, and even produce file-level documentation explaining the purpose of individual code files. The extension integrates with multiple LLM providers (Claude, OpenAI, Gemini, Ollama) to power these AI features. All analysis results are cached intelligently to ensure fast performance, with incremental updates that analyze only changed files rather than the entire codebase. Developers can copy insights with a single click in formats optimized for their preferred AI assistant, streamlining the workflow of identifying issues, getting AI recommendations, and implementing fixes.

## What It Does

- Analyzes code automatically on every file save to detect architecture issues and code quality problems
- Identifies god objects, circular dependencies, dead code, large files, and complex functions
- Categorizes issues by severity (Error, Warning, Info) with actionable recommendations
- Generates LLM-ready prompts formatted specifically for Cursor, ChatGPT, or generic AI assistants
- Creates AI-powered product documentation describing what your application does for users
- Produces architecture insights explaining design patterns, component relationships, and system organization
- Generates file-level documentation explaining the purpose and functionality of individual code files
- Provides one-click copy to clipboard for sharing insights with AI assistants
- Shows real-time health score (0-100%) indicating overall codebase quality
- Displays clickable issues in the sidebar that navigate directly to problem locations
- Supports workspace-wide analysis or single-file analysis on demand
- Caches analysis results to deliver fast incremental updates (under 1 second for single file changes)
- Integrates with multiple LLM providers including Claude, OpenAI GPT, Google Gemini, and Ollama
- Publishes detected issues to VSCode's Problems panel for standard IDE integration
- Generates unit test suggestions for code files
- Monitors file system changes and automatically updates analysis in real-time

## User Perspective

### GUI

- Sidebar panel labeled 'Shadow Watch' in the VSCode activity bar showing all analysis views
- Menu view displaying analysis options, quick actions, and configuration settings
- Analyze Workspace view showing codebase statistics, modules, entry points, and key files
- Product Navigator view displaying AI-generated product documentation organized by sections
- AI Architecture Insights view showing design patterns, architectural decisions, and system organization
- Unit Tests view listing test files and their relationships to source code
- Health score indicator displaying overall codebase quality percentage (0-100%)
- Issue list organized by severity with error, warning, and info categories
- Clickable issue items that jump to the exact code location when selected
- Copy button on each insight for quick clipboard export to AI assistants
- Refresh button to manually trigger re-analysis of the workspace
- Settings gear icon to configure extension preferences and LLM providers
- Right-click context menu on files offering 'Analyze Current File' and 'Copy File Insights' options
- Status bar indicator showing analysis progress and current operation
- Severity icons (red for errors, yellow for warnings, blue for info) next to each issue
- Collapsible tree structure organizing insights by category and type

## Workflow Integration

- Developer writes code and saves file, triggering automatic analysis that detects issues within seconds
- Developer clicks copy button in sidebar and pastes insights into Cursor or ChatGPT for AI-powered refactoring suggestions
- Developer reviews AI recommendations, applies fixes, saves file, and Shadow Watch re-analyzes to confirm issues are resolved
- Code review process where reviewers check Shadow Watch insights to identify architectural concerns before approving changes
- Onboarding new team members by having them review Product Navigator documentation to understand what the application does
- Refactoring large codebases by identifying god objects and circular dependencies that need to be broken apart
- Technical debt management by tracking architecture warnings over time and prioritizing fixes by severity
- Documentation maintenance by regenerating product and architecture documentation as code evolves
- Understanding legacy code by analyzing it with Shadow Watch and reading AI-generated explanations of architecture and design patterns
- Pre-commit checks where developers review Shadow Watch errors before committing code
- Continuous monitoring during development sprints to catch architecture issues early before they become technical debt

## Problems Solved

- Eliminates manual architecture reviews that are time-consuming and inconsistent
- Catches god objects and overly large files before they become unmaintainable
- Identifies circular dependencies that cause build issues and tight coupling
- Detects dead code that bloats the codebase and confuses developers
- Finds overly complex functions that are difficult to test and maintain
- Provides instant architecture context for AI assistants, improving quality of AI recommendations
- Reduces time spent formatting issues for AI assistants from manual copy-paste to one-click
- Keeps developers aware of architecture degradation in real-time rather than discovering issues during code review
- Generates missing or outdated documentation automatically, keeping docs synchronized with code
- Helps developers understand unfamiliar codebases through AI-generated explanations
- Prevents architecture drift by continuously monitoring for anti-patterns and code smells
- Reduces cognitive load of tracking technical debt by automatically categorizing and prioritizing issues
- Makes architecture knowledge accessible to junior developers through clear severity levels and recommendations

## Architecture Summary

Shadow Watch is built as a VSCode extension with a monitoring-and-analysis architecture. The core CodeAnalyzer component performs static analysis by parsing source code files to identify modules, entry points, dependencies, and code structure without executing the code. It uses Abstract Syntax Tree (AST) parsing for deep function-level analysis and dependency graphing to track import relationships. The InsightGenerator processes raw analysis data to detect architectural anti-patterns like god objects, circular dependencies, dead code, and complexity issues, categorizing findings by severity and providing actionable recommendations. An intelligent AnalysisCache stores results with time-based expiration, enabling incremental updates that analyze only changed files rather than the entire workspace, achieving sub-second update times for single file modifications.

The FileWatcher monitors the workspace file system and triggers incremental analysis whenever files are saved or modified. Multiple tree view providers present different perspectives on the analysis: the InsightsTreeView shows categorized issues with severity indicators, the AnalysisViewerProvider displays workspace statistics and structure, the ProductNavigatorProvider shows AI-generated product documentation, the InsightsViewerProvider presents architecture insights, and the UnitTestsNavigatorProvider links source files to their tests. The LLMFormatter transforms insights into formats optimized for different AI assistants (Cursor, ChatGPT, generic markdown). The LLM Integration layer orchestrates interactions with multiple AI providers (Claude, OpenAI, Gemini, Ollama) using a unified service interface, managing prompt construction, API calls, and response parsing. A DiagnosticsProvider publishes detected issues to VSCode's standard Problems panel. Status indicators and commands provide user interaction points, with automatic activation when VSCode starts and continuous background processing that never blocks editing.

## Module Documentation

### src (other)

Module analysis failed

### . (other)

Module analysis failed

### images (other)

Module analysis failed

### scripts (other)

Module analysis failed

## File-Level Documentation

*Detailed documentation for 38 files*

### src/analysisViewer.ts

**Role:** GUI View

**Purpose:** Analysis failed

### src/analyzer.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/cache.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/diagnosticsProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/extension.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/fileAccessHelper.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/fileDocumentation.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/fileWatcher.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/insightGenerator.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/insightsTreeView.ts

**Role:** GUI View

**Purpose:** Analysis failed

### src/insightsViewer.ts

**Role:** GUI View

**Purpose:** Analysis failed

### src/llmFormatter.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/llmIntegration.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/llmSchemas.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/llmService.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/logger.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/productNavigator.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### src/staticAnalysisViewer.ts

**Role:** GUI View

**Purpose:** Analysis failed

### src/unitTestsNavigator.ts

**Role:** Core Logic

**Purpose:** Analysis failed

### webpack.config.js

**Role:** Core Logic

**Purpose:** Analysis failed


*... and 18 more files*
