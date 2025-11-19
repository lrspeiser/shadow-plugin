# Provider Switching & JSON Parsing

This document explains how Shadow Watch handles switching between OpenAI and Claude, and how both providers parse JSON responses.

## Provider Switching

### Configuration

Users can switch between providers via VSCode settings:

```json
{
  "shadowWatch.llmProvider": "openai",  // or "claude"
  "shadowWatch.openaiApiKey": "sk-...",
  "shadowWatch.claudeApiKey": "sk-ant-..."
}
```

### Implementation

**1. Configuration Manager** (`src/config/configurationManager.ts`)
- Centralized access to all settings
- Returns current `llmProvider` setting
- Validates that the selected provider has an API key configured

**2. Provider Factory** (`src/ai/providers/providerFactory.ts`)
- Creates provider instances on demand
- `getCurrentProvider()` returns the provider based on configuration
- Caches provider instances (singleton pattern)

**3. LLM Service** (`src/llmService.ts`)
- Uses `providerFactory.getCurrentProvider()` throughout
- Automatically respects the current provider setting
- No manual provider switching logic needed

### Example Flow

```typescript
// In llmService.ts
const provider = this.providerFactory.getCurrentProvider(); // Gets OpenAI or Claude
if (!provider.isConfigured()) {
    throw new Error('LLM API key not configured');
}

// Provider-specific behavior is handled inside each provider
const response = await provider.sendStructuredRequest(options, schema);
```

## JSON Parsing Strategy

Both providers now use a **defense-in-depth** approach to JSON parsing:

### OpenAI Provider (`src/ai/providers/openAIProvider.ts`)

OpenAI uses JSON mode (`response_format: { type: 'json_object' }`), which requests JSON but doesn't guarantee validity.

**Parsing Strategy:**
```typescript
// Uses robust extractJSON utility FIRST
const parsed = extractJSON(response.content);
if (parsed === null) {
    // Detailed error logging with first/last 1000 chars
    throw new Error('Failed to extract valid JSON from OpenAI response');
}
return { data: parsed as T };
```

**Why:** OpenAI JSON mode can return malformed JSON with:
- Unterminated strings
- Escaped characters issues
- Truncated responses
- Markdown formatting mixed in

### Claude Provider (`src/ai/providers/anthropicProvider.ts`)

Claude uses structured outputs beta API (`output_format: { type: 'json_schema', schema }`), which **should** return guaranteed valid JSON.

**Parsing Strategy:**
```typescript
try {
    // FAST PATH: Direct parse (Claude structured outputs are reliable)
    const parsed = JSON.parse(textContent) as T;
    return { data: parsed };
} catch (error) {
    // FALLBACK: Robust extraction if direct parse fails (edge cases)
    console.warn('Claude structured output failed, using extractJSON fallback');
    const parsed = extractJSON(textContent);
    if (parsed === null) {
        // Detailed error logging
        throw new Error('Failed to extract valid JSON from Claude response');
    }
    return { data: parsed as T };
}
```

**Why:** While Claude's structured outputs are more reliable, defense-in-depth ensures:
- Edge cases are handled (API issues, partial responses)
- Consistent error handling across providers
- Detailed debugging information

## The `extractJSON` Utility (`src/utils/jsonExtractor.ts`)

This utility handles malformed JSON using multiple strategies:

1. **Direct Parsing**: Try parsing the entire content
2. **Markdown Extraction**: Extract JSON from code blocks (```json ... ```)
3. **Brace Counting**: Find valid JSON by counting `{` and `}`, respecting strings
4. **Bracket Counting**: Same for JSON arrays `[` and `]`
5. **JSON Repair**: Fix unterminated strings automatically

### Example Issues It Fixes

**Unterminated String:**
```json
{
  "title": "Example",
  "description": "This string is not closed
}
```
→ Detects unterminated string and closes it before `}`

**Markdown Wrapping:**
```markdown
Here's the JSON:
```json
{ "title": "Example" }
```
End of response.
```
→ Extracts the JSON from the code block

**Escaped Characters:**
Properly handles `\"`, `\\`, and other escape sequences while counting braces.

## Testing Provider Switching

To verify both providers work:

1. **Test with OpenAI:**
   ```json
   { "shadowWatch.llmProvider": "openai" }
   ```
   Run: `Shadow Watch: Generate AI Architecture Insights`

2. **Test with Claude:**
   ```json
   { "shadowWatch.llmProvider": "claude" }
   ```
   Run: `Shadow Watch: Generate AI Architecture Insights`

3. **Check logs in Debug Console:**
   - Look for `[Product Purpose] Using OpenAI provider` or `Using Claude provider`
   - Verify no JSON parsing errors occur

## Error Logging

Both providers now log detailed errors:

```typescript
console.error('Failed to extract JSON from [Provider] response');
console.error('Response content (first 1000 chars):', ...);
console.error('Response content (last 1000 chars):', ...);
```

This helps debug where JSON parsing fails (beginning/end of response).

## Summary

✅ **Provider switching:** Fully automatic via `providerFactory.getCurrentProvider()`  
✅ **OpenAI JSON parsing:** Uses `extractJSON()` utility with multiple fallback strategies  
✅ **Claude JSON parsing:** Direct parse (fast path) + `extractJSON()` fallback (defense)  
✅ **Error handling:** Consistent logging across both providers  
✅ **User control:** Simple settings toggle between providers
