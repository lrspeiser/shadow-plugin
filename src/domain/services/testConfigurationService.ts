/**
 * Test Configuration Service
 * Automatically detects and sets up test configuration to ensure generated tests work
 * without requiring manual configuration from users
 */
import * as fs from 'fs';
import * as path from 'path';
import { SWLogger } from '../../logger';

export interface TestConfigStatus {
    framework: 'jest' | 'mocha' | 'vitest' | 'pytest' | 'unknown';
    configured: boolean;
    configFile?: string;
    dependenciesInstalled: boolean;
    missingDependencies: string[];
    setupRequired: boolean;
    setupActions: string[];
}

export class TestConfigurationService {
    /**
     * Detect test framework and configuration status
     */
    static detectTestConfiguration(workspaceRoot: string): TestConfigStatus {
        const status: TestConfigStatus = {
            framework: 'unknown',
            configured: false,
            dependenciesInstalled: false,
            missingDependencies: [],
            setupRequired: false,
            setupActions: []
        };

        // Check package.json for test scripts and dependencies
        const packageJsonPath = path.join(workspaceRoot, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                const scripts = packageJson.scripts || {};
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

                // Detect framework from scripts
                if (scripts.test?.includes('jest') || deps.jest) {
                    status.framework = 'jest';
                    status.dependenciesInstalled = !!deps.jest;
                    if (!deps.jest) {
                        status.missingDependencies.push('jest');
                    }
                    if (status.framework === 'jest' && !deps['ts-jest'] && !deps['@jest/globals']) {
                        // Check if TypeScript files exist
                        if (this.hasTypeScriptFiles(workspaceRoot)) {
                            status.missingDependencies.push('ts-jest');
                            status.missingDependencies.push('@types/jest');
                        }
                    }
                } else if (scripts.test?.includes('vitest') || deps.vitest) {
                    status.framework = 'vitest';
                    status.dependenciesInstalled = !!deps.vitest;
                    if (!deps.vitest) {
                        status.missingDependencies.push('vitest');
                    }
                } else if (scripts.test?.includes('mocha') || deps.mocha) {
                    status.framework = 'mocha';
                    status.dependenciesInstalled = !!deps.mocha;
                    if (!deps.mocha) {
                        status.missingDependencies.push('mocha');
                    }
                }
            } catch (error) {
                SWLogger.log(`Error reading package.json: ${error}`);
            }
        }

        // Check for configuration files
        if (status.framework === 'jest') {
            const jestConfigs = [
                'jest.config.js',
                'jest.config.ts',
                'jest.config.json',
                'jest.config.cjs',
                'jest.config.mjs'
            ];
            for (const configFile of jestConfigs) {
                const configPath = path.join(workspaceRoot, configFile);
                if (fs.existsSync(configPath)) {
                    status.configured = true;
                    status.configFile = configFile;
                    break;
                }
            }
        } else if (status.framework === 'vitest') {
            const vitestConfigs = ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts', 'vite.config.js'];
            for (const configFile of vitestConfigs) {
                const configPath = path.join(workspaceRoot, configFile);
                if (fs.existsSync(configPath)) {
                    status.configured = true;
                    status.configFile = configFile;
                    break;
                }
            }
        }

        // Determine if setup is required
        if (status.framework === 'unknown' || !status.configured || status.missingDependencies.length > 0) {
            status.setupRequired = true;
        }

        return status;
    }

    /**
     * Automatically set up minimal test configuration
     */
    static async setupTestConfiguration(
        workspaceRoot: string,
        framework: 'jest' | 'vitest' | 'mocha' = 'jest'
    ): Promise<{ success: boolean; message: string; filesCreated: string[] }> {
        const filesCreated: string[] = [];

        try {
            if (framework === 'jest') {
                // Create minimal jest.config.js if it doesn't exist
                const jestConfigPath = path.join(workspaceRoot, 'jest.config.js');
                if (!fs.existsSync(jestConfigPath)) {
                    const hasTypeScript = this.hasTypeScriptFiles(workspaceRoot);
                    
                    const jestConfig = hasTypeScript
                        ? this.generateJestConfigWithTypeScript(workspaceRoot)
                        : this.generateJestConfigBasic(workspaceRoot);

                    fs.writeFileSync(jestConfigPath, jestConfig, 'utf-8');
                    filesCreated.push('jest.config.js');
                    SWLogger.log('Created jest.config.js');
                }

                // Create VS Code mock if TypeScript and doesn't exist
                if (hasTypeScript) {
                    const vscodeMockPath = path.join(workspaceRoot, 'src', 'test', '__mocks__', 'vscode.ts');
                    if (!fs.existsSync(vscodeMockPath)) {
                        const mockDir = path.dirname(vscodeMockPath);
                        if (!fs.existsSync(mockDir)) {
                            fs.mkdirSync(mockDir, { recursive: true });
                        }
                        fs.writeFileSync(vscodeMockPath, this.generateVSCodeMock(), 'utf-8');
                        filesCreated.push('src/test/__mocks__/vscode.ts');
                        SWLogger.log('Created VS Code mock file');
                    }
                }
            }

            return {
                success: true,
                message: `Test configuration setup complete. Created: ${filesCreated.join(', ')}`,
                filesCreated
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to setup test configuration: ${error.message}`,
                filesCreated
            };
        }
    }

    /**
     * Check if workspace has TypeScript files
     */
    private static hasTypeScriptFiles(workspaceRoot: string): boolean {
        const testDirs = ['src', 'UnitTests', 'tests', 'test'];
        for (const dir of testDirs) {
            const dirPath = path.join(workspaceRoot, dir);
            if (fs.existsSync(dirPath)) {
                const files = this.findFiles(dirPath, /\.ts$/);
                if (files.length > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Recursively find files matching pattern
     */
    private static findFiles(dir: string, pattern: RegExp): string[] {
        const results: string[] = [];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
                    results.push(...this.findFiles(fullPath, pattern));
                } else if (entry.isFile() && pattern.test(entry.name)) {
                    results.push(fullPath);
                }
            }
        } catch (error) {
            // Ignore errors
        }
        return results;
    }

    /**
     * Generate Jest config with TypeScript support
     */
    private static generateJestConfigWithTypeScript(workspaceRoot: string): string {
        // Detect test directories
        const testDirs: string[] = [];
        if (fs.existsSync(path.join(workspaceRoot, 'UnitTests'))) testDirs.push('UnitTests');
        if (fs.existsSync(path.join(workspaceRoot, 'src'))) testDirs.push('src');
        if (fs.existsSync(path.join(workspaceRoot, 'tests'))) testDirs.push('tests');
        if (fs.existsSync(path.join(workspaceRoot, 'test'))) testDirs.push('test');

        return `// Jest configuration auto-generated by Shadow Watch
// This is a minimal configuration to support generated tests
// You can customize this file as needed

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ${JSON.stringify(testDirs.length > 0 ? testDirs : ['<rootDir>'])},
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'commonjs',
        target: 'ES2020',
        lib: ['ES2020'],
        strict: false,
        skipLibCheck: true,
        resolveJsonModule: true,
        moduleResolution: 'node'
      }
    }]
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^vscode$': '<rootDir>/src/test/__mocks__/vscode.ts'
  },
  testTimeout: 10000,
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/out/',
    '/.vscode-test/'
  ]
};
`;
    }

    /**
     * Generate basic Jest config (no TypeScript)
     */
    private static generateJestConfigBasic(workspaceRoot: string): string {
        const testDirs: string[] = [];
        if (fs.existsSync(path.join(workspaceRoot, 'UnitTests'))) testDirs.push('UnitTests');
        if (fs.existsSync(path.join(workspaceRoot, 'tests'))) testDirs.push('tests');
        if (fs.existsSync(path.join(workspaceRoot, 'test'))) testDirs.push('test');

        return `// Jest configuration auto-generated by Shadow Watch
// This is a minimal configuration to support generated tests
// You can customize this file as needed

module.exports = {
  testEnvironment: 'node',
  roots: ${JSON.stringify(testDirs.length > 0 ? testDirs : ['<rootDir>'])},
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  testTimeout: 10000,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/out/'
  ]
};
`;
    }

    /**
     * Generate VS Code mock file
     */
    private static generateVSCodeMock(): string {
        return `// Mock VS Code API for Jest tests
// Auto-generated by Shadow Watch

// Use type-safe mock functions that work without Jest types at compile time
const createMockFn = () => {
  const fn: any = function(...args: any[]) { return fn.mockReturnValue ? fn.mockReturnValue() : undefined; };
  fn.mockReturnValue = (value: any) => { fn._returnValue = value; return fn; };
  fn.mockResolvedValue = (value: any) => { fn._returnValue = Promise.resolve(value); return fn; };
  fn.mockRejectedValue = (value: any) => { fn._returnValue = Promise.reject(value); return fn; };
  fn.mockImplementation = (impl: any) => { fn._impl = impl; return fn; };
  fn.mock = { calls: [], results: [] };
  return fn;
};

export const window = {
  showInformationMessage: createMockFn(),
  showErrorMessage: createMockFn(),
  showWarningMessage: createMockFn(),
  createOutputChannel: createMockFn(() => ({
    appendLine: createMockFn(),
    clear: createMockFn(),
    dispose: createMockFn(),
    show: createMockFn()
  })),
  showTextDocument: createMockFn(),
  createTextEditorDecorationType: createMockFn(),
  activeTextEditor: undefined
};

export const workspace = {
  getConfiguration: createMockFn(() => ({
    get: createMockFn(),
    has: createMockFn(),
    update: createMockFn(),
    inspect: createMockFn()
  })),
  workspaceFolders: [],
  onDidChangeConfiguration: createMockFn(),
  onDidChangeWorkspaceFolders: createMockFn(),
  findFiles: createMockFn(),
  openTextDocument: createMockFn()
};

export const commands = {
  registerCommand: createMockFn(),
  executeCommand: createMockFn()
};

export class Uri {
  static file(path: string) {
    return { fsPath: path, scheme: 'file', path: path };
  }
  static joinPath(...parts: any[]) {
    return { fsPath: parts.join('/'), scheme: 'file' };
  }
  fsPath: string;
  scheme: string;
  constructor() {
    this.fsPath = '';
    this.scheme = 'file';
  }
}

export class ExtensionContext {
  subscriptions: any[] = [];
  workspaceState: any = {
    get: createMockFn(),
    update: createMockFn()
  };
  globalState: any = {
    get: createMockFn(),
    update: createMockFn(),
    setKeysForSync: createMockFn()
  };
  extensionPath: string = '';
  asAbsolutePath: any = createMockFn((path: string) => path);
}

export const ViewColumn = {
  One: 1,
  Two: 2,
  Three: 3,
  Active: -1,
  Beside: -2
};

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3
};

export const TreeItemCollapsibleState = {
  None: 0,
  Collapsed: 1,
  Expanded: 2
};

export const ProgressLocation = {
  SourceControl: 1,
  Window: 10,
  Notification: 15
};
`;
    }

    /**
     * Generate helpful setup instructions
     */
    static generateSetupInstructions(status: TestConfigStatus): string {
        const instructions: string[] = [];

        if (status.framework === 'unknown') {
            instructions.push('No test framework detected. Shadow Watch will set up Jest automatically.');
        }

        if (status.missingDependencies.length > 0) {
            instructions.push(`Missing dependencies: ${status.missingDependencies.join(', ')}`);
            instructions.push(`Install with: npm install --save-dev ${status.missingDependencies.join(' ')}`);
        }

        if (!status.configured && status.framework !== 'unknown') {
            instructions.push(`No ${status.framework} configuration found. Shadow Watch will create a minimal config.`);
        }

        return instructions.join('\n');
    }
}

