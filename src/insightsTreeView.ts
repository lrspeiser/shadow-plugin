import * as vscode from 'vscode';
import { Insight } from './insightGenerator';
import { LLMFormatter } from './llmFormatter';
import { LLMService, LLMInsights } from './llmService';

export class InsightsTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private insights: Insight[] = [];
    private productDocsStatus: 'idle' | 'generating' | 'complete' = 'idle';
    private insightsStatus: 'idle' | 'generating' | 'complete' = 'idle';
    private unitTestStatus: 'idle' | 'generating' | 'complete' = 'idle';
    private analysisStatus: 'idle' | 'complete' = 'idle';
    private llmService: LLMService | null = null;
    private llmInsights: LLMInsights | null = null;
    private productDocsTimestamp: number | null = null;
    private insightsTimestamp: number | null = null;
    private analysisTimestamp: number | null = null;
    private reportPath: string | null = null;
    private reportTimestamp: number | null = null;
    private workspaceReportPath: string | null = null;
    private workspaceReportTimestamp: number | null = null;
    private productReportPath: string | null = null;
    private productReportTimestamp: number | null = null;
    private architectureReportPath: string | null = null;
    private architectureReportTimestamp: number | null = null;
    private unitTestReportPath: string | null = null;
    private unitTestReportTimestamp: number | null = null;
    private staticAnalysisViewer: any = null;

    constructor(
        private context: vscode.ExtensionContext,
        private llmFormatter: LLMFormatter
    ) {
        // Load persisted timestamps and check if files exist (async, but don't await in constructor)
        this.loadPersistedState().catch(err => {
            console.error('Error loading persisted state:', err);
        });
    }

    setLLMService(llmService: LLMService): void {
        this.llmService = llmService;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setStaticAnalysisViewer(viewer: any): void {
        this.staticAnalysisViewer = viewer;
        // Update it with current insights if we have any
        if (this.insights.length > 0 && viewer) {
            viewer.setInsights(this.insights);
        }
    }

    updateInsights(insights: Insight[]): void {
        this.insights = insights;
        // Update static analysis viewer if available
        if (this.staticAnalysisViewer) {
            this.staticAnalysisViewer.setInsights(insights);
        }
        this.refresh();
    }

    getAllInsights(): Insight[] {
        return this.insights;
    }

    getInsightsForFile(filePath: string): Insight[] {
        return this.insights.filter(i => i.file && i.file.includes(filePath));
    }

    clear(): void {
        this.insights = [];
        this.refresh();
    }

    setProductDocsStatus(status: 'idle' | 'generating' | 'complete'): void {
        this.productDocsStatus = status;
        if (status === 'complete') {
            this.productDocsTimestamp = Date.now();
            this.savePersistedState();
        }
        this.refresh();
    }

    setInsightsStatus(status: 'idle' | 'generating' | 'complete'): void {
        this.insightsStatus = status;
        if (status === 'complete') {
            this.insightsTimestamp = Date.now();
            this.savePersistedState();
        }
        this.refresh();
    }

    setUnitTestStatus(status: 'idle' | 'generating' | 'complete'): void {
        this.unitTestStatus = status;
        this.refresh();
    }

    getUnitTestStatus(): 'idle' | 'generating' | 'complete' {
        return this.unitTestStatus;
    }

    private async loadPersistedState(): Promise<void> {
        const workspaceKey = this.getWorkspaceKey();
        if (!workspaceKey) return;

        // Load timestamps from global state
        const saved = this.context.globalState.get<{
            productDocsTimestamp?: number;
            insightsTimestamp?: number;
            analysisTimestamp?: number;
            reportPath?: string;
            reportTimestamp?: number;
            workspaceReportPath?: string;
            workspaceReportTimestamp?: number;
            productReportPath?: string;
            productReportTimestamp?: number;
            architectureReportPath?: string;
            architectureReportTimestamp?: number;
            unitTestReportPath?: string;
            unitTestReportTimestamp?: number;
            productDocsStatus?: 'idle' | 'generating' | 'complete';
            insightsStatus?: 'idle' | 'generating' | 'complete';
            analysisStatus?: 'idle' | 'complete';
        }>(`shadowWatch.${workspaceKey}`);

        if (saved) {
            this.productDocsTimestamp = saved.productDocsTimestamp || null;
            this.insightsTimestamp = saved.insightsTimestamp || null;
            this.analysisTimestamp = saved.analysisTimestamp || null;
            this.reportPath = saved.reportPath || null;
            this.reportTimestamp = saved.reportTimestamp || null;
            this.workspaceReportPath = saved.workspaceReportPath || null;
            this.workspaceReportTimestamp = saved.workspaceReportTimestamp || null;
            this.productReportPath = saved.productReportPath || null;
            this.productReportTimestamp = saved.productReportTimestamp || null;
            this.architectureReportPath = saved.architectureReportPath || null;
            this.architectureReportTimestamp = saved.architectureReportTimestamp || null;
            this.unitTestReportPath = saved.unitTestReportPath || null;
            this.unitTestReportTimestamp = saved.unitTestReportTimestamp || null;
            if (saved.productDocsStatus) this.productDocsStatus = saved.productDocsStatus;
            if (saved.insightsStatus) this.insightsStatus = saved.insightsStatus;
            if (saved.analysisStatus) this.analysisStatus = saved.analysisStatus;
        }

        // Check if files actually exist and update status accordingly
        await this.checkFileExistence();
    }

    private async checkFileExistence(): Promise<void> {
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const fs = await import('fs');
        const path = await import('path');

        const docsDir = path.join(workspaceRoot, '.shadow', 'docs');
        
        if (!fs.existsSync(docsDir)) {
            return;
        }
        
        // Check product docs - find latest run directory
        const entries = fs.readdirSync(docsDir, { withFileTypes: true });
        const productDocRuns = entries
            .filter(e => e.isDirectory() && e.name.startsWith('product-docs-'))
            .map(e => ({
                name: e.name,
                path: path.join(docsDir, e.name),
                mtime: fs.statSync(path.join(docsDir, e.name)).mtimeMs
            }))
            .sort((a, b) => b.mtime - a.mtime);
        
        if (productDocRuns.length > 0) {
            const latestRun = productDocRuns[0];
            const productDocsPath = path.join(latestRun.path, 'enhanced-product-documentation.json');
            if (fs.existsSync(productDocsPath)) {
                this.productDocsStatus = 'complete';
                // If we have a timestamp, keep it; otherwise set to file modification time
                if (!this.productDocsTimestamp) {
                    const stats = fs.statSync(productDocsPath);
                    this.productDocsTimestamp = stats.mtimeMs;
                }
                // Note: Product docs are loaded by llmIntegration when needed
            }
        }

        // Check insights - find latest run directory
        const insightRuns = entries
            .filter(e => e.isDirectory() && e.name.startsWith('architecture-insights-'))
            .map(e => ({
                name: e.name,
                path: path.join(docsDir, e.name),
                mtime: fs.statSync(path.join(docsDir, e.name)).mtimeMs
            }))
            .sort((a, b) => b.mtime - a.mtime);
        
        if (insightRuns.length > 0) {
            const latestRun = insightRuns[0];
            const insightsPath = path.join(latestRun.path, 'architecture-insights.json');
            if (fs.existsSync(insightsPath)) {
                this.insightsStatus = 'complete';
                // If we have a timestamp, keep it; otherwise set to file modification time
                if (!this.insightsTimestamp) {
                    const stats = fs.statSync(insightsPath);
                    this.insightsTimestamp = stats.mtimeMs;
                }
                
                // Load insights from file
                try {
                    const insightsContent = fs.readFileSync(insightsPath, 'utf-8');
                    const loadedInsights = JSON.parse(insightsContent) as LLMInsights;
                    this.llmInsights = loadedInsights;
                    console.log('Loaded insights from file:', {
                        hasOverall: !!loadedInsights.overallAssessment,
                        strengthsCount: loadedInsights.strengths?.length || 0,
                        issuesCount: loadedInsights.issues?.length || 0,
                        recommendationsCount: loadedInsights.recommendations?.length || 0
                    });
                } catch (error) {
                    console.error('Failed to load insights from file:', error);
                }
            }
        }

        // Check if analysis exists (code-analysis.json file or cache directory)
        const analysisPath = path.join(docsDir, 'code-analysis.json');
        const cacheDir = path.join(workspaceRoot, '.vscode', 'shadow-watch');
        
        // If we don't have analysis status saved, check if analysis files exist
        if (this.analysisStatus === 'idle') {
            let analysisFound = false;
            let analysisTime = null;
            
            // Check for code-analysis.json file (preferred)
            if (fs.existsSync(analysisPath)) {
                try {
                    const stats = fs.statSync(analysisPath);
                    analysisFound = true;
                    analysisTime = stats.mtimeMs;
                } catch (error) {
                    // Ignore errors
                }
            }
            
            // Also check cache directory as fallback
            if (!analysisFound && fs.existsSync(cacheDir)) {
                try {
                    const files = fs.readdirSync(cacheDir);
                    if (files.length > 0) {
                        analysisFound = true;
                        // Use cache file modification time if no timestamp
                        const cacheFiles = files.map(f => path.join(cacheDir, f))
                            .filter(f => fs.statSync(f).isFile());
                        if (cacheFiles.length > 0) {
                            const stats = fs.statSync(cacheFiles[0]);
                            analysisTime = stats.mtimeMs;
                        }
                    }
                } catch (error) {
                    // Ignore errors
                }
            }
            
            if (analysisFound) {
                this.analysisStatus = 'complete';
                if (analysisTime && !this.analysisTimestamp) {
                    this.analysisTimestamp = analysisTime;
                }
            }
        }

        // Check for latest refactoring report file
        const reportFiles = entries
            .filter(e => e.isFile() && e.name.startsWith('refactoring-report-') && e.name.endsWith('.md'))
            .map(e => ({
                name: e.name,
                path: path.join(docsDir, e.name),
                mtime: fs.statSync(path.join(docsDir, e.name)).mtimeMs
            }))
            .sort((a, b) => b.mtime - a.mtime);
        
        // Always update to latest refactoring report
        if (reportFiles.length > 0) {
            const latestReport = reportFiles[0];
            // Only update if file exists and is newer or path doesn't exist
            if (fs.existsSync(latestReport.path) && 
                (!this.reportPath || latestReport.mtime > (this.reportTimestamp || 0))) {
                this.reportPath = latestReport.path;
                this.reportTimestamp = latestReport.mtime;
            }
        }

        // Always update to latest workspace report
        const workspaceReportFiles = entries
            .filter(e => e.isFile() && e.name.startsWith('workspace-report-') && e.name.endsWith('.md'))
            .map(e => ({
                name: e.name,
                path: path.join(docsDir, e.name),
                mtime: fs.statSync(path.join(docsDir, e.name)).mtimeMs
            }))
            .sort((a, b) => b.mtime - a.mtime);
        
        if (workspaceReportFiles.length > 0) {
            const latestReport = workspaceReportFiles[0];
            if (fs.existsSync(latestReport.path) && 
                (!this.workspaceReportPath || latestReport.mtime > (this.workspaceReportTimestamp || 0))) {
                this.workspaceReportPath = latestReport.path;
                this.workspaceReportTimestamp = latestReport.mtime;
            }
        }

        // Always update to latest product report
        const productReportFiles = entries
            .filter(e => e.isFile() && e.name.startsWith('product-report-') && e.name.endsWith('.md'))
            .map(e => ({
                name: e.name,
                path: path.join(docsDir, e.name),
                mtime: fs.statSync(path.join(docsDir, e.name)).mtimeMs
            }))
            .sort((a, b) => b.mtime - a.mtime);
        
        if (productReportFiles.length > 0) {
            const latestReport = productReportFiles[0];
            if (fs.existsSync(latestReport.path) && 
                (!this.productReportPath || latestReport.mtime > (this.productReportTimestamp || 0))) {
                this.productReportPath = latestReport.path;
                this.productReportTimestamp = latestReport.mtime;
            }
        }

        // Always update to latest architecture report
        const architectureReportFiles = entries
            .filter(e => e.isFile() && e.name.startsWith('architecture-report-') && e.name.endsWith('.md'))
            .map(e => ({
                name: e.name,
                path: path.join(docsDir, e.name),
                mtime: fs.statSync(path.join(docsDir, e.name)).mtimeMs
            }))
            .sort((a, b) => b.mtime - a.mtime);
        
        if (architectureReportFiles.length > 0) {
            const latestReport = architectureReportFiles[0];
            if (fs.existsSync(latestReport.path) && 
                (!this.architectureReportPath || latestReport.mtime > (this.architectureReportTimestamp || 0))) {
                this.architectureReportPath = latestReport.path;
                this.architectureReportTimestamp = latestReport.mtime;
            }
        }

        // Always update to latest unit test report
        const unitTestReportFiles = entries
            .filter(e => e.isFile() && e.name.startsWith('unit-test-report-') && e.name.endsWith('.md'))
            .map(e => ({
                name: e.name,
                path: path.join(docsDir, e.name),
                mtime: fs.statSync(path.join(docsDir, e.name)).mtimeMs
            }))
            .sort((a, b) => b.mtime - a.mtime);
        
        if (unitTestReportFiles.length > 0) {
            const latestReport = unitTestReportFiles[0];
            if (fs.existsSync(latestReport.path) && 
                (!this.unitTestReportPath || latestReport.mtime > (this.unitTestReportTimestamp || 0))) {
                this.unitTestReportPath = latestReport.path;
                this.unitTestReportTimestamp = latestReport.mtime;
            }
        }

        this.refresh();
    }

    private savePersistedState(): void {
        const workspaceKey = this.getWorkspaceKey();
        if (!workspaceKey) return;

        this.context.globalState.update(`shadowWatch.${workspaceKey}`, {
            productDocsTimestamp: this.productDocsTimestamp,
            insightsTimestamp: this.insightsTimestamp,
            analysisTimestamp: this.analysisTimestamp,
            reportPath: this.reportPath,
            reportTimestamp: this.reportTimestamp,
            workspaceReportPath: this.workspaceReportPath,
            workspaceReportTimestamp: this.workspaceReportTimestamp,
            productReportPath: this.productReportPath,
            productReportTimestamp: this.productReportTimestamp,
            architectureReportPath: this.architectureReportPath,
            architectureReportTimestamp: this.architectureReportTimestamp,
            unitTestReportPath: this.unitTestReportPath,
            unitTestReportTimestamp: this.unitTestReportTimestamp,
            productDocsStatus: this.productDocsStatus,
            insightsStatus: this.insightsStatus,
            analysisStatus: this.analysisStatus
        });
    }

    setAnalysisComplete(): void {
        this.analysisStatus = 'complete';
        this.analysisTimestamp = Date.now();
        this.savePersistedState();
        this.refresh();
    }

    setReportPath(reportPath: string): void {
        this.reportPath = reportPath;
        this.reportTimestamp = Date.now();
        this.savePersistedState();
        this.refresh();
    }

    getReportPath(): string | null {
        return this.reportPath;
    }

    setUnitTestReportPath(reportPath: string): void {
        this.unitTestReportPath = reportPath;
        this.unitTestReportTimestamp = Date.now();
        this.savePersistedState();
        this.refresh();
    }

    getUnitTestReportPath(): string | null {
        return this.unitTestReportPath;
    }

    setWorkspaceReportPath(reportPath: string): void {
        this.workspaceReportPath = reportPath;
        this.workspaceReportTimestamp = Date.now();
        this.savePersistedState();
        this.refresh();
    }

    getWorkspaceReportPath(): string | null {
        return this.workspaceReportPath;
    }

    setProductReportPath(reportPath: string): void {
        this.productReportPath = reportPath;
        this.productReportTimestamp = Date.now();
        this.savePersistedState();
        this.refresh();
    }

    getProductReportPath(): string | null {
        return this.productReportPath;
    }

    setArchitectureReportPath(reportPath: string): void {
        this.architectureReportPath = reportPath;
        this.architectureReportTimestamp = Date.now();
        this.savePersistedState();
        this.refresh();
    }

    getArchitectureReportPath(): string | null {
        return this.architectureReportPath;
    }

    /**
     * Get all report paths for the Reports viewer
     */
    getAllReportPaths(): {
        workspace: { path: string | null; timestamp: number | null };
        product: { path: string | null; timestamp: number | null };
        architecture: { path: string | null; timestamp: number | null };
        refactoring: { path: string | null; timestamp: number | null };
        unitTest: { path: string | null; timestamp: number | null };
    } {
        return {
            workspace: {
                path: this.workspaceReportPath,
                timestamp: this.workspaceReportTimestamp
            },
            product: {
                path: this.productReportPath,
                timestamp: this.productReportTimestamp
            },
            architecture: {
                path: this.architectureReportPath,
                timestamp: this.architectureReportTimestamp
            },
            refactoring: {
                path: this.reportPath,
                timestamp: this.reportTimestamp
            },
            unitTest: {
                path: this.unitTestReportPath,
                timestamp: this.unitTestReportTimestamp
            }
        };
    }

    private getWorkspaceKey(): string | null {
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return null;
        }
        // Use workspace folder name as key
        return vscode.workspace.workspaceFolders[0].name;
    }

    private formatTimestamp(timestamp: number | null): string {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        // For older dates, show actual date
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    getProductDocsStatus(): 'idle' | 'generating' | 'complete' {
        return this.productDocsStatus;
    }

    getInsightsStatus(): 'idle' | 'generating' | 'complete' {
        return this.insightsStatus;
    }

    setLLMInsights(insights: LLMInsights | null): void {
        console.log('setLLMInsights called with:', insights ? 'non-null' : 'null');
        if (insights) {
            console.log('Insights content:', {
                hasOverall: !!insights.overallAssessment,
                strengthsCount: insights.strengths?.length || 0,
                issuesCount: insights.issues?.length || 0,
                hasOrganization: !!insights.organization,
                hasReorganization: !!insights.folderReorganization
            });
        }
        this.llmInsights = insights;
        this.refresh();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        try {
        return element;
        } catch (error) {
            console.error('Error in getTreeItem:', error);
            // Return a safe fallback item
            const fallback = new TreeItem('Error loading item', vscode.TreeItemCollapsibleState.None);
            fallback.type = 'error';
            return fallback;
        }
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        try {
        if (!element) {
            // Root level - show summary and categories
            return this.getRootItems();
        }

        if (element.type === 'category') {
            // Show insights in this category
            return this.getInsightsForCategory(element.label as string);
        }

            if (element.type === 'llm-category') {
                // Show LLM insights in this category
                return this.getLLMInsightsForCategory(element.llmCategory!);
            }

            // Settings section removed - API key button is now directly in AI Actions section

            return [];
        } catch (error) {
            console.error('Error in getChildren:', error);
            // Return empty array on error to prevent UI crashes
        return [];
        }
    }

    async getAllMenuItems(): Promise<string[]> {
        const items: string[] = [];
        const rootItems = this.getRootItems();
        
        const traverse = async (item: TreeItem, depth: number = 0) => {
            const indent = '  '.repeat(depth);
            const label = item.label || '';
            const description = item.description ? ` - ${item.description}` : '';
            const type = item.type || 'unknown';
            items.push(`${indent}${label}${description} [${type}]`);
            
            // Get children for collapsible items
            if (item.collapsibleState !== vscode.TreeItemCollapsibleState.None) {
                try {
                    const children = await this.getChildren(item);
                    for (const child of children) {
                        await traverse(child, depth + 1);
                    }
                } catch (error) {
                    items.push(`${indent}  [Error loading children: ${error}]`);
                }
            }
        };
        
        for (const item of rootItems) {
            await traverse(item, 0);
        }
        
        // If we have LLM insights, include them in the root view
        if (this.llmInsights) {
            const llmItems = this.getLLMInsightsItems();
            // Traverse LLM items to convert them to strings
            for (const item of llmItems) {
                await traverse(item, 0);
            }
        }
        return items;
    }

    private getRootItems(): TreeItem[] {
        const items: TreeItem[] = [];

        // Run Analysis button
        const analyzeBtn = new TreeItem('⚡ Run Analysis', vscode.TreeItemCollapsibleState.None);
        analyzeBtn.type = 'action';
        analyzeBtn.iconPath = new vscode.ThemeIcon('zap');
        analyzeBtn.description = 'Analyze code for issues, duplicates, dead code';
        analyzeBtn.command = {
            command: 'shadowWatch.runStreamlinedAnalysis',
            title: 'Run Analysis'
        };
        items.push(analyzeBtn);

        // Run Analysis + Tests button
        const analyzeTestsBtn = new TreeItem('🧪 Run Analysis + Tests', vscode.TreeItemCollapsibleState.None);
        analyzeTestsBtn.type = 'action';
        analyzeTestsBtn.iconPath = new vscode.ThemeIcon('beaker');
        analyzeTestsBtn.description = 'Analyze code and generate/run unit tests';
        analyzeTestsBtn.command = {
            command: 'shadowWatch.runStreamlinedAnalysisWithTests',
            title: 'Run Analysis + Tests'
        };
        items.push(analyzeTestsBtn);

        // Settings
        const settingsBtn = new TreeItem('⚙️ Settings', vscode.TreeItemCollapsibleState.None);
        settingsBtn.type = 'action';
        settingsBtn.iconPath = new vscode.ThemeIcon('settings-gear');
        settingsBtn.description = 'Configure API key and options';
        settingsBtn.command = {
            command: 'shadowWatch.openSettings',
            title: 'Settings'
        };
        items.push(settingsBtn);

        // Shadow Ignore
        const ignoreBtn = new TreeItem('📝 Edit .shadowignore', vscode.TreeItemCollapsibleState.None);
        ignoreBtn.type = 'action';
        ignoreBtn.iconPath = new vscode.ThemeIcon('exclude');
        ignoreBtn.description = 'Exclude folders from analysis';
        ignoreBtn.command = {
            command: 'shadowWatch.openShadowIgnore',
            title: 'Edit .shadowignore'
        };
        items.push(ignoreBtn);

        // Clear All Data
        const clearBtn = new TreeItem('🗑️ Clear All Data', vscode.TreeItemCollapsibleState.None);
        clearBtn.type = 'action';
        clearBtn.iconPath = new vscode.ThemeIcon('trash');
        clearBtn.description = 'Remove all generated files';
        clearBtn.command = {
            command: 'shadowWatch.clearAllData',
            title: 'Clear All Data'
        };
        items.push(clearBtn);

        return items;
    }

    private getInsightsForCategory(category: string): TreeItem[] {
        let categoryInsights: Insight[] = [];

        if (category.startsWith('Errors')) {
            categoryInsights = this.insights.filter(i => i.severity === 'error');
        } else if (category.startsWith('Warnings')) {
            categoryInsights = this.insights.filter(i => i.severity === 'warning');
        } else if (category.startsWith('Info')) {
            categoryInsights = this.insights.filter(i => i.severity === 'info');
        }

        return categoryInsights.map(insight => {
            const item = new TreeItem(insight.title, vscode.TreeItemCollapsibleState.None);
            item.type = 'insight';
            item.insight = insight;
            item.description = insight.file ? this.truncatePath(insight.file) : undefined;
            item.tooltip = this.createTooltip(insight);
            item.contextValue = 'insight';
            
            // Set icon based on category
            switch (insight.category) {
                case 'Code Organization':
                    item.iconPath = new vscode.ThemeIcon('folder');
                    break;
                case 'Dependencies':
                    item.iconPath = new vscode.ThemeIcon('references');
                    break;
                case 'Function Complexity':
                    item.iconPath = new vscode.ThemeIcon('symbol-function');
                    break;
                case 'Dead Code':
                    item.iconPath = new vscode.ThemeIcon('trash');
                    break;
                case 'Design Patterns':
                    item.iconPath = new vscode.ThemeIcon('lightbulb');
                    break;
                default:
                    item.iconPath = new vscode.ThemeIcon('symbol-file');
            }

            // Make clickable if has file location
            if (insight.file) {
                item.command = {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [
                        this.getFileUri(insight.file),
                        {
                            selection: insight.line ? new vscode.Range(insight.line - 1, 0, insight.line - 1, 0) : undefined
                        }
                    ]
                };
            }

            return item;
        });
    }

    private createTooltip(insight: Insight): vscode.MarkdownString {
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        
        md.appendMarkdown(`**${insight.title}**\n\n`);
        md.appendMarkdown(`${insight.description}\n\n`);
        md.appendMarkdown(`**Category:** ${insight.category}  \n`);
        md.appendMarkdown(`**Severity:** ${insight.severity}\n\n`);
        
        if (insight.file) {
            md.appendMarkdown(`**File:** \`${insight.file}\``);
            if (insight.line) {
                md.appendMarkdown(` (line ${insight.line})`);
            }
            md.appendMarkdown('\n\n');
        }

        md.appendMarkdown(`**💡 Suggestion:**\n${insight.suggestion}\n`);

        return md;
    }

    private calculateHealthScore(): number {
        if (this.insights.length === 0) {
            return 100;
        }

        const errors = this.insights.filter(i => i.severity === 'error').length;
        const warnings = this.insights.filter(i => i.severity === 'warning').length;
        const infos = this.insights.filter(i => i.severity === 'info').length;

        // Weight: errors = -5, warnings = -2, infos = -1
        const penalty = (errors * 5) + (warnings * 2) + (infos * 1);
        const score = Math.max(0, 100 - penalty);

        return Math.round(score);
    }

    private getHealthTooltip(score: number): string {
        if (score >= 90) {
            return 'Excellent! Your codebase is in great shape.';
        } else if (score >= 70) {
            return 'Good. Some minor improvements recommended.';
        } else if (score >= 50) {
            return 'Fair. Several issues need attention.';
        } else {
            return 'Poor. Significant refactoring recommended.';
        }
    }

    private truncatePath(filePath: string): string {
        const maxLength = 40;
        if (filePath.length <= maxLength) {
            return filePath;
        }

        const parts = filePath.split('/');
        if (parts.length > 2) {
            return '...' + parts.slice(-2).join('/');
        }

        return '...' + filePath.slice(-maxLength);
    }

    private getFileUri(filePath: string): vscode.Uri {
        // If it's already an absolute path, use it
        if (filePath.startsWith('/') || filePath.match(/^[A-Za-z]:\\/)) {
            return vscode.Uri.file(filePath);
        }

        // Otherwise, resolve relative to workspace
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
            const path = require('path');
            const fullPath = path.join(workspaceRoot, filePath);
            return vscode.Uri.file(fullPath);
        }

        // Fallback
        return vscode.Uri.file(filePath);
    }

    private getLLMInsightsItems(): TreeItem[] {
        const items: TreeItem[] = [];
        const insights = this.llmInsights!;

        // AI Insights Header
        const header = new TreeItem('🧠 AI Architecture Insights', vscode.TreeItemCollapsibleState.Expanded);
        header.type = 'section';
        header.iconPath = new vscode.ThemeIcon('lightbulb');
        items.push(header);

        // Overall Assessment
        if (insights.overallAssessment) {
            const item = new TreeItem('Overall Assessment', vscode.TreeItemCollapsibleState.None);
            item.type = 'llm-insight';
            item.llmInsightType = 'overall';
            item.description = 'Click to view';
            item.iconPath = new vscode.ThemeIcon('file-text');
            item.command = {
                command: 'shadowWatch.copyLLMInsight',
                title: 'Copy Assessment',
                arguments: ['overall', insights.overallAssessment]
            };
            items.push(item);
        }

        // Strengths
        if (insights.strengths && insights.strengths.length > 0) {
            const item = new TreeItem(`Strengths (${insights.strengths.length})`, vscode.TreeItemCollapsibleState.Collapsed);
            item.type = 'llm-category';
            item.llmCategory = 'strengths';
            item.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
            items.push(item);
        }

        // Issues & Concerns - Show prominently, expanded by default
        if (insights.issues && insights.issues.length > 0) {
            const issuesHeader = new TreeItem(`⚠️ Issues & Concerns (${insights.issues.length})`, vscode.TreeItemCollapsibleState.Expanded);
            issuesHeader.type = 'llm-category';
            issuesHeader.llmCategory = 'issues';
            issuesHeader.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('errorForeground'));
            issuesHeader.description = 'Click to expand';
            items.push(issuesHeader);
            
            // Show issues as top-level items for visibility
            insights.issues.forEach((issue, index) => {
                // Handle both string (legacy) and InsightItem (new structured) formats
                const issueTitle = typeof issue === 'string' 
                    ? (issue.length > 80 ? issue.substring(0, 80) + '...' : issue)
                    : (issue.title.length > 80 ? issue.title.substring(0, 80) + '...' : issue.title);
                const issueItem = new TreeItem(
                    issueTitle,
                    vscode.TreeItemCollapsibleState.None
                );
                issueItem.type = 'llm-item';
                issueItem.llmCategory = 'issues';
                issueItem.llmItemIndex = index;
                issueItem.description = 'Click to copy';
                issueItem.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('errorForeground'));
                const issueContent = typeof issue === 'string' ? issue : issue.description;
                issueItem.command = {
                    command: 'shadowWatch.showInsightItemDetails',
                    title: 'Show Details',
                    arguments: [issue]
                };
                issueItem.tooltip = issueContent;
                items.push(issueItem);
            });
        }

        // Code Organization
        if (insights.organization) {
            const item = new TreeItem('Code Organization', vscode.TreeItemCollapsibleState.None);
            item.type = 'llm-insight';
            item.llmInsightType = 'organization';
            item.description = 'Click to copy';
            item.iconPath = new vscode.ThemeIcon('folder');
            item.command = {
                command: 'shadowWatch.copyLLMInsight',
                title: 'Copy Organization Analysis',
                arguments: ['organization', insights.organization]
            };
            items.push(item);
        }

        // Folder Reorganization
        if (insights.folderReorganization) {
            const item = new TreeItem('Folder Reorganization Plan', vscode.TreeItemCollapsibleState.None);
            item.type = 'llm-insight';
            item.llmInsightType = 'reorganization';
            item.description = 'Click to copy';
            item.iconPath = new vscode.ThemeIcon('folder-opened');
            item.command = {
                command: 'shadowWatch.copyLLMInsight',
                title: 'Copy Reorganization Plan',
                arguments: ['reorganization', insights.folderReorganization]
            };
            items.push(item);
        }

        // Recommendations - Show prominently, expanded by default
        if (insights.recommendations && insights.recommendations.length > 0) {
            const recHeader = new TreeItem(`💡 Recommendations (${insights.recommendations.length})`, vscode.TreeItemCollapsibleState.Expanded);
            recHeader.type = 'llm-category';
            recHeader.llmCategory = 'recommendations';
            recHeader.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('charts.blue'));
            recHeader.description = 'Click to expand';
            items.push(recHeader);
            
            // Also add individual recommendation items directly (expanded view)
            // Show first 5 recommendations as top-level items for visibility
            const maxTopLevel = 5;
            const topLevelRecs = insights.recommendations.slice(0, maxTopLevel);
            topLevelRecs.forEach((rec, index) => {
                // Handle both string (legacy) and InsightItem (new structured) formats
                const recTitle = typeof rec === 'string' 
                    ? (rec.length > 80 ? rec.substring(0, 80) + '...' : rec)
                    : (rec.title.length > 80 ? rec.title.substring(0, 80) + '...' : rec.title);
                const recContent = typeof rec === 'string' ? rec : rec.description;
                const recItem = new TreeItem(
                    recTitle,
                    vscode.TreeItemCollapsibleState.None
                );
                recItem.type = 'llm-item';
                recItem.llmCategory = 'recommendations';
                recItem.llmItemIndex = index;
                recItem.description = 'Click to view details';
                recItem.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('charts.blue'));
                recItem.command = {
                    command: 'shadowWatch.showInsightItemDetails',
                    title: 'Show Details',
                    arguments: [rec]
                };
                recItem.tooltip = recContent;
                items.push(recItem);
            });
            
            // If there are more than 5, show a note
            if (insights.recommendations.length > maxTopLevel) {
                const moreItem = new TreeItem(
                    `... and ${insights.recommendations.length - maxTopLevel} more (expand "Recommendations" above)`,
                    vscode.TreeItemCollapsibleState.None
                );
                moreItem.type = 'info';
                moreItem.iconPath = new vscode.ThemeIcon('chevron-right');
                items.push(moreItem);
            }
        }

        // Refactoring Priorities - Show prominently, expanded by default
        if (insights.priorities && insights.priorities.length > 0) {
            const priHeader = new TreeItem(`🎯 Refactoring Priorities (${insights.priorities.length})`, vscode.TreeItemCollapsibleState.Expanded);
            priHeader.type = 'llm-category';
            priHeader.llmCategory = 'priorities';
            priHeader.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.orange'));
            priHeader.description = 'Click to expand';
            items.push(priHeader);
            
            // Show priorities as top-level items for visibility
            insights.priorities.forEach((priority, index) => {
                // Handle both string (legacy) and InsightItem (new structured) formats
                const priTitle = typeof priority === 'string' 
                    ? (priority.length > 80 ? priority.substring(0, 80) + '...' : priority)
                    : (priority.title.length > 80 ? priority.title.substring(0, 80) + '...' : priority.title);
                const priContent = typeof priority === 'string' ? priority : priority.description;
                const priItem = new TreeItem(
                    priTitle,
                    vscode.TreeItemCollapsibleState.None
                );
                priItem.type = 'llm-item';
                priItem.llmCategory = 'priorities';
                priItem.llmItemIndex = index;
                priItem.description = 'Click to view details';
                priItem.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.orange'));
                priItem.command = {
                    command: 'shadowWatch.showInsightItemDetails',
                    title: 'Show Details',
                    arguments: [priority]
                };
                priItem.tooltip = priContent;
                items.push(priItem);
            });
        }

        // LLM Refactoring Prompt (most important!)
        if (insights.cursorPrompt) {
            const item = new TreeItem('✨ LLM Refactoring Prompt', vscode.TreeItemCollapsibleState.None);
            item.type = 'llm-insight';
            item.llmInsightType = 'cursor-prompt';
            item.description = 'Click to copy';
            item.iconPath = new vscode.ThemeIcon('copy');
            item.command = {
                command: 'shadowWatch.copyLLMInsight',
                title: 'Copy LLM Prompt',
                arguments: ['cursor-prompt', insights.cursorPrompt]
            };
            items.push(item);
        }

        // Fallback: If no insights were parsed, show raw content
        const hasAnyInsights = insights.overallAssessment || 
                              (insights.strengths && insights.strengths.length > 0) ||
                              (insights.issues && insights.issues.length > 0) ||
                              insights.organization ||
                              insights.folderReorganization ||
                              (insights.recommendations && insights.recommendations.length > 0) ||
                              (insights.priorities && insights.priorities.length > 0);
        
        if (!hasAnyInsights && insights.rawContent) {
            const item = new TreeItem('⚠️ Raw LLM Response (Parsing Failed)', vscode.TreeItemCollapsibleState.None);
            item.type = 'llm-insight';
            item.llmInsightType = 'raw';
            item.description = 'Click to view';
            item.iconPath = new vscode.ThemeIcon('warning');
            item.command = {
                command: 'shadowWatch.copyLLMInsight',
                title: 'View Raw Response',
                arguments: ['raw', insights.rawContent]
            };
            items.push(item);
        }

        return items;
    }

    getLLMInsightsForCategory(category: string): TreeItem[] {
        const insights = this.llmInsights!;
        let items: (string | { title: string; description: string; relevantFiles?: string[]; relevantFunctions?: string[] })[] = [];
        let icon: vscode.ThemeIcon | undefined;
        let color: vscode.ThemeColor | undefined;

        switch (category) {
            case 'strengths':
                items = insights.strengths || [];
                icon = new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
                break;
            case 'issues':
                items = insights.issues || [];
                icon = new vscode.ThemeIcon('warning', new vscode.ThemeColor('errorForeground'));
                break;
            case 'recommendations':
                items = insights.recommendations || [];
                icon = new vscode.ThemeIcon('info', new vscode.ThemeColor('charts.blue'));
                break;
            case 'priorities':
                items = insights.priorities || [];
                icon = new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.orange'));
                break;
        }

        return items.map((item, index) => {
            // Handle both string (legacy) and InsightItem (new structured) formats
            const title = typeof item === 'string' 
                ? (item.length > 80 ? item.substring(0, 80) + '...' : item)
                : (item.title.length > 80 ? item.title.substring(0, 80) + '...' : item.title);
            const content = typeof item === 'string' ? item : item.description;
            
            const treeItem = new TreeItem(title, vscode.TreeItemCollapsibleState.None);
            treeItem.type = 'llm-item';
            treeItem.llmCategory = category;
            treeItem.llmItemIndex = index;
            treeItem.description = 'Click to view details';
            treeItem.iconPath = icon || new vscode.ThemeIcon('copy');
            treeItem.command = {
                command: 'shadowWatch.showInsightItemDetails',
                title: 'Show Details',
                arguments: [item]
            };
            treeItem.tooltip = content;
            return treeItem;
        });
    }
}

export class TreeItem extends vscode.TreeItem {
    type?: string;
    category?: string;
    insight?: Insight;
    llmCategory?: string;
    llmInsightType?: string;
    llmItemIndex?: number;
    contextValue?: string;
}

