/**
 * Base State Manager - Consolidates state management patterns
 * Provides common state storage, retrieval, validation, and notification
 */
import * as vscode from 'vscode';

/**
 * Base state manager with common state management functionality
 * Subclasses should extend this to provide type-safe state management
 */
export abstract class BaseStateManager<T> {
    private state: T;
    private listeners: ((state: T) => void)[] = [];

    constructor(
        protected context: vscode.ExtensionContext,
        private key: string
    ) {
        this.state = this.loadState();
    }

    /**
     * Load state from VS Code's global state storage
     */
    protected loadState(): T {
        const stored = this.context.globalState.get<T>(this.key);
        if (stored !== undefined) {
            return stored;
        }
        return this.getDefaultState();
    }

    /**
     * Get default state - must be implemented by subclasses
     */
    protected abstract getDefaultState(): T;

    /**
     * Set new state and persist it
     */
    setState(newState: T): void {
        this.validateState(newState);
        this.state = newState;
        this.persistState(newState);
        this.notifyListeners();
    }

    /**
     * Get current state (returns defensive copy)
     */
    getState(): T {
        return this.deepCopy(this.state);
    }

    /**
     * Update state using a function
     */
    updateState(updater: (current: T) => T): void {
        const newState = updater(this.state);
        this.setState(newState);
    }

    /**
     * Persist state to VS Code's global state storage
     */
    private async persistState(state: T): Promise<void> {
        try {
            await this.context.globalState.update(this.key, state);
        } catch (error) {
            console.error(`Failed to persist state for key ${this.key}:`, error);
        }
    }

    /**
     * Subscribe to state changes
     * @returns Unsubscribe function
     */
    subscribe(listener: (state: T) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Notify all listeners of state change
     */
    private notifyListeners(): void {
        const stateCopy = this.deepCopy(this.state);
        this.listeners.forEach(listener => {
            try {
                listener(stateCopy);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }

    /**
     * Validate state before setting - override in subclasses for custom validation
     */
    protected validateState(state: T): void {
        // Default implementation does nothing
        // Subclasses can override to add validation logic
    }

    /**
     * Reset state to default
     */
    reset(): void {
        this.setState(this.getDefaultState());
    }

    /**
     * Clear state from storage
     */
    async clear(): Promise<void> {
        await this.context.globalState.update(this.key, undefined);
        this.state = this.getDefaultState();
        this.notifyListeners();
    }

    /**
     * Deep copy state to prevent external mutations
     * Simple implementation - subclasses can override for better performance
     */
    protected deepCopy(state: T): T {
        if (state === null || typeof state !== 'object') {
            return state;
        }

        if (state instanceof Array) {
            return state.map(item => this.deepCopy(item)) as any;
        }

        if (state instanceof Date) {
            return new Date(state.getTime()) as any;
        }

        const copy: any = {};
        for (const key in state) {
            if (Object.prototype.hasOwnProperty.call(state, key)) {
                copy[key] = this.deepCopy((state as any)[key]);
            }
        }

        return copy;
    }

    /**
     * Get state key for this manager
     */
    getStateKey(): string {
        return this.key;
    }
}

