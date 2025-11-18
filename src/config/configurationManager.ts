/**
 * Centralized configuration management for Shadow Watch
 * Provides type-safe access to all configuration properties
 */
import * as vscode from 'vscode';

export type LLMProvider = 'openai' | 'claude';
export type LLMFormat = 'cursor' | 'chatgpt' | 'generic' | 'compact';
export type SeverityThreshold = 'error' | 'warning' | 'info';

export interface ConfigValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Centralized configuration manager for Shadow Watch extension
 * Provides type-safe access to configuration properties and handles change events
 */
export class ConfigurationManager {
    private config: vscode.WorkspaceConfiguration;
    private changeListeners: Set<() => void> = new Set();

    constructor() {
        this.config = vscode.workspace.getConfiguration('shadowWatch');
        this.setupWatcher();
    }

    /**
     * Setup configuration change watcher
     */
    private setupWatcher(): void {
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('shadowWatch')) {
                this.config = vscode.workspace.getConfiguration('shadowWatch');
                // Notify all listeners
                this.changeListeners.forEach(listener => listener());
            }
        });
    }

    /**
     * Register a callback to be invoked when configuration changes
     */
    public onConfigurationChange(callback: () => void): void {
        this.changeListeners.add(callback);
    }

    /**
     * Remove a configuration change callback
     */
    public removeConfigurationChangeListener(callback: () => void): void {
        this.changeListeners.delete(callback);
    }

    // Boolean properties
    get enabled(): boolean {
        return this.config.get<boolean>('enabled', true);
    }

    get analyzeOnSave(): boolean {
        return this.config.get<boolean>('analyzeOnSave', true);
    }

    get showInlineHints(): boolean {
        return this.config.get<boolean>('showInlineHints', true);
    }

    get clearAllData(): boolean {
        return this.config.get<boolean>('clearAllData', false);
    }

    // String properties
    get openaiApiKey(): string {
        return this.config.get<string>('openaiApiKey', '').trim();
    }

    get claudeApiKey(): string {
        return this.config.get<string>('claudeApiKey', '').trim();
    }

    get llmProvider(): LLMProvider {
        return this.config.get<LLMProvider>('llmProvider', 'openai');
    }

    get llmFormat(): LLMFormat {
        return this.config.get<LLMFormat>('llmFormat', 'cursor');
    }

    get severityThreshold(): SeverityThreshold {
        return this.config.get<SeverityThreshold>('severityThreshold', 'warning');
    }

    // Number properties
    get analyzeInterval(): number {
        return this.config.get<number>('analyzeInterval', 30000);
    }

    get minFilesForAnalysis(): number {
        return this.config.get<number>('minFilesForAnalysis', 3);
    }

    get maxFileSizeKB(): number {
        return this.config.get<number>('maxFileSizeKB', 500);
    }

    // Array properties
    get excludePatterns(): string[] {
        return this.config.get<string[]>('excludePatterns', [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/build/**',
            '**/__pycache__/**',
            '**/venv/**',
            '**/.venv/**'
        ]);
    }

    /**
     * Update a configuration value
     */
    public async update(key: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global): Promise<void> {
        await this.config.update(key, value, target);
    }

    /**
     * Get a configuration value (generic method for non-standard keys)
     */
    public get<T>(key: string, defaultValue: T): T {
        return this.config.get<T>(key, defaultValue);
    }

    /**
     * Check if a specific configuration key is affected by a change event
     */
    public isAffectedByChange(event: vscode.ConfigurationChangeEvent, key: string): boolean {
        return event.affectsConfiguration(`shadowWatch.${key}`);
    }

    /**
     * Validate configuration
     */
    public validate(): ConfigValidationResult {
        const errors: string[] = [];

        // Validate provider and API key combination
        if (this.llmProvider === 'openai' && !this.openaiApiKey) {
            errors.push('OpenAI API key is required when using OpenAI provider');
        }

        if (this.llmProvider === 'claude' && !this.claudeApiKey) {
            errors.push('Claude API key is required when using Claude provider');
        }

        // Validate numeric ranges
        if (this.analyzeInterval < 1000) {
            errors.push('Analyze interval must be at least 1000ms');
        }

        if (this.minFilesForAnalysis < 1) {
            errors.push('Minimum files for analysis must be at least 1');
        }

        if (this.maxFileSizeKB < 1) {
            errors.push('Maximum file size must be at least 1KB');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if the current provider is properly configured
     */
    public isProviderConfigured(): boolean {
        if (this.llmProvider === 'claude') {
            return this.claudeApiKey.length > 0;
        }
        return this.openaiApiKey.length > 0;
    }

    /**
     * Get the API key for the current provider
     */
    public getCurrentProviderApiKey(): string | null {
        if (this.llmProvider === 'claude') {
            return this.claudeApiKey || null;
        }
        return this.openaiApiKey || null;
    }
}

// Singleton instance - can be accessed throughout the extension
let configManagerInstance: ConfigurationManager | null = null;

/**
 * Get the singleton configuration manager instance
 */
export function getConfigurationManager(): ConfigurationManager {
    if (!configManagerInstance) {
        configManagerInstance = new ConfigurationManager();
    }
    return configManagerInstance;
}

