/**
 * LLM-based test generation service
 * Phase 3: Generate tests incrementally in small batches
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestableFunction, TestGenerationState } from './types/testPlanTypes';
import { TestGenerationResult } from './types/testResultTypes';
import { buildGenerationPrompt } from '../../prompts/testPrompts';
import { TestExecutionService } from './testExecutionService';
import { SWLogger } from '../../../logger';

export class LLMTestGenerationService {
    /**
     * Generate tests for a batch of functions
     */
    static async generateTestBatch(
        functions: TestableFunction[],
        workspaceRoot: string,
        llmService: any,
        onProgress?: (current: number, total: number, functionName: string) => void
    ): Promise<Map<string, TestGenerationResult>> {
        SWLogger.log(`[TestGeneration] Generating tests for ${functions.length} functions`);

        const results = new Map<string, TestGenerationResult>();

        for (let i = 0; i < functions.length; i++) {
            const func = functions[i];
            
            if (onProgress) {
                onProgress(i + 1, functions.length, func.name);
            }

            try {
                // Read source code for the function
                const sourceCode = this.extractFunctionSource(func, workspaceRoot);
                
                // Check if mock already exists
                const mockPath = path.join(workspaceRoot, 'src', 'test', '__mocks__', 'vscode.ts');
                const existingMocks = fs.existsSync(mockPath) ? fs.readFileSync(mockPath, 'utf-8') : undefined;

                // Build prompt for this specific function
                const prompt = buildGenerationPrompt(func, sourceCode, 'jest', existingMocks);

                // Call LLM to generate test
                const testResult = await llmService.generateTestForFunction(prompt);

                results.set(func.name, testResult);
                SWLogger.log(`[TestGeneration] Generated test for ${func.name}`);

            } catch (error: any) {
                SWLogger.log(`[TestGeneration] Error generating test for ${func.name}: ${error.message}`);
                throw error;
            }
        }

        return results;
    }

    /**
     * Write test file to disk
     */
    static async writeTestFile(
        testResult: TestGenerationResult,
        workspaceRoot: string
    ): Promise<string> {
        // Determine test file path
        let testFilePath = testResult.test_file_path;
        
        // Ensure it's in UnitTests directory
        if (!testFilePath.includes('UnitTests')) {
            const fileName = path.basename(testFilePath);
            testFilePath = path.join('UnitTests', fileName);
        }

        const fullPath = path.join(workspaceRoot, testFilePath);
        const testDir = path.dirname(fullPath);

        // Create directory if needed
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        // Build complete test file content
        let content = '';

        // Add imports
        if (testResult.imports && testResult.imports.length > 0) {
            content += testResult.imports.join('\n') + '\n\n';
        }

        // Add mocks
        if (testResult.mocks && testResult.mocks.length > 0) {
            content += '// Mocks\n';
            for (const mock of testResult.mocks) {
                content += `${mock.statement}\n`;
            }
            content += '\n';
        }

        // Add setup code
        if (testResult.setup_code) {
            content += `// Setup\n${testResult.setup_code}\n\n`;
        }

        // Add test code
        content += testResult.test_code;

        // Add teardown code
        if (testResult.teardown_code) {
            content += `\n\n// Teardown\n${testResult.teardown_code}`;
        }

        // Write to disk
        fs.writeFileSync(fullPath, content, 'utf-8');
        SWLogger.log(`[TestGeneration] Wrote test file: ${testFilePath}`);

        return fullPath;
    }

    /**
     * Validate test syntax
     */
    static async validateSyntax(
        testFilePath: string,
        workspaceRoot: string
    ): Promise<{ valid: boolean; error?: string }> {
        return TestExecutionService.validateSyntax(workspaceRoot, testFilePath);
    }

    /**
     * Fix syntax error using LLM
     */
    static async fixSyntaxError(
        testFilePath: string,
        syntaxError: string,
        workspaceRoot: string,
        llmService: any
    ): Promise<{ success: boolean; fixedCode?: string; error?: string }> {
        SWLogger.log(`[TestGeneration] Attempting to fix syntax error in ${testFilePath}`);

        try {
            // Read current test code
            const testCode = fs.readFileSync(testFilePath, 'utf-8');

            // Extract original function name from test file
            const functionMatch = testCode.match(/describe\(['"](.+?)['"]/);
            const functionName = functionMatch ? functionMatch[1] : 'unknown';

            // Try to read source code (best effort)
            let sourceCode = '// Source code not available';
            try {
                const sourceFile = testFilePath.replace('UnitTests/', 'src/').replace('.test.ts', '.ts');
                if (fs.existsSync(sourceFile)) {
                    sourceCode = fs.readFileSync(sourceFile, 'utf-8');
                }
            } catch (e) {
                // Ignore
            }

            // Call LLM to fix the test
            const fixResult = await llmService.fixFailingTest(testCode, syntaxError, sourceCode);

            if (fixResult.status === 'pass' && fixResult.fixed_code) {
                // Write fixed code
                fs.writeFileSync(testFilePath, fixResult.fixed_code, 'utf-8');
                SWLogger.log(`[TestGeneration] Fixed syntax error: ${fixResult.explanation}`);
                return { success: true, fixedCode: fixResult.fixed_code };
            } else {
                SWLogger.log(`[TestGeneration] Could not fix syntax error: ${fixResult.explanation}`);
                return { success: false, error: fixResult.explanation };
            }

        } catch (error: any) {
            SWLogger.log(`[TestGeneration] Error fixing syntax: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save generation state
     */
    static async saveGenerationState(
        workspaceRoot: string,
        state: TestGenerationState
    ): Promise<void> {
        const shadowDir = path.join(workspaceRoot, '.shadow');
        if (!fs.existsSync(shadowDir)) {
            fs.mkdirSync(shadowDir, { recursive: true });
        }

        const statePath = path.join(shadowDir, 'test-generation-state.json');
        fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
    }

    /**
     * Load generation state
     */
    static loadGenerationState(workspaceRoot: string): TestGenerationState | null {
        const statePath = path.join(workspaceRoot, '.shadow', 'test-generation-state.json');
        
        if (!fs.existsSync(statePath)) {
            return null;
        }

        try {
            const content = fs.readFileSync(statePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            SWLogger.log(`[TestGeneration] Error loading generation state: ${error}`);
            return null;
        }
    }

    // Helper methods

    private static extractFunctionSource(func: TestableFunction, workspaceRoot: string): string {
        try {
            const filePath = path.join(workspaceRoot, func.file);
            
            if (!fs.existsSync(filePath)) {
                return `// Source file not found: ${func.file}`;
            }

            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const lines = fileContent.split('\n');

            // Extract function lines (with some context)
            const startLine = Math.max(0, func.startLine - 2); // 2 lines before for context
            const endLine = Math.min(lines.length, func.endLine + 1); // 1 line after

            const functionLines = lines.slice(startLine, endLine);
            return functionLines.join('\n');

        } catch (error: any) {
            SWLogger.log(`[TestGeneration] Error extracting source for ${func.name}: ${error.message}`);
            return `// Error reading source: ${error.message}`;
        }
    }
}
