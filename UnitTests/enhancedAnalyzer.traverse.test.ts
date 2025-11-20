import * as fs from 'fs';
import * as path from 'path';
import { vol } from 'memfs';

// Mocks
jest.mock('fs');

import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('traverse (recursive)', () => {
  let testFiles: string[];
  let mockReaddirSync: jest.MockedFunction<typeof fs.readdirSync>;

  const createTraverse = () => {
    testFiles = [];
    const traverse = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              traverse(fullPath);
            }
          } else if (entry.isFile()) {
            const fileName = entry.name.toLowerCase();
            if (
              fileName.includes('test') ||
              fileName.includes('spec') ||
              fileName.endsWith('.test.ts') ||
              fileName.endsWith('.test.js') ||
              fileName.endsWith('.spec.ts') ||
              fileName.endsWith('.spec.js')
            ) {
              testFiles.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    return traverse;
  };

  const createMockDirent = (name: string, isDir: boolean): fs.Dirent => ({
    name,
    isFile: () => !isDir,
    isDirectory: () => isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    path: '',
    parentPath: ''
  } as fs.Dirent);

  beforeEach(() => {
    mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
    jest.clearAllMocks();
  });

  test('should find test files with various naming patterns', () => {
    const traverse = createTraverse();
    
    mockReaddirSync.mockReturnValueOnce([
      createMockDirent('component.test.ts', false),
      createMockDirent('service.spec.js', false),
      createMockDirent('utils.test.js', false),
      createMockDirent('integration.spec.ts', false),
      createMockDirent('testHelper.ts', false),
      createMockDirent('mySpec.js', false),
      createMockDirent('regular.ts', false)
    ] as fs.Dirent[]);

    traverse('/project/src');

    expect(testFiles).toHaveLength(6);
    expect(testFiles).toContain(path.join('/project/src', 'component.test.ts'));
    expect(testFiles).toContain(path.join('/project/src', 'service.spec.js'));
    expect(testFiles).toContain(path.join('/project/src', 'utils.test.js'));
    expect(testFiles).toContain(path.join('/project/src', 'integration.spec.ts'));
    expect(testFiles).toContain(path.join('/project/src', 'testHelper.ts'));
    expect(testFiles).toContain(path.join('/project/src', 'mySpec.js'));
    expect(testFiles).not.toContain(path.join('/project/src', 'regular.ts'));
  });

  test('should recursively traverse subdirectories while skipping hidden and node_modules', () => {
    const traverse = createTraverse();
    
    mockReaddirSync
      .mockReturnValueOnce([
        createMockDirent('src', true),
        createMockDirent('.git', true),
        createMockDirent('node_modules', true),
        createMockDirent('root.test.ts', false)
      ] as fs.Dirent[])
      .mockReturnValueOnce([
        createMockDirent('components', true),
        createMockDirent('app.test.ts', false)
      ] as fs.Dirent[])
      .mockReturnValueOnce([
        createMockDirent('button.spec.ts', false)
      ] as fs.Dirent[]);

    traverse('/project');

    expect(mockReaddirSync).toHaveBeenCalledTimes(3);
    expect(mockReaddirSync).toHaveBeenCalledWith('/project', { withFileTypes: true });
    expect(mockReaddirSync).toHaveBeenCalledWith(path.join('/project', 'src'), { withFileTypes: true });
    expect(mockReaddirSync).toHaveBeenCalledWith(path.join('/project', 'src', 'components'), { withFileTypes: true });
    expect(mockReaddirSync).not.toHaveBeenCalledWith(path.join('/project', '.git'), expect.anything());
    expect(mockReaddirSync).not.toHaveBeenCalledWith(path.join('/project', 'node_modules'), expect.anything());
    expect(testFiles).toHaveLength(3);
    expect(testFiles).toContain(path.join('/project', 'root.test.ts'));
    expect(testFiles).toContain(path.join('/project', 'src', 'app.test.ts'));
    expect(testFiles).toContain(path.join('/project', 'src', 'components', 'button.spec.ts'));
  });

  test('should handle errors gracefully and continue traversal', () => {
    const traverse = createTraverse();
    
    mockReaddirSync
      .mockReturnValueOnce([
        createMockDirent('accessible', true),
        createMockDirent('restricted', true),
        createMockDirent('file.test.ts', false)
      ] as fs.Dirent[])
      .mockReturnValueOnce([
        createMockDirent('nested.spec.ts', false)
      ] as fs.Dirent[])
      .mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

    expect(() => traverse('/project')).not.toThrow();
    
    expect(testFiles).toHaveLength(2);
    expect(testFiles).toContain(path.join('/project', 'file.test.ts'));
    expect(testFiles).toContain(path.join('/project', 'accessible', 'nested.spec.ts'));
  });

  test('should handle empty directories', () => {
    const traverse = createTraverse();
    
    mockReaddirSync.mockReturnValueOnce([] as fs.Dirent[]);

    traverse('/empty');

    expect(testFiles).toHaveLength(0);
    expect(mockReaddirSync).toHaveBeenCalledTimes(1);
  });

  test('should handle case-insensitive file name matching', () => {
    const traverse = createTraverse();
    
    mockReaddirSync.mockReturnValueOnce([
      createMockDirent('Component.TEST.TS', false),
      createMockDirent('SERVICE.SPEC.JS', false),
      createMockDirent('MyTest.ts', false),
      createMockDirent('SPEC_HELPER.js', false)
    ] as fs.Dirent[]);

    traverse('/project');

    expect(testFiles).toHaveLength(4);
    expect(testFiles).toContain(path.join('/project', 'Component.TEST.TS'));
    expect(testFiles).toContain(path.join('/project', 'SERVICE.SPEC.JS'));
    expect(testFiles).toContain(path.join('/project', 'MyTest.ts'));
    expect(testFiles).toContain(path.join('/project', 'SPEC_HELPER.js'));
  });

  test('should skip all hidden directories starting with dot', () => {
    const traverse = createTraverse();
    
    mockReaddirSync.mockReturnValueOnce([
      createMockDirent('.hidden', true),
      createMockDirent('.cache', true),
      createMockDirent('.vscode', true),
      createMockDirent('visible', true),
      createMockDirent('test.spec.ts', false)
    ] as fs.Dirent[])
    .mockReturnValueOnce([
      createMockDirent('nested.test.ts', false)
    ] as fs.Dirent[]);

    traverse('/project');

    expect(mockReaddirSync).toHaveBeenCalledTimes(2);
    expect(mockReaddirSync).toHaveBeenCalledWith('/project', { withFileTypes: true });
    expect(mockReaddirSync).toHaveBeenCalledWith(path.join('/project', 'visible'), { withFileTypes: true });
    expect(testFiles).toHaveLength(2);
  });

  test('should not include non-test files even with similar names', () => {
    const traverse = createTraverse();
    
    mockReaddirSync.mockReturnValueOnce([
      createMockDirent('component.ts', false),
      createMockDirent('service.js', false),
      createMockDirent('index.tsx', false),
      createMockDirent('readme.md', false),
      createMockDirent('contest.ts', false),
      createMockDirent('special.txt', false)
    ] as fs.Dirent[]);

    traverse('/project');

    expect(testFiles).toHaveLength(1);
    expect(testFiles).toContain(path.join('/project', 'contest.ts'));
  });
});