import { ProviderFactory } from '../src/ai/providers/providerFactory';
import { OpenAIProvider } from '../src/ai/providers/openaiProvider';
import { AnthropicProvider } from '../src/ai/providers/anthropicProvider';

// Mocks
jest.mock('../src/ai/providers/openaiProvider');
jest.mock('../src/ai/providers/anthropicProvider');

describe('ProviderFactory.getProvider', () => {
  let providerFactory: ProviderFactory;
  let mockOpenAIProvider: jest.Mocked<OpenAIProvider>;
  let mockAnthropicProvider: jest.Mocked<AnthropicProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    providerFactory = new ProviderFactory();
    mockOpenAIProvider = new OpenAIProvider() as jest.Mocked<OpenAIProvider>;
    mockAnthropicProvider = new AnthropicProvider() as jest.Mocked<AnthropicProvider>;
  });

  describe('OpenAI Provider', () => {
    test('should return OpenAI provider when provider is "openai"', () => {
      const provider = providerFactory.getProvider('openai');
      
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    test('should cache and reuse OpenAI provider on subsequent calls', () => {
      const provider1 = providerFactory.getProvider('openai');
      const provider2 = providerFactory.getProvider('openai');
      
      expect(provider1).toBe(provider2);
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('Claude Provider', () => {
    test('should return Anthropic provider when provider is "claude"', () => {
      const provider = providerFactory.getProvider('claude');
      
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    test('should cache and reuse Anthropic provider on subsequent calls', () => {
      const provider1 = providerFactory.getProvider('claude');
      const provider2 = providerFactory.getProvider('claude');
      
      expect(provider1).toBe(provider2);
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple Providers', () => {
    test('should maintain separate instances for different providers', () => {
      const openaiProvider = providerFactory.getProvider('openai');
      const claudeProvider = providerFactory.getProvider('claude');
      
      expect(openaiProvider).not.toBe(claudeProvider);
      expect(openaiProvider).toBeInstanceOf(OpenAIProvider);
      expect(claudeProvider).toBeInstanceOf(AnthropicProvider);
    });

    test('should cache each provider independently', () => {
      providerFactory.getProvider('openai');
      providerFactory.getProvider('claude');
      providerFactory.getProvider('openai');
      providerFactory.getProvider('claude');
      
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for unknown provider', () => {
      expect(() => {
        providerFactory.getProvider('unknown' as any);
      }).toThrow('Unknown provider: unknown');
    });

    test('should throw error for empty string provider', () => {
      expect(() => {
        providerFactory.getProvider('' as any);
      }).toThrow('Unknown provider: ');
    });

    test('should throw error for null provider', () => {
      expect(() => {
        providerFactory.getProvider(null as any);
      }).toThrow();
    });

    test('should throw error for undefined provider', () => {
      expect(() => {
        providerFactory.getProvider(undefined as any);
      }).toThrow();
    });
  });

  describe('Case Sensitivity', () => {
    test('should not match providers with different casing', () => {
      expect(() => {
        providerFactory.getProvider('OpenAI' as any);
      }).toThrow('Unknown provider: OpenAI');
    });

    test('should not match "Claude" with capital C', () => {
      expect(() => {
        providerFactory.getProvider('Claude' as any);
      }).toThrow('Unknown provider: Claude');
    });
  });
});