/**
 * Simple Test Generator
 * 
 * Generates unit tests based on streamlined analysis results.
 * Single LLM call to generate all tests for small projects.
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SWLogger } from '../../../logger';

const execAsync = promisify(exec);

// Schema for test generation response
export const TEST_GENERATION_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        framework: { 
            type: "string", 
            enum: ["jest", "mocha", "vitest"],
            description: "Testing framework to use"
        },
        setupCode: { 
            type: "string",
            description: "Any setup code needed (imports, mocks, etc.)"
        },
        tests: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    functionName: { type: "string" },
                    fileName: { type: "string" },
                    testCode: { type: "string", description: "Complete test code for this function" }
                },
                required: ["functionName", "fileName", "testCode"]
            }
        }
    },
    required: ["framework", "setupCode", "tests"]
};

export interface TestGenerationResult {
    testsGenerated: number;
    testFilePath: string;
    runResult?: {
        passed: number;
        failed: number;
        output: string;
    };
}

/**
 * Build prompt for test generation
 */
function buildTestPrompt(
    functions: any[],
    testTargets: any[],
    fileContents: Map<string, string>
): string {
    // Build function details with actual code
    const functionDetails = functions.map(f => {
        const content = fileContents.get(f.file) || '';
        return `### ${f.name} (${f.file})
Purpose: ${f.purpose}
Code:
\`\`\`javascript
${extractFunctionCode(content, f.name)}
\`\`\``;
    }).join('\n\n');

    // Build test target info
    const targetInfo = testTargets.map(t => 
        `- ${t.function} (${t.file}): ${t.priority} priority - ${t.reason}`
    ).join('\n');

    return `Generate Jest unit tests for these JavaScript functions.

## Functions to Test
${functionDetails}

## Test Priorities
${targetInfo}

## Requirements
1. Use Jest syntax (describe, it, expect)
2. Test normal cases AND edge cases
3. Include setup/teardown if needed
4. Make tests runnable immediately

Generate complete, working test code.`;
}

/**
 * Extract function code from file content by name
 */
function extractFunctionCode(content: string, funcName: string): string {
    // Try to find the function in the content
    const patterns = [
        new RegExp(`export\\s+function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{[^}]*\\}`, 's'),
        new RegExp(`function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{[^}]*\\}`, 's'),
        new RegExp(`const\\s+${funcName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{[^}]*\\}`, 's'),
    ];

    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) return match[0];
    }

    // If we can't extract, return a note
    return `// Function ${funcName} - see source file`;
}

/**
 * Generate and run tests based on analysis results
 */
export async function generateAndRunTests(
    workspaceRoot: string,
    analysisResult: {
        functions: any[];
        testTargets: any[];
        overview: string;
    },
    llmService: any,
    onProgress?: (message: string) => void
): Promise<TestGenerationResult> {
    SWLogger.log('[TestGen] Starting test generation...');
    onProgress?.('Reading source files...');

    // Read source files
    const fileContents = new Map<string, string>();
    const uniqueFiles = new Set(analysisResult.functions.map(f => f.file));
    
    for (const file of uniqueFiles) {
        try {
            const fullPath = path.join(workspaceRoot, file);
            const content = fs.readFileSync(fullPath, 'utf-8');
            fileContents.set(file, content);
        } catch (err) {
            SWLogger.log(`[TestGen] Could not read ${file}`);
        }
    }

    // Build prompt
    const prompt = buildTestPrompt(
        analysisResult.functions,
        analysisResult.testTargets,
        fileContents
    );
    SWLogger.log(`[TestGen] Prompt size: ${prompt.length} chars`);

    // Call LLM
    onProgress?.('Generating tests with Claude...');
    SWLogger.log('[TestGen] Calling LLM for test generation...');
    
    const response = await llmService.sendStructuredRequest(
        prompt,
        TEST_GENERATION_SCHEMA,
        'You are an expert test engineer. Generate complete, runnable Jest tests.'
    );

    const testData = response.data as {
        framework: string;
        setupCode: string;
        tests: { functionName: string; fileName: string; testCode: string }[];
    };

    SWLogger.log(`[TestGen] Generated ${testData.tests.length} test suites`);

    // Create test directory
    const testDir = path.join(workspaceRoot, 'UnitTests');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    // Write test file
    onProgress?.('Writing test files...');
    
    let testFileContent = `/**
 * Auto-generated unit tests
 * Generated: ${new Date().toISOString()}
 */

${testData.setupCode}

`;

    // Add each test suite
    for (const test of testData.tests) {
        testFileContent += `\n// Tests for ${test.functionName} from ${test.fileName}\n`;
        testFileContent += test.testCode + '\n';
    }

    const testFilePath = path.join(testDir, 'generated.test.js');
    fs.writeFileSync(testFilePath, testFileContent);
    SWLogger.log(`[TestGen] Wrote tests to ${testFilePath}`);

    // Ensure Jest is available
    onProgress?.('Checking test dependencies...');
    await ensureJestInstalled(workspaceRoot);

    // Run tests
    onProgress?.('Running tests...');
    SWLogger.log('[TestGen] Running tests...');
    
    const runResult = await runTests(workspaceRoot, testFilePath);

    SWLogger.log(`[TestGen] Tests complete: ${runResult.passed} passed, ${runResult.failed} failed`);

    return {
        testsGenerated: testData.tests.length,
        testFilePath,
        runResult
    };
}

/**
 * Ensure Jest is installed in the workspace
 */
async function ensureJestInstalled(workspaceRoot: string): Promise<void> {
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        // Create basic package.json
        const packageJson = {
            name: path.basename(workspaceRoot),
            version: "1.0.0",
            scripts: {
                test: "jest"
            },
            devDependencies: {}
        };
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    // Check if jest is installed
    const nodeModulesJest = path.join(workspaceRoot, 'node_modules', 'jest');
    if (!fs.existsSync(nodeModulesJest)) {
        SWLogger.log('[TestGen] Installing Jest...');
        try {
            await execAsync('npm install --save-dev jest', { cwd: workspaceRoot, timeout: 60000 });
        } catch (err) {
            SWLogger.log(`[TestGen] Jest install warning: ${err}`);
        }
    }

    // Create jest.config.js if needed
    const jestConfigPath = path.join(workspaceRoot, 'jest.config.js');
    if (!fs.existsSync(jestConfigPath)) {
        const jestConfig = `module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/UnitTests/**/*.test.js'],
  verbose: true
};
`;
        fs.writeFileSync(jestConfigPath, jestConfig);
    }
}

/**
 * Run tests and capture results
 */
async function runTests(
    workspaceRoot: string,
    testFilePath: string
): Promise<{ passed: number; failed: number; output: string }> {
    try {
        const { stdout, stderr } = await execAsync(
            `npx jest "${testFilePath}" --json --no-coverage`,
            { cwd: workspaceRoot, timeout: 120000 }
        );

        try {
            const results = JSON.parse(stdout);
            return {
                passed: results.numPassedTests || 0,
                failed: results.numFailedTests || 0,
                output: stdout
            };
        } catch {
            // Jest succeeded but output wasn't JSON
            return {
                passed: 0,
                failed: 0,
                output: stdout + stderr
            };
        }
    } catch (error: any) {
        // Jest returns non-zero exit code on test failures
        const output = error.stdout || error.stderr || error.message;
        
        try {
            const results = JSON.parse(error.stdout || '{}');
            return {
                passed: results.numPassedTests || 0,
                failed: results.numFailedTests || 0,
                output
            };
        } catch {
            // Count pass/fail from output if possible
            const passMatch = output.match(/(\d+) passed/);
            const failMatch = output.match(/(\d+) failed/);
            
            return {
                passed: passMatch ? parseInt(passMatch[1]) : 0,
                failed: failMatch ? parseInt(failMatch[1]) : 0,
                output
            };
        }
    }
}
