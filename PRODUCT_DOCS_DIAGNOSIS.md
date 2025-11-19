# Product Documentation Generation Diagnosis

## Problem Summary

The product documentation shows "Analysis failed" for **all files** and "Module analysis failed" for **all modules**, while the high-level sections (Product Overview, What It Does, Architecture Summary) are correctly populated.

## Root Cause Analysis

### What Happened

1. **File-Level Analysis Failed**: Every file analysis threw an error, triggering the fallback mechanism
2. **Module-Level Analysis Failed**: Every module rollup threw an error, triggering the fallback mechanism  
3. **Product-Level Analysis Succeeded**: The final product-level documentation generation worked correctly

### Where the Errors Occur

**File Analysis** (`src/llmService.ts:225-245`):
```typescript
} catch (error) {
    console.error(`Failed to analyze file ${file.path}:`, error);
    SWLogger.log(`ERROR analyzing file ${file.path}: ${(error as any)?.message || error}`);
    // Creates fallback with purpose: 'Analysis failed'
    const fallbackSummary = {
        file: file.path,
        role: detectFileRole(file.path, file),
        purpose: 'Analysis failed',  // ← This is what appears in the docs
        ...
    };
}
```

**Module Analysis** (`src/llmService.ts:378-394`):
```typescript
} catch (error) {
    console.error(`Failed to generate module summary for ${modulePath}:`, error);
    SWLogger.log(`ERROR module summary ${modulePath}: ${(error as any)?.message || error}`);
    const fallbackSummary = {
        module: modulePath,
        moduleType: moduleType,
        summary: 'Module analysis failed',  // ← This is what appears in the docs
        ...
    };
}
```

## Possible Causes

### 1. API/Network Issues
- **Rate Limiting**: Too many requests hit rate limits
- **API Key Issues**: Invalid or expired API key
- **Network Timeouts**: Requests timing out
- **Model Availability**: Model (gpt-4o) unavailable

### 2. Response Parsing Issues
- **Unexpected Response Format**: LLM returned format that parser couldn't handle
- **JSON Parsing Errors**: Response contained invalid JSON
- **Text Extraction Failures**: Section extraction regex patterns didn't match

### 3. Token/Context Issues
- **Token Limits**: Responses exceeded maxTokens (40000)
- **Context Too Large**: File content too large for model context window
- **Truncated Responses**: Responses cut off mid-generation

### 4. Error Handling Issues
- **Silent Failures**: Errors caught but not properly logged
- **Cascading Failures**: One failure caused all subsequent to fail

## How to Diagnose

### Check Logs

1. **VS Code Output Panel**:
   - Open Output panel
   - Select "Shadow Watch Documentation" channel
   - Look for error messages like:
     - `ERROR analyzing file {path}: {error}`
     - `ERROR module summary {path}: {error}`

2. **Console Logs**:
   - Check browser console (if running in VS Code)
   - Look for `console.error` messages

3. **Saved File Summaries**:
   - Check `.shadow/docs/product-docs-{timestamp}/file-summaries/`
   - Open a few JSON files to see if they contain actual content or just "Analysis failed"

### Check API Status

1. **Verify API Key**:
   - Check if API key is configured correctly
   - Test with a simple API call

2. **Check Rate Limits**:
   - Verify you haven't hit rate limits
   - Check API usage dashboard

3. **Test Single File**:
   - Try analyzing just one file to see if it works

## Solutions

### Immediate Fix: Improve Error Logging

Add more detailed error logging to understand what's failing:

```typescript
} catch (error) {
    const errorDetails = {
        file: file.path,
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack,
        // Add more context
    };
    console.error('File analysis error:', errorDetails);
    SWLogger.log(`ERROR analyzing file ${file.path}: ${JSON.stringify(errorDetails, null, 2)}`);
    // ... rest of fallback
}
```

### Better Solution: Improve Error Recovery

Instead of silent fallback, provide better error handling:

1. **Retry Logic**: Already exists via `retryHandler`, but may need tuning
2. **Partial Success**: Continue with successful analyses even if some fail
3. **Error Reporting**: Show user which files failed and why
4. **Graceful Degradation**: Use available data even if some analyses fail

### Long-term Solution: Better Response Validation

1. **Validate Responses**: Check if response contains expected structure before parsing
2. **Better Parsing**: More robust text extraction that handles various formats
3. **Fallback Parsing**: Multiple parsing strategies (JSON → structured text → simple text)
4. **Response Quality Checks**: Verify response quality before accepting

## Recommended Actions

1. **Check Logs First**: Review VS Code output panel for actual error messages
2. **Test Single File**: Try analyzing one file manually to isolate the issue
3. **Verify API**: Check API key and rate limits
4. **Improve Logging**: Add detailed error logging to catch the root cause
5. **Add Diagnostics**: Create a diagnostic command that tests file analysis

## Expected Behavior

When working correctly, you should see:
- File summaries with actual purpose descriptions
- Module summaries with capability lists
- Detailed file-level documentation for each file
- Module-level documentation explaining what each module does

Instead of:
- "Analysis failed" for all files
- "Module analysis failed" for all modules
- Empty or generic descriptions


