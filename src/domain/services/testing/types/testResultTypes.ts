/**
 * Type definitions for test generation and validation results
 */

export interface TestGenerationResult {
    test_file_path: string;
    imports: string[];
    mocks: MockStatement[];
    test_code: string;
    setup_code?: string;
    teardown_code?: string;
}

export interface MockStatement {
    statement: string;
    explanation: string;
}

export interface TestValidationResult {
    status: 'pass' | 'fail' | 'error';
    fixed_code?: string;
    explanation: string;
    remaining_issues?: string[];
}

export interface TestExecutionResult {
    test_file: string;
    status: 'pass' | 'fail' | 'error';
    passed: number;
    failed: number;
    errors: number;
    duration: number;
    error_details?: TestErrorDetail[];
}

export interface TestErrorDetail {
    test_name: string;
    error_message: string;
    stack_trace?: string;
}

export interface TestReport {
    summary: TestReportSummary;
    test_results: TestExecutionResult[];
    generated_at: string;
    recommendations: string[];
}

export interface TestReportSummary {
    total_tests: number;
    passed: number;
    failed: number;
    errors: number;
    pass_rate: number;
    files_generated: number;
    files_passing: number;
}
