import { activate } from '../extension';
import * as vscode from 'vscode';
import { ExtensionBootstrapper } from '../domain/bootstrap/extensionBootstrapper';
import { CommandRegistry } from '../domain/bootstrap/commandRegistry';
import { NavigationHandler } from '../domain/handlers/navigationHandler';
import { ErrorHandler } from '../domain/handlers/errorHandler';
import { getConfigurationManager } from '../domain/config/configurationManager';

// Mocks
jest.mock('vscode');
jest.mock('../domain/bootstrap/extensionBootstrapper');
jest.mock('../domain/bootstrap/commandRegistry');
jest.mock('../domain/handlers/navigationHandler');
jest.mock('../domain/handlers/errorHandler');
jest.mock('../domain/config/configurationManager');

describe('activate', () => {
  let mockContext: vscode.ExtensionContext;
  let mockComponents: any;
  let mockConfigManager: any;
  let mockLlmIntegration: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock context
    mockContext = new vscode.ExtensionContext();
    mockContext.subscriptions = [];
    
    // Setup mock components
    mockComponents = {
      analyzer: { analyze: jest.fn() },
      insightGenerator: { generate: jest.fn() },
      llmFormatter: { format: jest.fn() },
      fileWatcher: { watch: jest.fn() },
      treeProvider: { refresh: jest.fn() },
      diagnosticsProvider: { provide: jest.fn() },
      cache: { clear: jest.fn() },
      statusBarItem: { show: jest.fn(), hide: jest.fn() }
    };
    
    // Setup mock configuration manager
    mockConfigManager = {
      clearAllData: false,
      onConfigurationChange: jest.fn(),
      update: jest.fn()
    };
    
    // Setup mock llmIntegration
    mockLlmIntegration = {
      refreshReportsOnStartup: jest.fn().mockResolvedValue(undefined)
    };
    
    // Mock global llmIntegration
    (global as any).llmIntegration = mockLlmIntegration;
    
    // Setup ExtensionBootstrapper mocks
    (ExtensionBootstrapper.initialize as jest.Mock) = jest.fn().mockReturnValue(mockComponents);
    (ExtensionBootstrapper.setupFileWatcher as jest.Mock) = jest.fn();
    
    // Setup CommandRegistry mocks
    (CommandRegistry.register as jest.Mock) = jest.fn().mockReturnValue([]);
    
    // Setup NavigationHandler mocks
    (NavigationHandler as jest.Mock) = jest.fn().mockImplementation(() => ({
      navigateToProductItem: jest.fn(),
      navigateToAnalysisItem: jest.fn(),
      copyInsightItem: jest.fn(),
      showProductItemDetails: jest.fn(),
      showInsightItemDetails: jest.fn(),
      showUnitTestItemDetails: jest.fn()
    }));
    
    // Setup getConfigurationManager mock
    (getConfigurationManager as jest.Mock) = jest.fn().mockReturnValue(mockConfigManager);
    
    // Setup ErrorHandler mock
    (ErrorHandler.handleSync as jest.Mock) = jest.fn();
  });

  afterEach(() => {
    delete (global as any).llmIntegration;
  });

  test('should successfully activate extension with all components', () => {
    activate(mockContext);
    
    expect(ExtensionBootstrapper.initialize).toHaveBeenCalledWith(mockContext);
    expect(NavigationHandler).toHaveBeenCalled();
    expect(CommandRegistry.register).toHaveBeenCalledWith(
      mockContext,
      mockComponents,
      expect.any(Object)
    );
    expect(ExtensionBootstrapper.setupFileWatcher).toHaveBeenCalledWith(
      mockComponents.fileWatcher,
      mockContext
    );
  });

  test('should register all command handlers', () => {
    activate(mockContext);
    
    const commandRegistryCall = (CommandRegistry.register as jest.Mock).mock.calls[0];
    const handlers = commandRegistryCall[2];
    
    expect(handlers).toHaveProperty('analyzeWorkspace');
    expect(handlers).toHaveProperty('analyzeCurrentFile');
    expect(handlers).toHaveProperty('copyAllInsights');
    expect(handlers).toHaveProperty('copyFileInsights');
    expect(handlers).toHaveProperty('copyInsight');
    expect(handlers).toHaveProperty('clearCache');
    expect(handlers).toHaveProperty('clearAllData');
    expect(handlers).toHaveProperty('showSettings');
    expect(handlers).toHaveProperty('openLatestReport');
    expect(handlers).toHaveProperty('openLatestUnitTestReport');
    expect(handlers).toHaveProperty('switchProvider');
    expect(handlers).toHaveProperty('copyMenuStructure');
    expect(handlers).toHaveProperty('showProviderStatus');
    expect(handlers).toHaveProperty('navigateToProductItem');
    expect(handlers).toHaveProperty('navigateToAnalysisItem');
    expect(handlers).toHaveProperty('copyInsightItem');
    expect(handlers).toHaveProperty('showProductItemDetails');
    expect(handlers).toHaveProperty('showInsightItemDetails');
    expect(handlers).toHaveProperty('showUnitTestItemDetails');
  });

  test('should add command disposables to context subscriptions', () => {
    const mockDisposables = [{ dispose: jest.fn() }, { dispose: jest.fn() }];
    (CommandRegistry.register as jest.Mock).mockReturnValue(mockDisposables);
    
    activate(mockContext);
    
    expect(mockContext.subscriptions).toContain(mockDisposables[0]);
    expect(mockContext.subscriptions).toContain(mockDisposables[1]);
  });

  test('should refresh reports on startup', async () => {
    activate(mockContext);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockLlmIntegration.refreshReportsOnStartup).toHaveBeenCalled();
  });

  test('should handle reports refresh failure gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockLlmIntegration.refreshReportsOnStartup.mockRejectedValue(new Error('Refresh failed'));
    
    activate(mockContext);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to refresh reports on startup:',
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
  });

  test('should setup configuration change handler', () => {
    activate(mockContext);
    
    expect(getConfigurationManager).toHaveBeenCalled();
    expect(mockConfigManager.onConfigurationChange).toHaveBeenCalledWith(expect.any(Function));
  });

  test('should clear all data when clearAllData setting is true', () => {
    const mockHandlers = {
      clearAllData: jest.fn()
    };
    
    activate(mockContext);
    
    // Get the configuration change callback
    const configChangeCallback = mockConfigManager.onConfigurationChange.mock.calls[0][0];
    
    // Simulate clearAllData setting being true
    mockConfigManager.clearAllData = true;
    configChangeCallback();
    
    expect(mockConfigManager.update).toHaveBeenCalledWith(
      'clearAllData',
      false,
      vscode.ConfigurationTarget.Global
    );
  });

  test('should not clear data when clearAllData setting is false', () => {
    activate(mockContext);
    
    // Get the configuration change callback
    const configChangeCallback = mockConfigManager.onConfigurationChange.mock.calls[0][0];
    
    // Simulate clearAllData setting being false
    mockConfigManager.clearAllData = false;
    configChangeCallback();
    
    expect(mockConfigManager.update).not.toHaveBeenCalled();
  });

  test('should handle initialization error and call ErrorHandler', () => {
    const testError = new Error('Initialization failed');
    (ExtensionBootstrapper.initialize as jest.Mock).mockImplementation(() => {
      throw testError;
    });
    
    activate(mockContext);
    
    expect(ErrorHandler.handleSync).toHaveBeenCalledWith(
      expect.any(Function),
      {
        component: 'Extension',
        operation: 'activate',
        severity: 'error',
        showUserMessage: true,
        userMessage: 'Shadow Watch initialization failed',
        logToFile: true,
        rethrow: true
      }
    );
  });

  test('should return early after error handling', () => {
    (ExtensionBootstrapper.initialize as jest.Mock).mockImplementation(() => {
      throw new Error('Initialization failed');
    });
    
    const result = activate(mockContext);
    
    expect(result).toBeUndefined();
    expect(CommandRegistry.register).not.toHaveBeenCalled();
  });

  test('should initialize NavigationHandler before creating command handlers', () => {
    const callOrder: string[] = [];
    
    (NavigationHandler as jest.Mock).mockImplementation(() => {
      callOrder.push('NavigationHandler');
      return {
        navigateToProductItem: jest.fn(),
        navigateToAnalysisItem: jest.fn(),
        copyInsightItem: jest.fn(),
        showProductItemDetails: jest.fn(),
        showInsightItemDetails: jest.fn(),
        showUnitTestItemDetails: jest.fn()
      };
    });
    
    (CommandRegistry.register as jest.Mock).mockImplementation(() => {
      callOrder.push('CommandRegistry');
      return [];
    });
    
    activate(mockContext);
    
    expect(callOrder).toEqual(['NavigationHandler', 'CommandRegistry']);
  });

  test('should pass NavigationHandler methods to command handlers', () => {
    const mockNavigationHandler = {
      navigateToProductItem: jest.fn(),
      navigateToAnalysisItem: jest.fn(),
      copyInsightItem: jest.fn(),
      showProductItemDetails: jest.fn(),
      showInsightItemDetails: jest.fn(),
      showUnitTestItemDetails: jest.fn()
    };
    
    (NavigationHandler as jest.Mock).mockReturnValue(mockNavigationHandler);
    
    activate(mockContext);
    
    const commandRegistryCall = (CommandRegistry.register as jest.Mock).mock.calls[0];
    const handlers = commandRegistryCall[2];
    
    const testItem = { id: 'test-item' };
    
    handlers.navigateToProductItem(testItem);
    expect(mockNavigationHandler.navigateToProductItem).toHaveBeenCalledWith(testItem);
    
    handlers.navigateToAnalysisItem(testItem);
    expect(mockNavigationHandler.navigateToAnalysisItem).toHaveBeenCalledWith(testItem);
    
    handlers.copyInsightItem(testItem);
    expect(mockNavigationHandler.copyInsightItem).toHaveBeenCalledWith(testItem);
    
    handlers.showProductItemDetails(testItem);
    expect(mockNavigationHandler.showProductItemDetails).toHaveBeenCalledWith(testItem);
    
    handlers.showInsightItemDetails(testItem);
    expect(mockNavigationHandler.showInsightItemDetails).toHaveBeenCalledWith(testItem);
    
    handlers.showUnitTestItemDetails(testItem);
    expect(mockNavigationHandler.showUnitTestItemDetails).toHaveBeenCalledWith(testItem);
  });
});