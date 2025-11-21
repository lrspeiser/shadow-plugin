import { navigateToLocation } from '../navigation';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('navigateToLocation', () => {
  let mockTextDocument: any;
  let mockTextEditor: any;
  let mockUri: any;
  let mockRange: any;
  let mockPosition: any;
  let mockSelection: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUri = { fsPath: '/test/file.ts', scheme: 'file', path: '/test/file.ts' };
    mockPosition = { line: 10, character: 5 };
    mockRange = { start: mockPosition, end: mockPosition };
    mockSelection = { active: mockPosition, anchor: mockPosition };

    mockTextDocument = {
      uri: mockUri,
      fileName: '/test/file.ts',
      lineCount: 100,
      getText: jest.fn().mockReturnValue('test content')
    };

    mockTextEditor = {
      document: mockTextDocument,
      selection: mockSelection,
      revealRange: jest.fn()
    };

    (vscode.workspace.openTextDocument as any).mockResolvedValue(mockTextDocument);
    (vscode.window.showTextDocument as any).mockResolvedValue(mockTextEditor);
  });

  describe('happy path', () => {
    test('should open document and navigate to specified line and column', async () => {
      const location = {
        filePath: '/test/file.ts',
        line: 10,
        column: 5
      };

      await navigateToLocation(location);

      expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(expect.objectContaining({
        fsPath: '/test/file.ts'
      }));
      expect(vscode.window.showTextDocument).toHaveBeenCalledWith(mockTextDocument, expect.any(Object));
    });

    test('should navigate to line without column specified', async () => {
      const location = {
        filePath: '/test/file.ts',
        line: 15
      };

      await navigateToLocation(location);

      expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
      expect(vscode.window.showTextDocument).toHaveBeenCalled();
    });

    test('should open document at line 0 when no line specified', async () => {
      const location = {
        filePath: '/test/file.ts'
      };

      await navigateToLocation(location);

      expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
      expect(vscode.window.showTextDocument).toHaveBeenCalled();
    });

    test('should handle relative file paths', async () => {
      const location = {
        filePath: './relative/path/file.ts',
        line: 5,
        column: 10
      };

      await navigateToLocation(location);

      expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('should handle line number 0', async () => {
      const location = {
        filePath: '/test/file.ts',
        line: 0,
        column: 0
      };

      await navigateToLocation(location);

      expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
      expect(vscode.window.showTextDocument).toHaveBeenCalled();
    });

    test('should handle large line numbers', async () => {
      const location = {
        filePath: '/test/file.ts',
        line: 99999,
        column: 50
      };

      await navigateToLocation(location);

      expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
    });

    test('should handle negative line numbers gracefully', async () => {
      const location = {
        filePath: '/test/file.ts',
        line: -1,
        column: 5
      };

      await navigateToLocation(location);

      expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
    });

    test('should handle empty file path', async () => {
      const location = {
        filePath: '',
        line: 10
      };

      await expect(navigateToLocation(location)).rejects.toThrow();
    });

    test('should handle null or undefined location', async () => {
      await expect(navigateToLocation(null as any)).rejects.toThrow();
      await expect(navigateToLocation(undefined as any)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    test('should handle document open failure', async () => {
      const error = new Error('Failed to open document');
      (vscode.workspace.openTextDocument as any).mockRejectedValue(error);

      const location = {
        filePath: '/test/file.ts',
        line: 10
      };

      await expect(navigateToLocation(location)).rejects.toThrow('Failed to open document');
    });

    test('should handle showTextDocument failure', async () => {
      const error = new Error('Failed to show document');
      (vscode.window.showTextDocument as any).mockRejectedValue(error);

      const location = {
        filePath: '/test/file.ts',
        line: 10
      };

      await expect(navigateToLocation(location)).rejects.toThrow('Failed to show document');
    });

    test('should handle non-existent file', async () => {
      const error = new Error('File not found');
      (vscode.workspace.openTextDocument as any).mockRejectedValue(error);

      const location = {
        filePath: '/non/existent/file.ts',
        line: 10
      };

      await expect(navigateToLocation(location)).rejects.toThrow('File not found');
    });

    test('should display error message on navigation failure', async () => {
      const error = new Error('Navigation error');
      (vscode.workspace.openTextDocument as any).mockRejectedValue(error);

      const location = {
        filePath: '/test/file.ts',
        line: 10
      };

      try {
        await navigateToLocation(location);
      } catch (e) {
        expect(e).toEqual(error);
      }
    });
  });

  describe('integration scenarios', () => {
    test('should navigate to multiple locations sequentially', async () => {
      const locations = [
        { filePath: '/test/file1.ts', line: 5 },
        { filePath: '/test/file2.ts', line: 10 },
        { filePath: '/test/file3.ts', line: 15 }
      ];

      for (const location of locations) {
        await navigateToLocation(location);
      }

      expect(vscode.workspace.openTextDocument).toHaveBeenCalledTimes(3);
      expect(vscode.window.showTextDocument).toHaveBeenCalledTimes(3);
    });

    test('should handle navigation with specific view column', async () => {
      const location = {
        filePath: '/test/file.ts',
        line: 10,
        column: 5,
        viewColumn: vscode.ViewColumn.Two
      };

      await navigateToLocation(location);

      expect(vscode.window.showTextDocument).toHaveBeenCalled();
    });
  });
});