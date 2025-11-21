import Anthropic from '@anthropic-ai/sdk';

// Mocks
jest.mock('@anthropic-ai/sdk');

describe('AnthropicProvider - requests extraction', () => {
  let anthropicProvider: any;
  let mockAnthropicClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Anthropic client
    mockAnthropicClient = {
      messages: {
        create: jest.fn()
      }
    };
    
    (Anthropic as any).mockImplementation(() => mockAnthropicClient);
    
    // Import the provider after mocks are set up
    const AnthropicProviderModule = require('../src/ai/providers/anthropicProvider');
    anthropicProvider = new AnthropicProviderModule.AnthropicProvider('test-api-key');
  });

  describe('request extraction logic', () => {
    test('should extract requests from parsed response', async () => {
      const mockResponse = {
        id: 'msg_123',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { result: 'success' },
              requests: ['request1', 'request2']
            })
          }
        ],
        model: 'claude-3-opus-20240229',
        role: 'assistant',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 20 }
      };

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

      const result = await anthropicProvider.generateResponse('test prompt');

      expect(result.requests).toEqual(['request1', 'request2']);
      expect(result.data).toEqual({ result: 'success' });
    });

    test('should handle response without requests field', async () => {
      const mockResponse = {
        id: 'msg_123',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { result: 'success' }
            })
          }
        ],
        model: 'claude-3-opus-20240229',
        role: 'assistant',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 20 }
      };

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

      const result = await anthropicProvider.generateResponse('test prompt');

      expect(result.requests).toBeUndefined();
      expect(result.data).toEqual({ result: 'success' });
    });

    test('should handle empty requests array', async () => {
      const mockResponse = {
        id: 'msg_123',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { result: 'success' },
              requests: []
            })
          }
        ],
        model: 'claude-3-opus-20240229',
        role: 'assistant',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 20 }
      };

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

      const result = await anthropicProvider.generateResponse('test prompt');

      expect(result.requests).toEqual([]);
      expect(result.data).toEqual({ result: 'success' });
    });

    test('should handle null requests field', async () => {
      const mockResponse = {
        id: 'msg_123',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { result: 'success' },
              requests: null
            })
          }
        ],
        model: 'claude-3-opus-20240229',
        role: 'assistant',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 20 }
      };

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

      const result = await anthropicProvider.generateResponse('test prompt');

      expect(result.requests).toBeNull();
      expect(result.data).toEqual({ result: 'success' });
    });

    test('should handle complex nested requests structure', async () => {
      const complexRequests = [
        { type: 'file', path: '/test/file.ts' },
        { type: 'search', query: 'test' }
      ];
      
      const mockResponse = {
        id: 'msg_123',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { result: 'success' },
              requests: complexRequests
            })
          }
        ],
        model: 'claude-3-opus-20240229',
        role: 'assistant',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 20 }
      };

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

      const result = await anthropicProvider.generateResponse('test prompt');

      expect(result.requests).toEqual(complexRequests);
    });

    test('should handle malformed JSON and trigger catch block', async () => {
      const mockResponse = {
        id: 'msg_123',
        content: [
          {
            type: 'text',
            text: 'Invalid JSON {{{'
          }
        ],
        model: 'claude-3-opus-20240229',
        role: 'assistant',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 20 }
      };

      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);

      await expect(anthropicProvider.generateResponse('test prompt')).rejects.toThrow();
    });
  });
});