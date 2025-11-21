import { navigateToLocation } from '../navigator';
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
    
    mockUri = { fsPath: '/test/file.ts', scheme: 'file', path: '/test/file.ts' };
    
    mockShowTextDocument.mockResolvedValue(undefined);
    mockOpenTextDocument.mockResolvedValue({ uri: mockUri });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Happy Path', () => {
    test('should navigate to a valid file location with line number', async () => {
      const filePath = '/test/file.ts';
      const line = 10;
      const column = 5;
      
      const uri = vscode.Uri.file(filePath);
      const mockDocument = { uri };
      mockOpenTextDocument.mockResolvedValue(mockDocument);
      
      await navigateToLocation(filePath, line, column);
      
      expect(mockOpenTextDocument).toHaveBeenCalledWith(uri);
      expect(mockShowTextDocument).toHaveBeenCalledWith(
        mockDocument,
        expect.objectContaining({
          selection: expect.any(Object)
        })
      );
    });

    test('should navigate to a file without line and column numbers', async () => {
      const filePath = '/test/file.ts';
      
      const uri = vscode.Uri.file(filePath);
      const mockDocument = { uri };
      mockOpenTextDocument.mockResolvedValue(mockDocument);
      
      await navigateToLocation(filePath);
      
      expect(mockOpenTextDocument).toHaveBeenCalledWith(uri);
      expect(mockShowTextDocument).toHaveBeenCalled();
    });

    test('should navigate to a file with only line number', async () => {
      const filePath = '/test/file.ts';
      const line = 5;
      
      const uri = vscode.Uri.file(filePath);
      const mockDocument = { uri };
      mockOpenTextDocument.mockResolvedValue(mockDocument);
      
      await navigateToLocation(filePath, line);
      
      expect(mockOpenTextDocument).toHaveBeenCalledWith(uri);
      expect(mockShowTextDocument).toHaveBeenCalled();
    });

    test('should handle zero-based line and column indices', async () => {
      const filePath = '/test/file.ts';
      const line = 0;
      const column = 0;
      
      const uri = vscode.Uri.file(filePath);
      const mockDocument = { uri };
      mockOpenTextDocument.mockResolvedValue(mockDocument);
      
      await navigateToLocation(filePath, line, column);
      
      expect(mockOpenTextDocument).toHaveBeenCalledWith(uri);
      expect(mockShowTextDocument).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty file path', async () => {
      const filePath = '';
      
      await navigateToLocation(filePath);
      
      expect(mockOpenTextDocument).not.toHaveBeenCalled();
      expect(mockShowErrorMessage).toHaveBeenCalled();
    });

    test('should handle null file path', async () => {
      const filePath = null as any;
      
      await navigateToLocation(filePath);
      
      expect(mockOpenTextDocument).not.toHaveBeenCalled();
    });

    test('should handle undefined file path', async () => {
      const filePath = undefined as any;
      
      await navigateToLocation(filePath);
      
      expect(mockOpenTextDocument).not.toHaveBeenCalled();
    });

    test('should handle negative line numbers', async () => {
      const filePath = '/test/file.ts';
      const line = -1;
      
      const uri = vscode.Uri.file(filePath);
      const mockDocument = { uri };
      mockOpenTextDocument.mockResolvedValue(mockDocument);
      
      await navigateToLocation(filePath, line);
      
      expect(mockOpenTextDocument).toHaveBeenCalled();
    });

    test('should handle very large line numbers', async () => {
      const filePath = '/test/file.ts';
      const line = 999999;
      
      const uri = vscode.Uri.file(filePath);
      const mockDocument = { uri };
      mockOpenTextDocument.mockResolvedValue(mockDocument);
      
      await navigateToLocation(filePath, line);
      
      expect(mockOpenTextDocument).toHaveBeenCalled();
    });

    test('should handle special characters in file path', async () => {
      const filePath = '/test/file with spaces & special-chars.ts';
      
      const uri = vscode.Uri.file(filePath);
      const mockDocument = { uri };
      mockOpenTextDocument.mockResolvedValue(mockDocument);
      
      await navigateToLocation(filePath);
      
      expect(mockOpenTextDocument).toHaveBeenCalledWith(uri);
    });
  });

  describe('Error Handling', () => {
    test('should handle error when opening document fails', async () => {
      const filePath = '/test/nonexistent.ts';
      const error = new Error('File not found');
      
      mockOpenTextDocument.mockRejectedValue(error);
      
      await navigateToLocation(filePath);
      
      expect(mockOpenTextDocument).toHaveBeenCalled();
      expect(mockShowErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('navigate')
      );
    });

    test('should handle error when showing document fails', async () => {
      const filePath = '/test/file.ts';
      const error = new Error('Cannot show document');
      
      const uri = vscode.Uri.file(filePath);
      const mockDocument = { uri };
      mockOpenTextDocument.mockResolvedValue(mockDocument);
      mockShowTextDocument.mockRejectedValue(error);
      
      await navigateToLocation(filePath);
      
      expect(mockShowTextDocument).toHaveBeenCalled();
      expect(mockShowErrorMessage).toHaveBeenCalled();
    });

    test('should handle permission denied error', async () => {
      const filePath = '/test/restricted.ts';
      const error = new Error('Permission denied');
      
      mockOpenTextDocument.mockRejectedValue(error);
      
      await navigateToLocation(filePath);
      
      expect(mockShowErrorMessage).toHaveBeenCalled();
    });

    test('should handle network path errors', async () => {
      const filePath = '//network/share/file.ts';
      const error = new Error('Network error');
      
      mockOpenTextDocument.mockRejectedValue(error);
      
      await navigateToLocation(filePath);
      
      expect(mockShowErrorMessage).toHaveBeenCalled();
    });
  });

  describe('Different File Schemes', () => {
    test('should handle file:// scheme', async () => {
      const filePath = 'file:///test/file.ts';
      
      const uri = vscode.Uri.file(filePath);
      const mockDocument = { uri };
      mockOpenTextDocument.mockResolvedValue(mockDocument);
      
      await navigateToLocation(filePath);
      
      expect(mockOpenTextDocument).toHaveBeenCalled();
    });

    test('should handle relative paths', async () => {
      const filePath = './src/test.ts';
      
      const uri = vscode.Uri.file(filePath);
      const mockDocument = { uri };
      mockOpenTextDocument.mockResolvedValue(mockDocument);
      
      await navigateToLocation(filePath);
      
      expect(mockOpenTextDocument).toHaveBeenCalled();
    });

    test('should handle Windows-style paths', async () => {
      const filePath = 'C:\\Users\\test\\file.ts';
      
      const uri = vscode.Uri.file(filePath);
      const mockDocument = { uri };
      mockOpenTextDocument.mockResolvedValue(mockDocument);
      
      await navigateToLocation(filePath);
      
      expect(mockOpenTextDocument).toHaveBeenCalled();
    });
  });
});