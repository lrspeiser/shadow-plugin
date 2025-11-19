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
 * Result type for functional error handling
 * Provides type-safe success/failure handling without exceptions
 */
export class Result<T, E = Error> {
    private constructor(
        private readonly _isSuccess: boolean,
        private readonly _value?: T,
        private readonly _error?: E
    ) {}

    static success<T, E = Error>(value: T): Result<T, E> {
        return new Result<T, E>(true, value, undefined);
    }

    static failure<T, E = Error>(error: E): Result<T, E> {
        return new Result<T, E>(false, undefined, error);
    }

    get isSuccess(): boolean {
        return this._isSuccess;
    }

    get isFailure(): boolean {
        return !this._isSuccess;
    }

    get value(): T {
        if (!this._isSuccess) {
            throw new Error('Cannot get value from failed Result');
        }
        return this._value!;
    }

    get error(): E {
        if (this._isSuccess) {
            throw new Error('Cannot get error from successful Result');
        }
        return this._error!;
    }

    map<U>(fn: (value: T) => U): Result<U, E> {
        if (this._isSuccess) {
            return Result.success(fn(this._value!));
        }
        return Result.failure(this._error!);
    }

    mapError<F>(fn: (error: E) => F): Result<T, F> {
        if (this._isSuccess) {
            return Result.success(this._value!);
        }
        return Result.failure(fn(this._error!));
    }

    flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
        if (this._isSuccess) {
            return fn(this._value!);
        }
        return Result.failure(this._error!);
    }

    fold<U>(onFailure: (error: E) => U, onSuccess: (value: T) => U): U {
        return this._isSuccess ? onSuccess(this._value!) : onFailure(this._error!);
    }
}

/**
 * Domain error types for better error categorization
 */
export class DomainError extends Error {
    constructor(
        message: string,
        public readonly context: ErrorContext,
        public readonly originalError?: unknown
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class AIProviderError extends DomainError {
    constructor(originalError: unknown, context: ErrorContext) {
        const message = originalError instanceof Error 
            ? originalError.message 
            : 'AI provider request failed';
        super(message, context, originalError);
    }
}

export class AnalysisError extends DomainError {
    constructor(originalError: unknown, context: ErrorContext) {
        const message = originalError instanceof Error 
            ? originalError.message 
            : 'Analysis operation failed';
        super(message, context, originalError);
    }
}

export class FileSystemError extends DomainError {
    constructor(originalError: unknown, context: ErrorContext) {
        const message = originalError instanceof Error 
            ? originalError.message 
            : 'File system operation failed';
        super(message, context, originalError);
    }
}

export class UnknownError extends DomainError {
    constructor(originalError: unknown, context: ErrorContext) {
        const message = originalError instanceof Error 
            ? originalError.message 
            : 'An unknown error occurred';
        super(message, context, originalError);
    }
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
     * Handle an async operation with Result type pattern
     * @param operation The async operation to execute
     * @param context Error context for logging and user notification
     * @returns Result<T, DomainError> - success or failure result
     */
    static async execute<T>(
        operation: () => Promise<T>,
        context: ErrorContext
    ): Promise<Result<T, DomainError>> {
        try {
            const result = await operation();
            return Result.success(result);
        } catch (error) {
            const domainError = this.transformError(error, context);
            if (!context.silent) {
                this.logError(domainError, context);
                this.notifyUser(domainError, context);
            }
            return Result.failure(domainError);
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
     * Handle a synchronous operation with Result type pattern
     * @param operation The synchronous operation to execute
     * @param context Error context for logging and user notification
     * @returns Result<T, DomainError> - success or failure result
     */
    static executeSync<T>(
        operation: () => T,
        context: ErrorContext
    ): Result<T, DomainError> {
        try {
            const result = operation();
            return Result.success(result);
        } catch (error) {
            const domainError = this.transformError(error, context);
            if (!context.silent) {
                this.logError(domainError, context);
                this.notifyUser(domainError, context);
            }
            return Result.failure(domainError);
        }
    }

    /**
     * Transform unknown errors into domain errors
     */
    private static transformError(error: unknown, context: ErrorContext): DomainError {
        // Check for network-related errors
        if (error && typeof error === 'object' && 'code' in error) {
            const code = (error as any).code;
            if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || 
                code === 'ENOTFOUND' || code === 'ECONNREFUSED' ||
                code === 'ECONNABORTED') {
                return new AIProviderError(error, context);
            }
        }

        // Check for HTTP status codes
        if (error && typeof error === 'object' && ('status' in error || 'statusCode' in error)) {
            const status = (error as any).status || (error as any).statusCode;
            if (status >= 400 && status < 600) {
                return new AIProviderError(error, context);
            }
        }

        // Check for file system errors
        if (error && typeof error === 'object' && 'code' in error) {
            const code = (error as any).code;
            if (code === 'ENOENT' || code === 'EACCES' || code === 'EMFILE' || 
                code === 'ENFILE' || code === 'EISDIR' || code === 'ENOTDIR') {
                return new FileSystemError(error, context);
            }
        }

        // Check if it's already a DomainError
        if (error instanceof DomainError) {
            return error;
        }

        // Default to unknown error
        return new UnknownError(error, context);
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

