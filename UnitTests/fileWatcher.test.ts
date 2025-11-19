import { FileWatcher } from '../fileWatcher';
import * as vscode from 'vscode';
jest.mock('vscode');

// Test: test_file_save_triggers_analysis
// Verifies file save events trigger incremental analysis
describe('FileWatcher - onFileChange', () => {
  let fileWatcher: FileWatcher;
  let mockAnalyzer: any;
  let mockWatcher: any;

  beforeEach(() => {
    mockAnalyzer = {
      analyzeFile: jest.fn().mockResolvedValue({ insights: [] })
    };

    mockWatcher = {
      onDidChange: jest.fn(),
      onDidCreate: jest.fn(),
      onDidDelete: jest.fn()
    };

    (vscode.workspace.createFileSystemWatcher as jest.Mock).mockReturnValue(mockWatcher);

    fileWatcher = new FileWatcher('/workspace', mockAnalyzer);
    jest.clearAllMocks();
  });

  test('should trigger analysis on file save', async () => {
    const mockUri = { fsPath: '/workspace/src/test.ts' } as vscode.Uri;

    await fileWatcher.onFileChange(mockUri);

    expect(mockAnalyzer.analyzeFile).toHaveBeenCalledWith('/workspace/src/test.ts');
  });

  test('should debounce rapid consecutive saves', async () => {
    jest.useFakeTimers();
    const mockUri = { fsPath: '/workspace/src/test.ts' } as vscode.Uri;

    fileWatcher.onFileChange(mockUri);
    fileWatcher.onFileChange(mockUri);
    fileWatcher.onFileChange(mockUri);

    jest.advanceTimersByTime(1000);

    expect(mockAnalyzer.analyzeFile).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  test('should ignore excluded file patterns', async () => {
    const mockUri = { fsPath: '/workspace/node_modules/test.js' } as vscode.Uri;

    await fileWatcher.onFileChange(mockUri);

    expect(mockAnalyzer.analyzeFile).not.toHaveBeenCalled();
  });
});
