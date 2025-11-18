/**
 * Factory for creating LLM provider instances
 */
import { ILLMProvider } from './ILLMProvider';
import { OpenAIProvider } from './openAIProvider';
import { AnthropicProvider } from './anthropicProvider';
import { getConfigurationManager, LLMProvider as ConfigLLMProvider } from '../../config/configurationManager';

export type LLMProvider = 'openai' | 'claude';

/**
 * Factory for creating and managing LLM provider instances
 */
export class ProviderFactory {
    private openaiProvider: OpenAIProvider | null = null;
    private anthropicProvider: AnthropicProvider | null = null;
    private configManager = getConfigurationManager();

    /**
     * Get the provider instance for the specified provider type
     */
    getProvider(provider: LLMProvider): ILLMProvider {
        switch (provider) {
            case 'openai':
                if (!this.openaiProvider) {
                    this.openaiProvider = new OpenAIProvider();
                }
                return this.openaiProvider;

            case 'claude':
                if (!this.anthropicProvider) {
                    this.anthropicProvider = new AnthropicProvider();
                }
                return this.anthropicProvider;

            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    /**
     * Get the current provider based on configuration
     */
    getCurrentProvider(): ILLMProvider {
        const provider = this.configManager.llmProvider;
        return this.getProvider(provider);
    }

    /**
     * Check if a provider is configured
     */
    isProviderConfigured(provider: LLMProvider): boolean {
        const providerInstance = this.getProvider(provider);
        return providerInstance.isConfigured();
    }

    /**
     * Get all configured providers
     */
    getConfiguredProviders(): LLMProvider[] {
        const providers: LLMProvider[] = [];
        if (this.isProviderConfigured('openai')) {
            providers.push('openai');
        }
        if (this.isProviderConfigured('claude')) {
            providers.push('claude');
        }
        return providers;
    }
}

