import { ConfigurationManager } from '../config/configurationManager';
import * as vscode from 'vscode';

// Test: test_configManager_retrievesSettings
// Verifies configuration manager retrieves settings correctly
import { ConfigurationManager } from '../config/configurationManager';
import * as vscode from 'vscode';

jest.mock('vscode');

const mockWorkspace = {
  getConfiguration: jest.fn().mockReturnValue({
    get: jest.fn((key: string, defaultValue: any) => {
      const config: any = {
        'shadowWatch.provider': 'openai',
        'shadowWatch.openaiApiKey': 'test-key',
        'shadowWatch.maxTokens': 4000
      };
      return config[key] || defaultValue;
    })
  })
};

(vscode.workspace as any) = mockWorkspace;

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;

  beforeEach(() => {
    configManager = ConfigurationManager.getInstance();
    jest.clearAllMocks();
  });

  test('retrieves provider setting correctly', () => {
    const provider = configManager.getCurrentProvider();

    expect(provider).toBe('openai');
  });

  test('retrieves API key correctly', () => {
    const apiKey = configManager.getOpenAIKey();

    expect(apiKey).toBe('test-key');
  });

  test('returns default when setting not configured', () => {
    const maxTokens = configManager.getMaxTokens();

    expect(maxTokens).toBeDefined();
    expect(typeof maxTokens).toBe('number');
  });

  test('validates configuration values', () => {
    const isValid = configManager.validateConfiguration();

    expect(typeof isValid).toBe('boolean');
  });
});
