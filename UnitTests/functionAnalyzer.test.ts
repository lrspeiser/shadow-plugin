import * as ts from 'typescript';

describe('visit function', () => {
  let sourceFile: ts.SourceFile;
  let found: ts.Node | undefined;
  let startLine: number;
  let functionName: string | undefined;

  const createVisit = () => {
    return (node: ts.Node) => {
      if (found) return;

      const nodeLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      
      if (
        (ts.isFunctionDeclaration(node) || 
         ts.isMethodDeclaration(node) || 
         ts.isFunctionExpression(node)) &&
        nodeLine === startLine
      ) {
        const name = ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)
          ? node.name?.getText(sourceFile)
          : undefined;
        
        if (name === functionName || (!name && ts.isFunctionExpression(node))) {
          found = node as any;
          return;
        }
      }

      ts.forEachChild(node, createVisit());
    };
  };

  beforeEach(() => {
    found = undefined;
    startLine = 1;
    functionName = undefined;
  });

  describe('happy path - finding function declarations', () => {
    test('should find a named function declaration at the correct line', () => {
      const code = `function testFunction() {\n  return 42;\n}`;
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      startLine = 1;
      functionName = 'testFunction';

      const visit = createVisit();
      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
      expect(ts.isFunctionDeclaration(found!)).toBe(true);
      expect((found as ts.FunctionDeclaration).name?.getText(sourceFile)).toBe('testFunction');
    });

    test('should find a method declaration at the correct line', () => {
      const code = `class MyClass {\n  myMethod() {\n    return 42;\n  }\n}`;
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      startLine = 2;
      functionName = 'myMethod';

      const visit = createVisit();
      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
      expect(ts.isMethodDeclaration(found!)).toBe(true);
    });

    test('should find a function expression without a name', () => {
      const code = `const myFunc = function() {\n  return 42;\n};`;
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      startLine = 1;
      functionName = undefined;

      const visit = createVisit();
      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
      expect(ts.isFunctionExpression(found!)).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should not find function at wrong line number', () => {
      const code = `function testFunction() {\n  return 42;\n}`;
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      startLine = 5;
      functionName = 'testFunction';

      const visit = createVisit();
      ts.forEachChild(sourceFile, visit);

      expect(found).toBeUndefined();
    });

    test('should not find function with wrong name', () => {
      const code = `function testFunction() {\n  return 42;\n}`;
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      startLine = 1;
      functionName = 'wrongName';

      const visit = createVisit();
      ts.forEachChild(sourceFile, visit);

      expect(found).toBeUndefined();
    });

    test('should stop visiting after finding the target node', () => {
      const code = `function testFunction() {\n  return 42;\n}\nfunction anotherFunction() {\n  return 24;\n}`;
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      startLine = 1;
      functionName = 'testFunction';

      const visit = createVisit();
      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
      expect((found as ts.FunctionDeclaration).name?.getText(sourceFile)).toBe('testFunction');
    });

    test('should handle nested functions correctly', () => {
      const code = `function outerFunction() {\n  function innerFunction() {\n    return 42;\n  }\n}`;
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      startLine = 2;
      functionName = 'innerFunction';

      const visit = createVisit();
      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
      expect((found as ts.FunctionDeclaration).name?.getText(sourceFile)).toBe('innerFunction');
    });

    test('should handle arrow functions by not finding them', () => {
      const code = `const arrowFunc = () => {\n  return 42;\n};`;
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      startLine = 1;
      functionName = 'arrowFunc';

      const visit = createVisit();
      ts.forEachChild(sourceFile, visit);

      expect(found).toBeUndefined();
    });

    test('should handle empty source file', () => {
      const code = ``;
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      startLine = 1;
      functionName = 'testFunction';

      const visit = createVisit();
      ts.forEachChild(sourceFile, visit);

      expect(found).toBeUndefined();
    });

    test('should handle multiple functions on same line', () => {
      const code = `function first() {} function second() {}`;
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      startLine = 1;
      functionName = 'second';

      const visit = createVisit();
      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
      expect((found as ts.FunctionDeclaration).name?.getText(sourceFile)).toBe('second');
    });
  });

  describe('early return behavior', () => {
    test('should return early if found is already set', () => {
      const code = `function testFunction() {\n  return 42;\n}`;
      sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      startLine = 1;
      functionName = 'testFunction';
      found = {} as ts.Node;

      const visit = createVisit();
      const initialFound = found;
      ts.forEachChild(sourceFile, visit);

      expect(found).toBe(initialFound);
    });
  });
});