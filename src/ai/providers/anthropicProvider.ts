/**
 * Anthropic (Claude) provider implementation
 */
import Anthropic from '@anthropic-ai/sdk';
import { ILLMProvider, LLMRequestOptions, LLMResponse, StructuredOutputResponse } from './ILLMProvider';
import { getConfigurationManager } from '../../config/configurationManager';

export class AnthropicProvider implements ILLMProvider {
    private client: Anthropic | null = null;
    private apiKey: string | null = null;
    private configManager = getConfigurationManager();

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        const apiKey = this.configManager.claudeApiKey;
        if (apiKey && apiKey.length > 0) {
            this.apiKey = apiKey;
            this.client = new Anthropic({
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
        return 'claude';
    }

    async sendRequest(options: LLMRequestOptions): Promise<LLMResponse> {
        if (!this.client) {
            throw new Error('Claude API key not configured');
        }

        // Convert messages format from OpenAI to Claude
        const claudeMessages = options.messages
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));

        const response = await this.client.messages.create({
            model: options.model || 'claude-sonnet-4-5',
            system: options.systemPrompt,
            messages: claudeMessages as any
        });

        // Handle different content block types
        const firstBlock = response.content[0];
        let textContent = '';
        if (firstBlock && 'text' in firstBlock) {
            textContent = firstBlock.text;
        }

        return {
            content: textContent,
            finishReason: response.stop_reason || undefined,
            model: response.model,
            rawResponse: response
        };
    }

    async sendStructuredRequest<T>(
        options: LLMRequestOptions,
        schema: any
    ): Promise<StructuredOutputResponse<T>> {
        if (!this.client) {
            throw new Error('Claude API key not configured');
        }

        // Claude supports structured outputs via beta API
        const claudeMessages = options.messages
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));

        const response = await (this.client as any).beta.messages.create({
            model: options.model || 'claude-sonnet-4-5',
            betas: ['structured-outputs-2025-11-13'],
            system: options.systemPrompt,
            messages: claudeMessages,
            output_format: {
                type: 'json_schema',
                schema: schema
            }
        });

        // Handle different content block types
        const firstBlock = response.content[0];
        let textContent = '';
        if (firstBlock && 'text' in firstBlock) {
            textContent = firstBlock.text;
        }
        
        if (!textContent) {
            throw new Error('No text content in Claude response');
        }

        // Claude structured outputs return valid JSON directly
        const parsed = JSON.parse(textContent) as T;

        // Extract requests if present
        const requests = (parsed as any).requests;

        return {
            data: parsed,
            requests: requests
        };
    }
}

