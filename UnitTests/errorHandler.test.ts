import { handleError } from '../utils/errorHandler';
import * as vscode from 'vscode';

// Test: test_handleError_transforms_errors
// Verifies handleError correctly transforms infrastructure errors to user-friendly messages
import { handleError } from '../utils/errorHandler';
import * as vscode from 'vscode';

jest.mock('vscode');

describe('ErrorHandler.handleError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (vscode.window.showErrorMessage as jest.Mock).mockResolvedValue(undefined);
  });

  it('should transform network errors', () => {
    const networkError = new Error('Network timeout');
    networkError.name = 'NetworkError';

    handleError(networkError);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('network')
    );
  });

  it('should transform authentication errors', () => {
    const authError = new Error('Invalid API key');
    authError.name = 'AuthenticationError';

    handleError(authError);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('API key')
    );
  });

  it('should transform file system errors', () => {
    const fsError = new Error('ENOENT: no such file');
    fsError.name = 'FileSystemError';

    handleError(fsError);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('file')
    );
  });

  it('should handle unknown errors', () => {
    const unknownError = new Error('Something went wrong');

    handleError(unknownError);

    expect(vscode.window.showErrorMessage).toHaveBeenCalled();
  });

  it('should log error details', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');

    handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
    consoleErrorSpy.mockRestore();
  });
});
