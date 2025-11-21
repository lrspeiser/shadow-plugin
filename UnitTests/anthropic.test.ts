import { callAnthropic } from '../anthropic';
import Anthropic from '@anthropic-ai/sdk';

// Mocks
jest.mock('@anthropic-ai/sdk');
jest.mock('../../utils/rateLimiter', () => ({ waitForRateLimit: jest.fn().mockResolvedValue(undefined) }));

import { waitForRateLimit } from '../../utils/rateLimiter';

describe('callAnthropic', () => {
  let mockAnthropicInstance: any;
  let mockMessagesCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMessagesCreate = jest.fn();
    mockAnthropicInstance = {
      messages: {
        create: mockMessagesCreate
      }
    };
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => mockAnthropicInstance);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('happy path', () => {
    test('should successfully call Anthropic API with valid parameters', async () => {
      const mockResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello, how can I help?' }],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 20 }
      };
      mockMessagesCreate.mockResolvedValue(mockResponse);

      const result = await callAnthropic({
        apiKey: 'test-api-key',
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 1024
      });

      expect(waitForRateLimit).toHaveBeenCalledWith('anthropic');
      expect(Anthropic).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
      expect(mockMessagesCreate).toHaveBeenCalledWith({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1024
      });
      expect(result).toEqual(mockResponse);
    });

    test('should handle system messages correctly', async () => {
      const mockResponse = {
        id: 'msg_456',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Response with system context' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 15, output_tokens: 25 }
      };
      mockMessagesCreate.mockResolvedValue(mockResponse);

      const result = await callAnthropic({
        apiKey: 'test-api-key',
        model: 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: 'Test' }],
        maxTokens: 2048,
        system: 'You are a helpful assistant'
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith({
        model: 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 2048,
        system: 'You are a helpful assistant'
      });
      expect(result).toEqual(mockResponse);
    });

    test('should handle temperature parameter', async () => {
      const mockResponse = {
        id: 'msg_789',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Creative response' }],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 15 }
      };
      mockMessagesCreate.mockResolvedValue(mockResponse);

      await callAnthropic({
        apiKey: 'test-api-key',
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Be creative' }],
        maxTokens: 1024,
        temperature: 0.8
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Be creative' }],
        max_tokens: 1024,
        temperature: 0.8
      });
    });
  });

  describe('error handling', () => {
    test('should throw error when API call fails', async () => {
      const apiError = new Error('API Error: Invalid API key');
      mockMessagesCreate.mockRejectedValue(apiError);

      await expect(callAnthropic({
        apiKey: 'invalid-key',
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 1024
      })).rejects.toThrow('API Error: Invalid API key');

      expect(mockMessagesCreate).toHaveBeenCalled();
    });

    test('should throw error when rate limit is exceeded', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      mockMessagesCreate.mockRejectedValue(rateLimitError);

      await expect(callAnthropic({
        apiKey: 'test-api-key',
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 1024
      })).rejects.toThrow('Rate limit exceeded');
    });

    test('should throw error for invalid model', async () => {
      const invalidModelError = new Error('Invalid model specified');
      mockMessagesCreate.mockRejectedValue(invalidModelError);

      await expect(callAnthropic({
        apiKey: 'test-api-key',
        model: 'invalid-model',
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 1024
      })).rejects.toThrow('Invalid model specified');
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockMessagesCreate.mockRejectedValue(networkError);

      await expect(callAnthropic({
        apiKey: 'test-api-key',
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 1024
      })).rejects.toThrow('Network connection failed');
    });
  });

  describe('edge cases', () => {
    test('should handle empty messages array', async () => {
      const mockResponse = {
        id: 'msg_empty',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Empty response' }],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 0, output_tokens: 5 }
      };
      mockMessagesCreate.mockResolvedValue(mockResponse);

      const result = await callAnthropic({
        apiKey: 'test-api-key',
        model: 'claude-3-opus-20240229',
        messages: [],
        maxTokens: 1024
      });

      expect(result).toEqual(mockResponse);
    });

    test('should handle very long messages', async () => {
      const longContent = 'a'.repeat(10000);
      const mockResponse = {
        id: 'msg_long',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Response to long message' }],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 5000, output_tokens: 10 }
      };
      mockMessagesCreate.mockResolvedValue(mockResponse);

      const result = await callAnthropic({
        apiKey: 'test-api-key',
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: longContent }],
        maxTokens: 4096
      });

      expect(result).toEqual(mockResponse);
      expect(mockMessagesCreate).toHaveBeenCalledWith(expect.objectContaining({
        messages: [{ role: 'user', content: longContent }]
      }));
    });

    test('should handle minimum maxTokens value', async () => {
      const mockResponse = {
        id: 'msg_min',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hi' }],
        model: 'claude-3-opus-20240229',
        stop_reason: 'max_tokens',
        usage: { input_tokens: 5, output_tokens: 1 }
      };
      mockMessagesCreate.mockResolvedValue(mockResponse);

      const result = await callAnthropic({
        apiKey: 'test-api-key',
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 1
      });

      expect(result).toEqual(mockResponse);
    });

    test('should respect rate limiter call', async () => {
      const mockResponse = {
        id: 'msg_rate',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Rate limited response' }],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 10 }
      };
      mockMessagesCreate.mockResolvedValue(mockResponse);

      await callAnthropic({
        apiKey: 'test-api-key',
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Test' }],
        maxTokens: 1024
      });

      expect(waitForRateLimit).toHaveBeenCalledTimes(1);
      expect(waitForRateLimit).toHaveBeenCalledBefore(mockMessagesCreate);
    });
  });
});