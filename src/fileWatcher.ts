import * as vscode from 'vscode';
import * as path from 'path';
import { CodeAnalyzer } from './analyzer';
import { InsightGenerator } from './insightGenerator';
import { DiagnosticsProvider } from './diagnosticsProvider';
import { InsightsTreeProvider } from './insightsTreeView';
import { getConfigurationManager } from './config/configurationManager';
import { ErrorHandler } from './utils/errorHandler';
import { FileWatcherService } from './domain/services/fileWatcherService';

export class FileWatcher {
    private fileWatcherService: FileWatcherService;
    private lastAnalysisTime: number = 0;
    private pendingAnalysis: NodeJS.Timeout | undefined;
    private isAnalyzing: boolean = false;
    private documentSaveDisposable: vscode.Disposable | undefined;
    private isStarted: boolean = false;

    constructor(
        private analyzer: CodeAnalyzer,
        private insightGenerator: InsightGenerator,
        private diagnosticsProvider: DiagnosticsProvider,
        private treeProvider: InsightsTreeProvider,
        fileWatcherService?: FileWatcherService
    ) {
        // Use provided service or create new one
        this.fileWatcherService = fileWatcherService || new FileWatcherService();
    }

    start(): void {
        if (this.isStarted) {
            return; // Already started
        }

        const configManager = getConfigurationManager();
        if (!configManager.analyzeOnSave) {
            return;
        }

        // Watch for file saves using unified service
        this.documentSaveDisposable = this.fileWatcherService.watchDocumentSaves((document) => {
            this.onFileSaved(document);
        });

        this.isStarted = true;
        console.log('Shadow Watch file watcher started');
    }

    stop(): void {
        if (!this.isStarted) {
            return;
        }

        if (this.documentSaveDisposable) {
            this.documentSaveDisposable.dispose();
            this.documentSaveDisposable = undefined;
        }

        if (this.pendingAnalysis) {
            clearTimeout(this.pendingAnalysis);
            this.pendingAnalysis = undefined;
        }

        this.isStarted = false;
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

    /**
     * Get the file watcher service (for sharing with other components)
     */
    getFileWatcherService(): FileWatcherService {
        return this.fileWatcherService;
    }

    /**
     * Dispose the file watcher
     */
    dispose(): void {
        this.stop();
        // Note: Don't dispose the shared service here as it may be used by others
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

        await ErrorHandler.handle(
            async () => {
                // Analyze the specific file
                const analysis = await this.analyzer.analyzeFile(filePath);
                const insights = this.insightGenerator.generateInsightsForFile(analysis, filePath);

                // Update diagnostics for this file
                const uri = vscode.Uri.file(filePath);
                this.diagnosticsProvider.updateDiagnosticsForFile(uri, insights);
            },
            {
                component: 'FileWatcher',
                operation: 'triggerAnalysis',
                severity: 'warning',
                showUserMessage: false, // File watcher errors should be silent
                logToFile: true
            }
        );

        this.isAnalyzing = false;
    }

    private isCodeFile(filePath: string): boolean {
        const codeExtensions = ['.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rs', '.cpp', '.c', '.h', '.hpp', '.rb', '.php'];
        const ext = path.extname(filePath);
        return codeExtensions.includes(ext);
    }
}

