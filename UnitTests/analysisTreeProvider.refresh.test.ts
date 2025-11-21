import { EventEmitter } from 'vscode';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');

class MockAnalysisTreeProvider {
  private _onDidChangeTreeData: EventEmitter<any | undefined | null | void>;
  readonly onDidChangeTreeData: any;

  constructor() {
    this._onDidChangeTreeData = new EventEmitter<any | undefined | null | void>();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh(element?: any): void {
    this._onDidChangeTreeData.fire(element);
  }
}

describe('AnalysisTreeProvider.refresh', () => {
  let provider: MockAnalysisTreeProvider;
  let mockListener: jest.Mock;

  beforeEach(() => {
    provider = new MockAnalysisTreeProvider();
    mockListener = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should fire event with undefined when called without arguments', () => {
    provider.onDidChangeTreeData(mockListener);
    
    provider.refresh();
    
    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith(undefined);
  });

  test('should fire event with specific element when provided', () => {
    const testElement = { id: 'test-item', label: 'Test Item' };
    provider.onDidChangeTreeData(mockListener);
    
    provider.refresh(testElement);
    
    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith(testElement);
  });

  test('should fire event with null when explicitly passed', () => {
    provider.onDidChangeTreeData(mockListener);
    
    provider.refresh(null);
    
    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith(null);
  });

  test('should notify multiple listeners when refresh is called', () => {
    const mockListener1 = jest.fn();
    const mockListener2 = jest.fn();
    const mockListener3 = jest.fn();
    
    provider.onDidChangeTreeData(mockListener1);
    provider.onDidChangeTreeData(mockListener2);
    provider.onDidChangeTreeData(mockListener3);
    
    provider.refresh();
    
    expect(mockListener1).toHaveBeenCalledTimes(1);
    expect(mockListener2).toHaveBeenCalledTimes(1);
    expect(mockListener3).toHaveBeenCalledTimes(1);
  });

  test('should handle multiple consecutive refresh calls', () => {
    provider.onDidChangeTreeData(mockListener);
    
    provider.refresh();
    provider.refresh();
    provider.refresh();
    
    expect(mockListener).toHaveBeenCalledTimes(3);
  });

  test('should handle refresh with complex element objects', () => {
    const complexElement = {
      id: 'complex-1',
      label: 'Complex Item',
      children: [
        { id: 'child-1', label: 'Child 1' },
        { id: 'child-2', label: 'Child 2' }
      ],
      metadata: {
        timestamp: Date.now(),
        status: 'active'
      }
    };
    provider.onDidChangeTreeData(mockListener);
    
    provider.refresh(complexElement);
    
    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith(complexElement);
    expect(mockListener.mock.calls[0][0]).toEqual(complexElement);
  });

  test('should not throw error when refresh called with no listeners', () => {
    expect(() => {
      provider.refresh();
    }).not.toThrow();
  });

  test('should handle refresh with various falsy values', () => {
    provider.onDidChangeTreeData(mockListener);
    
    provider.refresh(0);
    expect(mockListener).toHaveBeenCalledWith(0);
    
    provider.refresh('');
    expect(mockListener).toHaveBeenCalledWith('');
    
    provider.refresh(false);
    expect(mockListener).toHaveBeenCalledWith(false);
    
    expect(mockListener).toHaveBeenCalledTimes(3);
  });
});