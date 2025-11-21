import * as fs from 'fs';
import * as path from 'path';

// Mocks
jest.mock('fs');
jest.mock('path');

describe('traverse function', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;
  
  // Mock data for SKIP_DIRS and CODE_EXTENSIONS that should be defined in the parent scope
  const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git']);
  const CODE_EXTENSIONS: Record<string, boolean> = {
    '.ts': true,
    '.tsx': true,
    '.js': true,
    '.jsx': true,
    '.py': true,
    '.java': true
  };
  
  let files: string[];
  
  beforeEach(() => {
    jest.clearAllMocks();
    files = [];
    
    // Default mock implementation for path.join
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
    
    // Default mock implementation for path.extname
    mockPath.extname.mockImplementation((filename: string) => {
      const lastDot = filename.lastIndexOf('.');
      return lastDot === -1 ? '' : filename.substring(lastDot);
    });
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
  
  test('should traverse directory and collect code files', () => {
    const mockEntries = [
      { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
      { name: 'file2.js', isDirectory: () => false, isFile: () => true },
      { name: 'readme.md', isDirectory: () => false, isFile: () => true }
    ];
    
    mockFs.readdirSync.mockReturnValue(mockEntries as any);
    
    const traverse = createTraverse();
    traverse('/test/path');
    
    expect(files).toHaveLength(2);
    expect(files).toContain('/test/path/file1.ts');
    expect(files).toContain('/test/path/file2.js');
    expect(files).not.toContain('/test/path/readme.md');
  });
  
  test('should skip directories in SKIP_DIRS set', () => {
    const mockEntries = [
      { name: 'node_modules', isDirectory: () => true, isFile: () => false },
      { name: 'src', isDirectory: () => true, isFile: () => false },
      { name: 'dist', isDirectory: () => true, isFile: () => false }
    ];
    
    const mockSrcEntries = [
      { name: 'index.ts', isDirectory: () => false, isFile: () => true }
    ];
    
    mockFs.readdirSync.mockReturnValueOnce(mockEntries as any)
                      .mockReturnValueOnce(mockSrcEntries as any);
    
    const traverse = createTraverse();
    traverse('/test/path');
    
    expect(mockFs.readdirSync).toHaveBeenCalledTimes(2);
    expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/path', { withFileTypes: true });
    expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/path/src', { withFileTypes: true });
    expect(files).toContain('/test/path/src/index.ts');
  });
  
  test('should skip hidden directories (starting with dot)', () => {
    const mockEntries = [
      { name: '.git', isDirectory: () => true, isFile: () => false },
      { name: '.vscode', isDirectory: () => true, isFile: () => false },
      { name: 'src', isDirectory: () => true, isFile: () => false }
    ];
    
    const mockSrcEntries = [
      { name: 'app.ts', isDirectory: () => false, isFile: () => true }
    ];
    
    mockFs.readdirSync.mockReturnValueOnce(mockEntries as any)
                      .mockReturnValueOnce(mockSrcEntries as any);
    
    const traverse = createTraverse();
    traverse('/test/path');
    
    expect(mockFs.readdirSync).toHaveBeenCalledTimes(2);
    expect(files).toHaveLength(1);
    expect(files).toContain('/test/path/src/app.ts');
  });
  
  test('should recursively traverse nested directories', () => {
    const mockRootEntries = [
      { name: 'src', isDirectory: () => true, isFile: () => false }
    ];
    
    const mockSrcEntries = [
      { name: 'components', isDirectory: () => true, isFile: () => false },
      { name: 'index.ts', isDirectory: () => false, isFile: () => true }
    ];
    
    const mockComponentsEntries = [
      { name: 'button.tsx', isDirectory: () => false, isFile: () => true },
      { name: 'input.tsx', isDirectory: () => false, isFile: () => true }
    ];
    
    mockFs.readdirSync.mockReturnValueOnce(mockRootEntries as any)
                      .mockReturnValueOnce(mockSrcEntries as any)
                      .mockReturnValueOnce(mockComponentsEntries as any);
    
    const traverse = createTraverse();
    traverse('/project');
    
    expect(files).toHaveLength(3);
    expect(files).toContain('/project/src/index.ts');
    expect(files).toContain('/project/src/components/button.tsx');
    expect(files).toContain('/project/src/components/input.tsx');
  });
  
  test('should handle empty directory', () => {
    mockFs.readdirSync.mockReturnValue([]);
    
    const traverse = createTraverse();
    traverse('/empty/path');
    
    expect(files).toHaveLength(0);
    expect(mockFs.readdirSync).toHaveBeenCalledWith('/empty/path', { withFileTypes: true });
  });
  
  test('should only collect files with extensions in CODE_EXTENSIONS', () => {
    const mockEntries = [
      { name: 'script.ts', isDirectory: () => false, isFile: () => true },
      { name: 'component.tsx', isDirectory: () => false, isFile: () => true },
      { name: 'app.js', isDirectory: () => false, isFile: () => true },
      { name: 'styles.css', isDirectory: () => false, isFile: () => true },
      { name: 'image.png', isDirectory: () => false, isFile: () => true },
      { name: 'data.json', isDirectory: () => false, isFile: () => true }
    ];
    
    mockFs.readdirSync.mockReturnValue(mockEntries as any);
    
    const traverse = createTraverse();
    traverse('/test');
    
    expect(files).toHaveLength(3);
    expect(files).toContain('/test/script.ts');
    expect(files).toContain('/test/component.tsx');
    expect(files).toContain('/test/app.js');
    expect(files).not.toContain('/test/styles.css');
    expect(files).not.toContain('/test/image.png');
  });
  
  test('should handle mixed directory and file entries', () => {
    const mockEntries = [
      { name: 'lib', isDirectory: () => true, isFile: () => false },
      { name: 'index.ts', isDirectory: () => false, isFile: () => true },
      { name: 'utils', isDirectory: () => true, isFile: () => false },
      { name: 'config.js', isDirectory: () => false, isFile: () => true }
    ];
    
    const mockLibEntries = [
      { name: 'helper.ts', isDirectory: () => false, isFile: () => true }
    ];
    
    const mockUtilsEntries = [
      { name: 'format.js', isDirectory: () => false, isFile: () => true }
    ];
    
    mockFs.readdirSync.mockReturnValueOnce(mockEntries as any)
                      .mockReturnValueOnce(mockLibEntries as any)
                      .mockReturnValueOnce(mockUtilsEntries as any);
    
    const traverse = createTraverse();
    traverse('/app');
    
    expect(files).toHaveLength(4);
    expect(files).toContain('/app/index.ts');
    expect(files).toContain('/app/config.js');
    expect(files).toContain('/app/lib/helper.ts');
    expect(files).toContain('/app/utils/format.js');
  });
  
  test('should use path.join to construct full paths', () => {
    const mockEntries = [
      { name: 'test.ts', isDirectory: () => false, isFile: () => true }
    ];
    
    mockFs.readdirSync.mockReturnValue(mockEntries as any);
    
    const traverse = createTraverse();
    traverse('/base/path');
    
    expect(mockPath.join).toHaveBeenCalledWith('/base/path', 'test.ts');
  });
  
  test('should use path.extname to get file extensions', () => {
    const mockEntries = [
      { name: 'file.ts', isDirectory: () => false, isFile: () => true },
      { name: 'script.js', isDirectory: () => false, isFile: () => true }
    ];
    
    mockFs.readdirSync.mockReturnValue(mockEntries as any);
    
    const traverse = createTraverse();
    traverse('/test');
    
    expect(mockPath.extname).toHaveBeenCalledWith('file.ts');
    expect(mockPath.extname).toHaveBeenCalledWith('script.js');
  });
})