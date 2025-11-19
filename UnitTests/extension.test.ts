import { activate, deactivate } from '../extension';
import * as vscode from 'vscode';
import { analyzeWorkspace } from '../extension';
import { Analyzer } from '../analyzer';

// Test: test_activate_registers_all_commands
// Verifies extension activation registers all required commands
import { activate, deactivate } from '../extension';
import * as vscode from 'vscode';

jest.mock('vscode');
jest.mock('../analyzer');
jest.mock('../llmService');
jest.mock('../insightsTreeView');

describe('extension.activate', () => {
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    mockContext = {
      subscriptions: [],
      extensionPath: '/test/path',
      globalState: {
        get: jest.fn(),
        update: jest.fn()
      },
      workspaceState: {
        get: jest.fn(),
        update: jest.fn()
      }
    } as any;
    
    (vscode.commands.registerCommand as jest.Mock) = jest.fn((cmd, handler) => ({
      dispose: jest.fn()
    }));
    (vscode.window.registerTreeDataProvider as jest.Mock) = jest.fn();
  });

  test('registers all required commands', async () => {
    await activate(mockContext);
    
    const expectedCommands = [
      'shadowWatch.analyzeWorkspace',
      'shadowWatch.analyzeCurrentFile',
      'shadowWatch.generateLLMInsights',
      'shadowWatch.copyAllInsights',
      'shadowWatch.clearCache'
    ];
    
    expectedCommands.forEach(cmd => {
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        cmd,
        expect.any(Function)
      );
    });
  });

  test('initializes tree view providers', async () => {
    await activate(mockContext);
    
    expect(vscode.window.registerTreeDataProvider).toHaveBeenCalled();
  });

  test('adds disposables to subscriptions', async () => {
    await activate(mockContext);
    
    expect(mockContext.subscriptions.length).toBeGreaterThan(0);
  });
});

// Test: test_analyzeWorkspace_scans_entire_codebase
// Verifies workspace analysis scans all supported files and generates report
import { analyzeWorkspace } from '../extension';
import { Analyzer } from '../analyzer';
import * as vscode from 'vscode';

jest.mock('vscode');
jest.mock('../analyzer');

describe('extension.analyzeWorkspace', () => {
  let mockAnalyzer: jest.Mocked;

  beforeEach(() => {
    mockAnalyzer = {
      analyzeWorkspace: jest.fn().mockResolvedValue({
        files: ['src/file1.ts', 'src/file2.ts'],
        issues: [],
        healthScore: 100,
        statistics: { totalFiles: 2, totalLines: 500 }
      })
    } as any;
    
    (vscode.window.withProgress as jest.Mock) = jest.fn((options, task) => {
      return task({ report: jest.fn() });
    });
  });

  test('analyzes entire workspace', async () => {
    await analyzeWorkspace();
    
    expect(mockAnalyzer.analyzeWorkspace).toHaveBeenCalled();
  });

  test('shows progress indicator', async () => {
    await analyzeWorkspace();
    
    expect(vscode.window.withProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        location: vscode.ProgressLocation.Notification
      }),
      expect.any(Function)
    );
  });

  test('shows completion message', async () => {
    await analyzeWorkspace();
    
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('Analysis complete')
    );
  });
});
