import { debounceFileChanges } from '../changeHandler';
import * as vscode from 'vscode';

// Mocks
jest.mock('vscode');
jest.useFakeTimers();

describe('debounceFileChanges', () => {
  let mockCallback: jest.Mock;
  let debounceInstance: any;

  beforeEach(() => {
    jest.useFakeTimers();
    mockCallback = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('should debounce multiple rapid file changes and call callback once', () => {
    debounceInstance = debounceFileChanges(mockCallback, 300);
    
    // Simulate multiple rapid file changes
    debounceInstance('file1.ts');
    debounceInstance('file2.ts');
    debounceInstance('file3.ts');
    
    // Callback should not be called yet
    expect(mockCallback).not.toHaveBeenCalled();
    
    // Fast-forward time
    jest.advanceTimersByTime(300);
    
    // Callback should be called once with the last file
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('file3.ts');
  });

  test('should reset timer on each new change', () => {
    debounceInstance = debounceFileChanges(mockCallback, 500);
    
    debounceInstance('file1.ts');
    jest.advanceTimersByTime(300);
    
    // Another change before timeout
    debounceInstance('file2.ts');
    jest.advanceTimersByTime(300);
    
    // Still should not be called
    expect(mockCallback).not.toHaveBeenCalled();
    
    // Complete the remaining time
    jest.advanceTimersByTime(200);
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('file2.ts');
  });

  test('should handle single file change', () => {
    debounceInstance = debounceFileChanges(mockCallback, 250);
    
    debounceInstance('single-file.ts');
    
    expect(mockCallback).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(250);
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('single-file.ts');
  });

  test('should handle multiple separate debounce periods', () => {
    debounceInstance = debounceFileChanges(mockCallback, 200);
    
    // First batch
    debounceInstance('file1.ts');
    jest.advanceTimersByTime(200);
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('file1.ts');
    
    // Second batch
    debounceInstance('file2.ts');
    jest.advanceTimersByTime(200);
    
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith('file2.ts');
  });

  test('should handle zero delay', () => {
    debounceInstance = debounceFileChanges(mockCallback, 0);
    
    debounceInstance('file.ts');
    
    jest.advanceTimersByTime(0);
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('file.ts');
  });

  test('should handle undefined or null file paths', () => {
    debounceInstance = debounceFileChanges(mockCallback, 100);
    
    debounceInstance(undefined);
    jest.advanceTimersByTime(100);
    
    expect(mockCallback).toHaveBeenCalledWith(undefined);
    
    mockCallback.mockClear();
    
    debounceInstance(null);
    jest.advanceTimersByTime(100);
    
    expect(mockCallback).toHaveBeenCalledWith(null);
  });

  test('should pass through any argument type to callback', () => {
    debounceInstance = debounceFileChanges(mockCallback, 150);
    
    const complexArg = { path: 'test.ts', type: 'change' };
    debounceInstance(complexArg);
    
    jest.advanceTimersByTime(150);
    
    expect(mockCallback).toHaveBeenCalledWith(complexArg);
  });

  test('should handle callback throwing error', () => {
    const errorCallback = jest.fn(() => {
      throw new Error('Callback error');
    });
    
    debounceInstance = debounceFileChanges(errorCallback, 100);
    
    debounceInstance('file.ts');
    
    expect(() => {
      jest.advanceTimersByTime(100);
    }).toThrow('Callback error');
    
    expect(errorCallback).toHaveBeenCalledTimes(1);
  });

  test('should maintain separate state for multiple debounce instances', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    const debounce1 = debounceFileChanges(callback1, 100);
    const debounce2 = debounceFileChanges(callback2, 200);
    
    debounce1('file1.ts');
    debounce2('file2.ts');
    
    jest.advanceTimersByTime(100);
    
    expect(callback1).toHaveBeenCalledWith('file1.ts');
    expect(callback2).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(100);
    
    expect(callback2).toHaveBeenCalledWith('file2.ts');
  });

  test('should cancel previous timeout when new change occurs', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    debounceInstance = debounceFileChanges(mockCallback, 300);
    
    debounceInstance('file1.ts');
    debounceInstance('file2.ts');
    
    // clearTimeout should be called when new change arrives
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });
})