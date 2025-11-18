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
        navigateToProductItem: (item: ProductNavItem) => navigateToProductItem(item),
        navigateToAnalysisItem: (item: AnalysisItem) => navigateToAnalysisItem(item),
        copyInsightItem: (item: any) => copyInsightItem(item),
        showProductItemDetails: (item: ProductNavItem) => showProductItemDetails(item),
        showInsightItemDetails: (item: any) => showInsightItemDetails(item),
        showUnitTestItemDetails: (item: any) => showUnitTestItemDetails(item)
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

    statusBarItem.text = '$(sync~spin) Analyzing...';
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Shadow Watch',
        cancellable: false
    }, async (progress) => {
        progress.report({ message: 'Analyzing workspace...' });

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
            
            progress.report({ message: 'Step 1 complete. Starting comprehensive analysis...' });
            
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
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Copying menu structure...',
        cancellable: false
    }, async (progress) => {
        progress.report({ message: 'Collecting menu items...' });
        
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

async function navigateToProductItem(item: ProductNavItem): Promise<void> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

    // Handle file navigation
    if (item.type === 'file' || item.type === 'navigate') {
        const file = item.data?.file;
        if (file && file.file) {
            const filePath = path.isAbsolute(file.file) 
                ? file.file 
                : path.join(workspaceRoot, file.file);
            
            try {
                const uri = vscode.Uri.file(filePath);
                const document = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(document);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open file: ${file.file}`);
            }
        }
    }

    // Handle function navigation
    if (item.type === 'function') {
        const file = item.data?.file;
        const func = item.data?.function;
        if (file && file.file && func && func.name) {
            const filePath = path.isAbsolute(file.file) 
                ? file.file 
                : path.join(workspaceRoot, file.file);
            
            try {
                const uri = vscode.Uri.file(filePath);
                const document = await vscode.workspace.openTextDocument(uri);
                const editor = await vscode.window.showTextDocument(document);
                
                // Try to find the function in the file
                const text = document.getText();
                const funcRegex = new RegExp(`(?:function|def|const|let|var)\\s+${func.name}\\s*[=(\\(]`, 'i');
                const match = text.match(funcRegex);
                
                if (match && match.index !== undefined) {
                    const position = document.positionAt(match.index);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open function: ${func.name}`);
            }
        }
    }

    // Handle endpoint/command/worker - navigate to module files
    if (item.type === 'endpoint' || item.type === 'command' || item.type === 'worker') {
        const module = item.data?.module;
        if (module && module.files && module.files.length > 0) {
            // Open the first file in the module
            const firstFile = module.files[0];
            const filePath = path.isAbsolute(firstFile.file) 
                ? firstFile.file 
                : path.join(workspaceRoot, firstFile.file);
            
            try {
                const uri = vscode.Uri.file(filePath);
                const document = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(document);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open file: ${firstFile.file}`);
            }
        }
    }
}

async function navigateToAnalysisItem(item: AnalysisItem): Promise<void> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

    // Handle file navigation
    if (item.type === 'file' || item.type === 'navigate' || item.type === 'orphaned-file') {
        const file = item.data?.file;
        const filePath = item.data?.filePath || (file ? file.path : null);
        
        if (filePath) {
            const fullPath = path.isAbsolute(filePath) 
                ? filePath 
                : path.join(workspaceRoot, filePath);
            
            try {
                const uri = vscode.Uri.file(fullPath);
                const document = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(document);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
            }
        }
    }

    // Handle function navigation
    if (item.type === 'function') {
        const func = item.data?.function;
        if (func && func.file) {
            const filePath = path.isAbsolute(func.file) 
                ? func.file 
                : path.join(workspaceRoot, func.file);
            
            try {
                const uri = vscode.Uri.file(filePath);
                const document = await vscode.workspace.openTextDocument(uri);
                const editor = await vscode.window.showTextDocument(document);
                
                // Navigate to function start line
                if (func.startLine) {
                    const line = Math.max(0, func.startLine - 1);
                    const position = new vscode.Position(line, 0);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open function: ${func.name}`);
            }
        }
    }

    // Handle entry point navigation
    if (item.type === 'entry-point') {
        const entryPoint = item.data?.entryPoint as EntryPoint;
        if (entryPoint && entryPoint.path) {
            const filePath = path.isAbsolute(entryPoint.path) 
                ? entryPoint.path 
                : path.join(workspaceRoot, entryPoint.path);
            
            try {
                const uri = vscode.Uri.file(filePath);
                const document = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(document);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open entry point: ${entryPoint.path}`);
            }
        }
    }
}

async function copyInsightItem(item: any): Promise<void> {
    // Try multiple sources for content, in order of preference:
    // 1. data.content (if serialized properly)
    // 2. tooltip (always serialized, contains full content for copyable items)
    // 3. label (fallback, but might be truncated)
    const content = item.data?.content || 
                    (typeof item.tooltip === 'string' ? item.tooltip : '') || 
                    item.label || '';
    
    if (content) {
        await vscode.env.clipboard.writeText(content);
        const typeLabel = item.data?.type || 'insight';
        vscode.window.showInformationMessage(`✅ ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} copied to clipboard!`);
    }
}

async function showProductItemDetails(item: ProductNavItem): Promise<void> {
    const content = item.data?.content || item.label || '';
    if (!content) {
        vscode.window.showInformationMessage('No content available for this item');
        return;
    }

    // Show in a webview panel
    const panel = vscode.window.createWebviewPanel(
        'productItemDetails',
        item.label || 'Product Details',
        vscode.ViewColumn.One,
        {}
    );

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${item.label}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        p { margin: 15px 0; white-space: pre-wrap; }
        ul { margin: 10px 0; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <h1>${item.label}</h1>
    <p>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
</body>
</html>`;

    panel.webview.html = html;
}

async function showInsightItemDetails(item: any): Promise<void> {
    // Handle different input types
    let title: string;
    let content: string;
    let relevantFiles: string[] = [];
    let relevantFunctions: string[] = [];

    if (typeof item === 'string') {
        // Legacy string format
        title = item.substring(0, 80) + (item.length > 80 ? '...' : '');
        content = item;
    } else if ('title' in item && 'description' in item) {
        // New structured format from LLMService
        title = item.title;
        content = item.description;
        relevantFiles = item.relevantFiles || [];
        relevantFunctions = item.relevantFunctions || [];
    } else {
        // InsightItem class from insightsViewer
        title = item.label || 'Insight Details';
        content = item.data?.content || 
                  (typeof item.tooltip === 'string' ? item.tooltip : '') || 
                  item.label || '';
        relevantFiles = item.data?.relevantFiles || [];
        relevantFunctions = item.data?.relevantFunctions || [];
    }
    
    if (!content) {
        vscode.window.showInformationMessage('No content available for this item');
        return;
    }

    // Show in a webview panel
    const panel = vscode.window.createWebviewPanel(
        'insightItemDetails',
        title,
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    // Convert markdown-style formatting to HTML
    let htmlContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');

    // Build relevant files section
    let filesSection = '';
    if (relevantFiles && relevantFiles.length > 0) {
        filesSection = `
        <div class="section">
            <h2>📁 Relevant Files</h2>
            <ul>
                ${relevantFiles.map((file: string) => `<li><code>${file.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></li>`).join('')}
            </ul>
        </div>`;
    }

    // Build relevant functions section
    let functionsSection = '';
    if (relevantFunctions && relevantFunctions.length > 0) {
        functionsSection = `
        <div class="section">
            <h2>⚙️ Relevant Functions</h2>
            <ul>
                ${relevantFunctions.map((func: string) => `<li><code>${func.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></li>`).join('')}
            </ul>
        </div>`;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.8;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px;
            color: #333;
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
            padding-bottom: 15px;
            margin-top: 0;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        .content {
            font-size: 16px;
            line-height: 1.8;
            margin-top: 20px;
        }
        .section {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        .section ul {
            margin: 10px 0;
            padding-left: 25px;
        }
        .section li {
            margin: 8px 0;
        }
        strong { color: #2c3e50; font-weight: 600; }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
        }
        .copy-btn {
            margin-top: 20px;
            padding: 10px 20px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .copy-btn:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>
        <div class="content">${htmlContent}</div>
        ${filesSection}
        ${functionsSection}
        <button class="copy-btn" onclick="navigator.clipboard.writeText(\`${content.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\\/g, '\\\\')}\`); alert('Copied to clipboard!')">
            📋 Copy to Clipboard
        </button>
    </div>
</body>
</html>`;

    panel.webview.html = html;
}

async function showUnitTestItemDetails(item: any): Promise<void> {
    let title: string;
    let content: string = '';
    let additionalInfo: string = '';
    let plainTextForCopy: string = '';

    // Handle different unit test item types
    if (item.type === 'test-case') {
        const testCase = item.data || {};
        title = testCase.name || testCase.id || 'Test Case';
        content = testCase.description || '';
        plainTextForCopy = `Test Case: ${title}\n${'='.repeat(60)}\n\nDescription: ${content}\n\n`;
        
        if (testCase.target_function) {
            additionalInfo += `<p><strong>Target Function:</strong> <code>${testCase.target_function}</code></p>`;
            plainTextForCopy += `Target Function: ${testCase.target_function}\n`;
        }
        if (testCase.target_file) {
            additionalInfo += `<p><strong>Target File:</strong> <code>${testCase.target_file}</code></p>`;
            plainTextForCopy += `Target File: ${testCase.target_file}\n`;
        }
        if (testCase.priority) {
            additionalInfo += `<p><strong>Priority:</strong> ${testCase.priority}</p>`;
            plainTextForCopy += `Priority: ${testCase.priority}\n`;
        }
        if (testCase.scenarios && testCase.scenarios.length > 0) {
            additionalInfo += `<h3>Test Scenarios</h3><ul>${testCase.scenarios.map((s: string) => `<li>${s}</li>`).join('')}</ul>`;
            plainTextForCopy += `\nTest Scenarios:\n${testCase.scenarios.map((s: string) => `  - ${s}`).join('\n')}\n`;
        }
        if (testCase.mocks && testCase.mocks.length > 0) {
            additionalInfo += `<h3>Mocks</h3><ul>${testCase.mocks.map((m: string) => `<li><code>${m}</code></li>`).join('')}</ul>`;
            plainTextForCopy += `\nMocks:\n${testCase.mocks.map((m: string) => `  - ${m}`).join('\n')}\n`;
        }
        if (testCase.assertions && testCase.assertions.length > 0) {
            additionalInfo += `<h3>Assertions</h3><ul>${testCase.assertions.map((a: string) => `<li>${a}</li>`).join('')}</ul>`;
            plainTextForCopy += `\nAssertions:\n${testCase.assertions.map((a: string) => `  - ${a}`).join('\n')}\n`;
        }
        if (testCase.test_code) {
            additionalInfo += `<h3>Test Code</h3><pre style="background: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto;"><code>${testCase.test_code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
            plainTextForCopy += `\n${'='.repeat(60)}\nTest Code:\n${'='.repeat(60)}\n${testCase.test_code}\n`;
        }
        if (testCase.run_instructions) {
            additionalInfo += `<h3>Run This Test</h3><p><code style="background: #e8f5e9; padding: 5px 10px; border-radius: 3px;">${testCase.run_instructions.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></p>`;
            plainTextForCopy += `\n${'='.repeat(60)}\nRun Command:\n${'='.repeat(60)}\n${testCase.run_instructions}\n`;
        }
    } else if (item.type === 'suite') {
        const suite = item.data || {};
        title = suite.name || suite.id || 'Test Suite';
        content = suite.description || '';
        plainTextForCopy = `Test Suite: ${title}\n${'='.repeat(60)}\n\nDescription: ${content}\n\n`;
        
        if (suite.test_file_path) {
            additionalInfo += `<p><strong>Test File:</strong> <code>${suite.test_file_path}</code></p>`;
            plainTextForCopy += `Test File: ${suite.test_file_path}\n`;
        }
        if (suite.source_files && suite.source_files.length > 0) {
            additionalInfo += `<h3>Source Files</h3><ul>${suite.source_files.map((f: string) => `<li><code>${f}</code></li>`).join('')}</ul>`;
            plainTextForCopy += `\nSource Files:\n${suite.source_files.map((f: string) => `  - ${f}`).join('\n')}\n`;
        }
        if (suite.test_cases && suite.test_cases.length > 0) {
            additionalInfo += `<p><strong>Test Cases:</strong> ${suite.test_cases.length}</p>`;
            plainTextForCopy += `\nTest Cases: ${suite.test_cases.length}\n`;
        }
        if (suite.run_suite_instructions) {
            additionalInfo += `<h3>Run This Test Suite</h3><p><code style="background: #e8f5e9; padding: 5px 10px; border-radius: 3px;">${suite.run_suite_instructions.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></p>`;
            plainTextForCopy += `\n${'='.repeat(60)}\nRun Command:\n${'='.repeat(60)}\n${suite.run_suite_instructions}\n`;
        }
    } else if (item.type === 'text') {
        title = item.label || 'Details';
        content = item.description || item.label || '';
        plainTextForCopy = `${title}\n${'='.repeat(60)}\n\n${content}\n`;
    } else if (item.type === 'strategy') {
        title = item.label || 'Test Strategy';
        content = item.description || item.label || '';
        plainTextForCopy = `Test Strategy: ${title}\n${'='.repeat(60)}\n\n${content}\n`;
    } else {
        title = item.label || 'Unit Test Details';
        content = item.description || item.label || '';
        plainTextForCopy = `${title}\n${'='.repeat(60)}\n\n${content}\n`;
    }

    if (!content && !additionalInfo) {
        vscode.window.showInformationMessage('No content available for this item');
        return;
    }

    // Show in a webview panel
    const panel = vscode.window.createWebviewPanel(
        'unitTestItemDetails',
        title,
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    // Convert markdown-style formatting to HTML
    let htmlContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.8;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px;
            color: #333;
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
            padding-bottom: 15px;
            margin-top: 0;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        h3 {
            color: #34495e;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        .content {
            font-size: 16px;
            line-height: 1.8;
            margin-top: 20px;
        }
        .section {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        ul {
            margin: 10px 0;
            padding-left: 25px;
        }
        li {
            margin: 8px 0;
        }
        strong { color: #2c3e50; font-weight: 600; }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
        }
        .copy-btn {
            margin-top: 20px;
            padding: 10px 20px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .copy-btn:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>
        <div class="content">${htmlContent}</div>
        ${additionalInfo.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        <button class="copy-btn" onclick="navigator.clipboard.writeText(\`${plainTextForCopy.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\\/g, '\\\\')}\`); alert('Copied to clipboard!')">
            📋 Copy to Clipboard
        </button>
    </div>
</body>
</html>`;

    panel.webview.html = html;
}

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

