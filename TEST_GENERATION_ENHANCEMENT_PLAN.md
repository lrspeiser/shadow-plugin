# Test Generation Enhancement Plan

## Executive Summary

The proposed "Diffblue-style" test generation approach is excellent and aligns well with your architecture. However, it should be **broken down into smaller, focused prompts** rather than monolithic ones. This document outlines what to add, how to break it down, and integration points.

## Current State Analysis

### ✅ What You Already Have

1. **Basic Static Analysis** (`analyzer.ts`):
   - Function extraction (name, location, lines)
   - Import extraction
   - Language detection
   - File structure analysis
   - Entry point detection

2. **Test Generation** (`llmService.ts`):
   - Unit test plan generation (monolithic prompt)
   - Test code generation
   - Test file writing

3. **Context Building**:
   - Product documentation
   - Architecture insights
   - Code analysis context

### ❌ What's Missing (from proposal)

1. **Per-file static analysis metadata**:
   - Branch/control flow analysis (if/else, switch, loops)
   - Dependency profiling (db, http, filesystem, etc.)
   - State mutation tracking
   - Parameter types and return types

2. **Test gap analysis**:
   - Mapping existing tests to source functions
   - Identifying untested functions
   - Identifying untested branches

3. **Behavioral hints extraction**:
   - Docstring/comment parsing
   - Constraint extraction
   - Error condition documentation

4. **Structured test planning**:
   - Two-stage approach (plan → generate)
   - Per-file test plans
   - Test category classification

## Integration Strategy

### Phase 1: Enhance Static Analysis (Preprocessing)

**Goal**: Build richer metadata before prompts run.

#### 1.1 Extend `CodeAnalysis` Interface

Add new fields to capture enhanced analysis:

```typescript
export interface EnhancedCodeAnalysis extends CodeAnalysis {
  // Per-function metadata
  functionMetadata: Map<string, FunctionMetadata>;
  // Test mapping
  testMapping: TestMapping;
}

export interface FunctionMetadata {
  symbolName: string;
  file: string;
  parameters: ParameterInfo[];
  returnType?: string;
  visibility: 'public' | 'private' | 'protected';
  docstring?: string;
  branches: BranchInfo[];
  dependencies: DependencyInfo[];
  stateMutations: StateMutationInfo[];
  riskLevel: 'high' | 'medium' | 'low';
}

export interface BranchInfo {
  type: 'if' | 'elif' | 'else' | 'switch' | 'case' | 'loop' | 'exception';
  condition: string; // Human-readable description
  lineNumber: number;
}

export interface DependencyInfo {
  name: string;
  type: 'db' | 'http' | 'filesystem' | 'message_queue' | 'cache' | 'time' | 'random' | 'other';
  isInternal: boolean; // Internal function call vs external
}

export interface TestMapping {
  sourceFileToTests: Map<string, string[]>; // source file -> test files
  functionToTests: Map<string, string[]>; // function -> test names
  uncoveredFunctions: string[]; // Functions with no tests
  uncoveredBranches: Map<string, BranchInfo[]>; // Function -> untested branches
}
```

#### 1.2 Add Static Analysis Methods

Create new methods in `CodeAnalyzer` or a new `EnhancedAnalyzer`:

```typescript
// In analyzer.ts or new enhancedAnalyzer.ts
class EnhancedAnalyzer {
  extractBranches(content: string, language: string, functionName: string): BranchInfo[]
  extractDependencies(content: string, language: string, functionName: string): DependencyInfo[]
  extractBehavioralHints(content: string, language: string, functionName: string): BehavioralHints
  mapExistingTests(workspaceRoot: string, sourceFiles: string[]): TestMapping
}
```

**Implementation Notes**:
- Use AST parsing where possible (TypeScript compiler API, Python AST, etc.)
- Fall back to regex for languages without good AST support
- Cache results to avoid re-analysis

### Phase 2: Break Down Prompts

**Goal**: Replace monolithic test prompt with focused, reusable prompts.

#### 2.1 Create Separate Prompt Methods

Add to `PromptBuilder`:

```typescript
// Per-file test planning (NEW - from proposal)
buildPerFileTestPlanPrompt(
  filePath: string,
  fileContent: string,
  functionMetadata: FunctionMetadata[],
  existingTests: string[],
  language: string,
  testFramework: string
): string

// Test code generation (NEW - separate from planning)
buildTestCodeGenerationPrompt(
  testPlan: TestPlanItem,
  sourceCode: string,
  language: string,
  testFramework: string
): string

// Test gap analysis (NEW)
buildTestGapAnalysisPrompt(
  sourceFile: string,
  functions: FunctionMetadata[],
  existingTests: string[]
): string
```

#### 2.2 Two-Stage Test Generation Flow

**Current Flow** (monolithic):
```
Code → Single Large Prompt → Test Plan + Test Code
```

**Proposed Flow** (two-stage):
```
Code → Enhanced Analysis → Test Plan Prompt → Test Plan JSON
Test Plan JSON → Test Code Prompt → Individual Test Code
```

**Benefits**:
- Smaller prompts = better LLM focus
- Can iterate on plans without regenerating code
- Can generate code incrementally
- Easier to cache and reuse plans

### Phase 3: Integrate Proposal's Test Plan Template

#### 3.1 Test Plan Prompt Structure

The proposal's JSON schema is excellent. Adapt it to your system:

```typescript
interface TestPlan {
  file_path: string;
  language: string;
  test_framework: string;
  summary: string;
  targets: TestTarget[];
  notes: string[];
}

interface TestTarget {
  symbol_name: string;
  kind: 'function' | 'method' | 'class' | 'module';
  reason_to_test: string;
  risk_level: 'high' | 'medium' | 'low';
  dependencies: DependencyInfo[];
  coverage_goals: {
    branches_to_cover: string[];
    error_paths_to_cover: string[];
    state_changes_to_verify: string[];
  };
  planned_tests: PlannedTest[];
}

interface PlannedTest {
  id: string;
  category: 'happy_path' | 'error_path' | 'boundary_conditions' | 
            'dependency_mocks' | 'state_mutation' | 'algorithmic_branches' |
            'serialization_conversion' | 'regression_lockin';
  description: string;
  given: {
    inputs: string;
    preconditions: string;
    mocks: string;
  };
  when: string;
  then: {
    assertions: string[];
  };
}
```

#### 3.2 Prompt Template Integration

The proposal's prompt template should be used for `buildPerFileTestPlanPrompt()`. Key sections:

1. **System message**: Defines test categories and JSON schema
2. **User message**: Provides file + metadata
3. **Output**: Structured JSON test plan (no code yet)

## Recommended Implementation Order

### Step 1: Add Basic Branch Analysis (High Value, Low Effort)

Start with simple regex-based branch detection:

```typescript
// In analyzer.ts
extractBranches(content: string, language: string): BranchInfo[] {
  const branches: BranchInfo[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect if statements
    if (line.match(/\bif\s*\(/)) {
      branches.push({
        type: 'if',
        condition: this.extractCondition(line),
        lineNumber: i + 1
      });
    }
    
    // Detect exceptions
    if (line.match(/\bthrow\b|\braise\b/)) {
      branches.push({
        type: 'exception',
        condition: 'Exception thrown',
        lineNumber: i + 1
      });
    }
    
    // Add more patterns...
  }
  
  return branches;
}
```

**Why first**: Provides immediate value without heavy dependencies.

### Step 2: Add Dependency Profiling (Medium Effort)

Detect dependency types from imports and function calls:

```typescript
extractDependencies(content: string, language: string): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  
  // Detect database calls
  if (content.match(/\b(db|database|sql|orm|repository)\./i)) {
    deps.push({ name: 'database', type: 'db', isInternal: false });
  }
  
  // Detect HTTP calls
  if (content.match(/\b(fetch|http|axios|request)\./i)) {
    deps.push({ name: 'http', type: 'http', isInternal: false });
  }
  
  // Detect file system
  if (content.match(/\b(fs|file|readFile|writeFile)\./i)) {
    deps.push({ name: 'filesystem', type: 'filesystem', isInternal: false });
  }
  
  return deps;
}
```

### Step 3: Add Test Mapping (Medium Effort)

Map existing tests to source files:

```typescript
async mapExistingTests(workspaceRoot: string, sourceFiles: string[]): Promise<TestMapping> {
  const testFiles = this.findTestFiles(workspaceRoot);
  const mapping: TestMapping = {
    sourceFileToTests: new Map(),
    functionToTests: new Map(),
    uncoveredFunctions: [],
    uncoveredBranches: new Map()
  };
  
  for (const testFile of testFiles) {
    const content = fs.readFileSync(testFile, 'utf-8');
    const sourceFile = this.inferSourceFile(testFile, content);
    const testNames = this.extractTestNames(content);
    
    if (sourceFile) {
      if (!mapping.sourceFileToTests.has(sourceFile)) {
        mapping.sourceFileToTests.set(sourceFile, []);
      }
      mapping.sourceFileToTests.get(sourceFile)!.push(testFile);
      
      // Map test names to functions (heuristic)
      for (const testName of testNames) {
        const functionName = this.inferFunctionFromTestName(testName);
        if (functionName) {
          if (!mapping.functionToTests.has(functionName)) {
            mapping.functionToTests.set(functionName, []);
          }
          mapping.functionToTests.get(functionName)!.push(testName);
        }
      }
    }
  }
  
  return mapping;
}
```

### Step 4: Create Per-File Test Plan Prompt (High Value)

Add `buildPerFileTestPlanPrompt()` to `PromptBuilder`:

```typescript
buildPerFileTestPlanPrompt(
  filePath: string,
  fileContent: string,
  functionMetadata: FunctionMetadata[],
  existingTests: string[],
  language: string,
  testFramework: string,
  projectSummary?: string
): string {
  // Use the proposal's template structure
  return `SYSTEM:
You are an automated test planner for a multi-language codebase.
[Use proposal's system message exactly]

USER:
Here is the project context:
- Language: ${language}
- Preferred unit test framework: ${testFramework}
- Project summary: ${projectSummary || 'N/A'}

Here is the static analysis for this file:
- File path: ${filePath}
- Symbol table: ${JSON.stringify(functionMetadata.map(f => ({
    name: f.symbolName,
    parameters: f.parameters,
    returnType: f.returnType,
    visibility: f.visibility
  })))}

- Branches per symbol: ${JSON.stringify(functionMetadata.map(f => ({
    symbol: f.symbolName,
    branches: f.branches
  })))}

- Dependency profile: ${JSON.stringify(functionMetadata.map(f => ({
    symbol: f.symbolName,
    dependencies: f.dependencies
  })))}

- Existing tests: ${JSON.stringify(existingTests)}

Now here is the FULL SOURCE CODE:
\`\`\`${language}
${fileContent}
\`\`\`

Using ALL of the above, generate the JSON test plan described in the system message.
Do NOT generate any test code, only the plan.`;
}
```

### Step 5: Create Test Code Generation Prompt (Separate Stage)

```typescript
buildTestCodeGenerationPrompt(
  testPlan: PlannedTest,
  sourceCode: string,
  functionCode: string,
  language: string,
  testFramework: string
): string {
  return `Generate executable test code for this test plan item.

Test Plan:
${JSON.stringify(testPlan, null, 2)}

Source Function:
\`\`\`${language}
${functionCode}
\`\`\`

Requirements:
- Language: ${language}
- Framework: ${testFramework}
- Test ID: ${testPlan.id}
- Category: ${testPlan.category}
- Return ONLY plain source code text (NO markdown, NO HTML, NO triple backticks)
- Include all imports and setup
- Use proper mocking for dependencies
- Include all assertions from the plan`;
}
```

## What NOT to Add (Yet)

1. **Full AST parsing**: Start with regex, add AST later if needed
2. **Coverage tool integration**: Can add later, heuristic mapping is fine for now
3. **Complex state mutation tracking**: Start simple, enhance later
4. **Multi-language AST support**: Focus on TypeScript/JavaScript first

## Integration Points

### Where to Add Code

1. **Enhanced Analysis**:
   - Option A: Extend `analyzer.ts` with new methods
   - Option B: Create `src/analysis/enhancedAnalyzer.ts` (cleaner separation)

2. **New Prompts**:
   - Add to `src/domain/prompts/promptBuilder.ts`
   - Keep existing prompts, add new ones

3. **Test Planning Flow**:
   - Modify `llmService.ts` to use two-stage approach
   - Or create `src/domain/services/testPlanningService.ts`

### Breaking Changes

- None! All additions are optional enhancements
- Existing test generation continues to work
- New features are opt-in

## Example Usage Flow

```typescript
// 1. Enhanced analysis (once per file)
const enhancedAnalysis = await enhancedAnalyzer.analyzeFile(filePath);
const testMapping = await enhancedAnalyzer.mapExistingTests(workspaceRoot, [filePath]);

// 2. Generate test plan (per file)
const planPrompt = promptBuilder.buildPerFileTestPlanPrompt(
  filePath,
  fileContent,
  enhancedAnalysis.functionMetadata,
  testMapping.sourceFileToTests.get(filePath) || [],
  language,
  testFramework
);
const testPlan = await llmService.generateTestPlan(planPrompt);

// 3. Generate test code (per test item)
for (const target of testPlan.targets) {
  for (const plannedTest of target.planned_tests) {
    const codePrompt = promptBuilder.buildTestCodeGenerationPrompt(
      plannedTest,
      fileContent,
      extractFunctionCode(fileContent, target.symbol_name),
      language,
      testFramework
    );
    const testCode = await llmService.generateTestCode(codePrompt);
    // Write test code...
  }
}
```

## Benefits of This Approach

1. **Modular**: Each prompt has a single, clear purpose
2. **Reusable**: Test plans can be cached, reviewed, modified
3. **Incremental**: Can generate tests for one file at a time
4. **Maintainable**: Easier to update individual prompts
5. **Testable**: Can test each stage independently

## Next Steps

1. ✅ Review this plan
2. Implement Step 1 (branch analysis) - quick win
3. Implement Step 2 (dependency profiling) - medium effort
4. Implement Step 4 (per-file test plan prompt) - high value
5. Refactor existing test generation to use two-stage approach
6. Add Step 3 (test mapping) when ready

## Questions to Consider

1. **AST vs Regex**: Start with regex, or invest in AST parsing from the start?
2. **Caching**: Should enhanced analysis be cached? (Yes, probably)
3. **Incremental**: Generate plans for all files at once, or one at a time?
4. **Backward compatibility**: Keep old prompt as fallback?

