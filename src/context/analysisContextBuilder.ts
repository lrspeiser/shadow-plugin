/**
 * Analysis Context Builder
 * Converts CodeAnalysis to AnalysisContext and handles persistence
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CodeAnalysis, EntryPoint } from '../analyzer';
import { AnalysisContext } from '../llmService';

/**
 * Convert CodeAnalysis to AnalysisContext format
 */
export function convertCodeAnalysisToContext(analysis: CodeAnalysis): AnalysisContext {
    return {
        files: analysis.files.map(f => ({
            path: f.path,
            lines: f.lines,
            functions: f.functions,
            language: f.language
        })),
        imports: analysis.imports,
        entryPoints: analysis.entryPoints.map(ep => ({
            path: ep.path,
            type: ep.type,
            reason: ep.reason
        })),
        orphanedFiles: analysis.orphanedFiles,
        importedFiles: analysis.importedFiles,
        totalFiles: analysis.totalFiles,
        totalLines: analysis.totalLines,
        totalFunctions: analysis.totalFunctions,
        largeFiles: analysis.largeFiles
    };
}

/**
 * Save code analysis to file for future use
 */
export function saveCodeAnalysis(analysis: CodeAnalysis): void {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const shadowDir = path.join(workspaceRoot, '.shadow');
    const docsDir = path.join(shadowDir, 'docs');

    try {
        if (!fs.existsSync(shadowDir)) {
            fs.mkdirSync(shadowDir, { recursive: true });
        }
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }

        const analysisPath = path.join(docsDir, 'code-analysis.json');
        const analysisWithMetadata = {
            ...analysis,
            _metadata: {
                generatedAt: new Date().toISOString(),
                generatedAtLocal: new Date().toLocaleString()
            }
        };
        fs.writeFileSync(analysisPath, JSON.stringify(analysisWithMetadata, null, 2), 'utf-8');
        console.log('Saved code analysis to file');
    } catch (error) {
        console.error('Failed to save code analysis:', error);
    }
}

/**
 * Load saved code analysis from file
 */
export async function loadSavedCodeAnalysis(): Promise<CodeAnalysis | null> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return null;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const docsDir = path.join(workspaceRoot, '.shadow', 'docs');
    const analysisPath = path.join(docsDir, 'code-analysis.json');

    if (fs.existsSync(analysisPath)) {
        try {
            const analysisContent = fs.readFileSync(analysisPath, 'utf-8');
            const analysis = JSON.parse(analysisContent) as CodeAnalysis;
            console.log('✅ Loaded code analysis from file on startup');
            console.log(`   Path: ${analysisPath}`);
            return analysis;
        } catch (error) {
            console.error('Failed to load code analysis from file:', error);
            console.error(`   Attempted path: ${analysisPath}`);
            return null;
        }
    } else {
        console.log(`⚠️ Code analysis file not found at: ${analysisPath}`);
        return null;
    }
}

