# Shadow Watch Enhancement: Duplicate System Detection

## Problem Statement

Shadow Watch failed to detect that the codebase has **two incompatible test generation systems**:
- OLD: Uses `unit_test_plan.json` with `aggregated_plan` structure
- NEW: Uses `test-plan.json` with `function_groups` structure

This is exactly the type of architectural issue Shadow Watch was built to find.

## Why Current System Missed It

### 1. No Semantic Duplication Detection
**Current behavior:**
- Detects literal duplicate code (copy-paste)
- Detects circular dependencies
- Detects large files

**Missing:**
- Functions that solve the same problem differently
- Multiple implementations of the same feature
- Conflicting data formats/schemas

### 2. No Data Format Analysis
**Missing:**
- JSON schema extraction and comparison
- File format expectations vs. actual files
- Data structure compatibility checking

### 3. No Intent/Purpose Analysis
**Missing:**
- "What is this function trying to accomplish?"
- "Are there other functions with the same goal?"
- "Do these implementations conflict?"

## Proposed Enhancements

### Enhancement 1: Semantic Duplicate Detection

Add to architecture insights prompt:

```markdown
## Duplicate System Detection

Analyze the codebase for:

1. **Multiple Implementations of Same Feature**
   - Functions/modules that appear to solve the same problem
   - Different approaches to the same requirement
   - Competing implementations (old vs. new)

2. **Conflicting Data Formats**
   - Multiple schemas for the same data
   - Incompatible file formats
   - Functions expecting different structures for same concept

3. **Abandoned/Incomplete Migrations**
   - Code that references old formats
   - Functions that create data no other function consumes
   - Dead-end file paths or data structures

For each duplicate system found:
- **System A**: Description, files, entry points
- **System B**: Description, files, entry points  
- **Conflict**: How they're incompatible
- **Evidence**: Which code uses which system
- **Recommendation**: Which to keep and why
```

### Enhancement 2: Data Flow Analysis

New analysis phase that:

1. **Extracts all JSON schemas** from:
   - JSON.parse() calls
   - Type definitions
   - File reads/writes with JSON content

2. **Tracks data producers and consumers**:
   - What writes to `.shadow/test-plan.json`?
   - What reads from `.shadow/test-plan.json`?
   - Are the formats compatible?

3. **Detects format mismatches**:
   ```typescript
   // Producer writes:
   { "function_groups": [...] }
   
   // Consumer expects:
   { "aggregated_plan": { "test_suites": [...] } }
   
   // MISMATCH DETECTED!
   ```

### Enhancement 3: Function Purpose Clustering

Use LLM to:

1. **Classify all functions by purpose**:
   ```json
   {
     "test-generation": [
       "generateUnitTests",
       "generateTestPlan", 
       "createTestStrategy"
     ],
     "test-execution": [
       "runUnitTests",
       "executeTests"
     ]
   }
   ```

2. **Within each cluster, detect duplicates**:
   - Multiple entry points for same feature
   - Similar function signatures
   - Similar dependencies

3. **Flag for review**:
   ```markdown
   ### ⚠️ Duplicate System: Unit Test Generation
   
   **System A (OLD):**
   - Entry: `generateUnitTests()` (line 1435)
   - Creates: `unit_test_plan.json`
   - Format: `{ aggregated_plan: { test_suites: [...] } }`
   - Used by: `runUnitTests()` (line 2443)
   
   **System B (NEW):**
   - Entry: `generateUnitTests()` via LLM services
   - Creates: `test-plan.json`
   - Format: `{ function_groups: [...] }`
   - Used by: Nothing! (Dead code!)
   
   **Conflict:** Same entry point, different outputs, incompatible formats
   
   **Recommendation:** Remove OLD system, update `runUnitTests()` to use NEW format
   ```

### Enhancement 4: File I/O Analysis

Track all file operations:

```typescript
{
  "file": ".shadow/test-plan.json",
  "writers": [
    "LLMTestPlanningService.saveTestPlan() @ line 62"
  ],
  "readers": [
    // NONE! Dead file!
  ],
  "schema": { "function_groups": [...] }
}

{
  "file": ".shadow/UnitTests/unit_test_plan.json",
  "writers": [
    // NONE! File doesn't exist!
  ],
  "readers": [
    "runUnitTests() @ line 2455-2466"
  ],
  "schema": { "aggregated_plan": { "test_suites": [...] } }
}

// MISMATCH: Reader expects file that's never written!
```

## Implementation Plan

### Phase 1: Add Semantic Analysis to Architecture Insights

**File:** `src/domain/prompts/architecturePrompts.ts`

Add section to prompt:
```typescript
export function buildArchitectureAnalysisPrompt(analysis: CodeAnalysis): string {
  return `...existing prompt...
  
## CRITICAL: Duplicate System Detection

Analyze for multiple implementations of the same feature:

1. Identify functions/modules with similar purposes
2. Check if they produce/consume incompatible data formats
3. Find code that creates data nothing consumes
4. Find code that expects data nothing creates
5. Flag incomplete migrations (old + new system coexist)

Output format:
{
  "duplicate_systems": [
    {
      "system_name": "Unit Test Generation",
      "implementations": [
        {
          "id": "old",
          "entry_points": ["generateUnitTests @ llmIntegration.ts:1435"],
          "data_format": { "file": "unit_test_plan.json", "schema": {...} },
          "consumers": ["runUnitTests @ llmIntegration.ts:2443"]
        },
        {
          "id": "new", 
          "entry_points": ["generateUnitTests @ llmIntegration.ts:1495"],
          "data_format": { "file": "test-plan.json", "schema": {...} },
          "consumers": []  // RED FLAG!
        }
      ],
      "conflict": "Same entry point, incompatible formats, orphaned data",
      "recommendation": "Remove OLD, update runUnitTests() to use NEW format"
    }
  ]
}
`;
}
```

### Phase 2: Add Data Flow Analyzer

**New File:** `src/analysis/dataFlowAnalyzer.ts`

```typescript
export class DataFlowAnalyzer {
  /**
   * Find all JSON file operations
   */
  analyzeJSONFiles(analysis: CodeAnalysis): DataFlowMap {
    const files = new Map<string, FileDataFlow>();
    
    // Extract from fs.readFileSync/writeFileSync calls
    // Extract from JSON.parse/JSON.stringify
    // Match producers to consumers
    // Flag mismatches
    
    return files;
  }
  
  /**
   * Detect schema incompatibilities
   */
  detectSchemaConflicts(dataFlow: DataFlowMap): SchemaConflict[] {
    // Compare writer schema vs. reader expectations
    // Flag when reader expects field writer doesn't provide
    // Flag when writer creates file reader doesn't exist
  }
}
```

### Phase 3: Add to Refactoring Report

**File:** `src/llmService.ts` (refactoring report generation)

Include duplicate systems section:

```markdown
## 🚨 Critical: Duplicate/Conflicting Systems

The following systems have multiple incompatible implementations:

### Unit Test Generation
- **OLD System:** `generateUnitTests()` → `unit_test_plan.json` → `runUnitTests()`
  - Status: ❌ Partially broken (runUnitTests expects this format)
  - Format: `{ aggregated_plan: { test_suites: [] } }`
  
- **NEW System:** 4-Phase LLM → `test-plan.json` → ???
  - Status: ✅ Generates files correctly
  - Format: `{ function_groups: [] }`
  - Problem: Nothing reads this file!

**CONFLICT:** runUnitTests() looks for OLD format that NEW system doesn't create

**RECOMMENDED FIX:**
1. Update runUnitTests() to read test-plan.json (NEW format)
2. Remove OLD generateUnitTests() implementation
3. Remove buildUnitTestPlanPrompt() (2000+ lines)
```

## Success Criteria

After implementing these enhancements, Shadow Watch should:

1. ✅ Detect when 2+ functions serve the same purpose
2. ✅ Identify incompatible data formats between producer/consumer
3. ✅ Flag files that are written but never read
4. ✅ Flag functions that expect files that don't exist
5. ✅ Recommend which system to keep and which to remove
6. ✅ Appear prominently in refactoring report

## Testing This Enhancement

Use the test generation system as a test case:

1. Run architecture analysis
2. Check if report contains:
   - "Duplicate system: Test Generation"
   - Details about OLD vs. NEW
   - Schema mismatch between test-plan.json formats
   - Recommendation to consolidate

3. Verify it flags:
   - `runUnitTests()` expects `unit_test_plan.json` (doesn't exist)
   - `test-plan.json` is created but never read
   - Same feature has 2 entry points with different outputs

## Priority

**CRITICAL** - This is core to Shadow Watch's value proposition.

Without this, Shadow Watch is just a fancy linter. With this, it becomes an architectural integrity guardian that prevents exactly the kind of problem we just debugged.
