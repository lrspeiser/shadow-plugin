import { ProviderFactory } from '../providerFactory';
import { AnthropicProvider } from '../anthropic';
import { OpenAIProvider } from '../openai';
import { LLMProvider } from '../../types';

// Mocks
jest.mock('../anthropic');
jest.mock('../openai');
jest.mock('../../config');

describe('ProviderFactory.getProvider', () => {
  let factory: ProviderFactory;
  let mockOpenAIInstance: any;
  let mockAnthropicInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOpenAIInstance = {
      chat: jest.fn(),
      complete: jest.fn()
    };
    
    mockAnthropicInstance = {
      chat: jest.fn(),
      complete: jest.fn()
    };
    
    (OpenAIProvider as jest.MockedClass<typeof OpenAIProvider>).mockImplementation(() => mockOpenAIInstance);
    (AnthropicProvider as jest.MockedClass<typeof AnthropicProvider>).mockImplementation(() => mockAnthropicInstance);
    
    factory = new ProviderFactory();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('happy path scenarios', () => {
    test('should create and return OpenAI provider when provider is openai', () => {
      const result = factory.getProvider('openai' as LLMProvider);
      
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockOpenAIInstance);
      expect(result).toBeDefined();
    });

    test('should create and return Anthropic provider when provider is claude', () => {
      const result = factory.getProvider('claude' as LLMProvider);
      
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockAnthropicInstance);
      expect(result).toBeDefined();
    });

    test('should return cached OpenAI provider instance on subsequent calls', () => {
      const firstCall = factory.getProvider('openai' as LLMProvider);
      const secondCall = factory.getProvider('openai' as LLMProvider);
      const thirdCall = factory.getProvider('openai' as LLMProvider);
      
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
      expect(firstCall).toBe(secondCall);
      expect(secondCall).toBe(thirdCall);
      expect(firstCall).toBe(mockOpenAIInstance);
    });

    test('should return cached Anthropic provider instance on subsequent calls', () => {
      const firstCall = factory.getProvider('claude' as LLMProvider);
      const secondCall = factory.getProvider('claude' as LLMProvider);
      const thirdCall = factory.getProvider('claude' as LLMProvider);
      
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
      expect(firstCall).toBe(secondCall);
      expect(secondCall).toBe(thirdCall);
      expect(firstCall).toBe(mockAnthropicInstance);
    });
  });

  describe('multiple providers usage', () => {
    test('should maintain separate instances for different providers', () => {
      const openaiProvider1 = factory.getProvider('openai' as LLMProvider);
      const claudeProvider1 = factory.getProvider('claude' as LLMProvider);
      const openaiProvider2 = factory.getProvider('openai' as LLMProvider);
      const claudeProvider2 = factory.getProvider('claude' as LLMProvider);
      
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
      expect(openaiProvider1).toBe(openaiProvider2);
      expect(claudeProvider1).toBe(claudeProvider2);
      expect(openaiProvider1).not.toBe(claudeProvider1);
    });

    test('should handle alternating provider requests correctly', () => {
      const providers = [
        factory.getProvider('openai' as LLMProvider),
        factory.getProvider('claude' as LLMProvider),
        factory.getProvider('openai' as LLMProvider),
        factory.getProvider('claude' as LLMProvider)
      ];
      
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
      expect(providers[0]).toBe(providers[2]);
      expect(providers[1]).toBe(providers[3]);
    });
  });

  describe('error handling', () => {
    test('should throw error for unknown provider', () => {
      expect(() => {
        factory.getProvider('unknown-provider' as LLMProvider);
      }).toThrow('Unknown provider: unknown-provider');
    });

    test('should throw error for invalid provider name', () => {
      expect(() => {
        factory.getProvider('gemini' as LLMProvider);
      }).toThrow(/Unknown provider:/);
    });

    test('should throw error for null provider', () => {
      expect(() => {
        factory.getProvider(null as any);
      }).toThrow('Unknown provider:');
    });

    test('should throw error for undefined provider', () => {
      expect(() => {
        factory.getProvider(undefined as any);
      }).toThrow('Unknown provider:');
    });

    test('should throw error for empty string provider', () => {
      expect(() => {
        factory.getProvider('' as LLMProvider);
      }).toThrow('Unknown provider: ');
    });

    test('should throw error with correct message format', () => {
      const invalidProvider = 'mistral';
      expect(() => {
        factory.getProvider(invalidProvider as LLMProvider);
      }).toThrow(`Unknown provider: ${invalidProvider}`);
    });
  });

  describe('edge cases', () => {
    test('should handle case-sensitive provider names', () => {
      expect(() => {
        factory.getProvider('OpenAI' as LLMProvider);
      }).toThrow('Unknown provider: OpenAI');
      
      expect(() => {
        factory.getProvider('Claude' as LLMProvider);
      }).toThrow('Unknown provider: Claude');
    });

    test('should handle provider names with whitespace', () => {
      expect(() => {
        factory.getProvider(' openai' as LLMProvider);
      }).toThrow('Unknown provider:  openai');
      
      expect(() => {
        factory.getProvider('claude ' as LLMProvider);
      }).toThrow('Unknown provider: claude ');
    });

    test('should maintain state across multiple factory instances', () => {
      const factory1 = new ProviderFactory();
      const factory2 = new ProviderFactory();
      
      const provider1 = factory1.getProvider('openai' as LLMProvider);
      const provider2 = factory2.getProvider('openai' as LLMProvider);
      
      expect(OpenAIProvider).toHaveBeenCalledTimes(2);
      expect(provider1).not.toBe(provider2);
    });
  });
});