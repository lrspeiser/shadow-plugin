import { ConfigurationManager } from '../../config/configurationManager';
import * as vscode from 'vscode';

// Test: test_getActiveProvider_returns_configured_provider
// Verifies configuration manager returns active AI provider setting
import { ConfigurationManager } from '../../config/configurationManager';
import * as vscode from 'vscode';

jest.mock('vscode');

describe('ConfigurationManager.getActiveProvider', () => {
  let configManager: ConfigurationManager;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn()
    };
    
    (vscode.workspace.getConfiguration as jest.Mock) = jest.fn().mockReturnValue(mockConfig);
    
    configManager = new ConfigurationManager();
  });

  test('returns OpenAI when configured', () => {
    mockConfig.get.mockReturnValue('openai');
    
    const provider = configManager.getActiveProvider();
    
    expect(provider).toBe('openai');
  });

  test('returns Anthropic when configured', () => {
    mockConfig.get.mockReturnValue('anthropic');
    
    const provider = configManager.getActiveProvider();
    
    expect(provider).toBe('anthropic');
  });

  test('returns default provider when not configured', () => {
    mockConfig.get.mockReturnValue(undefined);
    
    const provider = configManager.getActiveProvider();
    
    expect(provider).toBe('openai');
  });

  test('validates provider name', () => {
    mockConfig.get.mockReturnValue('invalid-provider');
    
    expect(() => configManager.getActiveProvider()).toThrow();
  });
});
