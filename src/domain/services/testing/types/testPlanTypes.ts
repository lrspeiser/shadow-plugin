/**
 * Type definitions for test planning service
 */

export interface TestPlan {
    strategy: string;
    total_functions: number;
    testable_functions: number;
    function_groups: FunctionGroup[];
}

export interface FunctionGroup {
    group_id: string;
    name: string;
    priority: number;
    functions: TestableFunction[];
}

export interface TestableFunction {
    name: string;
    file: string;
    startLine: number;
    endLine: number;
    complexity: string;
    dependencies: string[];
    mocking_needed: boolean;
    parameters?: string[];
    return_type?: string;
}

export interface TestGenerationState {
    phase: 'setup' | 'planning' | 'generation' | 'validation' | 'complete';
    setup_complete: boolean;
    plan_created: boolean;
    functions_total: number;
    functions_generated: number;
    functions_validated: number;
    current_batch: string[];
    failures: TestFailure[];
    timestamp: string;
}

export interface TestFailure {
    function: string;
    error: string;
    attempts: number;
}
