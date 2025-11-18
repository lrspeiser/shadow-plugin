/**
 * Base Webview Provider - Common functionality for webview panels
 * Reduces duplication in webview creation and management
 */
import * as vscode from 'vscode';
import { WebviewTemplateEngine, WebviewTemplateOptions } from './webviewTemplateEngine';

export interface BaseWebviewOptions {
    viewColumn?: vscode.ViewColumn;
    enableScripts?: boolean;
    retainContextWhenHidden?: boolean;
}

export class BaseWebviewProvider {
    private static panels: Map<string, vscode.WebviewPanel> = new Map();
    protected templateEngine: WebviewTemplateEngine;

    constructor() {
        this.templateEngine = new WebviewTemplateEngine();
    }

    /**
     * Create or reveal a webview panel
     */
    createOrRevealPanel(
        id: string,
        title: string,
        options: BaseWebviewOptions = {}
    ): vscode.WebviewPanel {
        const existingPanel = BaseWebviewProvider.panels.get(id);
        if (existingPanel) {
            existingPanel.reveal(options.viewColumn);
            return existingPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            id,
            title,
            options.viewColumn || vscode.ViewColumn.One,
            {
                enableScripts: options.enableScripts !== false,
                retainContextWhenHidden: options.retainContextWhenHidden || false
            }
        );

        // Handle panel disposal
        panel.onDidDispose(() => {
            BaseWebviewProvider.panels.delete(id);
        });

        BaseWebviewProvider.panels.set(id, panel);
        return panel;
    }

    /**
     * Set HTML content for a panel using the template engine
     */
    setPanelHtml(panel: vscode.WebviewPanel, options: WebviewTemplateOptions): void {
        panel.webview.html = this.templateEngine.render(options);
    }

    /**
     * Dispose a panel by ID
     */
    static disposePanel(id: string): void {
        const panel = BaseWebviewProvider.panels.get(id);
        if (panel) {
            panel.dispose();
            BaseWebviewProvider.panels.delete(id);
        }
    }

    /**
     * Dispose all panels
     */
    static disposeAll(): void {
        for (const panel of BaseWebviewProvider.panels.values()) {
            panel.dispose();
        }
        BaseWebviewProvider.panels.clear();
    }
}

