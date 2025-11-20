/**
 * Test script to verify the new 4-phase test generation system
 * This simulates what happens when the user clicks "Generate Unit Tests"
 */

const fs = require('fs');
const path = require('path');

const workspaceRoot = __dirname;

console.log('=== Testing New 4-Phase Test Generation System ===\n');

// Phase 1: Test Setup - Verify environment detection
console.log('Phase 1: Testing Environment Detection...');
const hasJestConfig = fs.existsSync(path.join(workspaceRoot, 'jest.config.js'));
const hasPackageJson = fs.existsSync(path.join(workspaceRoot, 'package.json'));
const hasTsConfig = fs.existsSync(path.join(workspaceRoot, 'tsconfig.json'));
const hasUnitTests = fs.existsSync(path.join(workspaceRoot, 'UnitTests'));

console.log(`  ✓ Has jest.config.js: ${hasJestConfig}`);
console.log(`  ✓ Has package.json: ${hasPackageJson}`);
console.log(`  ✓ Has tsconfig.json: ${hasTsConfig}`);
console.log(`  ✓ Has UnitTests dir: ${hasUnitTests}`);

if (hasJestConfig) {
    console.log('  → Test environment already configured, will skip setup\n');
} else {
    console.log('  → Would generate setup plan with LLM\n');
}

// Phase 2: Test Planning - Load analysis data
console.log('Phase 2: Testing Analysis Data Loading...');
const codeAnalysisPath = path.join(workspaceRoot, '.shadow/docs/code-analysis.json');
const architectureInsightsPath = path.join(workspaceRoot, '.shadow/docs/architecture-insights-2025-11-19T21-30-30-706Z');

if (fs.existsSync(codeAnalysisPath)) {
    const codeAnalysis = JSON.parse(fs.readFileSync(codeAnalysisPath, 'utf-8'));
    console.log(`  ✓ Code analysis loaded: ${codeAnalysis.totalFunctions} functions found`);
    console.log(`  ✓ Total files: ${codeAnalysis.totalFiles}`);
    console.log(`  ✓ Total lines: ${codeAnalysis.totalLines}`);
    
    // Extract sample functions
    const functions = [];
    if (codeAnalysis.functions && codeAnalysis.functions.length > 0) {
        const sampleFunctions = codeAnalysis.functions.slice(0, 10);
        console.log(`\n  Sample functions that would be analyzed:`);
        sampleFunctions.forEach((func, i) => {
            console.log(`    ${i + 1}. ${func.name} in ${func.file} (${func.lines} lines)`);
        });
        console.log(`  → Would create test plan for top 30 prioritized functions\n`);
    } else {
        console.log('  ⚠ No functions array found in code analysis\n');
    }
} else {
    console.log(`  ✗ Code analysis not found at ${codeAnalysisPath}`);
    console.log('  → Would need to run "Analyze Workspace" first\n');
}

// Check for architecture insights
if (fs.existsSync(architectureInsightsPath)) {
    const insightsFiles = fs.readdirSync(architectureInsightsPath);
    console.log(`  ✓ Architecture insights available (${insightsFiles.length} files)`);
    console.log('  → These would inform test prioritization\n');
}

// Phase 3: Test Generation - Simulate batch processing
console.log('Phase 3: Simulating Test Generation...');
console.log('  → Would generate tests in batches of 5 functions');
console.log('  → Each test would be validated for syntax immediately');
console.log('  → If syntax errors found, LLM would auto-fix');
console.log('  → Tests written to UnitTests/ directory\n');

// Phase 4: Test Validation - Check if Jest is runnable
console.log('Phase 4: Testing Jest Availability...');
const { execSync } = require('child_process');
try {
    const jestVersion = execSync('npm test -- --version 2>&1', { 
        cwd: workspaceRoot,
        encoding: 'utf-8',
        timeout: 5000
    }).trim();
    console.log(`  ✓ Jest is available: ${jestVersion.split('\n')[0]}`);
    console.log('  → Would run all generated tests');
    console.log('  → Would auto-fix failing tests (up to 3 attempts each)');
    console.log('  → Would generate test report\n');
} catch (error) {
    console.log('  ⚠ Jest not available or error running test command');
    console.log(`  Error: ${error.message}\n`);
}

// Check service files exist
console.log('Verifying New Service Files...');
const serviceFiles = [
    'src/domain/services/testing/llmTestSetupService.ts',
    'src/domain/services/testing/llmTestPlanningService.ts',
    'src/domain/services/testing/llmTestGenerationService.ts',
    'src/domain/services/testing/llmTestValidationService.ts',
    'src/domain/services/testing/testExecutionService.ts',
    'src/domain/prompts/testPrompts.ts'
];

let allServicesExist = true;
serviceFiles.forEach(file => {
    const exists = fs.existsSync(path.join(workspaceRoot, file));
    const status = exists ? '✓' : '✗';
    console.log(`  ${status} ${file}`);
    if (!exists) allServicesExist = false;
});

if (allServicesExist) {
    console.log('\n✅ All new services are in place!\n');
} else {
    console.log('\n⚠ Some services are missing\n');
}

// Summary
console.log('=== Test Summary ===');
console.log('The new 4-phase system is ready to test in VSCode!');
console.log('\nTo test manually:');
console.log('1. Open this project in VSCode');
console.log('2. Press F5 to launch Extension Development Host');
console.log('3. In the new VSCode window, open Command Palette (Cmd+Shift+P)');
console.log('4. Run: "Shadow Watch: Generate Unit Tests"');
console.log('5. Watch the progress through all 4 phases');
console.log('6. Check UnitTests/ directory for generated test files');
console.log('7. Review .shadow/test-report.md for results\n');

console.log('Expected behavior:');
console.log('- Phase 1: Detects TypeScript + Jest setup (already configured)');
console.log('- Phase 2: Creates test plan from 1106 functions (limited to top 30)');
console.log('- Phase 3: Generates tests in batches of 5, validates syntax');
console.log('- Phase 4: Runs tests, auto-fixes failures, generates report');
console.log('\nKey improvement: Tests are actually WRITTEN to disk and VALIDATED immediately!');
