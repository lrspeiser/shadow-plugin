/**
 * Shared file filtering utilities for consistent exclusion patterns across the codebase.
 * Used by analyzer, product docs generation, and test generation.
 */

import * as path from 'path';

/**
 * Directories that should always be skipped during analysis
 */
export const SKIP_DIRECTORIES = new Set([
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
    'out',
    '.shadow',
    '.shadowwatch-cache',
    'UnitTests',
    'coverage',
    '.nyc_output',
    '.cache'
]);

/**
 * File patterns that should be excluded from analysis
 */
export const SKIP_FILE_PATTERNS = [
    /\.test\.(ts|tsx|js|jsx)$/,      // Test files
    /\.spec\.(ts|tsx|js|jsx)$/,      // Spec files
    /\.d\.ts$/,                       // TypeScript declaration files
    /\.min\.(js|css)$/,              // Minified files
    /\.map$/,                         // Source map files
    /\.lock$/,                        // Lock files
    /package-lock\.json$/,           // npm lock
    /yarn\.lock$/,                   // yarn lock
    /pnpm-lock\.yaml$/,              // pnpm lock
    /\.eslintrc/,                    // ESLint config
    /\.prettierrc/,                  // Prettier config
    /tsconfig.*\.json$/,             // TypeScript configs (we analyze code, not config)
    /jest\.config/,                  // Jest config
    /webpack\.config/,               // Webpack config
    /vite\.config/,                  // Vite config
    /rollup\.config/,                // Rollup config
];

/**
 * File extensions that are considered code files for analysis
 */
export const CODE_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx',    // JavaScript/TypeScript
    '.py',                            // Python
    '.java',                          // Java
    '.go',                            // Go
    '.rs',                            // Rust
    '.cpp', '.c', '.h', '.hpp',      // C/C++
    '.rb',                            // Ruby
    '.php',                           // PHP
    '.cs',                            // C#
    '.swift',                         // Swift
    '.kt', '.kts',                   // Kotlin
]);

/**
 * Check if a directory should be skipped during traversal
 */
export function shouldSkipDirectory(dirName: string): boolean {
    return SKIP_DIRECTORIES.has(dirName);
}

/**
 * Check if a file should be analyzed based on its path
 * @param filePath - Relative or absolute file path
 * @param workspaceRoot - Optional workspace root for relative path calculation
 * @returns true if the file should be analyzed, false if it should be skipped
 */
export function shouldAnalyzeFile(filePath: string, workspaceRoot?: string): boolean {
    // Normalize path for consistent checking
    const normalizedPath = filePath.replace(/\\/g, '/');
    const fileName = path.basename(normalizedPath);
    const ext = path.extname(normalizedPath).toLowerCase();
    
    // Check if any path segment is in skip directories
    const pathSegments = normalizedPath.split('/');
    for (const segment of pathSegments) {
        if (SKIP_DIRECTORIES.has(segment)) {
            return false;
        }
    }
    
    // Check if file matches any skip patterns
    for (const pattern of SKIP_FILE_PATTERNS) {
        if (pattern.test(fileName) || pattern.test(normalizedPath)) {
            return false;
        }
    }
    
    // For code analysis, only include known code extensions
    // (This can be made configurable if needed)
    if (!CODE_EXTENSIONS.has(ext)) {
        return false;
    }
    
    return true;
}

/**
 * Check if a file is a code file (has recognized code extension)
 */
export function isCodeFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return CODE_EXTENSIONS.has(ext);
}

/**
 * Get language identifier from file extension
 */
export function getLanguageFromExtension(ext: string): string {
    const langMap: { [key: string]: string } = {
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.py': 'python',
        '.java': 'java',
        '.go': 'go',
        '.rs': 'rust',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.hpp': 'cpp',
        '.rb': 'ruby',
        '.php': 'php',
        '.cs': 'csharp',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.kts': 'kotlin',
    };
    
    return langMap[ext.toLowerCase()] || 'unknown';
}

/**
 * Filter a list of file paths to only include analyzable files
 */
export function filterAnalyzableFiles(files: string[], workspaceRoot?: string): string[] {
    return files.filter(f => shouldAnalyzeFile(f, workspaceRoot));
}
