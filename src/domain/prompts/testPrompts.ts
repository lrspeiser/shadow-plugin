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
Analyze the functions and create a test strategy that:
1. Prioritizes critical functions (entry points, complex logic, error-prone areas)
2. Groups related functions into logical test suites
3. Identifies dependencies that need mocking
4. Estimates testability and complexity
5. Creates a realistic test plan (start with top 30 most important functions)

Return your response in this JSON format:
{
  "strategy": "Brief description of overall testing approach",
  "total_functions": ${functions.length},
  "testable_functions": number,
  "function_groups": [
    {
      "group_id": "core-analysis",
      "name": "Core Analysis Functions",
      "priority": 1,
      "functions": [
        {
          "name": "functionName",
          "file": "src/file.ts",
          "startLine": 10,
          "endLine": 50,
          "complexity": "high|medium|low",
          "dependencies": ["dependency1", "dependency2"],
          "mocking_needed": true
        }
      ]
    }
  ]
}`;

    return prompt;
}

export function buildGenerationPrompt(
    func: TestableFunction,
    sourceCode: string,
    testingFramework: string,
    existingMocks?: string
): string {
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

## Your Task
Generate a complete ${testingFramework} test that:
1. Includes ALL necessary imports
2. Sets up mocks for dependencies (if needed)
3. Tests multiple scenarios (happy path, edge cases, error handling)
4. Uses proper assertions
5. Is syntactically valid and ready to run

IMPORTANT OUTPUT RULES:
- Return ONLY JSON wrapped between <json> and </json> tags.
- Do NOT include code fences, prose, or any content outside the <json>...</json> block.
- The JSON must be valid and parseable with JSON.parse (all keys quoted).

Expected JSON shape:
<json>{
  "test_file_path": "${func.file.replace(/\\.ts$/, '.test.ts')}",
  "imports": [
    "import { ${func.name} } from '../${func.file.replace('src/', '')}';",
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

IMPORTANT OUTPUT RULES:
- Return ONLY JSON wrapped between <json> and </json> tags.
- Do NOT include code fences, prose, or any content outside the <json>...</json> block.
- The JSON must be valid and parseable with JSON.parse (all keys quoted).

Expected JSON shape:
<json>{
  "status": "pass|fail|error",
  "fixed_code": "Complete fixed test code here",
  "explanation": "Explanation of what was wrong and how you fixed it",
  "remaining_issues": ["Any issues that couldn't be fixed automatically"]
}</json>`;
}
