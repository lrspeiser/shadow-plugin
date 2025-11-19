import { ProviderFactory } from '../ai/providers/providerFactory';
import { OpenAIProvider } from '../ai/providers/openAIProvider';
import { AnthropicProvider } from '../ai/providers/anthropicProvider';
jest.mock('../ai/providers/openAIProvider');
jest.mock('../ai/providers/anthropicProvider');
import OpenAI from 'openai';
jest.mock('openai');

// Test: test_create_provider_by_name
// Verifies provider factory creates correct provider instance based on configuration
describe('ProviderFactory - createProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create OpenAI provider', () => {
    const config = {
      provider: 'openai',
      apiKey: 'test-openai-key'
    };

    const provider = ProviderFactory.createProvider(config);

    expect(provider).toBeInstanceOf(OpenAIProvider);
    expect(OpenAIProvider).toHaveBeenCalledWith('test-openai-key');
  });

  test('should create Anthropic provider', () => {
    const config = {
      provider: 'anthropic',
      apiKey: 'test-anthropic-key'
    };

    const provider = ProviderFactory.createProvider(config);

    expect(provider).toBeInstanceOf(AnthropicProvider);
    expect(AnthropicProvider).toHaveBeenCalledWith('test-anthropic-key');
  });

  test('should throw error for invalid provider name', () => {
    const config = {
      provider: 'invalid-provider',
      apiKey: 'test-key'
    };

    expect(() => ProviderFactory.createProvider(config)).toThrow('Unknown provider');
  });

  test('should throw error for missing API key', () => {
    const config = {
      provider: 'openai',
      apiKey: ''
    };

    expect(() => ProviderFactory.createProvider(config)).toThrow('API key required');
  });
});

// Test: test_openai_provider_api_call
// Verifies OpenAI provider makes correct API calls and handles responses
describe('OpenAIProvider - generateCompletion', () => {
  let provider: OpenAIProvider;
  let mockOpenAI: jest.Mocked;

  beforeEach(() => {
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    } as any;

    (OpenAI as jest.MockedClass).mockImplementation(() => mockOpenAI);
    provider = new OpenAIProvider('test-api-key');
    jest.clearAllMocks();
  });

  test('should make successful API call', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Test response' } }],
      usage: { prompt_tokens: 100, completion_tokens: 50 }
    };

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

    const result = await provider.generateCompletion({
      prompt: 'Test prompt',
      model: 'gpt-4',
      maxTokens: 1000
    });

    expect(result.content).toBe('Test response');
    expect(result.usage.prompt_tokens).toBe(100);
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({ content: 'Test prompt' })
        ])
      })
    );
  });

  test('should handle rate limit error', async () => {
    const rateLimitError = new Error('Rate limit exceeded');
    rateLimitError.name = 'RateLimitError';

    mockOpenAI.chat.completions.create.mockRejectedValue(rateLimitError);

    await expect(provider.generateCompletion({
      prompt: 'Test prompt',
      model: 'gpt-4'
    })).rejects.toThrow('Rate limit exceeded');
  });

  test('should handle network timeout', async () => {
    const timeoutError = new Error('Request timeout');
    timeoutError.name = 'TimeoutError';

    mockOpenAI.chat.completions.create.mockRejectedValue(timeoutError);

    await expect(provider.generateCompletion({
      prompt: 'Test prompt',
      model: 'gpt-4'
    })).rejects.toThrow('Request timeout');
  });
});
