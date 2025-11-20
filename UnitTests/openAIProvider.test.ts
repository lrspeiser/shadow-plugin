import { OpenAIProvider } from '../openAIProvider';
import { ConfigManager } from '../../../config/configManager';
import OpenAI from 'openai';

// Mocks
jest.mock('openai');
jest.mock('../../../config/configManager');

import { OpenAIProvider } from '../openAIProvider';
import { ConfigManager } from '../../../config/configManager';
import OpenAI from 'openai';

jest.mock('openai');
jest.mock('../../../config/configManager');

describe('OpenAIProvider - validateConfig', () => {
  let provider: OpenAIProvider;
  let mockConfigManager: jest.Mocked<ConfigManager>;
  let mockOpenAIConstructor: jest.MockedClass<typeof OpenAI>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAIConstructor = OpenAI as jest.MockedClass<typeof OpenAI>;
    mockConfigManager = {
      openaiApiKey: '',
      get: jest.fn(),
      update: jest.fn()
    } as any;
  });

  test('should initialize client when valid API key is provided', () => {
    const testApiKey = 'sk-test-api-key-12345';
    mockConfigManager.openaiApiKey = testApiKey;
    
    provider = new OpenAIProvider(mockConfigManager);
    
    expect((provider as any).apiKey).toBe(testApiKey);
    expect(mockOpenAIConstructor).toHaveBeenCalledWith({
      apiKey: testApiKey,
      timeout: 300000
    });
    expect((provider as any).client).toBeDefined();
  });

  test('should set apiKey to null when API key is empty string', () => {
    mockConfigManager.openaiApiKey = '';
    
    provider = new OpenAIProvider(mockConfigManager);
    
    expect((provider as any).apiKey).toBeNull();
    expect(mockOpenAIConstructor).not.toHaveBeenCalled();
    expect((provider as any).client).toBeUndefined();
  });

  test('should set apiKey to null when API key is null', () => {
    mockConfigManager.openaiApiKey = null as any;
    
    provider = new OpenAIProvider(mockConfigManager);
    
    expect((provider as any).apiKey).toBeNull();
    expect(mockOpenAIConstructor).not.toHaveBeenCalled();
    expect((provider as any).client).toBeUndefined();
  });

  test('should set apiKey to null when API key is undefined', () => {
    mockConfigManager.openaiApiKey = undefined as any;
    
    provider = new OpenAIProvider(mockConfigManager);
    
    expect((provider as any).apiKey).toBeNull();
    expect(mockOpenAIConstructor).not.toHaveBeenCalled();
    expect((provider as any).client).toBeUndefined();
  });

  test('should initialize client with correct timeout when API key has whitespace', () => {
    const testApiKey = '  sk-test-api-key-with-spaces  ';
    mockConfigManager.openaiApiKey = testApiKey;
    
    provider = new OpenAIProvider(mockConfigManager);
    
    expect((provider as any).apiKey).toBe(testApiKey);
    expect(mockOpenAIConstructor).toHaveBeenCalledWith({
      apiKey: testApiKey,
      timeout: 300000
    });
    expect((provider as any).client).toBeDefined();
  });

  test('should not initialize client when API key is only whitespace', () => {
    mockConfigManager.openaiApiKey = '   ';
    
    provider = new OpenAIProvider(mockConfigManager);
    
    expect((provider as any).apiKey).toBe('   ');
    expect(mockOpenAIConstructor).toHaveBeenCalledWith({
      apiKey: '   ',
      timeout: 300000
    });
  });

  test('should initialize client with very long API key', () => {
    const longApiKey = 'sk-' + 'a'.repeat(100);
    mockConfigManager.openaiApiKey = longApiKey;
    
    provider = new OpenAIProvider(mockConfigManager);
    
    expect((provider as any).apiKey).toBe(longApiKey);
    expect(mockOpenAIConstructor).toHaveBeenCalledWith({
      apiKey: longApiKey,
      timeout: 300000
    });
    expect((provider as any).client).toBeDefined();
  });
});