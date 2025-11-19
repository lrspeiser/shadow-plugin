# Refactoring Report Generation Improvements

## Current State Analysis

### What Works
- ✅ Product docs and architecture insights are passed to the refactoring report generator
- ✅ Code analysis data (files, functions, line counts) is included
- ✅ Report structure is well-defined

### What's Missing
- ❌ **No detailed extraction plans**: The prompt doesn't ask for function-by-function mapping
- ❌ **No step-by-step instructions**: Generic recommendations without specific "how-to" details
- ❌ **No dependency analysis**: Doesn't analyze which functions depend on which
- ❌ **No code examples**: Doesn't show before/after code snippets
- ❌ **No migration path**: Doesn't provide a phased approach to refactoring
- ❌ **Limited context**: Only passes top-level summaries, not detailed function signatures

## Proposed Solutions

### Option 1: Enhanced Single-Agent Prompt (Recommended First Step)

**Improvements to `buildComprehensiveReportPrompt`:**

1. **Request Detailed Function Analysis**
   - Ask for complete function signatures and responsibilities
   - Request dependency mapping (which functions call which)
   - Ask for code snippets of complex functions

2. **Demand Specific Extraction Plans**
   - For each large file, require:
     - List of functions to extract
     - Target file for each function
     - Dependencies that need to be handled
     - Step-by-step migration instructions

3. **Require Code Examples**
   - Before/after code snippets
   - Interface definitions
   - Example usage patterns

**Enhanced Prompt Section:**
```typescript
## Detailed Refactoring Instructions Required

For EACH file over 500 lines, provide:

### File: [path]
#### Current Structure
- List all public/private methods with line numbers
- Document dependencies (imports, function calls)
- Identify responsibilities (API, parsing, caching, etc.)

#### Extraction Plan
1. **Functions to Extract to [target-file]**
   - `functionName()` (lines X-Y): [reason]
   - Dependencies: [list of functions/classes it depends on]
   - Migration steps:
     a. Create new file `[target-file]`
     b. Move function `functionName` 
     c. Update imports in `[source-file]`
     d. Update call sites: [list of files that call this]

2. **Code Example - Before:**
   ```typescript
   // Current code in llmService.ts
   ```

3. **Code Example - After:**
   ```typescript
   // New code in llmApiService.ts
   ```

#### Dependencies to Resolve
- [List circular dependencies, shared state, etc.]
- [How to break them]

#### Testing Strategy
- [What tests need updating]
- [How to verify extraction worked]
```

### Option 2: Multi-Agent Approach (More Comprehensive)

**Phase 1: Analysis Agent**
- Analyzes code structure
- Identifies all functions, dependencies, responsibilities
- Creates detailed function inventory

**Phase 2: Extraction Planning Agent**
- Takes function inventory
- Creates detailed extraction plan for each large file
- Maps functions to target files
- Identifies dependencies

**Phase 3: Migration Path Agent**
- Takes extraction plans
- Creates step-by-step migration instructions
- Identifies risks and mitigation strategies
- Provides rollback plans

**Phase 4: Assembly Agent**
- Combines all outputs into final report
- Ensures consistency
- Adds cross-references

**Implementation:**
```typescript
async function generateDetailedRefactoringReport(
    context: AnalysisContext,
    codeAnalysis: CodeAnalysis,
    productDocs: EnhancedProductDocumentation,
    architectureInsights: LLMInsights
): Promise<string> {
    // Phase 1: Function Inventory
    const functionInventory = await analyzeFunctionInventory(
        codeAnalysis, 
        architectureInsights
    );
    
    // Phase 2: Extraction Plans
    const extractionPlans = await generateExtractionPlans(
        functionInventory,
        productDocs,
        architectureInsights
    );
    
    // Phase 3: Migration Paths
    const migrationPaths = await generateMigrationPaths(
        extractionPlans,
        codeAnalysis
    );
    
    // Phase 4: Assemble Report
    return assembleRefactoringReport(
        functionInventory,
        extractionPlans,
        migrationPaths,
        productDocs,
        architectureInsights
    );
}
```

### Option 3: Enhanced Context Preparation (Hybrid Approach)

**Before calling LLM, prepare detailed context:**

1. **Function Signature Extraction**
   ```typescript
   interface FunctionAnalysis {
       file: string;
       name: string;
       signature: string;
       startLine: number;
       endLine: number;
       parameters: string[];
       returnType: string;
       dependencies: string[]; // Functions/classes it calls
       dependents: string[]; // Functions that call it
       complexity: number;
       responsibilities: string[];
   }
   ```

2. **Dependency Graph**
   - Build call graph
   - Identify circular dependencies
   - Map shared state

3. **Enhanced Product Docs**
   - Include architectural patterns identified
   - Include layer boundaries
   - Include design principles to follow

**Then pass this enhanced context to a single, well-crafted prompt.**

## Recommended Implementation Plan

### Phase 1: Enhance Context (Week 1)
1. Create `FunctionAnalyzer` to extract detailed function info
2. Create `DependencyMapper` to build call graphs
3. Enhance product docs to include architectural patterns

### Phase 2: Improve Prompt (Week 1-2)
1. Update `buildComprehensiveReportPrompt` with detailed requirements
2. Add sections for:
   - Function-by-function extraction plans
   - Dependency resolution strategies
   - Code examples (before/after)
   - Step-by-step migration instructions

### Phase 3: Test & Iterate (Week 2)
1. Generate test reports
2. Compare with manual refactoring plans
3. Refine prompts based on gaps

### Phase 4: Multi-Agent (Optional, Week 3-4)
1. If single-agent still insufficient, implement multi-agent approach
2. Start with 2 agents (Analysis + Planning)
3. Expand to 4 agents if needed

## Specific Prompt Enhancements

### Add to `buildComprehensiveReportPrompt`:

```typescript
## CRITICAL: Detailed Extraction Plans Required

For files over 1000 lines, you MUST provide:

### 1. Function Inventory
For each function in the file:
- **Name**: `functionName`
- **Lines**: X-Y
- **Parameters**: `(param1: Type1, param2: Type2)`
- **Returns**: `ReturnType`
- **Responsibilities**: [List what it does]
- **Dependencies**: [Functions/classes it calls]
- **Dependents**: [Functions that call it]
- **Complexity**: [Cyclomatic complexity if available]

### 2. Extraction Mapping
For each function to extract:
- **Source**: `src/llmService.ts::functionName` (lines X-Y)
- **Target**: `src/ai/services/llmApiService.ts`
- **Reason**: [Why extract this function]
- **Dependencies to Move**: [List functions that must move with it]
- **Dependencies to Inject**: [List dependencies to pass as parameters]
- **Breaking Changes**: [What will break and how to fix]

### 3. Step-by-Step Migration
For each extraction:
1. **Step 1**: Create target file `[path]`
   - Create interface/class structure
   - Add imports
   
2. **Step 2**: Extract function
   - Copy function code
   - Update imports
   - Handle dependencies
   
3. **Step 3**: Update source file
   - Remove function
   - Add import from target
   - Update call sites
   
4. **Step 4**: Update dependent files
   - List all files that import/call this function
   - Show exact changes needed in each

### 4. Code Examples
For each major refactoring:
- **Before**: Show current code structure
- **After**: Show new code structure
- **Migration**: Show intermediate steps

### 5. Testing Checklist
- [ ] Unit tests for extracted function
- [ ] Integration tests for updated call sites
- [ ] Verify no breaking changes
- [ ] Performance regression tests
```

## Enhanced Product Docs Requirements

### What to Add to Product Docs:
1. **Architectural Patterns Identified**
   - Current patterns in use
   - Patterns to adopt
   - Patterns to avoid

2. **Layer Boundaries**
   - Clear definition of each layer
   - What belongs in each layer
   - How layers should interact

3. **Design Principles**
   - SOLID principles application
   - DRY, KISS, YAGNI
   - Domain-driven design concepts

4. **Refactoring Constraints**
   - What must not change
   - Backward compatibility requirements
   - Performance requirements

## Architecture Insights Enhancements

### What to Add:
1. **Function-Level Analysis**
   - Not just file-level
   - Function complexity scores
   - Function responsibility mapping

2. **Dependency Analysis**
   - Call graphs
   - Circular dependency detection
   - Shared state identification

3. **Refactoring Opportunities**
   - Specific functions to extract
   - Specific patterns to consolidate
   - Specific optimizations to apply

## Implementation Priority

1. **High Priority (Do First)**
   - Enhance prompt with detailed extraction requirements
   - Add function signature extraction to context
   - Request code examples in report

2. **Medium Priority**
   - Build dependency mapper
   - Enhance product docs with patterns
   - Add step-by-step migration sections

3. **Low Priority (If Needed)**
   - Multi-agent approach
   - Automated code generation
   - Interactive refactoring assistant

## Example Enhanced Report Section

```markdown
## Detailed Extraction Plan: src/llmService.ts

### Function Inventory

#### analyzeFile() (lines 263-300)
- **Signature**: `private async analyzeFile(file: FileInfo, workspaceRoot: string): Promise<FileSummary>`
- **Responsibilities**: 
  - Reads file content
  - Builds analysis prompt
  - Calls LLM API
  - Parses response
- **Dependencies**: 
  - `readFileContent()` (fileDocumentation.ts)
  - `detectFileRole()` (fileDocumentation.ts)
  - `promptBuilder.buildFileAnalysisPrompt()`
  - `rateLimiter.waitUntilAvailable()`
  - `retryHandler.executeWithRetry()`
  - `provider.sendRequest()`
  - `responseParser.parseFileSummary()`
- **Dependents**: `generateEnhancedProductDocs()` (line 175)
- **Complexity**: Medium (handles multiple concerns)

### Extraction Plan

**Extract to**: `src/ai/services/llmApiService.ts`

**Functions to Extract**:
1. `analyzeFile()` → `llmApiService.analyzeFile()`
2. Dependencies to inject:
   - `IFileReader` (for readFileContent)
   - `IPromptBuilder` (for prompt building)
   - `ILLMProvider` (for API calls)
   - `IResponseParser` (for parsing)

**Step-by-Step Migration**:

1. **Create `src/ai/services/llmApiService.ts`**:
```typescript
export interface ILLMApiService {
    analyzeFile(file: FileInfo, workspaceRoot: string): Promise<FileSummary>;
}

export class LLMApiService implements ILLMApiService {
    constructor(
        private fileReader: IFileReader,
        private promptBuilder: IPromptBuilder,
        private provider: ILLMProvider,
        private responseParser: IResponseParser
    ) {}
    
    async analyzeFile(file: FileInfo, workspaceRoot: string): Promise<FileSummary> {
        // [Extracted code here]
    }
}
```

2. **Update `src/llmService.ts`**:
   - Remove `analyzeFile()` method
   - Add `private apiService: ILLMApiService`
   - Update `generateEnhancedProductDocs()` to call `this.apiService.analyzeFile()`

3. **Update Call Sites**:
   - `generateEnhancedProductDocs()` (line 175): Change `this.analyzeFile()` to `this.apiService.analyzeFile()`

**Dependencies to Resolve**:
- `readFileContent()` is in `fileDocumentation.ts` - extract to `IFileReader` interface
- `detectFileRole()` is in `fileDocumentation.ts` - extract to `IFileRoleDetector` interface

**Testing Checklist**:
- [ ] Unit test `LLMApiService.analyzeFile()` with mocked dependencies
- [ ] Integration test `generateEnhancedProductDocs()` with real `LLMApiService`
- [ ] Verify no breaking changes to public API
```

