/**
 * LLM-based test generation service
 * Phase 3: Generate tests incrementally in small batches
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestableFunction, TestGenerationState } from './types/testPlanTypes';
import { TestGenerationResult } from './types/testResultTypes';
import { buildGenerationPrompt, ArchitectureContext } from '../../prompts/testPrompts';
import { TestExecutionService } from './testExecutionService';
import { SWLogger } from '../../../logger';

export class LLMTestGenerationService {
    /**
     * Generate tests for a batch of functions
     * @param architectureInsights Optional architecture insights from architecture analysis to inform test generation
     */
    static async generateTestBatch(
        functions: TestableFunction[],
        workspaceRoot: string,
        llmService: any,
        onProgress?: (current: number, total: number, functionName: string) => void,
        architectureInsights?: any
    ): Promise<Map<string, TestGenerationResult>> {
        SWLogger.log(`[TestGeneration] Generating tests for ${functions.length} functions`);
        if (architectureInsights) {
            SWLogger.log(`[TestGeneration] Using architecture insights to inform test generation`);
        }

        const results = new Map<string, TestGenerationResult>();

        for (let i = 0; i < functions.length; i++) {
            const func = functions[i];
            
            if (onProgress) {
                onProgress(i + 1, functions.length, func.name);
            }

            try {
                // Read source code for the function
                const sourceCode = this.extractFunctionSource(func, workspaceRoot);

                // Extract exports/import path context from the source file
                const fileContext = this.extractFileContext(func.file, workspaceRoot);
                
                // Check if mock already exists
                const mockPath = path.join(workspaceRoot, 'src', 'test', '__mocks__', 'vscode.ts');
                const existingMocks = fs.existsSync(mockPath) ? fs.readFileSync(mockPath, 'utf-8') : undefined;

                // Build architecture context for this function
                const architectureContext = this.buildArchitectureContextForFunction(
                    func,
                    architectureInsights
                );

                // Build prompt for this specific function
                const prompt = buildGenerationPrompt(func, sourceCode, 'jest', existingMocks, fileContext, architectureContext);

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

        // Add imports from LLM, but we will inject the primary import ourselves
        if (testResult.imports && testResult.imports.length > 0) {
            // Filter out any incorrect imports trying to import the target module from guessed paths
            const filtered = testResult.imports.filter(line => {
                return !/from '\.\.\//.test(line) || !/src\//.test(line) || !/\} from/.test(line);
            });
            if (filtered.length > 0) {
                content += filtered.join('\n') + '\n\n';
            }
        }
        
        // Inject the correct import for the target function/module
        const primaryImport = this.computePrimaryImport(testResult, workspaceRoot);
        if (primaryImport) {
            content = `${primaryImport}\n` + content;
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

        // Check if this is a dependency error that can't be fixed by editing test code
        const isNodeModulesError = syntaxError.includes('node_modules/@types/') ||
                                   syntaxError.includes('node_modules/openai') ||
                                   syntaxError.includes('node_modules/@anthropic');
        const isConfigError = syntaxError.includes('Private identifiers are only available when targeting') ||
                              syntaxError.includes('--downlevelIteration');
        const isPackageExportError = syntaxError.includes('has no exported member') && 
                                     syntaxError.includes('node_modules');
        
        const isDependencyError = isNodeModulesError || isConfigError || isPackageExportError;
        
        if (isDependencyError) {
            SWLogger.log(`[TestGeneration] ⚠️ Dependency error detected - cannot fix by editing test code`);
            return { 
                success: false, 
                error: 'Dependency or TypeScript configuration error - requires package/config changes, not test code edits'
            };
        }

        try {
            // Read current test code
            const testCode = fs.readFileSync(testFilePath, 'utf-8');

            // Extract original function name from test file
            const functionMatch = testCode.match(/describe\(['"](.+?)['"]/);
            const functionName = functionMatch ? functionMatch[1] : 'unknown';
            
            SWLogger.log(`[TestGeneration] Fixing test for function: '${functionName}'`);

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
                SWLogger.log(`[TestGeneration] Applied LLM fix for '${functionName}': ${fixResult.explanation}`);
                
                // Re-validate syntax to confirm fix worked
                const revalidation = await TestExecutionService.validateSyntax(workspaceRoot, testFilePath);
                if (revalidation.valid) {
                    SWLogger.log(`[TestGeneration] ✅ Syntax fix verified for '${functionName}'`);
                    return { success: true, fixedCode: fixResult.fixed_code };
                } else {
                    SWLogger.log(`[TestGeneration] ❌ Syntax fix failed re-validation for '${functionName}': ${revalidation.error}`);
                    return { success: false, error: `Fix applied but syntax still invalid: ${revalidation.error}` };
                }
            } else {
                SWLogger.log(`[TestGeneration] LLM could not fix syntax error for '${functionName}': ${fixResult.explanation}`);
                return { success: false, error: fixResult.explanation };
            }

        } catch (error: any) {
            // Try to extract function name even in error case
            let funcNameForLog = 'unknown';
            try {
                const testCode = fs.readFileSync(testFilePath, 'utf-8');
                const match = testCode.match(/describe\(['"](.+?)['"]/);
                funcNameForLog = match ? match[1] : 'unknown';
            } catch (e) {
                // Ignore
            }
            SWLogger.log(`[TestGeneration] Error fixing syntax for '${funcNameForLog}': ${error.message}`);
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

    private static extractFileContext(file: string, workspaceRoot: string): { exports: string[]; defaultExport: boolean; importPathFromTests: string } {
        try {
            const filePath = path.join(workspaceRoot, file);
            const importPathFromTests = `../${file.replace(/\\.ts$/, '')}`;
            const exports: string[] = [];
            let defaultExport = false;
            if (fs.existsSync(filePath)) {
                const src = fs.readFileSync(filePath, 'utf-8');
                // Naive export detection (good enough for guidance)
                const namedMatches = src.matchAll(/export\s+(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)/g);
                for (const m of namedMatches) {
                    if (m[1]) exports.push(m[1]);
                }
                if (/export\s+default\s+/.test(src)) {
                    defaultExport = true;
                }
                const reExports = src.matchAll(/export\s*\{([^}]+)\}/g);
                for (const m of reExports) {
                    const names = m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]);
                    for (const n of names) if (n) exports.push(n);
                }
            }
            return { exports: Array.from(new Set(exports)), defaultExport, importPathFromTests };
        } catch {
            return { exports: [], defaultExport: false, importPathFromTests: `../${file.replace(/\\.ts$/, '')}` };
        }
    }

    private static computePrimaryImport(testResult: TestGenerationResult, workspaceRoot: string): string | null {
        try {
            const testFileName = path.basename(testResult.test_file_path);
            // Attempt to infer source file path from test file name when possible
            // e.g., analyzer.traverse.test.ts -> src/analyzer.ts
            const base = testFileName.replace(/\.test\.ts$/, '.ts');
            // Fallback to using hints from test code if needed later
            // Build import path
            let importPath: string | null = null;
            if (/^.+\.ts$/.test(base)) {
                // Look for a matching src file with same basename anywhere under src
                const srcCandidate = this.findSrcFileByBasename(base, workspaceRoot);
                if (srcCandidate) {
                    importPath = `../${srcCandidate.replace(/\.ts$/, '')}`;
                }
            }

            // If we can't infer, return null and let existing imports stand
            if (!importPath) return null;

            // Don't try to extract symbol from test description - those contain natural language
            // Just use namespace import which always works
            return `import * as moduleUnderTest from '${importPath}';`;
        } catch {
            return null;
        }
    }

    private static findSrcFileByBasename(basenameTs: string, workspaceRoot: string): string | null {
        // Shallow search common dirs
        const candidates = [
            path.join('src', basenameTs),
            path.join('src', 'analysis', basenameTs),
            path.join('src', 'ai', basenameTs),
            path.join('src', 'domain', basenameTs),
        ];
        for (const rel of candidates) {
            const abs = path.join(workspaceRoot, rel);
            if (fs.existsSync(abs)) return rel;
        }
        return null;
    }

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

    /**
     * Build architecture context for a specific function from architecture insights
     * This extracts relevant issues, edge cases, and test recommendations
     */
    private static buildArchitectureContextForFunction(
        func: TestableFunction,
        architectureInsights: any
    ): ArchitectureContext | undefined {
        if (!architectureInsights) {
            return undefined;
        }

        const context: ArchitectureContext = {};

        // Extract relevant issues for this function's file
        if (architectureInsights.issues && Array.isArray(architectureInsights.issues)) {
            context.issues = architectureInsights.issues
                .filter((issue: any) => {
                    // Check if issue mentions this function or file
                    const issueText = JSON.stringify(issue).toLowerCase();
                    const funcNameLower = func.name.toLowerCase();
                    const funcFileLower = func.file.toLowerCase();
                    return issueText.includes(funcNameLower) || issueText.includes(funcFileLower);
                })
                .map((issue: any) => ({
                    title: issue.title || issue.name || 'Unknown Issue',
                    description: issue.description || issue.details || '',
                    relevantFiles: issue.files || issue.relevantFiles,
                    relevantFunctions: issue.functions || issue.relevantFunctions
                }));
        }

        // Extract priority items mentioning this function
        if (architectureInsights.priorities && Array.isArray(architectureInsights.priorities)) {
            context.priorities = architectureInsights.priorities
                .filter((priority: any) => {
                    const priorityText = JSON.stringify(priority).toLowerCase();
                    return priorityText.includes(func.name.toLowerCase()) || 
                           priorityText.includes(func.file.toLowerCase());
                })
                .map((priority: any) => ({
                    title: priority.title || priority.name || 'Unknown Priority',
                    description: priority.description || priority.details || '',
                    relevantFiles: priority.files || priority.relevantFiles,
                    relevantFunctions: priority.functions || priority.relevantFunctions
                }));
        }

        // Check if this function is in recommended_test_targets
        if (architectureInsights.recommended_test_targets && Array.isArray(architectureInsights.recommended_test_targets)) {
            const matchingTarget = architectureInsights.recommended_test_targets.find(
                (target: any) => 
                    target.function_name === func.name ||
                    target.file_path === func.file ||
                    (target.file_path && func.file.endsWith(target.file_path))
            );

            if (matchingTarget) {
                context.testReason = matchingTarget.reason;
                context.edgeCases = matchingTarget.edge_cases;
            }
        }

        // Only return context if we found something relevant
        const hasIssues = context.issues && context.issues.length > 0;
        const hasPriorities = context.priorities && context.priorities.length > 0;
        const hasTestReason = !!context.testReason;
        const hasEdgeCases = context.edgeCases && context.edgeCases.length > 0;

        if (hasIssues || hasPriorities || hasTestReason || hasEdgeCases) {
            SWLogger.log(`[TestGeneration] Found architecture context for ${func.name}: ` +
                `${context.issues?.length || 0} issues, ` +
                `${context.priorities?.length || 0} priorities, ` +
                `${context.edgeCases?.length || 0} edge cases`);
            return context;
        }

        return undefined;
    }
}
