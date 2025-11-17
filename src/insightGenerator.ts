import { CodeAnalysis, FileInfo, FunctionInfo } from './analyzer';

export interface Insight {
    id: string;
    title: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    category: string;
    file?: string;
    line?: number;
    suggestion: string;
    codeSnippet?: string;
}

export class InsightGenerator {
    generateInsights(analysis: CodeAnalysis): Insight[] {
        const insights: Insight[] = [];

        // Check for large files
        insights.push(...this.checkLargeFiles(analysis));

        // Check for orphaned files
        insights.push(...this.checkOrphanedFiles(analysis));

        // Check for missing entry points
        insights.push(...this.checkEntryPoints(analysis));

        // Check for circular dependencies (potential)
        insights.push(...this.checkCircularDependencies(analysis));

        // Check for god objects
        insights.push(...this.checkGodObjects(analysis));

        // Check for dead code potential
        insights.push(...this.checkDeadCode(analysis));

        // Check file organization
        insights.push(...this.checkFileOrganization(analysis));

        // Check function complexity
        insights.push(...this.checkFunctionComplexity(analysis));

        return insights;
    }

    generateInsightsForFile(analysis: CodeAnalysis, filePath: string): Insight[] {
        const insights: Insight[] = [];
        const file = analysis.files.find(f => f.path === filePath);

        if (!file) return insights;

        // Check if file is too large
        if (file.lines > 500) {
            insights.push({
                id: `large-file-${filePath}`,
                title: 'Large File Detected',
                description: `This file has ${file.lines} lines of code, which exceeds the recommended 500 LOC.`,
                severity: 'warning',
                category: 'Code Organization',
                file: filePath,
                suggestion: 'Consider splitting this file into smaller, more focused modules. Extract related functions into separate files.'
            });
        }

        // Check function count
        if (file.functions > 20) {
            insights.push({
                id: `many-functions-${filePath}`,
                title: 'Too Many Functions',
                description: `This file contains ${file.functions} functions, suggesting it may have too many responsibilities.`,
                severity: 'warning',
                category: 'Single Responsibility Principle',
                file: filePath,
                suggestion: 'Group related functions and extract them into separate modules based on their responsibilities.'
            });
        }

        // Check for very large functions
        const fileFunctions = analysis.functions.filter(f => f.file === filePath);
        for (const func of fileFunctions) {
            if (func.lines > 100) {
                insights.push({
                    id: `large-function-${filePath}-${func.name}`,
                    title: 'Large Function',
                    description: `Function "${func.name}" has ${func.lines} lines, making it difficult to understand and maintain.`,
                    severity: 'warning',
                    category: 'Function Complexity',
                    file: filePath,
                    line: func.startLine,
                    suggestion: `Refactor "${func.name}" into smaller, more focused functions. Extract logical blocks into separate functions with clear names.`
                });
            }
        }

        return insights;
    }

    private checkLargeFiles(analysis: CodeAnalysis): Insight[] {
        const insights: Insight[] = [];
        const veryLargeFiles = analysis.files.filter(f => f.lines > 1000);

        if (veryLargeFiles.length > 0) {
            for (const file of veryLargeFiles.slice(0, 5)) { // Top 5
                insights.push({
                    id: `very-large-file-${file.path}`,
                    title: 'Very Large File',
                    description: `${file.path} has ${file.lines} lines of code, indicating potential god object or poor separation of concerns.`,
                    severity: 'error',
                    category: 'Code Organization',
                    file: file.path,
                    suggestion: 'This file likely contains multiple responsibilities. Consider breaking it into smaller, focused modules.'
                });
            }
        }

        if (analysis.largeFiles > 5 && analysis.totalFiles > 10) {
            insights.push({
                id: 'many-large-files',
                title: 'Many Large Files',
                description: `${analysis.largeFiles} files exceed 500 LOC (${Math.round(analysis.largeFiles / analysis.totalFiles * 100)}% of codebase).`,
                severity: 'warning',
                category: 'Architecture',
                suggestion: 'Consider a refactoring initiative to break down large files. This will improve maintainability and testability.'
            });
        }

        return insights;
    }

    private checkOrphanedFiles(analysis: CodeAnalysis): Insight[] {
        const insights: Insight[] = [];

        if (analysis.orphanedFiles.length > 0) {
            const orphanPercentage = Math.round(analysis.orphanedFiles.length / analysis.totalFiles * 100);
            
            if (orphanPercentage > 20) {
                insights.push({
                    id: 'many-orphaned-files',
                    title: 'High Number of Orphaned Files',
                    description: `${analysis.orphanedFiles.length} files (${orphanPercentage}%) are not imported by any other files.`,
                    severity: 'warning',
                    category: 'Dead Code',
                    suggestion: 'Review orphaned files - they may be dead code, entry points, or utilities that should be documented. Consider removing unused files.'
                });
            }

            // List specific orphaned files (first few)
            for (const file of analysis.orphanedFiles.slice(0, 3)) {
                insights.push({
                    id: `orphaned-${file}`,
                    title: 'Potentially Unused File',
                    description: `${file} is not imported by any other file in the codebase.`,
                    severity: 'info',
                    category: 'Dead Code',
                    file,
                    suggestion: 'Verify if this file is still needed. If it\'s an entry point, ensure it\'s documented. Otherwise, consider removing it.'
                });
            }
        }

        return insights;
    }

    private checkEntryPoints(analysis: CodeAnalysis): Insight[] {
        const insights: Insight[] = [];

        if (analysis.entryPoints.length === 0 && analysis.totalFiles > 5) {
            insights.push({
                id: 'no-entry-points',
                title: 'No Entry Points Detected',
                description: 'Unable to identify clear entry points to the application.',
                severity: 'warning',
                category: 'Architecture',
                suggestion: 'Define clear entry points (main.py, index.js, etc.) and document how to run the application.'
            });
        }

        if (analysis.entryPoints.length > 5) {
            insights.push({
                id: 'many-entry-points',
                title: 'Multiple Entry Points',
                description: `Found ${analysis.entryPoints.length} potential entry points, which may indicate unclear application structure.`,
                severity: 'info',
                category: 'Architecture',
                suggestion: 'Consider consolidating entry points or clearly documenting the purpose of each one.'
            });
        }

        return insights;
    }

    private checkCircularDependencies(analysis: CodeAnalysis): Insight[] {
        const insights: Insight[] = [];

        // Simple circular dependency detection
        const graph = analysis.imports;
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const cycles: string[][] = [];

        const dfs = (file: string, path: string[]): void => {
            visited.add(file);
            recursionStack.add(file);
            path.push(file);

            const imports = graph[file] || [];
            for (const imported of imports) {
                // Find files that match this import
                const matchingFiles = analysis.files
                    .filter(f => f.path.includes(imported) || imported.includes(f.path))
                    .map(f => f.path);

                for (const matchingFile of matchingFiles) {
                    if (!visited.has(matchingFile)) {
                        dfs(matchingFile, [...path]);
                    } else if (recursionStack.has(matchingFile)) {
                        // Found a cycle
                        const cycleStart = path.indexOf(matchingFile);
                        if (cycleStart !== -1) {
                            cycles.push([...path.slice(cycleStart), matchingFile]);
                        }
                    }
                }
            }

            recursionStack.delete(file);
        };

        for (const file of Object.keys(graph)) {
            if (!visited.has(file)) {
                dfs(file, []);
            }
        }

        // Report unique cycles
        const uniqueCycles = this.deduplicateCycles(cycles);
        for (const cycle of uniqueCycles.slice(0, 3)) { // Top 3
            insights.push({
                id: `circular-dependency-${cycle.join('-')}`,
                title: 'Circular Dependency Detected',
                description: `Circular dependency: ${cycle.join(' → ')}`,
                severity: 'error',
                category: 'Dependencies',
                suggestion: 'Break this cycle by introducing an interface/abstraction or reorganizing the code structure.'
            });
        }

        return insights;
    }

    private checkGodObjects(analysis: CodeAnalysis): Insight[] {
        const insights: Insight[] = [];

        // Files with many functions and many lines
        const godCandidates = analysis.files.filter(f => 
            f.lines > 800 && f.functions > 15
        );

        for (const file of godCandidates) {
            insights.push({
                id: `god-object-${file.path}`,
                title: 'Potential God Object',
                description: `${file.path} has ${file.lines} lines and ${file.functions} functions, suggesting it handles too many responsibilities.`,
                severity: 'error',
                category: 'Design Patterns',
                file: file.path,
                suggestion: 'Apply Single Responsibility Principle: extract cohesive groups of functions into separate classes/modules.'
            });
        }

        return insights;
    }

    private checkDeadCode(analysis: CodeAnalysis): Insight[] {
        const insights: Insight[] = [];

        // Functions that are never called (simplified heuristic)
        const functionNames = new Set(analysis.functions.map(f => f.name));
        const allCode = analysis.files.map(f => f.path).join(' ');

        let unusedCount = 0;
        for (const func of analysis.functions) {
            // Very basic check - count occurrences in file names/paths
            const occurrences = (allCode.match(new RegExp(func.name, 'g')) || []).length;
            if (occurrences < 2) { // Only defined once, never called
                unusedCount++;
            }
        }

        if (unusedCount > 0 && unusedCount / analysis.totalFunctions > 0.1) {
            insights.push({
                id: 'potential-dead-code',
                title: 'Potential Dead Code',
                description: `Approximately ${unusedCount} functions (${Math.round(unusedCount / analysis.totalFunctions * 100)}%) may be unused.`,
                severity: 'info',
                category: 'Dead Code',
                suggestion: 'Review function usage. Use code coverage tools to identify truly unused code and consider removing it.'
            });
        }

        return insights;
    }

    private checkFileOrganization(analysis: CodeAnalysis): Insight[] {
        const insights: Insight[] = [];

        // Check if files are flat (all in root)
        const rootFiles = analysis.files.filter(f => !f.path.includes('/') && !f.path.includes('\\'));
        
        if (rootFiles.length > 10 && rootFiles.length / analysis.totalFiles > 0.7) {
            insights.push({
                id: 'flat-structure',
                title: 'Flat File Structure',
                description: `${rootFiles.length} files are in the root directory without clear organization.`,
                severity: 'warning',
                category: 'Code Organization',
                suggestion: 'Organize files into logical directories (e.g., /models, /controllers, /utils, /services) based on their responsibilities.'
            });
        }

        return insights;
    }

    private checkFunctionComplexity(analysis: CodeAnalysis): Insight[] {
        const insights: Insight[] = [];

        // Very large functions
        const hugeFunctions = analysis.functions.filter(f => f.lines > 150);

        if (hugeFunctions.length > 0) {
            insights.push({
                id: 'huge-functions',
                title: 'Very Large Functions',
                description: `${hugeFunctions.length} functions exceed 150 lines, making them hard to understand and test.`,
                severity: 'warning',
                category: 'Function Complexity',
                suggestion: 'Break down large functions using Extract Method refactoring. Each function should do one thing well.'
            });
        }

        return insights;
    }

    private deduplicateCycles(cycles: string[][]): string[][] {
        const unique: string[][] = [];
        const seen = new Set<string>();

        for (const cycle of cycles) {
            const normalized = [...cycle].sort().join('|');
            if (!seen.has(normalized)) {
                seen.add(normalized);
                unique.push(cycle);
            }
        }

        return unique;
    }
}

