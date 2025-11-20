import { AnthropicProvider } from '../anthropicProvider';
import { LLMRequestOptions, LLMResponse } from '../../types';
import Anthropic from '@anthropic-ai/sdk';

// Mocks
jest.mock('@anthropic-ai/sdk');
jest.mock('../../../utils/rateLimiter');
jest.mock('../../../utils/retryHandler');

import { AnthropicProvider } from '../anthropicProvider';
import { LLMRequestOptions, LLMResponse } from '../../types';
import Anthropic from '@anthropic-ai/sdk';

jest.mock('@anthropic-ai/sdk');
jest.mock('../../../utils/rateLimiter', () => ({
  rateLimiter: {
    acquire: jest.fn().mockResolvedValue(undefined),
    release: jest.fn()
  }
}));
jest.mock('../../../utils/retryHandler', () => ({
  retryHandler: {
    execute: jest.fn((fn) => fn())
  }
}));

describe('AnthropicProvider - sendRequest', () => {
  let provider: AnthropicProvider;
  let mockAnthropicClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAnthropicClient = {
      messages: {
        create: jest.fn()
      }
    };
    
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => mockAnthropicClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should throw error when client is not configured', async () => {
    const provider = new AnthropicProvider();
    (provider as any).client = null;
    
    const options: LLMRequestOptions = {
      prompt: 'Test prompt',
      model: 'claude-3-opus-20240229',
      maxTokens: 1000
    };

    await expect(provider.sendRequest(options)).rejects.toThrow('Claude API key not configured');
  });

  test('should throw error when API key is undefined', async () => {
    const provider = new AnthropicProvider();
    (provider as any).client = undefined;
    
    const options: LLMRequestOptions = {
      prompt: 'Test prompt',
      model: 'claude-3-opus-20240229',
      maxTokens: 1000
    };

    await expect(provider.sendRequest(options)).rejects.toThrow('Claude API key not configured');
  });

  test('should throw error when client is explicitly set to null', async () => {
    const provider = new AnthropicProvider('test-api-key');
    (provider as any).client = null;
    
    const options: LLMRequestOptions = {
      prompt: 'Test prompt',
      model: 'claude-3-opus-20240229',
      maxTokens: 1000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful assistant'
    };

    await expect(provider.sendRequest(options)).rejects.toThrow('Claude API key not configured');
  });

  test('should not throw error when client is properly initialized', async () => {
    const provider = new AnthropicProvider('test-api-key');
    
    mockAnthropicClient.messages.create.mockResolvedValue({
      id: 'msg_123',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Test response' }],
      model: 'claude-3-opus-20240229',
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 20 }
    });
    
    const options: LLMRequestOptions = {
      prompt: 'Test prompt',
      model: 'claude-3-opus-20240229',
      maxTokens: 1000
    };

    const response = await provider.sendRequest(options);
    
    expect(response).toBeDefined();
    expect(mockAnthropicClient.messages.create).toHaveBeenCalled();
  });

  test('should handle empty API key string as unconfigured', async () => {
    const provider = new AnthropicProvider('');
    (provider as any).client = null;
    
    const options: LLMRequestOptions = {
      prompt: 'Test prompt',
      model: 'claude-3-opus-20240229',
      maxTokens: 1000
    };

    await expect(provider.sendRequest(options)).rejects.toThrow('Claude API key not configured');
  });

  test('should verify error message is exact match', async () => {
    const provider = new AnthropicProvider();
    (provider as any).client = null;
    
    const options: LLMRequestOptions = {
      prompt: 'Test prompt',
      model: 'claude-3-opus-20240229',
      maxTokens: 1000
    };

    try {
      await provider.sendRequest(options);
      fail('Expected error to be thrown');
    } catch (error: any) {
      expect(error.message).toBe('Claude API key not configured');
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('should handle client becoming null after initialization', async () => {
    const provider = new AnthropicProvider('test-api-key');
    
    const options: LLMRequestOptions = {
      prompt: 'Test prompt',
      model: 'claude-3-opus-20240229',
      maxTokens: 1000
    };
    
    (provider as any).client = null;

    await expect(provider.sendRequest(options)).rejects.toThrow('Claude API key not configured');
  });
});