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

