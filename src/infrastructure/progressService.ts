/**
 * Progress Service - Standardizes progress reporting across the codebase
 * Wraps vscode.window.withProgress to reduce boilerplate and ensure consistency
 */
import * as vscode from 'vscode';

export interface ProgressReporter {
    /**
     * Report progress with a message
     */
    report(message: string, increment?: number): void;
    
    /**
     * Get the cancellation token (if cancellable)
     */
    cancellationToken?: vscode.CancellationToken;
}

export interface ProgressOptions {
    /**
     * Title shown in the progress notification
     */
    title: string;
    
    /**
     * Whether the operation can be cancelled
     * @default true
     */
    cancellable?: boolean;
    
    /**
     * Location for the progress indicator
     * @default ProgressLocation.Notification
     */
    location?: vscode.ProgressLocation;
}

/**
 * Progress Service - Centralized progress reporting
 */
export class ProgressService {
    /**
     * Execute a task with progress reporting
     * 
     * @param options Progress options (title, cancellable, location)
     * @param task The async task to execute, receives a ProgressReporter
     * @returns The result of the task
     */
    async withProgress<T>(
        options: ProgressOptions | string,
        task: (reporter: ProgressReporter) => Promise<T>
    ): Promise<T> {
        // Support both string title and full options object
        const progressOptions: ProgressOptions = typeof options === 'string' 
            ? { title: options }
            : options;

        const location = progressOptions.location ?? vscode.ProgressLocation.Notification;
        const cancellable = progressOptions.cancellable ?? true;

        return vscode.window.withProgress(
            {
                location,
                title: progressOptions.title,
                cancellable
            },
            async (progress, cancellationToken) => {
                const reporter: ProgressReporter = {
                    report: (message: string, increment?: number) => {
                        progress.report({ message, increment });
                    },
                    cancellationToken: cancellable ? cancellationToken : undefined
                };

                // Check for cancellation before starting
                if (cancellationToken.isCancellationRequested) {
                    throw new Error('Operation cancelled');
                }

                return await task(reporter);
            }
        );
    }

    /**
     * Execute a task with progress reporting (non-cancellable by default)
     * Convenience method for operations that shouldn't be cancelled
     */
    async withProgressNonCancellable<T>(
        title: string,
        task: (reporter: ProgressReporter) => Promise<T>
    ): Promise<T> {
        return this.withProgress(
            { title, cancellable: false },
            task
        );
    }

    /**
     * Execute a task with progress reporting in the source control view
     */
    async withProgressInSourceControl<T>(
        title: string,
        task: (reporter: ProgressReporter) => Promise<T>
    ): Promise<T> {
        return this.withProgress(
            {
                title,
                location: vscode.ProgressLocation.SourceControl,
                cancellable: true
            },
            task
        );
    }

    /**
     * Execute a task with progress reporting in the window
     */
    async withProgressInWindow<T>(
        title: string,
        task: (reporter: ProgressReporter) => Promise<T>
    ): Promise<T> {
        return this.withProgress(
            {
                title,
                location: vscode.ProgressLocation.Window,
                cancellable: true
            },
            task
        );
    }
}

/**
 * Singleton instance for convenience
 */
export const progressService = new ProgressService();

