/**
 * LLM-based test validation service
 * Phase 4: Run tests, capture failures, and auto-fix with LLM
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestExecutionService } from './testExecutionService';
import { TestExecutionResult, TestReport, TestReportSummary } from './types/testResultTypes';
import { buildFixPrompt } from '../../prompts/testPrompts';
import { SWLogger } from '../../../logger';

export class LLMTestValidationService {
    /**
     * Run all tests and capture results
     */
    static async runTests(
        workspaceRoot: string,
        testFile?: string
    ): Promise<TestExecutionResult[]> {
        SWLogger.log(`[TestValidation] Running tests${testFile ? ` for ${testFile}` : ''}...`);
        
        const results = await TestExecutionService.runJest(workspaceRoot, testFile);
        
        const totalTests = results.reduce((sum, r) => sum + r.passed + r.failed + r.errors, 0);
        const passed = results.reduce((sum, r) => sum + r.passed, 0);
        const failed = results.reduce((sum, r) => sum + r.failed, 0);

        SWLogger.log(`[TestValidation] Results: ${passed} passed, ${failed} failed out of ${totalTests} tests`);

        return results;
    }

    /**
     * Fix failing test using LLM
     */
    static async fixFailingTest(
        testFilePath: string,
        executionResult: TestExecutionResult,
        workspaceRoot: string,
        llmService: any,
        maxAttempts: number = 3
    ): Promise<{ success: boolean; attempts: number; finalError?: string }> {
        SWLogger.log(`[TestValidation] Attempting to fix failing test: ${testFilePath}`);

        let attempts = 0;
        let lastError = '';

        while (attempts < maxAttempts) {
            attempts++;
            SWLogger.log(`[TestValidation] Fix attempt ${attempts}/${maxAttempts}`);

            try {
                // Read current test code
                const fullPath = path.join(workspaceRoot, testFilePath);
                const testCode = fs.readFileSync(fullPath, 'utf-8');

                // Get error message
                const errorMessage = executionResult.error_details?.map(e => 
                    `${e.test_name}: ${e.error_message}`
                ).join('\n\n') || 'Unknown error';

                // Try to read source code
                let sourceCode = '// Source code not available';
                try {
                    const sourceFile = testFilePath.replace('UnitTests/', 'src/').replace('.test.ts', '.ts');
                    const sourcePath = path.join(workspaceRoot, sourceFile);
                    if (fs.existsSync(sourcePath)) {
                        sourceCode = fs.readFileSync(sourcePath, 'utf-8');
                    }
                } catch (e) {
                    // Ignore
                }

                // Build fix prompt
                const prompt = buildFixPrompt(testCode, errorMessage, sourceCode);

                // Call LLM to fix the test
                const fixResult = await llmService.fixFailingTest(prompt);

                if (fixResult.status === 'pass' && fixResult.fixed_code) {
                    // Write fixed code
                    fs.writeFileSync(fullPath, fixResult.fixed_code, 'utf-8');
                    SWLogger.log(`[TestValidation] Applied fix: ${fixResult.explanation}`);

                    // Re-run the test to verify fix
                    const verifyResults = await TestExecutionService.runJest(workspaceRoot, testFilePath);
                    
                    if (verifyResults.length > 0 && verifyResults[0].status === 'pass') {
                        SWLogger.log(`[TestValidation] Fix successful after ${attempts} attempt(s)`);
                        return { success: true, attempts };
                    } else {
                        lastError = verifyResults[0]?.error_details?.[0]?.error_message || 'Test still failing';
                        SWLogger.log(`[TestValidation] Fix applied but test still failing: ${lastError}`);
                        // Update executionResult for next iteration
                        if (verifyResults.length > 0) {
                            executionResult = verifyResults[0];
                        }
                    }
                } else {
                    lastError = fixResult.explanation;
                    SWLogger.log(`[TestValidation] LLM could not fix test: ${fixResult.explanation}`);
                    break; // No point retrying if LLM says it can't fix
                }

            } catch (error: any) {
                lastError = error.message;
                SWLogger.log(`[TestValidation] Error during fix attempt: ${error.message}`);
            }
        }

        SWLogger.log(`[TestValidation] Failed to fix test after ${attempts} attempt(s)`);
        return { success: false, attempts, finalError: lastError };
    }

    /**
     * Generate comprehensive test report
     */
    static async generateTestReport(
        workspaceRoot: string,
        testResults: TestExecutionResult[]
    ): Promise<TestReport> {
        SWLogger.log('[TestValidation] Generating test report...');

        const totalTests = testResults.reduce((sum, r) => sum + r.passed + r.failed + r.errors, 0);
        const totalPassed = testResults.reduce((sum, r) => sum + r.passed, 0);
        const totalFailed = testResults.reduce((sum, r) => sum + r.failed, 0);
        const totalErrors = testResults.reduce((sum, r) => sum + r.errors, 0);
        const filesGenerated = testResults.length;
        const filesPassing = testResults.filter(r => r.status === 'pass').length;

        const summary: TestReportSummary = {
            total_tests: totalTests,
            passed: totalPassed,
            failed: totalFailed,
            errors: totalErrors,
            pass_rate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0,
            files_generated: filesGenerated,
            files_passing: filesPassing
        };

        // Generate recommendations
        const recommendations: string[] = [];

        if (summary.pass_rate < 70) {
            recommendations.push('Pass rate is below 70%. Consider reviewing test logic and mocking strategy.');
        }

        if (totalErrors > 0) {
            recommendations.push(`${totalErrors} tests have errors. Review test setup and configuration.`);
        }

        const failingTests = testResults.filter(r => r.status !== 'pass');
        if (failingTests.length > 0) {
            recommendations.push(`${failingTests.length} test files have failures. Review error messages in the detailed results.`);
        }

        if (summary.pass_rate >= 90) {
            recommendations.push('Excellent test coverage! Consider adding edge case tests.');
        }

        const report: TestReport = {
            summary,
            test_results: testResults,
            generated_at: new Date().toISOString(),
            recommendations
        };

        // Save report to disk
        const reportPath = path.join(workspaceRoot, '.shadow', 'test-report.json');
        const shadowDir = path.join(workspaceRoot, '.shadow');
        if (!fs.existsSync(shadowDir)) {
            fs.mkdirSync(shadowDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
        SWLogger.log(`[TestValidation] Report saved to ${reportPath}`);

        // Also generate markdown report
        await this.generateMarkdownReport(report, workspaceRoot);

        return report;
    }

    /**
     * Generate markdown test report
     */
    private static async generateMarkdownReport(
        report: TestReport,
        workspaceRoot: string
    ): Promise<void> {
        let markdown = `# Test Execution Report\n\n`;
        markdown += `Generated: ${new Date(report.generated_at).toLocaleString()}\n\n`;

        markdown += `## Summary\n\n`;
        markdown += `- **Total Tests**: ${report.summary.total_tests}\n`;
        markdown += `- **Passed**: ${report.summary.passed} ✅\n`;
        markdown += `- **Failed**: ${report.summary.failed} ❌\n`;
        markdown += `- **Errors**: ${report.summary.errors} ⚠️\n`;
        markdown += `- **Pass Rate**: ${report.summary.pass_rate}%\n`;
        markdown += `- **Test Files Generated**: ${report.summary.files_generated}\n`;
        markdown += `- **Test Files Passing**: ${report.summary.files_passing}\n\n`;

        markdown += `## Test Results\n\n`;
        for (const result of report.test_results) {
            const statusIcon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
            markdown += `### ${statusIcon} ${result.test_file}\n\n`;
            markdown += `- Status: ${result.status}\n`;
            markdown += `- Passed: ${result.passed}\n`;
            markdown += `- Failed: ${result.failed}\n`;
            markdown += `- Errors: ${result.errors}\n`;
            markdown += `- Duration: ${result.duration}ms\n\n`;

            if (result.error_details && result.error_details.length > 0) {
                markdown += `#### Errors:\n\n`;
                for (const error of result.error_details) {
                    markdown += `- **${error.test_name}**: ${error.error_message}\n`;
                }
                markdown += `\n`;
            }
        }

        markdown += `## Recommendations\n\n`;
        for (const rec of report.recommendations) {
            markdown += `- ${rec}\n`;
        }

        const markdownPath = path.join(workspaceRoot, '.shadow', 'test-report.md');
        fs.writeFileSync(markdownPath, markdown, 'utf-8');
        SWLogger.log(`[TestValidation] Markdown report saved to ${markdownPath}`);
    }
}
