import * as vscode from 'vscode';
import * as path from 'path';
import { CodeAnalyzer } from './analyzer';
import { InsightGenerator } from './insightGenerator';
import { DiagnosticsProvider } from './diagnosticsProvider';
import { InsightsTreeProvider } from './insightsTreeView';
import { getConfigurationManager } from './config/configurationManager';

export class FileWatcher {
    private watcher: vscode.FileSystemWatcher | undefined;
    private lastAnalysisTime: number = 0;
    private pendingAnalysis: NodeJS.Timeout | undefined;
    private isAnalyzing: boolean = false;

    constructor(
        private analyzer: CodeAnalyzer,
        private insightGenerator: InsightGenerator,
        private diagnosticsProvider: DiagnosticsProvider,
        private treeProvider: InsightsTreeProvider
    ) {}

    start(): void {
        if (this.watcher) {
            return; // Already running
        }

        const configManager = getConfigurationManager();
        if (!configManager.analyzeOnSave) {
            return;
        }

        // Watch for file saves
        vscode.workspace.onDidSaveTextDocument(document => {
            this.onFileSaved(document);
        });

        console.log('Shadow Watch file watcher started');
    }

    stop(): void {
        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = undefined;
        }

        if (this.pendingAnalysis) {
            clearTimeout(this.pendingAnalysis);
            this.pendingAnalysis = undefined;
        }

        console.log('Shadow Watch file watcher stopped');
    }

    private onFileSaved(document: vscode.TextDocument): void {
        // Check if this is a code file we care about
        if (!this.isCodeFile(document.uri.fsPath)) {
            return;
        }

        const configManager = getConfigurationManager();
        const interval = configManager.analyzeInterval;

        const now = Date.now();
        if (now - this.lastAnalysisTime < interval) {
            // Too soon, schedule for later
            this.scheduleAnalysis();
            return;
        }

        this.triggerAnalysis(document.uri.fsPath);
    }

    private scheduleAnalysis(): void {
        if (this.pendingAnalysis) {
            return; // Already scheduled
        }

        const configManager = getConfigurationManager();
        const interval = configManager.analyzeInterval;

        this.pendingAnalysis = setTimeout(() => {
            this.pendingAnalysis = undefined;
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                this.triggerAnalysis(editor.document.uri.fsPath);
            }
        }, interval);
    }

    private async triggerAnalysis(filePath: string): Promise<void> {
        if (this.isAnalyzing) {
            return;
        }

        this.isAnalyzing = true;
        this.lastAnalysisTime = Date.now();

        try {
            // Analyze the specific file
            const analysis = await this.analyzer.analyzeFile(filePath);
            const insights = this.insightGenerator.generateInsightsForFile(analysis, filePath);

            // Update diagnostics for this file
            const uri = vscode.Uri.file(filePath);
            this.diagnosticsProvider.updateDiagnosticsForFile(uri, insights);

        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            this.isAnalyzing = false;
        }
    }

    private isCodeFile(filePath: string): boolean {
        const codeExtensions = ['.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rs', '.cpp', '.c', '.h', '.hpp', '.rb', '.php'];
        const ext = path.extname(filePath);
        return codeExtensions.includes(ext);
    }
}

