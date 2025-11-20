import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

jest.mock('vscode');

describe('LLM Retry Handler - Error Message Extraction', () => {
  const retryablePatterns = [
    'timeout',
    'rate limit',
    'too many requests',
    '429',
    '503',
    'service unavailable',
    'overloaded'
  ];

  function isRetryableError(error: any, retryablePatterns: string[]): boolean {
    const errorMessage = (error.message || '').toLowerCase();
    const errorCode = (error.code || '').toLowerCase();
    const errorStatus = error.status || error.statusCode || '';

    for (const pattern of retryablePatterns) {
      if (errorMessage.includes(pattern.toLowerCase()) || 
          errorCode.includes(pattern.toLowerCase()) ||
          String(errorStatus).includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  describe('Error Message Matching', () => {
    test('should detect retryable error from message containing timeout', () => {
      const error = {
        message: 'Request timeout occurred while connecting',
        code: '',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should detect retryable error from message with rate limit', () => {
      const error = {
        message: 'Rate limit exceeded. Please try again later.',
        code: '',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should detect retryable error from uppercase message', () => {
      const error = {
        message: 'SERVICE UNAVAILABLE - PLEASE RETRY',
        code: '',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should not detect non-retryable error message', () => {
      const error = {
        message: 'Invalid API key provided',
        code: '',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(false);
    });
  });

  describe('Error Code Matching', () => {
    test('should detect retryable error from error code', () => {
      const error = {
        message: '',
        code: 'RATE_LIMIT_EXCEEDED',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should detect retryable error from lowercase code', () => {
      const error = {
        message: '',
        code: 'timeout',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should not detect non-retryable error code', () => {
      const error = {
        message: '',
        code: 'INVALID_REQUEST',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(false);
    });
  });

  describe('Error Status Matching', () => {
    test('should detect retryable error from status 429', () => {
      const error = {
        message: '',
        code: '',
        status: 429
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should detect retryable error from status 503', () => {
      const error = {
        message: '',
        code: '',
        status: 503
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should detect retryable error from statusCode field', () => {
      const error = {
        message: '',
        code: '',
        statusCode: 429
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should not detect non-retryable status code', () => {
      const error = {
        message: '',
        code: '',
        status: 401
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases and Null Handling', () => {
    test('should handle error with missing message field', () => {
      const error = {
        code: 'timeout',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should handle error with missing code field', () => {
      const error = {
        message: 'rate limit exceeded',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should handle error with missing status field', () => {
      const error = {
        message: 'timeout error',
        code: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should handle error with all fields missing or empty', () => {
      const error = {
        message: '',
        code: '',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(false);
    });

    test('should handle error with null message', () => {
      const error = {
        message: null,
        code: '429',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should handle error with undefined fields', () => {
      const error = {
        message: undefined,
        code: undefined,
        status: 503
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should handle empty error object', () => {
      const error = {};

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(false);
    });
  });

  describe('Multiple Pattern Matching', () => {
    test('should detect when pattern matches multiple fields', () => {
      const error = {
        message: 'Too many requests - rate limit exceeded',
        code: 'RATE_LIMIT',
        status: 429
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should handle partial pattern matches', () => {
      const error = {
        message: 'The service is currently overloaded',
        code: '',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should match pattern in middle of string', () => {
      const error = {
        message: 'Error: timeout while waiting for response',
        code: '',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });
  });

  describe('Case Sensitivity', () => {
    test('should match pattern regardless of case in message', () => {
      const error = {
        message: 'TIMEOUT ERROR OCCURRED',
        code: '',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should match pattern with mixed case in code', () => {
      const error = {
        message: '',
        code: 'RateLimitExceeded',
        status: ''
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });

    test('should convert numeric status to string for comparison', () => {
      const error = {
        message: '',
        code: '',
        status: 429
      };

      const result = isRetryableError(error, retryablePatterns);
      expect(result).toBe(true);
    });
  });
});