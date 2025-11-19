import { ConfigurationManager } from '../config/configurationManager';
import * as vscode from 'vscode';
jest.mock('vscode');

// Test: test_load_configuration_with_defaults
// Verifies configuration loads correctly with default values for missing settings
describe('ConfigurationManager - getConfiguration', () => {
  let configManager: ConfigurationManager;
  let mockWorkspaceConfig: any;

  beforeEach(() => {
    mockWorkspaceConfig = {
      get: jest.fn()
    };

    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockWorkspaceConfig);
    configManager = new ConfigurationManager();
    jest.clearAllMocks();
  });

  test('should load configuration with all settings present', () => {
    mockWorkspaceConfig.get.mockImplementation((key: string) => {
      const config: any = {
        'shadowWatch.llmProvider': 'openai',
        'shadowWatch.openaiApiKey': 'test-key',
        'shadowWatch.analysisThreshold': 500
      };
      return config[`shadowWatch.${key}`];
    });

    const config = configManager.getConfiguration();

    expect(config.llmProvider).toBe('openai');
    expect(config.openaiApiKey).toBe('test-key');
    expect(config.analysisThreshold).toBe(500);
  });

  test('should apply default values for missing settings', () => {
    mockWorkspaceConfig.get.mockReturnValue(undefined);

    const config = configManager.getConfiguration();

    expect(config.llmProvider).toBeDefined();
    expect(config.analysisThreshold).toBeDefined();
  });

  test('should validate configuration values', () => {
    mockWorkspaceConfig.get.mockImplementation((key: string) => {
      if (key === 'analysisThreshold') return -100;
      return undefined;
    });

    expect(() => configManager.getConfiguration()).toThrow('Invalid configuration');
  });
});
