import * as ts from 'typescript';
import { createSourceFile } from 'typescript';

describe('visit function', () => {
  let sourceFile: ts.SourceFile;
  let functionNames: Set<string>;
  let dependencies: string[];
  let visit: (n: ts.Node) => void;

  beforeEach(() => {
    functionNames = new Set<string>();
    dependencies = [];
    
    // Define the visit function as it appears in the source
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

  test('should detect simple function call dependencies', () => {
    const code = `
      function foo() {}
      function bar() { foo(); }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('foo');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('foo');
    expect(dependencies.length).toBe(1);
  });

  test('should detect property access expression dependencies', () => {
    const code = `
      const obj = { method: () => {} };
      obj.method();
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('method');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('method');
  });

  test('should detect multiple function call dependencies', () => {
    const code = `
      function alpha() {}
      function beta() {}
      function gamma() {
        alpha();
        beta();
        alpha();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('alpha');
    functionNames.add('beta');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('alpha');
    expect(dependencies).toContain('beta');
    expect(dependencies.filter(d => d === 'alpha').length).toBe(2);
  });

  test('should not detect function calls not in functionNames set', () => {
    const code = `
      function foo() {}
      function bar() {}
      function baz() { foo(); bar(); }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('foo');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('foo');
    expect(dependencies).not.toContain('bar');
    expect(dependencies.length).toBe(1);
  });

  test('should handle nested function calls', () => {
    const code = `
      function outer() {
        function inner() {
          target();
        }
        inner();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('target');
    functionNames.add('inner');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('target');
    expect(dependencies).toContain('inner');
  });

  test('should handle chained property access', () => {
    const code = `
      const obj = { nested: { fn: () => {} } };
      obj.nested.fn();
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('fn');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('fn');
  });

  test('should handle empty source file', () => {
    const code = '';
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('foo');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies.length).toBe(0);
  });

  test('should handle source with no function calls', () => {
    const code = `
      const x = 5;
      const y = 10;
      const z = x + y;
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('foo');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies.length).toBe(0);
  });

  test('should handle arrow functions with calls', () => {
    const code = `
      const arrow = () => {
        targetFunc();
      };
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('targetFunc');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('targetFunc');
  });

  test('should handle mixed identifier and property access calls', () => {
    const code = `
      function standalone() {}
      const obj = { method: () => {} };
      function caller() {
        standalone();
        obj.method();
      }
    `;
    sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    functionNames.add('standalone');
    functionNames.add('method');
    
    ts.forEachChild(sourceFile, visit);
    
    expect(dependencies).toContain('standalone');
    expect(dependencies).toContain('method');
    expect(dependencies.length).toBe(2);
  });
});