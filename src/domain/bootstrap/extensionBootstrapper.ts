/**
 * Extension Bootstrapper
 * Handles initialization of all extension components
 * Extracted from extension.ts to separate activation logic
 */
import * as vscode from 'vscode';
import { CodeAnalyzer } from '../../analyzer';
import { InsightGenerator } from '../../insightGenerator';
import { LLMFormatter } from '../../llmFormatter';
import { FileWatcher } from '../../fileWatcher';
import { InsightsTreeProvider } from '../../insightsTreeView';
import { DiagnosticsProvider } from '../../diagnosticsProvider';
import { AnalysisCache } from '../../cache';
import * as llmIntegration from '../../llmIntegration';
import { ProductNavigatorProvider } from '../../productNavigator';
import { AnalysisViewerProvider, AnalysisItem } from '../../analysisViewer';
import { InsightsViewerProvider, InsightItem } from '../../insightsViewer';
import { StaticAnalysisViewerProvider, StaticAnalysisItem } from '../../staticAnalysisViewer';
import { UnitTestsNavigatorProvider, UnitTestItem } from '../../unitTestsNavigator';
import { ProductNavItem } from '../../productNavigator';
import { getConfigurationManager } from '../../config/configurationManager';
import { ErrorHandler } from '../../utils/errorHandler';

export interface ExtensionComponents {
    analyzer: CodeAnalyzer;
    insightGenerator: InsightGenerator;
    llmFormatter: LLMFormatter;
    fileWatcher: FileWatcher;
    treeProvider: InsightsTreeProvider;
    diagnosticsProvider: DiagnosticsProvider;
    cache: AnalysisCache;
    statusBarItem: vscode.StatusBarItem;
    productNavigatorView: vscode.TreeView<ProductNavItem>;
    analysisViewerView: vscode.TreeView<AnalysisItem>;
    insightsViewerView: vscode.TreeView<InsightItem>;
    staticAnalysisViewerView: vscode.TreeView<StaticAnalysisItem>;
    unitTestsNavigatorView: vscode.TreeView<UnitTestItem>;
    analysisViewer: AnalysisViewerProvider;
    insightsViewer: InsightsViewerProvider;
    staticAnalysisViewer: StaticAnalysisViewerProvider;
    treeView: vscode.TreeView<any>;
}

export class ExtensionBootstrapper {
    /**
     * Initialize all extension components
     */
    static initialize(context: vscode.ExtensionContext): ExtensionComponents {
        console.log('Shadow Watch extension is now active');

        let treeView: vscode.TreeView<any>;
        
        try {
            // Initialize components
            const cache = new AnalysisCache(context.globalStorageUri.fsPath);
            const analyzer = new CodeAnalyzer(cache);
            const insightGenerator = new InsightGenerator();
            const llmFormatter = new LLMFormatter();
            llmIntegration.initializeLLMService();
            const diagnosticsProvider = new DiagnosticsProvider();
            const treeProvider = new InsightsTreeProvider(context, llmFormatter);
            llmIntegration.setTreeProvider(treeProvider);
            
            // Load saved code analysis after treeProvider is set up
            // This ensures analysis status is properly restored
            llmIntegration.loadSavedCodeAnalysis();
            
            // Create product navigator
            const productNavigator = new ProductNavigatorProvider(context);
            llmIntegration.setProductNavigator(productNavigator);
            context.subscriptions.push(productNavigator); // Ensure proper disposal
            
            // Create analysis viewer
            const analysisViewer = new AnalysisViewerProvider();
            llmIntegration.setAnalysisViewer(analysisViewer);
            
            // Create insights viewer
            const insightsViewer = new InsightsViewerProvider(context);
            llmIntegration.setInsightsViewer(insightsViewer);
            context.subscriptions.push(insightsViewer); // Ensure proper disposal
            
            // Create unit tests navigator
            const unitTestsNavigator = new UnitTestsNavigatorProvider(context);
            llmIntegration.setUnitTestsNavigator(unitTestsNavigator);
            context.subscriptions.push(unitTestsNavigator); // Ensure proper disposal
            
            // Static analysis is now merged into insights tree view (no separate viewer needed)
            const staticAnalysisViewer = new StaticAnalysisViewerProvider();
            treeProvider.setStaticAnalysisViewer(staticAnalysisViewer);
            
            // Tree provider will automatically check for existing files on construction
            const fileWatcher = new FileWatcher(analyzer, insightGenerator, diagnosticsProvider, treeProvider);

            // Register tree view with error handling
            treeView = vscode.window.createTreeView('shadowWatch.insights', {
                treeDataProvider: treeProvider,
                showCollapseAll: true
            });

            // Register product navigator tree view
            const productNavigatorView = vscode.window.createTreeView('shadowWatch.productNavigator', {
                treeDataProvider: productNavigator,
                showCollapseAll: true
            });

            // Register analysis viewer tree view
            const analysisViewerView = vscode.window.createTreeView('shadowWatch.analysisViewer', {
                treeDataProvider: analysisViewer,
                showCollapseAll: true
            });

            // Register insights viewer tree view
            const insightsViewerView = vscode.window.createTreeView('shadowWatch.insightsViewer', {
                treeDataProvider: insightsViewer,
                showCollapseAll: true
            });

            // Register static analysis viewer tree view
            const staticAnalysisViewerView = vscode.window.createTreeView('shadowWatch.staticAnalysisViewer', {
                treeDataProvider: staticAnalysisViewer,
                showCollapseAll: true
            });

            // Register unit tests navigator tree view
            const unitTestsNavigatorView = vscode.window.createTreeView('shadowWatch.unitTestsNavigator', {
                treeDataProvider: unitTestsNavigator,
                showCollapseAll: true
            });

            // Create status bar item
            const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
            statusBarItem.command = 'shadowWatch.analyze';
            statusBarItem.text = '$(search) Shadow Watch';
            statusBarItem.tooltip = 'Click to analyze workspace';
            statusBarItem.show();

            return {
                analyzer,
                insightGenerator,
                llmFormatter,
                fileWatcher,
                treeProvider,
                diagnosticsProvider,
                cache,
                statusBarItem,
                productNavigatorView,
                analysisViewerView,
                insightsViewerView,
                staticAnalysisViewerView,
                unitTestsNavigatorView,
                analysisViewer,
                insightsViewer,
                staticAnalysisViewer,
                treeView
            };
        } catch (error) {
            ErrorHandler.handleSync(
                () => { throw error; },
                {
                    component: 'ExtensionBootstrapper',
                    operation: 'initialize',
                    severity: 'error',
                    showUserMessage: true,
                    userMessage: 'Shadow Watch initialization failed',
                    logToFile: true,
                    rethrow: true
                }
            );
            throw error;
        }
    }

    /**
     * Setup file watcher and configuration change handlers
     */
    static setupFileWatcher(
        fileWatcher: FileWatcher,
        context: vscode.ExtensionContext
    ): void {
        const configManager = getConfigurationManager();
        
        // Start file watcher if enabled
        if (configManager.enabled) {
            fileWatcher.start();
        }

        // Watch for configuration changes
        configManager.onConfigurationChange(() => {
            if (configManager.enabled) {
                fileWatcher.start();
            } else {
                fileWatcher.stop();
            }
        });
    }
}

