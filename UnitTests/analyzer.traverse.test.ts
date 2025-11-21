import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('traverse function', () => {
  let files: string[];
  let mockReaddirSync: jest.MockedFunction<typeof fs.readdirSync>;
  let mockJoin: jest.MockedFunction<typeof path.join>;
  let mockExtname: jest.MockedFunction<typeof path.extname>;
  
  const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git']);
  const CODE_EXTENSIONS: Record<string, boolean> = {
    '.ts': true,
    '.js': true,
    '.tsx': true,
    '.jsx': true,
    '.py': true,
    '.java': true,
    '.cpp': true,
    '.c': true,
    '.go': true,
    '.rs': true
  };

  beforeEach(() => {
    files = [];
    mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
    mockJoin = path.join as jest.MockedFunction<typeof path.join>;
    mockExtname = path.extname as jest.MockedFunction<typeof path.extname>;
    
    jest.clearAllMocks();
    
    mockJoin.mockImplementation((...args: string[]) => args.join('/'));
  });

  const createTraverse = () => {
    return (currentPath: string) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
            createTraverse()(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (CODE_EXTENSIONS[ext]) {
            files.push(fullPath);
          }
        }
      }
    };
  };

  test('should collect TypeScript files from directory', () => {
    const mockEntries = [
      { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
      { name: 'file2.ts', isDirectory: () => false, isFile: () => true }
    ];
    
    mockReaddirSync.mockReturnValue(mockEntries as any);
    mockExtname.mockImplementation((filename: string) => {
      const match = filename.match(/\.[^.]+$/);
      return match ? match[0] : '';
    });

    const traverse = createTraverse();
    traverse('/test/path');

    expect(files).toHaveLength(2);
    expect(files).toContain('/test/path/file1.ts');
    expect(files).toContain('/test/path/file2.ts');
  });

  test('should recursively traverse subdirectories', () => {
    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (dirPath === '/test/path') {
        return [
          { name: 'subdir', isDirectory: () => true, isFile: () => false },
          { name: 'root.ts', isDirectory: () => false, isFile: () => true }
        ] as any;
      } else if (dirPath === '/test/path/subdir') {
        return [
          { name: 'nested.js', isDirectory: () => false, isFile: () => true }
        ] as any;
      }
      return [] as any;
    });
    
    mockExtname.mockImplementation((filename: string) => {
      const match = filename.match(/\.[^.]+$/);
      return match ? match[0] : '';
    });

    const traverse = createTraverse();
    traverse('/test/path');

    expect(files).toHaveLength(2);
    expect(files).toContain('/test/path/root.ts');
    expect(files).toContain('/test/path/subdir/nested.js');
  });

  test('should skip directories in SKIP_DIRS', () => {
    const mockEntries = [
      { name: 'node_modules', isDirectory: () => true, isFile: () => false },
      { name: 'dist', isDirectory: () => true, isFile: () => false },
      { name: 'src', isDirectory: () => true, isFile: () => false },
      { name: 'file.ts', isDirectory: () => false, isFile: () => true }
    ];
    
    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (dirPath === '/test/path') {
        return mockEntries as any;
      } else if (dirPath === '/test/path/src') {
        return [
          { name: 'nested.ts', isDirectory: () => false, isFile: () => true }
        ] as any;
      }
      return [] as any;
    });
    
    mockExtname.mockImplementation((filename: string) => {
      const match = filename.match(/\.[^.]+$/);
      return match ? match[0] : '';
    });

    const traverse = createTraverse();
    traverse('/test/path');

    expect(files).toHaveLength(2);
    expect(files).toContain('/test/path/file.ts');
    expect(files).toContain('/test/path/src/nested.ts');
    expect(mockReaddirSync).not.toHaveBeenCalledWith('/test/path/node_modules', expect.any(Object));
    expect(mockReaddirSync).not.toHaveBeenCalledWith('/test/path/dist', expect.any(Object));
  });

  test('should skip hidden directories starting with dot', () => {
    const mockEntries = [
      { name: '.git', isDirectory: () => true, isFile: () => false },
      { name: '.vscode', isDirectory: () => true, isFile: () => false },
      { name: 'src', isDirectory: () => true, isFile: () => false }
    ];
    
    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (dirPath === '/test/path') {
        return mockEntries as any;
      } else if (dirPath === '/test/path/src') {
        return [
          { name: 'file.ts', isDirectory: () => false, isFile: () => true }
        ] as any;
      }
      return [] as any;
    });
    
    mockExtname.mockImplementation((filename: string) => {
      const match = filename.match(/\.[^.]+$/);
      return match ? match[0] : '';
    });

    const traverse = createTraverse();
    traverse('/test/path');

    expect(files).toHaveLength(1);
    expect(files).toContain('/test/path/src/file.ts');
    expect(mockReaddirSync).not.toHaveBeenCalledWith('/test/path/.git', expect.any(Object));
    expect(mockReaddirSync).not.toHaveBeenCalledWith('/test/path/.vscode', expect.any(Object));
  });

  test('should only collect files with recognized extensions', () => {
    const mockEntries = [
      { name: 'code.ts', isDirectory: () => false, isFile: () => true },
      { name: 'script.js', isDirectory: () => false, isFile: () => true },
      { name: 'readme.md', isDirectory: () => false, isFile: () => true },
      { name: 'config.json', isDirectory: () => false, isFile: () => true },
      { name: 'main.py', isDirectory: () => false, isFile: () => true }
    ];
    
    mockReaddirSync.mockReturnValue(mockEntries as any);
    mockExtname.mockImplementation((filename: string) => {
      const match = filename.match(/\.[^.]+$/);
      return match ? match[0] : '';
    });

    const traverse = createTraverse();
    traverse('/test/path');

    expect(files).toHaveLength(3);
    expect(files).toContain('/test/path/code.ts');
    expect(files).toContain('/test/path/script.js');
    expect(files).toContain('/test/path/main.py');
    expect(files).not.toContain('/test/path/readme.md');
    expect(files).not.toContain('/test/path/config.json');
  });

  test('should handle empty directory', () => {
    mockReaddirSync.mockReturnValue([] as any);

    const traverse = createTraverse();
    traverse('/empty/path');

    expect(files).toHaveLength(0);
    expect(mockReaddirSync).toHaveBeenCalledWith('/empty/path', { withFileTypes: true });
  });

  test('should handle mixed content with various file types', () => {
    const mockEntries = [
      { name: 'app.tsx', isDirectory: () => false, isFile: () => true },
      { name: 'component.jsx', isDirectory: () => false, isFile: () => true },
      { name: 'main.cpp', isDirectory: () => false, isFile: () => true },
      { name: 'utils.go', isDirectory: () => false, isFile: () => true },
      { name: 'service.rs', isDirectory: () => false, isFile: () => true }
    ];
    
    mockReaddirSync.mockReturnValue(mockEntries as any);
    mockExtname.mockImplementation((filename: string) => {
      const match = filename.match(/\.[^.]+$/);
      return match ? match[0] : '';
    });

    const traverse = createTraverse();
    traverse('/test/path');

    expect(files).toHaveLength(5);
    expect(files).toContain('/test/path/app.tsx');
    expect(files).toContain('/test/path/component.jsx');
    expect(files).toContain('/test/path/main.cpp');
    expect(files).toContain('/test/path/utils.go');
    expect(files).toContain('/test/path/service.rs');
  });
});