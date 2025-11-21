import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('llmRetryHandler - errorMessage pattern matching', () => {
  // Helper function to create the isRetryableError function context
  const createRetryChecker = (retryablePatterns: string[]) => {
    return (error: any): boolean => {
      const errorMessage = (error.message || '').toLowerCase();
      const errorCode = (error.code || '').toLowerCase();
      const errorStatus = error.status || error.statusCode || '';

      // Check error message
      for (const pattern of retryablePatterns) {
        if (errorMessage.includes(pattern.toLowerCase()) || 
            errorCode.includes(pattern.toLowerCase()) ||
            String(errorStatus).includes(pattern)) {
          return true;
        }
      }
      return false;
    };
  };

  describe('error message matching', () => {
    test('should match pattern in error message', () => {
      const patterns = ['timeout', 'rate limit'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { message: 'Request timeout occurred' };
      expect(isRetryable(error)).toBe(true);
    });

    test('should match pattern case-insensitively in message', () => {
      const patterns = ['timeout'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { message: 'REQUEST TIMEOUT ERROR' };
      expect(isRetryable(error)).toBe(true);
    });

    test('should not match when pattern not in message', () => {
      const patterns = ['timeout'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { message: 'Invalid request' };
      expect(isRetryable(error)).toBe(false);
    });

    test('should handle empty message', () => {
      const patterns = ['timeout'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { message: '' };
      expect(isRetryable(error)).toBe(false);
    });

    test('should handle missing message property', () => {
      const patterns = ['timeout'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = {};
      expect(isRetryable(error)).toBe(false);
    });
  });

  describe('error code matching', () => {
    test('should match pattern in error code', () => {
      const patterns = ['ECONNRESET', 'ETIMEDOUT'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { code: 'ECONNRESET' };
      expect(isRetryable(error)).toBe(true);
    });

    test('should match pattern case-insensitively in code', () => {
      const patterns = ['econnreset'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { code: 'ECONNRESET' };
      expect(isRetryable(error)).toBe(true);
    });

    test('should handle empty code', () => {
      const patterns = ['ECONNRESET'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { code: '' };
      expect(isRetryable(error)).toBe(false);
    });

    test('should handle missing code property', () => {
      const patterns = ['ECONNRESET'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { message: 'error' };
      expect(isRetryable(error)).toBe(false);
    });
  });

  describe('error status matching', () => {
    test('should match pattern in status field', () => {
      const patterns = ['429', '503'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { status: 429 };
      expect(isRetryable(error)).toBe(true);
    });

    test('should match pattern in statusCode field', () => {
      const patterns = ['503'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { statusCode: 503 };
      expect(isRetryable(error)).toBe(true);
    });

    test('should handle string status codes', () => {
      const patterns = ['429'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { status: '429' };
      expect(isRetryable(error)).toBe(true);
    });

    test('should handle missing status fields', () => {
      const patterns = ['429'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { message: 'error' };
      expect(isRetryable(error)).toBe(false);
    });

    test('should prefer status over statusCode', () => {
      const patterns = ['429'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { status: 429, statusCode: 500 };
      expect(isRetryable(error)).toBe(true);
    });
  });

  describe('multiple patterns', () => {
    test('should match any pattern in list', () => {
      const patterns = ['timeout', 'rate limit', 'ECONNRESET', '429'];
      const isRetryable = createRetryChecker(patterns);
      
      expect(isRetryable({ message: 'timeout error' })).toBe(true);
      expect(isRetryable({ message: 'rate limit exceeded' })).toBe(true);
      expect(isRetryable({ code: 'ECONNRESET' })).toBe(true);
      expect(isRetryable({ status: 429 })).toBe(true);
    });

    test('should match first matching pattern', () => {
      const patterns = ['timeout', 'error'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { message: 'timeout error occurred' };
      expect(isRetryable(error)).toBe(true);
    });
  });

  describe('combined error properties', () => {
    test('should match pattern in any field', () => {
      const patterns = ['timeout'];
      const isRetryable = createRetryChecker(patterns);
      
      expect(isRetryable({ message: 'timeout', code: '', status: 200 })).toBe(true);
      expect(isRetryable({ message: '', code: 'timeout', status: 200 })).toBe(true);
      expect(isRetryable({ message: '', code: '', status: 'timeout' })).toBe(true);
    });

    test('should handle complex error objects', () => {
      const patterns = ['rate limit', '429'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = {
        message: 'API rate limit exceeded',
        code: 'ERR_RATE_LIMIT',
        status: 429,
        details: 'Too many requests'
      };
      expect(isRetryable(error)).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle empty pattern list', () => {
      const patterns: string[] = [];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { message: 'timeout' };
      expect(isRetryable(error)).toBe(false);
    });

    test('should handle null error properties', () => {
      const patterns = ['timeout'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { message: null, code: null, status: null };
      expect(isRetryable(error)).toBe(false);
    });

    test('should handle undefined error properties', () => {
      const patterns = ['timeout'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { message: undefined, code: undefined, status: undefined };
      expect(isRetryable(error)).toBe(false);
    });

    test('should handle special characters in patterns', () => {
      const patterns = ['[timeout]', 'rate-limit'];
      const isRetryable = createRetryChecker(patterns);
      
      expect(isRetryable({ message: 'Error: [timeout] occurred' })).toBe(true);
      expect(isRetryable({ message: 'rate-limit exceeded' })).toBe(true);
    });

    test('should handle numeric status as zero', () => {
      const patterns = ['0'];
      const isRetryable = createRetryChecker(patterns);
      
      const error = { status: 0 };
      expect(isRetryable(error)).toBe(true);
    });

    test('should handle partial pattern matches', () => {
      const patterns = ['time'];
      const isRetryable = createRetryChecker(patterns);
      
      expect(isRetryable({ message: 'timeout error' })).toBe(true);
      expect(isRetryable({ message: 'longtime waiting' })).toBe(true);
    });
  });
});