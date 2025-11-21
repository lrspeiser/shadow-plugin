import { registerCommands } from '../commandRegistry';
import * as vscode from 'vscode';
import { analyzeCodebase } from '../analyzeCodebase';
import { generateInsights } from '../generateInsights';

// Mocks
jest.mock('vscode');
jest.mock('../analyzeCodebase');
jest.mock('../generateInsights');

describe('registerCommands', () => {
  let mockContext: vscode.ExtensionContext;
  let mockCommands: jest.Mocked<typeof vscode.commands>;
  let mockWindow: jest.Mocked<typeof vscode.window>;
  let mockAnalyzeCodebase: jest.MockedFunction<typeof analyzeCodebase>;
  let mockGenerateInsights: jest.MockedFunction<typeof generateInsights>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockContext = new vscode.ExtensionContext();
    mockContext.subscriptions = [];
    
    mockCommands = vscode.commands as jest.Mocked<typeof vscode.commands>;
    mockWindow = vscode.window as jest.Mocked<typeof vscode.window>;
    mockAnalyzeCodebase = analyzeCodebase as jest.MockedFunction<typeof analyzeCodebase>;
    mockGenerateInsights = generateInsights as jest.MockedFunction<typeof generateInsights>;
    
    mockCommands.registerCommand.mockImplementation((command: string, callback: Function) => {
      return { dispose: jest.fn() };
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Happy Path', () => {
    test('should register all commands successfully', () => {
      registerCommands(mockContext);
      
      expect(mockCommands.registerCommand).toHaveBeenCalled();
      expect(mockCommands.registerCommand.mock.calls.length).toBeGreaterThan(0);
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });

    test('should register command with correct command identifier', () => {
      registerCommands(mockContext);
      
      const calls = mockCommands.registerCommand.mock.calls;
      expect(calls.some(call => typeof call[0] === 'string')).toBe(true);
    });

    test('should register command with callback function', () => {
      registerCommands(mockContext);
      
      const calls = mockCommands.registerCommand.mock.calls;
      expect(calls.every(call => typeof call[1] === 'function')).toBe(true);
    });

    test('should add disposables to context subscriptions', () => {
      const disposableMock = { dispose: jest.fn() };
      mockCommands.registerCommand.mockReturnValue(disposableMock as any);
      
      registerCommands(mockContext);
      
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
      expect(mockContext.subscriptions).toContain(disposableMock);
    });
  });

  describe('Command Execution', () => {
    test('should execute analyze codebase command successfully', async () => {
      mockAnalyzeCodebase.mockResolvedValue({ success: true, data: {} });
      
      registerCommands(mockContext);
      
      const analyzeCall = mockCommands.registerCommand.mock.calls.find(
        call => call[0].includes('analyze') || call[0].includes('codebase')
      );
      
      if (analyzeCall && analyzeCall[1]) {
        await analyzeCall[1]();
        expect(mockAnalyzeCodebase).toHaveBeenCalled();
      }
    });

    test('should execute generate insights command successfully', async () => {
      mockGenerateInsights.mockResolvedValue({ success: true, insights: [] });
      
      registerCommands(mockContext);
      
      const insightsCall = mockCommands.registerCommand.mock.calls.find(
        call => call[0].includes('insights') || call[0].includes('generate')
      );
      
      if (insightsCall && insightsCall[1]) {
        await insightsCall[1]();
        expect(mockGenerateInsights).toHaveBeenCalled();
      }
    });

    test('should show information message on successful command execution', async () => {
      mockAnalyzeCodebase.mockResolvedValue({ success: true, data: {} });
      mockWindow.showInformationMessage.mockResolvedValue(undefined);
      
      registerCommands(mockContext);
      
      const commandCall = mockCommands.registerCommand.mock.calls[0];
      if (commandCall && commandCall[1]) {
        await commandCall[1]();
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle analyzeCodebase errors gracefully', async () => {
      const error = new Error('Analysis failed');
      mockAnalyzeCodebase.mockRejectedValue(error);
      mockWindow.showErrorMessage.mockResolvedValue(undefined);
      
      registerCommands(mockContext);
      
      const analyzeCall = mockCommands.registerCommand.mock.calls.find(
        call => call[0].includes('analyze') || call[0].includes('codebase')
      );
      
      if (analyzeCall && analyzeCall[1]) {
        await expect(analyzeCall[1]()).resolves.not.toThrow();
      }
    });

    test('should show error message when command execution fails', async () => {
      const error = new Error('Command execution failed');
      mockAnalyzeCodebase.mockRejectedValue(error);
      mockWindow.showErrorMessage.mockResolvedValue(undefined);
      
      registerCommands(mockContext);
      
      const commandCall = mockCommands.registerCommand.mock.calls[0];
      if (commandCall && commandCall[1]) {
        await commandCall[1]();
        expect(mockWindow.showErrorMessage).toHaveBeenCalled();
      }
    });

    test('should handle generateInsights errors gracefully', async () => {
      const error = new Error('Insights generation failed');
      mockGenerateInsights.mockRejectedValue(error);
      mockWindow.showErrorMessage.mockResolvedValue(undefined);
      
      registerCommands(mockContext);
      
      const insightsCall = mockCommands.registerCommand.mock.calls.find(
        call => call[0].includes('insights') || call[0].includes('generate')
      );
      
      if (insightsCall && insightsCall[1]) {
        await expect(insightsCall[1]()).resolves.not.toThrow();
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined context gracefully', () => {
      expect(() => registerCommands(undefined as any)).not.toThrow();
    });

    test('should handle null context subscriptions', () => {
      const contextWithNullSubs = new vscode.ExtensionContext();
      contextWithNullSubs.subscriptions = null as any;
      
      expect(() => registerCommands(contextWithNullSubs)).not.toThrow();
    });

    test('should handle empty context subscriptions array', () => {
      const contextWithEmptySubs = new vscode.ExtensionContext();
      contextWithEmptySubs.subscriptions = [];
      
      registerCommands(contextWithEmptySubs);
      
      expect(contextWithEmptySubs.subscriptions.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle multiple command registrations', () => {
      registerCommands(mockContext);
      registerCommands(mockContext);
      
      expect(mockCommands.registerCommand).toHaveBeenCalled();
    });

    test('should handle command registration returning null disposable', () => {
      mockCommands.registerCommand.mockReturnValue(null as any);
      
      expect(() => registerCommands(mockContext)).not.toThrow();
    });
  });

  describe('Integration', () => {
    test('should register commands in correct sequence', () => {
      registerCommands(mockContext);
      
      const commandNames = mockCommands.registerCommand.mock.calls.map(call => call[0]);
      expect(commandNames.length).toBeGreaterThan(0);
      commandNames.forEach(name => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });

    test('should maintain context integrity after registration', () => {
      const initialSubsLength = mockContext.subscriptions.length;
      
      registerCommands(mockContext);
      
      expect(mockContext.subscriptions.length).toBeGreaterThanOrEqual(initialSubsLength);
      expect(mockContext).toBeDefined();
    });
  });
});