import { FileWatcherService } from '../../../domain/services/fileWatcherService';
import * as vscode from 'vscode';

// Test: test_onFileChange_triggers_analysis
// Verifies file change detection triggers incremental analysis
import { FileWatcherService } from '../../../domain/services/fileWatcherService';
import * as vscode from 'vscode';

jest.mock('vscode');

describe('FileWatcherService.onFileChange', () => {
  let fileWatcher: FileWatcherService;
  let mockWatcher: any;
  let changeCallback: Function;

  beforeEach(() => {
    mockWatcher = {
      onDidChange: jest.fn((cb) => { changeCallback = cb; }),
      onDidCreate: jest.fn(),
      onDidDelete: jest.fn(),
      dispose: jest.fn()
    };
    
    (vscode.workspace.createFileSystemWatcher as jest.Mock) = jest.fn().mockReturnValue(mockWatcher);
    
    fileWatcher = new FileWatcherService();
  });

  test('triggers analysis on file save', () => {
    const onChangeSpy = jest.fn();
    fileWatcher.onFileChange(onChangeSpy);
    
    const mockUri = { fsPath: '/workspace/src/test.ts' } as vscode.Uri;
    changeCallback(mockUri);
    
    expect(onChangeSpy).toHaveBeenCalledWith(mockUri);
  });

  test('filters non-code files', () => {
    const onChangeSpy = jest.fn();
    fileWatcher.onFileChange(onChangeSpy);
    
    const mockUri = { fsPath: '/workspace/README.md' } as vscode.Uri;
    changeCallback(mockUri);
    
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  test('disposes watcher on cleanup', () => {
    fileWatcher.dispose();
    
    expect(mockWatcher.dispose).toHaveBeenCalled();
  });
});
