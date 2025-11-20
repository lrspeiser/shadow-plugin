import { AnthropicProvider } from '../anthropicProvider';
import type { Message, ProviderConfig } from '../../types';

describe('AnthropicProvider - formatRequest text extraction', () => {
  let provider: AnthropicProvider;
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      model: 'claude-3-opus-20240229',
      maxTokens: 1000
    };
    provider = new AnthropicProvider(config);
  });

  test('should extract text from firstBlock when text property exists', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Hello, this is a test message'
          }
        ]
      }
    ];

    const formattedRequest = (provider as any).formatRequest(messages, config.model, config.maxTokens);
    
    expect(formattedRequest.messages).toBeDefined();
    expect(formattedRequest.messages[0].content).toEqual(messages[0].content);
  });

  test('should handle empty text content in firstBlock', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: ''
          }
        ]
      }
    ];

    const formattedRequest = (provider as any).formatRequest(messages, config.model, config.maxTokens);
    
    expect(formattedRequest.messages).toBeDefined();
    expect(formattedRequest.messages[0].content).toEqual(messages[0].content);
  });

  test('should handle firstBlock without text property', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: 'base64data'
            }
          }
        ]
      }
    ];

    const formattedRequest = (provider as any).formatRequest(messages, config.model, config.maxTokens);
    
    expect(formattedRequest.messages).toBeDefined();
    expect(formattedRequest.messages[0].content).toEqual(messages[0].content);
  });

  test('should handle undefined or null firstBlock', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: []
      }
    ];

    const formattedRequest = (provider as any).formatRequest(messages, config.model, config.maxTokens);
    
    expect(formattedRequest.messages).toBeDefined();
    expect(formattedRequest.messages[0].content).toEqual([]);
  });

  test('should handle multiple content blocks with text in first block', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'First text block'
          },
          {
            type: 'text',
            text: 'Second text block'
          }
        ]
      }
    ];

    const formattedRequest = (provider as any).formatRequest(messages, config.model, config.maxTokens);
    
    expect(formattedRequest.messages).toBeDefined();
    expect(formattedRequest.messages[0].content).toEqual(messages[0].content);
  });

  test('should handle string content instead of array', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: 'Simple string message'
      }
    ];

    const formattedRequest = (provider as any).formatRequest(messages, config.model, config.maxTokens);
    
    expect(formattedRequest.messages).toBeDefined();
  });

  test('should preserve message structure in formatted request', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Test message with special characters: !@#$%^&*()'
          }
        ]
      }
    ];

    const formattedRequest = (provider as any).formatRequest(messages, config.model, config.maxTokens);
    
    expect(formattedRequest.model).toBe(config.model);
    expect(formattedRequest.max_tokens).toBe(config.maxTokens);
    expect(formattedRequest.messages).toBeDefined();
    expect(formattedRequest.messages.length).toBe(1);
  });
});