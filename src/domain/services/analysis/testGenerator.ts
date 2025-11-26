/**
 * Test Generator with LLM-driven environment setup
 * 
 * 1. Detects project language/framework
 * 2. Asks LLM to configure test environment
 * 3. Generates proper unit tests with real imports
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SWLogger } from '../../../logger';

const execAsync = promisify(exec);

// Schema for ignore pattern suggestions
const IGNORE_PATTERNS_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        patterns: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    pattern: { type: "string", description: "Folder or file pattern to ignore" },
                    reason: { type: "string", description: "Why this should be ignored" }
                },
                required: ["pattern", "reason"]
            },
            description: "Patterns to add to .shadowignore"
        }
    },
    required: ["patterns"]
};

// Schema for test environment setup
const TEST_ENV_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        language: { type: "string", description: "Primary language (typescript, javascript, python, etc.)" },
        framework: { type: "string", description: "Test framework to use (jest, pytest, mocha, etc.)" },
        dependencies: { 
            type: "array", 
            items: { type: "string" },
            description: "npm/pip packages to install for testing"
        },
        configFiles: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    filename: { type: "string" },
                    content: { type: "string" }
                },
                required: ["filename", "content"]
            },
            description: "Config files to create (jest.config.js, etc.)"
        },
        testFileExtension: { type: "string", description: "Extension for test files (.test.ts, .test.js, _test.py)" },
        importStyle: { type: "string", description: "How to import: 'esm' for import/export, 'commonjs' for require, 'python' for import" },
        runCommand: { type: "string", description: "Command to run tests (npm test, pytest, etc.)" }
    },
    required: ["language", "framework", "dependencies", "configFiles", "testFileExtension", "importStyle", "runCommand"]
};

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

export interface BuildError {
    file: string;
    line: number;
    column: number;
    message: string;
    code?: string;
    isUserCode: boolean; // true if error is in user's code, false if in generated tests
}

export interface TestGenerationResult {
    testsGenerated: number;
    testFilePath: string;
    buildErrors?: BuildError[];
    buildErrorsSkippedTests?: boolean; // true if tests were skipped due to build errors in user code
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
 * Detect project characteristics for test setup
 */
function detectProjectInfo(workspaceRoot: string): string {
    const info: string[] = [];
    
    // Check for package.json (Node.js/JavaScript/TypeScript)
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            info.push(`package.json exists`);
            info.push(`type: ${pkg.type || 'commonjs'}`);
            if (pkg.devDependencies?.typescript || pkg.dependencies?.typescript) info.push('uses typescript');
            if (pkg.devDependencies?.jest || pkg.dependencies?.jest) info.push('has jest installed');
            if (pkg.devDependencies?.mocha || pkg.dependencies?.mocha) info.push('has mocha installed');
            if (pkg.scripts?.test) info.push(`test script: ${pkg.scripts.test}`);
        } catch {}
    }
    
    // Check for tsconfig.json (TypeScript)
    if (fs.existsSync(path.join(workspaceRoot, 'tsconfig.json'))) {
        info.push('tsconfig.json exists (TypeScript project)');
    }
    
    // Check for requirements.txt or setup.py (Python)
    if (fs.existsSync(path.join(workspaceRoot, 'requirements.txt'))) {
        info.push('requirements.txt exists (Python project)');
    }
    if (fs.existsSync(path.join(workspaceRoot, 'setup.py')) || fs.existsSync(path.join(workspaceRoot, 'pyproject.toml'))) {
        info.push('Python package config exists');
    }
    
    // Check for existing test directories
    const testDirs = ['tests', 'test', '__tests__', 'UnitTests', 'spec'];
    for (const dir of testDirs) {
        if (fs.existsSync(path.join(workspaceRoot, dir))) {
            info.push(`existing test directory: ${dir}`);
        }
    }
    
    // List source file types
    const srcFiles = fs.readdirSync(workspaceRoot, { recursive: true }) as string[];
    const extensions: Record<string, number> = {};
    for (const file of srcFiles.slice(0, 200)) { // Sample first 200
        if (typeof file === 'string' && !file.includes('node_modules')) {
            const ext = path.extname(file);
            if (ext) extensions[ext] = (extensions[ext] || 0) + 1;
        }
    }
    const topExts = Object.entries(extensions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ext, count]) => `${ext}: ${count}`);
    info.push(`file types: ${topExts.join(', ')}`);
    
    return info.join('\n');
}

/**
 * Ask LLM to set up the test environment
 */
async function setupTestEnvironment(
    workspaceRoot: string,
    projectInfo: string,
    llmService: any,
    onProgress?: (message: string) => void
): Promise<{ success: boolean; testDir: string; importStyle: string; extension: string; runCommand: string }> {
    SWLogger.log('[TestGen] Asking LLM to configure test environment...');
    onProgress?.('Configuring test environment...');
    
    const prompt = `Set up a unit test environment for this project.

Project Info:
${projectInfo}

Workspace: ${workspaceRoot}

Analyze the project and provide:
1. The appropriate test framework and dependencies to install
2. Config files needed (jest.config.js, etc.)
3. How imports should work in test files

Keep it minimal - only what's needed to run tests.`;

    try {
        const response = await llmService.sendStructuredRequest(
            prompt,
            TEST_ENV_SCHEMA,
            'Configure the test environment. Be specific with config file contents.'
        );
        
        const setup = response.data as {
            language: string;
            framework: string;
            dependencies: string[];
            configFiles: { filename: string; content: string }[];
            testFileExtension: string;
            importStyle: string;
            runCommand: string;
        };
        
        SWLogger.log(`[TestGen] LLM recommends: ${setup.framework} for ${setup.language}`);
        
        // Install dependencies
        if (setup.dependencies.length > 0) {
            onProgress?.(`Installing ${setup.dependencies.length} test dependencies...`);
            SWLogger.log(`[TestGen] Installing: ${setup.dependencies.join(', ')}`);
            
            const installCmd = setup.language === 'python' 
                ? `pip install ${setup.dependencies.join(' ')}`
                : `npm install --save-dev ${setup.dependencies.join(' ')}`;
            
            try {
                await execAsync(installCmd, { cwd: workspaceRoot, timeout: 180000 });
                SWLogger.log('[TestGen] Dependencies installed');
            } catch (err: any) {
                SWLogger.log(`[TestGen] Install warning: ${err.message}`);
            }
        }
        
        // Write config files
        for (const config of setup.configFiles) {
            const configPath = path.join(workspaceRoot, config.filename);
            SWLogger.log(`[TestGen] Writing ${config.filename}`);
            fs.writeFileSync(configPath, config.content);
        }
        
        // Ensure test directory exists
        const testDir = path.join(workspaceRoot, 'UnitTests');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        
        return {
            success: true,
            testDir,
            importStyle: setup.importStyle,
            extension: setup.testFileExtension,
            runCommand: setup.runCommand
        };
    } catch (err: any) {
        SWLogger.log(`[TestGen] Setup failed: ${err.message}`);
        // Fall back to basic Jest setup
        return {
            success: false,
            testDir: path.join(workspaceRoot, 'UnitTests'),
            importStyle: 'commonjs',
            extension: '.test.js',
            runCommand: 'npx jest'
        };
    }
}

/**
 * Ask LLM to suggest folders to ignore and update .shadowignore
 */
async function suggestIgnorePatterns(
    workspaceRoot: string,
    projectInfo: string,
    llmService: any,
    onProgress?: (message: string) => void
): Promise<void> {
    SWLogger.log('[TestGen] Asking LLM to suggest ignore patterns...');
    onProgress?.('Analyzing folders to ignore...');
    
    // Get list of top-level directories
    const topLevelDirs: string[] = [];
    try {
        const entries = fs.readdirSync(workspaceRoot, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                topLevelDirs.push(entry.name);
            }
        }
    } catch {}
    
    const prompt = `Analyze this project and suggest folders/patterns that should be EXCLUDED from code analysis.

Project Info:
${projectInfo}

Top-level directories: ${topLevelDirs.join(', ')}

Suggest patterns for:
1. Build output folders (dist, build, out, .next, etc.)
2. Dependency folders (node_modules, vendor, venv, etc.)
3. Generated/compiled code
4. Test fixtures or mock data folders
5. Third-party code copied into the repo
6. IDE/editor folders (.idea, .vscode, etc.)
7. Cache folders

Only suggest folders that actually exist or are common for this project type.
DO NOT suggest: src, lib (if it's source), or the main code folders.`;

    try {
        const response = await llmService.sendStructuredRequest(
            prompt,
            IGNORE_PATTERNS_SCHEMA,
            'Suggest folders to ignore from analysis. Be conservative - only suggest obvious non-source folders.'
        );
        
        const suggestions = response.data as {
            patterns: { pattern: string; reason: string }[];
        };
        
        if (!suggestions.patterns || suggestions.patterns.length === 0) {
            SWLogger.log('[TestGen] No additional ignore patterns suggested');
            return;
        }
        
        SWLogger.log(`[TestGen] LLM suggested ${suggestions.patterns.length} ignore patterns`);
        
        // Read existing .shadowignore or create new
        const ignorePath = path.join(workspaceRoot, '.shadowignore');
        let existingContent = '';
        let existingPatterns = new Set<string>();
        
        if (fs.existsSync(ignorePath)) {
            existingContent = fs.readFileSync(ignorePath, 'utf-8');
            // Parse existing patterns
            existingContent.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    existingPatterns.add(trimmed);
                }
            });
        }
        
        // Filter out patterns that already exist
        const newPatterns = suggestions.patterns.filter(p => !existingPatterns.has(p.pattern));
        
        if (newPatterns.length === 0) {
            SWLogger.log('[TestGen] All suggested patterns already in .shadowignore');
            return;
        }
        
        // Build new content to append
        const timestamp = new Date().toISOString().split('T')[0];
        let newContent = existingContent;
        
        if (!existingContent) {
            // Create new file with header
            newContent = `# Shadow Watch Ignore File
# Patterns for folders/files to exclude from analysis
# Auto-generated: ${timestamp}

`;
        } else if (!existingContent.endsWith('\n')) {
            newContent += '\n';
        }
        
        // Add new patterns with comments
        newContent += `\n# Auto-suggested patterns (${timestamp})\n`;
        for (const p of newPatterns) {
            newContent += `${p.pattern}  # ${p.reason}\n`;
        }
        
        fs.writeFileSync(ignorePath, newContent);
        SWLogger.log(`[TestGen] Updated .shadowignore with ${newPatterns.length} new patterns`);
        
    } catch (err: any) {
        SWLogger.log(`[TestGen] Ignore pattern suggestion failed: ${err.message}`);
        // Non-fatal - continue without updating ignore file
    }
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
    
    // Step 1: Detect project characteristics
    onProgress?.('Detecting project setup...');
    const projectInfo = detectProjectInfo(workspaceRoot);
    SWLogger.log(`[TestGen] Project info:\n${projectInfo}`);
    
    // Step 1.5: Ask LLM to suggest ignore patterns (updates .shadowignore)
    await suggestIgnorePatterns(workspaceRoot, projectInfo, llmService, onProgress);
    
    // Step 2: Ask LLM to set up test environment
    const envSetup = await setupTestEnvironment(workspaceRoot, projectInfo, llmService, onProgress);
    SWLogger.log(`[TestGen] Environment setup: ${envSetup.success ? 'success' : 'fallback'}, import style: ${envSetup.importStyle}`);
    
    // Cap test targets - we'll generate tests ONE AT A TIME to avoid token limits
    const MAX_TEST_TARGETS = 5;
    const cappedTargets = analysisResult.testTargets.slice(0, MAX_TEST_TARGETS);
    if (analysisResult.testTargets.length > MAX_TEST_TARGETS) {
        SWLogger.log(`[TestGen] Capping test targets from ${analysisResult.testTargets.length} to ${MAX_TEST_TARGETS}`);
    }
    
    // Only include functions that are in our capped targets
    const targetFunctions = new Set(cappedTargets.map(t => t.function));
    const cappedFunctions = analysisResult.functions.filter(f => targetFunctions.has(f.name));
    SWLogger.log(`[TestGen] Will generate tests for ${cappedFunctions.length} functions`);
    
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
        
        // Calculate the import path from UnitTests to the source file
        const importPath = '../' + func.file.replace(/\.ts$/, '').replace(/\.js$/, '');
        
        // Prompt that asks for REAL imports based on detected setup
        const singlePrompt = `Generate a Jest unit test for this function.

Project setup:
- Import style: ${envSetup.importStyle}
- Test file will be in: UnitTests/
- Source file: ${func.file}
- Import path from test: ${importPath}

Function: ${func.name}
Purpose: ${func.purpose || 'Unknown'}

Source Code:
\`\`\`
${funcCode}
\`\`\`

Generate a test that:
1. Imports the REAL function from the source file using: ${envSetup.importStyle === 'esm' ? `import { ${func.name} } from '${importPath}'` : `const { ${func.name} } = require('${importPath}')`}
2. Has 2-3 test cases in a describe block
3. Mocks any external dependencies the function uses
4. Tests both success and edge cases`;
        
        try {
            const response = await llmService.sendStructuredRequest(
                singlePrompt,
                {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        testCode: { type: "string", description: "Complete test code with import and describe block" }
                    },
                    required: ["testCode"]
                },
                'Generate a unit test that imports from the real source file.'
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
        const fixPrompt = `The following test code has a syntax error:

ERROR: ${syntaxCheck.error}

CODE:
\`\`\`javascript
${testFileContent}
\`\`\`

Fix the syntax error and return the complete corrected code.
Keep the imports to the source files - this is a real unit test.`;
        
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

    // Check for build errors BEFORE running tests
    onProgress?.('Checking for build errors...');
    const buildCheck = await checkBuildErrors(workspaceRoot, testFilePath);
    
    if (buildCheck.hasErrors) {
        const userCodeErrors = buildCheck.errors.filter(e => e.isUserCode);
        const testCodeErrors = buildCheck.errors.filter(e => !e.isUserCode);
        
        SWLogger.log(`[TestGen] Build errors detected: ${userCodeErrors.length} in user code, ${testCodeErrors.length} in tests`);
        
        // If there are errors in user code, we cannot run tests reliably
        if (userCodeErrors.length > 0) {
            SWLogger.log('[TestGen] Skipping test execution due to user code errors');
            onProgress?.(`Found ${userCodeErrors.length} build error(s) in your code - see report for details`);
            
            return {
                testsGenerated: testData.tests.length,
                testFilePath,
                buildErrors: buildCheck.errors,
                buildErrorsSkippedTests: true,
                runResult: {
                    passed: 0,
                    failed: 0,
                    output: `Tests skipped due to ${userCodeErrors.length} build error(s) in source code:\n\n` +
                            userCodeErrors.map(e => `  ${e.file}:${e.line} - ${e.message}`).join('\n')
                }
            };
        }
        
        // If only test code has errors, report them but note we tried to generate tests
        if (testCodeErrors.length > 0) {
            SWLogger.log('[TestGen] Generated tests have errors (may be due to import issues)');
        }
    }

    // Run tests using the command from LLM setup
    onProgress?.('Running tests...');
    SWLogger.log(`[TestGen] Running tests with: ${envSetup.runCommand}`);
    
    const runResult = await runTests(workspaceRoot, testFilePath, envSetup.runCommand);

    SWLogger.log(`[TestGen] Tests complete: ${runResult.passed} passed, ${runResult.failed} failed`);

    return {
        testsGenerated: testData.tests.length,
        testFilePath,
        buildErrors: buildCheck.hasErrors ? buildCheck.errors : undefined,
        runResult
    };
}

/**
 * Check for TypeScript/build errors before running tests
 */
async function checkBuildErrors(
    workspaceRoot: string,
    testFilePath: string
): Promise<{ hasErrors: boolean; errors: BuildError[]; rawOutput: string }> {
    SWLogger.log('[TestGen] Checking for build/compilation errors...');
    
    // First check if TypeScript is being used
    const tsconfigPath = path.join(workspaceRoot, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
        SWLogger.log('[TestGen] No tsconfig.json, skipping TypeScript check');
        return { hasErrors: false, errors: [], rawOutput: '' };
    }
    
    try {
        // Run TypeScript compiler in check mode (no emit)
        const { stdout, stderr } = await execAsync(
            'npx tsc --noEmit 2>&1 || true',
            { cwd: workspaceRoot, timeout: 60000 }
        );
        
        const output = stdout + stderr;
        const errors = parseBuildErrors(output, workspaceRoot, testFilePath);
        
        SWLogger.log(`[TestGen] Found ${errors.length} build errors`);
        
        return {
            hasErrors: errors.length > 0,
            errors,
            rawOutput: output
        };
    } catch (err: any) {
        SWLogger.log(`[TestGen] Build check failed: ${err.message}`);
        return { hasErrors: false, errors: [], rawOutput: err.message };
    }
}

/**
 * Parse TypeScript/compilation errors from output
 */
function parseBuildErrors(output: string, workspaceRoot: string, testFilePath: string): BuildError[] {
    const errors: BuildError[] = [];
    
    // Match TypeScript error format: file(line,col): error TSxxxx: message
    // Also match: file:line:col - error TSxxxx: message
    const patterns = [
        /^(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)$/gm,
        /^(.+?):(\d+):(\d+)\s*-\s*error\s+(TS\d+):\s*(.+)$/gm
    ];
    
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(output)) !== null) {
            const [, filePath, line, col, code, message] = match;
            
            // Normalize the file path
            const normalizedPath = filePath.trim();
            const fullPath = path.isAbsolute(normalizedPath) 
                ? normalizedPath 
                : path.join(workspaceRoot, normalizedPath);
            
            // Determine if this is user code or generated test code
            const isUserCode = !fullPath.includes('UnitTests') && 
                               !fullPath.includes('generated.test') &&
                               !fullPath.includes('node_modules');
            
            errors.push({
                file: normalizedPath,
                line: parseInt(line),
                column: parseInt(col),
                message: message.trim(),
                code,
                isUserCode
            });
        }
    }
    
    // Deduplicate errors
    const seen = new Set<string>();
    return errors.filter(e => {
        const key = `${e.file}:${e.line}:${e.message}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Run tests and capture results
 */
async function runTests(
    workspaceRoot: string,
    testFilePath: string,
    runCommand: string
): Promise<{ passed: number; failed: number; output: string }> {
    // Build the full command - append the test file if command looks like jest/pytest
    let fullCommand = runCommand;
    if (runCommand.includes('jest') || runCommand.includes('npx jest')) {
        fullCommand = `${runCommand} "${testFilePath}" --json --no-coverage`;
    } else if (runCommand.includes('pytest')) {
        fullCommand = `${runCommand} "${testFilePath}" -v`;
    }
    
    SWLogger.log(`[TestGen] Executing: ${fullCommand}`);
    
    try {
        const { stdout, stderr } = await execAsync(
            fullCommand,
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

/**
 * Run existing tests without regenerating them
 * Checks for build errors first, then runs tests if they exist
 */
export async function runExistingTests(
    workspaceRoot: string,
    onProgress?: (message: string) => void
): Promise<TestGenerationResult> {
    SWLogger.log('[TestGen] Running existing tests...');
    
    const testDir = path.join(workspaceRoot, 'UnitTests');
    const testFilePath = path.join(testDir, 'generated.test.js');
    
    // Check if test file exists
    if (!fs.existsSync(testFilePath)) {
        SWLogger.log('[TestGen] No existing tests found');
        return {
            testsGenerated: 0,
            testFilePath,
            runResult: {
                passed: 0,
                failed: 0,
                output: 'No tests found. Run "Analysis + Tests" first to generate tests.'
            }
        };
    }
    
    // Check for build errors first
    onProgress?.('Checking for build errors...');
    const buildCheck = await checkBuildErrors(workspaceRoot, testFilePath);
    
    if (buildCheck.hasErrors) {
        const userCodeErrors = buildCheck.errors.filter(e => e.isUserCode);
        const testCodeErrors = buildCheck.errors.filter(e => !e.isUserCode);
        
        SWLogger.log(`[TestGen] Build errors: ${userCodeErrors.length} in user code, ${testCodeErrors.length} in tests`);
        
        if (userCodeErrors.length > 0) {
            onProgress?.(`Found ${userCodeErrors.length} build error(s) - fix them first`);
            return {
                testsGenerated: 0,
                testFilePath,
                buildErrors: buildCheck.errors,
                buildErrorsSkippedTests: true,
                runResult: {
                    passed: 0,
                    failed: 0,
                    output: `Tests skipped due to ${userCodeErrors.length} build error(s):\n\n` +
                            userCodeErrors.map(e => `  ${e.file}:${e.line} - ${e.message}`).join('\n')
                }
            };
        }
    }
    
    // Determine test command - check package.json for test script
    let runCommand = 'npx jest';
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            if (pkg.scripts?.test && pkg.scripts.test.includes('jest')) {
                runCommand = 'npm test --';
            }
        } catch {}
    }
    
    // Run the tests
    onProgress?.('Running tests...');
    SWLogger.log(`[TestGen] Running: ${runCommand}`);
    
    const runResult = await runTests(workspaceRoot, testFilePath, runCommand);
    
    SWLogger.log(`[TestGen] Results: ${runResult.passed} passed, ${runResult.failed} failed`);
    
    return {
        testsGenerated: 0, // We didn't generate new tests
        testFilePath,
        buildErrors: buildCheck.hasErrors ? buildCheck.errors : undefined,
        runResult
    };
}
