import { parseTestResults } from '../resultParser';

describe('parseTestResults', () => {
  test('should parse successful test results with all tests passing', () => {
    const input = {
      success: true,
      numFailedTests: 0,
      numPassedTests: 10,
      numTotalTests: 10,
      testResults: [
        {
          assertionResults: [
            {
              ancestorTitles: ['Suite 1'],
              title: 'test 1',
              status: 'passed',
              duration: 100,
              failureMessages: []
            }
          ],
          name: '/path/to/test.ts'
        }
      ]
    };
    
    const result = parseTestResults(input);
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.totalTests).toBe(10);
    expect(result.passedTests).toBe(10);
    expect(result.failedTests).toBe(0);
  });

  test('should parse test results with failures', () => {
    const input = {
      success: false,
      numFailedTests: 2,
      numPassedTests: 8,
      numTotalTests: 10,
      testResults: [
        {
          assertionResults: [
            {
              ancestorTitles: ['Suite 1'],
              title: 'failing test',
              status: 'failed',
              duration: 50,
              failureMessages: ['Expected true but got false']
            },
            {
              ancestorTitles: ['Suite 1'],
              title: 'passing test',
              status: 'passed',
              duration: 30,
              failureMessages: []
            }
          ],
          name: '/path/to/test.ts'
        }
      ]
    };
    
    const result = parseTestResults(input);
    
    expect(result.success).toBe(false);
    expect(result.failedTests).toBe(2);
    expect(result.passedTests).toBe(8);
    expect(result.failures).toBeDefined();
    expect(result.failures.length).toBeGreaterThan(0);
  });

  test('should handle empty test results', () => {
    const input = {
      success: true,
      numFailedTests: 0,
      numPassedTests: 0,
      numTotalTests: 0,
      testResults: []
    };
    
    const result = parseTestResults(input);
    
    expect(result.totalTests).toBe(0);
    expect(result.passedTests).toBe(0);
    expect(result.failedTests).toBe(0);
  });

  test('should handle skipped tests', () => {
    const input = {
      success: true,
      numFailedTests: 0,
      numPassedTests: 5,
      numPendingTests: 2,
      numTotalTests: 7,
      testResults: [
        {
          assertionResults: [
            {
              ancestorTitles: ['Suite 1'],
              title: 'skipped test',
              status: 'pending',
              duration: 0,
              failureMessages: []
            },
            {
              ancestorTitles: ['Suite 1'],
              title: 'passed test',
              status: 'passed',
              duration: 20,
              failureMessages: []
            }
          ],
          name: '/path/to/test.ts'
        }
      ]
    };
    
    const result = parseTestResults(input);
    
    expect(result.totalTests).toBe(7);
    expect(result.skippedTests).toBeDefined();
  });

  test('should handle null or undefined input gracefully', () => {
    expect(() => parseTestResults(null as any)).not.toThrow();
    expect(() => parseTestResults(undefined as any)).not.toThrow();
  });

  test('should parse multiple test suites', () => {
    const input = {
      success: true,
      numFailedTests: 0,
      numPassedTests: 15,
      numTotalTests: 15,
      testResults: [
        {
          assertionResults: [
            {
              ancestorTitles: ['Suite 1'],
              title: 'test 1',
              status: 'passed',
              duration: 10,
              failureMessages: []
            }
          ],
          name: '/path/to/test1.ts'
        },
        {
          assertionResults: [
            {
              ancestorTitles: ['Suite 2'],
              title: 'test 2',
              status: 'passed',
              duration: 20,
              failureMessages: []
            }
          ],
          name: '/path/to/test2.ts'
        }
      ]
    };
    
    const result = parseTestResults(input);
    
    expect(result.testResults).toBeDefined();
    expect(result.testResults.length).toBe(2);
  });

  test('should extract error messages from failures', () => {
    const input = {
      success: false,
      numFailedTests: 1,
      numPassedTests: 0,
      numTotalTests: 1,
      testResults: [
        {
          assertionResults: [
            {
              ancestorTitles: ['Error Suite'],
              title: 'should fail with message',
              status: 'failed',
              duration: 5,
              failureMessages: [
                'Error: Expected value to be 5 but got 3',
                'at test.ts:10:5'
              ]
            }
          ],
          name: '/path/to/test.ts'
        }
      ]
    };
    
    const result = parseTestResults(input);
    
    expect(result.failures).toBeDefined();
    expect(result.failures[0].message).toContain('Expected value');
  });

  test('should calculate total duration', () => {
    const input = {
      success: true,
      numFailedTests: 0,
      numPassedTests: 3,
      numTotalTests: 3,
      testResults: [
        {
          assertionResults: [
            {
              ancestorTitles: ['Suite'],
              title: 'test 1',
              status: 'passed',
              duration: 100,
              failureMessages: []
            },
            {
              ancestorTitles: ['Suite'],
              title: 'test 2',
              status: 'passed',
              duration: 200,
              failureMessages: []
            },
            {
              ancestorTitles: ['Suite'],
              title: 'test 3',
              status: 'passed',
              duration: 300,
              failureMessages: []
            }
          ],
          name: '/path/to/test.ts'
        }
      ]
    };
    
    const result = parseTestResults(input);
    
    expect(result.duration).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
  });

  test('should handle malformed test results structure', () => {
    const input = {
      success: true,
      testResults: [
        {
          assertionResults: null,
          name: '/path/to/test.ts'
        }
      ]
    };
    
    expect(() => parseTestResults(input as any)).not.toThrow();
  });
});