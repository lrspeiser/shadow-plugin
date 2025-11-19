import { ErrorHandler, ErrorCategory, RecoveryStrategy } from '../utils/errorHandler';

// Test: test_classify_error_by_type
// Verifies error handler correctly classifies different error types
describe('ErrorHandler - classifyError', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  test('should classify network timeout error', () => {
    const error = new Error('Network timeout after 30s');
    error.name = 'NetworkTimeoutError';

    const classified = errorHandler.classifyError(error);

    expect(classified.category).toBe(ErrorCategory.Network);
    expect(classified.isRetryable).toBe(true);
    expect(classified.userMessage).toContain('network');
  });

  test('should classify API rate limit error', () => {
    const error = new Error('Rate limit exceeded');
    error.name = 'RateLimitError';

    const classified = errorHandler.classifyError(error);

    expect(classified.category).toBe(ErrorCategory.RateLimit);
    expect(classified.isRetryable).toBe(true);
    expect(classified.retryAfter).toBeGreaterThan(0);
  });

  test('should classify file system error', () => {
    const error = new Error('ENOENT: no such file or directory');
    error.name = 'FileSystemError';

    const classified = errorHandler.classifyError(error);

    expect(classified.category).toBe(ErrorCategory.FileSystem);
    expect(classified.isRetryable).toBe(false);
  });

  test('should classify parse error', () => {
    const error = new SyntaxError('Unexpected token');

    const classified = errorHandler.classifyError(error);

    expect(classified.category).toBe(ErrorCategory.Parse);
    expect(classified.isRetryable).toBe(false);
  });

  test('should handle unknown error types', () => {
    const error = new Error('Unknown error occurred');

    const classified = errorHandler.classifyError(error);

    expect(classified.category).toBe(ErrorCategory.Unknown);
    expect(classified.userMessage).toBeDefined();
  });
});

// Test: test_error_recovery_strategies
// Verifies error handler provides appropriate recovery strategies for different error types
describe('ErrorHandler - getRecoveryStrategy', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  test('should provide retry strategy for network errors', () => {
    const error = new Error('Network timeout');
    const classified = errorHandler.classifyError(error);

    const strategy = errorHandler.getRecoveryStrategy(classified);

    expect(strategy.action).toBe(RecoveryStrategy.Retry);
    expect(strategy.maxRetries).toBeGreaterThan(0);
    expect(strategy.backoffMs).toBeGreaterThan(0);
  });

  test('should provide fallback strategy for API errors', () => {
    const error = new Error('API unavailable');
    const classified = errorHandler.classifyError(error);

    const strategy = errorHandler.getRecoveryStrategy(classified);

    expect(strategy.action).toBe(RecoveryStrategy.Fallback);
    expect(strategy.fallbackAction).toBeDefined();
  });

  test('should require user intervention for auth errors', () => {
    const error = new Error('Invalid API key');
    const classified = errorHandler.classifyError(error);

    const strategy = errorHandler.getRecoveryStrategy(classified);

    expect(strategy.action).toBe(RecoveryStrategy.UserIntervention);
    expect(strategy.userInstructions).toBeDefined();
  });
});
