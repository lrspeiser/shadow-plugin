/**
 * Unified File Watcher Service
 * Consolidates all file watching functionality to eliminate duplication
 * Extracted from multiple files (fileWatcher.ts, productNavigator.ts, insightsViewer.ts)
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface FileChangeEvent {
    uri: vscode.Uri;
    type: 'created' | 'changed' | 'deleted';
}

export type FileChangeHandler = (event: FileChangeEvent) => void | Promise<void>;

export interface WatchPattern {
    pattern: string | vscode.RelativePattern;
    ignorePatterns?: string[];
}

interface PatternHandler {
    id: string;
    handler: FileChangeHandler;
    options?: {
        ignorePatterns?: string[];
    };
}

export class FileWatcherService {
    private watchers: Map<string, vscode.FileSystemWatcher> = new Map();
    private patternHandlers: Map<string, Set<PatternHandler>> = new Map();
    private documentSaveHandler: vscode.Disposable | undefined;
    private documentSaveHandlers: Set<(document: vscode.TextDocument) => void | Promise<void>> = new Set();
    private isDisposed: boolean = false;

    /**
     * Watch for file system changes matching a pattern
     */
    watch(
        id: string,
        pattern: string | vscode.RelativePattern,
        handler: FileChangeHandler,
        options?: {
            ignorePatterns?: string[];
            watchCreate?: boolean;
            watchChange?: boolean;
            watchDelete?: boolean;
        }
    ): vscode.Disposable {
        if (this.isDisposed) {
            console.warn('[FileWatcherService] Cannot watch after disposal');
            return { dispose: () => {} };
        }

        // Get or create watcher for this pattern
        const patternKey = this.getPatternKey(pattern);
        let watcher = this.watchers.get(patternKey);
        
        if (!watcher) {
            watcher = vscode.workspace.createFileSystemWatcher(pattern);
            this.watchers.set(patternKey, watcher);
            
            // Set up event handlers
            const watchCreate = options?.watchCreate !== false;
            const watchChange = options?.watchChange !== false;
            const watchDelete = options?.watchDelete !== false;

            if (watchCreate) {
                watcher.onDidCreate((uri) => {
                    this.notifyHandlers(patternKey, { uri, type: 'created' });
                });
            }

            if (watchChange) {
                watcher.onDidChange((uri) => {
                    this.notifyHandlers(patternKey, { uri, type: 'changed' });
                });
            }

            if (watchDelete) {
                watcher.onDidDelete((uri) => {
                    this.notifyHandlers(patternKey, { uri, type: 'deleted' });
                });
            }
        }

        // Register handler for this pattern
        if (!this.patternHandlers.has(patternKey)) {
            this.patternHandlers.set(patternKey, new Set());
        }
        const patternHandler: PatternHandler = { id, handler, options };
        this.patternHandlers.get(patternKey)!.add(patternHandler);

        // Return disposable to remove this handler
        return {
            dispose: () => {
                const handlers = this.patternHandlers.get(patternKey);
                if (handlers) {
                    handlers.delete(patternHandler);
                    // If no more handlers for this pattern, dispose the watcher
                    if (handlers.size === 0) {
                        const w = this.watchers.get(patternKey);
                        if (w) {
                            w.dispose();
                            this.watchers.delete(patternKey);
                        }
                        this.patternHandlers.delete(patternKey);
                    }
                }
            }
        };
    }

    /**
     * Watch for document save events (for code file analysis)
     */
    watchDocumentSaves(handler: (document: vscode.TextDocument) => void | Promise<void>): vscode.Disposable {
        if (this.isDisposed) {
            console.warn('[FileWatcherService] Cannot watch after disposal');
            return { dispose: () => {} };
        }

        // Add handler to set
        this.documentSaveHandlers.add(handler);

        // Create document save watcher if this is the first handler
        if (!this.documentSaveHandler) {
            this.documentSaveHandler = vscode.workspace.onDidSaveTextDocument(async (document) => {
                for (const h of this.documentSaveHandlers) {
                    try {
                        await h(document);
                    } catch (error) {
                        console.error('[FileWatcherService] Error in document save handler:', error);
                    }
                }
            });
        }

        // Return disposable to remove this handler
        return {
            dispose: () => {
                this.documentSaveHandlers.delete(handler);
                // If no more handlers, dispose the watcher
                if (this.documentSaveHandlers.size === 0 && this.documentSaveHandler) {
                    this.documentSaveHandler.dispose();
                    this.documentSaveHandler = undefined;
                }
            }
        };
    }

    /**
     * Unwatch all handlers for a specific ID
     */
    unwatch(id: string): void {
        // Remove all handlers with this ID from all patterns
        for (const [patternKey, handlers] of this.patternHandlers.entries()) {
            const toRemove: PatternHandler[] = [];
            for (const handler of handlers) {
                if (handler.id === id) {
                    toRemove.push(handler);
                }
            }
            for (const handler of toRemove) {
                handlers.delete(handler);
            }
            
            // If no more handlers for this pattern, dispose the watcher
            if (handlers.size === 0) {
                const watcher = this.watchers.get(patternKey);
                if (watcher) {
                    watcher.dispose();
                    this.watchers.delete(patternKey);
                }
                this.patternHandlers.delete(patternKey);
            }
        }
    }

    /**
     * Dispose all watchers
     */
    dispose(): void {
        if (this.isDisposed) {
            return;
        }

        this.isDisposed = true;

        // Dispose all file system watchers
        for (const watcher of this.watchers.values()) {
            watcher.dispose();
        }
        this.watchers.clear();

        // Dispose document save handler
        if (this.documentSaveHandler) {
            this.documentSaveHandler.dispose();
            this.documentSaveHandler = undefined;
        }

        // Clear handlers
        this.patternHandlers.clear();
    }

    /**
     * Notify all handlers for a pattern
     */
    private async notifyHandlers(patternKey: string, event: FileChangeEvent): Promise<void> {
        const handlers = this.patternHandlers.get(patternKey);
        if (!handlers) {
            return;
        }

        // Check ignore patterns and notify handlers
        for (const patternHandler of handlers) {
            // Check if URI matches ignore patterns
            if (patternHandler.options?.ignorePatterns) {
                if (this.matchesIgnorePattern(event.uri.fsPath, patternHandler.options.ignorePatterns)) {
                    continue;
                }
            }

            try {
                await patternHandler.handler(event);
            } catch (error) {
                console.error(`[FileWatcherService] Error in handler ${patternHandler.id}:`, error);
            }
        }
    }

    /**
     * Get a unique key for a pattern
     */
    private getPatternKey(pattern: string | vscode.RelativePattern): string {
        if (typeof pattern === 'string') {
            return pattern;
        }
        // For RelativePattern, create a unique key
        // pattern.base can be Uri or WorkspaceFolder
        let basePath: string;
        const base = pattern.base as unknown;
        if (base instanceof vscode.Uri) {
            basePath = base.fsPath;
        } else if (base && typeof base === 'object' && 'uri' in base) {
            // WorkspaceFolder
            basePath = (base as vscode.WorkspaceFolder).uri.fsPath;
        } else {
            // Fallback (shouldn't happen)
            basePath = String(base);
        }
        return `${basePath}:${pattern.pattern}`;
    }

    /**
     * Check if a file path matches any ignore patterns
     */
    private matchesIgnorePattern(filePath: string, ignorePatterns?: string[]): boolean {
        if (!ignorePatterns || ignorePatterns.length === 0) {
            return false;
        }

        for (const pattern of ignorePatterns) {
            // Simple glob matching (can be enhanced)
            const regex = new RegExp(
                pattern
                    .replace(/\*\*/g, '.*')
                    .replace(/\*/g, '[^/]*')
                    .replace(/\?/g, '.')
            );
            if (regex.test(filePath)) {
                return true;
            }
        }

        return false;
    }
}

