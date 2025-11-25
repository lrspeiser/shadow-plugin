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
    analyzeWorkspace: () => Promise<void>;
    analyzeCurrentFile: () => Promise<void>;
    copyAllInsights: () => Promise<void>;
    copyFileInsights: () => Promise<void>;
    copyInsight: (item: any) => Promise<void>;
    clearCache: () => Promise<void>;
    clearAllData: () => Promise<void>;
    showSettings: () => Promise<void>;
    openLatestReport: () => Promise<void>;
    openLatestUnitTestReport: () => Promise<void>;
    switchProvider: () => Promise<void>;
    copyMenuStructure: () => Promise<void>;
    showProviderStatus: () => Promise<void>;
    navigateToProductItem: (item: ProductNavItem) => Promise<void>;
    navigateToAnalysisItem: (item: AnalysisItem) => Promise<void>;
    copyInsightItem: (item: any) => Promise<void>;
    showProductItemDetails: (item: ProductNavItem) => Promise<void>;
    showInsightItemDetails: (item: any) => Promise<void>;
    showUnitTestItemDetails: (item: any) => Promise<void>;
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

        // Analysis commands
        disposables.push(
            vscode.commands.registerCommand('shadowWatch.analyze', handlers.analyzeWorkspace),
            vscode.commands.registerCommand('shadowWatch.analyzeFile', handlers.analyzeCurrentFile),
            vscode.commands.registerCommand('shadowWatch.refreshInsights', handlers.analyzeWorkspace)
        );

        // Copy commands
        disposables.push(
            vscode.commands.registerCommand('shadowWatch.copyInsights', handlers.copyAllInsights),
            vscode.commands.registerCommand('shadowWatch.copyFileInsights', handlers.copyFileInsights),
            vscode.commands.registerCommand('shadowWatch.copyInsight', handlers.copyInsight),
            vscode.commands.registerCommand('shadowWatch.copyInsightItem', handlers.copyInsightItem),
            vscode.commands.registerCommand('shadowWatch.copyLLMInsight', async (type: string, content: string) => {
                await llmIntegration.copyLLMInsight(type, content);
            })
        );

        // Cache and data management
        disposables.push(
            vscode.commands.registerCommand('shadowWatch.clearCache', handlers.clearCache),
            vscode.commands.registerCommand('shadowWatch.clearAllData', handlers.clearAllData)
        );

        // Settings and configuration
        disposables.push(
            vscode.commands.registerCommand('shadowWatch.openSettings', handlers.showSettings),
            vscode.commands.registerCommand('shadowWatch.openSettingsWebview', handlers.showSettings),
            vscode.commands.registerCommand('shadowWatch.switchProvider', handlers.switchProvider),
            vscode.commands.registerCommand('shadowWatch.showProviderStatus', handlers.showProviderStatus),
            vscode.commands.registerCommand('shadowWatch.setApiKey', async () => {
                await llmIntegration.setApiKey();
            }),
            vscode.commands.registerCommand('shadowWatch.setClaudeApiKey', async () => {
                await llmIntegration.setClaudeApiKey();
            })
        );

        // Enable/disable
        disposables.push(
            vscode.commands.registerCommand('shadowWatch.enable', async () => {
                const configManager = getConfigurationManager();
                await configManager.update('enabled', true, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('Shadow Watch enabled');
            }),
            vscode.commands.registerCommand('shadowWatch.disable', async () => {
                const configManager = getConfigurationManager();
                await configManager.update('enabled', false, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('Shadow Watch disabled');
            })
        );

        // View commands
        disposables.push(
            vscode.commands.registerCommand('shadowWatch.showInsights', () => {
                vscode.commands.executeCommand('shadowWatch.insights.focus');
            }),
            vscode.commands.registerCommand('shadowWatch.openLatestReport', handlers.openLatestReport),
            vscode.commands.registerCommand('shadowWatch.openLatestUnitTestReport', handlers.openLatestUnitTestReport),
            vscode.commands.registerCommand('shadowWatch.openDocsFolder', async () => {
                if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
                    vscode.window.showErrorMessage('No workspace folder open');
                    return;
                }
                const docsPath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, '.shadow', 'docs');
                try {
                    await vscode.commands.executeCommand('revealFileInOS', docsPath);
                } catch (error) {
                    await vscode.commands.executeCommand('revealInExplorer', docsPath);
                }
            })
        );

        // LLM generation commands
        disposables.push(
            vscode.commands.registerCommand('shadowWatch.generateProductDocs', async () => {
                await llmIntegration.generateProductDocs();
            }),
            vscode.commands.registerCommand('shadowWatch.generateLLMInsights', async () => {
                await llmIntegration.generateLLMInsights();
            }),
            vscode.commands.registerCommand('shadowWatch.generateUnitTests', async () => {
                await llmIntegration.generateUnitTests();
            }),
            vscode.commands.registerCommand('shadowWatch.runUnitTests', async () => {
                await llmIntegration.runUnitTests();
            }),
            vscode.commands.registerCommand('shadowWatch.showProductDocs', async () => {
                await llmIntegration.showProductDocs();
            }),
            vscode.commands.registerCommand('shadowWatch.generateWorkspaceReport', async () => {
                await llmIntegration.generateWorkspaceReport();
            }),
            vscode.commands.registerCommand('shadowWatch.generateProductReport', async () => {
                await llmIntegration.generateProductReport();
            }),
            vscode.commands.registerCommand('shadowWatch.generateArchitectureReport', async () => {
                await llmIntegration.generateArchitectureReport();
            }),
            vscode.commands.registerCommand('shadowWatch.runComprehensiveAnalysis', async () => {
                await llmIntegration.runComprehensiveAnalysis();
            }),
            vscode.commands.registerCommand('shadowWatch.runStreamlinedAnalysis', async () => {
                await llmIntegration.runStreamlinedAnalysis();
            }),
            vscode.commands.registerCommand('shadowWatch.runStreamlinedAnalysisWithTests', async () => {
                await llmIntegration.runStreamlinedAnalysisWithTests();
            }),
            vscode.commands.registerCommand('shadowWatch.showReports', async () => {
                await llmIntegration.showReports();
            }),
            vscode.commands.registerCommand('shadowWatch.openReport', async (filePath: string) => {
                try {
                    const uri = vscode.Uri.file(filePath);
                    const document = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to open report: ${error instanceof Error ? error.message : String(error)}`);
                }
            })
        );

        // Navigation commands
        disposables.push(
            vscode.commands.registerCommand('shadowWatch.navigateToProductItem', handlers.navigateToProductItem),
            vscode.commands.registerCommand('shadowWatch.navigateToAnalysisItem', handlers.navigateToAnalysisItem)
        );

        // Detail view commands
        disposables.push(
            vscode.commands.registerCommand('shadowWatch.showProductItemDetails', handlers.showProductItemDetails),
            vscode.commands.registerCommand('shadowWatch.showInsightItemDetails', handlers.showInsightItemDetails),
            vscode.commands.registerCommand('shadowWatch.showUnitTestItemDetails', handlers.showUnitTestItemDetails)
        );

        // Menu structure
        disposables.push(
            vscode.commands.registerCommand('shadowWatch.copyMenuStructure', handlers.copyMenuStructure)
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

