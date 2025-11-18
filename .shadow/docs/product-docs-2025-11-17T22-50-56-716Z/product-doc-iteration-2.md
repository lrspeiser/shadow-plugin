# Product Documentation

*Generated: 11/17/2025, 2:53:58 PM (2025-11-17 22:53:58 UTC)*

---

## Product Overview

Shadow Watch is a Visual Studio Code extension that continuously monitors and analyzes codebases to help developers understand architecture, identify code quality issues, and generate AI-ready documentation. It automatically analyzes code on every save, detecting architectural problems like god objects, circular dependencies, dead code, and overly complex functions. The extension presents findings through an interactive sidebar with severity-based prioritization, allowing developers to click directly to problem locations. Shadow Watch also generates comprehensive product documentation and architecture insights by sending code analysis to AI language models, making it easy to get context-aware help from Cursor, ChatGPT, and other AI assistants with one-click copying of formatted insights.

## What It Does

- Continuously monitors code and analyzes architecture on every file save
- Detects architectural problems including god objects, circular dependencies, and dead code
- Calculates overall codebase health scores from 0-100%
- Generates AI-ready prompts formatted for Cursor, ChatGPT, and other language models
- Creates comprehensive product documentation automatically from codebase analysis
- Produces AI-powered architecture insights describing system design and patterns
- Provides one-click copying of insights formatted specifically for different AI assistants
- Shows severity-based issues (Errors, Warnings, Info) with click-to-navigate functionality
- Generates unit test documentation and coverage insights
- Supports 9+ programming languages including Python, JavaScript, TypeScript, Java, Go, Rust, C/C++, Ruby, and PHP
- Displays real-time analysis results in an organized sidebar with multiple specialized views
- Caches analysis results to improve performance and reduce redundant processing
- Offers multiple output formats optimized for different AI tools and use cases

## User Perspective

### GUI

- Shadow Watch activity bar icon that opens the extension sidebar
- Menu view showing main commands and overall codebase health score
- Analyze Workspace view displaying full codebase analysis results with expandable categories
- Product Navigator view for browsing generated product documentation
- AI Architecture Insights view showing AI-generated observations about system design
- Unit Tests view displaying test organization and coverage information
- Click-to-navigate functionality that jumps directly to code locations with issues
- Copy buttons throughout the interface for getting LLM-ready formatted insights
- Refresh button to re-run analysis on demand
- Settings button to configure analysis behavior and AI integration
- Severity indicators (🔴 Errors, ⚠️ Warnings, 💡 Info) showing issue priority
- Collapsible tree structure organizing insights by category and type
- Status messages showing analysis progress and completion
- Health score percentage displayed prominently in the sidebar

## Workflow Integration

- Developer writes code and saves file, triggering automatic analysis
- Developer reviews architecture issues in sidebar organized by severity
- Developer clicks copy button to get formatted insights for AI assistant
- Developer pastes insights into Cursor, ChatGPT, or other AI tool to get refactoring help
- Developer clicks on specific issues to navigate directly to problem code locations
- Developer generates product documentation to share with stakeholders or team members
- Developer uses AI architecture insights to understand system design before making changes
- Developer checks unit test coverage and organization through dedicated view
- Developer clears cache when needing fresh analysis of entire codebase
- Developer switches between different LLM output formats depending on which AI tool they're using
- Developer monitors health score over time to track code quality improvements
- Developer generates AI insights for complex codebases to accelerate onboarding

## Problems Solved

- Eliminates manual effort in identifying architectural problems across large codebases
- Reduces time spent understanding unfamiliar code architecture
- Provides instant, context-aware information formatted perfectly for AI assistants
- Helps prevent technical debt by detecting issues like god objects and circular dependencies early
- Makes code reviews more efficient by automatically flagging quality concerns
- Accelerates onboarding by generating comprehensive documentation automatically
- Enables developers to get AI help with proper context instead of copying code snippets manually
- Tracks code health over time with quantified health scores
- Identifies dead code that can be safely removed to reduce maintenance burden
- Surfaces overly complex functions that need refactoring before they become problems
- Maintains documentation automatically as code evolves, keeping it synchronized
- Provides severity-based prioritization so developers know what to fix first

## Architecture Summary

Shadow Watch is built as a VSCode extension that integrates deeply with the editor's workspace, file system, and UI components. The core analysis engine performs static code analysis using AST parsing to understand code structure without executing it, building dependency graphs to track import relationships, and applying pattern detection algorithms to identify common anti-patterns and code smells. A caching layer stores analysis results to enable fast incremental updates when individual files change, reducing repeat analysis time significantly while maintaining accuracy.

The extension operates in continuous monitoring mode, with a file watcher component that triggers analysis whenever files are saved. Analysis results flow through an insight generator that categorizes findings by severity and concern area, a diagnostics provider that surfaces issues in VSCode's native problem panel, and an LLM formatter that transforms insights into optimized prompts for different AI assistants. The UI consists of multiple specialized tree view providers that organize and display different aspects of the analysis: a main menu view, workspace analysis view, product documentation navigator, AI insights viewer, and unit tests navigator.

For AI-powered features, the extension integrates with language model services through a dedicated LLM integration layer. When users request product documentation or architecture insights, the system sends structured analysis data to AI services using carefully crafted schemas and prompts, then processes responses back into navigable, formatted documentation. The architecture supports both automatic background processing that never blocks editing and on-demand analysis commands for full workspace scans or individual file deep-dives.

