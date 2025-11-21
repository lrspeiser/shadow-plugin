import { ProviderFactory } from '../src/ai/providers/providerFactory';
import { OpenAIProvider } from '../src/ai/providers/openai';
import { AnthropicProvider } from '../src/ai/providers/anthropic';
import { LLMProvider } from '../src/ai/types';

// Mocks
jest.mock('../src/ai/providers/openai');
jest.mock('../src/ai/providers/anthropic');

describe('ProviderFactory.getProvider', () => {
  let factory: ProviderFactory;
  let mockOpenAIProvider: jest.Mocked<OpenAIProvider>;
  let mockAnthropicProvider: jest.Mocked<AnthropicProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    factory = new ProviderFactory();
    mockOpenAIProvider = new OpenAIProvider() as jest.Mocked<OpenAIProvider>;
    mockAnthropicProvider = new AnthropicProvider() as jest.Mocked<AnthropicProvider>;
  });

  describe('openai provider', () => {
    test('should return OpenAIProvider instance when provider is openai', () => {
      const result = factory.getProvider('openai');
      expect(result).toBeInstanceOf(OpenAIProvider);
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
    });

    test('should return same OpenAIProvider instance on multiple calls (singleton pattern)', () => {
      const firstCall = factory.getProvider('openai');
      const secondCall = factory.getProvider('openai');
      expect(firstCall).toBe(secondCall);
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('claude provider', () => {
    test('should return AnthropicProvider instance when provider is claude', () => {
      const result = factory.getProvider('claude');
      expect(result).toBeInstanceOf(AnthropicProvider);
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
    });

    test('should return same AnthropicProvider instance on multiple calls (singleton pattern)', () => {
      const firstCall = factory.getProvider('claude');
      const secondCall = factory.getProvider('claude');
      expect(firstCall).toBe(secondCall);
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('unknown provider', () => {
    test('should throw error for unknown provider', () => {
      const unknownProvider = 'unknown' as LLMProvider;
      expect(() => factory.getProvider(unknownProvider)).toThrow('Unknown provider: unknown');
    });

    test('should throw error for empty string provider', () => {
      const emptyProvider = '' as LLMProvider;
      expect(() => factory.getProvider(emptyProvider)).toThrow('Unknown provider: ');
    });

    test('should throw error for null provider', () => {
      const nullProvider = null as any;
      expect(() => factory.getProvider(nullProvider)).toThrow('Unknown provider: null');
    });

    test('should throw error for undefined provider', () => {
      const undefinedProvider = undefined as any;
      expect(() => factory.getProvider(undefinedProvider)).toThrow('Unknown provider: undefined');
    });
  });

  describe('mixed provider calls', () => {
    test('should maintain separate instances for different providers', () => {
      const openaiProvider = factory.getProvider('openai');
      const claudeProvider = factory.getProvider('claude');
      const openaiProvider2 = factory.getProvider('openai');
      
      expect(openaiProvider).toBeInstanceOf(OpenAIProvider);
      expect(claudeProvider).toBeInstanceOf(AnthropicProvider);
      expect(openaiProvider).toBe(openaiProvider2);
      expect(openaiProvider).not.toBe(claudeProvider);
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
    });
  });
});