/**
 * Insights Viewer - Browse AI Architecture Insights results
 */
import * as vscode from 'vscode';
import { LLMInsights } from './llmService';
import * as path from 'path';
import * as fs from 'fs';
import { FileWatcherService } from './domain/services/fileWatcherService';

export class InsightsViewerProvider implements vscode.TreeDataProvider<InsightItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<InsightItem | undefined | null | void> = 
        new vscode.EventEmitter<InsightItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<InsightItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    private insights: LLMInsights | null = null;
    private workspaceRoot: string | null = null;
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private purposeWatcher: vscode.FileSystemWatcher | undefined;
    private fileWatcherService: FileWatcherService | undefined;
    private watcherDisposables: vscode.Disposable[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        fileWatcherService?: FileWatcherService
    ) {
        this.fileWatcherService = fileWatcherService;
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            this.workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            this.setupFileWatcher();
        }
    }

    private setupFileWatcher(): void {
        if (!this.workspaceRoot) return;

        const shadowDir = path.join(this.workspaceRoot, '.shadow');
        const docsDir = path.join(shadowDir, 'docs');
        
        // Create directories if they don't exist
        if (!fs.existsSync(shadowDir)) {
            fs.mkdirSync(shadowDir, { recursive: true });
        }
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }
        
        // Use unified file watcher service if available, otherwise create watchers directly
        if (this.fileWatcherService) {
            // Watch for architecture insights iteration files
            const pattern = new vscode.RelativePattern(
                vscode.Uri.file(docsDir),
                '**/architecture-insights-iteration-*.json'
            );

            this.watcherDisposables.push(
                this.fileWatcherService.watch('insightsViewer-iterations', pattern, (event) => {
                    if (event.type === 'created' || event.type === 'changed') {
                        console.log('[InsightsViewer] Insights iteration file', event.type, ':', event.uri.fsPath);
                        this.loadIncrementalInsights(event.uri.fsPath);
                        this.refresh();
                    }
                })
            );

            // Also watch for product-purpose-analysis.json
            const purposePattern = new vscode.RelativePattern(
                vscode.Uri.file(docsDir),
                '**/product-purpose-analysis.json'
            );
            this.watcherDisposables.push(
                this.fileWatcherService.watch('insightsViewer-purpose', purposePattern, (event) => {
                    if (event.type === 'created' || event.type === 'changed') {
                        console.log('[InsightsViewer] Product purpose analysis file', event.type, ':', event.uri.fsPath);
                        this.loadIncrementalInsights(event.uri.fsPath);
                        this.refresh();
                    }
                })
            );
        } else {
            // Fallback: create watchers directly (backward compatibility)
            // Watch for architecture insights iteration files
            const pattern = new vscode.RelativePattern(
                vscode.Uri.file(docsDir),
                '**/architecture-insights-iteration-*.json'
            );

            this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
            
            this.fileWatcher.onDidCreate((uri) => {
                console.log('[InsightsViewer] New insights iteration file created:', uri.fsPath);
                this.loadIncrementalInsights(uri.fsPath);
                this.refresh();
            });
            
            this.fileWatcher.onDidChange((uri) => {
                console.log('[InsightsViewer] Insights iteration file changed:', uri.fsPath);
                this.loadIncrementalInsights(uri.fsPath);
                this.refresh();
            });

            // Also watch for product-purpose-analysis.json
            const purposePattern = new vscode.RelativePattern(
                vscode.Uri.file(docsDir),
                '**/product-purpose-analysis.json'
            );
            this.purposeWatcher = vscode.workspace.createFileSystemWatcher(purposePattern);
            this.purposeWatcher.onDidCreate((uri) => {
                console.log('[InsightsViewer] Product purpose analysis file created:', uri.fsPath);
                this.loadIncrementalInsights(uri.fsPath);
                this.refresh();
            });
            this.purposeWatcher.onDidChange((uri) => {
                console.log('[InsightsViewer] Product purpose analysis file changed:', uri.fsPath);
                this.loadIncrementalInsights(uri.fsPath);
                this.refresh();
            });
        }

        // Load existing incremental files
        this.loadExistingIncrementalInsights();
    }

    private loadIncrementalInsights(filePath: string): void {
        try {
            if (!fs.existsSync(filePath)) {
                console.log('[InsightsViewer] File does not exist:', filePath);
                return;
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            
            console.log('[InsightsViewer] Loaded data from file:', filePath, {
                hasMetadata: !!data._metadata,
                keys: Object.keys(data).filter(k => k !== '_metadata'),
                dataSize: JSON.stringify(data).length
            });
            
            // If it's an insights iteration, merge it into current insights
            if (filePath.includes('architecture-insights-iteration-')) {
                console.log('[InsightsViewer] Loading insights iteration from:', filePath);
                console.log('[InsightsViewer] Raw data from file:', {
                    hasOverall: !!data.overallAssessment,
                    strengthsCount: data.strengths?.length || 0,
                    issuesCount: data.issues?.length || 0,
                    recommendationsCount: data.recommendations?.length || 0,
                    prioritiesCount: data.priorities?.length || 0,
                    hasOrganization: !!data.organization,
                    hasEntryPointsAnalysis: !!data.entryPointsAnalysis,
                    hasOrphanedFilesAnalysis: !!data.orphanedFilesAnalysis,
                    hasFolderReorganization: !!data.folderReorganization,
                    hasCursorPrompt: !!data.cursorPrompt,
                    hasProductPurposeAnalysis: !!data.productPurposeAnalysis
                });
                
                // Merge with existing insights or use as base
                if (!this.insights) {
                    // Remove _metadata for clean LLMInsights object
                    const { _metadata, ...cleanData } = data;
                    this.insights = cleanData as LLMInsights;
                    console.log('[InsightsViewer] Created new insights object');
                } else {
                    // Merge: keep existing data but update with new iteration data
                    const { _metadata, ...cleanData } = data;
                    this.insights = {
                        ...this.insights,
                        ...cleanData,
                        // Use new data arrays if they exist and are non-empty, otherwise keep existing
                        strengths: (cleanData.strengths && cleanData.strengths.length > 0) ? cleanData.strengths : (this.insights.strengths || []),
                        issues: (cleanData.issues && cleanData.issues.length > 0) ? cleanData.issues : (this.insights.issues || []),
                        recommendations: (cleanData.recommendations && cleanData.recommendations.length > 0) ? cleanData.recommendations : (this.insights.recommendations || []),
                        priorities: (cleanData.priorities && cleanData.priorities.length > 0) ? cleanData.priorities : (this.insights.priorities || [])
                    } as LLMInsights;
                    console.log('[InsightsViewer] Merged with existing insights');
                }
                console.log('[InsightsViewer] Updated insights:', {
                    hasOverall: !!this.insights.overallAssessment,
                    strengthsCount: this.insights.strengths?.length || 0,
                    issuesCount: this.insights.issues?.length || 0,
                    recommendationsCount: this.insights.recommendations?.length || 0,
                    prioritiesCount: this.insights.priorities?.length || 0,
                    hasOrganization: !!this.insights.organization,
                    hasEntryPointsAnalysis: !!this.insights.entryPointsAnalysis,
                    hasOrphanedFilesAnalysis: !!this.insights.orphanedFilesAnalysis,
                    hasFolderReorganization: !!this.insights.folderReorganization,
                    hasCursorPrompt: !!this.insights.cursorPrompt,
                    hasProductPurposeAnalysis: !!this.insights.productPurposeAnalysis
                });
            } else if (filePath.includes('product-purpose-analysis.json')) {
                console.log('[InsightsViewer] Loading product purpose analysis from:', filePath);
                console.log('[InsightsViewer] Product purpose data keys:', Object.keys(data));
                // Merge product purpose analysis into insights
                if (!this.insights) {
                    const { _metadata, ...cleanData } = data;
                    this.insights = {
                        productPurposeAnalysis: cleanData
                    } as LLMInsights;
                } else {
                    const { _metadata, ...cleanData } = data;
                    this.insights.productPurposeAnalysis = cleanData;
                }
                console.log('[InsightsViewer] Updated product purpose analysis');
            }
        } catch (error) {
            console.error('[InsightsViewer] Failed to load incremental insights:', error);
            console.error('[InsightsViewer] Error details:', error instanceof Error ? error.stack : error);
        }
    }

    private loadExistingIncrementalInsights(): void {
        if (!this.workspaceRoot) return;

        const shadowDir = path.join(this.workspaceRoot, '.shadow', 'docs');
        if (!fs.existsSync(shadowDir)) return;

        // Find the latest architecture-insights run directory
        const entries = fs.readdirSync(shadowDir, { withFileTypes: true });
        const insightRuns = entries
            .filter(e => e.isDirectory() && e.name.startsWith('architecture-insights-'))
            .map(e => ({
                name: e.name,
                path: path.join(shadowDir, e.name),
                mtime: fs.statSync(path.join(shadowDir, e.name)).mtimeMs
            }))
            .sort((a, b) => b.mtime - a.mtime);

        if (insightRuns.length === 0) return;

        const latestRun = insightRuns[0];
        console.log('[InsightsViewer] Loading incremental insights from:', latestRun.path);

        // Load all iteration files, sorted by iteration number
        try {
            const files = fs.readdirSync(latestRun.path, { withFileTypes: true });
            const iterationFiles = files
                .filter(f => f.isFile() && f.name.startsWith('architecture-insights-iteration-') && f.name.endsWith('.json'))
                .map(f => ({
                    path: path.join(latestRun.path, f.name),
                    iteration: parseInt(f.name.match(/iteration-(\d+)/)?.[1] || '0')
                }))
                .sort((a, b) => a.iteration - b.iteration);

            // Load the latest iteration (highest number)
            if (iterationFiles.length > 0) {
                const latestIteration = iterationFiles[iterationFiles.length - 1];
                console.log('[InsightsViewer] Loading latest iteration:', latestIteration.path);
                this.loadIncrementalInsights(latestIteration.path);
            }

            // Also load product purpose analysis if it exists
            const purposePath = path.join(latestRun.path, 'product-purpose-analysis.json');
            if (fs.existsSync(purposePath)) {
                console.log('[InsightsViewer] Loading product purpose analysis:', purposePath);
                this.loadIncrementalInsights(purposePath);
            }
        } catch (error) {
            console.error('[InsightsViewer] Error loading existing incremental insights:', error);
        }
    }

    dispose(): void {
        // Dispose unified service watchers
        for (const disposable of this.watcherDisposables) {
            disposable.dispose();
        }
        this.watcherDisposables = [];
        
        // Dispose legacy watchers (if using fallback)
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = undefined;
        }
        if (this.purposeWatcher) {
            this.purposeWatcher.dispose();
            this.purposeWatcher = undefined;
        }
    }

    setInsights(insights: LLMInsights | null): void {
        console.log('[InsightsViewer] setInsights called:', {
            hasInsights: !!insights,
            hasOverall: !!insights?.overallAssessment,
            strengthsCount: insights?.strengths?.length || 0,
            issuesCount: insights?.issues?.length || 0
        });
        this.insights = insights;
        this.refresh();
    }

    refresh(): void {
        console.log('[InsightsViewer] refresh() called - firing tree data change event');
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: InsightItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: InsightItem): Thenable<InsightItem[]> {
        console.log('[InsightsViewer] getChildren called, element type:', element?.type || 'root');
        console.log('[InsightsViewer] Has insights:', !!this.insights);
        
        // Try to load incremental insights if we don't have any yet
        if (!this.insights) {
            this.loadExistingIncrementalInsights();
        }
        
        if (!this.insights) {
            console.log('[InsightsViewer] No insights available, showing placeholder');
            return Promise.resolve([
                new InsightItem(
                    'No architecture insights yet',
                    vscode.TreeItemCollapsibleState.None,
                    'info',
                    'Run "Generate AI Architecture Insights" to see results'
                )
            ]);
        }
        
        console.log('[InsightsViewer] Using insights:', {
            hasOverall: !!this.insights.overallAssessment,
            strengthsCount: this.insights.strengths?.length || 0,
            issuesCount: this.insights.issues?.length || 0,
            hasProductPurpose: !!this.insights.productPurposeAnalysis
        });

        if (!element) {
            // Root level - show main categories
            return Promise.resolve(this.getRootItems());
        }

        // Handle different item types
        switch (element.type) {
            case 'overall':
            case 'organization':
            case 'entry-points-analysis':
            case 'orphaned-analysis':
            case 'reorganization':
            case 'cursor-prompt':
                return Promise.resolve([]); // These are leaf nodes
            case 'product-purpose':
                return Promise.resolve(this.getProductPurposeItems());
            case 'strengths':
                return Promise.resolve(this.getStrengthsItems());
            case 'issues':
                return Promise.resolve(this.getIssuesItems());
            case 'recommendations':
                return Promise.resolve(this.getRecommendationsItems());
            case 'priorities':
                return Promise.resolve(this.getPrioritiesItems());
            case 'design-decisions':
                return Promise.resolve(this.getDesignDecisionsItems());
            case 'user-goals':
                return Promise.resolve(this.getUserGoalsItems());
            case 'contextual-factors':
                return Promise.resolve(this.getContextualFactorsItems());
            default:
                return Promise.resolve([]);
        }
    }

    private getRootItems(): InsightItem[] {
        const items: InsightItem[] = [];
        const insights = this.insights!;

        // Product Purpose Analysis (if available) - show first as it explains WHY
        if (insights.productPurposeAnalysis) {
            const purpose = insights.productPurposeAnalysis;
            items.push(new InsightItem(
                '🎯 Product Purpose & Architecture Rationale',
                vscode.TreeItemCollapsibleState.Collapsed,
                'product-purpose',
                'Understanding WHY the architecture exists'
            ));
        }

        // Overall Assessment
        if (insights.overallAssessment) {
            items.push(new InsightItem(
                '📋 Overall Assessment',
                vscode.TreeItemCollapsibleState.None,
                'overall',
                insights.overallAssessment.substring(0, 150) + (insights.overallAssessment.length > 150 ? '...' : ''),
                { content: insights.overallAssessment, type: 'overall' }
            ));
        }

        // Strengths
        if (insights.strengths && insights.strengths.length > 0) {
            items.push(new InsightItem(
                `✅ Strengths (${insights.strengths.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'strengths',
                'Architecture strengths'
            ));
        }

        // Issues & Concerns
        if (insights.issues && insights.issues.length > 0) {
            items.push(new InsightItem(
                `⚠️ Issues & Concerns (${insights.issues.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'issues',
                'Architecture issues and concerns'
            ));
        }

        // Code Organization
        if (insights.organization) {
            items.push(new InsightItem(
                '📁 Code Organization',
                vscode.TreeItemCollapsibleState.None,
                'organization',
                insights.organization.substring(0, 150) + (insights.organization.length > 150 ? '...' : ''),
                { content: insights.organization, type: 'organization' }
            ));
        }

        // Entry Points Analysis
        if (insights.entryPointsAnalysis) {
            items.push(new InsightItem(
                '🚪 Entry Points Analysis',
                vscode.TreeItemCollapsibleState.None,
                'entry-points-analysis',
                insights.entryPointsAnalysis.substring(0, 150) + (insights.entryPointsAnalysis.length > 150 ? '...' : ''),
                { content: insights.entryPointsAnalysis, type: 'entry-points' }
            ));
        }

        // Orphaned Files Analysis
        if (insights.orphanedFilesAnalysis) {
            items.push(new InsightItem(
                '🔴 Orphaned Files Analysis',
                vscode.TreeItemCollapsibleState.None,
                'orphaned-analysis',
                insights.orphanedFilesAnalysis.substring(0, 150) + (insights.orphanedFilesAnalysis.length > 150 ? '...' : ''),
                { content: insights.orphanedFilesAnalysis, type: 'orphaned' }
            ));
        }

        // Folder Reorganization
        if (insights.folderReorganization) {
            items.push(new InsightItem(
                '🔄 Folder Reorganization',
                vscode.TreeItemCollapsibleState.None,
                'reorganization',
                insights.folderReorganization.substring(0, 150) + (insights.folderReorganization.length > 150 ? '...' : ''),
                { content: insights.folderReorganization, type: 'reorganization' }
            ));
        }

        // Recommendations
        if (insights.recommendations && insights.recommendations.length > 0) {
            items.push(new InsightItem(
                `💡 Recommendations (${insights.recommendations.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'recommendations',
                'Actionable recommendations'
            ));
        }

        // Refactoring Priorities
        if (insights.priorities && insights.priorities.length > 0) {
            items.push(new InsightItem(
                `🎯 Refactoring Priorities (${insights.priorities.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'priorities',
                'Top refactoring priorities'
            ));
        }

        // LLM Refactoring Prompt
        if (insights.cursorPrompt) {
            items.push(new InsightItem(
                '✨ LLM Refactoring Prompt',
                vscode.TreeItemCollapsibleState.None,
                'cursor-prompt',
                insights.cursorPrompt.substring(0, 150) + (insights.cursorPrompt.length > 150 ? '...' : ''),
                { content: insights.cursorPrompt, type: 'cursor-prompt' }
            ));
        }

        return items;
    }

    private getProductPurposeItems(): InsightItem[] {
        const insights = this.insights!;
        if (!insights.productPurposeAnalysis) return [];

        const purpose = insights.productPurposeAnalysis;
        const items: InsightItem[] = [];

        if (purpose.productPurpose) {
            items.push(new InsightItem(
                'Product Purpose',
                vscode.TreeItemCollapsibleState.None,
                'purpose-item',
                purpose.productPurpose.substring(0, 100) + (purpose.productPurpose.length > 100 ? '...' : ''),
                { content: purpose.productPurpose, type: 'purpose' }
            ));
        }

        if (purpose.architectureRationale) {
            items.push(new InsightItem(
                'Architecture Rationale',
                vscode.TreeItemCollapsibleState.None,
                'rationale-item',
                purpose.architectureRationale.substring(0, 100) + (purpose.architectureRationale.length > 100 ? '...' : ''),
                { content: purpose.architectureRationale, type: 'rationale' }
            ));
        }

        if (purpose.designDecisions && purpose.designDecisions.length > 0) {
            items.push(new InsightItem(
                `Key Design Decisions (${purpose.designDecisions.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'design-decisions',
                'Architectural decisions and their reasons'
            ));
        }

        if (purpose.userGoals && purpose.userGoals.length > 0) {
            items.push(new InsightItem(
                `User Goals (${purpose.userGoals.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'user-goals',
                'What users are trying to accomplish'
            ));
        }

        if (purpose.contextualFactors && purpose.contextualFactors.length > 0) {
            items.push(new InsightItem(
                `Contextual Factors (${purpose.contextualFactors.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'contextual-factors',
                'Factors that influence architecture'
            ));
        }

        return items;
    }

    private getStrengthsItems(): InsightItem[] {
        const insights = this.insights!;
        if (!insights.strengths) return [];

        return insights.strengths.map((strength, idx) => 
            new InsightItem(
                strength,
                vscode.TreeItemCollapsibleState.None,
                'strength-item',
                `Strength ${idx + 1}`,
                { content: strength, type: 'strength' }
            )
        );
    }

    private getIssuesItems(): InsightItem[] {
        const insights = this.insights!;
        if (!insights.issues) return [];

        return insights.issues.map((issue, idx) => {
            // Handle both old string format and new structured format
            if (typeof issue === 'string') {
                // Legacy format - extract title from string
                const titleMatch = issue.match(/\*\*([^*]+)\*\*:/);
                const title = titleMatch ? titleMatch[1] : `Issue ${idx + 1}`;
                return new InsightItem(
                    title,
                    vscode.TreeItemCollapsibleState.None,
                    'issue-item',
                    issue.substring(0, 100) + (issue.length > 100 ? '...' : ''),
                    { content: issue, type: 'issue', relevantFiles: [], relevantFunctions: [] }
                );
            } else {
                // New structured format
                return new InsightItem(
                    issue.title,
                    vscode.TreeItemCollapsibleState.None,
                    'issue-item',
                    issue.description.substring(0, 100) + (issue.description.length > 100 ? '...' : ''),
                    { 
                        content: issue.description, 
                        type: 'issue',
                        relevantFiles: issue.relevantFiles || [],
                        relevantFunctions: issue.relevantFunctions || []
                    }
                );
            }
        });
    }

    private getRecommendationsItems(): InsightItem[] {
        const insights = this.insights!;
        if (!insights.recommendations) return [];

        return insights.recommendations.map((rec, idx) => {
            // Handle both old string format and new structured format
            if (typeof rec === 'string') {
                // Legacy format
                return new InsightItem(
                    rec,
                    vscode.TreeItemCollapsibleState.None,
                    'recommendation-item',
                    `Recommendation ${idx + 1}`,
                    { content: rec, type: 'recommendation', relevantFiles: [], relevantFunctions: [] }
                );
            } else {
                // New structured format
                return new InsightItem(
                    rec.title,
                    vscode.TreeItemCollapsibleState.None,
                    'recommendation-item',
                    rec.description.substring(0, 100) + (rec.description.length > 100 ? '...' : ''),
                    { 
                        content: rec.description, 
                        type: 'recommendation',
                        relevantFiles: rec.relevantFiles || [],
                        relevantFunctions: rec.relevantFunctions || []
                    }
                );
            }
        });
    }

    private getPrioritiesItems(): InsightItem[] {
        const insights = this.insights!;
        if (!insights.priorities) return [];

        return insights.priorities.map((priority, idx) => {
            // Handle both old string format and new structured format
            if (typeof priority === 'string') {
                // Legacy format
                return new InsightItem(
                    priority,
                    vscode.TreeItemCollapsibleState.None,
                    'priority-item',
                    `Priority ${idx + 1}`,
                    { content: priority, type: 'priority', relevantFiles: [], relevantFunctions: [] }
                );
            } else {
                // New structured format
                return new InsightItem(
                    priority.title,
                    vscode.TreeItemCollapsibleState.None,
                    'priority-item',
                    priority.description.substring(0, 100) + (priority.description.length > 100 ? '...' : ''),
                    { 
                        content: priority.description, 
                        type: 'priority',
                        relevantFiles: priority.relevantFiles || [],
                        relevantFunctions: priority.relevantFunctions || []
                    }
                );
            }
        });
    }

    private getDesignDecisionsItems(): InsightItem[] {
        const insights = this.insights!;
        if (!insights.productPurposeAnalysis?.designDecisions) return [];

        return insights.productPurposeAnalysis.designDecisions.map((decision, idx) => 
            new InsightItem(
                decision,
                vscode.TreeItemCollapsibleState.None,
                'design-decision-item',
                `Decision ${idx + 1}`,
                { content: decision, type: 'design-decision' }
            )
        );
    }

    private getUserGoalsItems(): InsightItem[] {
        const insights = this.insights!;
        if (!insights.productPurposeAnalysis?.userGoals) return [];

        return insights.productPurposeAnalysis.userGoals.map((goal, idx) => 
            new InsightItem(
                goal,
                vscode.TreeItemCollapsibleState.None,
                'user-goal-item',
                `Goal ${idx + 1}`,
                { content: goal, type: 'user-goal' }
            )
        );
    }

    private getContextualFactorsItems(): InsightItem[] {
        const insights = this.insights!;
        if (!insights.productPurposeAnalysis?.contextualFactors) return [];

        return insights.productPurposeAnalysis.contextualFactors.map((factor, idx) => 
            new InsightItem(
                factor,
                vscode.TreeItemCollapsibleState.None,
                'contextual-factor-item',
                `Factor ${idx + 1}`,
                { content: factor, type: 'contextual-factor' }
            )
        );
    }
}

export class InsightItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: string,
        public readonly description?: string,
        public readonly data?: any
    ) {
        super(label, collapsibleState);

        this.description = description;
        // For copyable items, store full content in tooltip so it's always available
        if (this.isCopyable() && data?.content) {
            this.tooltip = data.content;
        } else {
            this.tooltip = description || label;
        }

        // Set icons based on type
        this.iconPath = this.getIconForType(type);

        // Set command for copyable items - use show details on click, copy on right-click
        if (this.isCopyable()) {
            this.command = {
                command: 'shadowWatch.showInsightItemDetails',
                title: 'Show Details',
                arguments: [this]
            };
        }
    }

    private getIconForType(type: string): vscode.ThemeIcon {
        const iconMap: { [key: string]: string } = {
            'overall': 'file-text',
            'strengths': 'check',
            'strength-item': 'check',
            'issues': 'warning',
            'issue-item': 'warning',
            'organization': 'folder',
            'entry-points-analysis': 'play',
            'orphaned-analysis': 'warning',
            'reorganization': 'sync',
            'recommendations': 'lightbulb',
            'recommendation-item': 'lightbulb',
            'priorities': 'target',
            'priority-item': 'target',
            'cursor-prompt': 'copy',
            'info': 'info'
        };

        return new vscode.ThemeIcon(iconMap[type] || 'circle-outline');
    }

    private isCopyable(): boolean {
        return this.type === 'strength-item' || 
               this.type === 'issue-item' ||
               this.type === 'recommendation-item' ||
               this.type === 'priority-item' ||
               this.type === 'overall' ||
               this.type === 'organization' ||
               this.type === 'entry-points-analysis' ||
               this.type === 'orphaned-analysis' ||
               this.type === 'reorganization' ||
               this.type === 'cursor-prompt' ||
               this.type === 'purpose-item' ||
               this.type === 'rationale-item' ||
               this.type === 'design-decision-item' ||
               this.type === 'user-goal-item' ||
               this.type === 'contextual-factor-item';
    }
}

