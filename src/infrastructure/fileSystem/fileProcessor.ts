/**
 * File Processor - Consolidates file processing logic across the codebase
 * Eliminates duplicate file processing patterns
 */
import * as fs from 'fs';
import * as path from 'path';
import { ErrorHandler, ErrorContext } from '../../utils/errorHandler';

export interface IFileFilter {
    shouldProcess(filePath: string): boolean;
}

export interface IFileReader {
    readFile(filePath: string): Promise<string>;
}

/**
 * Default file filter that skips common non-source files
 */
export class DefaultFileFilter implements IFileFilter {
    private readonly skipPatterns = [
        'node_modules',
        '.git',
        'dist',
        'build',
        '.shadow',
        'coverage',
        '.vscode',
        '.idea'
    ];

    shouldProcess(filePath: string): boolean {
        const normalized = filePath.replace(/\\/g, '/');
        return !this.skipPatterns.some(pattern => normalized.includes(pattern));
    }
}

/**
 * Default file reader using Node.js fs
 */
export class DefaultFileReader implements IFileReader {
    async readFile(filePath: string): Promise<string> {
        return fs.promises.readFile(filePath, 'utf-8');
    }
}

/**
 * Generic file processor that handles filtering, reading, and processing
 * Consolidates duplicate file processing loops across the codebase
 */
export class FileProcessor {
    constructor(
        private filter: IFileFilter = new DefaultFileFilter(),
        private reader: IFileReader = new DefaultFileReader()
    ) {}

    /**
     * Process files in parallel
     * @param files Array of file paths to process
     * @param processor Function to process each file's content
     * @returns Array of processed results
     */
    async processFiles<T>(
        files: string[],
        processor: (content: string, filePath: string) => Promise<T>,
        context?: ErrorContext
    ): Promise<T[]> {
        const filtered = files.filter(f => this.filter.shouldProcess(f));
        
        const results = await Promise.all(
            filtered.map(async file => {
                try {
                    const content = await this.reader.readFile(file);
                    return await processor(content, file);
                } catch (error) {
                    if (context) {
                        const result = await ErrorHandler.execute(
                            async () => {
                                const content = await this.reader.readFile(file);
                                return await processor(content, file);
                            },
                            { ...context, operation: `${context.operation} (${file})` }
                        );
                        if (result.isSuccess) {
                            return result.value;
                        }
                        // Return null/undefined on error, will be filtered out
                        return null as any;
                    }
                    throw error;
                }
            })
        );

        // Filter out null/undefined results from failed operations
        return results.filter((r): r is T => r != null);
    }

    /**
     * Process files sequentially with progress reporting
     * @param files Array of file paths to process
     * @param processor Function to process each file's content
     * @param onProgress Optional progress callback
     * @returns Array of processed results
     */
    async processFilesSequentially<T>(
        files: string[],
        processor: (content: string, filePath: string) => Promise<T>,
        onProgress?: (current: number, total: number) => void,
        context?: ErrorContext
    ): Promise<T[]> {
        const filtered = files.filter(f => this.filter.shouldProcess(f));
        const results: T[] = [];

        for (let i = 0; i < filtered.length; i++) {
            const file = filtered[i];
            
            try {
                const content = await this.reader.readFile(file);
                const result = await processor(content, file);
                results.push(result);
            } catch (error) {
                if (context) {
                    const result = await ErrorHandler.execute(
                        async () => {
                            const content = await this.reader.readFile(file);
                            return await processor(content, file);
                        },
                        { ...context, operation: `${context.operation} (${file})` }
                    );
                    if (result.isSuccess) {
                        results.push(result.value);
                    }
                } else {
                    // If no context provided, skip failed files
                    console.warn(`Failed to process file ${file}:`, error);
                }
            }

            onProgress?.(i + 1, filtered.length);
        }

        return results;
    }

    /**
     * Process files in batches with concurrency control
     * @param files Array of file paths to process
     * @param processor Function to process each file's content
     * @param batchSize Number of files to process concurrently
     * @param onProgress Optional progress callback
     * @returns Array of processed results
     */
    async processFilesInBatches<T>(
        files: string[],
        processor: (content: string, filePath: string) => Promise<T>,
        batchSize: number = 5,
        onProgress?: (current: number, total: number) => void,
        context?: ErrorContext
    ): Promise<T[]> {
        const filtered = files.filter(f => this.filter.shouldProcess(f));
        const results: T[] = [];

        for (let i = 0; i < filtered.length; i += batchSize) {
            const batch = filtered.slice(i, i + batchSize);
            
            const batchResults = await Promise.all(
                batch.map(async file => {
                    try {
                        const content = await this.reader.readFile(file);
                        return await processor(content, file);
                    } catch (error) {
                        if (context) {
                            const result = await ErrorHandler.execute(
                                async () => {
                                    const content = await this.reader.readFile(file);
                                    return await processor(content, file);
                                },
                                { ...context, operation: `${context.operation} (${file})` }
                            );
                            if (result.isSuccess) {
                                return result.value;
                            }
                            return null as any;
                        }
                        return null as any;
                    }
                })
            );

            results.push(...batchResults.filter((r): r is T => r != null));
            onProgress?.(Math.min(i + batchSize, filtered.length), filtered.length);
        }

        return results;
    }

    /**
     * Set custom file filter
     */
    setFilter(filter: IFileFilter): void {
        this.filter = filter;
    }

    /**
     * Set custom file reader
     */
    setReader(reader: IFileReader): void {
        this.reader = reader;
    }
}

