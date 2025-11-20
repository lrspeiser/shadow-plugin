import { AnthropicProvider } from '../anthropicProvider';
import { ConfigManager } from '../../../config/configManager';
import Anthropic from '@anthropic-ai/sdk';

// Mocks
jest.mock('@anthropic-ai/sdk');
jest.mock('../../../config/configManager');

describe('AnthropicProvider - validateConfig', () => {
  let mockConfigManager: jest.Mocked<ConfigManager>;
  let anthropicProvider: AnthropicProvider;
  let mockAnthropicConstructor: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnthropicConstructor = Anthropic as unknown as jest.Mock;
    mockAnthropicConstructor.mockImplementation(() => ({
      messages: { create: jest.fn() }
    }));
    
    mockConfigManager = {
      claudeApiKey: '',
      get: jest.fn(),
      update: jest.fn()
    } as any;
  });

  test('should initialize client when valid API key is provided', () => {
    const validApiKey = 'sk-ant-api03-valid-key-12345';
    mockConfigManager.claudeApiKey = validApiKey;
    
    anthropicProvider = new AnthropicProvider(mockConfigManager);
    
    expect(anthropicProvider['apiKey']).toBe(validApiKey);
    expect(anthropicProvider['client']).toBeDefined();
    expect(mockAnthropicConstructor).toHaveBeenCalledWith({
      apiKey: validApiKey,
      timeout: 300000
    });
  });

  test('should set apiKey to null when API key is empty string', () => {
    mockConfigManager.claudeApiKey = '';
    
    anthropicProvider = new AnthropicProvider(mockConfigManager);
    
    expect(anthropicProvider['apiKey']).toBeNull();
    expect(anthropicProvider['client']).toBeUndefined();
    expect(mockAnthropicConstructor).not.toHaveBeenCalled();
  });

  test('should set apiKey to null when API key is undefined', () => {
    mockConfigManager.claudeApiKey = undefined as any;
    
    anthropicProvider = new AnthropicProvider(mockConfigManager);
    
    expect(anthropicProvider['apiKey']).toBeNull();
    expect(anthropicProvider['client']).toBeUndefined();
    expect(mockAnthropicConstructor).not.toHaveBeenCalled();
  });

  test('should set apiKey to null when API key is null', () => {
    mockConfigManager.claudeApiKey = null as any;
    
    anthropicProvider = new AnthropicProvider(mockConfigManager);
    
    expect(anthropicProvider['apiKey']).toBeNull();
    expect(anthropicProvider['client']).toBeUndefined();
    expect(mockAnthropicConstructor).not.toHaveBeenCalled();
  });

  test('should initialize client with correct timeout value', () => {
    const validApiKey = 'sk-ant-api03-test-key';
    mockConfigManager.claudeApiKey = validApiKey;
    
    anthropicProvider = new AnthropicProvider(mockConfigManager);
    
    expect(mockAnthropicConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 300000
      })
    );
  });

  test('should handle whitespace-only API key as invalid', () => {
    mockConfigManager.claudeApiKey = '   ';
    
    anthropicProvider = new AnthropicProvider(mockConfigManager);
    
    expect(anthropicProvider['apiKey']).toBe('   ');
    expect(anthropicProvider['client']).toBeDefined();
    expect(mockAnthropicConstructor).toHaveBeenCalled();
  });

  test('should initialize client when API key has length greater than zero', () => {
    const shortApiKey = 'x';
    mockConfigManager.claudeApiKey = shortApiKey;
    
    anthropicProvider = new AnthropicProvider(mockConfigManager);
    
    expect(anthropicProvider['apiKey']).toBe(shortApiKey);
    expect(anthropicProvider['client']).toBeDefined();
    expect(mockAnthropicConstructor).toHaveBeenCalledTimes(1);
  });
});