/**
 * OpenAI provider implementation
 */
import { OpenAI } from 'openai';
import { ILLMProvider, LLMRequestOptions, LLMResponse, StructuredOutputResponse } from './ILLMProvider';
import { getConfigurationManager } from '../../config/configurationManager';

export class OpenAIProvider implements ILLMProvider {
    private client: OpenAI | null = null;
    private apiKey: string | null = null;
    private configManager = getConfigurationManager();

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        const apiKey = this.configManager.openaiApiKey;
        if (apiKey && apiKey.length > 0) {
            this.apiKey = apiKey;
            this.client = new OpenAI({
                apiKey: this.apiKey,
                timeout: 300000 // 5 minutes
            });
        } else {
            this.apiKey = null;
            this.client = null;
        }
    }

    isConfigured(): boolean {
        return this.client !== null;
    }

    getName(): string {
        return 'openai';
    }

    async sendRequest(options: LLMRequestOptions): Promise<LLMResponse> {
        if (!this.client) {
            throw new Error('OpenAI API key not configured');
        }

        const messages = options.systemPrompt
            ? [
                  { role: 'system' as const, content: options.systemPrompt },
                  ...options.messages
              ]
            : options.messages;

        const response = await this.client.chat.completions.create({
            model: options.model || 'gpt-4o',
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            temperature: options.temperature,
            response_format: options.responseFormat
        });

        const firstChoice = response.choices?.[0];
        const content = firstChoice?.message?.content || '';

        return {
            content,
            finishReason: firstChoice?.finish_reason,
            model: response.model,
            rawResponse: response
        };
    }

    async sendStructuredRequest<T>(
        options: LLMRequestOptions,
        schema?: any
    ): Promise<StructuredOutputResponse<T>> {
        // OpenAI doesn't have native structured outputs like Claude
        // We need to request JSON format and parse it
        const response = await this.sendRequest({
            ...options,
            responseFormat: {
                type: 'json_object'
            }
        });

        try {
            const parsed = JSON.parse(response.content) as T;
            return {
                data: parsed
            };
        } catch (error) {
            throw new Error(`Failed to parse OpenAI JSON response: ${error}`);
        }
    }

    /**
     * Try multiple models in sequence until one succeeds
     */
    async sendRequestWithFallback(
        options: LLMRequestOptions,
        models: string[] = ['gpt-5.1', 'gpt-5', 'gpt-4o', 'gpt-4-turbo']
    ): Promise<LLMResponse> {
        if (!this.client) {
            throw new Error('OpenAI API key not configured');
        }

        let lastError: any = null;

        for (const model of models) {
            try {
                console.log(`Trying OpenAI model: ${model}`);
                const response = await this.sendRequest({
                    ...options,
                    model
                });
                console.log(`✅ Successfully used OpenAI model: ${model}`);
                return response;
            } catch (error: any) {
                console.log(`❌ OpenAI model ${model} failed:`, error.message);
                lastError = error;
            }
        }

        const errorDetails = lastError?.response?.data
            ? JSON.stringify(lastError.response.data, null, 2)
            : lastError?.message || 'Unknown error';
        throw new Error(`All OpenAI models failed. Last error: ${errorDetails}`);
    }
}

