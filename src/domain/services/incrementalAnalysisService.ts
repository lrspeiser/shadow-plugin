/**
 * Incremental Analysis Service
 * Handles iterative LLM analysis with file/grep request processing
 * Extracted from llmService.ts to eliminate duplication and improve testability
 */
import { FileAccessHelper, LLMRequest } from '../../fileAccessHelper';

export interface IterationResult<T> {
    result: T;
    iteration: number;
    maxIterations: number;
    requests: LLMRequest[];
    shouldContinue: boolean;
}

export interface IterationCallbacks<T> {
    onIterationStart?: (iteration: number, maxIterations: number) => void;
    onIterationComplete?: (result: T, iteration: number, maxIterations: number) => void;
}

export interface ProcessRequestsResult {
    additionalInfo: string;
    messages: Array<{ role: 'assistant' | 'user'; content: string }>;
}

/**
 * Service for handling incremental/iterative LLM analysis
 * Converts while loops to async iterator pattern for better testability
 */
export class IncrementalAnalysisService {
    constructor(private fileAccessHelper: FileAccessHelper) {}

    /**
     * Process LLM requests (file reads and grep searches)
     * Returns formatted additional info and updated messages for conversation
     */
    processRequests(
        requests: LLMRequest[],
        currentResult: any,
        messages: Array<{ role: 'assistant' | 'user'; content: string }>
    ): ProcessRequestsResult {
        // Limit to 5 requests per iteration
        const limitedRequests = requests.slice(0, 5);
        
        // Process requests
        let additionalInfo = '\n## Additional Information Requested\n\n';
        const fileRequests = limitedRequests.filter(r => r.type === 'file') as any[];
        const grepRequests = limitedRequests.filter(r => r.type === 'grep') as any[];

        // Read requested files
        if (fileRequests.length > 0) {
            const filePaths = fileRequests.map(r => r.path);
            const fileResponses = this.fileAccessHelper.readFiles(filePaths);
            additionalInfo += this.fileAccessHelper.formatFileResponses(fileResponses);
        }

        // Execute grep searches
        if (grepRequests.length > 0) {
            const grepResponses = grepRequests.map(req => 
                this.fileAccessHelper.grep(req.pattern, req.filePattern, req.maxResults || 20)
            );
            additionalInfo += this.fileAccessHelper.formatGrepResponses(grepResponses);
        }

        // Add assistant response and additional info to conversation
        const updatedMessages = [...messages];
        updatedMessages.push({
            role: 'assistant',
            content: JSON.stringify(currentResult)
        });
        updatedMessages.push({
            role: 'user',
            content: additionalInfo
        });

        return {
            additionalInfo,
            messages: updatedMessages
        };
    }

    /**
     * Async iterator for processing iterations
     * Replaces while loops with a more testable pattern
     */
    async *processIterations<T extends { requests?: LLMRequest[] }>(
        maxIterations: number,
        getInitialPrompt: () => string,
        executeLLMRequest: (messages: Array<{ role: 'assistant' | 'user'; content: string }>) => Promise<T>,
        callbacks?: IterationCallbacks<T>
    ): AsyncIterableIterator<IterationResult<T>> {
        const messages: Array<{ role: 'assistant' | 'user'; content: string }> = [];
        let iteration = 0;
        let finalResult: T | null = null;

        while (iteration < maxIterations) {
            iteration++;
            
            // Call callback before iteration
            if (callbacks?.onIterationStart) {
                callbacks.onIterationStart(iteration, maxIterations);
            }

            // Add base prompt or continuation message
            if (iteration === 1) {
                messages.push({
                    role: 'user',
                    content: getInitialPrompt()
                });
            } else {
                messages.push({
                    role: 'user',
                    content: 'Please provide your final analysis based on the additional information provided above.'
                });
            }

            // Execute LLM request
            finalResult = await executeLLMRequest(messages);

            // Call callback after iteration
            if (callbacks?.onIterationComplete) {
                callbacks.onIterationComplete(finalResult, iteration, maxIterations);
            }

            // Check if LLM requested more information
            const requests: LLMRequest[] = finalResult.requests || [];
            const shouldContinue = requests.length > 0 && iteration < maxIterations;

            yield {
                result: finalResult,
                iteration,
                maxIterations,
                requests,
                shouldContinue
            };

            // If no more requests or max iterations reached, stop
            if (!shouldContinue) {
                break;
            }

            // Process requests and update messages for next iteration
            const { messages: updatedMessages } = this.processRequests(requests, finalResult, messages);
            messages.length = 0;
            messages.push(...updatedMessages);
        }

        // Clean up requests field before final return (if needed)
        if (finalResult && finalResult.requests) {
            delete finalResult.requests;
        }
    }

    /**
     * Helper to run iterations and return final result
     * Convenience method that uses the iterator internally
     */
    async runIterations<T extends { requests?: LLMRequest[] }>(
        maxIterations: number,
        getInitialPrompt: () => string,
        executeLLMRequest: (messages: Array<{ role: 'assistant' | 'user'; content: string }>) => Promise<T>,
        callbacks?: IterationCallbacks<T>
    ): Promise<T> {
        let finalResult: T | null = null;

        for await (const iterationResult of this.processIterations(
            maxIterations,
            getInitialPrompt,
            executeLLMRequest,
            callbacks
        )) {
            finalResult = iterationResult.result;
            
            // If this was the last iteration, break
            if (!iterationResult.shouldContinue) {
                break;
            }
        }

        if (!finalResult) {
            throw new Error('No result from iterations');
        }

        // Clean up requests field
        if (finalResult.requests) {
            delete finalResult.requests;
        }

        return finalResult;
    }
}

