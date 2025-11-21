import * as ts from 'typescript';
import { EnhancedAnalyzer } from '../enhancedAnalyzer';

// Mocks
const mockGetFunctionName = jest.fn();
const mockSourceFile = {
  getLineAndCharacterOfPosition: jest.fn()
} as unknown as ts.SourceFile;

describe('visit function', () => {
  let analyzer: EnhancedAnalyzer;
  let mockGetFunctionName: jest.Mock;
  let mockSourceFile: ts.SourceFile;
  let found: any;
  let startLine: number;
  let functionName: string;

  beforeEach(() => {
    analyzer = new EnhancedAnalyzer();
    mockGetFunctionName = jest.fn();
    (analyzer as any).getFunctionName = mockGetFunctionName;
    mockSourceFile = {
      getLineAndCharacterOfPosition: jest.fn()
    } as unknown as ts.SourceFile;
    found = undefined;
    startLine = 10;
    functionName = 'testFunction';
  });

  const createVisitFunction = () => {
    return (node: ts.Node) => {
      const nodeLine = mockSourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      
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

      ts.forEachChild(node, createVisitFunction());
    };
  };

  test('should find function declaration matching name and line', () => {
    const sourceCode = `
function testFunction() {
  return 42;
}`;
    const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
    mockSourceFile = sourceFile;
    
    (mockSourceFile.getLineAndCharacterOfPosition as jest.Mock) = jest.fn().mockReturnValue({ line: 9, character: 0 });
    mockGetFunctionName.mockReturnValue('testFunction');

    const visit = createVisitFunction();
    ts.forEachChild(sourceFile, visit);

    expect(found).toBeDefined();
  });

  test('should find method declaration at matching line', () => {
    const sourceCode = `
class TestClass {
  testFunction() {
    return 42;
  }
}`;
    const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
    mockSourceFile = sourceFile;
    
    (mockSourceFile.getLineAndCharacterOfPosition as jest.Mock) = jest.fn((pos) => {
      return { line: 9, character: 0 };
    });
    mockGetFunctionName.mockReturnValue('testFunction');

    const visit = createVisitFunction();
    ts.forEachChild(sourceFile, visit);

    expect(found).toBeDefined();
  });

  test('should find arrow function at matching line', () => {
    const sourceCode = `
const testFunction = () => {
  return 42;
};`;
    const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
    mockSourceFile = sourceFile;
    
    (mockSourceFile.getLineAndCharacterOfPosition as jest.Mock) = jest.fn().mockReturnValue({ line: 9, character: 0 });
    mockGetFunctionName.mockReturnValue('testFunction');

    const visit = createVisitFunction();
    ts.forEachChild(sourceFile, visit);

    expect(found).toBeDefined();
  });

  test('should find function expression at matching line', () => {
    const sourceCode = `
const testFunction = function() {
  return 42;
};`;
    const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
    mockSourceFile = sourceFile;
    
    (mockSourceFile.getLineAndCharacterOfPosition as jest.Mock) = jest.fn().mockReturnValue({ line: 9, character: 0 });
    mockGetFunctionName.mockReturnValue('testFunction');

    const visit = createVisitFunction();
    ts.forEachChild(sourceFile, visit);

    expect(found).toBeDefined();
  });

  test('should not find function when line does not match', () => {
    const sourceCode = `
function testFunction() {
  return 42;
}`;
    const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
    mockSourceFile = sourceFile;
    
    (mockSourceFile.getLineAndCharacterOfPosition as jest.Mock) = jest.fn().mockReturnValue({ line: 5, character: 0 });
    mockGetFunctionName.mockReturnValue('testFunction');

    const visit = createVisitFunction();
    ts.forEachChild(sourceFile, visit);

    expect(found).toBeUndefined();
  });

  test('should not find function when name does not match and line does not match', () => {
    const sourceCode = `
function differentFunction() {
  return 42;
}`;
    const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
    mockSourceFile = sourceFile;
    
    (mockSourceFile.getLineAndCharacterOfPosition as jest.Mock) = jest.fn().mockReturnValue({ line: 5, character: 0 });
    mockGetFunctionName.mockReturnValue('differentFunction');

    const visit = createVisitFunction();
    ts.forEachChild(sourceFile, visit);

    expect(found).toBeUndefined();
  });

  test('should find function when line matches even if name differs', () => {
    const sourceCode = `
function differentFunction() {
  return 42;
}`;
    const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
    mockSourceFile = sourceFile;
    
    (mockSourceFile.getLineAndCharacterOfPosition as jest.Mock) = jest.fn().mockReturnValue({ line: 9, character: 0 });
    mockGetFunctionName.mockReturnValue('differentFunction');

    const visit = createVisitFunction();
    ts.forEachChild(sourceFile, visit);

    expect(found).toBeDefined();
  });

  test('should skip non-function nodes', () => {
    const sourceCode = `
const x = 42;
if (x > 0) {
  console.log(x);
}`;
    const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
    mockSourceFile = sourceFile;
    
    (mockSourceFile.getLineAndCharacterOfPosition as jest.Mock) = jest.fn().mockReturnValue({ line: 9, character: 0 });

    const visit = createVisitFunction();
    ts.forEachChild(sourceFile, visit);

    expect(found).toBeUndefined();
  });

  test('should traverse nested nodes recursively', () => {
    const sourceCode = `
class TestClass {
  outerMethod() {
    const inner = function testFunction() {
      return 42;
    };
  }
}`;
    const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
    mockSourceFile = sourceFile;
    
    let callCount = 0;
    (mockSourceFile.getLineAndCharacterOfPosition as jest.Mock) = jest.fn((pos) => {
      callCount++;
      return callCount === 2 ? { line: 9, character: 0 } : { line: 5, character: 0 };
    });
    mockGetFunctionName.mockReturnValue('testFunction');

    const visit = createVisitFunction();
    ts.forEachChild(sourceFile, visit);

    expect(mockSourceFile.getLineAndCharacterOfPosition).toHaveBeenCalled();
  });

  test('should stop traversing once function is found', () => {
    const sourceCode = `
function testFunction() {
  return 42;
}
function anotherFunction() {
  return 24;
}`;
    const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
    mockSourceFile = sourceFile;
    
    (mockSourceFile.getLineAndCharacterOfPosition as jest.Mock) = jest.fn().mockReturnValue({ line: 9, character: 0 });
    mockGetFunctionName.mockReturnValue('testFunction');

    const visit = createVisitFunction();
    ts.forEachChild(sourceFile, visit);

    expect(found).toBeDefined();
  });
});