/**
 * Command Registry
 * Handles registration of all VS Code commands
 * Extracted from extension.ts to separate command registration logic
 */
import * as vscode from 'vscode';
import * as llmIntegration from '../../llmIntegration';
import { CodeAnalyzer } from '../../analyzer';
import { InsightGenerator } from '../../insightGenerator';
import { LLMFormatter } from '../../llmFormatter';
import { InsightsTreeProvider } from '../../insightsTreeView';
import { DiagnosticsProvider } from '../../diagnosticsProvider';
import { AnalysisCache } from '../../cache';
import { AnalysisViewerProvider, AnalysisItem } from '../../analysisViewer';
import { ProductNavItem } from '../../productNavigator';
import { getConfigurationManager } from '../../config/configurationManager';
import { ExtensionComponents } from './extensionBootstrapper';

export interface CommandHandlers {
    clearAllData: () => Promise<void>;
    showSettings: () => Promise<void>;
}

export class CommandRegistry {
    /**
     * Register all commands with VS Code
     */
    static register(
        context: vscode.ExtensionContext,
        components: ExtensionComponents,
        handlers: CommandHandlers
    ): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // Core commands
        disposables.push(
            vscode.commands.registerCommand('shadowWatch.runStreamlinedAnalysis', async () => {
                await llmIntegration.runStreamlinedAnalysis();
            }),
            vscode.commands.registerCommand('shadowWatch.runStreamlinedAnalysisWithTests', async () => {
                await llmIntegration.runStreamlinedAnalysisWithTests();
            }),
            vscode.commands.registerCommand('shadowWatch.openSettings', handlers.showSettings),
            vscode.commands.registerCommand('shadowWatch.clearAllData', handlers.clearAllData),
            vscode.commands.registerCommand('shadowWatch.refreshInsights', async () => {
                // Refresh just reloads the tree view
                components.insightsViewer.refresh();
            }),
            vscode.commands.registerCommand('shadowWatch.openReport', async (filePath: string) => {
                try {
                    const uri = vscode.Uri.file(filePath);
                    const document = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to open report: ${error instanceof Error ? error.message : String(error)}`);
                }
            }),
            vscode.commands.registerCommand('shadowWatch.openShadowIgnore', async () => {
                const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!workspaceRoot) {
                    vscode.window.showErrorMessage('No workspace folder open');
                    return;
                }
                const path = require('path');
                const fs = require('fs');
                const ignorePath = path.join(workspaceRoot, '.shadowignore');
                
                // Create default file if it doesn't exist
                if (!fs.existsSync(ignorePath)) {
                    const defaultContent = `# Shadow Watch Ignore File\n# Add patterns for folders/files to exclude from analysis\n# One pattern per line, supports glob patterns\n\n# Common excludes (uncomment as needed):\n# node_modules\n# dist\n# build\n# coverage\n# __pycache__\n# .git\n# *.test.ts\n# *.spec.js\n`;
                    fs.writeFileSync(ignorePath, defaultContent);
                }
                
                const uri = vscode.Uri.file(ignorePath);
                const document = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
            })
        );

        // Add tree views and status bar to subscriptions
        disposables.push(
            components.statusBarItem,
            components.treeView,
            components.reportsViewerView
        );

        return disposables;
    }
}

