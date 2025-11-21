import * as ts from 'typescript';

describe('visit function', () => {
  let sourceFile: ts.SourceFile;
  let functionNames: Set<string>;
  let dependencies: string[];
  let visit: (n: ts.Node) => void;

  beforeEach(() => {
    functionNames = new Set<string>();
    dependencies = [];
    
    // Recreate the visit function with the test context
    visit = (n: ts.Node) => {
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
      function helper() { return 42; }
      function main() {
        helper();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('helper');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('helper');
    expect(dependencies.length).toBe(1);
  });

  test('should detect property access function call', () => {
    const code = `
      const obj = {
        myMethod() { return 42; }
      };
      function main() {
        obj.myMethod();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('myMethod');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('myMethod');
  });

  test('should detect multiple function calls', () => {
    const code = `
      function helper1() {}
      function helper2() {}
      function main() {
        helper1();
        helper2();
        helper1();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('helper1');
    functionNames.add('helper2');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toEqual(expect.arrayContaining(['helper1', 'helper2']));
    expect(dependencies.filter(d => d === 'helper1').length).toBe(2);
  });

  test('should ignore function calls not in functionNames set', () => {
    const code = `
      function external() {}
      function main() {
        external();
        console.log('test');
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('helper');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies.length).toBe(0);
  });

  test('should handle nested function calls', () => {
    const code = `
      function helper() {}
      function main() {
        if (true) {
          helper();
        }
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('helper');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('helper');
  });

  test('should handle empty source file', () => {
    const code = '';
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('helper');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies.length).toBe(0);
  });

  test('should handle source with no function calls', () => {
    const code = `
      const x = 42;
      const y = 'hello';
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('helper');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies.length).toBe(0);
  });

  test('should detect both identifier and property access calls', () => {
    const code = `
      function helper() {}
      const obj = {
        method() {}
      };
      function main() {
        helper();
        obj.method();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('helper');
    functionNames.add('method');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('helper');
    expect(dependencies).toContain('method');
    expect(dependencies.length).toBe(2);
  });

  test('should handle chained property access', () => {
    const code = `
      const obj = {
        nested: {
          deepMethod() {}
        }
      };
      function main() {
        obj.nested.deepMethod();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('deepMethod');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('deepMethod');
  });

  test('should handle arrow functions with calls', () => {
    const code = `
      function helper() {}
      const arrow = () => helper();
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('helper');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('helper');
  });
});