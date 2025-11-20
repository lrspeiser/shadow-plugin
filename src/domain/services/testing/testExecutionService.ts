/**
 * Service for executing tests and capturing results
 */

import * as child_process from 'child_process';
import * as path from 'path';
import { TestExecutionResult, TestErrorDetail } from './types/testResultTypes';

export class TestExecutionService {
    /**
     * Run Jest tests for a specific file or all tests
     */
    static async runJest(
        workspaceRoot: string,
        testFile?: string
    ): Promise<TestExecutionResult[]> {
        return new Promise((resolve, reject) => {
            const command = testFile 
                ? `npm test -- ${testFile} --json`
                : 'npm test -- --json';

            const options = {
                cwd: workspaceRoot,
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer
                timeout: 120000 // 2 minute timeout
            };

            console.log(`[TestExecutionService] Running: ${command}`);

            child_process.exec(command, options, (error, stdout, stderr) => {
                try {
                    // Jest outputs JSON even on failure
                    const results = this.parseJestOutput(stdout, stderr);
                    
                    if (results.length === 0 && error) {
                        console.error('[TestExecutionService] Jest execution failed:', error.message);
                        console.error('[TestExecutionService] stderr:', stderr);
                        
                        // Create error result
                        resolve([{
                            test_file: testFile || 'all',
                            status: 'error',
                            passed: 0,
                            failed: 0,
                            errors: 1,
                            duration: 0,
                            error_details: [{
                                test_name: 'Jest Execution',
                                error_message: error.message,
                                stack_trace: stderr
                            }]
                        }]);
                    } else {
                        resolve(results);
                    }
                } catch (parseError: any) {
                    console.error('[TestExecutionService] Failed to parse Jest output:', parseError);
                    reject(parseError);
                }
            });
        });
    }

    /**
     * Parse Jest JSON output
     */
    static parseJestOutput(stdout: string, stderr: string): TestExecutionResult[] {
        const results: TestExecutionResult[] = [];

        try {
            // Jest outputs JSON in stdout when --json flag is used
            const lines = stdout.split('\n');
            let jsonOutput = '';

            // Find the JSON output (it might be mixed with other output)
            for (const line of lines) {
                if (line.trim().startsWith('{')) {
                    jsonOutput = line;
                    break;
                }
            }

            if (!jsonOutput) {
                console.log('[TestExecutionService] No JSON output found in stdout');
                return results;
            }

            const jestResults = JSON.parse(jsonOutput);

            // Parse test results from Jest JSON format
            if (jestResults.testResults && Array.isArray(jestResults.testResults)) {
                for (const testResult of jestResults.testResults) {
                    const testFile = testResult.name || testResult.testFilePath || 'unknown';
                    const errors: TestErrorDetail[] = [];

                    // Extract test errors
                    if (testResult.assertionResults && Array.isArray(testResult.assertionResults)) {
                        for (const assertion of testResult.assertionResults) {
                            if (assertion.status === 'failed') {
                                errors.push({
                                    test_name: assertion.fullName || assertion.title || 'Unknown test',
                                    error_message: assertion.failureMessages ? assertion.failureMessages.join('\n') : 'Unknown error',
                                    stack_trace: assertion.failureMessages ? assertion.failureMessages.join('\n') : undefined
                                });
                            }
                        }
                    }

                    const passed = testResult.numPassingTests || 0;
                    const failed = testResult.numFailingTests || 0;
                    const errorCount = testResult.numPendingTests || 0;

                    results.push({
                        test_file: path.basename(testFile),
                        status: failed > 0 || errorCount > 0 ? (errorCount > 0 ? 'error' : 'fail') : 'pass',
                        passed,
                        failed,
                        errors: errorCount,
                        duration: testResult.perfStats?.runtime || testResult.duration || 0,
                        error_details: errors.length > 0 ? errors : undefined
                    });
                }
            }

            // If no results parsed but Jest reported failures in summary
            if (results.length === 0 && jestResults.numFailedTests > 0) {
                results.push({
                    test_file: 'unknown',
                    status: 'fail',
                    passed: jestResults.numPassedTests || 0,
                    failed: jestResults.numFailedTests || 0,
                    errors: 0,
                    duration: 0
                });
            }

        } catch (error: any) {
            console.error('[TestExecutionService] Error parsing Jest JSON output:', error);
            console.log('[TestExecutionService] stdout:', stdout.substring(0, 500));
            console.log('[TestExecutionService] stderr:', stderr.substring(0, 500));
            
            // Try to extract errors from stderr
            const errors = this.captureErrors(stderr);
            if (errors.length > 0) {
                results.push({
                    test_file: 'unknown',
                    status: 'error',
                    passed: 0,
                    failed: 0,
                    errors: errors.length,
                    duration: 0,
                    error_details: errors
                });
            }
        }

        return results;
    }

    /**
     * Capture error messages from stderr
     */
    static captureErrors(stderr: string): TestErrorDetail[] {
        const errors: TestErrorDetail[] = [];
        
        if (!stderr || stderr.trim().length === 0) {
            return errors;
        }

        // Split by common error patterns
        const errorPatterns = [
            /Error: (.+?)(?:\n|$)/g,
            /FAIL (.+?)(?:\n|$)/g,
            /● (.+?)(?:\n|$)/g,
            /SyntaxError: (.+?)(?:\n|$)/g,
            /TypeError: (.+?)(?:\n|$)/g
        ];

        for (const pattern of errorPatterns) {
            const matches = stderr.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    errors.push({
                        test_name: 'Parsing Error',
                        error_message: match[1].trim(),
                        stack_trace: stderr
                    });
                }
            }
        }

        // If no specific errors found, add generic error
        if (errors.length === 0 && stderr.length > 0) {
            errors.push({
                test_name: 'Test Execution',
                error_message: 'Test execution failed',
                stack_trace: stderr
            });
        }

        return errors;
    }

    /**
     * Run a quick syntax validation without executing tests
     */
    static async validateSyntax(workspaceRoot: string, testFilePath: string): Promise<{ valid: boolean; error?: string }> {
        return new Promise((resolve) => {
            // Use TypeScript compiler to check syntax
            const command = `npx tsc --noEmit ${testFilePath}`;
            
            const options = {
                cwd: workspaceRoot,
                timeout: 30000 // 30 second timeout
            };

            child_process.exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        valid: false,
                        error: stderr || stdout || error.message
                    });
                } else {
                    resolve({ valid: true });
                }
            });
        });
    }
}
