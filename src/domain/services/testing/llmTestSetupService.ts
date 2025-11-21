/**
 * LLM-based test setup service
 * Phase 1: Detect environment and generate test configuration
 */

import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { TestSetupPlan, TestEnvironment, SetupExecutionResult } from './types/testSetupTypes';
import { buildSetupPrompt } from '../../prompts/testPrompts';
import { SWLogger } from '../../../logger';

export class LLMTestSetupService {
    /**
     * Detect current test environment
     */
    static detectTestEnvironment(workspaceRoot: string): TestEnvironment {
        const packageJsonPath = path.join(workspaceRoot, 'package.json');
        const tsConfigPath = path.join(workspaceRoot, 'tsconfig.json');
        const jestConfigPath = path.join(workspaceRoot, 'jest.config.js');
        const testDirectory = path.join(workspaceRoot, 'UnitTests');

        const hasPackageJson = fs.existsSync(packageJsonPath);
        const hasTsConfig = fs.existsSync(tsConfigPath);
        const hasJestConfig = fs.existsSync(jestConfigPath);
        const hasTestDirectory = fs.existsSync(testDirectory);

        // Detect primary language
        const files = this.getAllFiles(workspaceRoot);
        const languageCounts: { [key: string]: number } = {};
        
        for (const file of files) {
            const ext = path.extname(file);
            if (ext === '.ts') languageCounts['typescript'] = (languageCounts['typescript'] || 0) + 1;
            else if (ext === '.js') languageCounts['javascript'] = (languageCounts['javascript'] || 0) + 1;
            else if (ext === '.py') languageCounts['python'] = (languageCounts['python'] || 0) + 1;
            else if (ext === '.java') languageCounts['java'] = (languageCounts['java'] || 0) + 1;
            else if (ext === '.cpp' || ext === '.cc') languageCounts['cpp'] = (languageCounts['cpp'] || 0) + 1;
        }

        const primaryLanguage = Object.entries(languageCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'typescript';

        // Detect existing test framework
        let existingTestFramework: string | undefined;
        if (hasPackageJson) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                
                if (allDeps['jest']) existingTestFramework = 'jest';
                else if (allDeps['mocha']) existingTestFramework = 'mocha';
                else if (allDeps['vitest']) existingTestFramework = 'vitest';
                else if (allDeps['pytest']) existingTestFramework = 'pytest';
            } catch (error) {
                SWLogger.log('Error reading package.json: ' + error);
            }
        }

        // Check for missing dependencies
        const missingDependencies: string[] = [];
        if (!existingTestFramework) {
            if (primaryLanguage === 'typescript' || primaryLanguage === 'javascript') {
                missingDependencies.push('jest', 'ts-jest', '@types/jest');
            } else if (primaryLanguage === 'python') {
                missingDependencies.push('pytest');
            }
        }

        return {
            hasPackageJson,
            hasTsConfig,
            hasJestConfig,
            hasTestDirectory,
            primaryLanguage,
            existingTestFramework,
            missingDependencies
        };
    }

    /**
     * Generate test setup plan using LLM
     */
    static async generateSetupPlan(
        workspaceRoot: string,
        llmService: any // Will be LLMService type
    ): Promise<TestSetupPlan> {
        SWLogger.log('[TestSetup] Generating test setup plan with LLM...');

        // Get file list
        const files = this.getAllFiles(workspaceRoot);
        const relativeFiles = files.map(f => path.relative(workspaceRoot, f));

        // Get package.json if exists
        let packageJsonContent: string | undefined;
        const packageJsonPath = path.join(workspaceRoot, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
        }

        // Build prompt
        const prompt = buildSetupPrompt(workspaceRoot, relativeFiles, packageJsonContent);

        // Call LLM to generate setup plan
        const setupPlan = await llmService.generateTestSetupPlan(prompt);

        SWLogger.log(`[TestSetup] Generated plan for ${setupPlan.language} using ${setupPlan.testing_framework}`);
        SWLogger.log(`[TestSetup] Dependencies needed: ${setupPlan.dependencies.length}`);
        SWLogger.log(`[TestSetup] Config files to create: ${setupPlan.config_files.length}`);

        return setupPlan;
    }

    /**
     * Execute the setup plan
     */
    static async executeSetup(
        workspaceRoot: string,
        setupPlan: TestSetupPlan
    ): Promise<SetupExecutionResult> {
        SWLogger.log('[TestSetup] Executing setup plan...');

        const result: SetupExecutionResult = {
            success: true,
            message: '',
            filesCreated: [],
            dependenciesInstalled: [],
            errors: []
        };

        try {
            // 1. Create test directory if needed
            const testDir = path.join(workspaceRoot, setupPlan.test_directory);
            if (!fs.existsSync(testDir)) {
                fs.mkdirSync(testDir, { recursive: true });
                result.filesCreated.push(setupPlan.test_directory);
                SWLogger.log(`[TestSetup] Created test directory: ${setupPlan.test_directory}`);
            }

            // 2. Create configuration files
            for (const configFile of setupPlan.config_files) {
                const filePath = path.join(workspaceRoot, configFile.path);
                
                // Don't overwrite existing files
                if (fs.existsSync(filePath)) {
                    SWLogger.log(`[TestSetup] Skipping ${configFile.path} (already exists)`);
                    continue;
                }

                fs.writeFileSync(filePath, configFile.content, 'utf-8');
                result.filesCreated.push(configFile.path);
                SWLogger.log(`[TestSetup] Created config file: ${configFile.path}`);
            }

            // 3. Install dependencies
            const devDeps = setupPlan.dependencies.filter(d => d.dev).map(d => `${d.name}@${d.version}`);
            const prodDeps = setupPlan.dependencies.filter(d => !d.dev).map(d => `${d.name}@${d.version}`);

            if (devDeps.length > 0) {
                SWLogger.log(`[TestSetup] Installing ${devDeps.length} dev dependencies: ${devDeps.join(', ')}`);
                SWLogger.log(`[TestSetup] Running npm install --save-dev (this may take 1-2 minutes)...`);
                const installResult = await this.installDependencies(workspaceRoot, devDeps, true);
                
                if (installResult.success) {
                    result.dependenciesInstalled.push(...devDeps);
                    SWLogger.log(`[TestSetup] ✅ Successfully installed ${devDeps.length} dev dependencies`);
                } else {
                    result.errors.push(`Failed to install dev dependencies: ${installResult.error}`);
                    result.success = false;
                    SWLogger.log(`[TestSetup] ❌ Failed to install dev dependencies: ${installResult.error}`);
                }
            }

            if (prodDeps.length > 0) {
                SWLogger.log(`[TestSetup] Installing ${prodDeps.length} prod dependencies: ${prodDeps.join(', ')}`);
                SWLogger.log(`[TestSetup] Running npm install --save (this may take 1-2 minutes)...`);
                const installResult = await this.installDependencies(workspaceRoot, prodDeps, false);
                
                if (installResult.success) {
                    result.dependenciesInstalled.push(...prodDeps);
                } else {
                    result.errors.push(`Failed to install prod dependencies: ${installResult.error}`);
                    result.success = false;
                }
            }

            // 4. Create mocks if needed
            for (const mockReq of setupPlan.mock_requirements) {
                if (mockReq.type === 'vscode') {
                    await this.createVSCodeMock(workspaceRoot);
                    result.filesCreated.push('src/test/__mocks__/vscode.ts');
                }
            }

            if (result.success) {
                result.message = 'Test setup completed successfully';
                SWLogger.log('[TestSetup] Setup completed successfully');
            } else {
                result.message = `Test setup completed with ${result.errors.length} error(s)`;
                SWLogger.log(`[TestSetup] Setup completed with errors: ${result.errors.join('; ')}`);
            }

        } catch (error: any) {
            result.success = false;
            result.message = `Setup failed: ${error.message}`;
            result.errors.push(error.message);
            SWLogger.log(`[TestSetup] Setup failed: ${error.message}`);
        }

        return result;
    }

    /**
     * Validate setup by running a simple test
     */
    static async validateSetup(workspaceRoot: string): Promise<{ valid: boolean; error?: string }> {
        SWLogger.log('[TestSetup] Validating test setup...');

        // Create a simple smoke test
        const testDir = path.join(workspaceRoot, 'UnitTests');
        const smokeTestPath = path.join(testDir, 'smoke.test.ts');

        const smokeTestCode = `
describe('Smoke Test', () => {
    test('Jest is configured correctly', () => {
        expect(true).toBe(true);
    });
});
`;

        try {
            fs.writeFileSync(smokeTestPath, smokeTestCode, 'utf-8');
            SWLogger.log('[TestSetup] Created smoke test');

            // Run the smoke test
            const result = await this.runCommand(workspaceRoot, 'npm test -- smoke.test.ts');

            // Delete smoke test
            if (fs.existsSync(smokeTestPath)) {
                fs.unlinkSync(smokeTestPath);
            }

            if (result.success) {
                SWLogger.log('[TestSetup] Setup validation passed');
                return { valid: true };
            } else {
                SWLogger.log(`[TestSetup] Setup validation failed: ${result.error}`);
                return { valid: false, error: result.error };
            }

        } catch (error: any) {
            SWLogger.log(`[TestSetup] Setup validation error: ${error.message}`);
            return { valid: false, error: error.message };
        }
    }

    // Helper methods

    private static getAllFiles(dir: string, fileList: string[] = []): string[] {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            
            // Skip node_modules, .git, dist, build
            if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build' || file === 'out') {
                continue;
            }

            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                this.getAllFiles(filePath, fileList);
            } else {
                fileList.push(filePath);
            }
        }

        return fileList;
    }

    private static async installDependencies(
        workspaceRoot: string,
        dependencies: string[],
        dev: boolean
    ): Promise<{ success: boolean; error?: string }> {
        const flag = dev ? '--save-dev' : '--save';
        const command = `npm install ${flag} ${dependencies.join(' ')}`;

        return this.runCommand(workspaceRoot, command);
    }

    private static async runCommand(
        cwd: string,
        command: string
    ): Promise<{ success: boolean; error?: string; output?: string }> {
        return new Promise((resolve) => {
            child_process.exec(command, { cwd, timeout: 120000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve({ success: false, error: stderr || stdout || error.message });
                } else {
                    resolve({ success: true, output: stdout });
                }
            });
        });
    }

    private static async createVSCodeMock(workspaceRoot: string): Promise<void> {
        const mockDir = path.join(workspaceRoot, 'src', 'test', '__mocks__');
        const mockPath = path.join(mockDir, 'vscode.ts');

        if (fs.existsSync(mockPath)) {
            SWLogger.log('[TestSetup] VSCode mock already exists');
            return;
        }

        if (!fs.existsSync(mockDir)) {
            fs.mkdirSync(mockDir, { recursive: true });
        }

        const mockCode = `export const window = {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    createOutputChannel: jest.fn(() => ({
        appendLine: jest.fn(),
        clear: jest.fn(),
        dispose: jest.fn()
    }))
};

export const workspace = {
    getConfiguration: jest.fn(() => ({
        get: jest.fn(),
        has: jest.fn(),
        update: jest.fn()
    })),
    workspaceFolders: [],
    onDidChangeConfiguration: jest.fn()
};

export const commands = {
    registerCommand: jest.fn()
};

export class Uri {
    static file(path: string) {
        return { fsPath: path, scheme: 'file' };
    }
}

export const ExtensionContext = jest.fn();
`;

        fs.writeFileSync(mockPath, mockCode, 'utf-8');
        SWLogger.log('[TestSetup] Created VSCode mock');
    }
}
