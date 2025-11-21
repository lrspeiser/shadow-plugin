import * as ts from 'typescript';
import { EnhancedAnalyzer } from '../enhancedAnalyzer';

// Mocks
jest.mock('vscode');

describe('EnhancedAnalyzer - visit function', () => {
  let analyzer: EnhancedAnalyzer;
  let sourceFile: ts.SourceFile;
  let found: ts.Node | undefined;
  let startLine: number;
  let functionName: string;

  beforeEach(() => {
    analyzer = new EnhancedAnalyzer();
    found = undefined;
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
    return (node: ts.Node) => {
      const nodeLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      
      if (
        (ts.isFunctionDeclaration(node) ||
         ts.isMethodDeclaration(node) ||
         ts.isFunctionExpression(node) ||
         ts.isArrowFunction(node)) &&
        nodeLine === startLine
      ) {
        const name = (analyzer as any).getFunctionName(node);
        if (name === functionName || nodeLine === startLine) {
          found = node as any;
          return;
        }
      }

      ts.forEachChild(node, createVisit());
    };
  };

  describe('function declarations', () => {
    test('should find function declaration on matching line', () => {
      const code = `function testFunc() {\n  return 42;\n}`;
      sourceFile = createSourceFile(code);
      startLine = 1;
      functionName = 'testFunc';
      const visit = createVisit();

      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
      expect(ts.isFunctionDeclaration(found!)).toBe(true);
    });

    test('should find function declaration by line number when name matches', () => {
      const code = `\nfunction myFunction() {\n  return true;\n}`;
      sourceFile = createSourceFile(code);
      startLine = 2;
      functionName = 'myFunction';
      const visit = createVisit();

      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
    });

    test('should not find function on different line', () => {
      const code = `function testFunc() {\n  return 42;\n}`;
      sourceFile = createSourceFile(code);
      startLine = 5;
      functionName = 'testFunc';
      const visit = createVisit();

      ts.forEachChild(sourceFile, visit);

      expect(found).toBeUndefined();
    });
  });

  describe('method declarations', () => {
    test('should find method declaration on matching line', () => {
      const code = `class MyClass {\n  myMethod() {\n    return 1;\n  }\n}`;
      sourceFile = createSourceFile(code);
      startLine = 2;
      functionName = 'myMethod';
      const visit = createVisit();

      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
      expect(ts.isMethodDeclaration(found!)).toBe(true);
    });
  });

  describe('function expressions', () => {
    test('should find function expression on matching line', () => {
      const code = `const myFunc = function() {\n  return 42;\n};`;
      sourceFile = createSourceFile(code);
      startLine = 1;
      functionName = 'myFunc';
      const visit = createVisit();

      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
      expect(ts.isFunctionExpression(found!)).toBe(true);
    });
  });

  describe('arrow functions', () => {
    test('should find arrow function on matching line', () => {
      const code = `const arrowFunc = () => {\n  return 42;\n};`;
      sourceFile = createSourceFile(code);
      startLine = 1;
      functionName = 'arrowFunc';
      const visit = createVisit();

      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
      expect(ts.isArrowFunction(found!)).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle nested functions and find correct one', () => {
      const code = `function outer() {\n  function inner() {\n    return 1;\n  }\n}`;
      sourceFile = createSourceFile(code);
      startLine = 2;
      functionName = 'inner';
      const visit = createVisit();

      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
    });

    test('should match by line number even if name differs', () => {
      const code = `function testFunc() {\n  return 42;\n}`;
      sourceFile = createSourceFile(code);
      startLine = 1;
      functionName = 'wrongName';
      const visit = createVisit();

      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
    });

    test('should stop traversal once function is found', () => {
      const code = `function first() {}\nfunction second() {}`;
      sourceFile = createSourceFile(code);
      startLine = 1;
      functionName = 'first';
      const visit = createVisit();

      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
      const foundName = (analyzer as any).getFunctionName(found);
      expect(foundName).toBe('first');
    });

    test('should handle empty source file', () => {
      const code = ``;
      sourceFile = createSourceFile(code);
      startLine = 1;
      functionName = 'test';
      const visit = createVisit();

      ts.forEachChild(sourceFile, visit);

      expect(found).toBeUndefined();
    });

    test('should handle multiple functions on different lines', () => {
      const code = `function first() {}\n\nfunction second() {}\n\nfunction third() {}`;
      sourceFile = createSourceFile(code);
      startLine = 3;
      functionName = 'second';
      const visit = createVisit();

      ts.forEachChild(sourceFile, visit);

      expect(found).toBeDefined();
    });
  });
});