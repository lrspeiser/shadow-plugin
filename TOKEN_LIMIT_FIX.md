# Token Limit Fix - Unit Test Generation

## Problem
Unit test generation was failing with error:
```
Failed to generate unit tests: 400 {"type":"error","error":{"type":"invalid_request_error","message":"prompt is too long: 205426 tokens > 200000 maximum"}}
```

## Root Cause
The old monolithic approach was trying to pass **all codebase data** to the LLM in one giant prompt:
- All files with all functions (~180K tokens)
- Top 100 functions with full details  
- Import data for 50 files
- Product docs, architecture insights
- **Total: 205K+ tokens**

This defeated the purpose of the synthesis phase. We were synthesizing documents to compress information, then passing both the raw data AND the synthesized docs.

## Solution Architecture

The fix uses the **proper incremental LLM-based test generation** system that already exists in the codebase:

### Phase 1: Setup (Small LLM Call)
- Detect test environment
- Generate setup plan if needed
- **Prompt**: Just workspace structure + package.json (~1K tokens)

### Phase 2: Planning (Medium LLM Call) 
- Use **synthesized docs only** to create test strategy
- **Prompt**: Stats + entry points + product overview + architecture insights (~5-10K tokens)
- **Output**: Prioritized list of functions to test (top 30)

### Phase 3: Generation (Many Small LLM Calls)
- Generate tests in batches of 5 functions
- **Prompt per batch**: 1 function + its source code (~500-1K tokens)
- **Output**: Complete test file for that function
- Write immediately, validate syntax, fix if needed

### Phase 4: Validation (Reactive LLM Calls)
- Run tests, capture failures
- **Prompt per failure**: Test code + error + source (~2K tokens)
- **Output**: Fixed test code

## Changes Made

### 1. Fixed Monolithic Prompt (Removed, but kept as fallback)
`src/llmService.ts` - `buildUnitTestPlanPrompt()`:
- Removed all raw file listings
- Removed top 100 function details
- Kept only entry points (10 max)
- Now relies on synthesized docs

### 2. Fixed Planning Prompt (Primary Fix)
`src/domain/prompts/testPrompts.ts` - `buildPlanningPrompt()`:
- **BEFORE**: Listed all 100 functions with details
- **AFTER**: Just statistics + entry points + synthesized docs
- Relies on product docs to understand what functions do
- Relies on architecture insights to know what's critical

### 3. Added Token Validation
`src/llmService.ts` - `generateUnitTestPlan()`:
- Estimates token count (chars / 4)
- Throws clear error if > 200K tokens
- Suggests regenerating synthesis if still too large

## How It Works Now

1. **User runs "Generate Unit Tests"**

2. **Phase 2 calls `buildPlanningPrompt()`** with:
   - Codebase statistics (total files/functions)
   - Top 10 entry points
   - Product overview (synthesized)
   - Key functions from product docs (15 items)
   - Critical issues from architecture (8 items)
   - **Total: ~5-10K tokens** ✅

3. **LLM returns test plan** with 30 prioritized functions

4. **Phase 3 loops** through functions:
   - Batch of 5 functions
   - For each: small prompt with just that function's code
   - Generate test, write file, validate
   - **Each call: ~500-1K tokens** ✅

5. **Phase 4 fixes failures** if any:
   - One LLM call per failing test
   - **Each call: ~2K tokens** ✅

## Key Principle

**Don't pass raw data when you have synthesized docs.**

The entire point of generating product documentation and architecture insights is to:
1. **Compress** thousands of files into high-level understanding
2. **Use that understanding** for subsequent analysis (refactoring, testing)
3. **Not redundantly include** both raw and synthesized data

## Token Budget Comparison

### Before (Monolithic):
- **Single call**: 205K tokens ❌ (exceeds limit)

### After (Incremental):
- **Planning call**: ~10K tokens ✅
- **30 generation calls**: ~500 tokens each = 15K total ✅  
- **~5 fix calls**: ~2K tokens each = 10K total ✅
- **Total across all calls**: ~35K tokens ✅

## Files Modified

1. `src/llmService.ts` - Added token validation, reduced monolithic prompt
2. `src/domain/prompts/testPrompts.ts` - Fixed planning prompt to use synthesis only

## Testing

To verify the fix:
1. Run "Analyze Workspace"
2. Run "Generate Product Documentation" 
3. Run "Generate Architecture Insights"
4. Run "Generate Unit Tests"
5. Should complete without token limit errors
6. Check logs for token estimates

## If Still Failing

If prompts still exceed 200K tokens, it means:
- **The synthesis itself is too verbose**
- Product overview or architecture assessment is massive
- Need to make synthesis more concise during generation
- Add token limits when generating those docs

## Related Documents

- See external context: "LLM-Based Unit Test Generation System - Complete Overhaul"
- See `REFACTORING_PLAN.md` for overall architecture improvements
