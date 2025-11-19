import { OpenAIProvider } from '../ai/providers/openAIProvider';
import { ConfigurationManager } from '../config/configurationManager';
import { AnthropicProvider } from '../ai/providers/anthropicProvider';
import { ProviderFactory } from '../ai/providers/providerFactory';

// Test: test_OpenAIProvider_sends_requests
// Verifies OpenAI provider sends requests with correct format and handles responses
import { OpenAIProvider } from '../ai/providers/openAIProvider';
import { ConfigurationManager } from '../config/configurationManager';

jest.mock('../config/configurationManager');
jest.mock('openai');

describe('OpenAIProvider.sendRequest', () => {
  let provider: OpenAIProvider;
  let mockConfig: any;
  let mockOpenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      getOpenAIApiKey: jest.fn().mockReturnValue('test-key'),
      getOpenAIModel: jest.fn().mockReturnValue('gpt-4')
    };
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'test response' } }],
            usage: { total_tokens: 100 }
          })
        }
      }
    };
    (ConfigurationManager.getInstance as jest.Mock).mockReturnValue(mockConfig);
    provider = new OpenAIProvider();
    (provider as any).client = mockOpenAI;
  });

  it('should call OpenAI API with correct parameters', async () => {
    const request = {
      messages: [{ role: 'user', content: 'test prompt' }],
      model: 'gpt-4'
    };

    await provider.sendRequest(request);

    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4',
        messages: expect.arrayContaining([expect.objectContaining({ role: 'user' })])
      })
    );
  });

  it('should return formatted response', async () => {
    const request = { messages: [{ role: 'user', content: 'test' }], model: 'gpt-4' };

    const result = await provider.sendRequest(request);

    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('usage');
    expect(result.content).toBe('test response');
  });

  it('should handle API errors', async () => {
    mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));
    const request = { messages: [{ role: 'user', content: 'test' }], model: 'gpt-4' };

    await expect(provider.sendRequest(request)).rejects.toThrow('API Error');
  });

  it('should include API key in authentication', async () => {
    const request = { messages: [{ role: 'user', content: 'test' }], model: 'gpt-4' };

    await provider.sendRequest(request);

    expect(mockConfig.getOpenAIApiKey).toHaveBeenCalled();
  });
});

// Test: test_AnthropicProvider_sends_requests
// Verifies Anthropic provider sends requests with correct format for Claude API
import { AnthropicProvider } from '../ai/providers/anthropicProvider';
import { ConfigurationManager } from '../config/configurationManager';

jest.mock('../config/configurationManager');
jest.mock('@anthropic-ai/sdk');

describe('AnthropicProvider.sendRequest', () => {
  let provider: AnthropicProvider;
  let mockConfig: any;
  let mockAnthropic: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      getClaudeApiKey: jest.fn().mockReturnValue('test-key'),
      getClaudeModel: jest.fn().mockReturnValue('claude-3-opus-20240229')
    };
    mockAnthropic = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: 'test response' }],
          usage: { input_tokens: 50, output_tokens: 50 }
        })
      }
    };
    (ConfigurationManager.getInstance as jest.Mock).mockReturnValue(mockConfig);
    provider = new AnthropicProvider();
    (provider as any).client = mockAnthropic;
  });

  it('should call Claude API with correct parameters', async () => {
    const request = {
      messages: [{ role: 'user', content: 'test prompt' }],
      model: 'claude-3-opus-20240229'
    };

    await provider.sendRequest(request);

    expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-3-opus-20240229',
        messages: expect.arrayContaining([expect.objectContaining({ role: 'user' })])
      })
    );
  });

  it('should return formatted response', async () => {
    const request = { messages: [{ role: 'user', content: 'test' }], model: 'claude-3-opus-20240229' };

    const result = await provider.sendRequest(request);

    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('usage');
    expect(result.content).toBe('test response');
  });

  it('should handle API errors', async () => {
    mockAnthropic.messages.create.mockRejectedValue(new Error('API Error'));
    const request = { messages: [{ role: 'user', content: 'test' }], model: 'claude-3-opus-20240229' };

    await expect(provider.sendRequest(request)).rejects.toThrow('API Error');
  });

  it('should include API key in authentication', async () => {
    const request = { messages: [{ role: 'user', content: 'test' }], model: 'claude-3-opus-20240229' };

    await provider.sendRequest(request);

    expect(mockConfig.getClaudeApiKey).toHaveBeenCalled();
  });
});

// Test: test_ProviderFactory_creates_correct_provider
// Verifies provider factory creates correct provider based on configuration
import { ProviderFactory } from '../ai/providers/providerFactory';
import { ConfigurationManager } from '../config/configurationManager';
import { OpenAIProvider } from '../ai/providers/openAIProvider';
import { AnthropicProvider } from '../ai/providers/anthropicProvider';

jest.mock('../config/configurationManager');

describe('ProviderFactory.createProvider', () => {
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      getProvider: jest.fn(),
      getOpenAIApiKey: jest.fn().mockReturnValue('test-key'),
      getClaudeApiKey: jest.fn().mockReturnValue('test-key')
    };
    (ConfigurationManager.getInstance as jest.Mock).mockReturnValue(mockConfig);
  });

  it('should create OpenAI provider when configured', () => {
    mockConfig.getProvider.mockReturnValue('openai');

    const provider = ProviderFactory.createProvider();

    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should create Anthropic provider when configured', () => {
    mockConfig.getProvider.mockReturnValue('anthropic');

    const provider = ProviderFactory.createProvider();

    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it('should throw error for unknown provider', () => {
    mockConfig.getProvider.mockReturnValue('unknown');

    expect(() => ProviderFactory.createProvider()).toThrow();
  });

  it('should validate configuration before creating provider', () => {
    mockConfig.getProvider.mockReturnValue('openai');
    mockConfig.getOpenAIApiKey.mockReturnValue(undefined);

    expect(() => ProviderFactory.createProvider()).toThrow();
  });
});
