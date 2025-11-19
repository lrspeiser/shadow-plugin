/**
 * Reports Viewer - Displays links to all generated reports
 * Replaces individual webview panels with a single Reports pane
 */
import * as vscode from 'vscode';
import { BaseWebviewProvider } from './webview/baseWebviewProvider';
import { WebviewTemplateEngine } from './webview/webviewTemplateEngine';

export interface ReportInfo {
    type: 'workspace' | 'product' | 'architecture' | 'refactoring' | 'unit-test';
    path: string | null;
    timestamp: number | null;
    label: string;
    description: string;
}

export class ReportsViewer implements vscode.Disposable {
    private panel: vscode.WebviewPanel | null = null;
    private baseProvider: BaseWebviewProvider;
    private templateEngine: WebviewTemplateEngine;
    private reports: Map<string, ReportInfo> = new Map();

    constructor(private context: vscode.ExtensionContext) {
        this.baseProvider = new BaseWebviewProvider();
        this.templateEngine = new WebviewTemplateEngine();
        
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

    /**
     * Show or reveal the Reports pane
     */
    show(): void {
        if (this.panel) {
            this.panel.reveal();
            this.updateContent();
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'shadowWatchReports',
                '📊 Reports',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this.panel.onDidDispose(() => {
                this.panel = null;
            });

            // Handle messages from webview
            this.panel.webview.onDidReceiveMessage(async (message) => {
                switch (message.command) {
                    case 'openReport':
                        await this.openReport(message.path);
                        break;
                    case 'refresh':
                        this.updateContent();
                        break;
                }
            });

            this.updateContent();
        }
    }

    /**
     * Update report information
     */
    setReport(type: ReportInfo['type'], path: string | null, timestamp: number | null = null): void {
        const reportInfo: ReportInfo = {
            type,
            path,
            timestamp: timestamp || (path ? Date.now() : null),
            label: this.getReportLabel(type),
            description: this.getReportDescription(type)
        };
        this.reports.set(type, reportInfo);
        this.updateContent();
    }

    /**
     * Update all reports at once
     */
    setReports(reports: Partial<Record<ReportInfo['type'], { path: string | null; timestamp?: number | null }>>): void {
        for (const [type, data] of Object.entries(reports)) {
            this.setReport(
                type as ReportInfo['type'],
                data.path,
                data.timestamp || null
            );
        }
    }

    /**
     * Update the webview content
     */
    private updateContent(): void {
        if (!this.panel) {
            return;
        }

        const html = this.generateHtml();
        this.panel.webview.html = html;
    }

    /**
     * Generate HTML content for the Reports pane
     */
    private generateHtml(): string {
        const reports = Array.from(this.reports.values());
        
        const reportsHtml = reports.map(report => {
            if (!report.path) {
                return `
                    <div class="report-item unavailable">
                        <div class="report-header">
                            <h3>${report.label}</h3>
                            <span class="status-badge unavailable">Not Generated</span>
                        </div>
                        <p class="report-description">${report.description}</p>
                        <p class="report-status">Run the corresponding command to generate this report.</p>
                    </div>
                `;
            }

            const relativePath = this.getRelativePath(report.path);
            const dateStr = report.timestamp 
                ? new Date(report.timestamp).toLocaleString()
                : 'Unknown date';

            return `
                <div class="report-item available">
                    <div class="report-header">
                        <h3>${report.label}</h3>
                        <span class="status-badge available">Available</span>
                    </div>
                    <p class="report-description">${report.description}</p>
                    <div class="report-meta">
                        <span class="report-date">Generated: ${dateStr}</span>
                        <span class="report-path">${WebviewTemplateEngine.escapeHtml(relativePath)}</span>
                    </div>
                    <button class="open-report-btn" data-path="${WebviewTemplateEngine.escapeHtml(report.path)}">
                        📄 Open Report
                    </button>
                </div>
            `;
        }).join('');

        return this.templateEngine.render({
            title: 'Reports',
            content: `
                <div class="container">
                    <h1>📊 Shadow Watch Reports</h1>
                    <p class="intro">Generated reports are available below. Click "Open Report" to view the full markdown file in the editor.</p>
                    
                    <div class="reports-list">
                        ${reportsHtml || '<p>No reports available. Generate reports using the Shadow Watch commands.</p>'}
                    </div>
                    
                    <div class="actions">
                        <button id="refresh-btn">🔄 Refresh</button>
                    </div>
                </div>
            `,
            customStyles: `
                .container {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .intro {
                    color: #666;
                    margin-bottom: 30px;
                    font-size: 14px;
                }
                
                .reports-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .report-item {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 20px;
                    background: white;
                    transition: box-shadow 0.2s;
                }
                
                .report-item:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .report-item.unavailable {
                    opacity: 0.6;
                    background: #f9f9f9;
                }
                
                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .report-header h3 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 18px;
                }
                
                .status-badge {
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .status-badge.available {
                    background: #d4edda;
                    color: #155724;
                }
                
                .status-badge.unavailable {
                    background: #f8d7da;
                    color: #721c24;
                }
                
                .report-description {
                    color: #555;
                    margin: 10px 0;
                    line-height: 1.6;
                }
                
                .report-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    margin: 15px 0;
                    font-size: 12px;
                    color: #888;
                }
                
                .report-path {
                    font-family: 'Monaco', 'Courier New', monospace;
                    background: #f4f4f4;
                    padding: 4px 8px;
                    border-radius: 4px;
                    word-break: break-all;
                }
                
                .open-report-btn {
                    padding: 10px 20px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: background 0.2s;
                }
                
                .open-report-btn:hover {
                    background: #2980b9;
                }
                
                .actions {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e0e0e0;
                }
                
                #refresh-btn {
                    padding: 8px 16px;
                    background: #95a5a6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                #refresh-btn:hover {
                    background: #7f8c8d;
                }
            `,
            customScript: `
                const vscode = acquireVsCodeApi();
                
                // Handle open report button clicks
                document.addEventListener('click', (e) => {
                    if (e.target.classList.contains('open-report-btn')) {
                        const path = e.target.getAttribute('data-path');
                        if (path) {
                            vscode.postMessage({
                                command: 'openReport',
                                path: path
                            });
                        }
                    }
                });
                
                // Handle refresh button
                document.getElementById('refresh-btn')?.addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'refresh'
                    });
                });
            `
        });
    }

    /**
     * Open a report file in the editor
     */
    private async openReport(filePath: string): Promise<void> {
        try {
            const uri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open report: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get relative path for display
     */
    private getRelativePath(filePath: string): string {
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return filePath;
        }
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        try {
            return filePath.replace(workspaceRoot, '').replace(/^[\/\\]/, '');
        } catch {
            return filePath;
        }
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

    /**
     * Dispose the viewer
     */
    dispose(): void {
        if (this.panel) {
            this.panel.dispose();
            this.panel = null;
        }
    }
}

