import { setupFileWatcher } from '../fileWatcher';
import * as vscode from 'vscode';
import { processFileChanges } from '../processFileChanges';

// Mocks
jest.mock('vscode');
jest.mock('../processFileChanges');

describe('setupFileWatcher', () => {
  let mockContext: vscode.ExtensionContext;
  let mockFileWatcher: any;
  let mockDisposable: vscode.Disposable;
  let mockProcessFileChanges: jest.MockedFunction<typeof processFileChanges>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDisposable = { dispose: jest.fn() };
    mockFileWatcher = {
      onDidCreate: jest.fn().mockReturnValue(mockDisposable),
      onDidChange: jest.fn().mockReturnValue(mockDisposable),
      onDidDelete: jest.fn().mockReturnValue(mockDisposable),
      dispose: jest.fn()
    };
    
    mockContext = new vscode.ExtensionContext();
    mockContext.subscriptions = [];
    
    (vscode.workspace as any).createFileSystemWatcher = jest.fn().mockReturnValue(mockFileWatcher);
    mockProcessFileChanges = processFileChanges as jest.MockedFunction<typeof processFileChanges>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Happy Path', () => {
    test('should create file system watcher with correct pattern', () => {
      setupFileWatcher(mockContext);
      
      expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledWith(
        expect.any(String)
      );
    });

    test('should register onDidCreate event handler', () => {
      setupFileWatcher(mockContext);
      
      expect(mockFileWatcher.onDidCreate).toHaveBeenCalled();
      expect(mockFileWatcher.onDidCreate).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should register onDidChange event handler', () => {
      setupFileWatcher(mockContext);
      
      expect(mockFileWatcher.onDidChange).toHaveBeenCalled();
      expect(mockFileWatcher.onDidChange).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should register onDidDelete event handler', () => {
      setupFileWatcher(mockContext);
      
      expect(mockFileWatcher.onDidDelete).toHaveBeenCalled();
      expect(mockFileWatcher.onDidDelete).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should add watcher to context subscriptions', () => {
      setupFileWatcher(mockContext);
      
      expect(mockContext.subscriptions).toContain(mockFileWatcher);
    });

    test('should add event disposables to context subscriptions', () => {
      setupFileWatcher(mockContext);
      
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
      expect(mockContext.subscriptions).toContain(mockDisposable);
    });
  });

  describe('Event Handling', () => {
    test('should call processFileChanges when file is created', () => {
      let createHandler: Function;
      mockFileWatcher.onDidCreate.mockImplementation((handler: Function) => {
        createHandler = handler;
        return mockDisposable;
      });
      
      setupFileWatcher(mockContext);
      
      const testUri = vscode.Uri.file('/test/file.ts');
      createHandler!(testUri);
      
      expect(mockProcessFileChanges).toHaveBeenCalledWith(testUri, 'create');
    });

    test('should call processFileChanges when file is changed', () => {
      let changeHandler: Function;
      mockFileWatcher.onDidChange.mockImplementation((handler: Function) => {
        changeHandler = handler;
        return mockDisposable;
      });
      
      setupFileWatcher(mockContext);
      
      const testUri = vscode.Uri.file('/test/file.ts');
      changeHandler!(testUri);
      
      expect(mockProcessFileChanges).toHaveBeenCalledWith(testUri, 'change');
    });

    test('should call processFileChanges when file is deleted', () => {
      let deleteHandler: Function;
      mockFileWatcher.onDidDelete.mockImplementation((handler: Function) => {
        deleteHandler = handler;
        return mockDisposable;
      });
      
      setupFileWatcher(mockContext);
      
      const testUri = vscode.Uri.file('/test/file.ts');
      deleteHandler!(testUri);
      
      expect(mockProcessFileChanges).toHaveBeenCalledWith(testUri, 'delete');
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined context subscriptions', () => {
      const contextWithoutSubscriptions = { ...mockContext, subscriptions: undefined as any };
      
      expect(() => setupFileWatcher(contextWithoutSubscriptions)).not.toThrow();
    });

    test('should handle multiple file events in sequence', () => {
      let createHandler: Function;
      let changeHandler: Function;
      
      mockFileWatcher.onDidCreate.mockImplementation((handler: Function) => {
        createHandler = handler;
        return mockDisposable;
      });
      mockFileWatcher.onDidChange.mockImplementation((handler: Function) => {
        changeHandler = handler;
        return mockDisposable;
      });
      
      setupFileWatcher(mockContext);
      
      const testUri1 = vscode.Uri.file('/test/file1.ts');
      const testUri2 = vscode.Uri.file('/test/file2.ts');
      
      createHandler!(testUri1);
      changeHandler!(testUri2);
      
      expect(mockProcessFileChanges).toHaveBeenCalledTimes(2);
      expect(mockProcessFileChanges).toHaveBeenNthCalledWith(1, testUri1, 'create');
      expect(mockProcessFileChanges).toHaveBeenNthCalledWith(2, testUri2, 'change');
    });

    test('should handle null or undefined URI', () => {
      let createHandler: Function;
      mockFileWatcher.onDidCreate.mockImplementation((handler: Function) => {
        createHandler = handler;
        return mockDisposable;
      });
      
      setupFileWatcher(mockContext);
      
      expect(() => createHandler!(null)).not.toThrow();
      expect(() => createHandler!(undefined)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle error when creating file system watcher', () => {
      (vscode.workspace.createFileSystemWatcher as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to create watcher');
      });
      
      expect(() => setupFileWatcher(mockContext)).toThrow('Failed to create watcher');
    });

    test('should handle error in processFileChanges', () => {
      let createHandler: Function;
      mockFileWatcher.onDidCreate.mockImplementation((handler: Function) => {
        createHandler = handler;
        return mockDisposable;
      });
      mockProcessFileChanges.mockImplementation(() => {
        throw new Error('Processing failed');
      });
      
      setupFileWatcher(mockContext);
      
      const testUri = vscode.Uri.file('/test/file.ts');
      
      expect(() => createHandler!(testUri)).toThrow('Processing failed');
    });

    test('should handle watcher disposal error gracefully', () => {
      mockFileWatcher.dispose.mockImplementation(() => {
        throw new Error('Dispose failed');
      });
      
      setupFileWatcher(mockContext);
      
      expect(() => mockFileWatcher.dispose()).toThrow('Dispose failed');
    });
  });

  describe('Cleanup', () => {
    test('should properly dispose watcher when context is disposed', () => {
      setupFileWatcher(mockContext);
      
      mockContext.subscriptions.forEach(sub => {
        if (sub && typeof sub.dispose === 'function') {
          sub.dispose();
        }
      });
      
      expect(mockFileWatcher.dispose).toHaveBeenCalled();
    });

    test('should dispose all event handlers', () => {
      setupFileWatcher(mockContext);
      
      const disposables = mockContext.subscriptions.filter(
        sub => sub && typeof sub.dispose === 'function'
      );
      
      disposables.forEach(d => d.dispose());
      
      expect(mockDisposable.dispose).toHaveBeenCalled();
    });
  });
});