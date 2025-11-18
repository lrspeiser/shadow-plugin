# Product Documentation

*Generated: 11/17/2025, 3:54:59 PM (2025-11-17 23:54:59 UTC)*

---

## Product Overview

Shadow Watch is a Visual Studio Code extension that continuously monitors codebases and provides AI-powered architecture analysis and documentation generation. It automatically analyzes code on every save, detecting architecture issues like god objects, circular dependencies, dead code, and complex functions. Users access insights through a dedicated sidebar that displays health scores, errors, warnings, and suggestions organized by severity. The extension generates LLM-ready prompts formatted specifically for AI assistants like Cursor and ChatGPT, allowing developers to quickly copy architecture issues and paste them into AI tools for automated refactoring guidance.

Beyond traditional static analysis, Shadow Watch connects to AI language models (OpenAI GPT-4, Anthropic Claude, or custom providers) to generate comprehensive product documentation, architectural insights, and unit test documentation. Users can trigger AI-powered analysis to understand what their codebase does from a user perspective, identify design patterns, and document system architecture. The extension supports multiple programming languages including Python, JavaScript, TypeScript, Java, Go, Rust, C/C++, Ruby, and PHP. It provides multiple viewing modes including tree navigation, interactive webviews, and inline diagnostics, making it easy to explore analysis results and jump directly to problematic code. All analysis results are cached for performance, and the extension works incrementally to avoid blocking development workflow.

## What It Does

- Continuously monitors code files and analyzes architecture on every save
- Detects architecture issues including god objects, circular dependencies, dead code, large files, and complex functions
- Displays codebase health score (0-100%) with severity-based issue categorization
- Generates LLM-ready prompts formatted for Cursor, ChatGPT, and other AI assistants
- Provides one-click copy functionality to send architecture issues to AI tools
- Creates comprehensive product documentation explaining what applications do for users
- Generates AI-powered architectural insights describing system design patterns and component relationships
- Produces unit test documentation helping developers understand test coverage and purposes
- Navigates directly to code locations when clicking on issues or insights
- Switches between multiple AI providers (OpenAI, Anthropic Claude, custom endpoints)
- Clears analysis cache and refreshes insights on demand
- Analyzes individual files or entire workspaces based on user selection
- Displays insights in sidebar tree view with expandable categories
- Shows detailed analysis in interactive webview panels
- Exports documentation in multiple formats optimized for different AI assistants

## User Perspective

### GUI

- Dedicated Shadow Watch sidebar in VS Code activity bar with eye icon
- Tree view showing Menu, Analyze Workspace, Product Navigator, AI Architecture Insights, and Unit Tests sections
- Health score display showing overall codebase quality percentage
- Issue list organized by severity: Errors (red), Warnings (yellow), Info (blue)
- Click-to-navigate functionality jumping directly to problematic code locations
- Interactive webview panels displaying formatted documentation with syntax highlighting
- Copy buttons for quickly sending insights to clipboard in LLM-ready format
- Refresh button to re-run analysis on demand
- Settings gear icon for accessing configuration options
- Status indicators showing analysis progress and current provider
- Context menu options in editor for analyzing current file
- Inline diagnostics showing architecture issues directly in code editor

### API

- Integrates with OpenAI API for GPT-4 powered analysis and documentation generation
- Connects to Anthropic Claude API for alternative AI-powered insights
- Supports custom AI provider endpoints for self-hosted or specialized models
- Accepts configuration for API keys through VS Code settings or command palette
- Returns structured analysis results in JSON format for programmatic access

### CI/CD

- Provides commands that can be triggered programmatically for automated documentation generation
- Supports workspace analysis that can be integrated into pre-commit hooks
- Generates consistent documentation across team through shared configuration
- Enables automated architecture quality checks in development workflows

## Workflow Integration

- Code review workflow: Analyze code before reviews, copy issues to AI for refactoring suggestions, apply fixes, verify resolution
- AI-assisted refactoring: Identify architecture issues, copy formatted prompts to Cursor/ChatGPT, receive specific refactoring steps, implement changes
- Continuous code quality monitoring: Automatic analysis on every save, immediate feedback on introduced issues, prevent technical debt accumulation
- Onboarding workflow: Generate product documentation for new developers, explore architecture insights to understand system design, navigate through codebase with AI-generated summaries
- Documentation maintenance: Automatically generate up-to-date product and architecture documentation, export for sharing with team, keep docs synchronized with code changes
- Technical debt tracking: Identify god objects, circular dependencies, and dead code, prioritize fixes by severity, track improvement over time through health scores
- LLM collaboration workflow: Copy architecture issues in optimized format, paste into AI assistant with specific questions, apply suggested solutions, re-analyze to confirm resolution

## Problems Solved

- Eliminates manual code review effort by automatically detecting common architecture anti-patterns
- Reduces time spent formatting code issues for AI assistants through one-click LLM-ready prompts
- Prevents technical debt accumulation by providing real-time feedback on every code save
- Helps developers understand unfamiliar codebases through AI-generated product documentation and architecture insights
- Maintains documentation currency by automatically regenerating docs as code changes
- Provides actionable guidance by categorizing issues by severity and including specific suggestions
- Enables effective AI collaboration by formatting issues specifically for Cursor, ChatGPT, and other tools
- Improves code navigation efficiency by allowing direct jumps from issues to code locations
- Reduces analysis time through intelligent caching that remembers previous results
- Supports multiple programming languages eliminating need for language-specific analysis tools
- Bridges knowledge gaps between code implementation and user-facing product behavior
- Helps teams identify circular dependencies before they cause maintenance problems
- Detects oversized files and complex functions before they become unmaintainable

## Architecture Summary

Shadow Watch is built as a Visual Studio Code extension with a multi-layered architecture centered around continuous monitoring and AI-powered analysis. The core monitoring system uses VS Code's file system watcher to detect code changes on save, triggering incremental analysis through a static analysis engine that parses code into abstract syntax trees. The analyzer examines code structure, dependencies, function complexity, and file sizes to detect architecture issues like god objects, circular dependencies, and dead code. Analysis results are categorized by severity (error, warning, info) and cached to optimize performance for subsequent runs.

The extension integrates with external AI language model services through a flexible provider abstraction supporting OpenAI, Anthropic Claude, and custom endpoints. When users request AI-powered analysis, the system collects codebase statistics and file contents, formats them according to specific prompts for product documentation, architecture insights, or unit test analysis, and sends requests to the configured AI provider. Responses are validated against JSON schemas, parsed, and transformed into structured data for display. The presentation layer includes multiple view components: a sidebar tree view for hierarchical navigation, webview panels for rich formatted display, and a diagnostics provider for inline code annotations. The LLM formatter generates prompts optimized for different AI assistants (Cursor, ChatGPT, generic), allowing users to copy insights in the format that works best with their chosen AI tool. All components communicate through a central extension controller that manages state, coordinates workflows, handles user commands, and maintains the analysis cache.

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
