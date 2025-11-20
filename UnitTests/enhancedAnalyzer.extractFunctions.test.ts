import { EnhancedAnalyzer } from '../enhancedAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');

describe('EnhancedAnalyzer - extractFunctions (for loop branch extraction)', () => {
  let analyzer: EnhancedAnalyzer;
  const mockFilePath = '/test/file.ts';

  beforeEach(() => {
    analyzer = new EnhancedAnalyzer();
  });

  test('should extract if statement branches correctly', () => {
    const functionContent = `function testFunc() {
  if (x > 0) {
    return true;
  }
  if (y < 10) {
    return false;
  }
}`;
    
    const func = {
      name: 'testFunc',
      startLine: 1,
      endLine: 8,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    expect(result.branches).toHaveLength(2);
    expect(result.branches[0]).toMatchObject({
      type: 'if',
      condition: expect.stringContaining('if (x > 0)')
    });
    expect(result.branches[1]).toMatchObject({
      type: 'if',
      condition: expect.stringContaining('if (y < 10)')
    });
  });

  test('should extract else and else-if branches correctly', () => {
    const functionContent = `function testFunc() {
  if (x > 0) {
    return 1;
  } else if (x < 0) {
    return -1;
  } else {
    return 0;
  }
}`;
    
    const func = {
      name: 'testFunc',
      startLine: 1,
      endLine: 9,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    expect(result.branches).toHaveLength(3);
    expect(result.branches.filter((b: any) => b.type === 'if')).toHaveLength(2);
    expect(result.branches.filter((b: any) => b.type === 'else')).toHaveLength(1);
  });

  test('should extract loop branches (for, while, do) correctly', () => {
    const functionContent = `function testFunc() {
  for (let i = 0; i < 10; i++) {
    console.log(i);
  }
  while (x > 0) {
    x--;
  }
  do {
    y++;
  } while (y < 5);
}`;
    
    const func = {
      name: 'testFunc',
      startLine: 1,
      endLine: 11,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    const loopBranches = result.branches.filter((b: any) => b.type === 'loop');
    expect(loopBranches).toHaveLength(3);
    expect(loopBranches[0].condition).toContain('for');
    expect(loopBranches[1].condition).toContain('while');
    expect(loopBranches[2].condition).toContain('do');
  });

  test('should extract exception branches (throw/raise) correctly', () => {
    const functionContent = `function testFunc() {
  if (error) {
    throw new Error('Something went wrong');
  }
  if (invalid) {
    raise Exception('Invalid input');
  }
}`;
    
    const func = {
      name: 'testFunc',
      startLine: 1,
      endLine: 7,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    const exceptionBranches = result.branches.filter((b: any) => b.type === 'exception');
    expect(exceptionBranches).toHaveLength(2);
    expect(exceptionBranches[0].condition).toBe('exception thrown');
  });

  test('should extract try-catch branches correctly', () => {
    const functionContent = `function testFunc() {
  try {
    riskyOperation();
  } catch (error) {
    handleError(error);
  }
}`;
    
    const func = {
      name: 'testFunc',
      startLine: 1,
      endLine: 6,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    const tryBranches = result.branches.filter((b: any) => b.type === 'try');
    const catchBranches = result.branches.filter((b: any) => b.type === 'catch');
    expect(tryBranches).toHaveLength(1);
    expect(catchBranches).toHaveLength(1);
  });

  test('should extract database dependencies correctly', () => {
    const functionContent = `function testFunc() {
  db.query('SELECT * FROM users');
  database.connect();
  sql.execute('INSERT INTO table');
  orm.save(entity);
  repository.findAll();
}`;
    
    const func = {
      name: 'testFunc',
      startLine: 1,
      endLine: 6,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    const dbDeps = result.dependencies.filter((d: any) => d.type === 'db');
    expect(dbDeps.length).toBeGreaterThanOrEqual(1);
    expect(dbDeps[0].name).toBe('database');
    expect(dbDeps[0].isInternal).toBe(false);
  });

  test('should extract HTTP dependencies correctly', () => {
    const functionContent = `function testFunc() {
  fetch.get('https://api.example.com');
  http.request(options);
  axios.post('/api/data', data);
  request.send();
}`;
    
    const func = {
      name: 'testFunc',
      startLine: 1,
      endLine: 5,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    const httpDeps = result.dependencies.filter((d: any) => d.type === 'http');
    expect(httpDeps.length).toBeGreaterThanOrEqual(1);
    expect(httpDeps[0].name).toBe('http');
  });

  test('should extract filesystem dependencies correctly', () => {
    const functionContent = `function testFunc() {
  fs.readFileSync('path/to/file');
  readFile.async('data.json');
  writeFile.sync('output.txt', data);
}`;
    
    const func = {
      name: 'testFunc',
      startLine: 1,
      endLine: 4,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    const fsDeps = result.dependencies.filter((d: any) => d.type === 'filesystem');
    expect(fsDeps.length).toBeGreaterThanOrEqual(1);
    expect(fsDeps[0].name).toBe('filesystem');
  });

  test('should extract state mutations correctly', () => {
    const functionContent = `function testFunc() {
  count = 0;
  userName = 'John';
  isActive = true;
  result = calculateValue();
}`;
    
    const func = {
      name: 'testFunc',
      startLine: 1,
      endLine: 5,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    expect(result.stateMutations).toHaveLength(4);
    expect(result.stateMutations[0]).toMatchObject({
      target: 'count',
      mutationType: 'assign'
    });
    expect(result.stateMutations[1]).toMatchObject({
      target: 'userName',
      mutationType: 'assign'
    });
  });

  test('should extract function parameters with types and defaults', () => {
    const functionContent = `function testFunc(name: string, age: number = 25, optional?: boolean) {
  return name;
}`;
    
    const func = {
      name: 'testFunc',
      startLine: 1,
      endLine: 3,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    expect(result.parameters).toHaveLength(3);
    expect(result.parameters[0]).toMatchObject({
      name: 'name',
      type: 'string',
      optional: false
    });
    expect(result.parameters[1]).toMatchObject({
      name: 'age',
      type: 'number',
      defaultValue: '25',
      optional: true
    });
    expect(result.parameters[2]).toMatchObject({
      name: 'optional',
      optional: true
    });
  });

  test('should handle function with no parameters', () => {
    const functionContent = `function testFunc() {
  return 42;
}`;
    
    const func = {
      name: 'testFunc',
      startLine: 1,
      endLine: 3,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    expect(result.parameters).toHaveLength(0);
    expect(result.symbolName).toBe('testFunc');
    expect(result.file).toBe(mockFilePath);
  });

  test('should handle complex function with multiple constructs', () => {
    const functionContent = `function complexFunc(input: string, options?: object) {
  try {
    if (input.length > 0) {
      for (let i = 0; i < input.length; i++) {
        result = process(input[i]);
        db.save(result);
      }
    } else {
      throw new Error('Empty input');
    }
  } catch (error) {
    http.post('/api/error', error);
  }
  return result;
}`;
    
    const func = {
      name: 'complexFunc',
      startLine: 1,
      endLine: 14,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    expect(result.branches.length).toBeGreaterThan(0);
    expect(result.dependencies.length).toBeGreaterThan(0);
    expect(result.stateMutations.length).toBeGreaterThan(0);
    expect(result.riskLevel).toBeDefined();
    expect(result.startLine).toBe(1);
    expect(result.endLine).toBe(14);
  });

  test('should calculate correct line numbers relative to function start', () => {
    const functionContent = `function testFunc() {
  if (x > 0) {
    return true;
  }
}`;
    
    const func = {
      name: 'testFunc',
      startLine: 10,
      endLine: 14,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    expect(result.branches[0].lineNumber).toBe(11);
  });

  test('should handle edge case with empty function body', () => {
    const functionContent = `function emptyFunc() {}`;
    
    const func = {
      name: 'emptyFunc',
      startLine: 1,
      endLine: 1,
      content: functionContent
    };

    const result = (analyzer as any).extractFunctionMetadata(func, mockFilePath);

    expect(result.branches).toHaveLength(0);
    expect(result.dependencies).toHaveLength(0);
    expect(result.stateMutations).toHaveLength(0);
    expect(result.symbolName).toBe('emptyFunc');
  });
});