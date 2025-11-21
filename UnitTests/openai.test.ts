import { callOpenAI } from '../openai';
import axios from 'axios';
import OpenAI from 'openai';

// Mocks
jest.mock('openai');
jest.mock('axios');

describe('callOpenAI', () => {
  let mockOpenAIInstance: any;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate = jest.fn();
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAIInstance);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Happy Path', () => {
    test('should successfully call OpenAI API and return response', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: 'This is a test response'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await callOpenAI({
        apiKey: 'test-api-key',
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4'
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }]
      }));
      expect(result).toEqual(mockResponse);
    });

    test('should handle streaming responses', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'chunk1' } }] };
          yield { choices: [{ delta: { content: 'chunk2' } }] };
        }
      };
      mockCreate.mockResolvedValue(mockStream);

      const result = await callOpenAI({
        apiKey: 'test-api-key',
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4',
        stream: true
      });

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        stream: true
      }));
      expect(result).toBeDefined();
    });

    test('should pass additional parameters to OpenAI', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [{ message: { role: 'assistant', content: 'Response' } }]
      };
      mockCreate.mockResolvedValue(mockResponse);

      await callOpenAI({
        apiKey: 'test-api-key',
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 100,
        topP: 0.9
      });

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        temperature: 0.7,
        max_tokens: 100,
        top_p: 0.9
      }));
    });
  });

  describe('Error Handling', () => {
    test('should handle API rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      mockCreate.mockRejectedValue(rateLimitError);

      await expect(callOpenAI({
        apiKey: 'test-api-key',
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4'
      })).rejects.toThrow('Rate limit exceeded');
    });

    test('should handle authentication errors', async () => {
      const authError = new Error('Invalid API key');
      (authError as any).status = 401;
      mockCreate.mockRejectedValue(authError);

      await expect(callOpenAI({
        apiKey: 'invalid-key',
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4'
      })).rejects.toThrow('Invalid API key');
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'ECONNREFUSED';
      mockCreate.mockRejectedValue(networkError);

      await expect(callOpenAI({
        apiKey: 'test-api-key',
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4'
      })).rejects.toThrow('Network error');
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockCreate.mockRejectedValue(timeoutError);

      await expect(callOpenAI({
        apiKey: 'test-api-key',
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4'
      })).rejects.toThrow('Request timeout');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty messages array', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [{ message: { role: 'assistant', content: 'Response' } }]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await callOpenAI({
        apiKey: 'test-api-key',
        messages: [],
        model: 'gpt-4'
      });

      expect(result).toEqual(mockResponse);
    });

    test('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(10000);
      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [{ message: { role: 'assistant', content: 'Response' } }]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await callOpenAI({
        apiKey: 'test-api-key',
        messages: [{ role: 'user', content: longMessage }],
        model: 'gpt-4'
      });

      expect(result).toEqual(mockResponse);
    });

    test('should handle multiple message history', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [{ message: { role: 'assistant', content: 'Response' } }]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const messages = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer' },
        { role: 'user', content: 'Second question' }
      ];

      await callOpenAI({
        apiKey: 'test-api-key',
        messages,
        model: 'gpt-4'
      });

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        messages
      }));
    });

    test('should handle special characters in messages', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [{ message: { role: 'assistant', content: 'Response' } }]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const specialMessage = 'Test with special chars: \n\t\r\"\'\\';

      await callOpenAI({
        apiKey: 'test-api-key',
        messages: [{ role: 'user', content: specialMessage }],
        model: 'gpt-4'
      });

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        messages: [{ role: 'user', content: specialMessage }]
      }));
    });
  });

  describe('Rate Limiting', () => {
    test('should respect rate limits', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [{ message: { role: 'assistant', content: 'Response' } }]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const calls = [];
      for (let i = 0; i < 5; i++) {
        calls.push(callOpenAI({
          apiKey: 'test-api-key',
          messages: [{ role: 'user', content: `Message ${i}` }],
          model: 'gpt-4'
        }));
      }

      await Promise.all(calls);
      expect(mockCreate).toHaveBeenCalledTimes(5);
    });
  });
});