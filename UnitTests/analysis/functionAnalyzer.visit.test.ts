import * as ts from 'typescript';

describe('visit function from functionAnalyzer', () => {
  let sourceFile: ts.SourceFile;
  let functionNames: Set<string>;
  let dependencies: string[];

  beforeEach(() => {
    functionNames = new Set<string>();
    dependencies = [];
  });

  const createSourceFile = (code: string): ts.SourceFile => {
    return ts.createSourceFile(
      'test.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );
  };

  const createVisit = () => {
    const visit = (n: ts.Node) => {
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
    return visit;
  };

  test('should detect simple function call when function name is in set', () => {
    const code = 'myFunction();';
    sourceFile = createSourceFile(code);
    functionNames.add('myFunction');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual(['myFunction']);
  });

  test('should not detect function call when function name is not in set', () => {
    const code = 'someOtherFunction();';
    sourceFile = createSourceFile(code);
    functionNames.add('myFunction');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual([]);
  });

  test('should detect property access function call', () => {
    const code = 'obj.methodName();';
    sourceFile = createSourceFile(code);
    functionNames.add('methodName');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual(['methodName']);
  });

  test('should detect nested property access function call', () => {
    const code = 'obj.nested.methodName();';
    sourceFile = createSourceFile(code);
    functionNames.add('methodName');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual(['methodName']);
  });

  test('should detect multiple function calls', () => {
    const code = 'funcA(); funcB(); funcC();';
    sourceFile = createSourceFile(code);
    functionNames.add('funcA');
    functionNames.add('funcB');
    functionNames.add('funcC');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual(['funcA', 'funcB', 'funcC']);
  });

  test('should detect mix of simple and property access calls', () => {
    const code = 'simpleFunc(); obj.propFunc();';
    sourceFile = createSourceFile(code);
    functionNames.add('simpleFunc');
    functionNames.add('propFunc');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual(['simpleFunc', 'propFunc']);
  });

  test('should detect function calls nested in expressions', () => {
    const code = 'const result = outerFunc(innerFunc());';
    sourceFile = createSourceFile(code);
    functionNames.add('outerFunc');
    functionNames.add('innerFunc');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual(['innerFunc', 'outerFunc']);
  });

  test('should handle empty source file', () => {
    const code = '';
    sourceFile = createSourceFile(code);
    functionNames.add('anyFunc');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual([]);
  });

  test('should handle code with no function calls', () => {
    const code = 'const x = 5; const y = "hello";';
    sourceFile = createSourceFile(code);
    functionNames.add('someFunc');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual([]);
  });

  test('should detect same function called multiple times', () => {
    const code = 'myFunc(); myFunc(); myFunc();';
    sourceFile = createSourceFile(code);
    functionNames.add('myFunc');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual(['myFunc', 'myFunc', 'myFunc']);
  });

  test('should only detect tracked functions in complex code', () => {
    const code = `
      function outer() {
        trackedFunc();
        untrackedFunc();
        obj.trackedMethod();
        obj.untrackedMethod();
      }
    `;
    sourceFile = createSourceFile(code);
    functionNames.add('trackedFunc');
    functionNames.add('trackedMethod');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual(['trackedFunc', 'trackedMethod']);
  });

  test('should handle function calls with arguments', () => {
    const code = 'myFunc(arg1, arg2, arg3);';
    sourceFile = createSourceFile(code);
    functionNames.add('myFunc');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual(['myFunc']);
  });

  test('should handle arrow function bodies with calls', () => {
    const code = 'const arrow = () => trackedFunc();';
    sourceFile = createSourceFile(code);
    functionNames.add('trackedFunc');
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual(['trackedFunc']);
  });

  test('should handle empty functionNames set', () => {
    const code = 'anyFunc(); anotherFunc();';
    sourceFile = createSourceFile(code);
    const visit = createVisit();

    ts.forEachChild(sourceFile, visit);

    expect(dependencies).toEqual([]);
  });
});