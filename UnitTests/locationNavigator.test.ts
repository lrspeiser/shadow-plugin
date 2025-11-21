import { navigateToLocation } from '../locationNavigator';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('navigateToLocation', () => {
  let mockShowTextDocument: jest.Mock;
  let mockOpenTextDocument: jest.Mock;
  let mockShowErrorMessage: jest.Mock;
  let mockUri: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockShowTextDocument = vscode.window.showTextDocument as jest.Mock;
    mockOpenTextDocument = vscode.workspace.openTextDocument as jest.Mock;
    mockShowErrorMessage = vscode.window.showErrorMessage as jest.Mock;
    
    mockUri = {
      fsPath: '/test/file.ts',
      scheme: 'file',
      path: '/test/file.ts'
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should successfully navigate to a valid file location with line and column', async () => {
    const mockTextDocument = {
      uri: mockUri,
      lineCount: 100,
      getText: jest.fn()
    };
    
    const mockTextEditor = {
      document: mockTextDocument,
      selection: undefined,
      revealRange: jest.fn()
    };

    mockOpenTextDocument.mockResolvedValue(mockTextDocument);
    mockShowTextDocument.mockResolvedValue(mockTextEditor);

    const filePath = '/test/file.ts';
    const line = 10;
    const column = 5;

    await navigateToLocation(filePath, line, column);

    expect(mockOpenTextDocument).toHaveBeenCalledWith(expect.objectContaining({
      fsPath: filePath
    }));
    expect(mockShowTextDocument).toHaveBeenCalledWith(
      mockTextDocument,
      expect.any(Object)
    );
    expect(mockShowErrorMessage).not.toHaveBeenCalled();
  });

  test('should navigate to file without line and column parameters', async () => {
    const mockTextDocument = {
      uri: mockUri,
      lineCount: 50,
      getText: jest.fn()
    };
    
    const mockTextEditor = {
      document: mockTextDocument,
      selection: undefined
    };

    mockOpenTextDocument.mockResolvedValue(mockTextDocument);
    mockShowTextDocument.mockResolvedValue(mockTextEditor);

    const filePath = '/test/another-file.ts';

    await navigateToLocation(filePath);

    expect(mockOpenTextDocument).toHaveBeenCalledWith(expect.objectContaining({
      fsPath: filePath
    }));
    expect(mockShowTextDocument).toHaveBeenCalledWith(
      mockTextDocument,
      expect.any(Object)
    );
    expect(mockShowErrorMessage).not.toHaveBeenCalled();
  });

  test('should handle error when file cannot be opened', async () => {
    const errorMessage = 'File not found';
    mockOpenTextDocument.mockRejectedValue(new Error(errorMessage));

    const filePath = '/test/nonexistent-file.ts';
    const line = 1;
    const column = 1;

    await navigateToLocation(filePath, line, column);

    expect(mockOpenTextDocument).toHaveBeenCalledWith(expect.objectContaining({
      fsPath: filePath
    }));
    expect(mockShowTextDocument).not.toHaveBeenCalled();
    expect(mockShowErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('navigate')
    );
  });

  test('should handle error when showTextDocument fails', async () => {
    const mockTextDocument = {
      uri: mockUri,
      lineCount: 100,
      getText: jest.fn()
    };

    mockOpenTextDocument.mockResolvedValue(mockTextDocument);
    mockShowTextDocument.mockRejectedValue(new Error('Cannot show document'));

    const filePath = '/test/file.ts';
    const line = 5;

    await navigateToLocation(filePath, line);

    expect(mockOpenTextDocument).toHaveBeenCalled();
    expect(mockShowTextDocument).toHaveBeenCalled();
    expect(mockShowErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('navigate')
    );
  });

  test('should handle navigation with zero-based line and column indices', async () => {
    const mockTextDocument = {
      uri: mockUri,
      lineCount: 100,
      getText: jest.fn()
    };
    
    const mockTextEditor = {
      document: mockTextDocument,
      selection: undefined,
      revealRange: jest.fn()
    };

    mockOpenTextDocument.mockResolvedValue(mockTextDocument);
    mockShowTextDocument.mockResolvedValue(mockTextEditor);

    const filePath = '/test/file.ts';
    const line = 0;
    const column = 0;

    await navigateToLocation(filePath, line, column);

    expect(mockOpenTextDocument).toHaveBeenCalled();
    expect(mockShowTextDocument).toHaveBeenCalled();
    expect(mockShowErrorMessage).not.toHaveBeenCalled();
  });

  test('should handle navigation with large line numbers', async () => {
    const mockTextDocument = {
      uri: mockUri,
      lineCount: 10000,
      getText: jest.fn()
    };
    
    const mockTextEditor = {
      document: mockTextDocument,
      selection: undefined,
      revealRange: jest.fn()
    };

    mockOpenTextDocument.mockResolvedValue(mockTextDocument);
    mockShowTextDocument.mockResolvedValue(mockTextEditor);

    const filePath = '/test/large-file.ts';
    const line = 9999;
    const column = 100;

    await navigateToLocation(filePath, line, column);

    expect(mockOpenTextDocument).toHaveBeenCalled();
    expect(mockShowTextDocument).toHaveBeenCalled();
    expect(mockShowErrorMessage).not.toHaveBeenCalled();
  });

  test('should handle empty or invalid file path gracefully', async () => {
    mockOpenTextDocument.mockRejectedValue(new Error('Invalid file path'));

    const filePath = '';

    await navigateToLocation(filePath);

    expect(mockShowErrorMessage).toHaveBeenCalled();
    expect(mockShowTextDocument).not.toHaveBeenCalled();
  });
});