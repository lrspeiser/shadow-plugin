# Refactoring Plan for Shadow Watch

## Overview

This plan addresses the technical debt identified in the refactoring report, prioritizing high-impact changes that will improve maintainability, testability, and developer experience. The plan is organized into phases that can be executed incrementally with minimal risk.

## Priority Assessment

### Critical (Do First) - High Impact, Manageable Risk
1. **Extract Duplication Patterns** - Quick wins that reduce maintenance burden
2. **Decompose llmService.ts** - Largest god object, blocks other improvements
3. **Decompose llmIntegration.ts** - Second largest god object

### High Priority (Do Next) - High Impact, Medium Risk
4. **Refactor extension.ts** - Improves activation clarity
5. **Extract View Component Logic** - Improves testability

### Medium Priority (Do Later) - Medium Impact, Low Risk
6. **Efficiency Optimizations** - Performance improvements

---

## Phase 1: Extract Duplication Patterns (5-6 days)

**Goal:** Eliminate ~1,050 lines of duplicated code, reducing maintenance burden and improving consistency.

### 1.1 Configuration Manager (1 day)
**Impact:** Medium | **Risk:** Low | **Lines Saved:** ~150

**Action Items:**
- [ ] Create `src/config/configurationManager.ts`
- [ ] Extract all configuration access from `llmService.ts`, `extension.ts`, and other files
- [ ] Add configuration validation
- [ ] Add configuration change watcher
- [ ] Update all imports to use centralized config manager
- [ ] Test configuration changes are detected properly

**Files to Create:**
- `src/config/configurationManager.ts`

**Files to Modify:**
- `src/llmService.ts`
- `src/extension.ts`
- Any other files accessing `vscode.workspace.getConfiguration`

### 1.2 Error Handler Utility (1-2 days)
**Impact:** Medium-High | **Risk:** Low | **Lines Saved:** ~300-400

**Action Items:**
- [ ] Create `src/utils/errorHandler.ts`
- [ ] Extract error handling patterns from:
  - `src/llmService.ts` (API request errors)
  - `src/analyzer.ts` (File reading errors)
  - `src/llmIntegration.ts` (File operation errors)
- [ ] Implement consistent error logging and user notification
- [ ] Add optional error logging to file
- [ ] Replace try-catch blocks with ErrorHandler.handle()
- [ ] Test error scenarios

**Files to Create:**
- `src/utils/errorHandler.ts`

**Files to Modify:**
- `src/llmService.ts`
- `src/analyzer.ts`
- `src/llmIntegration.ts`
- Other files with error handling duplication

### 1.3 Incremental Storage Abstraction (1 day)
**Impact:** Medium | **Risk:** Low | **Lines Saved:** ~200

**Action Items:**
- [ ] Create `src/storage/incrementalStorage.ts`
- [ ] Extract file I/O patterns from `llmIntegration.ts`:
  - `saveIncrementalFileSummary`
  - `saveIncrementalModuleSummary`
  - `saveIncrementalProductDocIteration`
  - `saveEnhancedProductDocsToFile`
  - `saveArchitectureInsightsToFile`
- [ ] Implement generic `IncrementalStorage<T>` class
- [ ] Add `loadLatest()` and `loadAll()` methods
- [ ] Replace individual save/load functions with storage instances
- [ ] Test file operations

**Files to Create:**
- `src/storage/incrementalStorage.ts`

**Files to Modify:**
- `src/llmIntegration.ts` (will be refactored in Phase 2, but this extraction helps)

### 1.4 Webview Template Engine (2 days)
**Impact:** High | **Risk:** Low-Medium | **Lines Saved:** ~400

**Action Items:**
- [ ] Create `src/ui/webview/webviewTemplateEngine.ts`
- [ ] Extract base HTML template with shared CSS and JavaScript
- [ ] Create template classes:
  - `src/ui/webview/templates/productDocsTemplate.ts`
  - `src/ui/webview/templates/architectureInsightsTemplate.ts`
  - `src/ui/webview/templates/settingsTemplate.ts`
- [ ] Extract shared styles and scripts
- [ ] Replace HTML generation functions:
  - `llmIntegration.ts`: `getEnhancedProductDocsHtml()`, `getLLMInsightsHtml()`
  - `extension.ts`: `getSettingsHtml()`
  - `insightsViewer.ts`: scattered HTML generation
- [ ] Test all webviews render correctly

**Files to Create:**
- `src/ui/webview/webviewTemplateEngine.ts`
- `src/ui/webview/templates/productDocsTemplate.ts`
- `src/ui/webview/templates/architectureInsightsTemplate.ts`
- `src/ui/webview/templates/settingsTemplate.ts`

**Files to Modify:**
- `src/llmIntegration.ts`
- `src/extension.ts`
- `src/insightsViewer.ts`

---

## Phase 2: Decompose llmService.ts (3-4 days)

**Goal:** Break down 2,753-line god object into focused modules, reducing to ~400 lines.

**Impact:** High | **Risk:** Medium-High | **Lines Extracted:** ~2,353

### 2.1 Extract AI Provider Implementations (1.5 days)
**Action Items:**
- [ ] Create `src/ai/providers/` directory
- [ ] Create `src/ai/providers/ILLMProvider.ts` interface
- [ ] Extract OpenAI provider logic to `src/ai/providers/openAIProvider.ts` (~400 lines)
- [ ] Extract Anthropic provider logic to `src/ai/providers/anthropicProvider.ts` (~400 lines)
- [ ] Extract custom endpoint logic to `src/ai/providers/customProvider.ts` (~300 lines)
- [ ] Create `src/ai/providers/providerFactory.ts` (~100 lines)
- [ ] Update `llmService.ts` to use provider factory
- [ ] Test each provider independently

**Files to Create:**
- `src/ai/providers/ILLMProvider.ts`
- `src/ai/providers/openAIProvider.ts`
- `src/ai/providers/anthropicProvider.ts`
- `src/ai/providers/customProvider.ts`
- `src/ai/providers/providerFactory.ts`

**Files to Modify:**
- `src/llmService.ts`

### 2.2 Extract Response Parser (1 day)
**Action Items:**
- [ ] Create `src/ai/llmResponseParser.ts`
- [ ] Extract response parsing logic from `llmService.ts`:
  - `parseProductDocs()`
  - `parseArchitectureInsights()`
  - `parseUnitTestDocs()`
  - `validateAgainstSchema()`
- [ ] Move schema validation logic
- [ ] Update `llmService.ts` to use parser
- [ ] Test parsing with various response formats

**Files to Create:**
- `src/ai/llmResponseParser.ts`

**Files to Modify:**
- `src/llmService.ts`

### 2.3 Extract Infrastructure Concerns (1 day)
**Action Items:**
- [ ] Create `src/ai/llmRateLimiter.ts`
- [ ] Extract rate limiting logic from `llmService.ts`
- [ ] Create `src/ai/llmRetryHandler.ts`
- [ ] Extract retry logic from `llmService.ts`
- [ ] Update `llmService.ts` to use these utilities
- [ ] Test rate limiting and retry behavior

**Files to Create:**
- `src/ai/llmRateLimiter.ts`
- `src/ai/llmRetryHandler.ts`

**Files to Modify:**
- `src/llmService.ts`

### 2.4 Refactor Core Orchestration (0.5 days)
**Action Items:**
- [ ] Refactor `llmService.ts` to use extracted components
- [ ] Simplify main methods to orchestration only
- [ ] Ensure all tests pass
- [ ] Verify no functionality regression

**Files to Modify:**
- `src/llmService.ts` (should now be ~400 lines)

---

## Phase 3: Decompose llmIntegration.ts (4-5 days)

**Goal:** Break down 2,291-line god object into focused modules, reducing to ~400 lines.

**Impact:** High | **Risk:** Medium-High | **Lines Extracted:** ~1,891

### 3.1 Extract State Management (1 day)
**Action Items:**
- [ ] Create `src/state/llmStateManager.ts`
- [ ] Extract file I/O operations from `llmIntegration.ts`:
  - `saveCodeAnalysis()`
  - `loadSavedCodeAnalysis()`
  - `saveIncrementalProductDocIteration()`
  - `saveIncrementalArchitectureInsightsIteration()`
  - Directory management functions
- [ ] Use `IncrementalStorage` from Phase 1.3 where applicable
- [ ] Update `llmIntegration.ts` to use state manager
- [ ] Test state persistence

**Files to Create:**
- `src/state/llmStateManager.ts`

**Files to Modify:**
- `src/llmIntegration.ts`

### 3.2 Extract Context Builder (1 day)
**Action Items:**
- [ ] Create `src/ai/llmContextBuilder.ts`
- [ ] Extract prompt context assembly logic:
  - `buildProductDocsContext()`
  - `buildArchitectureInsightsContext()`
  - `buildUnitTestContext()`
  - `enrichContextWithDependencies()`
- [ ] Update `llmIntegration.ts` to use context builder
- [ ] Test context building with various inputs

**Files to Create:**
- `src/ai/llmContextBuilder.ts`

**Files to Modify:**
- `src/llmIntegration.ts`

### 3.3 Extract UI Integration (1 day)
**Action Items:**
- [ ] Create `src/ui/llmUIIntegration.ts`
- [ ] Extract webview creation and HTML generation:
  - `showProductDocsInOutput()`
  - `showArchitectureInsightsInOutput()`
  - `showLLMInsights()`
- [ ] Use `WebviewTemplateEngine` from Phase 1.4
- [ ] Update `llmIntegration.ts` to use UI integration
- [ ] Test all UI displays

**Files to Create:**
- `src/ui/llmUIIntegration.ts`

**Files to Modify:**
- `src/llmIntegration.ts`

### 3.4 Extract Command Handlers (1 day)
**Action Items:**
- [ ] Create `src/commands/llmCommands.ts`
- [ ] Extract command handler logic:
  - `handleGenerateProductDocs()`
  - `handleGenerateArchitectureInsights()`
  - `handleGenerateUnitTests()`
  - `handleRunComprehensiveAnalysis()`
  - `handleClearAllData()`
- [ ] Keep orchestration focused, delegate to services
- [ ] Update `llmIntegration.ts` to use command handlers
- [ ] Test all commands

**Files to Create:**
- `src/commands/llmCommands.ts`

**Files to Modify:**
- `src/llmIntegration.ts`

### 3.5 Extract Formatting Logic (0.5 days)
**Action Items:**
- [ ] Create `src/formatters/llmMarkdownFormatter.ts`
- [ ] Extract markdown formatting functions:
  - `formatEnhancedDocsAsMarkdown()`
  - `formatInsightsAsMarkdown()`
  - `formatUnitTestsAsMarkdown()`
- [ ] Update `llmIntegration.ts` to use formatter
- [ ] Test markdown output

**Files to Create:**
- `src/formatters/llmMarkdownFormatter.ts`

**Files to Modify:**
- `src/llmIntegration.ts`

### 3.6 Refactor Core Integration (0.5 days)
**Action Items:**
- [ ] Refactor `llmIntegration.ts` to use extracted components
- [ ] Simplify to thin facade delegating to specialized components
- [ ] Ensure all tests pass
- [ ] Verify no functionality regression

**Files to Modify:**
- `src/llmIntegration.ts` (should now be ~400 lines)

---

## Phase 4: Refactor extension.ts (2-3 days)

**Goal:** Clean up entry point, extract command registration and UI initialization.

**Impact:** High | **Risk:** Medium | **Lines Extracted:** ~1,170

### 4.1 Extract Command Registration (0.5 days)
**Action Items:**
- [ ] Create `src/commands/commandRegistry.ts`
- [ ] Extract all command registrations from `extension.ts`
- [ ] Create `CommandHandlers` interface
- [ ] Update `extension.ts` to use registry
- [ ] Test all commands are registered

**Files to Create:**
- `src/commands/commandRegistry.ts`

**Files to Modify:**
- `src/extension.ts`

### 4.2 Extract UI Initialization (0.5 days)
**Action Items:**
- [ ] Create `src/ui/uiInitializer.ts`
- [ ] Extract view initialization logic
- [ ] Extract view provider registration
- [ ] Update `extension.ts` to use initializer
- [ ] Test all views are initialized

**Files to Create:**
- `src/ui/uiInitializer.ts`

**Files to Modify:**
- `src/extension.ts`

### 4.3 Extract Event Handlers (1 day)
**Action Items:**
- [ ] Create `src/events/eventHandlers.ts`
- [ ] Extract event handler functions from `extension.ts`:
  - `analyzeWorkspace()`
  - `analyzeCurrentFile()`
  - `copyAllInsights()`
  - `navigateToProductItem()`
  - All other event handlers
- [ ] Update `extension.ts` to use event handlers
- [ ] Test all event handlers

**Files to Create:**
- `src/events/eventHandlers.ts`

**Files to Modify:**
- `src/extension.ts`

### 4.4 Extract Detail Viewers (0.5 days)
**Action Items:**
- [ ] Create `src/ui/detailViewers.ts`
- [ ] Extract detail viewing functions:
  - `showProductItemDetails()`
  - `showInsightItemDetails()`
  - `showUnitTestItemDetails()`
- [ ] Update `extension.ts` to use detail viewers
- [ ] Test all detail views

**Files to Create:**
- `src/ui/detailViewers.ts`

**Files to Modify:**
- `src/extension.ts`

### 4.5 Refactor Activation (0.5 days)
**Action Items:**
- [ ] Refactor `activate()` function to clear orchestration
- [ ] Ensure initialization order is preserved
- [ ] Add clear comments for each initialization step
- [ ] Test extension activation
- [ ] Verify no functionality regression

**Files to Modify:**
- `src/extension.ts` (should now be ~250 lines)

---

## Phase 5: Refactor View Components (4 days)

**Goal:** Extract data transformation logic from view components.

**Impact:** Medium-High | **Risk:** Low-Medium | **Lines Extracted:** ~1,321

### 5.1 Refactor insightsTreeView.ts (2 days)
**Action Items:**
- [ ] Create `src/formatters/treeViewFormatter.ts`
- [ ] Extract tree item formatting logic
- [ ] Extract hierarchy building logic
- [ ] Create `src/handlers/treeViewHandlers.ts`
- [ ] Extract event handling logic
- [ ] Refactor `insightsTreeView.ts` to use formatter and handlers
- [ ] Test tree view functionality

**Files to Create:**
- `src/formatters/treeViewFormatter.ts`
- `src/handlers/treeViewHandlers.ts`

**Files to Modify:**
- `src/insightsTreeView.ts` (should now be ~300 lines)

### 5.2 Refactor productNavigator.ts (2 days)
**Action Items:**
- [ ] Apply same pattern as insightsTreeView.ts
- [ ] Extract formatting logic
- [ ] Extract event handling logic
- [ ] Refactor to use extracted components
- [ ] Test product navigator functionality

**Files to Modify:**
- `src/productNavigator.ts` (should now be ~300 lines)

---

## Phase 6: Efficiency Optimizations (2-3 days)

**Goal:** Improve performance and user experience.

**Impact:** Medium | **Risk:** Low

### 6.1 Cache Warming Strategy (2 days)
**Action Items:**
- [ ] Enhance `src/cache.ts` with warmup functionality
- [ ] Implement `warmupCache()` method
- [ ] Add selective cache invalidation
- [ ] Integrate warmup into extension activation
- [ ] Test cache warming improves first analysis time

**Files to Modify:**
- `src/cache.ts`
- `src/extension.ts`

### 6.2 Streaming Response Processing (1 day - if needed)
**Action Items:**
- [ ] Review current streaming implementation
- [ ] Optimize if memory issues exist
- [ ] Add progress feedback for long-running requests
- [ ] Test with large responses

**Files to Modify:**
- `src/llmService.ts` (or provider files)
- `src/ui/llmUIIntegration.ts`

---

## Testing Strategy

### Unit Tests
- Create test infrastructure (jest or mocha)
- Add unit tests for each extracted module
- Target 70%+ code coverage for new modules

### Integration Tests
- Test command handlers end-to-end
- Test UI components render correctly
- Test state persistence

### Manual Testing Checklist
After each phase:
- [ ] Extension activates without errors
- [ ] All commands work
- [ ] All views display correctly
- [ ] File analysis works
- [ ] LLM features work (if API keys configured)
- [ ] No console errors

---

## Risk Mitigation

### For High-Risk Phases (Phases 2 & 3)
1. **Create feature branch** for each phase
2. **Extract incrementally** - one module at a time
3. **Test after each extraction** - don't wait until end
4. **Keep old code commented** initially - remove after verification
5. **Use git commits** frequently for easy rollback

### For All Phases
1. **Run tests** after each change
2. **Manual smoke test** after each phase
3. **Code review** before merging
4. **Document breaking changes** if any

---

## Success Metrics

### Code Quality
- [ ] `llmService.ts` reduced from 2,753 to ~400 lines (85% reduction)
- [ ] `llmIntegration.ts` reduced from 2,291 to ~400 lines (83% reduction)
- [ ] `extension.ts` reduced from 1,420 to ~250 lines (82% reduction)
- [ ] Total duplication eliminated: ~1,050 lines
- [ ] No circular dependencies introduced

### Maintainability
- [ ] Each file has single, clear responsibility
- [ ] Functions average < 50 lines
- [ ] No functions > 200 lines
- [ ] Clear module boundaries

### Developer Experience
- [ ] New developers can understand structure in < 1 hour
- [ ] Parallel development possible without merge conflicts
- [ ] Tests can be written for individual modules

---

## Timeline Summary

| Phase | Duration | Priority | Risk |
|-------|----------|----------|------|
| Phase 1: Extract Duplication | 5-6 days | Critical | Low |
| Phase 2: Decompose llmService.ts | 3-4 days | Critical | Medium-High |
| Phase 3: Decompose llmIntegration.ts | 4-5 days | Critical | Medium-High |
| Phase 4: Refactor extension.ts | 2-3 days | High | Medium |
| Phase 5: Refactor View Components | 4 days | High | Low-Medium |
| Phase 6: Efficiency Optimizations | 2-3 days | Medium | Low |
| **Total** | **20-25 days** | | |

---

## Notes

- Phases can be executed in parallel where dependencies allow
- Phase 1 should be done first as it provides utilities used in later phases
- Phases 2 and 3 are the highest impact but also highest risk - take extra care
- Consider pausing between phases for code review and testing
- This plan assumes full-time focus - adjust timeline based on availability

