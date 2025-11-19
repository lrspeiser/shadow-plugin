import { handleError } from '../../utils/errorHandler';
import * as vscode from 'vscode';
import { logger } from '../../logger';

// Test: test_handleError_shows_user_friendly_messages
// Verifies error handler converts technical errors to user-friendly messages
import { handleError } from '../../utils/errorHandler';
import * as vscode from 'vscode';
import { logger } from '../../logger';

jest.mock('vscode');
jest.mock('../../logger');

describe('errorHandler.handleError', () => {
  beforeEach(() => {
    (vscode.window.showErrorMessage as jest.Mock) = jest.fn();
    (logger.error as jest.Mock) = jest.fn();
  });

  test('shows user-friendly message for API errors', () => {
    const error = new Error('API rate limit exceeded');
    error.name = 'APIError';
    
    handleError(error, 'LLM Request');
    
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('rate limit')
    );
  });

  test('logs technical details', () => {
    const error = new Error('Technical error');
    
    handleError(error, 'Test Operation');
    
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Technical error'));
  });

  test('handles file system errors', () => {
    const error = new Error('ENOENT: no such file or directory');
    
    handleError(error, 'File Access');
    
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringMatching(/file.*not found/i)
    );
  });

  test('provides retry suggestions for transient errors', () => {
    const error = new Error('Network timeout');
    
    handleError(error, 'API Call');
    
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('try again')
    );
  });
});
