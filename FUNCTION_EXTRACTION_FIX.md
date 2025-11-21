# Function Extraction Fix

## Problem
The regex-based function extraction in `src/analyzer.ts` was incorrectly identifying control flow keywords (`for`, `if`, `switch`, `while`, `catch`) as function names. This caused the test generation system to attempt to create tests for "function named 'for'" instead of actual functions.

### Root Cause
The `methodRegex` pattern in `extractJavaScriptFunctions()` was too greedy:

```typescript
const methodRegex = /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/;
```

This matched ANY word followed by `(...)` and `{`, including:
- `for (const item of items) {` → captured "for"
- `if (condition) {` → captured "if"
- `switch (value) {` → captured "switch"

### Example Error
```
[Phase 3] Generated test 1/5: for
error TS2305: Module '"../src/analyzer"' has no exported member 'CodeAnalyzer___file_processing_loop'.
```

## Solution: LLM-Based Function Extraction

Instead of using fragile regex patterns, we now let the LLM extract functions directly from source code.

### New Architecture

```
OLD FLOW (Broken):
Regex parser → Extract "for", "if", "switch" → Pass to LLM → LLM tries to test "for loop"

NEW FLOW (Fixed):
Send source files to LLM → LLM extracts real functions with context → Generate tests
```

### Benefits

1. **Accuracy** - LLM understands language semantics, not just text patterns
2. **Context** - Extracts function metadata (complexity, dependencies, testability) in one pass
3. **Multi-language** - Works for TypeScript, Python, Java, Go, etc. with same prompt
4. **Less Code** - Eliminates hundreds of lines of brittle regex patterns
5. **Maintainability** - Update prompt instead of debugging regexes

### New Files Created

- `src/domain/prompts/functionExtractionPrompt.ts` - Prompts for LLM to extract functions
- `src/domain/services/testing/llmFunctionExtractionService.ts` - Service orchestrating extraction

### Modified Files

- `src/domain/services/testing/llmTestPlanningService.ts` - Updated `analyzeFunctions()` to use LLM
- `src/llmIntegration.ts` - Updated test generation flow to call new LLM-based extraction

### Prompt Design

The extraction prompt explicitly instructs the LLM:

```
**CRITICAL RULES:**
1. **Only extract actual functions/methods/classes** - NOT control flow keywords (for, if, while, switch, catch, etc.)
2. **Include:**
   - Named function declarations (function foo() {})
   - Arrow functions assigned to variables (const foo = () => {})
   - Class methods (myMethod() {})
   - Class declarations (class Foo {})
3. **Exclude:**
   - Control flow statements (if, for, while, switch, etc.)
   - Anonymous functions not assigned to variables
```

### Output Format

The LLM returns structured JSON with rich metadata:

```json
{
  "functions": [
    {
      "name": "analyzeWorkspace",
      "file": "src/analyzer.ts",
      "startLine": 143,
      "endLine": 248,
      "lines": 105,
      "language": "typescript",
      "complexity": "high",
      "is_public": true,
      "is_async": true,
      "parameters": ["workspaceRoot: string"],
      "return_type": "Promise<CodeAnalysis>",
      "dependencies": ["fs", "path", "findCodeFiles"],
      "requires_mocking": true,
      "testability": "high",
      "reason": "Core entry point for workspace analysis"
    }
  ]
}
```

## Testing the Fix

### Before
```
[Phase 3] Generated test 1/5: for
[Phase 3] Generated test 2/5: if
[Phase 3] Generated test 3/5: switch
error TS2305: Module has no exported member 'for'
```

### After
```
[FunctionExtraction] Analyzing 15 files...
[FunctionExtraction] Extracted 42 functions from batch
[Phase 3] Generated test 1/5: analyzeWorkspace
[Phase 3] Generated test 2/5: extractFunctions
[Phase 3] Generated test 3/5: findCodeFiles
✅ Tests generated successfully
```

## Migration Notes

### Legacy Code Preserved

The old regex-based extraction is preserved as `analyzeFunctionsLegacy()` in case rollback is needed:

```typescript
/**
 * @deprecated Use analyzeFunctions with LLM extraction instead
 * Legacy method that used regex-based extraction (captured control flow keywords incorrectly)
 */
static analyzeFunctionsLegacy(codeAnalysis: any): any[] {
  // ... old implementation
}
```

### Performance Considerations

- **Batching**: Processes 5 files at a time to avoid token limits
- **Caching**: Consider caching extraction results per file/content hash
- **Cost**: LLM API calls add cost but provide much higher accuracy

### Future Improvements

1. **Caching**: Cache extraction results by file content hash
2. **Incremental**: Only re-extract changed files
3. **Parallel**: Process multiple batches concurrently
4. **Filtering**: Let users configure which files to analyze

## Verification

To verify the fix is working:

1. Run "Generate Unit Tests" command
2. Check logs for:
   ```
   [TestPlanning] Extracting functions using LLM (replaces regex extraction)...
   [FunctionExtraction] Analyzing X files...
   [FunctionExtraction] Extracted Y functions from batch
   ```
3. Verify generated test files contain real function names, not keywords
4. Confirm no errors like `has no exported member 'for'`

## Related Issues

- Control flow keywords captured as functions
- Test generation failing with "module has no exported member 'for'"
- Duplicate code detection across LLM flows
- Test creation getting wrong data from other LLM flows

## References

- Issue: "our test creation is still getting the wrong data from the other llm creation flows"
- Error Log: Shadow Watch extension output showing "for", "if", "switch" as function names
- Code: `src/analyzer.ts:409-444` (old regex extraction)
