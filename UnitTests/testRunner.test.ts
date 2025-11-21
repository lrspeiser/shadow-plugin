import { executeTestBatch } from '../testRunner';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mocks
jest.mock('child_process');

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

describe('executeTestBatch', () => {
  let mockProcess: any;
  let stdoutEmitter: EventEmitter;
  let stderrEmitter: EventEmitter;

  beforeEach(() => {
    jest.clearAllMocks();
    
    stdoutEmitter = new EventEmitter();
    stderrEmitter = new EventEmitter();
    
    mockProcess = new EventEmitter();
    mockProcess.stdout = stdoutEmitter;
    mockProcess.stderr = stderrEmitter;
    mockProcess.kill = jest.fn();
    
    mockSpawn.mockReturnValue(mockProcess as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should successfully execute test batch and return results', async () => {
    const testFiles = ['test1.spec.ts', 'test2.spec.ts'];
    const options = { framework: 'jest', timeout: 5000 };
    
    const executePromise = executeTestBatch(testFiles, options);
    
    setTimeout(() => {
      stdoutEmitter.emit('data', Buffer.from('PASS test1.spec.ts\n'));
      stdoutEmitter.emit('data', Buffer.from('PASS test2.spec.ts\n'));
      mockProcess.emit('close', 0);
    }, 10);
    
    const result = await executePromise;
    
    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result.exitCode).toBe(0);
    expect(result.passed).toBe(true);
  });

  test('should handle test failures and return error information', async () => {
    const testFiles = ['failing-test.spec.ts'];
    const options = { framework: 'jest', timeout: 5000 };
    
    const executePromise = executeTestBatch(testFiles, options);
    
    setTimeout(() => {
      stdoutEmitter.emit('data', Buffer.from('FAIL failing-test.spec.ts\n'));
      stderrEmitter.emit('data', Buffer.from('Error: Test assertion failed\n'));
      mockProcess.emit('close', 1);
    }, 10);
    
    const result = await executePromise;
    
    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result.exitCode).toBe(1);
    expect(result.passed).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should handle process spawn errors', async () => {
    const testFiles = ['test.spec.ts'];
    const options = { framework: 'jest', timeout: 5000 };
    
    const executePromise = executeTestBatch(testFiles, options);
    
    setTimeout(() => {
      mockProcess.emit('error', new Error('Failed to spawn process'));
    }, 10);
    
    await expect(executePromise).rejects.toThrow('Failed to spawn process');
    expect(mockSpawn).toHaveBeenCalledTimes(1);
  });

  test('should handle timeout and kill process', async () => {
    const testFiles = ['slow-test.spec.ts'];
    const options = { framework: 'jest', timeout: 100 };
    
    const executePromise = executeTestBatch(testFiles, options);
    
    await expect(executePromise).rejects.toThrow(/timeout/i);
    expect(mockProcess.kill).toHaveBeenCalled();
  });

  test('should handle empty test file array', async () => {
    const testFiles: string[] = [];
    const options = { framework: 'jest', timeout: 5000 };
    
    await expect(executeTestBatch(testFiles, options)).rejects.toThrow(/no test files/i);
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  test('should pass correct arguments to spawn based on test framework', async () => {
    const testFiles = ['test.spec.ts'];
    const options = { framework: 'mocha', timeout: 5000 };
    
    const executePromise = executeTestBatch(testFiles, options);
    
    setTimeout(() => {
      mockProcess.emit('close', 0);
    }, 10);
    
    await executePromise;
    
    expect(mockSpawn).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['test.spec.ts']),
      expect.any(Object)
    );
  });

  test('should collect and parse test output correctly', async () => {
    const testFiles = ['test.spec.ts'];
    const options = { framework: 'jest', timeout: 5000 };
    
    const executePromise = executeTestBatch(testFiles, options);
    
    setTimeout(() => {
      stdoutEmitter.emit('data', Buffer.from('Test Suites: 1 passed, 1 total\n'));
      stdoutEmitter.emit('data', Buffer.from('Tests: 5 passed, 5 total\n'));
      stdoutEmitter.emit('data', Buffer.from('Time: 2.5s\n'));
      mockProcess.emit('close', 0);
    }, 10);
    
    const result = await executePromise;
    
    expect(result.passed).toBe(true);
    expect(result.output).toContain('Test Suites: 1 passed');
    expect(result.output).toContain('Tests: 5 passed');
  });

  test('should handle stderr output without failing', async () => {
    const testFiles = ['test.spec.ts'];
    const options = { framework: 'jest', timeout: 5000 };
    
    const executePromise = executeTestBatch(testFiles, options);
    
    setTimeout(() => {
      stderrEmitter.emit('data', Buffer.from('Warning: Deprecated API used\n'));
      stdoutEmitter.emit('data', Buffer.from('PASS test.spec.ts\n'));
      mockProcess.emit('close', 0);
    }, 10);
    
    const result = await executePromise;
    
    expect(result.passed).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});