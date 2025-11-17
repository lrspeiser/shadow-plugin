import * as fs from 'fs';
import * as path from 'path';
import { AnalysisCache } from './cache';

export interface CodeAnalysis {
    totalFiles: number;
    totalLines: number;
    totalFunctions: number;
    largeFiles: number;
    files: FileInfo[];
    functions: FunctionInfo[];
    imports: { [key: string]: string[] };
    importedFiles: string[];
    orphanedFiles: string[];
    entryPoints: EntryPoint[];
    duplicates?: DuplicateGroup[];
}

export interface FileInfo {
    path: string;
    lines: number;
    functions: number;
    language: string;
    complexity?: number;
}

export interface FunctionInfo {
    name: string;
    file: string;
    startLine: number;
    endLine: number;
    lines: number;
    language: string;
}

export interface EntryPoint {
    path: string;
    type: string;
    reason: string;
}

export interface DuplicateGroup {
    files: string[];
    similarity: number;
    description: string;
}

const CODE_EXTENSIONS: { [key: string]: string } = {
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'javascript',
    '.tsx': 'typescript',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.hpp': 'cpp',
    '.rb': 'ruby',
    '.php': 'php'
};

const SKIP_DIRS = new Set([
    'node_modules',
    '__pycache__',
    '.git',
    '.venv',
    'venv',
    'dist',
    'build',
    '.pytest_cache',
    '.mypy_cache',
    'ShadowFiles',
    'target',
    'pkg',
    '.next',
    'out'
]);

export class CodeAnalyzer {
    constructor(private cache: AnalysisCache) {}

    async analyzeWorkspace(workspaceRoot: string): Promise<CodeAnalysis> {
        const files: FileInfo[] = [];
        const functions: FunctionInfo[] = [];
        const fileImports: { [key: string]: string[] } = {};
        const allFilePaths: string[] = [];

        let totalFiles = 0;
        let totalLines = 0;
        let totalFunctions = 0;
        let largeFiles = 0;

        // Recursively find all code files
        const codeFiles = this.findCodeFiles(workspaceRoot);
        
        // Also find ALL files (including .md, config files, etc.) for organization analysis
        const allFiles = this.findAllFiles(workspaceRoot);

        // Process code files for detailed analysis
        for (const filePath of codeFiles) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n').length;

                if (lines === 0) continue;

                totalFiles++;
                totalLines += lines;

                if (lines > 500) {
                    largeFiles++;
                }

                const ext = path.extname(filePath);
                const language = CODE_EXTENSIONS[ext] || 'unknown';
                const relativePath = path.relative(workspaceRoot, filePath);

                // Extract functions
                const fileFunctions = this.extractFunctions(content, language, relativePath);
                const functionCount = fileFunctions.length;
                totalFunctions += functionCount;
                functions.push(...fileFunctions);

                // Extract imports
                const imports = this.extractImports(content, language, relativePath, workspaceRoot);
                fileImports[relativePath] = imports;

                allFilePaths.push(relativePath);

                files.push({
                    path: relativePath,
                    lines,
                    functions: functionCount,
                    language
                });
            } catch (error) {
                console.warn(`Error analyzing ${filePath}:`, error);
            }
        }
        
        // Add all other files (non-code files) for organization analysis
        for (const filePath of allFiles) {
            const relativePath = path.relative(workspaceRoot, filePath);
            
            // Skip if already added as a code file
            if (files.some(f => f.path === relativePath)) {
                continue;
            }
            
            try {
                const stats = fs.statSync(filePath);
                if (!stats.isFile()) continue;
                
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n').length;
                const ext = path.extname(filePath);
                
                // Add to files list for organization analysis (but not for code metrics)
                files.push({
                    path: relativePath,
                    lines,
                    functions: 0,
                    language: ext.substring(1) || 'unknown' // Use extension as language identifier
                });
            } catch (error) {
                // Skip files we can't read
            }
        }

        // Analyze dependencies
        const dependencyInfo = this.analyzeDependencies(fileImports, allFilePaths);

        // Detect entry points
        const entryPoints = this.detectEntryPoints(workspaceRoot);

        return {
            totalFiles,
            totalLines,
            totalFunctions,
            largeFiles,
            files,
            functions,
            imports: fileImports,
            importedFiles: dependencyInfo.importedFiles,
            orphanedFiles: dependencyInfo.orphanedFiles,
            entryPoints
        };
    }

    async analyzeFile(filePath: string): Promise<CodeAnalysis> {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length;
        const ext = path.extname(filePath);
        const language = CODE_EXTENSIONS[ext] || 'unknown';
        const fileName = path.basename(filePath);

        const fileFunctions = this.extractFunctions(content, language, fileName);
        const imports = this.extractImports(content, language, fileName, path.dirname(filePath));

        return {
            totalFiles: 1,
            totalLines: lines,
            totalFunctions: fileFunctions.length,
            largeFiles: lines > 500 ? 1 : 0,
            files: [{
                path: fileName,
                lines,
                functions: fileFunctions.length,
                language
            }],
            functions: fileFunctions,
            imports: { [fileName]: imports },
            importedFiles: [],
            orphanedFiles: [],
            entryPoints: []
        };
    }

    private findCodeFiles(dir: string): string[] {
        const files: string[] = [];

        const traverse = (currentPath: string) => {
            const entries = fs.readdirSync(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);

                if (entry.isDirectory()) {
                    if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
                        traverse(fullPath);
                    }
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (CODE_EXTENSIONS[ext]) {
                        files.push(fullPath);
                    }
                }
            }
        };

        traverse(dir);
        return files;
    }

    private findAllFiles(dir: string): string[] {
        const files: string[] = [];
        const skipDirs = new Set([
            'node_modules', '__pycache__', '.git', '.venv', 'venv',
            'dist', 'build', '.pytest_cache', '.mypy_cache',
            'target', 'pkg', '.next', 'out', '.shadow'
        ]);

        const traverse = (currentDir: string) => {
            try {
                const entries = fs.readdirSync(currentDir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(currentDir, entry.name);
                    
                    // Skip hidden files/dirs and skip directories
                    if (entry.name.startsWith('.')) {
                        continue;
                    }
                    
                    if (entry.isDirectory()) {
                        if (!skipDirs.has(entry.name)) {
                            traverse(fullPath);
                        }
                    } else if (entry.isFile()) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        traverse(dir);
        return files;
    }

    private extractFunctions(content: string, language: string, filePath: string): FunctionInfo[] {
        const functions: FunctionInfo[] = [];

        switch (language) {
            case 'python':
                functions.push(...this.extractPythonFunctions(content, filePath));
                break;
            case 'javascript':
            case 'typescript':
                functions.push(...this.extractJavaScriptFunctions(content, filePath));
                break;
            case 'java':
                functions.push(...this.extractJavaFunctions(content, filePath));
                break;
            case 'go':
                functions.push(...this.extractGoFunctions(content, filePath));
                break;
            // Add more languages as needed
        }

        return functions;
    }

    private extractPythonFunctions(content: string, filePath: string): FunctionInfo[] {
        const functions: FunctionInfo[] = [];
        const lines = content.split('\n');
        const funcRegex = /^\s*def\s+(\w+)\s*\(/;
        const classRegex = /^\s*class\s+(\w+)/;

        for (let i = 0; i < lines.length; i++) {
            const funcMatch = lines[i].match(funcRegex);
            const classMatch = lines[i].match(classRegex);

            if (funcMatch || classMatch) {
                const name = funcMatch ? funcMatch[1] : classMatch![1];
                const startLine = i + 1;
                
                // Find end of function/class (simple heuristic)
                let endLine = startLine;
                const baseIndent = lines[i].match(/^\s*/)?.[0].length || 0;
                
                for (let j = i + 1; j < lines.length; j++) {
                    const line = lines[j];
                    if (line.trim() === '') continue;
                    
                    const currentIndent = line.match(/^\s*/)?.[0].length || 0;
                    if (currentIndent <= baseIndent && line.trim() !== '') {
                        break;
                    }
                    endLine = j + 1;
                }

                functions.push({
                    name,
                    file: filePath,
                    startLine,
                    endLine,
                    lines: endLine - startLine + 1,
                    language: 'python'
                });
            }
        }

        return functions;
    }

    private extractJavaScriptFunctions(content: string, filePath: string): FunctionInfo[] {
        const functions: FunctionInfo[] = [];
        const lines = content.split('\n');
        
        // Regular function declarations
        const funcRegex = /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/;
        // Arrow functions assigned to const/let/var
        const arrowRegex = /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/;
        // Method definitions
        const methodRegex = /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/;

        for (let i = 0; i < lines.length; i++) {
            const funcMatch = lines[i].match(funcRegex) || 
                            lines[i].match(arrowRegex) ||
                            lines[i].match(methodRegex);

            if (funcMatch) {
                const name = funcMatch[1];
                const startLine = i + 1;
                
                // Find matching closing brace
                let endLine = this.findClosingBrace(lines, i);

                functions.push({
                    name,
                    file: filePath,
                    startLine,
                    endLine,
                    lines: endLine - startLine + 1,
                    language: 'javascript'
                });
            }
        }

        return functions;
    }

    private extractJavaFunctions(content: string, filePath: string): FunctionInfo[] {
        const functions: FunctionInfo[] = [];
        const lines = content.split('\n');
        
        // Java method pattern
        const methodRegex = /^\s*(?:public|private|protected|static|\s)+[\w<>[\],\s]+\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+\w+\s*)?{/;

        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(methodRegex);
            if (match) {
                const name = match[1];
                const startLine = i + 1;
                const endLine = this.findClosingBrace(lines, i);

                functions.push({
                    name,
                    file: filePath,
                    startLine,
                    endLine,
                    lines: endLine - startLine + 1,
                    language: 'java'
                });
            }
        }

        return functions;
    }

    private extractGoFunctions(content: string, filePath: string): FunctionInfo[] {
        const functions: FunctionInfo[] = [];
        const lines = content.split('\n');
        
        const funcRegex = /^\s*func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(/;

        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(funcRegex);
            if (match) {
                const name = match[1];
                const startLine = i + 1;
                const endLine = this.findClosingBrace(lines, i);

                functions.push({
                    name,
                    file: filePath,
                    startLine,
                    endLine,
                    lines: endLine - startLine + 1,
                    language: 'go'
                });
            }
        }

        return functions;
    }

    private findClosingBrace(lines: string[], startIndex: number): number {
        let braceCount = 0;
        let foundFirst = false;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            for (const char of line) {
                if (char === '{') {
                    braceCount++;
                    foundFirst = true;
                } else if (char === '}') {
                    braceCount--;
                    if (foundFirst && braceCount === 0) {
                        return i + 1;
                    }
                }
            }
        }

        return startIndex + 1; // Fallback
    }

    private extractImports(content: string, language: string, filePath: string, workspaceRoot: string): string[] {
        const imports: string[] = [];
        let match: RegExpExecArray | null = null;

        switch (language) {
            case 'python': {
                const pyImportRegex = /^(?:from\s+([\w.]+)\s+)?import\s+([\w\s,.*]+)/gm;
                while ((match = pyImportRegex.exec(content)) !== null) {
                    if (match[1]) imports.push(match[1]);
                    if (match[2] && !match[2].includes('*')) {
                        imports.push(...match[2].split(',').map(s => s.trim()));
                    }
                }
                break;
            }

            case 'javascript':
            case 'typescript': {
                const jsImportRegex = /^import\s+(?:{[^}]+}|\w+|[*\s]+(?:as\s+\w+)?)\s+from\s+['"]([^'"]+)['"]/gm;
                const jsRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
                
                while ((match = jsImportRegex.exec(content)) !== null) {
                    imports.push(match[1]);
                }
                while ((match = jsRequireRegex.exec(content)) !== null) {
                    imports.push(match[1]);
                }
                break;
            }

            case 'java': {
                const javaImportRegex = /^import\s+([\w.]+);/gm;
                while ((match = javaImportRegex.exec(content)) !== null) {
                    imports.push(match[1]);
                }
                break;
            }

            case 'go': {
                const goImportRegex = /^import\s+(?:"([^"]+)"|(\([^)]+\)))/gm;
                while ((match = goImportRegex.exec(content)) !== null) {
                    if (match[1]) {
                        imports.push(match[1]);
                    }
                }
                break;
            }
        }

        return imports;
    }

    private analyzeDependencies(fileImports: { [key: string]: string[] }, allFiles: string[]): {
        importedFiles: string[];
        orphanedFiles: string[];
    } {
        const imported = new Set<string>();

        for (const [_, imports] of Object.entries(fileImports)) {
            for (const imp of imports) {
                // Check if import corresponds to a project file
                for (const file of allFiles) {
                    if (file.includes(imp) || imp.includes(path.basename(file, path.extname(file)))) {
                        imported.add(file);
                    }
                }
            }
        }

        const orphaned = allFiles.filter(f => !imported.has(f));

        return {
            importedFiles: Array.from(imported),
            orphanedFiles: orphaned
        };
    }

    private detectEntryPoints(workspaceRoot: string): EntryPoint[] {
        const entryPoints: EntryPoint[] = [];

        // Check for package.json (Node.js)
        const packageJsonPath = path.join(workspaceRoot, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                if (packageJson.main) {
                    entryPoints.push({
                        path: packageJson.main,
                        type: 'package.json main',
                        reason: 'Node.js main entry point'
                    });
                }
                if (packageJson.scripts?.start) {
                    entryPoints.push({
                        path: 'npm start',
                        type: 'package.json start script',
                        reason: 'Start script'
                    });
                }
            } catch (e) {
                // Ignore parse errors
            }
        }

        // Check for common entry point files
        const commonEntryPoints = [
            'main.py', 'app.py', '__main__.py',
            'index.js', 'index.ts', 'main.js', 'main.ts',
            'Main.java', 'App.java',
            'main.go'
        ];

        for (const entry of commonEntryPoints) {
            const entryPath = path.join(workspaceRoot, entry);
            if (fs.existsSync(entryPath)) {
                entryPoints.push({
                    path: entry,
                    type: 'common entry point',
                    reason: `Standard entry point file: ${entry}`
                });
            }
        }

        return entryPoints;
    }
}

