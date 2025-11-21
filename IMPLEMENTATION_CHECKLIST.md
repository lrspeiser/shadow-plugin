# Implementation Checklist: Duplicate System Detection

## Goal
Make Shadow Watch universally detect:
- Multiple implementations of the same feature
- Incompatible data formats (producer/consumer mismatches)
- Orphaned data files (written but never read)
- Expected files that don't exist (read but never written)

## Files to Modify

### 1. Architecture Prompt Enhancement
**File:** `src/domain/prompts/promptBuilder.ts`  
**Location:** Lines 168-203 ("Duplicate Functionality" section)

**Current text (line 168-172):**
```
**Duplicate Functionality**: Multiple ways to accomplish the same task
- Multiple implementations of the same feature
- Redundant code paths for the same operation
- Overlapping responsibilities between modules
```

**Enhanced text to add:**
```typescript
**Duplicate Functionality & Incompatible Systems**: Multiple ways to accomplish the same task

CRITICAL: Look for systems that SHOULD work together but DON'T due to incompatible formats:

1. **Semantic Duplicates** (not just copy-paste)
   - Multiple entry points for the same feature with different implementations
   - Functions with similar names doing similar things differently
   - Example: Old generateUnitTests() vs New generateUnitTests() with different outputs

2. **Data Format Conflicts**
   - Same logical data stored in multiple incompatible formats
   - Functions that write format A but readers expect format B
   - Example: Writer creates `{ function_groups: [] }` but reader expects `{ aggregated_plan: { test_suites: [] } }`

3. **Producer/Consumer Mismatches**
   - Files that are written but never read (orphaned data)
   - Files that are read but never written (missing data)
   - JSON schemas that don't match between writer and reader
   - Example: Code writes `.shadow/test-plan.json` but `runTests()` looks for `.shadow/unit_test_plan.json`

4. **Incomplete Migrations**
   - Old system + new system coexist
   - Some code uses old format, some uses new format
   - Same feature accessible through multiple incompatible paths
   - Example: OLD test system writes `unit_test_plan.json`, NEW system writes `test-plan.json`, runtime expects OLD format

For EACH duplicate system found, provide:
1. **Title**: "Duplicate System: [Feature Name]"
2. **Description**: 
   - System A: Entry points, data format, consumers
   - System B: Entry points, data format, consumers
   - Conflict: How they're incompatible
   - Evidence: Which code writes what, which code reads what
   - Impact: What breaks when systems don't align
3. **Proposed Fix**: 
   - Which system to keep (and why)
   - Which system to remove
   - How to migrate consumers to unified format
   - Specific files to delete
   - Specific files to update
4. **Relevant Files**: All files involved in both systems
5. **Relevant Functions**: All entry points and data handlers

Example format:
- Title: "Duplicate System: Unit Test Generation"
  Description: "Two incompatible test generation systems coexist:
    
    **OLD System:**
    - Entry: generateUnitTests() @ llmIntegration.ts:1435
    - Creates: .shadow/UnitTests/unit_test_plan.json
    - Format: { aggregated_plan: { test_suites: [] } }
    - Consumers: runUnitTests() @ llmIntegration.ts:2455
    
    **NEW System:**
    - Entry: generateUnitTests() via 4-phase LLM services @ llmIntegration.ts:1495  
    - Creates: .shadow/test-plan.json
    - Format: { function_groups: [] }
    - Consumers: NONE (orphaned!)
    
    **Conflict:** Same entry point name, incompatible output formats, runtime expects OLD format that NEW system doesn't create.
    
    **Impact:** Tests are generated but runUnitTests() fails with 'Unit test plan not found' because it looks for OLD format file that doesn't exist.
    
    **Proposed Fix:**
    1. Keep NEW system (4-phase LLM, better quality)
    2. Update runUnitTests() to read .shadow/test-plan.json with NEW format
    3. Delete OLD system code:
       - Remove buildUnitTestPlanPrompt() (2000+ lines)
       - Remove OLD generateUnitTests() implementation (lines 1435-1664)
    4. Add format compatibility layer in runUnitTests() to handle both formats during migration"
  Relevant Files: ["llmIntegration.ts", "llmTestPlanningService.ts", "llmService.ts"]
  Relevant Functions: ["generateUnitTests (OLD)", "generateUnitTests (NEW)", "runUnitTests", "buildUnitTestPlanPrompt"]
```

### 2. Add to Refactoring Report Prompt
**File:** `src/llmService.ts`  
**Location:** Lines 2332-2335

**Add after line 2335:**
```typescript
2. **Duplication Elimination**
   - Identify duplicate code patterns
   - Suggest consolidation strategies
   - Recommend shared utilities or abstractions
   + **CRITICAL: Identify duplicate SYSTEMS (not just duplicate code)**
   + Look for:
   + - Multiple implementations of the same feature
   + - Incompatible data formats for same logical data
   + - Files written but never read (orphaned data)
   + - Files expected but never written (missing data)
   + - Old + new systems coexisting with incompatible formats
```

### 3. Add Data Flow Analysis (Future Enhancement)
**New File:** `src/analysis/dataFlowAnalyzer.ts`

Create stub for future implementation:
```typescript
/**
 * Data Flow Analyzer
 * Tracks JSON file producers and consumers to detect schema mismatches
 * 
 * TODO: Full implementation
 * - Extract all fs.writeFileSync with JSON content
 * - Extract all fs.readFileSync with JSON.parse
 * - Match producers to consumers by file path
 * - Compare schemas for compatibility
 * - Flag mismatches
 */
export class DataFlowAnalyzer {
  // Placeholder for future implementation
}
```

## Testing

### Before Implementation
Run Shadow Watch on itself and verify it DOES NOT detect the test generation duplicate system issue.

### After Implementation
Run Shadow Watch on itself and verify it DOES detect:
```
⚠️ Duplicate System: Unit Test Generation
- OLD system creates unit_test_plan.json
- NEW system creates test-plan.json
- runUnitTests() expects OLD format
- Recommendation: Consolidate to NEW format
```

## Success Criteria

1. ✅ Enhanced prompt is in `promptBuilder.ts`
2. ✅ Refactoring prompt mentions duplicate systems
3. ✅ Architecture insights detect duplicate test generation system
4. ✅ Report clearly shows System A vs System B with format mismatch
5. ✅ Recommendations specify which system to keep and which to remove
6. ✅ Works on ANY codebase, not just Shadow Watch

## Priority

**CRITICAL - MUST IMPLEMENT**

This is the core value proposition of Shadow Watch. Without this, it's just a linter. With this, it becomes an architectural guardian that prevents the exact type of bug we just spent hours debugging.

## Estimated Implementation Time

- Prompt enhancement: 30 minutes
- Testing on Shadow Watch codebase: 30 minutes  
- Validation on other codebases: 1 hour
- **Total: 2 hours**

## Next Steps

1. Implement prompt enhancements in `promptBuilder.ts`
2. Rebuild VSIX
3. Run Shadow Watch on itself
4. Verify it detects the test generation duplicate system
5. If successful, this enhancement becomes permanent for all projects
