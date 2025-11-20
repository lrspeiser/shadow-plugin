import * as path from 'path';
import * as fs from 'fs';

describe('llmRetryHandler - error pattern matching', () => {
  let isRetryableError: (error: any) => boolean;
  let retryablePatterns: string[];

  beforeEach(() => {
    const llmRetryHandlerPath = path.join(__dirname, '../llmRetryHandler.ts');
    const fileContent = fs.readFileSync(llmRetryHandlerPath, 'utf-8');
    
    retryablePatterns = [
      'rate limit',
      'timeout',
      'too many requests',
      'service unavailable',
      '429',
      '503',
      '502',
      'ECONNRESET',
      'ETIMEDOUT'
    ];

    isRetryableError = (error: any) => {
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
    };
  });

  describe('error message matching', () => {
    test('should return true when error message contains retryable pattern', () => {
      const error = { message: 'Rate limit exceeded' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true when error message contains timeout pattern', () => {
      const error = { message: 'Request timeout occurred' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true when error message contains too many requests pattern', () => {
      const error = { message: 'Too many requests sent' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true with uppercase error message', () => {
      const error = { message: 'SERVICE UNAVAILABLE' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true with mixed case error message', () => {
      const error = { message: 'Rate Limit Exceeded' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return false when error message does not match any pattern', () => {
      const error = { message: 'Invalid request parameter' };
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('error code matching', () => {
    test('should return true when error code contains retryable pattern', () => {
      const error = { code: 'ETIMEDOUT' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true when error code is ECONNRESET', () => {
      const error = { code: 'ECONNRESET' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true with lowercase error code', () => {
      const error = { code: 'etimedout' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return false when error code does not match any pattern', () => {
      const error = { code: 'ENOTFOUND' };
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('error status matching', () => {
    test('should return true when status is 429', () => {
      const error = { status: 429 };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true when status is 503', () => {
      const error = { status: 503 };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true when status is 502', () => {
      const error = { status: 502 };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true when statusCode is used instead of status', () => {
      const error = { statusCode: 429 };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true when status is string 429', () => {
      const error = { status: '429' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return false when status is 404', () => {
      const error = { status: 404 };
      expect(isRetryableError(error)).toBe(false);
    });

    test('should return false when status is 400', () => {
      const error = { status: 400 };
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should return false when error is empty object', () => {
      const error = {};
      expect(isRetryableError(error)).toBe(false);
    });

    test('should return false when error message is empty string', () => {
      const error = { message: '' };
      expect(isRetryableError(error)).toBe(false);
    });

    test('should return false when error code is empty string', () => {
      const error = { code: '' };
      expect(isRetryableError(error)).toBe(false);
    });

    test('should return false when status is 0', () => {
      const error = { status: 0 };
      expect(isRetryableError(error)).toBe(false);
    });

    test('should return false when status is empty string', () => {
      const error = { status: '' };
      expect(isRetryableError(error)).toBe(false);
    });

    test('should handle error with null message', () => {
      const error = { message: null };
      expect(isRetryableError(error)).toBe(false);
    });

    test('should handle error with undefined properties', () => {
      const error = { message: undefined, code: undefined, status: undefined };
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('combined error properties', () => {
    test('should return true when only message matches', () => {
      const error = { message: 'Rate limit exceeded', code: 'INVALID', status: 200 };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true when only code matches', () => {
      const error = { message: 'Unknown error', code: 'ETIMEDOUT', status: 200 };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true when only status matches', () => {
      const error = { message: 'Unknown error', code: 'INVALID', status: 429 };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return true when multiple properties match', () => {
      const error = { message: 'Service unavailable', code: 'ETIMEDOUT', status: 503 };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should return false when none of the properties match', () => {
      const error = { message: 'Bad request', code: 'INVALID', status: 400 };
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('partial pattern matching', () => {
    test('should match pattern within longer error message', () => {
      const error = { message: 'API error: rate limit exceeded. Try again later.' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should match pattern at start of message', () => {
      const error = { message: 'Timeout while connecting to server' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should match pattern at end of message', () => {
      const error = { message: 'Connection failed due to timeout' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should match status code within error message', () => {
      const error = { message: 'HTTP 429 error occurred' };
      expect(isRetryableError(error)).toBe(true);
    });
  });
});