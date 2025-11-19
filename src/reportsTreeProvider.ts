/**
 * Reports Tree Provider - Displays generated reports in a tree view
 * Replaces webview-based viewer with a permanent sidebar pane
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface ReportInfo {
    type: 'workspace' | 'product' | 'architecture' | 'refactoring' | 'unit-test';
    path: string | null;
    timestamp: number | null;
    label: string;
    description: string;
}

export class ReportTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly reportType: ReportInfo['type'],
        public readonly filePath: string | null,
        public readonly description: string,
        public readonly timestamp: number | null
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        
        if (filePath) {
            this.tooltip = `${description}\n\nGenerated: ${timestamp ? new Date(timestamp).toLocaleString() : 'Unknown'}\nPath: ${filePath}`;
            this.contextValue = 'report-available';
            this.iconPath = new vscode.ThemeIcon('file-text', new vscode.ThemeColor('charts.green'));
            this.command = {
                command: 'shadowWatch.openReport',
                title: 'Open Report',
                arguments: [filePath]
            };
        } else {
            this.tooltip = `${description}\n\nNot yet generated. Run the corresponding command to generate this report.`;
            this.contextValue = 'report-unavailable';
            this.iconPath = new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('charts.gray'));
        }
    }
}

export class ReportsTreeProvider implements vscode.TreeDataProvider<ReportTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<ReportTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    
    private reports: Map<ReportInfo['type'], ReportInfo> = new Map();

    constructor() {
        // Initialize all report types with null paths
        const reportTypes: ReportInfo['type'][] = ['workspace', 'product', 'architecture', 'refactoring', 'unit-test'];
        for (const type of reportTypes) {
            this.reports.set(type, {
                type,
                path: null,
                timestamp: null,
                label: this.getReportLabel(type),
                description: this.getReportDescription(type)
            });
        }
    }

    getTreeItem(element: ReportTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ReportTreeItem): Thenable<ReportTreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        }

        // Return all report types as tree items
        const items: ReportTreeItem[] = [];
        const reportOrder: ReportInfo['type'][] = ['workspace', 'product', 'architecture', 'refactoring', 'unit-test'];
        
        for (const type of reportOrder) {
            const report = this.reports.get(type);
            if (report) {
                items.push(new ReportTreeItem(
                    report.label,
                    report.type,
                    report.path,
                    report.description,
                    report.timestamp
                ));
            }
        }

        return Promise.resolve(items);
    }

    /**
     * Update report information
     */
    setReport(type: ReportInfo['type'], filePath: string | null, timestamp: number | null = null): void {
        const reportInfo: ReportInfo = {
            type,
            path: filePath,
            timestamp: timestamp || (filePath ? Date.now() : null),
            label: this.getReportLabel(type),
            description: this.getReportDescription(type)
        };
        this.reports.set(type, reportInfo);
        this.refresh();
    }

    /**
     * Update all reports at once
     */
    setReports(reports: Partial<Record<ReportInfo['type'], { path: string | null; timestamp?: number | null }>>): void {
        for (const [type, data] of Object.entries(reports)) {
            const reportInfo: ReportInfo = {
                type: type as ReportInfo['type'],
                path: data.path,
                timestamp: data.timestamp || (data.path ? Date.now() : null),
                label: this.getReportLabel(type as ReportInfo['type']),
                description: this.getReportDescription(type as ReportInfo['type'])
            };
            this.reports.set(type as ReportInfo['type'], reportInfo);
        }
        this.refresh();
    }

    /**
     * Get all report paths
     */
    getAllReportPaths(): Record<string, { path: string | null; timestamp: number | null }> {
        const result: Record<string, { path: string | null; timestamp: number | null }> = {};
        for (const [type, info] of this.reports.entries()) {
            result[type] = { path: info.path, timestamp: info.timestamp };
        }
        return result;
    }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get report label
     */
    private getReportLabel(type: ReportInfo['type']): string {
        const labels: Record<ReportInfo['type'], string> = {
            'workspace': '📁 Workspace Report',
            'product': '📚 Product Report',
            'architecture': '🏗️ Architecture Report',
            'refactoring': '🔧 Refactoring Report',
            'unit-test': '🧪 Unit Test Report'
        };
        return labels[type] || type;
    }

    /**
     * Get report description
     */
    private getReportDescription(type: ReportInfo['type']): string {
        const descriptions: Record<ReportInfo['type'], string> = {
            'workspace': 'Comprehensive workspace analysis with codebase statistics and file organization insights.',
            'product': 'Product documentation explaining what the application does for users and developers.',
            'architecture': 'Architecture insights describing system structure, components, and design patterns.',
            'refactoring': 'Detailed refactoring recommendations with step-by-step extraction plans and code examples.',
            'unit-test': 'Unit test execution results and recommendations for improving test coverage.'
        };
        return descriptions[type] || '';
    }
}
