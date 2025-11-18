/**
 * Interface for LLM provider implementations
 * Abstracts differences between OpenAI, Claude, and custom providers
 */
export interface LLMRequestOptions {
    model?: string;
    systemPrompt?: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    maxTokens?: number;
    temperature?: number;
    responseFormat?: {
        type: 'json_object' | 'text';
    };
}

export interface LLMResponse {
    content: string;
    finishReason?: string;
    model?: string;
    rawResponse?: any;
}

export interface StructuredOutputResponse<T> {
    data: T;
    requests?: Array<{
        type: 'file' | 'grep';
        path?: string;
        pattern?: string;
        filePattern?: string;
        maxResults?: number;
    }>;
}

/**
 * Common interface for all LLM providers
 */
export interface ILLMProvider {
    /**
     * Check if the provider is configured and ready to use
     */
    isConfigured(): boolean;

    /**
     * Send a request and get a text response
     */
    sendRequest(options: LLMRequestOptions): Promise<LLMResponse>;

    /**
     * Send a request with structured output (JSON)
     * Returns parsed JSON data
     */
    sendStructuredRequest<T>(options: LLMRequestOptions, schema?: any): Promise<StructuredOutputResponse<T>>;

    /**
     * Get the provider name
     */
    getName(): string;
}

