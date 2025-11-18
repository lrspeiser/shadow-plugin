/**
 * Generic incremental storage for saving and loading data with timestamps
 * Reduces duplication in file I/O operations
 */
import * as fs from 'fs';
import * as path from 'path';
import { ErrorHandler } from '../utils/errorHandler';

export interface StorageMetadata {
    savedAt?: string;
    generatedAt?: string;
    generatedAtLocal?: string;
    iteration?: number;
    maxIterations?: number;
    index?: number;
    total?: number;
    runId?: string;
    [key: string]: any;
}

export interface StorageOptions {
    /** Base directory for storage */
    baseDir: string;
    /** File prefix (e.g., 'file-summary', 'product-doc') */
    filePrefix: string;
    /** Whether to include timestamp in filename */
    useTimestamp?: boolean;
    /** Whether to include index/iteration in filename */
    useIndex?: boolean;
    /** Subdirectory name (optional) */
    subdirectory?: string;
    /** Whether to save as both JSON and markdown */
    saveMarkdown?: boolean;
    /** Function to convert data to markdown */
    markdownFormatter?: (data: any) => string;
}

/**
 * Generic incremental storage for saving and loading typed data
 */
export class IncrementalStorage<T> {
    private baseDir: string;
    private filePrefix: string;
    private useTimestamp: boolean;
    private useIndex: boolean;
    private subdirectory?: string;
    private saveMarkdown: boolean;
    private markdownFormatter?: (data: any) => string;

    constructor(options: StorageOptions) {
        this.baseDir = options.baseDir;
        this.filePrefix = options.filePrefix;
        this.useTimestamp = options.useTimestamp ?? true;
        this.useIndex = options.useIndex ?? false;
        this.subdirectory = options.subdirectory;
        this.saveMarkdown = options.saveMarkdown ?? false;
        this.markdownFormatter = options.markdownFormatter;
    }

    /**
     * Save data with metadata
     */
    async save(data: T, metadata?: StorageMetadata): Promise<void> {
        const result = await ErrorHandler.handle(
            async () => {
                const dir = this.getStorageDirectory();
                await fs.promises.mkdir(dir, { recursive: true });

                const fileName = this.generateFileName(metadata);
                const filePath = path.join(dir, fileName);

                const dataWithMetadata = {
                    ...data,
                    _metadata: {
                        ...metadata,
                        savedAt: new Date().toISOString(),
                        ...(metadata?.generatedAt ? { generatedAt: metadata.generatedAt } : {}),
                        ...(metadata?.generatedAtLocal ? { generatedAtLocal: metadata.generatedAtLocal } : {})
                    }
                };

                await fs.promises.writeFile(
                    filePath,
                    JSON.stringify(dataWithMetadata, null, 2),
                    'utf-8'
                );

                // Save markdown if configured
                if (this.saveMarkdown && this.markdownFormatter) {
                    const markdownPath = filePath.replace('.json', '.md');
                    const markdown = this.markdownFormatter(data);
                    await fs.promises.writeFile(markdownPath, markdown, 'utf-8');
                }
            },
            {
                component: 'IncrementalStorage',
                operation: 'save',
                severity: 'warning',
                showUserMessage: false,
                logToFile: true
            }
        );
        // ErrorHandler.handle returns null on error, but we want void
        // The error is already logged, so we just return
    }

    /**
     * Save data synchronously (for incremental saves during processing)
     */
    saveSync(data: T, metadata?: StorageMetadata): void {
        ErrorHandler.handleSync(
            () => {
                const dir = this.getStorageDirectory();
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const fileName = this.generateFileName(metadata);
                const filePath = path.join(dir, fileName);

                const dataWithMetadata = {
                    ...data,
                    _metadata: {
                        ...metadata,
                        savedAt: new Date().toISOString(),
                        ...(metadata?.generatedAt ? { generatedAt: metadata.generatedAt } : {}),
                        ...(metadata?.generatedAtLocal ? { generatedAtLocal: metadata.generatedAtLocal } : {})
                    }
                };

                fs.writeFileSync(filePath, JSON.stringify(dataWithMetadata, null, 2), 'utf-8');

                // Save markdown if configured
                if (this.saveMarkdown && this.markdownFormatter) {
                    const markdownPath = filePath.replace('.json', '.md');
                    const markdown = this.markdownFormatter(data);
                    fs.writeFileSync(markdownPath, markdown, 'utf-8');
                }
            },
            {
                component: 'IncrementalStorage',
                operation: 'saveSync',
                severity: 'warning',
                showUserMessage: false,
                logToFile: true
            }
        );
        // ErrorHandler.handleSync returns null on error, but we want void
        // The error is already logged, so we just return
    }

    /**
     * Load the latest saved data
     */
    async loadLatest(): Promise<T | null> {
        const result = await ErrorHandler.handle(
            async () => {
                const dir = this.getStorageDirectory();
                if (!fs.existsSync(dir)) {
                    return null;
                }

                const files = await fs.promises.readdir(dir);
                const matchingFiles = files
                    .filter(f => f.startsWith(this.filePrefix) && f.endsWith('.json'))
                    .sort()
                    .reverse();

                if (matchingFiles.length === 0) {
                    return null;
                }

                const content = await fs.promises.readFile(
                    path.join(dir, matchingFiles[0]),
                    'utf-8'
                );
                return JSON.parse(content) as T;
            },
            {
                component: 'IncrementalStorage',
                operation: 'loadLatest',
                severity: 'warning',
                showUserMessage: false,
                logToFile: true
            }
        );
        return result ?? null;
    }

    /**
     * Load all saved data files
     */
    async loadAll(): Promise<T[]> {
        const result = await ErrorHandler.handle(
            async () => {
                const dir = this.getStorageDirectory();
                if (!fs.existsSync(dir)) {
                    return [];
                }

                const files = await fs.promises.readdir(dir);
                const matchingFiles = files.filter(f => 
                    f.startsWith(this.filePrefix) && f.endsWith('.json')
                );

                const results = await Promise.all(
                    matchingFiles.map(async f => {
                        const content = await fs.promises.readFile(
                            path.join(dir, f),
                            'utf-8'
                        );
                        return JSON.parse(content) as T;
                    })
                );

                return results;
            },
            {
                component: 'IncrementalStorage',
                operation: 'loadAll',
                severity: 'warning',
                showUserMessage: false,
                logToFile: true
            }
        );
        return result ?? [];
    }

    /**
     * Get the storage directory path
     */
    private getStorageDirectory(): string {
        if (this.subdirectory) {
            return path.join(this.baseDir, this.subdirectory);
        }
        return this.baseDir;
    }

    /**
     * Generate filename based on options and metadata
     */
    private generateFileName(metadata?: StorageMetadata): string {
        const parts: string[] = [this.filePrefix];

        if (this.useIndex && metadata?.index !== undefined) {
            parts.push(String(metadata.index).padStart(4, '0'));
        }

        if (this.useTimestamp) {
            const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
            parts.push(timestamp);
        } else if (metadata?.iteration !== undefined) {
            parts.push(`iteration-${metadata.iteration}`);
        }

        return `${parts.join('-')}.json`;
    }
}

/**
 * Helper to create a simple timestamped storage
 */
export function createTimestampedStorage<T>(
    baseDir: string,
    filePrefix: string
): IncrementalStorage<T> {
    return new IncrementalStorage<T>({
        baseDir,
        filePrefix,
        useTimestamp: true,
        useIndex: false
    });
}

/**
 * Helper to create an iteration-based storage
 */
export function createIterationStorage<T>(
    baseDir: string,
    filePrefix: string,
    markdownFormatter?: (data: T) => string
): IncrementalStorage<T> {
    return new IncrementalStorage<T>({
        baseDir,
        filePrefix,
        useTimestamp: false,
        useIndex: false,
        saveMarkdown: !!markdownFormatter,
        markdownFormatter
    });
}

/**
 * Helper to create an indexed storage (for file summaries, etc.)
 */
export function createIndexedStorage<T>(
    baseDir: string,
    filePrefix: string,
    subdirectory?: string
): IncrementalStorage<T> {
    return new IncrementalStorage<T>({
        baseDir,
        filePrefix,
        useTimestamp: false,
        useIndex: true,
        subdirectory
    });
}

