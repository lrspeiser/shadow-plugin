# Product Documentation

*Generated: 11/19/2025, 9:55:10 AM (2025-11-19 17:55:10 UTC)*

---

## Product Overview

Shadow Watch is a Visual Studio Code extension that provides intelligent code analysis and documentation assistance for software development projects. The extension analyzes your codebase using AI-powered language models to generate comprehensive documentation, architectural insights, and code understanding. It helps developers quickly understand complex codebases, navigate unfamiliar code, and maintain up-to-date documentation without manual effort. Shadow Watch integrates directly into your VS Code workflow, providing analysis results through interactive webviews, tree views, and navigation panels that make it easy to explore and understand your project's structure, functionality, and relationships.

## What It Does

- Automatically analyzes codebases to generate comprehensive documentation including overviews, features, and architecture descriptions
- Provides AI-powered code insights and explanations for functions, classes, and modules
- Generates product documentation that describes what applications do from a user perspective
- Creates architectural insights showing how components interact and depend on each other
- Offers interactive navigation through analysis results with drill-down capabilities
- Monitors code changes and incrementally updates analysis results as you work
- Generates refactoring suggestions and improvement recommendations
- Provides test configuration analysis and suggestions
- Displays real-time progress tracking during analysis operations
- Supports multiple AI providers including OpenAI and Anthropic for flexible model selection

## User Perspective

### GUI

- Access analysis commands through VS Code's command palette and context menus
- View comprehensive analysis results in interactive webview panels with formatted documentation
- Navigate through code insights using tree view panels that organize findings by type and category
- Click on analysis items to jump directly to relevant code locations in the editor
- See real-time progress indicators showing analysis status and completion percentage
- Browse generated documentation with syntax highlighting and collapsible sections
- Explore architectural diagrams and component relationships through visual representations
- Review refactoring suggestions with before/after comparisons
- Access static analysis results showing code quality metrics and patterns
- View unit test navigation panels showing test coverage and relationships

## Workflow Integration

- Code exploration workflow: analyze unfamiliar codebases to quickly understand structure and functionality
- Documentation workflow: generate and maintain product documentation automatically as code changes
- Code review workflow: get AI-powered insights on code quality and potential improvements
- Refactoring workflow: receive suggestions for code improvements with detailed explanations
- Onboarding workflow: help new team members understand complex codebases through generated documentation
- Maintenance workflow: keep documentation synchronized with code changes through incremental analysis
- Architecture review workflow: visualize and understand system architecture and component dependencies

## Problems Solved

- Eliminates the time-consuming manual process of writing and maintaining code documentation
- Reduces the learning curve when working with unfamiliar or legacy codebases
- Prevents documentation from becoming outdated by automatically updating it as code changes
- Makes it easier to understand complex code relationships and dependencies without extensive exploration
- Helps identify refactoring opportunities and code quality issues automatically
- Simplifies navigation through large codebases by providing organized, searchable insights
- Reduces onboarding time for new developers by providing comprehensive project understanding
- Eliminates context switching by keeping all analysis and documentation within the VS Code environment

## Architecture Summary

Shadow Watch is built as a VS Code extension with a modular architecture centered around AI-powered code analysis. The core analysis engine processes source code files and generates structured insights using configurable language models. The extension maintains state through persistent storage that tracks analysis results, progress, and incremental changes. A caching layer optimizes performance by avoiding redundant analysis of unchanged code. The architecture separates concerns into distinct layers: domain logic for business operations, infrastructure for external integrations, and presentation for user interface components. The system uses an event-driven approach with file watchers that trigger incremental analysis when code changes are detected. Analysis results flow through formatters that transform raw data into user-friendly documentation formats. The extension supports multiple AI providers through an abstraction layer that handles provider-specific communication, rate limiting, and retry logic. State management ensures consistency across multiple analysis operations and provides recovery from interruptions. The user interface layer consists of webview providers that render rich HTML content, tree view providers that organize hierarchical data, and navigation handlers that coordinate movement between different views and code locations.

## Module Documentation

### . (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgA5JEoKG85Fi8RTffz"}

### src/ai (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgA5yv4474VJGGwUeZr"}

### src/ai/providers (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgA6kJUYVa54bGJEDNQ"}

### src/analysis (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgA7WCCejvM5sohgXBL"}

### src (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgA8GakXt1WR5remgRB"}

### src/config (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgA9Q3deVQJukmnmNyd"}

### src/context (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgAAaVCwW5S7eB7mMKD"}

### src/domain/bootstrap (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgABGAEpjK7UDyxh14L"}

### src/domain/formatters (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgAC5XTT8Q4R32Z26Pq"}

### src/domain/handlers (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgACu8juqUVat8PjCTU"}

### src/domain/prompts (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgADpCijA2iA9tYmqC8"}

### src/domain/services (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgAEnVjXFZQdg2oL2nu"}

### src/infrastructure/fileSystem (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgAFg5HCvE27Mrypoi1"}

### src/infrastructure/persistence (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgAGh69tb3XkQ8k9T4r"}

### src/infrastructure (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgAHjbhNcSEPXLcMN8m"}

### src/state (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgAJUzHsjdee4RrVFv9"}

### src/storage (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgAKBQxWH6DSUbEVjF4"}

### src/test/__mocks__ (tests)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgAKr6X4dy5Pmuq2W3K"}

### src/ui (gui)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgALfhsVfPFfHxgXYfc"}

### src/ui/webview (gui)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHgAMfjHZajUV7FPgd6a"}

## File-Level Documentation

*Detailed documentation for 50 files*

### jest.config.js

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9BvZs5KAmZkrGhySR"}

### src/ai/llmRateLimiter.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9ChxAJzdnuHdyf3BX"}

### src/ai/llmResponseParser.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9DVL5tuJwJLWRcfNu"}

### src/ai/llmRetryHandler.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9EbZ4XNsTL89ufxSE"}

### src/ai/providers/ILLMProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9GcMAHsksnTfPDLYZ"}

### src/ai/providers/anthropicProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9HQE1rnMMhHTgd7to"}

### src/ai/providers/openAIProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9JFpfeAdyhmqfgmkV"}

### src/ai/providers/providerFactory.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9K6g23EBixDdKYefZ"}

### src/analysis/enhancedAnalyzer.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9L8w5pomVAYGFydat"}

### src/analysis/functionAnalyzer.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9M8DVvQQTtJCA7DBX"}

### src/analysisViewer.ts

**Role:** GUI View

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9NK9ZYHYzy7k4YC7u"}

### src/analyzer.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9PDEATA8AY5CpiudQ"}

### src/cache.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9QBGUYrzmpZUzWMtx"}

### src/config/configurationManager.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9Qwf13in14CAgz3Xc"}

### src/context/analysisContextBuilder.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9S5cVKSYrqKKL8r8T"}

### src/diagnosticsProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9TXBgG1nEmQYVn19H"}

### src/domain/bootstrap/commandRegistry.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9V8AyvArAd6FBqAvY"}

### src/domain/bootstrap/extensionBootstrapper.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9VzWVq2H8gs2LXC5t"}

### src/domain/formatters/documentationFormatter.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9XM86u9xuuJaxKSa2"}

### src/domain/handlers/navigationHandler.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHg9YFSg8i51rwLziiLe"}


*... and 30 more files*
