import * as ts from 'typescript';

describe('visit function', () => {
  let sourceFile: ts.SourceFile;
  let functionNames: Set<string>;
  let dependencies: string[];
  let visit: (n: ts.Node) => void;

  beforeEach(() => {
    functionNames = new Set<string>();
    dependencies = [];
    
    // Create the visit function as it appears in the source
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

  describe('identifier function calls', () => {
    test('should detect simple function call when function name is in set', () => {
      const code = 'myFunction();';
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      functionNames.add('myFunction');
      
      visit(sourceFile);
      
      expect(dependencies).toContain('myFunction');
      expect(dependencies.length).toBe(1);
    });

    test('should not detect function call when function name is not in set', () => {
      const code = 'myFunction();';
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      functionNames.add('otherFunction');
      
      visit(sourceFile);
      
      expect(dependencies).not.toContain('myFunction');
      expect(dependencies.length).toBe(0);
    });

    test('should detect multiple function calls', () => {
      const code = 'funcA(); funcB(); funcA();';
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      functionNames.add('funcA');
      functionNames.add('funcB');
      
      visit(sourceFile);
      
      expect(dependencies).toContain('funcA');
      expect(dependencies).toContain('funcB');
      expect(dependencies.length).toBe(3);
    });
  });

  describe('property access function calls', () => {
    test('should detect method call on property access', () => {
      const code = 'obj.myMethod();';
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      functionNames.add('myMethod');
      
      visit(sourceFile);
      
      expect(dependencies).toContain('myMethod');
      expect(dependencies.length).toBe(1);
    });

    test('should not detect method call when method name is not in set', () => {
      const code = 'obj.myMethod();';
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      functionNames.add('otherMethod');
      
      visit(sourceFile);
      
      expect(dependencies).not.toContain('myMethod');
      expect(dependencies.length).toBe(0);
    });

    test('should detect nested property access method calls', () => {
      const code = 'obj.nested.myMethod();';
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      functionNames.add('myMethod');
      
      visit(sourceFile);
      
      expect(dependencies).toContain('myMethod');
      expect(dependencies.length).toBe(1);
    });
  });

  describe('mixed scenarios', () => {
    test('should detect both identifier and property access calls', () => {
      const code = 'funcA(); obj.funcB(); funcC();';
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

    test('should handle function calls within nested blocks', () => {
      const code = 'function outer() { if (true) { inner(); } }';
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      functionNames.add('inner');
      
      visit(sourceFile);
      
      expect(dependencies).toContain('inner');
      expect(dependencies.length).toBe(1);
    });

    test('should handle function calls with arguments', () => {
      const code = 'myFunc(arg1, arg2, otherFunc());';
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      functionNames.add('myFunc');
      functionNames.add('otherFunc');
      
      visit(sourceFile);
      
      expect(dependencies).toContain('myFunc');
      expect(dependencies).toContain('otherFunc');
      expect(dependencies.length).toBe(2);
    });
  });

  describe('edge cases', () => {
    test('should handle empty source file', () => {
      const code = '';
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      functionNames.add('someFunc');
      
      visit(sourceFile);
      
      expect(dependencies.length).toBe(0);
    });

    test('should handle empty function names set', () => {
      const code = 'myFunction();';
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      
      visit(sourceFile);
      
      expect(dependencies.length).toBe(0);
    });

    test('should handle code with no function calls', () => {
      const code = 'const x = 5; const y = "hello";';
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      functionNames.add('myFunc');
      
      visit(sourceFile);
      
      expect(dependencies.length).toBe(0);
    });

    test('should handle same function called multiple times', () => {
      const code = 'func(); func(); func();';
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      functionNames.add('func');
      
      visit(sourceFile);
      
      expect(dependencies.filter(d => d === 'func').length).toBe(3);
    });
  });
});