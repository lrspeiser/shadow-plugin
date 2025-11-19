import { activate } from '../extension';
import * as vscode from 'vscode';
jest.mock('vscode');
jest.mock('../analyzer');
jest.mock('../llmIntegration');
jest.mock('../insightsTreeView');

// Test: test_activate_extension_success
// Verifies extension activates successfully and initializes all services
describe('Extension - activate', () => {
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    mockContext = {
      subscriptions: [],
      extensionPath: '/mock/extension/path',
      globalState: {
        get: jest.fn(),
        update: jest.fn()
      },
      workspaceState: {
        get: jest.fn(),
        update: jest.fn()
      }
    } as any;

    jest.clearAllMocks();
  });

  test('should activate extension successfully', async () => {
    await activate(mockContext);

    expect(mockContext.subscriptions.length).toBeGreaterThan(0);
  });

  test('should register all commands', async () => {
    const mockRegisterCommand = jest.fn();
    (vscode.commands.registerCommand as jest.Mock) = mockRegisterCommand;

    await activate(mockContext);

    expect(mockRegisterCommand).toHaveBeenCalledWith(
      'shadowWatch.analyzeWorkspace',
      expect.any(Function)
    );
    expect(mockRegisterCommand).toHaveBeenCalledWith(
      'shadowWatch.analyzeCurrentFile',
      expect.any(Function)
    );
  });

  test('should handle activation errors gracefully', async () => {
    const mockError = new Error('Initialization failed');
    jest.spyOn(console, 'error').mockImplementation();

    (vscode.workspace.getConfiguration as jest.Mock).mockImplementation(() => {
      throw mockError;
    });

    await expect(activate(mockContext)).rejects.toThrow('Initialization failed');
  });
});
