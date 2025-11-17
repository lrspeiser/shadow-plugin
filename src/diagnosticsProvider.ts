import * as vscode from 'vscode';
import { Insight } from './insightGenerator';

export class DiagnosticsProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('shadowWatch');
    }

    updateDiagnostics(insights: Insight[]): void {
        // Clear existing diagnostics
        this.diagnosticCollection.clear();

        // Group insights by file
        const byFile = new Map<string, Insight[]>();
        
        for (const insight of insights) {
            if (!insight.file) continue;

            if (!byFile.has(insight.file)) {
                byFile.set(insight.file, []);
            }
            byFile.get(insight.file)!.push(insight);
        }

        // Create diagnostics for each file
        for (const [filePath, fileInsights] of byFile) {
            const uri = this.getUri(filePath);
            const diagnostics = fileInsights.map(insight => this.createDiagnostic(insight));
            this.diagnosticCollection.set(uri, diagnostics);
        }
    }

    updateDiagnosticsForFile(uri: vscode.Uri, insights: Insight[]): void {
        const diagnostics = insights
            .filter(i => i.file)
            .map(insight => this.createDiagnostic(insight));
        
        this.diagnosticCollection.set(uri, diagnostics);
    }

    clear(): void {
        this.diagnosticCollection.clear();
    }

    dispose(): void {
        this.diagnosticCollection.dispose();
    }

    private createDiagnostic(insight: Insight): vscode.Diagnostic {
        const line = Math.max(0, (insight.line || 1) - 1);
        const range = new vscode.Range(line, 0, line, 999);

        const diagnostic = new vscode.Diagnostic(
            range,
            insight.description,
            this.getSeverity(insight.severity)
        );

        diagnostic.source = 'Shadow Watch';
        diagnostic.code = insight.id;

        // Add related information
        if (insight.suggestion) {
            diagnostic.message += `\n\n💡 Suggestion: ${insight.suggestion}`;
        }

        return diagnostic;
    }

    private getSeverity(severity: 'error' | 'warning' | 'info'): vscode.DiagnosticSeverity {
        switch (severity) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'info':
                return vscode.DiagnosticSeverity.Information;
            default:
                return vscode.DiagnosticSeverity.Hint;
        }
    }

    private getUri(filePath: string): vscode.Uri {
        // If it's already an absolute path, use it
        if (filePath.startsWith('/') || filePath.match(/^[A-Za-z]:\\/)) {
            return vscode.Uri.file(filePath);
        }

        // Otherwise, resolve relative to workspace
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
            const fullPath = require('path').join(workspaceRoot, filePath);
            return vscode.Uri.file(fullPath);
        }

        // Fallback
        return vscode.Uri.file(filePath);
    }
}

