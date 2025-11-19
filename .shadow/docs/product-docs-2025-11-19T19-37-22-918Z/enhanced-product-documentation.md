# Product Documentation

*Generated: 11/19/2025, 11:38:53 AM (2025-11-19 19:38:53 UTC)*

---

## Product Overview

Shadow Watch is a Visual Studio Code extension that provides intelligent code analysis and documentation generation powered by AI language models. Users can analyze their codebase to automatically generate comprehensive documentation, architectural insights, and code quality assessments without manually writing documentation. The extension integrates directly into the VS Code interface, allowing developers to trigger analysis with simple commands and view results in dedicated panels within their editor. Shadow Watch supports multiple AI providers including OpenAI and Anthropic, enabling users to choose their preferred language model for analysis. The tool is designed to help development teams maintain up-to-date documentation, understand complex codebases, and identify areas for improvement through automated analysis that would otherwise require significant manual effort.

## What It Does

- Analyzes codebases to automatically generate product documentation describing what applications do from a user perspective
- Provides architectural insights showing how code components relate and interact with each other
- Generates code quality assessments identifying potential issues, technical debt, and improvement opportunities
- Creates function-level documentation explaining what each function does and its purpose
- Produces module and file-level analysis breaking down codebase structure and organization
- Offers refactoring suggestions with AI-generated recommendations for code improvements
- Enables incremental analysis that only processes changed files rather than re-analyzing entire projects
- Supports multiple AI model providers allowing users to switch between OpenAI and Anthropic models
- Generates test documentation and identifies gaps in test coverage
- Provides navigation interfaces to browse analysis results and jump to specific code locations

## User Perspective

### GUI

- Access analysis commands through VS Code command palette or menu items
- View comprehensive analysis results in dedicated webview panels within the editor
- Browse architectural insights through an interactive tree view showing components and relationships
- Navigate through product documentation panels displaying generated user-facing descriptions
- Review code quality reports with identified issues and improvement suggestions
- Examine function documentation in organized views showing purpose and usage
- Monitor analysis progress through VS Code progress indicators
- Switch between different analysis views using panel navigation controls
- Jump directly to code locations from analysis results by clicking on items
- Configure extension settings through VS Code settings interface

### CLI

- Trigger full codebase analysis using command palette commands
- Initiate incremental analysis for changed files only
- Generate product documentation through dedicated commands
- Create architectural insight reports via CLI commands
- Request refactoring suggestions for selected code
- Generate test documentation and coverage analysis
- Switch AI model providers through configuration commands
- Clear analysis cache when needed
- Export analysis results to files

### API

- Integration with OpenAI API for GPT model analysis
- Integration with Anthropic API for Claude model analysis
- Extensible provider interface allowing additional AI model integrations
- State management API for tracking analysis progress and results
- Cache management for optimizing analysis performance
- File watching API for detecting code changes and triggering incremental updates

### CI/CD

- Can be integrated into build pipelines to generate documentation automatically
- Supports automated analysis runs as part of continuous integration workflows
- Enables documentation verification in pull request checks
- Provides programmatic access to analysis results for quality gates
- Supports batch processing of multiple projects or modules

## Workflow Integration

- New developer onboarding: Generate comprehensive documentation to help new team members understand the codebase quickly
- Documentation maintenance: Automatically update documentation as code changes are made
- Code review preparation: Generate analysis reports before reviews to identify potential issues
- Architecture documentation: Create and maintain up-to-date architectural diagrams and descriptions
- Refactoring planning: Identify refactoring opportunities and generate improvement suggestions
- Technical debt tracking: Continuously monitor code quality and identify areas needing attention
- Test coverage analysis: Identify untested code and generate test documentation
- Legacy code understanding: Analyze unfamiliar or legacy codebases to understand their structure and purpose
- API documentation: Generate user-facing API documentation from code analysis
- Release documentation: Create release notes and documentation updates automatically

## Problems Solved

- Eliminates the manual effort required to write and maintain code documentation
- Reduces time spent understanding unfamiliar or complex codebases
- Prevents documentation from becoming outdated as code evolves
- Helps teams maintain consistent documentation standards across projects
- Identifies code quality issues that might be missed in manual reviews
- Accelerates onboarding for new developers by providing comprehensive codebase overviews
- Provides objective analysis of code structure and potential improvements
- Enables teams to understand architectural patterns and dependencies
- Helps maintain technical documentation without dedicated technical writers
- Surfaces hidden technical debt and improvement opportunities that might otherwise go unnoticed

## Architecture Summary

Shadow Watch is built as a VS Code extension with a modular architecture centered around AI-powered analysis. The core system consists of several key layers: an extension activation layer that bootstraps commands and UI components, an analysis engine that processes code files and generates structured data, an AI integration layer that communicates with language model providers, and a presentation layer that renders results in VS Code webviews. The extension uses a state management system to track analysis progress and cache results, ensuring efficient operation even with large codebases. File watching capabilities enable incremental analysis, detecting changes and updating only affected portions of the documentation. The architecture supports pluggable AI providers through a factory pattern, allowing seamless switching between OpenAI and Anthropic models. Results are persisted using a repository pattern that stores analysis data for quick retrieval and comparison. The system uses JSON schemas to define expected AI response formats, ensuring consistent and parseable output from language models. Rate limiting and retry mechanisms protect against API failures and usage limits. The UI layer consists of multiple specialized viewers (analysis viewer, insights viewer, reports viewer) that present different aspects of the analysis in user-friendly formats. Navigation handlers coordinate between these views and enable jumping to specific code locations from analysis results.

## Module Documentation

### . (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4qd1dAyGvMBYPpp5f"}

### src/ai (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4rpggsmdZRyjXEZ4F"}

### src/ai/providers (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4sX7B4vbRTnfwdEY9"}

### src/analysis (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4tfZzTF7QvxtixVES"}

### src (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4uvxpaEBh7ugLexKN"}

### src/config (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4vbecy7Jxe8h9NFUF"}

### src/context (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4wH5dhk11ik5Ze5CF"}

### src/domain/bootstrap (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4xBQGr1vFbjzMMzU9"}

### src/domain/formatters (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4xqbASP9VcCjywMpE"}

### src/domain/handlers (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4yiBM1TxRUGjRq3Cr"}

### src/domain/prompts (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4zPrXiHPaWJzVgN3c"}

### src/domain/services (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp51P8yzHrSWGWsyD9i"}

### src/infrastructure/fileSystem (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp526J3bR5ndX395vLy"}

### src/infrastructure/persistence (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp52kjPt3Bx6EmDZL1q"}

### src/infrastructure (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp53ZrHnRhtBf8mjoDY"}

### src/state (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp54XeWpxffJr6aZdmZ"}

### src/storage (other)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp55GHwRFHrehLaRAR5"}

### src/test/__mocks__ (tests)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp575SFXZfGm5mGfRWF"}

### src/ui (gui)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp57nbmt1XcsGPyg52z"}

### src/ui/webview (gui)

Module analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp58Uma8CgX2kJHjjzi"}

## File-Level Documentation

*Detailed documentation for 50 files*

### jest.config.js

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4AS52oXmrwazjKBhb"}

### src/ai/llmRateLimiter.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4BEgn1yw3PZ3LAEkU"}

### src/ai/llmResponseParser.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4BuNfXVYGXJvX17rw"}

### src/ai/llmRetryHandler.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4CjynL6QuSzLHn31F"}

### src/ai/providers/ILLMProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4DRuC4K4xGSjDBWVM"}

### src/ai/providers/anthropicProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4E66FWpzdNuJuPyJh"}

### src/ai/providers/openAIProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4F7r673nZBHr4kUWT"}

### src/ai/providers/providerFactory.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4FqWechS6tA7MwAin"}

### src/analysis/enhancedAnalyzer.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4Ge8YHtYvHN7gbZMh"}

### src/analysis/functionAnalyzer.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4HNnNrL1gSM3wtLKo"}

### src/analysisViewer.ts

**Role:** GUI View

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4JDP4FxxDerTkQiZG"}

### src/analyzer.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4Jy2XJoj59roG2dGe"}

### src/cache.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4KifmorpxDRjBA2S9"}

### src/config/configurationManager.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4LRqZkaFDio13XVLA"}

### src/context/analysisContextBuilder.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4MEhtp156LaSRpKLr"}

### src/diagnosticsProvider.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4MxcYKkQHxobei9qE"}

### src/domain/bootstrap/commandRegistry.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4NbK8sLqAaB8tNXRn"}

### src/domain/bootstrap/extensionBootstrapper.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4PKU4J64d8xinPHAX"}

### src/domain/formatters/documentationFormatter.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4QCoLVxATfdUbLg36"}

### src/domain/handlers/navigationHandler.ts

**Role:** Core Logic

**Purpose:** Analysis failed: 404 {"type":"error","error":{"type":"not_found_error","message":"model: gpt-5.1"},"request_id":"req_011CVHp4QygbWYqHdebvtDZ4"}


*... and 30 more files*
