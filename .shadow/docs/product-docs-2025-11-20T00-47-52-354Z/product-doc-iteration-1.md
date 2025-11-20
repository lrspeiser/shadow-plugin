# Product Documentation

*Generated: 11/19/2025, 5:04:05 PM (2025-11-20 01:04:05 UTC)*

---

## Product Overview

Shadow Watch is a VS Code extension that provides AI-powered code intelligence and automated testing capabilities for software development teams. The extension analyzes your codebase to generate comprehensive documentation, identify code quality issues, and create unit tests automatically. Users interact with the extension through multiple sidebar panels, command palette actions, and inline diagnostics that appear directly in the editor as you work.

The extension connects to AI language models (OpenAI GPT-4 or Anthropic Claude) to understand your code at multiple levels - from individual functions to entire product architecture. It automatically generates documentation describing what your application does, how components relate to each other, and what problems your code solves. The extension watches your files for changes and can automatically re-analyze your code as you save, keeping documentation and insights up to date.

Shadow Watch transforms time-consuming manual tasks into automated workflows. Instead of manually writing documentation, reviewing code for quality issues, or creating unit tests from scratch, users can generate these artifacts with a few clicks. The extension presents all analysis results in organized tree views, exports documentation in multiple formats optimized for different AI assistants, and provides detailed reports that help teams understand and improve their codebase.

## What It Does

- Generates comprehensive product documentation automatically by analyzing your entire codebase
- Creates detailed architecture insights describing system components and their relationships
- Identifies code quality issues like large files, orphaned code, circular dependencies, and complexity problems
- Generates unit tests automatically for your functions with AI-powered test planning
- Executes test suites and automatically fixes failing tests using AI assistance
- Provides interactive tree views for navigating code structure, dependencies, and entry points
- Displays inline diagnostics showing code issues directly in the editor with squiggly underlines
- Exports analysis results in multiple formats (Markdown, JSON) optimized for Cursor, ChatGPT, and other AI tools
- Watches files for changes and automatically re-analyzes code when you save
- Searches codebases using grep patterns to find specific code elements
- Caches analysis results for 24 hours to provide instant access across sessions
- Detects test framework configuration and generates setup instructions if needed
- Creates prioritized test plans based on function complexity, dependencies, and risk
- Generates tests in small batches with real-time progress tracking
- Validates generated tests by running them and captures detailed results

## User Perspective

### GUI

- Browse code structure through interactive tree views showing products, analyses, insights, and test results
- View AI-generated architecture insights in a dedicated sidebar panel
- Navigate from high-level components down to specific functions with single clicks
- See code quality issues highlighted with inline squiggly underlines in the editor
- Monitor analysis progress through status bar indicators showing current operations
- View comprehensive reports in webview panels displaying formatted documentation
- Access detailed information about functions, API endpoints, and dependencies in popup panels
- Track test generation progress with real-time updates showing completed and failed tests
- Review test execution results with pass/fail counts and error details
- Copy analysis results, insights, and documentation to clipboard for sharing

### CLI

- Execute workspace analysis through VS Code command palette
- Trigger file-specific analysis for currently open files
- Generate product documentation on demand
- Clear cached analysis data to force fresh analysis
- Switch between OpenAI and Claude AI providers
- Configure extension settings through VS Code preferences
- Export analysis results in different formats
- Access test generation and validation workflows

### API

- Integrates with OpenAI GPT-4 API for AI-powered code analysis
- Connects to Anthropic Claude API as alternative AI provider
- Handles API rate limiting automatically to prevent quota violations
- Retries failed API requests with intelligent backoff strategies
- Supports streaming responses for real-time AI text generation
- Validates API credentials and provider availability before use

### CI/CD

- Generates test suites that integrate with existing test frameworks (Jest, Mocha, Vitest, Pytest, JUnit, Google Test)
- Detects test environment configuration automatically
- Creates setup instructions for missing test dependencies
- Executes tests and captures results for CI/CD pipeline integration
- Exports analysis results in standardized formats for automated workflows
- Validates generated tests to ensure they run successfully

## Workflow Integration

- Code review workflow: Analyze files to identify quality issues before committing changes
- Documentation workflow: Generate comprehensive product and architecture documentation automatically
- Testing workflow: Create test plans, generate unit tests, execute tests, and fix failures in one automated flow
- Refactoring workflow: Analyze function dependencies and complexity to plan safe code reorganization
- Onboarding workflow: Generate architecture insights and documentation to help new team members understand the codebase
- AI-assisted development: Export analysis results in formats optimized for Cursor, ChatGPT, and other AI coding assistants
- Quality monitoring: Continuously track code quality through automatic re-analysis on file save
- Test coverage workflow: Identify untested functions and generate tests to improve coverage
- Cross-language testing: Support multiple programming languages and testing frameworks in polyglot projects

## Problems Solved

- Eliminates manual documentation writing by automatically generating comprehensive product and architecture documentation
- Reduces time spent understanding unfamiliar codebases through AI-generated insights and navigation tools
- Catches code quality issues early by identifying large files, orphaned code, and circular dependencies automatically
- Accelerates test creation by generating unit tests with AI assistance instead of writing them manually
- Reduces debugging time by automatically fixing failing tests through AI-powered retry attempts
- Prevents API quota violations through automatic rate limiting when calling AI services
- Maintains up-to-date documentation through automatic re-analysis when code changes
- Streamlines code reviews by highlighting quality issues with inline diagnostics
- Simplifies test environment setup by detecting configuration and generating setup instructions
- Improves test coverage by prioritizing which functions need tests based on complexity and risk
- Enables efficient code navigation through interactive tree views showing dependencies and relationships
- Reduces context switching by keeping analysis results accessible for 24 hours across sessions
- Supports diverse workflows by exporting results in multiple formats for different tools
- Handles temporary API failures gracefully through intelligent retry logic
- Provides consistent AI interactions across multiple providers (OpenAI, Claude) through unified interface

## Architecture Summary

Shadow Watch follows a layered architecture with distinct separation between user interface, domain logic, infrastructure services, and AI integration. The user interface layer consists of multiple VS Code tree view providers and webview panels that present analysis results, insights, and reports. These views receive data from the domain layer and respond to user commands through registered command handlers. The extension bootstrapper initializes all components during activation and establishes the communication pathways between layers.

The domain layer contains the core business logic organized into specialized services. The analysis services parse code files to extract structure, dependencies, and function information. The testing services orchestrate the complete test generation workflow from planning through execution and validation. The prompt builders construct structured instructions for AI models based on analysis requirements. The formatting services transform raw analysis data into human-readable documentation. All domain services coordinate with each other through well-defined interfaces and data structures.

The infrastructure layer provides foundational capabilities that support the domain logic. The file system services handle efficient file reading, caching, and watching operations. The persistence layer manages storage and retrieval of analysis results in a timestamped directory structure. The AI provider layer abstracts interactions with different language models (OpenAI, Claude) behind a common interface. Rate limiting, retry logic, and response parsing ensure reliable AI interactions. The configuration manager centralizes all user preferences and broadcasts changes to interested components. This layered design enables each component to focus on its specific responsibility while maintaining clean boundaries and testability.

