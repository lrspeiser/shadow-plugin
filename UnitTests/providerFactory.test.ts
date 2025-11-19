import { createProvider } from '../../../ai/providers/providerFactory';
import { OpenAIProvider } from '../../../ai/providers/openAIProvider';
import { AnthropicProvider } from '../../../ai/providers/anthropicProvider';
import { ConfigurationManager } from '../../../config/configurationManager';

// Test: test_createProvider_instantiates_correct_provider
// Verifies provider factory creates correct provider instance based on configuration
import { createProvider } from '../../../ai/providers/providerFactory';
import { OpenAIProvider } from '../../../ai/providers/openAIProvider';
import { AnthropicProvider } from '../../../ai/providers/anthropicProvider';
import { ConfigurationManager } from '../../../config/configurationManager';

jest.mock('../../../config/configurationManager');

describe('providerFactory.createProvider', () => {
  let mockConfig: jest.Mocked;

  beforeEach(() => {
    mockConfig = {
      getOpenAIApiKey: jest.fn().mockReturnValue('test-key'),
      getClaudeApiKey: jest.fn().mockReturnValue('test-key'),
      getCustomEndpoint: jest.fn().mockReturnValue('https://api.example.com')
    } as any;
  });

  test('creates OpenAI provider when configured', () => {
    const provider = createProvider('openai', mockConfig);
    
    expect(provider).toBeInstanceOf(OpenAIProvider);
    expect(provider.getName()).toBe('openai');
  });

  test('creates Anthropic provider when configured', () => {
    const provider = createProvider('anthropic', mockConfig);
    
    expect(provider).toBeInstanceOf(AnthropicProvider);
    expect(provider.getName()).toBe('anthropic');
  });

  test('throws error for invalid provider name', () => {
    expect(() => createProvider('invalid-provider', mockConfig)).toThrow();
  });

  test('passes configuration to provider', () => {
    const provider = createProvider('openai', mockConfig);
    
    expect(mockConfig.getOpenAIApiKey).toHaveBeenCalled();
    expect(provider.isConfigured()).toBe(true);
  });
});
