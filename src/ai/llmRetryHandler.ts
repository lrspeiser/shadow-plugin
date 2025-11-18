/**
 * Retry Handler for LLM API requests
 * Handles retries with exponential backoff and error classification
 */
export interface RetryOptions {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    retryableErrors?: string[];
    onRetry?: (attempt: number, error: any) => void;
}

export interface RetryResult<T> {
    result: T;
    attempts: number;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
        'rate_limit',
        'rate limit',
        'too_many_requests',
        'timeout',
        'network',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'temporary',
        '503',
        '429',
        '500'
    ],
    onRetry: () => {}
};

/**
 * Retry handler for LLM API requests
 * Implements exponential backoff and error classification
 */
export class RetryHandler {
    /**
     * Execute an operation with retry logic
     */
    async executeWithRetry<T>(
        operation: () => Promise<T>,
        options: RetryOptions = {}
    ): Promise<T> {
        const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
        let lastError: any = null;
        let delay = opts.initialDelayMs;

        for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
            try {
                const result = await operation();
                return result;
            } catch (error: any) {
                lastError = error;

                // Check if this is the last attempt
                if (attempt >= opts.maxRetries) {
                    break;
                }

                // Check if error is retryable
                if (!this.isRetryableError(error, opts.retryableErrors)) {
                    throw error; // Don't retry non-retryable errors
                }

                // Call retry callback
                if (opts.onRetry) {
                    opts.onRetry(attempt + 1, error);
                }

                console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms. Error: ${error.message}`);

                // Wait before retrying
                await this.delay(delay);

                // Calculate next delay with exponential backoff
                delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
            }
        }

        // All retries exhausted
        throw lastError;
    }

    /**
     * Check if an error is retryable
     */
    private isRetryableError(error: any, retryablePatterns: string[]): boolean {
        if (!error) {
            return false;
        }

        const errorMessage = (error.message || '').toLowerCase();
        const errorCode = (error.code || '').toLowerCase();
        const errorStatus = error.status || error.statusCode || '';

        // Check error message
        for (const pattern of retryablePatterns) {
            if (errorMessage.includes(pattern.toLowerCase()) || 
                errorCode.includes(pattern.toLowerCase()) ||
                String(errorStatus).includes(pattern)) {
                return true;
            }
        }

        // Check for network errors
        if (error.code === 'ECONNRESET' || 
            error.code === 'ETIMEDOUT' || 
            error.code === 'ENOTFOUND' ||
            error.code === 'ECONNREFUSED') {
            return true;
        }

        // Check for HTTP status codes
        if (errorStatus === 429 || // Too Many Requests
            errorStatus === 503 || // Service Unavailable
            errorStatus === 500 || // Internal Server Error
            (errorStatus >= 500 && errorStatus < 600)) { // 5xx errors
            return true;
        }

        return false;
    }

    /**
     * Delay for specified milliseconds
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Execute with retry and return result with attempt count
     */
    async executeWithRetryAndCount<T>(
        operation: () => Promise<T>,
        options: RetryOptions = {}
    ): Promise<RetryResult<T>> {
        const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
        let lastError: any = null;
        let delay = opts.initialDelayMs;
        let attempts = 0;

        for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
            attempts = attempt + 1;
            try {
                const result = await operation();
                return { result, attempts };
            } catch (error: any) {
                lastError = error;

                // Check if this is the last attempt
                if (attempt >= opts.maxRetries) {
                    break;
                }

                // Check if error is retryable
                if (!this.isRetryableError(error, opts.retryableErrors)) {
                    throw error; // Don't retry non-retryable errors
                }

                // Call retry callback
                if (opts.onRetry) {
                    opts.onRetry(attempt + 1, error);
                }

                console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms. Error: ${error.message}`);

                // Wait before retrying
                await this.delay(delay);

                // Calculate next delay with exponential backoff
                delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
            }
        }

        // All retries exhausted
        throw lastError;
    }
}

