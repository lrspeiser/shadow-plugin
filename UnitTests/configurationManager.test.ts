import { ConfigurationManager } from '../config/configurationManager';
import * as vscode from 'vscode';

// Test: test_getConfiguration_returns_values
// Verifies getConfiguration correctly retrieves configuration values from VS Code settings
import { ConfigurationManager } from '../config/configurationManager';
import * as vscode from 'vscode';

jest.mock('vscode');

describe('ConfigurationManager.getConfiguration', () => {
  let configManager: ConfigurationManager;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const configs: any = {
          'provider': 'openai',
          'openai.apiKey': 'test-key',
          'openai.model': 'gpt-4'
        };
        return configs[key] || defaultValue;
      }),
      update: jest.fn()
    };
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);
    configManager = ConfigurationManager.getInstance();
  });

  it('should return existing config value', () => {
    const provider = configManager.getProvider();

    expect(provider).toBe('openai');
  });

  it('should return default for missing config', () => {
    mockConfig.get.mockReturnValue(undefined);

    const value = configManager.getConfiguration('nonexistent', 'default');

    expect(value).toBe('default');
  });

  it('should access nested config values', () => {
    const apiKey = configManager.getOpenAIApiKey();

    expect(apiKey).toBe('test-key');
    expect(mockConfig.get).toHaveBeenCalledWith(expect.stringContaining('apiKey'));
  });
});

// Test: test_updateConfiguration_persists_changes
// Verifies updateConfiguration correctly updates and persists configuration changes
import { ConfigurationManager } from '../config/configurationManager';
import * as vscode from 'vscode';

jest.mock('vscode');

describe('ConfigurationManager.updateConfiguration', () => {
  let configManager: ConfigurationManager;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      get: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined)
    };
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);
    configManager = ConfigurationManager.getInstance();
  });

  it('should call update method with correct parameters', async () => {
    await configManager.updateConfiguration('provider', 'anthropic');

    expect(mockConfig.update).toHaveBeenCalledWith(
      expect.stringContaining('provider'),
      'anthropic',
      vscode.ConfigurationTarget.Global
    );
  });

  it('should persist changes', async () => {
    await configManager.updateConfiguration('openai.model', 'gpt-4-turbo');

    expect(mockConfig.update).toHaveBeenCalled();
  });

  it('should validate value before update', async () => {
    await expect(
      configManager.updateConfiguration('provider', 'invalid-provider')
    ).rejects.toThrow();
  });
});
