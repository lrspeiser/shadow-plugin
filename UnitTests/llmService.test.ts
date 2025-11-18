import { LLMService } from '../llmService';
import { ILLMProvider } from '../ai/providers/ILLMProvider';
import { ConfigurationManager } from '../config/configurationManager';

// Test: test_sendRequest_formatsAndSendsCorrectly
// Verifies sendRequest properly formats prompts and sends to configured provider
import { LLMService } from '../llmService';
import { ILLMProvider } from '../ai/providers/ILLMProvider';
import { ConfigurationManager } from '../config/configurationManager';

jest.mock('../config/configurationManager');

const mockProvider: ILLMProvider = {
  getName: jest.fn().mockReturnValue('openai'),
  sendRequest: jest.fn().mockResolvedValue({ content: '{"result": "success"}', usage: { totalTokens: 100 } }),
  validateConfiguration: jest.fn().mockReturnValue(true)
};

const mockConfig = {
  getCurrentProvider: jest.fn().mockReturnValue('openai'),
  getOpenAIKey: jest.fn().mockReturnValue('test-key'),
  getMaxTokens: jest.fn().mockReturnValue(4000)
} as any;

describe('LLMService.sendRequest', () => {
  let llmService: LLMService;

  beforeEach(() => {
    (ConfigurationManager.getInstance as jest.Mock).mockReturnValue(mockConfig);
    llmService = new LLMService(mockProvider);
  });

  test('formats and sends request to provider correctly', async () => {
    const prompt = 'Analyze this code';
    const schema = { type: 'object', properties: { result: { type: 'string' } } };

    const result = await llmService.sendRequest(prompt, schema, 2000);

    expect(mockProvider.sendRequest).toHaveBeenCalled();
    const callArgs = (mockProvider.sendRequest as jest.Mock).mock.calls[0][0];
    expect(callArgs.messages).toBeDefined();
    expect(callArgs.messages.length).toBeGreaterThan(0);
    expect(result).toBeDefined();
  });

  test('includes token budget in request', async () => {
    const prompt = 'Test prompt';
    const tokenBudget = 3000;

    await llmService.sendRequest(prompt, {}, tokenBudget);

    expect(mockProvider.sendRequest).toHaveBeenCalled();
    const callArgs = (mockProvider.sendRequest as jest.Mock).mock.calls[0][0];
    expect(callArgs.maxTokens).toBeLessThanOrEqual(tokenBudget);
  });

  test('handles provider errors gracefully', async () => {
    (mockProvider.sendRequest as jest.Mock).mockRejectedValue(new Error('API Error'));

    await expect(llmService.sendRequest('prompt', {}, 1000)).rejects.toThrow();
  });
});

// Test: test_parseResponse_handlesValidAndInvalidJSON
// Verifies response parsing handles valid JSON, malformed JSON, and non-JSON responses
import { LLMService } from '../llmService';

describe('LLMService.parseResponse', () => {
  let llmService: LLMService;

  beforeEach(() => {
    const mockProvider = {
      getName: jest.fn().mockReturnValue('test'),
      sendRequest: jest.fn(),
      validateConfiguration: jest.fn().mockReturnValue(true)
    };
    llmService = new LLMService(mockProvider as any);
  });

  test('parses valid JSON response correctly', () => {
    const validJSON = '{"analysis": {"result": "success"}, "confidence": 0.95}';

    const result = llmService.parseResponse(validJSON);

    expect(result).toEqual({ analysis: { result: 'success' }, confidence: 0.95 });
  });

  test('extracts JSON from markdown code blocks', () => {
    const markdownJSON = '\n{"data": "value"}\n';

    const result = llmService.parseResponse(markdownJSON);

    expect(result).toEqual({ data: 'value' });
  });

  test('throws error for malformed JSON', () => {
    const malformedJSON = '{invalid json';

    expect(() => llmService.parseResponse(malformedJSON)).toThrow();
  });

  test('handles non-JSON text response', () => {
    const textResponse = 'This is plain text without JSON';

    expect(() => llmService.parseResponse(textResponse)).toThrow();
  });

  test('handles empty response', () => {
    const emptyResponse = '';

    expect(() => llmService.parseResponse(emptyResponse)).toThrow();
  });
});
