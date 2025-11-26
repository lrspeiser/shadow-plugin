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
2. Keep tests CONCISE - one describe block per function with 2-3 test cases
3. Each test must be syntactically valid JavaScript
4. Make tests runnable immediately
5. DO NOT generate excessive tests - quality over quantity`;
}

/**
 * Validate JavaScript syntax using Node's vm module
 */
function validateSyntax(code: string): { valid: boolean; error?: string } {
    try {
        // Use Function constructor to check syntax without executing
        new Function(code);
        return { valid: true };
    } catch (e: any) {
        return { valid: false, error: e.message };
    }
}

/**
 * Schema for syntax fix response
 */
const SYNTAX_FIX_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        fixedCode: { type: "string", description: "The complete fixed test code" }
    },
    required: ["fixedCode"]
};

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
    
    // Cap test targets - we'll generate tests ONE AT A TIME to avoid token limits
    const MAX_TEST_TARGETS = 5;
    const cappedTargets = analysisResult.testTargets.slice(0, MAX_TEST_TARGETS);
    if (analysisResult.testTargets.length > MAX_TEST_TARGETS) {
        SWLogger.log(`[TestGen] Capping test targets from ${analysisResult.testTargets.length} to ${MAX_TEST_TARGETS}`);
    }
    
    // Only include functions that are in our capped targets
    const targetFunctions = new Set(cappedTargets.map(t => t.function));
    const cappedFunctions = analysisResult.functions.filter(f => targetFunctions.has(f.name));
    SWLogger.log(`[TestGen] Will generate tests for ${cappedFunctions.length} functions (one at a time)`);
    
    onProgress?.('Reading source files...');

    // Read source files (only files needed for capped functions)
    const fileContents = new Map<string, string>();
    const uniqueFiles = new Set(cappedFunctions.map(f => f.file));
    
    for (const file of uniqueFiles) {
        try {
            const fullPath = path.join(workspaceRoot, file);
            const content = fs.readFileSync(fullPath, 'utf-8');
            fileContents.set(file, content);
        } catch (err) {
            SWLogger.log(`[TestGen] Could not read ${file}`);
        }
    }

    // Generate tests ONE FUNCTION AT A TIME to avoid hitting Claude's 8192 token output limit
    const generatedTests: { functionName: string; fileName: string; testCode: string }[] = [];
    
    for (let i = 0; i < cappedFunctions.length; i++) {
        const func = cappedFunctions[i];
        const target = cappedTargets.find(t => t.function === func.name);
        
        onProgress?.(`Generating test ${i + 1}/${cappedFunctions.length}: ${func.name}...`);
        SWLogger.log(`[TestGen] Generating test for ${func.name} (${i + 1}/${cappedFunctions.length})`);
        
        const content = fileContents.get(func.file) || '';
        const funcCode = extractFunctionCode(content, func.name);
        
        // Simple, focused prompt for ONE function
        const singlePrompt = `Generate a Jest test for this function:

Function: ${func.name}
File: ${func.file}
Purpose: ${func.purpose || 'Unknown'}
${target ? `Priority: ${target.priority} - ${target.reason}` : ''}

Code:
\`\`\`javascript
${funcCode}
\`\`\`

Generate 2-3 test cases. Keep it concise.`;
        
        try {
            const response = await llmService.sendStructuredRequest(
                singlePrompt,
                {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        testCode: { type: "string", description: "Complete Jest test code for this function" }
                    },
                    required: ["testCode"]
                },
                'Generate a concise Jest test. Return only the test code.'
            );
            
            if (response.data?.testCode) {
                generatedTests.push({
                    functionName: func.name,
                    fileName: func.file,
                    testCode: response.data.testCode
                });
                SWLogger.log(`[TestGen] ✓ Generated test for ${func.name}`);
            }
        } catch (err: any) {
            SWLogger.log(`[TestGen] ✗ Failed to generate test for ${func.name}: ${err.message || err}`);
        }
    }
    
    SWLogger.log(`[TestGen] Generated ${generatedTests.length}/${cappedFunctions.length} tests`);
    
    // Build test data structure
    const testData = {
        framework: 'jest',
        setupCode: generatedTests.length > 0 ? '' : '// No tests generated - see Shadow Watch logs',
        tests: generatedTests.length > 0 ? generatedTests : [{
            functionName: 'placeholder',
            fileName: 'unknown',
            testCode: `describe('Placeholder', () => {
  it('should be replaced with real tests', () => {
    expect(true).toBe(true);
  });
});`
        }]
    };

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
    
    // Validate syntax before writing
    let syntaxCheck = validateSyntax(testFileContent);
    
    if (!syntaxCheck.valid) {
        SWLogger.log(`[TestGen] Syntax error detected: ${syntaxCheck.error}`);
        onProgress?.('Fixing syntax error...');
        
        // Ask LLM to fix the syntax error (single retry)
        const fixPrompt = `The following Jest test code has a syntax error:

ERROR: ${syntaxCheck.error}

CODE:
\`\`\`javascript
${testFileContent}
\`\`\`

Fix the syntax error and return the complete corrected code.`;
        
        try {
            const fixResponse = await llmService.sendStructuredRequest(
                fixPrompt,
                SYNTAX_FIX_SCHEMA,
                'Fix the JavaScript syntax error. Return only valid code.'
            );
            
            const fixedCode = (fixResponse.data as { fixedCode: string }).fixedCode;
            const recheck = validateSyntax(fixedCode);
            
            if (recheck.valid) {
                testFileContent = fixedCode;
                SWLogger.log('[TestGen] Syntax fixed successfully');
            } else {
                SWLogger.log(`[TestGen] Fix attempt failed: ${recheck.error}`);
            }
        } catch (fixErr) {
            SWLogger.log(`[TestGen] Fix request failed: ${fixErr}`);
        }
    }
    
    fs.writeFileSync(testFilePath, testFileContent);
    SWLogger.log(`[TestGen] Wrote tests to ${testFilePath}`);

    // Ensure Jest is available
    onProgress?.('Checking test dependencies...');
    const configExt = await ensureJestInstalled(workspaceRoot);

    // Run tests
    onProgress?.('Running tests...');
    SWLogger.log('[TestGen] Running tests...');
    
    const runResult = await runTests(workspaceRoot, testFilePath, configExt);

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
async function ensureJestInstalled(workspaceRoot: string): Promise<string> {
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

    // Check if all required test dependencies are installed
    const requiredDeps = ['jest', '@babel/core', '@babel/preset-env', 'babel-jest'];
    const missingDeps: string[] = [];
    
    for (const dep of requiredDeps) {
        const depPath = path.join(workspaceRoot, 'node_modules', dep);
        if (!fs.existsSync(depPath)) {
            missingDeps.push(dep);
        }
    }
    
    if (missingDeps.length > 0) {
        SWLogger.log(`[TestGen] Installing missing dependencies: ${missingDeps.join(', ')}`);
        try {
            await execAsync(
                `npm install --save-dev ${missingDeps.join(' ')}`,
                { cwd: workspaceRoot, timeout: 180000 }
            );
            SWLogger.log('[TestGen] Dependencies installed successfully');
        } catch (err: any) {
            SWLogger.log(`[TestGen] Install error: ${err.message || err}`);
            // Try installing one by one if batch fails
            for (const dep of missingDeps) {
                try {
                    await execAsync(`npm install --save-dev ${dep}`, { cwd: workspaceRoot, timeout: 60000 });
                    SWLogger.log(`[TestGen] Installed ${dep}`);
                } catch (e: any) {
                    SWLogger.log(`[TestGen] Failed to install ${dep}: ${e.message || e}`);
                }
            }
        }
    } else {
        SWLogger.log('[TestGen] All test dependencies already installed');
    }

    // Check if project uses ESM (type: module in package.json)
    let isESM = false;
    try {
        const pkgContent = fs.readFileSync(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(pkgContent);
        isESM = pkg.type === 'module';
    } catch {}

    // Use .cjs extension for config files in ESM projects
    const configExt = isESM ? '.cjs' : '.js';

    // Create jest.config with ESM transform
    const jestConfigPath = path.join(workspaceRoot, `jest.config${configExt}`);
    const jestConfig = `module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/UnitTests/**/*.test.js'],
  verbose: true,
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: []
};
`;
    fs.writeFileSync(jestConfigPath, jestConfig);

    // Create babel.config for ESM->CJS transform
    const babelConfigPath = path.join(workspaceRoot, `babel.config${configExt}`);
    const babelConfig = `module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }]
  ]
};
`;
    fs.writeFileSync(babelConfigPath, babelConfig);

    return configExt; // Return so we know which config to use
}

/**
 * Run tests and capture results
 */
async function runTests(
    workspaceRoot: string,
    testFilePath: string,
    configExt: string = '.js'
): Promise<{ passed: number; failed: number; output: string }> {
    // Use config file if it exists
    const configPath = path.join(workspaceRoot, `jest.config${configExt}`);
    const configArg = fs.existsSync(configPath) ? ` --config jest.config${configExt}` : '';
    
    try {
        const { stdout, stderr } = await execAsync(
            `npx jest "${testFilePath}"${configArg} --json --no-coverage`,
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
