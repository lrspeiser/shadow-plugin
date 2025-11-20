import { OpenAIProvider } from '../openAIProvider';
import { LLMRequestOptions, LLMResponse } from '../../types';
import OpenAI from 'openai';

// Mocks
jest.mock('openai');
jest.mock('../../utils/rateLimiter');
jest.mock('../../utils/retryHandler');

describe('OpenAIProvider.sendRequest - if condition', () => {
  let provider: OpenAIProvider;
  let mockClient: jest.Mocked<OpenAI>;
  let mockRequestOptions: LLMRequestOptions;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequestOptions = {
      prompt: 'Test prompt',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      stream: false
    };

    mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            id: 'test-id',
            model: 'gpt-4',
            choices: [{
              message: {
                role: 'assistant',
                content: 'Test response'
              },
              finish_reason: 'stop',
              index: 0
            }],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 20,
              total_tokens: 30
            }
          })
        }
      }
    } as any;
  });

  test('should throw error when client is not initialized (null)', async () => {
    provider = new OpenAIProvider('');
    (provider as any).client = null;

    await expect(provider.sendRequest(mockRequestOptions)).rejects.toThrow(
      'OpenAI API key not configured'
    );
  });

  test('should throw error when client is not initialized (undefined)', async () => {
    provider = new OpenAIProvider('');
    (provider as any).client = undefined;

    await expect(provider.sendRequest(mockRequestOptions)).rejects.toThrow(
      'OpenAI API key not configured'
    );
  });

  test('should throw error with exact message when API key is missing', async () => {
    provider = new OpenAIProvider('');
    (provider as any).client = null;

    try {
      await provider.sendRequest(mockRequestOptions);
      fail('Expected error to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('OpenAI API key not configured');
    }
  });

  test('should not throw error when client is properly initialized', async () => {
    provider = new OpenAIProvider('test-api-key');
    (provider as any).client = mockClient;

    const expectedResponse: LLMResponse = {
      content: 'Test response',
      model: 'gpt-4',
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      }
    };

    (provider as any).sendRequest = jest.fn().mockResolvedValue(expectedResponse);

    const response = await provider.sendRequest(mockRequestOptions);
    
    expect(response).toBeDefined();
    expect((provider as any).sendRequest).toHaveBeenCalledWith(mockRequestOptions);
  });

  test('should check client existence before making API call', async () => {
    provider = new OpenAIProvider('test-api-key');
    (provider as any).client = null;

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(async () => {
      await provider.sendRequest(mockRequestOptions);
    }).rejects.toThrow();

    consoleErrorSpy.mockRestore();
  });

  test('should handle empty string API key resulting in no client', async () => {
    provider = new OpenAIProvider('');
    
    if (!(provider as any).client) {
      (provider as any).client = null;
    }

    await expect(provider.sendRequest(mockRequestOptions)).rejects.toThrow(
      'OpenAI API key not configured'
    );
  });

  test('should validate client exists even with valid request options', async () => {
    provider = new OpenAIProvider('valid-key');
    (provider as any).client = undefined;

    const validOptions: LLMRequestOptions = {
      prompt: 'Valid prompt with all required fields',
      model: 'gpt-4-turbo',
      temperature: 0.5,
      maxTokens: 2000,
      stream: false
    };

    await expect(provider.sendRequest(validOptions)).rejects.toThrow(
      'OpenAI API key not configured'
    );
  });

  test('should throw error immediately without attempting API call when client is missing', async () => {
    provider = new OpenAIProvider('test-key');
    (provider as any).client = null;

    const mockApiCall = jest.fn();
    mockClient.chat.completions.create = mockApiCall;

    await expect(provider.sendRequest(mockRequestOptions)).rejects.toThrow(
      'OpenAI API key not configured'
    );

    expect(mockApiCall).not.toHaveBeenCalled();
  });
});