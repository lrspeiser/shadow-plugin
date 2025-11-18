# Product Documentation

*Generated: 11/17/2025, 2:56:10 PM (2025-11-17 22:56:10 UTC)*

---

## Product Overview

Shadow Watch is a Visual Studio Code extension that continuously monitors codebases to detect architectural problems, generate AI-powered insights, and create comprehensive product documentation. It automatically analyzes code on every save, identifying issues like god objects (files over 1000 lines), circular dependencies, dead code, overly complex functions (over 100 lines), and poor file organization. The extension calculates a health score (0-100%) based on detected issues and presents findings through an interactive sidebar organized by severity: errors for critical problems like very large files, warnings for important issues like circular dependencies, and info-level suggestions for improvements. Shadow Watch integrates seamlessly with AI assistants like Cursor and ChatGPT by formatting insights into optimized prompts that developers can copy with one click, providing AI tools with complete context about architectural problems. The extension also generates product documentation and architecture insights by sending structured code analysis to language models, automatically creating user-facing documentation that describes what applications do rather than how they're built.

## What It Does

- Continuously monitors code and triggers automatic analysis on every file save
- Detects very large files (over 1000 lines) indicating potential god objects
- Identifies files with too many functions (over 20) suggesting multiple responsibilities
- Finds overly complex functions (over 100 lines) that need refactoring
- Detects orphaned files that aren't imported or used anywhere in the codebase
- Identifies missing or unclear entry points in applications
- Checks for potential circular dependency patterns between modules
- Calculates overall codebase health score as a percentage from 0-100%
- Organizes all findings by severity: errors (critical), warnings (important), info (suggestions)
- Formats insights specifically for Cursor AI with optimized prompt structure
- Formats insights for ChatGPT with verbose explanations and context
- Provides one-click copying of formatted insights to clipboard
- Generates comprehensive product documentation by analyzing code with AI
- Creates architecture insights describing system design patterns and component relationships
- Shows click-to-navigate functionality to jump directly to problem locations
- Displays analysis results in specialized tree views: Menu, Analyze Workspace, Product Navigator, AI Insights, Unit Tests
- Checks file organization patterns and suggests improvements
- Surfaces findings in VSCode's native problems panel alongside compiler errors
- Caches analysis results with timestamps and file hashes to avoid redundant processing
- Supports 9+ programming languages: Python, JavaScript, TypeScript, Java, Go, Rust, C/C++, Ruby, PHP

## User Perspective

### GUI

- Shadow Watch icon in VSCode activity bar that opens the extension sidebar
- Menu view showing available commands, current health score percentage, and quick actions
- Analyze Workspace view displaying all detected issues organized by category with collapsible sections
- Product Navigator view for browsing AI-generated product documentation hierarchically
- AI Architecture Insights view showing AI-generated observations about system architecture
- Unit Tests Navigator view displaying test organization and coverage
- Severity indicators with visual symbols: 🔴 for errors, ⚠️ for warnings, 💡 for info
- Copy button on each insight for one-click copying to clipboard in LLM-ready format
- Refresh button to manually trigger re-analysis of entire workspace
- Settings button to configure analysis behavior and AI provider options
- Click-to-navigate functionality that opens files at exact line numbers where issues exist
- Progress notifications showing analysis status during workspace scans
- Health score displayed prominently as percentage (e.g., '72% Health')
- Tree structure with expandable/collapsible categories organizing insights by type
- Status bar indicator showing analysis progress and completion
- Context menu options on right-click for copying specific insights

## Workflow Integration

- Developer writes code and saves file, Shadow Watch automatically analyzes it within seconds
- Developer sees health score drop when introducing architectural problems
- Developer expands error category in sidebar to see critical issues like god objects
- Developer clicks on specific issue to navigate directly to the problematic code location
- Developer clicks copy button to get formatted insights for AI assistant
- Developer pastes copied insights into Cursor with context like 'Help me refactor this god object'
- Cursor provides specific refactoring steps because it has complete context from Shadow Watch
- Developer applies refactoring, saves file, and sees health score improve automatically
- Developer runs 'Generate Product Documentation' to create stakeholder-ready documentation
- AI analyzes codebase and generates user-facing documentation describing application functionality
- Developer reviews generated documentation in Product Navigator view
- Developer runs 'Generate AI Architecture Insights' to understand unfamiliar codebase
- AI produces architectural observations about design patterns and component relationships
- Developer uses insights to understand system before making changes
- Developer shares health score trends with team during code reviews
- Developer clears cache when needing fresh analysis after major refactoring
- Developer switches LLM format from Cursor to ChatGPT when using different AI tool
- Developer reviews unit test coverage in Unit Tests Navigator before adding features

## Problems Solved

- Eliminates hours of manual code review by automatically detecting architectural problems
- Prevents technical debt accumulation by flagging issues early before they grow
- Provides quantified health metrics so teams can track code quality objectively
- Saves time copying code context for AI assistants by formatting it automatically
- Makes unfamiliar codebases comprehensible through AI-generated architecture insights
- Identifies god objects before they become unmaintainable monoliths
- Catches circular dependencies that cause import errors and coupling problems
- Finds dead code that increases maintenance burden unnecessarily
- Surfaces overly complex functions before they become debugging nightmares
- Generates product documentation automatically, eliminating tedious manual writing
- Keeps developers focused by surfacing only the most important issues first through severity levels
- Accelerates onboarding by providing comprehensive architectural understanding instantly
- Enables consistent code quality across teams with objective measurements
- Integrates architectural feedback directly into development workflow without context switching
- Provides AI assistants with perfect context, eliminating incomplete or incorrect prompts

## Architecture Summary

Shadow Watch operates as a continuously-running VSCode extension with a multi-stage analysis pipeline. The core analyzer performs static code analysis by parsing source files to extract structural information including line counts, function counts, import relationships, and code organization patterns. Analysis runs automatically whenever files are saved, with a file watcher detecting changes and triggering incremental analysis only on modified files. Results flow through an insight generator that applies rule-based pattern detection to identify architectural anti-patterns: files exceeding 1000 lines become errors, functions over 100 lines become warnings, and organizational suggestions become info-level findings. A health score calculator weighs all detected issues by severity to produce an overall codebase health percentage.

The caching layer stores analysis results with file hashes and timestamps, enabling the system to skip re-analysis of unchanged files and reduce processing time by approximately 80%. When users request AI-powered features, the LLM integration layer packages code analysis data into structured contexts conforming to specific JSON schemas, sends requests to language model services (OpenAI GPT models), and processes streaming responses back into formatted documentation or insights. The system saves all AI-generated outputs to a .shadow/docs directory with timestamped run folders, automatically loading the most recent results on extension activation to restore state.

The user interface consists of multiple specialized tree view providers, each implementing VSCode's TreeDataProvider interface to populate different sidebar panels. The insights tree view shows the main menu and static analysis results, while dedicated providers handle product documentation navigation, AI architecture insights browsing, and unit test exploration. An LLM formatter transforms insights into different output styles (Cursor-optimized, ChatGPT-verbose, Generic-markdown, Compact-bullets) based on user configuration. A diagnostics provider surfaces findings in VSCode's native problems panel, integrating Shadow Watch warnings alongside compiler errors for unified issue tracking.

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
