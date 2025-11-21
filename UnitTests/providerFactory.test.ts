import { ProviderFactory } from '../src/ai/providers/providerFactory';
import { OpenAIProvider } from '../src/ai/providers/openai/openaiProvider';
import { AnthropicProvider } from '../src/ai/providers/anthropic/anthropicProvider';

// Mocks
jest.mock('../src/ai/providers/openai/openaiProvider');
jest.mock('../src/ai/providers/anthropic/anthropicProvider');

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

  describe('openai provider', () => {
    test('should return OpenAIProvider instance when provider is openai', () => {
      const result = providerFactory.getProvider('openai');
      
      expect(result).toBeDefined();
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(OpenAIProvider);
    });

    test('should return same OpenAIProvider instance on subsequent calls (singleton pattern)', () => {
      const result1 = providerFactory.getProvider('openai');
      const result2 = providerFactory.getProvider('openai');
      
      expect(result1).toBe(result2);
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('claude provider', () => {
    test('should return AnthropicProvider instance when provider is claude', () => {
      const result = providerFactory.getProvider('claude');
      
      expect(result).toBeDefined();
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(AnthropicProvider);
    });

    test('should return same AnthropicProvider instance on subsequent calls (singleton pattern)', () => {
      const result1 = providerFactory.getProvider('claude');
      const result2 = providerFactory.getProvider('claude');
      
      expect(result1).toBe(result2);
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple providers', () => {
    test('should maintain separate instances for different providers', () => {
      const openaiResult = providerFactory.getProvider('openai');
      const claudeResult = providerFactory.getProvider('claude');
      
      expect(openaiResult).not.toBe(claudeResult);
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
    });

    test('should return cached instances when switching between providers', () => {
      const openai1 = providerFactory.getProvider('openai');
      const claude1 = providerFactory.getProvider('claude');
      const openai2 = providerFactory.getProvider('openai');
      const claude2 = providerFactory.getProvider('claude');
      
      expect(openai1).toBe(openai2);
      expect(claude1).toBe(claude2);
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    test('should throw error for unknown provider', () => {
      expect(() => {
        providerFactory.getProvider('unknown' as any);
      }).toThrow('Unknown provider: unknown');
    });

    test('should throw error for null provider', () => {
      expect(() => {
        providerFactory.getProvider(null as any);
      }).toThrow('Unknown provider: null');
    });

    test('should throw error for undefined provider', () => {
      expect(() => {
        providerFactory.getProvider(undefined as any);
      }).toThrow('Unknown provider: undefined');
    });

    test('should throw error for empty string provider', () => {
      expect(() => {
        providerFactory.getProvider('' as any);
      }).toThrow('Unknown provider: ');
    });

    test('should throw error for case-sensitive mismatch', () => {
      expect(() => {
        providerFactory.getProvider('OpenAI' as any);
      }).toThrow('Unknown provider: OpenAI');
      
      expect(() => {
        providerFactory.getProvider('Claude' as any);
      }).toThrow('Unknown provider: Claude');
    });
  });
});