import * as vscode from 'vscode';
import { EventEmitter } from 'vscode';

// Mocks
jest.mock('vscode');
jest.mock('../src/extension', () => {
  const actual = jest.requireActual('../src/extension');
  return {
    ...actual,
    getConfigurationManager: jest.fn(),
    switchProvider: jest.fn(),
    copyMenuStructure: jest.fn(),
    getSettingsHtml: jest.fn(),
    treeProvider: { refresh: jest.fn() }
  };
});

import * as extension from '../src/extension';

describe('showSettings', () => {
  let mockPanel: any;
  let mockWebview: any;
  let mockOnDidReceiveMessage: jest.Mock;
  let messageHandler: (message: any) => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOnDidReceiveMessage = jest.fn();
    mockWebview = {
      html: '',
      onDidReceiveMessage: mockOnDidReceiveMessage
    };

    mockPanel = {
      webview: mockWebview
    };

    (vscode.window as any).createWebviewPanel = jest.fn().mockReturnValue(mockPanel);

    (extension as any).getConfigurationManager = jest.fn().mockReturnValue({
      llmProvider: 'openai'
    });

    (extension as any).switchProvider = jest.fn().mockResolvedValue(undefined);
    (extension as any).copyMenuStructure = jest.fn().mockResolvedValue(undefined);
    (extension as any).getSettingsHtml = jest.fn().mockReturnValue('<html>Settings</html>');
    (extension as any).treeProvider = { refresh: jest.fn() };

    mockOnDidReceiveMessage.mockImplementation((handler: any) => {
      messageHandler = handler;
      return { dispose: jest.fn() };
    });
  });

  test('should create webview panel with correct configuration', async () => {
    const showSettings = (extension as any).showSettings;
    if (!showSettings) {
      throw new Error('showSettings function not found');
    }

    await showSettings();

    expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
      'shadowWatchSettings',
      '⚙️ Shadow Watch Settings',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
  });

  test('should set initial HTML with current provider', async () => {
    const showSettings = (extension as any).showSettings;
    if (!showSettings) {
      throw new Error('showSettings function not found');
    }

    await showSettings();

    expect((extension as any).getSettingsHtml).toHaveBeenCalledWith('openai');
    expect(mockPanel.webview.html).toBe('<html>Settings</html>');
  });

  test('should handle switchProvider command', async () => {
    const showSettings = (extension as any).showSettings;
    if (!showSettings) {
      throw new Error('showSettings function not found');
    }

    (extension as any).getConfigurationManager
      .mockReturnValueOnce({ llmProvider: 'openai' })
      .mockReturnValueOnce({ llmProvider: 'claude' });

    await showSettings();

    await messageHandler({ command: 'switchProvider' });

    expect((extension as any).switchProvider).toHaveBeenCalled();
    expect((extension as any).getConfigurationManager).toHaveBeenCalledTimes(2);
    expect((extension as any).getSettingsHtml).toHaveBeenCalledWith('claude');
    expect((extension as any).treeProvider.refresh).toHaveBeenCalled();
  });

  test('should handle copyMenuStructure command', async () => {
    const showSettings = (extension as any).showSettings;
    if (!showSettings) {
      throw new Error('showSettings function not found');
    }

    await showSettings();

    await messageHandler({ command: 'copyMenuStructure' });

    expect((extension as any).copyMenuStructure).toHaveBeenCalled();
  });

  test('should handle openVSCodeSettings command', async () => {
    const showSettings = (extension as any).showSettings;
    if (!showSettings) {
      throw new Error('showSettings function not found');
    }

    (vscode.commands.executeCommand as jest.Mock) = jest.fn().mockResolvedValue(undefined);

    await showSettings();

    await messageHandler({ command: 'openVSCodeSettings' });

    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
      'workbench.action.openSettings',
      '@ext:shadow-watch.shadow-watch'
    );
  });

  test('should handle claude as current provider', async () => {
    const showSettings = (extension as any).showSettings;
    if (!showSettings) {
      throw new Error('showSettings function not found');
    }

    (extension as any).getConfigurationManager = jest.fn().mockReturnValue({
      llmProvider: 'claude'
    });

    await showSettings();

    expect((extension as any).getSettingsHtml).toHaveBeenCalledWith('claude');
  });

  test('should not throw error when treeProvider is null', async () => {
    const showSettings = (extension as any).showSettings;
    if (!showSettings) {
      throw new Error('showSettings function not found');
    }

    (extension as any).treeProvider = null;

    await showSettings();

    await expect(messageHandler({ command: 'switchProvider' })).resolves.not.toThrow();
  });

  test('should handle unknown command gracefully', async () => {
    const showSettings = (extension as any).showSettings;
    if (!showSettings) {
      throw new Error('showSettings function not found');
    }

    await showSettings();

    await expect(messageHandler({ command: 'unknownCommand' })).resolves.not.toThrow();
  });

  test('should register message handler', async () => {
    const showSettings = (extension as any).showSettings;
    if (!showSettings) {
      throw new Error('showSettings function not found');
    }

    await showSettings();

    expect(mockOnDidReceiveMessage).toHaveBeenCalledWith(expect.any(Function));
  });

  test('should handle switchProvider error gracefully', async () => {
    const showSettings = (extension as any).showSettings;
    if (!showSettings) {
      throw new Error('showSettings function not found');
    }

    (extension as any).switchProvider = jest.fn().mockRejectedValue(new Error('Switch failed'));

    await showSettings();

    await expect(messageHandler({ command: 'switchProvider' })).rejects.toThrow('Switch failed');
  });
});