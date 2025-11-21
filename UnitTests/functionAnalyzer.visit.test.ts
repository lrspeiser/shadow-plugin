import * as ts from 'typescript';

describe('visit function', () => {
  let sourceFile: ts.SourceFile;
  let functionNames: Set<string>;
  let dependencies: string[];
  let visit: (n: ts.Node) => void;

  beforeEach(() => {
    functionNames = new Set<string>();
    dependencies = [];
    
    // Define the visit function that we're testing
    visit = (n: ts.Node) => {
      // Look for function calls
      if (ts.isCallExpression(n)) {
        const expression = n.expression;
        if (ts.isIdentifier(expression)) {
          const name = expression.getText(sourceFile);
          if (functionNames.has(name)) {
            dependencies.push(name);
          }
        } else if (ts.isPropertyAccessExpression(expression)) {
          const name = expression.name.getText(sourceFile);
          if (functionNames.has(name)) {
            dependencies.push(name);
          }
        }
      }

      ts.forEachChild(n, visit);
    };
  });

  test('should detect simple function call', () => {
    const code = `
      function test() {
        myFunction();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('myFunction');

    visit(sourceFile);

    expect(dependencies).toContain('myFunction');
    expect(dependencies.length).toBe(1);
  });

  test('should detect property access function call', () => {
    const code = `
      function test() {
        obj.myMethod();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('myMethod');

    visit(sourceFile);

    expect(dependencies).toContain('myMethod');
    expect(dependencies.length).toBe(1);
  });

  test('should detect multiple function calls', () => {
    const code = `
      function test() {
        funcA();
        funcB();
        obj.funcC();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('funcA');
    functionNames.add('funcB');
    functionNames.add('funcC');

    visit(sourceFile);

    expect(dependencies).toContain('funcA');
    expect(dependencies).toContain('funcB');
    expect(dependencies).toContain('funcC');
    expect(dependencies.length).toBe(3);
  });

  test('should ignore function calls not in functionNames set', () => {
    const code = `
      function test() {
        unknownFunction();
        obj.unknownMethod();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('knownFunction');

    visit(sourceFile);

    expect(dependencies.length).toBe(0);
  });

  test('should handle nested function calls', () => {
    const code = `
      function test() {
        funcA(funcB(funcC()));
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('funcA');
    functionNames.add('funcB');
    functionNames.add('funcC');

    visit(sourceFile);

    expect(dependencies).toContain('funcA');
    expect(dependencies).toContain('funcB');
    expect(dependencies).toContain('funcC');
    expect(dependencies.length).toBe(3);
  });

  test('should handle empty source file', () => {
    const code = '';
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('anyFunction');

    visit(sourceFile);

    expect(dependencies.length).toBe(0);
  });

  test('should handle code with no function calls', () => {
    const code = `
      const x = 5;
      const y = 10;
      const z = x + y;
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('myFunction');

    visit(sourceFile);

    expect(dependencies.length).toBe(0);
  });

  test('should detect same function called multiple times', () => {
    const code = `
      function test() {
        myFunc();
        myFunc();
        myFunc();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('myFunc');

    visit(sourceFile);

    expect(dependencies.filter(d => d === 'myFunc').length).toBe(3);
  });

  test('should handle chained property access', () => {
    const code = `
      function test() {
        obj.nested.myMethod();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('myMethod');

    visit(sourceFile);

    expect(dependencies).toContain('myMethod');
  });

  test('should handle mixed identifier and property access calls', () => {
    const code = `
      function test() {
        directCall();
        obj.methodCall();
        anotherDirectCall();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('directCall');
    functionNames.add('methodCall');
    functionNames.add('anotherDirectCall');

    visit(sourceFile);

    expect(dependencies).toContain('directCall');
    expect(dependencies).toContain('methodCall');
    expect(dependencies).toContain('anotherDirectCall');
    expect(dependencies.length).toBe(3);
  });

  test('should handle function calls with arguments', () => {
    const code = `
      function test() {
        myFunc(1, 2, 3);
        obj.method('arg1', 'arg2');
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('myFunc');
    functionNames.add('method');

    visit(sourceFile);

    expect(dependencies).toContain('myFunc');
    expect(dependencies).toContain('method');
    expect(dependencies.length).toBe(2);
  });
});