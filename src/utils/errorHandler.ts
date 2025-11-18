/**
 * Centralized error handling utility for Shadow Watch
 * Provides consistent error logging and user notification
 */
import * as vscode from 'vscode';
import { SWLogger } from '../logger';

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorContext {
    component: string;
    operation: string;
    severity?: ErrorSeverity;
    showUserMessage?: boolean;
    userMessage?: string;
    logToFile?: boolean;
    rethrow?: boolean;
    silent?: boolean; // Don't show user message or log (for expected errors)
}

/**
 * Centralized error handler for consistent error management
 */
export class ErrorHandler {
    /**
     * Handle an async operation with error handling
     * @param operation The async operation to execute
     * @param context Error context for logging and user notification
     * @returns The result of the operation, or null if error occurred and rethrow is false
     */
    static async handle<T>(
        operation: () => Promise<T>,
        context: ErrorContext
    ): Promise<T | null> {
        try {
            return await operation();
        } catch (error) {
            if (!context.silent) {
                this.logError(error, context);
                this.notifyUser(error, context);
            }
            
            if (context.rethrow) {
                throw error;
            }
            
            return null;
        }
    }

    /**
     * Handle a synchronous operation with error handling
     * @param operation The synchronous operation to execute
     * @param context Error context for logging and user notification
     * @returns The result of the operation, or null if error occurred and rethrow is false
     */
    static handleSync<T>(
        operation: () => T,
        context: ErrorContext
    ): T | null {
        try {
            return operation();
        } catch (error) {
            if (!context.silent) {
                this.logError(error, context);
                this.notifyUser(error, context);
            }
            
            if (context.rethrow) {
                throw error;
            }
            
            return null;
        }
    }

    /**
     * Log error to console and optionally to file
     */
    private static logError(error: any, context: ErrorContext): void {
        const errorMessage = this.getErrorMessage(error);
        const logMessage = `[${context.component}] ${context.operation} failed: ${errorMessage}`;
        
        console.error(logMessage, error);
        
        if (context.logToFile !== false) {
            SWLogger.log(`ERROR ${logMessage}`);
            if (error.stack) {
                SWLogger.log(`Stack: ${error.stack}`);
            }
        }
    }

    /**
     * Notify user about the error
     */
    private static notifyUser(error: any, context: ErrorContext): void {
        if (!context.showUserMessage) {
            return;
        }

        const message = context.userMessage || `${context.operation} failed`;
        const errorMessage = this.getErrorMessage(error);
        const fullMessage = context.userMessage 
            ? `${context.userMessage}: ${errorMessage}`
            : `${message}: ${errorMessage}`;

        const severity = context.severity || 'error';
        
        switch (severity) {
            case 'error':
                vscode.window.showErrorMessage(fullMessage);
                break;
            case 'warning':
                vscode.window.showWarningMessage(fullMessage);
                break;
            case 'info':
                vscode.window.showInformationMessage(fullMessage);
                break;
        }
    }

    /**
     * Extract a readable error message from an error object
     */
    private static getErrorMessage(error: any): string {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        if (error?.message) {
            return error.message;
        }
        return String(error);
    }

    /**
     * Create a standardized error context for common operations
     */
    static createContext(
        component: string,
        operation: string,
        options?: Partial<ErrorContext>
    ): ErrorContext {
        return {
            component,
            operation,
            severity: 'error',
            showUserMessage: true,
            logToFile: true,
            rethrow: false,
            ...options
        };
    }
}

