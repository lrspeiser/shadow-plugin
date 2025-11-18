/**
 * Rate Limiter for LLM API requests
 * Prevents exceeding API rate limits by tracking request timestamps
 */
export type LLMProvider = 'openai' | 'claude';

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

/**
 * Rate limiter for LLM API requests
 * Tracks request timestamps per provider to enforce rate limits
 */
export class RateLimiter {
    private requestHistory: Map<LLMProvider, number[]> = new Map();
    private configs: Map<LLMProvider, RateLimitConfig> = new Map();

    constructor() {
        // Default rate limits (can be configured)
        // OpenAI: 60 requests per minute
        this.configs.set('openai', {
            maxRequests: 60,
            windowMs: 60000 // 1 minute
        });

        // Claude: 50 requests per minute
        this.configs.set('claude', {
            maxRequests: 50,
            windowMs: 60000 // 1 minute
        });
    }

    /**
     * Configure rate limits for a provider
     */
    configure(provider: LLMProvider, config: RateLimitConfig): void {
        this.configs.set(provider, config);
    }

    /**
     * Check if a request can be made for the given provider
     */
    canMakeRequest(provider: LLMProvider): boolean {
        const config = this.configs.get(provider);
        if (!config) {
            return true; // No limit configured
        }

        const history = this.requestHistory.get(provider) || [];
        const now = Date.now();
        const windowStart = now - config.windowMs;

        // Remove old requests outside the window
        const recentRequests = history.filter(timestamp => timestamp > windowStart);

        // Check if we're under the limit
        return recentRequests.length < config.maxRequests;
    }

    /**
     * Record a request for the given provider
     */
    recordRequest(provider: LLMProvider): void {
        const history = this.requestHistory.get(provider) || [];
        history.push(Date.now());
        this.requestHistory.set(provider, history);
    }

    /**
     * Wait until a request can be made (if rate limited)
     * Returns immediately if no wait is needed
     */
    async waitUntilAvailable(provider: LLMProvider): Promise<void> {
        if (this.canMakeRequest(provider)) {
            return;
        }

        const config = this.configs.get(provider);
        if (!config) {
            return;
        }

        const history = this.requestHistory.get(provider) || [];
        const now = Date.now();
        const windowStart = now - config.windowMs;

        // Find the oldest request in the current window
        const recentRequests = history.filter(timestamp => timestamp > windowStart);
        if (recentRequests.length === 0) {
            return;
        }

        // Sort to find the oldest
        recentRequests.sort((a, b) => a - b);
        const oldestRequest = recentRequests[0];

        // Calculate how long to wait
        const waitTime = (oldestRequest + config.windowMs) - now + 100; // Add 100ms buffer

        if (waitTime > 0) {
            console.log(`Rate limit reached for ${provider}. Waiting ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    /**
     * Get the number of requests made in the current window
     */
    getRequestCount(provider: LLMProvider): number {
        const config = this.configs.get(provider);
        if (!config) {
            return 0;
        }

        const history = this.requestHistory.get(provider) || [];
        const now = Date.now();
        const windowStart = now - config.windowMs;

        const recentRequests = history.filter(timestamp => timestamp > windowStart);
        return recentRequests.length;
    }

    /**
     * Clear request history for a provider (useful for testing or reset)
     */
    clearHistory(provider?: LLMProvider): void {
        if (provider) {
            this.requestHistory.delete(provider);
        } else {
            this.requestHistory.clear();
        }
    }
}

