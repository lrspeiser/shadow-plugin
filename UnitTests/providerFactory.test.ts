import { ProviderFactory } from '../ai/providers/providerFactory';
import { ConfigurationManager } from '../config/configurationManager';

// Test: test_createProvider_returnsCorrectProvider
// Verifies factory creates correct provider based on configuration
import { ProviderFactory } from '../ai/providers/providerFactory';
import { ConfigurationManager } from '../config/configurationManager';

jest.mock('../config/configurationManager');

const mockConfig = {
  getCurrentProvider: jest.fn(),
  getOpenAIKey: jest.fn().mockReturnValue('test-key'),
  getClaudeKey: jest.fn().mockReturnValue('test-key'),
  getMaxTokens: jest.fn().mockReturnValue(4000)
} as any;

describe('ProviderFactory.createProvider', () => {
  beforeEach(() => {
    (ConfigurationManager.getInstance as jest.Mock).mockReturnValue(mockConfig);
    jest.clearAllMocks();
  });

  test('creates OpenAI provider when configured', () => {
    mockConfig.getCurrentProvider.mockReturnValue('openai');

    const provider = ProviderFactory.createProvider();

    expect(provider).toBeDefined();
    expect(provider.getName()).toBe('openai');
  });

  test('creates Anthropic provider when configured', () => {
    mockConfig.getCurrentProvider.mockReturnValue('anthropic');

    const provider = ProviderFactory.createProvider();

    expect(provider).toBeDefined();
    expect(provider.getName()).toBe('anthropic');
  });

  test('throws error for unknown provider', () => {
    mockConfig.getCurrentProvider.mockReturnValue('unknown-provider');

    expect(() => ProviderFactory.createProvider()).toThrow();
  });

  test('validates configuration before creating provider', () => {
    mockConfig.getCurrentProvider.mockReturnValue('openai');
    mockConfig.getOpenAIKey.mockReturnValue('');

    expect(() => ProviderFactory.createProvider()).toThrow();
  });
});
