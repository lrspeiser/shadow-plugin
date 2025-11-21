import { updateProblemsPanel } from '../problemsIntegration';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('updateProblemsPanel', () => {
  let mockDiagnosticCollection: jest.Mocked<vscode.DiagnosticCollection>;
  let mockUri: vscode.Uri;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDiagnosticCollection = {
      clear: jest.fn(),
      delete: jest.fn(),
      dispose: jest.fn(),
      forEach: jest.fn(),
      get: jest.fn(),
      has: jest.fn(),
      set: jest.fn(),
      name: 'test-diagnostics'
    } as any;

    mockUri = vscode.Uri.file('/test/file.ts');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should clear diagnostics when problems array is empty', () => {
    updateProblemsPanel(mockDiagnosticCollection, mockUri, []);
    
    expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(mockUri, []);
  });

  test('should set diagnostics for a single problem', () => {
    const problems = [
      {
        message: 'Test error',
        line: 1,
        column: 5,
        severity: 'error'
      }
    ];

    updateProblemsPanel(mockDiagnosticCollection, mockUri, problems);
    
    expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
      mockUri,
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Test error'
        })
      ])
    );
  });

  test('should set diagnostics for multiple problems', () => {
    const problems = [
      {
        message: 'Error 1',
        line: 1,
        column: 5,
        severity: 'error'
      },
      {
        message: 'Warning 1',
        line: 3,
        column: 10,
        severity: 'warning'
      },
      {
        message: 'Info 1',
        line: 5,
        column: 1,
        severity: 'info'
      }
    ];

    updateProblemsPanel(mockDiagnosticCollection, mockUri, problems);
    
    expect(mockDiagnosticCollection.set).toHaveBeenCalledTimes(1);
    expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
      mockUri,
      expect.arrayContaining([
        expect.objectContaining({ message: 'Error 1' }),
        expect.objectContaining({ message: 'Warning 1' }),
        expect.objectContaining({ message: 'Info 1' })
      ])
    );
  });

  test('should handle null or undefined URI gracefully', () => {
    const problems = [{ message: 'Test', line: 1, column: 1, severity: 'error' }];
    
    expect(() => {
      updateProblemsPanel(mockDiagnosticCollection, null as any, problems);
    }).not.toThrow();
  });

  test('should handle null diagnostic collection', () => {
    const problems = [{ message: 'Test', line: 1, column: 1, severity: 'error' }];
    
    expect(() => {
      updateProblemsPanel(null as any, mockUri, problems);
    }).not.toThrow();
  });

  test('should handle problems with missing fields', () => {
    const problems = [
      {
        message: 'Incomplete problem',
        line: 1
      } as any
    ];

    expect(() => {
      updateProblemsPanel(mockDiagnosticCollection, mockUri, problems);
    }).not.toThrow();
  });

  test('should handle problems with zero-based line numbers', () => {
    const problems = [
      {
        message: 'Line 0 error',
        line: 0,
        column: 0,
        severity: 'error'
      }
    ];

    updateProblemsPanel(mockDiagnosticCollection, mockUri, problems);
    
    expect(mockDiagnosticCollection.set).toHaveBeenCalled();
  });

  test('should handle problems with negative line numbers', () => {
    const problems = [
      {
        message: 'Negative line',
        line: -1,
        column: 5,
        severity: 'error'
      }
    ];

    expect(() => {
      updateProblemsPanel(mockDiagnosticCollection, mockUri, problems);
    }).not.toThrow();
  });

  test('should handle different severity levels', () => {
    const problems = [
      { message: 'Error msg', line: 1, column: 1, severity: 'error' },
      { message: 'Warning msg', line: 2, column: 1, severity: 'warning' },
      { message: 'Info msg', line: 3, column: 1, severity: 'information' },
      { message: 'Hint msg', line: 4, column: 1, severity: 'hint' }
    ];

    updateProblemsPanel(mockDiagnosticCollection, mockUri, problems);
    
    expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
      mockUri,
      expect.arrayContaining([
        expect.objectContaining({ message: 'Error msg' }),
        expect.objectContaining({ message: 'Warning msg' }),
        expect.objectContaining({ message: 'Info msg' }),
        expect.objectContaining({ message: 'Hint msg' })
      ])
    );
  });

  test('should handle very long problem messages', () => {
    const longMessage = 'A'.repeat(10000);
    const problems = [
      {
        message: longMessage,
        line: 1,
        column: 1,
        severity: 'error'
      }
    ];

    expect(() => {
      updateProblemsPanel(mockDiagnosticCollection, mockUri, problems);
    }).not.toThrow();
    
    expect(mockDiagnosticCollection.set).toHaveBeenCalled();
  });

  test('should handle problems with special characters in messages', () => {
    const problems = [
      {
        message: 'Error: "quoted" & <tagged> \n newline',
        line: 1,
        column: 1,
        severity: 'error'
      }
    ];

    updateProblemsPanel(mockDiagnosticCollection, mockUri, problems);
    
    expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
      mockUri,
      expect.arrayContaining([
        expect.objectContaining({ message: 'Error: "quoted" & <tagged> \n newline' })
      ])
    );
  });
});