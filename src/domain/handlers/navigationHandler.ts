/**
 * Navigation Handler
 * Handles navigation to files, functions, and displaying item details
 * Extracted from extension.ts to separate navigation concerns
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { ProductNavItem } from '../../productNavigator';
import { AnalysisItem } from '../../analysisViewer';
import { EntryPoint } from '../../analyzer';

export class NavigationHandler {
    /**
     * Navigate to a product item (file, function, endpoint, etc.)
     */
    async navigateToProductItem(item: ProductNavItem): Promise<void> {
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

    /**
     * Navigate to an analysis item (file, function, entry point, etc.)
     */
    async navigateToAnalysisItem(item: AnalysisItem): Promise<void> {
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

    /**
     * Copy insight item content to clipboard
     */
    async copyInsightItem(item: any): Promise<void> {
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

    /**
     * Show product item details in a webview
     */
    async showProductItemDetails(item: ProductNavItem): Promise<void> {
        const content = item.data?.content || item.label || '';
        if (!content) {
            vscode.window.showInformationMessage('No content available for this item');
            return;
        }

        const { WebviewTemplateEngine } = await import('../../ui/webview/webviewTemplateEngine');
        const { BaseWebviewProvider } = await import('../../ui/webview/baseWebviewProvider');
        
        const provider = new BaseWebviewProvider();
        const panel = provider.createOrRevealPanel(
            'productItemDetails',
            item.label || 'Product Details',
            { viewColumn: vscode.ViewColumn.One }
        );

        const engine = new WebviewTemplateEngine();
        const htmlContent = `<div class="container">
            <h1>${WebviewTemplateEngine.escapeHtml(item.label)}</h1>
            <div class="content">
                <p style="white-space: pre-wrap;">${WebviewTemplateEngine.escapeHtml(content)}</p>
            </div>
        </div>`;

        provider.setPanelHtml(panel, {
            title: item.label || 'Product Details',
            content: htmlContent
        });
    }

    /**
     * Show insight item details in a webview
     */
    async showInsightItemDetails(item: any): Promise<void> {
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

        const { WebviewTemplateEngine } = await import('../../ui/webview/webviewTemplateEngine');
        const { BaseWebviewProvider } = await import('../../ui/webview/baseWebviewProvider');
        
        const provider = new BaseWebviewProvider();
        const panel = provider.createOrRevealPanel(
            'insightItemDetails',
            title,
            { 
                viewColumn: vscode.ViewColumn.One,
                enableScripts: true
            }
        );

        const engine = new WebviewTemplateEngine();
        
        // Convert markdown-style formatting to HTML
        const htmlContent = WebviewTemplateEngine.markdownToHtml(content);
        
        // Build relevant files section
        let filesSection = '';
        if (relevantFiles && relevantFiles.length > 0) {
            filesSection = engine.renderSection(
                '📁 Relevant Files',
                engine.renderList(relevantFiles.map((file: string) => ({ text: file })))
            );
        }

        // Build relevant functions section
        let functionsSection = '';
        if (relevantFunctions && relevantFunctions.length > 0) {
            functionsSection = engine.renderSection(
                '⚙️ Relevant Functions',
                engine.renderList(relevantFunctions.map((func: string) => ({ text: func })))
            );
        }

        // Escape content for use in JavaScript string
        const escapedContent = content.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\\/g, '\\\\');
        
        const htmlContentFull = `<div class="container">
            <h1>${WebviewTemplateEngine.escapeHtml(title)}</h1>
            <div class="content">${htmlContent}</div>
            ${filesSection}
            ${functionsSection}
            <button class="copy-btn" onclick="copyToClipboard(\`${escapedContent}\`)">
                📋 Copy to Clipboard
            </button>
        </div>`;

        provider.setPanelHtml(panel, {
            title,
            content: htmlContentFull,
            enableScripts: true
        });
    }

    /**
     * Show unit test item details in a webview
     */
    async showUnitTestItemDetails(item: any): Promise<void> {
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
            if (testCase.test_scenarios && testCase.test_scenarios.length > 0) {
                additionalInfo += `<p><strong>Test Scenarios:</strong></p><ul>`;
                testCase.test_scenarios.forEach((scenario: string) => {
                    additionalInfo += `<li>${scenario.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`;
                    plainTextForCopy += `  - ${scenario}\n`;
                });
                additionalInfo += `</ul>`;
            }
        } else if (item.type === 'test-suite') {
            const testSuite = item.data || {};
            title = testSuite.name || 'Test Suite';
            content = testSuite.description || '';
            plainTextForCopy = `Test Suite: ${title}\n${'='.repeat(60)}\n\nDescription: ${content}\n\n`;
            
            if (testSuite.target_module) {
                additionalInfo += `<p><strong>Target Module:</strong> <code>${testSuite.target_module}</code></p>`;
                plainTextForCopy += `Target Module: ${testSuite.target_module}\n`;
            }
            if (testSuite.test_cases && testSuite.test_cases.length > 0) {
                additionalInfo += `<p><strong>Test Cases (${testSuite.test_cases.length}):</strong></p><ul>`;
                testSuite.test_cases.forEach((testCase: any) => {
                    const caseName = testCase.name || testCase.id || 'Unnamed Test Case';
                    additionalInfo += `<li>${caseName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`;
                    plainTextForCopy += `  - ${caseName}\n`;
                });
                additionalInfo += `</ul>`;
            }
        } else {
            // Fallback for unknown types
            title = item.label || 'Unit Test Details';
            content = item.data?.description || item.data?.content || '';
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
}

