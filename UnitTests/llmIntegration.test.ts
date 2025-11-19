import { setApiKey } from '../llmIntegration';
import * as vscode from 'vscode';
import { ConfigurationManager } from '../config/configurationManager';
import { generateUnitTests } from '../llmIntegration';
import { LLMService } from '../llmService';
import * as fs from 'fs';
import { clearAllData } from '../llmIntegration';

// Test: test_setApiKey_stores_openai_key
// Verifies OpenAI API key storage and validation
import { setApiKey } from '../llmIntegration';
import * as vscode from 'vscode';
import { ConfigurationManager } from '../config/configurationManager';

jest.mock('vscode');
jest.mock('../config/configurationManager');

describe('llmIntegration.setApiKey', () => {
  let mockSecrets: any;
  let mockConfig: jest.Mocked;

  beforeEach(() => {
    mockSecrets = {
      store: jest.fn().mockResolvedValue(undefined)
    };
    
    (vscode.window.showInputBox as jest.Mock) = jest.fn().mockResolvedValue('sk-test-key-123');
    
    mockConfig = {
      setOpenAIApiKey: jest.fn()
    } as any;
  });

  test('stores valid API key securely', async () => {
    await setApiKey();
    
    expect(vscode.window.showInputBox).toHaveBeenCalled();
    expect(mockSecrets.store).toHaveBeenCalledWith('openai-api-key', 'sk-test-key-123');
  });

  test('validates API key format', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('invalid-key');
    
    await setApiKey();
    
    expect(vscode.window.showErrorMessage).toHaveBeenCalled();
  });

  test('handles user cancellation', async () => {
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue(undefined);
    
    await setApiKey();
    
    expect(mockSecrets.store).not.toHaveBeenCalled();
  });
});

// Test: test_generateUnitTests_creates_test_plan
// Verifies unit test plan generation from codebase analysis
import { generateUnitTests } from '../llmIntegration';
import { LLMService } from '../llmService';
import * as fs from 'fs';

jest.mock('../llmService');
jest.mock('fs');

describe('llmIntegration.generateUnitTests', () => {
  let mockLLMService: jest.Mocked;

  beforeEach(() => {
    mockLLMService = {
      generateCompletion: jest.fn().mockResolvedValue(JSON.stringify({
        unit_test_strategy: {
          overall_approach: 'Jest-based testing',
          testing_frameworks: ['jest'],
          mocking_strategy: 'Use jest.mock()',
          isolation_level: 'Full isolation'
        },
        test_suites: [{
          id: 'suite-1',
          name: 'Test Suite',
          description: 'Tests functionality',
          test_file_path: 'src/test/example.test.ts',
          source_files: ['src/example.ts'],
          test_cases: [{
            id: 'test-1',
            name: 'test_example',
            description: 'Tests example function',
            target_function: 'example',
            target_file: 'src/example.ts',
            priority: 'high',
            test_code: 'test("example", () => { expect(true).toBe(true); });',
            run_instructions: 'npm test'
          }]
        }],
        rationale: 'Comprehensive coverage'
      }))
    } as any;
  });

  test('generates complete test plan', async () => {
    const analysisResult = {
      files: ['src/example.ts'],
      statistics: { totalFiles: 1 }
    };
    
    const testPlan = await generateUnitTests(analysisResult);
    
    expect(testPlan).toHaveProperty('unit_test_strategy');
    expect(testPlan).toHaveProperty('test_suites');
    expect(testPlan.test_suites.length).toBeGreaterThan(0);
  });

  test('validates test plan schema', async () => {
    mockLLMService.generateCompletion.mockResolvedValue(JSON.stringify({ invalid: 'schema' }));
    
    const analysisResult = { files: ['src/example.ts'], statistics: { totalFiles: 1 } };
    
    await expect(generateUnitTests(analysisResult)).rejects.toThrow();
  });

  test('writes test files to file system', async () => {
    const analysisResult = { files: ['src/example.ts'], statistics: { totalFiles: 1 } };
    
    await generateUnitTests(analysisResult);
    
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});

// Test: test_clearAllData_removes_cached_results
// Verifies clearing all cached analysis results and stored data
import { clearAllData } from '../llmIntegration';
import * as vscode from 'vscode';
import * as fs from 'fs';

jest.mock('vscode');
jest.mock('fs');

describe('llmIntegration.clearAllData', () => {
  beforeEach(() => {
    (vscode.window.showWarningMessage as jest.Mock) = jest.fn().mockResolvedValue('Yes');
    (fs.existsSync as jest.Mock) = jest.fn().mockReturnValue(true);
    (fs.rmSync as jest.Mock) = jest.fn();
  });

  test('prompts user for confirmation', async () => {
    await clearAllData();
    
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('clear all data'),
      expect.any(String),
      expect.any(String)
    );
  });

  test('deletes cache files on confirmation', async () => {
    await clearAllData();
    
    expect(fs.rmSync).toHaveBeenCalled();
  });

  test('does not delete files if user cancels', async () => {
    (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('No');
    
    await clearAllData();
    
    expect(fs.rmSync).not.toHaveBeenCalled();
  });

  test('shows success message after clearing', async () => {
    await clearAllData();
    
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('cleared')
    );
  });
});
