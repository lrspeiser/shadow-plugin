/**
 * Type definitions for test setup service
 */

export interface TestSetupPlan {
    language: string;
    testing_framework: string;
    dependencies: Dependency[];
    config_files: ConfigFile[];
    test_directory: string;
    mock_requirements: MockRequirement[];
}

export interface Dependency {
    name: string;
    version: string;
    dev: boolean;
}

export interface ConfigFile {
    path: string;
    content: string;
}

export interface MockRequirement {
    type: string;
    reason: string;
}

export interface TestEnvironment {
    hasPackageJson: boolean;
    hasTsConfig: boolean;
    hasJestConfig: boolean;
    hasTestDirectory: boolean;
    primaryLanguage: string;
    existingTestFramework?: string;
    missingDependencies: string[];
}

export interface SetupExecutionResult {
    success: boolean;
    message: string;
    filesCreated: string[];
    dependenciesInstalled: string[];
    errors: string[];
}
