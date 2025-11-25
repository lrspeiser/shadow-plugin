/**
 * Reports Tree Provider - Displays generated analysis reports
 * Scans .shadow/docs for markdown reports and displays them
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ReportTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly filePath: string,
        public readonly timestamp: Date
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = `Generated: ${timestamp.toLocaleString()}\nClick to open`;
        this.description = this.formatTime(timestamp);
        this.iconPath = new vscode.ThemeIcon('file-text');
        this.command = {
            command: 'shadowWatch.openReport',
            title: 'Open Report',
            arguments: [filePath]
        };
    }
    
    private formatTime(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }
}

export class ReportsTreeProvider implements vscode.TreeDataProvider<ReportTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<ReportTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor() {}

    getTreeItem(element: ReportTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ReportTreeItem): Promise<ReportTreeItem[]> {
        if (element) {
            return [];
        }

        // Scan .shadow/docs for reports
        const reports = await this.scanForReports();
        return reports;
    }

    private async scanForReports(): Promise<ReportTreeItem[]> {
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return [];
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const docsDir = path.join(workspaceRoot, '.shadow', 'docs');
        
        if (!fs.existsSync(docsDir)) {
            return [];
        }

        const items: ReportTreeItem[] = [];
        const files = fs.readdirSync(docsDir);
        
        // Find all .md files that are analysis reports
        for (const file of files) {
            if (file.endsWith('.md')) {
                const filePath = path.join(docsDir, file);
                const stats = fs.statSync(filePath);
                
                // Create friendly label with date/time
                const dateStr = this.formatDateTime(stats.mtime);
                let label = file;
                if (file.startsWith('analysis-with-tests-')) {
                    label = `🧪 Analysis + Tests - ${dateStr}`;
                } else if (file.startsWith('streamlined-analysis-')) {
                    label = `⚡ Analysis - ${dateStr}`;
                } else if (file.endsWith('.md')) {
                    label = `📄 ${file.replace('.md', '')} - ${dateStr}`;
                }
                
                items.push(new ReportTreeItem(
                    label,
                    filePath,
                    stats.mtime
                ));
            }
        }
        
        // Sort by timestamp, newest first
        items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        // Limit to 10 most recent
        return items.slice(0, 10);
    }

    /**
     * Format date/time for display in label
     */
    private formatDateTime(date: Date): string {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const mins = date.getMinutes().toString().padStart(2, '0');
        return `${month}/${day} ${hours}:${mins}`;
    }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}
