/**
 * Anthropic (Claude) provider implementation
 */
import Anthropic from '@anthropic-ai/sdk';
import { ILLMProvider, LLMRequestOptions, LLMResponse, StructuredOutputResponse } from './ILLMProvider';
import { getConfigurationManager } from '../../config/configurationManager';
import { extractJSON } from '../../utils/jsonExtractor';
import { SWLogger } from '../../logger';

// Track LLM call statistics
let llmCallCount = 0;
let totalInputTokens = 0;
let totalOutputTokens = 0;

export function getLLMStats() {
    return { callCount: llmCallCount, inputTokens: totalInputTokens, outputTokens: totalOutputTokens };
}

export function resetLLMStats() {
    llmCallCount = 0;
    totalInputTokens = 0;
    totalOutputTokens = 0;
}

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

        // Log the call before making it
        llmCallCount++;
        const callId = llmCallCount;
        const promptLength = (options.systemPrompt?.length || 0) + claudeMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
        SWLogger.log(`[LLM Call #${callId}] Claude sendRequest - prompt chars: ${promptLength}`);
        const startTime = Date.now();

        const response = await this.client.messages.create({
            model: options.model || 'claude-opus-4-5',
            system: options.systemPrompt,
            messages: claudeMessages as any,
            max_tokens: options.maxTokens || 16000 // Claude Opus max output is 32K
        });

        // Log token usage
        const inputTokens = (response as any).usage?.input_tokens || 0;
        const outputTokens = (response as any).usage?.output_tokens || 0;
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;
        const elapsed = Date.now() - startTime;
        SWLogger.log(`[LLM Call #${callId}] Claude response - input: ${inputTokens} tokens, output: ${outputTokens} tokens, time: ${elapsed}ms`);
        SWLogger.log(`[LLM Call #${callId}] Running totals - calls: ${llmCallCount}, input: ${totalInputTokens}, output: ${totalOutputTokens}`);

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

        // Log the call before making it
        llmCallCount++;
        const callId = llmCallCount;
        const promptLength = (options.systemPrompt?.length || 0) + claudeMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
        SWLogger.log(`[LLM Call #${callId}] Claude sendStructuredRequest - prompt chars: ${promptLength}`);
        const startTime = Date.now();

        const response = await (this.client as any).beta.messages.create({
            model: options.model || 'claude-opus-4-5',
            betas: ['structured-outputs-2025-11-13'],
            system: options.systemPrompt,
            messages: claudeMessages,
            max_tokens: options.maxTokens || 16000, // Claude Opus max output is 32K
            output_format: {
                type: 'json_schema',
                schema: schema
            }
        });

        // Log token usage
        const inputTokens = (response as any).usage?.input_tokens || 0;
        const outputTokens = (response as any).usage?.output_tokens || 0;
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;
        const elapsed = Date.now() - startTime;
        SWLogger.log(`[LLM Call #${callId}] Claude structured response - input: ${inputTokens} tokens, output: ${outputTokens} tokens, time: ${elapsed}ms`);
        SWLogger.log(`[LLM Call #${callId}] Running totals - calls: ${llmCallCount}, input: ${totalInputTokens}, output: ${totalOutputTokens}`);

        // Handle different content block types
        const firstBlock = response.content[0];
        let textContent = '';
        if (firstBlock && 'text' in firstBlock) {
            textContent = firstBlock.text;
        }
        
        if (!textContent) {
            throw new Error('No text content in Claude response');
        }

        // Claude structured outputs SHOULD return valid JSON directly,
        // but we use extractJSON as a defensive measure
        try {
            // First try direct parse since Claude structured outputs are reliable
            const parsed = JSON.parse(textContent) as T;
            
            // Extract requests if present
            const requests = (parsed as any).requests;
            
            return {
                data: parsed,
                requests: requests
            };
        } catch (error) {
            // Fallback to robust extraction if direct parsing fails
            console.warn('Claude structured output failed direct JSON.parse, using extractJSON fallback');
            const parsed = extractJSON(textContent);
            if (parsed === null) {
                console.error('Failed to extract JSON from Claude response');
                console.error('Response content (first 1000 chars):', textContent.substring(0, 1000));
                console.error('Response content (last 1000 chars):', textContent.substring(Math.max(0, textContent.length - 1000)));
                throw new Error('Failed to extract valid JSON from Claude response');
            }
            
            // Extract requests if present
            const requests = (parsed as any).requests;
            
            return {
                data: parsed as T,
                requests: requests
            };
        }
    }
}

