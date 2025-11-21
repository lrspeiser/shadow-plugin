import { analyzeCodebase } from '../analyzer';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { parseFile } from '../parser';
import { extractFunctions } from '../extractor';
import { buildDependencyGraph } from '../dependencyGraph';

// Mocks
jest.mock('vscode');
jest.mock('fs');
jest.mock('path');
jest.mock('../parser');
jest.mock('../extractor');
jest.mock('../dependencyGraph');

describe('analyzeCodebase', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;
  const mockVscode = vscode as jest.Mocked<typeof vscode>;
  const mockParseFile = parseFile as jest.MockedFunction<typeof parseFile>;
  const mockExtractFunctions = extractFunctions as jest.MockedFunction<typeof extractFunctions>;
  const mockBuildDependencyGraph = buildDependencyGraph as jest.MockedFunction<typeof buildDependencyGraph>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.join = jest.fn((...args) => args.join('/'));
    mockPath.resolve = jest.fn((...args) => args.join('/'));
    mockPath.relative = jest.fn((from, to) => to);
    mockPath.extname = jest.fn((filePath) => {
      const match = filePath.match(/\.[^.]*$/);
      return match ? match[0] : '';
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Happy Path', () => {
    test('should successfully analyze a codebase with valid TypeScript files', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue([
        { fsPath: '/workspace/src/file1.ts' },
        { fsPath: '/workspace/src/file2.ts' }
      ]);

      mockFs.readFileSync = jest.fn().mockReturnValue('const foo = () => {};');
      mockParseFile.mockReturnValue({ ast: {}, sourceFile: {} } as any);
      mockExtractFunctions.mockReturnValue([
        { name: 'foo', startLine: 1, endLine: 3, complexity: 1, dependencies: [] }
      ]);
      mockBuildDependencyGraph.mockReturnValue({
        nodes: [{ id: 'foo', label: 'foo' }],
        edges: []
      });

      const result = await analyzeCodebase();

      expect(result).toBeDefined();
      expect(mockVscode.workspace.findFiles).toHaveBeenCalled();
      expect(mockParseFile).toHaveBeenCalledTimes(2);
      expect(mockExtractFunctions).toHaveBeenCalledTimes(2);
      expect(mockBuildDependencyGraph).toHaveBeenCalledTimes(1);
    });

    test('should handle multiple workspace folders', async () => {
      const mockWorkspaceFolders = [
        { uri: { fsPath: '/workspace1' }, name: 'project1', index: 0 },
        { uri: { fsPath: '/workspace2' }, name: 'project2', index: 1 }
      ];
      mockVscode.workspace.workspaceFolders = mockWorkspaceFolders;
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue([
        { fsPath: '/workspace1/src/file1.ts' }
      ]);

      mockFs.readFileSync = jest.fn().mockReturnValue('function test() {}');
      mockParseFile.mockReturnValue({ ast: {}, sourceFile: {} } as any);
      mockExtractFunctions.mockReturnValue([]);
      mockBuildDependencyGraph.mockReturnValue({ nodes: [], edges: [] });

      const result = await analyzeCodebase();

      expect(result).toBeDefined();
      expect(mockVscode.workspace.findFiles).toHaveBeenCalled();
    });

    test('should filter and process only TypeScript and JavaScript files', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue([
        { fsPath: '/workspace/src/file1.ts' },
        { fsPath: '/workspace/src/file2.js' },
        { fsPath: '/workspace/src/file3.tsx' },
        { fsPath: '/workspace/src/file4.json' },
        { fsPath: '/workspace/src/file5.md' }
      ]);

      mockFs.readFileSync = jest.fn().mockReturnValue('code');
      mockParseFile.mockReturnValue({ ast: {}, sourceFile: {} } as any);
      mockExtractFunctions.mockReturnValue([]);
      mockBuildDependencyGraph.mockReturnValue({ nodes: [], edges: [] });

      await analyzeCodebase();

      expect(mockParseFile).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty workspace', async () => {
      mockVscode.workspace.workspaceFolders = [];

      const result = await analyzeCodebase();

      expect(result).toEqual({ files: [], functions: [], dependencyGraph: { nodes: [], edges: [] } });
      expect(mockVscode.workspace.findFiles).not.toHaveBeenCalled();
    });

    test('should handle workspace with no files', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue([]);

      const result = await analyzeCodebase();

      expect(result).toBeDefined();
      expect(mockParseFile).not.toHaveBeenCalled();
    });

    test('should handle undefined workspace folders', async () => {
      mockVscode.workspace.workspaceFolders = undefined;

      const result = await analyzeCodebase();

      expect(result).toEqual({ files: [], functions: [], dependencyGraph: { nodes: [], edges: [] } });
    });

    test('should handle files with no functions', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue([
        { fsPath: '/workspace/src/empty.ts' }
      ]);

      mockFs.readFileSync = jest.fn().mockReturnValue('');
      mockParseFile.mockReturnValue({ ast: {}, sourceFile: {} } as any);
      mockExtractFunctions.mockReturnValue([]);
      mockBuildDependencyGraph.mockReturnValue({ nodes: [], edges: [] });

      const result = await analyzeCodebase();

      expect(result).toBeDefined();
      expect(mockExtractFunctions).toHaveBeenCalled();
    });

    test('should handle very large codebase', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      const largeFileList = Array.from({ length: 1000 }, (_, i) => ({
        fsPath: `/workspace/src/file${i}.ts`
      }));
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue(largeFileList);

      mockFs.readFileSync = jest.fn().mockReturnValue('function test() {}');
      mockParseFile.mockReturnValue({ ast: {}, sourceFile: {} } as any);
      mockExtractFunctions.mockReturnValue([{ name: 'test', startLine: 1, endLine: 1, complexity: 1, dependencies: [] }]);
      mockBuildDependencyGraph.mockReturnValue({ nodes: [], edges: [] });

      const result = await analyzeCodebase();

      expect(result).toBeDefined();
      expect(mockParseFile).toHaveBeenCalledTimes(1000);
    });
  });

  describe('Error Handling', () => {
    test('should handle file read errors gracefully', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue([
        { fsPath: '/workspace/src/file1.ts' }
      ]);

      mockFs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await analyzeCodebase();

      expect(result).toBeDefined();
      expect(mockParseFile).not.toHaveBeenCalled();
    });

    test('should handle parse errors and continue with other files', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue([
        { fsPath: '/workspace/src/file1.ts' },
        { fsPath: '/workspace/src/file2.ts' }
      ]);

      mockFs.readFileSync = jest.fn().mockReturnValue('invalid syntax!!!');
      mockParseFile.mockImplementationOnce(() => {
        throw new Error('Parse error');
      }).mockReturnValueOnce({ ast: {}, sourceFile: {} } as any);
      mockExtractFunctions.mockReturnValue([]);
      mockBuildDependencyGraph.mockReturnValue({ nodes: [], edges: [] });

      const result = await analyzeCodebase();

      expect(result).toBeDefined();
      expect(mockParseFile).toHaveBeenCalledTimes(2);
    });

    test('should handle extractFunctions errors', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue([
        { fsPath: '/workspace/src/file1.ts' }
      ]);

      mockFs.readFileSync = jest.fn().mockReturnValue('code');
      mockParseFile.mockReturnValue({ ast: {}, sourceFile: {} } as any);
      mockExtractFunctions.mockImplementation(() => {
        throw new Error('Extraction failed');
      });
      mockBuildDependencyGraph.mockReturnValue({ nodes: [], edges: [] });

      const result = await analyzeCodebase();

      expect(result).toBeDefined();
    });

    test('should handle buildDependencyGraph errors', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue([
        { fsPath: '/workspace/src/file1.ts' }
      ]);

      mockFs.readFileSync = jest.fn().mockReturnValue('code');
      mockParseFile.mockReturnValue({ ast: {}, sourceFile: {} } as any);
      mockExtractFunctions.mockReturnValue([]);
      mockBuildDependencyGraph.mockImplementation(() => {
        throw new Error('Graph build failed');
      });

      await expect(analyzeCodebase()).rejects.toThrow('Graph build failed');
    });

    test('should handle findFiles rejection', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      mockVscode.workspace.findFiles = jest.fn().mockRejectedValue(new Error('File search failed'));

      await expect(analyzeCodebase()).rejects.toThrow('File search failed');
    });

    test('should handle null or malformed file paths', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue([
        { fsPath: null },
        { fsPath: undefined },
        { fsPath: '' }
      ]);

      mockFs.readFileSync = jest.fn().mockReturnValue('code');
      mockParseFile.mockReturnValue({ ast: {}, sourceFile: {} } as any);
      mockExtractFunctions.mockReturnValue([]);
      mockBuildDependencyGraph.mockReturnValue({ nodes: [], edges: [] });

      const result = await analyzeCodebase();

      expect(result).toBeDefined();
      expect(mockParseFile).not.toHaveBeenCalled();
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle circular dependencies', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue([
        { fsPath: '/workspace/src/a.ts' },
        { fsPath: '/workspace/src/b.ts' }
      ]);

      mockFs.readFileSync = jest.fn().mockReturnValue('code');
      mockParseFile.mockReturnValue({ ast: {}, sourceFile: {} } as any);
      mockExtractFunctions.mockReturnValue([
        { name: 'funcA', startLine: 1, endLine: 5, complexity: 2, dependencies: ['funcB'] },
        { name: 'funcB', startLine: 6, endLine: 10, complexity: 2, dependencies: ['funcA'] }
      ]);
      mockBuildDependencyGraph.mockReturnValue({
        nodes: [{ id: 'funcA' }, { id: 'funcB' }],
        edges: [{ from: 'funcA', to: 'funcB' }, { from: 'funcB', to: 'funcA' }]
      });

      const result = await analyzeCodebase();

      expect(result).toBeDefined();
      expect(mockBuildDependencyGraph).toHaveBeenCalled();
    });

    test('should aggregate functions from multiple files', async () => {
      const mockWorkspaceFolder = { uri: { fsPath: '/workspace' }, name: 'test', index: 0 };
      mockVscode.workspace.workspaceFolders = [mockWorkspaceFolder];
      mockVscode.workspace.findFiles = jest.fn().mockResolvedValue([
        { fsPath: '/workspace/src/module1.ts' },
        { fsPath: '/workspace/src/module2.ts' }
      ]);

      mockFs.readFileSync = jest.fn().mockReturnValue('code');
      mockParseFile.mockReturnValue({ ast: {}, sourceFile: {} } as any);
      mockExtractFunctions
        .mockReturnValueOnce([{ name: 'func1', startLine: 1, endLine: 5, complexity: 1, dependencies: [] }])
        .mockReturnValueOnce([{ name: 'func2', startLine: 1, endLine: 5, complexity: 1, dependencies: [] }]);
      mockBuildDependencyGraph.mockReturnValue({ nodes: [], edges: [] });

      const result = await analyzeCodebase();

      expect(result).toBeDefined();
      expect(mockExtractFunctions).toHaveBeenCalledTimes(2);
    });
  });
});