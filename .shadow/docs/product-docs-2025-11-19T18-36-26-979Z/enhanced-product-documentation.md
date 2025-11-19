# Product Documentation

*Generated: 11/19/2025, 10:38:20 AM (2025-11-19 18:38:20 UTC)*

---

## Product Overview

Shadow Watch is a Visual Studio Code extension that analyzes codebases using AI to generate comprehensive documentation and insights. It connects to AI language models (OpenAI or Anthropic) to examine your code and produce detailed reports about what your application does, how it's structured, and how to work with it. The extension runs analysis on your workspace, creating product documentation, architecture insights, and code-level explanations that help developers understand and navigate complex codebases.

Users interact with Shadow Watch through Visual Studio Code's command palette and sidebar panels. After configuring an API key for their preferred AI provider, developers can trigger analysis on their entire workspace or specific modules. The extension displays results in multiple interactive views: a tree-based navigation panel showing analyzed modules and files, detailed report viewers with syntax-highlighted documentation, and diagnostic panels highlighting areas needing attention. All analysis results are cached locally for quick retrieval and can be refreshed as code changes.

Shadow Watch solves the documentation problem that plagues most development teams. Instead of manually writing and maintaining documentation that quickly becomes outdated, developers can generate accurate, comprehensive documentation directly from their codebase. The AI analyzes code structure, dependencies, and patterns to create user-facing product documentation, technical architecture guides, and module-level explanations. This accelerates onboarding for new team members, helps developers understand unfamiliar codebases, and provides a foundation for making informed refactoring decisions.

## What It Does

- Analyzes entire codebases or specific modules using AI language models to understand code structure and purpose
- Generates product documentation describing what applications do from a user perspective
- Creates architecture insights explaining how systems are designed and organized
- Produces module-level documentation breaking down components and their relationships
- Identifies code quality issues and suggests improvements through diagnostic analysis
- Caches analysis results locally for instant retrieval without re-running expensive AI calls
- Watches for file changes and incrementally updates analysis when code is modified
- Provides interactive tree navigation to browse analyzed modules, files, and insights
- Displays detailed documentation reports with syntax highlighting and formatted output
- Supports switching between OpenAI and Anthropic AI providers based on preference
- Tracks analysis progress with detailed status indicators showing what's being processed
- Exports analysis results in multiple formats for sharing and external use
- Offers command palette integration for triggering analysis and viewing results
- Maintains analysis history with versioning and change tracking

## User Perspective

### GUI

- Command palette commands for analyzing workspace, viewing insights, and managing cache
- Sidebar tree view displaying analyzed modules, files, and generated insights in expandable hierarchy
- Interactive report viewers showing product documentation, architecture guides, and module details
- Diagnostic panel highlighting code quality issues and improvement suggestions
- Status bar indicators showing analysis progress and provider configuration
- Context menus on files and folders for triggering targeted analysis
- Settings panel for configuring AI provider, API keys, and analysis preferences
- Webview panels displaying rich formatted documentation with syntax highlighting
- Navigation between related code files and documentation sections via clickable links

## Workflow Integration

- Onboarding new developers by providing instant codebase documentation and architecture overview
- Understanding legacy code by generating explanations of what existing systems do and how they work
- Planning refactoring efforts with comprehensive analysis of current architecture and dependencies
- Code review support by highlighting areas needing attention and suggesting improvements
- Documentation maintenance by regenerating docs when code changes to keep them current
- Knowledge transfer when team members transition by capturing system understanding in documentation
- Technical debt assessment by analyzing code quality and identifying improvement opportunities
- System design documentation by automatically documenting architectural patterns and decisions

## Problems Solved

- Eliminates manual documentation writing that becomes outdated quickly
- Reduces time spent understanding unfamiliar codebases from weeks to hours
- Provides consistent documentation quality across all modules and components
- Captures tribal knowledge that exists only in developers' heads
- Accelerates developer onboarding with comprehensive system overviews
- Identifies technical debt and code quality issues automatically
- Maintains up-to-date documentation as code evolves
- Helps teams make informed refactoring decisions based on current architecture
- Bridges communication gap between technical and non-technical stakeholders
- Preserves system knowledge when team members leave

## Architecture Summary

Shadow Watch is built as a Visual Studio Code extension with a modular architecture separating concerns into distinct layers. The core analysis engine coordinates file processing, AI interactions, and result persistence. AI provider abstraction allows switching between OpenAI and Anthropic through a common interface with provider-specific implementations. State management tracks analysis progress, caches results, and handles incremental updates when files change. The UI layer provides multiple views including tree navigation, report viewers, and diagnostic panels.

The analysis pipeline processes codebases in stages: file discovery scans the workspace to identify relevant code files, static analysis extracts structure and dependencies, AI analysis generates human-readable documentation, and result formatting produces the final output. Rate limiting and retry logic handle API constraints gracefully. Caching stores analysis results locally to avoid redundant API calls. File watching detects changes and triggers incremental re-analysis of affected modules.

Data flows from the workspace filesystem through the analyzer to AI providers, with responses parsed and stored locally. The UI components subscribe to state changes to update their displays reactively. Configuration management centralizes settings for AI providers, analysis scope, and output preferences. Error handling provides user-friendly messages when API calls fail or analysis encounters issues. The extension bootstraps all services during activation and cleanly tears down resources on deactivation.

## Module Documentation

### . (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRQRhU3LYk4RGzZLwy"}

### src/ai (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRRDpNw6aNwKwxjaCv"}

### src/ai/providers (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRRwUmUdtYXZ8QGJB2"}

### src/analysis (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRSkbGGEos7zENvD9M"}

### src (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRTVVRpyC7AYDHjhwv"}

### src/config (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRUcTkD6AQnF3U7vju"}

### src/context (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRVTorb9nTSuYhnANS"}

### src/domain/bootstrap (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRWCxF5sGQgSMh5GrX"}

### src/domain/formatters (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRWxMcjeeMA57cCcNX"}

### src/domain/handlers (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRXh1PsSebDjBfaYdC"}

### src/domain/prompts (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRYYMHCo8ef89CqM7s"}

### src/domain/services (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRZHzc1CtvHeUDn9fw"}

### src/infrastructure/fileSystem (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRaTStfVYPymgprEk2"}

### src/infrastructure/persistence (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRbJYWAzmhwSs8AKS4"}

### src/infrastructure (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRcVEGWoihYyScikMB"}

### src/state (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRdNKCdkYoHuzqdrdH"}

### src/storage (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRe3zbsqoX7X1yhFhU"}

### src/test/__mocks__ (tests)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjReq7roSKmb37tVveN"}

### src/ui (gui)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRfix7Yrpdp3h1jBdw"}

### src/ui/webview (gui)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjRgjDnQjrquYh26Nvi"}

## File-Level Documentation

*Detailed documentation for 50 files*

### jest.config.js

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQfdxwjMCYxm54ok9o"}

### src/ai/llmRateLimiter.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQgXYQKd3AX7hPrbni"}

### src/ai/llmResponseParser.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQhFSwngDBr9WGuGco"}

### src/ai/llmRetryHandler.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQiKSQyjQV1kPUwFUb"}

### src/ai/providers/ILLMProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQjgYodgHLVggZvty5"}

### src/ai/providers/anthropicProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQkURbPH73VEp92muD"}

### src/ai/providers/openAIProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQmC5rCfk2VVqfKbH7"}

### src/ai/providers/providerFactory.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQmyD7E6ATdvNjcMwu"}

### src/analysis/enhancedAnalyzer.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQnyjdQtLUSph8bKJB"}

### src/analysis/functionAnalyzer.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQogu4DRwXgeqnZmGA"}

### src/analysisViewer.ts

**Role:** GUI View

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQpQK2jhytesPtbrWm"}

### src/analyzer.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQqCw55mank8cobmpq"}

### src/cache.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQr5GSML1ar5kF48XT"}

### src/config/configurationManager.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQs7XgFuZWHMW1K9xo"}

### src/context/analysisContextBuilder.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQspCQ6Y22oVyr3WuD"}

### src/diagnosticsProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQtaLGmndWiPygxWjd"}

### src/domain/bootstrap/commandRegistry.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQuHFDdff7j3cT2jZ9"}

### src/domain/bootstrap/extensionBootstrapper.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQv5NSmxc5Joft3z5t"}

### src/domain/formatters/documentationFormatter.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQvskL2xLRTesVmzju"}

### src/domain/handlers/navigationHandler.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHjQwjatVnCtC3axNp4B"}


*... and 30 more files*
