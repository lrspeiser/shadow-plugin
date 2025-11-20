# Test Generation Infinite Loop Fixes

## Date
2025-11-20

## Problem
Test generation was stuck in an infinite retry loop when syntax validation failed, causing the same files to be repeatedly "fixed" without actually resolving issues. Logs showed 26+ failed fix attempts for the same files.

## Root Causes Identified

### 1. No Re-validation After Syntax Fix
**Location**: `src/domain/services/testing/llmTestGenerationService.ts:165-169`

After `fixSyntaxError()` wrote fixed code to disk, it returned `success: true` without re-validating that the syntax was actually fixed. This caused Phase 3 to think the fix worked, but Phase 4 would find the same syntax error and retry.

**Before**:
```typescript
fs.writeFileSync(testFilePath, fixResult.fixed_code, 'utf-8');
SWLogger.log(`[TestGeneration] Fixed syntax error: ${fixResult.explanation}`);
return { success: true, fixedCode: fixResult.fixed_code };
```

**After**:
```typescript
fs.writeFileSync(testFilePath, fixResult.fixed_code, 'utf-8');
SWLogger.log(`[TestGeneration] Applied LLM fix: ${fixResult.explanation}`);

// Re-validate syntax to confirm fix worked
const revalidation = await TestExecutionService.validateSyntax(workspaceRoot, testFilePath);
if (revalidation.valid) {
    SWLogger.log(`[TestGeneration] ✅ Syntax fix verified successfully`);
    return { success: true, fixedCode: fixResult.fixed_code };
} else {
    SWLogger.log(`[TestGeneration] ❌ Syntax fix failed re-validation: ${revalidation.error}`);
    return { success: false, error: `Fix applied but syntax still invalid: ${revalidation.error}` };
}
```

### 2. No Retry Limit in Phase 3
**Location**: `src/llmIntegration.ts:1602-1617`

Phase 3 had no retry limit for syntax fixes. If the LLM couldn't fix the syntax, it would continue indefinitely.

**Before**:
```typescript
// Validate syntax
const syntaxCheck = await LLMTestGenerationService.validateSyntax(testFilePath, workspaceRoot);
if (!syntaxCheck.valid) {
    SWLogger.log(`[Phase 3] Syntax error in ${testFilePath}, attempting fix...`);
    const fixResult = await LLMTestGenerationService.fixSyntaxError(...);
    if (fixResult.success) {
        SWLogger.log(`[Phase 3] Fixed syntax error in ${testFilePath}`);
    }
    // NO ELSE CLAUSE - silent failure!
}
```

**After**:
```typescript
// Validate syntax with retry limit
let syntaxValid = false;
let attempts = 0;
const MAX_SYNTAX_FIX_ATTEMPTS = 2;

while (!syntaxValid && attempts < MAX_SYNTAX_FIX_ATTEMPTS) {
    const syntaxCheck = await LLMTestGenerationService.validateSyntax(testFilePath, workspaceRoot);
    
    if (syntaxCheck.valid) {
        syntaxValid = true;
        if (attempts > 0) {
            SWLogger.log(`[Phase 3] ✅ Syntax valid after ${attempts} fix attempt(s)`);
        }
        break;
    }
    
    attempts++;
    
    if (attempts >= MAX_SYNTAX_FIX_ATTEMPTS) {
        SWLogger.log(`[Phase 3] ❌ Giving up on ${testFilePath} after ${MAX_SYNTAX_FIX_ATTEMPTS} failed fix attempts`);
        SWLogger.log(`[Phase 3] Final syntax error: ${syntaxCheck.error}`);
        break;
    }
    
    SWLogger.log(`[Phase 3] Syntax error in ${testFilePath}, attempting fix (${attempts}/${MAX_SYNTAX_FIX_ATTEMPTS})...`);
    SWLogger.log(`[Phase 3] Error: ${syntaxCheck.error}`);
    
    const fixResult = await LLMTestGenerationService.fixSyntaxError(...);
    
    if (fixResult.success) {
        SWLogger.log(`[Phase 3] LLM applied fix, re-validating...`);
    } else {
        SWLogger.log(`[Phase 3] ❌ LLM fix failed: ${fixResult.error}`);
        break; // No point continuing if LLM can't fix it
    }
}
```

### 3. File Overwrites Without Tracking
**Location**: `src/llmIntegration.ts:1578-1600`

The same test files were being written multiple times without tracking which files had already been generated.

**Added**:
```typescript
const generatedFilePaths = new Set<string>(); // Track generated files
const syntaxFixAttempts = new Map<string, number>(); // Track fix attempts per file

// ... later in loop ...
if (generatedFilePaths.has(testFilePath)) {
    SWLogger.log(`[Phase 3] Skipping duplicate file: ${testFilePath}`);
    continue;
}
generatedFilePaths.add(testFilePath);
```

### 4. Poor JSON Parse Error Handling
**Location**: `src/llmService.ts:3131-3140` and `3174-3183`

JSON parsing errors from the LLM were being thrown without logging the actual content that failed to parse.

**Before**:
```typescript
const jsonMatch = content.match(/\{[\s\S]*\}/);
if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
}
throw new Error('No JSON found in response');
```

**After**:
```typescript
const content = response.content || '';

if (!content) {
    throw new Error('LLM returned empty response');
}

const jsonMatch = content.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
    SWLogger.log(`[LLM] No JSON found in response. Content: ${content.substring(0, 200)}...`);
    throw new Error('No JSON found in response');
}

try {
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
} catch (parseError: any) {
    SWLogger.log(`[LLM] JSON parse error: ${parseError.message}`);
    SWLogger.log(`[LLM] Attempted to parse: ${jsonMatch[0].substring(0, 500)}...`);
    throw new Error(`Invalid JSON in response: ${parseError.message}`);
}
```

### 5. Missing Phase 3 Summary
**Location**: `src/llmIntegration.ts:1658-1666`

Added summary logging to show statistics about syntax issues.

**Added**:
```typescript
// Log Phase 3 summary
const filesWithSyntaxIssues = syntaxFixAttempts.size;
const totalSyntaxFixAttempts = Array.from(syntaxFixAttempts.values()).reduce((sum, count) => sum + count, 0);

SWLogger.log(`[Phase 3] Generated ${testFiles.length} test files`);
if (filesWithSyntaxIssues > 0) {
    SWLogger.log(`[Phase 3] Files with syntax issues: ${filesWithSyntaxIssues}, Total fix attempts: ${totalSyntaxFixAttempts}`);
}
```

## Expected Outcomes

1. **No more infinite loops**: Test generation will stop after 2 failed syntax fix attempts per file
2. **Better error visibility**: All failures are logged with clear error messages and the actual content that failed to parse
3. **Accurate success tracking**: Syntax fixes are re-validated before being marked as successful
4. **No duplicate work**: Files are tracked and duplicates are skipped
5. **Clear statistics**: Phase 3 summary shows how many files had syntax issues and how many fix attempts were made

## Testing Recommendations

1. Run test generation on a small codebase to verify the retry limit works
2. Check logs to confirm:
   - Syntax fixes are re-validated
   - Failed fixes show attempt counts (1/2, 2/2)
   - JSON parse errors include the malformed content
   - Phase 3 summary shows syntax issue statistics
3. Verify no test files are generated more than once (check for "Skipping duplicate file" messages)

## Related Files Modified

- `src/domain/services/testing/llmTestGenerationService.ts`
- `src/llmIntegration.ts`
- `src/llmService.ts`

## Compilation Status

✅ All changes compile successfully with no TypeScript errors.
