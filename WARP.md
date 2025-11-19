# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Shadow Watch is a VSCode extension that performs continuous code architecture analysis and generates LLM-ready insights. It analyzes codebases in real-time, detects architecture issues (god objects, circular dependencies, dead code), and formats findings for consumption by AI assistants like Cursor, ChatGPT, and others.

## Build & Development Commands

### Build the extension
```bash
npm run compile
```
Compiles TypeScript to JavaScript in `dist/` directory using Webpack.

### Development mode with auto-rebuild
```bash
npm run watch
```
Watches for file changes and recompiles automatically.

### Package as VSIX
```bash
./scripts/build-vsix.sh
```
Complete build script that compiles, packages, and verifies the VSIX file. Creates `shadow-watch-*.vsix` in the project root.

Alternative manual packaging:
```bash
vsce package
```

### Install VSIX locally
```bash
code --install-extension shadow-watch-*.vsix
```

### Testing

Run Jest tests:
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
npm run test:verbose     # Verbose output
```

Run VSCode integration tests:
```bash
npm run test:vscode
```

### Linting
```bash
npm run lint
```

### Development workflow
1. Open project in VSCode
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new VSCode window
4. Debug with breakpoints in `.ts` files
5. View logs in Debug Console

## Architecture Overview

### High-Level Structure

Shadow Watch follows a **domain-driven design** with clear separation of concerns:

```
Extension Activation (extension.ts)
    ↓
ExtensionBootstrapper (domain/bootstrap/)
    ↓
Components: Analyzer, LLM Service, UI Providers
    ↓
Domain Services & Infrastructure
```

### Core Components

**Entry Point**
- `src/extension.ts` - Extension activation, command registration, component initialization

**Analysis Engine**
- `src/analyzer.ts` - Static code analysis (file parsing, function extraction, dependency graphs)
- `src/analysis/enhancedAnalyzer.ts` - Deep analysis with function metadata, branches, dependencies
- `src/analysis/functionAnalyzer.ts` - Function-level analysis for test generation
- `src/insightGenerator.ts` - Converts analysis results into actionable insights

**AI/LLM Integration** (largest subsystem)
- `src/llmService.ts` - Main orchestrator for AI providers (~2,700 lines, being refactored)
- `src/llmIntegration.ts` - High-level LLM integration logic (~2,300 lines, being refactored)
- `src/ai/providers/` - Provider implementations (OpenAI, Anthropic)
- `src/ai/llmResponseParser.ts` - Parses LLM responses into structured data
- `src/ai/llmRateLimiter.ts` - Rate limiting for API calls
- `src/ai/llmRetryHandler.ts` - Retry logic with exponential backoff
- `src/llmSchemas.ts` - JSON schemas for structured LLM outputs
- `src/llmFormatter.ts` - Formats insights for different LLM contexts (Cursor, ChatGPT, etc.)

**UI Components** (VSCode Tree Views)
- `src/insightsTreeView.ts` - Main sidebar menu and insights display
- `src/productNavigator.ts` - Product documentation navigator
- `src/analysisViewer.ts` - Workspace analysis display
- `src/insightsViewer.ts` - AI architecture insights display
- `src/staticAnalysisViewer.ts` - Static analysis results
- `src/unitTestsNavigator.ts` - Unit test coverage navigator
- `src/ui/reportsViewer.ts` - Comprehensive reports viewer
- `src/ui/webview/` - HTML webview generation for rich displays

**Domain Layer**
- `src/domain/bootstrap/` - Extension initialization logic
- `src/domain/handlers/` - Navigation and command handlers
- `src/domain/prompts/` - Prompt generation for LLMs
- `src/domain/services/` - Business logic services
- `src/domain/formatters/` - Output formatting

**Infrastructure**
- `src/config/configurationManager.ts` - Centralized configuration access
- `src/state/` - State management for UI components
- `src/storage/` - File I/O and incremental storage
- `src/cache.ts` - Analysis result caching
- `src/fileWatcher.ts` - File change monitoring
- `src/utils/errorHandler.ts` - Centralized error handling

### Key Design Patterns

**Provider Pattern**: Multiple LLM providers (OpenAI, Claude) with unified interface
**Observer Pattern**: File watcher service broadcasts changes to multiple subscribers
**State Management**: Centralized state for UI components via `llmStateManager`
**Incremental Analysis**: Saves analysis progress incrementally to avoid re-computation
**Webview Templates**: Reusable HTML templates for consistent UI

### Data Flow

1. **File Change** → FileWatcher → Analyzer → Insights → UI Update
2. **User Command** → Command Handler → Service Layer → LLM API → Parser → UI Display
3. **Analysis Request** → CodeAnalyzer → EnhancedAnalyzer → Cache → Results

## Important Implementation Notes

### LLM Integration
- **Never use `temperature` parameter** in LLM requests (per project rules)
- Latest OpenAI model is GPT-5, use latest API format
- Always include comments pointing to README files explaining API usage
- Store API keys in `.env` or VSCode settings (never in code)
- No fallbacks to hide LLM errors - show full error logs for debugging
- Use structured outputs for reliable JSON parsing

### Error Handling
- Use `ErrorHandler.handleSync()` or `ErrorHandler.handleAsync()` from `src/utils/errorHandler.ts`
- Log errors with component, operation, severity, and optional user message
- Never catch errors silently - always log or show to user

### File Operations
- Use `FileAccessHelper` for reading/writing files with proper error handling
- Incremental storage saves partial results to avoid re-computation
- Analysis results stored in `.shadow/` directory
- Cache stored in `.shadowwatch-cache/`

### Testing
- Unit tests use Jest with VSCode mocks (`src/test/__mocks__/vscode.ts`)
- Test files in `UnitTests/` and `src/test/`
- Webpack excludes test files from production build

### State Management
- UI components register with `llmStateManager`
- Use `getStateManager()` to access shared state
- Call `clearState()` before new analysis to prevent stale data

### Webviews
- Use `WebviewTemplateEngine` for HTML generation
- Shared CSS/JS in base template
- Support dark/light themes via VSCode theme variables

## Common Tasks

### Adding a new command
1. Define command in `package.json` under `contributes.commands`
2. Add handler in `domain/bootstrap/commandRegistry.ts`
3. Create implementation in relevant service/provider
4. Register command in `CommandRegistry.register()`

### Adding a new LLM provider
1. Create provider class in `src/ai/providers/` implementing `ILLMProvider`
2. Register in `ProviderFactory`
3. Add API key config in `package.json` settings
4. Update configuration manager

### Adding a new tree view
1. Create provider class extending `vscode.TreeDataProvider`
2. Register in `ExtensionBootstrapper.initialize()`
3. Add view definition in `package.json` under `contributes.views`
4. Register with state manager if needed

### Modifying analysis logic
1. Update `CodeAnalyzer` for structural changes
2. Update `EnhancedAnalyzer` for deep analysis
3. Regenerate insights in `InsightGenerator`
4. Update UI providers to display new data

## Known Refactoring Plans

The codebase is undergoing active refactoring to address technical debt:

1. **llmService.ts** (~2,700 lines) - Being decomposed into:
   - Provider implementations (`src/ai/providers/`)
   - Response parser (`src/ai/llmResponseParser.ts`)
   - Rate limiter and retry handler

2. **llmIntegration.ts** (~2,300 lines) - Being decomposed into:
   - State management (extracted to `src/state/`)
   - Storage operations (extracted to `src/storage/`)
   - Domain services

3. **Duplication removal**:
   - Configuration access centralized in `configurationManager`
   - Error handling centralized in `errorHandler`
   - Webview HTML generation centralized in `webviewTemplateEngine`

See `REFACTORING_PLAN.md` for detailed breakdown.

## Configuration

Settings are accessed via `getConfigurationManager()` which wraps VSCode configuration API.

Key settings:
- `shadowWatch.enabled` - Enable/disable extension
- `shadowWatch.analyzeOnSave` - Auto-analyze on file save
- `shadowWatch.llmProvider` - AI provider (openai/claude)
- `shadowWatch.openaiApiKey` - OpenAI API key
- `shadowWatch.claudeApiKey` - Claude API key
- `shadowWatch.llmFormat` - Output format (cursor/chatgpt/generic/compact)

## Files to Exclude from Analysis

The following are documentation/planning files, not code:
- `GET_STARTED.md`, `IMPLEMENTATION_GUIDE.md`, `PLUGIN_DESIGN.md`
- `REFACTORING_*.md`, `QUICK_START.md`, `MENU_STRUCTURE.md`
- `TEST_GENERATION_ENHANCEMENT_PLAN.md`, `PRODUCT_DOCS_DIAGNOSIS.md`

## Git Workflow

- Always commit with descriptive messages
- Push directly to `main` branch (no feature branches used)
- After code changes: commit, push, and if there's build/deploy, execute it
- Use Git LFS for large files

## External Dependencies

- **VSCode Extension API** (`vscode` module) - Never bundled, always external
- **OpenAI SDK** (`openai` package) - GPT models
- **Anthropic SDK** (`@anthropic-ai/sdk` package) - Claude models
- **Webpack** - Bundles extension for distribution
- **Jest** - Testing framework
- **TypeScript** - Compiled with `ts-loader`
