# Refactoring Report Generation Strategy

## Answers to Your Questions

### 1. How to make the report more prescriptive?

**Current Problem**: The prompt asks for "specific recommendations" but doesn't demand detailed extraction plans.

**Solution**: Enhance the prompt to require:
- ✅ Function-by-function extraction mapping
- ✅ Step-by-step migration instructions (numbered steps)
- ✅ Code examples (before/after)
- ✅ Dependency resolution strategies
- ✅ Testing checklists

**Implementation**: See `src/domain/prompts/refactoringPromptBuilder.ts` for enhanced prompt builder.

### 2. Do we need to enhance product docs and architecture docs?

**Yes, but in specific ways:**

#### Product Docs Enhancements Needed:
- ✅ **Architectural Patterns Section**: Document which patterns are in use (Layered, Clean Architecture, DDD, etc.)
- ✅ **Layer Boundaries**: Clear definition of what belongs in each layer
- ✅ **Design Principles**: SOLID, DRY, KISS principles to follow
- ✅ **Refactoring Constraints**: What must not change, backward compatibility requirements

#### Architecture Insights Enhancements Needed:
- ✅ **Function-Level Analysis**: Not just file-level, but function complexity and responsibilities
- ✅ **Dependency Graphs**: Call graphs showing which functions depend on which
- ✅ **Specific Refactoring Opportunities**: List specific functions to extract, not just "extract API logic"

**Current State**: Product docs and architecture insights are passed, but they're too high-level. They need more granular detail.

### 3. Do we need to do a better job passing context to the agent?

**Yes, absolutely!** Current issues:

#### What's Missing:
- ❌ **Function Signatures**: Only line counts, not actual signatures
- ❌ **Dependency Information**: No call graphs or dependency mapping
- ❌ **Code Snippets**: No actual code examples in context
- ❌ **Responsibility Mapping**: No clear mapping of what each function does

#### What to Add:
1. **Function Analysis Data Structure**:
   ```typescript
   interface FunctionAnalysis {
       file: string;
       name: string;
       signature: string;
       dependencies: string[];
       dependents: string[];
       responsibilities: string[];
   }
   ```

2. **Pre-process before LLM call**:
   - Extract all function signatures
   - Build dependency graph
   - Map responsibilities
   - Identify circular dependencies
   - Then pass this enhanced context to LLM

3. **Include Code Snippets**:
   - For complex functions, include actual code
   - For large files, include key sections
   - This helps LLM understand context better

**Implementation**: Create a `FunctionAnalyzer` service that processes code before generating the report.

### 4. Should we use many agent calls and assemble?

**Recommendation: Start with enhanced single-agent, then consider multi-agent if needed**

#### Option A: Enhanced Single-Agent (Recommended First)
**Pros**:
- ✅ Simpler to implement
- ✅ Faster (one LLM call)
- ✅ Lower cost
- ✅ Easier to debug

**Cons**:
- ❌ May hit token limits for very large codebases
- ❌ May miss some details if prompt is too long

**When to Use**: For most cases, enhanced single-agent with better context will work.

#### Option B: Multi-Agent Approach
**Pros**:
- ✅ Can handle very large codebases
- ✅ Each agent focuses on specific task
- ✅ Can iterate and refine

**Cons**:
- ❌ More complex to implement
- ❌ Slower (multiple LLM calls)
- ❌ Higher cost
- ❌ Need to coordinate agents

**When to Use**: If single-agent hits limits or produces insufficient detail.

#### Recommended Hybrid Approach:

**Phase 1: Analysis Agent** (Optional, if needed)
- Analyzes code structure
- Extracts function signatures
- Builds dependency graph
- Outputs: Structured data

**Phase 2: Planning Agent** (Main agent)
- Takes structured data from Phase 1
- Takes product docs and architecture insights
- Generates detailed extraction plans
- Outputs: Complete refactoring report

**Why This Works**:
- Phase 1 can be done with static analysis (no LLM needed!)
- Phase 2 gets rich context from Phase 1
- Single LLM call for the actual report
- Best of both worlds

## Recommended Implementation Plan

### Step 1: Enhance Context Preparation (Week 1)
```typescript
// Create FunctionAnalyzer
class FunctionAnalyzer {
    analyzeFile(filePath: string): FunctionAnalysis[] {
        // Parse TypeScript AST
        // Extract function signatures
        // Map dependencies
        // Identify responsibilities
    }
}

// Use before generating report
const functionAnalyses = await analyzer.analyzeAllFiles(largeFiles);
```

### Step 2: Enhance Prompt (Week 1-2)
```typescript
// Update buildComprehensiveReportPrompt
// Add detailed extraction requirements
// Request code examples
// Demand step-by-step instructions
```

### Step 3: Test & Iterate (Week 2)
- Generate test reports
- Compare with manual plans
- Refine based on gaps

### Step 4: Multi-Agent (If Needed, Week 3-4)
- Only if single-agent insufficient
- Start with 2-agent approach
- Expand if needed

## Key Improvements Summary

1. **Enhanced Context**:
   - Function signatures
   - Dependency graphs
   - Code snippets
   - Responsibility mapping

2. **Better Prompts**:
   - Demand specific extraction plans
   - Require step-by-step instructions
   - Request code examples
   - Ask for dependency resolution

3. **Product/Architecture Docs**:
   - Add architectural patterns
   - Define layer boundaries
   - Include design principles
   - Function-level analysis

4. **Multi-Agent (Optional)**:
   - Only if needed
   - Start with static analysis + single LLM call
   - Expand to multiple agents if required

## Expected Outcome

With these improvements, the refactoring report should include:

✅ **For each large file**:
- Complete function inventory
- Responsibility grouping
- Specific extraction mapping (function → target file)
- Step-by-step migration instructions
- Code examples (before/after)
- Dependency resolution strategies
- Testing checklists

✅ **Actionable Instructions**:
- "Extract `analyzeFile()` (lines 263-300) to `src/ai/services/llmApiService.ts`"
- "Update `generateEnhancedProductDocs()` to call `this.apiService.analyzeFile()`"
- "Add `IFileReader` interface and inject as dependency"

Instead of generic:
- "Extract API logic to separate service"
- "Reduce complexity in llmService.ts"

