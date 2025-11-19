# AI Architecture Insights

*Generated: 11/18/2025, 7:47:07 PM (2025-11-19 03:47:07 UTC)*

---

## Overall Architecture Assessment

Shadow Watch exhibits a **monolithic architecture with emerging layer separation** that reflects its evolution from a simple VS Code extension into a comprehensive AI-powered architecture analysis platform. The codebase demonstrates two distinct architectural patterns coexisting: a legacy monolithic core (`src/llmService.ts` at 2321 lines, `src/llmIntegration.ts` at 2246 lines) and a newer domain-driven structure (`src/domain/`, `src/ai/providers/`, `src/infrastructure/`). This dual architecture pattern indicates an **incomplete migration toward Clean Architecture principles**, where newer features follow better practices while older core services remain as large, tightly-coupled modules. The single entry point at `dist/extension.js` aligns perfectly with VS Code's extension model and the product's goal of seamless IDE integration.

The architecture demonstrates **strong alignment with product goals** in several areas: the AI provider abstraction (`src/ai/providers/`) supports multi-model flexibility as intended, the caching system (`src/cache.ts`, `src/storage/incrementalStorage.ts`) optimizes for real-time performance, and multiple view components (`src/insightsTreeView.ts`, `src/insightsViewer.ts`, `src/analysisViewer.ts`) serve different developer contexts effectively. However, the **massive service classes** (`llmService.ts` with 97 functions, `llmIntegration.ts` with 158 functions) indicate God Object anti-patterns that contradict the emerging domain-driven structure. These services handle everything from API communication to response parsing to formatting to state management, creating tight coupling and making the system difficult to test, extend, or maintain. The presence of 15 root-level files including configuration, documentation, and build artifacts reveals **organizational debt** that obscures the actual codebase structure and creates friction for developers trying to understand the system.

## Strengths

- Clear AI provider abstraction layer (src/ai/providers/) supporting OpenAI, Anthropic, and extensible to custom providers, directly enabling the product goal of AI assistant flexibility
- Incremental analysis with caching (src/storage/incrementalStorage.ts, src/cache.ts) that optimizes performance for real-time file-save triggers without blocking developer workflow
- Domain-driven structure emerging in src/domain/ with separation of prompts, handlers, formatters, and bootstrap logic showing architectural evolution toward better practices
- Multiple view components (tree, webview, diagnostics) that serve different developer contexts effectively - quick navigation, detailed documentation, and inline annotations
- Event-driven file watching system (src/fileWatcher.ts, src/domain/services/fileWatcherService.ts) that automatically triggers analysis on save without manual commands
- Comprehensive LLM schema definitions (src/llmSchemas.ts) with JSON validation ensuring reliable parsing of AI responses despite model variability
- Well-organized bootstrap and command registration (src/domain/bootstrap/) that properly initializes the extension within VS Code's lifecycle
- Separate formatting layer (src/domain/formatters/, src/llmFormatter.ts) that generates AI-specific prompt formats for Cursor, ChatGPT, and generic assistants

## Issues & Concerns

- **God Object Anti-Pattern in LLM Services**: Both src/llmService.ts (2321 lines, 97 functions) and src/llmIntegration.ts (2246 lines, 158 functions) are massive service classes that handle multiple responsibilities including API communication, response parsing, state management, formatting, rate limiting, retry logic, caching, and error handling. This violates Single Responsibility Principle and makes these classes untestable, difficult to maintain, and impossible to extend without modifying existing code. **Proposed Fix**: Decompose these monolithic services into focused, single-responsibility classes: (1) Create src/ai/services/llmApiService.ts for raw API communication only, (2) Move retry and rate limiting to src/ai/middleware/ classes that wrap the API service, (3) Extract response parsing to src/ai/parsers/ with one parser per response type, (4) Move formatting logic to src/domain/formatters/ (partially done), (5) Extract state management to src/state/ (partially done with llmStateManager.ts), (6) Create orchestration layer in src/application/ that coordinates these focused services. Each class should have <200 lines and <10 public methods.
  - Files: src/llmService.ts, src/llmIntegration.ts
  - Functions: LLMService, LLMIntegration
- **Duplicate Analysis Implementation**: The codebase has two separate analysis implementations: src/analyzer.ts (650 lines, 30 functions) and src/analysis/enhancedAnalyzer.ts (871 lines, 36 functions). Both perform static code analysis using TypeScript AST parsing, but with different feature sets and no clear migration path. This creates confusion about which analyzer to use, duplicates maintenance effort, and risks inconsistent results. **Proposed Fix**: Merge the two analyzers into a single implementation at src/analysis/codeAnalyzer.ts. Identify which features are unique to each analyzer and consolidate them. Create a feature flag system in configurationManager.ts to enable/disable specific analysis features. Deprecate the old src/analyzer.ts and update all references (src/analysisViewer.ts, src/extension.ts) to use the unified analyzer. Document the migration in CHANGELOG.md.
  - Files: src/analyzer.ts, src/analysis/enhancedAnalyzer.ts, src/analysisViewer.ts
  - Functions: Analyzer, EnhancedAnalyzer, analyzeFile, analyzeWorkspace
- **Circular Dependencies Between Core Services**: LLM-related services have circular dependencies: src/llmService.ts imports from src/llmIntegration.ts for integration logic, while src/llmIntegration.ts imports from src/llmService.ts for API calls. Additionally, src/ai/llmResponseParser.ts imports from both ../fileDocumentation and ../llmService, creating a tangled dependency graph. This makes the code difficult to reason about, causes initialization order problems, and prevents proper unit testing. **Proposed Fix**: Introduce interface-based dependency inversion. Create src/domain/interfaces/ directory with ILLMService.ts, ILLMIntegration.ts, and IResponseParser.ts interfaces. LLMService should implement ILLMService and depend only on IResponseParser (not concrete classes). LLMIntegration should depend on ILLMService interface (not concrete LLMService). Response parser should depend on domain interfaces, not concrete implementations. Use dependency injection in src/domain/bootstrap/extensionBootstrapper.ts to wire concrete implementations. This breaks circular dependencies and enables proper testing with mocks.
  - Files: src/llmService.ts, src/llmIntegration.ts, src/ai/llmResponseParser.ts
  - Functions: LLMService, LLMIntegration, LLMResponseParser
- **Root Directory Organization Chaos**: The root directory contains 15 files including 7 markdown documentation files (GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, README.md, REFACTORING_PLAN.md, TEST_GENERATION_ENHANCEMENT_PLAN.md), 2 VSIX package files (shadow-watch-1.0.0.vsix, shadow-watch.vsix), configuration files (package.json, tsconfig.json, webpack.config.js), and LICENSE. This creates navigation friction and obscures the actual codebase structure. **Proposed Fix**: Create organized directory structure: (1) Move all documentation to docs/ directory maintaining current filenames, (2) Move VSIX packages to dist/ or releases/ directory as they are build artifacts, (3) Keep only essential files in root: README.md (project overview with links to docs/), package.json, tsconfig.json, webpack.config.js, LICENSE, .gitignore, (4) Update README.md to link to detailed documentation in docs/ directory, (5) Update build scripts to reference new VSIX location.
  - Files: GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, README.md, REFACTORING_PLAN.md, TEST_GENERATION_ENHANCEMENT_PLAN.md, shadow-watch-1.0.0.vsix, shadow-watch.vsix
- **Inconsistent Service Organization**: Service classes are scattered across multiple directories with no clear organizational principle: src/ contains core services (llmService.ts, insightGenerator.ts), src/domain/services/ contains domain services (fileWatcherService.ts, incrementalAnalysisService.ts), src/infrastructure/ contains infrastructure services (progressService.ts), and src/ai/ contains AI-specific utilities (llmRateLimiter.ts, llmRetryHandler.ts). This inconsistent organization makes it difficult to locate services and understand system boundaries. **Proposed Fix**: Establish clear service layer organization: (1) Create src/application/services/ for application orchestration services (coordinate between domain and infrastructure), (2) Keep src/domain/services/ for domain-specific business logic, (3) Move src/infrastructure/progressService.ts to src/infrastructure/services/, (4) Move src/ai/ utilities to src/infrastructure/ai/ as they are infrastructure concerns (rate limiting, retry, HTTP), (5) Move src/llmService.ts and src/insightGenerator.ts to src/application/services/ as they orchestrate multiple concerns, (6) Document service layer responsibilities in ARCHITECTURE.md.
  - Files: src/llmService.ts, src/insightGenerator.ts, src/domain/services/fileWatcherService.ts, src/domain/services/incrementalAnalysisService.ts, src/infrastructure/progressService.ts, src/ai/llmRateLimiter.ts, src/ai/llmRetryHandler.ts
  - Functions: LLMService, InsightGenerator, FileWatcherService, IncrementalAnalysisService, ProgressService
- **Orphaned Infrastructure Code**: Three files are orphaned (not imported by any other module): src/infrastructure/progressService.ts, src/ui/webview/baseWebviewProvider.ts, and webpack.config.js. ProgressService provides UI progress notifications but isn't used anywhere, suggesting incomplete feature implementation or dead code. BaseWebviewProvider appears to be an abstraction for webview creation but isn't referenced, indicating abandoned refactoring. **Proposed Fix**: For progressService.ts: Either (1) integrate it into existing long-running operations like LLM API calls and analysis operations by adding imports in src/llmService.ts and src/analyzer.ts, or (2) delete it if progress UI isn't needed. For baseWebviewProvider.ts: Either (1) refactor existing webview code (src/insightsViewer.ts, src/analysisViewer.ts, src/productNavigator.ts) to extend this base class for code reuse, or (2) delete it if the abstraction isn't valuable. For webpack.config.js: Verify it's still used by package.json build scripts, otherwise remove it. Document decisions in CHANGELOG.md.
  - Files: src/infrastructure/progressService.ts, src/ui/webview/baseWebviewProvider.ts, webpack.config.js
  - Functions: ProgressService, BaseWebviewProvider
- **Viewer Components Lack Layered Architecture**: Viewer components (src/insightsTreeView.ts at 1006 lines, src/insightsViewer.ts at 778 lines, src/productNavigator.ts at 1094 lines) are massive files that mix presentation logic, data fetching, state management, event handling, and HTML generation. These are effectively presentation layer components but contain business logic and direct data access. **Proposed Fix**: Refactor viewer components into layered architecture: (1) Create src/ui/presenters/ for presentation logic (data transformation for display), (2) Create src/ui/templates/ for HTML template generation, (3) Keep src/ui/views/ or src/ui/webview/ for view orchestration only, (4) Move data fetching to application services, (5) Extract state management to dedicated state classes in src/state/, (6) Use presenter pattern: View asks Presenter for data, Presenter fetches from Services and transforms for View, View renders using Templates. Each class should have single responsibility and be <300 lines.
  - Files: src/insightsTreeView.ts, src/insightsViewer.ts, src/productNavigator.ts
  - Functions: InsightsTreeProvider, InsightsViewer, ProductNavigator
- **Missing Error Boundary Between Layers**: The codebase lacks clear error handling boundaries between architectural layers. Errors from AI providers (network failures, API errors, rate limits) can propagate directly to UI layers without transformation, causing raw error messages to appear in VS Code UI. The error handling utility (src/utils/errorHandler.ts) exists but isn't consistently used across layers. **Proposed Fix**: Implement error boundary pattern with layer-specific error transformations: (1) Create src/domain/errors/ with domain-specific error classes (AnalysisError, ConfigurationError, AIProviderError), (2) Wrap infrastructure errors at infrastructure layer boundary - AI provider errors become AIProviderError with user-friendly messages, (3) Application layer catches domain errors and decides on recovery strategy (retry, fallback, user notification), (4) Presentation layer only handles display of user-friendly error messages, never catches infrastructure exceptions, (5) Update errorHandler.ts to include error transformation utilities, (6) Enforce pattern in extensionBootstrapper.ts by wrapping all command handlers with error boundaries.
  - Files: src/utils/errorHandler.ts, src/ai/providers/anthropicProvider.ts, src/ai/providers/openAIProvider.ts, src/extension.ts
  - Functions: ErrorHandler, AnthropicProvider, OpenAIProvider, activate
- **Configuration Management Scattered**: Configuration is accessed directly from ConfigurationManager throughout the codebase, but there's no validation layer ensuring configuration consistency or completeness. AI providers directly access configuration (src/ai/providers/anthropicProvider.ts, openAIProvider.ts), and services assume configuration values exist without validation. This can cause runtime errors when required configuration is missing. **Proposed Fix**: Implement configuration validation and domain configuration objects: (1) Create src/domain/config/ with typed configuration classes (AIProviderConfig, AnalysisConfig, UIConfig), (2) Add validation logic in configurationManager.ts that validates configuration on load and throws ConfigurationError with helpful messages if invalid, (3) Create configuration builder pattern that constructs validated configuration objects, (4) Update providers and services to accept configuration objects via dependency injection instead of accessing ConfigurationManager directly, (5) Add configuration change listeners that validate before applying changes, (6) Document required configuration in docs/CONFIGURATION.md with examples.
  - Files: src/config/configurationManager.ts, src/ai/providers/anthropicProvider.ts, src/ai/providers/openAIProvider.ts
  - Functions: ConfigurationManager, AnthropicProvider.getConfig, OpenAIProvider.getConfig

## Code Organization

The codebase suffers from **significant organizational debt** with 15 files cluttering the root directory, creating immediate friction for anyone trying to understand the project structure. Seven markdown documentation files (GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, REFACTORING_PLAN.md, TEST_GENERATION_ENHANCEMENT_PLAN.md) should be consolidated into a docs/ directory with a clear information hierarchy. Two VSIX package files (shadow-watch-1.0.0.vsix, shadow-watch.vsix) are build artifacts that belong in dist/ or releases/, not the repository root. Only essential project files (README.md, package.json, tsconfig.json, webpack.config.js, LICENSE) should remain at the root level, with README.md serving as a concise entry point that links to detailed documentation in docs/.

Within the src/ directory, **architectural layering is inconsistent and incomplete**. The presence of both src/analyzer.ts and src/analysis/enhancedAnalyzer.ts indicates duplicate functionality without clear migration strategy. Massive service files (llmService.ts at 2321 lines, llmIntegration.ts at 2246 lines) live directly in src/ alongside smaller, focused modules, creating unclear boundaries between core functionality and supporting utilities. The emerging domain-driven structure (src/domain/prompts/, src/domain/handlers/, src/domain/formatters/, src/domain/bootstrap/, src/domain/services/) shows good architectural intent, but doesn't extend to the legacy core services. Service organization is scattered: some services live in src/, others in src/domain/services/, and infrastructure services are split between src/infrastructure/ and src/ai/. This inconsistency makes it difficult to locate services and understand system boundaries.

The codebase shows **architectural layer confusion** where presentation components (src/insightsTreeView.ts, src/insightsViewer.ts, src/productNavigator.ts) contain business logic and direct data access instead of delegating to application services. State management exists in multiple places (src/state/llmStateManager.ts, src/storage/incrementalStorage.ts, src/cache.ts) without clear separation of concerns - what's the difference between state, storage, and cache? The src/ui/ directory only contains webview components while other UI components (insightsTreeView.ts, analysisViewer.ts) live directly in src/, suggesting incomplete UI organization. Infrastructure concerns (src/infrastructure/) and AI utilities (src/ai/) are properly separated, but the boundary between them is unclear - rate limiting and retry logic in src/ai/ could be considered infrastructure concerns. The context/ directory contains only one file (analysisContextBuilder.ts), questioning whether a separate directory is justified. Overall, the file organization reflects a codebase in transition from a monolithic structure to a cleaner layered architecture, but the migration is incomplete and inconsistent.

## Entry Points Analysis

Shadow Watch has a single, well-defined entry point at dist/extension.js (referenced in package.json main field), which perfectly aligns with VS Code's extension model and the product's goal of seamless IDE integration. This single entry point is appropriate because the product serves one specific user type (developers working within VS Code) rather than multiple interfaces like CLI, GUI, or API. The extension.ts source file (715 lines, 50 functions) serves as the activation point where VS Code's extension lifecycle begins. The activate() function bootstraps the extension by registering commands, initializing services, setting up file watchers, and creating UI components (tree views, webviews, diagnostics). The codebase also includes a proper deactivate() function for cleanup, following VS Code extension best practices. The presence of src/domain/bootstrap/extensionBootstrapper.ts (204 lines) and src/domain/bootstrap/commandRegistry.ts (176 lines) suggests an effort to organize the initialization logic better, moving toward a more maintainable bootstrap process. However, it's unclear whether extension.ts delegates to extensionBootstrapper.ts or if these are duplicate initialization implementations. The entry point organization is fundamentally sound for a VS Code extension, though the bootstrap logic could benefit from consolidation if duplication exists between extension.ts and the domain/bootstrap/ classes.

## Orphaned Files Analysis

The three orphaned files reveal incomplete architectural refactoring and potential dead code. **src/infrastructure/progressService.ts** (139 lines) provides VS Code progress UI notifications but isn't imported anywhere, suggesting either: (1) an incomplete feature where progress UI was planned for long-running operations like LLM API calls but never integrated, (2) dead code from an abandoned feature, or (3) a service that's only used via dynamic imports or reflection (unlikely in TypeScript). The most probable explanation is incomplete feature implementation - the service exists and is well-implemented, but the integration work to add progress notifications to llmService.ts and analyzer.ts was never completed. **src/ui/webview/baseWebviewProvider.ts** (84 lines) appears to be an abstraction layer for webview creation, likely intended to reduce code duplication between insightsViewer.ts, analysisViewer.ts, and productNavigator.ts. The fact that it's not imported suggests an abandoned refactoring effort where the base class was created but existing webview components were never refactored to extend it. This is a clear sign of architectural improvement that was started but not finished. **webpack.config.js** (37 lines) in the root directory is likely still used by the build process (referenced in package.json scripts), but the analysis marked it as orphaned because no TypeScript source files import it. This is a false positive - build configuration files are not typically imported by source code but are used by build tools. These orphaned files should either be integrated into the codebase (if valuable) or removed (if dead code), with decisions documented to prevent future confusion.

## Folder Reorganization Suggestions

**Documentation Consolidation (High Priority, Low Risk)**
Move all markdown documentation files from root to docs/ directory:
- docs/GET_STARTED.md (quick start for new users)
- docs/IMPLEMENTATION_GUIDE.md (implementation details)
- docs/MENU_STRUCTURE.md (UI menu documentation)
- docs/PLUGIN_DESIGN.md (architecture and design decisions)
- docs/QUICK_START.md (appears duplicate of GET_STARTED.md - merge or clarify purpose)
- docs/REFACTORING_PLAN.md (refactoring strategy)
- docs/TEST_GENERATION_ENHANCEMENT_PLAN.md (testing roadmap)
- docs/ARCHITECTURE.md (create new - document current architecture, layers, patterns)
- docs/CONFIGURATION.md (create new - document all configuration options)
Update root README.md to be concise project overview with links to docs/ for details.

**Build Artifacts Organization (High Priority, Low Risk)**
Move VSIX packages to dedicated directory:
- dist/releases/shadow-watch-1.0.0.vsix
- dist/releases/shadow-watch.vsix
Update .gitignore to exclude dist/releases/ from version control (these are build outputs).
Update build scripts (scripts/build-vsix.sh) to output to new location.

**Service Layer Consolidation (High Priority, Medium Risk)**
Reorganize services into clear layers:
- src/application/services/ (create new - orchestration services)
  - llmService.ts (move from src/ after decomposition)
  - insightGenerator.ts (move from src/)
  - analysisOrchestrator.ts (create new - coordinate analysis workflow)
- src/domain/services/ (keep existing domain services)
  - fileWatcherService.ts (already here)
  - incrementalAnalysisService.ts (already here)
- src/infrastructure/services/ (create new - infrastructure services)
  - progressService.ts (move from src/infrastructure/)
- src/infrastructure/ai/ (create new - AI infrastructure)
  - rateLimiter.ts (move from src/ai/llmRateLimiter.ts)
  - retryHandler.ts (move from src/ai/llmRetryHandler.ts)
  - responseParser.ts (move from src/ai/llmResponseParser.ts)

**Analysis Layer Unification (High Priority, High Risk)**
Consolidate duplicate analyzers:
- src/analysis/codeAnalyzer.ts (merge analyzer.ts and enhancedAnalyzer.ts here)
- src/analysis/staticAnalyzer.ts (extract static analysis features)
- src/analysis/astParser.ts (extract AST parsing utilities)
- Delete src/analyzer.ts after migration
- Update all imports (src/analysisViewer.ts, src/extension.ts, etc.)

**UI Layer Organization (Medium Priority, Medium Risk)**
Consolidate UI components:
- src/ui/views/ (create new - view orchestration)
  - insightsTreeView.ts (move from src/)
  - insightsView.ts (move from src/insightsViewer.ts)
  - analysisView.ts (move from src/analysisViewer.ts)
  - productNavigatorView.ts (move from src/productNavigator.ts)
  - staticAnalysisView.ts (move from src/staticAnalysisViewer.ts)
  - unitTestsNavigatorView.ts (move from src/unitTestsNavigator.ts)
- src/ui/presenters/ (create new - presentation logic)
  - insightsPresenter.ts (extract from insightsViewer.ts)
  - analysisPresenter.ts (extract from analysisViewer.ts)
  - productPresenter.ts (extract from productNavigator.ts)
- src/ui/templates/ (create new - HTML generation)
  - insightsTemplate.ts (extract from insightsViewer.ts)
  - analysisTemplate.ts (extract from analysisViewer.ts)
  - productTemplate.ts (extract from productNavigator.ts)
- src/ui/webview/ (keep existing for webview infrastructure)
  - baseWebviewProvider.ts (already here - integrate or remove)
  - webviewTemplateEngine.ts (already here)

**Domain Layer Expansion (Medium Priority, Low Risk)**
Expand domain-driven structure:
- src/domain/interfaces/ (create new - layer interfaces)
  - ILLMService.ts
  - IAnalysisService.ts
  - IConfigurationService.ts
- src/domain/errors/ (create new - domain errors)
  - analysisError.ts
  - configurationError.ts
  - aiProviderError.ts
- src/domain/models/ (create new - domain models)
  - analysisResult.ts
  - insight.ts
  - architectureIssue.ts
- src/domain/config/ (create new - configuration objects)
  - aiProviderConfig.ts
  - analysisConfig.ts
  - uiConfig.ts

**State Management Consolidation (Low Priority, Medium Risk)**
Clarify state/storage/cache separation:
- src/state/ (application state - in-memory)
  - llmStateManager.ts (already here)
  - analysisState.ts (create new)
  - uiState.ts (create new)
- src/storage/ (persistent storage - disk)
  - incrementalStorage.ts (already here)
  - analysisResultStore.ts (create new)
- src/cache/ (temporary cache - memory)
  - cache.ts (move from src/)
  - Move to src/infrastructure/cache/ as it's infrastructure concern

**Infrastructure Organization (Low Priority, Low Risk)**
- src/infrastructure/persistence/ (keep existing)
  - analysisResultRepository.ts (already here)
- src/infrastructure/services/ (create new)
  - progressService.ts (move from src/infrastructure/)
- src/infrastructure/ai/ (create new)
  - rateLimiter.ts (move from src/ai/)
  - retryHandler.ts (move from src/ai/)
  - responseParser.ts (move from src/ai/)
- src/infrastructure/cache/ (create new)
  - cache.ts (move from src/cache.ts)

**Utility and Helper Organization (Low Priority, Low Risk)**
- src/utils/ (keep existing for cross-cutting utilities)
  - errorHandler.ts (already here)
  - logger.ts (move from src/)
- src/helpers/ (create new - domain-specific helpers)
  - fileAccessHelper.ts (move from src/)

This reorganization aligns file locations with architectural layers, reduces root directory clutter, eliminates duplicate implementations, and establishes clear boundaries between presentation, application, domain, and infrastructure concerns. The plan prioritizes high-impact, low-risk changes first (documentation, build artifacts) before tackling complex refactoring (service decomposition, analyzer unification).

## Recommendations

- **Maintain Multi-Provider AI Support**: If you want to support developers using different AI assistants (OpenAI, Claude, custom models) and maintain flexibility for future AI providers: Keep the current provider abstraction layer (src/ai/providers/) as-is. The factory pattern and ILLMProvider interface enable extensibility without modifying existing code. Consider enhancing the abstraction by adding provider capability detection (e.g., some models support streaming, others don't) and provider-specific optimizations (e.g., different prompt formats for better results). This architecture directly supports the product goal of AI assistant flexibility and cost-consciousness where developers can choose providers based on budget, privacy requirements, or quality preferences.
  - Files: src/ai/providers/ILLMProvider.ts, src/ai/providers/providerFactory.ts, src/ai/providers/anthropicProvider.ts, src/ai/providers/openAIProvider.ts
  - Functions: ILLMProvider, ProviderFactory, AnthropicProvider, OpenAIProvider
- **Simplify to Single AI Provider**: If you want to reduce complexity and maintenance burden by supporting only one AI provider: Consolidate to a single provider implementation (likely OpenAI as it's most common) and remove the provider abstraction layer. This eliminates the factory pattern, interface abstractions, and multiple provider implementations. Remove src/ai/providers/ directory entirely and inline the chosen provider directly into llmService.ts. This reduces code size by ~400 lines and simplifies the mental model, but sacrifices flexibility and locks developers into one AI service. Only choose this path if user research shows all users prefer one provider, or if the extension will become a paid service where you control the AI provider backend.
  - Files: src/ai/providers/, src/llmService.ts
  - Functions: ProviderFactory, ILLMProvider, AnthropicProvider, OpenAIProvider
- **Decompose God Object Services**: If you want to improve testability, maintainability, and enable parallel development by multiple developers: Decompose src/llmService.ts and src/llmIntegration.ts into focused, single-responsibility classes as detailed in the issues section. This aligns with the emerging domain-driven structure visible in src/domain/ and enables better separation of concerns. Each decomposed class becomes independently testable with mocks, and developers can work on different concerns (API communication, rate limiting, parsing, formatting) without merge conflicts. This is essential if the product continues to grow in features and complexity. The tradeoff is increased file count and need for orchestration layer, but the benefits for long-term maintainability are significant.
  - Files: src/llmService.ts, src/llmIntegration.ts
  - Functions: LLMService, LLMIntegration
- **Keep Monolithic Services for Simplicity**: If you want to maintain simplicity and avoid over-engineering for a small team or feature-complete product: Keep the current monolithic service structure in src/llmService.ts and src/llmIntegration.ts. While these files are large, they keep related functionality together, making it easy to understand the complete flow of LLM operations in one place. This architecture works well if: (1) the product is feature-complete and not actively adding new AI capabilities, (2) the team is small (1-2 developers) and doesn't need parallel development, (3) the existing test coverage is sufficient and testability isn't a concern. The tradeoff is difficulty adding new features and testing, but you avoid the complexity of dependency injection and orchestration layers.
  - Files: src/llmService.ts, src/llmIntegration.ts
  - Functions: LLMService, LLMIntegration
- **Enhance Real-Time Performance**: If you want to improve real-time responsiveness and reduce perceived latency during file save operations: Optimize the caching and incremental analysis system. Current implementation (src/cache.ts, src/storage/incrementalStorage.ts, src/domain/services/incrementalAnalysisService.ts) provides basic caching, but could be enhanced with: (1) Predictive pre-analysis of likely-to-be-edited files based on developer patterns, (2) Background analysis queue that analyzes changed files without blocking save operations, (3) Progressive result streaming where partial results display immediately while full analysis completes, (4) Multi-level caching (memory, disk, network) with TTL policies. This directly supports the product goal of non-disruptive workflow integration and real-time analysis expectations. The tradeoff is increased complexity in cache invalidation and result consistency.
  - Files: src/cache.ts, src/storage/incrementalStorage.ts, src/domain/services/incrementalAnalysisService.ts, src/fileWatcher.ts
  - Functions: Cache, IncrementalStorage, IncrementalAnalysisService, FileWatcher
- **Expand to Multi-Language Documentation Generation**: If you want to extend beyond code analysis into comprehensive product documentation: Enhance the product documentation generation capabilities (src/productNavigator.ts, src/domain/prompts/promptBuilder.ts) to support multiple output formats (Markdown, HTML, PDF, Confluence, Notion). Create a documentation template system where developers can customize output format, structure, and branding. Add documentation versioning to track how product behavior changes over time. This aligns with the product goal of maintaining up-to-date documentation that reflects current codebase state. Implement by creating src/documentation/ module with format-specific generators, template engine integration, and version tracking. The tradeoff is increased complexity and dependencies on document generation libraries.
  - Files: src/productNavigator.ts, src/domain/prompts/promptBuilder.ts, src/domain/formatters/documentationFormatter.ts
  - Functions: ProductNavigator, PromptBuilder, DocumentationFormatter
- **Integrate Progress UI for Long Operations**: If you want to improve user experience during long-running operations like workspace analysis or AI API calls: Integrate the orphaned src/infrastructure/progressService.ts into operations that take >2 seconds. Add progress notifications to: (1) Full workspace analysis in analyzer.ts, (2) LLM API calls in llmService.ts showing 'Analyzing architecture with AI...', (3) Bulk documentation generation in productNavigator.ts. VS Code's progress API provides non-blocking notifications that improve perceived performance even when actual operation time is unchanged. This enhances the product's IDE integration goal by providing feedback consistent with VS Code conventions. Implementation requires injecting ProgressService into long-running services and wrapping operations with withProgress() calls. The tradeoff is additional UI noise if overused, so only apply to operations >2 seconds.
  - Files: src/infrastructure/progressService.ts, src/analyzer.ts, src/llmService.ts, src/productNavigator.ts
  - Functions: ProgressService, Analyzer.analyzeWorkspace, LLMService.analyze, ProductNavigator.generateDocumentation
- **Implement Error Boundaries for Robustness**: If you want to improve reliability and user experience when errors occur: Implement comprehensive error boundary pattern as detailed in the issues section. Wrap infrastructure errors (network failures, API errors, file system errors) at the boundary between infrastructure and application layers, transforming them into domain-specific errors with user-friendly messages. Add recovery strategies (retry with backoff, fallback to cached results, graceful degradation) at the application layer. Display helpful error messages with actionable guidance in the UI layer. This prevents raw error messages from appearing in VS Code UI and improves error handling consistency across the extension. Essential if the product handles unreliable external dependencies (AI APIs, network resources). The tradeoff is additional error handling code and testing complexity.
  - Files: src/utils/errorHandler.ts, src/domain/errors/, src/ai/providers/, src/extension.ts
  - Functions: ErrorHandler, AnthropicProvider, OpenAIProvider, activate

## Refactoring Priorities

- **Decompose Monolithic LLM Services**: Break down src/llmService.ts (2321 lines, 97 functions) and src/llmIntegration.ts (2246 lines, 158 functions) into focused, single-responsibility classes. These God Objects are the primary technical debt in the codebase and block further architectural improvements. Create separate classes for API communication, response parsing, rate limiting, retry logic, state management, and formatting. Use dependency injection to wire components together. This enables independent testing, parallel development, and easier feature additions. **Rationale**: These files violate Single Responsibility Principle and make the codebase difficult to maintain, test, and extend. Decomposition is prerequisite for other architectural improvements.
  - Files: src/llmService.ts, src/llmIntegration.ts, src/ai/llmResponseParser.ts, src/ai/llmRateLimiter.ts, src/ai/llmRetryHandler.ts
  - Functions: LLMService, LLMIntegration, LLMResponseParser, LLMRateLimiter, LLMRetryHandler
- **Organize Root Directory and Documentation**: Move 7 markdown documentation files from root to docs/ directory, move 2 VSIX packages to dist/releases/, and update README.md to be concise entry point with links to detailed docs. This is high-impact (improves navigation for all developers), low-risk (no code changes), and quick to implement (1-2 hours). Clear root directory makes project structure immediately understandable and reduces cognitive load for new contributors. **Rationale**: Root directory clutter creates immediate friction and obscures codebase structure. This is the easiest high-impact improvement with zero risk of breaking functionality.
  - Files: GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, REFACTORING_PLAN.md, TEST_GENERATION_ENHANCEMENT_PLAN.md, README.md, shadow-watch-1.0.0.vsix, shadow-watch.vsix
- **Unify Duplicate Analyzer Implementations**: Merge src/analyzer.ts (650 lines) and src/analysis/enhancedAnalyzer.ts (871 lines) into single unified implementation at src/analysis/codeAnalyzer.ts. Having two analyzers creates confusion about which to use, duplicates maintenance effort, and risks inconsistent analysis results. Identify unique features in each analyzer, consolidate them, and create feature flags for optional analysis features. Update all references in src/analysisViewer.ts and src/extension.ts. **Rationale**: Duplicate implementations are maintenance burden and source of bugs. Unification provides single source of truth for analysis logic and enables consistent behavior across all analysis features.
  - Files: src/analyzer.ts, src/analysis/enhancedAnalyzer.ts, src/analysisViewer.ts, src/extension.ts
  - Functions: Analyzer, EnhancedAnalyzer, analyzeFile, analyzeWorkspace
- **Refactor Massive Viewer Components**: Decompose src/insightsTreeView.ts (1006 lines), src/insightsViewer.ts (778 lines), and src/productNavigator.ts (1094 lines) using presenter pattern. Separate presentation logic (data transformation), templates (HTML generation), and view orchestration into distinct classes. Move data fetching to application services and state management to dedicated state classes. Each class should have <300 lines and single responsibility. **Rationale**: These components violate Single Responsibility Principle by mixing presentation, business logic, data access, and state management. Refactoring enables independent testing of each concern and makes the UI layer maintainable as features grow.
  - Files: src/insightsTreeView.ts, src/insightsViewer.ts, src/productNavigator.ts, src/ui/webview/webviewTemplateEngine.ts
  - Functions: InsightsTreeProvider, InsightsViewer, ProductNavigator
- **Implement Error Boundaries and Domain Errors**: Create src/domain/errors/ with domain-specific error classes and implement error boundary pattern that transforms infrastructure errors at layer boundaries. Add error transformation utilities to src/utils/errorHandler.ts. Wrap infrastructure errors (AI provider errors, network failures, file system errors) into domain errors with user-friendly messages. Implement recovery strategies (retry, fallback, graceful degradation) at application layer. Update all command handlers in src/extension.ts to use error boundaries. **Rationale**: Current error handling allows raw infrastructure errors to reach UI layer, causing poor user experience. Error boundaries improve reliability, provide helpful error messages, and enable recovery strategies. Essential for production-quality extension with external dependencies.
  - Files: src/utils/errorHandler.ts, src/domain/errors/, src/ai/providers/anthropicProvider.ts, src/ai/providers/openAIProvider.ts, src/extension.ts, src/domain/bootstrap/commandRegistry.ts
  - Functions: ErrorHandler, AnthropicProvider, OpenAIProvider, activate, registerCommands

---

## LLM Refactoring Prompt

```
You are refactoring a VS Code extension called Shadow Watch that provides AI-powered code architecture analysis. The codebase has two main issues: (1) monolithic service classes that violate Single Responsibility Principle, and (2) inconsistent file organization that obscures architectural layers.

## Current Architecture Problems

**God Objects**: `src/llmService.ts` (2321 lines, 97 functions) and `src/llmIntegration.ts` (2246 lines, 158 functions) handle multiple responsibilities including API communication, response parsing, state management, formatting, rate limiting, retry logic, caching, and error handling. This makes them untestable and impossible to extend without modifying existing code.

**Circular Dependencies**: LLM services have circular imports creating a tangled dependency graph. `llmService.ts` imports from `llmIntegration.ts`, while `llmIntegration.ts` imports from `llmService.ts`. `llmResponseParser.ts` imports from both `fileDocumentation` and `llmService`.

**Duplicate Analyzers**: Two separate analysis implementations exist: `src/analyzer.ts` (650 lines) and `src/analysis/enhancedAnalyzer.ts` (871 lines) with no clear migration path.

**Massive Viewer Components**: UI components like `insightsTreeView.ts` (1006 lines), `insightsViewer.ts` (778 lines), and `productNavigator.ts` (1094 lines) mix presentation logic, data fetching, state management, and HTML generation.

**Inconsistent Organization**: Services scattered across `src/`, `src/domain/services/`, `src/infrastructure/`, and `src/ai/` with no clear layering. Root directory cluttered with 15 files including 7 markdown docs and 2 VSIX packages.

## Target Architecture

Implement Clean Architecture with clear layer separation:

**Presentation Layer** (`src/ui/`):
- `views/` - View orchestration only, delegates to presenters
- `presenters/` - Data transformation for display
- `templates/` - HTML generation
- `webview/` - Webview infrastructure

**Application Layer** (`src/application/`):
- `services/` - Orchestration services that coordinate between domain and infrastructure

**Domain Layer** (`src/domain/`):
- `interfaces/` - Layer contracts (ILLMService, IAnalysisService)
- `models/` - Domain entities (AnalysisResult, Insight, Issue)
- `errors/` - Domain-specific errors
- `services/` - Domain business logic
- `prompts/` - Prompt building (keep existing)
- `formatters/` - Output formatting (keep existing)
- `handlers/` - Event handlers (keep existing)
- `bootstrap/` - Initialization (keep existing)

**Infrastructure Layer** (`src/infrastructure/`):
- `ai/` - AI provider implementations, rate limiting, retry logic, response parsing
- `persistence/` - Data storage and repositories
- `services/` - Infrastructure services like progress notifications
- `cache/` - Caching implementations

**Cross-Cutting** (`src/`):
- `config/` - Configuration management
- `utils/` - General utilities
- `context/` - Context builders
- `state/` - Application state

## Refactoring Steps

### Step 1: Define Layer Interfaces
Create `src/domain/interfaces/` with:
- `ILLMService.ts` - Interface for LLM operations
- `ILLMProvider.ts` - Interface for AI providers (already exists, move here)
- `IAnalysisService.ts` - Interface for code analysis
- `IConfigurationService.ts` - Interface for configuration

### Step 2: Decompose LLMService
Break down `src/llmService.ts` into:
- `src/infrastructure/ai/llmApiService.ts` - Raw API communication only
- `src/infrastructure/ai/rateLimiter.ts` - Move from `src/ai/llmRateLimiter.ts`
- `src/infrastructure/ai/retryHandler.ts` - Move from `src/ai/llmRetryHandler.ts`
- `src/infrastructure/ai/responseParser.ts` - Move from `src/ai/llmResponseParser.ts`
- `src/application/services/llmOrchestrator.ts` - Coordinates the above services
- `src/state/llmStateManager.ts` - Already exists, keep for state management

### Step 3: Decompose LLMIntegration
Break down `src/llmIntegration.ts` into focused services based on responsibilities. Extract distinct features into separate application services.

### Step 4: Unify Analyzers
Merge `src/analyzer.ts` and `src/analysis/enhancedAnalyzer.ts` into:
- `src/analysis/codeAnalyzer.ts` - Unified analyzer
- `src/analysis/staticAnalyzer.ts` - Static analysis features
- `src/analysis/astParser.ts` - AST parsing utilities

### Step 5: Refactor Viewer Components
For each viewer (`insightsTreeView.ts`, `insightsViewer.ts`, `productNavigator.ts`):
- Create presenter in `src/ui/presenters/`
- Create template in `src/ui/templates/`
- Move view orchestration to `src/ui/views/`
- Move data fetching to application services

### Step 6: Implement Error Boundaries
Create `src/domain/errors/` with:
- `analysisError.ts`
- `configurationError.ts`
- `aiProviderError.ts`
Wrap infrastructure errors at layer boundaries with domain errors.

### Step 7: Reorganize Files
- Move docs to `docs/`
- Move VSIX to `dist/releases/`
- Reorganize services into application/domain/infrastructure layers
- Move AI utilities to `src/infrastructure/ai/`

## Constraints

- This is a VS Code extension - maintain single entry point at `src/extension.ts`
- Preserve all existing functionality - this is a refactoring, not a rewrite
- Use dependency injection in `src/domain/bootstrap/extensionBootstrapper.ts`
- Keep existing provider abstraction (`src/ai/providers/`) - it works well
- Maintain backward compatibility with cached data
- Follow VS Code extension best practices
- Each class should be <300 lines with <10 public methods
- Use TypeScript interfaces for layer boundaries
- Apply dependency inversion - high-level modules depend on abstractions

## Success Criteria

- All services <300 lines with single responsibility
- No circular dependencies
- Clear layer separation with dependencies flowing inward
- All existing functionality preserved
- All tests passing
- Extension activates and runs without errors
- Performance maintained or improved through better caching

Start with Step 1 (define interfaces) and proceed incrementally. After each step, ensure tests pass and the extension still works.
```
