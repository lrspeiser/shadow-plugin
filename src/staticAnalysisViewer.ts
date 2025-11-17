/**
 * Static Analysis Viewer - Browse static code analysis issues
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { Insight } from './insightGenerator';

export class StaticAnalysisViewerProvider implements vscode.TreeDataProvider<StaticAnalysisItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StaticAnalysisItem | undefined | null | void> = 
        new vscode.EventEmitter<StaticAnalysisItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<StaticAnalysisItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    private insights: Insight[] = [];

    setInsights(insights: Insight[]): void {
        this.insights = insights || [];
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: StaticAnalysisItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: StaticAnalysisItem): Thenable<StaticAnalysisItem[]> {
        if (this.insights.length === 0) {
            return Promise.resolve([
                new StaticAnalysisItem(
                    'No static issues found',
                    vscode.TreeItemCollapsibleState.None,
                    'info',
                    'Run "Analyze Workspace" to check for issues'
                )
            ]);
        }

        if (!element) {
            // Root level - show summary and categories
            return Promise.resolve(this.getRootItems());
        }

        // Handle different item types
        switch (element.type) {
            case 'error-category':
                return Promise.resolve(this.getErrorItems());
            case 'warning-category':
                return Promise.resolve(this.getWarningItems());
            case 'info-category':
                return Promise.resolve(this.getInfoItems());
            case 'insight':
                return Promise.resolve([]); // Insights are leaf nodes
            default:
                return Promise.resolve([]);
        }
    }

    private getRootItems(): StaticAnalysisItem[] {
        const items: StaticAnalysisItem[] = [];
        
        // Summary
        const summary = new StaticAnalysisItem(
            `${this.insights.length} Static Issues Found`,
            vscode.TreeItemCollapsibleState.None,
            'summary',
            'Run AI analysis for recommendations'
        );
        summary.iconPath = new vscode.ThemeIcon('dashboard');
        items.push(summary);

        // Health score
        const healthScore = this.calculateHealthScore();
        const health = new StaticAnalysisItem(
            `Health: ${healthScore}%`,
            vscode.TreeItemCollapsibleState.None,
            'health',
            this.getHealthTooltip(healthScore)
        );
        health.iconPath = new vscode.ThemeIcon(healthScore > 70 ? 'heart' : 'warning');
        items.push(health);

        // Separator
        items.push(new StaticAnalysisItem('', vscode.TreeItemCollapsibleState.None, 'separator'));

        // Group by severity
        const errors = this.insights.filter(i => i.severity === 'error');
        const warnings = this.insights.filter(i => i.severity === 'warning');
        const infos = this.insights.filter(i => i.severity === 'info');

        if (errors.length > 0) {
            const item = new StaticAnalysisItem(
                `Errors (${errors.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'error-category'
            );
            item.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
            items.push(item);
        }

        if (warnings.length > 0) {
            const item = new StaticAnalysisItem(
                `Warnings (${warnings.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'warning-category'
            );
            item.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
            items.push(item);
        }

        if (infos.length > 0) {
            const item = new StaticAnalysisItem(
                `Info (${infos.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'info-category'
            );
            item.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('foreground'));
            items.push(item);
        }

        return items;
    }

    private getErrorItems(): StaticAnalysisItem[] {
        const errors = this.insights.filter(i => i.severity === 'error');
        return errors.map(insight => this.createInsightItem(insight));
    }

    private getWarningItems(): StaticAnalysisItem[] {
        const warnings = this.insights.filter(i => i.severity === 'warning');
        return warnings.map(insight => this.createInsightItem(insight));
    }

    private getInfoItems(): StaticAnalysisItem[] {
        const infos = this.insights.filter(i => i.severity === 'info');
        return infos.map(insight => this.createInsightItem(insight));
    }

    private createInsightItem(insight: Insight): StaticAnalysisItem {
        const label = insight.title || insight.description || 'Unknown issue';
        const item = new StaticAnalysisItem(
            label,
            vscode.TreeItemCollapsibleState.None,
            'insight',
            insight.file ? `${path.basename(insight.file)}${insight.line ? `:${insight.line}` : ''}` : undefined
        );
        
        item.insight = insight;
        item.iconPath = new vscode.ThemeIcon(
            insight.severity === 'error' ? 'error' : 
            insight.severity === 'warning' ? 'warning' : 'info'
        );
        item.tooltip = insight.description || insight.title;
        
        if (insight.file) {
            const uri = vscode.Uri.file(insight.file);
            if (insight.line) {
                item.command = {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [uri, { selection: new vscode.Range(insight.line - 1, 0, insight.line - 1, 0) }]
                };
            } else {
                item.command = {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [uri]
                };
            }
            item.resourceUri = uri;
        }
        
        return item;
    }

    private calculateHealthScore(): number {
        if (this.insights.length === 0) return 100;
        
        const errors = this.insights.filter(i => i.severity === 'error').length;
        const warnings = this.insights.filter(i => i.severity === 'warning').length;
        const infos = this.insights.filter(i => i.severity === 'info').length;
        
        // Calculate score: 100 - (errors * 10) - (warnings * 3) - (infos * 1)
        // Cap at 0
        const score = Math.max(0, 100 - (errors * 10) - (warnings * 3) - (infos * 1));
        return Math.round(score);
    }

    private getHealthTooltip(score: number): string {
        if (score >= 90) return 'Excellent code health';
        if (score >= 70) return 'Good code health';
        if (score >= 50) return 'Moderate issues detected';
        if (score >= 30) return 'Significant issues detected';
        return 'Critical issues detected';
    }
}

export class StaticAnalysisItem extends vscode.TreeItem {
    insight?: Insight;
    type: string;

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        type: string,
        description?: string
    ) {
        super(label, collapsibleState);
        this.type = type;
        this.description = description;
    }
}

