import * as vscode from 'vscode';
import { activate } from '../extension';
import { analyzeWorkspace } from '../extension';
import { Analyzer } from '../analyzer';

// Test: test_activate_initializes_extension
// Verifies activate function properly initializes extension and registers commands
import * as vscode from 'vscode';
import { activate } from '../extension';

jest.mock('vscode');

describe('Extension.activate', () => {
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it('should initialize extension successfully', async () => {
    await activate(mockContext);

    expect(mockContext.subscriptions.length).toBeGreaterThan(0);
  });

  it('should register all commands', async () => {
    const registerCommand = jest.fn();
    (vscode.commands.registerCommand as jest.Mock) = registerCommand;

    await activate(mockContext);

    expect(registerCommand).toHaveBeenCalledWith('shadowWatch.analyzeWorkspace', expect.any(Function));
    expect(registerCommand).toHaveBeenCalledWith('shadowWatch.analyzeCurrentFile', expect.any(Function));
    expect(registerCommand).toHaveBeenCalledWith('shadowWatch.generateProductDocs', expect.any(Function));
  });

  it('should initialize analyzers', async () => {
    await activate(mockContext);

    expect(mockContext.subscriptions).toContainEqual(expect.any(Object));
  });

  it('should handle activation errors', async () => {
    const error = new Error('Activation failed');
    (vscode.window.showErrorMessage as jest.Mock).mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(activate(mockContext)).resolves.not.toThrow();
  });
});

// Test: test_analyzeWorkspace_command_executes
// Verifies analyzeWorkspace command properly triggers workspace analysis
import * as vscode from 'vscode';
import { analyzeWorkspace } from '../extension';
import { Analyzer } from '../analyzer';

jest.mock('vscode');
jest.mock('../analyzer');

describe('Extension.analyzeWorkspace', () => {
  let mockAnalyzer: jest.Mocked;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyzer = {
      analyzeWorkspace: jest.fn().mockResolvedValue({
        healthScore: 85,
        issues: [],
        files: ['test.ts']
      })
    } as any;
    (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/test/workspace' } }];
    (vscode.window.withProgress as jest.Mock).mockImplementation((options, task) => task());
  });

  it('should trigger analysis successfully', async () => {
    await analyzeWorkspace(mockAnalyzer);

    expect(mockAnalyzer.analyzeWorkspace).toHaveBeenCalled();
  });

  it('should handle no workspace open', async () => {
    (vscode.workspace.workspaceFolders as any) = undefined;

    await analyzeWorkspace(mockAnalyzer);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('No workspace')
    );
  });

  it('should display progress', async () => {
    await analyzeWorkspace(mockAnalyzer);

    expect(vscode.window.withProgress).toHaveBeenCalled();
  });

  it('should handle analysis errors', async () => {
    mockAnalyzer.analyzeWorkspace.mockRejectedValue(new Error('Analysis failed'));

    await analyzeWorkspace(mockAnalyzer);

    expect(vscode.window.showErrorMessage).toHaveBeenCalled();
  });
});
