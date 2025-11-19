# AI Architecture Insights

*Generated: 11/18/2025, 10:26:08 PM (2025-11-19 06:26:08 UTC)*

---

## Overall Architecture Assessment

Shadow Watch exhibits a **hybrid monolithic-modular architecture** that reflects its evolution from a simpler VS Code extension into a more sophisticated AI-powered analysis platform. The codebase demonstrates clear intent toward domain-driven design with organized layers (domain/, infrastructure/, ui/), but suffers from **incomplete migration** where legacy monolithic components (llmService.ts at 2,904 lines, llmIntegration.ts at 2,637 lines) coexist with newer modular structures. The architecture effectively serves its core mission of continuous code monitoring and AI-assisted development through tight VS Code integration, but the current organization creates maintenance challenges and obscures the separation between static analysis, AI integration, and presentation concerns.

The product's architecture rationale—single VS Code entry point with modular internal components—is fundamentally sound for its use case. However, the implementation reveals **architectural debt** where responsibilities are scattered across layers: AI provider logic exists in both src/ai/providers/ (clean abstraction) and src/llmService.ts (monolithic implementation), while analysis logic spans src/analyzer.ts, src/analysis/enhancedAnalyzer.ts, and portions of llmIntegration.ts. The root directory clutter (17 files including 10+ markdown documents) and 7 orphaned files suggest recent refactoring efforts that haven't been completed. The codebase would benefit significantly from consolidating the monolithic components into the emerging modular structure, completing the domain-driven organization, and establishing clear layer boundaries with explicit interfaces between presentation, application, domain, and infrastructure concerns.

## Strengths

- Clear domain-driven organization emerging in src/domain/ with separated concerns (bootstrap/, formatters/, handlers/, prompts/, services/) indicating intentional architectural evolution
- Provider abstraction pattern in src/ai/providers/ successfully decouples AI service implementation from business logic, supporting multiple LLM backends (OpenAI, Anthropic) with clean interfaces
- Intelligent caching and incremental analysis architecture (src/storage/incrementalStorage.ts, src/cache.ts) achieves the critical 80% performance improvement necessary for continuous monitoring without blocking developer workflow
- Dedicated infrastructure layer (src/infrastructure/) properly separates cross-cutting concerns like file system operations, persistence, and progress tracking from business logic
- Multi-format output system with specialized formatters (src/domain/formatters/, src/llmFormatter.ts) successfully addresses the core product requirement of generating AI-assistant-specific documentation formats
- State management abstraction (src/state/) provides centralized state handling patterns that could support future features like team synchronization or persistent workspace analysis
- Language-agnostic analysis architecture in src/analysis/enhancedAnalyzer.ts supporting nine programming languages through extensible analyzer pattern
- VS Code-native integration points (extension.ts, webview providers, tree views) leverage platform capabilities effectively for inline diagnostics, sidebar presentation, and clickable navigation

## Issues & Concerns

- **Massive Monolithic Service Components Violating Single Responsibility**: llmService.ts (2,904 lines, 115 functions) and llmIntegration.ts (2,637 lines, 191 functions) are god objects containing mixed responsibilities: API communication, response parsing, state management, caching, error handling, rate limiting, retry logic, and business orchestration. These files violate single responsibility principle and make the codebase difficult to maintain, test, and extend. **Proposed Fix**: Decompose these monoliths using the existing modular structure as a guide: (1) Move AI provider communication to src/ai/providers/ implementations, (2) Extract response parsing to src/ai/llmResponseParser.ts (already exists but underutilized), (3) Move retry and rate limiting logic to src/ai/llmRetryHandler.ts and src/ai/llmRateLimiter.ts (exist but may need integration), (4) Create src/domain/services/analysisOrchestrationService.ts for high-level workflow coordination, (5) Move state management to src/state/llmStateManager.ts (already exists), (6) Extract caching to src/infrastructure/fileSystem/fileCache.ts (orphaned, needs integration). Each component should have a single, well-defined responsibility with clear interfaces.
  - Files: src/llmService.ts, src/llmIntegration.ts, src/ai/llmResponseParser.ts, src/ai/llmRetryHandler.ts, src/ai/llmRateLimiter.ts, src/state/llmStateManager.ts, src/infrastructure/fileSystem/fileCache.ts
  - Functions: llmService (115 functions), llmIntegration (191 functions), LLMResponseParser, LLMRetryHandler, LLMRateLimiter, LLMStateManager
- **Duplicate Analysis Implementations Creating Maintenance Burden**: Analysis logic is duplicated across src/analyzer.ts (650 lines, 30 functions), src/analysis/enhancedAnalyzer.ts (871 lines, 36 functions), and portions of llmIntegration.ts. This creates inconsistencies where different code paths may produce different results, makes bug fixes require changes in multiple places, and obscures which analyzer is authoritative. The existence of both 'analyzer' and 'enhancedAnalyzer' suggests an incomplete migration. **Proposed Fix**: Establish src/analysis/enhancedAnalyzer.ts as the single source of truth for static code analysis. Deprecate and remove src/analyzer.ts after migrating any unique functionality. Extract any analysis-related code from llmIntegration.ts into the enhanced analyzer. Create clear interfaces (src/analysis/ICodeAnalyzer.ts) that define the analysis contract, then implement language-specific analyzers that conform to this interface. All analysis requests should flow through a single AnalyzerService that delegates to appropriate language-specific implementations.
  - Files: src/analyzer.ts, src/analysis/enhancedAnalyzer.ts, src/llmIntegration.ts, src/insightGenerator.ts
  - Functions: analyzer functions (30), enhancedAnalyzer functions (36), insightGenerator functions
- **Orphaned Infrastructure Components Not Integrated**: Seven orphaned files exist that implement important infrastructure capabilities but aren't imported anywhere: fileCache.ts, fileProcessor.ts, baseStateManager.ts, baseWebviewProvider.ts, progressService.ts, refactoringPromptBuilder.ts. These represent incomplete refactoring efforts where new modular components were created but never integrated, leaving the codebase using older implementations. This wastes development effort and leaves better-designed components unused. **Proposed Fix**: Systematically integrate each orphaned component: (1) fileCache.ts should replace caching logic in llmService.ts and analyzer.ts, (2) fileProcessor.ts should be integrated into file watching and analysis pipeline, (3) baseStateManager.ts should serve as parent class for llmStateManager.ts, (4) baseWebviewProvider.ts should be parent for webview implementations, (5) progressService.ts should replace inline progress tracking in analysis workflows, (6) refactoringPromptBuilder.ts should be integrated with promptBuilder.ts or replace it if superior. After integration, update imports throughout codebase and verify functionality, then document the architectural patterns these components establish.
  - Files: src/infrastructure/fileSystem/fileCache.ts, src/infrastructure/fileSystem/fileProcessor.ts, src/state/baseStateManager.ts, src/ui/webview/baseWebviewProvider.ts, src/infrastructure/progressService.ts, src/domain/prompts/refactoringPromptBuilder.ts, src/llmService.ts, src/analyzer.ts
  - Functions: FileCache, FileProcessor, BaseStateManager, BaseWebviewProvider, ProgressService, RefactoringPromptBuilder
- **Root Directory Clutter Obscuring Project Structure**: 17 files in the root directory including 10+ markdown documentation files (GET_STARTED.md, IMPLEMENTATION_GUIDE.md, PLUGIN_DESIGN.md, QUICK_START.md, README.md, REFACTORING_PLAN.md, etc.), 2 .vsix build artifacts, webpack.config.js, and various configuration files. This makes it difficult to quickly understand project structure, find relevant documentation, or identify the actual source code entry points. Build artifacts in root are particularly problematic as they should not be version controlled. **Proposed Fix**: Create organized directory structure: (1) Create docs/ directory and move all .md files except README.md (GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, REFACTORING_PLAN.md, REFACTORING_REPORT_IMPROVEMENTS.md, REFACTORING_REPORT_STRATEGY.md, TEST_GENERATION_ENHANCEMENT_PLAN.md), (2) Create build/ or dist/ directory for .vsix artifacts and ensure they're in .gitignore, (3) Create config/ directory for webpack.config.js, tsconfig.json if not used by tooling in root, (4) Keep only essential files in root: README.md, package.json, package-lock.json, LICENSE, .gitignore, .vscode/. Update all internal references to moved files.
  - Files: GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, README.md, REFACTORING_PLAN.md, REFACTORING_REPORT_IMPROVEMENTS.md, REFACTORING_REPORT_STRATEGY.md, TEST_GENERATION_ENHANCEMENT_PLAN.md, shadow-watch-1.0.0.vsix, shadow-watch.vsix, webpack.config.js
- **Presentation Logic Scattered Across Multiple Components**: UI/presentation concerns are distributed across src/analysisViewer.ts, src/insightsViewer.ts, src/insightsTreeView.ts, src/productNavigator.ts, src/unitTestsNavigator.ts, src/staticAnalysisViewer.ts with unclear separation of responsibilities and potential duplication. Multiple 'viewer' and 'navigator' components suggest overlapping functionality. The src/ui/webview/ directory exists but only contains 2 files while viewer logic remains in src/ root. **Proposed Fix**: Consolidate all presentation components under src/ui/: (1) Move all *Viewer.ts and *Navigator.ts files to src/ui/views/ or src/ui/panels/, (2) Create clear component hierarchy: BaseView (from baseWebviewProvider.ts) -> specialized views, (3) Extract common presentation logic into src/ui/common/ or src/ui/shared/, (4) Define clear interfaces for view contracts (ITreeView, IWebviewPanel, INavigator), (5) Ensure views only handle presentation and user interaction, delegating business logic to domain services. Consider consolidating similar viewers if they duplicate functionality.
  - Files: src/analysisViewer.ts, src/insightsViewer.ts, src/insightsTreeView.ts, src/productNavigator.ts, src/unitTestsNavigator.ts, src/staticAnalysisViewer.ts, src/ui/webview/baseWebviewProvider.ts, src/ui/webview/webviewTemplateEngine.ts
  - Functions: analysisViewer, insightsViewer, insightsTreeView, productNavigator, unitTestsNavigator, staticAnalysisViewer
- **Mixed Responsibility in Extension Entry Point**: extension.ts (715 lines, 50 functions) serves as both VS Code extension entry point and contains business logic for command handling, view initialization, and workflow orchestration. Entry points should be thin, delegating to appropriate services. Current implementation makes testing difficult and violates separation of concerns. **Proposed Fix**: Refactor extension.ts to be a thin bootstrapper: (1) Use src/domain/bootstrap/extensionBootstrapper.ts (already exists, 204 lines) as the primary initialization coordinator, (2) Move command registration to src/domain/bootstrap/commandRegistry.ts (already exists, 188 lines), (3) Extract workflow orchestration to application services in src/domain/services/, (4) extension.ts activate() should only: initialize bootstrapper, register commands via commandRegistry, setup error handling, return disposables. This makes the extension.ts file ~50-100 lines, with all business logic properly layered and testable independently of VS Code APIs.
  - Files: src/extension.ts, src/domain/bootstrap/extensionBootstrapper.ts, src/domain/bootstrap/commandRegistry.ts
  - Functions: activate, deactivate, extensionBootstrapper, commandRegistry
- **Inconsistent Error Handling and Logging Patterns**: Error handling varies across the codebase with some modules using try-catch-log patterns, others using error callbacks, and some silently swallowing errors. logger.ts exists but is only 38 lines and may not provide sufficient structured logging for debugging complex AI integration issues. errorHandler.ts (362 lines) exists in utils but its integration is unclear. **Proposed Fix**: Establish consistent error handling architecture: (1) Expand logger.ts to provide structured logging with log levels (debug, info, warn, error), context metadata, and VS Code output channel integration, (2) Use errorHandler.ts as central error processing utility with error classification, user-friendly messaging, and telemetry integration, (3) Define error handling policy: domain layer throws typed errors (AnalysisError, AIProviderError, etc.), application layer catches and converts to user-facing messages, infrastructure layer logs and reports, (4) Implement error boundaries in presentation layer to prevent UI crashes, (5) Add error recovery strategies for transient failures (network, rate limits). Document error handling patterns in architecture guide.
  - Files: src/logger.ts, src/utils/errorHandler.ts, src/llmService.ts, src/llmIntegration.ts, src/ai/providers/anthropicProvider.ts, src/ai/providers/openAIProvider.ts
  - Functions: logger functions, errorHandler functions, provider error handling
- **File System Operations Without Proper Abstraction**: File system operations are directly performed in multiple places (fileAccessHelper.ts, fileWatcher.ts, analyzer.ts, various services) without going through infrastructure layer abstractions. This makes testing difficult, couples business logic to Node.js fs APIs, and prevents potential future enhancements like virtual file system support for testing or cloud storage integration. **Proposed Fix**: Consolidate file system operations behind infrastructure abstractions: (1) Use src/infrastructure/fileSystem/fileProcessor.ts (orphaned) as the primary file system service, implementing interface IFileSystemService with methods like readFile(), writeFile(), watchFile(), listFiles(), (2) Integrate fileAccessHelper.ts functionality into fileProcessor.ts, (3) Make fileWatcher.ts use fileProcessor.ts rather than direct fs/vscode.workspace calls, (4) Update all consumers (analyzers, services) to depend on IFileSystemService interface rather than concrete implementations, (5) This enables easy mocking for tests and potential future abstractions. Create src/infrastructure/fileSystem/index.ts to export the interface and factory.
  - Files: src/fileAccessHelper.ts, src/fileWatcher.ts, src/infrastructure/fileSystem/fileProcessor.ts, src/analyzer.ts, src/domain/services/fileWatcherService.ts
  - Functions: fileAccessHelper functions, fileWatcher functions, FileProcessor
- **Configuration Management Scattered Across Codebase**: Configuration is accessed directly via vscode.workspace.getConfiguration() in multiple files rather than centralized through configurationManager.ts. This creates tight coupling to VS Code APIs, makes configuration changes require updates in multiple locations, and prevents configuration validation or defaults management. **Proposed Fix**: Enforce configuration access through src/config/configurationManager.ts exclusively: (1) Expand ConfigurationManager to provide typed configuration objects with validation, (2) Implement configuration schema with defaults and validation rules, (3) Add configuration change observers that notify dependent services, (4) Refactor all direct vscode.workspace.getConfiguration() calls to use ConfigurationManager methods, (5) Add configuration migration support for handling version upgrades, (6) Consider exporting configuration types (ILLMConfig, IAnalysisConfig, etc.) for type safety. This centralizes configuration logic and makes it testable independent of VS Code.
  - Files: src/config/configurationManager.ts, src/llmService.ts, src/extension.ts, src/ai/providers/anthropicProvider.ts, src/ai/providers/openAIProvider.ts
  - Functions: ConfigurationManager, provider configuration access
- **Circular Dependency Risk Between Analysis and LLM Services**: Analysis components (analyzer.ts, enhancedAnalyzer.ts) and LLM services (llmService.ts, llmIntegration.ts) have bidirectional dependencies where analyzers need LLM services for AI-enhanced analysis and LLM services need analyzers for code context. This creates circular dependency risk, tight coupling, and makes the system difficult to test and extend. **Proposed Fix**: Introduce clear dependency direction using dependency inversion: (1) Create src/domain/interfaces/ directory with IAnalysisService and ILLMService interfaces, (2) Analysis layer depends on ILLMService interface (not concrete implementation), (3) LLM layer depends on IAnalysisService interface (not concrete implementation), (4) Use dependency injection in src/domain/bootstrap/extensionBootstrapper.ts to wire concrete implementations, (5) Create application service layer (src/application/) that orchestrates analysis and LLM services, handling their interactions, (6) Both services can then evolve independently as long as they conform to interfaces. This follows clean architecture principles with dependencies pointing inward toward domain abstractions.
  - Files: src/analyzer.ts, src/analysis/enhancedAnalyzer.ts, src/llmService.ts, src/llmIntegration.ts, src/insightGenerator.ts
  - Functions: analyzer functions, enhancedAnalyzer functions, llmService functions, llmIntegration functions

## Code Organization

The codebase organization reveals an **incomplete architectural migration** from a monolithic extension structure to a more sophisticated domain-driven design. While the src/ directory shows clear intent with organized subdirectories (domain/, infrastructure/, ui/, ai/, analysis/), the execution is inconsistent. The root src/ directory still contains 19 files including massive monolithic components (llmService.ts, llmIntegration.ts) and numerous specialized viewers/navigators that should be organized into the ui/ subdirectory. This creates a two-tier structure where some concerns are properly layered (domain/bootstrap/, domain/formatters/, domain/handlers/) while core functionality remains in the flat src/ root, making it difficult to understand component relationships and responsibilities.

The root directory clutter (17 files) is particularly problematic, with 10+ markdown documentation files creating visual noise and making it hard to identify the actual project structure. Documentation files like GET_STARTED.md, IMPLEMENTATION_GUIDE.md, PLUGIN_DESIGN.md, REFACTORING_PLAN.md, and others should be consolidated into a docs/ directory. Build artifacts (shadow-watch-1.0.0.vsix, shadow-watch.vsix) should not be in the root or version control. Configuration files (webpack.config.js, tsconfig.json) could be organized into a config/ directory, though tooling requirements may necessitate some staying in root.

The presence of seven orphaned files (not imported anywhere) signals incomplete refactoring: fileCache.ts, fileProcessor.ts, baseStateManager.ts, baseWebviewProvider.ts, progressService.ts, refactoringPromptBuilder.ts, and webpack.config.js. These represent new modular infrastructure components that were created but never integrated, leaving the codebase using older implementations. This suggests recent architectural improvement efforts that lost momentum before completion. The emerging domain-driven structure (domain/bootstrap/, domain/formatters/, domain/handlers/, domain/prompts/, domain/services/) is architecturally sound and should be the foundation for reorganizing the monolithic components. The infrastructure/ layer properly separates cross-cutting concerns, but file system operations (fileSystem/ subdirectory) and persistence (persistence/ subdirectory) should be more consistently used throughout the codebase rather than having file operations scattered in fileAccessHelper.ts, fileWatcher.ts, and inline in various services.

## Entry Points Analysis

The extension has a single, well-defined entry point at ./dist/extension.js (referenced in package.json main field), which is appropriate for a VS Code extension serving one primary user type within the IDE. The entry point compiles from src/extension.ts (715 lines, 50 functions), which currently serves dual roles as both the VS Code activation/deactivation handler and as a business logic orchestrator. While having a single entry point aligns with the product's architecture rationale of tight IDE integration, the extension.ts file has grown too large and contains too much business logic that should be delegated to src/domain/bootstrap/extensionBootstrapper.ts (already exists but underutilized at 204 lines). The entry point should be refactored to be a thin wrapper (~50-100 lines) that initializes the bootstrapper, registers commands via commandRegistry.ts, and sets up error handling, with all business logic moved to appropriate application and domain services. This would maintain the single entry point architecture while improving testability and separation of concerns.

## Orphaned Files Analysis

The seven orphaned files represent **abandoned refactoring efforts** where new modular components were created but integration was never completed: (1) refactoringPromptBuilder.ts (409 lines) - appears to be an improved version of promptBuilder.ts (972 lines) but was never integrated, suggesting the older implementation is still in use, (2) fileCache.ts (225 lines) - implements sophisticated caching infrastructure but caching logic remains embedded in llmService.ts and analyzer.ts, (3) fileProcessor.ts (214 lines) - provides file system abstraction but file operations remain scattered across fileAccessHelper.ts and direct fs/vscode calls, (4) progressService.ts (139 lines) - centralizes progress reporting but progress tracking remains inline in various analysis workflows, (5) baseStateManager.ts (159 lines) - provides state management base class but llmStateManager.ts doesn't extend it, (6) baseWebviewProvider.ts (84 lines) - provides webview base class but viewer implementations don't use it, (7) webpack.config.js (37 lines) - build configuration that may be replaced by VS Code's build system. These files represent significant development investment (~1,467 lines of infrastructure code) that's being wasted. Priority should be given to integrating these components as they represent better architectural patterns than the current implementations they were meant to replace.

## Folder Reorganization Suggestions

**Immediate Priority - Root Directory Cleanup:**

Create docs/ directory and move all documentation:
- docs/getting-started.md (from GET_STARTED.md)
- docs/implementation-guide.md (from IMPLEMENTATION_GUIDE.md)
- docs/menu-structure.md (from MENU_STRUCTURE.md)
- docs/plugin-design.md (from PLUGIN_DESIGN.md)
- docs/quick-start.md (from QUICK_START.md)
- docs/refactoring-plan.md (from REFACTORING_PLAN.md)
- docs/refactoring-report-improvements.md (from REFACTORING_REPORT_IMPROVEMENTS.md)
- docs/refactoring-report-strategy.md (from REFACTORING_REPORT_STRATEGY.md)
- docs/test-generation-enhancement-plan.md (from TEST_GENERATION_ENHANCEMENT_PLAN.md)
- Keep README.md in root as primary entry point

Remove or relocate build artifacts:
- Add *.vsix to .gitignore
- Remove shadow-watch-1.0.0.vsix and shadow-watch.vsix from version control
- Create build/ or dist/ directory for build outputs if needed locally

**High Priority - Presentation Layer Consolidation:**

Create src/ui/views/ and move all viewer/navigator components:
- src/ui/views/analysisViewer.ts (from src/analysisViewer.ts)
- src/ui/views/insightsViewer.ts (from src/insightsViewer.ts)
- src/ui/views/insightsTreeView.ts (from src/insightsTreeView.ts)
- src/ui/views/staticAnalysisViewer.ts (from src/staticAnalysisViewer.ts)
- src/ui/views/productNavigator.ts (from src/productNavigator.ts)
- src/ui/views/unitTestsNavigator.ts (from src/unitTestsNavigator.ts)

**High Priority - Service Layer Decomposition:**

Decompose monolithic services into domain services:
- Create src/domain/services/analysisOrchestrationService.ts - extract high-level workflow coordination from llmIntegration.ts
- Create src/domain/services/llmCommunicationService.ts - extract API communication from llmService.ts, delegate to providers
- Create src/domain/services/cacheManagementService.ts - consolidate caching logic from multiple files, integrate fileCache.ts
- Move src/ai/ components to src/domain/ai/ to align with domain-driven structure
- Keep provider implementations in src/domain/ai/providers/

**Medium Priority - Infrastructure Consolidation:**

Consolidate file system operations:
- Integrate src/infrastructure/fileSystem/fileProcessor.ts (orphaned) as primary file system service
- Merge src/fileAccessHelper.ts functionality into fileProcessor.ts
- Move src/fileWatcher.ts to src/infrastructure/fileSystem/fileWatcher.ts
- Create src/infrastructure/fileSystem/index.ts to export interfaces and factory

Consolidate state management:
- Make src/state/llmStateManager.ts extend src/state/baseStateManager.ts (currently orphaned)
- Create additional state managers as needed (analysisStateManager, uiStateManager)
- Move src/state/ to src/infrastructure/state/ to clarify it's infrastructure concern

**Medium Priority - Analysis Layer Organization:**

Consolidate analysis implementations:
- Establish src/analysis/enhancedAnalyzer.ts as authoritative analyzer
- Deprecate and remove src/analyzer.ts after migrating unique functionality
- Create src/analysis/interfaces/ with ICodeAnalyzer, ILanguageAnalyzer interfaces
- Move src/insightGenerator.ts to src/analysis/insightGenerator.ts
- Create src/analysis/languageAnalyzers/ for language-specific implementations if needed

**Low Priority - Configuration Organization:**

Optionally create config/ directory for non-essential configs:
- config/webpack.config.js (from webpack.config.js) - if tooling allows
- Keep tsconfig.json, package.json, package-lock.json in root as required by tooling
- Keep LICENSE in root

**Final Structure:**
```
root/
  README.md, LICENSE, package.json, package-lock.json, tsconfig.json
  docs/ (10 .md files)
  config/ (webpack.config.js if tooling allows)
  src/
    extension.ts (thin entry point)
    logger.ts, cache.ts (shared utilities)
    analysis/ (enhancedAnalyzer, insightGenerator, interfaces/)
    domain/
      ai/ (moved from src/ai/)
        providers/
        llmRateLimiter.ts, llmResponseParser.ts, llmRetryHandler.ts
      bootstrap/ (extensionBootstrapper, commandRegistry)
      formatters/ (documentationFormatter, llmFormatter)
      handlers/ (navigationHandler)
      prompts/ (promptBuilder, refactoringPromptBuilder integrated)
      services/ (analysisOrchestration, llmCommunication, cacheManagement, fileWatcherService, incrementalAnalysisService)
      interfaces/ (IAnalysisService, ILLMService, etc.)
    infrastructure/
      config/ (configurationManager)
      fileSystem/ (fileProcessor with integrated fileAccessHelper, fileWatcher, fileCache)
      persistence/ (analysisResultRepository)
      state/ (baseStateManager, llmStateManager, others)
      progressService.ts
    storage/ (incrementalStorage)
    ui/
      views/ (all *Viewer.ts, *Navigator.ts)
      webview/ (baseWebviewProvider, webviewTemplateEngine)
    utils/ (errorHandler, shared utilities)
    context/ (analysisContextBuilder)
```

## Recommendations

- **If You Want to Maintain Fast Continuous Monitoring Performance**: Keep the aggressive caching architecture but integrate the orphaned fileCache.ts (225 lines) which implements more sophisticated caching than the current embedded logic in llmService.ts and analyzer.ts. The 80% performance improvement (initial analysis 2-5 seconds, incremental <1 second) is critical to the product's value proposition of non-blocking background monitoring. Consolidate all caching logic into src/domain/services/cacheManagementService.ts that uses fileCache.ts infrastructure, ensuring cache invalidation is consistent across all analysis types (static, AI-enhanced, documentation). Add cache warming on extension activation for frequently accessed files, and implement cache size limits to prevent unbounded memory growth on large codebases. The current caching is working but scattered across multiple implementations, creating risk of cache inconsistencies.
  - Files: src/infrastructure/fileSystem/fileCache.ts, src/cache.ts, src/llmService.ts, src/analyzer.ts, src/storage/incrementalStorage.ts
  - Functions: FileCache, cache functions, llmService caching, analyzer caching
- **If You Want to Improve Extension Testability and Maintainability**: Complete the architectural migration to domain-driven design by decomposing the monolithic llmService.ts (2,904 lines) and llmIntegration.ts (2,637 lines) into the modular structure that's already partially built. This refactoring would make the codebase significantly more testable by allowing unit testing of individual services without VS Code extension host, reduce cognitive load by establishing clear component boundaries, and enable parallel development by multiple developers without merge conflicts in giant files. Extract orchestration logic to src/domain/services/analysisOrchestrationService.ts, move provider communication to provider implementations, integrate the existing llmResponseParser.ts, llmRetryHandler.ts, and llmRateLimiter.ts that are currently underutilized. This aligns with clean architecture principles and makes the codebase maintainable long-term. The migration path is clear since supporting infrastructure already exists (providers/, response parser, retry handler), it just needs integration.
  - Files: src/llmService.ts, src/llmIntegration.ts, src/ai/llmResponseParser.ts, src/ai/llmRetryHandler.ts, src/ai/llmRateLimiter.ts, src/domain/services/, src/ai/providers/
  - Functions: llmService (115 functions), llmIntegration (191 functions)
- **If You Want to Support Additional AI Providers Beyond OpenAI and Anthropic**: The current provider abstraction in src/ai/providers/ (ILLMProvider interface with OpenAI and Anthropic implementations) is architecturally sound and extensible. To add new providers (Google Gemini, Mistral, local models via Ollama), continue using this pattern: implement ILLMProvider interface, handle provider-specific API details in the implementation, register with providerFactory.ts. The abstraction successfully decouples business logic from provider specifics. However, consider expanding ILLMProvider interface to support streaming responses (for better UX on long documentation generation), function calling (for structured output), and embeddings (for semantic code search). Document provider capabilities matrix so the orchestration layer can degrade gracefully when providers don't support certain features. The current architecture supports this expansion without changes to business logic.
  - Files: src/ai/providers/ILLMProvider.ts, src/ai/providers/providerFactory.ts, src/ai/providers/openAIProvider.ts, src/ai/providers/anthropicProvider.ts
  - Functions: ILLMProvider, ProviderFactory, OpenAIProvider, AnthropicProvider
- **If You Want to Scale to Enterprise Codebases with Thousands of Files**: The current incremental analysis architecture (src/storage/incrementalStorage.ts, src/domain/services/incrementalAnalysisService.ts) provides the foundation for scaling, but needs enhancement for enterprise scale. Implement workspace partitioning where large codebases are analyzed in chunks with priority given to recently changed files and files in current editor context. Add analysis scheduling with adjustable aggressiveness (analyze on save vs. on idle vs. on demand). Implement result streaming so large analyses show progressive results rather than blocking until complete. Consider workspace-wide result caching in .shadow-watch/ directory (git-ignored) to persist analysis across VS Code restarts, enabling instant startup on large projects. Add telemetry to understand which files are analyzed most frequently and optimize accordingly. The incremental analysis service already exists but may need performance optimization for 1000+ file workspaces.
  - Files: src/storage/incrementalStorage.ts, src/domain/services/incrementalAnalysisService.ts, src/analyzer.ts, src/analysis/enhancedAnalyzer.ts
  - Functions: IncrementalStorage, IncrementalAnalysisService, analyzer functions, enhancedAnalyzer functions
- **If You Want to Improve AI Documentation Quality and Reduce API Costs**: The current AI documentation generation uses full file contents and comprehensive prompts, which is expensive for large files and may exceed LLM context windows. Implement intelligent context selection where only relevant code sections are sent to the LLM based on the specific documentation request (e.g., for refactoring suggestions, send only the problematic function and its immediate dependencies, not entire files). Use src/context/analysisContextBuilder.ts (102 lines) as the foundation for context selection logic. Implement prompt caching for common analysis patterns to reduce tokens sent. For refactoring reports, use structured output (JSON) from LLMs rather than free-form text to ensure consistent formatting and easier parsing. Consider two-tier documentation: fast, cheap static analysis (free, instant) for routine monitoring, expensive AI analysis (paid, slower) for deep architectural insights and refactoring strategy. This reduces API costs while maintaining value.
  - Files: src/context/analysisContextBuilder.ts, src/domain/prompts/promptBuilder.ts, src/domain/prompts/refactoringPromptBuilder.ts, src/llmService.ts
  - Functions: AnalysisContextBuilder, PromptBuilder, RefactoringPromptBuilder
- **If You Want to Support Team Collaboration and Shared Architecture Insights**: Currently, Shadow Watch operates per-developer with no team synchronization. If you want to enable teams to share architecture insights, health score trends, and refactoring priorities, implement shared storage backend (could be file-based in git repository like .shadow-watch/team-insights.json, or remote backend like shared SQLite/PostgreSQL). Store aggregated insights (not full analysis results to avoid size bloat) including health scores over time, consensus issues (detected by multiple developers), refactoring priorities voted on by team. Add UI elements for team insights in sidebar showing team-wide health trends and shared priorities. Implement change tracking so teams can see architecture quality improvements over time. Use src/infrastructure/persistence/analysisResultRepository.ts as foundation, extending it to support shared storage. Consider conflict resolution when multiple developers analyze simultaneously. This transforms Shadow Watch from personal tool to team collaboration platform.
  - Files: src/infrastructure/persistence/analysisResultRepository.ts, src/storage/incrementalStorage.ts, src/insightsTreeView.ts
  - Functions: AnalysisResultRepository, IncrementalStorage, InsightsTreeView
- **If You Want to Add Support for More Programming Languages Beyond Current Nine**: The current language support (Python, JavaScript, TypeScript, Java, Go, Rust, C/C++, Ruby, PHP) uses language-agnostic analysis in enhancedAnalyzer.ts (871 lines) with TypeScript AST parsing for some languages. To add more languages, implement language-specific analyzers that conform to ICodeAnalyzer interface (needs to be created). Each language analyzer should understand language-specific anti-patterns (e.g., Python god classes, Java god objects, Go goroutine leaks, Rust borrow checker issues manifest differently). Use tree-sitter or language-specific parsers for accurate AST analysis rather than regex-based heuristics. Register analyzers with analyzerFactory pattern. Consider community contributions by providing clear analyzer interface and documentation. The current architecture in src/analysis/ suggests language-agnostic approach which may miss language-specific issues, but is easier to maintain.
  - Files: src/analysis/enhancedAnalyzer.ts, src/analyzer.ts
  - Functions: enhancedAnalyzer functions, analyzer functions
- **If You Want to Improve Error Recovery and Resilience**: Current error handling is inconsistent across the codebase with some errors silently swallowed, others logged but not recovered, and some crashing the extension. Implement comprehensive error handling strategy: (1) Use src/utils/errorHandler.ts (362 lines) consistently across all layers, (2) Expand src/logger.ts (38 lines) to provide structured logging with context, (3) Implement error boundaries in UI layer so analysis failures don't crash entire extension, (4) Add automatic retry with exponential backoff for transient failures (network, rate limits) using src/ai/llmRetryHandler.ts, (5) Implement graceful degradation where extension continues functioning with reduced capabilities when components fail (e.g., if AI provider fails, fall back to static analysis only), (6) Add user-friendly error messages in VS Code notifications with actionable remediation steps, (7) Implement telemetry to track error patterns and identify reliability issues. This improves user experience by preventing extension crashes and providing clear guidance when issues occur.
  - Files: src/utils/errorHandler.ts, src/logger.ts, src/ai/llmRetryHandler.ts, src/llmService.ts, src/extension.ts
  - Functions: ErrorHandler, logger functions, LLMRetryHandler

## Refactoring Priorities

- **Decompose Monolithic Service Files to Enable Maintainability**: The highest priority is breaking down llmService.ts (2,904 lines, 115 functions) and llmIntegration.ts (2,637 lines, 191 functions) into the modular architecture that's already partially built. These god objects are the primary source of technical debt, making the codebase difficult to test, understand, and modify. This refactoring enables all other improvements by establishing clear component boundaries. Start by extracting AI provider communication to the existing providers/ implementations, then move response parsing, retry logic, and rate limiting to their respective modules (already exist but are underutilized). Create orchestration services for high-level workflows. This is high impact (improves maintainability, testability, extensibility) with manageable risk (supporting infrastructure already exists, can be done incrementally by extracting one responsibility at a time). Estimated effort: 3-5 days. Success metric: No source files exceed 800 lines.
  - Files: src/llmService.ts, src/llmIntegration.ts, src/ai/providers/, src/ai/llmResponseParser.ts, src/ai/llmRetryHandler.ts, src/ai/llmRateLimiter.ts, src/state/llmStateManager.ts
  - Functions: llmService (115 functions), llmIntegration (191 functions)
- **Integrate Orphaned Infrastructure Components to Complete Refactoring**: Seven orphaned files representing 1,467 lines of better-designed infrastructure code are not being used: fileCache.ts, fileProcessor.ts, baseStateManager.ts, baseWebviewProvider.ts, progressService.ts, refactoringPromptBuilder.ts. These components represent significant development investment and embody better architectural patterns than current implementations. Integrating them provides immediate quality improvements: better caching (fileCache.ts replaces scattered caching logic), cleaner file system abstraction (fileProcessor.ts), proper inheritance hierarchies (base classes), and better progress reporting (progressService.ts). This is high impact (leverages existing work, improves architecture consistency) with low risk (code already exists and is likely tested). Start with fileCache.ts integration for immediate performance improvements, then fileProcessor.ts for better abstractions. Estimated effort: 2-3 days. Success metric: Zero orphaned files.
  - Files: src/infrastructure/fileSystem/fileCache.ts, src/infrastructure/fileSystem/fileProcessor.ts, src/state/baseStateManager.ts, src/ui/webview/baseWebviewProvider.ts, src/infrastructure/progressService.ts, src/domain/prompts/refactoringPromptBuilder.ts
  - Functions: FileCache, FileProcessor, BaseStateManager, BaseWebviewProvider, ProgressService, RefactoringPromptBuilder
- **Organize Root Directory and Documentation Files**: 17 files in root directory including 10+ markdown documentation files create significant visual clutter and make project structure unclear. This is low-hanging fruit with high impact on developer experience. Create docs/ directory, move all documentation except README.md, remove .vsix build artifacts from version control (add to .gitignore), optionally move webpack.config.js to config/ if tooling allows. This dramatically improves first impressions for new contributors, makes it easier to find documentation, and establishes proper project hygiene. This is high impact (improves onboarding, reduces cognitive load) with zero risk (pure file movement, no code changes). Can be completed in 30 minutes. Success metric: Root directory contains only README.md, LICENSE, package files, and essential configs (≤6 files).
  - Files: GET_STARTED.md, IMPLEMENTATION_GUIDE.md, MENU_STRUCTURE.md, PLUGIN_DESIGN.md, QUICK_START.md, REFACTORING_PLAN.md, REFACTORING_REPORT_IMPROVEMENTS.md, REFACTORING_REPORT_STRATEGY.md, TEST_GENERATION_ENHANCEMENT_PLAN.md, shadow-watch-1.0.0.vsix, shadow-watch.vsix, webpack.config.js
- **Consolidate Presentation Components into UI Layer**: Six viewer and navigator components (analysisViewer.ts, insightsViewer.ts, insightsTreeView.ts, staticAnalysisViewer.ts, productNavigator.ts, unitTestsNavigator.ts) totaling 3,674 lines are scattered in src/ root when they should be organized under src/ui/views/. The src/ui/ directory exists but is underutilized with only 2 files. Moving these components clarifies architectural layers, groups related code together, and makes the presentation layer boundaries explicit. This enables future improvements like consistent styling, shared UI components, and better separation of presentation from business logic. This is medium-high impact (improves architecture clarity, enables UI improvements) with very low risk (pure file movement with import updates). Estimated effort: 1-2 hours. Success metric: All presentation components in src/ui/ directory structure.
  - Files: src/analysisViewer.ts, src/insightsViewer.ts, src/insightsTreeView.ts, src/staticAnalysisViewer.ts, src/productNavigator.ts, src/unitTestsNavigator.ts, src/ui/webview/baseWebviewProvider.ts
  - Functions: viewer and navigator functions
- **Establish Consistent Error Handling and Logging Architecture**: Inconsistent error handling across the codebase creates reliability issues and makes debugging difficult. Some errors are silently swallowed, others crash the extension, and logging is minimal (logger.ts is only 38 lines). Expand logger.ts to provide structured logging with log levels and context metadata, integrate errorHandler.ts (362 lines, exists but inconsistently used) as central error processing utility, define clear error handling policy by layer (domain throws typed errors, application converts to user messages, infrastructure logs and reports), implement error boundaries in UI to prevent crashes, add automatic retry for transient failures using existing llmRetryHandler.ts. This is high impact (improves reliability, debuggability, user experience) with medium risk (requires touching many files but doesn't change business logic). Estimated effort: 3-4 days. Success metric: All errors logged with context, zero silent failures, user-friendly error notifications.
  - Files: src/logger.ts, src/utils/errorHandler.ts, src/ai/llmRetryHandler.ts, src/llmService.ts, src/extension.ts, src/ai/providers/anthropicProvider.ts, src/ai/providers/openAIProvider.ts
  - Functions: logger functions, errorHandler functions, retry handler functions, provider error handling

---

## LLM Refactoring Prompt

```
You are refactoring the Shadow Watch VS Code extension codebase. This extension provides continuous code architecture monitoring and AI-powered documentation generation, analyzing code on every save and generating insights formatted for AI assistants.

## Current Architecture Issues:
1. Monolithic service files (llmService.ts: 2904 lines, llmIntegration.ts: 2637 lines) violate single responsibility
2. Seven orphaned infrastructure files not integrated: fileCache.ts, fileProcessor.ts, baseStateManager.ts, baseWebviewProvider.ts, progressService.ts, refactoringPromptBuilder.ts
3. Duplicate analysis implementations in analyzer.ts and enhancedAnalyzer.ts
4. Presentation components scattered in src/ root instead of organized under src/ui/
5. Root directory clutter with 17 files including 10+ documentation files
6. Inconsistent error handling and minimal logging
7. Mixed responsibilities in extension.ts entry point

## Target Architecture:
- Domain-driven design with clear layers: presentation (src/ui/), application (src/domain/services/), domain (src/domain/), infrastructure (src/infrastructure/)
- Thin extension.ts entry point delegating to extensionBootstrapper.ts
- Single authoritative analyzer (enhancedAnalyzer.ts)
- Integrated infrastructure components (fileCache, fileProcessor, baseStateManager, etc.)
- Consistent error handling via errorHandler.ts and expanded logger.ts
- Clean provider abstraction in src/ai/providers/

## Refactoring Priorities:
1. Decompose llmService.ts and llmIntegration.ts into modular services
2. Integrate orphaned infrastructure components
3. Consolidate analysis implementations
4. Organize presentation components under src/ui/
5. Clean up root directory documentation
6. Establish consistent error handling

## Key Constraints:
- Maintain single VS Code entry point (extension.ts)
- Preserve 80% performance improvement from caching
- Keep multi-provider support (OpenAI, Anthropic)
- Maintain backward compatibility with existing VS Code commands
- Don't break incremental analysis functionality

When refactoring:
- Extract one responsibility at a time from monolithic files
- Use dependency injection for loose coupling
- Follow established patterns in src/domain/bootstrap/, src/ai/providers/
- Add comprehensive error handling and logging
- Update imports throughout codebase
- Ensure tests pass after each extraction

Start with high-impact, low-risk changes: integrate fileCache.ts, organize root directory, consolidate presentation components.
```
