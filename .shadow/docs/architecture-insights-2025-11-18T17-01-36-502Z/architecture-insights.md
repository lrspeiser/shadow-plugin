# AI Architecture Insights

*Generated: 11/18/2025, 9:08:30 AM (2025-11-18 17:08:30 UTC)*

---

## Overall Architecture Assessment

Shadow Watch exhibits a **layered monolithic architecture** that appropriately supports its mission as a VS Code extension providing continuous AI-powered code analysis. The architecture demonstrates intentional design decisions aligned with its core goals: multi-interface presentation (sidebar tree view, webview panels, inline diagnostics) for different information consumption patterns, provider-agnostic AI integration supporting OpenAI/Anthropic/custom endpoints, and file-watching with incremental caching for real-time feedback without blocking development workflow.

However, the codebase shows **architectural drift** from its original domain-driven design intentions. While there are clear domain-driven directories (src/domain/bootstrap, src/domain/handlers, src/domain/prompts), the majority of business logic resides in large files at src/ root level (llmService.ts: 2,107 lines, llmIntegration.ts: 1,827 lines), creating a hybrid architecture where some modules follow DDD principles while core services remain monolithic. The presentation layer is well-distributed across multiple view components (analysisViewer, insightsViewer, insightsTreeView, productNavigator, staticAnalysisViewer, unitTestsNavigator), effectively supporting diverse developer workflows. The infrastructure layer shows partial organization with dedicated directories for AI providers, configuration, state management, and storage, but critical cross-cutting concerns like the LLM orchestration layer remain entangled with business logic.

**Critical architectural tension:** The codebase architecture serves a single product (VS Code extension) with a single entry point (./dist/extension.js), yet exhibits organizational patterns suggesting preparation for multi-product expansion or library extraction that hasn't materialized. Domain-driven directories and abstraction layers exist alongside monolithic service files, creating inconsistent patterns where some modules follow clean architecture principles while others remain tightly coupled. The 14 root-level files (including 5 markdown documentation files, 2 VSIX packages, webpack config) indicate incomplete folder organization, while 3 orphaned files suggest either work-in-progress features or unused abstractions. The architecture successfully delivers on its core promise of AI-integrated static analysis with minimal friction, but would benefit from completing its evolution toward either full domain-driven organization or consolidating around a pragmatic layered monolith pattern.

## Strengths

- **Provider-Agnostic AI Abstraction**: Clean separation of AI provider implementations (src/ai/providers/) with factory pattern (providerFactory.ts) and interface-based contracts (ILLMProvider.ts). This architectural decision directly supports the product goal of working with OpenAI, Anthropic, and custom endpoints, enabling users to choose AI services based on organizational access, budget, or preference without code changes.
- **Multi-Interface Presentation Layer**: Well-distributed view components (analysisViewer, insightsViewer, insightsTreeView, productNavigator, staticAnalysisViewer, unitTestsNavigator) supporting different information consumption patterns. This aligns with the product goal of providing quick overview in sidebar during navigation, detailed reports in webviews for deep analysis, and inline diagnostics for immediate feedback while editing.
- **Incremental Analysis Architecture**: Dedicated services for file watching (src/domain/services/fileWatcherService.ts) and incremental analysis (incrementalAnalysisService.ts) with caching layer (cache.ts), supporting the product goal of real-time feedback on save without re-analyzing unchanged files. This enables continuous monitoring without blocking development workflow in large codebases.
- **LLM Response Handling Infrastructure**: Dedicated modules for rate limiting (llmRateLimiter.ts), retry logic (llmRetryHandler.ts), response parsing (llmResponseParser.ts), and state management (llmStateManager.ts). This layered approach to LLM integration provides robustness for the product's core differentiator: connecting static analysis to AI assistants.
- **Schema-Driven AI Validation**: JSON schema definitions (llmSchemas.ts) for validating AI-generated documentation and insights. This ensures structured, reliable responses from AI providers, preventing parsing errors that would break the user experience when displaying AI-generated content.
- **Formatter Abstraction Layer**: Separate formatter modules (llmFormatter.ts, documentationFormatter.ts) for provider-specific prompt templates. This supports the product goal of generating prompts optimized for different AI assistants (Cursor, ChatGPT, Claude) to increase likelihood of useful refactoring guidance.

## Issues & Concerns

- **Business Logic Concentrated in Monolithic Service Files**: Core business logic concentrated in two massive files: llmService.ts (2,107 lines, 87 functions) and llmIntegration.ts (1,827 lines, 146 functions). These files contain mixed responsibilities including LLM orchestration, prompt building, response handling, caching logic, state management, and business rules. This violates single responsibility principle and makes the codebase difficult to test, maintain, and extend. **Proposed Fix**: Decompose these monolithic services into focused domain services organized by responsibility. Create src/domain/services/llmOrchestrationService.ts for coordinating LLM calls, src/domain/services/promptGenerationService.ts for prompt construction logic, src/domain/services/responseProcessingService.ts for handling AI responses, and src/domain/services/cacheManagementService.ts for caching strategies. Move business rules to domain model classes. Each service should have < 500 lines and a single clear responsibility. Extract shared utilities to src/utils/. Update existing references to use the new focused services.
  - Files: src/llmService.ts, src/llmIntegration.ts
  - Functions: llmService (entire module), llmIntegration (entire module)
- **Inconsistent Domain-Driven Design Implementation**: The codebase shows partial DDD adoption with domain directories (src/domain/bootstrap/, src/domain/handlers/, src/domain/prompts/, src/domain/services/) coexisting with large service files at src/ root. This creates architectural inconsistency where some modules follow clean architecture with clear domain separation, while core business logic remains in monolithic services outside the domain layer. Developers cannot predict where to find business logic (domain layer vs root services) or where to add new features. **Proposed Fix**: Complete DDD migration by moving all business logic into src/domain/ with clear layer boundaries. Create src/domain/models/ for domain entities, src/domain/services/ for domain services (move llmService, llmIntegration logic here), src/domain/repositories/ for data access abstractions, and src/domain/valueObjects/ for domain value types. Keep src/ root for infrastructure concerns (extension.ts entry point, infrastructure adapters). Establish dependency rule: domain layer depends on nothing, application services depend on domain, infrastructure depends on both. Document layer boundaries in ARCHITECTURE.md.
  - Files: src/llmService.ts, src/llmIntegration.ts, src/domain/bootstrap/extensionBootstrapper.ts, src/domain/handlers/navigationHandler.ts, src/domain/services/fileWatcherService.ts, src/domain/services/incrementalAnalysisService.ts
- **Analysis Engine Embedded in VS Code Extension**: Core analysis logic (analyzer.ts: 592 lines, 30 functions) is tightly coupled to VS Code extension infrastructure with direct imports of 'vscode' module in multiple analysis-related files. This prevents reuse of the analysis engine in other contexts (CLI tools, CI/CD pipelines, web services) and makes testing difficult since tests require VS Code API mocks. The analysis engine should be an independent library consumed by the VS Code extension adapter. **Proposed Fix**: Extract analysis engine to src/analysis/ as standalone module with zero VS Code dependencies. Create src/analysis/engine/ for core analysis logic, src/analysis/parsers/ for language-specific parsing, src/analysis/detectors/ for issue detection rules. Define abstract interfaces for file system access, logging, and configuration that VS Code extension implements as adapters. Create src/adapters/vscode/ for VS Code-specific implementations (VsCodeFileSystem, VsCodeLogger, VsCodeConfiguration). Extension.ts becomes thin adapter layer that wires analysis engine to VS Code APIs. This enables future CLI tool, API server, or CI/CD integration.
  - Files: src/analyzer.ts, src/analysisViewer.ts, src/insightGenerator.ts, src/fileAccessHelper.ts, src/diagnosticsProvider.ts
  - Functions: analyzer module functions, analysisViewer module functions
- **Circular Dependency Between Cache and Analyzer**: cache.ts imports from analyzer.ts for type definitions, while analyzer.ts imports cache.ts for caching functionality. This creates a circular dependency that complicates module initialization, makes testing harder, and violates dependency principles. The cache should be a pure data structure that doesn't know about analysis domain types. **Proposed Fix**: Introduce src/domain/models/analysisModels.ts defining shared types (AnalysisResult, FileAnalysis, IssueDetails) that both cache and analyzer import. Cache becomes generic data structure accepting any serializable objects. Analyzer depends on domain models and cache, cache depends only on domain models, eliminating circular dependency. Update cache.ts to use generic type parameters: Cache<T> where T extends Serializable. Move analysis-specific cache logic to dedicated AnalysisCache class in src/domain/services/analysisCacheService.ts.
  - Files: src/cache.ts, src/analyzer.ts
  - Functions: cache module functions, analyzer caching functions
- **Root Directory Clutter with Mixed Concerns**: 14 files in root directory including 5 markdown documentation files (GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, REFACTORING_PLAN.md), 2 compiled VSIX packages (shadow-watch-1.0.0.vsix, shadow-watch.vsix), configuration files (package.json, tsconfig.json, webpack.config.js), and README.md. This creates navigation friction and obscures the entry point. Documentation, build artifacts, and configuration serve different purposes and should be organized accordingly. **Proposed Fix**: Create docs/ directory and move all .md files except README.md there (GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, REFACTORING_PLAN.md). Create dist/ or build/ directory for compiled artifacts (move .vsix files there). Create config/ directory for configuration files if they grow (currently keep package.json, tsconfig.json at root as convention). Update package.json references to documentation. Add docs/ to .vscodeignore to exclude from extension package. Root directory should contain only: README.md, LICENSE, package.json, tsconfig.json, webpack.config.js, and top-level directories (src/, scripts/, docs/, dist/).
  - Files: GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, REFACTORING_PLAN.md, shadow-watch-1.0.0.vsix, shadow-watch.vsix
- **Orphaned Infrastructure Components**: Three orphaned files suggest incomplete feature implementation or unused abstractions: src/infrastructure/progressService.ts (139 lines, progress tracking), src/ui/webview/baseWebviewProvider.ts (84 lines, webview base class), and webpack.config.js (37 lines, build config). These files exist but aren't imported by any other module, indicating either work-in-progress features that were never completed, planned abstractions that weren't adopted, or refactoring artifacts that should be cleaned up. **Proposed Fix**: Investigate each orphaned file: (1) progressService.ts - If progress tracking is needed for long-running LLM operations, integrate it into llmService.ts and incrementalAnalysisService.ts with progress callbacks. If not needed, delete it. (2) baseWebviewProvider.ts - If webview abstraction is valuable, refactor existing webview code (webviewTemplateEngine.ts, analysisViewer.ts, insightsViewer.ts) to extend this base class. If existing webviews work well without it, delete it. (3) webpack.config.js - This should be used for builds. Verify package.json build scripts reference it. If not, update build scripts or use it. Document decisions in ARCHITECTURE.md.
  - Files: src/infrastructure/progressService.ts, src/ui/webview/baseWebviewProvider.ts, webpack.config.js
  - Functions: ProgressService, BaseWebviewProvider
- **Presentation Layer Mixed with Business Logic**: Large view files (insightsTreeView.ts: 957 lines, 52 functions; insightsViewer.ts: 778 lines, 33 functions; productNavigator.ts: 1,061 lines, 50 functions) contain both UI rendering logic and business logic for data transformation, filtering, and aggregation. This violates separation of concerns and makes both UI and business logic harder to test and maintain. Presentation components should be thin adapters that delegate to application services. **Proposed Fix**: Extract business logic from view files into application services. Create src/application/services/insightsApplicationService.ts for aggregating and transforming insights data, src/application/services/navigationApplicationService.ts for navigation state management and tree building logic, src/application/services/productDocumentationApplicationService.ts for product documentation operations. View files should only handle VS Code UI API calls (TreeDataProvider, WebviewPanel) and delegate all data operations to application services. Move data transformation functions to domain services. Target: view files < 400 lines, pure presentation logic only.
  - Files: src/insightsTreeView.ts, src/insightsViewer.ts, src/productNavigator.ts, src/staticAnalysisViewer.ts, src/unitTestsNavigator.ts
  - Functions: InsightsTreeView (entire class), InsightsViewer (entire class), ProductNavigator (entire class)
- **Configuration Management Scattered Across Modules**: Configuration access is fragmented with configurationManager.ts providing centralized configuration, but multiple modules directly accessing VS Code configuration API or hardcoding configuration values. This creates inconsistent configuration behavior and makes it difficult to test components with different configurations or add configuration validation. **Proposed Fix**: Establish configurationManager.ts as single source of truth for all configuration access. Prohibit direct imports of vscode.workspace.getConfiguration() outside configurationManager. Add configuration validation in configurationManager with schema definitions and type-safe getters. Inject IConfigurationManager interface into services via dependency injection rather than direct imports. Create src/domain/configuration/configurationSchema.ts defining all configuration options with types, defaults, and validation rules. Update all modules to use configurationManager exclusively. Add configuration change events for reactive updates.
  - Files: src/config/configurationManager.ts, src/ai/providers/anthropicProvider.ts, src/ai/providers/openAIProvider.ts, src/llmService.ts, src/extension.ts
  - Functions: ConfigurationManager, AnthropicProvider, OpenAIProvider
- **Error Handling Strategy Inconsistently Applied**: errorHandler.ts (159 lines) provides centralized error handling utilities, but error handling patterns vary across the codebase with mix of try-catch blocks, error callbacks, promise rejections, and direct throws. Some modules use errorHandler utilities while others implement custom error handling. This creates inconsistent user experience where some errors show helpful messages while others show raw stack traces. **Proposed Fix**: Establish consistent error handling strategy using errorHandler as foundation. Create error hierarchy in src/domain/errors/ with specific error types (LLMProviderError, AnalysisError, ConfigurationError, FileSystemError) extending base ApplicationError. Implement error boundary pattern at module boundaries (extension activation, command handlers, event handlers) that catches all errors and uses errorHandler to present user-friendly messages. Add error recovery strategies (retry for transient failures, fallback for provider failures). Update all modules to throw typed errors and rely on boundary handlers rather than handling inline. Add error telemetry for monitoring error patterns.
  - Files: src/utils/errorHandler.ts, src/llmService.ts, src/llmIntegration.ts, src/ai/providers/anthropicProvider.ts, src/ai/providers/openAIProvider.ts, src/extension.ts
  - Functions: errorHandler module functions
- **Storage Layer Lacks Repository Pattern Abstraction**: incrementalStorage.ts and analysisResultRepository.ts handle persistence but with different patterns and inconsistent abstractions. incrementalStorage.ts uses direct file system operations while analysisResultRepository.ts provides repository-like interface, creating confusion about which storage mechanism to use for new features. No clear abstraction for data access makes it difficult to switch storage backends (e.g., to SQLite for better querying) or add caching strategies. **Proposed Fix**: Implement repository pattern consistently across storage layer. Create src/domain/repositories/ with interface definitions (IAnalysisRepository, IInsightsRepository, IConfigurationRepository). Move analysisResultRepository.ts to src/infrastructure/persistence/repositories/fileSystemAnalysisRepository.ts as concrete implementation. Refactor incrementalStorage.ts into repository implementing IAnalysisRepository. Create repository factory in src/infrastructure/persistence/repositoryFactory.ts for dependency injection. Application services should depend on repository interfaces, not concrete implementations. This enables future storage backend changes (SQLite, IndexedDB) without changing business logic.
  - Files: src/storage/incrementalStorage.ts, src/infrastructure/persistence/analysisResultRepository.ts
  - Functions: IncrementalStorage, AnalysisResultRepository

## Code Organization

The codebase exhibits **mixed organizational maturity** with incomplete evolution from flat structure toward domain-driven design. The src/ directory contains 19 files at root level including massive service files (llmService.ts: 2,107 lines, llmIntegration.ts: 1,827 lines) alongside properly organized subdirectories (src/domain/, src/ai/, src/infrastructure/, src/ui/, src/config/, src/context/, src/state/, src/storage/, src/utils/). This creates navigation friction where developers must check both root and subdirectories to find related functionality. Files at src/ root represent a mix of presentation components (analysisViewer.ts, insightsTreeView.ts, insightsViewer.ts, productNavigator.ts, staticAnalysisViewer.ts, unitTestsNavigator.ts), core services (llmService.ts, llmIntegration.ts, analyzer.ts), utilities (fileAccessHelper.ts, fileDocumentation.ts, logger.ts), and infrastructure (extension.ts, fileWatcher.ts, cache.ts, diagnosticsProvider.ts, insightGenerator.ts, llmFormatter.ts, llmSchemas.ts, unitTestsNavigator.ts).

The **domain layer organization** shows partial DDD adoption: src/domain/bootstrap/ handles extension lifecycle, src/domain/handlers/ contains navigation logic, src/domain/prompts/ manages prompt building, and src/domain/services/ provides file watching and incremental analysis. However, core business logic remains outside the domain layer in root-level service files, creating architectural inconsistency. The **infrastructure layer** demonstrates better organization with src/ai/providers/ containing provider implementations, src/infrastructure/persistence/ for storage, src/config/ for configuration, and src/state/ for state management, though progressService.ts is orphaned. The **presentation layer** is scattered across src/ root with six different view components (each 200-1000 lines) rather than consolidated in src/ui/, with only src/ui/webview/ subdirectory containing webview utilities. **Root directory clutter** is significant with 14 files including 5 markdown documentation files (GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, REFACTORING_PLAN.md) that should be in docs/, 2 compiled VSIX packages (shadow-watch-1.0.0.vsix, shadow-watch.vsix) that should be in dist/ or .gitignored, and standard configuration files (package.json, tsconfig.json, webpack.config.js) appropriate for root but cluttered by documentation and artifacts.

**Layer boundary violations** are evident: presentation components contain business logic (insightsTreeView.ts aggregates and transforms data, productNavigator.ts builds trees and manages state), business logic is split between domain services and root-level files, and infrastructure concerns (caching, file watching, logging) are intermixed with business logic in monolithic service files. The folder structure suggests intent for clean architecture but execution is incomplete, with some modules following DDD principles (domain subdirectories, provider abstraction) while core functionality remains in large, responsibility-mixed files at src/ root. **Missing organizational patterns**: no src/application/ layer for application services (use cases), no src/domain/models/ for domain entities, no src/domain/valueObjects/ for domain value types, no src/adapters/ for external integrations (VS Code, file system), and presentation components scattered rather than consolidated. The architecture would benefit from completing its evolution toward either full layered architecture (presentation, application, domain, infrastructure) or consolidating around pragmatic feature-based modules if clean architecture overhead isn't justified for extension size.

## Entry Points Analysis

Shadow Watch has a **single, appropriate entry point** (./dist/extension.js referenced in package.json main field) as expected for VS Code extensions. This aligns perfectly with the product architecture: VS Code extensions must export activate() and deactivate() functions from their main entry point, and Shadow Watch correctly implements this pattern in src/extension.ts (670 lines, 47 functions) which compiles to dist/extension.js. The extension.ts file serves as the **composition root** handling extension lifecycle, registering commands, initializing services, and setting up the file watcher for continuous monitoring. This single entry point architecture is **intentional and necessary** - VS Code's extension API requires exactly one entry point, and attempting to support multiple entry points (CLI, web service, library) would require extracting the analysis engine as a separate package consumed by multiple applications. The current architecture does not attempt this separation, keeping all functionality within the extension boundary. There are no additional entry points in package.json (no CLI bins, no additional main fields), confirming focused scope as a VS Code extension exclusively. The entry point appropriately delegates to extensionBootstrapper.ts (204 lines) in src/domain/bootstrap/, showing some architectural maturity in separating lifecycle management from core extension logic. **No entry point consolidation needed** - the single entry point is architecturally correct for the product's purpose as a VS Code-exclusive developer tool.

## Orphaned Files Analysis

Three orphaned files suggest **incomplete features or unused abstractions**: (1) **src/infrastructure/progressService.ts** (139 lines) - Implements progress tracking for long-running operations with VS Code progress API integration, but never imported by LLM services or analysis operations that would benefit from progress indication. This suggests either planned UX improvement that wasn't completed, or experimentation with progress tracking that wasn't adopted. Given that LLM analysis can take 10-30 seconds, progress tracking would improve user experience. (2) **src/ui/webview/baseWebviewProvider.ts** (84 lines) - Defines abstract base class for webview providers with common setup logic, but existing webview implementations (analysisViewer.ts, insightsViewer.ts) don't extend it. This indicates attempted refactoring to reduce duplication in webview code that wasn't completed. The base class implements VS Code webview boilerplate, which existing viewers duplicate. (3) **webpack.config.js** (37 lines) - Build configuration file that should be essential, but orphaned status suggests build process might not use it. This is concerning as the extension must bundle dependencies. Likely false positive from analysis tool limitations, but warrants verification that build scripts in package.json reference it. **Recommendation**: Investigate each file's purpose and either integrate (progressService into LLM operations, baseWebviewProvider as parent class for viewers) or delete if experiments failed. The orphaned status indicates incomplete architectural improvements that should be completed or cleaned up.

## Folder Reorganization Suggestions

**Immediate Actions (High Impact, Low Risk):**

1. **Organize Documentation** - Move documentation files from root to docs/:
   - Move: GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, REFACTORING_PLAN.md → docs/
   - Keep README.md at root (standard convention)
   - Update package.json repository.url references if needed
   - Add docs/ to .vscodeignore to exclude from extension package
   - Impact: Significantly improves root directory navigation, standard practice

2. **Handle Build Artifacts** - Remove or relocate compiled packages:
   - Move: shadow-watch-1.0.0.vsix, shadow-watch.vsix → dist/ or remove from repository entirely
   - Add *.vsix to .gitignore (build artifacts shouldn't be version controlled)
   - Update build scripts to output to dist/
   - Impact: Reduces repository size, prevents artifact confusion

3. **Consolidate Presentation Layer** - Move scattered view components to src/ui/:
   - Move: src/analysisViewer.ts, src/insightsTreeView.ts, src/insightsViewer.ts, src/productNavigator.ts, src/staticAnalysisViewer.ts, src/unitTestsNavigator.ts → src/ui/viewers/
   - Keep src/ui/webview/ for webview utilities
   - Update imports across codebase
   - Impact: Clear separation of presentation from business logic, easier navigation

**Medium-Term Refactoring (Requires Code Changes):**

4. **Establish Application Services Layer** - Create src/application/ for use cases:
   - Create: src/application/services/analysisApplicationService.ts (orchestrates analysis operations)
   - Create: src/application/services/insightsApplicationService.ts (aggregates insights data)
   - Create: src/application/services/llmApplicationService.ts (coordinates LLM operations)
   - Create: src/application/services/navigationApplicationService.ts (manages navigation state)
   - Extract business logic from presentation components and root services into application services
   - Impact: Separates orchestration from domain logic and presentation

5. **Complete Domain Layer Organization** - Move business logic into src/domain/:
   - Create: src/domain/models/ (domain entities like AnalysisResult, Issue, Insight)
   - Create: src/domain/valueObjects/ (value types like Severity, Language, FileType)
   - Create: src/domain/repositories/ (interfaces like IAnalysisRepository, IInsightsRepository)
   - Move and decompose: src/llmService.ts, src/llmIntegration.ts → src/domain/services/ (split into focused services < 500 lines each)
   - Move: src/analyzer.ts → src/domain/services/codeAnalysisService.ts
   - Impact: Completes DDD architecture, establishes clear layer boundaries

6. **Organize Infrastructure Layer** - Consolidate infrastructure concerns:
   - Create: src/infrastructure/adapters/ (VS Code adapters, file system, logging)
   - Move: src/fileAccessHelper.ts → src/infrastructure/adapters/fileSystemAdapter.ts
   - Move: src/logger.ts → src/infrastructure/adapters/loggingAdapter.ts
   - Move: src/cache.ts → src/infrastructure/caching/
   - Create: src/infrastructure/repositories/ (concrete repository implementations)
   - Move: src/storage/incrementalStorage.ts, src/infrastructure/persistence/analysisResultRepository.ts → src/infrastructure/repositories/
   - Impact: Clear separation of infrastructure from domain, enables testing with mocks

7. **Extract Analysis Engine** - Separate core analysis from VS Code coupling:
   - Create: src/analysis/ (standalone analysis engine, zero VS Code dependencies)
   - Create: src/analysis/engine/ (core analysis logic)
   - Create: src/analysis/parsers/ (language-specific parsing)
   - Create: src/analysis/detectors/ (issue detection rules)
   - Move: src/analyzer.ts logic → src/analysis/engine/
   - Move: src/insightGenerator.ts → src/analysis/engine/insightGenerator.ts
   - Define: src/analysis/interfaces/ (IFileSystem, ILogger, IConfiguration abstractions)
   - Create: src/infrastructure/adapters/vscode/ (VS Code implementations of analysis interfaces)
   - Impact: Enables reuse in CLI, CI/CD, testing without VS Code mocks

**Final Target Structure:**
```
shadow-watch/
├── README.md
├── LICENSE
├── package.json
├── tsconfig.json
├── webpack.config.js
├── .gitignore (add *.vsix, dist/)
├── .vscodeignore (add docs/)
├── docs/
│   ├── GET_STARTED.md
│   ├── IMPLEMENTATION_GUIDE.md
│   ├── MENU_STRUCTURE.md
│   ├── PLUGIN_DESIGN.md
│   ├── QUICK_START.md
│   ├── REFACTORING_PLAN.md
│   └── ARCHITECTURE.md (new, document layer boundaries)
├── dist/ (compiled output, .gitignored)
├── images/
├── scripts/
└── src/
    ├── extension.ts (entry point, thin adapter)
    ├── analysis/ (standalone analysis engine)
    │   ├── engine/
    │   ├── parsers/
    │   ├── detectors/
    │   └── interfaces/
    ├── application/ (use cases, application services)
    │   └── services/
    ├── domain/ (business logic, domain models)
    │   ├── models/
    │   ├── valueObjects/
    │   ├── services/
    │   ├── repositories/ (interfaces)
    │   ├── prompts/
    │   ├── handlers/
    │   └── bootstrap/
    ├── infrastructure/ (external concerns)
    │   ├── adapters/
    │   │   └── vscode/
    │   ├── repositories/ (concrete implementations)
    │   ├── persistence/
    │   ├── caching/
    │   └── ai/ (rename from src/ai/)
    │       └── providers/
    ├── ui/ (presentation layer)
    │   ├── viewers/
    │   └── webview/
    ├── config/
    ├── context/
    └── utils/
```

**Migration Strategy:**
- Phase 1 (1-2 hours): Documentation and artifact organization (items 1-2)
- Phase 2 (4-6 hours): Presentation layer consolidation (item 3)
- Phase 3 (1-2 weeks): Application and domain layer refactoring (items 4-5)
- Phase 4 (1-2 weeks): Infrastructure organization and analysis engine extraction (items 6-7)

Each phase deliverable maintains working extension, enabling incremental delivery.

## Recommendations

- **Complete Domain-Driven Design Migration**: **If you want to support future expansion beyond VS Code extension** (CLI tool, CI/CD integration, web service, or library extraction): Complete the DDD migration by establishing clear layer boundaries with domain (business logic), application (use cases), infrastructure (external concerns), and presentation (UI) layers. Move all business logic from src/ root into src/domain/, create src/application/ for orchestration services, and ensure domain layer has zero dependencies on infrastructure (VS Code, file system, external APIs). This architecture enables extracting the analysis engine as standalone package consumed by multiple applications. **Rationale**: Current partial DDD adoption creates confusion about where to add features. Completing the migration provides clear architectural boundaries, makes testing easier (domain logic testable without VS Code mocks), and enables reuse of core analysis engine in contexts beyond VS Code.

**If you want to maintain focus as VS Code-exclusive extension with simpler architecture**: Consolidate around pragmatic layered monolith by moving all files from src/ root into feature-based directories (src/analysis/, src/llm/, src/viewers/), remove domain/ subdirectories that add unnecessary abstraction overhead, and embrace VS Code coupling since extraction isn't a goal. This reduces architectural complexity while maintaining clear organization. **Rationale**: DDD overhead may not be justified for single-product extension. Feature-based organization (src/analysis/, src/llm/, src/ui/) provides clarity without clean architecture tax.
  - Files: src/llmService.ts, src/llmIntegration.ts, src/analyzer.ts, src/domain/bootstrap/extensionBootstrapper.ts, src/domain/services/fileWatcherService.ts
- **Implement Comprehensive Progress Tracking**: **If you want to improve user experience during long-running AI analysis operations** (which currently can take 10-30 seconds with no feedback): Integrate progressService.ts throughout LLM operations and static analysis. Add progress indicators in llmService.ts for AI provider calls, incrementalAnalysisService.ts for workspace analysis, and insightsViewer.ts for documentation generation. Implement cancellation support for long operations. **Rationale**: Users currently experience black-box delays during AI analysis with no indication of progress or ability to cancel. Progress tracking significantly improves perceived performance and gives users control.

**If current UX is acceptable and you want to minimize complexity**: Remove unused progressService.ts to reduce maintenance burden. Document decision that progress tracking added insufficient value to justify implementation cost. **Rationale**: Progress tracking adds code complexity and testing surface. If users aren't complaining about delays, the simplicity benefit may outweigh UX improvement.
  - Files: src/infrastructure/progressService.ts, src/llmService.ts, src/llmIntegration.ts, src/domain/services/incrementalAnalysisService.ts
  - Functions: ProgressService, llmService analysis functions, incrementalAnalysisService functions
- **Standardize Webview Implementation Pattern**: **If you want to reduce code duplication and improve consistency across webview panels**: Refactor existing webview implementations (analysisViewer.ts, insightsViewer.ts) to extend baseWebviewProvider.ts. Extract common webview setup, message handling, and lifecycle management into base class. Create specialized subclasses that implement only view-specific rendering and behavior. **Rationale**: Current webview implementations duplicate 100+ lines of boilerplate for VS Code webview API setup, event handling, and resource management. Base class eliminates duplication and ensures consistent patterns.

**If webview implementations are stable and working well**: Remove unused baseWebviewProvider.ts since attempted refactoring wasn't completed. Keep existing webview implementations as-is to avoid refactoring risk. **Rationale**: If existing webviews work reliably and don't need frequent changes, the refactoring cost may exceed duplication maintenance cost. Simpler to delete unused abstraction.
  - Files: src/ui/webview/baseWebviewProvider.ts, src/analysisViewer.ts, src/insightsViewer.ts
  - Functions: BaseWebviewProvider, AnalysisViewer, InsightsViewer
- **Introduce Repository Pattern for Storage Layer**: **If you want flexibility to change storage backend in the future** (e.g., switch from file system to SQLite for better querying, add cloud sync, or implement IndexedDB for web extension): Implement repository pattern with interfaces (IAnalysisRepository, IInsightsRepository) in src/domain/repositories/ and concrete implementations (FileSystemAnalysisRepository) in src/infrastructure/repositories/. Application services depend on repository interfaces, not concrete storage implementations. Use factory pattern for repository instantiation. **Rationale**: Current direct file system access in incrementalStorage.ts and analysisResultRepository.ts makes it difficult to change storage strategies. Repository abstraction enables switching backends without changing business logic, supports easier testing with mock repositories, and aligns with DDD patterns.

**If file system storage is sufficient and unlikely to change**: Keep current storage implementation as-is but consolidate incrementalStorage.ts and analysisResultRepository.ts into single storage module to eliminate duplication. Accept file system coupling to reduce abstraction overhead. **Rationale**: Repository pattern adds interfaces and indirection that may not be justified if storage requirements are simple and stable. Direct file system access is simpler to understand and maintain.
  - Files: src/storage/incrementalStorage.ts, src/infrastructure/persistence/analysisResultRepository.ts
  - Functions: IncrementalStorage, AnalysisResultRepository
- **Extract Analysis Engine as Standalone Library**: **If you plan to offer Shadow Watch capabilities in multiple contexts** (VS Code extension, CLI tool for CI/CD, web service API, or library for other tools): Extract core analysis engine from src/analyzer.ts into standalone package with zero VS Code dependencies. Define abstract interfaces (IFileSystem, ILogger, IConfiguration) that different environments implement. Create src/adapters/vscode/ for VS Code-specific implementations. Package analysis engine separately, consumed by VS Code extension as dependency. **Rationale**: Current tight coupling to VS Code (direct vscode module imports) prevents reuse in other contexts. Extraction enables offering Shadow Watch analysis in CI/CD pipelines, standalone CLI, or as library other tools integrate. Significantly expands market reach beyond VS Code users.

**If Shadow Watch will remain exclusively a VS Code extension**: Keep current architecture with VS Code coupling. Remove abstraction overhead and embrace direct use of VS Code APIs throughout codebase. This reduces complexity and maintenance burden. **Rationale**: If VS Code is the only target and will remain so, abstracting away VS Code adds no value and only complicates the codebase. Direct API usage is simpler and more efficient.
  - Files: src/analyzer.ts, src/insightGenerator.ts, src/fileAccessHelper.ts, src/extension.ts
  - Functions: analyzer module functions, insightGenerator module functions
- **Decompose Monolithic LLM Services**: **If you want to improve maintainability, testability, and support multiple developers working on LLM features concurrently**: Break down llmService.ts (2,107 lines) and llmIntegration.ts (1,827 lines) into focused services with single responsibilities: LLMOrchestrationService (coordinates AI calls), PromptGenerationService (builds prompts), ResponseProcessingService (handles AI responses), CacheManagementService (caching strategies). Target < 500 lines per service. Extract shared logic to utilities. **Rationale**: Current monolithic services are difficult to test (87-146 functions per file), hard to understand (mixed responsibilities), and create merge conflicts when multiple developers work on LLM features. Decomposition enables parallel development, focused testing, and clearer responsibilities.

**If you have solo developer or small team and current structure is manageable**: Keep monolithic services but add clear internal section comments and extract complex functions to separate files as utilities. Avoid large-scale refactoring overhead. **Rationale**: For solo developer, navigation within large files may be easier than navigating many small files. Refactoring cost may exceed benefit if current structure isn't causing actual problems.
  - Files: src/llmService.ts, src/llmIntegration.ts
  - Functions: llmService module (87 functions), llmIntegration module (146 functions)
- **Implement Consistent Error Handling Strategy**: **If you want to provide consistent, user-friendly error experience across all features**: Establish error hierarchy (LLMProviderError, AnalysisError, ConfigurationError) in src/domain/errors/, implement error boundary pattern at module boundaries (extension activation, command handlers, event handlers), add error recovery strategies (retry for transient failures, fallback for provider failures), and use errorHandler.ts consistently for user-facing messages. Add error telemetry for monitoring. **Rationale**: Current mixed error handling (some modules use errorHandler, others throw raw errors) creates inconsistent UX where some failures show helpful messages while others show stack traces. Systematic approach improves reliability and user experience.

**If current error handling is adequate for user needs**: Keep current mixed approach, focusing error handling improvements only on user-reported pain points. Avoid systematic refactoring of working error handling. **Rationale**: If users aren't experiencing error handling problems, systematic refactoring adds cost without clear benefit. Reactive improvements may be more cost-effective.
  - Files: src/utils/errorHandler.ts, src/llmService.ts, src/llmIntegration.ts, src/extension.ts, src/ai/providers/anthropicProvider.ts, src/ai/providers/openAIProvider.ts
  - Functions: errorHandler module functions

## Refactoring Priorities

- **Organize Root Directory Documentation and Artifacts**: Move 5 markdown files from root to docs/ directory (GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, REFACTORING_PLAN.md) and handle 2 VSIX packages (shadow-watch-1.0.0.vsix, shadow-watch.vsix) by moving to dist/ or adding to .gitignore. Keep only README.md, LICENSE, and configuration files at root. **Rationale**: High impact on navigation and project clarity with minimal risk. Standard practice across open source projects. Improves first impression for new contributors. Can be completed in 1-2 hours without code changes.
  - Files: GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, REFACTORING_PLAN.md, shadow-watch-1.0.0.vsix, shadow-watch.vsix
- **Decompose Monolithic LLM Service Files**: Break down llmService.ts (2,107 lines, 87 functions) and llmIntegration.ts (1,827 lines, 146 functions) into focused domain services with single responsibilities: LLMOrchestrationService, PromptGenerationService, ResponseProcessingService, CacheManagementService. Target < 500 lines per service. Extract business rules to domain models. **Rationale**: These files are the largest technical debt items (4,000+ combined lines), contain mixed responsibilities making testing difficult, and create bottlenecks for parallel development. Decomposition significantly improves maintainability, testability, and enables team scaling. Medium risk since LLM integration is core functionality requiring careful refactoring with comprehensive test coverage.
  - Files: src/llmService.ts, src/llmIntegration.ts
  - Functions: llmService module (87 functions), llmIntegration module (146 functions)
- **Consolidate Presentation Layer in UI Directory**: Move scattered view components from src/ root to src/ui/viewers/: analysisViewer.ts, insightsTreeView.ts (957 lines), insightsViewer.ts (778 lines), productNavigator.ts (1,061 lines), staticAnalysisViewer.ts, unitTestsNavigator.ts (6 files, 4,000+ combined lines). Extract business logic from these files into application services, making view components thin adapters that handle only VS Code UI APIs. **Rationale**: Presentation layer scattered across root creates confusion about layer boundaries. Consolidation plus business logic extraction significantly improves architecture clarity, testability, and aligns with the partial DDD structure already present. Medium risk requiring import updates and business logic extraction, but high value for maintainability.
  - Files: src/analysisViewer.ts, src/insightsTreeView.ts, src/insightsViewer.ts, src/productNavigator.ts, src/staticAnalysisViewer.ts, src/unitTestsNavigator.ts
  - Functions: AnalysisViewer class, InsightsTreeView class, InsightsViewer class, ProductNavigator class, StaticAnalysisViewer class, UnitTestsNavigator class
- **Resolve Circular Dependency Between Cache and Analyzer**: Eliminate circular dependency where cache.ts imports analyzer.ts for types while analyzer.ts imports cache.ts for functionality. Introduce src/domain/models/analysisModels.ts with shared types (AnalysisResult, FileAnalysis, IssueDetails) that both modules import. Make cache generic: Cache<T> where T extends Serializable. Move analysis-specific cache logic to src/domain/services/analysisCacheService.ts. **Rationale**: Circular dependencies complicate module initialization, make testing harder, and violate clean architecture principles. Resolution is relatively low risk (primarily moving types and adding generic parameters) but high value for architecture quality and maintainability. Enables independent testing of cache and analyzer modules.
  - Files: src/cache.ts, src/analyzer.ts
  - Functions: cache module functions, analyzer caching functions
- **Investigate and Resolve Orphaned Infrastructure Files**: Determine fate of 3 orphaned files: (1) progressService.ts - integrate into LLM operations for UX improvement or delete if not needed, (2) baseWebviewProvider.ts - refactor existing webviews to extend it or delete if abstraction failed, (3) webpack.config.js - verify build scripts reference it or fix build configuration. Document decisions in ARCHITECTURE.md. **Rationale**: Orphaned files indicate incomplete features or failed abstractions. Resolution provides closure on planned improvements (progress tracking would improve UX, webview base class would reduce duplication) or cleanup of dead code. Low risk investigation task with clear decision points. Quick wins either by completing features or simplifying codebase by removing unused code.
  - Files: src/infrastructure/progressService.ts, src/ui/webview/baseWebviewProvider.ts, webpack.config.js
  - Functions: ProgressService class, BaseWebviewProvider class

---

## LLM Refactoring Prompt

```
You are refactoring a VS Code extension codebase (Shadow Watch - AI-powered code quality monitoring) that shows architectural drift from intended domain-driven design toward monolithic services. The extension provides continuous static analysis with AI-powered insights, supporting multiple LLM providers (OpenAI, Anthropic, custom), multi-language analysis (Python, JavaScript, TypeScript, Java, Go, Rust, C/C++, Ruby, PHP), and multiple viewing modes (sidebar tree, webviews, inline diagnostics). Core issues: (1) Business logic concentrated in two massive files (llmService.ts: 2,107 lines, llmIntegration.ts: 1,827 lines) mixing orchestration, prompt building, caching, and business rules, (2) Partial DDD adoption with domain directories (src/domain/bootstrap, src/domain/handlers, src/domain/prompts, src/domain/services) alongside monolithic root-level services creating inconsistent patterns, (3) Presentation layer scattered across src/ root (6 view components, 4,000+ lines) with business logic mixed into UI code, (4) Circular dependency between cache.ts and analyzer.ts, (5) Root directory clutter with 14 files including 5 markdown docs and 2 VSIX packages, (6) Three orphaned files (progressService.ts, baseWebviewProvider.ts, webpack.config.js) indicating incomplete features. Refactoring priorities: (1) Organize root directory by moving docs to docs/, (2) Decompose monolithic services into focused domain services (<500 lines each), (3) Consolidate presentation layer in src/ui/viewers/ and extract business logic to application services, (4) Resolve circular dependency with shared domain models, (5) Complete DDD migration or simplify to pragmatic layered architecture. Target architecture: Clear layer boundaries (domain, application, infrastructure, presentation), independent testability, potential for future CLI/library extraction. Constraints: Must maintain VS Code extension structure with single entry point, preserve all existing functionality including multi-provider LLM support and multi-language analysis, keep incremental analysis and caching for performance. Provide specific refactoring steps with file moves, function extractions, and architectural boundary definitions.
```
