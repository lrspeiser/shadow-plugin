import { calculateComplexity } from '../metrics';

describe('calculateComplexity', () => {
  test('should return 1 for empty or minimal code', () => {
    const result = calculateComplexity('');
    expect(result).toBe(1);
  });

  test('should return 1 for simple straight-line code', () => {
    const code = `
      const x = 5;
      const y = 10;
      return x + y;
    `;
    const result = calculateComplexity(code);
    expect(result).toBe(1);
  });

  test('should increment complexity for if statement', () => {
    const code = `
      if (condition) {
        doSomething();
      }
    `;
    const result = calculateComplexity(code);
    expect(result).toBeGreaterThan(1);
  });

  test('should increment complexity for each branch', () => {
    const code = `
      if (condition1) {
        doSomething();
      } else if (condition2) {
        doSomethingElse();
      } else {
        doDefault();
      }
    `;
    const result = calculateComplexity(code);
    expect(result).toBeGreaterThanOrEqual(3);
  });

  test('should increment complexity for loops', () => {
    const code = `
      for (let i = 0; i < 10; i++) {
        doSomething(i);
      }
      while (condition) {
        doSomething();
      }
    `;
    const result = calculateComplexity(code);
    expect(result).toBeGreaterThanOrEqual(3);
  });

  test('should increment complexity for switch cases', () => {
    const code = `
      switch (value) {
        case 1:
          doOne();
          break;
        case 2:
          doTwo();
          break;
        default:
          doDefault();
      }
    `;
    const result = calculateComplexity(code);
    expect(result).toBeGreaterThanOrEqual(3);
  });

  test('should increment complexity for logical operators', () => {
    const code = `
      if (condition1 && condition2 || condition3) {
        doSomething();
      }
    `;
    const result = calculateComplexity(code);
    expect(result).toBeGreaterThanOrEqual(3);
  });

  test('should increment complexity for ternary operators', () => {
    const code = `
      const result = condition ? valueA : valueB;
    `;
    const result = calculateComplexity(code);
    expect(result).toBeGreaterThan(1);
  });

  test('should increment complexity for try-catch blocks', () => {
    const code = `
      try {
        riskyOperation();
      } catch (error) {
        handleError(error);
      }
    `;
    const result = calculateComplexity(code);
    expect(result).toBeGreaterThan(1);
  });

  test('should handle nested control structures', () => {
    const code = `
      for (let i = 0; i < 10; i++) {
        if (condition1) {
          while (condition2) {
            if (condition3) {
              doSomething();
            }
          }
        }
      }
    `;
    const result = calculateComplexity(code);
    expect(result).toBeGreaterThanOrEqual(5);
  });

  test('should handle complex real-world function', () => {
    const code = `
      function processData(data) {
        if (!data) {
          return null;
        }
        
        for (let item of data) {
          if (item.type === 'A' && item.valid) {
            processTypeA(item);
          } else if (item.type === 'B' || item.type === 'C') {
            processTypeBC(item);
          } else {
            try {
              processDefault(item);
            } catch (e) {
              logError(e);
            }
          }
        }
        
        return data.length > 0 ? data : null;
      }
    `;
    const result = calculateComplexity(code);
    expect(result).toBeGreaterThanOrEqual(8);
  });

  test('should return number type', () => {
    const result = calculateComplexity('const x = 1;');
    expect(typeof result).toBe('number');
  });

  test('should handle null or undefined input gracefully', () => {
    const result1 = calculateComplexity(null as any);
    const result2 = calculateComplexity(undefined as any);
    expect(result1).toBe(1);
    expect(result2).toBe(1);
  });

  test('should handle very long code without errors', () => {
    const longCode = 'const x = 1;\n'.repeat(1000);
    const result = calculateComplexity(longCode);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(typeof result).toBe('number');
  });
});