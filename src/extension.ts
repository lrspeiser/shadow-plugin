import * as vscode from 'vscode';
import * as path from 'path';
import { CodeAnalyzer, EntryPoint } from './analyzer';
import { InsightGenerator } from './insightGenerator';
import { LLMFormatter } from './llmFormatter';
import { FileWatcher } from './fileWatcher';
import { InsightsTreeProvider, TreeItem } from './insightsTreeView';
import { DiagnosticsProvider } from './diagnosticsProvider';
import { AnalysisCache } from './cache';
import * as llmIntegration from './llmIntegration';
import { ProductNavigatorProvider, ProductNavItem } from './productNavigator';
import { AnalysisViewerProvider, AnalysisItem } from './analysisViewer';
import { InsightsViewerProvider, InsightItem } from './insightsViewer';
import { StaticAnalysisViewerProvider, StaticAnalysisItem } from './staticAnalysisViewer';
import { UnitTestsNavigatorProvider, UnitTestItem } from './unitTestsNavigator';
import { getConfigurationManager } from './config/configurationManager';
import { ErrorHandler } from './utils/errorHandler';
import { WebviewTemplateEngine } from './ui/webview/webviewTemplateEngine';
import { ExtensionBootstrapper, ExtensionComponents } from './domain/bootstrap/extensionBootstrapper';
import { CommandRegistry, CommandHandlers } from './domain/bootstrap/commandRegistry';
import { NavigationHandler } from './domain/handlers/navigationHandler';

// Component references (kept for backward compatibility with existing command handlers)
let components: ExtensionComponents;
let analyzer: CodeAnalyzer;
let insightGenerator: InsightGenerator;
let llmFormatter: LLMFormatter;
let fileWatcher: FileWatcher;
let treeProvider: InsightsTreeProvider;
let diagnosticsProvider: DiagnosticsProvider;
let cache: AnalysisCache;
let statusBarItem: vscode.StatusBarItem;
let analysisViewer: AnalysisViewerProvider;
let insightsViewer: InsightsViewerProvider;
let staticAnalysisViewer: StaticAnalysisViewerProvider;
let navigationHandler: NavigationHandler;

export function activate(context: vscode.ExtensionContext) {
    try {
        // Initialize all components using bootstrapper
        components = ExtensionBootstrapper.initialize(context);
        
        // Set global references for backward compatibility with existing command handlers
        analyzer = components.analyzer;
        insightGenerator = components.insightGenerator;
        llmFormatter = components.llmFormatter;
        fileWatcher = components.fileWatcher;
        treeProvider = components.treeProvider;
        diagnosticsProvider = components.diagnosticsProvider;
        cache = components.cache;
        statusBarItem = components.statusBarItem;
        analysisViewer = components.analysisViewer;
        insightsViewer = components.insightsViewer;
        staticAnalysisViewer = components.staticAnalysisViewer;
        
        // Initialize navigation handler
        navigationHandler = new NavigationHandler();
        
        // Create command handlers that have access to components
        const handlers = createCommandHandlers(components);
        
        // Register all commands
        const commandDisposables = CommandRegistry.register(context, components, handlers);
        context.subscriptions.push(...commandDisposables);
        
        // Setup file watcher and configuration handlers
        ExtensionBootstrapper.setupFileWatcher(components.fileWatcher, context);
        
        // Handle clearAllData setting
        const configManager = getConfigurationManager();
        configManager.onConfigurationChange(() => {
            if (configManager.clearAllData) {
                configManager.update('clearAllData', false, vscode.ConfigurationTarget.Global);
                handlers.clearAllData();
            }
        });
    } catch (error) {
        ErrorHandler.handleSync(
            () => { throw error; },
            {
                component: 'Extension',
                operation: 'activate',
                severity: 'error',
                showUserMessage: true,
                userMessage: 'Shadow Watch initialization failed',
                logToFile: true,
                rethrow: true
            }
        );
        return;
    }
}

/**
 * Create command handlers with access to components
 */
function createCommandHandlers(components: ExtensionComponents): CommandHandlers {
    return {
        analyzeWorkspace: () => analyzeWorkspace(),
        analyzeCurrentFile: () => analyzeCurrentFile(),
        copyAllInsights: () => copyAllInsights(),
        copyFileInsights: () => copyFileInsights(),
        copyInsight: (item: any) => copyInsight(item),
        clearCache: () => clearCache(),
        clearAllData: () => clearAllData(),
        showSettings: () => showSettings(),
        openLatestReport: () => openLatestReport(),
        switchProvider: () => switchProvider(),
        copyMenuStructure: () => copyMenuStructure(),
        showProviderStatus: () => showProviderStatus(),
        navigateToProductItem: (item: ProductNavItem) => navigationHandler.navigateToProductItem(item),
        navigateToAnalysisItem: (item: AnalysisItem) => navigationHandler.navigateToAnalysisItem(item),
        copyInsightItem: (item: any) => navigationHandler.copyInsightItem(item),
        showProductItemDetails: (item: ProductNavItem) => navigationHandler.showProductItemDetails(item),
        showInsightItemDetails: (item: any) => navigationHandler.showInsightItemDetails(item),
        showUnitTestItemDetails: (item: any) => navigationHandler.showUnitTestItemDetails(item)
    };
}

// Legacy command registration removed - now using CommandRegistry
// All commands are registered via CommandRegistry.register()

async function analyzeWorkspace() {
    const configManager = getConfigurationManager();
    if (!configManager.enabled) {
        vscode.window.showWarningMessage('Shadow Watch is disabled');
        return;
    }

    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    // Clear product navigator state to prevent showing stale data
    const { getStateManager } = await import('./state/llmStateManager');
    const stateManager = getStateManager();
    const productNavigator = stateManager.getProductNavigator();
    if (productNavigator) {
        productNavigator.clearState();
    }

    statusBarItem.text = '$(sync~spin) Analyzing...';
    
    const { progressService } = await import('./infrastructure/progressService');
    
    await progressService.withProgressNonCancellable('Shadow Watch', async (reporter) => {
        reporter.report('Analyzing workspace...');

        try {
            const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
            const analysis = await analyzer.analyzeWorkspace(workspaceRoot);
            const insights = insightGenerator.generateInsights(analysis);
            
            // Set analysis context for LLM features (setCodeAnalysis will also set the context)
            llmIntegration.setCodeAnalysis(analysis);
            
            // Update analysis viewer
            if (analysisViewer) {
                analysisViewer.setAnalysis(analysis);
            }
            
            // Update diagnostics
            diagnosticsProvider.updateDiagnostics(insights);
            
            // Update tree view
            treeProvider.updateInsights(insights);
            
            // Mark analysis as complete
            treeProvider.setAnalysisComplete();
            
            statusBarItem.text = `$(eye) ${insights.length} issues`;
            statusBarItem.tooltip = `Shadow Watch: ${insights.length} architecture issues found`;
            
            reporter.report('Step 1 complete. Starting comprehensive analysis...');
            
            // Now run the comprehensive analysis workflow (Product Docs → Architecture Insights → Report)
            await llmIntegration.runComprehensiveAnalysis();
            
        } catch (error) {
            statusBarItem.text = '$(eye) Error';
            vscode.window.showErrorMessage(`Analysis failed: ${error}`);
            console.error('Analysis error:', error);
        }
    });
}

async function analyzeCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const configManager = getConfigurationManager();
    if (!configManager.enabled) {
        vscode.window.showWarningMessage('Shadow Watch is disabled');
        return;
    }

    statusBarItem.text = '$(sync~spin) Analyzing file...';

    try {
        const filePath = editor.document.uri.fsPath;
        const analysis = await analyzer.analyzeFile(filePath);
        const insights = insightGenerator.generateInsightsForFile(analysis, filePath);
        
        // Update diagnostics for this file only
        diagnosticsProvider.updateDiagnosticsForFile(editor.document.uri, insights);
        
        statusBarItem.text = `$(eye) ${insights.length} issues`;
        
        vscode.window.showInformationMessage(`File analysis: ${insights.length} insights`);
    } catch (error) {
        statusBarItem.text = '$(eye) Error';
        vscode.window.showErrorMessage(`File analysis failed: ${error}`);
        console.error('File analysis error:', error);
    }
}

async function copyAllInsights() {
    const insights = treeProvider.getAllInsights();
    if (insights.length === 0) {
        vscode.window.showInformationMessage('No insights to copy. Run analysis first.');
        return;
    }

    const configManager = getConfigurationManager();
    const format = configManager.llmFormat;
    
    const formatted = llmFormatter.formatInsights(insights, format);
    await vscode.env.clipboard.writeText(formatted);
    
    vscode.window.showInformationMessage(`Copied ${insights.length} insights to clipboard (${format} format)`);
}

async function copyFileInsights() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const filePath = editor.document.uri.fsPath;
    const insights = treeProvider.getInsightsForFile(filePath);
    
    if (insights.length === 0) {
        vscode.window.showInformationMessage('No insights for current file');
        return;
    }

    const configManager = getConfigurationManager();
    const format = configManager.llmFormat;
    
    const formatted = llmFormatter.formatInsights(insights, format);
    await vscode.env.clipboard.writeText(formatted);
    
    vscode.window.showInformationMessage(`Copied ${insights.length} file insights to clipboard`);
}

async function copyInsight(item: any) {
    if (!item || !item.insight) {
        return;
    }

    const configManager = getConfigurationManager();
    const format = configManager.llmFormat;
    
    const formatted = llmFormatter.formatInsights([item.insight], format);
    await vscode.env.clipboard.writeText(formatted);
    
    vscode.window.showInformationMessage('Insight copied to clipboard');
}

async function clearCache() {
    await cache.clear();
    diagnosticsProvider.clear();
    treeProvider.clear();
    statusBarItem.text = '$(eye) Shadow Watch';
    vscode.window.showInformationMessage('Cache cleared');
}

async function copyMenuStructure() {
    if (!treeProvider) {
        vscode.window.showErrorMessage('Tree provider not initialized');
        return;
    }
    
    const { progressService } = await import('./infrastructure/progressService');
    
    await progressService.withProgressNonCancellable('Copying menu structure...', async (reporter) => {
        reporter.report('Collecting menu items...');
        
        const menuItems = await treeProvider.getAllMenuItems();
        const menuText = 'Shadow Watch - Architecture Insights Panel\n' +
                        '==========================================\n\n' +
                        menuItems.join('\n') +
                        '\n\n---\n\n' +
                        'Note: This shows the "Architecture Insights" panel structure.\n' +
                        'Other panels: "Analyze Workspace", "Product Navigator", "AI Architecture Insights"';
        
        await vscode.env.clipboard.writeText(menuText);
        vscode.window.showInformationMessage(`✅ Menu structure copied to clipboard! (${menuItems.length} items)`);
    });
}

async function showProviderStatus() {
    const configManager = getConfigurationManager();
    const currentProvider = configManager.llmProvider;
    const providerName = currentProvider === 'openai' ? 'OpenAI' : 'Claude';
    
    const openaiKey = configManager.openaiApiKey;
    const claudeKey = configManager.claudeApiKey;
    
    const hasOpenAIKey = openaiKey && openaiKey.trim() !== '';
    const hasClaudeKey = claudeKey && claudeKey.trim() !== '';
    
    const status = `🤖 Shadow Watch LLM Provider Status

Current Provider: ${providerName} (${currentProvider})

API Keys Configured:
${hasOpenAIKey ? '✅' : '❌'} OpenAI API Key: ${hasOpenAIKey ? 'Set' : 'Not set'}
${hasClaudeKey ? '✅' : '❌'} Claude API Key: ${hasClaudeKey ? 'Set' : 'Not set'}

${currentProvider === 'claude' && !hasClaudeKey 
    ? '⚠️ WARNING: Claude is selected but Claude API key is not set!'
    : currentProvider === 'openai' && !hasOpenAIKey
    ? '⚠️ WARNING: OpenAI is selected but OpenAI API key is not set!'
    : '✅ Current provider has API key configured.'}

To verify which provider is actually being used:
1. Generate AI Architecture Insights
2. Check the "Shadow Watch Documentation" output channel
3. Look for the "🤖 LLM Provider:" line at the top

You can switch providers using the "🤖 Using: [Provider]" button in the sidebar.`;

    const choice = await vscode.window.showInformationMessage(
        status,
        'Open Settings',
        'Switch Provider',
        'View Output Channel'
    );
    
    if (choice === 'Open Settings') {
        vscode.commands.executeCommand('shadowWatch.openSettings');
    } else if (choice === 'Switch Provider') {
        await switchProvider();
    } else if (choice === 'View Output Channel') {
        vscode.commands.executeCommand('workbench.action.output.toggleOutput');
    }
}

async function switchProvider() {
    const configManager = getConfigurationManager();
    const currentProvider = configManager.llmProvider;
    const newProvider = currentProvider === 'openai' ? 'claude' : 'openai';
    
    const providerName = newProvider === 'openai' ? 'OpenAI' : 'Claude';
    const result = await vscode.window.showInformationMessage(
        `Switch LLM provider to ${providerName}?`,
        'Switch',
        'Cancel'
    );
    
    if (result === 'Switch') {
        await configManager.update('llmProvider', newProvider, vscode.ConfigurationTarget.Global);
        
        // Show confirmation with provider details
        const message = `✅ Switched to ${providerName}.\n\n` +
                       `Current Provider: ${providerName} (${newProvider})\n` +
                       `Make sure you have the ${providerName} API key set in settings.\n\n` +
                       `You can verify which provider is being used by checking the "Shadow Watch Documentation" output channel when generating insights.`;
        
        vscode.window.showInformationMessage(message, 'Open Settings', 'View Output').then(choice => {
            if (choice === 'Open Settings') {
                vscode.commands.executeCommand('shadowWatch.openSettings');
            } else if (choice === 'View Output') {
                vscode.commands.executeCommand('workbench.action.output.toggleOutput');
            }
        });
        
        // Refresh tree view to update provider display
        if (treeProvider) {
            treeProvider.refresh();
        }
    }
}

async function clearAllData() {
    const result = await vscode.window.showWarningMessage(
        'This will clear ALL Shadow Watch data including analysis cache, saved documentation, insights, analysis results, and unit test data. This cannot be undone. Continue?',
        { modal: true },
        'Clear All Data',
        'Cancel'
    );

    if (result === 'Clear All Data') {
        // Clear cache and diagnostics
        await cache.clear();
        diagnosticsProvider.clear();
        treeProvider.clear();
        
        // Clear static analysis viewer
        if (staticAnalysisViewer) {
            staticAnalysisViewer.setInsights([]);
        }
        
        // Clear all LLM-related data (saved files, in-memory state, etc.)
        await llmIntegration.clearAllData();
        
        // Reset status bar
        statusBarItem.text = '$(eye) Shadow Watch';
        statusBarItem.tooltip = 'Shadow Watch: Ready';
        
        vscode.window.showInformationMessage('✅ All Shadow Watch data cleared. You can start fresh now!');
    }
}

// Navigation functions moved to NavigationHandler
// All navigation logic is now in src/domain/handlers/navigationHandler.ts

async function showSettings(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
        'shadowWatchSettings',
        '⚙️ Shadow Watch Settings',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    const configManager = getConfigurationManager();
    const currentProvider = configManager.llmProvider;
    const providerName = currentProvider === 'openai' ? 'OpenAI' : 'Claude';
    const otherProvider = currentProvider === 'openai' ? 'Claude' : 'OpenAI';

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'switchProvider':
                await switchProvider();
                // Refresh the webview with updated config
                const updatedConfigManager = getConfigurationManager();
                const updatedProvider = updatedConfigManager.llmProvider;
                panel.webview.html = getSettingsHtml(updatedProvider);
                // Refresh tree view to update provider display
                if (treeProvider) {
                    treeProvider.refresh();
                }
                break;
            case 'copyMenuStructure':
                await copyMenuStructure();
                break;
            case 'openVSCodeSettings':
                vscode.commands.executeCommand('workbench.action.openSettings', '@ext:shadow-watch.shadow-watch');
                break;
        }
    });

    panel.webview.html = getSettingsHtml(currentProvider);
}

function getSettingsHtml(currentProvider: string): string {
    const configManager = getConfigurationManager();
    const providerName = currentProvider === 'openai' ? 'OpenAI' : 'Claude';
    const otherProvider = currentProvider === 'openai' ? 'Claude' : 'OpenAI';
    const openaiKey = configManager.openaiApiKey;
    const claudeKey = configManager.claudeApiKey;
    const hasOpenAIKey = openaiKey && openaiKey.trim() !== '';
    const hasClaudeKey = claudeKey && claudeKey.trim() !== '';

    const engine = new WebviewTemplateEngine();
    const escape = WebviewTemplateEngine.escapeHtml;

    const customStyles = `
        body {
            max-width: 800px;
            padding: 40px;
            background: #fafafa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
        }
        h2 {
            color: #34495e;
            font-size: 1.3em;
        }
        .section {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        .setting-item {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        .setting-label {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        .setting-description {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 12px;
        }
        button {
            background: #3498db;
        }
        button:hover {
            background: #2980b9;
        }
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 0.85em;
            margin-left: 10px;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
        }
        .status.warning {
            background: #fff3cd;
            color: #856404;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
        }
    `;

    const content = `
        <div class="container">
            <h1>⚙️ Shadow Watch Settings</h1>
            
            <div class="section">
                <h2>🤖 LLM Provider</h2>
                <div class="setting-item">
                    <div class="setting-label">Current Provider: ${escape(providerName)}</div>
                    <div class="setting-description">
                        ${currentProvider === 'claude' && !hasClaudeKey 
                            ? '⚠️ WARNING: Claude is selected but Claude API key is not set!'
                            : currentProvider === 'openai' && !hasOpenAIKey
                            ? '⚠️ WARNING: OpenAI is selected but OpenAI API key is not set!'
                            : '✅ Current provider has API key configured.'}
                    </div>
                    <button onclick="switchProvider()">Switch to ${escape(otherProvider)}</button>
                </div>
                <div class="setting-item">
                    <div class="setting-label">API Key Status</div>
                    <div class="setting-description">
                        <span class="status ${hasOpenAIKey ? 'success' : 'error'}">OpenAI: ${hasOpenAIKey ? 'Set' : 'Not set'}</span>
                        <span class="status ${hasClaudeKey ? 'success' : 'error'}">Claude: ${hasClaudeKey ? 'Set' : 'Not set'}</span>
                    </div>
                    <button class="secondary" onclick="openVSCodeSettings()">Open VSCode Settings</button>
                </div>
            </div>

            <div class="section">
                <h2>📋 Menu Structure</h2>
                <div class="setting-item">
                    <div class="setting-label">Copy Menu Structure</div>
                    <div class="setting-description">Copy the current menu structure to clipboard for sharing or documentation.</div>
                    <button onclick="copyMenuStructure()">📋 Copy Menu Structure</button>
                </div>
            </div>

            <div class="section">
                <h2>⚙️ All Settings</h2>
                <div class="setting-item">
                    <div class="setting-label">VSCode Settings</div>
                    <div class="setting-description">Open the full VSCode settings page for Shadow Watch to configure all options.</div>
                    <button class="secondary" onclick="openVSCodeSettings()">Open VSCode Settings</button>
                </div>
            </div>
        </div>
    `;

    const customScript = `
        function switchProvider() {
            vscode.postMessage({ command: 'switchProvider' });
        }
        
        function copyMenuStructure() {
            vscode.postMessage({ command: 'copyMenuStructure' });
        }
        
        function openVSCodeSettings() {
            vscode.postMessage({ command: 'openVSCodeSettings' });
        }
    `;

    return engine.render({
        title: 'Shadow Watch Settings',
        content,
        customStyles,
        customScript
    });
}

async function openLatestReport(): Promise<void> {
    if (!treeProvider) {
        vscode.window.showErrorMessage('Tree provider not initialized');
        return;
    }

    const reportPath = treeProvider.getReportPath();
    if (!reportPath) {
        vscode.window.showWarningMessage('No report found. Run "Analyze Workspace" first to generate a report.');
        return;
    }

    const fs = require('fs');
    if (!fs.existsSync(reportPath)) {
        vscode.window.showWarningMessage('Report file not found. It may have been deleted.');
        return;
    }

    try {
        const reportUri = vscode.Uri.file(reportPath);
        const document = await vscode.workspace.openTextDocument(reportUri);
        await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open report: ${error}`);
    }
}

export function deactivate() {
    if (fileWatcher) {
        fileWatcher.stop();
    }
    if (diagnosticsProvider) {
        diagnosticsProvider.dispose();
    }
}

