/**
 * Analysis Viewer - Browse the raw code analysis results
 */
import * as vscode from 'vscode';
import { CodeAnalysis, FileInfo, FunctionInfo, EntryPoint } from './analyzer';
import * as path from 'path';

export class AnalysisViewerProvider implements vscode.TreeDataProvider<AnalysisItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AnalysisItem | undefined | null | void> = 
        new vscode.EventEmitter<AnalysisItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AnalysisItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    private analysis: CodeAnalysis | null = null;

    setAnalysis(analysis: CodeAnalysis | null): void {
        this.analysis = analysis;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: AnalysisItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: AnalysisItem): Thenable<AnalysisItem[]> {
        if (!this.analysis) {
            return Promise.resolve([
                new AnalysisItem(
                    'No analysis available',
                    vscode.TreeItemCollapsibleState.None,
                    'info',
                    'Run "Analyze Workspace" to see analysis results'
                )
            ]);
        }

        if (!element) {
            // Root level - show summary and categories
            return Promise.resolve(this.getRootItems());
        }

        // Handle different item types
        switch (element.type) {
            case 'statistics':
                return Promise.resolve(this.getStatisticsItems());
            case 'files':
                return Promise.resolve(this.getFilesItems());
            case 'file':
                return Promise.resolve(this.getFileDetails(element));
            case 'directory':
                return Promise.resolve(this.getDirectoryFiles(element));
            case 'functions':
                return Promise.resolve(this.getFunctionsItems());
            case 'function':
                return Promise.resolve([]); // Functions are leaf nodes
            case 'file-functions':
                return Promise.resolve(this.getFileFunctions(element));
            case 'file-imports':
                return Promise.resolve(this.getFileImports(element));
            case 'imports':
                return Promise.resolve(this.getFileImports(element));
            case 'entry-points':
                return Promise.resolve(this.getEntryPointsItems());
            case 'entry-point':
                return Promise.resolve([]); // Entry points are leaf nodes
            case 'dependencies':
                return Promise.resolve(this.getDependenciesItems());
            case 'orphaned-files':
                return Promise.resolve(this.getOrphanedFilesItems());
            case 'languages':
                return Promise.resolve(this.getLanguagesItems());
            case 'language':
                return Promise.resolve(this.getLanguageFiles(element));
            default:
                return Promise.resolve([]);
        }
    }

    private getRootItems(): AnalysisItem[] {
        const items: AnalysisItem[] = [];
        const analysis = this.analysis!;

        // Statistics summary
        items.push(new AnalysisItem(
            `📊 Statistics`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'statistics',
            `${analysis.totalFiles} files, ${analysis.totalLines.toLocaleString()} lines, ${analysis.totalFunctions} functions`
        ));

        // Files
        items.push(new AnalysisItem(
            `📁 Files (${analysis.files.length})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'files',
            'Browse all analyzed files'
        ));

        // Languages
        const languages = this.getUniqueLanguages();
        if (languages.length > 0) {
            items.push(new AnalysisItem(
                `🔤 Languages (${languages.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'languages',
                languages.join(', ')
            ));
        }

        // Functions
        if (analysis.functions && analysis.functions.length > 0) {
            items.push(new AnalysisItem(
                `⚙️ Functions (${analysis.functions.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'functions',
                'All functions found in codebase'
            ));
        }

        // Entry Points
        if (analysis.entryPoints && analysis.entryPoints.length > 0) {
            items.push(new AnalysisItem(
                `🚪 Entry Points (${analysis.entryPoints.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'entry-points',
                'Application entry points'
            ));
        }

        // Dependencies
        const importCount = Object.keys(analysis.imports || {}).length;
        if (importCount > 0) {
            items.push(new AnalysisItem(
                `🔗 Dependencies (${importCount} files)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'dependencies',
                'File import relationships'
            ));
        }

        // Orphaned Files
        if (analysis.orphanedFiles && analysis.orphanedFiles.length > 0) {
            items.push(new AnalysisItem(
                `🔴 Orphaned Files (${analysis.orphanedFiles.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'orphaned-files',
                'Files not imported anywhere'
            ));
        }

        return items;
    }

    private getStatisticsItems(): AnalysisItem[] {
        const analysis = this.analysis!;
        return [
            new AnalysisItem(
                `Total Files: ${analysis.totalFiles.toLocaleString()}`,
                vscode.TreeItemCollapsibleState.None,
                'stat',
                'Number of files analyzed'
            ),
            new AnalysisItem(
                `Total Lines: ${analysis.totalLines.toLocaleString()}`,
                vscode.TreeItemCollapsibleState.None,
                'stat',
                'Total lines of code'
            ),
            new AnalysisItem(
                `Total Functions: ${analysis.totalFunctions.toLocaleString()}`,
                vscode.TreeItemCollapsibleState.None,
                'stat',
                'Total functions found'
            ),
            new AnalysisItem(
                `Large Files (>500 lines): ${analysis.largeFiles}`,
                vscode.TreeItemCollapsibleState.None,
                'stat',
                'Files exceeding 500 lines'
            ),
            new AnalysisItem(
                `Imported Files: ${analysis.importedFiles?.length || 0}`,
                vscode.TreeItemCollapsibleState.None,
                'stat',
                'Files that are imported/used'
            ),
            new AnalysisItem(
                `Orphaned Files: ${analysis.orphanedFiles?.length || 0}`,
                vscode.TreeItemCollapsibleState.None,
                'stat',
                'Files not imported anywhere'
            )
        ];
    }

    private getFilesItems(): AnalysisItem[] {
        const analysis = this.analysis!;
        // Group files by directory
        const filesByDir = new Map<string, FileInfo[]>();
        
        for (const file of analysis.files) {
            const dir = path.dirname(file.path) || '.';
            if (!filesByDir.has(dir)) {
                filesByDir.set(dir, []);
            }
            filesByDir.get(dir)!.push(file);
        }

        const items: AnalysisItem[] = [];
        
        // Sort directories
        const sortedDirs = Array.from(filesByDir.entries()).sort((a, b) => 
            a[0].localeCompare(b[0])
        );

        for (const [dir, files] of sortedDirs) {
            const dirName = dir === '.' ? 'Root' : path.basename(dir) || dir;
            items.push(new AnalysisItem(
                `${dirName} (${files.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'directory',
                dir,
                { directory: dir, files: files }
            ));
        }

        return items;
    }

    private getDirectoryFiles(element: AnalysisItem): AnalysisItem[] {
        const files = element.data?.files as FileInfo[];
        if (!files) return [];

        return files.map(file => 
            new AnalysisItem(
                path.basename(file.path),
                vscode.TreeItemCollapsibleState.Collapsed,
                'file',
                `${file.lines} lines, ${file.functions} functions`,
                { file: file }
            )
        );
    }

    private getFileImports(element: AnalysisItem): AnalysisItem[] {
        const imports = element.data?.imports as string[];
        if (!imports) return [];

        return imports.map(imp => 
            new AnalysisItem(
                imp,
                vscode.TreeItemCollapsibleState.None,
                'import',
                `Import: ${imp}`
            )
        );
    }

    private getFileFunctions(element: AnalysisItem): AnalysisItem[] {
        const functions = element.data?.functions as FunctionInfo[];
        if (!functions) return [];

        return functions.map(func => 
            new AnalysisItem(
                func.name,
                vscode.TreeItemCollapsibleState.None,
                'function',
                `${func.lines} lines (${func.startLine}-${func.endLine})`,
                { function: func }
            )
        );
    }

    private getFileDetails(element: AnalysisItem): AnalysisItem[] {
        const file = element.data?.file as FileInfo;
        if (!file) return [];

        const items: AnalysisItem[] = [];

        items.push(new AnalysisItem(
            `Lines: ${file.lines}`,
            vscode.TreeItemCollapsibleState.None,
            'detail',
            `Total lines in file`
        ));

        items.push(new AnalysisItem(
            `Functions: ${file.functions}`,
            vscode.TreeItemCollapsibleState.None,
            'detail',
            `Number of functions`
        ));

        items.push(new AnalysisItem(
            `Language: ${file.language}`,
            vscode.TreeItemCollapsibleState.None,
            'detail',
            `Programming language`
        ));

        // Show imports for this file
        const analysis = this.analysis!;
        const imports = analysis.imports?.[file.path] || [];
        if (imports.length > 0) {
            items.push(new AnalysisItem(
                `Imports (${imports.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'imports',
                'Dependencies of this file',
                { file: file, imports: imports }
            ));
        }

        // Navigate to file
        items.push(new AnalysisItem(
            '🔗 Open File',
            vscode.TreeItemCollapsibleState.None,
            'navigate',
            `Open ${file.path}`,
            { file: file, action: 'open' }
        ));

        return items;
    }

    private getFunctionsItems(): AnalysisItem[] {
        const analysis = this.analysis!;
        // Group functions by file
        const functionsByFile = new Map<string, FunctionInfo[]>();
        
        for (const func of analysis.functions) {
            if (!functionsByFile.has(func.file)) {
                functionsByFile.set(func.file, []);
            }
            functionsByFile.get(func.file)!.push(func);
        }

        const items: AnalysisItem[] = [];
        
        // Sort by file path
        const sortedFiles = Array.from(functionsByFile.entries()).sort((a, b) => 
            a[0].localeCompare(b[0])
        );

        for (const [filePath, functions] of sortedFiles) {
            const fileName = path.basename(filePath);
            items.push(new AnalysisItem(
                `${fileName} (${functions.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'file-functions',
                filePath,
                { filePath: filePath, functions: functions }
            ));
        }

        return items;
    }

    private getEntryPointsItems(): AnalysisItem[] {
        const analysis = this.analysis!;
        return analysis.entryPoints.map(ep => 
            new AnalysisItem(
                `${ep.path} (${ep.type})`,
                vscode.TreeItemCollapsibleState.None,
                'entry-point',
                ep.reason,
                { entryPoint: ep }
            )
        );
    }

    private getDependenciesItems(): AnalysisItem[] {
        const analysis = this.analysis!;
        const items: AnalysisItem[] = [];
        
        if (!analysis.imports) return items;

        // Group by file
        for (const [filePath, imports] of Object.entries(analysis.imports)) {
            if (imports.length === 0) continue;
            
            const fileName = path.basename(filePath);
            items.push(new AnalysisItem(
                `${fileName} (${imports.length} imports)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'file-imports',
                filePath,
                { filePath: filePath, imports: imports }
            ));
        }

        return items.sort((a, b) => a.label!.localeCompare(b.label!));
    }

    private getOrphanedFilesItems(): AnalysisItem[] {
        const analysis = this.analysis!;
        if (!analysis.orphanedFiles) return [];

        return analysis.orphanedFiles.map(filePath => 
            new AnalysisItem(
                path.basename(filePath),
                vscode.TreeItemCollapsibleState.None,
                'orphaned-file',
                filePath,
                { filePath: filePath }
            )
        );
    }

    private getLanguagesItems(): AnalysisItem[] {
        const languages = this.getUniqueLanguages();
        const languageCounts = this.getLanguageCounts();

        return languages.map(lang => 
            new AnalysisItem(
                `${lang} (${languageCounts.get(lang) || 0} files)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'language',
                `${languageCounts.get(lang) || 0} files`,
                { language: lang }
            )
        );
    }

    private getLanguageFiles(element: AnalysisItem): AnalysisItem[] {
        const language = element.data?.language as string;
        if (!language || !this.analysis) return [];

        const files = this.analysis.files.filter(f => f.language === language);
        
        return files.map(file => 
            new AnalysisItem(
                path.basename(file.path),
                vscode.TreeItemCollapsibleState.Collapsed,
                'file',
                file.path,
                { file: file }
            )
        );
    }

    private getUniqueLanguages(): string[] {
        if (!this.analysis) return [];
        const languages = new Set(this.analysis.files.map(f => f.language));
        return Array.from(languages).filter(l => l !== 'unknown').sort();
    }

    private getLanguageCounts(): Map<string, number> {
        const counts = new Map<string, number>();
        if (!this.analysis) return counts;

        for (const file of this.analysis.files) {
            counts.set(file.language, (counts.get(file.language) || 0) + 1);
        }
        return counts;
    }
}

export class AnalysisItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: string,
        public readonly description?: string,
        public readonly data?: any
    ) {
        super(label, collapsibleState);

        this.description = description;
        this.tooltip = description || label;

        // Set icons based on type
        this.iconPath = this.getIconForType(type);

        // Set command for navigable items
        if (this.isNavigable()) {
            this.command = {
                command: 'shadowWatch.navigateToAnalysisItem',
                title: 'Navigate',
                arguments: [this]
            };
        }
    }

    private getIconForType(type: string): vscode.ThemeIcon {
        const iconMap: { [key: string]: string } = {
            'statistics': 'graph',
            'files': 'files',
            'file': 'file',
            'directory': 'folder',
            'functions': 'symbol-function',
            'function': 'symbol-function',
            'entry-points': 'play',
            'entry-point': 'play',
            'dependencies': 'link',
            'orphaned-files': 'warning',
            'orphaned-file': 'warning',
            'languages': 'symbol-text',
            'language': 'symbol-text',
            'navigate': 'link-external',
            'info': 'info',
            'stat': 'circle-outline',
            'detail': 'circle-outline',
            'imports': 'arrow-right',
            'file-imports': 'arrow-right',
            'file-functions': 'symbol-function'
        };

        return new vscode.ThemeIcon(iconMap[type] || 'circle-outline');
    }

    private isNavigable(): boolean {
        return this.type === 'file' || 
               this.type === 'function' || 
               this.type === 'entry-point' ||
               this.type === 'orphaned-file' ||
               this.type === 'navigate';
    }
}

