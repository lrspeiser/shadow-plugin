/**
 * Prompt builders for LLM-based test generation
 */

import { CodeAnalysis } from '../../analyzer';
import { TestableFunction } from '../services/testing/types/testPlanTypes';

export function buildSetupPrompt(workspaceRoot: string, fileList: string[], packageJsonContent?: string): string {
    return `You are a test configuration expert. Analyze this codebase and recommend the optimal test setup.

## Workspace Root
${workspaceRoot}

## File Structure
${fileList.slice(0, 100).join('\n')}

${packageJsonContent ? `## Existing package.json\n\`\`\`json\n${packageJsonContent}\n\`\`\`\n` : '## No package.json found\n'}

## Your Task
Analyze the codebase and generate a comprehensive test setup plan with:
1. Primary language detection
2. Recommended testing framework
3. Required dependencies (with versions)
4. Configuration files (jest.config.js, tsconfig.json if needed)
5. Test directory structure
6. Mock requirements (e.g., for VSCode extension APIs)

Return your response in this JSON format:
{
  "language": "typescript|javascript|python|etc",
  "testing_framework": "jest|mocha|pytest|etc",
  "dependencies": [
    {"name": "jest", "version": "^29.0.0", "dev": true},
    {"name": "ts-jest", "version": "^29.0.0", "dev": true}
  ],
  "config_files": [
    {"path": "jest.config.js", "content": "module.exports = {...}"}
  ],
  "test_directory": "UnitTests",
  "mock_requirements": [
    {"type": "vscode", "reason": "Extension uses VSCode API"}
  ]
}`;
}

export function buildPlanningPrompt(
    context: CodeAnalysis,
    functions: any[],
    productDocs?: any,
    architectureInsights?: any
): string {
    // Use only high-level statistics, not all function details
    // The LLM should rely on synthesized docs to understand what to test
    let prompt = `You are a test strategy expert. Create a prioritized test plan for this codebase.

## Codebase Statistics
- Total Files: ${context.totalFiles}
- Total Functions: ${context.totalFunctions} functions available
- Entry Points: ${context.entryPoints.length}

## Entry Points (Critical for Testing)
${context.entryPoints.slice(0, 10).map((ep: any) => `- ${ep.path} (${ep.type}): ${ep.reason}`).join('\n')}
`;

    if (productDocs) {
        prompt += `\n## Product Overview
${productDocs.overview || 'N/A'}

## Key Functions
${productDocs.relevantFunctions?.slice(0, 20).map((f: any) => 
    `- ${f.name}: ${f.description || 'N/A'}`
).join('\n') || 'N/A'}
`;
    }

    if (architectureInsights) {
        prompt += `\n## Critical Issues (Must Test These Areas)
${architectureInsights.issues?.slice(0, 10).map((i: any) => 
    typeof i === 'string' ? `- ${i}` : `- ${i.title}: ${i.description}`
).join('\n') || 'N/A'}

## High Priority Areas
${architectureInsights.priorities?.slice(0, 10).map((p: any) => 
    typeof p === 'string' ? `- ${p}` : `- ${p.title}: ${p.description}`
).join('\n') || 'N/A'}
`;
    }

    prompt += `\n## Your Task
Create a HIGH-LEVEL test strategy (not a detailed function list yet):
1. Identify 3-5 critical areas to focus testing on
2. Prioritize areas based on:
   - Entry points and main functionality
   - Complex business logic
   - Error-prone areas mentioned in architecture insights
   - Integration points that need careful testing
3. For each area, describe WHAT to test, not specific functions yet

Return your response in this JSON format:
{
  "strategy": "Brief overall testing approach",
  "total_functions_available": ${functions.length},
  "recommended_test_areas": [
    {
      "area_id": "core-analysis",
      "name": "Core Analysis Engine",
      "priority": 1,
      "description": "Why this area is critical",
      "file_patterns": ["src/analyzer.ts", "src/analysis/*.ts"],
      "estimated_functions": 10
    }
  ]
}`;

    return prompt;
}

export function buildFunctionSelectionPrompt(
    area: any,
    matchingFunctions: any[],
    maxFunctions: number = 15
): string {
    let prompt = `You are a test strategy expert. Select the most important functions to test in this area.

## Test Area
**Name:** ${area.name}
**Description:** ${area.description}
**Priority:** ${area.priority}

## Available Functions in This Area (${matchingFunctions.length} total)
`;

    for (const func of matchingFunctions) {
        prompt += `- ${func.name} (${func.file}:${func.startLine}-${func.endLine}, ${func.lines || 0} lines)\n`;
    }

    prompt += `\n## Your Task
Select up to ${maxFunctions} most important functions from the list above to test.
Prioritize:
1. Public/exported functions over private helpers
2. Complex functions (longer, more lines)
3. Functions with external dependencies
4. Entry points and main logic

IMPORTANT: Only select functions that appear in the "Available Functions" list above.
Do NOT invent or add functions that are not listed.

Return your response in this JSON format:
{
  "selected_functions": [
    {
      "name": "functionName",
      "file": "src/file.ts",
      "startLine": 10,
      "endLine": 50,
      "complexity": "high|medium|low",
      "dependencies": ["vscode", "fs"],
      "mocking_needed": true,
      "reason": "Why this function is important to test"
    }
  ]
}`;

    return prompt;
}

/**
 * Architecture context for test generation
 * This context comes from architecture insights and helps generate better tests
 */
export interface ArchitectureContext {
    issues?: Array<{ title: string; description: string; relevantFiles?: string[]; relevantFunctions?: string[] }>;
    priorities?: Array<{ title: string; description: string; relevantFiles?: string[]; relevantFunctions?: string[] }>;
    testReason?: string; // Why this function was selected for testing
    edgeCases?: string[]; // Known edge cases from architecture analysis
    relatedIssues?: string[]; // Architecture issues related to this function
}

export function buildGenerationPrompt(
    func: TestableFunction,
    sourceCode: string,
    testingFramework: string,
    existingMocks?: string,
    fileContext?: { exports: string[]; defaultExport?: boolean; importPathFromTests: string },
    architectureContext?: ArchitectureContext
): string {
    // Find architecture issues related to this function's file
    let relatedIssues = '';
    let relatedEdgeCases = '';
    
    if (architectureContext) {
        // Check if any architecture issues mention this function or file
        const funcFile = func.file;
        const funcName = func.name;
        
        const relevantIssues = architectureContext.issues?.filter(issue => {
            const inFiles = issue.relevantFiles?.some(f => f.includes(funcFile) || funcFile.includes(f));
            const inFunctions = issue.relevantFunctions?.some(f => f.includes(funcName) || funcName.includes(f));
            return inFiles || inFunctions;
        }) || [];
        
        if (relevantIssues.length > 0) {
            relatedIssues = `\n## Architecture Issues to Address in Tests
The following architecture issues have been identified for this area. Make sure your tests cover these concerns:
${relevantIssues.map(i => `- **${i.title}**: ${i.description}`).join('\n')}\n`;
        }
        
        if (architectureContext.testReason) {
            relatedIssues += `\n**Why Test This Function**: ${architectureContext.testReason}\n`;
        }
        
        if (architectureContext.edgeCases && architectureContext.edgeCases.length > 0) {
            relatedEdgeCases = `\n## Known Edge Cases to Test
Architecture analysis identified these edge cases:
${architectureContext.edgeCases.map(ec => `- ${ec}`).join('\n')}\n`;
        }
    }
    
    return `You are an expert test engineer. Generate a complete, runnable test for this function.

## Function to Test
**Name:** ${func.name}
**File:** ${func.file}
**Lines:** ${func.startLine}-${func.endLine}
**Complexity:** ${func.complexity}
**Dependencies:** ${func.dependencies.join(', ')}
**Mocking Needed:** ${func.mocking_needed}

## Source Code
\`\`\`typescript
${sourceCode}
\`\`\`

${existingMocks ? `## Existing Mocks
\`\`\`typescript
${existingMocks}
\`\`\`
` : ''}

## File Context
- Source path: ${func.file}
- Import path FROM UnitTests/: ${fileContext?.importPathFromTests || `../${func.file.replace(/\.ts$/, '')}`}
- Exported symbols: ${(fileContext?.exports || []).join(', ') || 'unknown'}
- Default export: ${fileContext?.defaultExport ? 'yes' : 'no'}

${relatedIssues}
${relatedEdgeCases}
## Your Task
Generate a complete ${testingFramework} test that:
1. Includes ALL necessary imports with CORRECT paths from UnitTests/ directory
2. Sets up mocks for dependencies (if needed)
3. Tests multiple scenarios (happy path, edge cases, error handling)
4. Uses proper assertions
5. Is syntactically valid and ready to run
6. Addresses any architecture issues or edge cases mentioned above

IMPORTANT RULES:
- Use EXACTLY the import path shown above for the target module.
- Do NOT invent symbols. Only reference exported symbols listed above.
- If the function is a named export, use named import. If default export only, import default.

IMPORTANT OUTPUT RULES:
- Return ONLY JSON wrapped between <json> and </json> tags.
- Do NOT include code fences, prose, or any content outside the <json>...</json> block.
- The JSON must be valid and parseable with JSON.parse (all keys quoted).

Expected JSON shape:
<json>{
  "test_file_path": "UnitTests/${func.file.replace(/.*\//, '').replace(/\.ts$/, '.test.ts')}",
  "imports": [
    "// Do not import the target module here — the harness will inject the correct import",
    "import * as vscode from 'vscode';"
  ],
  "mocks": [
    {
      "statement": "jest.mock('vscode');",
      "explanation": "Mock VSCode API to isolate function"
    }
  ],
  "test_code": "describe('${func.name}', () => {\\n  test('should handle valid input', () => {\\n    // test implementation\\n  });\\n});"
}</json>`;
}

export function buildFixPrompt(
    testCode: string,
    errorMessage: string,
    sourceCode: string
): string {
    // Check if error is a dependency issue that can't be fixed by editing test code
    const isDependencyError = errorMessage.includes('node_modules/@types/') || 
                              errorMessage.includes('has no exported member') ||
                              errorMessage.includes('Private identifiers are only available when targeting');
    
    if (isDependencyError) {
        // Return a non-fixable status immediately without calling LLM
        return `DEPENDENCY_ERROR: This is a package dependency or TypeScript configuration issue, not a test code issue. Cannot fix by editing test code alone.

Error:
${errorMessage}

These errors must be fixed by:
1. Upgrading or downgrading package versions
2. Changing TypeScript compiler target
3. Removing conflicting type definitions`;
    }
    
    return `You are a test debugging expert. This test is failing - fix it.

## Test Code
\`\`\`typescript
${testCode}
\`\`\`

## Error Message
\`\`\`
${errorMessage}
\`\`\`

## Source Code Being Tested
\`\`\`typescript
${sourceCode}
\`\`\`

## Your Task
Analyze the error and fix the test code. Common issues:
- Incorrect mock setup
- Wrong import paths
- Missing async/await
- Incorrect assertions
- Type mismatches

⚠️ CRITICAL: Respond with ONLY valid JSON. No markdown, no prose, no code fences.
Your response must be a valid JSON object that can be parsed directly.

Return this exact structure:
{
  "status": "pass",
  "fixed_code": "// Complete fixed test code here",
  "explanation": "Brief explanation of the fix",
  "remaining_issues": []
}`;
}
