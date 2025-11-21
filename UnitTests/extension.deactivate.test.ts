import { deactivate } from '../extension';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

describe('deactivate', () => {
  let mockDisposables: Array<{ dispose: jest.Mock }>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDisposables = [];
  });

  test('should dispose all disposables when called', () => {
    const disposable1 = { dispose: jest.fn() };
    const disposable2 = { dispose: jest.fn() };
    const disposable3 = { dispose: jest.fn() };

    mockDisposables = [disposable1, disposable2, disposable3];

    (global as any).disposables = mockDisposables;

    deactivate();

    expect(disposable1.dispose).toHaveBeenCalledTimes(1);
    expect(disposable2.dispose).toHaveBeenCalledTimes(1);
    expect(disposable3.dispose).toHaveBeenCalledTimes(1);
  });

  test('should handle empty disposables array', () => {
    (global as any).disposables = [];

    expect(() => deactivate()).not.toThrow();
  });

  test('should handle undefined disposables gracefully', () => {
    (global as any).disposables = undefined;

    expect(() => deactivate()).not.toThrow();
  });

  test('should handle single disposable', () => {
    const disposable = { dispose: jest.fn() };
    (global as any).disposables = [disposable];

    deactivate();

    expect(disposable.dispose).toHaveBeenCalledTimes(1);
  });

  test('should continue disposing even if one disposable throws error', () => {
    const disposable1 = { dispose: jest.fn() };
    const disposable2 = { dispose: jest.fn(() => { throw new Error('Dispose error'); }) };
    const disposable3 = { dispose: jest.fn() };

    (global as any).disposables = [disposable1, disposable2, disposable3];

    try {
      deactivate();
    } catch (error) {
      // Expected to throw
    }

    expect(disposable1.dispose).toHaveBeenCalledTimes(1);
    expect(disposable2.dispose).toHaveBeenCalledTimes(1);
  });

  test('should handle null disposables in array', () => {
    const disposable1 = { dispose: jest.fn() };
    const disposable2 = null;
    const disposable3 = { dispose: jest.fn() };

    (global as any).disposables = [disposable1, disposable2, disposable3];

    deactivate();

    expect(disposable1.dispose).toHaveBeenCalledTimes(1);
    expect(disposable3.dispose).toHaveBeenCalledTimes(1);
  });

  test('should handle disposables with missing dispose method', () => {
    const disposable1 = { dispose: jest.fn() };
    const disposable2 = {} as any;
    const disposable3 = { dispose: jest.fn() };

    (global as any).disposables = [disposable1, disposable2, disposable3];

    deactivate();

    expect(disposable1.dispose).toHaveBeenCalledTimes(1);
    expect(disposable3.dispose).toHaveBeenCalledTimes(1);
  });
});