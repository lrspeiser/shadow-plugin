import * as vscode from 'vscode';
import { EventEmitter } from 'vscode';

// Mocks
jest.mock('vscode');
jest.mock('../src/config/configurationManager');
jest.mock('../src/analysis/analyzer');
jest.mock('../src/analysis/insightGenerator');
jest.mock('../src/diagnostics/diagnosticsProvider');
jest.mock('../src/infrastructure/progressService');
jest.mock('../src/llm/llmIntegration');

describe('analyzeWorkspace', () => {
  let mockConfigManager: any;
  let mockAnalyzer: any;
  let mockInsightGenerator: any;
  let mockDiagnosticsProvider: any;
  let mockProgressService: any;
  let mockLlmIntegration: any;
  let mockTreeProvider: any;
  let mockStatusBarItem: any;
  let analyzeWorkspace: any;
  let getConfigurationManager: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup vscode mocks
    const vscodeMock = vscode as any;
    vscodeMock.window.showWarningMessage = jest.fn();
    vscodeMock.window.showErrorMessage = jest.fn();
    vscodeMock.workspace.workspaceFolders = [
      { uri: { fsPath: '/test/workspace' } }
    ];

    // Mock configuration manager
    mockConfigManager = {
      enabled: true
    };
    getConfigurationManager = jest.fn().mockReturnValue(mockConfigManager);

    // Mock analyzer
    mockAnalyzer = {
      analyzeWorkspace: jest.fn().mockResolvedValue({
        files: [],
        dependencies: [],
        metrics: {}
      })
    };

    // Mock insight generator
    mockInsightGenerator = {
      generateInsights: jest.fn().mockReturnValue([
        { type: 'warning', message: 'Test issue', file: 'test.ts', line: 1 }
      ])
    };

    // Mock diagnostics provider
    mockDiagnosticsProvider = {
      updateDiagnostics: jest.fn()
    };

    // Mock progress service
    const mockReporter = {
      report: jest.fn(),
      cancellationToken: {
        isCancellationRequested: false
      }
    };
    mockProgressService = {
      withProgress: jest.fn().mockImplementation(async (title: string, callback: Function) => {
        return await callback(mockReporter);
      })
    };

    // Mock LLM integration
    mockLlmIntegration = {
      setCodeAnalysis: jest.fn(),
      runComprehensiveAnalysis: jest.fn().mockResolvedValue(undefined)
    };

    // Mock tree provider
    mockTreeProvider = {
      updateInsights: jest.fn(),
      setAnalysisComplete: jest.fn()
    };

    // Mock status bar item
    mockStatusBarItem = {
      text: '',
      tooltip: '',
      show: jest.fn(),
      hide: jest.fn()
    };

    // Mock modules
    jest.doMock('../src/config/configurationManager', () => ({
      getConfigurationManager
    }));
    jest.doMock('../src/analysis/analyzer', () => ({
      analyzer: mockAnalyzer
    }));
    jest.doMock('../src/analysis/insightGenerator', () => ({
      insightGenerator: mockInsightGenerator
    }));
    jest.doMock('../src/diagnostics/diagnosticsProvider', () => ({
      diagnosticsProvider: mockDiagnosticsProvider
    }));
    jest.doMock('../src/infrastructure/progressService', () => ({
      progressService: mockProgressService
    }));
    jest.doMock('../src/llm/llmIntegration', () => ({
      llmIntegration: mockLlmIntegration
    }));

    // Import the module after mocks are set up
    const extensionModule = await import('../src/extension');
    analyzeWorkspace = extensionModule.analyzeWorkspace;

    // Set global mocks that the function expects
    (global as any).getConfigurationManager = getConfigurationManager;
    (global as any).analyzer = mockAnalyzer;
    (global as any).insightGenerator = mockInsightGenerator;
    (global as any).diagnosticsProvider = mockDiagnosticsProvider;
    (global as any).llmIntegration = mockLlmIntegration;
    (global as any).treeProvider = mockTreeProvider;
    (global as any).statusBarItem = mockStatusBarItem;
  });

  afterEach(() => {
    delete (global as any).getConfigurationManager;
    delete (global as any).analyzer;
    delete (global as any).insightGenerator;
    delete (global as any).diagnosticsProvider;
    delete (global as any).llmIntegration;
    delete (global as any).treeProvider;
    delete (global as any).statusBarItem;
  });

  describe('Happy Path', () => {
    test('should complete full analysis workflow successfully', async () => {
      await analyzeWorkspace();

      expect(mockAnalyzer.analyzeWorkspace).toHaveBeenCalledWith('/test/workspace');
      expect(mockInsightGenerator.generateInsights).toHaveBeenCalled();
      expect(mockLlmIntegration.setCodeAnalysis).toHaveBeenCalled();
      expect(mockDiagnosticsProvider.updateDiagnostics).toHaveBeenCalled();
      expect(mockTreeProvider.updateInsights).toHaveBeenCalled();
      expect(mockTreeProvider.setAnalysisComplete).toHaveBeenCalled();
      expect(mockLlmIntegration.runComprehensiveAnalysis).toHaveBeenCalled();
      expect(mockStatusBarItem.text).toContain('1 issues');
    });

    test('should update status bar with correct issue count', async () => {
      mockInsightGenerator.generateInsights.mockReturnValue([
        { type: 'error', message: 'Issue 1' },
        { type: 'warning', message: 'Issue 2' },
        { type: 'info', message: 'Issue 3' }
      ]);

      await analyzeWorkspace();

      expect(mockStatusBarItem.text).toBe('$(eye) 3 issues');
      expect(mockStatusBarItem.tooltip).toBe('Shadow Watch: 3 architecture issues found');
    });

    test('should show analyzing status during execution', async () => {
      mockAnalyzer.analyzeWorkspace.mockImplementation(async () => {
        expect(mockStatusBarItem.text).toBe('$(sync~spin) Analyzing...');
        return { files: [], dependencies: [], metrics: {} };
      });

      await analyzeWorkspace();
    });
  });

  describe('Configuration Validation', () => {
    test('should show warning and return early when Shadow Watch is disabled', async () => {
      mockConfigManager.enabled = false;

      await analyzeWorkspace();

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('Shadow Watch is disabled');
      expect(mockAnalyzer.analyzeWorkspace).not.toHaveBeenCalled();
    });
  });

  describe('Workspace Validation', () => {
    test('should show error when no workspace folder is open', async () => {
      (vscode.workspace as any).workspaceFolders = undefined;

      await analyzeWorkspace();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No workspace folder open');
      expect(mockAnalyzer.analyzeWorkspace).not.toHaveBeenCalled();
    });

    test('should show error when workspace folders array is empty', async () => {
      (vscode.workspace as any).workspaceFolders = [];

      await analyzeWorkspace();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No workspace folder open');
      expect(mockAnalyzer.analyzeWorkspace).not.toHaveBeenCalled();
    });
  });

  describe('Cancellation Handling', () => {
    test('should handle cancellation before analysis', async () => {
      const mockReporter = {
        report: jest.fn(),
        cancellationToken: {
          isCancellationRequested: true
        }
      };
      mockProgressService.withProgress.mockImplementation(async (title: string, callback: Function) => {
        return await callback(mockReporter);
      });

      await analyzeWorkspace();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining('Cancelled by user'));
      expect(mockStatusBarItem.text).toBe('$(eye) Error');
    });

    test('should handle cancellation after analysis', async () => {
      const mockReporter = {
        report: jest.fn(),
        cancellationToken: {
          isCancellationRequested: false
        }
      };
      
      mockAnalyzer.analyzeWorkspace.mockImplementation(async () => {
        mockReporter.cancellationToken.isCancellationRequested = true;
        return { files: [], dependencies: [], metrics: {} };
      });

      mockProgressService.withProgress.mockImplementation(async (title: string, callback: Function) => {
        return await callback(mockReporter);
      });

      await analyzeWorkspace();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining('Cancelled by user'));
    });

    test('should handle cancellation before comprehensive analysis', async () => {
      const mockReporter = {
        report: jest.fn(),
        cancellationToken: {
          isCancellationRequested: false
        }
      };

      mockInsightGenerator.generateInsights.mockImplementation(() => {
        mockReporter.cancellationToken.isCancellationRequested = true;
        return [{ type: 'warning', message: 'Test' }];
      });

      mockProgressService.withProgress.mockImplementation(async (title: string, callback: Function) => {
        return await callback(mockReporter);
      });

      await analyzeWorkspace();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining('Cancelled by user'));
    });
  });

  describe('Error Handling', () => {
    test('should handle analyzer errors gracefully', async () => {
      const error = new Error('Analysis failed');
      mockAnalyzer.analyzeWorkspace.mockRejectedValue(error);

      await analyzeWorkspace();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Analysis failed: Error: Analysis failed');
      expect(mockStatusBarItem.text).toBe('$(eye) Error');
    });

    test('should handle insight generator errors', async () => {
      const error = new Error('Insight generation failed');
      mockInsightGenerator.generateInsights.mockImplementation(() => {
        throw error;
      });

      await analyzeWorkspace();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining('Insight generation failed'));
      expect(mockStatusBarItem.text).toBe('$(eye) Error');
    });

    test('should handle LLM comprehensive analysis errors', async () => {
      const error = new Error('LLM analysis failed');
      mockLlmIntegration.runComprehensiveAnalysis.mockRejectedValue(error);

      await analyzeWorkspace();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining('LLM analysis failed'));
      expect(mockStatusBarItem.text).toBe('$(eye) Error');
    });
  });

  describe('Progress Reporting', () => {
    test('should report progress at key stages', async () => {
      const mockReporter = {
        report: jest.fn(),
        cancellationToken: {
          isCancellationRequested: false
        }
      };
      mockProgressService.withProgress.mockImplementation(async (title: string, callback: Function) => {
        return await callback(mockReporter);
      });

      await analyzeWorkspace();

      expect(mockReporter.report).toHaveBeenCalledWith('Analyzing workspace...');
      expect(mockReporter.report).toHaveBeenCalledWith('Step 1 complete. Starting comprehensive analysis...');
    });

    test('should use correct progress title', async () => {
      await analyzeWorkspace();

      expect(mockProgressService.withProgress).toHaveBeenCalledWith(
        'Shadow Watch',
        expect.any(Function)
      );
    });
  });

  describe('Integration Flow', () => {
    test('should call components in correct order', async () => {
      const callOrder: string[] = [];

      mockAnalyzer.analyzeWorkspace.mockImplementation(async () => {
        callOrder.push('analyze');
        return { files: [], dependencies: [], metrics: {} };
      });

      mockInsightGenerator.generateInsights.mockImplementation(() => {
        callOrder.push('insights');
        return [{ type: 'warning', message: 'Test' }];
      });

      mockLlmIntegration.setCodeAnalysis.mockImplementation(() => {
        callOrder.push('setAnalysis');
      });

      mockDiagnosticsProvider.updateDiagnostics.mockImplementation(() => {
        callOrder.push('diagnostics');
      });

      mockTreeProvider.updateInsights.mockImplementation(() => {
        callOrder.push('treeUpdate');
      });

      mockTreeProvider.setAnalysisComplete.mockImplementation(() => {
        callOrder.push('analysisComplete');
      });

      mockLlmIntegration.runComprehensiveAnalysis.mockImplementation(() => {
        callOrder.push('comprehensive');
      });

      await analyzeWorkspace();

      expect(callOrder).toEqual([
        'analyze',
        'insights',
        'setAnalysis',
        'diagnostics',
        'treeUpdate',
        'analysisComplete',
        'comprehensive'
      ]);
    });

    test('should pass analysis data correctly between components', async () => {
      const mockAnalysis = {
        files: ['file1.ts', 'file2.ts'],
        dependencies: ['dep1'],
        metrics: { complexity: 10 }
      };
      const mockInsights = [
        { type: 'error', message: 'Critical issue' },
        { type: 'warning', message: 'Minor issue' }
      ];

      mockAnalyzer.analyzeWorkspace.mockResolvedValue(mockAnalysis);
      mockInsightGenerator.generateInsights.mockReturnValue(mockInsights);

      await analyzeWorkspace();

      expect(mockInsightGenerator.generateInsights).toHaveBeenCalledWith(mockAnalysis);
      expect(mockLlmIntegration.setCodeAnalysis).toHaveBeenCalledWith(mockAnalysis);
      expect(mockDiagnosticsProvider.updateDiagnostics).toHaveBeenCalledWith(mockInsights);
      expect(mockTreeProvider.updateInsights).toHaveBeenCalledWith(mockInsights);
    });
  });
});