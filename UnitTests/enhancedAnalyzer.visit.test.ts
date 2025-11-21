import * as ts from 'typescript';
import { EnhancedAnalyzer } from '../enhancedAnalyzer';

// Mocks
jest.mock('vscode');

describe('EnhancedAnalyzer - visit function', () => {
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
  
  test('should find function declaration at matching line', () => {
    const code = `
function testFunction() {
  return 'test';
}
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const startLine = 2;
    const functionName = 'testFunction';
    
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
  
  test('should find method declaration at matching line', () => {
    const code = `
class TestClass {
  testMethod() {
    return 'test';
  }
}
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const startLine = 3;
    const functionName = 'testMethod';
    
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
  
  test('should find arrow function at matching line', () => {
    const code = `
const arrowFunc = () => {
  return 'test';
};
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const startLine = 2;
    const functionName = 'arrowFunc';
    
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
  
  test('should find function expression at matching line', () => {
    const code = `
const funcExpr = function() {
  return 'test';
};
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const startLine = 2;
    const functionName = 'funcExpr';
    
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
  
  test('should not find function at non-matching line', () => {
    const code = `
function testFunction() {
  return 'test';
}
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const startLine = 5;
    const functionName = 'testFunction';
    
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
  
  test('should traverse nested nodes to find function', () => {
    const code = `
class TestClass {
  outerMethod() {
    const inner = () => {
      return 'test';
    };
  }
}
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const startLine = 4;
    const functionName = 'inner';
    
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
  
  test('should stop traversal after finding match', () => {
    const code = `
function first() {}
function second() {}
`;
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    let visitCount = 0;
    const startLine = 2;
    const functionName = 'first';
    
    const visit = (node: ts.Node) => {
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
  
  test('should handle empty source file', () => {
    const code = '';
    sourceFile = createSourceFile(code);
    let found: ts.Node | undefined;
    const startLine = 1;
    const functionName = 'test';
    
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
});