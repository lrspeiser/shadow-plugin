/**
 * File Cache - Optimizes file system operations by caching file contents
 * Reduces redundant file reads across multiple components
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface CachedFile {
    content: string;
    timestamp: number;
    size: number;
    hash: string;
}

interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    size: number;
}

/**
 * File cache with LRU eviction policy
 * Automatically invalidates on file changes via file system watcher
 */
export class FileCache {
    private cache = new Map<string, CachedFile>();
    private watcher: vscode.FileSystemWatcher | null = null;
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        size: 0
    };

    constructor(
        private maxSize: number = 500,
        private ttl: number = 5000 // 5 seconds default TTL
    ) {
        this.setupWatcher();
    }

    /**
     * Get file content from cache or filesystem
     */
    async getFile(filePath: string): Promise<string> {
        const cached = this.cache.get(filePath);

        if (cached && !this.isStale(cached)) {
            // Verify file hasn't changed by checking hash
            const currentHash = await this.getFileHash(filePath);
            if (cached.hash === currentHash) {
                this.stats.hits++;
                return cached.content;
            }
            // File changed, remove from cache
            this.cache.delete(filePath);
        }

        this.stats.misses++;
        const content = await this.readFileFromDisk(filePath);
        const hash = await this.getFileHash(filePath);
        const size = Buffer.byteLength(content, 'utf-8');

        this.cache.set(filePath, {
            content,
            timestamp: Date.now(),
            size,
            hash
        });

        this.stats.size += size;
        this.evictIfNeeded();

        return content;
    }

    /**
     * Read file from disk
     */
    private async readFileFromDisk(filePath: string): Promise<string> {
        try {
            const uri = vscode.Uri.file(filePath);
            const content = await vscode.workspace.fs.readFile(uri);
            return Buffer.from(content).toString('utf-8');
        } catch (error) {
            // Fallback to Node.js fs if VS Code API fails
            return fs.promises.readFile(filePath, 'utf-8');
        }
    }

    /**
     * Check if cached file is stale
     */
    private isStale(cached: CachedFile): boolean {
        return Date.now() - cached.timestamp > this.ttl;
    }

    /**
     * Get file hash based on modification time and size
     */
    private async getFileHash(filePath: string): Promise<string> {
        try {
            const stats = await fs.promises.stat(filePath);
            return `${stats.mtime.getTime()}-${stats.size}`;
        } catch {
            // If stat fails, return timestamp-based hash
            return `${Date.now()}`;
        }
    }

    /**
     * Evict least recently used entries if cache exceeds max size
     */
    private evictIfNeeded(): void {
        if (this.cache.size <= this.maxSize) {
            return;
        }

        // Sort by timestamp (oldest first)
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        const toEvict = entries.length - this.maxSize;
        for (let i = 0; i < toEvict; i++) {
            const [filePath, cached] = entries[i];
            this.stats.size -= cached.size;
            this.stats.evictions++;
            this.cache.delete(filePath);
        }
    }

    /**
     * Invalidate cache for a specific file
     */
    invalidate(filePath: string): void {
        const cached = this.cache.get(filePath);
        if (cached) {
            this.stats.size -= cached.size;
        }
        this.cache.delete(filePath);
    }

    /**
     * Invalidate cache for all files matching a pattern
     */
    invalidatePattern(pattern: string | RegExp): void {
        const regex = typeof pattern === 'string' 
            ? new RegExp(pattern.replace(/\*/g, '.*'))
            : pattern;

        for (const filePath of this.cache.keys()) {
            if (regex.test(filePath)) {
                this.invalidate(filePath);
            }
        }
    }

    /**
     * Clear entire cache
     */
    clear(): void {
        this.cache.clear();
        this.stats.size = 0;
    }

    /**
     * Setup file system watcher to invalidate cache on file changes
     */
    private setupWatcher(): void {
        try {
            this.watcher = vscode.workspace.createFileSystemWatcher('**/*');
            this.watcher.onDidChange(uri => {
                this.invalidate(uri.fsPath);
            });
            this.watcher.onDidDelete(uri => {
                this.invalidate(uri.fsPath);
            });
        } catch (error) {
            console.warn('Failed to setup file system watcher:', error);
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats & { hitRate: number; totalRequests: number } {
        const totalRequests = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
            totalRequests
        };
    }

    /**
     * Dispose of cache and watcher
     */
    dispose(): void {
        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = null;
        }
        this.clear();
    }
}

/**
 * Singleton instance for global file cache
 */
let globalFileCache: FileCache | null = null;

/**
 * Get or create global file cache instance
 */
export function getGlobalFileCache(): FileCache {
    if (!globalFileCache) {
        globalFileCache = new FileCache();
    }
    return globalFileCache;
}


