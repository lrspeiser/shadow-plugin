/**
 * Prompt for extracting testable functions from source files using LLM
 * This replaces regex-based extraction which incorrectly captured control flow keywords
 */

export function buildFunctionExtractionPrompt(
    files: Array<{ path: string; content: string; language: string }>,
    maxFunctionsPerFile: number = 50
): string {
    const filesSummary = files.map(f => `- ${f.path} (${f.language})`).join('\n');
    
    let prompt = `You are a code analysis expert. Extract all testable functions, methods, and classes from the provided source files.

## Files to Analyze (${files.length} total)
${filesSummary}

## Source Code`;

    for (const file of files) {
        // Truncate extremely long files to avoid token limits
        const contentPreview = file.content.length > 10000 
            ? file.content.substring(0, 10000) + '\n\n... [truncated]'
            : file.content;
            
        prompt += `

### ${file.path} (${file.language})
\`\`\`${file.language}
${contentPreview}
\`\`\``;
    }

    prompt += `

## Your Task
Extract ALL testable functions, methods, and classes from the source code above.

**CRITICAL RULES:**
1. **Only extract actual functions/methods/classes** - NOT control flow keywords (for, if, while, switch, catch, etc.)
2. **Include:**
   - Named function declarations (function foo() {})
   - Arrow functions assigned to variables (const foo = () => {})
   - Class methods (myMethod() {})
   - Class declarations (class Foo {})
   - Async functions
   - Exported functions
3. **Exclude:**
   - Control flow statements (if, for, while, switch, etc.)
   - Anonymous functions not assigned to variables
   - Constructor parameters with default functions
4. **For each function, extract:**
   - Exact name (as it appears in code)
   - File path
   - Approximate start/end lines (estimate from code position)
   - Complexity estimate (low/medium/high based on length and logic)
   - Dependencies (what it imports or calls)
   - Whether it's public/exported
   - Whether it requires mocking (uses external APIs, file system, etc.)

## Output Format
Return ONLY valid JSON with this structure:

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
      "dependencies": ["fs", "path", "findCodeFiles", "extractFunctions"],
      "calls_external_apis": true,
      "requires_mocking": true,
      "testability": "high",
      "reason": "Core entry point for workspace analysis"
    }
  ],
  "total_functions": 42,
  "files_analyzed": ${files.length}
}

**IMPORTANT:** Return ONLY the JSON object above. No markdown, no code fences, no explanatory text.`;

    return prompt;
}

/**
 * Build prompt for extracting functions from a single large file
 */
export function buildSingleFileExtractionPrompt(
    filePath: string,
    content: string,
    language: string
): string {
    return `You are a code analysis expert. Extract all testable functions, methods, and classes from this file.

## File
${filePath} (${language})

## Source Code
\`\`\`${language}
${content}
\`\`\`

## Your Task
Extract ALL testable functions, methods, and classes from the source code above.

**CRITICAL RULES:**
1. **Only extract actual functions/methods/classes** - NOT control flow keywords (for, if, while, switch, catch, etc.)
2. **Include:**
   - Named function declarations
   - Arrow functions assigned to variables
   - Class methods
   - Class declarations
   - Async functions
   - Exported functions
3. **Exclude:**
   - Control flow statements (if, for, while, switch, etc.)
   - Anonymous functions
   - Constructor parameters with default functions

## Output Format
Return ONLY valid JSON:

{
  "functions": [
    {
      "name": "functionName",
      "file": "${filePath}",
      "startLine": 10,
      "endLine": 50,
      "lines": 40,
      "language": "${language}",
      "complexity": "medium",
      "is_public": true,
      "is_async": false,
      "parameters": ["param1: string", "param2: number"],
      "return_type": "void",
      "dependencies": ["otherFunction"],
      "requires_mocking": false,
      "testability": "high"
    }
  ]
}

**IMPORTANT:** Return ONLY the JSON. No markdown, no explanations.`;
}
