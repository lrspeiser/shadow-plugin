import { initializePanels } from '../panelManager';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');
jest.mock('../createTreeView');
jest.mock('../createWebviewPanel');

describe('initializePanels', () => {
  let mockContext: vscode.ExtensionContext;
  let mockCreateTreeView: jest.Mock;
  let mockCreateWebviewPanel: jest.Mock;
  let mockTreeView: any;
  let mockWebviewPanel: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockContext = new vscode.ExtensionContext();
    mockContext.subscriptions = [];
    mockContext.extensionPath = '/test/extension/path';
    
    mockTreeView = {
      dispose: jest.fn(),
      reveal: jest.fn(),
      onDidChangeVisibility: jest.fn()
    };
    
    mockWebviewPanel = {
      dispose: jest.fn(),
      webview: {
        html: '',
        postMessage: jest.fn(),
        onDidReceiveMessage: jest.fn()
      },
      onDidDispose: jest.fn(),
      reveal: jest.fn()
    };
    
    mockCreateTreeView = jest.fn().mockReturnValue(mockTreeView);
    mockCreateWebviewPanel = jest.fn().mockReturnValue(mockWebviewPanel);
    
    const createTreeViewModule = require('../createTreeView');
    createTreeViewModule.createTreeView = mockCreateTreeView;
    
    const createWebviewPanelModule = require('../createWebviewPanel');
    createWebviewPanelModule.createWebviewPanel = mockCreateWebviewPanel;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should initialize panels successfully with valid context', () => {
    const result = initializePanels(mockContext);
    
    expect(result).toBeDefined();
    expect(mockCreateTreeView).toHaveBeenCalled();
    expect(mockCreateWebviewPanel).toHaveBeenCalled();
    expect(mockContext.subscriptions.length).toBeGreaterThan(0);
  });

  test('should create tree view with correct parameters', () => {
    initializePanels(mockContext);
    
    expect(mockCreateTreeView).toHaveBeenCalledWith(
      expect.objectContaining({
        context: mockContext
      })
    );
  });

  test('should create webview panel with correct parameters', () => {
    initializePanels(mockContext);
    
    expect(mockCreateWebviewPanel).toHaveBeenCalledWith(
      expect.objectContaining({
        context: mockContext,
        extensionPath: mockContext.extensionPath
      })
    );
  });

  test('should register disposables in context subscriptions', () => {
    const initialLength = mockContext.subscriptions.length;
    
    initializePanels(mockContext);
    
    expect(mockContext.subscriptions.length).toBeGreaterThan(initialLength);
    expect(mockContext.subscriptions).toContain(mockTreeView);
    expect(mockContext.subscriptions).toContain(mockWebviewPanel);
  });

  test('should handle tree view creation failure gracefully', () => {
    mockCreateTreeView.mockImplementation(() => {
      throw new Error('Tree view creation failed');
    });
    
    expect(() => initializePanels(mockContext)).toThrow('Tree view creation failed');
  });

  test('should handle webview panel creation failure gracefully', () => {
    mockCreateWebviewPanel.mockImplementation(() => {
      throw new Error('Webview panel creation failed');
    });
    
    expect(() => initializePanels(mockContext)).toThrow('Webview panel creation failed');
  });

  test('should handle null context gracefully', () => {
    expect(() => initializePanels(null as any)).toThrow();
  });

  test('should handle undefined context gracefully', () => {
    expect(() => initializePanels(undefined as any)).toThrow();
  });

  test('should handle context without subscriptions array', () => {
    const invalidContext = { ...mockContext, subscriptions: undefined };
    
    expect(() => initializePanels(invalidContext as any)).toThrow();
  });

  test('should return panel references for further use', () => {
    const result = initializePanels(mockContext);
    
    expect(result).toHaveProperty('treeView');
    expect(result).toHaveProperty('webviewPanel');
    expect(result.treeView).toBe(mockTreeView);
    expect(result.webviewPanel).toBe(mockWebviewPanel);
  });

  test('should setup proper event handlers for panels', () => {
    initializePanels(mockContext);
    
    expect(mockTreeView.onDidChangeVisibility).toHaveBeenCalled();
    expect(mockWebviewPanel.onDidDispose).toHaveBeenCalled();
  });

  test('should dispose panels when context is disposed', () => {
    initializePanels(mockContext);
    
    mockContext.subscriptions.forEach(disposable => {
      if (disposable && typeof disposable.dispose === 'function') {
        disposable.dispose();
      }
    });
    
    expect(mockTreeView.dispose).toHaveBeenCalled();
    expect(mockWebviewPanel.dispose).toHaveBeenCalled();
  });

  test('should handle multiple initialization calls', () => {
    const result1 = initializePanels(mockContext);
    const result2 = initializePanels(mockContext);
    
    expect(mockCreateTreeView).toHaveBeenCalledTimes(2);
    expect(mockCreateWebviewPanel).toHaveBeenCalledTimes(2);
    expect(result1).not.toBe(result2);
  });

  test('should pass extension path correctly to webview', () => {
    const customPath = '/custom/extension/path';
    mockContext.extensionPath = customPath;
    
    initializePanels(mockContext);
    
    expect(mockCreateWebviewPanel).toHaveBeenCalledWith(
      expect.objectContaining({
        extensionPath: customPath
      })
    );
  });
});