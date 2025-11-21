import { OpenAIProvider } from '../src/ai/providers/openAIProvider';
import { AIProviderOptions } from '../src/ai/types';

// Mocks
jest.mock('openai');

describe('OpenAIProvider - model fallback loop', () => {
  let provider: OpenAIProvider;
  let mockSendRequest: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    provider = new OpenAIProvider();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    mockSendRequest = jest.spyOn(provider as any, 'sendRequest');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return response on first successful model', async () => {
    const models = ['gpt-4', 'gpt-3.5-turbo'];
    const options: AIProviderOptions = {
      prompt: 'Test prompt',
      maxTokens: 100
    };
    const expectedResponse = { content: 'Success response' };

    mockSendRequest.mockResolvedValueOnce(expectedResponse);

    let lastError: any;
    let result: any;
    for (const model of models) {
      try {
        console.log(`Trying OpenAI model: ${model}`);
        const response = await mockSendRequest({
          ...options,
          model
        });
        console.log(`✅ Successfully used OpenAI model: ${model}`);
        result = response;
        break;
      } catch (error: any) {
        console.log(`❌ OpenAI model ${model} failed:`, error.message);
        lastError = error;
      }
    }

    expect(result).toEqual(expectedResponse);
    expect(consoleLogSpy).toHaveBeenCalledWith('Trying OpenAI model: gpt-4');
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ Successfully used OpenAI model: gpt-4');
    expect(mockSendRequest).toHaveBeenCalledTimes(1);
  });

  test('should try second model when first fails', async () => {
    const models = ['gpt-4', 'gpt-3.5-turbo'];
    const options: AIProviderOptions = {
      prompt: 'Test prompt',
      maxTokens: 100
    };
    const expectedResponse = { content: 'Success from second model' };
    const firstError = new Error('Model not available');

    mockSendRequest
      .mockRejectedValueOnce(firstError)
      .mockResolvedValueOnce(expectedResponse);

    let lastError: any;
    let result: any;
    for (const model of models) {
      try {
        console.log(`Trying OpenAI model: ${model}`);
        const response = await mockSendRequest({
          ...options,
          model
        });
        console.log(`✅ Successfully used OpenAI model: ${model}`);
        result = response;
        break;
      } catch (error: any) {
        console.log(`❌ OpenAI model ${model} failed:`, error.message);
        lastError = error;
      }
    }

    expect(result).toEqual(expectedResponse);
    expect(consoleLogSpy).toHaveBeenCalledWith('Trying OpenAI model: gpt-4');
    expect(consoleLogSpy).toHaveBeenCalledWith('❌ OpenAI model gpt-4 failed:', 'Model not available');
    expect(consoleLogSpy).toHaveBeenCalledWith('Trying OpenAI model: gpt-3.5-turbo');
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ Successfully used OpenAI model: gpt-3.5-turbo');
    expect(mockSendRequest).toHaveBeenCalledTimes(2);
  });

  test('should store lastError when all models fail', async () => {
    const models = ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'];
    const options: AIProviderOptions = {
      prompt: 'Test prompt',
      maxTokens: 100
    };
    const error1 = new Error('Model 1 failed');
    const error2 = new Error('Model 2 failed');
    const error3 = new Error('Model 3 failed');

    mockSendRequest
      .mockRejectedValueOnce(error1)
      .mockRejectedValueOnce(error2)
      .mockRejectedValueOnce(error3);

    let lastError: any;
    let result: any;
    for (const model of models) {
      try {
        console.log(`Trying OpenAI model: ${model}`);
        const response = await mockSendRequest({
          ...options,
          model
        });
        console.log(`✅ Successfully used OpenAI model: ${model}`);
        result = response;
        break;
      } catch (error: any) {
        console.log(`❌ OpenAI model ${model} failed:`, error.message);
        lastError = error;
      }
    }

    expect(result).toBeUndefined();
    expect(lastError).toEqual(error3);
    expect(consoleLogSpy).toHaveBeenCalledWith('❌ OpenAI model gpt-4 failed:', 'Model 1 failed');
    expect(consoleLogSpy).toHaveBeenCalledWith('❌ OpenAI model gpt-3.5-turbo failed:', 'Model 2 failed');
    expect(consoleLogSpy).toHaveBeenCalledWith('❌ OpenAI model gpt-4-turbo failed:', 'Model 3 failed');
    expect(mockSendRequest).toHaveBeenCalledTimes(3);
  });

  test('should handle empty models array', async () => {
    const models: string[] = [];
    const options: AIProviderOptions = {
      prompt: 'Test prompt',
      maxTokens: 100
    };

    let lastError: any;
    let result: any;
    for (const model of models) {
      try {
        console.log(`Trying OpenAI model: ${model}`);
        const response = await mockSendRequest({
          ...options,
          model
        });
        console.log(`✅ Successfully used OpenAI model: ${model}`);
        result = response;
        break;
      } catch (error: any) {
        console.log(`❌ OpenAI model ${model} failed:`, error.message);
        lastError = error;
      }
    }

    expect(result).toBeUndefined();
    expect(lastError).toBeUndefined();
    expect(mockSendRequest).not.toHaveBeenCalled();
  });

  test('should pass model in options to sendRequest', async () => {
    const models = ['gpt-4'];
    const options: AIProviderOptions = {
      prompt: 'Test prompt',
      maxTokens: 100,
      temperature: 0.7
    };
    const expectedResponse = { content: 'Success' };

    mockSendRequest.mockResolvedValueOnce(expectedResponse);

    let lastError: any;
    let result: any;
    for (const model of models) {
      try {
        console.log(`Trying OpenAI model: ${model}`);
        const response = await mockSendRequest({
          ...options,
          model
        });
        console.log(`✅ Successfully used OpenAI model: ${model}`);
        result = response;
        break;
      } catch (error: any) {
        console.log(`❌ OpenAI model ${model} failed:`, error.message);
        lastError = error;
      }
    }

    expect(mockSendRequest).toHaveBeenCalledWith({
      prompt: 'Test prompt',
      maxTokens: 100,
      temperature: 0.7,
      model: 'gpt-4'
    });
  });
});