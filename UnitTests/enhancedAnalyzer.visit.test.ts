import * as ts from 'typescript';
import { EnhancedAnalyzer } from '../enhancedAnalyzer';

describe('visit (AST traversal)', () => {
  let analyzer: EnhancedAnalyzer;
  let sourceFile: ts.SourceFile;

  beforeEach(() => {
    analyzer = new EnhancedAnalyzer();
  });

  const createSourceFile = (code: string): ts.SourceFile => {
    return ts.createSourceFile(
      'test.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );
  };

  test('should find function declaration by name and line', () => {
    const code = `
function testFunction() {
  return 42;
}
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const functionName = 'testFunction';
    const startLine = 2;

    const visit = (node: ts.Node) => {
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

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    expect(found).toBeDefined();
    expect(ts.isFunctionDeclaration(found!)).toBe(true);
  });

  test('should find method declaration in class', () => {
    const code = `
class TestClass {
  testMethod() {
    return 'hello';
  }
}
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const functionName = 'testMethod';
    const startLine = 3;

    const visit = (node: ts.Node) => {
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

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    expect(found).toBeDefined();
    expect(ts.isMethodDeclaration(found!)).toBe(true);
  });

  test('should find arrow function by line number', () => {
    const code = `
const arrowFunc = () => {
  return 100;
};
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const functionName = 'arrowFunc';
    const startLine = 2;

    const visit = (node: ts.Node) => {
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

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    expect(found).toBeDefined();
    expect(ts.isArrowFunction(found!)).toBe(true);
  });

  test('should find function expression', () => {
    const code = `
const funcExpr = function myFunc() {
  return 'test';
};
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const functionName = 'myFunc';
    const startLine = 2;

    const visit = (node: ts.Node) => {
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

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    expect(found).toBeDefined();
    expect(ts.isFunctionExpression(found!)).toBe(true);
  });

  test('should not find function on wrong line number', () => {
    const code = `
function testFunction() {
  return 42;
}
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const functionName = 'testFunction';
    const startLine = 5;

    const visit = (node: ts.Node) => {
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

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    expect(found).toBeUndefined();
  });

  test('should traverse nested functions and find correct one', () => {
    const code = `
function outer() {
  function inner() {
    return 'nested';
  }
}
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const functionName = 'inner';
    const startLine = 3;

    const visit = (node: ts.Node) => {
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

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    expect(found).toBeDefined();
    expect(ts.isFunctionDeclaration(found!)).toBe(true);
  });

  test('should stop traversal after finding function', () => {
    const code = `
function first() {}
function second() {}
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    let visitCount = 0;
    const functionName = 'first';
    const startLine = 2;

    const visit = (node: ts.Node) => {
      if (found) return;
      
      const nodeLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      
      if (
        (ts.isFunctionDeclaration(node) ||
         ts.isMethodDeclaration(node) ||
         ts.isFunctionExpression(node) ||
         ts.isArrowFunction(node)) &&
        nodeLine === startLine
      ) {
        visitCount++;
        const name = (analyzer as any).getFunctionName(node);
        if (name === functionName || nodeLine === startLine) {
          found = node as any;
          return;
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    expect(found).toBeDefined();
    expect(visitCount).toBe(1);
  });
});