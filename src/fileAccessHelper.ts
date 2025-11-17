/**
 * File Access Helper - Provides file reading and grep functionality for iterative LLM analysis
 */
import * as fs from 'fs';
import * as path from 'path';

export interface FileRequest {
    type: 'file';
    path: string;
    reason?: string;
}

export interface GrepRequest {
    type: 'grep';
    pattern: string;
    filePattern?: string; // Optional glob pattern to limit search (e.g., '*.ts', 'src/**/*.ts')
    maxResults?: number; // Max number of matches to return (default: 20)
    reason?: string;
}

export type LLMRequest = FileRequest | GrepRequest;

export interface FileResponse {
    path: string;
    content: string;
    lines: number;
    exists: boolean;
}

export interface GrepMatch {
    file: string;
    line: number;
    content: string;
    context?: {
        before: string[];
        after: string[];
    };
}

export interface GrepResponse {
    pattern: string;
    matches: GrepMatch[];
    totalMatches: number;
    limited: boolean; // True if results were limited by maxResults
}

export class FileAccessHelper {
    constructor(private workspaceRoot: string) {}

    /**
     * Get file listing organized by folders
     */
    getFileListing(files: Array<{ path: string; lines?: number; language?: string }>): string {
        const byFolder = new Map<string, Array<{ name: string; lines?: number; language?: string }>>();
        
        for (const file of files) {
            const dir = path.dirname(file.path);
            const name = path.basename(file.path);
            
            if (!byFolder.has(dir)) {
                byFolder.set(dir, []);
            }
            byFolder.get(dir)!.push({
                name,
                lines: file.lines,
                language: file.language
            });
        }

        const sortedFolders = Array.from(byFolder.entries()).sort((a, b) => {
            // Sort by folder depth first, then alphabetically
            const depthA = a[0].split('/').length;
            const depthB = b[0].split('/').length;
            if (depthA !== depthB) return depthA - depthB;
            return a[0].localeCompare(b[0]);
        });

        let listing = '## Available Files and Folders\n\n';
        
        for (const [folder, fileList] of sortedFolders) {
            const folderDisplay = folder === '.' ? 'Root Directory' : folder;
            listing += `### ${folderDisplay}/\n`;
            
            // Sort files by name
            fileList.sort((a, b) => a.name.localeCompare(b.name));
            
            for (const file of fileList) {
                const sizeInfo = file.lines ? ` (${file.lines} lines)` : '';
                const langInfo = file.language ? ` [${file.language}]` : '';
                listing += `- \`${file.name}\`${sizeInfo}${langInfo}\n`;
            }
            listing += '\n';
        }

        return listing;
    }

    /**
     * Read a file and return its content
     */
    readFile(filePath: string): FileResponse {
        try {
            const fullPath = path.join(this.workspaceRoot, filePath);
            
            // Security: ensure file is within workspace
            const resolvedPath = path.resolve(fullPath);
            const resolvedRoot = path.resolve(this.workspaceRoot);
            if (!resolvedPath.startsWith(resolvedRoot + path.sep) && resolvedPath !== resolvedRoot) {
                return {
                    path: filePath,
                    content: '',
                    lines: 0,
                    exists: false
                };
            }

            if (!fs.existsSync(resolvedPath)) {
                return {
                    path: filePath,
                    content: '',
                    lines: 0,
                    exists: false
                };
            }

            const stats = fs.statSync(resolvedPath);
            if (!stats.isFile()) {
                return {
                    path: filePath,
                    content: '',
                    lines: 0,
                    exists: false
                };
            }

            const content = fs.readFileSync(resolvedPath, 'utf-8');
            const lines = content.split('\n').length;

            return {
                path: filePath,
                content,
                lines,
                exists: true
            };
        } catch (error: any) {
            console.error(`Error reading file ${filePath}:`, error);
            return {
                path: filePath,
                content: '',
                lines: 0,
                exists: false
            };
        }
    }

    /**
     * Read multiple files
     */
    readFiles(filePaths: string[]): FileResponse[] {
        return filePaths.map(path => this.readFile(path));
    }

    /**
     * Simple grep search - find pattern matches across files
     */
    grep(pattern: string, filePattern?: string, maxResults: number = 20): GrepResponse {
        const matches: GrepMatch[] = [];
        let totalMatches = 0;
        const regex = new RegExp(pattern, 'i'); // Case-insensitive

        try {
            // If filePattern provided, convert to search function
            const shouldSearchFile = (filePath: string): boolean => {
                if (!filePattern) return true;
                
                // Simple glob matching: * matches anything, ** matches any path
                const globRegex = new RegExp(
                    '^' + filePattern
                        .replace(/\./g, '\\.')
                        .replace(/\*\*/g, '___DOUBLE_STAR___')
                        .replace(/\*/g, '[^/]*')
                        .replace(/___DOUBLE_STAR___/g, '.*') + '$'
                );
                
                return globRegex.test(filePath);
            };

            // Search all files in workspace
            const searchDirectory = (dir: string, relativePath: string = ''): void => {
                const entries = fs.readdirSync(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    const relativeFilePath = path.join(relativePath, entry.name);

                    // Skip node_modules, .git, etc.
                    if (entry.name.startsWith('.') || 
                        entry.name === 'node_modules' || 
                        entry.name === 'dist' || 
                        entry.name === 'build') {
                        continue;
                    }

                    if (entry.isDirectory()) {
                        searchDirectory(fullPath, relativeFilePath);
                    } else if (entry.isFile() && shouldSearchFile(relativeFilePath)) {
                        try {
                            const content = fs.readFileSync(fullPath, 'utf-8');
                            const lines = content.split('\n');

                            for (let i = 0; i < lines.length && matches.length < maxResults; i++) {
                                const line = lines[i];
                                if (regex.test(line)) {
                                    const contextBefore: string[] = [];
                                    const contextAfter: string[] = [];

                                    // Add 2 lines before
                                    for (let j = Math.max(0, i - 2); j < i; j++) {
                                        contextBefore.push(lines[j]);
                                    }

                                    // Add 2 lines after
                                    for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
                                        contextAfter.push(lines[j]);
                                    }

                                    matches.push({
                                        file: relativeFilePath,
                                        line: i + 1, // 1-indexed
                                        content: line.trim(),
                                        context: {
                                            before: contextBefore,
                                            after: contextAfter
                                        }
                                    });
                                    totalMatches++;
                                }
                            }
                        } catch (error) {
                            // Skip binary files or files we can't read
                            continue;
                        }
                    }
                }
            };

            searchDirectory(this.workspaceRoot);

            return {
                pattern,
                matches,
                totalMatches,
                limited: matches.length < totalMatches
            };
        } catch (error: any) {
            console.error(`Error in grep for pattern "${pattern}":`, error);
            return {
                pattern,
                matches: [],
                totalMatches: 0,
                limited: false
            };
        }
    }

    /**
     * Format file responses for LLM prompt
     */
    formatFileResponses(responses: FileResponse[]): string {
        if (responses.length === 0) return '';

        let formatted = '\n## Requested Files\n\n';

        for (const response of responses) {
            if (!response.exists) {
                formatted += `### ❌ ${response.path}\n`;
                formatted += `File not found or cannot be read.\n\n`;
                continue;
            }

            formatted += `### 📄 ${response.path} (${response.lines} lines)\n\n`;
            formatted += '```\n';
            // Limit file content to 5000 characters to avoid token limits
            const content = response.content.length > 5000 
                ? response.content.substring(0, 5000) + '\n\n[... content truncated ...]'
                : response.content;
            formatted += content;
            formatted += '\n```\n\n';
        }

        return formatted;
    }

    /**
     * Format grep responses for LLM prompt
     */
    formatGrepResponses(responses: GrepResponse[]): string {
        if (responses.length === 0) return '';

        let formatted = '\n## Grep Search Results\n\n';

        for (const response of responses) {
            formatted += `### 🔍 Pattern: \`${response.pattern}\`\n`;
            formatted += `Found ${response.totalMatches} total match(es)`;
            if (response.limited) {
                formatted += ` (showing first ${response.matches.length})`;
            }
            formatted += '\n\n';

            if (response.matches.length === 0) {
                formatted += 'No matches found.\n\n';
                continue;
            }

            // Group matches by file
            const byFile = new Map<string, GrepMatch[]>();
            for (const match of response.matches) {
                if (!byFile.has(match.file)) {
                    byFile.set(match.file, []);
                }
                byFile.get(match.file)!.push(match);
            }

            for (const [file, fileMatches] of byFile.entries()) {
                formatted += `#### ${file}\n\n`;
                for (const match of fileMatches) {
                    formatted += `**Line ${match.line}:**\n`;
                    if (match.context && match.context.before.length > 0) {
                        formatted += '```\n';
                        for (const line of match.context.before) {
                            formatted += line + '\n';
                        }
                        formatted += '```\n';
                    }
                    formatted += '```\n';
                    formatted += match.content + '\n';
                    formatted += '```\n';
                    if (match.context && match.context.after.length > 0) {
                        formatted += '```\n';
                        for (const line of match.context.after) {
                            formatted += line + '\n';
                        }
                        formatted += '```\n';
                    }
                    formatted += '\n';
                }
            }
            formatted += '\n';
        }

        return formatted;
    }
}




















